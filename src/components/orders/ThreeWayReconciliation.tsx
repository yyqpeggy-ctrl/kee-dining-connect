import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle,
  ArrowRight, RefreshCw, Download, Search, Filter, ChevronDown, ChevronUp,
  CreditCard, Building2, ShoppingCart, Zap, Eye, Check, X
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import * as XLSX from "xlsx";

interface KeruyunOrder {
  orderNo: string;
  tableNo: string;
  amount: number;
  payMethod: string;
  time: string;
  items: string;
  status: string;
}

interface LakalaTransaction {
  tradeNo: string;
  terminalNo: string;
  amount: number;
  cardType: string;
  time: string;
  status: string;
  refNo?: string;
}

interface BankEntry {
  date: string;
  description: string;
  amount: number;
  balance: number;
  counterparty: string;
  refNo?: string;
}

interface ReconciliationResult {
  id: string;
  keruyunOrder?: KeruyunOrder;
  lakalaTransaction?: LakalaTransaction;
  bankEntry?: BankEntry;
  status: "matched" | "partial" | "keruyun_only" | "lakala_only" | "bank_only" | "amount_mismatch";
  matchedAmount: number;
  difference: number;
  resolved: boolean;
  resolution?: string;
  autoPosted: boolean;
}

// Parse Excel file helper
const parseExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsBinaryString(file);
  });
};

// Mock reconciliation logic
const performReconciliation = (
  keruyun: KeruyunOrder[],
  lakala: LakalaTransaction[],
  bank: BankEntry[]
): ReconciliationResult[] => {
  const results: ReconciliationResult[] = [];
  const usedLakala = new Set<number>();
  const usedBank = new Set<number>();

  // Try to match each Keruyun order
  keruyun.forEach((ko, ki) => {
    // Find matching Lakala transaction (by amount + time proximity)
    const lakalaIdx = lakala.findIndex((lt, li) => !usedLakala.has(li) && Math.abs(lt.amount - ko.amount) < 0.01);
    const matchedLakala = lakalaIdx >= 0 ? lakala[lakalaIdx] : undefined;
    if (lakalaIdx >= 0) usedLakala.add(lakalaIdx);

    // Find matching bank entry (by amount)
    const bankIdx = bank.findIndex((be, bi) => !usedBank.has(bi) && Math.abs(be.amount - ko.amount) < 0.01);
    const matchedBank = bankIdx >= 0 ? bank[bankIdx] : undefined;
    if (bankIdx >= 0) usedBank.add(bankIdx);

    let status: ReconciliationResult["status"] = "matched";
    let difference = 0;

    if (matchedLakala && matchedBank) {
      // All three match
      if (Math.abs(ko.amount - matchedLakala.amount) > 0.01 || Math.abs(ko.amount - matchedBank.amount) > 0.01) {
        status = "amount_mismatch";
        difference = ko.amount - (matchedBank?.amount || matchedLakala?.amount || 0);
      }
    } else if (matchedLakala && !matchedBank) {
      status = "partial";
      difference = ko.amount;
    } else if (!matchedLakala && matchedBank) {
      status = "partial";
    } else {
      status = "keruyun_only";
      difference = ko.amount;
    }

    results.push({
      id: `R-${String(ki + 1).padStart(4, "0")}`,
      keruyunOrder: ko,
      lakalaTransaction: matchedLakala,
      bankEntry: matchedBank,
      status,
      matchedAmount: ko.amount,
      difference,
      resolved: status === "matched",
      autoPosted: false,
    });
  });

  // Unmatched Lakala transactions
  lakala.forEach((lt, li) => {
    if (!usedLakala.has(li)) {
      results.push({
        id: `R-L${String(li + 1).padStart(4, "0")}`,
        lakalaTransaction: lt,
        status: "lakala_only",
        matchedAmount: lt.amount,
        difference: lt.amount,
        resolved: false,
        autoPosted: false,
      });
    }
  });

  // Unmatched bank entries
  bank.forEach((be, bi) => {
    if (!usedBank.has(bi)) {
      results.push({
        id: `R-B${String(bi + 1).padStart(4, "0")}`,
        bankEntry: be,
        status: "bank_only",
        matchedAmount: be.amount,
        difference: be.amount,
        resolved: false,
        autoPosted: false,
      });
    }
  });

  return results;
};

