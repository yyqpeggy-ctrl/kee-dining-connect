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
import { Plus, Search, Eye, Heart, Share2, Edit, Trash2, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";

interface VideoItem {
  id: string;
  title: string;
  category: string;
  publish_date: string | null;
  duration: string;
  views: number;
  likes: number;
  shares: number;
  status: string;
  cover_url: string;
  notes: string;
  store_id: string;
  store_name_zh: string;
  store_name_en: string;
}

const VideoChannelTab = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const { currentStore, isHQ } = useStore();

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ title: "", category: "event", publish_date: "", duration: "", views: 0, likes: 0, shares: 0, status: "draft", cover_url: "", notes: "" });

  const categories = [
    { value: "event", label: isZh ? "活动回顾" : "Event Recap" },
    { value: "menu", label: isZh ? "菜品推荐" : "Menu Feature" },
    { value: "brand", label: isZh ? "品牌故事" : "Brand Story" },
    { value: "tutorial", label: isZh ? "教程分享" : "Tutorial" },
    { value: "promo", label: isZh ? "促销宣传" : "Promotion" },
  ];

  const statusColors: Record<string, string> = {
    published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    archived: "bg-muted text-muted-foreground",
  };

  const fetchVideos = async () => {
    setLoading(true);
    let query = supabase.from("video_channels").select("*").order("created_at", { ascending: false });
    if (!isHQ) {
      query = query.eq("store_id", currentStore.id);
    }
    const { data, error } = await query;
    if (error) {
      toast.error(isZh ? "加载失败" : "Failed to load");
    } else {
      setVideos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchVideos(); }, [currentStore.id]);

  const filtered = videos.filter((v) => {
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || v.category === catFilter;
    return matchSearch && matchCat;
  });

  const totalViews = videos.reduce((s, v) => s + v.views, 0);
  const totalLikes = videos.reduce((s, v) => s + v.likes, 0);
  const totalShares = videos.reduce((s, v) => s + v.shares, 0);
  const publishedCount = videos.filter((v) => v.status === "published").length;

  const resetForm = () => setForm({ title: "", category: "event", publish_date: "", duration: "", views: 0, likes: 0, shares: 0, status: "draft", cover_url: "", notes: "" });

  const handleSave = async () => {
    if (!form.title) { toast.error(isZh ? "请填写视频标题" : "Please enter video title"); return; }

    const payload = {
      title: form.title,
      category: form.category,
      publish_date: form.publish_date || null,
      duration: form.duration,
      views: form.views,
      likes: form.likes,
      shares: form.shares,
      status: form.status,
      cover_url: form.cover_url,
      notes: form.notes,
      store_id: currentStore.id,
      store_name_zh: currentStore.name,
      store_name_en: currentStore.nameEn,
    };

    if (editingVideo) {
      const { error } = await supabase.from("video_channels").update(payload).eq("id", editingVideo.id);
      if (error) { toast.error(isZh ? "更新失败" : "Update failed"); return; }
      toast.success(isZh ? "视频信息已更新" : "Video updated");
    } else {
      const { error } = await supabase.from("video_channels").insert(payload);
      if (error) { toast.error(isZh ? "添加失败" : "Add failed"); return; }
      toast.success(isZh ? "视频已添加" : "Video added");
    }
    setDialogOpen(false); setEditingVideo(null); resetForm();
    fetchVideos();
  };

  const handleEdit = (v: VideoItem) => {
    setEditingVideo(v);
    setForm({ title: v.title, category: v.category, publish_date: v.publish_date || "", duration: v.duration || "", views: v.views, likes: v.likes, shares: v.shares, status: v.status, cover_url: v.cover_url || "", notes: v.notes || "" });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("video_channels").delete().eq("id", id);
    if (error) { toast.error(isZh ? "删除失败" : "Delete failed"); return; }
    toast.success(isZh ? "已删除" : "Deleted");
    fetchVideos();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">{isZh ? "已发布视频" : "Published"}</p><p className="text-2xl font-bold text-foreground">{publishedCount}</p></div><Play className="w-8 h-8 text-primary opacity-60" /></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">{isZh ? "总播放量" : "Total Views"}</p><p className="text-2xl font-bold text-foreground">{totalViews.toLocaleString()}</p></div><Eye className="w-8 h-8 text-blue-500 opacity-60" /></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">{isZh ? "总点赞数" : "Total Likes"}</p><p className="text-2xl font-bold text-foreground">{totalLikes.toLocaleString()}</p></div><Heart className="w-8 h-8 text-red-500 opacity-60" /></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">{isZh ? "总转发数" : "Total Shares"}</p><p className="text-2xl font-bold text-foreground">{totalShares.toLocaleString()}</p></div><Share2 className="w-8 h-8 text-emerald-500 opacity-60" /></div></CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={isZh ? "搜索视频标题..." : "Search video title..."} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isZh ? "全部分类" : "All Categories"}</SelectItem>
            {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingVideo(null); resetForm(); } }}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" />{isZh ? "添加视频" : "Add Video"}</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingVideo ? (isZh ? "编辑视频" : "Edit Video") : (isZh ? "添加视频" : "Add Video")}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>{isZh ? "视频标题" : "Title"} *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{isZh ? "分类" : "Category"}</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>{isZh ? "时长" : "Duration"}</Label><Input placeholder="2:35" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{isZh ? "发布日期" : "Publish Date"}</Label><Input type="date" value={form.publish_date} onChange={(e) => setForm({ ...form, publish_date: e.target.value })} /></div>
                <div><Label>{isZh ? "状态" : "Status"}</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="published">{isZh ? "已发布" : "Published"}</SelectItem><SelectItem value="draft">{isZh ? "草稿" : "Draft"}</SelectItem><SelectItem value="archived">{isZh ? "已归档" : "Archived"}</SelectItem></SelectContent></Select></div>
              </div>
              <div><Label>{isZh ? "备注" : "Notes"}</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <Button onClick={handleSave} className="w-full">{editingVideo ? (isZh ? "保存" : "Save") : (isZh ? "添加" : "Add")}</Button>
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
                  <TableHead>{isZh ? "视频标题" : "Title"}</TableHead>
                  <TableHead>{isZh ? "分类" : "Category"}</TableHead>
                  <TableHead>{isZh ? "时长" : "Duration"}</TableHead>
                  <TableHead>{isZh ? "播放量" : "Views"}</TableHead>
                  <TableHead>{isZh ? "点赞" : "Likes"}</TableHead>
                  <TableHead>{isZh ? "转发" : "Shares"}</TableHead>
                  {isHQ && <TableHead>{isZh ? "门店" : "Store"}</TableHead>}
                  <TableHead>{isZh ? "状态" : "Status"}</TableHead>
                  <TableHead>{isZh ? "操作" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={isHQ ? 9 : 8} className="text-center py-8 text-muted-foreground">{isZh ? "暂无数据" : "No videos found"}</TableCell></TableRow>
                ) : filtered.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium max-w-[240px] truncate">{v.title}</TableCell>
                    <TableCell><Badge variant="outline">{categories.find((c) => c.value === v.category)?.label}</Badge></TableCell>
                    <TableCell>{v.duration}</TableCell>
                    <TableCell>{v.views.toLocaleString()}</TableCell>
                    <TableCell>{v.likes.toLocaleString()}</TableCell>
                    <TableCell>{v.shares.toLocaleString()}</TableCell>
                    {isHQ && <TableCell><Badge variant="secondary">{isZh ? v.store_name_zh : v.store_name_en}</Badge></TableCell>}
                    <TableCell><Badge className={statusColors[v.status]}>{v.status === "published" ? (isZh ? "已发布" : "Published") : v.status === "draft" ? (isZh ? "草稿" : "Draft") : (isZh ? "已归档" : "Archived")}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(v)}><Edit className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(v.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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

export default VideoChannelTab;
