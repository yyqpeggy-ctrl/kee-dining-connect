import { motion } from "framer-motion";
import { Package, Clock, CheckCircle, Truck, AlertTriangle, FileText, DollarSign, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  orders: Tables<"procurement_orders">[];
  onRefresh: () => void;
}

const ProcurementOrdersTab = ({ orders, onRefresh }: Props) => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: t("procurementMgmt.draft"), color: "bg-muted text-muted-foreground", icon: FileText },
    pending: { label: t("procurementMgmt.pending"), color: "bg-warning/10 text-warning", icon: Clock },
    confirmed: { label: t("procurementMgmt.confirmed"), color: "bg-info/10 text-info", icon: CheckCircle },
    shipping: { label: t("procurementMgmt.shipping"), color: "bg-primary/10 text-primary", icon: Truck },
    received: { label: t("procurementMgmt.received"), color: "bg-success/10 text-success", icon: Package },
    paid: { label: t("procurementMgmt.paid"), color: "bg-success/10 text-success", icon: DollarSign },
    cancelled: { label: t("procurementMgmt.cancelled"), color: "bg-destructive/10 text-destructive", icon: AlertTriangle },
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("procurement_orders").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isZh ? "状态已更新" : "Status updated");
      onRefresh();
    }
  };

  const parseItems = (items: any): { name_zh?: string; name_en?: string; quantity?: number; unit_price?: number }[] => {
    if (Array.isArray(items)) return items;
    try { return JSON.parse(items); } catch { return []; }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium">{t("procurementMgmt.noOrders")}</p>
        <p className="text-xs mt-1">{t("procurementMgmt.createFirst")}</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {orders.map((order, i) => {
        const config = statusConfig[order.status] || statusConfig.draft;
        const Icon = config.icon;
        const items = parseItems(order.items);
        const itemsText = items.map(it => isZh ? (it.name_zh || it.name_en || "") : (it.name_en || it.name_zh || "")).join(", ");

        return (
          <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass-card rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold font-mono text-sm">{order.order_number}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${config.color}`}>
                      <Icon className="w-3 h-3" />{config.label}
                    </span>
                    {order.compliance_checked && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-success/10 text-success flex items-center gap-1">
                        <Shield className="w-3 h-3" />{t("procurementMgmt.compliancePassed")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{order.supplier_name}</p>
                </div>
              </div>
              <span className="text-lg font-bold text-primary">¥{order.total_amount.toLocaleString()}</span>
            </div>

            {itemsText && (
              <p className="text-sm text-secondary-foreground mb-3 bg-muted/30 rounded-lg p-2 line-clamp-2">{itemsText}</p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
              <span>{t("procurementMgmt.store")}: {isZh ? order.store_name_zh : order.store_name_en}</span>
              <span>{t("procurementMgmt.orderDate")}: {new Date(order.created_at).toLocaleDateString()}</span>
              {order.contract_number && <span>{t("procurementMgmt.contractNo")}: {order.contract_number}</span>}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {order.status === "draft" && (
                <button onClick={() => handleStatusChange(order.id, "pending")} className="px-3 py-1 text-xs bg-warning/10 text-warning rounded-md hover:bg-warning/20 transition-colors">
                  {isZh ? "提交审批" : "Submit"}
                </button>
              )}
              {order.status === "confirmed" && (
                <button onClick={() => handleStatusChange(order.id, "shipping")} className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
                  {isZh ? "标记发货" : "Mark Shipped"}
                </button>
              )}
              {order.status === "shipping" && (
                <button onClick={() => handleStatusChange(order.id, "received")} className="px-3 py-1 text-xs bg-success/10 text-success rounded-md hover:bg-success/20 transition-colors">
                  {isZh ? "确认收货" : "Confirm Received"}
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default ProcurementOrdersTab;
