import { motion } from "framer-motion";
import { DollarSign, CreditCard, CheckCircle, AlertTriangle, Download, CheckSquare, Square } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { generateBankPaymentExcel } from "./bankPaymentExport";

interface Props {
  orders: Tables<"procurement_orders">[];
  onRefresh: () => void;
}

const ProcurementPaymentTab = ({ orders, onRefresh }: Props) => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [supplierBankMap, setSupplierBankMap] = useState<Record<string, { bank_name: string; bank_account: string; bank_account_name: string }>>({});
  const [showBankConfirm, setShowBankConfirm] = useState(false);
  const [pendingExportRows, setPendingExportRows] = useState<{orderNumber:string;supplierName:string;supplierBank:string;supplierAccount:string;amount:number;currency:string;paymentDate:string;storeName:string;notes:string}[]>([]);

  // Fetch supplier bank info for all unique supplier names
  useEffect(() => {
    const fetchSupplierBank = async () => {
      const names = [...new Set(orders.map(o => o.supplier_name))];
      if (names.length === 0) return;
      const { data } = await supabase.from("suppliers").select("name, bank_name, bank_branch, bank_account, bank_account_name").in("name", names);
      if (data) {
        const map: Record<string, any> = {};
        data.forEach(s => { map[s.name] = { bank_name: `${s.bank_name}${s.bank_branch ? " " + s.bank_branch : ""}`, bank_account: s.bank_account, bank_account_name: s.bank_account_name }; });
        setSupplierBankMap(map);
      }
    };
    fetchSupplierBank();
  }, [orders]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === payableOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(payableOrders.map(o => o.id)));
    }
  };

  const handleBatchExport = () => {
    const selected = payableOrders.filter(o => selectedIds.has(o.id));
    if (selected.length === 0) {
      toast.error(isZh ? "请先勾选要导出的订单" : "Please select orders to export");
      return;
    }
    const rows = selected.map(o => {
      const bank = supplierBankMap[o.supplier_name];
      return {
        orderNumber: o.order_number,
        supplierName: o.supplier_name,
        supplierBank: bank?.bank_name || "",
        supplierAccount: bank?.bank_account || "",
        amount: o.total_amount - o.paid_amount,
        currency: o.currency || "CNY",
        paymentDate: new Date().toISOString().slice(0, 10),
        storeName: isZh ? o.store_name_zh : o.store_name_en,
        notes: `${isZh ? "采购付款" : "Procurement"} ${o.order_number}`,
      };
    });
    // Show confirmation dialog with bank info
    setPendingExportRows(rows);
    setShowBankConfirm(true);
  };

  const confirmExport = async () => {
    generateBankPaymentExcel(pendingExportRows, isZh);
    // Write back modified bank info to supplier master data
    for (const row of pendingExportRows) {
      if (row.supplierBank || row.supplierAccount) {
        const existing = supplierBankMap[row.supplierName];
        const bankChanged = row.supplierBank && row.supplierBank !== (existing?.bank_name || "");
        const accountChanged = row.supplierAccount && row.supplierAccount !== (existing?.bank_account || "");
        if (bankChanged || accountChanged) {
          const updates: Record<string, string> = {};
          if (row.supplierBank) {
            const parts = row.supplierBank.split(" ");
            updates.bank_name = parts[0];
            if (parts.length > 1) updates.bank_branch = parts.slice(1).join(" ");
          }
          if (row.supplierAccount) updates.bank_account = row.supplierAccount;
          await supabase.from("suppliers").update(updates).eq("name", row.supplierName);
        }
      }
    }
    toast.success(isZh ? `已导出 ${pendingExportRows.length} 笔付款单，银行信息已同步` : `Exported ${pendingExportRows.length} payment(s), bank info synced`);
    setShowBankConfirm(false);
    setPendingExportRows([]);
    onRefresh();
  };

  // Only show confirmed+ orders for payment
  const payableOrders = orders.filter(o => ["confirmed", "shipping", "received"].includes(o.status));
  const paidOrders = orders.filter(o => o.status === "paid");

  const totalUnpaid = payableOrders.reduce((sum, o) => sum + (o.total_amount - o.paid_amount), 0);
  const totalPaid = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);

  const handlePay = async (order: Tables<"procurement_orders">) => {
    const { error } = await supabase.from("procurement_orders").update({
      status: "paid",
      paid_amount: order.total_amount,
      payment_method: paymentMethod,
    }).eq("id", order.id);
    if (error) toast.error(error.message);
    else { toast.success(isZh ? "付款成功" : "Payment confirmed"); setPayingId(null); onRefresh(); }
  };

  const methods = [
    { value: "bank_transfer", label: t("procurementMgmt.bankTransfer") },
    { value: "cash", label: t("procurementMgmt.cash") },
    { value: "wechat", label: t("procurementMgmt.wechatPay") },
    { value: "alipay", label: t("procurementMgmt.alipay") },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Payment Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-xl font-bold text-warning">¥{totalUnpaid.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{t("procurementMgmt.unpaidAmount")}</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xl font-bold text-success">¥{totalPaid.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{t("procurementMgmt.paidAmount")}</p>
          </div>
        </div>
      </div>

      {/* Unpaid Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-warning" />
            {t("procurementMgmt.unpaidAmount")} ({payableOrders.length})
          </h3>
          {payableOrders.length > 0 && (
            <div className="flex items-center gap-2">
              <button onClick={toggleSelectAll} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                {selectedIds.size === payableOrders.length ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                {isZh ? "全选" : "Select All"}
              </button>
              <button onClick={handleBatchExport} disabled={selectedIds.size === 0} className="px-3 py-1 text-xs bg-success text-success-foreground rounded-md hover:bg-success/90 transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
                <Download className="w-3 h-3" />
                {isZh ? `批量导出Excel (${selectedIds.size})` : `Export Excel (${selectedIds.size})`}
              </button>
            </div>
          )}
        </div>
        {payableOrders.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">{isZh ? "暂无待付款订单" : "No unpaid orders"}</p>
        ) : (
          <div className="space-y-3">
            {payableOrders.map(order => (
              <div key={order.id} className="glass-card rounded-xl p-4 border-l-4 border-l-warning">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleSelect(order.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                      {selectedIds.has(order.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                    </button>
                    <span className="font-mono font-bold text-sm">{order.order_number}</span>
                    <span className="text-muted-foreground text-xs ml-2">{order.supplier_name}</span>
                  </div>
                  <span className="font-bold text-lg text-primary">¥{(order.total_amount - order.paid_amount).toLocaleString()}</span>
                </div>
                {order.payment_due_date && (
                  <p className="text-xs text-muted-foreground mb-2">{t("procurementMgmt.paymentDue")}: {order.payment_due_date}</p>
                )}
                {payingId === order.id ? (
                  <div className="flex items-center gap-2 mt-2">
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="text-xs border border-border rounded-md px-2 py-1 bg-card">
                      {methods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <button onClick={() => handlePay(order)} className="px-3 py-1 text-xs bg-success text-success-foreground rounded-md hover:bg-success/90 transition-colors">
                      {t("common.confirm")}
                    </button>
                    <button onClick={() => setPayingId(null)} className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {t("common.cancel")}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setPayingId(order.id)} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1 mt-2">
                    <DollarSign className="w-3 h-3" />{t("procurementMgmt.payNow")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paid Orders */}
      {paidOrders.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success" />
            {t("procurementMgmt.paid")} ({paidOrders.length})
          </h3>
          <div className="space-y-2">
            {paidOrders.map(order => (
              <div key={order.id} className="glass-card rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold">{order.order_number}</span>
                  <span className="text-muted-foreground text-xs ml-2">{order.supplier_name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-success font-semibold">¥{order.total_amount.toLocaleString()}</span>
                  {order.paid_at && <span className="text-muted-foreground">{new Date(order.paid_at).toLocaleDateString()}</span>}
                  {order.payment_method && <span className="px-2 py-0.5 bg-muted rounded text-muted-foreground">{order.payment_method}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bank info confirmation dialog */}
      {showBankConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-xl max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-border">
              <h3 className="font-bold text-sm">{isZh ? "确认银行付款信息" : "Confirm Bank Payment Info"}</h3>
              <p className="text-xs text-muted-foreground mt-1">{isZh ? "以下银行信息来自供应商主档，请核对后导出" : "Bank info from supplier records. Please verify before export."}</p>
            </div>
            <div className="p-4 space-y-3">
              {pendingExportRows.map((row, i) => (
                <div key={i} className="bg-muted/30 rounded-lg p-3 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{row.supplierName}</span>
                    <span className="font-bold text-primary">¥{row.amount.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-muted-foreground block mb-0.5">{isZh ? "开户行" : "Bank"}</label>
                      <input
                        value={row.supplierBank}
                        onChange={e => {
                          const next = [...pendingExportRows];
                          next[i] = { ...next[i], supplierBank: e.target.value };
                          setPendingExportRows(next);
                        }}
                        placeholder={isZh ? "请输入开户行" : "Enter bank name"}
                        className="w-full px-2 py-1 rounded border border-border bg-background text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-muted-foreground block mb-0.5">{isZh ? "账号" : "Account"}</label>
                      <input
                        value={row.supplierAccount}
                        onChange={e => {
                          const next = [...pendingExportRows];
                          next[i] = { ...next[i], supplierAccount: e.target.value };
                          setPendingExportRows(next);
                        }}
                        placeholder={isZh ? "请输入银行账号" : "Enter account number"}
                        className="w-full px-2 py-1 rounded border border-border bg-background text-xs font-mono"
                      />
                    </div>
                  </div>
                  {!row.supplierBank && !row.supplierAccount && (
                    <p className="text-destructive text-[10px]">{isZh ? "⚠ 银行信息为空，请填写后导出" : "⚠ Bank info empty. Please fill before export."}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button onClick={() => setShowBankConfirm(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{isZh ? "取消" : "Cancel"}</button>
              <button onClick={confirmExport} className="px-4 py-2 bg-success text-success-foreground rounded-lg text-sm font-medium hover:bg-success/90 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />{isZh ? "确认导出" : "Confirm Export"}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProcurementPaymentTab;
