import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Store, FileText, Download, CheckCircle, Clock, AlertTriangle, Building2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

// Per-store tax report mock data
const storesTaxData: Record<string, {
  storeNameZh: string;
  storeNameEn: string;
  vatReport: { outputTax: number; inputTax: number; payable: number; filedMonths: number; totalMonths: number };
  citReport: { taxableIncome: number; taxRate: number; taxDue: number; prepaid: number; status: string };
  iitReport: { employees: number; totalSalary: number; totalTax: number; avgRate: number };
  surcharges: { cityMaintenance: number; eduSurcharge: number; localEdu: number; stampDuty: number; propertyTax: number };
  invoiceSummary: { outputCount: number; outputAmount: number; inputCount: number; inputAmount: number; pendingCount: number };
  monthlyVAT: { month: string; output: number; input: number; payable: number }[];
  filingStatus: { taxType: string; period: string; deadline: string; status: string; amount: number }[];
}> = {
  "1": {
    storeNameZh: "旗舰店", storeNameEn: "Flagship - The Bund",
    vatReport: { outputTax: 156000, inputTax: 98000, payable: 58000, filedMonths: 11, totalMonths: 12 },
    citReport: { taxableIncome: 1850000, taxRate: 25, taxDue: 462500, prepaid: 380000, status: "预缴中" },
    iitReport: { employees: 45, totalSalary: 675000, totalTax: 48500, avgRate: 7.2 },
    surcharges: { cityMaintenance: 4060, eduSurcharge: 1740, localEdu: 1160, stampDuty: 890, propertyTax: 12500 },
    invoiceSummary: { outputCount: 486, outputAmount: 2600000, inputCount: 312, inputAmount: 1280000, pendingCount: 18 },
    monthlyVAT: [
      { month: "9月", output: 12800, input: 7600, payable: 5200 },
      { month: "10月", output: 13500, input: 8200, payable: 5300 },
      { month: "11月", output: 14200, input: 9100, payable: 5100 },
      { month: "12月", output: 15600, input: 9800, payable: 5800 },
      { month: "1月", output: 13800, input: 8500, payable: 5300 },
      { month: "2月", output: 14600, input: 9200, payable: 5400 },
    ],
    filingStatus: [
      { taxType: "增值税", period: "2026年2月", deadline: "2026-03-15", status: "待申报", amount: 5400 },
      { taxType: "企业所得税(预缴)", period: "2026年Q1", deadline: "2026-04-15", status: "待申报", amount: 82500 },
      { taxType: "个人所得税", period: "2026年2月", deadline: "2026-03-15", status: "已申报", amount: 48500 },
      { taxType: "城建税", period: "2026年2月", deadline: "2026-03-15", status: "已缴纳", amount: 378 },
      { taxType: "印花税", period: "2026年2月", deadline: "2026-03-15", status: "已缴纳", amount: 260 },
    ],
  },
  "2": {
    storeNameZh: "法租界店", storeNameEn: "French Concession",
    vatReport: { outputTax: 128000, inputTax: 82000, payable: 46000, filedMonths: 12, totalMonths: 12 },
    citReport: { taxableIncome: 1420000, taxRate: 25, taxDue: 355000, prepaid: 320000, status: "预缴中" },
    iitReport: { employees: 32, totalSalary: 480000, totalTax: 32800, avgRate: 6.8 },
    surcharges: { cityMaintenance: 3220, eduSurcharge: 1380, localEdu: 920, stampDuty: 720, propertyTax: 9800 },
    invoiceSummary: { outputCount: 368, outputAmount: 2130000, inputCount: 245, inputAmount: 960000, pendingCount: 12 },
    monthlyVAT: [
      { month: "9月", output: 10200, input: 6500, payable: 3700 },
      { month: "10月", output: 11000, input: 7200, payable: 3800 },
      { month: "11月", output: 10800, input: 6800, payable: 4000 },
      { month: "12月", output: 11500, input: 7100, payable: 4400 },
      { month: "1月", output: 10600, input: 6900, payable: 3700 },
      { month: "2月", output: 11200, input: 7000, payable: 4200 },
    ],
    filingStatus: [
      { taxType: "增值税", period: "2026年2月", deadline: "2026-03-15", status: "已申报", amount: 4200 },
      { taxType: "企业所得税(预缴)", period: "2026年Q1", deadline: "2026-04-15", status: "待申报", amount: 35000 },
      { taxType: "个人所得税", period: "2026年2月", deadline: "2026-03-15", status: "已缴纳", amount: 32800 },
      { taxType: "城建税", period: "2026年2月", deadline: "2026-03-15", status: "已缴纳", amount: 294 },
      { taxType: "印花税", period: "2026年2月", deadline: "2026-03-15", status: "已缴纳", amount: 210 },
    ],
  },
  "3": {
    storeNameZh: "静安店", storeNameEn: "Jing'an",
    vatReport: { outputTax: 98000, inputTax: 65000, payable: 33000, filedMonths: 10, totalMonths: 12 },
    citReport: { taxableIncome: 980000, taxRate: 25, taxDue: 245000, prepaid: 200000, status: "预缴中" },
    iitReport: { employees: 28, totalSalary: 392000, totalTax: 25600, avgRate: 6.5 },
    surcharges: { cityMaintenance: 2310, eduSurcharge: 990, localEdu: 660, stampDuty: 520, propertyTax: 7200 },
    invoiceSummary: { outputCount: 285, outputAmount: 1630000, inputCount: 198, inputAmount: 780000, pendingCount: 8 },
    monthlyVAT: [
      { month: "9月", output: 7800, input: 5100, payable: 2700 },
      { month: "10月", output: 8200, input: 5600, payable: 2600 },
      { month: "11月", output: 8500, input: 5400, payable: 3100 },
      { month: "12月", output: 8800, input: 5800, payable: 3000 },
      { month: "1月", output: 7600, input: 5200, payable: 2400 },
      { month: "2月", output: 8100, input: 5500, payable: 2600 },
    ],
    filingStatus: [
      { taxType: "增值税", period: "2026年2月", deadline: "2026-03-15", status: "待申报", amount: 2600 },
      { taxType: "企业所得税(预缴)", period: "2026年Q1", deadline: "2026-04-15", status: "待申报", amount: 45000 },
      { taxType: "个人所得税", period: "2026年2月", deadline: "2026-03-15", status: "已申报", amount: 25600 },
      { taxType: "城建税", period: "2026年2月", deadline: "2026-03-15", status: "已申报", amount: 182 },
      { taxType: "印花税", period: "2026年2月", deadline: "2026-03-15", status: "待申报", amount: 150 },
    ],
  },
  "4": {
    storeNameZh: "新天地店", storeNameEn: "Xintiandi",
    vatReport: { outputTax: 112000, inputTax: 72000, payable: 40000, filedMonths: 12, totalMonths: 12 },
    citReport: { taxableIncome: 1280000, taxRate: 25, taxDue: 320000, prepaid: 280000, status: "预缴中" },
    iitReport: { employees: 35, totalSalary: 525000, totalTax: 36200, avgRate: 6.9 },
    surcharges: { cityMaintenance: 2800, eduSurcharge: 1200, localEdu: 800, stampDuty: 650, propertyTax: 8500 },
    invoiceSummary: { outputCount: 342, outputAmount: 1870000, inputCount: 228, inputAmount: 890000, pendingCount: 15 },
    monthlyVAT: [
      { month: "9月", output: 9200, input: 5800, payable: 3400 },
      { month: "10月", output: 9800, input: 6200, payable: 3600 },
      { month: "11月", output: 9500, input: 6000, payable: 3500 },
      { month: "12月", output: 10200, input: 6500, payable: 3700 },
      { month: "1月", output: 9100, input: 5900, payable: 3200 },
      { month: "2月", output: 9600, input: 6100, payable: 3500 },
    ],
    filingStatus: [
      { taxType: "增值税", period: "2026年2月", deadline: "2026-03-15", status: "已申报", amount: 3500 },
      { taxType: "企业所得税(预缴)", period: "2026年Q1", deadline: "2026-04-15", status: "待申报", amount: 40000 },
      { taxType: "个人所得税", period: "2026年2月", deadline: "2026-03-15", status: "已缴纳", amount: 36200 },
      { taxType: "城建税", period: "2026年2月", deadline: "2026-03-15", status: "已缴纳", amount: 245 },
      { taxType: "印花税", period: "2026年2月", deadline: "2026-03-15", status: "已缴纳", amount: 190 },
    ],
  },
};

