import { motion } from "framer-motion";
import {
  ShoppingCart, Package, Truck, CheckCircle, Clock, AlertTriangle,
  Plus, Search, Building2, Phone, TrendingUp, DollarSign
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useState } from "react";

interface Supplier {
  id: string;
  name: string;
  category: string;
  contact: string;
  phone: string;
  rating: number;
  totalOrders: number;
  lastOrder: string;
  status: "active" | "inactive";
}

interface PurchaseOrder {
  id: string;
  supplier: string;
  items: string;
  total: string;
  orderDate: string;
  deliveryDate: string;
  status: "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";
}

const suppliers: Supplier[] = [
  { id: "S001", name: "大连鑫海水产", category: "海鲜", contact: "王经理", phone: "139****8888", rating: 4.8, totalOrders: 156, lastOrder: "2024-02-08", status: "active" },
  { id: "S002", name: "北京蔬菜批发中心", category: "蔬菜", contact: "李总", phone: "138****6666", rating: 4.5, totalOrders: 289, lastOrder: "2024-02-09", status: "active" },
  { id: "S003", name: "青岛精酿啤酒厂", category: "酒水", contact: "张经理", phone: "137****5555", rating: 4.9, totalOrders: 78, lastOrder: "2024-02-05", status: "active" },
  { id: "S004", name: "河南面粉集团", category: "粮油", contact: "赵总", phone: "136****4444", rating: 4.2, totalOrders: 45, lastOrder: "2024-01-20", status: "inactive" },
  { id: "S005", name: "内蒙古牛羊肉直供", category: "肉类", contact: "刘经理", phone: "135****3333", rating: 4.7, totalOrders: 92, lastOrder: "2024-02-07", status: "active" },
];

const purchaseOrders: PurchaseOrder[] = [
  { id: "PO-2024-001", supplier: "大连鑫海水产", items: "龙虾 50斤, 鲍鱼 30只, 海参 20斤", total: "¥28,500", orderDate: "2024-02-08", deliveryDate: "2024-02-09", status: "shipping" },
  { id: "PO-2024-002", supplier: "北京蔬菜批发中心", items: "西兰花 100斤, 土豆 200斤, 青椒 80斤", total: "¥3,200", orderDate: "2024-02-09", deliveryDate: "2024-02-09", status: "delivered" },
  { id: "PO-2024-003", supplier: "青岛精酿啤酒厂", items: "精酿IPA 10箱, 小麦啤酒 5箱", total: "¥4,800", orderDate: "2024-02-07", deliveryDate: "2024-02-10", status: "confirmed" },
  { id: "PO-2024-004", supplier: "内蒙古牛羊肉直供", items: "牛腩 100斤, 羊排 50斤", total: "¥12,600", orderDate: "2024-02-06", deliveryDate: "2024-02-08", status: "delivered" },
  { id: "PO-2024-005", supplier: "大连鑫海水产", items: "大闸蟹 200只", total: "¥18,000", orderDate: "2024-02-09", deliveryDate: "2024-02-11", status: "pending" },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "待确认", color: "bg-warning/10 text-warning", icon: Clock },
  confirmed: { label: "已确认", color: "bg-info/10 text-info", icon: CheckCircle },
  shipping: { label: "运输中", color: "bg-primary/10 text-primary", icon: Truck },
  delivered: { label: "已送达", color: "bg-success/10 text-success", icon: Package },
  cancelled: { label: "已取消", color: "bg-destructive/10 text-destructive", icon: AlertTriangle },
};

const Procurement = () => {
  const [activeTab, setActiveTab] = useState<"orders" | "suppliers">("orders");
  const [search, setSearch] = useState("");

  const pendingCount = purchaseOrders.filter((o) => o.status === "pending").length;
  const shippingCount = purchaseOrders.filter((o) => o.status === "shipping").length;
  const monthlyTotal = 67100; // Sum of orders

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">采购管理</h1>
          <p className="text-sm text-muted-foreground mt-1">供应商与采购订单管理</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新建采购单
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{purchaseOrders.length}</p>
              <p className="text-xs text-muted-foreground">本月采购单</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount + shippingCount}</p>
              <p className="text-xs text-muted-foreground">待收货</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{suppliers.filter(s => s.status === "active").length}</p>
              <p className="text-xs text-muted-foreground">活跃供应商</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">¥{(monthlyTotal / 10000).toFixed(1)}万</p>
              <p className="text-xs text-muted-foreground">本月采购额</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
          <button onClick={() => setActiveTab("orders")} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === "orders" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            采购订单
          </button>
          <button onClick={() => setActiveTab("suppliers")} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === "suppliers" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            供应商管理
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      {activeTab === "orders" ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {purchaseOrders.map((order, i) => {
            const config = statusConfig[order.status];
            const Icon = config.icon;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono">{order.id}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${config.color}`}>
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{order.supplier}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-primary">{order.total}</span>
                </div>
                <p className="text-sm text-secondary-foreground mb-3 bg-muted/30 rounded-lg p-2">{order.items}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>下单日期: {order.orderDate}</span>
                  <span>预计送达: {order.deliveryDate}</span>
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
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">供应商</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">品类</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">联系人</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">评分</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">订单数</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier, i) => (
                  <motion.tr key={supplier.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-medium">
                          {supplier.name.charAt(0)}
                        </div>
                        <span className="font-medium">{supplier.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{supplier.category}</td>
                    <td className="py-3 px-4">
                      <p>{supplier.contact}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />{supplier.phone}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-primary font-semibold">★ {supplier.rating}</span>
                    </td>
                    <td className="py-3 px-4 text-center">{supplier.totalOrders}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        supplier.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      }`}>
                        {supplier.status === "active" ? "合作中" : "暂停"}
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
