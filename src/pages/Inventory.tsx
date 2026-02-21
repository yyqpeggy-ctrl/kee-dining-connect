import { motion } from "framer-motion";
import { Wine, AlertTriangle, TrendingDown, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/AppLayout";
import { useState } from "react";

interface InventoryItem {
  id: number;
  nameZh: string;
  nameEn: string;
  categoryZh: string;
  categoryEn: string;
  stock: number;
  unit: string;
  pourCost: number;
  targetCost: number;
  usage7d: number;
  status: "normal" | "low" | "critical";
}

const inventory: InventoryItem[] = [
  { id: 1, nameZh: "Hendrick's 金酒", nameEn: "Hendrick's Gin", categoryZh: "烈酒", categoryEn: "Spirits", stock: 8, unit: "btl", pourCost: 18, targetCost: 20, usage7d: 12, status: "normal" },
  { id: 2, nameZh: "Rioja红酒 Marqués de Riscal", nameEn: "Rioja Marqués de Riscal", categoryZh: "红酒", categoryEn: "Wine", stock: 6, unit: "btl", pourCost: 32, targetCost: 28, usage7d: 8, status: "low" },
  { id: 3, nameZh: "Estrella Damm啤酒", nameEn: "Estrella Damm Beer", categoryZh: "啤酒", categoryEn: "Beer", stock: 120, unit: "btl", pourCost: 20, targetCost: 25, usage7d: 156, status: "normal" },
  { id: 4, nameZh: "鲜榨橙汁", nameEn: "Fresh Orange Juice", categoryZh: "果汁", categoryEn: "Juice", stock: 15, unit: "L", pourCost: 35, targetCost: 30, usage7d: 40, status: "critical" },
  { id: 5, nameZh: "Baileys百利甜", nameEn: "Baileys Irish Cream", categoryZh: "利口酒", categoryEn: "Liqueur", stock: 5, unit: "btl", pourCost: 15, targetCost: 18, usage7d: 8, status: "normal" },
  { id: 6, nameZh: "Patrón龙舌兰", nameEn: "Patrón Tequila", categoryZh: "烈酒", categoryEn: "Spirits", stock: 3, unit: "btl", pourCost: 22, targetCost: 20, usage7d: 6, status: "low" },
  { id: 7, nameZh: "Fever-Tree汤力水", nameEn: "Fever-Tree Tonic Water", categoryZh: "软饮", categoryEn: "Mixers", stock: 48, unit: "btl", pourCost: 8, targetCost: 10, usage7d: 60, status: "normal" },
  { id: 8, nameZh: "Sangria预调酒", nameEn: "Sangria House Blend", categoryZh: "鸡尾酒", categoryEn: "Cocktails", stock: 20, unit: "L", pourCost: 25, targetCost: 22, usage7d: 35, status: "critical" },
];

const Inventory = () => {
  const [search, setSearch] = useState("");
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  const filtered = inventory.filter((item) => {
    const name = isZh ? item.nameZh : item.nameEn;
    const cat = isZh ? item.categoryZh : item.categoryEn;
    return name.toLowerCase().includes(search.toLowerCase()) || cat.toLowerCase().includes(search.toLowerCase());
  });

  const overCostItems = inventory.filter((i) => i.pourCost > i.targetCost).length;
  const lowStockItems = inventory.filter((i) => i.status !== "normal").length;

  const statusLabel = (s: string) => s === "normal" ? t("inventoryMgmt.normal") : s === "low" ? t("inventoryMgmt.low") : t("inventoryMgmt.critical");

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">{t("inventoryMgmt.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("inventoryMgmt.subtitle")}</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs"><AlertTriangle className="w-3.5 h-3.5" /><span>{lowStockItems} {t("inventoryMgmt.stockAlerts")}</span></div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs"><TrendingDown className="w-3.5 h-3.5" /><span>{overCostItems} {t("inventoryMgmt.costOverruns")}</span></div>
        </div>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder={t("inventoryMgmt.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{t("inventoryMgmt.itemName")}</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{t("inventoryMgmt.category")}</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">{t("inventoryMgmt.stock")}</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">{t("inventoryMgmt.pourCost")}</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">{t("inventoryMgmt.targetCost")}</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">{t("inventoryMgmt.usage7d")}</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">{t("common.status")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <motion.tr key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-medium flex items-center gap-2"><Wine className="w-4 h-4 text-primary/60" />{isZh ? item.nameZh : item.nameEn}</td>
                  <td className="py-3 px-4 text-muted-foreground">{isZh ? item.categoryZh : item.categoryEn}</td>
                  <td className="py-3 px-4 text-right">{item.stock} {item.unit}</td>
                  <td className={`py-3 px-4 text-right font-semibold ${item.pourCost > item.targetCost ? "text-destructive" : "text-success"}`}>{item.pourCost}%</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{item.targetCost}%</td>
                  <td className="py-3 px-4 text-right">{item.usage7d} {item.unit}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${item.status === "normal" ? "bg-success/10 text-success" : item.status === "low" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>{statusLabel(item.status)}</span>
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
