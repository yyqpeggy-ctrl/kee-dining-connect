import * as XLSX from "xlsx";
import { JournalEntry } from "@/data/financeData";

// =======================================
// 标准科目编码映射 (中国会计准则)
// =======================================
export const subjectCodes: Record<string, string> = {
  "主营业务收入": "6001",
  "其他业务收入-KTV": "6051.01",
  "其他业务收入-活动": "6051.02",
  "其他业务收入-场地": "6051.03",
  "应收账款-企业客户": "1122.01",
  "应收账款-平台结算": "1122.02",
  "应收账款-挂账消费": "1122.03",
  "预收账款-储值卡": "2203",
  "原材料采购-进口食材": "1403.01",
  "原材料采购-本地食材": "1403.02",
  "原材料采购-酒水": "1403.03",
  "应付账款-食材供应商": "2202.01",
  "应付账款-酒水供应商": "2202.02",
  "应付账款-设备供应商": "2202.03",
  "应付职工薪酬-工资": "2211.01",
  "应付职工薪酬-社保": "2211.02",
  "应付职工薪酬-奖金": "2211.03",
  "管理费用-租金": "6602.01",
  "管理费用-水电": "6602.02",
  "管理费用-物业": "6602.03",
  "管理费用-保险": "6602.04",
  "销售费用-营销推广": "6601.01",
  "销售费用-平台佣金": "6601.02",
  "销售费用-会员折扣": "6601.03",
  "固定资产-厨房设备": "1601.01",
  "固定资产-KTV设备": "1601.02",
  "固定资产-装修改造": "1601.03",
  "累计折旧-厨房设备": "1602.01",
  "累计折旧-KTV设备": "1602.02",
  "累计折旧-家具装饰": "1602.03",
  "库存商品-酒水": "1405.01",
  "主营业务成本-食材消耗": "6401.01",
  "库存损耗": "6401.02",
  "库存盘点差异": "6401.03",
  "应交税费-增值税（销项）": "2221.01",
  "应交税费-增值税（进项）": "2221.02",
  "应交税费-企业所得税": "2221.03",
  "应交税费-附加税": "2221.04",
  "应交税费-个人所得税": "2221.05",
  "营业外收入-政府补贴": "6301.01",
  "营业外支出-罚款": "6711.01",
  "财务费用-银行手续费": "6603.01",
  "财务费用-利息支出": "6603.02",
  "财务费用-利息收入": "6603.03",
  "预付账款-年度合同": "1123",
  "长期借款-本金偿还": "2501",
  "实收资本-股东追加": "4001",
  "银行存款": "1002",
  "库存现金": "1001",
};

