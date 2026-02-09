import { motion } from "framer-motion";
import { MapPin, Users, TrendingUp, Settings, Phone, Clock, MoreHorizontal } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useStore } from "@/contexts/StoreContext";

interface StoreData {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  status: "online" | "offline";
  todayRevenue: string;
  todayOrders: number;
  tables: number;
  staff: number;
  openTime: string;
}

const storesData: StoreData[] = [
  {
    id: "1",
    name: "总店",
    address: "朝阳区建国路88号",
    phone: "010-8888-1001",
    manager: "张经理",
    status: "online",
    todayRevenue: "¥28,640",
    todayOrders: 186,
    tables: 20,
    staff: 15,
    openTime: "10:00 - 22:00",
  },
  {
    id: "2",
    name: "国贸分店",
    address: "朝阳区国贸中心B座1层",
    phone: "010-8888-1002",
    manager: "李经理",
    status: "online",
    todayRevenue: "¥35,280",
    todayOrders: 224,
    tables: 25,
    staff: 18,
    openTime: "10:00 - 23:00",
  },
  {
    id: "3",
    name: "三里屯分店",
    address: "朝阳区三里屯路19号",
    phone: "010-8888-1003",
    manager: "王经理",
    status: "online",
    todayRevenue: "¥42,150",
    todayOrders: 268,
    tables: 30,
    staff: 22,
    openTime: "11:00 - 02:00",
  },
  {
    id: "4",
    name: "望京分店",
    address: "朝阳区望京SOHO T1",
    phone: "010-8888-1004",
    manager: "赵经理",
    status: "offline",
    todayRevenue: "¥0",
    todayOrders: 0,
    tables: 18,
    staff: 12,
    openTime: "装修中",
  },
];

const Stores = () => {
  const { currentStore, setCurrentStore } = useStore();

  const totalRevenue = storesData
    .filter((s) => s.status === "online")
    .reduce((sum, s) => sum + parseInt(s.todayRevenue.replace(/[¥,]/g, "")), 0);
  const totalOrders = storesData.reduce((sum, s) => sum + s.todayOrders, 0);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">门店管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            共 {storesData.length} 家门店 · {storesData.filter((s) => s.status === "online").length} 家营业中
          </p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          + 新增门店
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">全店今日营收</p>
          <p className="text-2xl font-bold font-display text-primary">¥{totalRevenue.toLocaleString()}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-xl p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">全店今日订单</p>
          <p className="text-2xl font-bold font-display">{totalOrders}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">员工总数</p>
          <p className="text-2xl font-bold font-display">{storesData.reduce((sum, s) => sum + s.staff, 0)}</p>
        </motion.div>
      </div>

      {/* Store Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {storesData.map((store, i) => (
          <motion.div
            key={store.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`glass-card rounded-xl p-5 ${
              currentStore.id === store.id ? "ring-1 ring-primary/50" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  store.status === "online" ? "bg-primary/15" : "bg-muted"
                }`}>
                  <MapPin className={`w-5 h-5 ${store.status === "online" ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold font-display">{store.name}</h3>
                    {currentStore.id === store.id && (
                      <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full">当前</span>
                    )}
                    <span className={`w-2 h-2 rounded-full ${
                      store.status === "online" ? "bg-success animate-pulse" : "bg-muted-foreground"
                    }`} />
                  </div>
                  <p className="text-xs text-muted-foreground">{store.address}</p>
                </div>
              </div>
              <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground mb-1">今日营收</p>
                <p className={`text-lg font-bold ${store.status === "online" ? "text-primary" : "text-muted-foreground"}`}>
                  {store.todayRevenue}
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground mb-1">今日订单</p>
                <p className="text-lg font-bold">{store.todayOrders}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {store.staff} 员工
              </span>
              <span>{store.tables} 桌位</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {store.openTime}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs">
                <Phone className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">{store.phone}</span>
              </div>
              <div className="flex gap-2">
                {store.status === "online" && currentStore.id !== store.id && (
                  <button
                    onClick={() => setCurrentStore({ id: store.id, name: store.name, address: store.address, status: store.status })}
                    className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                  >
                    切换
                  </button>
                )}
                <button className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors flex items-center gap-1">
                  <Settings className="w-3 h-3" />
                  设置
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Stores;
