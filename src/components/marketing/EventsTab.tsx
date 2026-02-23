import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Users, MapPin, Clock, DollarSign, Target, PartyPopper, Trophy, ShoppingBag, Dumbbell, Cpu, Cake, ChevronLeft, ChevronRight, LayoutGrid, CalendarDays, Pencil, X, Check, Trash2, Megaphone, Send, ExternalLink, Globe, RefreshCw, Star, MessageSquare, UserCheck, Loader2, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import EventFunnelAnalytics from "./EventFunnelAnalytics";
import EventParticipantManager from "./EventParticipantManager";

interface PromotionChannel {
  platform: string;
  platformZh: string;
  status: "published" | "draft" | "not_posted";
  url?: string;
  reach?: number;
  signups?: number;
}

interface Event {
  id: string;
  nameZh: string;
  nameEn: string;
  type: string;
  typeZh: string;
  date: string;
  time: string;
  status: "upcoming" | "ongoing" | "completed" | "planning";
  expectedGuests: number;
  registeredGuests: number;
  budget: number;
  revenue: number;
  descZh: string;
  descEn: string;
  icon: typeof Trophy;
  resources: string[];
  promotions: PromotionChannel[];
}

const events: Event[] = [
  {
    id: "1", nameZh: "周五飞镖大赛", nameEn: "Friday Darts Tournament",
    type: "competition", typeZh: "赛事", date: "2026-02-27", time: "19:00-23:00",
    status: "upcoming", expectedGuests: 60, registeredGuests: 42,
    budget: 3000, revenue: 8500,
    descZh: "每周五飞镖锦标赛，冠军奖品+特价酒水套餐", descEn: "Weekly darts championship with prizes & drink specials",
    icon: Trophy, resources: ["飞镖靶 x4", "计分板", "奖品礼包", "DJ音响"],
    promotions: [
      { platform: "Huodongxing", platformZh: "活动行", status: "published", url: "https://huodongxing.com", reach: 3200, signups: 18 },
      { platform: "Cumen", platformZh: "粗门", status: "published", url: "https://cumen.fun", reach: 1500, signups: 12 },
      { platform: "Douyin", platformZh: "抖音", status: "draft", reach: 0, signups: 0 },
      { platform: "WeChat", platformZh: "微信公众号", status: "published", reach: 5600, signups: 12 },
    ]
  },
  {
    id: "2", nameZh: "生日派对包场", nameEn: "Birthday Party Package",
    type: "party", typeZh: "派对", date: "2026-03-01", time: "18:00-22:00",
    status: "planning", expectedGuests: 35, registeredGuests: 35,
    budget: 5000, revenue: 12000,
    descZh: "含KTV区域、定制蛋糕、Tapas拼盘及畅饮套餐", descEn: "KTV area, custom cake, tapas platter & open bar",
    icon: Cake, resources: ["KTV区域", "定制蛋糕", "气球装饰", "Tapas拼盘 x3"],
    promotions: [
      { platform: "WeChat", platformZh: "微信公众号", status: "published", reach: 2100, signups: 8 },
      { platform: "Xiaohongshu", platformZh: "小红书", status: "draft", reach: 0, signups: 0 },
    ]
  },
  {
    id: "3", nameZh: "Hash House Harriers 跑步活动", nameEn: "Hash House Harriers Run",
    type: "sports", typeZh: "运动", date: "2026-03-08", time: "15:00-20:00",
    status: "upcoming", expectedGuests: 80, registeredGuests: 55,
    budget: 4000, revenue: 15000,
    descZh: "起终点均在餐厅，跑后提供特价啤酒和Tapas", descEn: "Start & finish at venue, post-run beer & tapas specials",
    icon: Dumbbell, resources: ["路线标记", "补给站物资", "完赛啤酒券 x80", "急救包"],
    promotions: [
      { platform: "Huodongxing", platformZh: "活动行", status: "published", url: "https://huodongxing.com", reach: 8500, signups: 32 },
      { platform: "Cumen", platformZh: "粗门", status: "published", url: "https://cumen.fun", reach: 4200, signups: 18 },
      { platform: "Keep", platformZh: "Keep", status: "draft", reach: 0, signups: 0 },
      { platform: "WeChat", platformZh: "微信公众号", status: "published", reach: 3200, signups: 5 },
    ]
  },
  {
    id: "4", nameZh: "周末生活方式集市", nameEn: "Weekend Lifestyle Market",
    type: "market", typeZh: "集市", date: "2026-03-15", time: "11:00-18:00",
    status: "planning", expectedGuests: 200, registeredGuests: 0,
    budget: 8000, revenue: 25000,
    descZh: "手工艺品、本地设计师、美食摊位，提升品牌曝光", descEn: "Artisan crafts, local designers, food stalls for brand exposure",
    icon: ShoppingBag, resources: ["摊位 x15", "帐篷", "音响系统", "宣传物料", "安保人员 x2"],
    promotions: [
      { platform: "Huodongxing", platformZh: "活动行", status: "published", url: "https://huodongxing.com", reach: 12000, signups: 0 },
      { platform: "Cumen", platformZh: "粗门", status: "not_posted", reach: 0, signups: 0 },
      { platform: "Douyin", platformZh: "抖音", status: "published", reach: 15000, signups: 0 },
      { platform: "Dianping", platformZh: "大众点评", status: "draft", reach: 0, signups: 0 },
    ]
  },
  {
    id: "5", nameZh: "AI科技集市", nameEn: "AI Tech Fair",
    type: "tech", typeZh: "科技", date: "2026-03-22", time: "14:00-20:00",
    status: "planning", expectedGuests: 120, registeredGuests: 30,
    budget: 6000, revenue: 18000,
    descZh: "AI产品展示、互动体验，吸引科技社群到店消费", descEn: "AI demos & interactive experiences to attract tech community",
    icon: Cpu, resources: ["展示桌 x10", "投影仪", "WiFi增强", "电源接线板 x20"],
    promotions: [
      { platform: "Huodongxing", platformZh: "活动行", status: "draft", reach: 0, signups: 0 },
      { platform: "Cumen", platformZh: "粗门", status: "not_posted", reach: 0, signups: 0 },
      { platform: "Douyin", platformZh: "抖音", status: "not_posted", reach: 0, signups: 0 },
      { platform: "WeChat", platformZh: "微信公众号", status: "published", reach: 4800, signups: 30 },
    ]
  },
  {
    id: "6", nameZh: "俱乐部周年庆典", nameEn: "Club Anniversary Celebration",
    type: "party", typeZh: "派对", date: "2026-04-05", time: "19:00-02:00",
    status: "planning", expectedGuests: 150, registeredGuests: 78,
    budget: 15000, revenue: 40000,
    descZh: "现场DJ、特调鸡尾酒、Tapas自助、飞镖表演赛", descEn: "Live DJ, signature cocktails, tapas buffet & darts showmatch",
    icon: PartyPopper, resources: ["DJ设备", "灯光系统", "鸡尾酒原料", "Tapas食材", "安保 x3"],
    promotions: [
      { platform: "Huodongxing", platformZh: "活动行", status: "published", url: "https://huodongxing.com", reach: 9800, signups: 45 },
      { platform: "Cumen", platformZh: "粗门", status: "published", url: "https://cumen.fun", reach: 5500, signups: 22 },
      { platform: "Douyin", platformZh: "抖音", status: "published", reach: 22000, signups: 11 },
      { platform: "WeChat", platformZh: "微信公众号", status: "published", reach: 8900, signups: 0 },
      { platform: "Dianping", platformZh: "大众点评", status: "draft", reach: 0, signups: 0 },
    ]
  },
];

