import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import StatCard from "@/components/StatCard";
import { Eye, MousePointerClick, UserPlus, Repeat, Globe, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

const trafficSource = [
  { name: "organicSearch", value: 32 },
  { name: "socialMediaTraffic", value: 28 },
  { name: "directVisit", value: 18 },
  { name: "paidAds", value: 14 },
  { name: "referralLinks", value: 8 },
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
  { stage: "funnelVisit", count: 15990, percent: 100 },
  { stage: "funnelBrowseMenu", count: 9840, percent: 61.5 },
  { stage: "funnelAddToCart", count: 4230, percent: 26.5 },
  { stage: "funnelOrder", count: 2890, percent: 18.1 },
  { stage: "funnelRepeat", count: 1120, percent: 7.0 },
];

const TrafficAnalyticsTab = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title={t("marketingMgmt.todayVisitors")} value="15,990" change="+22.4%" changeType="up" icon={Eye} index={0} />
        <StatCard title={t("marketingMgmt.pageViews")} value="48,720" change="+15.8%" changeType="up" icon={MousePointerClick} index={1} />
        <StatCard title={t("marketingMgmt.newVisitorRate")} value="34.2%" change="+3.1%" changeType="up" icon={UserPlus} index={2} />
        <StatCard title={t("marketingMgmt.repeatPurchaseRate")} value="42.8%" change="+1.5%" changeType="up" icon={Repeat} index={3} />
      </div>

      {/* Traffic over time + sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("marketingMgmt.realtimeTraffic")}</CardTitle>
            <CardDescription>{t("marketingMgmt.realtimeTrafficDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={hourlyTraffic}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" fontSize={10} stroke="hsl(var(--muted-foreground))" interval={3} />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Area type="monotone" dataKey="pageViews" name={t("marketingMgmt.pageViews")} fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Area type="monotone" dataKey="visitors" name={t("marketingMgmt.visitorCount")} fill="hsl(var(--accent) / 0.15)" stroke="hsl(var(--accent))" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("marketingMgmt.trafficSources")}</CardTitle>
            <CardDescription>{t("marketingMgmt.trafficSourcesDesc")}</CardDescription>
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
                    <span className="text-muted-foreground">{t(`marketingMgmt.${s.name}`)}</span>
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
              <CardTitle className="text-base">{t("marketingMgmt.geoDistribution")}</CardTitle>
            </div>
            <CardDescription>{t("marketingMgmt.visitorCityTop")}</CardDescription>
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
            <CardTitle className="text-base">{t("marketingMgmt.conversionFunnel")}</CardTitle>
            <CardDescription>{t("marketingMgmt.conversionFunnelDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversionFunnel.map((f, i) => (
                <div key={f.stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground font-medium">{t(`marketingMgmt.${f.stage}`)}</span>
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
