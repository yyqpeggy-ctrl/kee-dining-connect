import { motion } from "framer-motion";
import { DollarSign, CreditCard, CheckCircle, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface Props {
  orders: Tables<"procurement_orders">[];
  onRefresh: () => void;
}

const ProcurementPaymentTab = ({ orders, onRefresh }: Props) => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");

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
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-warning" />
          {t("procurementMgmt.unpaidAmount")} ({payableOrders.length})
        </h3>
        {payableOrders.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">{isZh ? "暂无待付款订单" : "No unpaid orders"}</p>
        ) : (
          <div className="space-y-3">
            {payableOrders.map(order => (
              <div key={order.id} className="glass-card rounded-xl p-4 border-l-4 border-l-warning">
                <div className="flex items-center justify-between mb-2">
                  <div>
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
    </motion.div>
  );
};

export default ProcurementPaymentTab;
