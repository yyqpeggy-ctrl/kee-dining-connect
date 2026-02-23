import { motion } from "framer-motion";
import { Plus, Search, Filter, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

const journalEntries = [
  // === 主营业务收入 (Operating Revenue) ===
  { id: "JE001", date: "2026-02-15", type: "income", accountZh: "主营业务收入", accountEn: "Operating Revenue", debit: 0, credit: 38640, descZh: "旗舰店当日营收（餐饮+酒水）", descEn: "Flagship store daily revenue (F&B)", status: "reviewed" },
  { id: "JE002", date: "2026-02-15", type: "income", accountZh: "主营业务收入", accountEn: "Operating Revenue", debit: 0, credit: 25280, descZh: "法租界店当日营收", descEn: "French Concession daily revenue", status: "reviewed" },
  { id: "JE007", date: "2026-02-13", type: "income", accountZh: "主营业务收入", accountEn: "Operating Revenue", debit: 0, credit: 32150, descZh: "静安店当日营收", descEn: "Jing'an store daily revenue", status: "reviewed" },
  // === 其他业务收入 (Other Revenue) ===
  { id: "JE008", date: "2026-02-14", type: "income", accountZh: "其他业务收入-KTV", accountEn: "Other Revenue - KTV", debit: 0, credit: 8500, descZh: "KTV包房收入", descEn: "KTV room rental income", status: "reviewed" },
  { id: "JE009", date: "2026-02-14", type: "income", accountZh: "其他业务收入-活动", accountEn: "Other Revenue - Events", debit: 0, credit: 12000, descZh: "飞镖比赛报名费", descEn: "Darts tournament entry fees", status: "reviewed" },
  { id: "JE010", date: "2026-02-13", type: "income", accountZh: "其他业务收入-场地", accountEn: "Other Revenue - Venue", debit: 0, credit: 15000, descZh: "私人派对场地租赁", descEn: "Private party venue rental", status: "pending" },
  // === 应收账款 (Accounts Receivable) ===
  { id: "JE011", date: "2026-02-15", type: "income", accountZh: "应收账款-企业客户", accountEn: "AR - Corporate Clients", debit: 45000, credit: 0, descZh: "某科技公司团建餐饮（月结）", descEn: "Tech company team dinner (monthly billing)", status: "pending" },
  { id: "JE012", date: "2026-02-14", type: "income", accountZh: "应收账款-平台结算", accountEn: "AR - Platform Settlement", debit: 28600, credit: 0, descZh: "美团/饿了么外卖平台T+3结算", descEn: "Meituan/Eleme T+3 settlement pending", status: "pending" },
  { id: "JE013", date: "2026-02-10", type: "income", accountZh: "应收账款-挂账消费", accountEn: "AR - Customer Tab", debit: 6800, credit: 0, descZh: "VIP客户挂账消费", descEn: "VIP customer tab consumption", status: "reviewed" },
  // === 应付账款 (Accounts Payable) ===
  { id: "JE014", date: "2026-02-15", type: "expense", accountZh: "应付账款-食材供应商", accountEn: "AP - Food Suppliers", debit: 0, credit: 35200, descZh: "崇明有机农场蔬菜月结", descEn: "Chongming farm vegetables monthly bill", status: "reviewed" },
  { id: "JE015", date: "2026-02-14", type: "expense", accountZh: "应付账款-酒水供应商", accountEn: "AP - Beverage Suppliers", debit: 0, credit: 68000, descZh: "Barcelona精酿贸易酒水货款", descEn: "Barcelona Craft Trading beverage bill", status: "pending" },
  { id: "JE016", date: "2026-02-12", type: "expense", accountZh: "应付账款-设备供应商", accountEn: "AP - Equipment Suppliers", debit: 0, credit: 22000, descZh: "KTV设备维修及配件", descEn: "KTV equipment repair & parts", status: "reviewed" },
  // === 原材料采购 (Raw Materials) ===
  { id: "JE003", date: "2026-02-15", type: "expense", accountZh: "原材料采购-进口食材", accountEn: "Raw Materials - Imported", debit: 18500, credit: 0, descZh: "西班牙伊比利亚火腿5kg+西班牙辣肠3kg", descEn: "Jamón Ibérico 5kg + Chorizo 3kg", status: "reviewed" },
  { id: "JE017", date: "2026-02-14", type: "expense", accountZh: "原材料采购-本地食材", accountEn: "Raw Materials - Local", debit: 8200, credit: 0, descZh: "芝麻菜20kg+番茄30kg+辣椒10kg", descEn: "Arugula 20kg + Tomato 30kg + Peppers 10kg", status: "reviewed" },
  { id: "JE018", date: "2026-02-13", type: "expense", accountZh: "原材料采购-酒水", accountEn: "Raw Materials - Beverages", debit: 42000, credit: 0, descZh: "Estrella Damm 10箱+精酿IPA 8箱+Sangria原料", descEn: "Estrella Damm 10 cases + Craft IPA 8 + Sangria mix", status: "reviewed" },
  // === 应付职工薪酬 (Payroll) ===
  { id: "JE004", date: "2026-02-14", type: "expense", accountZh: "应付职工薪酬-工资", accountEn: "Payroll - Salaries", debit: 183000, credit: 0, descZh: "2月全员基本工资", descEn: "Feb base salaries all staff", status: "pending" },
  { id: "JE019", date: "2026-02-14", type: "expense", accountZh: "应付职工薪酬-社保", accountEn: "Payroll - Social Insurance", debit: 48600, credit: 0, descZh: "2月五险一金企业部分", descEn: "Feb employer social insurance contribution", status: "pending" },
  { id: "JE020", date: "2026-02-14", type: "expense", accountZh: "应付职工薪酬-奖金", accountEn: "Payroll - Bonuses", debit: 15000, credit: 0, descZh: "春节加班费及绩效奖金", descEn: "CNY overtime & performance bonuses", status: "pending" },
  // === 管理费用 (Admin Expenses) ===
  { id: "JE005", date: "2026-02-14", type: "expense", accountZh: "管理费用-租金", accountEn: "Admin - Rent", debit: 100000, credit: 0, descZh: "旗舰店2月租金", descEn: "Flagship store Feb rent", status: "reviewed" },
  { id: "JE021", date: "2026-02-14", type: "expense", accountZh: "管理费用-租金", accountEn: "Admin - Rent", debit: 65000, credit: 0, descZh: "法租界店2月租金", descEn: "French Concession Feb rent", status: "reviewed" },
  { id: "JE006", date: "2026-02-13", type: "expense", accountZh: "管理费用-水电", accountEn: "Admin - Utilities", debit: 12500, credit: 0, descZh: "各门店水电费（电力+燃气+水）", descEn: "All stores utilities (power+gas+water)", status: "reviewed" },
  { id: "JE022", date: "2026-02-12", type: "expense", accountZh: "管理费用-物业", accountEn: "Admin - Property Mgmt", debit: 8000, credit: 0, descZh: "各门店物业管理费", descEn: "All stores property management fees", status: "reviewed" },
  { id: "JE023", date: "2026-02-10", type: "expense", accountZh: "管理费用-保险", accountEn: "Admin - Insurance", debit: 6500, credit: 0, descZh: "商业综合保险月缴", descEn: "Commercial insurance monthly premium", status: "reviewed" },
  // === 固定资产 (Fixed Assets) ===
  { id: "JE024", date: "2026-02-10", type: "expense", accountZh: "固定资产-厨房设备", accountEn: "Fixed Assets - Kitchen Equipment", debit: 85000, credit: 0, descZh: "新购商用烤箱+油烟净化器", descEn: "New commercial oven + exhaust purifier", status: "reviewed" },
  { id: "JE025", date: "2026-02-08", type: "expense", accountZh: "固定资产-KTV设备", accountEn: "Fixed Assets - KTV Equipment", debit: 32000, credit: 0, descZh: "KTV包房音响系统升级", descEn: "KTV room audio system upgrade", status: "reviewed" },
  { id: "JE026", date: "2026-02-05", type: "expense", accountZh: "固定资产-装修改造", accountEn: "Fixed Assets - Renovation", debit: 120000, credit: 0, descZh: "静安店吧台区域翻新", descEn: "Jing'an store bar area renovation", status: "pending" },
  // === 累计折旧 (Accumulated Depreciation) ===
  { id: "JE027", date: "2026-02-01", type: "expense", accountZh: "累计折旧-厨房设备", accountEn: "Depreciation - Kitchen", debit: 4200, credit: 0, descZh: "2月厨房设备直线法折旧", descEn: "Feb kitchen equipment straight-line depreciation", status: "reviewed" },
  { id: "JE028", date: "2026-02-01", type: "expense", accountZh: "累计折旧-KTV设备", accountEn: "Depreciation - KTV", debit: 2800, credit: 0, descZh: "2月KTV音响设备折旧", descEn: "Feb KTV audio equipment depreciation", status: "reviewed" },
  { id: "JE029", date: "2026-02-01", type: "expense", accountZh: "累计折旧-家具装饰", accountEn: "Depreciation - Furniture", debit: 3500, credit: 0, descZh: "2月家具及装饰折旧摊销", descEn: "Feb furniture & decor depreciation", status: "reviewed" },
  // === 库存变动 (Inventory Adjustments) ===
  { id: "JE030", date: "2026-02-15", type: "expense", accountZh: "库存商品-酒水", accountEn: "Inventory - Beverages", debit: 15800, credit: 0, descZh: "精酿啤酒及烈酒入库", descEn: "Craft beer & spirits received into inventory", status: "reviewed" },
  { id: "JE031", date: "2026-02-14", type: "expense", accountZh: "主营业务成本-食材消耗", accountEn: "COGS - Ingredient Consumption", debit: 12600, credit: 0, descZh: "当日厨房食材领用出库", descEn: "Daily kitchen ingredient requisition", status: "reviewed" },
  { id: "JE032", date: "2026-02-13", type: "expense", accountZh: "库存损耗", accountEn: "Inventory Shrinkage", debit: 1200, credit: 0, descZh: "蔬菜过期报损", descEn: "Expired vegetables write-off", status: "reviewed" },
  { id: "JE033", date: "2026-02-10", type: "expense", accountZh: "库存盘点差异", accountEn: "Inventory Variance", debit: 800, credit: 0, descZh: "月中盘点差异调整（酒水短少）", descEn: "Mid-month count variance (beverage shortage)", status: "pending" },
  // === 税费 (Taxes) ===
  { id: "JE034", date: "2026-02-15", type: "expense", accountZh: "应交税费-增值税（销项）", accountEn: "Tax Payable - VAT (Output)", debit: 0, credit: 5796, descZh: "当日营收对应销项税6%", descEn: "Daily revenue output VAT 6%", status: "reviewed" },
  { id: "JE035", date: "2026-02-15", type: "expense", accountZh: "应交税费-增值税（进项）", accountEn: "Tax Payable - VAT (Input)", debit: 2405, credit: 0, descZh: "采购进项税额抵扣", descEn: "Purchase input VAT credit", status: "reviewed" },
  { id: "JE036", date: "2026-02-01", type: "expense", accountZh: "应交税费-企业所得税", accountEn: "Tax Payable - Corporate Income Tax", debit: 42000, credit: 0, descZh: "1月企业所得税预缴", descEn: "Jan corporate income tax prepayment", status: "reviewed" },
  { id: "JE037", date: "2026-02-01", type: "expense", accountZh: "应交税费-附加税", accountEn: "Tax Payable - Surcharges", debit: 3800, credit: 0, descZh: "城建税+教育费附加+地方教育附加", descEn: "Urban maintenance + education surcharges", status: "reviewed" },
  { id: "JE038", date: "2026-02-01", type: "expense", accountZh: "应交税费-个人所得税", accountEn: "Tax Payable - Individual Income Tax", debit: 8900, credit: 0, descZh: "1月代扣代缴员工个税", descEn: "Jan employee IIT withholding", status: "reviewed" },
  // === 营业外收支 (Non-operating) ===
  { id: "JE039", date: "2026-02-12", type: "income", accountZh: "营业外收入-政府补贴", accountEn: "Non-op Income - Govt Subsidy", debit: 0, credit: 50000, descZh: "餐饮业稳岗补贴", descEn: "F&B industry employment retention subsidy", status: "reviewed" },
  { id: "JE040", date: "2026-02-08", type: "expense", accountZh: "营业外支出-罚款", accountEn: "Non-op Expense - Fines", debit: 2000, credit: 0, descZh: "消防检查整改罚款", descEn: "Fire inspection rectification fine", status: "reviewed" },
  // === 财务费用 (Financial Expenses) ===
  { id: "JE041", date: "2026-02-01", type: "expense", accountZh: "财务费用-银行手续费", accountEn: "Finance - Bank Charges", debit: 680, credit: 0, descZh: "1月银行账户管理费+手续费", descEn: "Jan bank account & transaction fees", status: "reviewed" },
  { id: "JE042", date: "2026-02-01", type: "expense", accountZh: "财务费用-利息支出", accountEn: "Finance - Interest Expense", debit: 4500, credit: 0, descZh: "经营贷款利息（月付）", descEn: "Business loan interest (monthly)", status: "reviewed" },
  { id: "JE043", date: "2026-02-15", type: "income", accountZh: "财务费用-利息收入", accountEn: "Finance - Interest Income", debit: 0, credit: 1200, descZh: "银行活期存款利息", descEn: "Bank demand deposit interest", status: "reviewed" },
  // === 销售费用 (Selling Expenses) ===
  { id: "JE044", date: "2026-02-12", type: "expense", accountZh: "销售费用-平台佣金", accountEn: "Selling - Platform Commission", debit: 5600, credit: 0, descZh: "美团/饿了么平台抽成", descEn: "Meituan/Eleme platform commission", status: "reviewed" },
  { id: "JE045", date: "2026-02-10", type: "expense", accountZh: "销售费用-营销推广", accountEn: "Selling - Marketing", debit: 8000, credit: 0, descZh: "大众点评推广+小红书投放", descEn: "Dianping promotion + Xiaohongshu ads", status: "reviewed" },
  { id: "JE046", date: "2026-02-08", type: "expense", accountZh: "销售费用-会员折扣", accountEn: "Selling - Member Discounts", debit: 3200, credit: 0, descZh: "会员卡消费折扣及优惠券核销", descEn: "Loyalty card discounts & coupon redemption", status: "reviewed" },
  // === 预付/预收 (Prepaid/Deferred) ===
  { id: "JE047", date: "2026-02-05", type: "expense", accountZh: "预付账款-年度合同", accountEn: "Prepaid - Annual Contracts", debit: 36000, credit: 0, descZh: "POS系统年度维护合同预付", descEn: "POS system annual maintenance prepayment", status: "reviewed" },
  { id: "JE048", date: "2026-02-08", type: "income", accountZh: "预收账款-储值卡", accountEn: "Deferred Revenue - Stored Value", debit: 0, credit: 25000, descZh: "客户储值卡充值收入", descEn: "Customer stored value card top-ups", status: "reviewed" },
  // === 长期负债 (Long-term Liabilities) ===
  { id: "JE049", date: "2026-02-01", type: "expense", accountZh: "长期借款-本金偿还", accountEn: "Long-term Loan - Principal", debit: 20000, credit: 0, descZh: "装修贷款月供本金部分", descEn: "Renovation loan monthly principal", status: "reviewed" },
  // === 资本/权益 (Equity) ===
  { id: "JE050", date: "2026-02-01", type: "income", accountZh: "实收资本-股东追加", accountEn: "Paid-in Capital - Additional", debit: 0, credit: 200000, descZh: "股东追加投资（新店筹备）", descEn: "Shareholder additional investment (new store prep)", status: "reviewed" },
];

const accountSummary = [
  // Assets
  { nameZh: "库存现金", nameEn: "Cash on Hand", balance: 125000, typeKey: "asset" },
  { nameZh: "银行存款", nameEn: "Bank Deposits", balance: 3850000, typeKey: "asset" },
  { nameZh: "应收账款", nameEn: "Accounts Receivable", balance: 180400, typeKey: "asset" },
  { nameZh: "预付账款", nameEn: "Prepaid Expenses", balance: 36000, typeKey: "asset" },
  { nameZh: "原材料", nameEn: "Raw Materials", balance: 420000, typeKey: "asset" },
  { nameZh: "库存商品", nameEn: "Inventory Goods", balance: 285000, typeKey: "asset" },
  { nameZh: "固定资产原值", nameEn: "Fixed Assets (Gross)", balance: 1680000, typeKey: "asset" },
  { nameZh: "累计折旧", nameEn: "Accumulated Depreciation", balance: -352000, typeKey: "asset" },
  { nameZh: "长期待摊费用", nameEn: "Long-term Deferred Expenses", balance: 96000, typeKey: "asset" },
  // Liabilities
  { nameZh: "应付账款", nameEn: "Accounts Payable", balance: 550000, typeKey: "liability" },
  { nameZh: "应付职工薪酬", nameEn: "Employee Compensation Payable", balance: 246600, typeKey: "liability" },
  { nameZh: "应交税费", nameEn: "Taxes Payable", balance: 62896, typeKey: "liability" },
  { nameZh: "预收账款", nameEn: "Deferred Revenue", balance: 25000, typeKey: "liability" },
  { nameZh: "长期借款", nameEn: "Long-term Loans", balance: 480000, typeKey: "liability" },
  // Equity
  { nameZh: "实收资本", nameEn: "Paid-in Capital", balance: 3000000, typeKey: "equity" },
  { nameZh: "未分配利润", nameEn: "Retained Earnings", balance: 1905904, typeKey: "equity" },
];

const AccountingTab = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  const totalAssets = accountSummary.filter(a => a.typeKey === "asset").reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = accountSummary.filter(a => a.typeKey === "liability").reduce((s, a) => s + a.balance, 0);
  const totalEquity = accountSummary.filter(a => a.typeKey === "equity").reduce((s, a) => s + a.balance, 0);

  const typeColors: Record<string, string> = {
    asset: "bg-success",
    liability: "bg-warning",
    equity: "bg-primary",
  };
  const typeTextColors: Record<string, string> = {
    asset: "text-success",
    liability: "text-warning",
    equity: "text-primary",
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t("financeMgmt.searchVoucher")} className="pl-9 w-64 bg-muted/50 border-border/50" />
          </div>
          <Button variant="outline" size="sm" className="gap-2"><Filter className="w-4 h-4" />{t("common.filter")}</Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2"><FileText className="w-4 h-4" />{t("financeMgmt.importVoucher")}</Button>
          <Button size="sm" className="gap-2"><Plus className="w-4 h-4" />{t("financeMgmt.newVoucher")}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Journal Entries Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">{t("financeMgmt.journalEntries")} ({journalEntries.length})</h3>
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">{t("financeMgmt.voucherNo")}</TableHead>
                  <TableHead className="w-24">{t("common.date")}</TableHead>
                  <TableHead>{t("financeMgmt.accountSubject")}</TableHead>
                  <TableHead className="text-right">{t("financeMgmt.debit")}</TableHead>
                  <TableHead className="text-right">{t("financeMgmt.credit")}</TableHead>
                  <TableHead className="w-20">{t("common.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journalEntries.map((entry) => (
                  <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium text-xs">{entry.id}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{entry.date}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{isZh ? entry.accountZh : entry.accountEn}</p>
                        <p className="text-xs text-muted-foreground">{isZh ? entry.descZh : entry.descEn}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.debit > 0 && (<span className="text-destructive font-medium">¥{entry.debit.toLocaleString()}</span>)}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.credit > 0 && (<span className="text-success font-medium">¥{entry.credit.toLocaleString()}</span>)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.status === "reviewed" ? "secondary" : "outline"} className="text-xs">
                        {entry.status === "reviewed" ? t("financeMgmt.reviewed") : t("financeMgmt.pendingReview")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>

        {/* Account Summary */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">{t("financeMgmt.accountBalance")}</h3>
          <div className="space-y-1 max-h-[450px] overflow-y-auto">
            {accountSummary.map((account) => (
              <div key={isZh ? account.nameZh : account.nameEn} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${typeColors[account.typeKey]}`} />
                  <span className="text-sm">{isZh ? account.nameZh : account.nameEn}</span>
                </div>
                <span className={`font-medium text-sm ${account.balance < 0 ? "text-muted-foreground" : typeTextColors[account.typeKey]}`}>
                  {account.balance < 0 ? "-" : ""}¥{Math.abs(account.balance).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("financeMgmt.totalAssets")}</span>
              <span className="font-bold text-success">¥{totalAssets.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("financeMgmt.totalLiabilities")}</span>
              <span className="font-bold text-warning">¥{totalLiabilities.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{isZh ? "所有者权益" : "Owner's Equity"}</span>
              <span className="font-bold text-primary">¥{totalEquity.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AccountingTab;
