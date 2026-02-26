import * as XLSX from "xlsx";

// =======================================
// 增值税纳税申报表导出 (亿企代账标准格式)
// =======================================
export interface VATDeclarationData {
  storeNameZh: string;
  period: string;
  outputTax: number;
  inputTax: number;
  payable: number;
  outputInvoiceCount: number;
  inputInvoiceCount: number;
  outputAmount: number; // 不含税销售额
  inputAmount: number;  // 不含税进项额
  taxRate: number; // e.g. 0.06
  lastPeriodCredit: number; // 上期留抵
}

export function exportVATDeclaration(data: VATDeclarationData) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: 增值税纳税申报表（一般纳税人适用）
  const mainHeaders = [
    ["增值税纳税申报表（一般纳税人适用）"],
    [""],
    ["纳税人名称", data.storeNameZh, "", "税款所属期", data.period],
    [""],
    ["项目", "栏次", "一般项目（本月数）", "一般项目（本年累计）", "即征即退项目"],
  ];

  const mainData = [
    ["（一）按适用税率计税销售额", "1", data.outputAmount, "", ""],
    ["    其中：应税货物销售额", "2", 0, "", ""],
    ["         应税劳务销售额", "3", 0, "", ""],
    ["         纳税检查调整的销售额", "4", 0, "", ""],
    ["（二）按简易办法计税销售额", "5", 0, "", ""],
    ["（三）免、抵、退办法出口销售额", "6", 0, "", ""],
    ["（四）免税销售额", "7", 0, "", ""],
    [""],
    ["销项税额", "11", data.outputTax, "", ""],
    ["进项税额", "12", data.inputTax, "", ""],
    ["上期留抵税额", "13", data.lastPeriodCredit, "", ""],
    ["进项税额转出", "14", 0, "", ""],
    ["免抵退应退税额", "15", 0, "", ""],
    ["按适用税率计算的纳税检查应补缴税额", "16", 0, "", ""],
    ["应抵扣税额合计", "17", data.inputTax + data.lastPeriodCredit, "", ""],
    ["实际抵扣税额", "18", Math.min(data.inputTax + data.lastPeriodCredit, data.outputTax), "", ""],
    ["应纳税额", "19", Math.max(0, data.outputTax - data.inputTax - data.lastPeriodCredit), "", ""],
    ["期末留抵税额", "20", Math.max(0, data.inputTax + data.lastPeriodCredit - data.outputTax), "", ""],
    [""],
    ["本期应补(退)税额", "24", data.payable, "", ""],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet([...mainHeaders, ...mainData]);
  ws1["!cols"] = [{ wch: 40 }, { wch: 8 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  ws1["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
  XLSX.utils.book_append_sheet(wb, ws1, "增值税申报表");

  // Sheet 2: 增值税纳税申报表附列资料（一）- 销项明细
  const outputHeaders = [
    ["增值税纳税申报表附列资料（一）"],
    ["本期销售情况明细"],
    [""],
    ["项目", "开具增值税专用发票-销售额", "开具增值税专用发票-销项税额",
     "开具其他发票-销售额", "开具其他发票-销项税额",
     "未开具发票-销售额", "未开具发票-销项税额", "合计-销售额", "合计-销项税额"],
  ];
  const outputData = [
    [`${(data.taxRate * 100).toFixed(0)}%税率的货物及加工修理修配劳务`, 0, 0, data.outputAmount, data.outputTax, 0, 0, data.outputAmount, data.outputTax],
    ["6%税率的服务、不动产和无形资产", data.outputAmount, data.outputTax, 0, 0, 0, 0, data.outputAmount, data.outputTax],
    ["合计", data.outputAmount, data.outputTax, 0, 0, 0, 0, data.outputAmount, data.outputTax],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet([...outputHeaders, ...outputData]);
  ws2["!cols"] = Array(9).fill({ wch: 18 });
  XLSX.utils.book_append_sheet(wb, ws2, "附列资料一-销项");

  // Sheet 3: 增值税纳税申报表附列资料（二）- 进项明细
  const inputHeaders = [
    ["增值税纳税申报表附列资料（二）"],
    ["本期进项税额明细"],
    [""],
    ["项目", "栏次", "份数", "金额", "税额"],
  ];
  const inputData = [
    ["（一）认证相符的增值税专用发票", "1", data.inputInvoiceCount, data.inputAmount, data.inputTax],
    ["    其中：本期认证相符且本期申报抵扣", "2", data.inputInvoiceCount, data.inputAmount, data.inputTax],
    ["（二）其他扣税凭证", "3", 0, 0, 0],
    ["（三）本期用于抵扣的旅客运输服务", "4", 0, 0, 0],
    ["当期申报抵扣进项税额合计", "12", data.inputInvoiceCount, data.inputAmount, data.inputTax],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet([...inputHeaders, ...inputData]);
  ws3["!cols"] = [{ wch: 45 }, { wch: 8 }, { wch: 10 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws3, "附列资料二-进项");

  const fileName = `增值税纳税申报表_${data.storeNameZh}_${data.period.replace(/\s/g, "")}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return { fileName };
}

// =======================================
// 企业所得税预缴申报表导出
// =======================================
export interface CITDeclarationData {
  storeNameZh: string;
  period: string;
  revenue: number;
  cost: number;
  totalProfit: number;
  taxableIncome: number;
  taxRate: number; // 25%
  taxDue: number;
  prepaid: number;
  balance: number;
}

export function exportCITDeclaration(data: CITDeclarationData) {
  const wb = XLSX.utils.book_new();

  const headers = [
    ["中华人民共和国企业所得税月(季)度预缴纳税申报表(A类)"],
    [""],
    ["纳税人名称", data.storeNameZh, "", "税款所属期间", data.period],
    [""],
    ["行次", "项目", "本期金额", "累计金额"],
  ];

  const rows = [
    ["1", "营业收入", data.revenue, data.revenue],
    ["2", "营业成本", data.cost, data.cost],
    ["3", "利润总额", data.totalProfit, data.totalProfit],
    ["4", "加：特定业务计算的应纳税所得额", 0, 0],
    ["5", "减：不征税收入", 0, 0],
    ["6", "减：免税收入、减计收入、加计扣除", 0, 0],
    ["7", "减：固定资产加速折旧(扣除)调减额", 0, 0],
    ["8", "减：弥补以前年度亏损", 0, 0],
    ["9", "实际利润额（3+4-5-6-7-8）", data.taxableIncome, data.taxableIncome],
    ["10", "税率（25%）", `${data.taxRate}%`, `${data.taxRate}%`],
    ["11", "应纳所得税额（9×10）", data.taxDue, data.taxDue],
    ["12", "减：减免所得税额", 0, 0],
    ["13", "减：实际已预缴所得税额", data.prepaid, data.prepaid],
    ["14", "减：特定业务预缴(征)所得税额", 0, 0],
    ["15", "本期应补(退)所得税额（11-12-13-14）", data.balance, data.balance],
  ];

  const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
  ws["!cols"] = [{ wch: 8 }, { wch: 40 }, { wch: 16 }, { wch: 16 }];
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
  XLSX.utils.book_append_sheet(wb, ws, "企业所得税预缴表");

  const fileName = `企业所得税预缴申报表_${data.storeNameZh}_${data.period.replace(/\s/g, "")}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return { fileName };
}

// =======================================
// 个人所得税代扣代缴报表导出
// =======================================
export interface IITEmployee {
  name: string;
  idNumber: string;
  salary: number;
  socialInsurance: number;
  housingFund: number;
  specialDeduction: number;
  taxableIncome: number;
  taxAmount: number;
}

export interface IITDeclarationData {
  storeNameZh: string;
  period: string;
  employees: IITEmployee[];
  totalSalary: number;
  totalTax: number;
}

export function exportIITDeclaration(data: IITDeclarationData) {
  const wb = XLSX.utils.book_new();

  const headers = [
    ["个人所得税扣缴申报表"],
    [""],
    ["扣缴义务人名称", data.storeNameZh, "", "税款所属期", data.period],
    [""],
    ["序号", "姓名", "证件号码", "本期收入", "基本养老保险", "基本医疗保险",
     "失业保险", "住房公积金", "累计专项附加扣除", "累计减除费用",
     "应纳税所得额", "税率", "速算扣除数", "应纳税额", "已预缴税额", "应补(退)税额"],
  ];

  const rows = data.employees.map((e, i) => [
    i + 1, e.name, e.idNumber, e.salary,
    Math.round(e.socialInsurance * 0.4), // 养老
    Math.round(e.socialInsurance * 0.1), // 医疗
    Math.round(e.socialInsurance * 0.05), // 失业
    e.housingFund,
    e.specialDeduction,
    5000, // 月减除费用
    e.taxableIncome,
    e.taxableIncome <= 36000 ? "3%" : e.taxableIncome <= 144000 ? "10%" : "20%",
    e.taxableIncome <= 36000 ? 0 : e.taxableIncome <= 144000 ? 2520 : 16920,
    e.taxAmount, 0, e.taxAmount,
  ]);

  // Summary row
  rows.push([
    "合计", "", "", data.totalSalary,
    "", "", "", "", "", "",
    "", "", "", data.totalTax, 0, data.totalTax,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
  ws["!cols"] = [
    { wch: 6 }, { wch: 10 }, { wch: 20 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
    { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 8 },
    { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
  ];
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 15 } }];
  XLSX.utils.book_append_sheet(wb, ws, "个税扣缴申报表");

  const fileName = `个人所得税扣缴申报表_${data.storeNameZh}_${data.period.replace(/\s/g, "")}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return { fileName };
}

// =======================================
// 附加税费申报表导出
// =======================================
export interface SurchargeData {
  storeNameZh: string;
  period: string;
  vatPayable: number;
  cityMaintenanceRate: number; // 7%
  eduSurchargeRate: number; // 3%
  localEduRate: number; // 2%
  cityMaintenance: number;
  eduSurcharge: number;
  localEdu: number;
  stampDuty: number;
}

export function exportSurchargeDeclaration(data: SurchargeData) {
  const wb = XLSX.utils.book_new();

  const headers = [
    ["城市维护建设税、教育费附加、地方教育附加申报表"],
    [""],
    ["纳税人名称", data.storeNameZh, "", "税款所属期", data.period],
    [""],
    ["税（费）种", "计税（费）依据", "税率（征收率）", "本期应纳税（费）额", "本期减免税（费）额", "本期已缴税（费）额", "本期应补（退）税（费）额"],
  ];

  const rows = [
    ["城市维护建设税", data.vatPayable, `${(data.cityMaintenanceRate * 100).toFixed(0)}%`, data.cityMaintenance, 0, 0, data.cityMaintenance],
    ["教育费附加", data.vatPayable, `${(data.eduSurchargeRate * 100).toFixed(0)}%`, data.eduSurcharge, 0, 0, data.eduSurcharge],
    ["地方教育附加", data.vatPayable, `${(data.localEduRate * 100).toFixed(0)}%`, data.localEdu, 0, 0, data.localEdu],
    [""],
    ["印花税", "", "0.03%", data.stampDuty, 0, 0, data.stampDuty],
    [""],
    ["合计", "", "", data.cityMaintenance + data.eduSurcharge + data.localEdu + data.stampDuty, 0, 0, data.cityMaintenance + data.eduSurcharge + data.localEdu + data.stampDuty],
  ];

  const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
  ws["!cols"] = [{ wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 20 }];
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
  XLSX.utils.book_append_sheet(wb, ws, "附加税费申报表");

  const fileName = `附加税费申报表_${data.storeNameZh}_${data.period.replace(/\s/g, "")}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return { fileName };
}

// =======================================
// 全量报税数据包导出 (亿企代账一键导入)
// =======================================
export function exportAllTaxReports(
  vat: VATDeclarationData,
  cit: CITDeclarationData,
  surcharge: SurchargeData,
  iitEmployees: IITEmployee[],
  storeName: string,
  period: string,
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: 增值税
  const vatSheet = [
    ["增值税纳税申报表（一般纳税人适用）"],
    ["纳税人名称", storeName, "", "税款所属期", period],
    [""],
    ["项目", "栏次", "本月数"],
    ["销项税额", "11", vat.outputTax],
    ["进项税额", "12", vat.inputTax],
    ["上期留抵税额", "13", vat.lastPeriodCredit],
    ["应抵扣税额合计", "17", vat.inputTax + vat.lastPeriodCredit],
    ["实际抵扣税额", "18", Math.min(vat.inputTax + vat.lastPeriodCredit, vat.outputTax)],
    ["应纳税额", "19", vat.payable],
    ["期末留抵税额", "20", Math.max(0, vat.inputTax + vat.lastPeriodCredit - vat.outputTax)],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(vatSheet);
  ws1["!cols"] = [{ wch: 30 }, { wch: 8 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws1, "增值税申报");

  // Sheet 2: 企业所得税
  const citSheet = [
    ["企业所得税月(季)度预缴纳税申报表(A类)"],
    ["纳税人名称", storeName, "", "税款所属期", period],
    [""],
    ["行次", "项目", "本期金额"],
    ["1", "营业收入", cit.revenue],
    ["2", "营业成本", cit.cost],
    ["3", "利润总额", cit.totalProfit],
    ["9", "应纳税所得额", cit.taxableIncome],
    ["10", `税率(${cit.taxRate}%)`, `${cit.taxRate}%`],
    ["11", "应纳所得税额", cit.taxDue],
    ["13", "已预缴所得税额", cit.prepaid],
    ["15", "本期应补(退)税额", cit.balance],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(citSheet);
  ws2["!cols"] = [{ wch: 8 }, { wch: 30 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws2, "企业所得税预缴");

  // Sheet 3: 附加税费
  const surSheet = [
    ["城市维护建设税、教育费附加、地方教育附加申报表"],
    ["纳税人名称", storeName, "", "税款所属期", period],
    [""],
    ["税种", "计税依据", "税率", "应纳税额"],
    ["城市维护建设税", surcharge.vatPayable, `${(surcharge.cityMaintenanceRate * 100).toFixed(0)}%`, surcharge.cityMaintenance],
    ["教育费附加", surcharge.vatPayable, `${(surcharge.eduSurchargeRate * 100).toFixed(0)}%`, surcharge.eduSurcharge],
    ["地方教育附加", surcharge.vatPayable, `${(surcharge.localEduRate * 100).toFixed(0)}%`, surcharge.localEdu],
    ["印花税", "", "0.03%", surcharge.stampDuty],
    ["合计", "", "", surcharge.cityMaintenance + surcharge.eduSurcharge + surcharge.localEdu + surcharge.stampDuty],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(surSheet);
  ws3["!cols"] = [{ wch: 22 }, { wch: 16 }, { wch: 10 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws3, "附加税费");

  // Sheet 4: 个税
  const iitSheet = [
    ["个人所得税扣缴申报表"],
    ["扣缴义务人", storeName, "", "税款所属期", period],
    [""],
    ["序号", "姓名", "本期收入", "社保扣除", "专项附加扣除", "应纳税所得额", "应纳税额"],
    ...iitEmployees.map((e, i) => [i + 1, e.name, e.salary, e.socialInsurance, e.specialDeduction, e.taxableIncome, e.taxAmount]),
    ["合计", "", iitEmployees.reduce((s, e) => s + e.salary, 0), "", "", "", iitEmployees.reduce((s, e) => s + e.taxAmount, 0)],
  ];
  const ws4 = XLSX.utils.aoa_to_sheet(iitSheet);
  ws4["!cols"] = [{ wch: 6 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws4, "个税代扣");

  // Sheet 5: 导入说明
  const infoSheet = [
    ["亿企代账报税数据导入包"],
    [""],
    ["导出时间", new Date().toLocaleString("zh-CN")],
    ["门店", storeName],
    ["税期", period],
    [""],
    ["导入说明:"],
    ["1. 登录亿企代账 → 「税务申报」→ 「增值税申报」→ 导入「增值税申报」Sheet"],
    ["2. 「税务申报」→ 「企业所得税预缴」→ 导入「企业所得税预缴」Sheet"],
    ["3. 「税务申报」→ 「附加税费」→ 导入「附加税费」Sheet"],
    ["4. 「税务申报」→ 「个税代扣」→ 导入「个税代扣」Sheet"],
    ["5. 核对各表数据无误后，点击「一键申报」完成提交"],
    [""],
    ["兼容软件: 亿企代账 / 用友T+ / 金蝶KIS / 畅捷通"],
  ];
  const ws5 = XLSX.utils.aoa_to_sheet(infoSheet);
  ws5["!cols"] = [{ wch: 20 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, ws5, "导入说明");

  const fileName = `亿企代账_报税数据包_${storeName}_${period.replace(/\s/g, "")}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return { fileName };
}
