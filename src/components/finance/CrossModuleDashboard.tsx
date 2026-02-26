import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Link2, Package, Receipt, FileText, ArrowRight, TrendingUp, AlertTriangle,
  CheckCircle, Clock, Building2, ShoppingCart, Brain, Landmark, Wallet,
  RefreshCw, BarChart3, Zap, ArrowDown, ArrowUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { toast } from "sonner";
import { useState } from "react";

const CrossModuleDashboard = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const navigate = useNavigate();
  const { storeId, isHQ, storeName } = useStore();
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const storeFilter = !isHQ ? { store_id: storeId } : {};

  // ===== Data Queries =====
  const { data: transactions = [] } = useQuery({
    queryKey: ["finance-transactions-cross", storeId],
    queryFn: async () => {
      let q = supabase.from("finance_transactions").select("*").order("created_at", { ascending: false }).limit(50);
      if (!isHQ) q = q.eq("store_id", storeId);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: procurements = [] } = useQuery({
    queryKey: ["procurement-orders-cross", storeId],
    queryFn: async () => {
      let q = supabase.from("procurement_orders").select("*").order("created_at", { ascending: false }).limit(50);
      if (!isHQ) q = q.eq("store_id", storeId);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["fixed-assets-cross", storeId],
    queryFn: async () => {
      let q = supabase.from("fixed_assets").select("*").order("created_at", { ascending: false }).limit(50);
      if (!isHQ) q = q.eq("store_id", storeId);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory-cross", storeId],
    queryFn: async () => {
      const { data } = await supabase.from("inventory_items").select("*");
      return data || [];
    },
  });

  const { data: amortizationItems = [] } = useQuery({
    queryKey: ["amortization-cross", storeId],
    queryFn: async () => {
      let q = supabase.from("amortization_items").select("*").order("created_at", { ascending: false });
      if (!isHQ) q = q.eq("store_id", storeId);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: amortizationJournal = [] } = useQuery({
    queryKey: ["amortization-journal-cross", storeId],
    queryFn: async () => {
      let q = supabase.from("amortization_journal").select("*").eq("status", "pending");
      if (!isHQ) q = q.eq("store_id", storeId);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: receipts = [] } = useQuery({
    queryKey: ["receipts-cross", storeId],
    queryFn: async () => {
      let q = supabase.from("procurement_receipts").select("*").eq("match_status", "pending").limit(20);
      if (!isHQ) q = q.eq("store_id", storeId);
      const { data } = await q;
      return data || [];
    },
  });

  // ===== Computed Stats =====
  const pendingReview = transactions.filter(t => t.status === "pending").length;
  const pendingProcurements = procurements.filter(p => !["paid", "cancelled"].includes(p.status)).length;
  const lowStockItems = inventory.filter(i => i.status === "low" || i.status === "critical");
  const criticalStock = inventory.filter(i => i.status === "critical");
  const unpaidPOs = procurements.filter(p => p.status === "received" && Number(p.paid_amount) < Number(p.total_amount));
  const aiSuggestedAmort = amortizationItems.filter(a => a.collection_status === "ai_suggested");
  const confirmedAmort = amortizationItems.filter(a => a.collection_status === "confirmed");
  const pendingAmortJournal = amortizationJournal.length;
  const totalAssetValue = assets.reduce((s, a) => s + Number(a.original_value), 0);
  const totalAmortValue = amortizationItems.reduce((s, a) => s + Number(a.total_amount), 0);
  const totalAmortized = amortizationItems.reduce((s, a) => s + Number(a.amortized_total), 0);
  const pendingReceipts = receipts.length;

  // ===== Actions =====
  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["finance-transactions-cross"] });
    queryClient.invalidateQueries({ queryKey: ["procurement-orders-cross"] });
    queryClient.invalidateQueries({ queryKey: ["fixed-assets-cross"] });
    queryClient.invalidateQueries({ queryKey: ["inventory-cross"] });
    queryClient.invalidateQueries({ queryKey: ["amortization-cross"] });
    queryClient.invalidateQueries({ queryKey: ["amortization-journal-cross"] });
    queryClient.invalidateQueries({ queryKey: ["receipts-cross"] });
    toast.success(isZh ? "数据已刷新" : "Data refreshed");
  };

  // Post all pending amortization journal entries to finance
  const postAllAmortization = async () => {
    setActionLoading("amort-post");
    let posted = 0;
    for (const entry of amortizationJournal) {
      const item = amortizationItems.find(i => i.id === entry.amortization_item_id);
      if (!item) continue;

      const { error: txnErr } = await supabase.from("finance_transactions").insert({
        type: "expense",
        category: ["fixed_asset", "equipment"].includes(item.item_type) ? "depreciation" : "amortization",
        amount: entry.amount,
        debit_account: entry.debit_account,
        credit_account: entry.credit_account,
        description_zh: `${item.name_zh} - ${entry.period}月摊销`,
        description_en: `${item.name_en || item.name_zh} - ${entry.period} Amortization`,
        store_id: entry.store_id,
        store_name_zh: item.store_name_zh,
        store_name_en: item.store_name_en || "",
        status: "pending",
        notes: `智能联动自动入账`,
      });
      if (!txnErr) {
        await supabase.from("amortization_journal").update({ status: "posted", posted_at: new Date().toISOString() } as any).eq("id", entry.id);
        posted++;
      }
    }
    toast.success(isZh ? `已将 ${posted} 条摊销凭证入账到财务总账` : `Posted ${posted} amortization entries to GL`);
    setActionLoading(null);
    refreshAll();
  };

  // Auto-generate procurement suggestions for low stock
  const triggerProcurementSuggestion = async () => {
    setActionLoading("proc-suggest");
    try {
      const { data, error } = await supabase.functions.invoke("ai-procurement-suggest", {
        body: { storeId, storeName: storeName(true), storeNameEn: storeName(false) },
      });
      if (error) throw error;
      toast.success(isZh ? "AI采购建议已生成，请到采购模块查看" : "AI procurement suggestions generated");
    } catch (e) {
      toast.error(isZh ? "生成采购建议失败" : "Failed to generate suggestions");
    }
    setActionLoading(null);
  };

  // Auto-reconcile receipts via edge function
  const triggerReconcile = async () => {
    setActionLoading("reconcile");
    try {
      const { data, error } = await supabase.functions.invoke("auto-finance-cycle", {
        body: { action: "reconcile_receipts", storeId },
      });
      if (error) throw error;
      toast.success(isZh ? `核对完成: ${data?.matchedCount || 0}条匹配, ${data?.mismatchCount || 0}条需复核` : `Reconciled: ${data?.matchedCount || 0} matched`);
    } catch (e) {
      toast.error(isZh ? "核对失败" : "Reconciliation failed");
    }
    setActionLoading(null);
    refreshAll();
  };

  // 4 linkage chains
  const chains = [
    {
      key: "amort-finance",
      icon: Landmark,
      titleZh: "摊销 → 财务自动入账",
      titleEn: "Amortization → Auto GL Posting",
      color: "bg-primary/10 text-primary border-primary/20",
      steps: [
        { labelZh: "AI归集", labelEn: "AI Collect", count: aiSuggestedAmort.length, status: aiSuggestedAmort.length > 0 ? "action" : "done" },
        { labelZh: "确认验证", labelEn: "Verify", count: confirmedAmort.filter(a => a.verification_status === "pending").length, status: confirmedAmort.filter(a => a.verification_status === "pending").length > 0 ? "action" : "done" },
        { labelZh: "摊销凭证", labelEn: "Journal", count: pendingAmortJournal, status: pendingAmortJournal > 0 ? "action" : "done" },
        { labelZh: "入总账", labelEn: "Post GL", count: pendingReview, status: pendingReview > 0 ? "pending" : "done" },
      ],
      actionLabel: isZh ? "一键入账" : "Post All",
      actionFn: postAllAmortization,
      actionDisabled: pendingAmortJournal === 0,
      actionKey: "amort-post",
      navTo: "/finance",
    },
    {
      key: "proc-inv-fin",
      icon: ShoppingCart,
      titleZh: "采购 → 库存 → 财务",
      titleEn: "Procurement → Inventory → Finance",
      color: "bg-accent/10 text-accent-foreground border-accent/20",
      steps: [
        { labelZh: "待收货", labelEn: "Receiving", count: procurements.filter(p => p.status === "confirmed").length, status: procurements.filter(p => p.status === "confirmed").length > 0 ? "action" : "done" },
        { labelZh: "三方核对", labelEn: "3-Way Match", count: pendingReceipts, status: pendingReceipts > 0 ? "action" : "done" },
        { labelZh: "待付款", labelEn: "Payment", count: unpaidPOs.length, status: unpaidPOs.length > 0 ? "action" : "done" },
        { labelZh: "入账", labelEn: "GL Post", count: transactions.filter(t => t.category === "procurement" && t.status === "pending").length, status: "pending" },
      ],
      actionLabel: isZh ? "自动核对" : "Auto Reconcile",
      actionFn: triggerReconcile,
      actionDisabled: pendingReceipts === 0,
      actionKey: "reconcile",
      navTo: "/procurement",
    },
    {
      key: "order-inv-proc",
      icon: BarChart3,
      titleZh: "订单 → 库存 → 采购建议",
      titleEn: "Orders → Inventory → Procurement Suggest",
      color: "bg-destructive/10 text-destructive border-destructive/20",
      steps: [
        { labelZh: "订单消耗", labelEn: "Order Deduct", count: inventory.filter(i => Number(i.usage_7d) > 0).length, status: "done" },
        { labelZh: "低库存", labelEn: "Low Stock", count: lowStockItems.length, status: lowStockItems.length > 0 ? "action" : "done" },
        { labelZh: "严重缺货", labelEn: "Critical", count: criticalStock.length, status: criticalStock.length > 0 ? "alert" : "done" },
        { labelZh: "AI建议", labelEn: "AI Suggest", count: 0, status: "pending" },
      ],
      actionLabel: isZh ? "生成采购建议" : "AI Suggest",
      actionFn: triggerProcurementSuggestion,
      actionDisabled: lowStockItems.length === 0,
      actionKey: "proc-suggest",
      navTo: "/inventory",
    },
    {
      key: "bank-all",
      icon: Wallet,
      titleZh: "银行流水 → 全模块匹配",
      titleEn: "Bank Statement → Cross-Module Match",
      color: "bg-secondary/50 text-secondary-foreground border-secondary/50",
      steps: [
        { labelZh: "流水导入", labelEn: "Import", count: 0, status: "pending" },
        { labelZh: "AI分类", labelEn: "AI Classify", count: 0, status: "pending" },
        { labelZh: "匹配采购/摊销/工资", labelEn: "Match PO/Amort/Salary", count: 0, status: "pending" },
        { labelZh: "自动做账", labelEn: "Auto Journal", count: 0, status: "pending" },
      ],
      actionLabel: isZh ? "进入自动化" : "Go to Auto",
      actionFn: () => navigate("/finance"),
      actionDisabled: false,
      actionKey: "bank-nav",
      navTo: "/finance",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 flex-1 mr-3">
          {isZh
            ? `🧠 智能联动中心: ${isHQ ? "全部门店汇总" : storeName(true)} — 实时监控 摊销↔财务↔采购↔库存↔订单 全链路状态`
            : `🧠 Intelligence Hub: ${isHQ ? "All stores" : storeName(false)} — Real-time cross-module linkage monitoring`}
        </div>
        <Button size="sm" variant="outline" onClick={refreshAll}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" />{isZh ? "刷新" : "Refresh"}
        </Button>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: isZh ? "固定资产" : "Assets", value: `¥${(totalAssetValue / 10000).toFixed(1)}万`, icon: Package },
          { label: isZh ? "摊销归集" : "Amortize", value: `¥${(totalAmortValue / 10000).toFixed(1)}万`, icon: Landmark },
          { label: isZh ? "待审凭证" : "Pending GL", value: `${pendingReview}`, icon: FileText },
          { label: isZh ? "低库存" : "Low Stock", value: `${lowStockItems.length}`, icon: AlertTriangle },
          { label: isZh ? "待付款" : "Unpaid PO", value: `${unpaidPOs.length}`, icon: Receipt },
          { label: isZh ? "联动链路" : "Chains", value: "4", icon: Link2 },
        ].map((kpi, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="pt-3 pb-2 px-3">
              <div className="flex items-center gap-1.5 mb-1">
                <kpi.icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-lg font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 4 Linkage Chains */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {chains.map((chain) => (
          <motion.div key={chain.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={`border ${chain.color}`}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <chain.icon className="w-4 h-4" />
                    {isZh ? chain.titleZh : chain.titleEn}
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={chain.actionDisabled || actionLoading === chain.actionKey}
                    onClick={chain.actionFn}
                  >
                    {actionLoading === chain.actionKey ? (
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Zap className="w-3 h-3 mr-1" />
                    )}
                    {chain.actionLabel}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-4 px-4">
                <div className="flex items-center gap-1.5">
                  {chain.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-1.5 flex-1">
                      <div className={`flex-1 rounded-lg px-2 py-2 text-center border ${
                        step.status === "action" ? "bg-primary/10 border-primary/30" :
                        step.status === "alert" ? "bg-destructive/10 border-destructive/30" :
                        step.status === "done" ? "bg-muted/30 border-muted" :
                        "bg-muted/10 border-muted/50"
                      }`}>
                        <p className="text-[10px] font-medium">{isZh ? step.labelZh : step.labelEn}</p>
                        <p className={`text-sm font-bold ${
                          step.status === "alert" ? "text-destructive" :
                          step.status === "action" ? "text-primary" :
                          step.count > 0 ? "text-foreground" : "text-muted-foreground"
                        }`}>{step.count}</p>
                      </div>
                      {i < chain.steps.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Cross-Module Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{isZh ? "最新联动记录" : "Recent Cross-Module Events"}</CardTitle>
              <Badge variant="outline" className="text-[10px]">{isZh ? "自动生成" : "Auto"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{isZh ? "暂无联动记录" : "No records yet"}</p>
              ) : (
                transactions.slice(0, 8).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${tx.type === "income" ? "bg-primary/10" : "bg-muted"}`}>
                        {tx.category === "depreciation" || tx.category === "amortization" ? <TrendingUp className="w-3 h-3" /> :
                         tx.category === "procurement" ? <Receipt className="w-3 h-3" /> :
                         tx.category === "revenue" ? <ArrowUp className="w-3 h-3" /> :
                         <FileText className="w-3 h-3" />}
                      </div>
                      <div>
                        <p className="text-xs">{isZh ? tx.description_zh : tx.description_en}</p>
                        <div className="flex gap-1 mt-0.5">
                          {tx.linked_asset_id && <Badge variant="outline" className="text-[8px] px-1 py-0">{isZh ? "资产" : "Asset"}</Badge>}
                          {tx.linked_procurement_id && <Badge variant="outline" className="text-[8px] px-1 py-0">{isZh ? "采购" : "PO"}</Badge>}
                          {(tx.category === "amortization" || tx.category === "depreciation") && <Badge variant="outline" className="text-[8px] px-1 py-0">{isZh ? "摊销" : "Amort"}</Badge>}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold ${tx.type === "income" ? "text-primary" : "text-foreground"}`}>
                      {tx.type === "income" ? "+" : "-"}¥{Number(tx.amount).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Smart Alerts */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              {isZh ? "智能预警" : "Smart Alerts"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {aiSuggestedAmort.length > 0 && (
                <div className="flex items-start gap-2 p-2.5 bg-primary/5 rounded-lg border border-primary/10">
                  <Brain className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">{isZh ? `${aiSuggestedAmort.length}条AI归集项目待确认` : `${aiSuggestedAmort.length} AI-collected items pending`}</p>
                    <p className="text-[10px] text-muted-foreground">{isZh ? "请到摊销归集模块确认或拒绝" : "Review in Amortization tab"}</p>
                  </div>
                </div>
              )}
              {pendingAmortJournal > 0 && (
                <div className="flex items-start gap-2 p-2.5 bg-primary/5 rounded-lg border border-primary/10">
                  <Landmark className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">{isZh ? `${pendingAmortJournal}条摊销凭证待入总账` : `${pendingAmortJournal} amortization entries pending GL post`}</p>
                    <Button size="sm" variant="link" className="h-auto p-0 text-[10px]" onClick={postAllAmortization}>
                      {isZh ? "一键入账 →" : "Post all →"}
                    </Button>
                  </div>
                </div>
              )}
              {criticalStock.length > 0 && (
                <div className="flex items-start gap-2 p-2.5 bg-destructive/5 rounded-lg border border-destructive/10">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">{isZh ? `${criticalStock.length}种原材料严重缺货` : `${criticalStock.length} items critically low`}</p>
                    <p className="text-[10px] text-muted-foreground">{criticalStock.slice(0, 3).map(i => isZh ? i.name_zh : i.name_en).join(", ")}</p>
                  </div>
                </div>
              )}
              {unpaidPOs.length > 0 && (
                <div className="flex items-start gap-2 p-2.5 bg-accent/10 rounded-lg border border-accent/20">
                  <Receipt className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">{isZh ? `${unpaidPOs.length}张已收货采购单待付款` : `${unpaidPOs.length} received POs awaiting payment`}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {isZh ? "合计" : "Total"}: ¥{unpaidPOs.reduce((s, p) => s + Number(p.total_amount) - Number(p.paid_amount), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              {pendingReview > 0 && (
                <div className="flex items-start gap-2 p-2.5 bg-muted/30 rounded-lg border border-muted">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">{isZh ? `${pendingReview}条凭证待审核` : `${pendingReview} vouchers pending review`}</p>
                  </div>
                </div>
              )}
              {aiSuggestedAmort.length === 0 && pendingAmortJournal === 0 && criticalStock.length === 0 && unpaidPOs.length === 0 && pendingReview === 0 && (
                <div className="flex items-start gap-2 p-2.5 bg-primary/5 rounded-lg border border-primary/10">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs font-medium">{isZh ? "所有模块运行正常，无待处理事项" : "All modules operating normally"}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CrossModuleDashboard;
