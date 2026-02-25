import { motion } from "framer-motion";
import { Search, Filter, Download, Receipt, ArrowUpRight, ArrowDownRight, CreditCard, Wallet, Building2, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { useState } from "react";

const categoryLabels: Record<string, { zh: string; en: string }> = {
  revenue: { zh: "营业收入", en: "Operating Revenue" },
  procurement: { zh: "原材料采购", en: "Raw Materials" },
  asset_purchase: { zh: "资产购置", en: "Asset Purchase" },
  depreciation: { zh: "折旧摊销", en: "Depreciation" },
};

const TransactionsTab = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const { storeId, isHQ, storeName } = useStore();
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: transactions = [] } = useQuery({
    queryKey: ["finance-transactions-list", storeId],
    queryFn: async () => {
      let query = supabase
        .from("finance_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!isHQ) {
        query = query.eq("store_id", storeId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filtered = typeFilter === "all" ? transactions : transactions.filter(tx => tx.type === typeFilter);
  const totalIncome = filtered.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = filtered.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);

  const iconForCategory = (cat: string) => {
    const map: Record<string, React.ReactNode> = {
      revenue: <Wallet className="w-4 h-4" />,
      procurement: <ShoppingCart className="w-4 h-4" />,
      asset_purchase: <Building2 className="w-4 h-4" />,
      depreciation: <CreditCard className="w-4 h-4" />,
    };
    return map[cat] || <Receipt className="w-4 h-4" />;
  };

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

      {/* Store context + Filters */}
      <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 mb-2">
        {isZh
          ? `📊 当前显示: ${isHQ ? "全部门店汇总" : storeName(true) + "独立流水"}，共 ${filtered.length} 条记录`
          : `📊 Showing: ${isHQ ? "All stores consolidated" : storeName(false) + " standalone"}, ${filtered.length} records`}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t("financeMgmt.searchTransactions")} className="pl-9 bg-muted/50 border-border/50" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32 bg-muted/50"><SelectValue placeholder={t("common.type")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("financeMgmt.allTypes")}</SelectItem>
            <SelectItem value="income">{t("financeMgmt.income")}</SelectItem>
            <SelectItem value="expense">{t("financeMgmt.expense")}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-2"><Filter className="w-4 h-4" />{t("financeMgmt.moreFilters")}</Button>
        <Button variant="outline" size="sm" className="gap-2 ml-auto"><Download className="w-4 h-4" />{t("common.export")}</Button>
      </div>

      {/* Transactions List */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
        <div className="space-y-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{isZh ? "暂无收支流水记录" : "No transaction records"}</p>
          ) : (
            filtered.map((tx) => {
              const catLabel = categoryLabels[tx.category];
              return (
                <div key={tx.id} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tx.type === "income" ? "bg-success/10" : "bg-destructive/10"}`}>
                      <div className={tx.type === "income" ? "text-success" : "text-destructive"}>
                        {iconForCategory(tx.category)}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{isZh ? tx.description_zh : tx.description_en}</p>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{catLabel ? (isZh ? catLabel.zh : catLabel.en) : tx.category}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{tx.transaction_number}</span>
                        {tx.payment_method && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{tx.payment_method}</span>
                          </>
                        )}
                        {isHQ && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{isZh ? tx.store_name_zh : tx.store_name_en}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-semibold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                      {tx.type === "income" ? "+" : "-"}¥{Number(tx.amount).toLocaleString()}
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      {tx.status === "pending" ? (isZh ? "待审核" : "Pending") : tx.status === "reviewed" ? (isZh ? "已审核" : "Reviewed") : tx.status}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TransactionsTab;