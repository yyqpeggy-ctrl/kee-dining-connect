import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link2, Package, Receipt, FileText, ArrowRight, TrendingUp, AlertTriangle, CheckCircle, Clock, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const CrossModuleDashboard = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const navigate = useNavigate();

  const { data: transactions = [] } = useQuery({
    queryKey: ["finance-transactions-cross"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const { data: procurements = [] } = useQuery({
    queryKey: ["procurement-orders-cross"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procurement_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["fixed-assets-cross"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fixed_assets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  // Stats
  const totalAssetValue = assets.reduce((s, a) => s + Number(a.original_value), 0);
  const totalDepreciation = assets.reduce((s, a) => s + Number(a.accumulated_depreciation), 0);
  const pendingProcurements = procurements.filter(p => p.status !== "paid" && p.status !== "cancelled").length;
  const depreciationEntries = transactions.filter(t => t.category === "depreciation");
  const assetPurchaseEntries = transactions.filter(t => t.category === "asset_purchase");
  const revenueEntries = transactions.filter(t => t.category === "revenue");
  const pendingReview = transactions.filter(t => t.status === "pending").length;

  const categoryIcon = (cat: string) => {
    const map: Record<string, React.ReactNode> = {
      asset_purchase: <Package className="w-4 h-4" />,
      depreciation: <TrendingUp className="w-4 h-4" />,
      procurement: <Receipt className="w-4 h-4" />,
      revenue: <Building2 className="w-4 h-4" />,
    };
    return map[cat] || <FileText className="w-4 h-4" />;
  };

  const categoryLabel = (cat: string) => {
    const labels: Record<string, { zh: string; en: string }> = {
      asset_purchase: { zh: "资产购置", en: "Asset Purchase" },
      depreciation: { zh: "折旧摊销", en: "Depreciation" },
      procurement: { zh: "采购付款", en: "Procurement" },
      revenue: { zh: "营业收入", en: "Revenue" },
    };
    const l = labels[cat];
    return l ? (isZh ? l.zh : l.en) : cat;
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      pending: "text-warning",
      reviewed: "text-success",
      approved: "text-primary",
    };
    return map[s] || "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* Cross-Module KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            icon: Package, label: isZh ? "固定资产总额" : "Total Asset Value",
            value: `¥${(totalAssetValue / 10000).toFixed(1)}万`,
            sub: `${isZh ? "累计折旧" : "Depreciation"}: ¥${(totalDepreciation / 10000).toFixed(1)}万`,
            color: "bg-primary/10 text-primary",
          },
          {
            icon: Receipt, label: isZh ? "待处理采购单" : "Pending Procurement",
            value: `${pendingProcurements}`,
            sub: `${isZh ? "共" : "Total"} ${procurements.length} ${isZh ? "单" : "orders"}`,
            color: "bg-warning/10 text-warning",
          },
          {
            icon: FileText, label: isZh ? "自动生成凭证" : "Auto-Generated Entries",
            value: `${transactions.length}`,
            sub: `${isZh ? "待审核" : "Pending"}: ${pendingReview}`,
            color: "bg-info/10 text-info",
          },
          {
            icon: Link2, label: isZh ? "联动模块" : "Linked Modules",
            value: "6",
            sub: isZh ? "资产·采购·财务·合规·折旧·订单" : "Asset·Procurement·Finance·Compliance·Depreciation·Orders",
            color: "bg-success/10 text-success",
          },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
            <p className="text-xl font-bold font-display">{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Intelligent Flow Diagram */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          {isZh ? "智能联动流程" : "Intelligent Cross-Module Flow"}
        </h3>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {[
            { icon: Package, label: isZh ? "固定资产登记" : "Asset Registration", color: "bg-primary/15 text-primary border-primary/30" },
            { icon: ArrowRight, label: "", color: "text-muted-foreground" },
            { icon: Receipt, label: isZh ? "自动生成采购单" : "Auto Procurement", color: "bg-warning/15 text-warning border-warning/30" },
            { icon: ArrowRight, label: "", color: "text-muted-foreground" },
            { icon: FileText, label: isZh ? "财务凭证入账" : "Finance Entry", color: "bg-success/15 text-success border-success/30" },
            { icon: ArrowRight, label: "", color: "text-muted-foreground" },
            { icon: TrendingUp, label: isZh ? "折旧自动计提" : "Auto Depreciation", color: "bg-info/15 text-info border-info/30" },
            { icon: ArrowRight, label: "", color: "text-muted-foreground" },
            { icon: CheckCircle, label: isZh ? "合规审核" : "Compliance Check", color: "bg-accent/15 text-accent-foreground border-accent/30" },
          ].map((step, i) => (
            step.label ? (
              <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${step.color}`}>
                <step.icon className="w-4 h-4" />
                <span className="text-xs font-medium whitespace-nowrap">{step.label}</span>
              </div>
            ) : (
              <ArrowRight key={i} className="w-4 h-4 text-muted-foreground shrink-0" />
            )
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Cross-Module Transactions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">{isZh ? "最新联动记录" : "Recent Cross-Module Records"}</h3>
            <Badge variant="outline" className="text-[10px]">{isZh ? "自动生成" : "Auto-generated"}</Badge>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{isZh ? "暂无联动记录。注册固定资产或完成订单后将自动生成。" : "No records yet. Register an asset or complete an order to auto-generate."}</p>
            ) : (
              transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === "income" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {categoryIcon(tx.category)}
                    </div>
                    <div>
                      <p className="text-xs font-medium">{isZh ? tx.description_zh : tx.description_en}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[9px] px-1 py-0">{categoryLabel(tx.category)}</Badge>
                        {tx.linked_asset_id && <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/30 text-primary">{isZh ? "资产" : "Asset"}</Badge>}
                        {tx.linked_procurement_id && <Badge variant="outline" className="text-[9px] px-1 py-0 border-warning/30 text-warning">{isZh ? "采购" : "PO"}</Badge>}
                        {tx.linked_depreciation_id && <Badge variant="outline" className="text-[9px] px-1 py-0 border-info/30 text-info">{isZh ? "折旧" : "Dep."}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                      {tx.type === "income" ? "+" : "-"}¥{Number(tx.amount).toLocaleString()}
                    </span>
                    <p className={`text-[9px] ${statusColor(tx.status)}`}>
                      {tx.status === "pending" ? (isZh ? "待审核" : "Pending") : tx.status === "reviewed" ? (isZh ? "已审核" : "Reviewed") : tx.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Asset-Procurement Links */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">{isZh ? "资产↔采购 关联" : "Asset ↔ Procurement Links"}</h3>
            <button onClick={() => navigate("/stores")} className="text-xs text-primary hover:underline flex items-center gap-1">
              {isZh ? "管理资产" : "Manage Assets"} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {procurements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{isZh ? "暂无采购记录。注册固定资产后将自动生成关联采购单。" : "No procurement records. Register an asset to auto-generate."}</p>
            ) : (
              procurements.map((po) => {
                const linkedAsset = assets.find(a => a.id === po.linked_asset_id);
                return (
                  <div key={po.id} className="p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{po.order_number}</span>
                      <Badge variant={po.status === "paid" ? "secondary" : po.status === "received" ? "outline" : "destructive"} className="text-[9px]">
                        {po.status === "paid" ? (isZh ? "已付款" : "Paid") : po.status === "received" ? (isZh ? "已收货" : "Received") : po.status === "draft" ? (isZh ? "草稿" : "Draft") : po.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {linkedAsset ? (
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3 text-primary" />
                            {isZh ? linkedAsset.name_zh : (linkedAsset.name_en || linkedAsset.name_zh)}
                          </span>
                        ) : (
                          <span>{po.supplier_name || (isZh ? "未关联资产" : "No linked asset")}</span>
                        )}
                      </div>
                      <span className="text-sm font-semibold">¥{Number(po.total_amount).toLocaleString()}</span>
                    </div>
                    {po.compliance_checked && (
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle className="w-3 h-3 text-success" />
                        <span className="text-[9px] text-success">{isZh ? "合规已审" : "Compliance Checked"}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Smart Alerts */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          {isZh ? "智能预警" : "Smart Alerts"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {pendingReview > 0 && (
            <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
              <Clock className="w-4 h-4 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">{isZh ? `${pendingReview}条财务凭证待审核` : `${pendingReview} finance entries pending review`}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{isZh ? "资产购置和采购付款自动生成的凭证需人工审核" : "Auto-generated entries from asset purchases need manual review"}</p>
              </div>
            </div>
          )}
          {pendingProcurements > 0 && (
            <div className="flex items-start gap-3 p-3 bg-info/10 rounded-lg border border-info/20">
              <Receipt className="w-4 h-4 text-info mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">{isZh ? `${pendingProcurements}张采购单待付款` : `${pendingProcurements} procurement orders pending payment`}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{isZh ? "付款后将自动生成财务凭证" : "Payment will auto-generate finance entries"}</p>
              </div>
            </div>
          )}
          {assets.filter(a => a.status === "maintenance").length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">{isZh ? `${assets.filter(a => a.status === "maintenance").length}项资产维修中` : `${assets.filter(a => a.status === "maintenance").length} assets under maintenance`}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{isZh ? "维修费用将自动计入管理费用" : "Repair costs will be auto-recorded in admin expenses"}</p>
              </div>
            </div>
          )}
          {pendingReview === 0 && pendingProcurements === 0 && assets.filter(a => a.status === "maintenance").length === 0 && (
            <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
              <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">{isZh ? "所有模块运行正常" : "All modules operating normally"}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{isZh ? "无待处理事项" : "No pending items"}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CrossModuleDashboard;
