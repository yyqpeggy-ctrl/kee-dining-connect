import { useState } from "react";
import { X, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  notes: string;
  wechat_openid: string;
}

interface Props {
  supplier: Supplier | null;
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = {
  name: "", short_name: "", contact_person: "", phone: "", email: "", address: "",
  bank_name: "", bank_branch: "", bank_account: "", bank_account_name: "",
  tax_id: "", invoice_type: "general", invoice_address: "", invoice_phone: "",
  invoice_bank_name: "", invoice_bank_account: "",
  rating: 3, status: "active", notes: "", wechat_openid: "",
};

const SupplierFormDialog = ({ supplier, onClose, onSaved }: Props) => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const isEdit = !!supplier;
  const [form, setForm] = useState(supplier ? { ...supplier } : { ...emptyForm });
  const [saving, setSaving] = useState(false);

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(isZh ? "请填写供应商名称" : "Supplier name required"); return; }
    setSaving(true);
    const payload = { ...form };
    delete (payload as any).id;
    delete (payload as any).created_at;

    if (isEdit) {
      const { error } = await supabase.from("suppliers").update(payload).eq("id", supplier!.id);
      if (error) toast.error(error.message);
      else { toast.success(isZh ? "已更新" : "Updated"); onSaved(); }
    } else {
      const { error } = await supabase.from("suppliers").insert(payload);
      if (error) toast.error(error.message);
      else { toast.success(isZh ? "已创建" : "Created"); onSaved(); }
    }
    setSaving(false);
  };

  const Field = ({ label, field, type = "text", span = false, mono = false }: { label: string; field: string; type?: string; span?: boolean; mono?: boolean }) => (
    <div className={span ? "col-span-2" : ""}>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input type={type} value={(form as any)[field] || ""} onChange={e => set(field, e.target.value)}
        className={`w-full text-sm border border-border rounded-md px-3 py-1.5 bg-card focus:outline-none focus:ring-1 focus:ring-primary/50 ${mono ? "font-mono" : ""}`} />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="font-bold text-lg">{isEdit ? (isZh ? "编辑供应商" : "Edit Supplier") : (isZh ? "新增供应商" : "Add Supplier")}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-5">
          {/* Basic info */}
          <div>
            <p className="text-sm font-semibold mb-3 border-l-2 border-primary pl-2">{isZh ? "基本信息" : "Basic Info"}</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label={isZh ? "供应商全称 *" : "Full Name *"} field="name" span />
              <Field label={isZh ? "简称" : "Short Name"} field="short_name" />
              <Field label={isZh ? "联系人" : "Contact Person"} field="contact_person" />
              <Field label={isZh ? "电话" : "Phone"} field="phone" />
              <Field label={isZh ? "邮箱" : "Email"} field="email" type="email" />
              <Field label={isZh ? "地址" : "Address"} field="address" span />
            </div>
          </div>

          {/* WeChat binding */}
          <div>
            <p className="text-sm font-semibold mb-3 border-l-2 border-success pl-2">{isZh ? "微信通知绑定" : "WeChat Notification"}</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label={isZh ? "微信 OpenID" : "WeChat OpenID"} field="wechat_openid" mono span />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {isZh ? "💡 供应商关注公众号后，系统将自动获取OpenID。也可手动填写。绑定后采购单确认时自动推送微信通知。" : "💡 Auto-captured when supplier follows the official account. Can also be entered manually. Enables auto WeChat notifications on order confirmation."}
            </p>
          </div>

          {/* Bank info */}
          <div>
            <p className="text-sm font-semibold mb-3 border-l-2 border-primary pl-2">{isZh ? "银行账户信息" : "Bank Account"}</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label={isZh ? "开户银行" : "Bank"} field="bank_name" />
              <Field label={isZh ? "开户支行" : "Branch"} field="bank_branch" />
              <Field label={isZh ? "银行账号" : "Account No."} field="bank_account" mono />
              <Field label={isZh ? "户名" : "Account Name"} field="bank_account_name" />
            </div>
          </div>

          {/* Invoice info */}
          <div>
            <p className="text-sm font-semibold mb-3 border-l-2 border-primary pl-2">{isZh ? "开票信息" : "Invoice Info"}</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label={isZh ? "纳税人识别号" : "Tax ID"} field="tax_id" mono />
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{isZh ? "发票类型" : "Invoice Type"}</label>
                <select value={form.invoice_type} onChange={e => set("invoice_type", e.target.value)}
                  className="w-full text-sm border border-border rounded-md px-3 py-1.5 bg-card">
                  <option value="general">{isZh ? "普通发票" : "General"}</option>
                  <option value="vat_special">{isZh ? "增值税专用发票" : "VAT Special"}</option>
                </select>
              </div>
              <Field label={isZh ? "开票地址" : "Invoice Address"} field="invoice_address" />
              <Field label={isZh ? "开票电话" : "Invoice Phone"} field="invoice_phone" />
              <Field label={isZh ? "开票开户行" : "Invoice Bank"} field="invoice_bank_name" />
              <Field label={isZh ? "开票银行账号" : "Invoice Bank Acct"} field="invoice_bank_account" mono />
            </div>
          </div>

          {/* Rating & Status */}
          <div>
            <p className="text-sm font-semibold mb-3 border-l-2 border-primary pl-2">{isZh ? "评级与状态" : "Rating & Status"}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{isZh ? "评级 (1-5)" : "Rating (1-5)"}</label>
                <input type="number" min={1} max={5} value={form.rating} onChange={e => set("rating", parseInt(e.target.value) || 3)}
                  className="w-full text-sm border border-border rounded-md px-3 py-1.5 bg-card" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">{isZh ? "状态" : "Status"}</label>
                <select value={form.status} onChange={e => set("status", e.target.value)}
                  className="w-full text-sm border border-border rounded-md px-3 py-1.5 bg-card">
                  <option value="active">{isZh ? "合作中" : "Active"}</option>
                  <option value="inactive">{isZh ? "已停用" : "Inactive"}</option>
                  <option value="blacklisted">{isZh ? "黑名单" : "Blacklisted"}</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">{isZh ? "备注" : "Notes"}</label>
                <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
                  className="w-full text-sm border border-border rounded-md px-3 py-1.5 bg-card resize-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{isZh ? "取消" : "Cancel"}</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
            <Save className="w-4 h-4" />{saving ? (isZh ? "保存中..." : "Saving...") : (isZh ? "保存" : "Save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierFormDialog;
