import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ShoppingBag, Package, Truck, Star, Plus, Search, TrendingUp, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import StatCard from "@/components/StatCard";
import { useTranslation } from "react-i18next";

const products = [
  { id: 1, nameZh: "KTV包厢2小时+酒水套餐券", nameEn: "Karaoke 2hr + Drinks Package Voucher", price: "¥588", sold: 2340, stock: 999, rating: 4.9, status: "onSale" },
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

const EcommerceTab = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title={t("marketingMgmt.onlineRevenue")} value="¥86.4万" change="+18.2%" changeType="up" icon={DollarSign} index={0} />
        <StatCard title={t("marketingMgmt.onlineOrders")} value="4,521" change="+12.6%" changeType="up" icon={ShoppingBag} index={1} />
        <StatCard title={t("marketingMgmt.productsOnSale")} value="32" change="+4" changeType="up" icon={Package} index={2} />
        <StatCard title={t("marketingMgmt.avgRating")} value="4.8" change="+0.1" changeType="up" icon={Star} index={3} />
      </div>

      {/* Charts */}
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

      {/* Products */}
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
    </div>
  );
};

export default EcommerceTab;
