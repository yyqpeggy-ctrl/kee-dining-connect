import { motion } from "framer-motion";
import { Clock, CheckCircle2, Flame, Timer } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/AppLayout";
import { useStore } from "@/contexts/StoreContext";

interface KitchenOrder {
  id: string;
  table: string;
  items: { nameZh: string; nameEn: string; quantity: number; notesZh?: string; notesEn?: string }[];
  orderTime: string;
  waitTime: number;
  status: "pending" | "preparing" | "ready";
  priority: "normal" | "rush";
}

const kitchenOrders: KitchenOrder[] = [
  { id: "K-001", table: "A1", items: [{ nameZh: "西班牙火腿拼盘", nameEn: "Jamón Ibérico Platter", quantity: 1 }, { nameZh: "蒜香虾", nameEn: "Gambas al Ajillo", quantity: 1, notesZh: "不要辣椒", notesEn: "No chili" }], orderTime: "19:32", waitTime: 12, status: "preparing", priority: "normal" },
  { id: "K-002", table: "B1", items: [{ nameZh: "烤章鱼 Pulpo", nameEn: "Grilled Octopus Pulpo", quantity: 1, notesZh: "多烤一点", notesEn: "Extra charred" }, { nameZh: "西班牙蛋饼 Tortilla", nameEn: "Spanish Tortilla", quantity: 1 }, { nameZh: "炸丸子 Croquetas", nameEn: "Croquetas", quantity: 2 }], orderTime: "19:28", waitTime: 16, status: "preparing", priority: "rush" },
  { id: "K-003", table: "C3", items: [{ nameZh: "Tomahawk战斧牛排", nameEn: "Tomahawk Steak", quantity: 1, notesZh: "五分熟", notesEn: "Medium" }, { nameZh: "薯条 Patatas Bravas", nameEn: "Patatas Bravas", quantity: 1 }], orderTime: "19:45", waitTime: 3, status: "pending", priority: "normal" },
  { id: "K-004", table: "A3", items: [{ nameZh: "帕德龙辣椒 Padrón", nameEn: "Padrón Peppers", quantity: 1 }], orderTime: "19:40", waitTime: 8, status: "ready", priority: "normal" },
  { id: "K-005", table: "B4", items: [{ nameZh: "芝士拼盘", nameEn: "Cheese Board", quantity: 1 }, { nameZh: "烤羊排", nameEn: "Grilled Lamb Chops", quantity: 1, notesZh: "配薄荷酱", notesEn: "With mint sauce" }], orderTime: "19:35", waitTime: 13, status: "preparing", priority: "normal" },
];

const Kitchen = () => {
  const { currentStore } = useStore();
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  const statusConfig = {
    pending: { label: t("kitchenMgmt.pending"), color: "bg-warning text-warning-foreground", icon: Clock },
    preparing: { label: t("kitchenMgmt.preparing"), color: "bg-info text-info-foreground", icon: Flame },
    ready: { label: t("kitchenMgmt.ready"), color: "bg-success text-success-foreground", icon: CheckCircle2 },
  };

  const pendingCount = kitchenOrders.filter((o) => o.status === "pending").length;
  const preparingCount = kitchenOrders.filter((o) => o.status === "preparing").length;
  const readyCount = kitchenOrders.filter((o) => o.status === "ready").length;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">{t("kitchenMgmt.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{currentStore.name} · {t("kitchenMgmt.subtitle")}</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs"><Clock className="w-3.5 h-3.5" /><span>{t("kitchenMgmt.pending")} {pendingCount}</span></div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-info/10 text-info text-xs"><Flame className="w-3.5 h-3.5" /><span>{t("kitchenMgmt.preparing")} {preparingCount}</span></div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs"><CheckCircle2 className="w-3.5 h-3.5" /><span>{t("kitchenMgmt.ready")} {readyCount}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kitchenOrders.map((order, i) => {
          const config = statusConfig[order.status];
          const Icon = config.icon;
          const isUrgent = order.waitTime > 15 || order.priority === "rush";
          return (
            <motion.div key={order.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className={`glass-card rounded-xl overflow-hidden ${isUrgent ? "ring-1 ring-destructive/50" : ""}`}>
              <div className={`px-4 py-2 flex items-center justify-between ${config.color}`}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="font-bold">{order.table}{t("orderMgmt.table")}</span>
                  {order.priority === "rush" && (<span className="text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded">{t("kitchenMgmt.rush")}</span>)}
                </div>
                <span className="text-xs font-mono">{order.id}</span>
              </div>
              <div className="p-4 space-y-2">
                {order.items.map((item, j) => (
                  <div key={j} className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{isZh ? item.nameZh : item.nameEn} <span className="text-primary">×{item.quantity}</span></p>
                      {(item.notesZh || item.notesEn) && (<p className="text-xs text-warning mt-0.5">⚠️ {isZh ? item.notesZh : item.notesEn}</p>)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Timer className="w-3 h-3" />
                  <span>{t("kitchenMgmt.ordered")} {order.orderTime}</span>
                  <span className={`font-semibold ${isUrgent ? "text-destructive" : ""}`}>· {order.waitTime}{t("kitchenMgmt.minutes")}</span>
                </div>
                {order.status === "pending" && (<button className="text-xs px-3 py-1 bg-info text-info-foreground rounded-md font-medium">{t("kitchenMgmt.startCooking")}</button>)}
                {order.status === "preparing" && (<button className="text-xs px-3 py-1 bg-success text-success-foreground rounded-md font-medium">{t("kitchenMgmt.finishCooking")}</button>)}
                {order.status === "ready" && (<button className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded-md font-medium">{t("kitchenMgmt.served")}</button>)}
              </div>
            </motion.div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default Kitchen;
