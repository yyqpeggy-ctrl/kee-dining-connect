import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ShoppingBag, Package, Truck, Star, Plus, Search, TrendingUp, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import StatCard from "@/components/StatCard";

const products = [
  { id: 1, name: "招牌红烧肉礼盒", price: "¥168", sold: 2340, stock: 156, rating: 4.9, status: "在售" },
  { id: 2, name: "手工水饺速冻装（50只）", price: "¥89", sold: 5612, stock: 320, rating: 4.8, status: "在售" },
  { id: 3, name: "秘制辣酱（3瓶装）", price: "¥56", sold: 8930, stock: 890, rating: 4.7, status: "在售" },
  { id: 4, name: "年夜饭套餐（6-8人）", price: "¥888", sold: 456, stock: 0, rating: 4.9, status: "已售罄" },
  { id: 5, name: "新春糕点礼盒", price: "¥128", sold: 1234, stock: 45, rating: 4.6, status: "在售" },
  { id: 6, name: "有机蔬菜沙拉套装", price: "¥45", sold: 3210, stock: 200, rating: 4.5, status: "在售" },
];

const orderChannel = [
  { name: "美团", value: 35 },
  { name: "饿了么", value: 28 },
  { name: "抖音商城", value: 22 },
  { name: "自营小程序", value: 15 },
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
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="本月线上营收" value="¥86.4万" change="+18.2%" changeType="up" icon={DollarSign} index={0} />
        <StatCard title="线上订单数" value="4,521" change="+12.6%" changeType="up" icon={ShoppingBag} index={1} />
        <StatCard title="在售商品" value="32" change="+4" changeType="up" icon={Package} index={2} />
        <StatCard title="平均评分" value="4.8" change="+0.1" changeType="up" icon={Star} index={3} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">每日销售趋势</CardTitle>
            <CardDescription>近7天线上订单与营收</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="left" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="right" orientation="right" fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `¥${(v / 10000).toFixed(1)}万`} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="orders" name="订单数" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="revenue" name="营收(¥)" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">渠道占比</CardTitle>
            <CardDescription>各平台订单分布</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={orderChannel} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
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
              <CardTitle className="text-base">商品管理</CardTitle>
              <CardDescription>线上销售商品列表</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="搜索商品..." className="pl-8 w-[200px] h-9" />
              </div>
              <Button size="sm"><Plus className="w-3 h-3 mr-1" />上架商品</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>商品名称</TableHead>
                <TableHead className="text-right">价格</TableHead>
                <TableHead className="text-right">已售</TableHead>
                <TableHead className="text-right">库存</TableHead>
                <TableHead className="text-right">评分</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right">{p.price}</TableCell>
                  <TableCell className="text-right">{p.sold.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{p.stock}</TableCell>
                  <TableCell className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{p.rating}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === "在售" ? "default" : "destructive"}>{p.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">编辑</Button>
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
