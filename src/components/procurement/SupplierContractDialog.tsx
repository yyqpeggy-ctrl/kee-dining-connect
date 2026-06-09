import { useState, useEffect, useCallback } from "react";
import { X, Upload, Loader2, FileText, CheckCircle, AlertTriangle, ArrowRight, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Contract {
  id: string;
  supplier_id: string;
  contract_number: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  payment_terms: string;
  file_url: string;
  file_type: string;
  ocr_status: string;
  ocr_extracted_data: any;
  extracted_bank_name: string;
  extracted_bank_account: string;
  extracted_bank_account_name: string;
  extracted_tax_id: string;
  extracted_invoice_info: any;
  status: string;
  notes: string;
  created_at: string;
}

interface Props {
  supplierId: string;
  onClose: () => void;
  onBankInfoExtracted: () => void;
}

const SupplierContractDialog = ({ supplierId, onClose, onBankInfoExtracted }: Props) => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("supplier_contracts")
      .select("*").eq("supplier_id", supplierId).order("created_at", { ascending: false });
    if (!error && data) setContracts(data as Contract[]);
    setLoading(false);
  }, [supplierId]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${supplierId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("contracts").upload(path, file);
    if (uploadError) { toast.error(uploadError.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("contracts").getPublicUrl(path);

    const { error } = await supabase.from("supplier_contracts").insert({
      supplier_id: supplierId,
      title: file.name.replace(/\.[^.]+$/, ""),
      file_url: urlData.publicUrl || path,
      file_type: ext === "pdf" ? "pdf" : "image",
      status: "active",
    });

    if (error) toast.error(error.message);
    else { toast.success(isZh ? "合同已上传" : "Contract uploaded"); fetchContracts(); }
    setUploading(false);
    e.target.value = "";
  };

  const handleOCR = async (contract: Contract) => {
    setScanning(contract.id);
    try {
      // Update status to processing
      await supabase.from("supplier_contracts").update({ ocr_status: "processing" }).eq("id", contract.id);

      // Get file and convert to base64
      const { data: fileData, error: dlError } = await supabase.storage.from("contracts").download(
        contract.file_url.includes("/") ? contract.file_url.split("contracts/").pop()! : contract.file_url
      );
      if (dlError || !fileData) throw new Error("Failed to download file");

      const buffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

      const { data, error } = await supabase.functions.invoke("ocr-contract", {
        body: { image_base64: base64, file_type: contract.file_type },
      });

      if (error) throw error;
      const ocr = data?.ocr;
      if (!ocr || ocr.parse_error) throw new Error("OCR parse failed");

      await supabase.from("supplier_contracts").update({
        ocr_status: "completed",
        ocr_extracted_data: ocr,
        contract_number: ocr.contract_number || contract.contract_number,
        extracted_bank_name: ocr.bank_info?.bank_name || "",
        extracted_bank_account: ocr.bank_info?.bank_account || "",
        extracted_bank_account_name: ocr.bank_info?.account_name || "",
        extracted_tax_id: ocr.invoice_info?.tax_id || "",
        extracted_invoice_info: ocr.invoice_info || {},
        payment_terms: ocr.payment_terms || contract.payment_terms,
        start_date: ocr.start_date || contract.start_date,
        end_date: ocr.end_date || contract.end_date,
      }).eq("id", contract.id);

      toast.success(isZh ? "合同OCR识别完成" : "Contract OCR completed");
      fetchContracts();
    } catch (err: any) {
      await supabase.from("supplier_contracts").update({ ocr_status: "failed" }).eq("id", contract.id);
      toast.error(err.message || "OCR failed");
    }
    setScanning(null);
  };

  const handleSyncToSupplier = async (contract: Contract) => {
    setSyncing(contract.id);
    const ocr = contract.ocr_extracted_data;
    const updates: Record<string, any> = {};

    if (contract.extracted_bank_name) updates.bank_name = contract.extracted_bank_name;
    if (contract.extracted_bank_account) updates.bank_account = contract.extracted_bank_account;
    if (contract.extracted_bank_account_name) updates.bank_account_name = contract.extracted_bank_account_name;
    if (ocr?.bank_info?.bank_branch) updates.bank_branch = ocr.bank_info.bank_branch;
    if (contract.extracted_tax_id) updates.tax_id = contract.extracted_tax_id;
    if (ocr?.invoice_info?.invoice_type) updates.invoice_type = ocr.invoice_info.invoice_type;
    if (ocr?.invoice_info?.invoice_address) updates.invoice_address = ocr.invoice_info.invoice_address;
    if (ocr?.invoice_info?.invoice_phone) updates.invoice_phone = ocr.invoice_info.invoice_phone;
    if (ocr?.invoice_info?.invoice_bank_name) updates.invoice_bank_name = ocr.invoice_info.invoice_bank_name;
    if (ocr?.invoice_info?.invoice_bank_account) updates.invoice_bank_account = ocr.invoice_info.invoice_bank_account;
    if (ocr?.contact_person) updates.contact_person = ocr.contact_person;
    if (ocr?.phone) updates.phone = ocr.phone;
    if (ocr?.email) updates.email = ocr.email;
    if (ocr?.address) updates.address = ocr.address;

    if (Object.keys(updates).length === 0) {
      toast.info(isZh ? "无可同步的信息" : "No info to sync");
      setSyncing(null);
      return;
    }

    const { error } = await supabase.from("suppliers").update(updates as any).eq("id", supplierId);
    if (error) toast.error(error.message);
    else {
      toast.success(isZh ? "银行和开票信息已同步到供应商主档" : "Bank & invoice info synced to supplier");
      onBankInfoExtracted();
    }
    setSyncing(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="font-bold text-lg">{isZh ? "合同管理" : "Contract Management"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* Upload */}
          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
            <input type="file" accept="image/*,.pdf" onChange={handleUpload} className="hidden" id="contract-upload" disabled={uploading} />
            <label htmlFor="contract-upload" className="cursor-pointer flex flex-col items-center gap-2">
              {uploading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
              <span className="text-sm text-muted-foreground">{isZh ? "上传合同文件（图片/PDF）" : "Upload contract (Image/PDF)"}</span>
            </label>
          </div>

          {/* Contract list */}
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : contracts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">{isZh ? "暂无合同" : "No contracts"}</p>
          ) : (
            <div className="space-y-3">
              {contracts.map(contract => (
                <div key={contract.id} className="glass-card rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-bold text-sm">{contract.title}</span>
                      {contract.contract_number && <span className="text-xs text-muted-foreground font-mono">({contract.contract_number})</span>}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      contract.ocr_status === "completed" ? "bg-success/10 text-success" :
                      contract.ocr_status === "processing" ? "bg-warning/10 text-warning" :
                      contract.ocr_status === "failed" ? "bg-destructive/10 text-destructive" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {contract.ocr_status === "completed" ? (isZh ? "已识别" : "OCR Done") :
                       contract.ocr_status === "processing" ? (isZh ? "识别中" : "Processing") :
                       contract.ocr_status === "failed" ? (isZh ? "识别失败" : "Failed") :
                       (isZh ? "待识别" : "Pending")}
                    </span>
                  </div>

                  {/* OCR results */}
                  {contract.ocr_status === "completed" && contract.extracted_bank_account && (
                    <div className="bg-muted/30 rounded-lg p-2.5 text-xs space-y-1">
                      <p className="font-semibold flex items-center gap-1"><CreditCard className="w-3 h-3" />{isZh ? "提取的银行信息" : "Extracted Bank Info"}</p>
                      <p>{isZh ? "开户行" : "Bank"}: {contract.extracted_bank_name}</p>
                      <p>{isZh ? "账号" : "Account"}: <span className="font-mono">{contract.extracted_bank_account}</span></p>
                      <p>{isZh ? "户名" : "Name"}: {contract.extracted_bank_account_name}</p>
                      {contract.extracted_tax_id && <p>{isZh ? "税号" : "Tax ID"}: <span className="font-mono">{contract.extracted_tax_id}</span></p>}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {contract.ocr_status !== "completed" && (
                      <button onClick={() => handleOCR(contract)} disabled={scanning === contract.id}
                        className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1">
                        {scanning === contract.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                        {isZh ? "AI识别合同" : "AI OCR Scan"}
                      </button>
                    )}
                    {contract.ocr_status === "completed" && (
                      <button onClick={() => handleSyncToSupplier(contract)} disabled={syncing === contract.id}
                        className="px-3 py-1.5 text-xs bg-success text-success-foreground rounded-md hover:bg-success/90 transition-colors flex items-center gap-1">
                        {syncing === contract.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                        {isZh ? "同步到供应商主档" : "Sync to Supplier"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierContractDialog;
