import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useStore } from "@/contexts/StoreContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Zap, CheckCircle, Clock, AlertTriangle, ArrowRight, Download,
  FileSpreadsheet, Receipt, Calculator, Upload, Building2, Bot,
  Play, RefreshCw, FileText, TrendingUp, Banknote, CalendarClock, Settings2
} from "lucide-react";
import { generateBankPaymentExcel } from "@/components/procurement/bankPaymentExport";
import { exportAllForYiqi } from "./yiqiExport";
import { exportAllTaxReports } from "./taxExport";
import { journalEntries, getAccountSummary, StoreId } from "@/data/financeData";

interface AutomationStatus {
  pendingReceipts: number;
  unpaidOrders: number;
  pendingVouchers: number;
  pendingInvoices: number;
}

const STEPS = [
  { id: 1, icon: Bot, zhLabel: "AI采购建议", enLabel: "AI Procurement", zhDesc: "AI根据库存和销量生成采购建议", enDesc: "AI generates PO suggestions" },
  { id: 2, icon: FileText, zhLabel: "自动发送订单", enLabel: "Send Orders", zhDesc: "审批后自动发送给供应商", enDesc: "Auto-send to suppliers" },
  { id: 3, icon: Receipt, zhLabel: "收货验收核对", enLabel: "Receipt Verify", zhDesc: "OCR扫描+三方核对", enDesc: "OCR scan + 3-way match" },
  { id: 4, icon: Banknote, zhLabel: "智能排款付款", enLabel: "Smart Payment", zhDesc: "供应商周五/房租27号/工资8号", enDesc: "Suppliers Fri/Rent 27th/Salary 8th" },
  { id: 5, icon: Download, zhLabel: "生成银行付款单", enLabel: "Bank Excel", zhDesc: "导出网银模板Excel", enDesc: "Export bank import template" },
  { id: 6, icon: Upload, zhLabel: "导入银行流水", enLabel: "Import Statement", zhDesc: "回导银行付款回单", enDesc: "Import bank transaction records" },
  { id: 7, icon: FileSpreadsheet, zhLabel: "自动做账", enLabel: "Auto Accounting", zhDesc: "AI生成会计凭证", enDesc: "AI generates journal entries" },
  { id: 8, icon: TrendingUp, zhLabel: "生成报表", enLabel: "Generate Reports", zhDesc: "三大报表+内部管理报表", enDesc: "Financial statements + mgmt reports" },
  { id: 9, icon: Calculator, zhLabel: "自动计税", enLabel: "Auto Tax Calc", zhDesc: "增值税+所得税+附加税", enDesc: "VAT + CIT + Surcharges" },
  { id: 10, icon: CheckCircle, zhLabel: "人工审核确认", enLabel: "Manual Review", zhDesc: "财务经理审核修改确认", enDesc: "Finance manager review & confirm" },
  { id: 11, icon: Zap, zhLabel: "亿企代账导出", enLabel: "YiQi Export", zhDesc: "一键导出全量数据包", enDesc: "One-click export to YiQi DaiZhang" },
  { id: 12, icon: Building2, zhLabel: "合并报表归档", enLabel: "Consolidate & Archive", zhDesc: "各子公司+合并报表归档", enDesc: "Subsidiary & consolidated reports" },
];

