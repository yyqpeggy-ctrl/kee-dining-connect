import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import StatCard from "@/components/StatCard";
import { Eye, MousePointerClick, UserPlus, Repeat, Globe, MapPin } from "lucide-react";

const trafficSource = [
  { name: "自然搜索", value: 32 },
  { name: "社交媒体", value: 28 },
  { name: "直接访问", value: 18 },
  { name: "付费广告", value: 14 },
  { name: "外部链接", value: 8 },
];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(0, 70%, 55%)",
  "hsl(var(--accent))",
  "hsl(45, 90%, 50%)",
  "hsl(var(--secondary))",
];

const hourlyTraffic = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  visitors: Math.round(50 + Math.sin(((i - 6) * Math.PI) / 12) * 200 + Math.random() * 80),
  pageViews: Math.round(80 + Math.sin(((i - 6) * Math.PI) / 12) * 350 + Math.random() * 120),
}));

const cityData = [
  { city: "上海", visitors: 4520, percent: "28.3%" },
  { city: "北京", visitors: 3180, percent: "19.9%" },
  { city: "广州", visitors: 2340, percent: "14.6%" },
  { city: "深圳", visitors: 1890, percent: "11.8%" },
  { city: "杭州", visitors: 1230, percent: "7.7%" },
  { city: "成都", visitors: 980, percent: "6.1%" },
  { city: "其他", visitors: 1850, percent: "11.6%" },
];

const conversionFunnel = [
  { stage: "访问", count: 15990, percent: 100 },
  { stage: "浏览菜单", count: 9840, percent: 61.5 },
  { stage: "加入购物车", count: 4230, percent: 26.5 },
  { stage: "下单", count: 2890, percent: 18.1 },
  { stage: "复购", count: 1120, percent: 7.0 },
];

const TrafficAnalyticsTab = () => {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="今日访客" value="15,990" change="+22.4%" changeType="up" icon={Eye} index={0} />
        <StatCard title="页面浏览量" value="48,720" change="+15.8%" changeType="up" icon={MousePointerClick} index={1} />
        <StatCard title="新客比例" value="34.2%" change="+3.1%" changeType="up" icon={UserPlus} index={2} />
        <StatCard title="复购率" value="42.8%" change="+1.5%" changeType="up" icon={Repeat} index={3} />
      </div>

      {/* Traffic over time + sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">实时流量</CardTitle>
            <CardDescription>今日24小时访客与浏览量趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={hourlyTraffic}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" fontSize={10} stroke="hsl(var(--muted-foreground))" interval={3} />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Area type="monotone" dataKey="pageViews" name="浏览量" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Area type="monotone" dataKey="visitors" name="访客数" fill="hsl(var(--accent) / 0.15)" stroke="hsl(var(--accent))" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">流量来源</CardTitle>
            <CardDescription>各渠道占比分布</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={trafficSource} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                  {trafficSource.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {trafficSource.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-muted-foreground">{s.name}</span>
                  </div>
                  <span className="font-medium text-foreground">{s.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* City distribution + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">地域分布</CardTitle>
            </div>
            <CardDescription>访客城市 TOP 7</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cityData.map((c) => (
                <div key={c.city} className="flex items-center justify-between">
                  <span className="text-sm text-foreground w-12">{c.city}</span>
                  <div className="flex-1 mx-3">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: c.percent }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right">{c.visitors.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">转化漏斗</CardTitle>
            <CardDescription>用户从访问到复购的全链路转化</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversionFunnel.map((f, i) => (
                <div key={f.stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground font-medium">{f.stage}</span>
                    <span className="text-muted-foreground">{f.count.toLocaleString()} ({f.percent}%)</span>
                  </div>
                  <div className="h-6 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-primary/80 rounded transition-all flex items-center justify-end pr-2"
                      style={{ width: `${f.percent}%` }}
                    >
                      {f.percent > 15 && <span className="text-[10px] text-primary-foreground font-medium">{f.percent}%</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrafficAnalyticsTab;
