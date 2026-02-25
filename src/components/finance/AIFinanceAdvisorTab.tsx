import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useStore } from "@/contexts/StoreContext";
import { computeIncomeStatement, computeBalanceSheet, computeCashFlow, StoreId } from "@/data/financeData";
import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Zap, Target, ShieldCheck, BarChart3, Lightbulb, ArrowRight, Clock, DollarSign, PieChart, Activity } from "lucide-react";

const AIFinanceAdvisorTab = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const { storeId, isHQ, storeName } = useStore();
  const [activeSection, setActiveSection] = useState<"insights" | "forecast" | "risk" | "optimize">("insights");

  const income = useMemo(() => computeIncomeStatement(storeId as StoreId), [storeId]);
  const balance = useMemo(() => computeBalanceSheet(storeId as StoreId), [storeId]);
  const cashFlow = useMemo(() => computeCashFlow(storeId as StoreId), [storeId]);

  const grossMargin = income.totalRevenue > 0 ? (income.grossProfit / income.totalRevenue * 100) : 0;
  const netMargin = income.totalRevenue > 0 ? (income.netProfit / income.totalRevenue * 100) : 0;
  const debtRatio = balance.totalAssets > 0 ? (balance.totalLiabilities / balance.totalAssets * 100) : 0;
  const currentAssets = balance.assets.filter(a => !a.nameZh.includes("固定") && !a.nameZh.includes("累计折旧") && !a.nameZh.includes("长期")).reduce((s, a) => s + a.balance, 0);
  const currentLiabilities = balance.liabilities.filter(a => !a.nameZh.includes("长期")).reduce((s, a) => s + a.balance, 0);
  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;

  // AI Health Score
  const healthScore = useMemo(() => {
    let score = 60;
    if (grossMargin > 55) score += 10; else if (grossMargin > 45) score += 5;
    if (netMargin > 15) score += 10; else if (netMargin > 8) score += 5;
    if (debtRatio < 40) score += 10; else if (debtRatio < 60) score += 5;
    if (currentRatio > 1.5) score += 10; else if (currentRatio > 1) score += 5;
    return Math.min(score, 100);
  }, [grossMargin, netMargin, debtRatio, currentRatio]);

  // Cash flow forecast (next 6 months)
  const cashForecast = useMemo(() => {
    const base = cashFlow.openingBalance;
    const monthlyNet = cashFlow.operating.net;
    const months = isZh
      ? ["3月", "4月", "5月", "6月", "7月", "8月"]
      : ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
    return months.map((m, i) => {
      const seasonal = [1.0, 0.95, 1.1, 1.15, 1.08, 0.92][i];
      const projected = base + monthlyNet * (i + 1) * seasonal;
      const optimistic = projected * 1.12;
      const pessimistic = projected * 0.85;
      return { month: m, projected: Math.round(projected), optimistic: Math.round(optimistic), pessimistic: Math.round(pessimistic) };
    });
  }, [cashFlow, isZh]);

  // Radar chart data for financial health dimensions
  const radarData = useMemo(() => [
    { subject: isZh ? "盈利能力" : "Profitability", value: Math.min(netMargin * 3, 100), fullMark: 100 },
    { subject: isZh ? "流动性" : "Liquidity", value: Math.min(currentRatio * 40, 100), fullMark: 100 },
    { subject: isZh ? "偿债能力" : "Solvency", value: Math.max(100 - debtRatio, 0), fullMark: 100 },
    { subject: isZh ? "成本控制" : "Cost Control", value: Math.min(grossMargin, 100), fullMark: 100 },
    { subject: isZh ? "经营效率" : "Efficiency", value: income.totalRevenue > 0 ? Math.min((income.operatingProfit / income.totalRevenue * 200), 100) : 0, fullMark: 100 },
    { subject: isZh ? "现金流" : "Cash Flow", value: cashFlow.operating.net > 0 ? Math.min((cashFlow.operating.net / income.totalRevenue * 200), 100) : 20, fullMark: 100 },
  ], [netMargin, currentRatio, debtRatio, grossMargin, income, cashFlow, isZh]);

  // AI-generated insights
  const insights = useMemo(() => {
    const list: Array<{ type: "success" | "warning" | "danger" | "info"; titleZh: string; titleEn: string; descZh: string; descEn: string; priority: number }> = [];

    if (grossMargin > 55) {
      list.push({ type: "success", priority: 1, titleZh: "毛利率优秀", titleEn: "Excellent Gross Margin", descZh: `当前毛利率${grossMargin.toFixed(1)}%，高于餐饮行业平均水平(55%)。食材和酒水成本控制得当，建议维持现有供应链策略。`, descEn: `Current gross margin ${grossMargin.toFixed(1)}% exceeds industry average (55%). Ingredient and beverage costs well controlled.` });
    } else if (grossMargin < 45) {
      list.push({ type: "danger", priority: 0, titleZh: "毛利率偏低 — 需立即关注", titleEn: "Low Gross Margin — Immediate Attention", descZh: `毛利率${grossMargin.toFixed(1)}%低于警戒线(45%)。建议：1)与供应商重新谈判价格 2)优化菜单定价 3)检查食材损耗率。`, descEn: `Gross margin ${grossMargin.toFixed(1)}% below warning level (45%). Recommend: 1) Renegotiate supplier prices 2) Optimize menu pricing 3) Check ingredient waste rate.` });
    }

    if (debtRatio > 60) {
      list.push({ type: "warning", priority: 1, titleZh: "资产负债率偏高", titleEn: "High Debt-to-Asset Ratio", descZh: `负债率${debtRatio.toFixed(1)}%，超过行业安全线(60%)。建议控制新增借款，优先偿还高息贷款。`, descEn: `Debt ratio ${debtRatio.toFixed(1)}% exceeds safety line (60%). Recommend controlling new borrowing.` });
    } else {
      list.push({ type: "success", priority: 2, titleZh: "财务结构健康", titleEn: "Healthy Financial Structure", descZh: `负债率${debtRatio.toFixed(1)}%处于安全范围，资本结构合理，有充足的借贷空间应对扩张需求。`, descEn: `Debt ratio ${debtRatio.toFixed(1)}% within safe range. Capital structure is sound with room for expansion.` });
    }

    if (currentRatio < 1) {
      list.push({ type: "danger", priority: 0, titleZh: "流动性风险 — 短期偿债压力大", titleEn: "Liquidity Risk — Short-term Pressure", descZh: `流动比率${currentRatio.toFixed(2)}低于1，短期偿债能力不足。建议：加速应收账款回收，延长应付账款账期。`, descEn: `Current ratio ${currentRatio.toFixed(2)} below 1. Recommend: accelerate AR collection, extend AP terms.` });
    } else if (currentRatio > 2) {
      list.push({ type: "info", priority: 3, titleZh: "流动资金充裕 — 可考虑投资", titleEn: "Ample Liquidity — Consider Investment", descZh: `流动比率${currentRatio.toFixed(2)}较高，可能存在资金闲置。建议：考虑短期理财或提前储备旺季食材。`, descEn: `Current ratio ${currentRatio.toFixed(2)} is high, possible idle funds. Consider short-term investments or pre-stocking for peak season.` });
    }

    list.push({ type: "info", priority: 2, titleZh: "🤖 AI 成本优化建议", titleEn: "🤖 AI Cost Optimization", descZh: `基于过去3个月数据分析，人工成本占收入比${income.totalRevenue > 0 ? (183000 / income.totalRevenue * 100).toFixed(1) : "N/A"}%。建议：优化排班、引入自助点单减少服务人员需求。预计可节省15-20%人力开支。`, descEn: `Based on 3-month analysis, labor cost ratio is ${income.totalRevenue > 0 ? (183000 / income.totalRevenue * 100).toFixed(1) : "N/A"}%. Recommend: optimize scheduling, introduce self-ordering to reduce staff needs. Est. 15-20% savings.` });

    list.push({ type: "info", priority: 3, titleZh: "📈 营收增长机会", titleEn: "📈 Revenue Growth Opportunity", descZh: `KTV和活动场地收入呈上升趋势，建议增加周末夜间活动频次。预测可额外贡献月均¥8-12万收入。同时可考虑推出企业团建套餐，锁定B端稳定客源。`, descEn: `KTV and event venue revenue trending up. Recommend increasing weekend night events. Projected additional ¥80-120K/month. Also consider corporate team-building packages for stable B2B revenue.` });

    return list.sort((a, b) => a.priority - b.priority);
  }, [grossMargin, debtRatio, currentRatio, income]);

  // Risk assessment items
  const riskItems = useMemo(() => [
    { nameZh: "应收账款逾期风险", nameEn: "AR Overdue Risk", level: balance.assets.find(a => a.nameZh === "应收账款")?.balance! > 100000 ? "high" : "medium", scoreZh: balance.assets.find(a => a.nameZh === "应收账款")?.balance! > 100000 ? "高" : "中", scoreEn: balance.assets.find(a => a.nameZh === "应收账款")?.balance! > 100000 ? "High" : "Medium", descZh: `应收账款余额¥${balance.assets.find(a => a.nameZh === "应收账款")?.balance?.toLocaleString()}，其中企业客户月结款¥45,000需重点跟进`, descEn: `AR balance ¥${balance.assets.find(a => a.nameZh === "应收账款")?.balance?.toLocaleString()}, corporate monthly billing ¥45,000 needs follow-up` },
    { nameZh: "食材价格波动风险", nameEn: "Ingredient Price Risk", level: "medium", scoreZh: "中", scoreEn: "Medium", descZh: "进口伊比利亚火腿价格近期上涨8%，建议锁定3个月供货协议或寻找替代供应商", descEn: "Imported Jamón Ibérico price up 8% recently. Recommend locking 3-month supply agreement or finding alternatives" },
    { nameZh: "现金流断裂风险", nameEn: "Cash Flow Risk", level: cashFlow.operating.net < 0 ? "high" : "low", scoreZh: cashFlow.operating.net < 0 ? "高" : "低", scoreEn: cashFlow.operating.net < 0 ? "High" : "Low", descZh: `经营活动净现金流¥${cashFlow.operating.net.toLocaleString()}，${cashFlow.operating.net > 0 ? "现金流为正，经营健康" : "现金流为负，需紧急调整"}`, descEn: `Operating net cash flow ¥${cashFlow.operating.net.toLocaleString()}, ${cashFlow.operating.net > 0 ? "positive cash flow, healthy operation" : "negative, urgent adjustment needed"}` },
    { nameZh: "税务合规风险", nameEn: "Tax Compliance Risk", level: "low", scoreZh: "低", scoreEn: "Low", descZh: "所有税务申报按时完成，进销项发票核对无异常。建议持续关注增值税进项抵扣凭证完整性", descEn: "All tax filings on time, input/output invoice reconciliation normal. Continue monitoring VAT input credit completeness" },
    { nameZh: "固定资产减值风险", nameEn: "Asset Impairment Risk", level: "low", scoreZh: "低", scoreEn: "Low", descZh: "KTV设备及厨房设备按计划折旧，无异常减值迹象。静安店装修翻新预计提升资产价值", descEn: "KTV and kitchen equipment depreciated as planned, no impairment signs. Jing'an renovation expected to increase asset value" },
  ], [balance, cashFlow]);

  const sectionButtons = [
    { key: "insights" as const, icon: Brain, labelZh: "AI 洞察", labelEn: "AI Insights" },
    { key: "forecast" as const, icon: TrendingUp, labelZh: "现金流预测", labelEn: "Cash Forecast" },
    { key: "risk" as const, icon: ShieldCheck, labelZh: "风险评估", labelEn: "Risk Assessment" },
    { key: "optimize" as const, icon: Zap, labelZh: "优化建议", labelEn: "Optimization" },
  ];

  const riskColor = (level: string) => {
    const map: Record<string, string> = { high: "text-destructive", medium: "text-warning", low: "text-success" };
    return map[level] || "text-muted-foreground";
  };
  const riskBg = (level: string) => {
    const map: Record<string, string> = { high: "bg-destructive/10 border-destructive/20", medium: "bg-warning/10 border-warning/20", low: "bg-success/10 border-success/20" };
    return map[level] || "bg-muted/10";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{isZh ? "AI 财务顾问" : "AI Finance Advisor"}</h3>
            <p className="text-xs text-muted-foreground">{isZh ? "基于实时数据的智能财务分析与建议" : "Intelligent analysis & recommendations based on real-time data"}</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 px-3 py-1.5">
          <Activity className="w-3 h-3 text-success animate-pulse" />
          {isZh ? "实时分析中" : "Live Analysis"}
        </Badge>
      </div>

      {/* Store context */}
      <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
        {isZh
          ? `🤖 AI正在分析: ${isHQ ? "全部门店汇总" : storeName(true)}的财务数据，已识别${insights.length}条洞察`
          : `🤖 AI analyzing: ${isHQ ? "All stores consolidated" : storeName(false)} financial data, ${insights.length} insights identified`}
      </div>

      {/* AI Health Score + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-xl p-5 flex flex-col items-center justify-center">
          <p className="text-xs text-muted-foreground mb-3">{isZh ? "AI 财务健康评分" : "AI Financial Health Score"}</p>
          <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(220, 14%, 18%)" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={healthScore >= 80 ? "hsl(152, 60%, 45%)" : healthScore >= 60 ? "hsl(36, 90%, 55%)" : "hsl(0, 72%, 55%)"} strokeWidth="8" strokeDasharray={`${healthScore * 3.27} 327`} strokeLinecap="round" transform="rotate(-90 60 60)" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${healthScore >= 80 ? "text-success" : healthScore >= 60 ? "text-warning" : "text-destructive"}`}>{healthScore}</span>
              <span className="text-[10px] text-muted-foreground">/100</span>
            </div>
          </div>
          <Badge variant={healthScore >= 80 ? "secondary" : healthScore >= 60 ? "outline" : "destructive"} className="mt-3">
            {healthScore >= 80 ? (isZh ? "优秀" : "Excellent") : healthScore >= 60 ? (isZh ? "良好" : "Good") : (isZh ? "需改善" : "Needs Improvement")}
          </Badge>
          <div className="grid grid-cols-2 gap-2 mt-4 w-full text-xs">
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <p className="font-semibold">{grossMargin.toFixed(1)}%</p>
              <p className="text-muted-foreground">{isZh ? "毛利率" : "Gross"}</p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <p className="font-semibold">{netMargin.toFixed(1)}%</p>
              <p className="text-muted-foreground">{isZh ? "净利率" : "Net"}</p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <p className="font-semibold">{currentRatio.toFixed(2)}</p>
              <p className="text-muted-foreground">{isZh ? "流动比" : "Current"}</p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <p className="font-semibold">{debtRatio.toFixed(1)}%</p>
              <p className="text-muted-foreground">{isZh ? "负债率" : "Debt"}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="lg:col-span-2 glass-card rounded-xl p-5">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-primary" />
            {isZh ? "六维财务雷达图" : "6-Dimension Financial Radar"}
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} cx="50%" cy="50%">
              <PolarGrid stroke="hsl(220, 14%, 22%)" />
              <PolarAngleAxis dataKey="subject" stroke="hsl(220, 10%, 55%)" fontSize={11} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="hsl(220, 14%, 22%)" fontSize={9} />
              <Radar name={isZh ? "当前" : "Current"} dataKey="value" stroke="hsl(36, 90%, 55%)" fill="hsl(36, 90%, 55%)" fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-2 flex-wrap">
        {sectionButtons.map((btn) => (
          <Button
            key={btn.key}
            variant={activeSection === btn.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection(btn.key)}
            className="gap-2"
          >
            <btn.icon className="w-4 h-4" />
            {isZh ? btn.labelZh : btn.labelEn}
          </Button>
        ))}
      </div>

      {/* AI Insights */}
      {activeSection === "insights" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {insights.map((insight, i) => {
            const colorMap = { success: "bg-success/10 border-success/20", warning: "bg-warning/10 border-warning/20", danger: "bg-destructive/10 border-destructive/20", info: "bg-info/10 border-info/20" };
            const iconMap = { success: <CheckCircle className="w-4 h-4 text-success" />, warning: <AlertTriangle className="w-4 h-4 text-warning" />, danger: <AlertTriangle className="w-4 h-4 text-destructive" />, info: <Lightbulb className="w-4 h-4 text-info" /> };
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className={`p-4 rounded-lg border ${colorMap[insight.type]}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{iconMap[insight.type]}</div>
                  <div>
                    <p className="text-sm font-semibold mb-1">{isZh ? insight.titleZh : insight.titleEn}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{isZh ? insight.descZh : insight.descEn}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Cash Flow Forecast */}
      {activeSection === "forecast" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            {isZh ? "未来6个月现金流预测" : "6-Month Cash Flow Forecast"}
          </h4>
          <p className="text-xs text-muted-foreground mb-4">
            {isZh ? "基于历史数据、季节性因素及经营趋势的AI智能预测，含乐观/悲观区间" : "AI prediction based on historical data, seasonality, and operational trends with optimistic/pessimistic ranges"}
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={cashForecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="month" stroke="hsl(220, 10%, 55%)" fontSize={11} />
              <YAxis stroke="hsl(220, 10%, 55%)" fontSize={10} tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} />
              <Tooltip
                contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px", fontSize: "11px" }}
                formatter={(value: number) => `¥${value.toLocaleString()}`}
              />
              <Legend fontSize={11} />
              <Area type="monotone" dataKey="optimistic" name={isZh ? "乐观" : "Optimistic"} stroke="hsl(152, 60%, 45%)" fill="hsl(152, 60%, 45%)" fillOpacity={0.1} strokeDasharray="3 3" />
              <Area type="monotone" dataKey="projected" name={isZh ? "预测" : "Projected"} stroke="hsl(36, 90%, 55%)" fill="hsl(36, 90%, 55%)" fillOpacity={0.2} strokeWidth={2} />
              <Area type="monotone" dataKey="pessimistic" name={isZh ? "悲观" : "Pessimistic"} stroke="hsl(0, 72%, 55%)" fill="hsl(0, 72%, 55%)" fillOpacity={0.1} strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { labelZh: "乐观预测 (Q2)", labelEn: "Optimistic (Q2)", value: cashForecast[2]?.optimistic || 0, color: "text-success" },
              { labelZh: "基准预测 (Q2)", labelEn: "Baseline (Q2)", value: cashForecast[2]?.projected || 0, color: "text-primary" },
              { labelZh: "悲观预测 (Q2)", labelEn: "Pessimistic (Q2)", value: cashForecast[2]?.pessimistic || 0, color: "text-destructive" },
            ].map((item, i) => (
              <div key={i} className="text-center p-3 bg-muted/30 rounded-lg">
                <p className={`text-lg font-bold ${item.color}`}>¥{(item.value / 10000).toFixed(1)}万</p>
                <p className="text-[10px] text-muted-foreground">{isZh ? item.labelZh : item.labelEn}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Risk Assessment */}
      {activeSection === "risk" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {riskItems.map((risk, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className={`p-4 rounded-lg border ${riskBg(risk.level)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${riskColor(risk.level)}`} />
                  <span className="text-sm font-semibold">{isZh ? risk.nameZh : risk.nameEn}</span>
                </div>
                <Badge variant={risk.level === "high" ? "destructive" : risk.level === "medium" ? "outline" : "secondary"} className="text-[10px]">
                  {isZh ? `风险: ${risk.scoreZh}` : `Risk: ${risk.scoreEn}`}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pl-6">{isZh ? risk.descZh : risk.descEn}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Cost Optimization */}
      {activeSection === "optimize" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {[
            {
              icon: DollarSign, titleZh: "食材采购成本优化", titleEn: "Ingredient Procurement Optimization",
              savingZh: "预计月省 ¥12,000-18,000", savingEn: "Est. monthly savings ¥12,000-18,000",
              stepsZh: ["整合供应商订单量获批量折扣", "引入季节性替代食材降低进口依赖", "建立安全库存模型减少紧急采购加价", "与3家主要供应商签订年度框架协议"],
              stepsEn: ["Consolidate supplier orders for bulk discounts", "Introduce seasonal alternatives to reduce import dependency", "Build safety stock model to reduce emergency procurement markup", "Sign annual framework agreements with top 3 suppliers"],
              confidence: 85,
            },
            {
              icon: Clock, titleZh: "人力排班智能优化", titleEn: "Smart Staff Scheduling",
              savingZh: "预计月省 ¥25,000-35,000", savingEn: "Est. monthly savings ¥25,000-35,000",
              stepsZh: ["基于历史客流量预测各时段最优人员配置", "推行自助点单系统，减少高峰期服务员需求20%", "跨门店灵活调配兼职人员应对活动高峰", "优化厨房动线减少备餐人力需求"],
              stepsEn: ["Predict optimal staffing per time slot from historical traffic", "Deploy self-ordering to reduce peak server needs 20%", "Cross-store flexible part-time staff for event peaks", "Optimize kitchen flow to reduce prep labor"],
              confidence: 78,
            },
            {
              icon: Target, titleZh: "能耗节约计划", titleEn: "Energy Savings Plan",
              savingZh: "预计月省 ¥3,000-5,000", savingEn: "Est. monthly savings ¥3,000-5,000",
              stepsZh: ["安装智能电表实时监控各区域能耗", "KTV包房及厨房设备闲时自动降功率", "评估LED照明及高效设备替换ROI", "夏季空调温度策略优化（高峰降1°C）"],
              stepsEn: ["Install smart meters for real-time zone monitoring", "Auto power-down KTV & kitchen equipment during idle time", "Evaluate LED lighting & efficient equipment ROI", "Summer AC temperature strategy optimization"],
              confidence: 92,
            },
          ].map((opt, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <opt.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{isZh ? opt.titleZh : opt.titleEn}</p>
                    <p className="text-xs text-success font-medium">{isZh ? opt.savingZh : opt.savingEn}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{isZh ? "AI 置信度" : "Confidence"}</p>
                  <div className="flex items-center gap-2">
                    <Progress value={opt.confidence} className="h-1.5 w-16" />
                    <span className="text-xs font-medium">{opt.confidence}%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 pl-1">
                {(isZh ? opt.stepsZh : opt.stepsEn).map((step, j) => (
                  <div key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <ArrowRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default AIFinanceAdvisorTab;
