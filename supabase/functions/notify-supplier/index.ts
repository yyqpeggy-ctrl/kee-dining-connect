import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * 供应商采购单微信通知 Edge Function
 * 
 * 模式说明:
 * - 模拟模式 (默认): 不实际发送微信消息，返回模拟成功结果用于开发测试
 * - 真实模式: 配置 WECHAT_APPID + WECHAT_APPSECRET 后自动切换
 * 
 * 微信公众号模板消息需要:
 * 1. 微信公众号 AppID 和 AppSecret
 * 2. 供应商关注公众号后的 OpenID
 * 3. 已审核通过的消息模板ID
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      supplier_name,
      supplier_phone,
      supplier_contact,
      order_number,
      items,
      total_amount,
      currency,
      store_name,
      notes,
    } = await req.json();

    const WECHAT_APPID = Deno.env.get("WECHAT_APPID");
    const WECHAT_APPSECRET = Deno.env.get("WECHAT_APPSECRET");
    const WECHAT_TEMPLATE_ID = Deno.env.get("WECHAT_TEMPLATE_ID");

    const isMockMode = !WECHAT_APPID || !WECHAT_APPSECRET;

    // Format items for message
    const itemsSummary = (items || [])
      .map((i: any) => `${i.name_zh} x${i.quantity}${i.unit}`)
      .join("、");

    const messageContent = [
      `📦 新采购订单通知`,
      ``,
      `订单号: ${order_number}`,
      `门店: ${store_name}`,
      `供应商: ${supplier_name}`,
      `联系人: ${supplier_contact || "-"}`,
      ``,
      `📋 采购明细:`,
      ...((items || []) as any[]).map((i: any) => `  · ${i.name_zh} × ${i.quantity}${i.unit} (¥${(i.unit_price * i.quantity).toLocaleString()})`),
      ``,
      `💰 合计: ¥${total_amount?.toLocaleString() || "0"} ${currency || "CNY"}`,
      ``,
      notes ? `备注: ${notes}` : "",
      ``,
      `请尽快安排备货发货，谢谢！`,
    ].filter(Boolean).join("\n");

    if (isMockMode) {
      // 模拟模式 - 记录日志但不实际发送
      console.log("=== 模拟微信通知 (MOCK MODE) ===");
      console.log(`收件人: ${supplier_name} (${supplier_phone || "无手机号"})`);
      console.log(messageContent);
      console.log("=== END MOCK ===");

      return new Response(JSON.stringify({
        success: true,
        mode: "mock",
        message: messageContent,
        mock_note: "微信凭证未配置，使用模拟模式。配置 WECHAT_APPID 和 WECHAT_APPSECRET 后自动切换为真实发送。",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 真实模式 - 调用微信公众号模板消息API
    // Step 1: 获取 access_token
    const tokenResp = await fetch(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APPID}&secret=${WECHAT_APPSECRET}`
    );
    const tokenData = await tokenResp.json();
    if (!tokenData.access_token) {
      throw new Error(`获取微信access_token失败: ${JSON.stringify(tokenData)}`);
    }

    // Step 2: 发送模板消息
    // 注意: 需要供应商的微信OpenID，这里从supplier表的notes或专门字段获取
    // 暂时用supplier_phone作为查找依据（实际需要供应商关注公众号后绑定）
    const templateMsg = {
      // touser: supplierOpenId, // 需要从供应商记录中获取
      template_id: WECHAT_TEMPLATE_ID || "",
      data: {
        first: { value: `您有一笔新的采购订单`, color: "#173177" },
        keyword1: { value: order_number, color: "#173177" },
        keyword2: { value: store_name, color: "#173177" },
        keyword3: { value: `¥${total_amount?.toLocaleString()}`, color: "#173177" },
        keyword4: { value: itemsSummary, color: "#173177" },
        remark: { value: `请尽快安排备货发货。联系人: ${supplier_contact || "-"}`, color: "#999999" },
      },
    };

    console.log("微信模板消息（真实模式，但缺少OpenID暂不发送）:", JSON.stringify(templateMsg));

    // TODO: 当供应商表增加 wechat_openid 字段后，启用以下代码
    // const sendResp = await fetch(
    //   `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${tokenData.access_token}`,
    //   { method: "POST", body: JSON.stringify(templateMsg) }
    // );
    // const sendResult = await sendResp.json();

    return new Response(JSON.stringify({
      success: true,
      mode: "real_pending",
      message: messageContent,
      note: "微信凭证已配置，但需要供应商的OpenID才能发送。请在供应商管理中维护微信绑定信息。",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("notify-supplier error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
