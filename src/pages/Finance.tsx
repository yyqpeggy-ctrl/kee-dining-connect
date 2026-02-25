import { motion } from "framer-motion";
import { Calendar, Download, BookOpen, FileSpreadsheet, Receipt, Calculator, Link2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import StoreIndicator from "@/components/StoreIndicator";
import { useStore } from "@/contexts/StoreContext";
import FinanceKPICards from "@/components/finance/FinanceKPICards";
import AccountingTab from "@/components/finance/AccountingTab";
import ReportsTab from "@/components/finance/ReportsTab";
import TaxTab from "@/components/finance/TaxTab";
import TransactionsTab from "@/components/finance/TransactionsTab";
import CrossModuleDashboard from "@/components/finance/CrossModuleDashboard";
import { computeIncomeStatement, StoreId, journalEntries } from "@/data/financeData";

const Finance = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const { storeName, storeId: globalStoreId } = useStore();
  const selectedStore = globalStoreId as StoreId;

  // Compute KPI from actual journal entries filtered by store
  const income = useMemo(() => computeIncomeStatement(selectedStore), [selectedStore]);
  const totalRevenue = income.totalRevenue;
  const totalExpense = income.sections.slice(1).reduce((s, sec) => s + sec.total, 0);
  const totalProfit = income.netProfit;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">{t("financeMgmt.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{storeName(isZh)} · {t("financeMgmt.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors flex items-center gap-2"><Calendar className="w-4 h-4" />{t("common.thisMonth")}</button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"><Download className="w-4 h-4" />{t("financeMgmt.exportReport")}</button>
        </div>
      </div>

      <StoreIndicator />

      <FinanceKPICards totalRevenue={totalRevenue} totalExpense={totalExpense} totalProfit={totalProfit} />

      <Tabs defaultValue="crossmodule" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6 bg-muted/50">
          <TabsTrigger value="crossmodule" className="gap-2 data-[state=active]:bg-primary/20"><Link2 className="w-4 h-4" />{t("financeMgmt.crossModule")}</TabsTrigger>
          <TabsTrigger value="accounting" className="gap-2 data-[state=active]:bg-primary/20"><BookOpen className="w-4 h-4" />{t("financeMgmt.accounting")}</TabsTrigger>
          <TabsTrigger value="reports" className="gap-2 data-[state=active]:bg-primary/20"><FileSpreadsheet className="w-4 h-4" />{t("financeMgmt.reports")}</TabsTrigger>
          <TabsTrigger value="tax" className="gap-2 data-[state=active]:bg-primary/20"><Calculator className="w-4 h-4" />{t("financeMgmt.tax")}</TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2 data-[state=active]:bg-primary/20"><Receipt className="w-4 h-4" />{t("financeMgmt.transactions")}</TabsTrigger>
        </TabsList>
        <TabsContent value="crossmodule"><CrossModuleDashboard /></TabsContent>
        <TabsContent value="accounting"><AccountingTab /></TabsContent>
        <TabsContent value="reports"><ReportsTab /></TabsContent>
        <TabsContent value="tax"><TaxTab /></TabsContent>
        <TabsContent value="transactions"><TransactionsTab /></TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Finance;