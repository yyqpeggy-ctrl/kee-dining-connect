import * as XLSX from "xlsx";

interface BankPaymentRow {
  orderNumber: string;
  supplierName: string;
  supplierBank?: string;
  supplierAccount?: string;
  amount: number;
  currency: string;
  paymentDate: string;
  storeName: string;
  notes: string;
}

/**
 * 生成网银导入格式的Excel付款单
 * 支持主流网银系统（工商银行、建设银行、招商银行等）的批量付款导入
 */
export function generateBankPaymentExcel(rows: BankPaymentRow[], isZh: boolean) {
  const headers = isZh
    ? ["序号", "收款人名称", "收款人开户行", "收款人账号", "付款金额(元)", "币种", "付款日期", "用途/备注", "付款方门店"]
    : ["No.", "Payee Name", "Payee Bank", "Payee Account", "Amount", "Currency", "Payment Date", "Purpose/Notes", "Payer Store"];

  const data = rows.map((r, i) => [
    i + 1,
    r.supplierName,
    r.supplierBank || "",
    r.supplierAccount || "",
    r.amount,
    r.currency,
    r.paymentDate,
    r.notes,
    r.storeName,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Set column widths
  ws["!cols"] = [
    { wch: 6 },   // 序号
    { wch: 25 },  // 收款人名称
    { wch: 30 },  // 开户行
    { wch: 25 },  // 账号
    { wch: 15 },  // 金额
    { wch: 8 },   // 币种
    { wch: 14 },  // 日期
    { wch: 35 },  // 备注
    { wch: 20 },  // 门店
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isZh ? "付款单" : "Payment");

  const fileName = `${isZh ? "银行付款单" : "Bank_Payment"}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * 从采购单和OCR数据生成单笔付款的Excel
 */
export function generateSinglePaymentExcel(
  order: { order_number: string; supplier_name: string; total_amount: number; currency: string; store_name_zh: string; store_name_en: string; supplier_contact?: string | null },
  ocrResult: { total?: number; date?: string; supplier?: string } | null,
  isZh: boolean
) {
  const row: BankPaymentRow = {
    orderNumber: order.order_number,
    supplierName: order.supplier_name,
    supplierBank: "",
    supplierAccount: "",
    amount: order.total_amount,
    currency: order.currency || "CNY",
    paymentDate: new Date().toISOString().slice(0, 10),
    storeName: isZh ? order.store_name_zh : order.store_name_en,
    notes: `${isZh ? "采购付款" : "Procurement Payment"} ${order.order_number}${ocrResult?.date ? ` | ${isZh ? "收货日期" : "Receipt"}: ${ocrResult.date}` : ""}`,
  };

  generateBankPaymentExcel([row], isZh);
}
