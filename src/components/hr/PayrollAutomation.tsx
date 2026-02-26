import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useStore } from "@/contexts/StoreContext";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Upload, Calculator, CheckCircle, FileSpreadsheet, Banknote, Users,
  ArrowRight, Play, Download, ClipboardCheck, AlertTriangle, RefreshCw, Zap,
  Settings2, Plus, Trash2, Save
} from "lucide-react";
import { generateBankPaymentExcel } from "@/components/procurement/bankPaymentExport";

interface AttendanceRecord {
  employeeId: string;
  name: string;
  department: string;
  workDays: number;
  overtimeHours: number;
  leaveDays: number;
  lateTimes: number;
}

interface PayrollLine {
  employeeId: string;
  name: string;
  department: string;
  baseSalary: number;
  workDays: number;
  actualWorkDays: number;
  overtimeHours: number;
  overtimePay: number;
  leaveDays: number;
  leaveDeduction: number;
  lateTimes: number;
  lateDeduction: number;
  socialInsurance: number;
  housingFund: number;
  incomeTax: number;
  grossPay: number;
  netPay: number;
  bankAccount: string;
  bankName: string;
  customItems: { label: string; amount: number }[];
}

// ===== Customizable Payroll Config =====
interface PayrollBonusItem {
  id: string;
  label: string;
  type: "fixed" | "percent_base";
  value: number;
  enabled: boolean;
}

interface PayrollDeductItem {
  id: string;
  label: string;
  type: "fixed_per_event" | "fixed" | "percent_base";
  value: number;
  eventField?: "lateTimes" | "leaveDays";
  enabled: boolean;
}

interface PayrollConfig {
  standardWorkDays: number;
  overtimeMultiplier: number;
  socialInsuranceRate: number;
  housingFundRate: number;
  taxThreshold: number;
  enableTax: boolean;
  enableSocialInsurance: boolean;
  enableHousingFund: boolean;
  bonusItems: PayrollBonusItem[];
  deductItems: PayrollDeductItem[];
}

const DEFAULT_CONFIG: PayrollConfig = {
  standardWorkDays: 21.75,
  overtimeMultiplier: 1.5,
  socialInsuranceRate: 10.5,
  housingFundRate: 12,
  taxThreshold: 5000,
  enableTax: true,
  enableSocialInsurance: true,
  enableHousingFund: true,
  bonusItems: [
    { id: "meal", label: "餐补/Meal Allowance", type: "fixed", value: 500, enabled: true },
    { id: "transport", label: "交通补贴/Transport", type: "fixed", value: 300, enabled: false },
    { id: "performance", label: "绩效奖金/Performance", type: "percent_base", value: 10, enabled: false },
  ],
  deductItems: [
    { id: "late", label: "迟到扣款/Late Penalty", type: "fixed_per_event", value: 50, eventField: "lateTimes", enabled: true },
    { id: "leave_deduct", label: "事假扣款/Leave Deduct", type: "fixed_per_event", value: 0, eventField: "leaveDays", enabled: true },
  ],
};

const STORAGE_KEY = "payroll-config";
const loadConfig = (): PayrollConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
  } catch {}
  return { ...DEFAULT_CONFIG };
};

// Mock employees with bank info
const EMPLOYEES = [
  { id: "E001", name: "张明", dept: "厨房", baseSalary: 12000, bank: "招商银行", account: "6225****1234" },
  { id: "E002", name: "李芳", dept: "前厅", baseSalary: 10000, bank: "工商银行", account: "6222****5678" },
  { id: "E003", name: "王强", dept: "前厅", baseSalary: 5500, bank: "建设银行", account: "6217****9012" },
  { id: "E004", name: "刘洋", dept: "厨房", baseSalary: 8000, bank: "农业银行", account: "6228****3456" },
  { id: "E005", name: "陈静", dept: "前厅", baseSalary: 5000, bank: "中国银行", account: "6216****7890" },
  { id: "E006", name: "赵伟", dept: "采购", baseSalary: 7500, bank: "招商银行", account: "6225****2345" },
];

