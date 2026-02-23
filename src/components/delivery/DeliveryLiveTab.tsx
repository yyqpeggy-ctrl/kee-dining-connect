import { motion } from "framer-motion";
import { Bike, Clock, CheckCircle2, Package, AlertTriangle, MapPin, Phone, Timer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface DeliveryOrder {
  id: string;
  platform: "eleme" | "meituan";
  orderNo: string;
  customer: string;
  address: string;
  items: { name: string; qty: number }[];
  total: number;
  deliveryFee: number;
  status: "pending" | "preparing" | "delivering" | "completed" | "cancelled";
  orderTime: string;
  expectedTime: string;
  rider?: string;
  riderPhone?: string;
}

export const mockOrders: DeliveryOrder[] = [
  { id: "1", platform: "meituan", orderNo: "MT-20260223-0891", customer: "张先生", address: "朝阳区建国路88号SOHO现代城A座", items: [{ name: "西班牙火腿拼盘", qty: 1 }, { name: "Sangria红酒", qty: 2 }], total: 268, deliveryFee: 5, status: "pending", orderTime: "12:15", expectedTime: "12:55" },
  { id: "2", platform: "eleme", orderNo: "EL-20260223-1234", customer: "李女士", address: "海淀区中关村大街1号", items: [{ name: "Nachos芝士玉米片", qty: 1 }, { name: "墨西哥卷饼", qty: 2 }, { name: "精酿啤酒", qty: 3 }], total: 186, deliveryFee: 3, status: "preparing", orderTime: "12:08", expectedTime: "12:48" },
  { id: "3", platform: "meituan", orderNo: "MT-20260223-0756", customer: "王先生", address: "东城区王府井大街218号", items: [{ name: "战斧牛排", qty: 1 }], total: 388, deliveryFee: 8, status: "delivering", orderTime: "11:52", expectedTime: "12:35", rider: "刘师傅", riderPhone: "138****6789" },
  { id: "4", platform: "eleme", orderNo: "EL-20260223-0988", customer: "赵女士", address: "西城区金融街19号", items: [{ name: "蒜香虾", qty: 2 }, { name: "薯条拼盘", qty: 1 }], total: 156, deliveryFee: 4, status: "completed", orderTime: "11:30", expectedTime: "12:10" },
  { id: "5", platform: "meituan", orderNo: "MT-20260223-0623", customer: "孙先生", address: "丰台区丽泽商务区", items: [{ name: "小食拼盘", qty: 1 }, { name: "鸡尾酒套餐", qty: 1 }], total: 198, deliveryFee: 6, status: "completed", orderTime: "11:15", expectedTime: "11:55" },
  { id: "6", platform: "eleme", orderNo: "EL-20260223-0445", customer: "周女士", address: "朝阳区望京SOHO", items: [{ name: "烤羊排", qty: 1 }, { name: "红酒", qty: 1 }], total: 328, deliveryFee: 5, status: "cancelled", orderTime: "11:00", expectedTime: "11:40" },
];

const DeliveryLiveTab = () => {
  const { t } = useTranslation();

  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: t("deliveryMgmt.pendingOrders"), color: "bg-warning text-warning-foreground", icon: Clock },
    preparing: { label: t("deliveryMgmt.preparingOrders"), color: "bg-info text-info-foreground", icon: Package },
    delivering: { label: t("deliveryMgmt.deliveringOrders"), color: "bg-primary text-primary-foreground", icon: Bike },
    completed: { label: t("deliveryMgmt.completedOrders"), color: "bg-success text-success-foreground", icon: CheckCircle2 },
    cancelled: { label: t("deliveryMgmt.cancelledOrders"), color: "bg-destructive text-destructive-foreground", icon: AlertTriangle },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {mockOrders.filter(o => ["pending", "preparing", "delivering"].includes(o.status)).map((order, i) => {
        const config = statusConfig[order.status];
        const Icon = config.icon;
        return (
          <motion.div key={order.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl overflow-hidden">
            <div className={`px-4 py-2 flex items-center justify-between ${config.color}`}>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="font-bold text-sm">{config.label}</span>
              </div>
              <Badge variant="outline" className={`text-[10px] ${order.platform === "meituan" ? "border-[hsl(40,95%,55%)] text-[hsl(40,95%,55%)]" : "border-[hsl(210,95%,55%)] text-[hsl(210,95%,55%)]"}`}>
                {order.platform === "meituan" ? t("deliveryMgmt.meituan") : t("deliveryMgmt.eleme")}
              </Badge>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs text-muted-foreground font-mono">{order.orderNo}</span>
                <span className="text-sm font-bold text-primary">¥{order.total}</span>
              </div>
              <div className="space-y-1">
                {order.items.map((item, j) => (
                  <p key={j} className="text-sm">{item.name} <span className="text-primary">×{item.qty}</span></p>
                ))}
              </div>
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                <span className="line-clamp-1">{order.address}</span>
              </div>
              {order.rider && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Bike className="w-3 h-3" />
                  <span>{order.rider}</span>
                  <Phone className="w-3 h-3 ml-2" />
                  <span>{order.riderPhone}</span>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Timer className="w-3 h-3" />
                <span>{order.orderTime}</span>
                <span>→ {t("deliveryMgmt.expectedTime")} {order.expectedTime}</span>
              </div>
              {order.status === "pending" && (
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive">{t("deliveryMgmt.reject")}</Button>
                  <Button size="sm" className="h-7 text-xs">{t("deliveryMgmt.accept")}</Button>
                </div>
              )}
              {order.status === "preparing" && (
                <Button size="sm" className="h-7 text-xs bg-success text-success-foreground">{t("deliveryMgmt.ready")}</Button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default DeliveryLiveTab;
