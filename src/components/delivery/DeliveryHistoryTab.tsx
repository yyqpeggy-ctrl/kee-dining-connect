import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { CalendarIcon, Search, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface HistoryOrder {
  id: string;
  platform: "eleme" | "meituan";
  orderNo: string;
  customer: string;
  total: number;
  deliveryFee: number;
  commission: number;
  status: "completed" | "cancelled" | "refunded";
  orderTime: string;
  completedTime: string;
  itemCount: number;
}

// Mock historical data — will be replaced by real API calls
const mockHistory: HistoryOrder[] = [
  { id: "h1", platform: "meituan", orderNo: "MT-20260222-1001", customer: "张先生", total: 268, deliveryFee: 5, commission: 16.1, status: "completed", orderTime: "2026-02-22 12:15", completedTime: "2026-02-22 12:48", itemCount: 3 },
  { id: "h2", platform: "eleme", orderNo: "EL-20260222-1002", customer: "李女士", total: 186, deliveryFee: 3, commission: 11.2, status: "completed", orderTime: "2026-02-22 12:30", completedTime: "2026-02-22 13:05", itemCount: 2 },
  { id: "h3", platform: "meituan", orderNo: "MT-20260222-1003", customer: "王先生", total: 388, deliveryFee: 8, commission: 23.3, status: "cancelled", orderTime: "2026-02-22 13:00", completedTime: "-", itemCount: 1 },
  { id: "h4", platform: "eleme", orderNo: "EL-20260221-0901", customer: "赵女士", total: 156, deliveryFee: 4, commission: 9.4, status: "refunded", orderTime: "2026-02-21 11:30", completedTime: "2026-02-21 12:10", itemCount: 3 },
  { id: "h5", platform: "meituan", orderNo: "MT-20260221-0902", customer: "孙先生", total: 198, deliveryFee: 6, commission: 11.9, status: "completed", orderTime: "2026-02-21 11:45", completedTime: "2026-02-21 12:20", itemCount: 2 },
  { id: "h6", platform: "eleme", orderNo: "EL-20260220-0801", customer: "周女士", total: 328, deliveryFee: 5, commission: 19.7, status: "completed", orderTime: "2026-02-20 18:00", completedTime: "2026-02-20 18:35", itemCount: 2 },
  { id: "h7", platform: "meituan", orderNo: "MT-20260220-0802", customer: "吴先生", total: 445, deliveryFee: 8, commission: 26.7, status: "completed", orderTime: "2026-02-20 19:15", completedTime: "2026-02-20 19:50", itemCount: 4 },
];

const DeliveryHistoryTab = () => {
  const { t } = useTranslation();
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = mockHistory.filter(o => {
    if (platformFilter !== "all" && o.platform !== platformFilter) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (searchQuery && !o.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) && !o.customer.includes(searchQuery)) return false;
    if (dateFrom && new Date(o.orderTime) < dateFrom) return false;
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59);
      if (new Date(o.orderTime) > end) return false;
    }
    return true;
  });

  const statusIcon = (s: string) => {
    if (s === "completed") return <CheckCircle2 className="w-3.5 h-3.5 text-success" />;
    if (s === "cancelled") return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    return <AlertTriangle className="w-3.5 h-3.5 text-warning" />;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("deliveryMgmt.searchOrder")} className="pl-8 w-52 h-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="meituan">{t("deliveryMgmt.meituan")}</SelectItem>
            <SelectItem value="eleme">{t("deliveryMgmt.eleme")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="completed">{t("deliveryMgmt.completedOrders")}</SelectItem>
            <SelectItem value="cancelled">{t("deliveryMgmt.cancelledOrders")}</SelectItem>
            <SelectItem value="refunded">{t("deliveryMgmt.refundOrders")}</SelectItem>
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-9 gap-1.5", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="w-3.5 h-3.5" />
              {dateFrom ? format(dateFrom, "MM/dd") : t("deliveryMgmt.startDate")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
        <span className="text-muted-foreground text-sm">→</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-9 gap-1.5", !dateTo && "text-muted-foreground")}>
              <CalendarIcon className="w-3.5 h-3.5" />
              {dateTo ? format(dateTo, "MM/dd") : t("deliveryMgmt.endDate")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
        {(dateFrom || dateTo || platformFilter !== "all" || statusFilter !== "all" || searchQuery) && (
          <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setDateFrom(undefined); setDateTo(undefined); setPlatformFilter("all"); setStatusFilter("all"); setSearchQuery(""); }}>
            {t("deliveryMgmt.clearFilters")}
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("deliveryMgmt.orderNo")}</TableHead>
              <TableHead>{t("deliveryMgmt.platforms")}</TableHead>
              <TableHead>{t("deliveryMgmt.customer")}</TableHead>
              <TableHead className="text-right">{t("common.amount")}</TableHead>
              <TableHead className="text-right">{t("deliveryMgmt.platformCommission")}</TableHead>
              <TableHead className="text-right">{t("deliveryMgmt.netRevenue")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead>{t("deliveryMgmt.orderTime")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(order => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">{order.orderNo}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] ${order.platform === "meituan" ? "border-[hsl(40,95%,55%)] text-[hsl(40,95%,55%)]" : "border-[hsl(210,95%,55%)] text-[hsl(210,95%,55%)]"}`}>
                    {order.platform === "meituan" ? t("deliveryMgmt.meituan") : t("deliveryMgmt.eleme")}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{order.customer}</TableCell>
                <TableCell className="text-right font-medium">¥{order.total}</TableCell>
                <TableCell className="text-right text-destructive text-sm">-¥{order.commission.toFixed(1)}</TableCell>
                <TableCell className="text-right font-medium text-success">¥{(order.total - order.commission).toFixed(1)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {statusIcon(order.status)}
                    <span className="text-xs">{t(`deliveryMgmt.${order.status === "completed" ? "completedOrders" : order.status === "cancelled" ? "cancelledOrders" : "refundOrders"}`)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{order.orderTime}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">{t("deliveryMgmt.noOrders")}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">{t("deliveryMgmt.historyNote")}</p>
    </div>
  );
};

export default DeliveryHistoryTab;
