import { useState } from "react";
import { motion } from "framer-motion";
import { Wine, AlertTriangle, TrendingDown, Search, Minus, History } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

type InventoryItem = {
  id: string;
  name_zh: string;
  name_en: string;
  category_zh: string;
  category_en: string;
  stock: number;
  unit: string;
  min_stock: number;
  pour_cost: number;
  target_cost: number;
  usage_7d: number;
  status: string;
};

type DeductionLog = {
  id: string;
  inventory_item_name: string;
  quantity: number;
  unit: string;
  reason: string;
  menu_item_name: string | null;
  created_at: string;
};

const Inventory = () => {
  const [search, setSearch] = useState("");
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const queryClient = useQueryClient();
  const [deductDialog, setDeductDialog] = useState<InventoryItem | null>(null);
  const [deductQty, setDeductQty] = useState(1);
  const [deductReason, setDeductReason] = useState("manual");
  const [logsOpen, setLogsOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["inventory-items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inventory_items").select("*").order("category_zh");
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["inventory-deductions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_deductions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as DeductionLog[];
    },
    enabled: logsOpen,
  });

  const manualDeduct = useMutation({
    mutationFn: async ({ id, qty, reason }: { id: string; qty: number; reason: string }) => {
      const { error } = await supabase.rpc("manual_deduct_inventory", {
        p_inventory_item_id: id,
        p_quantity: qty,
        p_reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-deductions"] });
      setDeductDialog(null);
      toast({ title: isZh ? "扣减成功" : "Deducted successfully" });
    },
    onError: () => toast({ title: isZh ? "扣减失败" : "Deduction failed", variant: "destructive" }),
  });

  const filtered = items.filter((item) => {
    const name = isZh ? item.name_zh : item.name_en;
    const cat = isZh ? item.category_zh : item.category_en;
    return name.toLowerCase().includes(search.toLowerCase()) || cat.toLowerCase().includes(search.toLowerCase());
  });

  const overCostItems = items.filter((i) => i.pour_cost > i.target_cost).length;
  const lowStockItems = items.filter((i) => i.status !== "normal").length;

  const statusLabel = (s: string) =>
    s === "normal" ? t("inventoryMgmt.normal") : s === "low" ? t("inventoryMgmt.low") : t("inventoryMgmt.critical");

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">{t("inventoryMgmt.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("inventoryMgmt.subtitle")}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => setLogsOpen(true)}>
            <History className="w-4 h-4 mr-1" /> {isZh ? "扣减记录" : "Deduction Log"}
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{lowStockItems} {t("inventoryMgmt.stockAlerts")}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{overCostItems} {t("inventoryMgmt.costOverruns")}</span>
          </div>
        </div>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t("inventoryMgmt.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
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
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">{isZh ? "加载中..." : "Loading..."}</td></tr>
              ) : filtered.map((item, i) => (
                <motion.tr key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-medium flex items-center gap-2">
                    <Wine className="w-4 h-4 text-primary/60" />
                    {isZh ? item.name_zh : item.name_en}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{isZh ? item.category_zh : item.category_en}</td>
                  <td className="py-3 px-4 text-right">{Number(item.stock)} {item.unit}</td>
                  <td className={`py-3 px-4 text-right font-semibold ${item.pour_cost > item.target_cost ? "text-destructive" : "text-success"}`}>{item.pour_cost}%</td>
                  <td className="py-3 px-4 text-right text-muted-foreground">{item.target_cost}%</td>
                  <td className="py-3 px-4 text-right">{Number(item.usage_7d)} {item.unit}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      item.status === "normal" ? "bg-success/10 text-success" : item.status === "low" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                    }`}>{statusLabel(item.status)}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button variant="ghost" size="sm" onClick={() => { setDeductDialog(item); setDeductQty(1); }}>
                      <Minus className="w-3.5 h-3.5 mr-1" /> {isZh ? "扣减" : "Deduct"}
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Manual Deduct Dialog */}
      <Dialog open={!!deductDialog} onOpenChange={() => setDeductDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isZh ? "手动扣减库存" : "Manual Deduction"}</DialogTitle>
          </DialogHeader>
          {deductDialog && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isZh ? deductDialog.name_zh : deductDialog.name_en} — {isZh ? "当前库存" : "Current stock"}: {Number(deductDialog.stock)} {deductDialog.unit}
              </p>
              <div>
                <Label>{isZh ? "扣减数量" : "Quantity"}</Label>
                <Input type="number" value={deductQty} min={0.1} onChange={(e) => setDeductQty(Number(e.target.value))} />
              </div>
              <div>
                <Label>{isZh ? "原因" : "Reason"}</Label>
                <Input value={deductReason} onChange={(e) => setDeductReason(e.target.value)} placeholder={isZh ? "如：盘点损耗" : "e.g. stocktake loss"} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeductDialog(null)}>{t("common.cancel")}</Button>
                <Button onClick={() => manualDeduct.mutate({ id: deductDialog.id, qty: deductQty, reason: deductReason })} disabled={manualDeduct.isPending || deductQty <= 0}>
                  {isZh ? "确认扣减" : "Confirm"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deduction Logs Dialog */}
      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isZh ? "库存扣减记录" : "Deduction History"}</DialogTitle>
          </DialogHeader>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-xs text-muted-foreground">{isZh ? "物料" : "Item"}</th>
                <th className="text-right py-2 text-xs text-muted-foreground">{isZh ? "数量" : "Qty"}</th>
                <th className="text-left py-2 text-xs text-muted-foreground">{isZh ? "原因" : "Reason"}</th>
                <th className="text-left py-2 text-xs text-muted-foreground">{isZh ? "关联菜品" : "Menu Item"}</th>
                <th className="text-left py-2 text-xs text-muted-foreground">{isZh ? "时间" : "Time"}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border/50">
                  <td className="py-2">{log.inventory_item_name}</td>
                  <td className="py-2 text-right">-{Number(log.quantity)} {log.unit}</td>
                  <td className="py-2">
                    <Badge variant="secondary" className="text-xs">
                      {log.reason === "order" ? (isZh ? "订单" : "Order") : log.reason === "manual" ? (isZh ? "手动" : "Manual") : log.reason}
                    </Badge>
                  </td>
                  <td className="py-2 text-muted-foreground">{log.menu_item_name || "-"}</td>
                  <td className="py-2 text-muted-foreground text-xs">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">{isZh ? "暂无记录" : "No records"}</td></tr>
              )}
            </tbody>
          </table>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Inventory;