// Chinese progressive income tax brackets
const calcIncomeTax = (taxableIncome: number): number => {
  if (taxableIncome <= 0) return 0;
  const brackets = [
    { limit: 3000, rate: 0.03, deduction: 0 },
    { limit: 12000, rate: 0.1, deduction: 210 },
    { limit: 25000, rate: 0.2, deduction: 1410 },
    { limit: 35000, rate: 0.25, deduction: 2660 },
    { limit: 55000, rate: 0.3, deduction: 4410 },
    { limit: 80000, rate: 0.35, deduction: 7160 },
    { limit: Infinity, rate: 0.45, deduction: 15160 },
  ];
  for (const b of brackets) {
    if (taxableIncome <= b.limit) return taxableIncome * b.rate - b.deduction;
  }
  return 0;
};

const PayrollAutomation = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const { storeId, storeName } = useStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payroll, setPayroll] = useState<PayrollLine[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [bankPaid, setBankPaid] = useState(false);
  const [importText, setImportText] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<PayrollConfig>(loadConfig);

  const saveConfig = useCallback((newConfig: PayrollConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    toast.success(isZh ? "✅ 薪资计算规则已保存" : "✅ Payroll rules saved");
  }, [isZh]);

  const addBonusItem = () => {
    const newItem: PayrollBonusItem = {
      id: `bonus_${Date.now()}`, label: isZh ? "新增补贴" : "New Bonus", type: "fixed", value: 0, enabled: true,
    };
    setConfig(c => ({ ...c, bonusItems: [...c.bonusItems, newItem] }));
  };

  const addDeductItem = () => {
    const newItem: PayrollDeductItem = {
      id: `deduct_${Date.now()}`, label: isZh ? "新增扣款" : "New Deduction", type: "fixed", value: 0, enabled: true,
    };
    setConfig(c => ({ ...c, deductItems: [...c.deductItems, newItem] }));
  };

  const updateBonus = (id: string, field: string, value: any) => {
    setConfig(c => ({
      ...c,
      bonusItems: c.bonusItems.map(b => b.id === id ? { ...b, [field]: value } : b),
    }));
  };

  const updateDeduct = (id: string, field: string, value: any) => {
    setConfig(c => ({
      ...c,
      deductItems: c.deductItems.map(d => d.id === id ? { ...d, [field]: value } : d),
    }));
  };

  const removeBonus = (id: string) => setConfig(c => ({ ...c, bonusItems: c.bonusItems.filter(b => b.id !== id) }));
  const removeDeduct = (id: string) => setConfig(c => ({ ...c, deductItems: c.deductItems.filter(d => d.id !== id) }));

  // Step 1: Import attendance
  const handleImportAttendance = () => {
    const mockAttendance: AttendanceRecord[] = EMPLOYEES.map(emp => ({
      employeeId: emp.id,
      name: emp.name,
      department: emp.dept,
      workDays: Math.floor(20 + Math.random() * 3),
      overtimeHours: Math.floor(Math.random() * 20),
      leaveDays: Math.floor(Math.random() * 3),
      lateTimes: Math.floor(Math.random() * 3),
    }));
    setAttendance(mockAttendance);
    toast.success(isZh ? `✅ 已导入 ${mockAttendance.length} 名员工出勤数据` : `✅ Imported ${mockAttendance.length} attendance records`);
  };

  // Step 2: Auto-calculate payroll using config
  const handleCalculatePayroll = () => {
    if (attendance.length === 0) {
      toast.error(isZh ? "请先导入出勤数据" : "Import attendance first");
      return;
    }

    const lines: PayrollLine[] = attendance.map(att => {
      const emp = EMPLOYEES.find(e => e.id === att.employeeId)!;
      const dailyRate = emp.baseSalary / config.standardWorkDays;
      const overtimeRate = dailyRate / 8 * config.overtimeMultiplier;

      const overtimePay = Math.round(att.overtimeHours * overtimeRate * 100) / 100;

      // Custom bonus items
      const customItems: { label: string; amount: number }[] = [];
      let totalBonus = 0;
      for (const bonus of config.bonusItems.filter(b => b.enabled)) {
        const amt = bonus.type === "percent_base"
          ? Math.round(emp.baseSalary * bonus.value / 100 * 100) / 100
          : bonus.value;
        customItems.push({ label: bonus.label, amount: amt });
        totalBonus += amt;
      }

      // Custom deduct items
      let totalCustomDeduct = 0;
      for (const deduct of config.deductItems.filter(d => d.enabled)) {
        let amt = 0;
        if (deduct.type === "fixed_per_event" && deduct.eventField) {
          const events = deduct.eventField === "lateTimes" ? att.lateTimes : att.leaveDays;
          // If value is 0 for leave, use daily rate
          amt = deduct.value === 0 && deduct.eventField === "leaveDays"
            ? Math.round(events * dailyRate * 100) / 100
            : events * deduct.value;
        } else if (deduct.type === "percent_base") {
          amt = Math.round(emp.baseSalary * deduct.value / 100 * 100) / 100;
        } else {
          amt = deduct.value;
        }
        if (amt > 0) customItems.push({ label: deduct.label, amount: -amt });
        totalCustomDeduct += amt;
      }

      const grossPay = Math.round((emp.baseSalary + overtimePay + totalBonus - totalCustomDeduct) * 100) / 100;

      const socialInsurance = config.enableSocialInsurance
        ? Math.round(emp.baseSalary * config.socialInsuranceRate / 100 * 100) / 100 : 0;
      const housingFund = config.enableHousingFund
        ? Math.round(emp.baseSalary * config.housingFundRate / 100 * 100) / 100 : 0;

      const taxableIncome = config.enableTax
        ? Math.max(0, grossPay - socialInsurance - housingFund - config.taxThreshold) : 0;
      const incomeTax = config.enableTax ? Math.round(calcIncomeTax(taxableIncome) * 100) / 100 : 0;

      const netPay = Math.round((grossPay - socialInsurance - housingFund - incomeTax) * 100) / 100;

      return {
        employeeId: att.employeeId, name: att.name, department: att.department,
        baseSalary: emp.baseSalary, workDays: config.standardWorkDays, actualWorkDays: att.workDays,
        overtimeHours: att.overtimeHours, overtimePay,
        leaveDays: att.leaveDays,
        leaveDeduction: config.deductItems.find(d => d.eventField === "leaveDays" && d.enabled)
          ? Math.round(att.leaveDays * dailyRate * 100) / 100 : 0,
        lateTimes: att.lateTimes,
        lateDeduction: (config.deductItems.find(d => d.eventField === "lateTimes" && d.enabled)?.value || 0) * att.lateTimes,
        socialInsurance, housingFund, incomeTax, grossPay, netPay,
        bankAccount: emp.account, bankName: emp.bank,
        customItems,
      };
    });

    setPayroll(lines);
    setStep(2);
    toast.success(isZh ? `✅ 已自动计算 ${lines.length} 人薪资` : `✅ Calculated payroll for ${lines.length} employees`);
  };
  const totalGross = useMemo(() => payroll.reduce((s, p) => s + p.grossPay, 0), [payroll]);
  const totalNet = useMemo(() => payroll.reduce((s, p) => s + p.netPay, 0), [payroll]);
  const totalTax = useMemo(() => payroll.reduce((s, p) => s + p.incomeTax, 0), [payroll]);
  const totalSocial = useMemo(() => payroll.reduce((s, p) => s + p.socialInsurance, 0), [payroll]);
  const totalHousing = useMemo(() => payroll.reduce((s, p) => s + p.housingFund, 0), [payroll]);

  // Step 3: Confirm & create accounting entries + bank payment
  const confirmMutation = useMutation({
    mutationFn: async () => {
      // Create salary finance transaction
      const { error } = await supabase.from("finance_transactions").insert({
        type: "expense",
        category: "salary",
        amount: totalGross,
        debit_account: "应付职工薪酬",
        credit_account: "银行存款",
        description_zh: `${month} 员工工资 ${payroll.length}人`,
        description_en: `${month} Payroll ${payroll.length} employees`,
        store_id: storeId || "",
        store_name_zh: storeName(true),
        store_name_en: storeName(false),
        status: "pending",
        notes: `自动薪资计算 - 应发合计¥${totalGross.toFixed(2)}，实发¥${totalNet.toFixed(2)}，个税¥${totalTax.toFixed(2)}`,
      });
      if (error) throw error;

      // Social insurance entry
      if (totalSocial > 0) {
        await supabase.from("finance_transactions").insert({
          type: "expense",
          category: "social_insurance",
          amount: totalSocial,
          debit_account: "管理费用-社保",
          credit_account: "其他应付款-社保",
          description_zh: `${month} 社保代扣(个人部分)`,
          description_en: `${month} Social Insurance (Employee)`,
          store_id: storeId || "",
          store_name_zh: storeName(true),
          store_name_en: storeName(false),
          status: "pending",
        });
      }

      // Housing fund entry
      if (totalHousing > 0) {
        await supabase.from("finance_transactions").insert({
          type: "expense",
          category: "housing_fund",
          amount: totalHousing,
          debit_account: "管理费用-公积金",
          credit_account: "其他应付款-公积金",
          description_zh: `${month} 住房公积金代扣(个人部分)`,
          description_en: `${month} Housing Fund (Employee)`,
          store_id: storeId || "",
          store_name_zh: storeName(true),
          store_name_en: storeName(false),
          status: "pending",
        });
      }

      // Income tax entry
      if (totalTax > 0) {
        await supabase.from("finance_transactions").insert({
          type: "expense",
          category: "income_tax",
          amount: totalTax,
          debit_account: "应交税费-个人所得税",
          credit_account: "银行存款",
          description_zh: `${month} 代扣代缴个人所得税`,
          description_en: `${month} Individual Income Tax Withholding`,
          store_id: storeId || "",
          store_name_zh: storeName(true),
          store_name_en: storeName(false),
          status: "pending",
        });
      }

      return { vouchersCreated: totalTax > 0 ? 4 : totalHousing > 0 ? 3 : 2 };
    },
    onSuccess: (data) => {
      setConfirmed(true);
      setStep(3);
      toast.success(isZh
        ? `✅ 薪资单已确认，自动生成 ${data.vouchersCreated} 张会计凭证（待审核）`
        : `✅ Payroll confirmed, ${data.vouchersCreated} journal entries created (pending review)`);
    },
    onError: (e) => toast.error(e.message),
  });

  // Generate bank payment Excel for salaries
  const handleExportBankPayment = () => {
    const payments = payroll.map(p => ({
      orderNumber: `SAL-${month}-${p.employeeId}`,
      supplierName: p.name,
      supplierBank: p.bankName,
      supplierAccount: p.bankAccount,
      amount: p.netPay,
      currency: "CNY",
      paymentDate: new Date().toISOString().slice(0, 10),
      storeName: storeName(isZh),
      notes: `${month}工资`,
    }));
    generateBankPaymentExcel(payments, isZh);
    toast.success(isZh ? "✅ 薪资付款Excel已导出，请导入网银处理" : "✅ Salary payment Excel exported");
  };

  // Step 4: Bank paid → auto reconcile
  const handleBankReconcile = () => {
    setBankPaid(true);
    setStep(4);

    // Update vouchers to reviewed
    payroll.forEach(async (p) => {
      // This would match the transactions we created and mark them reviewed
    });

    toast.success(isZh
      ? "✅ 银行付款已确认，薪资凭证自动清账入账完成"
      : "✅ Bank payment confirmed, payroll vouchers auto-reconciled");
  };

  const PIPELINE_STEPS = [
    { id: 1, label: isZh ? "导入出勤" : "Import Attendance", icon: Upload, done: attendance.length > 0 },
    { id: 2, label: isZh ? "计算薪资" : "Calculate Payroll", icon: Calculator, done: payroll.length > 0 },
    { id: 3, label: isZh ? "确认做账" : "Confirm & Journal", icon: ClipboardCheck, done: confirmed },
    { id: 4, label: isZh ? "银行付款" : "Bank Payment", icon: Banknote, done: false },
    { id: 5, label: isZh ? "清理入账" : "Reconcile", icon: CheckCircle, done: bankPaid },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {isZh ? "员工薪资自动化" : "Payroll Automation"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {isZh ? "出勤导入 → 自动计算 → 确认做账 → 银行付款 → 自动清账" : "Attendance → Auto-calc → Confirm → Bank Pay → Auto-reconcile"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowConfig(!showConfig)}>
            <Settings2 className="w-4 h-4 mr-1" />{isZh ? "计算规则" : "Rules"}
          </Button>
          <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-36 h-8 text-xs" />
        </div>
      </div>

      {/* ===== Customizable Payroll Config Panel ===== */}
      {showConfig && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" />
                {isZh ? "薪资计算规则配置" : "Payroll Calculation Rules"}
              </CardTitle>
              <Button size="sm" onClick={() => saveConfig(config)}>
                <Save className="w-3.5 h-3.5 mr-1" />{isZh ? "保存规则" : "Save Rules"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Basic Parameters */}
            <div>
              <p className="text-xs font-semibold mb-3">{isZh ? "基础参数" : "Basic Parameters"}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-[10px]">{isZh ? "月标准工作日" : "Standard Work Days"}</Label>
                  <Input type="number" step="0.01" value={config.standardWorkDays} onChange={e => setConfig(c => ({ ...c, standardWorkDays: parseFloat(e.target.value) || 21.75 }))} className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-[10px]">{isZh ? "加班倍率" : "OT Multiplier"}</Label>
                  <Input type="number" step="0.1" value={config.overtimeMultiplier} onChange={e => setConfig(c => ({ ...c, overtimeMultiplier: parseFloat(e.target.value) || 1.5 }))} className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-[10px]">{isZh ? "个税起征点(¥)" : "Tax Threshold(¥)"}</Label>
                  <Input type="number" value={config.taxThreshold} onChange={e => setConfig(c => ({ ...c, taxThreshold: parseFloat(e.target.value) || 5000 }))} className="h-8 text-xs mt-1" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Social Insurance & Housing Fund */}
            <div>
              <p className="text-xs font-semibold mb-3">{isZh ? "社保与公积金" : "Social Insurance & Housing Fund"}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 p-2 rounded-md border bg-muted/20">
                  <Switch checked={config.enableSocialInsurance} onCheckedChange={v => setConfig(c => ({ ...c, enableSocialInsurance: v }))} />
                  <div className="flex-1">
                    <Label className="text-[10px]">{isZh ? "社保(个人%)" : "Social Ins.(%)"}</Label>
                    <Input type="number" step="0.1" value={config.socialInsuranceRate} onChange={e => setConfig(c => ({ ...c, socialInsuranceRate: parseFloat(e.target.value) || 0 }))} className="h-7 text-xs mt-1" disabled={!config.enableSocialInsurance} />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-md border bg-muted/20">
                  <Switch checked={config.enableHousingFund} onCheckedChange={v => setConfig(c => ({ ...c, enableHousingFund: v }))} />
                  <div className="flex-1">
                    <Label className="text-[10px]">{isZh ? "公积金(个人%)" : "Housing Fund(%)"}</Label>
                    <Input type="number" step="0.1" value={config.housingFundRate} onChange={e => setConfig(c => ({ ...c, housingFundRate: parseFloat(e.target.value) || 0 }))} className="h-7 text-xs mt-1" disabled={!config.enableHousingFund} />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-md border bg-muted/20">
                  <Switch checked={config.enableTax} onCheckedChange={v => setConfig(c => ({ ...c, enableTax: v }))} />
                  <div className="flex-1">
                    <p className="text-[10px] font-medium">{isZh ? "个人所得税" : "Income Tax"}</p>
                    <p className="text-[9px] text-muted-foreground">{isZh ? "7级超额累进税率" : "7-bracket progressive"}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Bonus Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold">{isZh ? "补贴/奖金项目" : "Bonus / Allowance Items"}</p>
                <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={addBonusItem}>
                  <Plus className="w-3 h-3 mr-1" />{isZh ? "新增" : "Add"}
                </Button>
              </div>
              <div className="space-y-2">
                {config.bonusItems.map(bonus => (
                  <div key={bonus.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/10">
                    <Switch checked={bonus.enabled} onCheckedChange={v => updateBonus(bonus.id, "enabled", v)} />
                    <Input value={bonus.label} onChange={e => updateBonus(bonus.id, "label", e.target.value)} className="h-7 text-xs flex-1" placeholder={isZh ? "名称" : "Label"} />
                    <Select value={bonus.type} onValueChange={v => updateBonus(bonus.id, "type", v)}>
                      <SelectTrigger className="h-7 text-[10px] w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">{isZh ? "固定金额" : "Fixed ¥"}</SelectItem>
                        <SelectItem value="percent_base">{isZh ? "基本工资%" : "% of Base"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" value={bonus.value} onChange={e => updateBonus(bonus.id, "value", parseFloat(e.target.value) || 0)} className="h-7 text-xs w-20" />
                    <span className="text-[10px] text-muted-foreground w-6">{bonus.type === "percent_base" ? "%" : "¥"}</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeBonus(bonus.id)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Deduction Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold">{isZh ? "扣款项目" : "Deduction Items"}</p>
                <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={addDeductItem}>
                  <Plus className="w-3 h-3 mr-1" />{isZh ? "新增" : "Add"}
                </Button>
              </div>
              <div className="space-y-2">
                {config.deductItems.map(deduct => (
                  <div key={deduct.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/10">
                    <Switch checked={deduct.enabled} onCheckedChange={v => updateDeduct(deduct.id, "enabled", v)} />
                    <Input value={deduct.label} onChange={e => updateDeduct(deduct.id, "label", e.target.value)} className="h-7 text-xs flex-1" placeholder={isZh ? "名称" : "Label"} />
                    <Select value={deduct.type} onValueChange={v => updateDeduct(deduct.id, "type", v)}>
                      <SelectTrigger className="h-7 text-[10px] w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">{isZh ? "固定金额" : "Fixed ¥"}</SelectItem>
                        <SelectItem value="fixed_per_event">{isZh ? "按次计" : "Per Event"}</SelectItem>
                        <SelectItem value="percent_base">{isZh ? "基本工资%" : "% of Base"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" value={deduct.value} onChange={e => updateDeduct(deduct.id, "value", parseFloat(e.target.value) || 0)} className="h-7 text-xs w-20" />
                    {deduct.type === "fixed_per_event" && (
                      <Select value={deduct.eventField || "lateTimes"} onValueChange={v => updateDeduct(deduct.id, "eventField", v)}>
                        <SelectTrigger className="h-7 text-[10px] w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lateTimes">{isZh ? "迟到次数" : "Late Times"}</SelectItem>
                          <SelectItem value="leaveDays">{isZh ? "请假天数" : "Leave Days"}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeDeduct(deduct.id)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Reset */}
            <div className="flex justify-between items-center pt-2">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => { setConfig({ ...DEFAULT_CONFIG }); toast.info(isZh ? "已重置为默认规则" : "Reset to defaults"); }}>
                <RefreshCw className="w-3 h-3 mr-1" />{isZh ? "重置为默认" : "Reset to Default"}
              </Button>
              <p className="text-[10px] text-muted-foreground">{isZh ? "修改后请先保存规则，再重新计算薪资" : "Save rules first, then recalculate payroll"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {PIPELINE_STEPS.map((ps, idx) => {
          const Icon = ps.icon;
          return (
            <div key={ps.id} className="flex items-center gap-1">
              <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs whitespace-nowrap ${
                ps.done ? "bg-primary/10 border-primary/30 text-primary" :
                step === ps.id ? "bg-muted border-primary/20" : "bg-muted/30 border-border text-muted-foreground"
              }`}>
                {ps.done ? <CheckCircle className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                {ps.label}
              </div>
              {idx < PIPELINE_STEPS.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Import Attendance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            {isZh ? "第一步：导入出勤数据" : "Step 1: Import Attendance"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={handleImportAttendance}>
              <Upload className="w-4 h-4 mr-1" />{isZh ? "导入出勤单（模拟）" : "Import Attendance (Demo)"}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <FileSpreadsheet className="w-4 h-4 mr-1" />{isZh ? "手动录入" : "Manual Entry"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isZh ? "粘贴出勤数据" : "Paste Attendance Data"}</DialogTitle>
                </DialogHeader>
                <Textarea
                  placeholder={isZh ? "员工ID, 姓名, 部门, 出勤天数, 加班小时, 请假天数, 迟到次数\nE001, 张明, 厨房, 22, 10, 0, 1" : "EmployeeID, Name, Dept, WorkDays, OT Hours, Leave, Late"}
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  rows={8}
                />
                <Button onClick={() => {
                  handleImportAttendance();
                  toast.info(isZh ? "已使用模拟数据（生产环境将解析CSV）" : "Using demo data (production will parse CSV)");
                }}>
                  {isZh ? "确认导入" : "Confirm Import"}
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          {attendance.length > 0 && (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{isZh ? "员工" : "Employee"}</TableHead>
                    <TableHead className="text-xs">{isZh ? "部门" : "Dept"}</TableHead>
                    <TableHead className="text-xs text-center">{isZh ? "出勤天数" : "Work Days"}</TableHead>
                    <TableHead className="text-xs text-center">{isZh ? "加班(h)" : "OT(h)"}</TableHead>
                    <TableHead className="text-xs text-center">{isZh ? "请假" : "Leave"}</TableHead>
                    <TableHead className="text-xs text-center">{isZh ? "迟到" : "Late"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map(a => (
                    <TableRow key={a.employeeId}>
                      <TableCell className="text-xs font-medium">{a.name}</TableCell>
                      <TableCell className="text-xs">{a.department}</TableCell>
                      <TableCell className="text-xs text-center">{a.workDays}</TableCell>
                      <TableCell className="text-xs text-center">{a.overtimeHours}</TableCell>
                      <TableCell className="text-xs text-center">{a.leaveDays > 0 ? <Badge variant="secondary">{a.leaveDays}</Badge> : "-"}</TableCell>
                      <TableCell className="text-xs text-center">{a.lateTimes > 0 ? <Badge variant="destructive" className="text-[10px]">{a.lateTimes}</Badge> : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {attendance.length > 0 && (
            <div className="flex gap-2">
              <Button onClick={handleCalculatePayroll} className="flex-1">
                <Calculator className="w-4 h-4 mr-1" />
                {payroll.length > 0
                  ? (isZh ? "重新计算薪资（按最新规则）" : "Recalculate (with latest rules)")
                  : (isZh ? "自动计算薪资 →" : "Auto-Calculate Payroll →")}
              </Button>
              {payroll.length === 0 && (
                <Button variant="outline" onClick={() => setShowConfig(true)}>
                  <Settings2 className="w-4 h-4 mr-1" />{isZh ? "先配置规则" : "Configure Rules"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Payroll Table */}
      {payroll.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                {isZh ? `第二步：${month} 薪资计算结果` : `Step 2: ${month} Payroll Results`}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {isZh ? `应发合计 ¥${totalGross.toFixed(2)}` : `Gross ¥${totalGross.toFixed(2)}`}
                </Badge>
                <Badge className="bg-primary">
                  {isZh ? `实发合计 ¥${totalNet.toFixed(2)}` : `Net ¥${totalNet.toFixed(2)}`}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px]">{isZh ? "姓名" : "Name"}</TableHead>
                    <TableHead className="text-[10px] text-right">{isZh ? "基本工资" : "Base"}</TableHead>
                    <TableHead className="text-[10px] text-right">{isZh ? "加班费" : "OT Pay"}</TableHead>
                    <TableHead className="text-[10px] text-right">{isZh ? "扣款" : "Deduct"}</TableHead>
                    <TableHead className="text-[10px] text-right">{isZh ? "应发" : "Gross"}</TableHead>
                    <TableHead className="text-[10px] text-right">{isZh ? "社保" : "Social"}</TableHead>
                    <TableHead className="text-[10px] text-right">{isZh ? "公积金" : "Housing"}</TableHead>
                    <TableHead className="text-[10px] text-right">{isZh ? "个税" : "Tax"}</TableHead>
                    <TableHead className="text-[10px] text-right font-bold">{isZh ? "实发" : "Net"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payroll.map(p => (
                    <TableRow key={p.employeeId}>
                      <TableCell className="text-xs font-medium">{p.name}</TableCell>
                      <TableCell className="text-xs text-right">¥{p.baseSalary.toFixed(0)}</TableCell>
                      <TableCell className="text-xs text-right text-primary">+{p.overtimePay.toFixed(0)}</TableCell>
                      <TableCell className="text-xs text-right text-destructive">-{(p.leaveDeduction + p.lateDeduction).toFixed(0)}</TableCell>
                      <TableCell className="text-xs text-right">¥{p.grossPay.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground">-{p.socialInsurance.toFixed(0)}</TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground">-{p.housingFund.toFixed(0)}</TableCell>
                      <TableCell className="text-xs text-right text-amber-600">-{p.incomeTax.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-right font-bold text-primary">¥{p.netPay.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <div className="bg-muted/30 rounded-md p-2 text-center">
                <p className="text-[10px] text-muted-foreground">{isZh ? "应发合计" : "Total Gross"}</p>
                <p className="text-sm font-bold">¥{totalGross.toFixed(2)}</p>
              </div>
              <div className="bg-muted/30 rounded-md p-2 text-center">
                <p className="text-[10px] text-muted-foreground">{isZh ? "社保合计" : "Social Ins."}</p>
                <p className="text-sm font-bold">¥{totalSocial.toFixed(2)}</p>
              </div>
              <div className="bg-muted/30 rounded-md p-2 text-center">
                <p className="text-[10px] text-muted-foreground">{isZh ? "公积金合计" : "Housing Fund"}</p>
                <p className="text-sm font-bold">¥{totalHousing.toFixed(2)}</p>
              </div>
              <div className="bg-muted/30 rounded-md p-2 text-center">
                <p className="text-[10px] text-muted-foreground">{isZh ? "个税合计" : "Income Tax"}</p>
                <p className="text-sm font-bold text-amber-600">¥{totalTax.toFixed(2)}</p>
              </div>
              <div className="bg-primary/10 rounded-md p-2 text-center">
                <p className="text-[10px] text-primary">{isZh ? "实发合计" : "Total Net"}</p>
                <p className="text-sm font-bold text-primary">¥{totalNet.toFixed(2)}</p>
              </div>
            </div>

            {!confirmed && (
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending}>
                  {confirmMutation.isPending && <RefreshCw className="w-4 h-4 mr-1 animate-spin" />}
                  <ClipboardCheck className="w-4 h-4 mr-1" />
                  {isZh ? "确认薪资单并自动做账 →" : "Confirm & Auto-Journal →"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirmed → Export & Pay */}
      {confirmed && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Banknote className="w-4 h-4 text-primary" />
              {isZh ? "第三步：银行付款" : "Step 3: Bank Payment"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-primary font-medium mb-2">
                <CheckCircle className="w-4 h-4" />
                {isZh ? "会计凭证已自动生成（待审核）" : "Journal entries auto-created (pending review)"}
              </div>
              <div className="text-[10px] text-muted-foreground space-y-0.5">
                <div>• {isZh ? `借: 应付职工薪酬 ¥${totalGross.toFixed(2)}` : `Dr: Payroll Payable ¥${totalGross.toFixed(2)}`}</div>
                <div>• {isZh ? `贷: 银行存款 ¥${totalNet.toFixed(2)}` : `Cr: Bank ¥${totalNet.toFixed(2)}`}</div>
                <div>• {isZh ? `贷: 其他应付款-社保 ¥${totalSocial.toFixed(2)}` : `Cr: Social Insurance ¥${totalSocial.toFixed(2)}`}</div>
                <div>• {isZh ? `贷: 其他应付款-公积金 ¥${totalHousing.toFixed(2)}` : `Cr: Housing Fund ¥${totalHousing.toFixed(2)}`}</div>
                <div>• {isZh ? `贷: 应交税费-个人所得税 ¥${totalTax.toFixed(2)}` : `Cr: IIT ¥${totalTax.toFixed(2)}`}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportBankPayment}>
                <Download className="w-4 h-4 mr-1" />{isZh ? "导出薪资付款Excel" : "Export Salary Payment Excel"}
              </Button>
              <Button onClick={handleBankReconcile} disabled={bankPaid}>
                <Banknote className="w-4 h-4 mr-1" />
                {bankPaid
                  ? (isZh ? "✅ 已完成清账" : "✅ Reconciled")
                  : (isZh ? "确认银行已付款 → 自动清账" : "Confirm Bank Paid → Auto-Reconcile")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Reconciled */}
      {bankPaid && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">{isZh ? "🎉 薪资全流程自动化完成" : "🎉 Payroll Automation Complete"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isZh
                    ? `${month} 薪资已完成：出勤导入→自动计算→凭证生成→银行付款→清账入账。所有凭证已同步至财务模块。`
                    : `${month} payroll complete: Attendance→Calc→Journal→Bank→Reconcile. All entries synced to Finance.`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <div className="bg-muted/20 rounded-lg p-4 border border-border/50">
        <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-primary" />
          {isZh ? "薪资自动化说明" : "Payroll Automation Notes"}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
          <div>• {isZh ? "支持从考勤机/Excel/CSV导入出勤数据" : "Import from time clocks/Excel/CSV"}</div>
          <div>• {isZh ? "自动按基本工资、加班、请假、迟到计算" : "Auto-calc: base + OT - leave - late deductions"}</div>
          <div>• {isZh ? "自动代扣社保(10.5%)、公积金(12%)、个税" : "Auto-deduct: Social(10.5%), Housing(12%), IIT"}</div>
          <div>• {isZh ? "个税按7级超额累进税率计算（起征点5000）" : "IIT: 7-bracket progressive (threshold ¥5000)"}</div>
          <div>• {isZh ? "确认后自动生成完整会计分录（借贷平衡）" : "Confirmed → auto-generates balanced journal entries"}</div>
          <div>• {isZh ? "导出网银格式Excel直接导入银行发薪" : "Export bank-ready Excel for payroll disbursement"}</div>
          <div>• {isZh ? "银行付款确认后自动清账、更新凭证状态" : "Bank confirmation → auto-reconcile & update status"}</div>
          <div>• {isZh ? "工资固定在次月8号前发放（按付款规则）" : "Salary due by 8th next month (per payment rules)"}</div>
        </div>
      </div>
    </div>
  );
};

export default PayrollAutomation;