const ThreeWayReconciliation = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const { storeName } = useStore();

  const [keruyunData, setKeruyunData] = useState<KeruyunOrder[]>([]);
  const [lakalaData, setLakalaData] = useState<LakalaTransaction[]>([]);
  const [bankData, setBankData] = useState<BankEntry[]>([]);
  const [results, setResults] = useState<ReconciliationResult[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isReconciling, setIsReconciling] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ReconciliationResult | null>(null);
  const [activeImportTab, setActiveImportTab] = useState("keruyun");

  // Demo data generators
  const loadDemoData = () => {
    const demoKeruyun: KeruyunOrder[] = [
      { orderNo: "KRY-20260220-001", tableNo: "A3", amount: 486.00, payMethod: "微信支付", time: "2026-02-20 12:35", items: "牛排套餐x2, 红酒x1, 甜品x2", status: "completed" },
      { orderNo: "KRY-20260220-002", tableNo: "B1", amount: 328.00, payMethod: "支付宝", time: "2026-02-20 13:10", items: "商务午餐x4", status: "completed" },
      { orderNo: "KRY-20260220-003", tableNo: "C5", amount: 1250.00, payMethod: "银行卡", time: "2026-02-20 19:00", items: "包间晚宴x8", status: "completed" },
      { orderNo: "KRY-20260220-004", tableNo: "A1", amount: 156.00, payMethod: "微信支付", time: "2026-02-20 12:50", items: "午市套餐x2", status: "completed" },
      { orderNo: "KRY-20260220-005", tableNo: "B3", amount: 892.00, payMethod: "银行卡", time: "2026-02-20 20:15", items: "鱼生拼盘x1, 清酒套餐x2, 刺身x3", status: "completed" },
      { orderNo: "KRY-20260220-006", tableNo: "A5", amount: 220.00, payMethod: "现金", time: "2026-02-20 14:30", items: "下午茶套餐x2, 蛋糕x1", status: "completed" },
      { orderNo: "KRY-20260220-007", tableNo: "C2", amount: 568.00, payMethod: "微信支付", time: "2026-02-20 19:45", items: "双人晚餐x1, 香槟x1", status: "completed" },
      { orderNo: "KRY-20260220-008", tableNo: "B5", amount: 95.00, payMethod: "支付宝", time: "2026-02-20 15:20", items: "咖啡x2, 三明治x1", status: "completed" },
    ];

    const demoLakala: LakalaTransaction[] = [
      { tradeNo: "LKL-7892001", terminalNo: "T-001", amount: 486.00, cardType: "微信", time: "2026-02-20 12:36", status: "success" },
      { tradeNo: "LKL-7892002", terminalNo: "T-001", amount: 328.00, cardType: "支付宝", time: "2026-02-20 13:11", status: "success" },
      { tradeNo: "LKL-7892003", terminalNo: "T-002", amount: 1250.00, cardType: "银联", time: "2026-02-20 19:02", status: "success" },
      { tradeNo: "LKL-7892004", terminalNo: "T-001", amount: 156.00, cardType: "微信", time: "2026-02-20 12:51", status: "success" },
      { tradeNo: "LKL-7892005", terminalNo: "T-002", amount: 890.00, cardType: "银联", time: "2026-02-20 20:18", status: "success" }, // amount mismatch!
      // No match for A5 cash order
      { tradeNo: "LKL-7892006", terminalNo: "T-001", amount: 568.00, cardType: "微信", time: "2026-02-20 19:46", status: "success" },
      { tradeNo: "LKL-7892007", terminalNo: "T-001", amount: 95.00, cardType: "支付宝", time: "2026-02-20 15:21", status: "success" },
      { tradeNo: "LKL-7892008", terminalNo: "T-003", amount: 350.00, cardType: "微信", time: "2026-02-20 21:00", status: "success" }, // extra, no keruyun match
    ];

    const demoBank: BankEntry[] = [
      { date: "2026-02-21", description: "微信支付结算", amount: 486.00, balance: 125486.00, counterparty: "财付通" },
      { date: "2026-02-21", description: "支付宝结算", amount: 328.00, balance: 125814.00, counterparty: "支付宝" },
      { date: "2026-02-21", description: "银联POS结算", amount: 1250.00, balance: 127064.00, counterparty: "银联商务" },
      { date: "2026-02-21", description: "微信支付结算", amount: 156.00, balance: 127220.00, counterparty: "财付通" },
      { date: "2026-02-21", description: "银联POS结算", amount: 890.00, balance: 128110.00, counterparty: "银联商务" },
      { date: "2026-02-21", description: "微信支付结算", amount: 568.00, balance: 128678.00, counterparty: "财付通" },
      { date: "2026-02-21", description: "支付宝结算", amount: 95.00, balance: 128773.00, counterparty: "支付宝" },
      { date: "2026-02-21", description: "微信支付结算", amount: 350.00, balance: 129123.00, counterparty: "财付通" },
    ];

    setKeruyunData(demoKeruyun);
    setLakalaData(demoLakala);
    setBankData(demoBank);
    toast.success(isZh ? "演示数据已加载" : "Demo data loaded");
  };

  const handleFileUpload = async (source: "keruyun" | "lakala" | "bank", file: File) => {
    try {
      const data = await parseExcel(file);
      if (source === "keruyun") {
        const parsed: KeruyunOrder[] = data.map((row: any) => ({
          orderNo: row["订单号"] || row["orderNo"] || row["order_no"] || "",
          tableNo: row["桌号"] || row["tableNo"] || row["table_no"] || "",
          amount: parseFloat(row["金额"] || row["amount"] || row["total"] || 0),
          payMethod: row["支付方式"] || row["payMethod"] || row["pay_method"] || "",
          time: row["时间"] || row["time"] || row["order_time"] || "",
          items: row["菜品"] || row["items"] || row["menu_items"] || "",
          status: row["状态"] || row["status"] || "completed",
        }));
        setKeruyunData(parsed);
        toast.success(isZh ? `客如云数据导入成功：${parsed.length} 条` : `Keruyun imported: ${parsed.length} records`);
      } else if (source === "lakala") {
        const parsed: LakalaTransaction[] = data.map((row: any) => ({
          tradeNo: row["交易号"] || row["tradeNo"] || row["trade_no"] || "",
          terminalNo: row["终端号"] || row["terminalNo"] || row["terminal_no"] || "",
          amount: parseFloat(row["金额"] || row["amount"] || row["trade_amount"] || 0),
          cardType: row["卡类型"] || row["cardType"] || row["card_type"] || "",
          time: row["时间"] || row["time"] || row["trade_time"] || "",
          status: row["状态"] || row["status"] || "success",
          refNo: row["参考号"] || row["refNo"] || row["ref_no"] || "",
        }));
        setLakalaData(parsed);
        toast.success(isZh ? `拉卡拉数据导入成功：${parsed.length} 条` : `Lakala imported: ${parsed.length} records`);
      } else {
        const parsed: BankEntry[] = data.map((row: any) => ({
          date: row["日期"] || row["date"] || row["trade_date"] || "",
          description: row["摘要"] || row["description"] || row["memo"] || "",
          amount: parseFloat(row["贷方金额"] || row["收入"] || row["amount"] || row["credit"] || 0),
          balance: parseFloat(row["余额"] || row["balance"] || 0),
          counterparty: row["对方户名"] || row["counterparty"] || row["payer"] || "",
          refNo: row["参考号"] || row["refNo"] || row["ref_no"] || "",
        }));
        setBankData(parsed);
        toast.success(isZh ? `银行明细导入成功：${parsed.length} 条` : `Bank data imported: ${parsed.length} records`);
      }
    } catch {
      toast.error(isZh ? "文件解析失败，请检查格式" : "File parsing failed");
    }
  };

  const runReconciliation = () => {
    if (keruyunData.length === 0 && lakalaData.length === 0 && bankData.length === 0) {
      toast.error(isZh ? "请先导入至少一个数据源" : "Import at least one data source first");
      return;
    }
    setIsReconciling(true);
    setTimeout(() => {
      const res = performReconciliation(keruyunData, lakalaData, bankData);
      setResults(res);
      setIsReconciling(false);
      const matched = res.filter(r => r.status === "matched").length;
      toast.success(isZh ? `核对完成！${matched}/${res.length} 笔完全匹配` : `Done! ${matched}/${res.length} fully matched`);
    }, 1500);
  };

  const resolveItem = (id: string, resolution: string) => {
    setResults(prev => prev.map(r => r.id === id ? { ...r, resolved: true, resolution } : r));
    toast.success(isZh ? "差异已标记解决" : "Discrepancy resolved");
  };

  const autoPostResolved = async () => {
    const resolved = results.filter(r => r.resolved && !r.autoPosted);
    if (resolved.length === 0) {
      toast.info(isZh ? "没有可入账的记录" : "No records to post");
      return;
    }

    // Create finance transactions for resolved items
    const transactions = resolved.map(r => ({
      type: "income" as const,
      category: "revenue",
      amount: r.matchedAmount,
      debit_account: "银行存款",
      credit_account: "主营业务收入",
      description_zh: `三方核对入账 - ${r.keruyunOrder?.orderNo || r.lakalaTransaction?.tradeNo || "银行入账"}`,
      description_en: `Reconciled - ${r.keruyunOrder?.orderNo || r.lakalaTransaction?.tradeNo || "Bank entry"}`,
      payment_method: r.keruyunOrder?.payMethod || r.lakalaTransaction?.cardType || "bank_transfer",
      status: "reviewed",
      notes: r.resolution || "三方核对自动入账",
      store_id: "",
      store_name_zh: "",
      store_name_en: "",
    }));

    const { error } = await supabase.from("finance_transactions").insert(transactions);
    if (error) {
      toast.error(isZh ? "入账失败" : "Posting failed");
      return;
    }

    setResults(prev => prev.map(r => r.resolved ? { ...r, autoPosted: true } : r));
    toast.success(isZh ? `${resolved.length} 笔已自动入账至财务系统` : `${resolved.length} entries posted to finance`);
  };

  const getStatusBadge = (status: ReconciliationResult["status"]) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      matched: { label: isZh ? "✓ 三方一致" : "✓ Matched", variant: "default", className: "bg-success/10 text-success border-success/20" },
      partial: { label: isZh ? "部分匹配" : "Partial", variant: "secondary", className: "bg-warning/10 text-warning border-warning/20" },
      amount_mismatch: { label: isZh ? "金额不符" : "Amount Diff", variant: "destructive", className: "bg-destructive/10 text-destructive border-destructive/20" },
      keruyun_only: { label: isZh ? "仅客如云" : "Keruyun Only", variant: "outline", className: "bg-info/10 text-info border-info/20" },
      lakala_only: { label: isZh ? "仅拉卡拉" : "Lakala Only", variant: "outline", className: "bg-primary/10 text-primary border-primary/20" },
      bank_only: { label: isZh ? "仅银行" : "Bank Only", variant: "outline", className: "bg-muted text-muted-foreground" },
    };
    const c = config[status];
    return <Badge className={`text-[10px] ${c.className}`}>{c.label}</Badge>;
  };

  const filteredResults = results.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (
        r.keruyunOrder?.orderNo.toLowerCase().includes(s) ||
        r.lakalaTransaction?.tradeNo.toLowerCase().includes(s) ||
        r.bankEntry?.description.toLowerCase().includes(s) ||
        r.id.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const stats = {
    total: results.length,
    matched: results.filter(r => r.status === "matched").length,
    partial: results.filter(r => r.status === "partial").length,
    mismatch: results.filter(r => r.status === "amount_mismatch").length,
    unmatched: results.filter(r => ["keruyun_only", "lakala_only", "bank_only"].includes(r.status)).length,
    resolved: results.filter(r => r.resolved).length,
    posted: results.filter(r => r.autoPosted).length,
    totalAmount: results.reduce((s, r) => s + r.matchedAmount, 0),
  };

  return (
    <div className="space-y-5">
      {/* Import Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              {isZh ? "数据导入" : "Data Import"}
            </CardTitle>
            <Button size="sm" variant="outline" onClick={loadDemoData} className="text-xs gap-1">
              <Zap className="w-3.5 h-3.5" />{isZh ? "加载演示数据" : "Load Demo"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Keruyun Import */}
            <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${keruyunData.length > 0 ? "border-success/50 bg-success/5" : "border-border hover:border-primary/50"}`}>
              <ShoppingCart className={`w-8 h-8 mx-auto mb-2 ${keruyunData.length > 0 ? "text-success" : "text-muted-foreground"}`} />
              <p className="text-sm font-medium mb-1">{isZh ? "客如云点单" : "Keruyun Orders"}</p>
              {keruyunData.length > 0 ? (
                <p className="text-xs text-success font-medium">{keruyunData.length} {isZh ? "条已导入" : "imported"} ✓</p>
              ) : (
                <p className="text-[10px] text-muted-foreground mb-2">{isZh ? "支持 Excel/CSV 格式" : "Excel/CSV supported"}</p>
              )}
              <label className="cursor-pointer">
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload("keruyun", e.target.files[0])} />
                <Button size="sm" variant="outline" className="text-xs mt-1" asChild><span>{keruyunData.length > 0 ? (isZh ? "重新导入" : "Re-import") : (isZh ? "导入文件" : "Import")}</span></Button>
              </label>
            </div>

            {/* Lakala Import */}
            <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${lakalaData.length > 0 ? "border-success/50 bg-success/5" : "border-border hover:border-primary/50"}`}>
              <CreditCard className={`w-8 h-8 mx-auto mb-2 ${lakalaData.length > 0 ? "text-success" : "text-muted-foreground"}`} />
              <p className="text-sm font-medium mb-1">{isZh ? "拉卡拉收银" : "Lakala POS"}</p>
              {lakalaData.length > 0 ? (
                <p className="text-xs text-success font-medium">{lakalaData.length} {isZh ? "条已导入" : "imported"} ✓</p>
              ) : (
                <p className="text-[10px] text-muted-foreground mb-2">{isZh ? "支持 Excel/CSV 格式" : "Excel/CSV supported"}</p>
              )}
              <label className="cursor-pointer">
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload("lakala", e.target.files[0])} />
                <Button size="sm" variant="outline" className="text-xs mt-1" asChild><span>{lakalaData.length > 0 ? (isZh ? "重新导入" : "Re-import") : (isZh ? "导入文件" : "Import")}</span></Button>
              </label>
            </div>

            {/* Bank Import */}
            <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${bankData.length > 0 ? "border-success/50 bg-success/5" : "border-border hover:border-primary/50"}`}>
              <Building2 className={`w-8 h-8 mx-auto mb-2 ${bankData.length > 0 ? "text-success" : "text-muted-foreground"}`} />
              <p className="text-sm font-medium mb-1">{isZh ? "银行入账明细" : "Bank Statement"}</p>
              {bankData.length > 0 ? (
                <p className="text-xs text-success font-medium">{bankData.length} {isZh ? "条已导入" : "imported"} ✓</p>
              ) : (
                <p className="text-[10px] text-muted-foreground mb-2">{isZh ? "支持 Excel/CSV 格式" : "Excel/CSV supported"}</p>
              )}
              <label className="cursor-pointer">
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload("bank", e.target.files[0])} />
                <Button size="sm" variant="outline" className="text-xs mt-1" asChild><span>{bankData.length > 0 ? (isZh ? "重新导入" : "Re-import") : (isZh ? "导入文件" : "Import")}</span></Button>
              </label>
            </div>
          </div>

          {/* Reconcile Button */}
          <div className="flex items-center justify-center mt-5">
            <Button
              onClick={runReconciliation}
              disabled={isReconciling || (keruyunData.length === 0 && lakalaData.length === 0 && bankData.length === 0)}
              className="gap-2 px-6"
            >
              {isReconciling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {isReconciling ? (isZh ? "核对中..." : "Reconciling...") : (isZh ? "开始三方核对" : "Start Reconciliation")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-success" /></div>
                <div><p className="text-2xl font-bold">{stats.matched}</p><p className="text-xs text-muted-foreground">{isZh ? "三方一致" : "Fully Matched"}</p></div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-warning" /></div>
                <div><p className="text-2xl font-bold">{stats.mismatch + stats.partial}</p><p className="text-xs text-muted-foreground">{isZh ? "差异待处理" : "Discrepancies"}</p></div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><FileSpreadsheet className="w-4 h-4 text-primary" /></div>
                <div><p className="text-2xl font-bold">¥{stats.totalAmount.toLocaleString()}</p><p className="text-xs text-muted-foreground">{isZh ? "核对总金额" : "Total Amount"}</p></div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center"><Zap className="w-4 h-4 text-info" /></div>
                <div><p className="text-2xl font-bold">{stats.posted}/{stats.resolved}</p><p className="text-xs text-muted-foreground">{isZh ? "已入账/已解决" : "Posted/Resolved"}</p></div>
              </div>
            </motion.div>
          </div>

          {/* Alerts */}
          {(stats.mismatch > 0 || stats.unmatched > 0) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-warning/5 border border-warning/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                <div className="text-xs space-y-0.5">
                  {stats.mismatch > 0 && <p className="text-warning font-medium">⚠️ {stats.mismatch} {isZh ? "笔金额不一致，需人工确认" : "amount mismatches need review"}</p>}
                  {stats.unmatched > 0 && <p className="text-muted-foreground">{stats.unmatched} {isZh ? "笔仅出现在单一数据源中" : "entries found in only one source"}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* Result Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  {isZh ? "核对明细" : "Reconciliation Details"} ({filteredResults.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input placeholder={isZh ? "搜索..." : "Search..."} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 h-8 text-xs w-40" />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isZh ? "全部" : "All"}</SelectItem>
                      <SelectItem value="matched">{isZh ? "三方一致" : "Matched"}</SelectItem>
                      <SelectItem value="amount_mismatch">{isZh ? "金额不符" : "Mismatch"}</SelectItem>
                      <SelectItem value="partial">{isZh ? "部分匹配" : "Partial"}</SelectItem>
                      <SelectItem value="keruyun_only">{isZh ? "仅客如云" : "Keruyun Only"}</SelectItem>
                      <SelectItem value="lakala_only">{isZh ? "仅拉卡拉" : "Lakala Only"}</SelectItem>
                      <SelectItem value="bank_only">{isZh ? "仅银行" : "Bank Only"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={autoPostResolved} className="text-xs gap-1 h-8" disabled={stats.resolved === stats.posted}>
                    <Zap className="w-3.5 h-3.5" />{isZh ? "确认入账" : "Auto Post"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-[80px]">ID</TableHead>
                      <TableHead className="text-xs">{isZh ? "客如云订单" : "Keruyun"}</TableHead>
                      <TableHead className="text-xs">{isZh ? "拉卡拉流水" : "Lakala"}</TableHead>
                      <TableHead className="text-xs">{isZh ? "银行入账" : "Bank"}</TableHead>
                      <TableHead className="text-xs text-right">{isZh ? "金额" : "Amount"}</TableHead>
                      <TableHead className="text-xs text-right">{isZh ? "差异" : "Diff"}</TableHead>
                      <TableHead className="text-xs text-center">{isZh ? "状态" : "Status"}</TableHead>
                      <TableHead className="text-xs text-center">{isZh ? "操作" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((r, i) => (
                      <motion.tr key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                        className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${r.autoPosted ? "bg-success/5" : r.status === "amount_mismatch" ? "bg-destructive/5" : ""}`}>
                        <TableCell className="text-xs font-mono text-muted-foreground">{r.id}</TableCell>
                        <TableCell className="text-xs">
                          {r.keruyunOrder ? (
                            <div><p className="font-medium">{r.keruyunOrder.orderNo}</p><p className="text-[10px] text-muted-foreground">{r.keruyunOrder.tableNo} · {r.keruyunOrder.payMethod}</p></div>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.lakalaTransaction ? (
                            <div><p className="font-medium">{r.lakalaTransaction.tradeNo}</p><p className="text-[10px] text-muted-foreground">{r.lakalaTransaction.terminalNo} · {r.lakalaTransaction.cardType}</p></div>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.bankEntry ? (
                            <div><p className="font-medium truncate max-w-[120px]">{r.bankEntry.description}</p><p className="text-[10px] text-muted-foreground">{r.bankEntry.date}</p></div>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium">¥{r.matchedAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-right">
                          {r.difference !== 0 ? (
                            <span className="text-destructive font-medium">¥{r.difference.toFixed(2)}</span>
                          ) : <span className="text-success">—</span>}
                        </TableCell>
                        <TableCell className="text-center">{getStatusBadge(r.status)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {r.autoPosted ? (
                              <Badge className="bg-success/10 text-success border-success/20 text-[9px]">{isZh ? "已入账" : "Posted"}</Badge>
                            ) : r.resolved ? (
                              <Badge className="bg-info/10 text-info border-info/20 text-[9px]">{isZh ? "已解决" : "Resolved"}</Badge>
                            ) : r.status === "matched" ? (
                              <Badge className="bg-success/10 text-success border-success/20 text-[9px]">{isZh ? "待入账" : "Ready"}</Badge>
                            ) : (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => setSelectedResult(r)}>
                                    {isZh ? "处理" : "Resolve"}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg">
                                  <DialogHeader>
                                    <DialogTitle className="text-base">{isZh ? "差异处理" : "Resolve Discrepancy"} — {r.id}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                      <div className={`p-2 rounded border ${r.keruyunOrder ? "border-success/30 bg-success/5" : "border-border bg-muted/20"}`}>
                                        <p className="font-medium text-[10px] text-muted-foreground mb-1">{isZh ? "客如云" : "Keruyun"}</p>
                                        {r.keruyunOrder ? (
                                          <><p className="font-medium">{r.keruyunOrder.orderNo}</p><p>¥{r.keruyunOrder.amount.toFixed(2)}</p><p className="text-[10px] text-muted-foreground">{r.keruyunOrder.items}</p></>
                                        ) : <p className="text-muted-foreground">{isZh ? "无记录" : "No record"}</p>}
                                      </div>
                                      <div className={`p-2 rounded border ${r.lakalaTransaction ? "border-success/30 bg-success/5" : "border-border bg-muted/20"}`}>
                                        <p className="font-medium text-[10px] text-muted-foreground mb-1">{isZh ? "拉卡拉" : "Lakala"}</p>
                                        {r.lakalaTransaction ? (
                                          <><p className="font-medium">{r.lakalaTransaction.tradeNo}</p><p>¥{r.lakalaTransaction.amount.toFixed(2)}</p><p className="text-[10px] text-muted-foreground">{r.lakalaTransaction.cardType}</p></>
                                        ) : <p className="text-muted-foreground">{isZh ? "无记录" : "No record"}</p>}
                                      </div>
                                      <div className={`p-2 rounded border ${r.bankEntry ? "border-success/30 bg-success/5" : "border-border bg-muted/20"}`}>
                                        <p className="font-medium text-[10px] text-muted-foreground mb-1">{isZh ? "银行" : "Bank"}</p>
                                        {r.bankEntry ? (
                                          <><p className="font-medium truncate">{r.bankEntry.description}</p><p>¥{r.bankEntry.amount.toFixed(2)}</p><p className="text-[10px] text-muted-foreground">{r.bankEntry.counterparty}</p></>
                                        ) : <p className="text-muted-foreground">{isZh ? "无记录" : "No record"}</p>}
                                      </div>
                                    </div>

                                    {r.difference !== 0 && (
                                      <div className="bg-destructive/5 border border-destructive/20 rounded p-2">
                                        <p className="text-xs text-destructive font-medium">{isZh ? "差异金额" : "Difference"}: ¥{r.difference.toFixed(2)}</p>
                                      </div>
                                    )}

                                    <div className="space-y-2">
                                      <p className="text-xs font-medium">{isZh ? "选择处理方式：" : "Resolution:"}</p>
                                      <div className="grid grid-cols-1 gap-2">
                                        <Button variant="outline" size="sm" className="justify-start text-xs h-8 gap-2" onClick={() => resolveItem(r.id, isZh ? "确认以客如云金额为准" : "Use Keruyun amount")}>
                                          <Check className="w-3.5 h-3.5 text-success" />{isZh ? "以客如云金额为准" : "Use Keruyun amount"}
                                        </Button>
                                        <Button variant="outline" size="sm" className="justify-start text-xs h-8 gap-2" onClick={() => resolveItem(r.id, isZh ? "确认以银行金额为准" : "Use bank amount")}>
                                          <Check className="w-3.5 h-3.5 text-success" />{isZh ? "以银行实际入账为准" : "Use bank amount"}
                                        </Button>
                                        <Button variant="outline" size="sm" className="justify-start text-xs h-8 gap-2" onClick={() => resolveItem(r.id, isZh ? "手续费差异，正常" : "Fee difference, normal")}>
                                          <Check className="w-3.5 h-3.5 text-info" />{isZh ? "支付手续费差异（正常扣减）" : "Payment fee difference (normal)"}
                                        </Button>
                                        <Button variant="outline" size="sm" className="justify-start text-xs h-8 gap-2" onClick={() => resolveItem(r.id, isZh ? "现金收款未走POS" : "Cash, no POS")}>
                                          <Check className="w-3.5 h-3.5 text-warning" />{isZh ? "现金收款（未过POS）" : "Cash payment (no POS)"}
                                        </Button>
                                        <Button variant="outline" size="sm" className="justify-start text-xs h-8 gap-2 text-destructive" onClick={() => resolveItem(r.id, isZh ? "标记异常待查" : "Flag for investigation")}>
                                          <AlertTriangle className="w-3.5 h-3.5" />{isZh ? "标记异常，待进一步调查" : "Flag for investigation"}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ThreeWayReconciliation;
