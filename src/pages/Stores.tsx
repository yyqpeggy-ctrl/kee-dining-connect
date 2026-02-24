import { motion } from "framer-motion";
import { MapPin, Users, Clock, MoreHorizontal, Phone, Settings, Building2, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/AppLayout";
import { useStore } from "@/contexts/StoreContext";
import { stores as allStoresList } from "@/components/StoreSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StoreRenovationTab from "@/components/stores/StoreRenovationTab";
import StoreVideoTab from "@/components/stores/StoreVideoTab";

interface StoreData {
  id: string;
  nameZh: string;
  nameEn: string;
  address: string;
  phone: string;
  managerZh: string;
  managerEn: string;
  status: "online" | "offline";
  todayRevenue: string;
  todayOrders: number;
  tables: number;
  staff: number;
  openTime: string;
}

const storesData: StoreData[] = [
  { id: "flagship", nameZh: "旗舰店", nameEn: "Flagship - The Bund", address: "上海市黄浦区外滩18号", phone: "021-6888-1001", managerZh: "张经理", managerEn: "Manager Zhang", status: "online", todayRevenue: "¥38,640", todayOrders: 186, tables: 20, staff: 15, openTime: "10:00 - 02:00" },
  { id: "french", nameZh: "法租界店", nameEn: "French Concession", address: "上海市徐汇区永康路68号", phone: "021-6888-1002", managerZh: "李经理", managerEn: "Manager Li", status: "online", todayRevenue: "¥25,280", todayOrders: 142, tables: 16, staff: 12, openTime: "11:00 - 01:00" },
  { id: "jingan", nameZh: "静安店", nameEn: "Jing'an", address: "上海市静安区巨鹿路158号", phone: "021-6888-1003", managerZh: "王经理", managerEn: "Manager Wang", status: "online", todayRevenue: "¥32,150", todayOrders: 168, tables: 18, staff: 14, openTime: "11:00 - 02:00" },
  { id: "xintiandi", nameZh: "新天地店", nameEn: "Xintiandi", address: "上海市黄浦区太仓路181弄", phone: "021-6888-1004", managerZh: "赵经理", managerEn: "Manager Zhao", status: "offline", todayRevenue: "¥0", todayOrders: 0, tables: 14, staff: 10, openTime: "" },
];

const Stores = () => {
  const { currentStore, setCurrentStore, isHQ } = useStore();
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  const displayStores = isHQ ? storesData : storesData.filter(s => s.id === currentStore.id);

  const totalRevenue = storesData.filter((s) => s.status === "online").reduce((sum, s) => sum + parseInt(s.todayRevenue.replace(/[¥,]/g, "")), 0);
  const totalOrders = storesData.reduce((sum, s) => sum + s.todayOrders, 0);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">{t("storeMgmt.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isHQ 
              ? `${storesData.length} ${isZh ? "个独立法人实体" : "independent legal entities"} · ${storesData.filter(s => s.status === "online").length} ${t("storeMgmt.operating")}`
              : `${isZh ? currentStore.name : currentStore.nameEn} — ${isZh ? "独立法人视图" : "Standalone Entity View"}`
            }
          </p>
        </div>
      </div>

      <Tabs defaultValue="stores" className="space-y-6">
        <TabsList>
          <TabsTrigger value="stores">{isZh ? "门店列表" : "Store List"}</TabsTrigger>
          <TabsTrigger value="renovation">{isZh ? "装修与资产" : "Renovation & Assets"}</TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5" />{isZh ? "视频监控" : "Video Surveillance"}</TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="space-y-6">
          {isHQ && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">{t("storeMgmt.allStoreRevenue")}</p>
                <p className="text-2xl font-bold font-display text-primary">¥{totalRevenue.toLocaleString()}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">{t("storeMgmt.allStoreOrders")}</p>
                <p className="text-2xl font-bold font-display">{totalOrders}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">{t("storeMgmt.totalStaff")}</p>
                <p className="text-2xl font-bold font-display">{storesData.reduce((sum, s) => sum + s.staff, 0)}</p>
              </motion.div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {displayStores.map((store, i) => {
              const storeObj = allStoresList.find(s => s.id === store.id);
              return (
                <motion.div key={store.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className={`glass-card rounded-xl p-5 ${currentStore.id === store.id ? "ring-1 ring-primary/50" : ""}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${store.status === "online" ? "bg-primary/15" : "bg-muted"}`}>
                        <MapPin className={`w-5 h-5 ${store.status === "online" ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold font-display">{isZh ? store.nameZh : store.nameEn}</h3>
                          {currentStore.id === store.id && (<span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full">{t("nav.currentStore")}</span>)}
                          <span className={`w-2 h-2 rounded-full ${store.status === "online" ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                        </div>
                        <p className="text-xs text-muted-foreground">{store.address}</p>
                      </div>
                    </div>
                    <button className="p-1.5 rounded-md hover:bg-muted transition-colors"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">{t("storeMgmt.todayRevenue")}</p>
                      <p className={`text-lg font-bold ${store.status === "online" ? "text-primary" : "text-muted-foreground"}`}>{store.todayRevenue}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">{t("storeMgmt.todayOrders")}</p>
                      <p className="text-lg font-bold">{store.todayOrders}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{store.staff} {t("common.staff")}</span>
                    <span>{store.tables} {t("common.tables")}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{store.openTime || t("common.renovating")}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2 text-xs"><Phone className="w-3 h-3 text-muted-foreground" /><span className="text-muted-foreground">{store.phone}</span></div>
                    <div className="flex gap-2">
                      {store.status === "online" && currentStore.id !== store.id && storeObj && (
                        <button onClick={() => setCurrentStore(storeObj)} className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">{t("common.switchTo")}</button>
                      )}
                      <button className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors flex items-center gap-1"><Settings className="w-3 h-3" />{t("common.settings")}</button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="renovation">
          <StoreRenovationTab />
        </TabsContent>

        <TabsContent value="video">
          <StoreVideoTab />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Stores;
