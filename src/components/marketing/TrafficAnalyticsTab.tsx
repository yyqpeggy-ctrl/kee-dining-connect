import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList } from "recharts";
import StatCard from "@/components/StatCard";
import { Eye, MousePointerClick, UserPlus, Repeat, Globe, MapPin, MessageCircle, BookOpen, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

const trafficSource = [
  { name: "organicSearch", value: 22 },
  { name: "socialMediaTraffic", value: 18 },
  { name: "wechatTraffic", value: 20 },
  { name: "xiaohongshuTraffic", value: 15 },
  { name: "dianpingTraffic", value: 12 },
  { name: "directVisit", value: 7 },
  { name: "paidAds", value: 6 },
];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(330, 70%, 55%)",
  "hsl(142, 60%, 45%)",
  "hsl(0, 75%, 60%)",
  "hsl(30, 90%, 55%)",
  "hsl(var(--accent))",
  "hsl(45, 90%, 50%)",
];

const hourlyTraffic = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  visitors: Math.round(50 + Math.sin(((i - 6) * Math.PI) / 12) * 200 + Math.random() * 80),
  pageViews: Math.round(80 + Math.sin(((i - 6) * Math.PI) / 12) * 350 + Math.random() * 120),
}));

const cityData = [
  { cityZh: "上海", cityEn: "Shanghai", visitors: 4520, percent: "28.3%" },
  { cityZh: "北京", cityEn: "Beijing", visitors: 3180, percent: "19.9%" },
  { cityZh: "广州", cityEn: "Guangzhou", visitors: 2340, percent: "14.6%" },
  { cityZh: "深圳", cityEn: "Shenzhen", visitors: 1890, percent: "11.8%" },
  { cityZh: "杭州", cityEn: "Hangzhou", visitors: 1230, percent: "7.7%" },
  { cityZh: "成都", cityEn: "Chengdu", visitors: 980, percent: "6.1%" },
  { cityZh: "其他", cityEn: "Other", visitors: 1850, percent: "11.6%" },
];

const conversionFunnel = [
  { stage: "funnelVisit", count: 15990, percent: 100 },
  { stage: "funnelBrowseMenu", count: 9840, percent: 61.5 },
  { stage: "funnelAddToCart", count: 4230, percent: 26.5 },
  { stage: "funnelOrder", count: 2890, percent: 18.1 },
  { stage: "funnelRepeat", count: 1120, percent: 7.0 },
];

const platformFunnels = [
  {
    platformZh: "微信公众号", platformEn: "WeChat",
    icon: MessageCircle, color: "text-green-500", bgColor: "bg-green-500/10", barColor: "hsl(142, 60%, 45%)",
    steps: [
      { nameZh: "推文阅读", nameEn: "Article Read", count: 48000 },
      { nameZh: "点击链接", nameEn: "Link Click", count: 12600 },
      { nameZh: "浏览菜单", nameEn: "Browse Menu", count: 6800 },
      { nameZh: "领取优惠券", nameEn: "Claim Coupon", count: 3200 },
      { nameZh: "到店消费", nameEn: "In-store Visit", count: 1860 },
    ]
  },
  {
    platformZh: "小红书", platformEn: "Xiaohongshu",
    icon: BookOpen, color: "text-red-400", bgColor: "bg-red-400/10", barColor: "hsl(0, 75%, 60%)",
    steps: [
      { nameZh: "笔记曝光", nameEn: "Note Impression", count: 526000 },
      { nameZh: "笔记点击", nameEn: "Note Click", count: 68000 },
      { nameZh: "收藏/点赞", nameEn: "Save/Like", count: 28000 },
      { nameZh: "私信咨询", nameEn: "DM Inquiry", count: 4200 },
      { nameZh: "到店打卡", nameEn: "Check-in", count: 1240 },
    ]
  },
  {
    platformZh: "大众点评", platformEn: "Dianping",
    icon: Star, color: "text-orange-500", bgColor: "bg-orange-500/10", barColor: "hsl(30, 90%, 55%)",
    steps: [
      { nameZh: "店铺浏览", nameEn: "Store View", count: 86000 },
      { nameZh: "查看评价", nameEn: "Read Reviews", count: 42000 },
      { nameZh: "领取团购券", nameEn: "Claim Deal", count: 12800 },
      { nameZh: "电话/导航", nameEn: "Call/Navigate", count: 6400 },
      { nameZh: "到店核销", nameEn: "Redeem Visit", count: 3400 },
    ]
  },
];

const TrafficAnalyticsTab = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  const trafficSourceLabels: Record<string, string> = {
    organicSearch: isZh ? "自然搜索" : "Organic Search",
    socialMediaTraffic: isZh ? "海外社媒" : "Global Social",
    wechatTraffic: isZh ? "微信引流" : "WeChat",
    xiaohongshuTraffic: isZh ? "小红书引流" : "Xiaohongshu",
    dianpingTraffic: isZh ? "大众点评" : "Dianping",
    directVisit: isZh ? "直接访问" : "Direct Visit",
    paidAds: isZh ? "付费广告" : "Paid Ads",
  };

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
                <Pie data={trafficSource} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
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
                    <span className="text-muted-foreground">{trafficSourceLabels[s.name] || s.name}</span>
                  </div>
                  <span className="font-medium text-foreground">{s.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chinese Platform Conversion Funnels */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-4">{isZh ? "中国平台转化漏斗" : "Chinese Platform Conversion Funnels"}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {platformFunnels.map((pf) => {
            const Icon = pf.icon;
            const maxCount = pf.steps[0].count;
            return (
              <Card key={pf.platformEn}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${pf.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${pf.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{isZh ? pf.platformZh : pf.platformEn}</CardTitle>
                      <CardDescription className="text-xs">
                        {isZh ? "转化率" : "Conv. Rate"}: {((pf.steps[pf.steps.length - 1].count / pf.steps[0].count) * 100).toFixed(1)}%
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {pf.steps.map((step, i) => {
                    const pct = (step.count / maxCount) * 100;
                    const dropoff = i > 0 ? ((1 - step.count / pf.steps[i - 1].count) * 100).toFixed(0) : null;
                    return (
                      <div key={step.nameEn}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-foreground">{isZh ? step.nameZh : step.nameEn}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {step.count >= 10000 ? `${(step.count / 10000).toFixed(1)}万` : step.count.toLocaleString()}
                            </span>
                            {dropoff && (
                              <span className="text-destructive text-[10px]">-{dropoff}%</span>
                            )}
                          </div>
                        </div>
                        <div className="h-4 bg-muted rounded overflow-hidden">
                          <div
                            className="h-full rounded transition-all flex items-center justify-end pr-1.5"
                            style={{ width: `${Math.max(pct, 5)}%`, backgroundColor: pf.barColor }}
                          >
                            {pct > 20 && <span className="text-[9px] text-white font-medium">{pct.toFixed(0)}%</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* City distribution + Overall Funnel */}
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
                <div key={isZh ? c.cityZh : c.cityEn} className="flex items-center justify-between">
                  <span className="text-sm text-foreground w-16">{isZh ? c.cityZh : c.cityEn}</span>
                  <div className="flex-1 mx-3">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: c.percent }} />
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
                    <div className="h-full bg-primary/80 rounded transition-all flex items-center justify-end pr-2" style={{ width: `${f.percent}%` }}>
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
