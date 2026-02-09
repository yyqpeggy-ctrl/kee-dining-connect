import { motion } from "framer-motion";
import { Plus, Search, Filter, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const journalEntries = [
  { id: "JE001", date: "2024-02-15", type: "收入", account: "主营业务收入", debit: 0, credit: 28640, description: "总店当日营收", status: "已审核" },
  { id: "JE002", date: "2024-02-15", type: "收入", account: "主营业务收入", debit: 0, credit: 35280, description: "国贸分店当日营收", status: "已审核" },
  { id: "JE003", date: "2024-02-15", type: "支出", account: "原材料采购", debit: 15800, credit: 0, description: "海鲜供应商采购", status: "已审核" },
  { id: "JE004", date: "2024-02-14", type: "支出", account: "应付职工薪酬", debit: 183000, credit: 0, description: "2月员工工资", status: "待审核" },
  { id: "JE005", date: "2024-02-14", type: "支出", account: "管理费用-租金", debit: 45000, credit: 0, description: "总店2月租金", status: "已审核" },
  { id: "JE006", date: "2024-02-13", type: "支出", account: "管理费用-水电", debit: 8500, credit: 0, description: "各门店水电费", status: "已审核" },
  { id: "JE007", date: "2024-02-13", type: "收入", account: "主营业务收入", debit: 0, credit: 42150, description: "三里屯分店当日营收", status: "已审核" },
];

const accountSummary = [
  { name: "库存现金", balance: 125000, type: "资产" },
  { name: "银行存款", balance: 2850000, type: "资产" },
  { name: "应收账款", balance: 180000, type: "资产" },
  { name: "原材料", balance: 320000, type: "资产" },
  { name: "应付账款", balance: 450000, type: "负债" },
  { name: "应付职工薪酬", balance: 183000, type: "负债" },
];

const AccountingTab = () => {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="搜索凭证..." className="pl-9 w-64 bg-muted/50 border-border/50" />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            筛选
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="w-4 h-4" />
            导入凭证
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            新增凭证
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Journal Entries Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">记账凭证</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">凭证号</TableHead>
                <TableHead className="w-24">日期</TableHead>
                <TableHead>科目</TableHead>
                <TableHead className="text-right">借方</TableHead>
                <TableHead className="text-right">贷方</TableHead>
                <TableHead className="w-20">状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journalEntries.map((entry) => (
                <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium text-xs">{entry.id}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{entry.date}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{entry.account}</p>
                      <p className="text-xs text-muted-foreground">{entry.description}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.debit > 0 && (
                      <span className="text-destructive font-medium">¥{entry.debit.toLocaleString()}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.credit > 0 && (
                      <span className="text-success font-medium">¥{entry.credit.toLocaleString()}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.status === "已审核" ? "secondary" : "outline"} className="text-xs">
                      {entry.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>

        {/* Account Summary */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">科目余额</h3>
          <div className="space-y-3">
            {accountSummary.map((account) => (
              <div key={account.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${account.type === "资产" ? "bg-success" : "bg-warning"}`} />
                  <span className="text-sm">{account.name}</span>
                </div>
                <span className={`font-medium ${account.type === "资产" ? "text-success" : "text-warning"}`}>
                  ¥{account.balance.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">资产合计</span>
              <span className="font-bold text-success">¥3,475,000</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground">负债合计</span>
              <span className="font-bold text-warning">¥633,000</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AccountingTab;
