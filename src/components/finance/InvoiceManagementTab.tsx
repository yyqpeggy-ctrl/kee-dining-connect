import { motion } from "framer-motion";
import { Plus, Search, Filter, Download, Upload, FileText, Receipt, Eye, Trash2, CheckCircle, XCircle, AlertTriangle, Scan, Camera, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface InvoiceItem {
  name: string;
  quantity: number;
  unit_price: number;
  amount: number;
  tax_rate: number;
  tax_amount: number;
}

const InvoiceManagementTab = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const { storeId, isHQ, storeName } = useStore();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [newInvoice, setNewInvoice] = useState({
    type: "output" as "output" | "input",
    invoice_type: "general",
    invoice_number: "",
    invoice_code: "",
    amount: "",
    tax_rate: "0.06",
    buyer_name: "",
    buyer_tax_id: "",
    seller_name: "",
    seller_tax_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
  const ocrFileRef = useRef<HTMLInputElement>(null);

  const handleOcrUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(isZh ? "文件不能超过10MB" : "File must be under 10MB");
      return;
    }

    setOcrLoading(true);
    setOcrPreviewUrl(URL.createObjectURL(file));

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpeg";
      const { data, error } = await supabase.functions.invoke("ocr-invoice", {
        body: { image_base64: base64, file_type: fileExt },
      });

      if (error) throw error;

      const ocr = data?.ocr;
      if (!ocr || ocr.parse_error) {
        toast.error(isZh ? "OCR识别失败，请手动录入" : "OCR failed, please enter manually");
        return;
      }

      // Auto-fill form from OCR
      setNewInvoice(prev => ({
        ...prev,
        type: ocr.type || prev.type,
        invoice_type: ocr.invoice_type || prev.invoice_type,
        invoice_number: ocr.invoice_number || prev.invoice_number,
        invoice_code: ocr.invoice_code || prev.invoice_code,
        amount: ocr.amount != null ? String(ocr.amount) : prev.amount,
        tax_rate: ocr.tax_rate != null ? String(ocr.tax_rate) : prev.tax_rate,
        buyer_name: ocr.buyer_name || prev.buyer_name,
        buyer_tax_id: ocr.buyer_tax_id || prev.buyer_tax_id,
        seller_name: ocr.seller_name || prev.seller_name,
        seller_tax_id: ocr.seller_tax_id || prev.seller_tax_id,
        issue_date: ocr.issue_date || prev.issue_date,
        notes: ocr.notes || prev.notes,
      }));

      const confidence = ocr.confidence || 0;
      toast.success(
        isZh
          ? `✅ AI识别完成，置信度 ${confidence}%，请核对信息`
          : `✅ OCR complete, confidence ${confidence}%, please verify`
      );
    } catch (e: any) {
      console.error("OCR error:", e);
      toast.error(isZh ? "OCR识别出错: " + (e.message || "未知错误") : "OCR error: " + (e.message || "Unknown"));
    } finally {
      setOcrLoading(false);
    }
  };

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices", storeId],
    queryFn: async () => {
      let query = supabase.from("invoices").select("*").order("created_at", { ascending: false }).limit(100);
      if (!isHQ) query = query.eq("store_id", storeId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (invoice: any) => {
      const { error } = await supabase.from("invoices").insert(invoice);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setShowCreateDialog(false);
      toast.success(isZh ? "发票已录入" : "Invoice created");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(isZh ? "发票已删除" : "Invoice deleted");
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(isZh ? "状态已更新" : "Status updated");
    },
  });

  const filtered = useMemo(() => {
    let list = invoices;
    if (typeFilter !== "all") list = list.filter((i: any) => i.type === typeFilter);
    if (statusFilter !== "all") list = list.filter((i: any) => i.status === statusFilter);
    if (searchTerm) list = list.filter((i: any) => i.invoice_number?.includes(searchTerm) || i.buyer_name?.includes(searchTerm) || i.seller_name?.includes(searchTerm));
    return list;
  }, [invoices, typeFilter, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const output = invoices.filter((i: any) => i.type === "output");
    const input = invoices.filter((i: any) => i.type === "input");
    return {
      outputCount: output.length,
      outputAmount: output.reduce((s: number, i: any) => s + Number(i.total_with_tax || 0), 0),
      inputCount: input.length,
      inputAmount: input.reduce((s: number, i: any) => s + Number(i.total_with_tax || 0), 0),
      pendingCount: invoices.filter((i: any) => i.status === "pending").length,
      taxDiff: output.reduce((s: number, i: any) => s + Number(i.tax_amount || 0), 0) - input.reduce((s: number, i: any) => s + Number(i.tax_amount || 0), 0),
    };
  }, [invoices]);

  const handleCreate = () => {
    if (isHQ) { toast.error(isZh ? "请先选择具体门店" : "Select a store first"); return; }
    const amount = parseFloat(newInvoice.amount) || 0;
    const taxRate = parseFloat(newInvoice.tax_rate) || 0.06;
    const taxAmount = Math.round(amount * taxRate * 100) / 100;
    createMutation.mutate({
      type: newInvoice.type,
      invoice_type: newInvoice.invoice_type,
      invoice_number: newInvoice.invoice_number,
      invoice_code: newInvoice.invoice_code,
      amount,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_with_tax: amount + taxAmount,
      buyer_name: newInvoice.buyer_name,
      buyer_tax_id: newInvoice.buyer_tax_id,
      seller_name: newInvoice.seller_name,
      seller_tax_id: newInvoice.seller_tax_id,
      issue_date: newInvoice.issue_date,
      notes: newInvoice.notes,
      store_id: storeId,
      store_name_zh: storeName(true),
      store_name_en: storeName(false),
      status: "pending",
    });
  };

  const handleExport = () => {
    const headers = isZh
      ? ["发票号码", "发票代码", "类型", "发票类型", "不含税金额", "税率", "税额", "价税合计", "购方名称", "购方税号", "销方名称", "销方税号", "开票日期", "状态"]
      : ["Invoice No", "Code", "Type", "Invoice Type", "Amount", "Tax Rate", "Tax", "Total", "Buyer", "Buyer Tax ID", "Seller", "Seller Tax ID", "Date", "Status"];
    const data = filtered.map((i: any) => [
      i.invoice_number, i.invoice_code, i.type === "output" ? (isZh ? "销项" : "Output") : (isZh ? "进项" : "Input"),
      i.invoice_type === "special" ? (isZh ? "专票" : "Special") : i.invoice_type === "electronic" ? (isZh ? "电子" : "Electronic") : (isZh ? "普票" : "General"),
      i.amount, i.tax_rate, i.tax_amount, i.total_with_tax, i.buyer_name, i.buyer_tax_id, i.seller_name, i.seller_tax_id, i.issue_date, i.status,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isZh ? "发票台账" : "Invoices");
    XLSX.writeFile(wb, `${isZh ? "发票台账" : "Invoices"}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(isZh ? "发票台账已导出" : "Invoice ledger exported");
  };

  const typeLabel = (t: string) => t === "output" ? (isZh ? "销项" : "Output") : (isZh ? "进项" : "Input");
  const invoiceTypeLabel = (t: string) => t === "special" ? (isZh ? "增值税专用发票" : "VAT Special") : t === "electronic" ? (isZh ? "电子发票" : "Electronic") : (isZh ? "增值税普通发票" : "VAT General");
  const statusBadge = (s: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "outline", label: isZh ? "待验证" : "Pending" },
      verified: { variant: "secondary", label: isZh ? "已验证" : "Verified" },
      rejected: { variant: "destructive", label: isZh ? "已驳回" : "Rejected" },
      voided: { variant: "destructive", label: isZh ? "已作废" : "Voided" },
    };
    const m = map[s] || map.pending;
    return <Badge variant={m.variant} className="text-xs">{m.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">{isZh ? "销项发票" : "Output Invoices"}</p>
          <p className="text-2xl font-bold text-success">¥{(stats.outputAmount / 10000).toFixed(1)}<span className="text-sm font-normal text-muted-foreground">万</span></p>
          <p className="text-xs text-muted-foreground mt-1">{stats.outputCount} {isZh ? "张" : "invoices"}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">{isZh ? "进项发票" : "Input Invoices"}</p>
          <p className="text-2xl font-bold text-primary">¥{(stats.inputAmount / 10000).toFixed(1)}<span className="text-sm font-normal text-muted-foreground">万</span></p>
          <p className="text-xs text-muted-foreground mt-1">{stats.inputCount} {isZh ? "张" : "invoices"}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">{isZh ? "应纳税额差" : "Tax Difference"}</p>
          <p className={`text-2xl font-bold ${stats.taxDiff >= 0 ? "text-warning" : "text-success"}`}>¥{Math.abs(stats.taxDiff).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{isZh ? "销项-进项" : "Output - Input"}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <p className="text-xs text-muted-foreground">{isZh ? "待验证" : "Pending"}</p>
          </div>
          <p className="text-2xl font-bold text-warning">{stats.pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{isZh ? "需要核验" : "Need verification"}</p>
        </motion.div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={isZh ? "搜索发票号、购方/销方..." : "Search invoice no, buyer/seller..."} className="pl-9 bg-muted/50" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-28 bg-muted/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isZh ? "全部" : "All"}</SelectItem>
            <SelectItem value="output">{isZh ? "销项" : "Output"}</SelectItem>
            <SelectItem value="input">{isZh ? "进项" : "Input"}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-28 bg-muted/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isZh ? "全部状态" : "All Status"}</SelectItem>
            <SelectItem value="pending">{isZh ? "待验证" : "Pending"}</SelectItem>
            <SelectItem value="verified">{isZh ? "已验证" : "Verified"}</SelectItem>
            <SelectItem value="rejected">{isZh ? "已驳回" : "Rejected"}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}><Download className="w-4 h-4" />{isZh ? "导出台账" : "Export"}</Button>
        <Button size="sm" variant="secondary" className="gap-2" onClick={() => { setShowCreateDialog(true); setTimeout(() => ocrFileRef.current?.click(), 300); }}>
          <Scan className="w-4 h-4" />{isZh ? "OCR识别" : "OCR Scan"}
        </Button>
        <Button size="sm" className="gap-2 ml-auto" onClick={() => { setOcrPreviewUrl(null); setShowCreateDialog(true); }}><Plus className="w-4 h-4" />{isZh ? "录入发票" : "New Invoice"}</Button>
      </div>

      {/* Store context */}
      <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
        {isZh
          ? `📊 ${isHQ ? "全部门店汇总" : storeName(true)}，共 ${filtered.length} 张发票`
          : `📊 ${isHQ ? "All stores" : storeName(false)}, ${filtered.length} invoices`}
      </div>

      {/* Invoice Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">{isZh ? "发票号码" : "Invoice No"}</TableHead>
              <TableHead className="w-20">{isZh ? "类型" : "Type"}</TableHead>
              <TableHead>{isZh ? "购方/销方" : "Buyer/Seller"}</TableHead>
              <TableHead className="text-right">{isZh ? "不含税额" : "Amount"}</TableHead>
              <TableHead className="text-right">{isZh ? "税额" : "Tax"}</TableHead>
              <TableHead className="text-right">{isZh ? "价税合计" : "Total"}</TableHead>
              <TableHead className="w-24">{isZh ? "开票日期" : "Date"}</TableHead>
              <TableHead className="w-20">{isZh ? "状态" : "Status"}</TableHead>
              <TableHead className="w-28">{isZh ? "操作" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{isZh ? "暂无发票记录" : "No invoices"}</TableCell></TableRow>
            ) : (
              filtered.map((inv: any) => (
                <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/30">
                  <TableCell className="font-mono text-xs">{inv.invoice_number || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={inv.type === "output" ? "default" : "secondary"} className="text-xs">{typeLabel(inv.type)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{inv.type === "output" ? inv.buyer_name : inv.seller_name}</div>
                    <div className="text-xs text-muted-foreground">{invoiceTypeLabel(inv.invoice_type)}</div>
                  </TableCell>
                  <TableCell className="text-right font-medium">¥{Number(inv.amount).toLocaleString()}</TableCell>
                  <TableCell className="text-right text-muted-foreground">¥{Number(inv.tax_amount).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold">¥{Number(inv.total_with_tax).toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{inv.issue_date}</TableCell>
                  <TableCell>{statusBadge(inv.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setSelectedInvoice(inv); setShowDetailDialog(true); }}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {inv.status === "pending" && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-success" onClick={() => verifyMutation.mutate({ id: inv.id, status: "verified" })}>
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteMutation.mutate(inv.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isZh ? "录入发票" : "New Invoice"}</DialogTitle>
          </DialogHeader>

          {/* OCR Upload Section */}
          <div className="border-2 border-dashed border-primary/30 rounded-xl p-4 bg-primary/5 hover:bg-primary/10 transition-colors">
            <input
              ref={ocrFileRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleOcrUpload(file);
                e.target.value = "";
              }}
            />
            {ocrLoading ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm font-medium text-primary">{isZh ? "AI正在识别发票..." : "AI recognizing invoice..."}</p>
                <Progress value={65} className="w-48 h-2" />
              </div>
            ) : (
              <div
                className="flex flex-col items-center gap-2 cursor-pointer py-1"
                onClick={() => ocrFileRef.current?.click()}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{isZh ? "📸 拍照/上传发票，AI自动识别填充" : "📸 Upload invoice image for AI OCR"}</p>
                    <p className="text-xs text-muted-foreground">{isZh ? "支持JPG、PNG、PDF格式，最大10MB" : "Supports JPG, PNG, PDF, max 10MB"}</p>
                  </div>
                </div>
                {ocrPreviewUrl && (
                  <div className="mt-2 relative">
                    <img src={ocrPreviewUrl} alt="Invoice preview" className="max-h-24 rounded-lg border border-border/50 object-contain" />
                    <Badge variant="secondary" className="absolute -top-2 -right-2 text-[10px]">{isZh ? "已识别" : "Scanned"}</Badge>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{isZh ? "发票方向" : "Direction"}</Label>
                <Select value={newInvoice.type} onValueChange={(v: "output" | "input") => setNewInvoice(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="output">{isZh ? "销项发票（开出）" : "Output (Issued)"}</SelectItem>
                    <SelectItem value="input">{isZh ? "进项发票（收到）" : "Input (Received)"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{isZh ? "发票类型" : "Invoice Type"}</Label>
                <Select value={newInvoice.invoice_type} onValueChange={v => setNewInvoice(p => ({ ...p, invoice_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">{isZh ? "增值税普通发票" : "General VAT"}</SelectItem>
                    <SelectItem value="special">{isZh ? "增值税专用发票" : "Special VAT"}</SelectItem>
                    <SelectItem value="electronic">{isZh ? "电子发票" : "Electronic"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{isZh ? "发票号码" : "Invoice Number"}</Label>
                <Input value={newInvoice.invoice_number} onChange={e => setNewInvoice(p => ({ ...p, invoice_number: e.target.value }))} placeholder="00000000" />
              </div>
              <div className="space-y-1.5">
                <Label>{isZh ? "发票代码" : "Invoice Code"}</Label>
                <Input value={newInvoice.invoice_code} onChange={e => setNewInvoice(p => ({ ...p, invoice_code: e.target.value }))} placeholder="0000000000" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{isZh ? "不含税金额 (¥)" : "Amount (¥)"}</Label>
                <Input type="number" value={newInvoice.amount} onChange={e => setNewInvoice(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{isZh ? "税率" : "Tax Rate"}</Label>
                <Select value={newInvoice.tax_rate} onValueChange={v => setNewInvoice(p => ({ ...p, tax_rate: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.13">13%</SelectItem>
                    <SelectItem value="0.09">9%</SelectItem>
                    <SelectItem value="0.06">6%</SelectItem>
                    <SelectItem value="0.03">3%</SelectItem>
                    <SelectItem value="0.01">1%</SelectItem>
                    <SelectItem value="0">0% ({isZh ? "免税" : "Exempt"})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{isZh ? "开票日期" : "Issue Date"}</Label>
                <Input type="date" value={newInvoice.issue_date} onChange={e => setNewInvoice(p => ({ ...p, issue_date: e.target.value }))} />
              </div>
            </div>
            {/* Preview */}
            {newInvoice.amount && (
              <div className="bg-muted/30 rounded-lg p-3 text-sm border border-border/50">
                <p className="font-medium text-muted-foreground mb-1">{isZh ? "金额预览" : "Amount Preview"}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>{isZh ? "不含税" : "Excl. Tax"}: ¥{parseFloat(newInvoice.amount || "0").toLocaleString()}</div>
                  <div>{isZh ? "税额" : "Tax"}: ¥{(parseFloat(newInvoice.amount || "0") * parseFloat(newInvoice.tax_rate)).toLocaleString()}</div>
                  <div className="font-bold">{isZh ? "价税合计" : "Total"}: ¥{(parseFloat(newInvoice.amount || "0") * (1 + parseFloat(newInvoice.tax_rate))).toLocaleString()}</div>
                </div>
              </div>
            )}
            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">{newInvoice.type === "output" ? (isZh ? "购方信息" : "Buyer Info") : (isZh ? "销方信息" : "Seller Info")}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{isZh ? "名称" : "Name"}</Label>
                  <Input value={newInvoice.type === "output" ? newInvoice.buyer_name : newInvoice.seller_name} onChange={e => setNewInvoice(p => newInvoice.type === "output" ? { ...p, buyer_name: e.target.value } : { ...p, seller_name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{isZh ? "纳税人识别号" : "Tax ID"}</Label>
                  <Input value={newInvoice.type === "output" ? newInvoice.buyer_tax_id : newInvoice.seller_tax_id} onChange={e => setNewInvoice(p => newInvoice.type === "output" ? { ...p, buyer_tax_id: e.target.value } : { ...p, seller_tax_id: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{isZh ? "备注" : "Notes"}</Label>
              <Input value={newInvoice.notes} onChange={e => setNewInvoice(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>{isZh ? "取消" : "Cancel"}</Button>
            <Button onClick={handleCreate}>{isZh ? "确认录入" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isZh ? "发票详情" : "Invoice Details"}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">{isZh ? "发票号码：" : "No: "}</span>{selectedInvoice.invoice_number || "-"}</div>
                <div><span className="text-muted-foreground">{isZh ? "发票代码：" : "Code: "}</span>{selectedInvoice.invoice_code || "-"}</div>
                <div><span className="text-muted-foreground">{isZh ? "类型：" : "Type: "}</span>{typeLabel(selectedInvoice.type)} · {invoiceTypeLabel(selectedInvoice.invoice_type)}</div>
                <div><span className="text-muted-foreground">{isZh ? "开票日期：" : "Date: "}</span>{selectedInvoice.issue_date}</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                <div className="flex justify-between"><span>{isZh ? "不含税金额" : "Amount"}</span><span className="font-medium">¥{Number(selectedInvoice.amount).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>{isZh ? "税率" : "Tax Rate"}</span><span>{(Number(selectedInvoice.tax_rate) * 100).toFixed(0)}%</span></div>
                <div className="flex justify-between"><span>{isZh ? "税额" : "Tax"}</span><span>¥{Number(selectedInvoice.tax_amount).toLocaleString()}</span></div>
                <div className="flex justify-between font-bold border-t border-border pt-1"><span>{isZh ? "价税合计" : "Total"}</span><span>¥{Number(selectedInvoice.total_with_tax).toLocaleString()}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">{isZh ? "购方：" : "Buyer: "}</span>{selectedInvoice.buyer_name || "-"}</div>
                <div><span className="text-muted-foreground">{isZh ? "购方税号：" : "Buyer ID: "}</span>{selectedInvoice.buyer_tax_id || "-"}</div>
                <div><span className="text-muted-foreground">{isZh ? "销方：" : "Seller: "}</span>{selectedInvoice.seller_name || "-"}</div>
                <div><span className="text-muted-foreground">{isZh ? "销方税号：" : "Seller ID: "}</span>{selectedInvoice.seller_tax_id || "-"}</div>
              </div>
              {selectedInvoice.notes && <div><span className="text-muted-foreground">{isZh ? "备注：" : "Notes: "}</span>{selectedInvoice.notes}</div>}
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span>{isZh ? "状态" : "Status"}: {statusBadge(selectedInvoice.status)}</span>
                {isHQ && <span className="text-xs text-muted-foreground">{isZh ? selectedInvoice.store_name_zh : selectedInvoice.store_name_en}</span>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceManagementTab;
