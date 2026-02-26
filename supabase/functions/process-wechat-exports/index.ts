import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // List all files in the wechat-exports bucket
    const { data: files, error: listError } = await supabase.storage
      .from("wechat-exports")
      .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });

    if (listError) throw listError;
    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No files to process", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check which files have already been processed
    const fileNames = files.filter(f => !f.id?.startsWith(".")).map(f => f.name);
    const { data: existingJobs } = await supabase
      .from("wechat_extract_jobs")
      .select("file_name")
      .in("file_name", fileNames);

    const processedNames = new Set((existingJobs || []).map(j => j.file_name));
    const newFiles = files.filter(f => !processedNames.has(f.name) && !f.id?.startsWith("."));

    if (newFiles.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "All files already processed", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    const results: any[] = [];

    for (const file of newFiles.slice(0, 5)) {
      // Download file content
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("wechat-exports")
        .download(file.name);

      if (downloadError || !fileData) {
        console.error(`Failed to download ${file.name}:`, downloadError);
        continue;
      }

      const chatText = await fileData.text();
      if (!chatText.trim()) continue;

      // Create job record
      const { data: job, error: jobError } = await supabase
        .from("wechat_extract_jobs")
        .insert({
          file_name: file.name,
          file_path: `wechat-exports/${file.name}`,
          file_size: file.metadata?.size || chatText.length,
          status: "processing",
          source_module: detectModule(file.name, chatText),
        })
        .select()
        .single();

      if (jobError) {
        console.error(`Failed to create job for ${file.name}:`, jobError);
        continue;
      }

      try {
        // Use AI to extract structured info
        const aiResult = await extractWithAI(chatText, LOVABLE_API_KEY, file.name);

        await supabase
          .from("wechat_extract_jobs")
          .update({
            status: "completed",
            extracted_data: aiResult.extracted_items || [],
            summary: aiResult.summary || {},
            processed_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        processed++;
        results.push({ file: file.name, status: "completed", items: (aiResult.extracted_items || []).length });
      } catch (aiErr) {
        console.error(`AI extraction failed for ${file.name}:`, aiErr);
        await supabase
          .from("wechat_extract_jobs")
          .update({
            status: "failed",
            error_message: aiErr instanceof Error ? aiErr.message : "Unknown error",
          })
          .eq("id", job.id);
        results.push({ file: file.name, status: "failed" });
      }
    }

    return new Response(JSON.stringify({ success: true, processed, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("process-wechat-exports error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function detectModule(fileName: string, content: string): string {
  const lower = (fileName + " " + content.slice(0, 500)).toLowerCase();
  if (lower.includes("报名") || lower.includes("活动") || lower.includes("event")) return "marketing";
  if (lower.includes("采购") || lower.includes("供应") || lower.includes("procurement")) return "procurement";
  if (lower.includes("工签") || lower.includes("签证") || lower.includes("permit")) return "hr";
  if (lower.includes("发票") || lower.includes("付款") || lower.includes("invoice")) return "finance";
  if (lower.includes("库存") || lower.includes("stock") || lower.includes("inventory")) return "inventory";
  return "general";
}

async function extractWithAI(chatText: string, apiKey: string, fileName: string) {
  const systemPrompt = `你是一个专业的微信聊天记录信息提取助手。你的任务是从微信群或私聊的聊天记录中提取所有有用的业务信息。

请提取以下类型的信息（如果存在）：
1. **联系人信息**：姓名、电话、微信号、邮箱
2. **报名信息**：活动报名、参与意向
3. **采购信息**：供应商报价、商品价格、交货时间
4. **文件/材料**：提到的需要准备的文件、材料清单
5. **日期/时间**：提到的截止日期、预约时间
6. **金额**：提到的价格、费用、预算
7. **地址**：提到的地址、位置信息
8. **任务/待办**：需要跟进的事项

文件名为"${fileName}"，请据此推断聊天上下文。

请用 extract_info 工具返回结果。`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `请分析以下微信聊天记录：\n\n${chatText.slice(0, 15000)}` },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_info",
            description: "Return extracted business information from chat messages",
            parameters: {
              type: "object",
              properties: {
                extracted_items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["contact", "signup", "procurement", "document", "date", "amount", "address", "task"], description: "Type of extracted info" },
                      title: { type: "string", description: "Brief title in Chinese" },
                      detail: { type: "string", description: "Detailed content" },
                      source_message: { type: "string", description: "Original message excerpt" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                      suggested_module: { type: "string", enum: ["marketing", "procurement", "hr", "finance", "inventory", "general"] },
                    },
                    required: ["type", "title", "detail", "priority", "suggested_module"],
                    additionalProperties: false,
                  },
                },
                summary: {
                  type: "object",
                  properties: {
                    total_messages: { type: "number" },
                    total_extracted: { type: "number" },
                    contacts_found: { type: "number" },
                    tasks_found: { type: "number" },
                    amounts_found: { type: "number" },
                    summary_zh: { type: "string" },
                    summary_en: { type: "string" },
                  },
                  required: ["total_extracted", "summary_zh"],
                  additionalProperties: false,
                },
              },
              required: ["extracted_items", "summary"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_info" } },
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) throw new Error("AI did not return structured data");

  return JSON.parse(toolCall.function.arguments);
}
