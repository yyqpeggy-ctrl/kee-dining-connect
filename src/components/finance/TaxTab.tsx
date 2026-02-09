import { motion } from "framer-motion";
import { FileText, AlertTriangle, CheckCircle, Clock, Upload, Download, Calendar, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const taxCalendar = [
  { tax: "增值税", period: "2024年2月", deadline: "2024-03-15", status: "待申报", amount: 43400 },
  { tax: "企业所得税", period: "2024年Q1", deadline: "2024-04-15", status: "待申报", amount: 145716 },
  { tax: "个人所得税", period: "2024年2月", deadline: "2024-03-15", status: "已申报", amount: 28500 },
  { tax: "城建税", period: "2024年2月", deadline: "2024-03-15", status: "已申报", amount: 3038 },
  { tax: "教育费附加", period: "2024年2月", deadline: "2024-03-15", status: "已申报", amount: 1302 },
  { tax: "印花税", period: "2024年2月", deadline: "2024-03-15", status: "已缴纳", amount: 650 },
];

const taxHistory = [
  { period: "2024年1月", vat: 38200, income: 0, personal: 26800, total: 68560, status: "已完成" },
  { period: "2023年12月", vat: 42100, income: 0, personal: 29200, total: 75120, status: "已完成" },
  { period: "2023年11月", vat: 35600, income: 0, personal: 25100, total: 63890, status: "已完成" },
  { period: "2023年Q4", vat: 0, income: 138500, personal: 0, total: 138500, status: "已完成" },
  { period: "2023年10月", vat: 39800, income: 0, personal: 27500, total: 70650, status: "已完成" },
];

const invoiceStats = {
  issued: { count: 1256, amount: 4250000 },
  received: { count: 892, amount: 2180000 },
  pending: { count: 45, amount: 128000 },
};

const TaxTab = () => {
  const pendingCount = taxCalendar.filter(t => t.status === "待申报").length;
  const totalTaxDue = taxCalendar.filter(t => t.status !== "已缴纳").reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Tax Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-warning" />
            </div>
            <Badge variant="outline" className="text-warning border-warning/50">{pendingCount}项待办</Badge>
          </div>
          <p className="text-2xl font-bold">¥{(totalTaxDue / 10000).toFixed(1)}万</p>
          <p className="text-xs text-muted-foreground">待缴税款</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
          </div>
          <p className="text-2xl font-bold text-success">¥41.6万</p>
          <p className="text-xs text-muted-foreground">本年已缴税款</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold">{invoiceStats.issued.count}</p>
          <p className="text-xs text-muted-foreground">本月开票数</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-info" />
            </div>
          </div>
          <p className="text-2xl font-bold">9.6%</p>
          <p className="text-xs text-muted-foreground">综合税负率</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tax Calendar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">申报日历</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="w-4 h-4" />
                税务日历
              </Button>
              <Button size="sm" className="gap-2">
                <Upload className="w-4 h-4" />
                一键申报
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>税种</TableHead>
                <TableHead>税期</TableHead>
                <TableHead>申报截止</TableHead>
                <TableHead className="text-right">应缴金额</TableHead>
                <TableHead className="w-24">状态</TableHead>
                <TableHead className="w-20">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxCalendar.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{item.tax}</TableCell>
                  <TableCell className="text-muted-foreground">{item.period}</TableCell>
                  <TableCell>
                    <span className={item.status === "待申报" ? "text-warning" : "text-muted-foreground"}>
                      {item.deadline}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">¥{item.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={item.status === "已缴纳" ? "secondary" : item.status === "已申报" ? "outline" : "destructive"}
                      className="text-xs"
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.status === "待申报" && (
                      <Button variant="ghost" size="sm" className="text-xs h-7 px-2">申报</Button>
                    )}
                    {item.status === "已申报" && (
                      <Button variant="ghost" size="sm" className="text-xs h-7 px-2">缴款</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>

        {/* Invoice Management */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">发票管理</h3>
          
          <div className="space-y-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">销项发票</span>
                <span className="text-xs text-muted-foreground">{invoiceStats.issued.count}张</span>
              </div>
              <p className="text-lg font-bold text-success">¥{(invoiceStats.issued.amount / 10000).toFixed(1)}万</p>
              <Progress value={75} className="h-1 mt-2" />
            </div>

            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">进项发票</span>
                <span className="text-xs text-muted-foreground">{invoiceStats.received.count}张</span>
              </div>
              <p className="text-lg font-bold text-primary">¥{(invoiceStats.received.amount / 10000).toFixed(1)}万</p>
              <Progress value={52} className="h-1 mt-2" />
            </div>

            <div className="p-3 bg-warning/10 rounded-lg border border-warning/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium">待认证发票</span>
              </div>
              <p className="text-lg font-bold text-warning">{invoiceStats.pending.count}张</p>
              <p className="text-xs text-muted-foreground">金额: ¥{invoiceStats.pending.amount.toLocaleString()}</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-2">
                <Upload className="w-4 h-4" />
                上传发票
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-2">
                <Download className="w-4 h-4" />
                下载台账
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tax History */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">申报历史</h3>
          <Button variant="ghost" size="sm" className="text-xs">查看全部</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>税期</TableHead>
              <TableHead className="text-right">增值税</TableHead>
              <TableHead className="text-right">企业所得税</TableHead>
              <TableHead className="text-right">个人所得税</TableHead>
              <TableHead className="text-right">合计</TableHead>
              <TableHead className="w-20">状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxHistory.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{item.period}</TableCell>
                <TableCell className="text-right">{item.vat > 0 ? `¥${item.vat.toLocaleString()}` : "-"}</TableCell>
                <TableCell className="text-right">{item.income > 0 ? `¥${item.income.toLocaleString()}` : "-"}</TableCell>
                <TableCell className="text-right">{item.personal > 0 ? `¥${item.personal.toLocaleString()}` : "-"}</TableCell>
                <TableCell className="text-right font-medium">¥{item.total.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {item.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
};

export default TaxTab;
