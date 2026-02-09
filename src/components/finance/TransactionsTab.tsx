import { motion } from "framer-motion";
import { Search, Filter, Download, Receipt, ArrowUpRight, ArrowDownRight, CreditCard, Wallet, Building2, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const transactions = [
  { id: "T001", type: "income", category: "营业收入", desc: "门店营收 - 总店", amount: 28640, time: "今天 21:00", method: "微信支付", store: "总店" },
  { id: "T002", type: "income", category: "营业收入", desc: "门店营收 - 国贸分店", amount: 35280, time: "今天 21:00", method: "支付宝", store: "国贸分店" },
  { id: "T003", type: "expense", category: "原材料采购", desc: "海鲜供应商采购", amount: 15800, time: "今天 14:30", method: "银行转账", store: "总部" },
  { id: "T004", type: "expense", category: "人工成本", desc: "员工工资 - 2月", amount: 183000, time: "今天 10:00", method: "银行转账", store: "总部" },
  { id: "T005", type: "income", category: "营业收入", desc: "门店营收 - 三里屯分店", amount: 42150, time: "昨天 22:00", method: "混合支付", store: "三里屯分店" },
  { id: "T006", type: "expense", category: "租金水电", desc: "总店2月租金", amount: 45000, time: "昨天 10:00", method: "银行转账", store: "总店" },
  { id: "T007", type: "expense", category: "租金水电", desc: "各门店水电费", amount: 8500, time: "2天前", method: "银行扣款", store: "总部" },
  { id: "T008", type: "income", category: "其他收入", desc: "外卖平台结算", amount: 18600, time: "2天前", method: "银行转账", store: "总部" },
  { id: "T009", type: "expense", category: "营销费用", desc: "大众点评推广", amount: 5000, time: "3天前", method: "在线支付", store: "总部" },
  { id: "T010", type: "expense", category: "设备维护", desc: "厨房设备维修", amount: 2800, time: "3天前", method: "现金", store: "国贸分店" },
];

const categoryIcons: Record<string, React.ReactNode> = {
  "营业收入": <Wallet className="w-4 h-4" />,
  "其他收入": <CreditCard className="w-4 h-4" />,
  "原材料采购": <ShoppingCart className="w-4 h-4" />,
  "人工成本": <Building2 className="w-4 h-4" />,
  "租金水电": <Building2 className="w-4 h-4" />,
  "营销费用": <Receipt className="w-4 h-4" />,
  "设备维护": <Receipt className="w-4 h-4" />,
};

const TransactionsTab = () => {
  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">本期收入</p>
          <p className="text-2xl font-bold text-success flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5" />
            ¥{totalIncome.toLocaleString()}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">本期支出</p>
          <p className="text-2xl font-bold text-destructive flex items-center gap-2">
            <ArrowDownRight className="w-5 h-5" />
            ¥{totalExpense.toLocaleString()}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">净收支</p>
          <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? "text-success" : "text-destructive"}`}>
            ¥{(totalIncome - totalExpense).toLocaleString()}
          </p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="搜索交易记录..." className="pl-9 bg-muted/50 border-border/50" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-32 bg-muted/50">
            <SelectValue placeholder="类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="income">收入</SelectItem>
            <SelectItem value="expense">支出</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-36 bg-muted/50">
            <SelectValue placeholder="门店" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部门店</SelectItem>
            <SelectItem value="hq">总部</SelectItem>
            <SelectItem value="main">总店</SelectItem>
            <SelectItem value="guomao">国贸分店</SelectItem>
            <SelectItem value="sanlitun">三里屯分店</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          更多筛选
        </Button>
        <Button variant="outline" size="sm" className="gap-2 ml-auto">
          <Download className="w-4 h-4" />
          导出
        </Button>
      </div>

      {/* Transactions List */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
        <div className="space-y-1">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  tx.type === "income" ? "bg-success/10" : "bg-destructive/10"
                }`}>
                  <div className={tx.type === "income" ? "text-success" : "text-destructive"}>
                    {categoryIcons[tx.category] || <Receipt className="w-4 h-4" />}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{tx.desc}</p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{tx.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{tx.time}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{tx.method}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{tx.store}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`font-semibold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                  {tx.type === "income" ? "+" : "-"}¥{tx.amount.toLocaleString()}
                </span>
                <p className="text-[10px] text-muted-foreground">{tx.id}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">显示 1-10 共 156 条记录</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>上一页</Button>
            <Button variant="outline" size="sm" className="bg-primary/20">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">下一页</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TransactionsTab;
