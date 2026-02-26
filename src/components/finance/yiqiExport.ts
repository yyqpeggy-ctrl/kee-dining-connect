import * as XLSX from "xlsx";
import { JournalEntry } from "@/data/financeData";

/**
 * 导出亿企代账兼容格式的凭证Excel
 * 支持用友/金蝶/亿企代账等主流财务软件导入
 */
export function exportVouchersForYiqi(entries: JournalEntry[], isZh: boolean) {
  // 亿企代账标准凭证导入格式
  const headers = [
    "凭证类型", "凭证号", "日期", "摘要",
    "科目编码", "科目名称", "借方金额", "贷方金额",
    "辅助核算-部门", "辅助核算-项目", "制单人", "审核人"
  ];

  // Map account names to standard subject codes (科目编码)
  const subjectCodes: Record<string, string> = {
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
  };

  const data = entries.map((e, i) => [
    "记", // 凭证类型: 记账凭证
    e.id,
    e.date,
    e.descZh,
    subjectCodes[e.accountZh] || "",
    e.accountZh,
    e.debit > 0 ? e.debit : "",
    e.credit > 0 ? e.credit : "",
    "", // 部门
    "", // 项目
    "系统", // 制单人
    e.status === "reviewed" ? "已审" : "", // 审核人
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  ws["!cols"] = [
    { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 35 },
    { wch: 12 }, { wch: 25 }, { wch: 14 }, { wch: 14 },
    { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 8 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "凭证");

  // 添加科目表 sheet
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
}

/**
 * 导出标准科目余额表（可导入亿企代账/用友/金蝶）
 */
export function exportTrialBalance(accounts: { nameZh: string; balance: number; typeKey: string }[], isZh: boolean) {
  const headers = ["科目编码", "科目名称", "期初借方余额", "期初贷方余额", "本期借方发生额", "本期贷方发生额", "期末借方余额", "期末贷方余额"];
  
  const subjectCodes: Record<string, string> = {
    "库存现金": "1001", "银行存款": "1002", "应收账款": "1122",
    "原材料": "1403", "库存商品": "1405", "预付账款": "1123",
    "固定资产": "1601", "累计折旧": "1602",
    "应付账款": "2202", "应付职工薪酬": "2211", "应交税费": "2221",
    "预收账款": "2203", "长期借款": "2501",
    "实收资本": "4001", "未分配利润": "4104", "本年利润": "4103",
  };

  const data = accounts.map(a => {
    const code = Object.entries(subjectCodes).find(([k]) => a.nameZh.includes(k))?.[1] || "";
    const isDebit = a.typeKey === "asset";
    return [
      code, a.nameZh,
      isDebit && a.balance > 0 ? a.balance : "",
      !isDebit && a.balance > 0 ? a.balance : "",
      "", "", // 本期发生额留空
      isDebit && a.balance > 0 ? a.balance : "",
      !isDebit && a.balance > 0 ? a.balance : "",
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "科目余额表");
  XLSX.writeFile(wb, `科目余额表_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
