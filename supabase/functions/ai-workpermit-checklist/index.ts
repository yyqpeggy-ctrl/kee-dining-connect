import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { employee, historicalApplications, currentDocuments } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `你是一个专业的中国外国人工作许可和签证申请顾问AI。你的任务是：
1. 根据员工信息和历史申请记录，自动判断当前申请类型（初次申请 / 续签）
2. 生成完整的材料清单，标注每份材料的状态（可复用/需更新/需新办）
3. 为每份需要提交的文件生成预填信息模板
4. 提供风险评估和时间节点建议

重要规则：
- 初次申请需要：护照、证件照、学历认证、体检报告、聘用合同、工作经验证明、无犯罪记录、公司营业执照
- 续签需要：护照、证件照、现工作许可证、现居留许可、续聘合同、体检报告（1年内）、完税证明
- 学历认证如果在有效期内可复用，体检报告超过1年需重新办理
- 工作许可到期前30天必须提交续签
- 外国人来华工作许可分A/B/C类，根据学历、工作经验、薪资等判断

请用以下JSON格式返回（不要包含markdown代码块标记）：`;

    const toolDef = {
      type: "function",
      function: {
        name: "generate_workpermit_checklist",
        description: "Generate work permit application checklist with pre-filled templates",
        parameters: {
          type: "object",
          properties: {
            applicationType: {
              type: "string",
              enum: ["initial", "renewal"],
              description: "Detected application type"
            },
            typeReason: {
              type: "string",
              description: "Reason for type detection in Chinese"
            },
            permitCategory: {
              type: "string",
              enum: ["A", "B", "C"],
              description: "Work permit category"
            },
            categoryReason: {
              type: "string",
              description: "Reason for category classification in Chinese"
            },
            riskLevel: {
              type: "string",
              enum: ["low", "medium", "high"]
            },
            riskNotes: {
              type: "string",
              description: "Risk assessment notes in Chinese"
            },
            deadline: {
              type: "string",
              description: "Recommended submission deadline"
            },
            estimatedProcessingDays: {
              type: "number",
              description: "Estimated processing time in business days"
            },
            checklist: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  docName: { type: "string", description: "Document name in Chinese" },
                  docNameEn: { type: "string", description: "Document name in English" },
                  category: { type: "string" },
                  status: { type: "string", enum: ["reusable", "needs_update", "needs_new", "ready"] },
                  statusReason: { type: "string", description: "Explanation in Chinese" },
                  priority: { type: "string", enum: ["critical", "important", "optional"] },
                  estimatedDays: { type: "number", description: "Days needed to prepare" },
                  templateData: {
                    type: "object",
                    description: "Pre-filled template fields based on employee data",
                    properties: {
                      title: { type: "string" },
                      fields: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            label: { type: "string" },
                            labelEn: { type: "string" },
                            value: { type: "string" },
                            editable: { type: "boolean" }
                          },
                          required: ["label", "labelEn", "value", "editable"]
                        }
                      }
                    },
                    required: ["title", "fields"]
                  }
                },
                required: ["docName", "docNameEn", "category", "status", "statusReason", "priority", "estimatedDays", "templateData"]
              }
            },
            specialNotes: {
              type: "array",
              items: { type: "string" },
              description: "Special notes and reminders in Chinese"
            },
            taxBenefits: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  benefit: { type: "string", description: "Tax benefit name in Chinese" },
                  benefitEn: { type: "string" },
                  description: { type: "string", description: "Description in Chinese" },
                  eligibility: { type: "string", description: "Eligibility criteria in Chinese" }
                },
                required: ["benefit", "benefitEn", "description", "eligibility"]
              }
            }
          },
          required: ["applicationType", "typeReason", "permitCategory", "categoryReason", "riskLevel", "riskNotes", "deadline", "estimatedProcessingDays", "checklist", "specialNotes", "taxBenefits"],
          additionalProperties: false
        }
      }
    };

    const userPrompt = `请分析以下外籍员工的工作许可申请情况：

员工信息：
- 姓名：${employee.nameZh} / ${employee.nameEn}
- 国籍：${employee.nationality}
- 职位：${employee.roleZh || "未知"} / ${employee.roleEn || "Unknown"}
- 签证状态：${employee.visa ? `${employee.visa.type}，有效期至${employee.visa.expiryDate}，状态：${employee.visa.status}` : "无签证记录"}

历史申请记录：
${historicalApplications && historicalApplications.length > 0 
  ? historicalApplications.map((a: any) => `- ${a.type === "initial" ? "初次申请" : "续签"}，状态：${a.status}，日期：${a.applicationDate}，许可号：${a.permitNumber || "无"}，到期：${a.permitExpiry || "无"}`).join("\n")
  : "无历史申请记录"}

现有材料：
${currentDocuments && currentDocuments.length > 0
  ? currentDocuments.map((d: any) => `- ${d.name}（类别：${d.category}，上传：${d.uploadedAt}，到期：${d.expiryDate || "无"}，版本：v${d.version}）`).join("\n")
  : "无现有材料"}

今天日期：${new Date().toISOString().split("T")[0]}

请自动判断申请类型，生成完整材料清单和预填模板，并评估风险和给出时间建议。`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [toolDef],
        tool_choice: { type: "function", function: { name: "generate_workpermit_checklist" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI 额度不足，请充值" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try to parse content
    const content = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ error: "Unexpected response format", raw: content }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("workpermit checklist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
