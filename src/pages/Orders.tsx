import { motion } from "framer-motion";
import { Clock, ChefHat, CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/AppLayout";
import { useState } from "react";

type OrderStatus = "pending" | "preparing" | "served" | "completed" | "cancelled";

interface OrderItem {
  nameZh: string;
  nameEn: string;
}

interface Order {
  id: string;
  table: string;
  items: OrderItem[];
  total: string;
  time: string;
  status: OrderStatus;
}

const orders: Order[] = [
  { id: "ORD-001", table: "A1", items: [{ nameZh: "招牌烤鱼", nameEn: "Signature Grilled Fish" }, { nameZh: "精酿IPA x2", nameEn: "Craft IPA x2" }], total: "¥268", time: "19:32", status: "preparing" },
  { id: "ORD-002", table: "B1", items: [{ nameZh: "麻辣小龙虾", nameEn: "Spicy Crayfish" }, { nameZh: "水煮牛肉", nameEn: "Boiled Beef" }, { nameZh: "米饭 x4", nameEn: "Rice x4" }], total: "¥520", time: "19:15", status: "served" },
  { id: "ORD-003", table: "A3", items: [{ nameZh: "鲜榨橙汁 x2", nameEn: "Fresh OJ x2" }, { nameZh: "凉拌黄瓜", nameEn: "Cucumber Salad" }], total: "¥86", time: "19:45", status: "pending" },
  { id: "ORD-004", table: "C3", items: [{ nameZh: "精酿啤酒 x3", nameEn: "Craft Beer x3" }], total: "¥98", time: "20:01", status: "preparing" },
  { id: "ORD-005", table: "B4", items: [{ nameZh: "水煮牛肉", nameEn: "Boiled Beef" }, { nameZh: "麻婆豆腐", nameEn: "Mapo Tofu" }, { nameZh: "白饭 x2", nameEn: "Rice x2" }], total: "¥188", time: "18:50", status: "completed" },
  { id: "ORD-006", table: "A2", items: [{ nameZh: "招牌烤鱼", nameEn: "Signature Grilled Fish" }, { nameZh: "拉菲红酒", nameEn: "Lafite Wine" }], total: "¥680", time: "18:30", status: "completed" },
  { id: "ORD-007", table: "B3", items: [{ nameZh: "柠檬水 x2", nameEn: "Lemonade x2" }], total: "¥24", time: "20:10", status: "cancelled" },
  { id: "ORD-008", table: "C1", items: [{ nameZh: "麻辣小龙虾 x2", nameEn: "Spicy Crayfish x2" }, { nameZh: "啤酒 x6", nameEn: "Beer x6" }, { nameZh: "毛豆", nameEn: "Edamame" }], total: "¥420", time: "17:55", status: "completed" },
];

const Orders = () => {
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all");
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  const statusConfig: Record<OrderStatus, { label: string; icon: any; color: string }> = {
    pending: { label: t("orderMgmt.pending"), icon: Clock, color: "text-warning bg-warning/10" },
    preparing: { label: t("orderMgmt.preparing"), icon: ChefHat, color: "text-info bg-info/10" },
    served: { label: t("orderMgmt.served"), icon: CheckCircle2, color: "text-primary bg-primary/10" },
    completed: { label: t("orderMgmt.completed"), icon: CheckCircle2, color: "text-success bg-success/10" },
    cancelled: { label: t("orderMgmt.cancelled"), icon: XCircle, color: "text-destructive bg-destructive/10" },
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
        <p className="text-sm text-muted-foreground mt-1">{t("orderMgmt.subtitle")} · {t("common.of")} {orders.length} {t("orderMgmt.totalOrders")}</p>
      </div>

      <div className="flex gap-1 mb-5 p-1 bg-muted/50 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{tab.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((order, i) => {
          const config = statusConfig[order.status];
          const Icon = config.icon;
          return (
            <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold font-display">{order.id}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{order.table}{t("orderMgmt.table")}</span>
                </div>
                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${config.color}`}><Icon className="w-3 h-3" />{config.label}</span>
              </div>
              <div className="space-y-1 mb-3">
                {order.items.map((item, j) => (<p key={j} className="text-sm text-secondary-foreground">{isZh ? item.nameZh : item.nameEn}</p>))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <span className="text-xs text-muted-foreground">{order.time}</span>
                <span className="text-sm font-bold text-primary">{order.total}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default Orders;
