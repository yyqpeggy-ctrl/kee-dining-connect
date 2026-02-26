import { motion } from "framer-motion";
import { Plus, Search, Filter, FileText, Download, Upload, PackageCheck, FileSpreadsheet, Receipt, Trash2, Copy } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { journalEntries, getAccountSummary, StoreId, JournalEntry } from "@/data/financeData";
import { useStore } from "@/contexts/StoreContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  exportVouchersForYiqi,
  exportTrialBalance,
  exportInputInvoices,
  exportOutputInvoices,
  exportAllForYiqi,
} from "./yiqiExport";

// Common account subjects for the restaurant business
const accountSubjects = [
  { zh: "主营业务收入", en: "Operating Revenue", type: "income" },
  { zh: "其他业务收入-KTV", en: "Other Revenue - KTV", type: "income" },
  { zh: "其他业务收入-活动", en: "Other Revenue - Events", type: "income" },
  { zh: "其他业务收入-场地", en: "Other Revenue - Venue", type: "income" },
  { zh: "应收账款-企业客户", en: "AR - Corporate Clients", type: "income" },
  { zh: "应收账款-平台结算", en: "AR - Platform Settlement", type: "income" },
  { zh: "预收账款-储值卡", en: "Deferred Revenue - Stored Value", type: "income" },
  { zh: "银行存款", en: "Bank Deposit", type: "asset" },
  { zh: "库存现金", en: "Cash on Hand", type: "asset" },
  { zh: "原材料采购-进口食材", en: "Raw Materials - Imported", type: "expense" },
  { zh: "原材料采购-本地食材", en: "Raw Materials - Local", type: "expense" },
  { zh: "原材料采购-酒水", en: "Raw Materials - Beverages", type: "expense" },
  { zh: "应付账款-食材供应商", en: "AP - Food Suppliers", type: "expense" },
  { zh: "应付账款-酒水供应商", en: "AP - Beverage Suppliers", type: "expense" },
  { zh: "应付职工薪酬-工资", en: "Payroll - Salaries", type: "expense" },
  { zh: "应付职工薪酬-社保", en: "Payroll - Social Insurance", type: "expense" },
  { zh: "管理费用-租金", en: "Admin - Rent", type: "expense" },
  { zh: "管理费用-水电", en: "Admin - Utilities", type: "expense" },
  { zh: "销售费用-营销推广", en: "Selling - Marketing", type: "expense" },
  { zh: "销售费用-平台佣金", en: "Selling - Platform Commission", type: "expense" },
  { zh: "固定资产-厨房设备", en: "Fixed Assets - Kitchen Equipment", type: "expense" },
  { zh: "累计折旧-厨房设备", en: "Depreciation - Kitchen", type: "expense" },
  { zh: "应交税费-增值税（销项）", en: "Tax Payable - VAT (Output)", type: "expense" },
  { zh: "应交税费-增值税（进项）", en: "Tax Payable - VAT (Input)", type: "expense" },
  { zh: "财务费用-银行手续费", en: "Finance - Bank Charges", type: "expense" },
];

interface VoucherLine {
  id: string;
  accountKey: string;
  debit: string;
  credit: string;
  desc: string;
}

const emptyLine = (): VoucherLine => ({
  id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  accountKey: "",
  debit: "",
  credit: "",
  desc: "",
});

