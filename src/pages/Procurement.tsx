import { motion } from "framer-motion";
import {
  ShoppingCart, Package, Clock, Plus, Search, Building2, DollarSign,
  CheckCircle, FileText, Shield, CreditCard
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useStore } from "@/contexts/StoreContext";
import StoreIndicator from "@/components/StoreIndicator";
import ProcurementOrdersTab from "@/components/procurement/ProcurementOrdersTab";
import ProcurementApprovalTab from "@/components/procurement/ProcurementApprovalTab";
import ProcurementPaymentTab from "@/components/procurement/ProcurementPaymentTab";
import ProcurementContractTab from "@/components/procurement/ProcurementContractTab";

const Procurement = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const { currentStore, isHQ } = useStore();
  const [orders, setOrders] = useState<Tables<"procurement_orders">[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("procurement_orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter(o => {
    if (!search) return true;
    const s = search.toLowerCase();
    return o.order_number.toLowerCase().includes(s) ||
      o.supplier_name.toLowerCase().includes(s) ||
      o.store_name_zh.toLowerCase().includes(s) ||
      o.store_name_en.toLowerCase().includes(s);
  });

  const pendingCount = orders.filter(o => o.status === "pending").length;
  const unpaidCount = orders.filter(o => ["confirmed", "shipping", "received"].includes(o.status)).length;
  const totalSpend = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const paidTotal = orders.filter(o => o.status === "paid").reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">{t("procurementMgmt.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isZh ? currentStore.name : currentStore.nameEn} · {t("procurementMgmt.subtitle")}</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t("procurementMgmt.newPO")}
        </button>
      </div>

      {/* Store indicator */}
      <StoreIndicator />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><ShoppingCart className="w-4 h-4 text-primary" /></div>
            <div><p className="text-2xl font-bold">{orders.length}</p><p className="text-xs text-muted-foreground">{t("procurementMgmt.monthlyPOs")}</p></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center"><Clock className="w-4 h-4 text-warning" /></div>
            <div><p className="text-2xl font-bold">{pendingCount}</p><p className="text-xs text-muted-foreground">{t("procurementMgmt.pendingApproval")}</p></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center"><CreditCard className="w-4 h-4 text-destructive" /></div>
            <div><p className="text-2xl font-bold">{unpaidCount}</p><p className="text-xs text-muted-foreground">{t("procurementMgmt.unpaidAmount")}</p></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center"><DollarSign className="w-4 h-4 text-success" /></div>
            <div><p className="text-2xl font-bold">¥{(totalSpend / 10000).toFixed(1)}{isZh ? "万" : "K"}</p><p className="text-xs text-muted-foreground">{t("procurementMgmt.totalAmount")}</p></div>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder={t("common.search") + "..."} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary/50" />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted/50">
          <TabsTrigger value="orders" className="gap-2 data-[state=active]:bg-primary/20 text-xs">
            <Package className="w-4 h-4" />{t("procurementMgmt.purchaseOrders")}
          </TabsTrigger>
          <TabsTrigger value="approval" className="gap-2 data-[state=active]:bg-primary/20 text-xs">
            <CheckCircle className="w-4 h-4" />{t("procurementMgmt.approvalTab")}
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2 data-[state=active]:bg-primary/20 text-xs">
            <CreditCard className="w-4 h-4" />{t("procurementMgmt.paymentTab")}
          </TabsTrigger>
          <TabsTrigger value="contract" className="gap-2 data-[state=active]:bg-primary/20 text-xs">
            <FileText className="w-4 h-4" />{t("procurementMgmt.contractTab")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <ProcurementOrdersTab orders={filtered} onRefresh={fetchOrders} />
        </TabsContent>
        <TabsContent value="approval">
          <ProcurementApprovalTab orders={filtered} onRefresh={fetchOrders} />
        </TabsContent>
        <TabsContent value="payment">
          <ProcurementPaymentTab orders={filtered} onRefresh={fetchOrders} />
        </TabsContent>
        <TabsContent value="contract">
          <ProcurementContractTab orders={filtered} onRefresh={fetchOrders} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Procurement;
