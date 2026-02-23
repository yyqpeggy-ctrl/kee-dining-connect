import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Upload, FileText, CheckCircle, XCircle, AlertTriangle,
  Loader2, PenTool, DollarSign, Package, Calendar, User, Hash
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

interface Props {
  order: Tables<"procurement_orders">;
  onComplete: () => void;
}

interface OCRItem {
  name?: string;
  quantity?: number;
  unit_price?: number;
  amount?: number;
  unit?: string;
}

interface OCRResult {
  items?: OCRItem[];
  total?: number;
  date?: string;
  supplier?: string;
  receipt_number?: string;
  signature_detected?: boolean;
  signature_confidence?: number;
  signature_location?: string;
  signature_notes?: string;
  additional_notes?: string;
  parse_error?: boolean;
  raw_text?: string;
}

interface MatchResult {
  total_match: boolean;
  supplier_match: boolean;
  total_diff: number | null;
  signature_ok: boolean;
  overall_pass: boolean;
}

type Step = "upload" | "scanning" | "result" | "invoice" | "invoice_scanning" | "matching" | "payment";

const ReceiptOCRDialog = ({ order, onComplete }: Props) => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>("");
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceOcr, setInvoiceOcr] = useState<OCRResult | null>(null);
  const [invoiceMatch, setInvoiceMatch] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const invoiceRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setReceiptFile(null);
    setReceiptPreview("");
    setOcrResult(null);
    setMatchResult(null);
    setInvoiceFile(null);
    setInvoiceOcr(null);
    setInvoiceMatch(null);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileSelect = (file: File) => {
    setReceiptFile(file);
    const url = URL.createObjectURL(file);
    setReceiptPreview(url);
  };

  const handleScan = async () => {
    if (!receiptFile) return;
    setStep("scanning");
    setLoading(true);
    try {
      const base64 = await fileToBase64(receiptFile);
      const fileType = receiptFile.type.includes("pdf") ? "pdf" : "image";

      const resp = await supabase.functions.invoke("ocr-receipt", {
        body: {
          image_base64: base64,
          file_type: fileType,
          order_data: {
            order_number: order.order_number,
            supplier_name: order.supplier_name,
            total_amount: order.total_amount,
          },
        },
      });

      if (resp.error) throw resp.error;
      const data = resp.data;
      setOcrResult(data.ocr);
      setMatchResult(data.match);
      setStep("result");
    } catch (e: any) {
      toast.error(e.message || (isZh ? "识别失败" : "OCR failed"));
      setStep("upload");
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceSelect = (file: File) => {
    setInvoiceFile(file);
  };

  const handleInvoiceScan = async () => {
    if (!invoiceFile) return;
    setStep("invoice_scanning");
    setLoading(true);
    try {
      const base64 = await fileToBase64(invoiceFile);
      const fileType = invoiceFile.type.includes("pdf") ? "pdf" : "image";

      const resp = await supabase.functions.invoke("ocr-receipt", {
        body: {
          image_base64: base64,
          file_type: fileType,
          order_data: {
            order_number: order.order_number,
            supplier_name: order.supplier_name,
            total_amount: order.total_amount,
          },
        },
      });

      if (resp.error) throw resp.error;
      setInvoiceOcr(resp.data.ocr);
      setInvoiceMatch(resp.data.match);
      setStep("matching");
    } catch (e: any) {
      toast.error(e.message || (isZh ? "识别失败" : "OCR failed"));
      setStep("invoice");
    } finally {
      setLoading(false);
    }
  };

  const canRequestPayment = matchResult?.overall_pass && invoiceMatch?.total_match;

  const handleRequestPayment = async () => {
    setLoading(true);
    try {
      // Upload receipt file to storage
      const receiptPath = `${order.store_id}/${order.id}/receipt_${Date.now()}`;
      if (receiptFile) {
        await supabase.storage.from("receipts").upload(receiptPath, receiptFile);
      }

      // Save OCR record
      const { error: insertError } = await supabase.from("procurement_receipts" as any).insert({
        procurement_order_id: order.id,
        file_url: receiptPath,
        file_type: receiptFile?.type.includes("pdf") ? "pdf" : "image",
        ocr_status: "completed",
        ocr_result: ocrResult,
        extracted_items: ocrResult?.items || [],
        extracted_total: ocrResult?.total || 0,
        extracted_date: ocrResult?.date || "",
        extracted_supplier: ocrResult?.supplier || "",
        signature_detected: ocrResult?.signature_detected || false,
        signature_confidence: ocrResult?.signature_confidence || 0,
        signature_notes: ocrResult?.signature_notes || "",
        match_status: matchResult?.overall_pass ? "passed" : "failed",
        match_details: matchResult,
        supplier_invoice_ocr: invoiceOcr,
        payment_request_status: "requested",
        payment_requested_at: new Date().toISOString(),
        store_id: order.store_id,
        store_name_zh: order.store_name_zh,
        store_name_en: order.store_name_en,
      } as any);

      if (insertError) throw insertError;

      // Update order status to indicate payment requested
      const { error: updateError } = await supabase.from("procurement_orders").update({
        status: "received",
        compliance_checked: true,
        compliance_notes: isZh
          ? `OCR核对通过：收货单金额¥${ocrResult?.total}，签字已确认，月结账单金额一致`
          : `OCR verified: Receipt ¥${ocrResult?.total}, signature confirmed, invoice matched`,
      }).eq("id", order.id);

      if (updateError) throw updateError;

      toast.success(isZh ? "付款申请已提交" : "Payment request submitted");
      setOpen(false);
      reset();
      onComplete();
    } catch (e: any) {
      toast.error(e.message || (isZh ? "提交失败" : "Submit failed"));
    } finally {
      setLoading(false);
    }
  };

  const SignatureStatus = ({ detected, confidence, notes }: {
    detected?: boolean; confidence?: number; notes?: string;
  }) => (
    <div className={`rounded-lg p-3 border-2 ${detected ? "border-success/50 bg-success/5" : "border-destructive/50 bg-destructive/5"}`}>
      <div className="flex items-center gap-2 mb-1">
        <PenTool className={`w-4 h-4 ${detected ? "text-success" : "text-destructive"}`} />
        <span className="font-semibold text-sm">
          {isZh ? "收货人签字" : "Receiver Signature"}
        </span>
        {detected ? (
          <CheckCircle className="w-4 h-4 text-success" />
        ) : (
          <XCircle className="w-4 h-4 text-destructive" />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {detected
          ? `${isZh ? "已检测到签字" : "Signature detected"} (${confidence || 0}%)`
          : (isZh ? "⚠️ 未检测到签字，请确认单据上是否有收货人签名" : "⚠️ No signature detected")}
      </p>
      {notes && <p className="text-xs mt-1 text-muted-foreground">{notes}</p>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <button className="px-3 py-1 text-xs bg-info/10 text-info rounded-md hover:bg-info/20 transition-colors flex items-center gap-1">
          <Camera className="w-3 h-3" />
          {isZh ? "收货单识别" : "Scan Receipt"}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {isZh ? "收货单据OCR识别" : "Receipt OCR Scanning"}
            <span className="text-xs font-mono text-muted-foreground ml-2">{order.order_number}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-4">
          {["upload", "result", "invoice", "matching", "payment"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                ["upload", "scanning"].includes(step) && s === "upload" ? "bg-primary text-primary-foreground" :
                ["result"].includes(step) && s === "result" ? "bg-primary text-primary-foreground" :
                ["invoice", "invoice_scanning"].includes(step) && s === "invoice" ? "bg-primary text-primary-foreground" :
                step === s ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              }`}>{i + 1}</div>
              {i < 4 && <div className="w-6 h-0.5 bg-muted" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Upload */}
          {step === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="text-center py-8 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileRef.current?.click()}>
                {receiptPreview ? (
                  <img src={receiptPreview} alt="receipt" className="max-h-48 mx-auto rounded-lg" />
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium">{isZh ? "上传收货单据" : "Upload Receipt"}</p>
                    <p className="text-xs text-muted-foreground mt-1">{isZh ? "支持图片和PDF格式" : "Supports images and PDF"}</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }} />

              <div className="glass-card rounded-lg p-3">
                <p className="text-xs font-medium mb-1">{isZh ? "对应采购单信息" : "Procurement Order"}</p>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <span>{isZh ? "供应商" : "Supplier"}: {order.supplier_name}</span>
                  <span>{isZh ? "金额" : "Amount"}: ¥{order.total_amount.toLocaleString()}</span>
                  <span>{isZh ? "门店" : "Store"}: {isZh ? order.store_name_zh : order.store_name_en}</span>
                </div>
              </div>

              {receiptFile && (
                <button onClick={handleScan} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" />
                  {isZh ? "开始AI识别" : "Start AI Scanning"}
                </button>
              )}
            </motion.div>
          )}

          {/* Step 2: Scanning */}
          {step === "scanning" && (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
              <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary mb-4" />
              <p className="text-sm font-medium">{isZh ? "AI正在识别单据..." : "AI scanning document..."}</p>
              <p className="text-xs text-muted-foreground mt-2">{isZh ? "正在检测签字区域和提取明细" : "Detecting signatures and extracting items"}</p>
            </motion.div>
          )}

          {/* Step 3: OCR Result */}
          {step === "result" && ocrResult && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Signature check - most important */}
              <SignatureStatus detected={ocrResult.signature_detected} confidence={ocrResult.signature_confidence} notes={ocrResult.signature_notes} />

              {/* Extracted data */}
              <div className="glass-card rounded-lg p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span className="text-muted-foreground">{isZh ? "日期" : "Date"}:</span>
                    <span className="font-medium">{ocrResult.date || "-"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span className="text-muted-foreground">{isZh ? "供应商" : "Supplier"}:</span>
                    <span className="font-medium">{ocrResult.supplier || "-"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-primary" />
                    <span className="text-muted-foreground">{isZh ? "单号" : "No."}:</span>
                    <span className="font-mono font-medium">{ocrResult.receipt_number || "-"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-primary" />
                    <span className="text-muted-foreground">{isZh ? "合计" : "Total"}:</span>
                    <span className="font-bold text-primary">¥{ocrResult.total?.toLocaleString() || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Items table */}
              {ocrResult.items && ocrResult.items.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1.5 font-medium">{isZh ? "品名" : "Item"}</th>
                        <th className="text-right py-1.5 font-medium">{isZh ? "数量" : "Qty"}</th>
                        <th className="text-right py-1.5 font-medium">{isZh ? "单价" : "Price"}</th>
                        <th className="text-right py-1.5 font-medium">{isZh ? "金额" : "Amount"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ocrResult.items.map((item, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-1.5">{item.name || "-"}</td>
                          <td className="text-right">{item.quantity ?? "-"}{item.unit ? ` ${item.unit}` : ""}</td>
                          <td className="text-right">¥{item.unit_price?.toFixed(2) ?? "-"}</td>
                          <td className="text-right font-medium">¥{item.amount?.toFixed(2) ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Match result with PO */}
              {matchResult && (
                <div className="glass-card rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold">{isZh ? "与采购单核对结果" : "PO Matching Result"}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      {matchResult.total_match ? <CheckCircle className="w-3.5 h-3.5 text-success" /> : <XCircle className="w-3.5 h-3.5 text-destructive" />}
                      {isZh ? "金额" : "Amount"}: {matchResult.total_match ? (isZh ? "一致" : "Match") : `${isZh ? "差异" : "Diff"} ¥${matchResult.total_diff?.toFixed(2)}`}
                    </span>
                    <span className="flex items-center gap-1">
                      {matchResult.supplier_match ? <CheckCircle className="w-3.5 h-3.5 text-success" /> : <AlertTriangle className="w-3.5 h-3.5 text-warning" />}
                      {isZh ? "供应商" : "Supplier"}: {matchResult.supplier_match ? (isZh ? "一致" : "Match") : (isZh ? "不一致" : "Mismatch")}
                    </span>
                    <span className="flex items-center gap-1">
                      {matchResult.signature_ok ? <CheckCircle className="w-3.5 h-3.5 text-success" /> : <XCircle className="w-3.5 h-3.5 text-destructive" />}
                      {isZh ? "签字" : "Signature"}: {matchResult.signature_ok ? "✓" : "✗"}
                    </span>
                  </div>
                </div>
              )}

              <button onClick={() => setStep("invoice")} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                {isZh ? "下一步：上传供应商月结账单" : "Next: Upload Supplier Invoice"}
              </button>
            </motion.div>
          )}

          {/* Step 4: Upload Invoice */}
          {step === "invoice" && (
            <motion.div key="invoice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className="text-sm font-medium">{isZh ? "上传供应商月结账单进行交叉核对" : "Upload supplier monthly invoice for cross-check"}</p>
              <div className="text-center py-8 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => invoiceRef.current?.click()}>
                {invoiceFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-primary" />
                    <span className="text-sm">{invoiceFile.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm">{isZh ? "上传月结账单" : "Upload Monthly Invoice"}</p>
                  </>
                )}
              </div>
              <input ref={invoiceRef} type="file" accept="image/*,.pdf" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleInvoiceSelect(e.target.files[0]); }} />

              {invoiceFile && (
                <button onClick={handleInvoiceScan} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" />
                  {isZh ? "识别月结账单" : "Scan Invoice"}
                </button>
              )}
            </motion.div>
          )}

          {/* Scanning invoice */}
          {step === "invoice_scanning" && (
            <motion.div key="invoice_scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
              <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary mb-4" />
              <p className="text-sm font-medium">{isZh ? "AI正在识别月结账单..." : "Scanning invoice..."}</p>
            </motion.div>
          )}

          {/* Step 5: Matching result */}
          {step === "matching" && (
            <motion.div key="matching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <h3 className="text-sm font-semibold">{isZh ? "三方核对结果" : "Three-way Matching"}</h3>

              <div className="grid grid-cols-3 gap-3">
                {/* PO */}
                <div className="glass-card rounded-lg p-3 text-center">
                  <Package className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-[10px] text-muted-foreground">{isZh ? "采购单" : "PO"}</p>
                  <p className="text-sm font-bold">¥{order.total_amount.toLocaleString()}</p>
                </div>
                {/* Receipt */}
                <div className="glass-card rounded-lg p-3 text-center">
                  <FileText className="w-5 h-5 mx-auto mb-1 text-info" />
                  <p className="text-[10px] text-muted-foreground">{isZh ? "收货单" : "Receipt"}</p>
                  <p className="text-sm font-bold">¥{ocrResult?.total?.toLocaleString() || "-"}</p>
                </div>
                {/* Invoice */}
                <div className="glass-card rounded-lg p-3 text-center">
                  <DollarSign className="w-5 h-5 mx-auto mb-1 text-warning" />
                  <p className="text-[10px] text-muted-foreground">{isZh ? "月结账单" : "Invoice"}</p>
                  <p className="text-sm font-bold">¥{invoiceOcr?.total?.toLocaleString() || "-"}</p>
                </div>
              </div>

              {/* Overall status */}
              <div className={`rounded-lg p-4 text-center ${canRequestPayment ? "bg-success/10 border border-success/30" : "bg-warning/10 border border-warning/30"}`}>
                {canRequestPayment ? (
                  <>
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
                    <p className="text-sm font-bold text-success">{isZh ? "三方核对通过！" : "Three-way match passed!"}</p>
                    <p className="text-xs text-muted-foreground mt-1">{isZh ? "收货单签字已确认，金额与采购单及月结账单一致" : "Signature confirmed, amounts match across all documents"}</p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-warning" />
                    <p className="text-sm font-bold text-warning">{isZh ? "核对存在差异" : "Discrepancies found"}</p>
                    <div className="text-xs text-muted-foreground mt-2 space-y-1">
                      {!matchResult?.total_match && <p>• {isZh ? "收货单金额与采购单不一致" : "Receipt amount doesn't match PO"}</p>}
                      {!matchResult?.signature_ok && <p>• {isZh ? "收货单缺少签字" : "Missing signature on receipt"}</p>}
                      {!invoiceMatch?.total_match && <p>• {isZh ? "月结账单金额与采购单不一致" : "Invoice amount doesn't match PO"}</p>}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={canRequestPayment ? handleRequestPayment : undefined}
                disabled={!canRequestPayment || loading}
                className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  canRequestPayment
                    ? "bg-success text-success-foreground hover:bg-success/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                {canRequestPayment
                  ? (isZh ? "提交付款申请" : "Submit Payment Request")
                  : (isZh ? "核对未通过，无法发起付款" : "Cannot submit - verification failed")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptOCRDialog;
