import { motion } from "framer-motion";
import { Search, Filter, Download, Receipt, ArrowUpRight, ArrowDownRight, CreditCard, Wallet, Building2, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

interface Transaction {
  id: string;
  type: "income" | "expense";
  categoryKey: string;
  descZh: string;
  descEn: string;
  amount: number;
  timeZh: string;
  timeEn: string;
  methodZh: string;
  methodEn: string;
  storeZh: string;
  storeEn: string;
  icon: string;
}

const transactions: Transaction[] = [
  { id: "T001", type: "income", categoryKey: "operatingRevenue", descZh: "门店营收 - 旗舰店", descEn: "Store Revenue - Flagship", amount: 38640, timeZh: "今天 21:00", timeEn: "Today 21:00", methodZh: "微信支付", methodEn: "WeChat Pay", storeZh: "旗舰店", storeEn: "Flagship", icon: "wallet" },
  { id: "T002", type: "income", categoryKey: "operatingRevenue", descZh: "门店营收 - 法租界店", descEn: "Store Revenue - French Concession", amount: 25280, timeZh: "今天 21:00", timeEn: "Today 21:00", methodZh: "支付宝", methodEn: "Alipay", storeZh: "法租界店", storeEn: "French Concession", icon: "wallet" },
  { id: "T003", type: "expense", categoryKey: "rawMaterials", descZh: "火腿/腌肉供应商采购", descEn: "Charcuterie Supplier Purchase", amount: 18500, timeZh: "今天 14:30", timeEn: "Today 14:30", methodZh: "银行转账", methodEn: "Bank Transfer", storeZh: "总部", storeEn: "HQ", icon: "cart" },
  { id: "T004", type: "expense", categoryKey: "laborCost", descZh: "员工工资 - 2月", descEn: "Employee Salary - Feb", amount: 183000, timeZh: "今天 10:00", timeEn: "Today 10:00", methodZh: "银行转账", methodEn: "Bank Transfer", storeZh: "总部", storeEn: "HQ", icon: "building" },
  { id: "T005", type: "income", categoryKey: "operatingRevenue", descZh: "门店营收 - 静安店", descEn: "Store Revenue - Jing'an", amount: 32150, timeZh: "昨天 22:00", timeEn: "Yesterday 22:00", methodZh: "混合支付", methodEn: "Mixed Payment", storeZh: "静安店", storeEn: "Jing'an", icon: "wallet" },
  { id: "T006", type: "expense", categoryKey: "rentUtilities", descZh: "旗舰店2月租金", descEn: "Flagship Store Feb Rent", amount: 100000, timeZh: "昨天 10:00", timeEn: "Yesterday 10:00", methodZh: "银行转账", methodEn: "Bank Transfer", storeZh: "旗舰店", storeEn: "Flagship", icon: "building" },
  { id: "T007", type: "expense", categoryKey: "rentUtilities", descZh: "各门店水电费", descEn: "All Stores Utilities", amount: 12500, timeZh: "2天前", timeEn: "2 days ago", methodZh: "银行扣款", methodEn: "Bank Debit", storeZh: "总部", storeEn: "HQ", icon: "building" },
  { id: "T008", type: "income", categoryKey: "otherIncome", descZh: "外卖平台结算", descEn: "Delivery Platform Settlement", amount: 18600, timeZh: "2天前", timeEn: "2 days ago", methodZh: "银行转账", methodEn: "Bank Transfer", storeZh: "总部", storeEn: "HQ", icon: "card" },
  { id: "T009", type: "expense", categoryKey: "marketingExp", descZh: "大众点评推广", descEn: "Dianping Promotion", amount: 5000, timeZh: "3天前", timeEn: "3 days ago", methodZh: "在线支付", methodEn: "Online Payment", storeZh: "总部", storeEn: "HQ", icon: "receipt" },
  { id: "T010", type: "expense", categoryKey: "maintenance", descZh: "酒吧设备维修", descEn: "Bar Equipment Repair", amount: 3800, timeZh: "3天前", timeEn: "3 days ago", methodZh: "现金", methodEn: "Cash", storeZh: "法租界店", storeEn: "French Concession", icon: "receipt" },
];

const categoryLabels: Record<string, { zh: string; en: string }> = {
  operatingRevenue: { zh: "营业收入", en: "Operating Revenue" },
  otherIncome: { zh: "其他收入", en: "Other Income" },
  rawMaterials: { zh: "原材料采购", en: "Raw Materials" },
  laborCost: { zh: "人工成本", en: "Labor Cost" },
  rentUtilities: { zh: "租金水电", en: "Rent & Utilities" },
  marketingExp: { zh: "营销费用", en: "Marketing" },
  maintenance: { zh: "设备维护", en: "Maintenance" },
};

const iconMap: Record<string, React.ReactNode> = {
  wallet: <Wallet className="w-4 h-4" />,
  card: <CreditCard className="w-4 h-4" />,
  cart: <ShoppingCart className="w-4 h-4" />,
  building: <Building2 className="w-4 h-4" />,
  receipt: <Receipt className="w-4 h-4" />,
};

const TransactionsTab = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">{t("financeMgmt.periodIncome")}</p>
          <p className="text-2xl font-bold text-success flex items-center gap-2"><ArrowUpRight className="w-5 h-5" />¥{totalIncome.toLocaleString()}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">{t("financeMgmt.periodExpense")}</p>
          <p className="text-2xl font-bold text-destructive flex items-center gap-2"><ArrowDownRight className="w-5 h-5" />¥{totalExpense.toLocaleString()}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">{t("financeMgmt.netBalance")}</p>
          <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? "text-success" : "text-destructive"}`}>¥{(totalIncome - totalExpense).toLocaleString()}</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t("financeMgmt.searchTransactions")} className="pl-9 bg-muted/50 border-border/50" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-32 bg-muted/50"><SelectValue placeholder={t("common.type")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("financeMgmt.allTypes")}</SelectItem>
            <SelectItem value="income">{t("financeMgmt.income")}</SelectItem>
            <SelectItem value="expense">{t("financeMgmt.expense")}</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-36 bg-muted/50"><SelectValue placeholder={t("hrMgmt.store")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("financeMgmt.allStores")}</SelectItem>
            <SelectItem value="hq">{t("financeMgmt.headquarters")}</SelectItem>
            <SelectItem value="flagship">{isZh ? "旗舰店" : "Flagship"}</SelectItem>
            <SelectItem value="fc">{isZh ? "法租界店" : "French Concession"}</SelectItem>
            <SelectItem value="jingan">{isZh ? "静安店" : "Jing'an"}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-2"><Filter className="w-4 h-4" />{t("financeMgmt.moreFilters")}</Button>
        <Button variant="outline" size="sm" className="gap-2 ml-auto"><Download className="w-4 h-4" />{t("common.export")}</Button>
      </div>

      {/* Transactions List */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
        <div className="space-y-1">
          {transactions.map((tx) => {
            const catLabel = categoryLabels[tx.categoryKey];
            return (
              <div key={tx.id} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tx.type === "income" ? "bg-success/10" : "bg-destructive/10"}`}>
                    <div className={tx.type === "income" ? "text-success" : "text-destructive"}>
                      {iconMap[tx.icon] || <Receipt className="w-4 h-4" />}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{isZh ? tx.descZh : tx.descEn}</p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{catLabel ? (isZh ? catLabel.zh : catLabel.en) : tx.categoryKey}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{isZh ? tx.timeZh : tx.timeEn}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{isZh ? tx.methodZh : tx.methodEn}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{isZh ? tx.storeZh : tx.storeEn}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-semibold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                    {tx.type === "income" ? "+" : "-"}¥{tx.amount.toLocaleString()}
                  </span>
                  <p className="text-[10px] text-muted-foreground">{tx.id}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">{t("common.showing")} 1-10 {t("common.of")} 156 {t("common.records")}</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>{t("common.previous")}</Button>
            <Button variant="outline" size="sm" className="bg-primary/20">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">{t("common.next")}</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TransactionsTab;
