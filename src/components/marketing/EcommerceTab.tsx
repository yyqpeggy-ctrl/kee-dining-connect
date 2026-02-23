import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Package, Truck, Star, Plus, Search, TrendingUp, DollarSign, Smartphone, Store, Eye, Users, ArrowUpRight, ArrowDownRight, TicketPercent, Gift, Clock, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import StatCard from "@/components/StatCard";
import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";

// --- Shared products ---
const products = [
  { id: 1, nameZh: "KTV欢唱2小时+酒水套餐券", nameEn: "Karaoke 2hr + Drinks Package Voucher", price: "¥588", sold: 2340, stock: 999, rating: 4.9, status: "onSale" },
  { id: 2, nameZh: "飞镖派对套餐（4人）", nameEn: "Darts Party Set (4 ppl)", price: "¥388", sold: 1612, stock: 999, rating: 4.8, status: "onSale" },
  { id: 3, nameZh: "招牌Sangria预调酒（1L装）", nameEn: "House Sangria Bottle (1L)", price: "¥128", sold: 4930, stock: 280, rating: 4.7, status: "onSale" },
  { id: 4, nameZh: "周五飞镖之夜VIP票", nameEn: "Friday Darts Night VIP Pass", price: "¥168", sold: 856, stock: 0, rating: 4.9, status: "soldOut" },
  { id: 5, nameZh: "精酿啤酒桶5L（到店自提）", nameEn: "Craft Beer Tower 5L (Pickup)", price: "¥268", sold: 934, stock: 65, rating: 4.6, status: "onSale" },
  { id: 6, nameZh: "生日/团建派对预订券", nameEn: "Birthday/Team Party Booking Voucher", price: "¥1,888", sold: 210, stock: 999, rating: 4.9, status: "onSale" },
];

const orderChannel = [
  { nameZh: "大众点评", nameEn: "Dianping", value: 32 },
  { nameZh: "美团", nameEn: "Meituan", value: 25 },
  { nameZh: "抖音商城", nameEn: "TikTok Shop", value: 23 },
  { nameZh: "自营小程序", nameEn: "Own Mini App", value: 20 },
];

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(0, 70%, 55%)", "hsl(var(--secondary))"];

const dailySales = [
  { date: "2/15", orders: 128, revenue: 18600 },
  { date: "2/16", orders: 145, revenue: 21200 },
  { date: "2/17", orders: 162, revenue: 24800 },
  { date: "2/18", orders: 138, revenue: 19500 },
  { date: "2/19", orders: 178, revenue: 28900 },
  { date: "2/20", orders: 195, revenue: 32100 },
  { date: "2/21", orders: 210, revenue: 35400 },
];

// --- WeChat Mini Program Data ---
const miniProgramDailyData = [
  { date: "2/15", uv: 1250, pv: 3800, orders: 45, revenue: 12600 },
  { date: "2/16", uv: 1380, pv: 4200, orders: 52, revenue: 14800 },
  { date: "2/17", uv: 1520, pv: 4600, orders: 61, revenue: 18200 },
  { date: "2/18", uv: 1180, pv: 3500, orders: 38, revenue: 10500 },
  { date: "2/19", uv: 1680, pv: 5100, orders: 68, revenue: 21000 },
  { date: "2/20", uv: 1850, pv: 5600, orders: 75, revenue: 24500 },
  { date: "2/21", uv: 2100, pv: 6200, orders: 88, revenue: 28800 },
];

const miniProgramProducts = [
  { id: 1, nameZh: "招牌Tapas拼盘（双人份）", nameEn: "Signature Tapas Platter (2ppl)", price: 168, sold: 1280, convRate: 8.2, status: "hot" },
  { id: 2, nameZh: "啤酒畅饮2小时套餐", nameEn: "2hr Beer All-You-Can-Drink", price: 128, sold: 2150, convRate: 12.5, status: "hot" },
  { id: 3, nameZh: "会员储值卡（充500送100）", nameEn: "Member Card (Pay 500 Get 600)", price: 500, sold: 420, convRate: 3.8, status: "normal" },
  { id: 4, nameZh: "周末Brunch套餐预订", nameEn: "Weekend Brunch Set Reservation", price: 238, sold: 680, convRate: 6.1, status: "normal" },
  { id: 5, nameZh: "飞镖体验课程（含教练）", nameEn: "Darts Lesson (with Coach)", price: 98, sold: 890, convRate: 15.2, status: "hot" },
  { id: 6, nameZh: "定制鸡尾酒体验课", nameEn: "Custom Cocktail Workshop", price: 188, sold: 320, convRate: 4.5, status: "new" },
];

