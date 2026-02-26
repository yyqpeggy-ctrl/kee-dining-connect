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

      // ===== Phase 2: 按内部规则自动排款 =====
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
          paymentCategory: string;
          supplierBank?: string;
          supplierAccount?: string;
          storeName: string;
        }> = [];

        const today = new Date();
        const forceAll = params?.force === true;
        const manualDate = params?.manualDate; // manual override date

        // Internal payment schedule rules
        const getNextPaymentDate = (category: string, refDate: Date): Date => {
          const d = new Date(refDate);
          switch (category) {
            case "rent": {
              // Rent: due by 27th of each month
              const target = new Date(d.getFullYear(), d.getMonth(), 27);
              if (d.getDate() > 27) target.setMonth(target.getMonth() + 1);
              return target;
            }
            case "salary": {
              // Salary: due by 8th of next month
              const target = new Date(d.getFullYear(), d.getMonth() + 1, 8);
              return target;
            }
            default: {
              // General suppliers: every Friday
              const dayOfWeek = d.getDay();
              const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
              const friday = new Date(d);
              friday.setDate(friday.getDate() + daysUntilFriday);
              return friday;
            }
          }
        };

        const categorizePayment = (order: any): string => {
          const name = (order.supplier_name || "").toLowerCase();
          const notes = (order.notes || "").toLowerCase();
          const type = (order.type || "").toLowerCase();
          if (name.includes("房租") || name.includes("rent") || notes.includes("房租") || notes.includes("rent")) return "rent";
          if (name.includes("工资") || name.includes("salary") || name.includes("薪") || notes.includes("工资") || notes.includes("salary")) return "salary";
          return "supplier";
        };

        for (const order of (orders || [])) {
          const category = categorizePayment(order);
          let dueDate: Date;

          if (manualDate) {
            // Manual override: use the specified date
            dueDate = new Date(manualDate);
          } else if (order.payment_due_date) {
            dueDate = new Date(order.payment_due_date);
          } else {
            dueDate = getNextPaymentDate(category, today);
          }

          const unpaid = order.total_amount - order.paid_amount;
          if (unpaid <= 0) continue;

          // Include if due or forced
          if (dueDate <= today || forceAll || manualDate) {
            const supplier = order.suppliers;
            paymentSchedule.push({
              orderId: order.id,
              orderNumber: order.order_number,
              supplierName: order.supplier_name,
              amount: unpaid,
              dueDate: dueDate.toISOString().slice(0, 10),
              paymentCategory: category,
              supplierBank: supplier?.bank_name || "",
              supplierAccount: supplier?.bank_account || "",
              storeName: order.store_name_zh,
            });
          }
        }

        // Group by category for summary
        const summary = {
          supplier: paymentSchedule.filter(p => p.paymentCategory === "supplier"),
          rent: paymentSchedule.filter(p => p.paymentCategory === "rent"),
          salary: paymentSchedule.filter(p => p.paymentCategory === "salary"),
        };

        return new Response(JSON.stringify({
          success: true, action, totalDue: paymentSchedule.length,
          totalAmount: paymentSchedule.reduce((s, p) => s + p.amount, 0),
          payments: paymentSchedule,
          summary: {
            supplier: { count: summary.supplier.length, total: summary.supplier.reduce((s, p) => s + p.amount, 0), rule: "每周五" },
            rent: { count: summary.rent.length, total: summary.rent.reduce((s, p) => s + p.amount, 0), rule: "每月27号前" },
            salary: { count: summary.salary.length, total: summary.salary.reduce((s, p) => s + p.amount, 0), rule: "次月8号前" },
          },
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
