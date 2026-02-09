import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, Receipt, 
  PieChart, BarChart3, Download, Calendar, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell
} from "recharts";
import AppLayout from "@/components/AppLayout";
import { useStore } from "@/contexts/StoreContext";

const monthlyData = [
  { month: "1月", revenue: 580000, expense: 420000, profit: 160000 },
  { month: "2月", revenue: 620000, expense: 450000, profit: 170000 },
  { month: "3月", revenue: 750000, expense: 520000, profit: 230000 },
  { month: "4月", revenue: 680000, expense: 480000, profit: 200000 },
  { month: "5月", revenue: 820000, expense: 560000, profit: 260000 },
  { month: "6月", revenue: 890000, expense: 610000, profit: 280000 },
];

const expenseBreakdown = [
  { name: "食材采购", value: 45, amount: "¥274,500" },
  { name: "人工成本", value: 30, amount: "¥183,000" },
  { name: "租金水电", value: 15, amount: "¥91,500" },
  { name: "营销费用", value: 6, amount: "¥36,600" },
  { name: "其他", value: 4, amount: "¥24,400" },
];

const COLORS = ["hsl(36, 90%, 55%)", "hsl(24, 85%, 50%)", "hsl(152, 60%, 45%)", "hsl(210, 70%, 55%)", "hsl(220, 14%, 40%)"];

const recentTransactions = [
  { id: "T001", type: "income", desc: "门店营收 - 总店", amount: "+¥28,640", time: "今天 21:00" },
  { id: "T002", type: "income", desc: "门店营收 - 国贸分店", amount: "+¥35,280", time: "今天 21:00" },
  { id: "T003", type: "expense", desc: "食材采购 - 海鲜供应商", amount: "-¥15,800", time: "今天 14:30" },
  { id: "T004", type: "expense", desc: "员工工资 - 2月", amount: "-¥183,000", time: "今天 10:00" },
  { id: "T005", type: "income", desc: "门店营收 - 三里屯分店", amount: "+¥42,150", time: "昨天 22:00" },
];

const Finance = () => {
  const { currentStore } = useStore();
  
  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
  const totalExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0);
  const totalProfit = totalRevenue - totalExpense;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">财务管理</h1>
          <p className="text-sm text-muted-foreground mt-1">营收分析与财务报表</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            本月
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出报表
          </button>
        </div>
      </div>

      {/* KPI Cards */}
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
          <p className="text-xs text-muted-foreground">累计营收</p>
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
          <p className="text-xs text-muted-foreground">累计支出</p>
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
          <p className="text-xs text-muted-foreground">净利润</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-info" />
            </div>
          </div>
          <p className="text-2xl font-bold font-display">{((totalProfit / totalRevenue) * 100).toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">利润率</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue vs Expense Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="lg:col-span-2 glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">营收与支出趋势</h3>
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
              <Area type="monotone" dataKey="revenue" stroke="hsl(152, 60%, 45%)" strokeWidth={2} fill="url(#revenueGradient)" name="营收" />
              <Area type="monotone" dataKey="expense" stroke="hsl(0, 72%, 55%)" strokeWidth={2} fill="url(#expenseGradient)" name="支出" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Expense Breakdown */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">支出构成</h3>
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
                <span className="font-medium">{item.amount}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">最近交易</h3>
          <button className="text-xs text-primary hover:underline">查看全部</button>
        </div>
        <div className="space-y-3">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  tx.type === "income" ? "bg-success/10" : "bg-destructive/10"
                }`}>
                  <Receipt className={`w-4 h-4 ${tx.type === "income" ? "text-success" : "text-destructive"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">{tx.desc}</p>
                  <p className="text-[10px] text-muted-foreground">{tx.time}</p>
                </div>
              </div>
              <span className={`font-semibold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                {tx.amount}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Finance;
