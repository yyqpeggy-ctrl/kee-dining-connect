import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Users, MapPin, Clock, DollarSign, Target, PartyPopper, Trophy, ShoppingBag, Dumbbell, Cpu, Cake } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
}

const events: Event[] = [
  {
    id: "1", nameZh: "周五飞镖大赛", nameEn: "Friday Darts Tournament",
    type: "competition", typeZh: "赛事", date: "2026-02-27", time: "19:00-23:00",
    status: "upcoming", expectedGuests: 60, registeredGuests: 42,
    budget: 3000, revenue: 8500,
    descZh: "每周五飞镖锦标赛，冠军奖品+特价酒水套餐", descEn: "Weekly darts championship with prizes & drink specials",
    icon: Trophy, resources: ["飞镖靶 x4", "计分板", "奖品礼包", "DJ音响"]
  },
  {
    id: "2", nameZh: "生日派对包场", nameEn: "Birthday Party Package",
    type: "party", typeZh: "派对", date: "2026-03-01", time: "18:00-22:00",
    status: "planning", expectedGuests: 35, registeredGuests: 35,
    budget: 5000, revenue: 12000,
    descZh: "含KTV包厢、定制蛋糕、Tapas拼盘及畅饮套餐", descEn: "KTV room, custom cake, tapas platter & open bar",
    icon: Cake, resources: ["KTV包厢", "定制蛋糕", "气球装饰", "Tapas拼盘 x3"]
  },
  {
    id: "3", nameZh: "Hash House Harriers 跑步活动", nameEn: "Hash House Harriers Run",
    type: "sports", typeZh: "运动", date: "2026-03-08", time: "15:00-20:00",
    status: "upcoming", expectedGuests: 80, registeredGuests: 55,
    budget: 4000, revenue: 15000,
    descZh: "起终点均在餐厅，跑后提供特价啤酒和Tapas", descEn: "Start & finish at venue, post-run beer & tapas specials",
    icon: Dumbbell, resources: ["路线标记", "补给站物资", "完赛啤酒券 x80", "急救包"]
  },
  {
    id: "4", nameZh: "周末生活方式集市", nameEn: "Weekend Lifestyle Market",
    type: "market", typeZh: "集市", date: "2026-03-15", time: "11:00-18:00",
    status: "planning", expectedGuests: 200, registeredGuests: 0,
    budget: 8000, revenue: 25000,
    descZh: "手工艺品、本地设计师、美食摊位，提升品牌曝光", descEn: "Artisan crafts, local designers, food stalls for brand exposure",
    icon: ShoppingBag, resources: ["摊位 x15", "帐篷", "音响系统", "宣传物料", "安保人员 x2"]
  },
  {
    id: "5", nameZh: "AI科技集市", nameEn: "AI Tech Fair",
    type: "tech", typeZh: "科技", date: "2026-03-22", time: "14:00-20:00",
    status: "planning", expectedGuests: 120, registeredGuests: 30,
    budget: 6000, revenue: 18000,
    descZh: "AI产品展示、互动体验，吸引科技社群到店消费", descEn: "AI demos & interactive experiences to attract tech community",
    icon: Cpu, resources: ["展示桌 x10", "投影仪", "WiFi增强", "电源接线板 x20"]
  },
  {
    id: "6", nameZh: "俱乐部周年庆典", nameEn: "Club Anniversary Celebration",
    type: "party", typeZh: "派对", date: "2026-04-05", time: "19:00-02:00",
    status: "planning", expectedGuests: 150, registeredGuests: 78,
    budget: 15000, revenue: 40000,
    descZh: "现场DJ、特调鸡尾酒、Tapas自助、飞镖表演赛", descEn: "Live DJ, signature cocktails, tapas buffet & darts showmatch",
    icon: PartyPopper, resources: ["DJ设备", "灯光系统", "鸡尾酒原料", "Tapas食材", "安保 x3"]
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
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? events : events.filter(e => e.status === filter);

  const totalBudget = events.reduce((s, e) => s + e.budget, 0);
  const totalRevenue = events.reduce((s, e) => s + e.revenue, 0);
  const totalGuests = events.reduce((s, e) => s + e.registeredGuests, 0);
  const upcomingCount = events.filter(e => e.status === "upcoming" || e.status === "planning").length;

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
        <div className="flex gap-2">
          {["all", "planning", "upcoming", "ongoing", "completed"].map(s => (
            <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
              {s === "all" ? (isZh ? "全部" : "All") : isZh ? statusConfig[s as keyof typeof statusConfig].labelZh : statusConfig[s as keyof typeof statusConfig].labelEn}
            </Button>
          ))}
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

      {/* Event Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(event => {
          const sc = statusConfig[event.status];
          const regPercent = event.expectedGuests > 0 ? (event.registeredGuests / event.expectedGuests) * 100 : 0;
          const IconComp = event.icon;
          return (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
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
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default EventsTab;
