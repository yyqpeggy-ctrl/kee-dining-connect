import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, ChefHat, CheckCircle2, XCircle, Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type OrderStatus = "pending" | "preparing" | "served" | "completed" | "cancelled";

type OrderItem = {
  id: string;
  name_zh: string;
  name_en: string;
  quantity: number;
  unit_price: number;
  menu_item_id: string | null;
};

type Order = {
  id: string;
  order_number: string;
  table_name: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  order_items: OrderItem[];
};

const Orders = () => {
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all");
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      if (status === "completed") {
        toast({ title: isZh ? "订单已完成，库存已自动扣减" : "Order completed, inventory auto-deducted" });
      }
    },
    onError: () => toast({ title: isZh ? "更新失败" : "Update failed", variant: "destructive" }),
  });

  const statusConfig: Record<OrderStatus, { label: string; icon: any; color: string }> = {
    pending: { label: t("orderMgmt.pending"), icon: Clock, color: "text-warning bg-warning/10" },
    preparing: { label: t("orderMgmt.preparing"), icon: ChefHat, color: "text-info bg-info/10" },
    served: { label: t("orderMgmt.served"), icon: Package, color: "text-primary bg-primary/10" },
    completed: { label: t("orderMgmt.completed"), icon: CheckCircle2, color: "text-success bg-success/10" },
    cancelled: { label: t("orderMgmt.cancelled"), icon: XCircle, color: "text-destructive bg-destructive/10" },
  };

  const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
    pending: "preparing",
    preparing: "served",
    served: "completed",
  };

  const nextLabel: Record<string, { zh: string; en: string }> = {
    preparing: { zh: "开始制作", en: "Start Preparing" },
    served: { zh: "标记上菜", en: "Mark Served" },
    completed: { zh: "完成订单", en: "Complete Order" },
  };

  const tabs: { key: OrderStatus | "all"; label: string }[] = [
    { key: "all", label: t("common.all") },
    { key: "pending", label: t("orderMgmt.pending") },
    { key: "preparing", label: t("orderMgmt.preparing") },
    { key: "served", label: t("orderMgmt.served") },
    { key: "completed", label: t("orderMgmt.completed") },
  ];

  const filtered = activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab);

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display">{t("orderMgmt.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("orderMgmt.subtitle")} · {t("common.of")} {orders.length} {t("orderMgmt.totalOrders")}
        </p>
      </div>

      <div className="flex gap-1 mb-5 p-1 bg-muted/50 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-12">{isZh ? "加载中..." : "Loading..."}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((order, i) => {
            const config = statusConfig[order.status];
            const Icon = config.icon;
            const next = nextStatus[order.status];
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold font-display">{order.order_number}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      {order.table_name}
                      {t("orderMgmt.table")}
                    </span>
                  </div>
                  <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${config.color}`}>
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>
                </div>
                <div className="space-y-1 mb-3">
                  {(order.order_items || []).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-secondary-foreground">
                        {isZh ? item.name_zh : item.name_en}
                        {item.quantity > 1 && ` x${item.quantity}`}
                      </span>
                      <span className="text-muted-foreground">¥{Number(item.unit_price) * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <div className="flex items-center gap-2">
                    {next && (
                      <Button
                        size="sm"
                        variant={next === "completed" ? "default" : "outline"}
                        onClick={() => updateStatus.mutate({ id: order.id, status: next })}
                        disabled={updateStatus.isPending}
                        className="text-xs h-7"
                      >
                        {next === "completed" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {isZh ? nextLabel[next]?.zh : nextLabel[next]?.en}
                      </Button>
                    )}
                    {order.status !== "cancelled" && order.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 text-destructive"
                        onClick={() => updateStatus.mutate({ id: order.id, status: "cancelled" })}
                        disabled={updateStatus.isPending}
                      >
                        {isZh ? "取消" : "Cancel"}
                      </Button>
                    )}
                    <span className="text-sm font-bold text-primary">¥{Number(order.total)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default Orders;