const statusConfig = {
  upcoming: { labelZh: "即将开始", labelEn: "Upcoming", variant: "default" as const },
  ongoing: { labelZh: "进行中", labelEn: "Ongoing", variant: "destructive" as const },
  completed: { labelZh: "已完成", labelEn: "Completed", variant: "secondary" as const },
  planning: { labelZh: "策划中", labelEn: "Planning", variant: "outline" as const },
};

const EventsTab = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "calendar" | "funnel">("cards");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(2026, 1, 1));
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Event>>({});
  const [newResource, setNewResource] = useState("");
  const [editResources, setEditResources] = useState<string[]>([]);
  const [syncLoading, setSyncLoading] = useState<string | null>(null); // "publish_huodongxing", "sync_signups_cumen", etc.
  const [syncedSignups, setSyncedSignups] = useState<any[]>([]);
  const [syncedReviews, setSyncedReviews] = useState<any[]>([]);
  const [promoDetailTab, setPromoDetailTab] = useState<"channels" | "signups" | "reviews">("channels");
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const filtered = filter === "all" ? events : events.filter(e => e.status === filter);

  const totalBudget = events.reduce((s, e) => s + e.budget, 0);
  const totalRevenue = events.reduce((s, e) => s + e.revenue, 0);
  const totalGuests = events.reduce((s, e) => s + e.registeredGuests, 0);
  const upcomingCount = events.filter(e => e.status === "upcoming" || e.status === "planning").length;

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [calendarMonth]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    events.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, []);

  const monthLabel = calendarMonth.toLocaleDateString(isZh ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long' });
  const weekdays = isZh ? ["日", "一", "二", "三", "四", "五", "六"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  const nextMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));

  const openDetail = (event: Event) => {
    setSelectedEvent(event);
    setIsEditing(false);
    setEditForm({});
    setEditResources([...event.resources]);
    setNewResource("");
    setSyncedSignups([]);
    setSyncedReviews([]);
    setPromoDetailTab("channels");
    setLastSyncTime(null);
  };

  const startEditing = () => {
    if (!selectedEvent) return;
    setIsEditing(true);
    setEditForm({
      nameZh: selectedEvent.nameZh,
      nameEn: selectedEvent.nameEn,
      date: selectedEvent.date,
      time: selectedEvent.time,
      budget: selectedEvent.budget,
      expectedGuests: selectedEvent.expectedGuests,
      descZh: selectedEvent.descZh,
      descEn: selectedEvent.descEn,
    });
    setEditResources([...selectedEvent.resources]);
  };

  const saveEditing = () => {
    // In a real app this would persist. For now just close edit mode.
    setIsEditing(false);
  };

  const addResource = () => {
    if (newResource.trim()) {
      setEditResources(prev => [...prev, newResource.trim()]);
      setNewResource("");
    }
  };

  const removeResource = (idx: number) => {
    setEditResources(prev => prev.filter((_, i) => i !== idx));
  };

  const callEventSync = useCallback(async (action: string, platform: string, eventData?: any) => {
    const loadingKey = `${action}_${platform}`;
    setSyncLoading(loadingKey);
    try {
      const { data, error } = await supabase.functions.invoke("event-platform-sync", {
        body: { action, platform: platform.toLowerCase(), eventData, externalId: `ext_${platform}` },
      });
      if (error) throw error;
      return data;
    } catch (err: any) {
      toast({ title: isZh ? "同步失败" : "Sync Failed", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setSyncLoading(null);
    }
  }, [isZh, toast]);

  const handlePublish = async (platform: string) => {
    if (!selectedEvent) return;
    const data = await callEventSync("publish", platform, {
      name: selectedEvent.nameEn,
      nameZh: selectedEvent.nameZh,
      date: selectedEvent.date,
      time: selectedEvent.time,
      description: selectedEvent.descEn,
      descriptionZh: selectedEvent.descZh,
      expectedGuests: selectedEvent.expectedGuests,
    });
    if (data?.success) {
      toast({ title: isZh ? "发布成功" : "Published!", description: isZh ? `已发布到${platform}` : `Published to ${platform}` });
    }
  };

  const handlePublishAll = async () => {
    if (!selectedEvent) return;
    const platforms = selectedEvent.promotions.filter(p => p.status !== "published").map(p => p.platform.toLowerCase());
    if (platforms.length === 0) { toast({ title: isZh ? "全部已发布" : "All Published" }); return; }
    setSyncLoading("publish_all");
    try {
      const { data, error } = await supabase.functions.invoke("event-platform-sync", {
        body: { action: "publish_all", platform: "all", eventData: { platforms, name: selectedEvent.nameEn, nameZh: selectedEvent.nameZh, date: selectedEvent.date, time: selectedEvent.time } },
      });
      if (error) throw error;
      if (data?.success) toast({ title: isZh ? "全渠道发布成功" : "Published to All Channels", description: isZh ? `已发布到 ${platforms.length} 个平台` : `Published to ${platforms.length} platforms` });
    } catch (err: any) {
      toast({ title: isZh ? "发布失败" : "Publish Failed", description: err.message, variant: "destructive" });
    } finally { setSyncLoading(null); }
  };

  const handleSyncSignups = async (platform?: string) => {
    if (!selectedEvent) return;
    const action = platform ? "sync_signups" : "sync_all_signups";
    const p = platform || "all";
    const data = await callEventSync(action, p, platform ? undefined : {
      platforms: selectedEvent.promotions.filter(pr => pr.status === "published").map(pr => pr.platform.toLowerCase()),
    });
    if (data?.success) {
      const signups = data.signups || (data.results?.flatMap((r: any) => r.signups) || []);
      setSyncedSignups(signups);
      setLastSyncTime(new Date().toLocaleString(isZh ? 'zh-CN' : 'en-US'));
      setPromoDetailTab("signups");
      toast({ title: isZh ? "同步成功" : "Sync Complete", description: isZh ? `获取到 ${signups.length} 条报名数据` : `Fetched ${signups.length} signups` });
    }
  };

  const handleSyncReviews = async (platform?: string) => {
    if (!selectedEvent) return;
    const p = platform || selectedEvent.promotions[0]?.platform || "huodongxing";
    const data = await callEventSync("sync_reviews", p);
    if (data?.success) {
      setSyncedReviews(data.reviews || []);
      setLastSyncTime(new Date().toLocaleString(isZh ? 'zh-CN' : 'en-US'));
      setPromoDetailTab("reviews");
      toast({ title: isZh ? "评价同步成功" : "Reviews Synced", description: isZh ? `获取到 ${data.reviews?.length || 0} 条评价` : `Fetched ${data.reviews?.length || 0} reviews` });
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isZh ? "活动总数" : "Total Events"}</p>
                <p className="text-2xl font-bold text-foreground">{events.length}</p>
                <p className="text-xs text-muted-foreground">{isZh ? `${upcomingCount}个待举办` : `${upcomingCount} upcoming`}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isZh ? "预计参与人数" : "Expected Guests"}</p>
                <p className="text-2xl font-bold text-foreground">{totalGuests}</p>
                <p className="text-xs text-muted-foreground">{isZh ? "已报名" : "registered"}</p>
              </div>
              <Users className="w-8 h-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isZh ? "总预算" : "Total Budget"}</p>
                <p className="text-2xl font-bold text-foreground">¥{totalBudget.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isZh ? "预计营收" : "Expected Revenue"}</p>
                <p className="text-2xl font-bold text-foreground">¥{totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-500">ROI: {((totalRevenue / totalBudget - 1) * 100).toFixed(0)}%</p>
              </div>
              <Target className="w-8 h-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
          {["all", "planning", "upcoming", "ongoing", "completed"].map(s => (
            <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
              {s === "all" ? (isZh ? "全部" : "All") : isZh ? statusConfig[s as keyof typeof statusConfig].labelZh : statusConfig[s as keyof typeof statusConfig].labelEn}
            </Button>
          ))}
          <div className="ml-2 border-l border-border pl-2 flex gap-1">
            <Button variant={viewMode === "cards" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("cards")}>
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === "calendar" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("calendar")}>
              <CalendarDays className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === "funnel" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("funnel")}>
              <TrendingUp className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="w-3.5 h-3.5" />{isZh ? "新建活动" : "New Event"}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isZh ? "创建新活动" : "Create New Event"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">{isZh ? "活动名称(中)" : "Name (ZH)"}</label><Input placeholder={isZh ? "输入中文名称" : "Chinese name"} /></div>
                <div><label className="text-sm font-medium">{isZh ? "活动名称(英)" : "Name (EN)"}</label><Input placeholder={isZh ? "输入英文名称" : "English name"} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">{isZh ? "日期" : "Date"}</label><Input type="date" /></div>
                <div><label className="text-sm font-medium">{isZh ? "类型" : "Type"}</label>
                  <Select><SelectTrigger><SelectValue placeholder={isZh ? "选择类型" : "Select type"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="competition">{isZh ? "赛事" : "Competition"}</SelectItem>
                      <SelectItem value="party">{isZh ? "派对" : "Party"}</SelectItem>
                      <SelectItem value="sports">{isZh ? "运动" : "Sports"}</SelectItem>
                      <SelectItem value="market">{isZh ? "集市" : "Market"}</SelectItem>
                      <SelectItem value="tech">{isZh ? "科技" : "Tech"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><label className="text-sm font-medium">{isZh ? "活动描述" : "Description"}</label><Textarea placeholder={isZh ? "描述活动详情..." : "Describe the event..."} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">{isZh ? "预算 (¥)" : "Budget (¥)"}</label><Input type="number" placeholder="0" /></div>
                <div><label className="text-sm font-medium">{isZh ? "预计人数" : "Expected Guests"}</label><Input type="number" placeholder="0" /></div>
              </div>
              <Button className="w-full">{isZh ? "创建活动" : "Create Event"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
              <CardTitle className="text-base">{monthLabel}</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px">
              {weekdays.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {calendarDays.map((day, idx) => {
                const key = day ? `${calendarMonth.getFullYear()}-${calendarMonth.getMonth()}-${day}` : null;
                const dayEvents = key ? eventsByDate[key] || [] : [];
                const isToday = day && calendarMonth.getFullYear() === 2026 && calendarMonth.getMonth() === 1 && day === 21;
                return (
                  <div
                    key={idx}
                    className={`min-h-[80px] border border-border/50 rounded-sm p-1 ${
                      day ? "bg-card" : "bg-muted/30"
                    } ${isToday ? "ring-1 ring-primary" : ""}`}
                  >
                    {day && (
                      <>
                        <span className={`text-xs ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>{day}</span>
                        <div className="mt-0.5 space-y-0.5">
                          <TooltipProvider>
                            {dayEvents.map(ev => {
                              const sc = statusConfig[ev.status];
                              const IconComp = ev.icon;
                              return (
                                <Tooltip key={ev.id}>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 rounded px-1 py-0.5 bg-primary/10 cursor-pointer hover:bg-primary/20 transition-colors">
                                      <IconComp className="w-3 h-3 text-primary shrink-0" />
                                      <span className="text-[10px] font-medium text-foreground truncate">{isZh ? ev.nameZh : ev.nameEn}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-[200px]">
                                    <p className="font-medium text-sm">{isZh ? ev.nameZh : ev.nameEn}</p>
                                    <p className="text-xs text-muted-foreground">{ev.time}</p>
                                    <p className="text-xs">{isZh ? ev.descZh : ev.descEn}</p>
                                    <Badge variant={sc.variant} className="mt-1 text-[10px]">{isZh ? sc.labelZh : sc.labelEn}</Badge>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </TooltipProvider>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Funnel Analytics View */}
      {viewMode === "funnel" && (
        <EventFunnelAnalytics events={events.map(e => ({ id: e.id, nameZh: e.nameZh, nameEn: e.nameEn }))} />
      )}

      {/* Event Cards */}
      {viewMode === "cards" && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(event => {
          const sc = statusConfig[event.status];
          const regPercent = event.expectedGuests > 0 ? (event.registeredGuests / event.expectedGuests) * 100 : 0;
          const IconComp = event.icon;
          return (
            <Card key={event.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(event)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconComp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{isZh ? event.nameZh : event.nameEn}</CardTitle>
                      <p className="text-xs text-muted-foreground">{isZh ? event.typeZh : event.type}</p>
                    </div>
                  </div>
                  <Badge variant={sc.variant}>{isZh ? sc.labelZh : sc.labelEn}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{isZh ? event.descZh : event.descEn}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.time}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{isZh ? "餐厅" : "Venue"}</span>
                </div>

                {/* Registration Progress */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{isZh ? "报名进度" : "Registration"}</span>
                    <span className="font-medium text-foreground">{event.registeredGuests}/{event.expectedGuests}</span>
                  </div>
                  <Progress value={regPercent} className="h-1.5" />
                </div>

                {/* Budget & Revenue */}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{isZh ? "预算" : "Budget"}: <span className="text-foreground font-medium">¥{event.budget.toLocaleString()}</span></span>
                  <span className="text-muted-foreground">{isZh ? "预计营收" : "Est. Revenue"}: <span className="text-green-500 font-medium">¥{event.revenue.toLocaleString()}</span></span>
                </div>

                {/* Resources */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{isZh ? "所需资源" : "Resources"}</p>
                  <div className="flex flex-wrap gap-1">
                    {event.resources.map((r, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{r}</Badge>
                    ))}
                  </div>
                </div>

                {/* Promotion Channels */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Megaphone className="w-3 h-3" />{isZh ? "推广渠道" : "Promotion"}</p>
                  <div className="flex flex-wrap gap-1">
                    {event.promotions.map((p, i) => (
                      <Badge key={i} variant={p.status === "published" ? "default" : p.status === "draft" ? "outline" : "secondary"} className="text-[10px] gap-1">
                        {isZh ? p.platformZh : p.platform}
                        {p.status === "published" && <Check className="w-2.5 h-2.5" />}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => { if (!open) { setSelectedEvent(null); setIsEditing(false); } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedEvent && (() => {
            const sc = statusConfig[selectedEvent.status];
            const IconComp = selectedEvent.icon;
            const regPercent = selectedEvent.expectedGuests > 0 ? (selectedEvent.registeredGuests / selectedEvent.expectedGuests) * 100 : 0;
            const displayResources = isEditing ? editResources : selectedEvent.resources;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <IconComp className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        {isEditing ? (
                          <div className="space-y-1">
                            <Input value={editForm.nameZh || ""} onChange={e => setEditForm(f => ({ ...f, nameZh: e.target.value }))} className="h-7 text-sm" placeholder="中文名称" />
                            <Input value={editForm.nameEn || ""} onChange={e => setEditForm(f => ({ ...f, nameEn: e.target.value }))} className="h-7 text-sm" placeholder="English name" />
                          </div>
                        ) : (
                          <>
                            <DialogTitle className="text-lg">{isZh ? selectedEvent.nameZh : selectedEvent.nameEn}</DialogTitle>
                            <p className="text-sm text-muted-foreground">{isZh ? selectedEvent.nameEn : selectedEvent.nameZh}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={sc.variant}>{isZh ? sc.labelZh : sc.labelEn}</Badge>
                      {isEditing ? (
                        <Button size="sm" variant="default" className="gap-1" onClick={saveEditing}><Check className="w-3.5 h-3.5" />{isZh ? "保存" : "Save"}</Button>
                      ) : (
                        <Button size="sm" variant="outline" className="gap-1" onClick={startEditing}><Pencil className="w-3.5 h-3.5" />{isZh ? "编辑" : "Edit"}</Button>
                      )}
                    </div>
                  </div>
                </DialogHeader>

                <Separator />

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{isZh ? "日期" : "Date"}</p>
                      {isEditing ? (
                        <Input type="date" value={editForm.date || ""} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className="h-8 text-sm" />
                      ) : (
                        <p className="text-sm text-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-muted-foreground" />{selectedEvent.date}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{isZh ? "时间" : "Time"}</p>
                      {isEditing ? (
                        <Input value={editForm.time || ""} onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))} className="h-8 text-sm" placeholder="19:00-23:00" />
                      ) : (
                        <p className="text-sm text-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-muted-foreground" />{selectedEvent.time}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{isZh ? "地点" : "Location"}</p>
                      <p className="text-sm text-foreground flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground" />{isZh ? "餐厅主场地" : "Main Venue"}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{isZh ? "预算" : "Budget"}</p>
                      {isEditing ? (
                        <Input type="number" value={editForm.budget || 0} onChange={e => setEditForm(f => ({ ...f, budget: Number(e.target.value) }))} className="h-8 text-sm" />
                      ) : (
                        <p className="text-sm text-foreground flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-muted-foreground" />¥{selectedEvent.budget.toLocaleString()}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{isZh ? "预计人数" : "Expected Guests"}</p>
                      {isEditing ? (
                        <Input type="number" value={editForm.expectedGuests || 0} onChange={e => setEditForm(f => ({ ...f, expectedGuests: Number(e.target.value) }))} className="h-8 text-sm" />
                      ) : (
                        <p className="text-sm text-foreground flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-muted-foreground" />{selectedEvent.expectedGuests}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{isZh ? "预计营收" : "Est. Revenue"}</p>
                      <p className="text-sm text-foreground flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-muted-foreground" />¥{selectedEvent.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Registration */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">{isZh ? "报名进度" : "Registration Progress"}</p>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{isZh ? "已报名" : "Registered"}</span>
                    <span className="font-medium text-foreground">{selectedEvent.registeredGuests} / {selectedEvent.expectedGuests}</span>
                  </div>
                  <Progress value={regPercent} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{regPercent.toFixed(0)}% {isZh ? "已满" : "filled"}</p>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">{isZh ? "活动描述" : "Event Description"}</p>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea value={editForm.descZh || ""} onChange={e => setEditForm(f => ({ ...f, descZh: e.target.value }))} placeholder="中文描述" rows={2} />
                      <Textarea value={editForm.descEn || ""} onChange={e => setEditForm(f => ({ ...f, descEn: e.target.value }))} placeholder="English description" rows={2} />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{selectedEvent.descZh}</p>
                      <p className="text-sm text-muted-foreground italic">{selectedEvent.descEn}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Resources Management */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">{isZh ? "资源清单" : "Resource List"}</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {displayResources.map((r, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {r}
                        {isEditing && (
                          <button onClick={() => removeResource(i)} className="ml-0.5 hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input value={newResource} onChange={e => setNewResource(e.target.value)} placeholder={isZh ? "添加资源..." : "Add resource..."} className="h-8 text-sm" onKeyDown={e => e.key === "Enter" && addResource()} />
                      <Button size="sm" variant="outline" onClick={addResource} className="gap-1 h-8"><Plus className="w-3 h-3" />{isZh ? "添加" : "Add"}</Button>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Recruitment & Promotion Channels - Enhanced */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5"><Megaphone className="w-4 h-4 text-primary" />{isZh ? "召集推广 · 平台对接" : "Recruitment & Platform Sync"}</p>
                  {lastSyncTime && <p className="text-[10px] text-muted-foreground mb-2">{isZh ? "上次同步" : "Last sync"}: {lastSyncTime}</p>}

                  <Tabs value={promoDetailTab} onValueChange={(v) => setPromoDetailTab(v as any)}>
                    <TabsList className="w-full">
                      <TabsTrigger value="channels" className="flex-1 gap-1 text-xs"><Globe className="w-3 h-3" />{isZh ? "渠道" : "Channels"}</TabsTrigger>
                      <TabsTrigger value="signups" className="flex-1 gap-1 text-xs"><UserCheck className="w-3 h-3" />{isZh ? "报名" : "Signups"} {syncedSignups.length > 0 && <Badge variant="secondary" className="text-[9px] px-1 h-4 ml-1">{syncedSignups.length}</Badge>}</TabsTrigger>
                      <TabsTrigger value="reviews" className="flex-1 gap-1 text-xs"><MessageSquare className="w-3 h-3" />{isZh ? "评价" : "Reviews"} {syncedReviews.length > 0 && <Badge variant="secondary" className="text-[9px] px-1 h-4 ml-1">{syncedReviews.length}</Badge>}</TabsTrigger>
                      <TabsTrigger value="participants" className="flex-1 gap-1 text-xs"><Users className="w-3 h-3" />{isZh ? "参与者" : "People"}</TabsTrigger>
                    </TabsList>

                    {/* Channels Tab */}
                    <TabsContent value="channels" className="mt-3 space-y-2">
                      {selectedEvent.promotions.map((promo, idx) => {
                        const promoStatusConfig = {
                          published: { labelZh: "已发布", labelEn: "Published", color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
                          draft: { labelZh: "草稿", labelEn: "Draft", color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30" },
                          not_posted: { labelZh: "未发布", labelEn: "Not Posted", color: "text-muted-foreground bg-muted" },
                        };
                        const ps = promoStatusConfig[promo.status];
                        const isThisLoading = syncLoading === `publish_${promo.platform.toLowerCase()}`;
                        return (
                          <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                                <Globe className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{isZh ? promo.platformZh : promo.platform}</p>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ps.color}`}>{isZh ? ps.labelZh : ps.labelEn}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {promo.status === "published" && (
                                <div className="text-right text-xs">
                                  <p className="text-muted-foreground">{isZh ? "曝光" : "Reach"}: <span className="font-medium text-foreground">{(promo.reach || 0).toLocaleString()}</span></p>
                                  <p className="text-muted-foreground">{isZh ? "报名" : "Signups"}: <span className="font-medium text-foreground">{promo.signups || 0}</span></p>
                                </div>
                              )}
                              {promo.status === "published" && (
                                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" disabled={syncLoading === `sync_signups_${promo.platform.toLowerCase()}`} onClick={() => handleSyncSignups(promo.platform)}>
                                  {syncLoading === `sync_signups_${promo.platform.toLowerCase()}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}{isZh ? "同步" : "Sync"}
                                </Button>
                              )}
                              {promo.status === "published" && promo.url && (
                                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => window.open(promo.url, "_blank")}>
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              )}
                              {promo.status === "draft" && (
                                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" disabled={isThisLoading} onClick={() => handlePublish(promo.platform)}>
                                  {isThisLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}{isZh ? "发布" : "Publish"}
                                </Button>
                              )}
                              {promo.status === "not_posted" && (
                                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" disabled={isThisLoading} onClick={() => handlePublish(promo.platform)}>
                                  {isThisLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}{isZh ? "创建并发布" : "Create & Publish"}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleSyncSignups()} disabled={syncLoading === "sync_signups_all"}>
                          {syncLoading === "sync_signups_all" ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}{isZh ? "全渠道同步报名" : "Sync All Signups"}
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleSyncReviews()} disabled={syncLoading === "sync_reviews_all"}>
                          {syncLoading === "sync_reviews_all" ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}{isZh ? "同步评价" : "Sync Reviews"}
                        </Button>
                        <Button size="sm" variant="default" className="gap-1 text-xs" onClick={handlePublishAll} disabled={syncLoading === "publish_all"}>
                          {syncLoading === "publish_all" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}{isZh ? "一键全渠道发布" : "Publish All"}
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Signups Tab */}
                    <TabsContent value="signups" className="mt-3">
                      {syncedSignups.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">{isZh ? "暂无报名数据，请先同步" : "No signups yet. Sync to fetch data."}</p>
                          <Button size="sm" variant="outline" className="mt-3 gap-1 text-xs" onClick={() => handleSyncSignups()}>
                            <RefreshCw className="w-3 h-3" />{isZh ? "立即同步" : "Sync Now"}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-xs text-muted-foreground">{isZh ? `共 ${syncedSignups.length} 人报名` : `${syncedSignups.length} signups total`}</p>
                            <Button size="sm" variant="ghost" className="h-6 gap-1 text-[10px]" onClick={() => handleSyncSignups()}>
                              <RefreshCw className="w-2.5 h-2.5" />{isZh ? "刷新" : "Refresh"}
                            </Button>
                          </div>
                          {syncedSignups.map((s, i) => (
                            <div key={s.id || i} className="flex items-center justify-between p-2 rounded-md border border-border bg-card text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
                                  {(isZh ? s.nameZh : s.nameEn)?.charAt(0) || "?"}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{isZh ? s.nameZh : s.nameEn}</p>
                                  <p className="text-muted-foreground">{s.phone}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={s.ticketType === "vip" ? "default" : "secondary"} className="text-[9px]">{s.ticketType === "vip" ? "VIP" : isZh ? "标准" : "Standard"}</Badge>
                                <Badge variant={s.status === "confirmed" ? "default" : "outline"} className="text-[9px]">{s.status === "confirmed" ? (isZh ? "已确认" : "Confirmed") : (isZh ? "待确认" : "Pending")}</Badge>
                                <span className="text-muted-foreground text-[10px]">{s.source}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Reviews Tab */}
                    <TabsContent value="reviews" className="mt-3">
                      {syncedReviews.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">{isZh ? "暂无评价数据，请先同步" : "No reviews yet. Sync to fetch data."}</p>
                          <Button size="sm" variant="outline" className="mt-3 gap-1 text-xs" onClick={() => handleSyncReviews()}>
                            <RefreshCw className="w-3 h-3" />{isZh ? "同步评价" : "Sync Reviews"}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-xs text-muted-foreground">{isZh ? `共 ${syncedReviews.length} 条评价` : `${syncedReviews.length} reviews`}</p>
                            <Button size="sm" variant="ghost" className="h-6 gap-1 text-[10px]" onClick={() => handleSyncReviews()}>
                              <RefreshCw className="w-2.5 h-2.5" />{isZh ? "刷新" : "Refresh"}
                            </Button>
                          </div>
                          {syncedReviews.map((r, i) => (
                            <div key={r.id || i} className="p-2.5 rounded-lg border border-border bg-card space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-foreground">{r.author}</span>
                                  <div className="flex">
                                    {Array.from({ length: 5 }, (_, s) => (
                                      <Star key={s} className={`w-3 h-3 ${s < r.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
                                    ))}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-[9px]">{r.source}</Badge>
                                  {r.replied && <Badge variant="outline" className="text-[9px]">{isZh ? "已回复" : "Replied"}</Badge>}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">{isZh ? r.contentZh : r.contentEn}</p>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleDateString(isZh ? 'zh-CN' : 'en-US')}</span>
                                {!r.replied && <Button size="sm" variant="ghost" className="h-5 text-[10px] gap-1"><MessageSquare className="w-2.5 h-2.5" />{isZh ? "回复" : "Reply"}</Button>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Participants Tab */}
                    <TabsContent value="participants" className="mt-3">
                      <EventParticipantManager
                        eventId={selectedEvent.id}
                        eventName={selectedEvent.nameZh}
                        eventNameEn={selectedEvent.nameEn}
                        expectedGuests={selectedEvent.expectedGuests}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventsTab;
