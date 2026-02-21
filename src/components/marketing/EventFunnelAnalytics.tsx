import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell, PieChart, Pie, Legend } from "recharts";
import { ArrowRight, TrendingUp, Eye, MousePointer, UserCheck, MapPin } from "lucide-react";

interface PlatformFunnelData {
  platform: string;
  platformZh: string;
  impressions: number;
  clicks: number;
  signups: number;
  attendees: number;
}

// Mock funnel data per platform per event
const funnelDataByEvent: Record<string, PlatformFunnelData[]> = {
  "1": [ // 飞镖大赛
    { platform: "Huodongxing", platformZh: "活动行", impressions: 12500, clicks: 1800, signups: 42, attendees: 38 },
    { platform: "Cumen", platformZh: "粗门", impressions: 8200, clicks: 1200, signups: 28, attendees: 24 },
    { platform: "WeChat", platformZh: "微信公众号", impressions: 15600, clicks: 2100, signups: 35, attendees: 30 },
    { platform: "Douyin", platformZh: "抖音", impressions: 32000, clicks: 4500, signups: 12, attendees: 8 },
  ],
  "2": [ // 生日派对
    { platform: "WeChat", platformZh: "微信公众号", impressions: 8500, clicks: 1200, signups: 35, attendees: 35 },
    { platform: "Xiaohongshu", platformZh: "小红书", impressions: 6200, clicks: 800, signups: 15, attendees: 12 },
  ],
  "3": [ // HHH跑步
    { platform: "Huodongxing", platformZh: "活动行", impressions: 25000, clicks: 3800, signups: 55, attendees: 48 },
    { platform: "Cumen", platformZh: "粗门", impressions: 18000, clicks: 2600, signups: 38, attendees: 32 },
    { platform: "Keep", platformZh: "Keep", impressions: 45000, clicks: 6200, signups: 22, attendees: 18 },
    { platform: "WeChat", platformZh: "微信公众号", impressions: 12000, clicks: 1800, signups: 15, attendees: 12 },
  ],
  "4": [ // 集市
    { platform: "Huodongxing", platformZh: "活动行", impressions: 35000, clicks: 5200, signups: 120, attendees: 95 },
    { platform: "Douyin", platformZh: "抖音", impressions: 85000, clicks: 12000, signups: 65, attendees: 42 },
    { platform: "Dianping", platformZh: "大众点评", impressions: 22000, clicks: 3800, signups: 45, attendees: 38 },
    { platform: "WeChat", platformZh: "微信公众号", impressions: 18000, clicks: 2500, signups: 30, attendees: 25 },
  ],
  "5": [ // AI集市
    { platform: "Huodongxing", platformZh: "活动行", impressions: 15000, clicks: 2200, signups: 30, attendees: 0 },
    { platform: "WeChat", platformZh: "微信公众号", impressions: 12000, clicks: 1800, signups: 25, attendees: 0 },
    { platform: "Douyin", platformZh: "抖音", impressions: 28000, clicks: 3500, signups: 8, attendees: 0 },
  ],
  "6": [ // 周年庆
    { platform: "Huodongxing", platformZh: "活动行", impressions: 28000, clicks: 4200, signups: 45, attendees: 0 },
    { platform: "Cumen", platformZh: "粗门", impressions: 15000, clicks: 2800, signups: 22, attendees: 0 },
    { platform: "Douyin", platformZh: "抖音", impressions: 65000, clicks: 9500, signups: 32, attendees: 0 },
    { platform: "WeChat", platformZh: "微信公众号", impressions: 22000, clicks: 3200, signups: 18, attendees: 0 },
    { platform: "Dianping", platformZh: "大众点评", impressions: 18000, clicks: 2500, signups: 12, attendees: 0 },
  ],
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 220 70% 50%))",
  "hsl(var(--chart-3, 280 65% 60%))",
  "hsl(var(--chart-4, 30 80% 55%))",
  "hsl(var(--chart-5, 160 60% 45%))",
];

interface EventOption {
  id: string;
  nameZh: string;
  nameEn: string;
}

interface EventFunnelAnalyticsProps {
  events: EventOption[];
}

