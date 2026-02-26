import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import {
  Building2, CalendarDays, Brain, CheckCircle2, XCircle, Clock, FileText,
  ArrowRight, Upload, Calculator, BookOpen, AlertTriangle, Sparkles, Eye,
  Plus, RefreshCw, Download
} from "lucide-react";

interface LeaseTerm {
  id: string;
  store_id: string;
  store_name_zh: string;
  store_name_en: string;
  lease_start: string;
  lease_end: string;
  lease_months: number;
  landlord_name: string;
  contract_number: string;
  monthly_rent: number;
  notes: string;
}

interface AmortizationItem {
  id: string;
  store_id: string;
  store_name_zh: string;
  store_name_en: string;
  item_type: string;
  name_zh: string;
  name_en: string;
  total_amount: number;
  amortization_months: number;
  monthly_amount: number;
  amortized_total: number;
  remaining_amount: number;
  start_date: string;
  end_date: string | null;
  source_type: string;
  source_reference: string;
  debit_account: string;
  credit_account: string;
  collection_status: string;
  verification_status: string;
  payment_status: string;
  journal_status: string;
  ai_confidence: number;
  ai_category_reason: string;
  notes: string;
}

interface JournalEntry {
  id: string;
  amortization_item_id: string;
  store_id: string;
  period: string;
  amount: number;
  debit_account: string;
  credit_account: string;
  status: string;
}

const ITEM_TYPES = [
  { value: "opening_expense", labelZh: "开业费", labelEn: "Opening Expense", icon: "🏪", account: "长期待摊费用-开办费" },
  { value: "decoration", labelZh: "装修费", labelEn: "Decoration", icon: "🔨", account: "长期待摊费用-装修费" },
  { value: "fixed_asset", labelZh: "固定资产", labelEn: "Fixed Asset", icon: "🖥️", account: "固定资产" },
  { value: "equipment", labelZh: "设备", labelEn: "Equipment", icon: "⚙️", account: "固定资产-设备" },
  { value: "marketing", labelZh: "开业营销", labelEn: "Opening Marketing", icon: "📢", account: "长期待摊费用-开业推广" },
];

const BANK_KEYWORDS: Record<string, { type: string; confidence: number }> = {
  "装修": { type: "decoration", confidence: 0.95 },
  "装饰": { type: "decoration", confidence: 0.90 },
  "工程款": { type: "decoration", confidence: 0.85 },
  "设计费": { type: "decoration", confidence: 0.80 },
  "设备": { type: "equipment", confidence: 0.90 },
  "厨具": { type: "equipment", confidence: 0.88 },
  "空调": { type: "equipment", confidence: 0.92 },
  "冰箱": { type: "equipment", confidence: 0.92 },
  "冰柜": { type: "equipment", confidence: 0.92 },
  "家具": { type: "fixed_asset", confidence: 0.85 },
  "桌椅": { type: "fixed_asset", confidence: 0.88 },
  "开业": { type: "opening_expense", confidence: 0.90 },
  "筹备": { type: "opening_expense", confidence: 0.85 },
  "证照": { type: "opening_expense", confidence: 0.80 },
  "营业执照": { type: "opening_expense", confidence: 0.88 },
  "推广": { type: "marketing", confidence: 0.85 },
  "广告": { type: "marketing", confidence: 0.82 },
  "宣传": { type: "marketing", confidence: 0.80 },
};

const WORKFLOW_STEPS = [
  { key: "collection", labelZh: "AI归集", labelEn: "AI Collection", icon: Brain, statusField: "collection_status" as const },
  { key: "verification", labelZh: "三方验证", labelEn: "3-Way Verify", icon: CheckCircle2, statusField: "verification_status" as const },
  { key: "payment", labelZh: "付款确认", labelEn: "Payment", icon: FileText, statusField: "payment_status" as const },
  { key: "journal", labelZh: "入账摊销", labelEn: "Journal Post", icon: BookOpen, statusField: "journal_status" as const },
];

