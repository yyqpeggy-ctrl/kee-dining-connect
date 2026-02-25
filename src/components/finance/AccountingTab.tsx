import { motion } from "framer-motion";
import { Plus, Search, Filter, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { journalEntries, getAccountSummary, StoreId } from "@/data/financeData";
import { useStore } from "@/contexts/StoreContext";

const AccountingTab = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const { storeId: globalStoreId, storeName, isHQ } = useStore();
  const selectedStore = globalStoreId as StoreId;

  const filteredEntries = useMemo(() => {
    if (selectedStore === "all") return journalEntries;
    return journalEntries.filter(e => e.storeId === selectedStore);
  }, [selectedStore]);

  const storeAccounts = useMemo(() => getAccountSummary(selectedStore), [selectedStore]);

  const totalAssets = storeAccounts.filter(a => a.typeKey === "asset").reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = storeAccounts.filter(a => a.typeKey === "liability").reduce((s, a) => s + a.balance, 0);
  const totalEquity = storeAccounts.filter(a => a.typeKey === "equity").reduce((s, a) => s + a.balance, 0);

  const typeColors: Record<string, string> = { asset: "bg-success", liability: "bg-warning", equity: "bg-primary" };
  const typeTextColors: Record<string, string> = { asset: "text-success", liability: "text-warning", equity: "text-primary" };

  return (
    <div className="space-y-6">
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

      {/* Store indicator */}
      <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
        {isZh
          ? `📊 当前显示: ${isHQ ? "全部门店汇总" : storeName(true) + "独立账务"}，共 ${filteredEntries.length} 条凭证`
          : `📊 Showing: ${isHQ ? "All stores consolidated" : storeName(false) + " standalone"}, ${filteredEntries.length} entries`}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">{t("financeMgmt.journalEntries")} ({filteredEntries.length})</h3>
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
                {filteredEntries.map((entry) => (
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

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">
            {t("financeMgmt.accountBalance")}
            {!isHQ && <span className="text-primary text-xs ml-2">— {storeName(isZh)}</span>}
          </h3>
          <div className="space-y-1 max-h-[450px] overflow-y-auto">
            {storeAccounts.map((account) => (
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