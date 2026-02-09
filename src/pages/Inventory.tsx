import { motion } from "framer-motion";
import { Wine, AlertTriangle, TrendingDown, Package, Search } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useState } from "react";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  stock: number;
  unit: string;
  pourCost: number;
  targetCost: number;
  usage7d: number;
  status: "normal" | "low" | "critical";
}

const inventory: InventoryItem[] = [
  { id: 1, name: "青岛精酿IPA", category: "啤酒", stock: 48, unit: "瓶", pourCost: 22, targetCost: 25, usage7d: 86, status: "normal" },
  { id: 2, name: "茅台飞天53度", category: "白酒", stock: 6, unit: "瓶", pourCost: 18, targetCost: 20, usage7d: 4, status: "low" },
  { id: 3, name: "拉菲传奇波尔多", category: "红酒", stock: 12, unit: "瓶", pourCost: 32, targetCost: 28, usage7d: 8, status: "critical" },
  { id: 4, name: "鲜榨橙汁", category: "果汁", stock: 25, unit: "升", pourCost: 35, targetCost: 30, usage7d: 40, status: "critical" },
  { id: 5, name: "百利甜酒", category: "利口酒", stock: 8, unit: "瓶", pourCost: 15, targetCost: 18, usage7d: 12, status: "normal" },
  { id: 6, name: "朝日超爽", category: "啤酒", stock: 120, unit: "瓶", pourCost: 20, targetCost: 25, usage7d: 156, status: "normal" },
  { id: 7, name: "金酒（Beefeater）", category: "烈酒", stock: 3, unit: "瓶", pourCost: 16, targetCost: 18, usage7d: 5, status: "low" },
  { id: 8, name: "柠檬水", category: "软饮", stock: 60, unit: "升", pourCost: 8, targetCost: 10, usage7d: 80, status: "normal" },
];

const Inventory = () => {
  const [search, setSearch] = useState("");

  const filtered = inventory.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.includes(search)
  );

  const overCostItems = inventory.filter((i) => i.pourCost > i.targetCost).length;
  const lowStockItems = inventory.filter((i) => i.status !== "normal").length;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">库存管理</h1>
          <p className="text-sm text-muted-foreground mt-1">饮品库存与成本追踪 · BevSight</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{lowStockItems} 项库存预警</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{overCostItems} 项成本超标</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="搜索饮品名称或品类..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">名称</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">品类</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">库存</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">倒损成本%</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">目标%</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">7日用量</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                >
                  <td className="py-3 px-4 font-medium flex items-center gap-2">
                    <Wine className="w-4 h-4 text-primary/60" />
                    {item.name}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{item.category}</td>
                  <td className="py-3 px-4 text-right">
                    {item.stock} {item.unit}
                  </td>
                  <td className={`py-3 px-4 text-right font-semibold ${
                    item.pourCost > item.targetCost ? "text-destructive" : "text-success"
                  }`}>
                    {item.pourCost}%
                  </td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{item.targetCost}%</td>
                  <td className="py-3 px-4 text-right">{item.usage7d} {item.unit}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      item.status === "normal"
                        ? "bg-success/10 text-success"
                        : item.status === "low"
                        ? "bg-warning/10 text-warning"
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {item.status === "normal" ? "正常" : item.status === "low" ? "偏低" : "紧急"}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Inventory;