const miniProgramUserSource = [
  { nameZh: "扫码进入", nameEn: "QR Scan", value: 35 },
  { nameZh: "搜索", nameEn: "Search", value: 22 },
  { nameZh: "分享转发", nameEn: "Shared", value: 28 },
  { nameZh: "公众号", nameEn: "WeChat OA", value: 15 },
];

// --- Dianping Group Buy Data ---
const dianpingDeals = [
  { id: 1, nameZh: "双人Tapas+红酒套餐", nameEn: "Tapas+Wine Set for 2", originalPrice: 368, dealPrice: 258, sold: 3680, verified: 2840, refunded: 120, rating: 4.8, expiry: "2026-03-31", status: "active" },
  { id: 2, nameZh: "KTV欢唱套餐（3小时）", nameEn: "KTV 3hr Singing Package", originalPrice: 688, dealPrice: 428, sold: 1920, verified: 1560, refunded: 85, rating: 4.7, expiry: "2026-04-15", status: "active" },
  { id: 3, nameZh: "工作日午餐特惠套餐", nameEn: "Weekday Lunch Special", originalPrice: 88, dealPrice: 58, sold: 5200, verified: 4800, refunded: 180, rating: 4.6, expiry: "2026-03-15", status: "active" },
  { id: 4, nameZh: "精酿啤酒品鉴套餐", nameEn: "Craft Beer Tasting Set", originalPrice: 198, dealPrice: 138, sold: 1450, verified: 1280, refunded: 45, rating: 4.9, expiry: "2026-05-01", status: "active" },
  { id: 5, nameZh: "飞镖大赛入场券+酒水", nameEn: "Darts Tournament Entry + Drinks", originalPrice: 228, dealPrice: 168, sold: 860, verified: 720, refunded: 30, rating: 4.8, expiry: "2026-02-28", status: "expiring" },
  { id: 6, nameZh: "生日派对豪华套餐", nameEn: "Birthday Party Deluxe", originalPrice: 2888, dealPrice: 1888, sold: 180, verified: 165, refunded: 5, rating: 4.9, expiry: "2026-06-30", status: "active" },
];

const dianpingDailySales = [
  { date: "2/15", sold: 85, verified: 62, revenue: 22800 },
  { date: "2/16", sold: 92, verified: 71, revenue: 25600 },
  { date: "2/17", sold: 108, verified: 82, revenue: 31200 },
  { date: "2/18", sold: 78, verified: 58, revenue: 19800 },
  { date: "2/19", sold: 125, verified: 95, revenue: 35800 },
  { date: "2/20", sold: 138, verified: 108, revenue: 41200 },
  { date: "2/21", sold: 152, verified: 118, revenue: 45600 },
];

