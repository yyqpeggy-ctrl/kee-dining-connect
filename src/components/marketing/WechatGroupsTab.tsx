import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Users, MessageCircle, Edit, Trash2, TrendingUp, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface WechatGroup {
  id: string;
  name: string;
  type: string;
  memberCount: number;
  owner: string;
  qrCodeUrl: string;
  createdDate: string;
  status: string;
  weeklyMessages: number;
  weeklyNewMembers: number;
  notes: string;
}

const WechatGroupsTab = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WechatGroup | null>(null);

  const [groups, setGroups] = useState<WechatGroup[]>([
    { id: "1", name: isZh ? "VIP客户福利群" : "VIP Customer Benefits", type: "vip", memberCount: 388, owner: isZh ? "小王" : "Xiao Wang", qrCodeUrl: "", createdDate: "2024-06-01", status: "active", weeklyMessages: 156, weeklyNewMembers: 12, notes: isZh ? "每周三发优惠券" : "Weekly coupon on Wed" },
    { id: "2", name: isZh ? "品酒爱好者交流群" : "Wine Tasting Community", type: "interest", memberCount: 245, owner: isZh ? "张经理" : "Manager Zhang", qrCodeUrl: "", createdDate: "2024-03-15", status: "active", weeklyMessages: 89, weeklyNewMembers: 5, notes: isZh ? "定期品鉴活动通知" : "Regular tasting events" },
    { id: "3", name: isZh ? "周末活动群" : "Weekend Events Group", type: "event", memberCount: 178, owner: isZh ? "李助理" : "Li Assistant", qrCodeUrl: "", createdDate: "2024-09-01", status: "active", weeklyMessages: 42, weeklyNewMembers: 8, notes: isZh ? "周末活动预约" : "Weekend event bookings" },
    { id: "4", name: isZh ? "企业团建咨询群" : "Corporate Team Building", type: "business", memberCount: 95, owner: isZh ? "陈总监" : "Director Chen", qrCodeUrl: "", createdDate: "2024-11-10", status: "active", weeklyMessages: 28, weeklyNewMembers: 3, notes: isZh ? "企业客户专属" : "Corporate clients only" },
  ]);

  const [form, setForm] = useState({ name: "", type: "vip", memberCount: 0, owner: "", qrCodeUrl: "", createdDate: "", status: "active", weeklyMessages: 0, weeklyNewMembers: 0, notes: "" });

  const groupTypes = [
    { value: "vip", label: isZh ? "VIP客户群" : "VIP Customers" },
    { value: "interest", label: isZh ? "兴趣社群" : "Interest Group" },
    { value: "event", label: isZh ? "活动群" : "Event Group" },
    { value: "business", label: isZh ? "商务群" : "Business Group" },
    { value: "internal", label: isZh ? "内部群" : "Internal" },
  ];

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    archived: "bg-muted text-muted-foreground",
  };

  const filtered = groups.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) || g.owner.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || g.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalMembers = groups.reduce((s, g) => s + g.memberCount, 0);
  const totalMessages = groups.reduce((s, g) => s + g.weeklyMessages, 0);
  const totalNewMembers = groups.reduce((s, g) => s + g.weeklyNewMembers, 0);

  const resetForm = () => setForm({ name: "", type: "vip", memberCount: 0, owner: "", qrCodeUrl: "", createdDate: "", status: "active", weeklyMessages: 0, weeklyNewMembers: 0, notes: "" });

  const handleSave = () => {
    if (!form.name) { toast.error(isZh ? "请填写群名称" : "Please enter group name"); return; }
    if (editingGroup) {
      setGroups((prev) => prev.map((g) => g.id === editingGroup.id ? { ...g, ...form } : g));
      toast.success(isZh ? "群信息已更新" : "Group updated");
    } else {
      setGroups((prev) => [...prev, { ...form, id: crypto.randomUUID() }]);
      toast.success(isZh ? "微信群已添加" : "Group added");
    }
    setDialogOpen(false); setEditingGroup(null); resetForm();
  };

  const handleEdit = (g: WechatGroup) => { setEditingGroup(g); setForm({ name: g.name, type: g.type, memberCount: g.memberCount, owner: g.owner, qrCodeUrl: g.qrCodeUrl, createdDate: g.createdDate, status: g.status, weeklyMessages: g.weeklyMessages, weeklyNewMembers: g.weeklyNewMembers, notes: g.notes }); setDialogOpen(true); };
  const handleDelete = (id: string) => { setGroups((prev) => prev.filter((g) => g.id !== id)); toast.success(isZh ? "已删除" : "Deleted"); };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">{isZh ? "微信群数量" : "Total Groups"}</p><p className="text-2xl font-bold text-foreground">{groups.length}</p></div><MessageCircle className="w-8 h-8 text-primary opacity-60" /></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">{isZh ? "群成员总数" : "Total Members"}</p><p className="text-2xl font-bold text-foreground">{totalMembers.toLocaleString()}</p></div><Users className="w-8 h-8 text-blue-500 opacity-60" /></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">{isZh ? "周消息数" : "Weekly Messages"}</p><p className="text-2xl font-bold text-foreground">{totalMessages}</p></div><TrendingUp className="w-8 h-8 text-emerald-500 opacity-60" /></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">{isZh ? "周新增成员" : "New Members/Week"}</p><p className="text-2xl font-bold text-green-600">{totalNewMembers}</p></div><UserPlus className="w-8 h-8 text-green-500 opacity-60" /></div></CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={isZh ? "搜索群名称或群主..." : "Search group or owner..."} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isZh ? "全部类型" : "All Types"}</SelectItem>
            {groupTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingGroup(null); resetForm(); } }}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" />{isZh ? "添加微信群" : "Add Group"}</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingGroup ? (isZh ? "编辑微信群" : "Edit Group") : (isZh ? "添加微信群" : "Add Group")}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{isZh ? "群名称" : "Group Name"} *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>{isZh ? "类型" : "Type"}</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{groupTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{isZh ? "成员人数" : "Members"}</Label><Input type="number" value={form.memberCount} onChange={(e) => setForm({ ...form, memberCount: +e.target.value })} /></div>
                <div><Label>{isZh ? "群主" : "Owner"}</Label><Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{isZh ? "创建日期" : "Created"}</Label><Input type="date" value={form.createdDate} onChange={(e) => setForm({ ...form, createdDate: e.target.value })} /></div>
                <div><Label>{isZh ? "状态" : "Status"}</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">{isZh ? "活跃" : "Active"}</SelectItem><SelectItem value="paused">{isZh ? "暂停" : "Paused"}</SelectItem><SelectItem value="archived">{isZh ? "已归档" : "Archived"}</SelectItem></SelectContent></Select></div>
              </div>
              <div><Label>{isZh ? "备注" : "Notes"}</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <Button onClick={handleSave} className="w-full">{editingGroup ? (isZh ? "保存" : "Save") : (isZh ? "添加" : "Add")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isZh ? "群名称" : "Group Name"}</TableHead>
                <TableHead>{isZh ? "类型" : "Type"}</TableHead>
                <TableHead>{isZh ? "成员数" : "Members"}</TableHead>
                <TableHead>{isZh ? "群主" : "Owner"}</TableHead>
                <TableHead>{isZh ? "周消息" : "Msg/Wk"}</TableHead>
                <TableHead>{isZh ? "周新增" : "New/Wk"}</TableHead>
                <TableHead>{isZh ? "状态" : "Status"}</TableHead>
                <TableHead>{isZh ? "操作" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{isZh ? "暂无数据" : "No groups found"}</TableCell></TableRow>
              ) : filtered.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell><Badge variant="outline">{groupTypes.find((t) => t.value === g.type)?.label}</Badge></TableCell>
                  <TableCell>{g.memberCount.toLocaleString()}</TableCell>
                  <TableCell>{g.owner}</TableCell>
                  <TableCell>{g.weeklyMessages}</TableCell>
                  <TableCell className="text-green-600">+{g.weeklyNewMembers}</TableCell>
                  <TableCell><Badge className={statusColors[g.status]}>{g.status === "active" ? (isZh ? "活跃" : "Active") : g.status === "paused" ? (isZh ? "暂停" : "Paused") : (isZh ? "已归档" : "Archived")}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(g)}><Edit className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(g.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default WechatGroupsTab;
