import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "@/contexts/StoreContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Users, Calendar, MapPin, Phone, Mail, Edit, Trash2, Star, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Club {
  id: string;
  name: string;
  type: string;
  memberCount: number;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  cooperationStart: string;
  cooperationEnd: string;
  status: string;
  rating: number;
  totalEvents: number;
  totalReferrals: number;
  notes: string;
}

const ClubsTab = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const { currentStore } = useStore();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);

  const [clubs, setClubs] = useState<Club[]>([
    {
      id: "1",
      name: isZh ? "上海红酒爱好者协会" : "Shanghai Wine Lovers Association",
      type: "wine",
      memberCount: 320,
      contactPerson: isZh ? "张明" : "Zhang Ming",
      phone: "138-0000-1111",
      email: "wine@club.com",
      address: isZh ? "上海市静安区南京西路1000号" : "1000 West Nanjing Rd, Jing'an, Shanghai",
      cooperationStart: "2024-03-01",
      cooperationEnd: "2025-03-01",
      status: "active",
      rating: 5,
      totalEvents: 12,
      totalReferrals: 86,
      notes: isZh ? "每月定期品鉴会" : "Monthly tasting events",
    },
    {
      id: "2",
      name: isZh ? "浦东企业家俱乐部" : "Pudong Entrepreneurs Club",
      type: "business",
      memberCount: 150,
      contactPerson: isZh ? "李华" : "Li Hua",
      phone: "139-0000-2222",
      email: "biz@club.com",
      address: isZh ? "上海市浦东新区陆家嘴环路800号" : "800 Lujiazui Ring Rd, Pudong, Shanghai",
      cooperationStart: "2024-06-15",
      cooperationEnd: "2025-06-15",
      status: "active",
      rating: 4,
      totalEvents: 6,
      totalReferrals: 42,
      notes: isZh ? "商务宴请合作" : "Business dining partnership",
    },
    {
      id: "3",
      name: isZh ? "徐汇跑步俱乐部" : "Xuhui Running Club",
      type: "sports",
      memberCount: 500,
      contactPerson: isZh ? "王强" : "Wang Qiang",
      phone: "137-0000-3333",
      email: "run@club.com",
      address: isZh ? "上海市徐汇区漕溪北路200号" : "200 Caoxi North Rd, Xuhui, Shanghai",
      cooperationStart: "2024-01-10",
      cooperationEnd: "2024-12-31",
      status: "expired",
      rating: 3,
      totalEvents: 4,
      totalReferrals: 28,
      notes: isZh ? "赛后聚餐合作" : "Post-race dining partnership",
    },
    {
      id: "4",
      name: isZh ? "外滩摄影社" : "Bund Photography Society",
      type: "cultural",
      memberCount: 80,
      contactPerson: isZh ? "陈悦" : "Chen Yue",
      phone: "136-0000-4444",
      email: "photo@club.com",
      address: isZh ? "上海市黄浦区中山东一路12号" : "12 Zhongshan East 1st Rd, Huangpu, Shanghai",
      cooperationStart: "2024-09-01",
      cooperationEnd: "2025-09-01",
      status: "active",
      rating: 4,
      totalEvents: 3,
      totalReferrals: 15,
      notes: isZh ? "主题拍摄活动场地合作" : "Themed photography event venue",
    },
  ]);

  const [form, setForm] = useState({
    name: "",
    type: "wine",
    memberCount: 0,
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    cooperationStart: "",
    cooperationEnd: "",
    status: "active",
    rating: 3,
    notes: "",
  });

  const clubTypes = [
    { value: "wine", label: isZh ? "红酒/品鉴" : "Wine/Tasting" },
    { value: "business", label: isZh ? "商务/企业家" : "Business/Entrepreneurs" },
    { value: "sports", label: isZh ? "运动/健身" : "Sports/Fitness" },
    { value: "cultural", label: isZh ? "文化/艺术" : "Cultural/Arts" },
    { value: "expat", label: isZh ? "外籍人士" : "Expat Community" },
    { value: "alumni", label: isZh ? "校友会" : "Alumni" },
    { value: "other", label: isZh ? "其他" : "Other" },
  ];

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  };

  const filtered = clubs.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.contactPerson.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || c.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalMembers = clubs.reduce((s, c) => s + c.memberCount, 0);
  const totalReferrals = clubs.reduce((s, c) => s + c.totalReferrals, 0);
  const activeClubs = clubs.filter((c) => c.status === "active").length;

  const handleSave = () => {
    if (!form.name) {
      toast.error(isZh ? "请填写社团名称" : "Please enter club name");
      return;
    }
    if (editingClub) {
      setClubs((prev) => prev.map((c) => (c.id === editingClub.id ? { ...c, ...form, totalEvents: c.totalEvents, totalReferrals: c.totalReferrals } : c)));
      toast.success(isZh ? "社团信息已更新" : "Club updated");
    } else {
      setClubs((prev) => [...prev, { ...form, id: crypto.randomUUID(), totalEvents: 0, totalReferrals: 0 }]);
      toast.success(isZh ? "社团已添加" : "Club added");
    }
    setDialogOpen(false);
    setEditingClub(null);
    resetForm();
  };

  const resetForm = () => setForm({ name: "", type: "wine", memberCount: 0, contactPerson: "", phone: "", email: "", address: "", cooperationStart: "", cooperationEnd: "", status: "active", rating: 3, notes: "" });

  const handleEdit = (club: Club) => {
    setEditingClub(club);
    setForm({ name: club.name, type: club.type, memberCount: club.memberCount, contactPerson: club.contactPerson, phone: club.phone, email: club.email, address: club.address, cooperationStart: club.cooperationStart, cooperationEnd: club.cooperationEnd, status: club.status, rating: club.rating, notes: club.notes });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setClubs((prev) => prev.filter((c) => c.id !== id));
    toast.success(isZh ? "社团已删除" : "Club deleted");
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isZh ? "合作社团" : "Partner Clubs"}</p>
                <p className="text-2xl font-bold text-foreground">{clubs.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isZh ? "活跃社团" : "Active Clubs"}</p>
                <p className="text-2xl font-bold text-green-600">{activeClubs}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isZh ? "覆盖会员" : "Total Members"}</p>
                <p className="text-2xl font-bold text-foreground">{totalMembers.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isZh ? "总引流人次" : "Total Referrals"}</p>
                <p className="text-2xl font-bold text-foreground">{totalReferrals}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={isZh ? "搜索社团名称或联系人..." : "Search club name or contact..."} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isZh ? "全部类型" : "All Types"}</SelectItem>
            {clubTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingClub(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" />{isZh ? "添加社团" : "Add Club"}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingClub ? (isZh ? "编辑社团" : "Edit Club") : (isZh ? "添加社团" : "Add Club")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{isZh ? "社团名称" : "Club Name"} *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>{isZh ? "类型" : "Type"}</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{clubTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{isZh ? "会员人数" : "Members"}</Label><Input type="number" value={form.memberCount} onChange={(e) => setForm({ ...form, memberCount: +e.target.value })} /></div>
                <div><Label>{isZh ? "联系人" : "Contact"}</Label><Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{isZh ? "电话" : "Phone"}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>{isZh ? "邮箱" : "Email"}</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div><Label>{isZh ? "地址" : "Address"}</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{isZh ? "合作开始" : "Start Date"}</Label><Input type="date" value={form.cooperationStart} onChange={(e) => setForm({ ...form, cooperationStart: e.target.value })} /></div>
                <div><Label>{isZh ? "合作结束" : "End Date"}</Label><Input type="date" value={form.cooperationEnd} onChange={(e) => setForm({ ...form, cooperationEnd: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{isZh ? "状态" : "Status"}</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{isZh ? "活跃" : "Active"}</SelectItem>
                      <SelectItem value="pending">{isZh ? "洽谈中" : "Pending"}</SelectItem>
                      <SelectItem value="expired">{isZh ? "已到期" : "Expired"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>{isZh ? "评级" : "Rating"}</Label>
                  <Select value={String(form.rating)} onValueChange={(v) => setForm({ ...form, rating: +v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[1, 2, 3, 4, 5].map((r) => <SelectItem key={r} value={String(r)}>{"⭐".repeat(r)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>{isZh ? "备注" : "Notes"}</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <Button onClick={handleSave} className="w-full">{editingClub ? (isZh ? "保存修改" : "Save Changes") : (isZh ? "添加" : "Add")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isZh ? "社团名称" : "Club Name"}</TableHead>
                <TableHead>{isZh ? "类型" : "Type"}</TableHead>
                <TableHead>{isZh ? "会员数" : "Members"}</TableHead>
                <TableHead>{isZh ? "联系人" : "Contact"}</TableHead>
                <TableHead>{isZh ? "评级" : "Rating"}</TableHead>
                <TableHead>{isZh ? "活动次数" : "Events"}</TableHead>
                <TableHead>{isZh ? "引流人次" : "Referrals"}</TableHead>
                <TableHead>{isZh ? "状态" : "Status"}</TableHead>
                <TableHead>{isZh ? "操作" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{isZh ? "暂无社团数据" : "No clubs found"}</TableCell></TableRow>
              ) : (
                filtered.map((club) => (
                  <TableRow key={club.id}>
                    <TableCell className="font-medium">{club.name}</TableCell>
                    <TableCell><Badge variant="outline">{clubTypes.find((t) => t.value === club.type)?.label}</Badge></TableCell>
                    <TableCell>{club.memberCount.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="text-sm">{club.contactPerson}</div>
                      <div className="text-xs text-muted-foreground">{club.phone}</div>
                    </TableCell>
                    <TableCell>{"⭐".repeat(club.rating)}</TableCell>
                    <TableCell>{club.totalEvents}</TableCell>
                    <TableCell>{club.totalReferrals}</TableCell>
                    <TableCell><Badge className={statusColors[club.status]}>{club.status === "active" ? (isZh ? "活跃" : "Active") : club.status === "expired" ? (isZh ? "已到期" : "Expired") : (isZh ? "洽谈中" : "Pending")}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(club)}><Edit className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(club.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubsTab;
