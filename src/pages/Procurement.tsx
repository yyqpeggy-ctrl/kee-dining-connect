import { motion } from "framer-motion";
import {
  ShoppingCart, Package, Truck, CheckCircle, Clock, AlertTriangle,
  Plus, Search, Building2, Phone, TrendingUp, DollarSign
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Supplier {
  id: string;
  nameZh: string;
  nameEn: string;
  categoryZh: string;
  categoryEn: string;
  contactZh: string;
  contactEn: string;
  phone: string;
  rating: number;
  totalOrders: number;
  lastOrder: string;
  status: "active" | "inactive";
}

interface PurchaseOrder {
  id: string;
  supplierZh: string;
  supplierEn: string;
  itemsZh: string;
  itemsEn: string;
  total: string;
  orderDate: string;
  deliveryDate: string;
  status: "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";
}

const suppliers: Supplier[] = [
  { id: "S001", nameZh: "西班牙德赫萨火腿", nameEn: "Dehesa Ibérica Imports", categoryZh: "火腿/腌肉", categoryEn: "Charcuterie", contactZh: "Carlos经理", contactEn: "Manager Carlos", phone: "139****8888", rating: 4.9, totalOrders: 86, lastOrder: "2026-02-08", status: "active" },
  { id: "S002", nameZh: "上海崇明有机农场", nameEn: "Chongming Organic Farm", categoryZh: "蔬菜/沙拉", categoryEn: "Vegetables/Salad", contactZh: "李总", contactEn: "Director Li", phone: "138****6666", rating: 4.5, totalOrders: 189, lastOrder: "2026-02-09", status: "active" },
  { id: "S003", nameZh: "Barcelona精酿贸易", nameEn: "Barcelona Craft Trading", categoryZh: "酒水", categoryEn: "Beverages", contactZh: "张经理", contactEn: "Manager Zhang", phone: "137****5555", rating: 4.8, totalOrders: 78, lastOrder: "2026-02-05", status: "active" },
  { id: "S004", nameZh: "KTV设备供应商", nameEn: "KTV Equipment Co.", categoryZh: "KTV设备/耗材", categoryEn: "KTV Equipment", contactZh: "王经理", contactEn: "Manager Wang", phone: "136****4444", rating: 4.6, totalOrders: 35, lastOrder: "2026-01-20", status: "active" },
  { id: "S005", nameZh: "澳洲牛肉直供", nameEn: "Aussie Beef Direct", categoryZh: "肉类", categoryEn: "Meat", contactZh: "Mark刘", contactEn: "Manager Mark", phone: "135****3333", rating: 4.7, totalOrders: 92, lastOrder: "2026-02-07", status: "active" },
  { id: "S006", nameZh: "飞镖&桌游批发", nameEn: "Darts & Games Wholesale", categoryZh: "游戏设备", categoryEn: "Game Equipment", contactZh: "David", contactEn: "David", phone: "134****2222", rating: 4.4, totalOrders: 18, lastOrder: "2026-01-15", status: "active" },
];

const purchaseOrders: PurchaseOrder[] = [
  { id: "PO-2026-001", supplierZh: "西班牙德赫萨火腿", supplierEn: "Dehesa Ibérica Imports", itemsZh: "伊比利亚火腿 5kg, 西班牙辣肠 3kg", itemsEn: "Jamón Ibérico 5kg, Chorizo 3kg", total: "¥18,500", orderDate: "2026-02-08", deliveryDate: "2026-02-12", status: "shipping" },
  { id: "PO-2026-002", supplierZh: "上海崇明有机农场", supplierEn: "Chongming Organic Farm", itemsZh: "芝麻菜 20kg, 番茄 30kg, 辣椒 10kg", itemsEn: "Arugula 20kg, Tomato 30kg, Peppers 10kg", total: "¥2,800", orderDate: "2026-02-09", deliveryDate: "2026-02-09", status: "delivered" },
  { id: "PO-2026-003", supplierZh: "Barcelona精酿贸易", supplierEn: "Barcelona Craft Trading", itemsZh: "Estrella Damm 10箱, Sangria原料 5箱, 精酿IPA 8箱", itemsEn: "Estrella Damm 10 cases, Sangria mix 5 cases, Craft IPA 8 cases", total: "¥9,200", orderDate: "2026-02-07", deliveryDate: "2026-02-10", status: "confirmed" },
  { id: "PO-2026-004", supplierZh: "KTV设备供应商", supplierEn: "KTV Equipment Co.", itemsZh: "话筒套500个, 音响配件, 灯光效果器", itemsEn: "Mic covers 500pcs, Speaker parts, Light effects unit", total: "¥4,500", orderDate: "2026-02-06", deliveryDate: "2026-02-08", status: "delivered" },
  { id: "PO-2026-005", supplierZh: "飞镖&桌游批发", supplierEn: "Darts & Games Wholesale", itemsZh: "飞镖针10套, 飞镖靶面2个, 桌游补充包", itemsEn: "Dart tips 10 sets, Dartboards 2pcs, Board game expansions", total: "¥3,200", orderDate: "2026-02-09", deliveryDate: "2026-02-11", status: "pending" },
];

const Procurement = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const [activeTab, setActiveTab] = useState<"orders" | "suppliers">("orders");
  const [search, setSearch] = useState("");

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: t("procurementMgmt.pending"), color: "bg-warning/10 text-warning", icon: Clock },
    confirmed: { label: t("procurementMgmt.confirmed"), color: "bg-info/10 text-info", icon: CheckCircle },
    shipping: { label: t("procurementMgmt.shipping"), color: "bg-primary/10 text-primary", icon: Truck },
    delivered: { label: t("procurementMgmt.delivered"), color: "bg-success/10 text-success", icon: Package },
    cancelled: { label: t("procurementMgmt.cancelled"), color: "bg-destructive/10 text-destructive", icon: AlertTriangle },
  };

  const pendingCount = purchaseOrders.filter((o) => o.status === "pending").length;
  const shippingCount = purchaseOrders.filter((o) => o.status === "shipping").length;
  const monthlyTotal = 58900;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">{t("procurementMgmt.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("procurementMgmt.subtitle")}</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t("procurementMgmt.newPO")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><ShoppingCart className="w-4 h-4 text-primary" /></div>
            <div><p className="text-2xl font-bold">{purchaseOrders.length}</p><p className="text-xs text-muted-foreground">{t("procurementMgmt.monthlyPOs")}</p></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center"><Clock className="w-4 h-4 text-warning" /></div>
            <div><p className="text-2xl font-bold">{pendingCount + shippingCount}</p><p className="text-xs text-muted-foreground">{t("procurementMgmt.pendingDelivery")}</p></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center"><Building2 className="w-4 h-4 text-success" /></div>
            <div><p className="text-2xl font-bold">{suppliers.filter(s => s.status === "active").length}</p><p className="text-xs text-muted-foreground">{t("procurementMgmt.activeSuppliers")}</p></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center"><DollarSign className="w-4 h-4 text-info" /></div>
            <div><p className="text-2xl font-bold">¥{(monthlyTotal / 10000).toFixed(1)}{isZh ? '万' : 'K'}</p><p className="text-xs text-muted-foreground">{t("procurementMgmt.monthlySpend")}</p></div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
          <button onClick={() => setActiveTab("orders")} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === "orders" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{t("procurementMgmt.purchaseOrders")}</button>
          <button onClick={() => setActiveTab("suppliers")} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === "suppliers" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{t("procurementMgmt.supplierMgmt")}</button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder={t("common.search") + "..."} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary/50" />
        </div>
      </div>

      {activeTab === "orders" ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {purchaseOrders.map((order, i) => {
            const config = statusConfig[order.status];
            const Icon = config.icon;
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="w-5 h-5 text-primary" /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono">{order.id}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${config.color}`}><Icon className="w-3 h-3" />{config.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{isZh ? order.supplierZh : order.supplierEn}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-primary">{order.total}</span>
                </div>
                <p className="text-sm text-secondary-foreground mb-3 bg-muted/30 rounded-lg p-2">{isZh ? order.itemsZh : order.itemsEn}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("procurementMgmt.orderDate")}: {order.orderDate}</span>
                  <span>{t("procurementMgmt.deliveryDate")}: {order.deliveryDate}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{t("procurementMgmt.supplier")}</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{t("common.type")}</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">{t("procurementMgmt.contact")}</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">{t("procurementMgmt.rating")}</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">{t("procurementMgmt.orderCount")}</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">{t("common.status")}</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier, i) => (
                  <motion.tr key={supplier.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-medium">{(isZh ? supplier.nameZh : supplier.nameEn).charAt(0)}</div>
                        <span className="font-medium">{isZh ? supplier.nameZh : supplier.nameEn}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{isZh ? supplier.categoryZh : supplier.categoryEn}</td>
                    <td className="py-3 px-4">
                      <p>{isZh ? supplier.contactZh : supplier.contactEn}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{supplier.phone}</p>
                    </td>
                    <td className="py-3 px-4 text-center"><span className="text-primary font-semibold">★ {supplier.rating}</span></td>
                    <td className="py-3 px-4 text-center">{supplier.totalOrders}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${supplier.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        {supplier.status === "active" ? t("procurementMgmt.active") : t("procurementMgmt.inactive")}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </AppLayout>
  );
};

export default Procurement;
