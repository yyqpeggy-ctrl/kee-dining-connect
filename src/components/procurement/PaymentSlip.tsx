import { useRef } from "react";
import { Printer, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tables } from "@/integrations/supabase/types";
import { generateSinglePaymentExcel } from "./bankPaymentExport";

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
  signature_notes?: string;
}

interface MatchResult {
  total_match: boolean;
  supplier_match: boolean;
  total_diff: number | null;
  signature_ok: boolean;
  overall_pass: boolean;
}

interface Props {
  order: Tables<"procurement_orders">;
  ocrResult: OCRResult;
  matchResult: MatchResult;
  invoiceOcr: OCRResult | null;
  invoiceMatch: MatchResult | null;
}

const PaymentSlip = ({ order, ocrResult, matchResult, invoiceOcr, invoiceMatch }: Props) => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const printRef = useRef<HTMLDivElement>(null);
  const now = new Date();

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>${isZh ? "付款申请单" : "Payment Request"} - ${order.order_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: "SimSun", "Songti SC", serif; padding: 24px; color: #111; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #111; padding-bottom: 12px; }
        .header h1 { font-size: 22px; letter-spacing: 4px; margin-bottom: 4px; }
        .header p { font-size: 11px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; font-size: 11px; }
        th { background: #f0f0f0; font-weight: bold; }
        .section-title { font-size: 13px; font-weight: bold; margin: 16px 0 8px; border-left: 3px solid #333; padding-left: 8px; }
        .status-pass { color: #16a34a; font-weight: bold; }
        .status-fail { color: #dc2626; font-weight: bold; }
        .signature-row { display: flex; justify-content: space-between; margin-top: 40px; }
        .signature-box { width: 30%; text-align: center; }
        .signature-line { border-bottom: 1px solid #333; height: 40px; margin-bottom: 4px; }
        .total-row td { font-weight: bold; font-size: 13px; }
        @media print { body { padding: 0; } }
      </style></head><body>${el.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportExcel = () => {
    generateSinglePaymentExcel(order, ocrResult, isZh);
  };

  return (
    <div className="space-y-3">
      {/* Action buttons */}
      <div className="flex gap-2">
        <button onClick={handlePrint} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
          <Printer className="w-4 h-4" />
          {isZh ? "打印付款申请单" : "Print Payment Slip"}
        </button>
        <button onClick={handleExportExcel} className="flex-1 py-2 bg-success text-success-foreground rounded-lg text-sm font-medium hover:bg-success/90 transition-colors flex items-center justify-center gap-2">
          <Download className="w-4 h-4" />
          {isZh ? "导出银行付款单(Excel)" : "Export Bank Payment (Excel)"}
        </button>
      </div>

      {/* Printable content preview */}
      <div ref={printRef} className="bg-card border border-border rounded-lg p-5 text-xs space-y-4">
        {/* Header */}
        <div className="header text-center border-b-2 border-foreground pb-3 mb-4">
          <h1 className="text-lg font-bold tracking-widest">{isZh ? "付 款 申 请 单" : "PAYMENT REQUEST FORM"}</h1>
          <p className="text-muted-foreground text-[10px] mt-1">
            {isZh ? order.store_name_zh : order.store_name_en} | {isZh ? "申请日期" : "Date"}: {now.toLocaleDateString()} | No. {order.order_number}
          </p>
        </div>

        {/* Basic info table */}
        <table className="w-full border-collapse" style={{ borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td className="border border-border bg-muted/50 px-2 py-1.5 font-bold w-24">{isZh ? "供应商" : "Supplier"}</td>
              <td className="border border-border px-2 py-1.5">{order.supplier_name}</td>
              <td className="border border-border bg-muted/50 px-2 py-1.5 font-bold w-24">{isZh ? "采购单号" : "PO No."}</td>
              <td className="border border-border px-2 py-1.5 font-mono">{order.order_number}</td>
            </tr>
            <tr>
              <td className="border border-border bg-muted/50 px-2 py-1.5 font-bold">{isZh ? "申请金额" : "Amount"}</td>
              <td className="border border-border px-2 py-1.5 font-bold text-primary text-sm">¥{order.total_amount.toLocaleString()}</td>
              <td className="border border-border bg-muted/50 px-2 py-1.5 font-bold">{isZh ? "币种" : "Currency"}</td>
              <td className="border border-border px-2 py-1.5">{order.currency || "CNY"}</td>
            </tr>
            <tr>
              <td className="border border-border bg-muted/50 px-2 py-1.5 font-bold">{isZh ? "所属门店" : "Store"}</td>
              <td className="border border-border px-2 py-1.5">{isZh ? order.store_name_zh : order.store_name_en}</td>
              <td className="border border-border bg-muted/50 px-2 py-1.5 font-bold">{isZh ? "合同编号" : "Contract"}</td>
              <td className="border border-border px-2 py-1.5 font-mono">{order.contract_number || "-"}</td>
            </tr>
          </tbody>
        </table>

        {/* OCR Extracted items */}
        <div>
          <p className="font-bold mb-2 border-l-2 border-foreground pl-2">{isZh ? "一、收货单据明细 (OCR识别)" : "1. Receipt Details (OCR)"}</p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border px-2 py-1 text-left">{isZh ? "序号" : "No."}</th>
                <th className="border border-border px-2 py-1 text-left">{isZh ? "品名" : "Item"}</th>
                <th className="border border-border px-2 py-1 text-right">{isZh ? "数量" : "Qty"}</th>
                <th className="border border-border px-2 py-1 text-right">{isZh ? "单价" : "Price"}</th>
                <th className="border border-border px-2 py-1 text-right">{isZh ? "金额" : "Amount"}</th>
              </tr>
            </thead>
            <tbody>
              {(ocrResult.items || []).map((item, i) => (
                <tr key={i}>
                  <td className="border border-border px-2 py-1">{i + 1}</td>
                  <td className="border border-border px-2 py-1">{item.name || "-"}</td>
                  <td className="border border-border px-2 py-1 text-right">{item.quantity ?? "-"}{item.unit ? ` ${item.unit}` : ""}</td>
                  <td className="border border-border px-2 py-1 text-right">¥{item.unit_price?.toFixed(2) ?? "-"}</td>
                  <td className="border border-border px-2 py-1 text-right">¥{item.amount?.toFixed(2) ?? "-"}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td colSpan={4} className="border border-border px-2 py-1.5 text-right">{isZh ? "合计" : "Total"}</td>
                <td className="border border-border px-2 py-1.5 text-right text-primary">¥{ocrResult.total?.toLocaleString() ?? "-"}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[10px] text-muted-foreground mt-1">
            {isZh ? "收货日期" : "Receipt Date"}: {ocrResult.date || "-"} | {isZh ? "单据编号" : "Receipt No."}: {ocrResult.receipt_number || "-"}
          </p>
        </div>

        {/* Signature verification */}
        <div>
          <p className="font-bold mb-2 border-l-2 border-foreground pl-2">{isZh ? "二、收货人签字验证" : "2. Signature Verification"}</p>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="border border-border bg-muted/50 px-2 py-1.5 font-bold w-32">{isZh ? "签字检测" : "Detection"}</td>
                <td className={`border border-border px-2 py-1.5 font-bold ${ocrResult.signature_detected ? "text-success" : "text-destructive"}`}>
                  {ocrResult.signature_detected ? (isZh ? "✓ 已检测到签字" : "✓ Signature detected") : (isZh ? "✗ 未检测到签字" : "✗ No signature")}
                </td>
              </tr>
              <tr>
                <td className="border border-border bg-muted/50 px-2 py-1.5 font-bold">{isZh ? "置信度" : "Confidence"}</td>
                <td className="border border-border px-2 py-1.5">{ocrResult.signature_confidence || 0}%</td>
              </tr>
              <tr>
                <td className="border border-border bg-muted/50 px-2 py-1.5 font-bold">{isZh ? "备注" : "Notes"}</td>
                <td className="border border-border px-2 py-1.5">{ocrResult.signature_notes || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Three-way matching */}
        <div>
          <p className="font-bold mb-2 border-l-2 border-foreground pl-2">{isZh ? "三、三方核对结果" : "3. Three-way Matching"}</p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border px-2 py-1 text-left">{isZh ? "核对项目" : "Check Item"}</th>
                <th className="border border-border px-2 py-1 text-center">{isZh ? "采购单" : "PO"}</th>
                <th className="border border-border px-2 py-1 text-center">{isZh ? "收货单" : "Receipt"}</th>
                <th className="border border-border px-2 py-1 text-center">{isZh ? "月结账单" : "Invoice"}</th>
                <th className="border border-border px-2 py-1 text-center">{isZh ? "结果" : "Result"}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border px-2 py-1">{isZh ? "金额" : "Amount"}</td>
                <td className="border border-border px-2 py-1 text-center">¥{order.total_amount.toLocaleString()}</td>
                <td className="border border-border px-2 py-1 text-center">¥{ocrResult.total?.toLocaleString() || "-"}</td>
                <td className="border border-border px-2 py-1 text-center">¥{invoiceOcr?.total?.toLocaleString() || "-"}</td>
                <td className={`border border-border px-2 py-1 text-center font-bold ${matchResult.total_match ? "text-success" : "text-destructive"}`}>
                  {matchResult.total_match ? "✓" : "✗"}
                </td>
              </tr>
              <tr>
                <td className="border border-border px-2 py-1">{isZh ? "供应商" : "Supplier"}</td>
                <td className="border border-border px-2 py-1 text-center">{order.supplier_name}</td>
                <td className="border border-border px-2 py-1 text-center">{ocrResult.supplier || "-"}</td>
                <td className="border border-border px-2 py-1 text-center">{invoiceOcr?.supplier || "-"}</td>
                <td className={`border border-border px-2 py-1 text-center font-bold ${matchResult.supplier_match ? "text-success" : "text-destructive"}`}>
                  {matchResult.supplier_match ? "✓" : "✗"}
                </td>
              </tr>
              <tr>
                <td className="border border-border px-2 py-1">{isZh ? "收货人签字" : "Signature"}</td>
                <td className="border border-border px-2 py-1 text-center">-</td>
                <td className={`border border-border px-2 py-1 text-center font-bold ${ocrResult.signature_detected ? "text-success" : "text-destructive"}`}>
                  {ocrResult.signature_detected ? "✓" : "✗"}
                </td>
                <td className="border border-border px-2 py-1 text-center">-</td>
                <td className={`border border-border px-2 py-1 text-center font-bold ${matchResult.signature_ok ? "text-success" : "text-destructive"}`}>
                  {matchResult.signature_ok ? "✓" : "✗"}
                </td>
              </tr>
            </tbody>
          </table>
          <p className={`mt-2 text-center font-bold text-sm ${matchResult.overall_pass && invoiceMatch?.total_match ? "text-success" : "text-destructive"}`}>
            {matchResult.overall_pass && invoiceMatch?.total_match
              ? (isZh ? "【核对结论：三方核对通过，建议付款】" : "【Conclusion: Three-way match passed, recommend payment】")
              : (isZh ? "【核对结论：存在差异，请复核】" : "【Conclusion: Discrepancies found, please review】")}
          </p>
        </div>

        {/* Approval signatures area */}
        <div className="mt-8 pt-4 border-t border-border">
          <div className="flex justify-between">
            {[
              isZh ? "申请人" : "Applicant",
              isZh ? "部门主管" : "Dept. Manager",
              isZh ? "财务审核" : "Finance",
              isZh ? "总经理" : "GM"
            ].map(role => (
              <div key={role} className="text-center w-1/4">
                <div className="h-10 border-b border-border mb-1" />
                <p className="text-[10px] text-muted-foreground">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSlip;