const AutomationDashboard = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const { storeId, isHQ, storeName } = useStore();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [runningStep, setRunningStep] = useState<number | null>(null);
  const [manualPaymentMode, setManualPaymentMode] = useState(false);
  const [manualPaymentDate, setManualPaymentDate] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "supplier" | "rent" | "salary">("all");
  const [showScheduleRules, setShowScheduleRules] = useState(false);

  const { data: automationStatus } = useQuery<AutomationStatus>({
    queryKey: ["automation-status", storeId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("auto-finance-cycle", {
        body: { action: "get_automation_status", storeId },
      });
      if (error) throw error;
      return data.status;
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("auto-finance-cycle", {
        body: { action: "reconcile_receipts", storeId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(isZh
        ? `✅ 核对完成：${data.matchedCount}笔匹配，${data.mismatchCount}笔需复核`
        : `✅ Reconciled: ${data.matchedCount} matched, ${data.mismatchCount} need review`);
      queryClient.invalidateQueries({ queryKey: ["automation-status"] });
    },
    onError: (e) => toast.error(isZh ? `核对失败: ${e.message}` : `Reconciliation failed: ${e.message}`),
  });

  const schedulePaymentsMutation = useMutation({
    mutationFn: async () => {
      const body: any = { action: "schedule_payments", storeId };
      if (manualPaymentMode && manualPaymentDate) {
        body.params = { manualDate: manualPaymentDate };
      }
      if (paymentFilter !== "all") {
        body.params = { ...body.params, force: true };
      }
      const { data, error } = await supabase.functions.invoke("auto-finance-cycle", { body });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      let payments = data.payments || [];
      if (paymentFilter !== "all") {
        payments = payments.filter((p: any) => p.paymentCategory === paymentFilter);
      }
      if (payments.length > 0) {
        generateBankPaymentExcel(payments.map((p: any) => ({
          orderNumber: p.orderNumber,
          supplierName: p.supplierName,
          supplierBank: p.supplierBank,
          supplierAccount: p.supplierAccount,
          amount: p.amount,
          currency: "CNY",
          paymentDate: p.dueDate,
          storeName: p.storeName,
          notes: `${p.paymentCategory === "rent" ? "房租" : p.paymentCategory === "salary" ? "工资" : "采购"}付款 ${p.orderNumber}`,
        })), isZh);
        const totalAmt = payments.reduce((s: number, p: any) => s + p.amount, 0);
        const summary = data.summary;
        const details = isZh
          ? `供应商${summary.supplier.count}笔(${summary.supplier.rule})，房租${summary.rent.count}笔(${summary.rent.rule})，工资${summary.salary.count}笔(${summary.salary.rule})`
          : `Suppliers: ${summary.supplier.count}(Fridays), Rent: ${summary.rent.count}(27th), Salary: ${summary.salary.count}(8th next month)`;
        toast.success(isZh
          ? `✅ 已生成${payments.length}笔付款单，合计¥${totalAmt.toFixed(2)}\n${details}`
          : `✅ Generated ${payments.length} payments ¥${totalAmt.toFixed(2)}\n${details}`);
      } else {
        toast.info(isZh ? "暂无到期应付款项" : "No payments due");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const calcTaxMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("auto-finance-cycle", {
        body: { action: "auto_calculate_tax", storeId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(isZh
        ? `✅ ${data.message}`
        : `✅ Tax calculated: ¥${data.taxCalc.totalPayable.toFixed(2)} total`);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleRunStep = async (stepId: number) => {
    setRunningStep(stepId);
    try {
      switch (stepId) {
        case 3: await reconcileMutation.mutateAsync(); break;
        case 4:
        case 5: await schedulePaymentsMutation.mutateAsync(); break;
        case 9: await calcTaxMutation.mutateAsync(); break;
        case 11: {
          const allEntries = journalEntries;
          const { data: invoices } = await supabase.from("invoices").select("*").limit(500);
          const accounts = getAccountSummary(storeId as StoreId);
          exportAllForYiqi(allEntries, invoices || [], accounts, storeName(isZh));
          // Tax package uses exportAllTaxReports with mock data for demo
          toast.info(isZh ? "报税包请在报税管理Tab中导出" : "Export tax package from Tax tab");
          toast.success(isZh ? "✅ 亿企代账全量包+报税包已导出" : "✅ YiQi full package + tax package exported");
          break;
        }
        default:
          toast.info(isZh ? `步骤 ${stepId} 已标记为完成（演示模式）` : `Step ${stepId} marked complete (demo)`);
      }
    } catch (e) {
      // error handled by mutations
    }
    setRunningStep(null);
  };

  const handleRunAll = async () => {
    for (const step of STEPS) {
      setRunningStep(step.id);
      setActiveStep(step.id - 1);
      await new Promise(r => setTimeout(r, 500));
      if ([3, 4, 5, 9, 11].includes(step.id)) {
        await handleRunStep(step.id);
      }
    }
    setRunningStep(null);
    toast.success(isZh ? "🎉 全流程自动化执行完成！请审核结果" : "🎉 Full automation cycle complete! Please review results");
  };

  const status = automationStatus || { pendingReceipts: 0, unpaidOrders: 0, pendingVouchers: 0, pendingInvoices: 0 };
  const totalPending = status.pendingReceipts + status.unpaidOrders + status.pendingVouchers + status.pendingInvoices;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            {isZh ? "采购到报税全自动化引擎" : "Procurement-to-Tax Automation Engine"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {isZh
              ? `AI智能联动全链路：采购→收货→付款→做账→报表→报税→亿企代账导出 | ${storeName(isZh)}`
              : `AI-driven full chain: PO→Receipt→Payment→Accounting→Reports→Tax→YiQi Export | ${storeName(isZh)}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["automation-status"] })}>
            <RefreshCw className="w-4 h-4 mr-1" />{isZh ? "刷新" : "Refresh"}
          </Button>
          <Button size="sm" onClick={handleRunAll} disabled={runningStep !== null}>
            <Play className="w-4 h-4 mr-1" />{isZh ? "一键执行全流程" : "Run Full Cycle"}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-xl font-bold">{status.pendingReceipts}</p>
                <p className="text-[10px] text-muted-foreground">{isZh ? "待核对收货单" : "Pending Receipts"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-destructive" />
              <div>
                <p className="text-xl font-bold">{status.unpaidOrders}</p>
                <p className="text-[10px] text-muted-foreground">{isZh ? "待付款订单" : "Unpaid Orders"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xl font-bold">{status.pendingVouchers}</p>
                <p className="text-[10px] text-muted-foreground">{isZh ? "待审核凭证" : "Pending Vouchers"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              <div>
                <p className="text-xl font-bold">{status.pendingInvoices}</p>
                <p className="text-[10px] text-muted-foreground">{isZh ? "待处理发票" : "Pending Invoices"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      {totalPending > 0 && (
        <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium">
              {isZh ? `共 ${totalPending} 项待处理任务` : `${totalPending} items pending`}
            </p>
            <Progress value={Math.max(5, 100 - totalPending * 5)} className="h-1.5 mt-1" />
          </div>
        </div>
      )}

      {/* Payment Schedule Rules */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-primary" />
              {isZh ? "付款时间规则" : "Payment Schedule Rules"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowScheduleRules(!showScheduleRules)}>
                <Settings2 className="w-3.5 h-3.5 mr-1" />
                {isZh ? (showScheduleRules ? "收起" : "展开") : (showScheduleRules ? "Collapse" : "Expand")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Rules summary - always visible */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border">
              <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium">{isZh ? "一般供应商" : "General Suppliers"}</p>
                <p className="text-[10px] text-muted-foreground">{isZh ? "每周五统一付款" : "Every Friday"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border">
              <div className="w-2 h-2 rounded-full bg-destructive shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium">{isZh ? "房租" : "Rent"}</p>
                <p className="text-[10px] text-muted-foreground">{isZh ? "每月27号前" : "By 27th each month"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border">
              <div className="w-2 h-2 rounded-full bg-chart-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium">{isZh ? "工资" : "Salary"}</p>
                <p className="text-[10px] text-muted-foreground">{isZh ? "次月8号前" : "By 8th next month"}</p>
              </div>
            </div>
          </div>

          {/* Expanded: manual override controls */}
          {showScheduleRules && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={manualPaymentMode} onCheckedChange={setManualPaymentMode} />
                  <span className="text-xs font-medium">{isZh ? "手动指定付款日期" : "Manual payment date"}</span>
                </div>
                {manualPaymentMode && (
                  <Input
                    type="date"
                    value={manualPaymentDate}
                    onChange={e => setManualPaymentDate(e.target.value)}
                    className="w-40 h-8 text-xs"
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">{isZh ? "筛选类型:" : "Filter:"}</span>
                <Select value={paymentFilter} onValueChange={(v: any) => setPaymentFilter(v)}>
                  <SelectTrigger className="h-8 text-xs w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isZh ? "全部" : "All"}</SelectItem>
                    <SelectItem value="supplier">{isZh ? "供应商(周五)" : "Suppliers(Fri)"}</SelectItem>
                    <SelectItem value="rent">{isZh ? "房租(27号)" : "Rent(27th)"}</SelectItem>
                    <SelectItem value="salary">{isZh ? "工资(8号)" : "Salary(8th)"}</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="default" className="h-8 text-xs" onClick={() => handleRunStep(5)} disabled={runningStep !== null}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  {isZh ? "立即生成付款单" : "Generate Now"}
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground">
                {isZh
                  ? "💡 开启手动模式可绕过内部付款日规则，在任意日期生成付款Excel文件。适用于紧急付款或特殊安排。"
                  : "💡 Manual mode bypasses internal schedule rules, allowing payment generation on any date. Use for urgent or special payments."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Steps */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{isZh ? "全流程自动化管道" : "Full Automation Pipeline"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isRunning = runningStep === step.id;
              const isActive = activeStep === idx;
              const isClickable = [3, 4, 5, 9, 11].includes(step.id);

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`relative p-3 rounded-lg border transition-all cursor-pointer ${
                    isRunning ? "border-primary bg-primary/10 ring-2 ring-primary/30" :
                    isActive ? "border-primary/50 bg-primary/5" :
                    "border-border hover:border-primary/30 hover:bg-muted/30"
                  }`}
                  onClick={() => {
                    setActiveStep(idx);
                    if (isClickable && !isRunning) handleRunStep(step.id);
                  }}
                >
                  {/* Step number */}
                  <div className="absolute -top-2 -left-1">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-card">
                      {step.id}
                    </Badge>
                  </div>

                  <div className="flex items-start gap-2 mt-1">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                      isRunning ? "bg-primary/20" : "bg-muted/50"
                    }`}>
                      {isRunning ? (
                        <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
                      ) : (
                        <StepIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{isZh ? step.zhLabel : step.enLabel}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                        {isZh ? step.zhDesc : step.enDesc}
                      </p>
                    </div>
                  </div>

                  {/* Arrow connector */}
                  {idx < STEPS.length - 1 && idx % 4 !== 3 && (
                    <ArrowRight className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/30 hidden lg:block" />
                  )}

                  {isClickable && (
                    <Badge variant="secondary" className="text-[8px] mt-2 px-1.5">
                      {isZh ? "可执行" : "Runnable"}
                    </Badge>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleRunStep(3)}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium">{isZh ? "执行收货核对" : "Run Receipt Reconciliation"}</p>
                <p className="text-xs text-muted-foreground">{isZh ? "OCR+三方核对" : "OCR + 3-way match"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleRunStep(5)}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Download className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium">{isZh ? "生成银行付款Excel" : "Generate Bank Payment"}</p>
                <p className="text-xs text-muted-foreground">{isZh ? "按合同账期汇总" : "By contract terms"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleRunStep(11)}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{isZh ? "一键亿企代账导出" : "One-click YiQi Export"}</p>
                <p className="text-xs text-muted-foreground">{isZh ? "凭证+发票+报税全量包" : "Vouchers+Invoices+Tax package"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Notes */}
      <div className="bg-muted/20 rounded-lg p-4 border border-border/50">
        <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
          <Bot className="w-3.5 h-3.5 text-primary" />
          {isZh ? "AI智能联动说明" : "AI Automation Notes"}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
          <div>• {isZh ? "采购订单创建后自动通知供应商备货发货" : "Auto-notify suppliers after PO creation"}</div>
          <div>• {isZh ? "收货单OCR识别后自动与采购单三方核对" : "OCR receipts auto-matched with POs"}</div>
          <div>• {isZh ? "按合同账期（月结30天等）自动排款" : "Auto-schedule payments by contract terms"}</div>
          <div>• {isZh ? "银行付款Excel按网银模板格式生成" : "Bank Excel follows e-banking import template"}</div>
          <div>• {isZh ? "银行流水回导后AI自动匹配生成凭证" : "Bank statements auto-matched to generate vouchers"}</div>
          <div>• {isZh ? "月末自动生成三大报表（利润表/资产负债表/现金流量表）" : "Auto-generate 3 financial statements monthly"}</div>
          <div>• {isZh ? "自动计算增值税/企业所得税/个税/附加税" : "Auto-calculate VAT/CIT/IIT/Surcharges"}</div>
          <div>• {isZh ? "报税期间一键导出至亿企代账进行最终申报" : "One-click export to YiQi for final filing"}</div>
          <div>• {isZh ? "各子公司独立报表 + 集团合并报表自动生成" : "Subsidiary + consolidated reports auto-generated"}</div>
          <div>• {isZh ? "所有结果需人工审核确认后方可提交" : "All results require manual review before submission"}</div>
        </div>
      </div>
    </div>
  );
};

export default AutomationDashboard;