// =======================================
// 1. 凭证导出 (亿企代账标准格式)
// =======================================
export function exportVouchersForYiqi(entries: JournalEntry[], isZh: boolean) {
  const headers = [
    "凭证类型", "凭证号", "日期", "摘要",
    "科目编码", "科目名称", "借方金额", "贷方金额",
    "辅助核算-部门", "辅助核算-项目", "制单人", "审核人"
  ];

  const data = entries.map((e) => [
    "记",
    e.id,
    e.date,
    e.descZh,
    subjectCodes[e.accountZh] || "",
    e.accountZh,
    e.debit > 0 ? e.debit : "",
    e.credit > 0 ? e.credit : "",
    "",
    "",
    "系统",
    e.status === "reviewed" ? "已审" : "",
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  ws["!cols"] = [
    { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 35 },
    { wch: 12 }, { wch: 25 }, { wch: 14 }, { wch: 14 },
    { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 8 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "凭证");

  // 科目表 sheet
  const coaHeaders = ["科目编码", "科目名称", "科目类别", "余额方向"];
  const coaData = Object.entries(subjectCodes).map(([name, code]) => {
    const category = code.startsWith("1") ? "资产" : code.startsWith("2") ? "负债" : code.startsWith("4") ? "权益" : code.startsWith("6") ? "损益" : "其他";
    const direction = code.startsWith("1") || code.startsWith("6") ? "借" : "贷";
    return [code, name, category, direction];
  }).sort((a, b) => a[0].localeCompare(b[0]));

  const ws2 = XLSX.utils.aoa_to_sheet([coaHeaders, ...coaData]);
  ws2["!cols"] = [{ wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws2, "科目表");

  const fileName = `亿企代账导入_凭证_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return { count: entries.length, fileName };
}

// =======================================
// 2. 科目余额表导出
// =======================================
export function exportTrialBalance(accounts: { nameZh: string; balance: number; typeKey: string }[], isZh: boolean) {
  const headers = ["科目编码", "科目名称", "期初借方余额", "期初贷方余额", "本期借方发生额", "本期贷方发生额", "期末借方余额", "期末贷方余额"];

  const tbSubjectCodes: Record<string, string> = {
    "库存现金": "1001", "银行存款": "1002", "应收账款": "1122",
    "原材料": "1403", "库存商品": "1405", "预付账款": "1123",
    "固定资产": "1601", "累计折旧": "1602",
    "应付账款": "2202", "应付职工薪酬": "2211", "应交税费": "2221",
    "预收账款": "2203", "长期借款": "2501",
    "实收资本": "4001", "未分配利润": "4104", "本年利润": "4103",
  };

  const data = accounts.map(a => {
    const code = Object.entries(tbSubjectCodes).find(([k]) => a.nameZh.includes(k))?.[1] || "";
    const isDebit = a.typeKey === "asset";
    return [
      code, a.nameZh,
      isDebit && a.balance > 0 ? a.balance : "",
      !isDebit && a.balance > 0 ? a.balance : "",
      "", "",
      isDebit && a.balance > 0 ? a.balance : "",
      !isDebit && a.balance > 0 ? a.balance : "",
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "科目余额表");
  const fileName = `科目余额表_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return { count: accounts.length, fileName };
}

// =======================================
// 3. 进项发票导出 (亿企代账标准格式)
// =======================================
export function exportInputInvoices(invoices: any[]) {
  const inputInvoices = invoices.filter((i: any) => i.type === "input");

  const headers = [
    "发票代码", "发票号码", "开票日期", "销方名称", "销方纳税人识别号",
    "购方名称", "购方纳税人识别号", "金额", "税额", "价税合计",
    "税率", "发票类型", "认证日期", "认证结果", "用途",
    "发票状态", "备注"
  ];

  const data = inputInvoices.map((inv: any) => [
    inv.invoice_code || "",
    inv.invoice_number || "",
    inv.issue_date || "",
    inv.seller_name || "",
    inv.seller_tax_id || "",
    inv.buyer_name || "",
    inv.buyer_tax_id || "",
    Number(inv.amount) || 0,
    Number(inv.tax_amount) || 0,
    Number(inv.total_with_tax) || 0,
    `${((Number(inv.tax_rate) || 0) * 100).toFixed(0)}%`,
    inv.invoice_type === "special" ? "增值税专用发票" : inv.invoice_type === "electronic" ? "增值税电子普通发票" : "增值税普通发票",
    inv.status === "verified" ? inv.issue_date : "",
    inv.status === "verified" ? "相符" : "未认证",
    "抵扣",
    inv.status === "voided" ? "作废" : "正常",
    inv.notes || "",
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  ws["!cols"] = headers.map(() => ({ wch: 18 }));

  // 汇总行
  const summaryRow = data.length + 2;
  XLSX.utils.sheet_add_aoa(ws, [["合计", "", "", "", "", "", "",
    inputInvoices.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0),
    inputInvoices.reduce((s: number, i: any) => s + (Number(i.tax_amount) || 0), 0),
    inputInvoices.reduce((s: number, i: any) => s + (Number(i.total_with_tax) || 0), 0),
  ]], { origin: `A${summaryRow}` });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "进项发票台账");
  const fileName = `亿企代账_进项发票_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return { count: inputInvoices.length, fileName };
}

// =======================================
// 4. 销项发票导出 (亿企代账标准格式)
// =======================================
export function exportOutputInvoices(invoices: any[]) {
  const outputInvoices = invoices.filter((i: any) => i.type === "output");

  const headers = [
    "发票代码", "发票号码", "开票日期", "购方名称", "购方纳税人识别号",
    "销方名称", "销方纳税人识别号", "金额", "税额", "价税合计",
    "税率", "发票类型", "发票状态", "收款状态", "备注"
  ];

  const data = outputInvoices.map((inv: any) => [
    inv.invoice_code || "",
    inv.invoice_number || "",
    inv.issue_date || "",
    inv.buyer_name || "",
    inv.buyer_tax_id || "",
    inv.seller_name || "",
    inv.seller_tax_id || "",
    Number(inv.amount) || 0,
    Number(inv.tax_amount) || 0,
    Number(inv.total_with_tax) || 0,
    `${((Number(inv.tax_rate) || 0) * 100).toFixed(0)}%`,
    inv.invoice_type === "special" ? "增值税专用发票" : inv.invoice_type === "electronic" ? "增值税电子普通发票" : "增值税普通发票",
    inv.status === "voided" ? "作废" : "正常",
    inv.status === "verified" ? "已收" : "未收",
    inv.notes || "",
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  ws["!cols"] = headers.map(() => ({ wch: 18 }));

  const summaryRow = data.length + 2;
  XLSX.utils.sheet_add_aoa(ws, [["合计", "", "", "", "", "", "",
    outputInvoices.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0),
    outputInvoices.reduce((s: number, i: any) => s + (Number(i.tax_amount) || 0), 0),
    outputInvoices.reduce((s: number, i: any) => s + (Number(i.total_with_tax) || 0), 0),
  ]], { origin: `A${summaryRow}` });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "销项发票台账");
  const fileName = `亿企代账_销项发票_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return { count: outputInvoices.length, fileName };
}

// =======================================
// 5. 一键全量导出 (多Sheet合一)
// =======================================
export function exportAllForYiqi(
  entries: JournalEntry[],
  invoices: any[],
  accounts: { nameZh: string; balance: number; typeKey: string }[],
  storeName: string,
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: 凭证
  const vHeaders = ["凭证类型", "凭证号", "日期", "摘要", "科目编码", "科目名称", "借方金额", "贷方金额", "制单人", "审核人"];
  const vData = entries.map(e => [
    "记", e.id, e.date, e.descZh,
    subjectCodes[e.accountZh] || "", e.accountZh,
    e.debit > 0 ? e.debit : "", e.credit > 0 ? e.credit : "",
    "系统", e.status === "reviewed" ? "已审" : "",
  ]);
  const ws1 = XLSX.utils.aoa_to_sheet([vHeaders, ...vData]);
  ws1["!cols"] = vHeaders.map(() => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wb, ws1, "凭证");

  // Sheet 2: 进项发票
  const inputInvs = invoices.filter(i => i.type === "input");
  const iHeaders = ["发票代码", "发票号码", "开票日期", "销方名称", "销方税号", "金额", "税额", "价税合计", "税率", "发票类型", "认证结果"];
  const iData = inputInvs.map(inv => [
    inv.invoice_code || "", inv.invoice_number || "", inv.issue_date || "",
    inv.seller_name || "", inv.seller_tax_id || "",
    Number(inv.amount) || 0, Number(inv.tax_amount) || 0, Number(inv.total_with_tax) || 0,
    `${((Number(inv.tax_rate) || 0) * 100).toFixed(0)}%`,
    inv.invoice_type === "special" ? "专票" : "普票",
    inv.status === "verified" ? "相符" : "未认证",
  ]);
  const ws2 = XLSX.utils.aoa_to_sheet([iHeaders, ...iData]);
  ws2["!cols"] = iHeaders.map(() => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wb, ws2, "进项发票");

  // Sheet 3: 销项发票
  const outputInvs = invoices.filter(i => i.type === "output");
  const oHeaders = ["发票代码", "发票号码", "开票日期", "购方名称", "购方税号", "金额", "税额", "价税合计", "税率", "发票类型", "状态"];
  const oData = outputInvs.map(inv => [
    inv.invoice_code || "", inv.invoice_number || "", inv.issue_date || "",
    inv.buyer_name || "", inv.buyer_tax_id || "",
    Number(inv.amount) || 0, Number(inv.tax_amount) || 0, Number(inv.total_with_tax) || 0,
    `${((Number(inv.tax_rate) || 0) * 100).toFixed(0)}%`,
    inv.invoice_type === "special" ? "专票" : "普票",
    inv.status === "voided" ? "作废" : "正常",
  ]);
  const ws3 = XLSX.utils.aoa_to_sheet([oHeaders, ...oData]);
  ws3["!cols"] = oHeaders.map(() => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wb, ws3, "销项发票");

  // Sheet 4: 科目余额表
  const tbHeaders = ["科目编码", "科目名称", "期初借方", "期初贷方", "本期借方", "本期贷方", "期末借方", "期末贷方"];
  const tbCodes: Record<string, string> = {
    "库存现金": "1001", "银行存款": "1002", "应收账款": "1122",
    "原材料": "1403", "库存商品": "1405", "预付账款": "1123",
    "固定资产": "1601", "累计折旧": "1602",
    "应付账款": "2202", "应付职工薪酬": "2211", "应交税费": "2221",
    "预收账款": "2203", "长期借款": "2501",
    "实收资本": "4001", "未分配利润": "4104",
  };
  const tbData = accounts.map(a => {
    const code = Object.entries(tbCodes).find(([k]) => a.nameZh.includes(k))?.[1] || "";
    const isDebit = a.typeKey === "asset";
    return [
      code, a.nameZh,
      isDebit && a.balance > 0 ? a.balance : "", !isDebit && a.balance > 0 ? a.balance : "",
      "", "",
      isDebit && a.balance > 0 ? a.balance : "", !isDebit && a.balance > 0 ? a.balance : "",
    ];
  });
  const ws4 = XLSX.utils.aoa_to_sheet([tbHeaders, ...tbData]);
  ws4["!cols"] = tbHeaders.map(() => ({ wch: 14 }));
  XLSX.utils.book_append_sheet(wb, ws4, "科目余额表");

  // Sheet 5: 科目表
  const coaHeaders = ["科目编码", "科目名称", "科目类别", "余额方向"];
  const coaData = Object.entries(subjectCodes).map(([name, code]) => {
    const cat = code.startsWith("1") ? "资产" : code.startsWith("2") ? "负债" : code.startsWith("4") ? "权益" : code.startsWith("6") ? "损益" : "其他";
    const dir = code.startsWith("1") || code.startsWith("6") ? "借" : "贷";
    return [code, name, cat, dir];
  }).sort((a, b) => a[0].localeCompare(b[0]));
  const ws5 = XLSX.utils.aoa_to_sheet([coaHeaders, ...coaData]);
  ws5["!cols"] = [{ wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws5, "科目表");

  // Sheet 6: 导出说明
  const infoData = [
    ["亿企代账数据导入包"],
    [""],
    ["导出时间", new Date().toLocaleString("zh-CN")],
    ["门店", storeName],
    ["凭证数量", entries.length],
    ["进项发票", inputInvs.length],
    ["销项发票", outputInvs.length],
    ["科目余额", accounts.length],
    [""],
    ["导入说明:"],
    ["1. 登录亿企代账，进入「账务处理」→「凭证导入」"],
    ["2. 选择「凭证」Sheet导入凭证数据"],
    ["3. 进入「发票管理」→「进项发票导入」导入进项发票"],
    ["4. 进入「发票管理」→「销项发票导入」导入销项发票"],
    ["5. 「科目余额表」Sheet可在期初余额录入时使用"],
    ["6. 「科目表」Sheet用于核对科目编码是否与亿企代账一致"],
    [""],
    ["兼容软件: 亿企代账 / 用友T+ / 金蝶KIS / 畅捷通"],
  ];
  const ws6 = XLSX.utils.aoa_to_sheet(infoData);
  ws6["!cols"] = [{ wch: 20 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws6, "导出说明");

  const fileName = `亿企代账_全量导入包_${storeName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return {
    voucherCount: entries.length,
    inputInvoiceCount: inputInvs.length,
    outputInvoiceCount: outputInvs.length,
    accountCount: accounts.length,
    fileName,
  };
}
