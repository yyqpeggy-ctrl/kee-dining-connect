import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AutomationStep {
  stepId: string;
  status: "pending" | "running" | "completed" | "failed" | "needs_review";
  message: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, storeId, params } = await req.json();

    switch (action) {
      // ===== Phase 1: 验收核对 =====
      case "reconcile_receipts": {
        // Get all unmatched receipts for this store
        let receiptQuery = supabase
          .from("procurement_receipts")
          .select("*, procurement_orders(*)")
          .eq("match_status", "pending")
          .order("created_at", { ascending: false });
        if (storeId && storeId !== "all") receiptQuery = receiptQuery.eq("store_id", storeId);

        const { data: receipts, error: rErr } = await receiptQuery;
        if (rErr) throw rErr;

        const results: AutomationStep[] = [];
        let matchedCount = 0;
        let mismatchCount = 0;

        for (const receipt of (receipts || [])) {
          const order = receipt.procurement_orders;
          if (!order) {
            results.push({ stepId: receipt.id, status: "failed", message: "未关联采购单" });
            continue;
          }

          const orderTotal = order.total_amount;
          const receiptTotal = receipt.extracted_total || 0;
          const diff = Math.abs(orderTotal - receiptTotal);
          const tolerance = orderTotal * 0.02; // 2% tolerance

          if (diff <= tolerance) {
            await supabase.from("procurement_receipts").update({
              match_status: "matched",
              match_details: { order_total: orderTotal, receipt_total: receiptTotal, diff, auto_matched: true },
            }).eq("id", receipt.id);
            matchedCount++;
            results.push({ stepId: receipt.id, status: "completed", message: `核对通过: 差异¥${diff.toFixed(2)}` });
          } else {
            await supabase.from("procurement_receipts").update({
              match_status: "mismatch",
              match_details: { order_total: orderTotal, receipt_total: receiptTotal, diff, auto_matched: false },
            }).eq("id", receipt.id);
            mismatchCount++;
            results.push({ stepId: receipt.id, status: "needs_review", message: `差异过大: ¥${diff.toFixed(2)}，需人工复核` });
          }
        }

        return new Response(JSON.stringify({
          success: true, action, matchedCount, mismatchCount, total: (receipts || []).length, results,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ===== Phase 2: 按合同账期自动排款 =====
      case "schedule_payments": {
        let orderQuery = supabase
          .from("procurement_orders")
          .select("*, suppliers(*)")
          .in("status", ["confirmed", "received"])
          .order("created_at", { ascending: false });
        if (storeId && storeId !== "all") orderQuery = orderQuery.eq("store_id", storeId);

        const { data: orders, error: oErr } = await orderQuery;
        if (oErr) throw oErr;

        const paymentSchedule: Array<{
          orderId: string;
          orderNumber: string;
          supplierName: string;
          amount: number;
          dueDate: string;
          supplierBank?: string;
          supplierAccount?: string;
          storeName: string;
        }> = [];

        const today = new Date();
        for (const order of (orders || [])) {
          // Determine payment due date from contract or default 30-day terms
          let dueDate: Date;
          if (order.payment_due_date) {
            dueDate = new Date(order.payment_due_date);
          } else {
            dueDate = new Date(order.created_at);
            dueDate.setDate(dueDate.getDate() + 30);
          }

          // Only include orders where payment is due
          if (dueDate <= today || params?.force) {
            const supplier = order.suppliers;
            paymentSchedule.push({
              orderId: order.id,
              orderNumber: order.order_number,
              supplierName: order.supplier_name,
              amount: order.total_amount - order.paid_amount,
              dueDate: dueDate.toISOString().slice(0, 10),
              supplierBank: supplier?.bank_name || "",
              supplierAccount: supplier?.bank_account || "",
              storeName: order.store_name_zh,
            });
          }
        }

        return new Response(JSON.stringify({
          success: true, action, totalDue: paymentSchedule.length,
          totalAmount: paymentSchedule.reduce((s, p) => s + p.amount, 0),
          payments: paymentSchedule,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ===== Phase 3: 银行流水自动做账 =====
      case "auto_journal_from_bank": {
        const { bankEntries } = params || {};
        if (!bankEntries || !Array.isArray(bankEntries)) {
          throw new Error("Missing bankEntries array");
        }

        const createdVouchers: string[] = [];
        for (const entry of bankEntries) {
          const { amount, counterparty, date, type, reference } = entry;

          // Try to match with procurement orders
          let debitAccount = "银行存款";
          let creditAccount = "银行存款";
          let category = "other";
          let descZh = `银行流水: ${counterparty} ${reference || ""}`;

          if (type === "outflow") {
            // Payment - find matching PO
            const { data: matchedPO } = await supabase
              .from("procurement_orders")
              .select("*")
              .ilike("supplier_name", `%${counterparty}%`)
              .eq("total_amount", amount)
              .single();

            if (matchedPO) {
              debitAccount = matchedPO.type === "asset" ? "固定资产" : "原材料";
              creditAccount = "银行存款";
              category = "procurement";
              descZh = `采购付款 - ${matchedPO.order_number} - ${counterparty}`;

              // Update PO status
              await supabase.from("procurement_orders").update({
                status: "paid", paid_amount: amount, paid_at: new Date().toISOString(),
              }).eq("id", matchedPO.id);
            } else {
              debitAccount = "管理费用-水电";
              creditAccount = "银行存款";
              category = "expense";
            }
          } else {
            debitAccount = "银行存款";
            creditAccount = "主营业务收入";
            category = "revenue";
            descZh = `收款: ${counterparty} ${reference || ""}`;
          }

          const { data: txn, error: txnErr } = await supabase
            .from("finance_transactions")
            .insert({
              type: type === "outflow" ? "expense" : "income",
              category,
              amount: Math.abs(amount),
              debit_account: debitAccount,
              credit_account: creditAccount,
              description_zh: descZh,
              description_en: `Bank: ${counterparty} ${reference || ""}`,
              store_id: storeId || "",
              store_name_zh: params?.storeNameZh || "",
              store_name_en: params?.storeNameEn || "",
              status: "pending",
              notes: `自动做账 - 银行流水导入 ${date}`,
            })
            .select("id")
            .single();

          if (!txnErr && txn) createdVouchers.push(txn.id);
        }

        return new Response(JSON.stringify({
          success: true, action, vouchersCreated: createdVouchers.length,
          message: `已自动生成 ${createdVouchers.length} 张会计凭证，请人工审核确认`,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ===== Phase 4: 自动计税 =====
      case "auto_calculate_tax": {
        let txnQuery = supabase
          .from("finance_transactions")
          .select("*")
          .order("created_at", { ascending: false });
        if (storeId && storeId !== "all") txnQuery = txnQuery.eq("store_id", storeId);

        const { data: txns, error: tErr } = await txnQuery;
        if (tErr) throw tErr;

        const totalRevenue = (txns || []).filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const totalExpense = (txns || []).filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        const netProfit = totalRevenue - totalExpense;

        // Get invoices for VAT calculation
        let invQuery = supabase.from("invoices").select("*");
        if (storeId && storeId !== "all") invQuery = invQuery.eq("store_id", storeId);
        const { data: invoices } = await invQuery;

        const outputTax = (invoices || []).filter(i => i.type === "output").reduce((s, i) => s + (i.tax_amount || 0), 0);
        const inputTax = (invoices || []).filter(i => i.type === "input" && i.status !== "voided").reduce((s, i) => s + (i.tax_amount || 0), 0);

        const taxCalc = {
          vat: { output: outputTax, input: inputTax, payable: Math.max(0, outputTax - inputTax) },
          cit: { profit: netProfit, rate: 0.25, payable: Math.max(0, netProfit * 0.25) },
          surcharges: {
            cityMaintenance: Math.max(0, (outputTax - inputTax) * 0.07),
            educationSurcharge: Math.max(0, (outputTax - inputTax) * 0.03),
            localEducation: Math.max(0, (outputTax - inputTax) * 0.02),
          },
          totalPayable: 0,
        };
        taxCalc.totalPayable = taxCalc.vat.payable + taxCalc.cit.payable +
          taxCalc.surcharges.cityMaintenance + taxCalc.surcharges.educationSurcharge + taxCalc.surcharges.localEducation;

        return new Response(JSON.stringify({
          success: true, action, taxCalc,
          message: `税费自动计算完成，应纳税合计 ¥${taxCalc.totalPayable.toFixed(2)}`,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ===== Phase 5: 获取自动化状态总览 =====
      case "get_automation_status": {
        // Count pending receipts
        let rq = supabase.from("procurement_receipts").select("id", { count: "exact" }).eq("match_status", "pending");
        if (storeId && storeId !== "all") rq = rq.eq("store_id", storeId);
        const { count: pendingReceipts } = await rq;

        // Count unpaid orders
        let oq = supabase.from("procurement_orders").select("id", { count: "exact" }).in("status", ["confirmed", "received"]);
        if (storeId && storeId !== "all") oq = oq.eq("store_id", storeId);
        const { count: unpaidOrders } = await oq;

        // Count pending vouchers
        let vq = supabase.from("finance_transactions").select("id", { count: "exact" }).eq("status", "pending");
        if (storeId && storeId !== "all") vq = vq.eq("store_id", storeId);
        const { count: pendingVouchers } = await vq;

        // Count pending invoices
        let iq = supabase.from("invoices").select("id", { count: "exact" }).eq("status", "pending");
        if (storeId && storeId !== "all") iq = iq.eq("store_id", storeId);
        const { count: pendingInvoices } = await iq;

        return new Response(JSON.stringify({
          success: true, action,
          status: {
            pendingReceipts: pendingReceipts || 0,
            unpaidOrders: unpaidOrders || 0,
            pendingVouchers: pendingVouchers || 0,
            pendingInvoices: pendingInvoices || 0,
          },
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (e) {
    console.error("auto-finance-cycle error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
