import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area } from "recharts";
import AppLayout from "@/components/AppLayout";
import StoreIndicator from "@/components/StoreIndicator";
import { useStore } from "@/contexts/StoreContext";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Globe, TrendingUp, Star, Heart, Clock, MapPin } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(0, 70%, 55%)", "hsl(var(--accent))", "hsl(45, 90%, 50%)", "hsl(var(--secondary))"];

const CustomerAnalysis = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const { storeName } = useStore();

  const nationalityData = [
    { name: isZh ? "欧美客户" : "Western", value: 38 },
    { name: isZh ? "中国客户" : "Chinese", value: 40 },
    { name: isZh ? "日韩客户" : "Japanese/Korean", value: 12 },
    { name: isZh ? "其他国际" : "Other Intl", value: 10 },
  ];

  const ageData = [
    { age: "18-24", male: 12, female: 15 },
    { age: "25-34", male: 28, female: 32 },
    { age: "35-44", male: 22, female: 18 },
    { age: "45-54", male: 10, female: 8 },
    { age: "55+", male: 5, female: 4 },
  ];

  const spendingByNationality = [
    { group: isZh ? "欧美客户" : "Western", avgSpend: 386, avgItems: 4.2 },
    { group: isZh ? "中国客户" : "Chinese", avgSpend: 298, avgItems: 3.8 },
    { group: isZh ? "日韩客户" : "Japanese/Korean", avgSpend: 342, avgItems: 3.5 },
    { group: isZh ? "其他" : "Other", avgSpend: 265, avgItems: 3.2 },
  ];

  const timePreference = [
    { time: isZh ? "午餐" : "Lunch", foreign: 12, chinese: 20 },
    { time: isZh ? "下午茶" : "Afternoon", foreign: 15, chinese: 8 },
    { time: "Happy Hour", foreign: 40, chinese: 22 },
    { time: isZh ? "晚餐" : "Dinner", foreign: 50, chinese: 42 },
    { time: isZh ? "深夜(KTV/飞镖)" : "Late Night (KTV/Darts)", foreign: 45, chinese: 35 },
  ];

  const categoryPreference = [
    { category: "Tapas", foreign: 75, chinese: 72 },
    { category: isZh ? "鸡尾酒" : "Cocktails", foreign: 78, chinese: 55 },
    { category: "KTV", foreign: 60, chinese: 85 },
    { category: isZh ? "飞镖" : "Darts", foreign: 88, chinese: 45 },
    { category: isZh ? "啤酒" : "Beer", foreign: 82, chinese: 68 },
    { category: isZh ? "主菜" : "Mains", foreign: 55, chinese: 75 },
  ];

  const channelData = [
    { name: isZh ? "大众点评" : "Dianping", value: 28 },
    { name: isZh ? "小红书" : "Xiaohongshu", value: 22 },
    { name: "TripAdvisor", value: 18 },
    { name: "Instagram", value: 15 },
    { name: isZh ? "朋友推荐" : "Word of Mouth", value: 12 },
    { name: isZh ? "其他" : "Other", value: 5 },
  ];

  const satisfactionData = [
    { aspect: isZh ? "食物品质" : "Food Quality", score: 4.6 },
    { aspect: isZh ? "服务态度" : "Service", score: 4.3 },
    { aspect: isZh ? "环境氛围" : "Ambiance", score: 4.7 },
    { aspect: isZh ? "性价比" : "Value", score: 4.1 },
    { aspect: isZh ? "酒水品质" : "Drinks", score: 4.5 },
    { aspect: isZh ? "等候时间" : "Wait Time", score: 3.8 },
  ];

  const monthlyVisitors = [
    { month: isZh ? "9月" : "Sep", foreign: 1800, chinese: 1200 },
    { month: isZh ? "10月" : "Oct", foreign: 2100, chinese: 1400 },
    { month: isZh ? "11月" : "Nov", foreign: 1950, chinese: 1350 },
    { month: isZh ? "12月" : "Dec", foreign: 2400, chinese: 1600 },
    { month: isZh ? "1月" : "Jan", foreign: 2200, chinese: 1500 },
    { month: isZh ? "2月" : "Feb", foreign: 2600, chinese: 1750 },
  ];

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display">{t("customerAnalysis.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{storeName(isZh)} · {t("customerAnalysis.subtitle")}</p>
      </div>

      <StoreIndicator />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title={t("customerAnalysis.monthlyCustomers")} value="4,350" change="+18.2%" changeType="up" icon={Users} index={0} />
        <StatCard title={t("customerAnalysis.foreignRatio")} value="60%" change="+2.1%" changeType="up" icon={Globe} index={1} />
        <StatCard title={t("customerAnalysis.avgSpend")} value="¥328" change="+8.5%" changeType="up" icon={TrendingUp} index={2} />
        <StatCard title={t("customerAnalysis.satisfaction")} value="4.5/5" change="+0.2" changeType="up" icon={Star} index={3} />
      </div>

      {/* Nationality + Age/Gender */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("customerAnalysis.nationalityBreakdown")}</CardTitle>
              <CardDescription>{t("customerAnalysis.nationalityDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={nationalityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {nationalityData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {nationalityData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{d.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("customerAnalysis.ageGender")}</CardTitle>
              <CardDescription>{t("customerAnalysis.ageGenderDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ageData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="age" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" unit="%" />
                  <Tooltip />
                  <Bar dataKey="male" name={isZh ? "男性" : "Male"} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="female" name={isZh ? "女性" : "Female"} fill="hsl(0, 70%, 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Spending + Time Preference */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">{t("customerAnalysis.spendingAnalysis")}</CardTitle>
              </div>
              <CardDescription>{t("customerAnalysis.spendingDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {spendingByNationality.map((s) => (
                  <div key={s.group} className="flex items-center justify-between">
                    <span className="text-sm text-foreground w-24">{s.group}</span>
                    <div className="flex-1 mx-3">
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(s.avgSpend / 400) * 100}%` }} />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-foreground">¥{s.avgSpend}</span>
                      <span className="text-xs text-muted-foreground ml-2">{s.avgItems}{isZh ? "件" : " items"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">{t("customerAnalysis.timePreference")}</CardTitle>
              </div>
              <CardDescription>{t("customerAnalysis.timePreferenceDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={timePreference} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="foreign" name={isZh ? "外国客户" : "Foreign"} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="chinese" name={isZh ? "中国客户" : "Chinese"} fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Category Radar + Visitor Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">{t("customerAnalysis.categoryPreference")}</CardTitle>
              </div>
              <CardDescription>{t("customerAnalysis.categoryPreferenceDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={categoryPreference}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="category" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <PolarRadiusAxis fontSize={10} stroke="hsl(var(--muted-foreground))" />
                  <Radar name={isZh ? "外国客户" : "Foreign"} dataKey="foreign" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  <Radar name={isZh ? "中国客户" : "Chinese"} dataKey="chinese" stroke="hsl(0, 70%, 55%)" fill="hsl(0, 70%, 55%)" fillOpacity={0.2} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("customerAnalysis.visitorTrend")}</CardTitle>
              <CardDescription>{t("customerAnalysis.visitorTrendDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthlyVisitors}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Area type="monotone" dataKey="foreign" name={isZh ? "外国客户" : "Foreign"} fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Area type="monotone" dataKey="chinese" name={isZh ? "中国客户" : "Chinese"} fill="hsl(var(--accent) / 0.15)" stroke="hsl(var(--accent))" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Channel + Satisfaction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">{t("customerAnalysis.sourceChannel")}</CardTitle>
              </div>
              <CardDescription>{t("customerAnalysis.sourceChannelDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {channelData.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <span className="text-sm text-foreground w-24">{c.name}</span>
                    <div className="flex-1 mx-3">
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/80 rounded-full transition-all" style={{ width: `${(c.value / 30) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-foreground w-10 text-right">{c.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">{t("customerAnalysis.satisfactionScore")}</CardTitle>
              </div>
              <CardDescription>{t("customerAnalysis.satisfactionDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {satisfactionData.map((s) => (
                  <div key={s.aspect}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground">{s.aspect}</span>
                      <span className="font-semibold text-foreground">{s.score}</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${s.score >= 4.5 ? "bg-green-500" : s.score >= 4.0 ? "bg-primary" : "bg-yellow-500"}`}
                        style={{ width: `${(s.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {isZh
                    ? "💡 外国客户对酒水品质和环境氛围评价最高；中国客户更看重性价比和食物品质"
                    : "💡 Foreign guests rate drinks quality and ambiance highest; Chinese guests prioritize value and food quality"}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default CustomerAnalysis;
