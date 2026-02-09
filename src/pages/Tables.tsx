import { motion } from "framer-motion";
import { Users, Clock, CheckCircle } from "lucide-react";
import AppLayout from "@/components/AppLayout";

type TableStatus = "available" | "occupied" | "reserved" | "cleaning";

interface TableItem {
  id: number;
  name: string;
  seats: number;
  status: TableStatus;
  guests?: number;
  duration?: string;
  amount?: string;
}

const tables: TableItem[] = [
  { id: 1, name: "A1", seats: 4, status: "occupied", guests: 3, duration: "45min", amount: "¥268" },
  { id: 2, name: "A2", seats: 4, status: "available" },
  { id: 3, name: "A3", seats: 2, status: "occupied", guests: 2, duration: "1h20min", amount: "¥186" },
  { id: 4, name: "A4", seats: 6, status: "reserved" },
  { id: 5, name: "B1", seats: 8, status: "occupied", guests: 7, duration: "30min", amount: "¥520" },
  { id: 6, name: "B2", seats: 4, status: "available" },
  { id: 7, name: "B3", seats: 2, status: "cleaning" },
  { id: 8, name: "B4", seats: 4, status: "occupied", guests: 4, duration: "55min", amount: "¥340" },
  { id: 9, name: "C1", seats: 10, status: "reserved" },
  { id: 10, name: "C2", seats: 6, status: "available" },
  { id: 11, name: "C3", seats: 4, status: "occupied", guests: 2, duration: "20min", amount: "¥98" },
  { id: 12, name: "C4", seats: 2, status: "available" },
];

const statusConfig: Record<TableStatus, { label: string; color: string; bg: string }> = {
  available: { label: "空闲", color: "text-success", bg: "bg-success/10 border-success/20" },
  occupied: { label: "就餐中", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  reserved: { label: "已预订", color: "text-warning", bg: "bg-warning/10 border-warning/20" },
  cleaning: { label: "清理中", color: "text-muted-foreground", bg: "bg-muted border-border" },
};

const Tables = () => {
  const counts = {
    available: tables.filter((t) => t.status === "available").length,
    occupied: tables.filter((t) => t.status === "occupied").length,
    reserved: tables.filter((t) => t.status === "reserved").length,
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">桌台管理</h1>
          <p className="text-sm text-muted-foreground mt-1">实时餐桌状态</p>
        </div>
        <div className="flex gap-3">
          {(["available", "occupied", "reserved"] as const).map((s) => (
            <div key={s} className="flex items-center gap-2 text-xs">
              <div className={`w-2.5 h-2.5 rounded-full ${statusConfig[s].color.replace("text-", "bg-")}`} />
              <span className="text-muted-foreground">
                {statusConfig[s].label} ({counts[s]})
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table, i) => {
          const config = statusConfig[table.status];
          return (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className={`table-seat border p-4 ${config.bg}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold font-display">{table.name}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.color} bg-background/30`}>
                  {config.label}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <Users className="w-3 h-3" />
                <span>
                  {table.guests ? `${table.guests}/` : ""}
                  {table.seats}座
                </span>
              </div>

              {table.status === "occupied" && (
                <div className="space-y-1.5 mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {table.duration}
                    </span>
                    <span className="font-semibold text-primary">{table.amount}</span>
                  </div>
                </div>
              )}

              {table.status === "available" && (
                <button className="mt-3 w-full text-xs py-1.5 rounded-md bg-success/15 text-success font-medium hover:bg-success/25 transition-colors">
                  开台
                </button>
              )}

              {table.status === "reserved" && (
                <div className="mt-3 flex items-center gap-1 text-xs text-warning">
                  <Clock className="w-3 h-3" />
                  <span>18:30 · 王先生</span>
                </div>
              )}

              {table.status === "cleaning" && (
                <button className="mt-3 w-full text-xs py-1.5 rounded-md bg-muted text-muted-foreground font-medium flex items-center justify-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  完成清理
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default Tables;