const EcommerceTab = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const [subTab, setSubTab] = useState("overview");

  return (
    <div className="space-y-6">
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5"><ShoppingBag className="w-3.5 h-3.5" />{isZh ? "总览" : "Overview"}</TabsTrigger>
          <TabsTrigger value="miniprogram" className="gap-1.5"><Smartphone className="w-3.5 h-3.5" />{isZh ? "微信小程序" : "WeChat Mini"}</TabsTrigger>
          <TabsTrigger value="dianping" className="gap-1.5"><TicketPercent className="w-3.5 h-3.5" />{isZh ? "大众点评团购" : "Dianping Deals"}</TabsTrigger>
        </TabsList>

        {/* ============ OVERVIEW TAB ============ */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title={t("marketingMgmt.onlineRevenue")} value="¥86.4万" change="+18.2%" changeType="up" icon={DollarSign} index={0} />
            <StatCard title={t("marketingMgmt.onlineOrders")} value="4,521" change="+12.6%" changeType="up" icon={ShoppingBag} index={1} />
            <StatCard title={t("marketingMgmt.productsOnSale")} value="32" change="+4" changeType="up" icon={Package} index={2} />
            <StatCard title={t("marketingMgmt.avgRating")} value="4.8" change="+0.1" changeType="up" icon={Star} index={3} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("marketingMgmt.dailySalesTrend")}</CardTitle>
                <CardDescription>{t("marketingMgmt.dailySalesDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dailySales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="left" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="right" orientation="right" fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `¥${(v / 10000).toFixed(1)}万`} />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="orders" name={t("common.orders")} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="revenue" name={t("financeMgmt.revenue")} fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("marketingMgmt.channelBreakdown")}</CardTitle>
                <CardDescription>{t("marketingMgmt.channelBreakdownDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={orderChannel.map(c => ({ name: isZh ? c.nameZh : c.nameEn, value: c.value }))} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                      {orderChannel.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{t("marketingMgmt.productManagement")}</CardTitle>
                  <CardDescription>{t("marketingMgmt.productManagementDesc")}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t("marketingMgmt.searchProducts")} className="pl-8 w-[200px] h-9" />
                  </div>
                  <Button size="sm"><Plus className="w-3 h-3 mr-1" />{t("marketingMgmt.listProduct")}</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("marketingMgmt.productName")}</TableHead>
                    <TableHead className="text-right">{t("marketingMgmt.price")}</TableHead>
                    <TableHead className="text-right">{t("marketingMgmt.sold")}</TableHead>
                    <TableHead className="text-right">{t("marketingMgmt.stock")}</TableHead>
                    <TableHead className="text-right">{t("marketingMgmt.rating")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{isZh ? p.nameZh : p.nameEn}</TableCell>
                      <TableCell className="text-right">{p.price}</TableCell>
                      <TableCell className="text-right">{p.sold.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{p.stock}</TableCell>
                      <TableCell className="text-right">
                        <span className="flex items-center justify-end gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{p.rating}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status === "onSale" ? "default" : "destructive"}>{t(`marketingMgmt.${p.status}`)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">{t("common.edit")}</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ WECHAT MINI PROGRAM TAB ============ */}
        <TabsContent value="miniprogram" className="space-y-6 mt-4">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{isZh ? "今日UV / PV" : "Today UV / PV"}</p>
                    <p className="text-2xl font-bold text-foreground">2,100 <span className="text-sm font-normal text-muted-foreground">/ 6,200</span></p>
                    <p className="text-xs text-green-600 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />+13.5%</p>
                  </div>
                  <Eye className="w-8 h-8 text-primary opacity-70" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{isZh ? "今日订单" : "Today Orders"}</p>
                    <p className="text-2xl font-bold text-foreground">88</p>
                    <p className="text-xs text-green-600 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />+17.3%</p>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-primary opacity-70" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{isZh ? "今日营收" : "Today Revenue"}</p>
                    <p className="text-2xl font-bold text-foreground">¥28,800</p>
                    <p className="text-xs text-green-600 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />+17.6%</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary opacity-70" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{isZh ? "累计会员" : "Total Members"}</p>
                    <p className="text-2xl font-bold text-foreground">8,520</p>
                    <p className="text-xs text-green-600 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />+256{isZh ? "本月" : " this month"}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary opacity-70" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{isZh ? "小程序流量 & 订单趋势" : "Mini Program Traffic & Orders"}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={miniProgramDailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                    <Area type="monotone" dataKey="uv" name="UV" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
                    <Area type="monotone" dataKey="orders" name={isZh ? "订单" : "Orders"} stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.15)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{isZh ? "用户来源" : "User Source"}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={miniProgramUserSource.map(c => ({ name: isZh ? c.nameZh : c.nameEn, value: c.value }))} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                      {miniProgramUserSource.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Mini Program Products */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{isZh ? "小程序商品管理" : "Mini Program Products"}</CardTitle>
                  <CardDescription>{isZh ? "管理微信小程序商城中的商品" : "Manage products in WeChat Mini Program store"}</CardDescription>
                </div>
                <Button size="sm"><Plus className="w-3 h-3 mr-1" />{isZh ? "上架商品" : "Add Product"}</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isZh ? "商品名称" : "Product"}</TableHead>
                    <TableHead className="text-right">{isZh ? "价格" : "Price"}</TableHead>
                    <TableHead className="text-right">{isZh ? "销量" : "Sold"}</TableHead>
                    <TableHead className="text-right">{isZh ? "转化率" : "Conv. Rate"}</TableHead>
                    <TableHead>{isZh ? "状态" : "Status"}</TableHead>
                    <TableHead>{isZh ? "操作" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {miniProgramProducts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{isZh ? p.nameZh : p.nameEn}</TableCell>
                      <TableCell className="text-right">¥{p.price}</TableCell>
                      <TableCell className="text-right">{p.sold.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={p.convRate > 10 ? "default" : "secondary"} className="text-[10px]">{p.convRate}%</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status === "hot" ? "destructive" : p.status === "new" ? "default" : "secondary"}>
                          {p.status === "hot" ? (isZh ? "🔥热销" : "🔥Hot") : p.status === "new" ? (isZh ? "🆕新品" : "🆕New") : (isZh ? "在售" : "Active")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">{isZh ? "编辑" : "Edit"}</Button>
                          <Button variant="ghost" size="sm">{isZh ? "推广" : "Promote"}</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ DIANPING GROUP BUY TAB ============ */}
        <TabsContent value="dianping" className="space-y-6 mt-4">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{isZh ? "团购券总销量" : "Total Deals Sold"}</p>
                    <p className="text-2xl font-bold text-foreground">13,290</p>
                    <p className="text-xs text-green-600 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />+22.8%</p>
                  </div>
                  <TicketPercent className="w-8 h-8 text-primary opacity-70" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{isZh ? "核销率" : "Verification Rate"}</p>
                    <p className="text-2xl font-bold text-foreground">84.6%</p>
                    <p className="text-xs text-green-600 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />+3.2%</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-primary opacity-70" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{isZh ? "团购营收" : "Deal Revenue"}</p>
                    <p className="text-2xl font-bold text-foreground">¥52.8万</p>
                    <p className="text-xs text-green-600 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />+15.6%</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary opacity-70" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{isZh ? "退款率" : "Refund Rate"}</p>
                    <p className="text-2xl font-bold text-foreground">3.5%</p>
                    <p className="text-xs text-green-600 flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3" />-0.8%</p>
                  </div>
                  <Gift className="w-8 h-8 text-primary opacity-70" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{isZh ? "团购券销售 & 核销趋势" : "Deal Sales & Verification Trend"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dianpingDailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Bar dataKey="sold" name={isZh ? "售出" : "Sold"} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="verified" name={isZh ? "核销" : "Verified"} fill="hsl(var(--primary) / 0.5)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Deal List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{isZh ? "团购券管理" : "Deal Management"}</CardTitle>
                  <CardDescription>{isZh ? "管理大众点评/美团团购券" : "Manage Dianping/Meituan group deals"}</CardDescription>
                </div>
                <Button size="sm"><Plus className="w-3 h-3 mr-1" />{isZh ? "创建团购" : "New Deal"}</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isZh ? "团购名称" : "Deal Name"}</TableHead>
                    <TableHead className="text-right">{isZh ? "原价" : "Original"}</TableHead>
                    <TableHead className="text-right">{isZh ? "团购价" : "Deal Price"}</TableHead>
                    <TableHead className="text-right">{isZh ? "售出" : "Sold"}</TableHead>
                    <TableHead className="text-right">{isZh ? "核销" : "Verified"}</TableHead>
                    <TableHead className="text-right">{isZh ? "核销率" : "Rate"}</TableHead>
                    <TableHead className="text-right">{isZh ? "评分" : "Rating"}</TableHead>
                    <TableHead>{isZh ? "有效期" : "Expiry"}</TableHead>
                    <TableHead>{isZh ? "操作" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dianpingDeals.map((d) => {
                    const verifyRate = d.sold > 0 ? ((d.verified / d.sold) * 100).toFixed(1) : "0";
                    const discount = ((1 - d.dealPrice / d.originalPrice) * 100).toFixed(0);
                    const daysLeft = Math.ceil((new Date(d.expiry).getTime() - Date.now()) / 86400000);
                    return (
                      <TableRow key={d.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{isZh ? d.nameZh : d.nameEn}</p>
                            <Badge variant="secondary" className="text-[9px] mt-0.5">{discount}% OFF</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground line-through text-xs">¥{d.originalPrice}</TableCell>
                        <TableCell className="text-right font-medium text-destructive">¥{d.dealPrice}</TableCell>
                        <TableCell className="text-right">{d.sold.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{d.verified.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Progress value={Number(verifyRate)} className="w-12 h-1.5" />
                            <span className="text-xs">{verifyRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="flex items-center justify-end gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{d.rating}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className={`text-xs ${daysLeft < 14 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                              {daysLeft > 0 ? (isZh ? `${daysLeft}天` : `${daysLeft}d`) : (isZh ? "已过期" : "Expired")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">{isZh ? "编辑" : "Edit"}</Button>
                            <Button variant="ghost" size="sm">{isZh ? "续期" : "Extend"}</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EcommerceTab;