const AccountingTab = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const { storeId: globalStoreId, storeName, isHQ } = useStore();
  const selectedStore = globalStoreId as StoreId;

  const [localEntries, setLocalEntries] = useState<JournalEntry[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showExportHub, setShowExportHub] = useState(false);
  
  // Multi-line voucher state
  const [voucherDesc, setVoucherDesc] = useState("");
  const [voucherLines, setVoucherLines] = useState<VoucherLine[]>([emptyLine(), emptyLine()]);

  // Fetch invoices from DB for export
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices-for-export", selectedStore],
    queryFn: async () => {
      let query = supabase.from("invoices").select("*").order("created_at", { ascending: false }).limit(500);
      if (selectedStore !== "all") query = query.eq("store_id", selectedStore);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const allEntries = useMemo(() => [...journalEntries, ...localEntries], [localEntries]);

  const filteredEntries = useMemo(() => {
    if (selectedStore === "all") return allEntries;
    return allEntries.filter(e => e.storeId === selectedStore);
  }, [selectedStore, allEntries]);

  const storeAccounts = useMemo(() => getAccountSummary(selectedStore), [selectedStore]);

  const totalAssets = storeAccounts.filter(a => a.typeKey === "asset").reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = storeAccounts.filter(a => a.typeKey === "liability").reduce((s, a) => s + a.balance, 0);
  const totalEquity = storeAccounts.filter(a => a.typeKey === "equity").reduce((s, a) => s + a.balance, 0);

  const typeColors: Record<string, string> = { asset: "bg-success", liability: "bg-warning", equity: "bg-primary" };
  const typeTextColors: Record<string, string> = { asset: "text-success", liability: "text-warning", equity: "text-primary" };

  // Voucher line helpers
  const updateLine = (id: string, field: keyof VoucherLine, value: string) => {
    setVoucherLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };
  const addLine = () => setVoucherLines(prev => [...prev, emptyLine()]);
  const removeLine = (id: string) => {
    if (voucherLines.length <= 2) {
      toast.error(isZh ? "至少需要两行分录" : "At least 2 lines required");
      return;
    }
    setVoucherLines(prev => prev.filter(l => l.id !== id));
  };
  const duplicateLine = (id: string) => {
    const src = voucherLines.find(l => l.id === id);
    if (src) setVoucherLines(prev => [...prev, { ...src, id: emptyLine().id, debit: "", credit: "" }]);
  };

  // Totals for balance check
  const totalDebit = voucherLines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = voucherLines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleCreateCompoundEntry = () => {
    if (isHQ) {
      toast.error(isZh ? "请先选择具体门店再新建凭证" : "Please select a specific store first");
      return;
    }
    // Validate lines
    const validLines = voucherLines.filter(l => l.accountKey && ((parseFloat(l.debit) || 0) > 0 || (parseFloat(l.credit) || 0) > 0));
    if (validLines.length < 2) {
      toast.error(isZh ? "至少需要两行有效分录" : "At least 2 valid lines required");
      return;
    }
    if (!isBalanced) {
      toast.error(isZh ? `借贷不平衡！借方合计 ¥${totalDebit.toFixed(2)}，贷方合计 ¥${totalCredit.toFixed(2)}` : `Debit/Credit imbalanced! Debit: ¥${totalDebit.toFixed(2)}, Credit: ¥${totalCredit.toFixed(2)}`);
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const voucherId = `JE-${Date.now().toString(36).toUpperCase()}`;
    
    const newEntries: JournalEntry[] = validLines.map((line, idx) => {
      const account = accountSubjects.find(a => a.zh === line.accountKey);
      const debit = parseFloat(line.debit) || 0;
      const credit = parseFloat(line.credit) || 0;
      return {
        id: `${voucherId}-${idx + 1}`,
        date: today,
        type: (account?.type === "income" ? "income" : "expense") as "income" | "expense",
        accountZh: account?.zh || line.accountKey,
        accountEn: account?.en || line.accountKey,
        debit,
        credit,
        descZh: line.desc || voucherDesc || `${storeName(true)} - ${account?.zh || ""}`,
        descEn: line.desc || voucherDesc || `${storeName(false)} - ${account?.en || ""}`,
        status: "pending",
        storeId: selectedStore,
      };
    });

    setLocalEntries(prev => [...newEntries, ...prev]);
    setShowNewDialog(false);
    setVoucherLines([emptyLine(), emptyLine()]);
    setVoucherDesc("");
    toast.success(isZh
      ? `✅ 复合凭证 ${voucherId} 已创建（${validLines.length}行分录），借贷合计 ¥${totalDebit.toFixed(2)}`
      : `✅ Compound voucher ${voucherId} created (${validLines.length} lines), total ¥${totalDebit.toFixed(2)}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t("financeMgmt.searchVoucher")} className="pl-9 w-64 bg-muted/50 border-border/50" />
          </div>
          <Button variant="outline" size="sm" className="gap-2"><Filter className="w-4 h-4" />{t("common.filter")}</Button>
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="sm" className="gap-2" onClick={() => setShowExportHub(true)}>
            <PackageCheck className="w-4 h-4" />{isZh ? "亿企代账导出中心" : "YiQi Export Hub"}
          </Button>
          <Button variant="outline" size="sm" className="gap-2"><FileText className="w-4 h-4" />{t("financeMgmt.importVoucher")}</Button>
          <Button size="sm" className="gap-2" onClick={() => setShowNewDialog(true)}><Plus className="w-4 h-4" />{t("financeMgmt.newVoucher")}</Button>
        </div>
      </div>

      {/* Store indicator */}
      <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
        {isZh
          ? `📊 当前显示: ${isHQ ? "全部门店汇总" : storeName(true) + "独立账务"}，共 ${filteredEntries.length} 条凭证`
          : `📊 Showing: ${isHQ ? "All stores consolidated" : storeName(false) + " standalone"}, ${filteredEntries.length} entries`}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">{t("financeMgmt.journalEntries")} ({filteredEntries.length})</h3>
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">{t("financeMgmt.voucherNo")}</TableHead>
                  <TableHead className="w-24">{t("common.date")}</TableHead>
                  <TableHead>{t("financeMgmt.accountSubject")}</TableHead>
                  <TableHead className="text-right">{t("financeMgmt.debit")}</TableHead>
                  <TableHead className="text-right">{t("financeMgmt.credit")}</TableHead>
                  <TableHead className="w-20">{t("common.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium text-xs">{entry.id}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{entry.date}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{isZh ? entry.accountZh : entry.accountEn}</p>
                        <p className="text-xs text-muted-foreground">{isZh ? entry.descZh : entry.descEn}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.debit > 0 && (<span className="text-destructive font-medium">¥{entry.debit.toLocaleString()}</span>)}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.credit > 0 && (<span className="text-success font-medium">¥{entry.credit.toLocaleString()}</span>)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.status === "reviewed" ? "secondary" : "outline"} className="text-xs">
                        {entry.status === "reviewed" ? t("financeMgmt.reviewed") : t("financeMgmt.pendingReview")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">
            {t("financeMgmt.accountBalance")}
            {!isHQ && <span className="text-primary text-xs ml-2">— {storeName(isZh)}</span>}
          </h3>
          <div className="space-y-1 max-h-[450px] overflow-y-auto">
            {storeAccounts.map((account) => (
              <div key={isZh ? account.nameZh : account.nameEn} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${typeColors[account.typeKey]}`} />
                  <span className="text-sm">{isZh ? account.nameZh : account.nameEn}</span>
                </div>
                <span className={`font-medium text-sm ${account.balance < 0 ? "text-muted-foreground" : typeTextColors[account.typeKey]}`}>
                  {account.balance < 0 ? "-" : ""}¥{Math.abs(account.balance).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("financeMgmt.totalAssets")}</span>
              <span className="font-bold text-success">¥{totalAssets.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("financeMgmt.totalLiabilities")}</span>
              <span className="font-bold text-warning">¥{totalLiabilities.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{isZh ? "所有者权益" : "Owner's Equity"}</span>
              <span className="font-bold text-primary">¥{totalEquity.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Multi-line Compound Voucher Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isZh ? "新建复合凭证" : "New Compound Voucher"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Store info */}
            <div className="bg-muted/40 rounded-lg p-3 text-sm flex items-center justify-between">
              <div>
                <span className="text-muted-foreground">{isZh ? "关联门店：" : "Store: "}</span>
                <span className="font-medium text-primary">
                  {isHQ
                    ? (isZh ? "⚠️ 总部视图，请先切换到具体门店" : "⚠️ HQ view, please switch to a specific store")
                    : storeName(isZh)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {isZh ? "日期" : "Date"}: {new Date().toISOString().split("T")[0]}
              </div>
            </div>

            {/* Voucher-level description */}
            <div className="space-y-1.5">
              <Label>{isZh ? "凭证摘要（整张凭证）" : "Voucher Summary"}</Label>
              <Input
                placeholder={isZh ? "如：12月工资发放、供应商结算等" : "e.g. December payroll, supplier settlement..."}
                value={voucherDesc}
                onChange={e => setVoucherDesc(e.target.value)}
              />
            </div>

            {/* Line items table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-8 text-center">#</TableHead>
                    <TableHead className="min-w-[180px]">{isZh ? "会计科目" : "Account"}</TableHead>
                    <TableHead className="w-28 text-right">{isZh ? "借方 (¥)" : "Debit (¥)"}</TableHead>
                    <TableHead className="w-28 text-right">{isZh ? "贷方 (¥)" : "Credit (¥)"}</TableHead>
                    <TableHead className="min-w-[120px]">{isZh ? "行摘要" : "Line Memo"}</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voucherLines.map((line, idx) => (
                    <TableRow key={line.id}>
                      <TableCell className="text-center text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                      <TableCell className="p-1.5">
                        <Select value={line.accountKey} onValueChange={v => updateLine(line.id, "accountKey", v)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder={isZh ? "选择科目..." : "Select..."} />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{isZh ? "— 资产类 —" : "— Assets —"}</div>
                            {accountSubjects.filter(a => a.type === "asset").map(a => (
                              <SelectItem key={a.zh} value={a.zh} className="text-xs">{isZh ? a.zh : a.en}</SelectItem>
                            ))}
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{isZh ? "— 收入类 —" : "— Revenue —"}</div>
                            {accountSubjects.filter(a => a.type === "income").map(a => (
                              <SelectItem key={a.zh} value={a.zh} className="text-xs">{isZh ? a.zh : a.en}</SelectItem>
                            ))}
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-1">{isZh ? "— 支出/负债类 —" : "— Expenses/Liabilities —"}</div>
                            {accountSubjects.filter(a => a.type === "expense").map(a => (
                              <SelectItem key={a.zh} value={a.zh} className="text-xs">{isZh ? a.zh : a.en}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="p-1.5">
                        <Input
                          type="number" min="0" step="0.01"
                          className="h-8 text-xs text-right"
                          placeholder="0.00"
                          value={line.debit}
                          onChange={e => {
                            updateLine(line.id, "debit", e.target.value);
                            if (e.target.value && parseFloat(e.target.value) > 0) updateLine(line.id, "credit", "");
                          }}
                        />
                      </TableCell>
                      <TableCell className="p-1.5">
                        <Input
                          type="number" min="0" step="0.01"
                          className="h-8 text-xs text-right"
                          placeholder="0.00"
                          value={line.credit}
                          onChange={e => {
                            updateLine(line.id, "credit", e.target.value);
                            if (e.target.value && parseFloat(e.target.value) > 0) updateLine(line.id, "debit", "");
                          }}
                        />
                      </TableCell>
                      <TableCell className="p-1.5">
                        <Input
                          className="h-8 text-xs"
                          placeholder={isZh ? "可选" : "Optional"}
                          value={line.desc}
                          onChange={e => updateLine(line.id, "desc", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="p-1.5">
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateLine(line.id)} title={isZh ? "复制行" : "Duplicate"}>
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeLine(line.id)} title={isZh ? "删除行" : "Remove"}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Add line button */}
            <Button variant="outline" size="sm" className="w-full gap-2 border-dashed" onClick={addLine}>
              <Plus className="w-3.5 h-3.5" />{isZh ? "添加分录行" : "Add Line"}
            </Button>

            {/* Balance summary */}
            <div className={`rounded-lg p-3 text-sm border ${isBalanced ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"}`}>
              <div className="flex items-center justify-between">
                <div className="flex gap-6">
                  <span>
                    <span className="text-muted-foreground">{isZh ? "借方合计：" : "Total Debit: "}</span>
                    <span className="font-bold text-destructive">¥{totalDebit.toFixed(2)}</span>
                  </span>
                  <span>
                    <span className="text-muted-foreground">{isZh ? "贷方合计：" : "Total Credit: "}</span>
                    <span className="font-bold text-success">¥{totalCredit.toFixed(2)}</span>
                  </span>
                </div>
                <Badge variant={isBalanced ? "secondary" : "destructive"} className="text-xs">
                  {isBalanced
                    ? (isZh ? "✓ 借贷平衡" : "✓ Balanced")
                    : (isZh ? `✗ 差额 ¥${Math.abs(totalDebit - totalCredit).toFixed(2)}` : `✗ Diff ¥${Math.abs(totalDebit - totalCredit).toFixed(2)}`)}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>{isZh ? "取消" : "Cancel"}</Button>
            <Button onClick={handleCreateCompoundEntry} disabled={!isBalanced}>
              {isZh ? `创建凭证（${voucherLines.filter(l => l.accountKey).length}行）` : `Create (${voucherLines.filter(l => l.accountKey).length} lines)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 亿企代账导出中心 */}
      <Dialog open={showExportHub} onOpenChange={setShowExportHub}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-primary" />
              {isZh ? "亿企代账导出中心" : "YiQi DaiZhang Export Hub"}
            </DialogTitle>
          </DialogHeader>

          <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 mb-2">
            {isZh
              ? `📦 当前门店: ${isHQ ? "全部门店汇总" : storeName(true)}。导出的Excel文件可直接导入亿企代账、用友T+、金蝶KIS等主流财务软件。`
              : `📦 Store: ${isHQ ? "All stores" : storeName(false)}. Exported Excel files are compatible with YiQi DaiZhang, Yonyou T+, Kingdee KIS.`}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* 一键全量导出 */}
            <motion.div
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className="col-span-2 border-2 border-primary/30 bg-primary/5 rounded-xl p-4 cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => {
                const result = exportAllForYiqi(filteredEntries, invoices, storeAccounts, storeName(isZh));
                toast.success(isZh
                  ? `✅ 全量导入包已生成！凭证${result.voucherCount}条 · 进项${result.inputInvoiceCount}张 · 销项${result.outputInvoiceCount}张 · 科目${result.accountCount}个`
                  : `✅ Full export: ${result.voucherCount} vouchers · ${result.inputInvoiceCount} input · ${result.outputInvoiceCount} output · ${result.accountCount} accounts`);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <PackageCheck className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{isZh ? "⚡ 一键全量导出" : "⚡ One-Click Full Export"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isZh ? "包含凭证、进项发票、销项发票、科目余额表、科目表、导入说明" : "Includes vouchers, invoices, trial balance, COA, and instructions"}
                  </p>
                </div>
                <Badge variant="default" className="text-xs">{isZh ? "推荐" : "Recommended"}</Badge>
              </div>
            </motion.div>

            {/* 凭证导出 */}
            <motion.div
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="border border-border rounded-xl p-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => {
                const result = exportVouchersForYiqi(filteredEntries, isZh);
                toast.success(isZh ? `凭证已导出 (${result.count}条)` : `Vouchers exported (${result.count})`);
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <FileText className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{isZh ? "会计凭证" : "Vouchers"}</p>
                  <p className="text-xs text-muted-foreground">{filteredEntries.length} {isZh ? "条" : "entries"}</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">{isZh ? "含科目编码映射，可直接导入亿企代账「凭证导入」" : "With subject codes, importable to YiQi"}</p>
            </motion.div>

            {/* 进项发票 */}
            <motion.div
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="border border-border rounded-xl p-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => {
                const result = exportInputInvoices(invoices);
                toast.success(isZh ? `进项发票已导出 (${result.count}张)` : `Input invoices exported (${result.count})`);
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <Download className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{isZh ? "进项发票" : "Input Invoices"}</p>
                  <p className="text-xs text-muted-foreground">{invoices.filter((i: any) => i.type === "input").length} {isZh ? "张" : "invoices"}</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">{isZh ? "含认证状态，可导入亿企代账「进项发票」模块" : "With verification status"}</p>
            </motion.div>

            {/* 销项发票 */}
            <motion.div
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="border border-border rounded-xl p-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => {
                const result = exportOutputInvoices(invoices);
                toast.success(isZh ? `销项发票已导出 (${result.count}张)` : `Output invoices exported (${result.count})`);
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <Upload className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{isZh ? "销项发票" : "Output Invoices"}</p>
                  <p className="text-xs text-muted-foreground">{invoices.filter((i: any) => i.type === "output").length} {isZh ? "张" : "invoices"}</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">{isZh ? "含收款状态，可导入亿企代账「销项发票」模块" : "With collection status"}</p>
            </motion.div>

            {/* 科目余额表 */}
            <motion.div
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="border border-border rounded-xl p-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => {
                const result = exportTrialBalance(storeAccounts, isZh);
                toast.success(isZh ? `科目余额表已导出 (${result.count}个科目)` : `Trial balance exported (${result.count} accounts)`);
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{isZh ? "科目余额表" : "Trial Balance"}</p>
                  <p className="text-xs text-muted-foreground">{storeAccounts.length} {isZh ? "个科目" : "accounts"}</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">{isZh ? "期初/期末余额，可用于亿企代账「期初余额」录入" : "Opening/closing balances"}</p>
            </motion.div>
          </div>

          <div className="border-t border-border pt-3 mt-1">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isZh
                ? "💡 提示：推荐使用「一键全量导出」，生成的Excel包含6个Sheet（凭证、进项发票、销项发票、科目余额表、科目表、导入说明），按说明分别导入亿企代账各模块即可。兼容用友T+、金蝶KIS、畅捷通等。"
                : "💡 Tip: Use 'One-Click Full Export' for a complete Excel with 6 sheets. Follow the included instructions to import into YiQi DaiZhang modules. Compatible with Yonyou T+, Kingdee KIS, etc."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingTab;
