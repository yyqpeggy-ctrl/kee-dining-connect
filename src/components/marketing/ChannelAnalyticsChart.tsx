import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Globe, MapPin } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Lead = Tables<"leads">;

interface ChannelAnalyticsChartProps {
  leads: Lead[];
  onlineSources: string[];
  offlineSources: string[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-1, 220 70% 50%))",
  "hsl(var(--chart-2, 160 60% 45%))",
  "hsl(var(--chart-3, 30 80% 55%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 340 75% 55%))",
  "hsl(0 70% 50%)",
  "hsl(45 80% 50%)",
  "hsl(190 70% 45%)",
  "hsl(100 55% 45%)",
  "hsl(260 60% 55%)",
  "hsl(15 75% 50%)",
  "hsl(210 65% 55%)",
  "hsl(320 60% 50%)",
];

const ChannelAnalyticsChart = ({ leads, onlineSources, offlineSources }: ChannelAnalyticsChartProps) => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";

  const channelData = useMemo(() => {
    const allSources = [...onlineSources, ...offlineSources, "manual"];
    const sourceMap = new Map<string, { total: number; converted: number; channel: "online" | "offline" }>();

    allSources.forEach(src => {
      sourceMap.set(src, {
        total: 0,
        converted: 0,
        channel: offlineSources.includes(src) ? "offline" : "online",
      });
    });

    leads.forEach(lead => {
      const entry = sourceMap.get(lead.source);
      if (entry) {
        entry.total += 1;
        if (lead.status === "converted") entry.converted += 1;
      } else {
        sourceMap.set(lead.source, {
          total: 1,
          converted: lead.status === "converted" ? 1 : 0,
          channel: offlineSources.includes(lead.source) ? "offline" : "online",
        });
      }
    });

    return Array.from(sourceMap.entries())
      .filter(([, v]) => v.total > 0)
      .map(([name, v]) => ({
        name: name === "manual" ? (isZh ? "手动录入" : "Manual") : name,
        total: v.total,
        converted: v.converted,
        conversionRate: v.total > 0 ? Math.round((v.converted / v.total) * 100) : 0,
        channel: v.channel,
      }))
      .sort((a, b) => b.total - a.total);
  }, [leads, onlineSources, offlineSources, isZh]);

  const channelSummary = useMemo(() => {
    const online = leads.filter(l => !offlineSources.includes(l.source));
    const offline = leads.filter(l => offlineSources.includes(l.source));
    const onlineConverted = online.filter(l => l.status === "converted").length;
    const offlineConverted = offline.filter(l => l.status === "converted").length;

    return [
      {
        name: isZh ? "线上渠道" : "Online",
        value: online.length,
        converted: onlineConverted,
        rate: online.length > 0 ? Math.round((onlineConverted / online.length) * 100) : 0,
      },
      {
        name: isZh ? "线下渠道" : "Offline",
        value: offline.length,
        converted: offlineConverted,
        rate: offline.length > 0 ? Math.round((offlineConverted / offline.length) * 100) : 0,
      },
    ];
  }, [leads, offlineSources, isZh]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-foreground">{d.name}</p>
        <p className="text-muted-foreground">
          {isZh ? "线索数" : "Leads"}: <span className="font-semibold text-foreground">{d.total}</span>
        </p>
        <p className="text-muted-foreground">
          {isZh ? "已转化" : "Converted"}: <span className="font-semibold text-green-600">{d.converted}</span>
        </p>
        <p className="text-muted-foreground">
          {isZh ? "转化率" : "Rate"}: <span className="font-semibold text-primary">{d.conversionRate}%</span>
        </p>
      </div>
    );
  };

  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{isZh ? "暂无线索数据，添加线索后即可查看渠道分析" : "No lead data yet. Add leads to see channel analytics."}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Online vs Offline Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channelSummary.map((ch, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {i === 0 ? <Globe className="w-4 h-4 text-blue-500" /> : <MapPin className="w-4 h-4 text-orange-500" />}
                  <span className="font-medium text-sm">{ch.name}</span>
                </div>
                <Badge variant="outline">{ch.rate}% {isZh ? "转化" : "conv."}</Badge>
              </div>
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-2xl font-bold text-foreground">{ch.value}</p>
                  <p className="text-xs text-muted-foreground">{isZh ? "总线索" : "Total Leads"}</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-600">{ch.converted}</p>
                  <p className="text-xs text-muted-foreground">{isZh ? "已转化" : "Converted"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bar Chart - Leads by Source */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            {isZh ? "各渠道线索数量" : "Leads by Channel"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={channelData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]} name={isZh ? "线索数" : "Leads"}>
                {channelData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.channel === "online" ? "hsl(var(--primary))" : "hsl(30 80% 55%)"} opacity={0.85} />
                ))}
              </Bar>
              <Bar dataKey="converted" radius={[4, 4, 0, 0]} name={isZh ? "已转化" : "Converted"}>
                {channelData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.channel === "online" ? "hsl(160 60% 45%)" : "hsl(45 80% 50%)"} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: "hsl(var(--primary))" }} />{isZh ? "线上线索" : "Online Leads"}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: "hsl(30 80% 55%)" }} />{isZh ? "线下线索" : "Offline Leads"}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: "hsl(160 60% 45%)" }} />{isZh ? "线上转化" : "Online Conv."}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: "hsl(45 80% 50%)" }} />{isZh ? "线下转化" : "Offline Conv."}</span>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Rate Bar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            {isZh ? "各渠道转化率对比" : "Conversion Rate by Channel"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={channelData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip
                formatter={(value: number) => [`${value}%`, isZh ? "转化率" : "Conv. Rate"]}
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
              />
              <Bar dataKey="conversionRate" radius={[0, 4, 4, 0]}>
                {channelData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie Chart - Source Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-primary" />
            {isZh ? "渠道占比分布" : "Channel Distribution"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={channelData}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
              >
                {channelData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [value, name]}
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChannelAnalyticsChart;
