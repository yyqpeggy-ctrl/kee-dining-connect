import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FinanceKPICardsProps {
  totalRevenue: number;
  totalExpense: number;
  totalProfit: number;
}

const FinanceKPICards = ({ totalRevenue, totalExpense, totalProfit }: FinanceKPICardsProps) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <span className="text-xs text-success flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" />+12.5%
          </span>
        </div>
        <p className="text-2xl font-bold font-display">¥{(totalRevenue / 10000).toFixed(1)}万</p>
        <p className="text-xs text-muted-foreground">{t("financeMgmt.cumulativeRevenue")}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-destructive" />
          </div>
          <span className="text-xs text-destructive flex items-center gap-0.5">
            <ArrowDownRight className="w-3 h-3" />+8.2%
          </span>
        </div>
        <p className="text-2xl font-bold font-display">¥{(totalExpense / 10000).toFixed(1)}万</p>
        <p className="text-xs text-muted-foreground">{t("financeMgmt.cumulativeExpense")}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs text-success flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" />+18.3%
          </span>
        </div>
        <p className="text-2xl font-bold font-display text-primary">¥{(totalProfit / 10000).toFixed(1)}万</p>
        <p className="text-xs text-muted-foreground">{t("financeMgmt.netProfit")}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-info" />
          </div>
        </div>
        <p className="text-2xl font-bold font-display">{((totalProfit / totalRevenue) * 100).toFixed(1)}%</p>
        <p className="text-xs text-muted-foreground">{t("financeMgmt.profitMargin")}</p>
      </motion.div>
    </div>
  );
};

export default FinanceKPICards;
