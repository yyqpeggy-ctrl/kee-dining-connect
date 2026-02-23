import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { computeIncomeStatement, computeBalanceSheet, computeCashFlow, stores, StoreId } from "@/data/financeData";
import { useState, useMemo } from "react";
import { useStore } from "@/contexts/StoreContext";

const ReportsTab = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const { storeId: globalStoreId } = useStore();
  const selectedStore = globalStoreId as StoreId;

  const income = useMemo(() => computeIncomeStatement(selectedStore), [selectedStore]);
  const balance = useMemo(() => computeBalanceSheet(selectedStore), [selectedStore]);
  const cashFlow = useMemo(() => computeCashFlow(selectedStore), [selectedStore]);

  const fmt = (n: number) => `¥${n.toLocaleString()}`;
  const fmtSigned = (n: number) => n >= 0 ? `+${fmt(n)}` : `-¥${Math.abs(n).toLocaleString()}`;

  const expenseData = income.sections.slice(1).flatMap(s => s.items).map((item) => ({
    name: isZh ? item.zh : item.en,
    value: item.amount,
  })).filter(d => d.value > 0);

  const COLORS = [
    "hsl(36, 90%, 55%)", "hsl(24, 85%, 50%)", "hsl(152, 60%, 45%)",
    "hsl(210, 70%, 55%)", "hsl(220, 14%, 50%)", "hsl(340, 70%, 55%)",
    "hsl(180, 60%, 45%)", "hsl(280, 60%, 55%)", "hsl(50, 80%, 50%)",
    "hsl(120, 50%, 45%)", "hsl(0, 70%, 55%)", "hsl(200, 70%, 50%)",
  ];

  const cfBarData = [
    { name: isZh ? "经营活动" : "Operating", value: cashFlow.operating.net },
    { name: isZh ? "投资活动" : "Investing", value: cashFlow.investing.net },
    { name: isZh ? "筹资活动" : "Financing", value: cashFlow.financing.net },
    { name: isZh ? "净变动" : "Net Change", value: cashFlow.netChange },
  ];

  const grossMargin = income.totalRevenue > 0 ? ((income.grossProfit / income.totalRevenue) * 100).toFixed(1) : "0";
  const netMargin = income.totalRevenue > 0 ? ((income.netProfit / income.totalRevenue) * 100).toFixed(1) : "0";
  const debtRatio = balance.totalAssets > 0 ? ((balance.totalLiabilities / balance.totalAssets) * 100).toFixed(1) : "0";
  const currentAssets = balance.assets.filter(a => !a.nameZh.includes("固定") && !a.nameZh.includes("累计折旧") && !a.nameZh.includes("长期")).reduce((s, a) => s + a.balance, 0);
  const currentLiabilities = balance.liabilities.filter(a => !a.nameZh.includes("长期")).reduce((s, a) => s + a.balance, 0);
  const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities).toFixed(2) : "N/A";

  const storeName = stores.find(s => s.id === selectedStore);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("financeMgmt.financialReports")}</h3>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" />{t("financeMgmt.exportExcel")}</Button>
          <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" />{t("financeMgmt.exportPDF")}</Button>
        </div>
      </div>


      <Tabs defaultValue="income" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="income">{t("financeMgmt.incomeStatement")}</TabsTrigger>
          <TabsTrigger value="balance">{t("financeMgmt.balanceSheet")}</TabsTrigger>
          <TabsTrigger value="cashflow">{t("financeMgmt.cashFlowStatement")}</TabsTrigger>
          <TabsTrigger value="analysis">{t("financeMgmt.businessAnalysis")}</TabsTrigger>
        </TabsList>

        {/* ===== Income Statement ===== */}
        <TabsContent value="income">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-semibold">
                {t("financeMgmt.incomeStatement")} (2026{isZh ? "年2月" : " Feb"})
                {selectedStore !== "all" && <span className="text-primary ml-2">— {isZh ? storeName?.nameZh : storeName?.nameEn}</span>}
              </h4>
              <span className="text-xs text-muted-foreground">{isZh ? "单位: 人民币元" : "Unit: CNY"}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4 bg-muted/30 rounded-lg p-2">
              {isZh 
                ? `📊 ${selectedStore === "all" ? "全部门店汇总数据" : storeName?.nameZh + "独立数据"}，来源于做账管理标签页的会计凭证。` 
                : `📊 ${selectedStore === "all" ? "All stores consolidated" : storeName?.nameEn + " standalone"} data from journal entries.`}
            </p>

            <div className="space-y-4">
              {income.sections.map((section) => (
                <div key={section.keyZh}>
                  <div className="flex justify-between py-2 bg-muted/30 px-3 rounded-lg mb-2">
                    <span className="font-medium text-sm">{isZh ? section.keyZh : section.keyEn}</span>
                    <span className="font-bold">{fmt(section.total)}</span>
                  </div>
                  {section.items.map((item) => (
                    <div key={item.zh} className="flex justify-between py-1.5 px-6 text-sm">
                      <span className="text-muted-foreground">{isZh ? item.zh : item.en}</span>
                      <span>{fmt(item.amount)}</span>
                    </div>
                  ))}
                </div>
              ))}

              <div className="border-t border-border pt-4 mt-4 space-y-2">
                <div className="flex justify-between py-2 bg-primary/10 px-3 rounded-lg">
                  <span className="font-bold">{isZh ? "毛利润" : "Gross Profit"}</span>
                  <span className="font-bold text-primary">{fmt(income.grossProfit)}</span>
                </div>
                <div className="flex justify-between py-2 bg-primary/5 px-3 rounded-lg">
                  <span className="font-semibold">{t("financeMgmt.operatingProfit")}</span>
                  <span className="font-semibold text-primary">{fmt(income.operatingProfit)}</span>
                </div>
                <div className="flex justify-between py-1.5 px-6 text-sm">
                  <span className="text-muted-foreground">{isZh ? "加: 营业外收入" : "Add: Non-operating Income"}</span>
                  <span className="text-success">{fmt(income.nonOpIncome)}</span>
                </div>
                <div className="flex justify-between py-1.5 px-6 text-sm">
                  <span className="text-muted-foreground">{isZh ? "减: 营业外支出" : "Less: Non-operating Expenses"}</span>
                  <span className="text-destructive">{fmt(income.nonOpExpense)}</span>
                </div>
                <div className="flex justify-between py-2 px-3 rounded-lg bg-muted/20">
                  <span className="font-semibold">{isZh ? "利润总额" : "Profit Before Tax"}</span>
                  <span className="font-semibold">{fmt(income.profitBeforeTax)}</span>
                </div>
                <div className="flex justify-between py-1.5 px-6 text-sm">
                  <span className="text-muted-foreground">{t("financeMgmt.incomeTax")}</span>
                  <span className="text-destructive">{fmt(income.incomeTax)}</span>
                </div>
                <div className="flex justify-between py-3 bg-success/10 px-3 rounded-lg mt-2">
                  <span className="font-bold text-lg">{t("financeMgmt.netProfitLabel")}</span>
                  <span className={`font-bold text-lg ${income.netProfit >= 0 ? "text-success" : "text-destructive"}`}>{fmt(income.netProfit)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* ===== Balance Sheet ===== */}
        <TabsContent value="balance">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
              {isZh 
                ? `📊 ${selectedStore === "all" ? "全部门店汇总" : storeName?.nameZh}科目余额，反映截至2026年2月15日的财务状况。`
                : `📊 ${selectedStore === "all" ? "All stores consolidated" : storeName?.nameEn} balances as of Feb 15, 2026.`}
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Assets */}
              <div className="glass-card rounded-xl p-5">
                <h4 className="font-semibold mb-4 text-success flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  {isZh ? "资产" : "Assets"}
                </h4>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium px-1 py-1 border-b border-border/30">{isZh ? "流动资产" : "Current Assets"}</div>
                  {balance.assets.filter(a => !a.nameZh.includes("固定") && !a.nameZh.includes("累计折旧") && !a.nameZh.includes("长期")).map((item) => (
                    <div key={item.nameZh} className="flex justify-between py-2 px-2 border-b border-border/30">
                      <span className="text-sm">{isZh ? item.nameZh : item.nameEn}</span>
                      <span className={`font-medium text-sm ${item.balance < 0 ? "text-muted-foreground" : "text-success"}`}>
                        {item.balance < 0 ? "-" : ""}¥{Math.abs(item.balance).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="text-xs text-muted-foreground font-medium px-1 py-1 border-b border-border/30 mt-2">{isZh ? "非流动资产" : "Non-current Assets"}</div>
                  {balance.assets.filter(a => a.nameZh.includes("固定") || a.nameZh.includes("累计折旧") || a.nameZh.includes("长期")).map((item) => (
                    <div key={item.nameZh} className="flex justify-between py-2 px-2 border-b border-border/30">
                      <span className="text-sm">{isZh ? item.nameZh : item.nameEn}</span>
                      <span className={`font-medium text-sm ${item.balance < 0 ? "text-muted-foreground" : "text-success"}`}>
                        {item.balance < 0 ? "-" : ""}¥{Math.abs(item.balance).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between py-3 bg-success/10 px-3 rounded-lg mt-3">
                  <span className="font-bold">{isZh ? "资产合计" : "Total Assets"}</span>
                  <span className="font-bold text-success">{fmt(balance.totalAssets)}</span>
                </div>
              </div>

              {/* Liabilities + Equity */}
              <div className="space-y-4">
                <div className="glass-card rounded-xl p-5">
                  <h4 className="font-semibold mb-4 text-warning flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-warning" />
                    {isZh ? "负债" : "Liabilities"}
                  </h4>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium px-1 py-1 border-b border-border/30">{isZh ? "流动负债" : "Current Liabilities"}</div>
                    {balance.liabilities.filter(a => !a.nameZh.includes("长期")).map((item) => (
                      <div key={item.nameZh} className="flex justify-between py-2 px-2 border-b border-border/30">
                        <span className="text-sm">{isZh ? item.nameZh : item.nameEn}</span>
                        <span className="font-medium text-sm text-warning">{fmt(item.balance)}</span>
                      </div>
                    ))}
                    <div className="text-xs text-muted-foreground font-medium px-1 py-1 border-b border-border/30 mt-2">{isZh ? "非流动负债" : "Non-current Liabilities"}</div>
                    {balance.liabilities.filter(a => a.nameZh.includes("长期")).map((item) => (
                      <div key={item.nameZh} className="flex justify-between py-2 px-2 border-b border-border/30">
                        <span className="text-sm">{isZh ? item.nameZh : item.nameEn}</span>
                        <span className="font-medium text-sm text-warning">{fmt(item.balance)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between py-2 bg-warning/10 px-3 rounded-lg mt-3">
                    <span className="font-semibold">{isZh ? "负债合计" : "Total Liabilities"}</span>
                    <span className="font-semibold text-warning">{fmt(balance.totalLiabilities)}</span>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-5">
                  <h4 className="font-semibold mb-4 text-primary flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    {isZh ? "所有者权益" : "Owner's Equity"}
                  </h4>
                  <div className="space-y-1">
                    {balance.equity.map((item) => (
                      <div key={item.nameZh} className="flex justify-between py-2 px-2 border-b border-border/30">
                        <span className="text-sm">{isZh ? item.nameZh : item.nameEn}</span>
                        <span className="font-medium text-sm text-primary">{fmt(item.balance)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between py-2 bg-primary/10 px-3 rounded-lg mt-3">
                    <span className="font-semibold">{isZh ? "权益合计" : "Total Equity"}</span>
                    <span className="font-semibold text-primary">{fmt(balance.totalEquity)}</span>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-4">
                  <div className="flex justify-between py-2">
                    <span className="font-bold">{isZh ? "负债+权益合计" : "Total L+E"}</span>
                    <span className="font-bold text-info">{fmt(balance.totalLiabilities + balance.totalEquity)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-xs">
                    <span className="text-muted-foreground">{isZh ? "平衡验证" : "Balance Check"}</span>
                    <span className={balance.totalAssets === balance.totalLiabilities + balance.totalEquity ? "text-success" : "text-destructive"}>
                      {balance.totalAssets === balance.totalLiabilities + balance.totalEquity ? "✓ " : "✗ "}
                      {isZh ? (balance.totalAssets === balance.totalLiabilities + balance.totalEquity ? "资产 = 负债 + 权益" : "不平衡!") 
                            : (balance.totalAssets === balance.totalLiabilities + balance.totalEquity ? "Assets = L + E" : "Imbalanced!")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* ===== Cash Flow Statement ===== */}
        <TabsContent value="cashflow">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
              {isZh 
                ? `📊 ${selectedStore === "all" ? "全部门店汇总" : storeName?.nameZh}现金流量表，按经营/投资/筹资三大活动分类汇总。`
                : `📊 ${selectedStore === "all" ? "All stores consolidated" : storeName?.nameEn} cash flow, classified by activities.`}
            </p>

            <div className="glass-card rounded-xl p-5">
              <h4 className="font-semibold mb-4">{isZh ? "现金流量汇总" : "Cash Flow Summary"}</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={cfBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                  <XAxis dataKey="name" stroke="hsl(220, 10%, 55%)" fontSize={11} />
                  <YAxis stroke="hsl(220, 10%, 55%)" fontSize={11} tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value: number) => fmt(value)}
                  />
                  <Bar dataKey="value" name={isZh ? "金额" : "Amount"} radius={[4, 4, 0, 0]}>
                    {cfBarData.map((entry, i) => (
                      <Cell key={i} fill={entry.value >= 0 ? "hsl(152, 60%, 45%)" : "hsl(0, 72%, 55%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Operating */}
              <div className="glass-card rounded-xl p-5">
                <h4 className="font-semibold mb-3 text-success flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  {isZh ? "一、经营活动现金流" : "I. Operating Activities"}
                </h4>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{isZh ? "现金流入" : "Cash Inflows"}</p>
                  {cashFlow.operating.inflows.map(item => (
                    <div key={item.zh} className="flex justify-between py-1 text-xs">
                      <span className="text-muted-foreground truncate max-w-[55%]">{isZh ? item.zh : item.en}</span>
                      <span className="text-success">{fmt(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 text-xs border-t border-border/30 mt-1">
                    <span className="font-medium">{isZh ? "流入小计" : "Subtotal"}</span>
                    <span className="font-medium text-success">{fmt(cashFlow.operating.totalInflow)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mt-2">{isZh ? "现金流出" : "Cash Outflows"}</p>
                  {cashFlow.operating.outflows.map(item => (
                    <div key={item.zh} className="flex justify-between py-1 text-xs">
                      <span className="text-muted-foreground truncate max-w-[55%]">{isZh ? item.zh : item.en}</span>
                      <span className="text-destructive">{fmt(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 text-xs border-t border-border/30 mt-1">
                    <span className="font-medium">{isZh ? "流出小计" : "Subtotal"}</span>
                    <span className="font-medium text-destructive">{fmt(cashFlow.operating.totalOutflow)}</span>
                  </div>
                </div>
                <div className="flex justify-between py-2 bg-success/10 px-2 rounded-lg mt-3 text-sm">
                  <span className="font-bold">{isZh ? "净额" : "Net"}</span>
                  <span className={`font-bold ${cashFlow.operating.net >= 0 ? "text-success" : "text-destructive"}`}>{fmtSigned(cashFlow.operating.net)}</span>
                </div>
              </div>

              {/* Investing */}
              <div className="glass-card rounded-xl p-5">
                <h4 className="font-semibold mb-3 text-primary flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  {isZh ? "二、投资活动现金流" : "II. Investing Activities"}
                </h4>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{isZh ? "现金流出" : "Cash Outflows"}</p>
                  {cashFlow.investing.items.map(item => (
                    <div key={item.zh} className="flex justify-between py-1 text-xs">
                      <span className="text-muted-foreground truncate max-w-[55%]">{isZh ? item.zh : item.en}</span>
                      <span className="text-destructive">{fmt(item.amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between py-2 bg-primary/10 px-2 rounded-lg mt-3 text-sm">
                  <span className="font-bold">{isZh ? "净额" : "Net"}</span>
                  <span className={`font-bold ${cashFlow.investing.net >= 0 ? "text-success" : "text-destructive"}`}>{fmtSigned(cashFlow.investing.net)}</span>
                </div>
              </div>

              {/* Financing */}
              <div className="glass-card rounded-xl p-5">
                <h4 className="font-semibold mb-3 text-info flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-info" />
                  {isZh ? "三、筹资活动现金流" : "III. Financing Activities"}
                </h4>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{isZh ? "现金流入" : "Cash Inflows"}</p>
                  {cashFlow.financing.inflows.map(item => (
                    <div key={item.zh} className="flex justify-between py-1 text-xs">
                      <span className="text-muted-foreground truncate max-w-[55%]">{isZh ? item.zh : item.en}</span>
                      <span className="text-success">{fmt(item.amount)}</span>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground font-medium mt-2">{isZh ? "现金流出" : "Cash Outflows"}</p>
                  {cashFlow.financing.outflows.map(item => (
                    <div key={item.zh} className="flex justify-between py-1 text-xs">
                      <span className="text-muted-foreground truncate max-w-[55%]">{isZh ? item.zh : item.en}</span>
                      <span className="text-destructive">{fmt(item.amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between py-2 bg-info/10 px-2 rounded-lg mt-3 text-sm">
                  <span className="font-bold">{isZh ? "净额" : "Net"}</span>
                  <span className={`font-bold ${cashFlow.financing.net >= 0 ? "text-success" : "text-destructive"}`}>{fmtSigned(cashFlow.financing.net)}</span>
                </div>
              </div>
            </div>

            {/* Cash Summary */}
            <div className="glass-card rounded-xl p-5">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">{isZh ? "期初现金余额" : "Opening Balance"}</p>
                  <p className="text-lg font-bold mt-1">{fmt(cashFlow.openingBalance)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isZh ? "本期现金净变动" : "Net Change"}</p>
                  <p className={`text-lg font-bold mt-1 ${cashFlow.netChange >= 0 ? "text-success" : "text-destructive"}`}>{fmtSigned(cashFlow.netChange)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isZh ? "期末现金余额" : "Closing Balance"}</p>
                  <p className="text-lg font-bold mt-1 text-primary">{fmt(cashFlow.closingBalance)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* ===== Business Analysis ===== */}
        <TabsContent value="analysis">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-card rounded-xl p-5">
                <h4 className="font-semibold mb-4">{isZh ? "成本费用构成（来自凭证）" : "Cost Breakdown (from entries)"}</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPie>
                    <Pie data={expenseData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      {expenseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => fmt(v)} />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2 max-h-[200px] overflow-y-auto">
                  {expenseData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground truncate max-w-[160px]">{item.name}</span>
                      </div>
                      <span className="font-medium">{fmt(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-xl p-5">
                <h4 className="font-semibold mb-4">{isZh ? "利润结构" : "Profit Structure"}</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex justify-between text-sm"><span>{isZh ? "营业收入" : "Revenue"}</span><span className="font-bold">{fmt(income.totalRevenue)}</span></div>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <div className="flex justify-between text-sm"><span>{isZh ? "毛利润" : "Gross Profit"}</span><span className="font-bold text-success">{fmt(income.grossProfit)}</span></div>
                    <p className="text-xs text-muted-foreground mt-1">{isZh ? "毛利率" : "Margin"}: {grossMargin}%</p>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <div className="flex justify-between text-sm"><span>{isZh ? "营业利润" : "Operating Profit"}</span><span className="font-bold text-primary">{fmt(income.operatingProfit)}</span></div>
                  </div>
                  <div className="p-3 bg-success/10 rounded-lg">
                    <div className="flex justify-between text-sm"><span>{isZh ? "净利润" : "Net Profit"}</span><span className="font-bold text-success">{fmt(income.netProfit)}</span></div>
                    <p className="text-xs text-muted-foreground mt-1">{isZh ? "净利率" : "Net Margin"}: {netMargin}%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5">
              <h4 className="font-semibold mb-4">{t("financeMgmt.keyMetrics")}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("financeMgmt.grossMargin")}</p>
                  <p className="text-xl font-bold text-success">{grossMargin}%</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("financeMgmt.netMargin")}</p>
                  <p className="text-xl font-bold text-primary">{netMargin}%</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("financeMgmt.debtRatio")}</p>
                  <p className="text-xl font-bold text-warning">{debtRatio}%</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("financeMgmt.currentRatio")}</p>
                  <p className="text-xl font-bold text-info">{currentRatio}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsTab;
