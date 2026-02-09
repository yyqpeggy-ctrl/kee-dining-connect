import { motion } from "framer-motion";
import { Clock, ChefHat, CheckCircle2, XCircle, Search } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useState } from "react";

type OrderStatus = "pending" | "preparing" | "served" | "completed" | "cancelled";

interface Order {
  id: string;
  table: string;
  items: string[];
  total: string;
  time: string;
  status: OrderStatus;
}

const orders: Order[] = [
  { id: "ORD-001", table: "A1", items: ["招牌烤鱼", "精酿IPA x2"], total: "¥268", time: "19:32", status: "preparing" },
  { id: "ORD-002", table: "B1", items: ["麻辣小龙虾", "水煮牛肉", "米饭 x4"], total: "¥520", time: "19:15", status: "served" },
  { id: "ORD-003", table: "A3", items: ["鲜榨橙汁 x2", "凉拌黄瓜"], total: "¥86", time: "19:45", status: "pending" },
  { id: "ORD-004", table: "C3", items: ["精酿啤酒 x3"], total: "¥98", time: "20:01", status: "preparing" },
  { id: "ORD-005", table: "B4", items: ["水煮牛肉", "麻婆豆腐", "白饭 x2"], total: "¥188", time: "18:50", status: "completed" },
  { id: "ORD-006", table: "A2", items: ["招牌烤鱼", "拉菲红酒"], total: "¥680", time: "18:30", status: "completed" },
  { id: "ORD-007", table: "B3", items: ["柠檬水 x2"], total: "¥24", time: "20:10", status: "cancelled" },
  { id: "ORD-008", table: "C1", items: ["麻辣小龙虾 x2", "啤酒 x6", "毛豆"], total: "¥420", time: "17:55", status: "completed" },
];

const statusConfig: Record<OrderStatus, { label: string; icon: any; color: string }> = {
  pending: { label: "待处理", icon: Clock, color: "text-warning bg-warning/10" },
  preparing: { label: "制作中", icon: ChefHat, color: "text-info bg-info/10" },
  served: { label: "已上菜", icon: CheckCircle2, color: "text-primary bg-primary/10" },
  completed: { label: "已完成", icon: CheckCircle2, color: "text-success bg-success/10" },
  cancelled: { label: "已取消", icon: XCircle, color: "text-destructive bg-destructive/10" },
};

const tabs: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待处理" },
  { key: "preparing", label: "制作中" },
  { key: "served", label: "已上菜" },
  { key: "completed", label: "已完成" },
];

const Orders = () => {
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all");

  const filtered = activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab);

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display">订单管理</h1>
        <p className="text-sm text-muted-foreground mt-1">今日订单 · 共 {orders.length} 单</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-muted/50 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((order, i) => {
          const config = statusConfig[order.status];
          const Icon = config.icon;
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
                  <span className="text-sm font-bold font-display">{order.id}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                    {order.table}桌
                  </span>
                </div>
                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${config.color}`}>
                  <Icon className="w-3 h-3" />
                  {config.label}
                </span>
              </div>

              <div className="space-y-1 mb-3">
                {order.items.map((item, j) => (
                  <p key={j} className="text-sm text-secondary-foreground">{item}</p>
                ))}
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
