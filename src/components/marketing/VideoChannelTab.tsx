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
import { Plus, Search, Video, Eye, Heart, Share2, Edit, Trash2, TrendingUp, Play } from "lucide-react";
import { toast } from "sonner";

interface VideoItem {
  id: string;
  title: string;
  category: string;
  publishDate: string;
  duration: string;
  views: number;
  likes: number;
  shares: number;
  status: string;
  coverUrl: string;
  notes: string;
}

const VideoChannelTab = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);

  const [videos, setVideos] = useState<VideoItem[]>([
    { id: "1", title: isZh ? "周末红酒品鉴会精彩回顾" : "Weekend Wine Tasting Highlights", category: "event", publishDate: "2025-02-20", duration: "2:35", views: 12800, likes: 456, shares: 89, status: "published", coverUrl: "", notes: "" },
    { id: "2", title: isZh ? "主厨推荐｜春季限定菜单" : "Chef's Pick: Spring Menu", category: "menu", publishDate: "2025-02-18", duration: "1:48", views: 8900, likes: 312, shares: 67, status: "published", coverUrl: "", notes: "" },
    { id: "3", title: isZh ? "餐厅幕后｜我们的食材从哪来" : "Behind the Scenes: Our Ingredients", category: "brand", publishDate: "2025-02-15", duration: "3:12", views: 15200, likes: 623, shares: 134, status: "published", coverUrl: "", notes: "" },
    { id: "4", title: isZh ? "情人节特别活动回顾" : "Valentine's Day Event Recap", category: "event", publishDate: "2025-02-14", duration: "4:05", views: 22100, likes: 891, shares: 215, status: "published", coverUrl: "", notes: "" },
    { id: "5", title: isZh ? "调酒教程｜经典马提尼" : "Cocktail Tutorial: Classic Martini", category: "tutorial", publishDate: "", duration: "2:20", views: 0, likes: 0, shares: 0, status: "draft", coverUrl: "", notes: isZh ? "待审核" : "Pending review" },
  ]);

  const [form, setForm] = useState({ title: "", category: "event", publishDate: "", duration: "", views: 0, likes: 0, shares: 0, status: "draft", coverUrl: "", notes: "" });

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

  const filtered = videos.filter((v) => {
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || v.category === catFilter;
    return matchSearch && matchCat;
  });

  const totalViews = videos.reduce((s, v) => s + v.views, 0);
  const totalLikes = videos.reduce((s, v) => s + v.likes, 0);
  const totalShares = videos.reduce((s, v) => s + v.shares, 0);
  const publishedCount = videos.filter((v) => v.status === "published").length;

  const resetForm = () => setForm({ title: "", category: "event", publishDate: "", duration: "", views: 0, likes: 0, shares: 0, status: "draft", coverUrl: "", notes: "" });

  const handleSave = () => {
    if (!form.title) { toast.error(isZh ? "请填写视频标题" : "Please enter video title"); return; }
    if (editingVideo) {
      setVideos((prev) => prev.map((v) => v.id === editingVideo.id ? { ...v, ...form } : v));
      toast.success(isZh ? "视频信息已更新" : "Video updated");
    } else {
      setVideos((prev) => [...prev, { ...form, id: crypto.randomUUID() }]);
      toast.success(isZh ? "视频已添加" : "Video added");
    }
    setDialogOpen(false); setEditingVideo(null); resetForm();
  };

  const handleEdit = (v: VideoItem) => { setEditingVideo(v); setForm({ title: v.title, category: v.category, publishDate: v.publishDate, duration: v.duration, views: v.views, likes: v.likes, shares: v.shares, status: v.status, coverUrl: v.coverUrl, notes: v.notes }); setDialogOpen(true); };
  const handleDelete = (id: string) => { setVideos((prev) => prev.filter((v) => v.id !== id)); toast.success(isZh ? "已删除" : "Deleted"); };

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
                <div><Label>{isZh ? "发布日期" : "Publish Date"}</Label><Input type="date" value={form.publishDate} onChange={(e) => setForm({ ...form, publishDate: e.target.value })} /></div>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isZh ? "视频标题" : "Title"}</TableHead>
                <TableHead>{isZh ? "分类" : "Category"}</TableHead>
                <TableHead>{isZh ? "时长" : "Duration"}</TableHead>
                <TableHead>{isZh ? "播放量" : "Views"}</TableHead>
                <TableHead>{isZh ? "点赞" : "Likes"}</TableHead>
                <TableHead>{isZh ? "转发" : "Shares"}</TableHead>
                <TableHead>{isZh ? "状态" : "Status"}</TableHead>
                <TableHead>{isZh ? "操作" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{isZh ? "暂无数据" : "No videos found"}</TableCell></TableRow>
              ) : filtered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium max-w-[240px] truncate">{v.title}</TableCell>
                  <TableCell><Badge variant="outline">{categories.find((c) => c.value === v.category)?.label}</Badge></TableCell>
                  <TableCell>{v.duration}</TableCell>
                  <TableCell>{v.views.toLocaleString()}</TableCell>
                  <TableCell>{v.likes.toLocaleString()}</TableCell>
                  <TableCell>{v.shares.toLocaleString()}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoChannelTab;