const COLORS = [
  "hsl(36, 90%, 55%)", "hsl(152, 60%, 45%)", "hsl(210, 70%, 55%)",
  "hsl(340, 70%, 55%)", "hsl(280, 60%, 55%)",
];

const TaxReportsTab = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const [selectedStore, setSelectedStore] = useState("1");

  const data = useMemo(() => storesTaxData[selectedStore], [selectedStore]);
  const fmt = (n: number) => `¥${n.toLocaleString()}`;

  const surchargeData = [
    { name: isZh ? "城建税" : "City Maintenance", value: data.surcharges.cityMaintenance },
    { name: isZh ? "教育费附加" : "Edu Surcharge", value: data.surcharges.eduSurcharge },
    { name: isZh ? "地方教育附加" : "Local Edu", value: data.surcharges.localEdu },
    { name: isZh ? "印花税" : "Stamp Duty", value: data.surcharges.stampDuty },
    { name: isZh ? "房产税" : "Property Tax", value: data.surcharges.propertyTax },
  ];
  const totalSurcharges = surchargeData.reduce((s, d) => s + d.value, 0);

  const pendingCount = data.filingStatus.filter(f => f.status === "待申报").length;

  return (
    <div className="space-y-6">
      {/* Store selector + header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold">{isZh ? "门店报税报表" : "Store Tax Reports"}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedStore} onValueChange={setSelectedStore}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(storesTaxData).map(([id, s]) => (
                <SelectItem key={id} value={id} className="text-xs">
                  {isZh ? s.storeNameZh : s.storeNameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <Download className="w-3 h-3" />
            {isZh ? "导出报税报表" : "Export Tax Report"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
        📋 {isZh
          ? `当前查看: ${data.storeNameZh} — 各门店独立出具报税报表，数据互不干扰。`
          : `Viewing: ${data.storeNameEn} — Each store generates tax reports independently.`}
      </p>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">{isZh ? "增值税应纳" : "VAT Payable"}</span>
          </div>
          <p className="text-xl font-bold">{fmt(data.vatReport.payable)}</p>
          <p className="text-[10px] text-muted-foreground">{isZh ? `已申报 ${data.vatReport.filedMonths}/${data.vatReport.totalMonths} 月` : `Filed ${data.vatReport.filedMonths}/${data.vatReport.totalMonths} months`}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-warning" />
            </div>
            <span className="text-xs text-muted-foreground">{isZh ? "企业所得税" : "CIT Due"}</span>
          </div>
          <p className="text-xl font-bold">{fmt(data.citReport.taxDue)}</p>
          <p className="text-[10px] text-muted-foreground">{isZh ? `已预缴 ${fmt(data.citReport.prepaid)}` : `Prepaid ${fmt(data.citReport.prepaid)}`}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
            <span className="text-xs text-muted-foreground">{isZh ? "个税代扣" : "IIT Withheld"}</span>
          </div>
          <p className="text-xl font-bold">{fmt(data.iitReport.totalTax)}</p>
          <p className="text-[10px] text-muted-foreground">{data.iitReport.employees}{isZh ? "人, 平均税率" : " employees, avg rate "}{data.iitReport.avgRate}%</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-info" />
            </div>
            <span className="text-xs text-muted-foreground">{isZh ? "附加税合计" : "Surcharges Total"}</span>
          </div>
          <p className="text-xl font-bold">{fmt(totalSurcharges)}</p>
          <p className="text-[10px] text-muted-foreground">{pendingCount}{isZh ? "项待申报" : " pending filings"}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* VAT Monthly Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 glass-card rounded-xl p-5">
          <h4 className="text-sm font-semibold mb-4">{isZh ? "增值税月度报表" : "Monthly VAT Report"}</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.monthlyVAT}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${(v / 10000).toFixed(1)}万`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                formatter={(value: number, name: string) => [fmt(value), name]}
              />
              <Bar dataKey="output" name={isZh ? "销项税" : "Output"} fill="hsl(36, 90%, 55%)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="input" name={isZh ? "进项税" : "Input"} fill="hsl(210, 70%, 55%)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="payable" name={isZh ? "应纳税" : "Payable"} fill="hsl(0, 72%, 55%)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Surcharges Pie */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
          <h4 className="text-sm font-semibold mb-3">{isZh ? "附加税构成" : "Surcharge Breakdown"}</h4>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={surchargeData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="value">
                {surchargeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                formatter={(v: number) => fmt(v)}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-1">
            {surchargeData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium">{fmt(item.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CIT Detail */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
          <h4 className="text-sm font-semibold mb-4">{isZh ? "企业所得税报表" : "Corporate Income Tax Report"}</h4>
          <div className="space-y-3">
            <div className="flex justify-between py-2 px-3 bg-muted/30 rounded-lg text-sm">
              <span>{isZh ? "应纳税所得额" : "Taxable Income"}</span>
              <span className="font-bold">{fmt(data.citReport.taxableIncome)}</span>
            </div>
            <div className="flex justify-between py-2 px-3 text-sm">
              <span className="text-muted-foreground">{isZh ? "适用税率" : "Tax Rate"}</span>
              <span>{data.citReport.taxRate}%</span>
            </div>
            <div className="flex justify-between py-2 px-3 bg-warning/10 rounded-lg text-sm">
              <span>{isZh ? "应纳税额" : "Tax Due"}</span>
              <span className="font-bold text-warning">{fmt(data.citReport.taxDue)}</span>
            </div>
            <div className="flex justify-between py-2 px-3 text-sm">
              <span className="text-muted-foreground">{isZh ? "已预缴" : "Prepaid"}</span>
              <span className="text-success">{fmt(data.citReport.prepaid)}</span>
            </div>
            <div className="flex justify-between py-2 px-3 bg-destructive/10 rounded-lg text-sm">
              <span className="font-medium">{isZh ? "汇算清缴差额" : "Settlement Balance"}</span>
              <span className="font-bold text-destructive">{fmt(data.citReport.taxDue - data.citReport.prepaid)}</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 text-sm">
              <span className="text-muted-foreground">{isZh ? "申报状态" : "Filing Status"}</span>
              <Badge variant="outline" className="text-xs">{data.citReport.status}</Badge>
            </div>
          </div>
        </motion.div>

        {/* IIT Detail */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-5">
          <h4 className="text-sm font-semibold mb-4">{isZh ? "个人所得税代扣报表" : "IIT Withholding Report"}</h4>
          <div className="space-y-3">
            <div className="flex justify-between py-2 px-3 bg-muted/30 rounded-lg text-sm">
              <span>{isZh ? "员工人数" : "Employees"}</span>
              <span className="font-bold">{data.iitReport.employees}{isZh ? "人" : ""}</span>
            </div>
            <div className="flex justify-between py-2 px-3 text-sm">
              <span className="text-muted-foreground">{isZh ? "本月工资总额" : "Total Salary"}</span>
              <span>{fmt(data.iitReport.totalSalary)}</span>
            </div>
            <div className="flex justify-between py-2 px-3 bg-primary/10 rounded-lg text-sm">
              <span>{isZh ? "代扣个税总额" : "Total IIT Withheld"}</span>
              <span className="font-bold text-primary">{fmt(data.iitReport.totalTax)}</span>
            </div>
            <div className="flex justify-between py-2 px-3 text-sm">
              <span className="text-muted-foreground">{isZh ? "人均税负率" : "Avg Tax Rate"}</span>
              <span>{data.iitReport.avgRate}%</span>
            </div>
            <div className="py-2 px-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{isZh ? "税负占工资比" : "Tax / Salary Ratio"}</span>
                <span>{((data.iitReport.totalTax / data.iitReport.totalSalary) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(data.iitReport.totalTax / data.iitReport.totalSalary) * 100} className="h-1.5" />
            </div>
          </div>

          {/* Invoice summary */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <h5 className="text-xs font-semibold mb-3">{isZh ? "发票汇总" : "Invoice Summary"}</h5>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-success/10 rounded-lg text-center">
                <p className="text-lg font-bold text-success">{data.invoiceSummary.outputCount}</p>
                <p className="text-[10px] text-muted-foreground">{isZh ? "销项发票" : "Output"}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg text-center">
                <p className="text-lg font-bold text-primary">{data.invoiceSummary.inputCount}</p>
                <p className="text-[10px] text-muted-foreground">{isZh ? "进项发票" : "Input"}</p>
              </div>
              <div className="p-2 bg-warning/10 rounded-lg text-center">
                <p className="text-lg font-bold text-warning">{data.invoiceSummary.pendingCount}</p>
                <p className="text-[10px] text-muted-foreground">{isZh ? "待认证" : "Pending"}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filing Status Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold">{isZh ? "本店申报状态" : "Store Filing Status"}</h4>
          <Badge variant={pendingCount > 0 ? "destructive" : "secondary"} className="text-xs">
            {pendingCount > 0 ? (
              <><AlertTriangle className="w-3 h-3 mr-1" />{pendingCount}{isZh ? "项待办" : " pending"}</>
            ) : (
              <><CheckCircle className="w-3 h-3 mr-1" />{isZh ? "全部完成" : "All Done"}</>
            )}
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isZh ? "税种" : "Tax Type"}</TableHead>
              <TableHead>{isZh ? "税期" : "Period"}</TableHead>
              <TableHead>{isZh ? "申报截止" : "Deadline"}</TableHead>
              <TableHead className="text-right">{isZh ? "金额" : "Amount"}</TableHead>
              <TableHead className="w-24">{t("common.status")}</TableHead>
              <TableHead className="w-20">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.filingStatus.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium text-sm">{item.taxType}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.period}</TableCell>
                <TableCell>
                  <span className={`text-sm ${item.status === "待申报" ? "text-warning" : "text-muted-foreground"}`}>
                    {item.deadline}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium text-sm">{fmt(item.amount)}</TableCell>
                <TableCell>
                  <Badge
                    variant={item.status === "已缴纳" ? "secondary" : item.status === "已申报" ? "outline" : "destructive"}
                    className="text-xs"
                  >
                    {item.status === "待申报" ? (isZh ? "待申报" : "Pending") : item.status === "已申报" ? (isZh ? "已申报" : "Filed") : (isZh ? "已缴纳" : "Paid")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.status === "待申报" && (
                    <Button variant="ghost" size="sm" className="text-xs h-7 px-2">{isZh ? "申报" : "File"}</Button>
                  )}
                  {item.status === "已申报" && (
                    <Button variant="ghost" size="sm" className="text-xs h-7 px-2">{isZh ? "缴款" : "Pay"}</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
};

export default TaxReportsTab;
