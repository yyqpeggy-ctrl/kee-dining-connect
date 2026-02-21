import { motion } from "framer-motion";
import { Plus, Search, Filter, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

const journalEntries = [
  { id: "JE001", date: "2024-02-15", type: "income", accountZh: "主营业务收入", accountEn: "Operating Revenue", debit: 0, credit: 28640, descZh: "总店当日营收", descEn: "Main store daily revenue", status: "reviewed" },
  { id: "JE002", date: "2024-02-15", type: "income", accountZh: "主营业务收入", accountEn: "Operating Revenue", debit: 0, credit: 35280, descZh: "国贸分店当日营收", descEn: "Guomao branch daily revenue", status: "reviewed" },
  { id: "JE003", date: "2024-02-15", type: "expense", accountZh: "原材料采购", accountEn: "Raw Materials", debit: 15800, credit: 0, descZh: "海鲜供应商采购", descEn: "Seafood supplier procurement", status: "reviewed" },
  { id: "JE004", date: "2024-02-14", type: "expense", accountZh: "应付职工薪酬", accountEn: "Employee Compensation", debit: 183000, credit: 0, descZh: "2月员工工资", descEn: "Feb employee salaries", status: "pending" },
  { id: "JE005", date: "2024-02-14", type: "expense", accountZh: "管理费用-租金", accountEn: "Admin - Rent", debit: 45000, credit: 0, descZh: "总店2月租金", descEn: "Main store Feb rent", status: "reviewed" },
  { id: "JE006", date: "2024-02-13", type: "expense", accountZh: "管理费用-水电", accountEn: "Admin - Utilities", debit: 8500, credit: 0, descZh: "各门店水电费", descEn: "All stores utilities", status: "reviewed" },
  { id: "JE007", date: "2024-02-13", type: "income", accountZh: "主营业务收入", accountEn: "Operating Revenue", debit: 0, credit: 42150, descZh: "三里屯分店当日营收", descEn: "Sanlitun branch daily revenue", status: "reviewed" },
];

const accountSummary = [
  { nameZh: "库存现金", nameEn: "Cash on Hand", balance: 125000, typeKey: "asset" },
  { nameZh: "银行存款", nameEn: "Bank Deposits", balance: 2850000, typeKey: "asset" },
  { nameZh: "应收账款", nameEn: "Accounts Receivable", balance: 180000, typeKey: "asset" },
  { nameZh: "原材料", nameEn: "Raw Materials", balance: 320000, typeKey: "asset" },
  { nameZh: "应付账款", nameEn: "Accounts Payable", balance: 450000, typeKey: "liability" },
  { nameZh: "应付职工薪酬", nameEn: "Employee Compensation Payable", balance: 183000, typeKey: "liability" },
];

const AccountingTab = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

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
          <h3 className="text-sm font-semibold mb-4">{t("financeMgmt.journalEntries")}</h3>
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
        </motion.div>

        {/* Account Summary */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">{t("financeMgmt.accountBalance")}</h3>
          <div className="space-y-3">
            {accountSummary.map((account) => (
              <div key={isZh ? account.nameZh : account.nameEn} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${account.typeKey === "asset" ? "bg-success" : "bg-warning"}`} />
                  <span className="text-sm">{isZh ? account.nameZh : account.nameEn}</span>
                </div>
                <span className={`font-medium ${account.typeKey === "asset" ? "text-success" : "text-warning"}`}>
                  ¥{account.balance.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("financeMgmt.totalAssets")}</span>
              <span className="font-bold text-success">¥3,475,000</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground">{t("financeMgmt.totalLiabilities")}</span>
              <span className="font-bold text-warning">¥633,000</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AccountingTab;
