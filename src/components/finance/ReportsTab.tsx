import { motion } from "framer-motion";
import { Download, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPie, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";

const monthlyData = [
  { month: "1月", revenue: 580000, expense: 420000, profit: 160000 },
  { month: "2月", revenue: 620000, expense: 450000, profit: 170000 },
  { month: "3月", revenue: 750000, expense: 520000, profit: 230000 },
  { month: "4月", revenue: 680000, expense: 480000, profit: 200000 },
  { month: "5月", revenue: 820000, expense: 560000, profit: 260000 },
  { month: "6月", revenue: 890000, expense: 610000, profit: 280000 },
];

const expenseBreakdown = [
  { name: "食材采购", value: 45, amount: 274500 },
  { name: "人工成本", value: 30, amount: 183000 },
  { name: "租金水电", value: 15, amount: 91500 },
  { name: "营销费用", value: 6, amount: 36600 },
  { name: "其他", value: 4, amount: 24400 },
];

const COLORS = ["hsl(36, 90%, 55%)", "hsl(24, 85%, 50%)", "hsl(152, 60%, 45%)", "hsl(210, 70%, 55%)", "hsl(220, 14%, 40%)"];

const incomeStatement = [
  { category: "operatingRevenue", items: [
    { name: "主营业务收入", amount: 4340000 },
    { name: "其他业务收入", amount: 85000 },
  ]},
  { category: "operatingCost", items: [
    { name: "主营业务成本", amount: 1956300 },
    { name: "税金及附加", amount: 43400 },
  ]},
  { category: "periodExpenses", items: [
    { name: "销售费用", amount: 217000 },
    { name: "管理费用", amount: 434000 },
    { name: "财务费用", amount: 21700 },
  ]},
];

const balanceSheet = {
  assets: [
    { name: "货币资金", amount: 2975000 },
    { name: "应收账款", amount: 180000 },
    { name: "存货", amount: 320000 },
    { name: "固定资产", amount: 1500000 },
    { name: "无形资产", amount: 200000 },
  ],
  liabilities: [
    { name: "应付账款", amount: 450000 },
    { name: "应付职工薪酬", amount: 183000 },
    { name: "应交税费", amount: 125000 },
    { name: "长期借款", amount: 800000 },
  ],
  equity: [
    { name: "实收资本", amount: 2000000 },
    { name: "资本公积", amount: 500000 },
    { name: "盈余公积", amount: 364600 },
    { name: "未分配利润", amount: 752400 },
  ],
};

const cashFlowData = [
  { month: "1月", operating: 180000, investing: -50000, financing: -20000 },
  { month: "2月", operating: 195000, investing: -30000, financing: -20000 },
  { month: "3月", operating: 260000, investing: -80000, financing: -20000 },
  { month: "4月", operating: 220000, investing: -40000, financing: -20000 },
  { month: "5月", operating: 290000, investing: -60000, financing: -50000 },
  { month: "6月", operating: 310000, investing: -45000, financing: -20000 },
];

const ReportsTab = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Report Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("financeMgmt.financialReports")}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            {t("financeMgmt.exportExcel")}
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            {t("financeMgmt.exportPDF")}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="income" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="income">{t("financeMgmt.incomeStatement")}</TabsTrigger>
          <TabsTrigger value="balance">{t("financeMgmt.balanceSheet")}</TabsTrigger>
          <TabsTrigger value="cashflow">{t("financeMgmt.cashFlowStatement")}</TabsTrigger>
          <TabsTrigger value="analysis">{t("financeMgmt.businessAnalysis")}</TabsTrigger>
        </TabsList>

        {/* Income Statement */}
        <TabsContent value="income">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">{t("financeMgmt.incomeStatement")} (2024年1-6月)</h4>
              <span className="text-xs text-muted-foreground">{t("financeMgmt.unitCNY")}</span>
            </div>
            <div className="space-y-4">
              {incomeStatement.map((section) => (
                <div key={section.category}>
                  <div className="flex justify-between py-2 bg-muted/30 px-3 rounded-lg mb-2">
                    <span className="font-medium">{t(`financeMgmt.${section.category}`)}</span>
                    <span className="font-bold">
                      ¥{section.items.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                    </span>
                  </div>
                  {section.items.map((item) => (
                    <div key={item.name} className="flex justify-between py-2 px-6 text-sm">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span>¥{item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="border-t border-border pt-4 mt-4">
                <div className="flex justify-between py-2 bg-primary/10 px-3 rounded-lg">
                  <span className="font-bold">{t("financeMgmt.operatingProfit")}</span>
                  <span className="font-bold text-primary">¥1,752,600</span>
                </div>
                <div className="flex justify-between py-2 px-3 text-sm">
                  <span className="text-muted-foreground">{t("financeMgmt.incomeTax")}</span>
                  <span>¥438,150</span>
                </div>
                <div className="flex justify-between py-3 bg-success/10 px-3 rounded-lg mt-2">
                  <span className="font-bold">{t("financeMgmt.netProfitLabel")}</span>
                  <span className="font-bold text-success">¥1,314,450</span>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Balance Sheet */}
        <TabsContent value="balance">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-5">
              <h4 className="font-semibold mb-4 text-success">{t("financeMgmt.assets")}</h4>
              <div className="space-y-2">
                {balanceSheet.assets.map((item) => (
                  <div key={item.name} className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-sm">{item.name}</span>
                    <span className="font-medium">¥{item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between py-3 bg-success/10 px-3 rounded-lg mt-2">
                  <span className="font-bold">{t("financeMgmt.totalAssetsLabel")}</span>
                  <span className="font-bold text-success">
                    ¥{balanceSheet.assets.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="glass-card rounded-xl p-5">
                <h4 className="font-semibold mb-4 text-warning">{t("financeMgmt.liabilities")}</h4>
                <div className="space-y-2">
                  {balanceSheet.liabilities.map((item) => (
                    <div key={item.name} className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-sm">{item.name}</span>
                      <span className="font-medium">¥{item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 bg-warning/10 px-3 rounded-lg mt-2">
                    <span className="font-semibold">{t("financeMgmt.totalLiabilitiesLabel")}</span>
                    <span className="font-semibold text-warning">
                      ¥{balanceSheet.liabilities.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-xl p-5">
                <h4 className="font-semibold mb-4 text-info">{t("financeMgmt.equity")}</h4>
                <div className="space-y-2">
                  {balanceSheet.equity.map((item) => (
                    <div key={item.name} className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-sm">{item.name}</span>
                      <span className="font-medium">¥{item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 bg-info/10 px-3 rounded-lg mt-2">
                    <span className="font-semibold">{t("financeMgmt.totalEquityLabel")}</span>
                    <span className="font-semibold text-info">
                      ¥{balanceSheet.equity.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Cash Flow Statement */}
        <TabsContent value="cashflow">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="glass-card rounded-xl p-5">
              <h4 className="font-semibold mb-4">{t("financeMgmt.cashFlowTrend")}</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                  <XAxis dataKey="month" stroke="hsl(220, 10%, 55%)" fontSize={11} />
                  <YAxis stroke="hsl(220, 10%, 55%)" fontSize={11} tickFormatter={(v) => `${v / 10000}万`} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(220, 18%, 12%)",
                      border: "1px solid hsl(220, 14%, 18%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => `¥${value.toLocaleString()}`}
                  />
                  <Bar dataKey="operating" name={t("financeMgmt.operatingCashFlow")} fill="hsl(152, 60%, 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="investing" name={t("financeMgmt.investingCashFlow")} fill="hsl(36, 90%, 55%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="financing" name={t("financeMgmt.financingCashFlow")} fill="hsl(210, 70%, 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-sm font-medium">{t("financeMgmt.operatingCashFlow")}</span>
                </div>
                <p className="text-2xl font-bold text-success">+¥1,455,000</p>
                <p className="text-xs text-muted-foreground mt-1">+15.8% YoY</p>
              </div>
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm font-medium">{t("financeMgmt.investingCashFlow")}</span>
                </div>
                <p className="text-2xl font-bold text-primary">-¥305,000</p>
                <p className="text-xs text-muted-foreground mt-1">设备采购及装修</p>
              </div>
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-info" />
                  <span className="text-sm font-medium">{t("financeMgmt.financingCashFlow")}</span>
                </div>
                <p className="text-2xl font-bold text-info">-¥150,000</p>
                <p className="text-xs text-muted-foreground mt-1">偿还贷款本息</p>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Business Analysis */}
        <TabsContent value="analysis">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-5">
              <h4 className="font-semibold mb-4">{t("financeMgmt.revenueExpenseTrend")}</h4>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(152, 60%, 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(152, 60%, 45%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                  <XAxis dataKey="month" stroke="hsl(220, 10%, 55%)" fontSize={11} />
                  <YAxis stroke="hsl(220, 10%, 55%)" fontSize={11} tickFormatter={(v) => `${v / 10000}万`} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(220, 18%, 12%)",
                      border: "1px solid hsl(220, 14%, 18%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => `¥${(value / 10000).toFixed(1)}万`}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(152, 60%, 45%)" strokeWidth={2} fill="url(#revenueGradient)" name={t("financeMgmt.revenue")} />
                  <Area type="monotone" dataKey="expense" stroke="hsl(0, 72%, 55%)" strokeWidth={2} fill="url(#expenseGradient)" name={t("financeMgmt.expense")} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card rounded-xl p-5">
              <h4 className="font-semibold mb-4">{t("financeMgmt.costBreakdown")}</h4>
              <ResponsiveContainer width="100%" height={160}>
                <RechartsPie>
                  <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {expenseBreakdown.map((_, index) => (
                      <Cell key={index} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px", fontSize: "12px" }} />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {expenseBreakdown.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium">¥{item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Ratios */}
            <div className="lg:col-span-2 glass-card rounded-xl p-5">
              <h4 className="font-semibold mb-4">{t("financeMgmt.keyMetrics")}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("financeMgmt.grossMargin")}</p>
                  <p className="text-xl font-bold text-success">54.9%</p>
                  <p className="text-xs text-success flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-3 h-3" />+2.3%
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("financeMgmt.netMargin")}</p>
                  <p className="text-xl font-bold text-primary">30.3%</p>
                  <p className="text-xs text-success flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-3 h-3" />+1.8%
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("financeMgmt.debtRatio")}</p>
                  <p className="text-xl font-bold text-warning">30.1%</p>
                  <p className="text-xs text-success flex items-center gap-1 mt-1">
                    <ArrowDownRight className="w-3 h-3" />-1.2%
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("financeMgmt.currentRatio")}</p>
                  <p className="text-xl font-bold text-info">4.58</p>
                  <p className="text-xs text-success flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-3 h-3" />+0.3
                  </p>
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
