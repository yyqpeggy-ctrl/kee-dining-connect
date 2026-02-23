import { motion } from "framer-motion";
import { Bike, Clock, CheckCircle2, Package, AlertTriangle, TrendingUp, Plug, PlugZap, RefreshCw, Settings, ToggleLeft, ToggleRight, Phone, MapPin, Timer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useStore } from "@/contexts/StoreContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import StatCard from "@/components/StatCard";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DeliveryOrder {
  id: string;
  platform: "eleme" | "meituan";
  orderNo: string;
  customer: string;
  address: string;
  items: { name: string; qty: number }[];
  total: number;
  deliveryFee: number;
  status: "pending" | "preparing" | "delivering" | "completed" | "cancelled";
  orderTime: string;
  expectedTime: string;
  rider?: string;
  riderPhone?: string;
}

const mockOrders: DeliveryOrder[] = [
  { id: "1", platform: "meituan", orderNo: "MT-20260223-0891", customer: "张先生", address: "朝阳区建国路88号SOHO现代城A座", items: [{ name: "西班牙火腿拼盘", qty: 1 }, { name: "Sangria红酒", qty: 2 }], total: 268, deliveryFee: 5, status: "pending", orderTime: "12:15", expectedTime: "12:55" },
  { id: "2", platform: "eleme", orderNo: "EL-20260223-1234", customer: "李女士", address: "海淀区中关村大街1号", items: [{ name: "Nachos芝士玉米片", qty: 1 }, { name: "墨西哥卷饼", qty: 2 }, { name: "精酿啤酒", qty: 3 }], total: 186, deliveryFee: 3, status: "preparing", orderTime: "12:08", expectedTime: "12:48" },
  { id: "3", platform: "meituan", orderNo: "MT-20260223-0756", customer: "王先生", address: "东城区王府井大街218号", items: [{ name: "战斧牛排", qty: 1 }], total: 388, deliveryFee: 8, status: "delivering", orderTime: "11:52", expectedTime: "12:35", rider: "刘师傅", riderPhone: "138****6789" },
  { id: "4", platform: "eleme", orderNo: "EL-20260223-0988", customer: "赵女士", address: "西城区金融街19号", items: [{ name: "蒜香虾", qty: 2 }, { name: "薯条拼盘", qty: 1 }], total: 156, deliveryFee: 4, status: "completed", orderTime: "11:30", expectedTime: "12:10" },
  { id: "5", platform: "meituan", orderNo: "MT-20260223-0623", customer: "孙先生", address: "丰台区丽泽商务区", items: [{ name: "小食拼盘", qty: 1 }, { name: "鸡尾酒套餐", qty: 1 }], total: 198, deliveryFee: 6, status: "completed", orderTime: "11:15", expectedTime: "11:55" },
  { id: "6", platform: "eleme", orderNo: "EL-20260223-0445", customer: "周女士", address: "朝阳区望京SOHO", items: [{ name: "烤羊排", qty: 1 }, { name: "红酒", qty: 1 }], total: 328, deliveryFee: 5, status: "cancelled", orderTime: "11:00", expectedTime: "11:40" },
];

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
  const { currentStore } = useStore();
  const { t } = useTranslation();
  const [meituanConnected, setMeituanConnected] = useState(false);
  const [elemeConnected, setElemeConnected] = useState(false);
  const [meituanAutoAccept, setMeituanAutoAccept] = useState(true);
  const [elemeAutoAccept, setElemeAutoAccept] = useState(false);

  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: t("deliveryMgmt.pendingOrders"), color: "bg-warning text-warning-foreground", icon: Clock },
    preparing: { label: t("deliveryMgmt.preparingOrders"), color: "bg-info text-info-foreground", icon: Package },
    delivering: { label: t("deliveryMgmt.deliveringOrders"), color: "bg-primary text-primary-foreground", icon: Bike },
    completed: { label: t("deliveryMgmt.completedOrders"), color: "bg-success text-success-foreground", icon: CheckCircle2 },
    cancelled: { label: t("deliveryMgmt.cancelledOrders"), color: "bg-destructive text-destructive-foreground", icon: AlertTriangle },
  };

  const pendingCount = mockOrders.filter(o => o.status === "pending").length;
  const preparingCount = mockOrders.filter(o => o.status === "preparing").length;
  const deliveringCount = mockOrders.filter(o => o.status === "delivering").length;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">{t("deliveryMgmt.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{currentStore.name} · {t("deliveryMgmt.subtitle")}</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs"><Clock className="w-3.5 h-3.5" /><span>{t("deliveryMgmt.pendingOrders")} {pendingCount}</span></div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-info/10 text-info text-xs"><Package className="w-3.5 h-3.5" /><span>{t("deliveryMgmt.preparingOrders")} {preparingCount}</span></div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs"><Bike className="w-3.5 h-3.5" /><span>{t("deliveryMgmt.deliveringOrders")} {deliveringCount}</span></div>
        </div>
      </div>

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

      {/* Order Cards */}
      <h2 className="text-lg font-semibold mb-3">{t("deliveryMgmt.pendingOrders")} & {t("deliveryMgmt.preparingOrders")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockOrders.filter(o => ["pending", "preparing", "delivering"].includes(o.status)).map((order, i) => {
          const config = statusConfig[order.status];
          const Icon = config.icon;
          return (
            <motion.div key={order.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl overflow-hidden">
              <div className={`px-4 py-2 flex items-center justify-between ${config.color}`}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="font-bold text-sm">{config.label}</span>
                </div>
                <Badge variant="outline" className={`text-[10px] ${order.platform === "meituan" ? "border-[hsl(40,95%,55%)] text-[hsl(40,95%,55%)]" : "border-[hsl(210,95%,55%)] text-[hsl(210,95%,55%)]"}`}>
                  {order.platform === "meituan" ? t("deliveryMgmt.meituan") : t("deliveryMgmt.eleme")}
                </Badge>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-muted-foreground font-mono">{order.orderNo}</span>
                  <span className="text-sm font-bold text-primary">¥{order.total}</span>
                </div>
                <div className="space-y-1">
                  {order.items.map((item, j) => (
                    <p key={j} className="text-sm">{item.name} <span className="text-primary">×{item.qty}</span></p>
                  ))}
                </div>
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                  <span className="line-clamp-1">{order.address}</span>
                </div>
                {order.rider && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Bike className="w-3 h-3" />
                    <span>{order.rider}</span>
                    <Phone className="w-3 h-3 ml-2" />
                    <span>{order.riderPhone}</span>
                  </div>
                )}
              </div>
              <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Timer className="w-3 h-3" />
                  <span>{order.orderTime}</span>
                  <span>→ {t("deliveryMgmt.expectedTime")} {order.expectedTime}</span>
                </div>
                {order.status === "pending" && (
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive">{t("deliveryMgmt.reject")}</Button>
                    <Button size="sm" className="h-7 text-xs">{t("deliveryMgmt.accept")}</Button>
                  </div>
                )}
                {order.status === "preparing" && (
                  <Button size="sm" className="h-7 text-xs bg-success text-success-foreground">{t("deliveryMgmt.ready")}</Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default Delivery;
