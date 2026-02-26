import { motion } from "framer-motion";
import { Plus, Search, Filter, FileText, Download } from "lucide-react";
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
import { exportVouchersForYiqi, exportTrialBalance } from "./yiqiExport";

// Common account subjects for the restaurant business
const accountSubjects = [
  { zh: "主营业务收入", en: "Operating Revenue", type: "income" },
  { zh: "其他业务收入-KTV", en: "Other Revenue - KTV", type: "income" },
  { zh: "其他业务收入-活动", en: "Other Revenue - Events", type: "income" },
  { zh: "其他业务收入-场地", en: "Other Revenue - Venue", type: "income" },
  { zh: "应收账款-企业客户", en: "AR - Corporate Clients", type: "income" },
  { zh: "应收账款-平台结算", en: "AR - Platform Settlement", type: "income" },
  { zh: "预收账款-储值卡", en: "Deferred Revenue - Stored Value", type: "income" },
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

const AccountingTab = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const { storeId: globalStoreId, storeName, isHQ } = useStore();
  const selectedStore = globalStoreId as StoreId;

  const [localEntries, setLocalEntries] = useState<JournalEntry[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newEntry, setNewEntry] = useState({
    accountKey: "",
    debit: "",
    credit: "",
    desc: "",
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

  const handleCreateEntry = () => {
    const account = accountSubjects.find(a => a.zh === newEntry.accountKey);
    if (!account) {
      toast.error(isZh ? "请选择会计科目" : "Please select an account subject");
      return;
    }
    const debit = parseFloat(newEntry.debit) || 0;
    const credit = parseFloat(newEntry.credit) || 0;
    if (debit === 0 && credit === 0) {
      toast.error(isZh ? "借方或贷方金额不能同时为0" : "Debit or credit amount is required");
      return;
    }
    if (isHQ) {
      toast.error(isZh ? "请先选择具体门店再新建凭证" : "Please select a specific store first");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const id = `JE-NEW-${Date.now()}`;
    const entry: JournalEntry = {
      id,
      date: today,
      type: account.type as "income" | "expense",
      accountZh: account.zh,
      accountEn: account.en,
      debit,
      credit,
      descZh: newEntry.desc || (isZh ? `${storeName(true)} - ${account.zh}` : `${storeName(false)} - ${account.en}`),
      descEn: newEntry.desc || `${storeName(false)} - ${account.en}`,
      status: "pending",
      storeId: selectedStore,
    };
    setLocalEntries(prev => [entry, ...prev]);
    setShowNewDialog(false);
    setNewEntry({ accountKey: "", debit: "", credit: "", desc: "" });
    toast.success(isZh ? `凭证 ${id} 已创建，关联门店: ${storeName(true)}` : `Voucher ${id} created for ${storeName(false)}`);
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
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { exportVouchersForYiqi(filteredEntries, isZh); toast.success(isZh ? "亿企代账格式凭证已导出" : "Yiqi format vouchers exported"); }}>
            <Download className="w-4 h-4" />{isZh ? "导出亿企代账" : "Export Yiqi"}
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { exportTrialBalance(storeAccounts, isZh); toast.success(isZh ? "科目余额表已导出" : "Trial balance exported"); }}>
            <Download className="w-4 h-4" />{isZh ? "科目余额表" : "Trial Balance"}
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

      {/* New Voucher Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isZh ? "新建会计凭证" : "New Journal Entry"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Store info - auto filled */}
            <div className="bg-muted/40 rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">{isZh ? "关联门店：" : "Store: "}</span>
              <span className="font-medium text-primary">
                {isHQ
                  ? (isZh ? "⚠️ 总部视图，请先切换到具体门店" : "⚠️ HQ view, please switch to a specific store")
                  : storeName(isZh)}
              </span>
            </div>

            {/* Account subject */}
            <div className="space-y-1.5">
              <Label>{isZh ? "会计科目" : "Account Subject"}</Label>
              <Select value={newEntry.accountKey} onValueChange={v => setNewEntry(p => ({ ...p, accountKey: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={isZh ? "选择科目..." : "Select account..."} />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{isZh ? "— 收入类 —" : "— Revenue —"}</div>
                  {accountSubjects.filter(a => a.type === "income").map(a => (
                    <SelectItem key={a.zh} value={a.zh}>{isZh ? a.zh : a.en}</SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-1">{isZh ? "— 支出类 —" : "— Expenses —"}</div>
                  {accountSubjects.filter(a => a.type === "expense").map(a => (
                    <SelectItem key={a.zh} value={a.zh}>{isZh ? a.zh : a.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Debit & Credit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{isZh ? "借方金额 (¥)" : "Debit (¥)"}</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newEntry.debit}
                  onChange={e => setNewEntry(p => ({ ...p, debit: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{isZh ? "贷方金额 (¥)" : "Credit (¥)"}</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newEntry.credit}
                  onChange={e => setNewEntry(p => ({ ...p, credit: e.target.value }))}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>{isZh ? "摘要说明" : "Description"}</Label>
              <Input
                placeholder={isZh ? "如：当日营收、供应商付款等" : "e.g. daily revenue, supplier payment..."}
                value={newEntry.desc}
                onChange={e => setNewEntry(p => ({ ...p, desc: e.target.value }))}
              />
            </div>

            {/* Auto-generated info preview */}
            {newEntry.accountKey && (
              <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1 border border-border/50">
                <p className="font-semibold text-muted-foreground">{isZh ? "凭证预览" : "Preview"}</p>
                <p>{isZh ? "日期" : "Date"}: {new Date().toISOString().split("T")[0]}</p>
                <p>{isZh ? "科目" : "Account"}: {isZh ? newEntry.accountKey : accountSubjects.find(a => a.zh === newEntry.accountKey)?.en}</p>
                <p>{isZh ? "状态" : "Status"}: {isZh ? "待审核" : "Pending Review"}</p>
                {!isHQ && <p>{isZh ? "门店" : "Store"}: {storeName(isZh)}</p>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>{isZh ? "取消" : "Cancel"}</Button>
            <Button onClick={handleCreateEntry}>{isZh ? "创建凭证" : "Create Entry"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingTab;
