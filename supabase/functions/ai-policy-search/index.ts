import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Major Chinese cities with their provinces
const MAJOR_CITIES = [
  { city: "上海", province: "上海市", en: "Shanghai" },
  { city: "北京", province: "北京市", en: "Beijing" },
  { city: "广州", province: "广东省", en: "Guangzhou" },
  { city: "深圳", province: "广东省", en: "Shenzhen" },
  { city: "成都", province: "四川省", en: "Chengdu" },
  { city: "杭州", province: "浙江省", en: "Hangzhou" },
  { city: "武汉", province: "湖北省", en: "Wuhan" },
  { city: "南京", province: "江苏省", en: "Nanjing" },
  { city: "苏州", province: "江苏省", en: "Suzhou" },
  { city: "重庆", province: "重庆市", en: "Chongqing" },
  { city: "天津", province: "天津市", en: "Tianjin" },
  { city: "西安", province: "陕西省", en: "Xi'an" },
  { city: "长沙", province: "湖南省", en: "Changsha" },
  { city: "青岛", province: "山东省", en: "Qingdao" },
  { city: "郑州", province: "河南省", en: "Zhengzhou" },
  { city: "大连", province: "辽宁省", en: "Dalian" },
  { city: "宁波", province: "浙江省", en: "Ningbo" },
  { city: "厦门", province: "福建省", en: "Xiamen" },
  { city: "昆明", province: "云南省", en: "Kunming" },
  { city: "合肥", province: "安徽省", en: "Hefei" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city, action } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (action === "list_cities") {
      return new Response(JSON.stringify({ cities: MAJOR_CITIES }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "search_policies") {
      if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

      const targetCity = city || "上海";
      const cityInfo = MAJOR_CITIES.find(c => c.city === targetCity) || { city: targetCity, province: "", en: targetCity };

      const systemPrompt = `你是一个专业的中国外国人工作许可和签证政策法规分析专家。你对各城市的外国人来华工作管理政策、最新法规变更、审批流程差异非常熟悉。

请针对【${cityInfo.city}】（${cityInfo.province}）提供以下方面的最新政策信息：

1. **工作许可申请政策**：初次申请和续签的具体要求、审批时限、特殊材料要求
2. **签证/居留许可政策**：工作签证(Z签证)和工作类居留许可的办理要求
3. **人才引进政策**：该城市的特殊人才引进优惠政策（如A类人才快速通道等）
4. **税收优惠政策**：适用于外籍员工的个人所得税优惠（如住房补贴、子女教育、语言培训免税等）
5. **合规注意事项**：该城市特有的合规要求（如临时住宿登记时限、工作地点限制等）
6. **最新政策变化**：近期的政策调整或新规

请以JSON格式返回，格式如下：
{
  "policies": [
    {
      "title": "政策标题",
      "content": "详细内容（200字以内）",
      "summary_zh": "一句话摘要",
      "summary_en": "English summary",
      "category": "work_permit|visa|talent|tax|compliance|update",
      "effective_date": "YYYY-MM-DD或空",
      "tags": ["标签1", "标签2"],
      "source_name": "来源机构名称",
      "importance": "high|medium|low"
    }
  ],
  "city_overview": {
    "processing_days_initial": 15,
    "processing_days_renewal": 10,
    "special_advantages": ["该城市的特殊优势"],
    "key_contacts": "负责机构及联系方式",
    "notes": "其他重要说明"
  }
}

请确保信息准确、实用，基于你所知的最新政策。每个分类至少提供1-2条政策信息。`;

      const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `请提供${cityInfo.city}（${cityInfo.province}）的最新外国人工作许可和签证相关政策法规信息。` },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI API error: ${response.status} - ${errText}`);
      }

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content || "";

      // Parse JSON from response
      let parsed;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { policies: [], city_overview: {} };
      } catch {
        parsed = { policies: [], city_overview: {}, raw: content };
      }

      return new Response(JSON.stringify({
        ...parsed,
        city: cityInfo.city,
        province: cityInfo.province,
        cityEn: cityInfo.en,
        searchedAt: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Policy search error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
