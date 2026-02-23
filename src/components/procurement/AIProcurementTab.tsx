import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, AlertTriangle, Clock, CheckCircle, Loader2, ShoppingCart, Trash2, Plus, Minus, Send, CalendarClock, RefreshCw, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
interface Suggestion {
  item_name_zh: string;
  item_name_en?: string;
  category?: string;
  quantity: number;
  unit: string;
  estimated_unit_price?: number;
  urgency: "urgent" | "normal" | "low";
  reason_zh: string;
  reason_en?: string;
  suggested_supplier: string;
  current_stock?: number;
  days_until_stockout?: number;
}

interface AIResult {
  suggestions: Suggestion[];
  summary_zh: string;
  summary_en?: string;
  total_estimated_cost: number;
}

interface DailySuggestion {
  id: string;
  store_name_zh: string;
  store_name_en: string;
  suggestions: Suggestion[];
  summary_zh: string;
  summary_en?: string;
  total_estimated_cost: number;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
}

const AIProcurementTab = ({ onRefresh }: { onRefresh: () => void }) => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const { currentStore, storeId } = useStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editedSuggestions, setEditedSuggestions] = useState<Suggestion[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [dailySuggestions, setDailySuggestions] = useState<DailySuggestion[]>([]);
  const [loadingDaily, setLoadingDaily] = useState(true);

  // Fetch pending daily suggestions
  const fetchDailySuggestions = useCallback(async () => {
    setLoadingDaily(true);
    const { data, error } = await supabase
      .from("daily_procurement_suggestions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5);
    if (!error && data) setDailySuggestions(data as unknown as DailySuggestion[]);
    setLoadingDaily(false);
  }, []);

  useEffect(() => { fetchDailySuggestions(); }, [fetchDailySuggestions]);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-procurement-suggest", {
        body: {
          store_id: storeId,
          store_name_zh: currentStore.name,
          store_name_en: currentStore.nameEn,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as AIResult);
      setEditedSuggestions((data as AIResult).suggestions);
      // Select all by default
      setSelected(new Set((data as AIResult).suggestions.map((_, i) => i)));
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || (isZh ? "AI分析失败" : "AI analysis failed"));
    } finally {
      setLoading(false);
    }
  }, [storeId, currentStore, isZh]);

  const toggleSelect = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const updateQuantity = (idx: number, delta: number) => {
    setEditedSuggestions(prev => prev.map((s, i) =>
      i === idx ? { ...s, quantity: Math.max(1, s.quantity + delta) } : s
    ));
  };

  const removeSuggestion = (idx: number) => {
    setEditedSuggestions(prev => prev.filter((_, i) => i !== idx));
    setSelected(prev => {
      const next = new Set<number>();
      prev.forEach(v => {
        if (v < idx) next.add(v);
        else if (v > idx) next.add(v - 1);
      });
      return next;
    });
  };

  const handleConfirmAndCreate = async () => {
    const selectedItems = editedSuggestions.filter((_, i) => selected.has(i));
    if (selectedItems.length === 0) {
      toast.error(isZh ? "请至少选择一项采购建议" : "Select at least one suggestion");
      return;
    }

    setConfirming(true);
    try {
      // Group by supplier
      const bySupplier: Record<string, Suggestion[]> = {};
      selectedItems.forEach(item => {
        const key = item.suggested_supplier || "未指定";
        if (!bySupplier[key]) bySupplier[key] = [];
        bySupplier[key].push(item);
      });

      // Create one procurement order per supplier
      for (const [supplierName, items] of Object.entries(bySupplier)) {
        // Look up supplier_id
        const { data: supplierData } = await supabase
          .from("suppliers")
          .select("id, phone, contact_person")
          .eq("name", supplierName)
          .maybeSingle();

        const totalAmount = items.reduce((sum, i) => sum + (i.quantity * (i.estimated_unit_price || 0)), 0);
        const orderItems = items.map(i => ({
          name_zh: i.item_name_zh,
          name_en: i.item_name_en || "",
          quantity: i.quantity,
          unit: i.unit,
          unit_price: i.estimated_unit_price || 0,
          category: i.category || "other",
        }));

        const { data: orderData, error } = await supabase.from("procurement_orders").insert({
          type: "ingredient",
          status: "confirmed",
          supplier_name: supplierName,
          supplier_id: supplierData?.id || null,
          supplier_contact: supplierData?.contact_person || "",
          total_amount: totalAmount,
          items: orderItems,
          store_id: storeId,
          store_name_zh: currentStore.name,
          store_name_en: currentStore.nameEn,
          created_by: user?.id || null,
          notes: isZh ? "AI智能采购建议 - 经理确认下单" : "AI procurement suggestion - Manager confirmed",
        }).select("order_number").single();

        if (error) {
          console.error("Create order error:", error);
          toast.error(`${supplierName}: ${error.message}`);
          continue;
        }

        toast.success(isZh
          ? `已为 ${supplierName} 创建采购单 (${items.length}项, ¥${totalAmount.toLocaleString()})`
          : `Order created for ${supplierName} (${items.length} items, ¥${totalAmount.toLocaleString()})`
        );

        // Auto-notify supplier via WeChat
        try {
          const { data: notifyResult } = await supabase.functions.invoke("notify-supplier", {
            body: {
              supplier_name: supplierName,
              supplier_phone: supplierData?.phone || "",
              supplier_contact: supplierData?.contact_person || "",
              order_number: orderData?.order_number || "",
              items: orderItems,
              total_amount: totalAmount,
              currency: "CNY",
              store_name: currentStore.name,
              notes: "",
            },
          });
          if (notifyResult?.mode === "mock") {
            toast.info(isZh
              ? `📱 ${supplierName} 通知已模拟发送（配置微信凭证后自动切换真实发送）`
              : `📱 ${supplierName} notification simulated (configure WeChat to enable real sending)`
            );
          } else {
            toast.success(isZh ? `📱 已通知 ${supplierName}` : `📱 Notified ${supplierName}`);
          }
        } catch (notifyErr) {
          console.error("Notify error:", notifyErr);
          toast.warning(isZh ? `⚠ ${supplierName} 通知发送失败` : `⚠ Failed to notify ${supplierName}`);
        }
      }


      setResult(null);
      setEditedSuggestions([]);
      setSelected(new Set());
    } catch (e: any) {
      toast.error(e.message || (isZh ? "下单失败" : "Failed to create orders"));
    } finally {
      setConfirming(false);
    }
  };

  const handleApproveDailySuggestion = async (ds: DailySuggestion) => {
    // Load suggestions into the editor for review
    setResult({
      suggestions: ds.suggestions,
      summary_zh: ds.summary_zh,
      summary_en: ds.summary_en,
      total_estimated_cost: ds.total_estimated_cost,
    });
    setEditedSuggestions(ds.suggestions);
    setSelected(new Set(ds.suggestions.map((_, i) => i)));
    // Mark as approved
    await supabase.from("daily_procurement_suggestions").update({
      status: "approved",
      reviewed_by: user?.id || null,
      reviewed_at: new Date().toISOString(),
    }).eq("id", ds.id);
    setDailySuggestions(prev => prev.filter(d => d.id !== ds.id));
    toast.success(isZh ? "已加载建议，请确认后下单" : "Suggestions loaded, confirm to place orders");
  };

  const handleRejectDailySuggestion = async (ds: DailySuggestion) => {
    await supabase.from("daily_procurement_suggestions").update({
      status: "rejected",
      reviewed_by: user?.id || null,
      reviewed_at: new Date().toISOString(),
    }).eq("id", ds.id);
    setDailySuggestions(prev => prev.filter(d => d.id !== ds.id));
    toast.info(isZh ? "已忽略该建议" : "Suggestion dismissed");
  };

  const urgencyConfig = {
    urgent: { color: "text-destructive", bg: "bg-destructive/10", icon: AlertTriangle, label: isZh ? "紧急" : "Urgent" },
    normal: { color: "text-warning", bg: "bg-warning/10", icon: Clock, label: isZh ? "正常" : "Normal" },
    low: { color: "text-success", bg: "bg-success/10", icon: CheckCircle, label: isZh ? "低" : "Low" },
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{isZh ? "AI 智能采购建议" : "AI Procurement Suggestions"}</h3>
              <p className="text-xs text-muted-foreground">
                {isZh ? "基于库存、销售、活动、季节等多维数据分析" : "Based on inventory, sales, events, and seasonal analysis"}
              </p>
            </div>
          </div>
          <button
            onClick={fetchSuggestions}
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? (isZh ? "分析中..." : "Analyzing...") : (isZh ? "生成采购建议" : "Generate Suggestions")}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="glass-card rounded-xl p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm font-medium">{isZh ? "AI 正在分析库存、销售和活动数据..." : "AI analyzing inventory, sales, and event data..."}</p>
          <p className="text-xs text-muted-foreground mt-1">{isZh ? "预计需要10-20秒" : "Estimated 10-20 seconds"}</p>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Summary */}
            <div className="glass-card rounded-xl p-4 border-l-4 border-l-primary">
              <p className="text-sm">{isZh ? result.summary_zh : (result.summary_en || result.summary_zh)}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {isZh ? "预估总成本" : "Estimated total"}: <span className="font-bold text-primary">¥{result.total_estimated_cost.toLocaleString()}</span>
                {" · "}{editedSuggestions.length} {isZh ? "项建议" : "suggestions"}
                {" · "}{selected.size} {isZh ? "项已选" : "selected"}
              </p>
            </div>

            {/* Suggestion cards */}
            <div className="space-y-3">
              {editedSuggestions.map((item, idx) => {
                const urg = urgencyConfig[item.urgency] || urgencyConfig.normal;
                const UrgIcon = urg.icon;
                const isSelected = selected.has(idx);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`glass-card rounded-xl p-4 transition-all cursor-pointer ${isSelected ? "ring-2 ring-primary/50 border-l-4 border-l-primary" : "opacity-60"}`}
                    onClick={() => toggleSelect(idx)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${urg.bg} ${urg.color} font-medium flex items-center gap-1`}>
                            <UrgIcon className="w-3 h-3" />{urg.label}
                          </span>
                          <span className="font-bold text-sm">{item.item_name_zh}</span>
                          {item.item_name_en && <span className="text-xs text-muted-foreground">{item.item_name_en}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{isZh ? item.reason_zh : (item.reason_en || item.reason_zh)}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-muted-foreground">
                            {isZh ? "供应商" : "Supplier"}: <span className="text-foreground font-medium">{item.suggested_supplier}</span>
                          </span>
                          {item.current_stock !== undefined && (
                            <span className="text-muted-foreground">
                              {isZh ? "当前库存" : "Stock"}: <span className={item.current_stock <= 0 ? "text-destructive font-bold" : "text-foreground"}>{item.current_stock}{item.unit}</span>
                            </span>
                          )}
                          {item.days_until_stockout !== undefined && item.days_until_stockout <= 7 && (
                            <span className="text-destructive font-medium">
                              ⚠ {item.days_until_stockout}{isZh ? "天后缺货" : "d to stockout"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQuantity(idx, -1)} className="w-6 h-6 rounded bg-muted flex items-center justify-center hover:bg-muted-foreground/20">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold text-sm min-w-[3rem] text-center">{item.quantity}{item.unit}</span>
                          <button onClick={() => updateQuantity(idx, 1)} className="w-6 h-6 rounded bg-muted flex items-center justify-center hover:bg-muted-foreground/20">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        {item.estimated_unit_price && (
                          <span className="text-xs text-primary font-bold">¥{(item.quantity * item.estimated_unit_price).toLocaleString()}</span>
                        )}
                        <button onClick={() => removeSuggestion(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Action bar */}
            <div className="glass-card rounded-xl p-4 flex items-center justify-between sticky bottom-4">
              <div className="text-sm">
                <span className="font-bold">{selected.size}/{editedSuggestions.length}</span>
                <span className="text-muted-foreground ml-1">{isZh ? "项已选" : "selected"}</span>
                <span className="ml-3 font-bold text-primary">
                  ¥{editedSuggestions.filter((_, i) => selected.has(i)).reduce((sum, s) => sum + s.quantity * (s.estimated_unit_price || 0), 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setResult(null); setEditedSuggestions([]); setSelected(new Set()); }}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isZh ? "取消" : "Cancel"}
                </button>
                <button
                  onClick={handleConfirmAndCreate}
                  disabled={confirming || selected.size === 0}
                  className="px-4 py-2 bg-success text-success-foreground rounded-lg text-sm font-medium hover:bg-success/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                  {confirming
                    ? (isZh ? "正在下单..." : "Creating orders...")
                    : (isZh ? `确认下单 (${selected.size}项)` : `Confirm (${selected.size} items)`)
                  }
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending daily suggestions */}
      {!result && !loading && dailySuggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="w-4 h-4 text-primary" />
            {isZh ? "每日自动分析建议（待审批）" : "Daily Auto-Analysis (Pending Review)"}
            <button onClick={fetchDailySuggestions} className="ml-auto text-muted-foreground hover:text-foreground">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          {dailySuggestions.map(ds => (
            <motion.div
              key={ds.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-4 border-l-4 border-l-warning"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning font-medium">
                      {isZh ? "待审批" : "Pending"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(ds.created_at), "yyyy-MM-dd HH:mm")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {ds.store_name_zh}
                    </span>
                  </div>
                  <p className="text-sm mb-1">{isZh ? ds.summary_zh : (ds.summary_en || ds.summary_zh)}</p>
                  <p className="text-xs text-muted-foreground">
                    {(ds.suggestions || []).length} {isZh ? "项建议" : "suggestions"}
                    {" · "}
                    {isZh ? "预估" : "Est."} <span className="font-bold text-primary">¥{(ds.total_estimated_cost || 0).toLocaleString()}</span>
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleApproveDailySuggestion(ds)}
                    className="px-3 py-1.5 bg-success text-success-foreground rounded-lg text-xs font-medium hover:bg-success/90 flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    {isZh ? "审批下单" : "Review & Order"}
                  </button>
                  <button
                    onClick={() => handleRejectDailySuggestion(ds)}
                    className="px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-xs font-medium hover:bg-destructive/10 hover:text-destructive flex items-center gap-1"
                  >
                    <XCircle className="w-3 h-3" />
                    {isZh ? "忽略" : "Dismiss"}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && dailySuggestions.length === 0 && (
        <div className="glass-card rounded-xl p-12 text-center">
          <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">{isZh ? "点击上方按钮，AI将分析库存、销售、活动等数据生成采购建议" : "Click above to let AI analyze your data and generate procurement suggestions"}</p>
          <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
            <CalendarClock className="w-3 h-3" />
            {isZh ? "每日早上8:00（北京时间）系统将自动运行AI分析" : "Daily auto-analysis runs at 8:00 AM (Beijing time)"}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default AIProcurementTab;
