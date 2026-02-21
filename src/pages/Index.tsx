import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  Wine,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import AppLayout from "@/components/AppLayout";
import StatCard from "@/components/StatCard";

const revenueData = [
  { time: "10:00", revenue: 2400 },
  { time: "11:00", revenue: 4200 },
  { time: "12:00", revenue: 8800 },
  { time: "13:00", revenue: 7200 },
  { time: "14:00", revenue: 3600 },
  { time: "15:00", revenue: 2800 },
  { time: "16:00", revenue: 3200 },
  { time: "17:00", revenue: 5800 },
  { time: "18:00", revenue: 9200 },
  { time: "19:00", revenue: 12400 },
  { time: "20:00", revenue: 11800 },
  { time: "21:00", revenue: 8600 },
];

const COLORS = ["hsl(36, 90%, 55%)", "hsl(24, 85%, 50%)", "hsl(152, 60%, 45%)", "hsl(210, 70%, 55%)"];

const topItems = [
  { nameZh: "招牌烤鱼", nameEn: "Signature Grilled Fish", orders: 86, revenue: "¥4,300" },
  { nameZh: "精酿啤酒", nameEn: "Craft Beer", orders: 124, revenue: "¥3,720" },
  { nameZh: "麻辣小龙虾", nameEn: "Spicy Crayfish", orders: 68, revenue: "¥5,440" },
  { nameZh: "鲜榨果汁", nameEn: "Fresh Juice", orders: 95, revenue: "¥1,900" },
  { nameZh: "水煮牛肉", nameEn: "Boiled Beef", orders: 52, revenue: "¥3,640" },
];

const pourCostData = [
  { nameZh: "啤酒", nameEn: "Beer", cost: 22, target: 25 },
  { nameZh: "白酒", nameEn: "Baijiu", cost: 18, target: 20 },
  { nameZh: "红酒", nameEn: "Wine", cost: 30, target: 28 },
  { nameZh: "鸡尾酒", nameEn: "Cocktail", cost: 15, target: 18 },
  { nameZh: "果汁", nameEn: "Juice", cost: 35, target: 30 },
];

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  const categoryData = [
    { name: t("dashboard.categories.hotDishes"), value: 42 },
    { name: t("dashboard.categories.drinks"), value: 28 },
    { name: t("dashboard.categories.coldDishes"), value: 15 },
    { name: t("dashboard.categories.staples"), value: 15 },
  ];

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("dashboard.dateFormat")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title={t("dashboard.todayRevenue")} value="¥28,640" change="+12.5%" changeType="up" icon={DollarSign} index={0} />
        <StatCard title={t("dashboard.orderCount")} value="186" change="+8.3%" changeType="up" icon={ShoppingCart} index={1} />
        <StatCard title={t("dashboard.footTraffic")} value="312" change="+5.2%" changeType="up" icon={Users} index={2} />
        <StatCard title={t("dashboard.pourCostRate")} value="3.2%" change="-0.5%" changeType="down" icon={Wine} index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">{t("dashboard.revenueTrend")}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(36, 90%, 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(36, 90%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="time" stroke="hsl(220, 10%, 55%)" fontSize={11} />
              <YAxis stroke="hsl(220, 10%, 55%)" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px", fontSize: "12px", color: "hsl(40, 20%, 92%)" }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(36, 90%, 55%)" strokeWidth={2} fillOpacity={1} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">{t("dashboard.categoryBreakdown")}</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                {categoryData.map((_, index) => (<Cell key={index} fill={COLORS[index]} />))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px", fontSize: "12px", color: "hsl(40, 20%, 92%)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {categoryData.map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-muted-foreground">{cat.name} {cat.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">{t("dashboard.hotItems")}</h3>
          <div className="space-y-3">
            {topItems.map((item, i) => (
              <div key={isZh ? item.nameZh : item.nameEn} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${i < 3 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                  <span className="text-sm">{isZh ? item.nameZh : item.nameEn}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold">{item.revenue}</span>
                  <span className="text-xs text-muted-foreground ml-2">{item.orders}{isZh ? '单' : ' orders'}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">{t("dashboard.beverageCostAnalysis")}</h3>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">BevSight</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pourCostData.map(d => ({ name: isZh ? d.nameZh : d.nameEn, cost: d.cost, target: d.target }))} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="name" stroke="hsl(220, 10%, 55%)" fontSize={11} />
              <YAxis stroke="hsl(220, 10%, 55%)" fontSize={11} unit="%" />
              <Tooltip contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px", fontSize: "12px", color: "hsl(40, 20%, 92%)" }} />
              <Bar dataKey="cost" fill="hsl(36, 90%, 55%)" radius={[4, 4, 0, 0]} name={t("dashboard.actualCost")} />
              <Bar dataKey="target" fill="hsl(220, 14%, 25%)" radius={[4, 4, 0, 0]} name={t("dashboard.targetCost")} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <AlertTriangle className="w-3 h-3 text-warning" />
            <span>{t("dashboard.costAlert")}</span>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
