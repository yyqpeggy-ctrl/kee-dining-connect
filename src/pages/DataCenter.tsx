import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Database, Download, Upload, FileSpreadsheet, FileText, FileJson, File,
  Search, Plus, Trash2, Copy, Eye, Clock, CheckCircle2, AlertCircle,
  FolderOpen, BookOpen, LayoutTemplate, ArrowDownToLine, ArrowUpFromLine
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import Papa from "papaparse";

// ===== Types =====
interface DataTemplate {
  id: string;
  name_zh: string;
  name_en: string;
  description_zh: string;
  description_en: string;
  module: string;
  type: "import" | "export" | "both";
  format: string[];
  fields: { key: string; label_zh: string; label_en: string; required?: boolean; type?: string }[];
}

interface ImportRecord {
  id: string;
  template: string;
  fileName: string;
  status: "success" | "error" | "partial" | "processing";
  rows: number;
  errors: number;
  date: string;
}

interface KnowledgeDoc {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

// ===== Template Definitions =====
const dataTemplates: DataTemplate[] = [
  {
    id: "inventory-items",
    name_zh: "库存物料",
    name_en: "Inventory Items",
    description_zh: "批量导入或导出库存物料数据，包括名称、品类、库存量、成本等",
    description_en: "Bulk import/export inventory items including name, category, stock, cost",
    module: "inventory",
    type: "both",
    format: ["xlsx", "csv", "json"],
    fields: [
      { key: "name_zh", label_zh: "中文名称", label_en: "Chinese Name", required: true },
      { key: "name_en", label_zh: "英文名称", label_en: "English Name", required: true },
      { key: "category_zh", label_zh: "品类(中)", label_en: "Category (ZH)" },
      { key: "category_en", label_zh: "品类(英)", label_en: "Category (EN)" },
      { key: "stock", label_zh: "库存量", label_en: "Stock", type: "number" },
      { key: "unit", label_zh: "单位", label_en: "Unit" },
      { key: "min_stock", label_zh: "安全库存", label_en: "Min Stock", type: "number" },
      { key: "pour_cost", label_zh: "倒损成本%", label_en: "Pour Cost %", type: "number" },
      { key: "target_cost", label_zh: "目标成本%", label_en: "Target Cost %", type: "number" },
    ],
  },
  {
    id: "menu-items",
    name_zh: "菜单项目",
    name_en: "Menu Items",
    description_zh: "批量导入或导出菜单数据，包括菜品名称、价格、品类、描述等",
    description_en: "Bulk import/export menu items including name, price, category, description",
    module: "menu",
    type: "both",
    format: ["xlsx", "csv", "json"],
    fields: [
      { key: "name_zh", label_zh: "中文名称", label_en: "Chinese Name", required: true },
      { key: "name_en", label_zh: "英文名称", label_en: "English Name", required: true },
      { key: "category", label_zh: "品类", label_en: "Category" },
      { key: "price", label_zh: "价格", label_en: "Price", type: "number", required: true },
      { key: "cost_price", label_zh: "成本价", label_en: "Cost Price", type: "number" },
      { key: "description_zh", label_zh: "中文描述", label_en: "Description (ZH)" },
      { key: "description_en", label_zh: "英文描述", label_en: "Description (EN)" },
      { key: "is_available", label_zh: "是否可用", label_en: "Available", type: "boolean" },
    ],
  },
  {
    id: "suppliers",
    name_zh: "供应商",
    name_en: "Suppliers",
    description_zh: "批量导入或导出供应商信息，包括名称、联系方式、银行信息等",
    description_en: "Bulk import/export supplier data including name, contact, bank info",
    module: "procurement",
    type: "both",
    format: ["xlsx", "csv", "json"],
    fields: [
      { key: "name", label_zh: "供应商名称", label_en: "Supplier Name", required: true },
      { key: "short_name", label_zh: "简称", label_en: "Short Name" },
      { key: "contact_person", label_zh: "联系人", label_en: "Contact Person" },
      { key: "phone", label_zh: "电话", label_en: "Phone" },
      { key: "email", label_zh: "邮箱", label_en: "Email" },
      { key: "address", label_zh: "地址", label_en: "Address" },
      { key: "bank_name", label_zh: "开户行", label_en: "Bank Name" },
      { key: "bank_account", label_zh: "银行账号", label_en: "Bank Account" },
      { key: "tax_id", label_zh: "税号", label_en: "Tax ID" },
    ],
  },
  {
    id: "procurement-orders",
    name_zh: "采购订单",
    name_en: "Procurement Orders",
    description_zh: "导出采购订单历史记录，支持按日期和状态筛选",
    description_en: "Export procurement order history, filterable by date and status",
    module: "procurement",
    type: "export",
    format: ["xlsx", "csv", "json", "pdf"],
    fields: [
      { key: "order_number", label_zh: "采购单号", label_en: "PO Number" },
      { key: "supplier_name", label_zh: "供应商", label_en: "Supplier" },
      { key: "total_amount", label_zh: "总金额", label_en: "Total Amount" },
      { key: "status", label_zh: "状态", label_en: "Status" },
      { key: "created_at", label_zh: "下单日期", label_en: "Order Date" },
      { key: "store_name_zh", label_zh: "门店", label_en: "Store" },
    ],
  },
  {
    id: "finance-transactions",
    name_zh: "财务交易",
    name_en: "Finance Transactions",
    description_zh: "导出收支明细和记账凭证，支持按时段和门店筛选",
    description_en: "Export transaction records and journal entries, filterable by period and store",
    module: "finance",
    type: "export",
    format: ["xlsx", "csv", "json", "pdf"],
    fields: [
      { key: "transaction_number", label_zh: "凭证号", label_en: "Voucher #" },
      { key: "description_zh", label_zh: "摘要", label_en: "Description" },
      { key: "amount", label_zh: "金额", label_en: "Amount" },
      { key: "type", label_zh: "类型", label_en: "Type" },
      { key: "category", label_zh: "科目", label_en: "Category" },
      { key: "debit_account", label_zh: "借方", label_en: "Debit" },
      { key: "credit_account", label_zh: "贷方", label_en: "Credit" },
      { key: "store_name_zh", label_zh: "门店", label_en: "Store" },
      { key: "created_at", label_zh: "日期", label_en: "Date" },
    ],
  },
  {
    id: "orders-history",
    name_zh: "订单记录",
    name_en: "Order History",
    description_zh: "导出点单历史，包括订单明细、金额、桌号等信息",
    description_en: "Export order history including items, amount, table info",
    module: "orders",
    type: "export",
    format: ["xlsx", "csv", "json"],
    fields: [
      { key: "order_number", label_zh: "订单号", label_en: "Order #" },
      { key: "table_name", label_zh: "桌号", label_en: "Table" },
      { key: "total", label_zh: "金额", label_en: "Total" },
      { key: "status", label_zh: "状态", label_en: "Status" },
      { key: "created_at", label_zh: "时间", label_en: "Time" },
    ],
  },
  {
    id: "partners",
    name_zh: "合作伙伴",
    name_en: "Partners",
    description_zh: "批量导入或导出合作伙伴数据",
    description_en: "Bulk import/export partner data",
    module: "marketing",
    type: "both",
    format: ["xlsx", "csv"],
    fields: [
      { key: "name", label_zh: "名称", label_en: "Name", required: true },
      { key: "type", label_zh: "类型", label_en: "Type" },
      { key: "contact_person", label_zh: "联系人", label_en: "Contact" },
      { key: "phone", label_zh: "电话", label_en: "Phone" },
      { key: "commission_rate", label_zh: "佣金率", label_en: "Commission Rate", type: "number" },
    ],
  },
];

const knowledgeCategories = ["SOP", "Recipe", "Training", "Procurement", "Compliance", "Marketing", "General"];

const importHistory: ImportRecord[] = [
  { id: "1", template: "库存物料", fileName: "inventory_2026Q1.xlsx", status: "success", rows: 156, errors: 0, date: "2026-02-20 14:30" },
  { id: "2", template: "菜单项目", fileName: "menu_update.csv", status: "partial", rows: 42, errors: 3, date: "2026-02-18 09:15" },
  { id: "3", template: "供应商", fileName: "suppliers_new.xlsx", status: "success", rows: 12, errors: 0, date: "2026-02-15 16:45" },
  { id: "4", template: "合作伙伴", fileName: "partners.csv", status: "error", rows: 0, errors: 8, date: "2026-02-10 11:20" },
];

const moduleLabels: Record<string, { zh: string; en: string }> = {
  inventory: { zh: "库存", en: "Inventory" },
  menu: { zh: "菜单", en: "Menu" },
  procurement: { zh: "采购", en: "Procurement" },
  finance: { zh: "财务", en: "Finance" },
  orders: { zh: "订单", en: "Orders" },
  marketing: { zh: "市场", en: "Marketing" },
  hr: { zh: "人事", en: "HR" },
};

const tableNameMap: Record<string, string> = {
  "inventory-items": "inventory_items",
  "menu-items": "menu_items",
  "suppliers": "suppliers",
  "procurement-orders": "procurement_orders",
  "finance-transactions": "finance_transactions",
  "orders-history": "orders",
  "partners": "partners",
};

const DataCenter = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<DataTemplate | null>(null);
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [knowledgeSearch, setKnowledgeSearch] = useState("");
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadCategory, setUploadCategory] = useState("General");
  const knowledgeFileRef = useRef<HTMLInputElement>(null);

  // Fetch knowledge docs from DB
  const fetchKnowledgeDocs = useCallback(async () => {
    setIsLoadingDocs(true);
    try {
      const { data, error } = await supabase
        .from("knowledge_documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setKnowledgeDocs((data || []) as unknown as KnowledgeDoc[]);
    } catch (e: any) {
      console.error("Fetch knowledge docs error:", e);
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  useEffect(() => { fetchKnowledgeDocs(); }, [fetchKnowledgeDocs]);

  // Upload knowledge doc
  const handleUploadKnowledgeDoc = async (file: File) => {
    if (!uploadTitle.trim()) {
      toast.error(isZh ? "请输入文档标题" : "Please enter a document title");
      return;
    }
    setIsUploadingDoc(true);
    try {
      const fileExt = file.name.split(".").pop() || "bin";
      const filePath = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("knowledge-files")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("knowledge-files")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("knowledge_documents")
        .insert({
          title: uploadTitle.trim(),
          description: uploadDescription.trim() || null,
          category: uploadCategory,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_type: fileExt.toUpperCase(),
          file_size: file.size,
        } as any);
      if (insertError) throw insertError;

      toast.success(isZh ? "文档上传成功" : "Document uploaded successfully");
      setUploadDialogOpen(false);
      setUploadTitle("");
      setUploadDescription("");
      setUploadCategory("General");
      fetchKnowledgeDocs();
    } catch (e: any) {
      console.error("Upload error:", e);
      toast.error(isZh ? `上传失败: ${e.message}` : `Upload failed: ${e.message}`);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Delete knowledge doc
  const handleDeleteKnowledgeDoc = async (doc: KnowledgeDoc) => {
    try {
      // Extract storage path from URL
      const urlParts = doc.file_url.split("/knowledge-files/");
      if (urlParts[1]) {
        await supabase.storage.from("knowledge-files").remove([urlParts[1]]);
      }
      const { error } = await supabase.from("knowledge_documents").delete().eq("id", doc.id as any);
      if (error) throw error;
      toast.success(isZh ? "文档已删除" : "Document deleted");
      fetchKnowledgeDocs();
    } catch (e: any) {
      toast.error(isZh ? `删除失败: ${e.message}` : `Delete failed: ${e.message}`);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredTemplates = dataTemplates.filter((t) => {
    const matchSearch = searchQuery === "" ||
      t.name_zh.includes(searchQuery) || t.name_en.toLowerCase().includes(searchQuery.toLowerCase());
    const matchModule = moduleFilter === "all" || t.module === moduleFilter;
    return matchSearch && matchModule;
  });

  const filteredDocs = knowledgeDocs.filter(d =>
    knowledgeSearch === "" ||
    d.title.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
    d.category.toLowerCase().includes(knowledgeSearch.toLowerCase())
  );

  // ===== Export Logic =====
  const handleExport = async (template: DataTemplate, format: string) => {
    setIsExporting(true);
    try {
      const tableName = tableNameMap[template.id];
      if (!tableName) throw new Error("Unknown table");

      const { data, error } = await supabase.from(tableName as any).select("*").limit(1000);
      if (error) throw error;

      const rows = (data || []) as Record<string, any>[];
      if (rows.length === 0) {
        toast.warning(isZh ? "没有数据可导出" : "No data to export");
        setIsExporting(false);
        return;
      }

      // Filter to template fields only
      const fieldKeys = template.fields.map(f => f.key);
      const filtered = rows.map(row => {
        const obj: Record<string, any> = {};
        fieldKeys.forEach(k => { obj[k] = row[k] ?? ""; });
        return obj;
      });

      const fileName = `${template.id}_${new Date().toISOString().slice(0, 10)}`;

      if (format === "xlsx") {
        const ws = XLSX.utils.json_to_sheet(filtered);
        const headerRow = template.fields.map(f => isZh ? f.label_zh : f.label_en);
        XLSX.utils.sheet_add_aoa(ws, [headerRow], { origin: "A1" });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, template.name_en);
        XLSX.writeFile(wb, `${fileName}.xlsx`);
      } else if (format === "csv") {
        const csv = Papa.unparse(filtered);
        const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${fileName}.csv`; a.click();
        URL.revokeObjectURL(url);
      } else if (format === "json") {
        const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${fileName}.json`; a.click();
        URL.revokeObjectURL(url);
      }

      toast.success(isZh ? `已导出 ${rows.length} 条记录` : `Exported ${rows.length} records`);
    } catch (e: any) {
      console.error("Export error:", e);
      toast.error(isZh ? `导出失败: ${e.message}` : `Export failed: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // ===== Download Template =====
  const handleDownloadTemplate = (template: DataTemplate) => {
    const headers = template.fields.map(f => isZh ? f.label_zh : f.label_en);
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    // Add example row
    const exampleRow = template.fields.map(f => {
      if (f.type === "number") return 0;
      if (f.type === "boolean") return "true";
      return isZh ? `示例${f.label_zh}` : `Example ${f.label_en}`;
    });
    XLSX.utils.sheet_add_aoa(ws, [exampleRow], { origin: "A2" });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${template.id}_template.xlsx`);
    toast.success(isZh ? "模板已下载" : "Template downloaded");
  };

  // ===== Import Logic =====
  const handleImport = async (template: DataTemplate, file: File) => {
    setIsImporting(true);
    try {
      const tableName = tableNameMap[template.id];
      if (!tableName) throw new Error("Unknown table");

      let rows: Record<string, any>[] = [];
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "xlsx" || ext === "xls") {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer);
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws);
      } else if (ext === "csv") {
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        rows = result.data as Record<string, any>[];
      } else if (ext === "json") {
        const text = await file.text();
        rows = JSON.parse(text);
        if (!Array.isArray(rows)) throw new Error("JSON must be an array");
      } else {
        throw new Error(isZh ? "不支持的文件格式" : "Unsupported file format");
      }

      if (rows.length === 0) {
        toast.warning(isZh ? "文件中没有数据" : "No data in file");
        setIsImporting(false);
        return;
      }

      // Map headers to field keys
      const fieldMap = new Map<string, string>();
      template.fields.forEach(f => {
        fieldMap.set(f.label_zh, f.key);
        fieldMap.set(f.label_en, f.key);
        fieldMap.set(f.key, f.key);
      });

      const mapped = rows.map(row => {
        const obj: Record<string, any> = {};
        Object.entries(row).forEach(([key, value]) => {
          const fieldKey = fieldMap.get(key) || key;
          obj[fieldKey] = value;
        });
        return obj;
      });

      const { error } = await supabase.from(tableName as any).insert(mapped as any);
      if (error) throw error;

      toast.success(isZh ? `成功导入 ${mapped.length} 条记录` : `Successfully imported ${mapped.length} records`);
      setImportDialogOpen(false);
    } catch (e: any) {
      console.error("Import error:", e);
      toast.error(isZh ? `导入失败: ${e.message}` : `Import failed: ${e.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
      success: { label: isZh ? "成功" : "Success", variant: "default" },
      error: { label: isZh ? "失败" : "Failed", variant: "destructive" },
      partial: { label: isZh ? "部分成功" : "Partial", variant: "secondary" },
      processing: { label: isZh ? "处理中" : "Processing", variant: "outline" },
    };
    const s = map[status] || map.success;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const getFormatIcon = (format: string) => {
    if (format === "xlsx" || format === "xls") return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
    if (format === "csv") return <FileText className="w-4 h-4 text-blue-600" />;
    if (format === "json") return <FileJson className="w-4 h-4 text-amber-600" />;
    if (format === "pdf") return <File className="w-4 h-4 text-red-600" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Database className="w-6 h-6 text-primary" />
              {isZh ? "数据中心" : "Data Center"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isZh ? "数据导入导出 · 模板管理 · 知识库" : "Import/Export · Templates · Knowledge Base"}
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <LayoutTemplate className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{dataTemplates.length}</p>
                  <p className="text-xs text-muted-foreground">{isZh ? "数据模板" : "Templates"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ArrowUpFromLine className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{dataTemplates.filter(t => t.type !== "export").length}</p>
                  <p className="text-xs text-muted-foreground">{isZh ? "可导入" : "Importable"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ArrowDownToLine className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{dataTemplates.length}</p>
                  <p className="text-xs text-muted-foreground">{isZh ? "可导出" : "Exportable"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{knowledgeDocs.length}</p>
                  <p className="text-xs text-muted-foreground">{isZh ? "知识文档" : "Knowledge Docs"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="templates" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="templates" className="gap-1.5"><LayoutTemplate className="w-3.5 h-3.5" />{isZh ? "数据模板" : "Templates"}</TabsTrigger>
            <TabsTrigger value="import" className="gap-1.5"><Upload className="w-3.5 h-3.5" />{isZh ? "数据导入" : "Import"}</TabsTrigger>
            <TabsTrigger value="export" className="gap-1.5"><Download className="w-3.5 h-3.5" />{isZh ? "数据导出" : "Export"}</TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5"><Clock className="w-3.5 h-3.5" />{isZh ? "操作记录" : "History"}</TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-1.5"><BookOpen className="w-3.5 h-3.5" />{isZh ? "知识库" : "Knowledge"}</TabsTrigger>
          </TabsList>

          {/* ===== Templates Tab ===== */}
          <TabsContent value="templates">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{isZh ? "数据模板库" : "Template Library"}</CardTitle>
                    <CardDescription>{isZh ? "提供标准化的数据导入导出模板，覆盖所有业务模块" : "Standardized import/export templates for all business modules"}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-8 w-56" placeholder={isZh ? "搜索模板..." : "Search templates..."} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <Select value={moduleFilter} onValueChange={setModuleFilter}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{isZh ? "全部模块" : "All Modules"}</SelectItem>
                        {Object.entries(moduleLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{isZh ? v.zh : v.en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTemplates.map(t => (
                    <Card key={t.id} className="border-border hover:border-primary/30 transition-colors">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">{isZh ? t.name_zh : t.name_en}</h3>
                              <Badge variant="outline" className="text-xs">
                                {isZh ? moduleLabels[t.module]?.zh : moduleLabels[t.module]?.en}
                              </Badge>
                              <Badge variant={t.type === "both" ? "default" : "secondary"} className="text-xs">
                                {t.type === "both" ? (isZh ? "双向" : "Both") : t.type === "import" ? (isZh ? "导入" : "Import") : (isZh ? "导出" : "Export")}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{isZh ? t.description_zh : t.description_en}</p>
                            <div className="flex items-center gap-1.5">
                              {t.format.map(f => (
                                <span key={f} className="flex items-center gap-0.5 text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                  {getFormatIcon(f)} {f.toUpperCase()}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5">{t.fields.length} {isZh ? "个字段" : "fields"}</p>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Button size="sm" variant="outline" onClick={() => { setSelectedTemplate(t); setPreviewDialogOpen(true); }}>
                              <Eye className="w-3.5 h-3.5 mr-1" />{isZh ? "预览" : "Preview"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDownloadTemplate(t)}>
                              <Download className="w-3.5 h-3.5 mr-1" />{isZh ? "模板" : "Template"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Import Tab ===== */}
          <TabsContent value="import">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>{isZh ? "数据导入" : "Data Import"}</CardTitle>
                <CardDescription>{isZh ? "选择模板，上传文件批量导入数据。支持 Excel、CSV、JSON 格式" : "Select template, upload file to bulk import. Supports Excel, CSV, JSON"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dataTemplates.filter(t => t.type !== "export").map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Upload className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{isZh ? t.name_zh : t.name_en}</h3>
                          <p className="text-xs text-muted-foreground">{isZh ? t.description_zh : t.description_en}</p>
                          <div className="flex gap-1 mt-1">
                            {t.format.filter(f => f !== "pdf").map(f => (
                              <span key={f} className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{f.toUpperCase()}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleDownloadTemplate(t)}>
                          <Download className="w-3.5 h-3.5 mr-1" />{isZh ? "下载模板" : "Template"}
                        </Button>
                        <Button size="sm" onClick={() => { setSelectedTemplate(t); setImportDialogOpen(true); }}>
                          <Upload className="w-3.5 h-3.5 mr-1" />{isZh ? "导入数据" : "Import"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Export Tab ===== */}
          <TabsContent value="export">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>{isZh ? "数据导出" : "Data Export"}</CardTitle>
                <CardDescription>{isZh ? "选择模板和格式，一键导出业务数据" : "Select template and format to export business data"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dataTemplates.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Download className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{isZh ? t.name_zh : t.name_en}</h3>
                          <p className="text-xs text-muted-foreground">{isZh ? t.description_zh : t.description_en}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Select defaultValue="xlsx" onValueChange={setExportFormat}>
                          <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {t.format.map(f => (
                              <SelectItem key={f} value={f}>{f.toUpperCase()}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={() => handleExport(t, exportFormat)} disabled={isExporting}>
                          <Download className="w-3.5 h-3.5 mr-1" />{isExporting ? (isZh ? "导出中..." : "Exporting...") : (isZh ? "导出" : "Export")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== History Tab ===== */}
          <TabsContent value="history">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>{isZh ? "操作记录" : "Operation History"}</CardTitle>
                <CardDescription>{isZh ? "查看所有数据导入导出的历史记录" : "View all import/export operation history"}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isZh ? "模板" : "Template"}</TableHead>
                      <TableHead>{isZh ? "文件名" : "File Name"}</TableHead>
                      <TableHead>{isZh ? "状态" : "Status"}</TableHead>
                      <TableHead>{isZh ? "记录数" : "Rows"}</TableHead>
                      <TableHead>{isZh ? "错误数" : "Errors"}</TableHead>
                      <TableHead>{isZh ? "时间" : "Time"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importHistory.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.template}</TableCell>
                        <TableCell className="flex items-center gap-1.5">
                          <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                          {r.fileName}
                        </TableCell>
                        <TableCell>{getStatusBadge(r.status)}</TableCell>
                        <TableCell>{r.rows}</TableCell>
                        <TableCell className={r.errors > 0 ? "text-destructive" : ""}>{r.errors}</TableCell>
                        <TableCell className="text-muted-foreground">{r.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Knowledge Tab ===== */}
          <TabsContent value="knowledge">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{isZh ? "知识库管理" : "Knowledge Base"}</CardTitle>
                    <CardDescription>{isZh ? "管理SOP、培训资料、配方、品牌指南等文档知识" : "Manage SOPs, training materials, recipes, brand guidelines"}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-8 w-56" placeholder={isZh ? "搜索文档..." : "Search docs..."} value={knowledgeSearch} onChange={e => setKnowledgeSearch(e.target.value)} />
                    </div>
                    <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1" />{isZh ? "上传文档" : "Upload Doc"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingDocs ? (
                  <div className="text-center py-12 text-muted-foreground">{isZh ? "加载中..." : "Loading..."}</div>
                ) : filteredDocs.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{isZh ? "暂无文档，点击上方按钮上传" : "No documents yet. Click Upload to add one."}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDocs.map(doc => (
                      <Card key={doc.id} className="border-border hover:border-primary/30 transition-colors group">
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              {getFormatIcon(doc.file_type.toLowerCase())}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-foreground text-sm truncate">{doc.title}</h3>
                              {doc.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{doc.description}</p>}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">{doc.category}</Badge>
                                <span className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</span>
                                <span className="text-xs text-muted-foreground">{doc.updated_at.slice(0, 10)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="outline" className="h-7 text-xs flex-1" asChild>
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="w-3 h-3 mr-1" />{isZh ? "下载" : "Download"}
                              </a>
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs flex-1" asChild>
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                <Eye className="w-3 h-3 mr-1" />{isZh ? "预览" : "Preview"}
                              </a>
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => handleDeleteKnowledgeDoc(doc)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ===== Import Dialog ===== */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{isZh ? "导入数据" : "Import Data"} - {selectedTemplate && (isZh ? selectedTemplate.name_zh : selectedTemplate.name_en)}</DialogTitle>
              <DialogDescription>
                {isZh ? "选择文件上传，支持 Excel、CSV、JSON 格式" : "Upload a file in Excel, CSV, or JSON format"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">{isZh ? "拖拽文件到这里或点击选择" : "Drag file here or click to select"}</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.json"
                  className="hidden"
                  id="import-file-input"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file && selectedTemplate) handleImport(selectedTemplate, file);
                  }}
                />
                <Button variant="outline" onClick={() => document.getElementById("import-file-input")?.click()} disabled={isImporting}>
                  {isImporting ? (isZh ? "导入中..." : "Importing...") : (isZh ? "选择文件" : "Select File")}
                </Button>
              </div>
              {selectedTemplate && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{isZh ? "必填字段：" : "Required fields:"}</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedTemplate.fields.filter(f => f.required).map(f => (
                      <Badge key={f.key} variant="outline" className="text-xs">{isZh ? f.label_zh : f.label_en}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ===== Preview Dialog ===== */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{isZh ? "模板预览" : "Template Preview"} - {selectedTemplate && (isZh ? selectedTemplate.name_zh : selectedTemplate.name_en)}</DialogTitle>
              <DialogDescription>
                {selectedTemplate && (isZh ? selectedTemplate.description_zh : selectedTemplate.description_en)}
              </DialogDescription>
            </DialogHeader>
            {selectedTemplate && (
              <div className="space-y-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isZh ? "字段名" : "Field"}</TableHead>
                      <TableHead>{isZh ? "类型" : "Type"}</TableHead>
                      <TableHead>{isZh ? "必填" : "Required"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTemplate.fields.map(f => (
                      <TableRow key={f.key}>
                        <TableCell className="font-medium">{isZh ? f.label_zh : f.label_en}</TableCell>
                        <TableCell className="text-muted-foreground">{f.type || "text"}</TableCell>
                        <TableCell>{f.required ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <span className="text-muted-foreground">-</span>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => selectedTemplate && handleDownloadTemplate(selectedTemplate)}>
                    <Download className="w-3.5 h-3.5 mr-1" />{isZh ? "下载模板" : "Download Template"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ===== Upload Knowledge Doc Dialog ===== */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{isZh ? "上传知识文档" : "Upload Knowledge Document"}</DialogTitle>
              <DialogDescription>{isZh ? "上传SOP、配方、培训资料等文档到知识库" : "Upload SOPs, recipes, training materials to the knowledge base"}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">{isZh ? "文档标题" : "Title"} *</label>
                <Input className="mt-1" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder={isZh ? "输入文档标题..." : "Enter document title..."} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{isZh ? "分类" : "Category"}</label>
                <Select value={uploadCategory} onValueChange={setUploadCategory}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {knowledgeCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{isZh ? "描述" : "Description"}</label>
                <Textarea className="mt-1" value={uploadDescription} onChange={e => setUploadDescription(e.target.value)} placeholder={isZh ? "可选：输入描述..." : "Optional: enter description..."} rows={2} />
              </div>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">{isZh ? "选择要上传的文件" : "Select a file to upload"}</p>
                <input
                  ref={knowledgeFileRef}
                  type="file"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadKnowledgeDoc(file);
                  }}
                />
                <Button variant="outline" onClick={() => knowledgeFileRef.current?.click()} disabled={isUploadingDoc}>
                  {isUploadingDoc ? (isZh ? "上传中..." : "Uploading...") : (isZh ? "选择文件" : "Select File")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default DataCenter;
