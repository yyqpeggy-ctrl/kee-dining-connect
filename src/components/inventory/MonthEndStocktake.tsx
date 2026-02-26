import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  FileSpreadsheet, Upload, CheckCircle, AlertTriangle, Download,
  Calculator, ClipboardCheck, ArrowRightLeft, BarChart3
} from "lucide-react";
import * as XLSX from "xlsx";

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

type StocktakeRow = {
  name: string;
  systemQty: number;
  physicalQty: number;
  unit: string;
  variance: number;
  variancePct: number;
  status: "match" | "within_tolerance" | "over_tolerance";
  category: string;
};

const TOLERANCE_PCT = 5;

const MonthEndStocktake = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const queryClient = useQueryClient();

  const [importedData, setImportedData] = useState<StocktakeRow[] | null>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [importing, setImporting] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["inventory-items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inventory_items").select("*").order("category_zh");
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  // Generate system report
  const systemReport = useMemo(() => {
    const categories = new Map<string, { items: InventoryItem[]; totalValue: number }>();
    items.forEach((item) => {
      const cat = isZh ? item.category_zh : item.category_en;
      if (!categories.has(cat)) categories.set(cat, { items: [], totalValue: 0 });
      const c = categories.get(cat)!;
      c.items.push(item);
    });
    return categories;
  }, [items, isZh]);

  // Export system inventory report
  const handleExportSystemReport = () => {
    const rows = items.map((item) => ({
      [isZh ? "物料名称" : "Item Name"]: isZh ? item.name_zh : item.name_en,
      [isZh ? "类别" : "Category"]: isZh ? item.category_zh : item.category_en,
      [isZh ? "系统库存" : "System Stock"]: Number(item.stock),
      [isZh ? "单位" : "Unit"]: item.unit,
      [isZh ? "实际盘点" : "Physical Count"]: "",
      [isZh ? "备注" : "Notes"]: "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isZh ? "月末盘点" : "Stocktake");
    const month = new Date().toISOString().slice(0, 7);
    XLSX.writeFile(wb, `stocktake-template-${month}.xlsx`);
    toast({ title: isZh ? "盘点模板已导出" : "Stocktake template exported" });
  };

  // Import physical count Excel
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        const nameKey = Object.keys(raw[0] || {}).find(k =>
          k.includes("物料") || k.includes("Item") || k.includes("name")
        ) || Object.keys(raw[0] || {})[0];

        const physicalKey = Object.keys(raw[0] || {}).find(k =>
          k.includes("实际") || k.includes("Physical") || k.includes("count") || k.includes("盘点")
        );

        if (!physicalKey) {
          toast({ title: isZh ? "未找到实际盘点列" : "Physical count column not found", variant: "destructive" });
          setImporting(false);
          return;
        }

        const results: StocktakeRow[] = [];
        raw.forEach((row) => {
          const name = String(row[nameKey] || "").trim();
          const physicalQty = Number(row[physicalKey] || 0);
          if (!name) return;

          const sysItem = items.find(
            (i) => i.name_zh === name || i.name_en === name
          );
          const systemQty = sysItem ? Number(sysItem.stock) : 0;
          const variance = physicalQty - systemQty;
          const variancePct = systemQty > 0 ? Math.abs(variance / systemQty) * 100 : physicalQty > 0 ? 100 : 0;

          results.push({
            name,
            systemQty,
            physicalQty,
            unit: sysItem?.unit || "",
            variance,
            variancePct,
            status: variancePct <= 1 ? "match" : variancePct <= TOLERANCE_PCT ? "within_tolerance" : "over_tolerance",
            category: sysItem ? (isZh ? sysItem.category_zh : sysItem.category_en) : "",
          });
        });

        setImportedData(results);
        toast({ title: isZh ? `已导入 ${results.length} 条盘点数据` : `Imported ${results.length} stocktake records` });
      } catch {
        toast({ title: isZh ? "文件解析失败" : "Failed to parse file", variant: "destructive" });
      }
      setImporting(false);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const overToleranceCount = importedData?.filter((r) => r.status === "over_tolerance").length || 0;
  const allWithinTolerance = importedData && overToleranceCount === 0;

  // Confirm stocktake: update system stock to physical, create finance transaction
  const confirmStocktake = useMutation({
    mutationFn: async () => {
      if (!importedData) throw new Error("No data");

      // Update each inventory item's stock to physical count
      for (const row of importedData) {
        const sysItem = items.find((i) => i.name_zh === row.name || i.name_en === row.name);
        if (!sysItem) continue;

        await supabase
          .from("inventory_items")
          .update({ stock: row.physicalQty, updated_at: new Date().toISOString() })
          .eq("id", sysItem.id);
      }

      // Calculate total cost of goods consumed this month (system usage)
      // COGS = Opening Stock (already tracked) - Closing Stock (physical) + Purchases (from procurement)
      const totalSystemStock = importedData.reduce((s, r) => s + r.systemQty, 0);
      const totalPhysicalStock = importedData.reduce((s, r) => s + r.physicalQty, 0);
      const adjustmentAmount = Math.abs(totalSystemStock - totalPhysicalStock);

      if (adjustmentAmount > 0) {
        // Create inventory adjustment transaction per Cambridge accounting
        const month = new Date().toISOString().slice(0, 7);
        const isLoss = totalPhysicalStock < totalSystemStock;

        await supabase.from("finance_transactions").insert({
          type: "expense",
          category: "inventory_adjustment",
          amount: adjustmentAmount,
          debit_account: isLoss ? "库存盘亏损失" : "库存商品",
          credit_account: isLoss ? "库存商品" : "库存盘盈收益",
          description_zh: `${month} 月末盘点库存调整 (${isLoss ? "盘亏" : "盘盈"})`,
          description_en: `${month} Month-end stocktake adjustment (${isLoss ? "loss" : "gain"})`,
          status: "reviewed",
          notes: `${isZh ? "盘点确认" : "Stocktake confirmed"}: ${importedData.length} items, ${overToleranceCount} over tolerance`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      setConfirmDialog(false);
      setImportedData(null);
      toast({ title: isZh ? "月末盘点已确认，库存和成本已入账" : "Stocktake confirmed, inventory and costs posted" });
    },
    onError: () => {
      toast({ title: isZh ? "确认失败" : "Confirmation failed", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">{isZh ? "月末盘点对账" : "Month-End Stocktake"}</h3>
          <Badge variant="outline" className="text-xs">{isZh ? "Cambridge会计准则" : "Cambridge Accounting"}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportSystemReport}>
            <Download className="w-4 h-4 mr-1" /> {isZh ? "导出系统库存表" : "Export System Report"}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <label className="cursor-pointer">
              <Upload className="w-4 h-4 mr-1" /> {isZh ? "导入实际盘点表" : "Import Physical Count"}
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportExcel} disabled={importing} />
            </label>
          </Button>
        </div>
      </div>

      {/* Accounting Flow Explanation */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-primary mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium">{isZh ? "库存会计流程 (Cambridge标准)" : "Inventory Accounting Flow (Cambridge Standard)"}</p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded">
                1. {isZh ? "采购入库 → 借:库存商品 / 贷:银行存款" : "Purchase → Dr: Inventory / Cr: Bank"}
              </span>
              <ArrowRightLeft className="w-3 h-3 self-center text-muted-foreground" />
              <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded">
                2. {isZh ? "订单耗用 → 借:营业成本 / 贷:库存商品" : "Usage → Dr: COGS / Cr: Inventory"}
              </span>
              <ArrowRightLeft className="w-3 h-3 self-center text-muted-foreground" />
              <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded">
                3. {isZh ? "月末盘点 → 系统 vs 实盘 对比 (±5%)" : "Stocktake → System vs Physical (±5%)"}
              </span>
              <ArrowRightLeft className="w-3 h-3 self-center text-muted-foreground" />
              <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded">
                4. {isZh ? "确认入账 → 成本结转 + 差异调整" : "Confirm → Cost posting + Variance adjustment"}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* System Inventory Summary */}
      {!importedData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              {isZh ? "当前系统库存汇总" : "Current System Inventory Summary"}
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{isZh ? "类别" : "Category"}</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">{isZh ? "品种数" : "Items"}</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">{isZh ? "总库存" : "Total Stock"}</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">{isZh ? "状态" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(systemReport.entries()).map(([cat, data]) => {
                  const lowCount = data.items.filter(i => i.status !== "normal").length;
                  return (
                    <tr key={cat} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-3 px-4 font-medium">{cat}</td>
                      <td className="py-3 px-4 text-right">{data.items.length}</td>
                      <td className="py-3 px-4 text-right">{data.items.reduce((s, i) => s + Number(i.stock), 0).toFixed(1)}</td>
                      <td className="py-3 px-4 text-center">
                        {lowCount > 0 ? (
                          <Badge variant="destructive" className="text-[10px]">{lowCount} {isZh ? "低库存" : "low"}</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] bg-success/10 text-success">{isZh ? "正常" : "OK"}</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-muted/10 text-xs text-muted-foreground text-center">
            {isZh
              ? "请先导出系统库存表 → 打印给门店人员盘点 → 填入实际数量后导入Excel进行对比"
              : "Export system report → Print for physical count → Fill actual quantities → Import Excel to compare"}
          </div>
        </motion.div>
      )}

      {/* Comparison Results */}
      {importedData && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              {isZh ? "系统 vs 实盘 对比结果" : "System vs Physical Comparison"}
            </h4>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">
                {importedData.length} {isZh ? "项" : "items"}
              </Badge>
              {allWithinTolerance ? (
                <Badge className="text-xs bg-success/10 text-success border-success/20">
                  <CheckCircle className="w-3 h-3 mr-1" /> {isZh ? "全部在±5%以内" : "All within ±5%"}
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" /> {overToleranceCount} {isZh ? "项超差" : "over tolerance"}
                </Badge>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{isZh ? "物料" : "Item"}</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{isZh ? "类别" : "Category"}</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">{isZh ? "系统库存" : "System"}</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">{isZh ? "实际盘点" : "Physical"}</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">{isZh ? "差异" : "Variance"}</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">{isZh ? "差异率" : "Var %"}</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">{isZh ? "状态" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {importedData.map((row, i) => (
                  <tr key={i} className={`border-b border-border/50 ${row.status === "over_tolerance" ? "bg-destructive/5" : "hover:bg-muted/20"}`}>
                    <td className="py-2.5 px-4 font-medium">{row.name}</td>
                    <td className="py-2.5 px-4 text-muted-foreground text-xs">{row.category}</td>
                    <td className="py-2.5 px-4 text-right">{row.systemQty} {row.unit}</td>
                    <td className="py-2.5 px-4 text-right font-semibold">{row.physicalQty} {row.unit}</td>
                    <td className={`py-2.5 px-4 text-right font-semibold ${row.variance < 0 ? "text-destructive" : row.variance > 0 ? "text-success" : ""}`}>
                      {row.variance > 0 ? "+" : ""}{row.variance.toFixed(1)}
                    </td>
                    <td className={`py-2.5 px-4 text-right ${row.variancePct > TOLERANCE_PCT ? "text-destructive font-bold" : ""}`}>
                      {row.variancePct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        row.status === "match" ? "bg-success/10 text-success"
                        : row.status === "within_tolerance" ? "bg-warning/10 text-warning"
                        : "bg-destructive/10 text-destructive"
                      }`}>
                        {row.status === "match" ? (isZh ? "一致" : "Match")
                          : row.status === "within_tolerance" ? (isZh ? "容差内" : "OK")
                          : (isZh ? "超差" : "Over")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-border flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setImportedData(null)}>
              {isZh ? "取消" : "Cancel"}
            </Button>
            <div className="flex gap-2">
              {overToleranceCount > 0 && (
                <p className="text-xs text-destructive self-center mr-2">
                  {isZh ? `${overToleranceCount}项超过±5%容差，请复核后再确认` : `${overToleranceCount} items over ±5%, please recheck`}
                </p>
              )}
              <Button
                onClick={() => setConfirmDialog(true)}
                disabled={!allWithinTolerance}
                className="gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                {isZh ? "确认盘点并入账" : "Confirm & Post"}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isZh ? "确认月末盘点入账" : "Confirm Month-End Stocktake"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {isZh
                ? "确认后将执行以下操作："
                : "The following actions will be performed:"}
            </p>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5" />
                {isZh ? "更新系统库存为实际盘点数量" : "Update system stock to physical counts"}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5" />
                {isZh ? "自动生成库存差异调整凭证 (盘亏/盘盈)" : "Auto-generate inventory adjustment voucher (loss/gain)"}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5" />
                {isZh ? "月末库存成本结转入账" : "Month-end inventory cost posting"}
              </li>
            </ul>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setConfirmDialog(false)}>{isZh ? "取消" : "Cancel"}</Button>
              <Button onClick={() => confirmStocktake.mutate()} disabled={confirmStocktake.isPending}>
                {confirmStocktake.isPending ? (isZh ? "处理中..." : "Processing...") : (isZh ? "确认入账" : "Confirm")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonthEndStocktake;
