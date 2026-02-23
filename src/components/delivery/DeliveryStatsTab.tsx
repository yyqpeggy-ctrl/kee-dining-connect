import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { CalendarIcon, TrendingUp, ShoppingBag, Percent, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

// Mock stats — will be replaced by aggregated API data
const dailyRevenue = [
  { date: "02/17", meituan: 2100, eleme: 1800 },
  { date: "02/18", meituan: 2500, eleme: 2100 },
  { date: "02/19", meituan: 1900, eleme: 1600 },
  { date: "02/20", meituan: 3200, eleme: 2800 },
  { date: "02/21", meituan: 2800, eleme: 2400 },
  { date: "02/22", meituan: 3500, eleme: 3000 },
  { date: "02/23", meituan: 4200, eleme: 3600 },
];

const categoryData = [
  { name: "Tapas小吃", value: 35, color: "hsl(var(--primary))" },
  { name: "主菜", value: 28, color: "hsl(40, 95%, 55%)" },
  { name: "酒水", value: 22, color: "hsl(210, 95%, 55%)" },
  { name: "甜点", value: 15, color: "hsl(150, 60%, 50%)" },
];

const completionRate = [
  { date: "02/17", rate: 94 },
  { date: "02/18", rate: 96 },
  { date: "02/19", rate: 92 },
  { date: "02/20", rate: 97 },
  { date: "02/21", rate: 95 },
  { date: "02/22", rate: 98 },
  { date: "02/23", rate: 96 },
];

const DeliveryStatsTab = () => {
  const { t } = useTranslation();
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="meituan">{t("deliveryMgmt.meituan")}</SelectItem>
            <SelectItem value="eleme">{t("deliveryMgmt.eleme")}</SelectItem>
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-9 gap-1.5", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="w-3.5 h-3.5" />
              {dateFrom ? format(dateFrom, "MM/dd") : t("deliveryMgmt.startDate")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
        <span className="text-muted-foreground text-sm">→</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-9 gap-1.5", !dateTo && "text-muted-foreground")}>
              <CalendarIcon className="w-3.5 h-3.5" />
              {dateTo ? format(dateTo, "MM/dd") : t("deliveryMgmt.endDate")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title={t("deliveryMgmt.weekOrders")} value="312" change="+18%" icon={ShoppingBag} />
        <StatCard title={t("deliveryMgmt.weekRevenue")} value="¥52,840" change="+15%" icon={TrendingUp} />
        <StatCard title={t("deliveryMgmt.completionRate")} value="96.2%" change="+1.2%" icon={Percent} />
        <StatCard title={t("deliveryMgmt.avgDeliveryTime")} value="31min" change="-2min" changeType="down" icon={Clock} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("deliveryMgmt.revenueTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="meituan" name={t("deliveryMgmt.meituan")} fill="hsl(40, 95%, 55%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="eleme" name={t("deliveryMgmt.eleme")} fill="hsl(210, 95%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("deliveryMgmt.categoryBreakdown")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("deliveryMgmt.completionTrend")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={completionRate}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[85, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Line type="monotone" dataKey="rate" name={t("deliveryMgmt.completionRate")} stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">{t("deliveryMgmt.statsNote")}</p>
    </div>
  );
};

export default DeliveryStatsTab;
