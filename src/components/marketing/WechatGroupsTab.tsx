import { useState, useEffect } from "react";
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
import { Plus, Search, Users, MessageCircle, Edit, Trash2, TrendingUp, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";

interface WechatGroup {
  id: string;
  name: string;
  type: string;
  member_count: number;
  owner: string;
  qr_code_url: string;
  created_date: string;
  status: string;
  weekly_messages: number;
  weekly_new_members: number;
  notes: string;
  store_id: string;
  store_name_zh: string;
  store_name_en: string;
}

const WechatGroupsTab = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const { currentStore, isHQ } = useStore();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WechatGroup | null>(null);
  const [groups, setGroups] = useState<WechatGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ name: "", type: "vip", member_count: 0, owner: "", qr_code_url: "", created_date: "", status: "active", weekly_messages: 0, weekly_new_members: 0, notes: "" });

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

  const fetchGroups = async () => {
    setLoading(true);
    let query = supabase.from("wechat_groups").select("*").order("created_at", { ascending: false });
    if (!isHQ) {
      query = query.eq("store_id", currentStore.id);
    }
    const { data, error } = await query;
    if (error) {
      toast.error(isZh ? "加载失败" : "Failed to load");
    } else {
      setGroups(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, [currentStore.id]);

  const filtered = groups.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) || g.owner.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || g.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalMembers = groups.reduce((s, g) => s + g.member_count, 0);
  const totalMessages = groups.reduce((s, g) => s + g.weekly_messages, 0);
  const totalNewMembers = groups.reduce((s, g) => s + g.weekly_new_members, 0);

  const resetForm = () => setForm({ name: "", type: "vip", member_count: 0, owner: "", qr_code_url: "", created_date: "", status: "active", weekly_messages: 0, weekly_new_members: 0, notes: "" });

  const handleSave = async () => {
    if (!form.name) { toast.error(isZh ? "请填写群名称" : "Please enter group name"); return; }
    
    const payload = {
      name: form.name,
      type: form.type,
      member_count: form.member_count,
      owner: form.owner,
      qr_code_url: form.qr_code_url,
      created_date: form.created_date || null,
      status: form.status,
      weekly_messages: form.weekly_messages,
      weekly_new_members: form.weekly_new_members,
      notes: form.notes,
      store_id: currentStore.id,
      store_name_zh: currentStore.name,
      store_name_en: currentStore.nameEn,
    };

    if (editingGroup) {
      const { error } = await supabase.from("wechat_groups").update(payload).eq("id", editingGroup.id);
      if (error) { toast.error(isZh ? "更新失败" : "Update failed"); return; }
      toast.success(isZh ? "群信息已更新" : "Group updated");
    } else {
      const { error } = await supabase.from("wechat_groups").insert(payload);
      if (error) { toast.error(isZh ? "添加失败" : "Add failed"); return; }
      toast.success(isZh ? "微信群已添加" : "Group added");
    }
    setDialogOpen(false); setEditingGroup(null); resetForm();
    fetchGroups();
  };

  const handleEdit = (g: WechatGroup) => {
    setEditingGroup(g);
    setForm({ name: g.name, type: g.type, member_count: g.member_count, owner: g.owner, qr_code_url: g.qr_code_url, created_date: g.created_date || "", status: g.status, weekly_messages: g.weekly_messages, weekly_new_members: g.weekly_new_members, notes: g.notes || "" });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("wechat_groups").delete().eq("id", id);
    if (error) { toast.error(isZh ? "删除失败" : "Delete failed"); return; }
    toast.success(isZh ? "已删除" : "Deleted");
    fetchGroups();
  };

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
                <div><Label>{isZh ? "成员人数" : "Members"}</Label><Input type="number" value={form.member_count} onChange={(e) => setForm({ ...form, member_count: +e.target.value })} /></div>
                <div><Label>{isZh ? "群主" : "Owner"}</Label><Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{isZh ? "创建日期" : "Created"}</Label><Input type="date" value={form.created_date} onChange={(e) => setForm({ ...form, created_date: e.target.value })} /></div>
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
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isZh ? "群名称" : "Group Name"}</TableHead>
                  <TableHead>{isZh ? "类型" : "Type"}</TableHead>
                  <TableHead>{isZh ? "成员数" : "Members"}</TableHead>
                  <TableHead>{isZh ? "群主" : "Owner"}</TableHead>
                  <TableHead>{isZh ? "周消息" : "Msg/Wk"}</TableHead>
                  <TableHead>{isZh ? "周新增" : "New/Wk"}</TableHead>
                  {isHQ && <TableHead>{isZh ? "门店" : "Store"}</TableHead>}
                  <TableHead>{isZh ? "状态" : "Status"}</TableHead>
                  <TableHead>{isZh ? "操作" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={isHQ ? 9 : 8} className="text-center py-8 text-muted-foreground">{isZh ? "暂无数据" : "No groups found"}</TableCell></TableRow>
                ) : filtered.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell><Badge variant="outline">{groupTypes.find((t) => t.value === g.type)?.label}</Badge></TableCell>
                    <TableCell>{g.member_count.toLocaleString()}</TableCell>
                    <TableCell>{g.owner}</TableCell>
                    <TableCell>{g.weekly_messages}</TableCell>
                    <TableCell className="text-green-600">+{g.weekly_new_members}</TableCell>
                    {isHQ && <TableCell><Badge variant="secondary">{isZh ? g.store_name_zh : g.store_name_en}</Badge></TableCell>}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WechatGroupsTab;