const EventFunnelAnalytics = ({ events }: EventFunnelAnalyticsProps) => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const [selectedEventId, setSelectedEventId] = useState<string>("all");

  // Aggregate data
  const aggregatedData = useMemo(() => {
    const eventIds = selectedEventId === "all" ? Object.keys(funnelDataByEvent) : [selectedEventId];
    const allPlatforms: Record<string, PlatformFunnelData> = {};

    eventIds.forEach(eid => {
      (funnelDataByEvent[eid] || []).forEach(p => {
        if (!allPlatforms[p.platform]) {
          allPlatforms[p.platform] = { ...p, impressions: 0, clicks: 0, signups: 0, attendees: 0 };
        }
        allPlatforms[p.platform].impressions += p.impressions;
        allPlatforms[p.platform].clicks += p.clicks;
        allPlatforms[p.platform].signups += p.signups;
        allPlatforms[p.platform].attendees += p.attendees;
      });
    });

    return Object.values(allPlatforms);
  }, [selectedEventId]);

  const totals = useMemo(() => {
    return aggregatedData.reduce(
      (acc, p) => ({
        impressions: acc.impressions + p.impressions,
        clicks: acc.clicks + p.clicks,
        signups: acc.signups + p.signups,
        attendees: acc.attendees + p.attendees,
      }),
      { impressions: 0, clicks: 0, signups: 0, attendees: 0 }
    );
  }, [aggregatedData]);

  const funnelSteps = useMemo(() => [
    { name: isZh ? "曝光" : "Impressions", nameKey: "impressions", value: totals.impressions, icon: Eye },
    { name: isZh ? "点击" : "Clicks", nameKey: "clicks", value: totals.clicks, icon: MousePointer },
    { name: isZh ? "报名" : "Signups", nameKey: "signups", value: totals.signups, icon: UserCheck },
    { name: isZh ? "到场" : "Attendees", nameKey: "attendees", value: totals.attendees, icon: MapPin },
  ], [totals, isZh]);

  const conversionRates = useMemo(() => ({
    clickRate: totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(1) : "0",
    signupRate: totals.clicks > 0 ? ((totals.signups / totals.clicks) * 100).toFixed(1) : "0",
    attendRate: totals.signups > 0 ? ((totals.attendees / totals.signups) * 100).toFixed(1) : "0",
    overallRate: totals.impressions > 0 ? ((totals.attendees / totals.impressions) * 100).toFixed(2) : "0",
  }), [totals]);

  // Bar chart data per platform
  const barChartData = useMemo(() => {
    return aggregatedData.map(p => ({
      platform: isZh ? p.platformZh : p.platform,
      [isZh ? "曝光" : "Impressions"]: p.impressions,
      [isZh ? "点击" : "Clicks"]: p.clicks,
      [isZh ? "报名" : "Signups"]: p.signups,
      [isZh ? "到场" : "Attendees"]: p.attendees,
    }));
  }, [aggregatedData, isZh]);

  // Pie chart for signup source distribution
  const pieData = useMemo(() => {
    return aggregatedData.map(p => ({
      name: isZh ? p.platformZh : p.platform,
      value: p.signups,
    })).filter(d => d.value > 0);
  }, [aggregatedData, isZh]);

  return (
    <div className="space-y-4">
      {/* Event selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-primary" />
          {isZh ? "推广转化漏斗分析" : "Promotion Conversion Funnel"}
        </h3>
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isZh ? "全部活动汇总" : "All Events"}</SelectItem>
            {events.map(e => (
              <SelectItem key={e.id} value={e.id}>{isZh ? e.nameZh : e.nameEn}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Funnel Steps */}
      <div className="grid grid-cols-4 gap-3">
        {funnelSteps.map((step, i) => {
          const IconComp = step.icon;
          const prevValue = i > 0 ? funnelSteps[i - 1].value : null;
          const dropRate = prevValue && prevValue > 0 ? ((1 - step.value / prevValue) * 100).toFixed(1) : null;
          return (
            <div key={step.nameKey} className="relative">
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-1">
                    <IconComp className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">{step.name}</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{step.value.toLocaleString()}</p>
                  {dropRate !== null && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {isZh ? "流失" : "Drop"}: {dropRate}%
                    </p>
                  )}
                </CardContent>
              </Card>
              {i < funnelSteps.length - 1 && (
                <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Conversion Rate Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { labelZh: "点击率 (CTR)", labelEn: "Click Rate (CTR)", value: `${conversionRates.clickRate}%` },
          { labelZh: "报名转化率", labelEn: "Signup Rate", value: `${conversionRates.signupRate}%` },
          { labelZh: "到场率", labelEn: "Attendance Rate", value: `${conversionRates.attendRate}%` },
          { labelZh: "整体转化率", labelEn: "Overall Conversion", value: `${conversionRates.overallRate}%` },
        ].map((item, i) => (
          <Card key={i}>
            <CardContent className="pt-3 pb-2 px-4 text-center">
              <p className="text-[10px] text-muted-foreground">{isZh ? item.labelZh : item.labelEn}</p>
              <p className="text-lg font-bold text-primary">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Visual Funnel Bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isZh ? "转化漏斗" : "Conversion Funnel"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {funnelSteps.map((step, i) => {
              const widthPercent = totals.impressions > 0 ? Math.max((step.value / totals.impressions) * 100, 3) : 0;
              const barColors = ["bg-primary", "bg-primary/75", "bg-primary/50", "bg-primary/30"];
              return (
                <div key={step.nameKey} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{step.name}</span>
                  <div className="flex-1 h-8 bg-muted/50 rounded-md overflow-hidden relative">
                    <div
                      className={`h-full ${barColors[i]} rounded-md transition-all duration-500 flex items-center px-2`}
                      style={{ width: `${widthPercent}%` }}
                    >
                      <span className="text-[10px] font-medium text-primary-foreground whitespace-nowrap">
                        {step.value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {i > 0 && (
                    <span className="text-[10px] text-muted-foreground w-12 shrink-0">
                      {totals.impressions > 0 ? ((step.value / funnelSteps[i - 1].value) * 100).toFixed(1) : 0}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Platform Comparison Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isZh ? "各平台数据对比" : "Platform Comparison"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barChartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="platform" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  labelStyle={{ fontWeight: 600, color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey={isZh ? "报名" : "Signups"} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey={isZh ? "到场" : "Attendees"} fill="hsl(var(--primary) / 0.5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isZh ? "报名来源分布" : "Signup Source Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Per-platform conversion table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isZh ? "各平台转化率明细" : "Platform Conversion Details"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">{isZh ? "平台" : "Platform"}</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">{isZh ? "曝光" : "Impressions"}</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">{isZh ? "点击" : "Clicks"}</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">CTR</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">{isZh ? "报名" : "Signups"}</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">{isZh ? "报名率" : "Signup %"}</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">{isZh ? "到场" : "Attend"}</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">{isZh ? "到场率" : "Attend %"}</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedData.map((p, i) => {
                  const ctr = p.impressions > 0 ? ((p.clicks / p.impressions) * 100).toFixed(1) : "0";
                  const sr = p.clicks > 0 ? ((p.signups / p.clicks) * 100).toFixed(1) : "0";
                  const ar = p.signups > 0 ? ((p.attendees / p.signups) * 100).toFixed(0) : "-";
                  return (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 px-2 font-medium text-foreground">{isZh ? p.platformZh : p.platform}</td>
                      <td className="py-2 px-2 text-right text-foreground">{p.impressions.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right text-foreground">{p.clicks.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right"><Badge variant="secondary" className="text-[9px]">{ctr}%</Badge></td>
                      <td className="py-2 px-2 text-right text-foreground">{p.signups}</td>
                      <td className="py-2 px-2 text-right"><Badge variant="secondary" className="text-[9px]">{sr}%</Badge></td>
                      <td className="py-2 px-2 text-right text-foreground">{p.attendees > 0 ? p.attendees : "-"}</td>
                      <td className="py-2 px-2 text-right"><Badge variant={Number(ar) > 80 ? "default" : "secondary"} className="text-[9px]">{ar}{ar !== "-" ? "%" : ""}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventFunnelAnalytics;
