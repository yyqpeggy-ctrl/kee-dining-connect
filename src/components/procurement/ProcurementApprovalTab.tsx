import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, UserCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  orders: Tables<"procurement_orders">[];
  onRefresh: () => void;
}

const ProcurementApprovalTab = ({ orders, onRefresh }: Props) => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";

  const pendingOrders = orders.filter(o => o.status === "pending");
  const approvedOrders = orders.filter(o => ["confirmed", "shipping", "received", "paid"].includes(o.status));
  const rejectedOrders = orders.filter(o => o.status === "cancelled");

  const handleApprove = async (id: string) => {
    const { error } = await supabase.from("procurement_orders").update({
      status: "confirmed",
      approved_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(isZh ? "审批通过" : "Approved"); onRefresh(); }
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase.from("procurement_orders").update({
      status: "cancelled",
    }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(isZh ? "已驳回" : "Rejected"); onRefresh(); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Pending Approval */}
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-warning" />
          {t("procurementMgmt.pendingApproval")} ({pendingOrders.length})
        </h3>
        {pendingOrders.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">{isZh ? "暂无待审批订单" : "No pending approvals"}</p>
        ) : (
          <div className="space-y-3">
            {pendingOrders.map((order, i) => (
              <motion.div key={order.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4 border-l-4 border-l-warning">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-mono font-bold text-sm">{order.order_number}</span>
                    <span className="text-muted-foreground text-xs ml-2">{order.supplier_name}</span>
                  </div>
                  <span className="font-bold text-primary">¥{order.total_amount.toLocaleString()}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  {isZh ? order.store_name_zh : order.store_name_en} · {order.type === "asset" ? (isZh ? "资产采购" : "Asset") : (isZh ? "日常采购" : "Regular")}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(order.id)} className="px-4 py-1.5 text-xs bg-success text-success-foreground rounded-md hover:bg-success/90 transition-colors flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />{t("procurementMgmt.approve")}
                  </button>
                  <button onClick={() => handleReject(order.id)} className="px-4 py-1.5 text-xs bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 transition-colors flex items-center gap-1">
                    <XCircle className="w-3 h-3" />{t("procurementMgmt.reject")}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Approved */}
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <UserCheck className="w-4 h-4 text-success" />
          {t("procurementMgmt.approved")} ({approvedOrders.length})
        </h3>
        <div className="space-y-2">
          {approvedOrders.map(order => (
            <div key={order.id} className="glass-card rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold">{order.order_number}</span>
                <span className="text-muted-foreground text-xs ml-2">{order.supplier_name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-primary font-semibold">¥{order.total_amount.toLocaleString()}</span>
                {order.approved_at && <span className="text-muted-foreground">{new Date(order.approved_at).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rejected */}
      {rejectedOrders.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-destructive" />
            {t("procurementMgmt.rejected")} ({rejectedOrders.length})
          </h3>
          <div className="space-y-2">
            {rejectedOrders.map(order => (
              <div key={order.id} className="glass-card rounded-xl p-3 flex items-center justify-between opacity-60">
                <div>
                  <span className="font-mono text-xs font-bold">{order.order_number}</span>
                  <span className="text-muted-foreground text-xs ml-2">{order.supplier_name}</span>
                </div>
                <span className="text-xs text-destructive">¥{order.total_amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProcurementApprovalTab;
