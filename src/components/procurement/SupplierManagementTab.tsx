import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Building2, Plus, Star, Ban, Phone, Mail, CreditCard, FileText,
  ChevronDown, ChevronUp, Upload, Loader2, CheckCircle, AlertTriangle,
  Edit2, Trash2, Eye
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SupplierFormDialog from "./SupplierFormDialog";
import SupplierContractDialog from "./SupplierContractDialog";

interface Supplier {
  id: string;
  name: string;
  short_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  bank_name: string;
  bank_branch: string;
  bank_account: string;
  bank_account_name: string;
  tax_id: string;
  invoice_type: string;
  invoice_address: string;
  invoice_phone: string;
  invoice_bank_name: string;
  invoice_bank_account: string;
  rating: number;
  status: string;
  blacklist_reason: string;
  tags: string[];
  notes: string;
  wechat_openid: string;
  created_at: string;
}

const SupplierManagementTab = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [contractSupplierId, setContractSupplierId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "blacklisted">("all");

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("suppliers").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data, error } = await query;
    if (!error && data) setSuppliers(data as Supplier[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const handleDelete = async (id: string) => {
    if (!confirm(isZh ? "确定删除此供应商？" : "Delete this supplier?")) return;
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(isZh ? "已删除" : "Deleted"); fetchSuppliers(); }
  };

  const handleBlacklist = async (supplier: Supplier) => {
    const reason = prompt(isZh ? "请输入拉黑原因：" : "Enter blacklist reason:");
    if (reason === null) return;
    const { error } = await supabase.from("suppliers").update({
      status: "blacklisted", blacklist_reason: reason
    }).eq("id", supplier.id);
    if (error) toast.error(error.message);
    else { toast.success(isZh ? "已拉黑" : "Blacklisted"); fetchSuppliers(); }
  };

  const statusColors: Record<string, string> = {
    active: "bg-success/10 text-success",
    inactive: "bg-muted text-muted-foreground",
    blacklisted: "bg-destructive/10 text-destructive",
  };

  const statusLabels: Record<string, string> = {
    active: isZh ? "合作中" : "Active",
    inactive: isZh ? "已停用" : "Inactive",
    blacklisted: isZh ? "黑名单" : "Blacklisted",
  };

  const activeCount = suppliers.filter(s => s.status === "active").length;
  const blacklistedCount = suppliers.filter(s => s.status === "blacklisted").length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <Building2 className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-xl font-bold">{suppliers.length}</p>
          <p className="text-xs text-muted-foreground">{isZh ? "供应商总数" : "Total Suppliers"}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <CheckCircle className="w-6 h-6 mx-auto mb-2 text-success" />
          <p className="text-xl font-bold">{activeCount}</p>
          <p className="text-xs text-muted-foreground">{isZh ? "合作中" : "Active"}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <Ban className="w-6 h-6 mx-auto mb-2 text-destructive" />
          <p className="text-xl font-bold">{blacklistedCount}</p>
          <p className="text-xs text-muted-foreground">{isZh ? "黑名单" : "Blacklisted"}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["all", "active", "inactive", "blacklisted"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {f === "all" ? (isZh ? "全部" : "All") : statusLabels[f]}
            </button>
          ))}
        </div>
        <button onClick={() => { setEditingSupplier(null); setShowForm(true); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />{isZh ? "新增供应商" : "Add Supplier"}
        </button>
      </div>

      {/* Supplier list */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">{isZh ? "暂无供应商" : "No suppliers"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suppliers.map((supplier, i) => (
            <motion.div key={supplier.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`glass-card rounded-xl overflow-hidden ${supplier.status === "blacklisted" ? "border-l-4 border-l-destructive" : ""}`}>
              {/* Header */}
              <div className="p-4 cursor-pointer" onClick={() => setExpandedId(expandedId === supplier.id ? null : supplier.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{supplier.name}</span>
                        {supplier.short_name && <span className="text-xs text-muted-foreground">({supplier.short_name})</span>}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[supplier.status]}`}>
                          {statusLabels[supplier.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {supplier.contact_person && <span>{supplier.contact_person}</span>}
                        {supplier.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{supplier.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Rating stars */}
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= supplier.rating ? "text-warning fill-warning" : "text-muted"}`} />
                      ))}
                    </div>
                    {expandedId === supplier.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === supplier.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  {/* Bank info */}
                  <div>
                    <p className="text-xs font-semibold mb-1.5 flex items-center gap-1"><CreditCard className="w-3.5 h-3.5 text-primary" />{isZh ? "银行账户信息" : "Bank Account"}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 rounded-lg p-2.5">
                      <div><span className="text-muted-foreground">{isZh ? "开户行：" : "Bank: "}</span>{supplier.bank_name || "-"}</div>
                      <div><span className="text-muted-foreground">{isZh ? "支行：" : "Branch: "}</span>{supplier.bank_branch || "-"}</div>
                      <div><span className="text-muted-foreground">{isZh ? "账号：" : "Account: "}</span><span className="font-mono">{supplier.bank_account || "-"}</span></div>
                      <div><span className="text-muted-foreground">{isZh ? "户名：" : "Name: "}</span>{supplier.bank_account_name || "-"}</div>
                    </div>
                  </div>

                  {/* Invoice info */}
                  <div>
                    <p className="text-xs font-semibold mb-1.5 flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-primary" />{isZh ? "开票信息" : "Invoice Info"}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 rounded-lg p-2.5">
                      <div><span className="text-muted-foreground">{isZh ? "税号：" : "Tax ID: "}</span><span className="font-mono">{supplier.tax_id || "-"}</span></div>
                      <div><span className="text-muted-foreground">{isZh ? "发票类型：" : "Type: "}</span>{supplier.invoice_type === "vat_special" ? (isZh ? "增值税专用" : "VAT Special") : (isZh ? "普通发票" : "General")}</div>
                      <div><span className="text-muted-foreground">{isZh ? "开票地址：" : "Address: "}</span>{supplier.invoice_address || "-"}</div>
                      <div><span className="text-muted-foreground">{isZh ? "开票电话：" : "Phone: "}</span>{supplier.invoice_phone || "-"}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button onClick={() => { setEditingSupplier(supplier); setShowForm(true); }}
                      className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors flex items-center gap-1">
                      <Edit2 className="w-3 h-3" />{isZh ? "编辑" : "Edit"}
                    </button>
                    <button onClick={() => setContractSupplierId(supplier.id)}
                      className="px-3 py-1.5 text-xs bg-info/10 text-info rounded-md hover:bg-info/20 transition-colors flex items-center gap-1">
                      <FileText className="w-3 h-3" />{isZh ? "合同管理" : "Contracts"}
                    </button>
                    {supplier.status !== "blacklisted" && (
                      <button onClick={() => handleBlacklist(supplier)}
                        className="px-3 py-1.5 text-xs bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 transition-colors flex items-center gap-1">
                        <Ban className="w-3 h-3" />{isZh ? "拉黑" : "Blacklist"}
                      </button>
                    )}
                    <button onClick={() => handleDelete(supplier.id)}
                      className="px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 ml-auto">
                      <Trash2 className="w-3 h-3" />{isZh ? "删除" : "Delete"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      {showForm && (
        <SupplierFormDialog
          supplier={editingSupplier}
          onClose={() => { setShowForm(false); setEditingSupplier(null); }}
          onSaved={() => { setShowForm(false); setEditingSupplier(null); fetchSuppliers(); }}
        />
      )}
      {contractSupplierId && (
        <SupplierContractDialog
          supplierId={contractSupplierId}
          onClose={() => setContractSupplierId(null)}
          onBankInfoExtracted={fetchSuppliers}
        />
      )}
    </motion.div>
  );
};

export default SupplierManagementTab;
