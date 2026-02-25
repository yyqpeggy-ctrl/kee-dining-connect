import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useStore } from "@/contexts/StoreContext";
import { computeIncomeStatement, StoreId } from "@/data/financeData";
import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, LineChart, Line } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, PieChart, BarChart3, ArrowUpRight, ArrowDownRight, Wallet, Download } from "lucide-react";

interface BudgetItem {
  categoryZh: string;
  categoryEn: string;
  budget: number;
  actual: number;
  lastYear: number;
  trend: "up" | "down" | "stable";
}

const storeBudgetMultiplier: Record<string, number> = {
  all: 1, flagship: 0.35, french: 0.25, jingan: 0.22, xintiandi: 0.18,
};

const BudgetTab = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const { storeId, isHQ, storeName } = useStore();
  const [viewMode, setViewMode] = useState<"overview" | "detail">("overview");
  const mult = storeBudgetMultiplier[storeId] || 1;

  const income = useMemo(() => computeIncomeStatement(storeId as StoreId), [storeId]);

  const budgetData: BudgetItem[] = useMemo(() => [
    { categoryZh: "营业收入", categoryEn: "Operating Revenue", budget: Math.round(520000 * mult), actual: income.totalRevenue, lastYear: Math.round(480000 * mult), trend: "up" },
    { categoryZh: "食材成本", categoryEn: "Ingredient Cost", budget: Math.round(145000 * mult), actual: Math.round(128000 * mult * 0.92), lastYear: Math.round(138000 * mult), trend: "down" },
    { categoryZh: "酒水成本", categoryEn: "Beverage Cost", budget: Math.round(65000 * mult), actual: Math.round(58000 * mult * 1.05), lastYear: Math.round(60000 * mult), trend: "up" },
    { categoryZh: "人工成本", categoryEn: "Labor Cost", budget: Math.round(180000 * mult), actual: Math.round(183000 * mult * 0.98), lastYear: Math.round(165000 * mult), trend: "up" },
    { categoryZh: "租金及物业", categoryEn: "Rent & Property", budget: Math.round(110000 * mult), actual: Math.round(108000 * mult), lastYear: Math.round(105000 * mult), trend: "stable" },
    { categoryZh: "水电能耗", categoryEn: "Utilities", budget: Math.round(18000 * mult), actual: Math.round(12500 * mult), lastYear: Math.round(15000 * mult), trend: "down" },
    { categoryZh: "营销推广", categoryEn: "Marketing", budget: Math.round(25000 * mult), actual: Math.round(16800 * mult), lastYear: Math.round(20000 * mult), trend: "down" },
    { categoryZh: "设备折旧", categoryEn: "Depreciation", budget: Math.round(15000 * mult), actual: Math.round(10500 * mult), lastYear: Math.round(14000 * mult), trend: "stable" },
    { categoryZh: "行政杂费", categoryEn: "Admin & Misc", budget: Math.round(12000 * mult), actual: Math.round(8900 * mult * 1.1), lastYear: Math.round(10000 * mult), trend: "up" },
    { categoryZh: "税金附加", categoryEn: "Tax & Surcharges", budget: Math.round(30000 * mult), actual: Math.round(28000 * mult), lastYear: Math.round(25000 * mult), trend: "stable" },
  ], [mult, income.totalRevenue]);

  const totalBudget = budgetData.reduce((s, d) => s + d.budget, 0);
  const totalActual = budgetData.reduce((s, d) => s + d.actual, 0);
  const overBudgetItems = budgetData.filter(d => d.actual > d.budget);
  const underBudgetItems = budgetData.filter(d => d.actual <= d.budget);
  const budgetUtilization = totalBudget > 0 ? ((totalActual / totalBudget) * 100) : 0;

  const monthlyTrend = useMemo(() => {
    const months = ["10月", "11月", "12月", "1月", "2月"];
    const monthsEn = ["Oct", "Nov", "Dec", "Jan", "Feb"];
    return months.map((m, i) => ({
      month: isZh ? m : monthsEn[i],
      budget: Math.round(totalBudget * (0.9 + Math.random() * 0.2)),
      actual: Math.round(totalActual * (0.85 + Math.random() * 0.3)),
    }));
  }, [totalBudget, totalActual, isZh]);

  const varianceChartData = budgetData.slice(0, 7).map(d => ({
    name: isZh ? d.categoryZh : d.categoryEn,
    budget: d.budget,
    actual: d.actual,
    variance: d.actual - d.budget,
  }));

  const fmt = (n: number) => `¥${(n / 10000).toFixed(1)}万`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{isZh ? "预算管理" : "Budget Management"}</h3>
        <div className="flex gap-2">
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">{isZh ? "概览" : "Overview"}</SelectItem>
              <SelectItem value="detail">{isZh ? "明细" : "Detail"}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" />{isZh ? "导出" : "Export"}</Button>
        </div>
      </div>

      {/* Store context */}
      <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
        {isZh
          ? `📊 当前: ${isHQ ? "全部门店汇总" : storeName(true)}，2026年2月预算执行情况`
          : `📊 Current: ${isHQ ? "All stores consolidated" : storeName(false)}, Feb 2026 budget execution`}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            icon: Target, label: isZh ? "预算总额" : "Total Budget",
            value: fmt(totalBudget), color: "bg-primary/10 text-primary",
            sub: isZh ? "月度预算" : "Monthly budget",
          },
          {
            icon: Wallet, label: isZh ? "实际支出/收入" : "Actual Spend",
            value: fmt(totalActual), color: "bg-info/10 text-info",
            sub: `${budgetUtilization.toFixed(1)}% ${isZh ? "执行率" : "utilization"}`,
          },
          {
            icon: overBudgetItems.length > 0 ? AlertTriangle : CheckCircle,
            label: isZh ? "超预算项目" : "Over Budget Items",
            value: `${overBudgetItems.length}`,
            color: overBudgetItems.length > 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success",
            sub: overBudgetItems.length > 0
              ? `${isZh ? "需关注" : "Needs attention"}: ${isZh ? overBudgetItems[0]?.categoryZh : overBudgetItems[0]?.categoryEn}`
              : (isZh ? "全部在预算内" : "All within budget"),
          },
          {
            icon: TrendingUp, label: isZh ? "同比变化" : "YoY Change",
            value: `+${((totalActual / budgetData.reduce((s, d) => s + d.lastYear, 0) - 1) * 100).toFixed(1)}%`,
            color: "bg-warning/10 text-warning",
            sub: isZh ? "对比去年同期" : "vs. same period last year",
          },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
            <p className="text-xl font-bold font-display">{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Budget vs Actual Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            {isZh ? "预算 vs 实际对比" : "Budget vs Actual Comparison"}
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={varianceChartData} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="name" stroke="hsl(220, 10%, 55%)" fontSize={10} angle={-20} textAnchor="end" height={50} />
              <YAxis stroke="hsl(220, 10%, 55%)" fontSize={10} tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} />
              <Tooltip
                contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px", fontSize: "11px" }}
                formatter={(value: number) => `¥${value.toLocaleString()}`}
              />
              <Legend fontSize={11} />
              <Bar dataKey="budget" name={isZh ? "预算" : "Budget"} fill="hsl(220, 70%, 55%)" radius={[4, 4, 0, 0]} opacity={0.6} />
              <Bar dataKey="actual" name={isZh ? "实际" : "Actual"} radius={[4, 4, 0, 0]}>
                {varianceChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.variance > 0 ? "hsl(0, 72%, 55%)" : "hsl(152, 60%, 45%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Monthly Trend */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            {isZh ? "月度预算执行趋势" : "Monthly Budget Execution Trend"}
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="month" stroke="hsl(220, 10%, 55%)" fontSize={11} />
              <YAxis stroke="hsl(220, 10%, 55%)" fontSize={10} tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} />
              <Tooltip
                contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px", fontSize: "11px" }}
                formatter={(value: number) => `¥${value.toLocaleString()}`}
              />
              <Legend fontSize={11} />
              <Line type="monotone" dataKey="budget" name={isZh ? "预算" : "Budget"} stroke="hsl(220, 70%, 55%)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="actual" name={isZh ? "实际" : "Actual"} stroke="hsl(36, 90%, 55%)" strokeWidth={2} dot={{ fill: "hsl(36, 90%, 55%)", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Budget Detail Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-5">
        <h4 className="text-sm font-semibold mb-4">{isZh ? "预算执行明细" : "Budget Execution Detail"}</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isZh ? "科目" : "Category"}</TableHead>
              <TableHead className="text-right">{isZh ? "预算" : "Budget"}</TableHead>
              <TableHead className="text-right">{isZh ? "实际" : "Actual"}</TableHead>
              <TableHead className="text-right">{isZh ? "差异" : "Variance"}</TableHead>
              <TableHead className="text-right">{isZh ? "执行率" : "Rate"}</TableHead>
              <TableHead className="text-center">{isZh ? "执行进度" : "Progress"}</TableHead>
              <TableHead>{isZh ? "同比" : "YoY"}</TableHead>
              <TableHead>{isZh ? "状态" : "Status"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {budgetData.map((item) => {
              const variance = item.actual - item.budget;
              const rate = item.budget > 0 ? (item.actual / item.budget * 100) : 0;
              const yoyChange = item.lastYear > 0 ? ((item.actual / item.lastYear - 1) * 100) : 0;
              const isOver = variance > 0 && item.categoryZh !== "营业收入";
              const isRevenueBelow = item.categoryZh === "营业收入" && variance < 0;

              return (
                <TableRow key={item.categoryZh}>
                  <TableCell className="font-medium text-sm">{isZh ? item.categoryZh : item.categoryEn}</TableCell>
                  <TableCell className="text-right text-sm">¥{item.budget.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-sm font-medium">¥{item.actual.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <span className={`text-sm font-medium ${(isOver || isRevenueBelow) ? "text-destructive" : "text-success"}`}>
                      {variance >= 0 ? "+" : ""}¥{variance.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm">{rate.toFixed(1)}%</TableCell>
                  <TableCell className="w-32">
                    <Progress value={Math.min(rate, 150)} className="h-2" />
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs flex items-center gap-0.5 ${yoyChange > 0 ? "text-destructive" : "text-success"}`}>
                      {yoyChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(yoyChange).toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={(isOver || isRevenueBelow) ? "destructive" : "secondary"} className="text-[10px]">
                      {(isOver || isRevenueBelow) 
                        ? (isZh ? "超预算" : "Over") 
                        : (isZh ? "正常" : "OK")}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="bg-muted/30 font-bold">
              <TableCell>{isZh ? "合计" : "Total"}</TableCell>
              <TableCell className="text-right">¥{totalBudget.toLocaleString()}</TableCell>
              <TableCell className="text-right">¥{totalActual.toLocaleString()}</TableCell>
              <TableCell className="text-right">
                <span className={totalActual > totalBudget ? "text-destructive" : "text-success"}>
                  {totalActual - totalBudget >= 0 ? "+" : ""}¥{(totalActual - totalBudget).toLocaleString()}
                </span>
              </TableCell>
              <TableCell className="text-right">{budgetUtilization.toFixed(1)}%</TableCell>
              <TableCell />
              <TableCell />
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </motion.div>

      {/* Budget Alerts */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          {isZh ? "智能预算预警" : "Smart Budget Alerts"}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {overBudgetItems.map((item) => (
            <div key={item.categoryZh} className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <TrendingUp className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">
                  {isZh ? `${item.categoryZh} 超预算 ¥${(item.actual - item.budget).toLocaleString()}` : `${item.categoryEn} over budget by ¥${(item.actual - item.budget).toLocaleString()}`}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {isZh ? `执行率 ${(item.actual / item.budget * 100).toFixed(1)}%，建议下月调整预算或控制支出` : `${(item.actual / item.budget * 100).toFixed(1)}% utilization, recommend adjusting next month`}
                </p>
              </div>
            </div>
          ))}
          {underBudgetItems.filter(d => d.categoryZh !== "营业收入" && d.actual / d.budget < 0.7).map((item) => (
            <div key={item.categoryZh} className="flex items-start gap-3 p-3 bg-info/10 rounded-lg border border-info/20">
              <TrendingDown className="w-4 h-4 text-info mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">
                  {isZh ? `${item.categoryZh} 执行率偏低 ${(item.actual / item.budget * 100).toFixed(0)}%` : `${item.categoryEn} low utilization ${(item.actual / item.budget * 100).toFixed(0)}%`}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {isZh ? "预算可能偏高，建议下季度优化" : "Budget may be too high, consider optimizing next quarter"}
                </p>
              </div>
            </div>
          ))}
          {overBudgetItems.length === 0 && (
            <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
              <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">{isZh ? "所有科目均在预算范围内" : "All categories within budget"}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{isZh ? "财务健康运行" : "Healthy financial operation"}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BudgetTab;
