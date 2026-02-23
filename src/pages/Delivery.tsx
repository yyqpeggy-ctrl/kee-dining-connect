import { Bike, Clock, Package, TrendingUp, PlugZap, Plug, RefreshCw, Timer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import StoreIndicator from "@/components/StoreIndicator";
import { useStore } from "@/contexts/StoreContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatCard from "@/components/StatCard";
import DeliveryLiveTab, { mockOrders } from "@/components/delivery/DeliveryLiveTab";
import DeliveryHistoryTab from "@/components/delivery/DeliveryHistoryTab";
import DeliveryStatsTab from "@/components/delivery/DeliveryStatsTab";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const hourlyData = [
  { hour: "10:00", meituan: 3, eleme: 2 },
  { hour: "11:00", meituan: 8, eleme: 6 },
  { hour: "12:00", meituan: 15, eleme: 12 },
  { hour: "13:00", meituan: 12, eleme: 9 },
  { hour: "14:00", meituan: 5, eleme: 4 },
  { hour: "15:00", meituan: 2, eleme: 1 },
];

const platformData = [
  { name: "美团外卖", value: 58, color: "hsl(40, 95%, 55%)" },
  { name: "饿了么", value: 42, color: "hsl(210, 95%, 55%)" },
];

const Delivery = () => {
  const { currentStore, storeName } = useStore();
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const [meituanConnected, setMeituanConnected] = useState(false);
  const [elemeConnected, setElemeConnected] = useState(false);
  const [meituanAutoAccept, setMeituanAutoAccept] = useState(true);
  const [elemeAutoAccept, setElemeAutoAccept] = useState(false);

  const pendingCount = mockOrders.filter(o => o.status === "pending").length;
  const preparingCount = mockOrders.filter(o => o.status === "preparing").length;
  const deliveringCount = mockOrders.filter(o => o.status === "delivering").length;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">{t("deliveryMgmt.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{storeName(isZh)} · {t("deliveryMgmt.subtitle")}</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs"><Clock className="w-3.5 h-3.5" /><span>{t("deliveryMgmt.pendingOrders")} {pendingCount}</span></div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-info/10 text-info text-xs"><Package className="w-3.5 h-3.5" /><span>{t("deliveryMgmt.preparingOrders")} {preparingCount}</span></div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs"><Bike className="w-3.5 h-3.5" /><span>{t("deliveryMgmt.deliveringOrders")} {deliveringCount}</span></div>
        </div>
      </div>

      <StoreIndicator />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title={t("deliveryMgmt.todayOrders")} value="47" change="+12%" icon={Package} />
        <StatCard title={t("deliveryMgmt.todayRevenue")} value="¥8,560" change="+8.5%" icon={TrendingUp} />
        <StatCard title={t("deliveryMgmt.avgDeliveryTime")} value="32min" change="-3min" changeType="down" icon={Timer} />
        <StatCard title={t("deliveryMgmt.onlineRate")} value="98.5%" change="+0.5%" icon={PlugZap} />
      </div>

      {/* Platform Connection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Meituan */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(40,95%,55%)]/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-[hsl(40,95%,55%)]">美</span>
                </div>
                <div>
                  <CardTitle className="text-base">{t("deliveryMgmt.meituan")}</CardTitle>
                  <CardDescription className="text-xs">meituan.com</CardDescription>
                </div>
              </div>
              <Badge variant={meituanConnected ? "default" : "secondary"}>
                {meituanConnected ? t("deliveryMgmt.connected") : t("deliveryMgmt.disconnected")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("deliveryMgmt.autoAccept")}</span>
              <Switch checked={meituanAutoAccept} onCheckedChange={setMeituanAutoAccept} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("deliveryMgmt.lastSync")}</span>
              <span className="text-xs">2026-02-23 12:15</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => setMeituanConnected(!meituanConnected)}>
                <Plug className="w-3.5 h-3.5" />
                {meituanConnected ? t("deliveryMgmt.viewSettings") : t("deliveryMgmt.configureApi")}
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                {t("deliveryMgmt.syncMenu")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Eleme */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(210,95%,55%)]/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-[hsl(210,95%,55%)]">饿</span>
                </div>
                <div>
                  <CardTitle className="text-base">{t("deliveryMgmt.eleme")}</CardTitle>
                  <CardDescription className="text-xs">ele.me</CardDescription>
                </div>
              </div>
              <Badge variant={elemeConnected ? "default" : "secondary"}>
                {elemeConnected ? t("deliveryMgmt.connected") : t("deliveryMgmt.disconnected")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("deliveryMgmt.autoAccept")}</span>
              <Switch checked={elemeAutoAccept} onCheckedChange={setElemeAutoAccept} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("deliveryMgmt.lastSync")}</span>
              <span className="text-xs">2026-02-23 12:10</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => setElemeConnected(!elemeConnected)}>
                <Plug className="w-3.5 h-3.5" />
                {elemeConnected ? t("deliveryMgmt.viewSettings") : t("deliveryMgmt.configureApi")}
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                {t("deliveryMgmt.syncMenu")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="live" className="space-y-4">
        <TabsList>
          <TabsTrigger value="live">{t("deliveryMgmt.liveOrders")}</TabsTrigger>
          <TabsTrigger value="history">{t("deliveryMgmt.historyOrders")}</TabsTrigger>
          <TabsTrigger value="stats">{t("deliveryMgmt.statsReport")}</TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t("deliveryMgmt.dailyTrend")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
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
                <CardTitle className="text-sm">{t("deliveryMgmt.platformBreakdown")}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={platformData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                      {platformData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <h2 className="text-lg font-semibold mb-3">{t("deliveryMgmt.pendingOrders")} & {t("deliveryMgmt.preparingOrders")}</h2>
          <DeliveryLiveTab />
        </TabsContent>

        <TabsContent value="history">
          <DeliveryHistoryTab />
        </TabsContent>

        <TabsContent value="stats">
          <DeliveryStatsTab />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Delivery;