const statusBadge = (status: string) => {
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    ai_suggested: { variant: "secondary", label: "AI建议" },
    confirmed: { variant: "default", label: "已确认" },
    rejected: { variant: "destructive", label: "已拒绝" },
    pending: { variant: "outline", label: "待处理" },
    verified: { variant: "default", label: "已验证" },
    disputed: { variant: "destructive", label: "有争议" },
    paid: { variant: "default", label: "已付款" },
    partial: { variant: "secondary", label: "部分付" },
    posted: { variant: "default", label: "已入账" },
    reviewed: { variant: "default", label: "已复核" },
  };
  const m = map[status] || { variant: "outline" as const, label: status };
  return <Badge variant={m.variant}>{m.label}</Badge>;
};

export default function AssetAmortizationTab() {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const { storeId, storeName, isHQ } = useStore();

  const [leaseTerms, setLeaseTerms] = useState<LeaseTerm[]>([]);
  const [items, setItems] = useState<AmortizationItem[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLeaseDialog, setShowLeaseDialog] = useState(false);
  const [showBankImport, setShowBankImport] = useState(false);
  const [bankRemarks, setBankRemarks] = useState("");

  // Lease form
  const [leaseForm, setLeaseForm] = useState({
    lease_start: "", lease_end: "", landlord_name: "", contract_number: "", monthly_rent: 0, notes: ""
  });

  const fetchData = async () => {
    setLoading(true);
    const storeFilter = storeId === "all" ? {} : { store_id: storeId };

    const [leaseRes, itemsRes, journalRes] = await Promise.all([
      supabase.from("store_lease_terms").select("*").match(storeFilter),
      supabase.from("amortization_items").select("*").match(storeFilter).order("created_at", { ascending: false }),
      supabase.from("amortization_journal").select("*").match(storeFilter).order("period", { ascending: false }),
    ]);

    if (leaseRes.data) setLeaseTerms(leaseRes.data as LeaseTerm[]);
    if (itemsRes.data) setItems(itemsRes.data as AmortizationItem[]);
    if (journalRes.data) setJournal(journalRes.data as JournalEntry[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [storeId]);

  const currentLease = leaseTerms.find(l => l.store_id === storeId);

  const saveLeaseTerm = async () => {
    if (!leaseForm.lease_start || !leaseForm.lease_end) {
      toast.error(isZh ? "请填写租赁起止日期" : "Please fill lease dates");
      return;
    }
    const start = new Date(leaseForm.lease_start);
    const end = new Date(leaseForm.lease_end);
    const months = Math.round((end.getTime() - start.getTime()) / (30.44 * 24 * 60 * 60 * 1000));

    const { error } = await supabase.from("store_lease_terms").upsert({
      store_id: storeId,
      store_name_zh: storeName(true),
      store_name_en: storeName(false),
      lease_start: leaseForm.lease_start,
      lease_end: leaseForm.lease_end,
      lease_months: months,
      landlord_name: leaseForm.landlord_name,
      contract_number: leaseForm.contract_number,
      monthly_rent: leaseForm.monthly_rent,
      notes: leaseForm.notes,
    }, { onConflict: "store_id" });

    if (error) { toast.error(error.message); return; }
    toast.success(isZh ? "租赁信息已保存" : "Lease info saved");
    setShowLeaseDialog(false);
    fetchData();
  };

  // AI auto-classify bank remarks
  const handleBankImport = async () => {
    if (!bankRemarks.trim()) return;
    if (!currentLease) {
      toast.error(isZh ? "请先设置本店租赁协议信息" : "Please set lease terms first");
      return;
    }

    const lines = bankRemarks.split("\n").filter(l => l.trim());
    const newItems: Partial<AmortizationItem>[] = [];

    for (const line of lines) {
      // Parse: amount | remark | date (flexible)
      const parts = line.split(/[|\t,，]/).map(p => p.trim());
      const amount = parseFloat(parts.find(p => /^\d+(\.\d+)?$/.test(p)) || "0");
      const remark = parts.find(p => !/^\d+(\.\d+)?$/.test(p) && !/^\d{4}[-/]/.test(p)) || line;
      const dateStr = parts.find(p => /^\d{4}[-/]/.test(p)) || new Date().toISOString().slice(0, 10);

      // AI keyword matching
      let bestType = "opening_expense";
      let bestConfidence = 0.5;
      let bestReason = "默认归类为开业费";

      for (const [keyword, info] of Object.entries(BANK_KEYWORDS)) {
        if (remark.includes(keyword) && info.confidence > bestConfidence) {
          bestType = info.type;
          bestConfidence = info.confidence;
          bestReason = `银行备注包含关键词"${keyword}"`;
        }
      }

      const typeInfo = ITEM_TYPES.find(t => t.value === bestType)!;
      const monthlyAmt = amount / currentLease.lease_months;

      newItems.push({
        store_id: storeId,
        store_name_zh: storeName(true),
        store_name_en: storeName(false),
        item_type: bestType,
        name_zh: `${typeInfo.labelZh} - ${remark.slice(0, 30)}`,
        name_en: `${typeInfo.labelEn} - ${remark.slice(0, 30)}`,
        total_amount: amount,
        amortization_months: currentLease.lease_months,
        monthly_amount: Math.round(monthlyAmt * 100) / 100,
        amortized_total: 0,
        remaining_amount: amount,
        start_date: dateStr,
        end_date: currentLease.lease_end,
        source_type: "bank_remark",
        source_reference: remark,
        debit_account: typeInfo.account,
        credit_account: "银行存款",
        collection_status: "ai_suggested",
        verification_status: "pending",
        payment_status: "pending",
        journal_status: "pending",
        ai_confidence: bestConfidence,
        ai_category_reason: bestReason,
      });
    }

    if (newItems.length > 0) {
      const { error } = await supabase.from("amortization_items").insert(newItems as any);
      if (error) { toast.error(error.message); return; }
      toast.success(isZh ? `AI已归集 ${newItems.length} 条费用项目` : `AI collected ${newItems.length} items`);
      setBankRemarks("");
      setShowBankImport(false);
      fetchData();
    }
  };

  // Workflow actions
  const updateItemStatus = async (id: string, field: string, value: string) => {
    const { error } = await supabase.from("amortization_items").update({ [field]: value } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(isZh ? "状态已更新" : "Status updated");
    fetchData();
  };

  // Generate monthly amortization journal entries
  const generateMonthlyJournal = async () => {
    const confirmedItems = items.filter(i => i.collection_status === "confirmed" && i.verification_status === "verified" && i.remaining_amount > 0);
    if (confirmedItems.length === 0) {
      toast.info(isZh ? "没有需要摊销的项目" : "No items to amortize");
      return;
    }

    const period = new Date().toISOString().slice(0, 7); // current month
    const entries = confirmedItems.map(item => ({
      amortization_item_id: item.id,
      store_id: item.store_id,
      period,
      amount: item.monthly_amount,
      debit_account: item.item_type === "fixed_asset" || item.item_type === "equipment" ? "折旧费用" : "管理费用-摊销",
      credit_account: item.item_type === "fixed_asset" || item.item_type === "equipment" ? "累计折旧" : "长期待摊费用",
      status: "pending",
    }));

    const { error } = await supabase.from("amortization_journal").insert(entries);
    if (error) { toast.error(error.message); return; }

    // Update amortized totals
    for (const item of confirmedItems) {
      const newAmortized = item.amortized_total + item.monthly_amount;
      await supabase.from("amortization_items").update({
        amortized_total: newAmortized,
        remaining_amount: item.total_amount - newAmortized,
      } as any).eq("id", item.id);
    }

    toast.success(isZh ? `已生成 ${entries.length} 条摊销凭证（${period}）` : `Generated ${entries.length} journal entries (${period})`);
    fetchData();
  };

  // Post journal to finance_transactions
  const postJournalEntry = async (entry: JournalEntry) => {
    const item = items.find(i => i.id === entry.amortization_item_id);
    if (!item) return;

    const { error: txnErr } = await supabase.from("finance_transactions").insert({
      type: "expense",
      category: item.item_type === "fixed_asset" || item.item_type === "equipment" ? "depreciation" : "amortization",
      amount: entry.amount,
      debit_account: entry.debit_account,
      credit_account: entry.credit_account,
      description_zh: `${item.name_zh} - ${entry.period}月摊销`,
      description_en: `${item.name_en} - ${entry.period} Amortization`,
      store_id: entry.store_id,
      store_name_zh: item.store_name_zh,
      store_name_en: item.store_name_en || "",
      status: "pending",
      notes: `自动摊销 - 租期${item.amortization_months}个月`,
    });

    if (txnErr) { toast.error(txnErr.message); return; }

    await supabase.from("amortization_journal").update({ status: "posted", posted_at: new Date().toISOString() } as any).eq("id", entry.id);
    toast.success(isZh ? "已入账到财务总账" : "Posted to general ledger");
    fetchData();
  };

  // Summary stats
  const totalAssets = items.reduce((s, i) => s + i.total_amount, 0);
  const totalAmortized = items.reduce((s, i) => s + i.amortized_total, 0);
  const totalRemaining = items.reduce((s, i) => s + i.remaining_amount, 0);
  const aiSuggestedCount = items.filter(i => i.collection_status === "ai_suggested").length;
  const pendingVerify = items.filter(i => i.verification_status === "pending" && i.collection_status === "confirmed").length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">{isZh ? "资产/费用总额" : "Total Assets"}</p>
            <p className="text-xl font-bold">¥{totalAssets.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">{isZh ? "已摊销" : "Amortized"}</p>
            <p className="text-xl font-bold text-primary">¥{totalAmortized.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">{isZh ? "待摊余额" : "Remaining"}</p>
            <p className="text-xl font-bold text-destructive">¥{totalRemaining.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">{isZh ? "AI待确认" : "AI Pending"}</p>
            <p className="text-xl font-bold text-accent-foreground">{aiSuggestedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">{isZh ? "待验证" : "Pending Verify"}</p>
            <p className="text-xl font-bold text-secondary-foreground">{pendingVerify}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lease Info + Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {isZh ? "租赁协议 & 摊销周期" : "Lease Terms & Amortization Cycle"}
            </CardTitle>
            <div className="flex gap-2">
              <Dialog open={showLeaseDialog} onOpenChange={setShowLeaseDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => {
                    if (currentLease) {
                      setLeaseForm({
                        lease_start: currentLease.lease_start,
                        lease_end: currentLease.lease_end,
                        landlord_name: currentLease.landlord_name,
                        contract_number: currentLease.contract_number,
                        monthly_rent: currentLease.monthly_rent,
                        notes: currentLease.notes,
                      });
                    }
                  }}>
                    <CalendarDays className="w-3.5 h-3.5 mr-1" />
                    {isZh ? (currentLease ? "编辑租赁" : "设置租赁") : (currentLease ? "Edit Lease" : "Set Lease")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{isZh ? "门店租赁协议信息" : "Store Lease Information"}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>{isZh ? "租赁起始" : "Start"}</Label><Input type="date" value={leaseForm.lease_start} onChange={e => setLeaseForm(f => ({ ...f, lease_start: e.target.value }))} /></div>
                      <div><Label>{isZh ? "租赁到期" : "End"}</Label><Input type="date" value={leaseForm.lease_end} onChange={e => setLeaseForm(f => ({ ...f, lease_end: e.target.value }))} /></div>
                    </div>
                    <div><Label>{isZh ? "出租方" : "Landlord"}</Label><Input value={leaseForm.landlord_name} onChange={e => setLeaseForm(f => ({ ...f, landlord_name: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>{isZh ? "合同编号" : "Contract #"}</Label><Input value={leaseForm.contract_number} onChange={e => setLeaseForm(f => ({ ...f, contract_number: e.target.value }))} /></div>
                      <div><Label>{isZh ? "月租金" : "Monthly Rent"}</Label><Input type="number" value={leaseForm.monthly_rent} onChange={e => setLeaseForm(f => ({ ...f, monthly_rent: parseFloat(e.target.value) || 0 }))} /></div>
                    </div>
                    <div><Label>{isZh ? "备注" : "Notes"}</Label><Textarea value={leaseForm.notes} onChange={e => setLeaseForm(f => ({ ...f, notes: e.target.value }))} /></div>
                    <Button onClick={saveLeaseTerm}>{isZh ? "保存" : "Save"}</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showBankImport} onOpenChange={setShowBankImport}>
                <DialogTrigger asChild>
                  <Button size="sm"><Brain className="w-3.5 h-3.5 mr-1" />{isZh ? "AI智能归集" : "AI Collect"}</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{isZh ? "银行流水/备注智能归集" : "Bank Statement AI Classification"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {isZh ? "粘贴银行付款备注，每行一条。格式：金额|备注|日期（用竖线或Tab分隔）。AI将根据关键词自动归类为装修费、开业费、固定资产等。" : "Paste bank payment remarks, one per line. Format: amount|remark|date."}
                    </p>
                    <Textarea
                      rows={8}
                      placeholder={isZh ? "示例:\n50000|装修工程尾款|2024-06-15\n12000|厨房设备采购|2024-06-20\n3000|开业推广费|2024-07-01" : "Example:\n50000|Decoration final|2024-06-15"}
                      value={bankRemarks}
                      onChange={e => setBankRemarks(e.target.value)}
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="w-3.5 h-3.5" />
                      {isZh ? `AI将按关键词匹配归类，摊销周期=${currentLease?.lease_months || "?"}个月（租赁期限）` : `Amortization period = ${currentLease?.lease_months || "?"} months (lease term)`}
                    </div>
                    <Button onClick={handleBankImport} className="w-full" disabled={!currentLease}>
                      <Brain className="w-4 h-4 mr-2" />{isZh ? "开始AI归集分析" : "Run AI Classification"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button size="sm" variant="outline" onClick={generateMonthlyJournal}>
                <Calculator className="w-3.5 h-3.5 mr-1" />{isZh ? "生成本月摊销" : "Generate Monthly"}
              </Button>
            </div>
          </div>
        </CardHeader>
        {currentLease && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-6 text-sm">
              <span><strong>{isZh ? "租期" : "Lease"}:</strong> {currentLease.lease_start} ~ {currentLease.lease_end} ({currentLease.lease_months}{isZh ? "个月" : "m"})</span>
              <span><strong>{isZh ? "出租方" : "Landlord"}:</strong> {currentLease.landlord_name || "-"}</span>
              <span><strong>{isZh ? "月租金" : "Rent"}:</strong> ¥{currentLease.monthly_rent.toLocaleString()}</span>
            </div>
          </CardContent>
        )}
        {!currentLease && !isHQ && (
          <CardContent className="pt-0">
            <p className="text-sm text-orange-600 flex items-center gap-1"><AlertTriangle className="w-4 h-4" />{isZh ? "请先设置本店第一份租赁协议信息，摊销周期将根据租期自动计算" : "Please set lease terms first"}</p>
          </CardContent>
        )}
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="items" className="text-xs gap-1"><Sparkles className="w-3.5 h-3.5" />{isZh ? "归集项目" : "Collected Items"}</TabsTrigger>
          <TabsTrigger value="workflow" className="text-xs gap-1"><ArrowRight className="w-3.5 h-3.5" />{isZh ? "流程审批" : "Workflow"}</TabsTrigger>
          <TabsTrigger value="journal" className="text-xs gap-1"><BookOpen className="w-3.5 h-3.5" />{isZh ? "摊销台账" : "Journal"}</TabsTrigger>
        </TabsList>

        {/* Collected Items */}
        <TabsContent value="items">
          <Card>
            <CardContent className="pt-4">
              {items.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{isZh ? "暂无归集项目，请使用「AI智能归集」导入银行付款数据" : "No items yet. Use AI Collect to import bank data."}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">{isZh ? "类型" : "Type"}</TableHead>
                      <TableHead>{isZh ? "名称/来源" : "Name/Source"}</TableHead>
                      <TableHead className="text-right">{isZh ? "金额" : "Amount"}</TableHead>
                      <TableHead className="text-right">{isZh ? "月摊" : "Monthly"}</TableHead>
                      <TableHead>{isZh ? "进度" : "Progress"}</TableHead>
                      <TableHead>{isZh ? "AI置信度" : "AI Conf."}</TableHead>
                      <TableHead>{isZh ? "归集状态" : "Status"}</TableHead>
                      <TableHead>{isZh ? "操作" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(item => {
                      const typeInfo = ITEM_TYPES.find(t => t.value === item.item_type);
                      const progress = item.total_amount > 0 ? (item.amortized_total / item.total_amount) * 100 : 0;
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{typeInfo?.icon}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{item.name_zh}</div>
                            <div className="text-xs text-muted-foreground">{item.source_reference}</div>
                          </TableCell>
                          <TableCell className="text-right font-mono">¥{item.total_amount.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono text-xs">¥{item.monthly_amount.toLocaleString()}/{item.amortization_months}m</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={progress} className="w-16 h-2" />
                              <span className="text-xs">{progress.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.ai_confidence >= 0.8 ? "default" : "secondary"}>
                              {(item.ai_confidence * 100).toFixed(0)}%
                            </Badge>
                          </TableCell>
                          <TableCell>{statusBadge(item.collection_status)}</TableCell>
                          <TableCell>
                            {item.collection_status === "ai_suggested" && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => updateItemStatus(item.id, "collection_status", "confirmed")}>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => updateItemStatus(item.id, "collection_status", "rejected")}>
                                  <XCircle className="w-3.5 h-3.5 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow */}
        <TabsContent value="workflow">
          <Card>
            <CardContent className="pt-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2">{isZh ? "自动化流程节点（每项均需人工确认）" : "Automation Workflow Nodes (Manual Confirmation Required)"}</h3>
                <div className="flex items-center gap-2 mb-4">
                  {WORKFLOW_STEPS.map((step, i) => (
                    <div key={step.key} className="flex items-center gap-1">
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-xs">
                        <step.icon className="w-3.5 h-3.5" />
                        {isZh ? step.labelZh : step.labelEn}
                      </div>
                      {i < WORKFLOW_STEPS.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  ))}
                </div>
              </div>
              {items.filter(i => i.collection_status === "confirmed").length === 0 ? (
                <p className="text-center text-muted-foreground py-6">{isZh ? "暂无已确认的项目进入流程" : "No confirmed items in workflow"}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isZh ? "项目" : "Item"}</TableHead>
                      <TableHead>{isZh ? "金额" : "Amount"}</TableHead>
                      {WORKFLOW_STEPS.map(s => <TableHead key={s.key}>{isZh ? s.labelZh : s.labelEn}</TableHead>)}
                      <TableHead>{isZh ? "操作" : "Action"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.filter(i => i.collection_status === "confirmed").map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">{item.name_zh}</TableCell>
                        <TableCell className="font-mono">¥{item.total_amount.toLocaleString()}</TableCell>
                        <TableCell>{statusBadge(item.collection_status)}</TableCell>
                        <TableCell>{statusBadge(item.verification_status)}</TableCell>
                        <TableCell>{statusBadge(item.payment_status)}</TableCell>
                        <TableCell>{statusBadge(item.journal_status)}</TableCell>
                        <TableCell>
                          {item.verification_status === "pending" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateItemStatus(item.id, "verification_status", "verified")}>
                              {isZh ? "确认验证" : "Verify"}
                            </Button>
                          )}
                          {item.verification_status === "verified" && item.payment_status === "pending" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateItemStatus(item.id, "payment_status", "paid")}>
                              {isZh ? "确认付款" : "Confirm Pay"}
                            </Button>
                          )}
                          {item.payment_status === "paid" && item.journal_status === "pending" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateItemStatus(item.id, "journal_status", "posted")}>
                              {isZh ? "确认入账" : "Post"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journal */}
        <TabsContent value="journal">
          <Card>
            <CardContent className="pt-4">
              {journal.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">{isZh ? "暂无摊销凭证，请先确认项目后点击「生成本月摊销」" : "No journal entries. Confirm items and generate monthly."}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isZh ? "期间" : "Period"}</TableHead>
                      <TableHead>{isZh ? "项目" : "Item"}</TableHead>
                      <TableHead>{isZh ? "借方" : "Debit"}</TableHead>
                      <TableHead>{isZh ? "贷方" : "Credit"}</TableHead>
                      <TableHead className="text-right">{isZh ? "金额" : "Amount"}</TableHead>
                      <TableHead>{isZh ? "状态" : "Status"}</TableHead>
                      <TableHead>{isZh ? "操作" : "Action"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {journal.map(entry => {
                      const item = items.find(i => i.id === entry.amortization_item_id);
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="font-mono text-sm">{entry.period}</TableCell>
                          <TableCell className="text-sm">{item?.name_zh || "-"}</TableCell>
                          <TableCell className="text-xs">{entry.debit_account}</TableCell>
                          <TableCell className="text-xs">{entry.credit_account}</TableCell>
                          <TableCell className="text-right font-mono">¥{entry.amount.toLocaleString()}</TableCell>
                          <TableCell>{statusBadge(entry.status)}</TableCell>
                          <TableCell>
                            {entry.status === "pending" && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => postJournalEntry(entry)}>
                                <BookOpen className="w-3 h-3 mr-1" />{isZh ? "入总账" : "Post"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
