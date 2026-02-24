import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Search, Star, Edit2, Trash2, Building2, Dumbbell, Users2, Store, Handshake, Upload, FileText, Image, ExternalLink, X } from "lucide-react";

const partnerTypes = [
  { value: "hotel", labelZh: "酒店", labelEn: "Hotel", icon: Building2 },
  { value: "sports_club", labelZh: "运动俱乐部", labelEn: "Sports Club", icon: Dumbbell },
  { value: "community", labelZh: "社群/团体", labelEn: "Community", icon: Users2 },
  { value: "merchant", labelZh: "异业商户", labelEn: "Merchant", icon: Store },
  { value: "other", labelZh: "其他", labelEn: "Other", icon: Handshake },
];

const statusOptions = [
  { value: "active", labelZh: "合作中", labelEn: "Active" },
  { value: "paused", labelZh: "暂停", labelEn: "Paused" },
  { value: "expired", labelZh: "已到期", labelEn: "Expired" },
  { value: "terminated", labelZh: "已终止", labelEn: "Terminated" },
];

const emptyForm = {
  name: "", short_name: "", type: "hotel", contact_person: "", phone: "", email: "", wechat: "",
  address: "", cooperation_start: new Date().toISOString().slice(0, 10), cooperation_end: "",
  cooperation_content: "", commission_rate: 0, status: "active", rating: 3, notes: "",
};

const PartnersTab = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const { currentStore } = useStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [contractFile, setContractFile] = useState<{ url: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isHQ = currentStore.id === "hq";

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["partners", currentStore.id],
    queryFn: async () => {
      let q = supabase.from("partners").select("*").order("created_at", { ascending: false });
      if (!isHQ) q = q.eq("store_id", currentStore.id);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const handleFileUpload = async (file: File) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(isZh ? "仅支持PDF和图片格式" : "Only PDF and image formats supported");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(isZh ? "文件不能超过10MB" : "File must be under 10MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `partners/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("contracts").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("contracts").getPublicUrl(path);
      const fileType = file.type === "application/pdf" ? "pdf" : "image";
      setContractFile({ url: publicUrl, type: fileType });
      toast.success(isZh ? "上传成功" : "Uploaded successfully");
    } catch (e) {
      toast.error(isZh ? "上传失败" : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const upsert = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      const payload: any = {
        ...values,
        store_id: currentStore.id,
        store_name_zh: currentStore.name,
        store_name_en: currentStore.nameEn || currentStore.name,
        cooperation_end: values.cooperation_end || null,
        commission_rate: Number(values.commission_rate) || 0,
      };
      if (contractFile) {
        payload.contract_url = contractFile.url;
        payload.contract_file_type = contractFile.type;
      }
      if (values.id) {
        const { error } = await supabase.from("partners").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("partners").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success(isZh ? "保存成功" : "Saved successfully");
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setContractFile(null);
    },
    onError: () => toast.error(isZh ? "保存失败" : "Save failed"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success(isZh ? "已删除" : "Deleted");
    },
  });

  const filtered = partners.filter((p: any) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.short_name || "").toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const getTypeLabel = (type: string) => {
    const found = partnerTypes.find((pt) => pt.value === type);
    return found ? (isZh ? found.labelZh : found.labelEn) : type;
  };

  const getStatusBadge = (status: string) => {
    const s = statusOptions.find((o) => o.value === status);
    const variant = status === "active" ? "default" : status === "paused" ? "secondary" : "destructive";
    return <Badge variant={variant as any}>{s ? (isZh ? s.labelZh : s.labelEn) : status}</Badge>;
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      name: p.name, short_name: p.short_name || "", type: p.type, contact_person: p.contact_person || "",
      phone: p.phone || "", email: p.email || "", wechat: p.wechat || "", address: p.address || "",
      cooperation_start: p.cooperation_start || "", cooperation_end: p.cooperation_end || "",
      cooperation_content: p.cooperation_content || "", commission_rate: p.commission_rate || 0,
      status: p.status, rating: p.rating || 3, notes: p.notes || "",
    });
    setContractFile(p.contract_url ? { url: p.contract_url, type: p.contract_file_type || "pdf" } : null);
    setDialogOpen(true);
  };

  const typeCounts = partnerTypes.map((pt) => ({
    ...pt,
    count: partners.filter((p: any) => p.type === pt.value).length,
  }));

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {typeCounts.map((tc) => (
          <Card key={tc.value} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTypeFilter(typeFilter === tc.value ? "all" : tc.value)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${typeFilter === tc.value ? "bg-primary/20" : "bg-muted"}`}>
                <tc.icon className={`w-5 h-5 ${typeFilter === tc.value ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{tc.count}</p>
                <p className="text-xs text-muted-foreground">{isZh ? tc.labelZh : tc.labelEn}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={isZh ? "搜索合作伙伴..." : "Search partners..."} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); setContractFile(null); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" />{isZh ? "新增伙伴" : "Add Partner"}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? (isZh ? "编辑合作伙伴" : "Edit Partner") : (isZh ? "新增合作伙伴" : "Add Partner")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{isZh ? "名称" : "Name"} *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>{isZh ? "简称" : "Short Name"}</Label><Input value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isZh ? "类型" : "Type"}</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{partnerTypes.map((pt) => <SelectItem key={pt.value} value={pt.value}>{isZh ? pt.labelZh : pt.labelEn}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isZh ? "状态" : "Status"}</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{isZh ? s.labelZh : s.labelEn}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{isZh ? "联系人" : "Contact"}</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
                <div><Label>{isZh ? "电话" : "Phone"}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>{isZh ? "微信" : "WeChat"}</Label><Input value={form.wechat} onChange={(e) => setForm({ ...form, wechat: e.target.value })} /></div>
              </div>
              <div><Label>{isZh ? "地址" : "Address"}</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{isZh ? "合作开始" : "Start Date"}</Label><Input type="date" value={form.cooperation_start} onChange={(e) => setForm({ ...form, cooperation_start: e.target.value })} /></div>
                <div><Label>{isZh ? "合作结束" : "End Date"}</Label><Input type="date" value={form.cooperation_end} onChange={(e) => setForm({ ...form, cooperation_end: e.target.value })} /></div>
              </div>
              <div><Label>{isZh ? "佣金比例 (%)" : "Commission Rate (%)"}</Label><Input type="number" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: Number(e.target.value) })} /></div>
              <div><Label>{isZh ? "合作内容" : "Cooperation Details"}</Label><Textarea value={form.cooperation_content} onChange={(e) => setForm({ ...form, cooperation_content: e.target.value })} rows={2} /></div>

              {/* Contract Upload */}
              <div>
                <Label>{isZh ? "合作协议/合同" : "Contract / Agreement"}</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                    e.target.value = "";
                  }}
                />
                {contractFile ? (
                  <div className="mt-1 flex items-center gap-2 p-2 rounded-md border border-border bg-muted/50">
                    {contractFile.type === "pdf" ? (
                      <FileText className="w-5 h-5 text-destructive shrink-0" />
                    ) : (
                      <Image className="w-5 h-5 text-primary shrink-0" />
                    )}
                    <span className="text-sm truncate flex-1">{contractFile.type === "pdf" ? "PDF" : isZh ? "图片" : "Image"} {isZh ? "已上传" : "uploaded"}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => window.open(contractFile.url, "_blank")}>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setContractFile(null)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-1"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? (isZh ? "上传中..." : "Uploading...") : (isZh ? "上传合同 (PDF/图片)" : "Upload Contract (PDF/Image)")}
                  </Button>
                )}
              </div>

              <div><Label>{isZh ? "备注" : "Notes"}</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <Button className="w-full" disabled={!form.name || uploading} onClick={() => upsert.mutate(editingId ? { ...form, id: editingId } : form)}>
                {isZh ? "保存" : "Save"}
              </Button>
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
                <TableHead>{isZh ? "名称" : "Name"}</TableHead>
                <TableHead>{isZh ? "类型" : "Type"}</TableHead>
                <TableHead>{isZh ? "联系人" : "Contact"}</TableHead>
                <TableHead>{isZh ? "合作内容" : "Details"}</TableHead>
                <TableHead>{isZh ? "佣金" : "Commission"}</TableHead>
                <TableHead>{isZh ? "合同" : "Contract"}</TableHead>
                <TableHead>{isZh ? "状态" : "Status"}</TableHead>
                <TableHead>{isZh ? "评分" : "Rating"}</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{isZh ? "加载中..." : "Loading..."}</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{isZh ? "暂无合作伙伴" : "No partners yet"}</TableCell></TableRow>
              ) : filtered.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div><span className="font-medium text-foreground">{p.name}</span>{p.short_name && <span className="text-muted-foreground text-xs ml-1">({p.short_name})</span>}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{getTypeLabel(p.type)}</Badge></TableCell>
                  <TableCell>
                    <div className="text-sm">{p.contact_person}</div>
                    <div className="text-xs text-muted-foreground">{p.phone}</div>
                  </TableCell>
                  <TableCell><span className="text-sm line-clamp-1">{p.cooperation_content || "-"}</span></TableCell>
                  <TableCell>{p.commission_rate > 0 ? `${p.commission_rate}%` : "-"}</TableCell>
                  <TableCell>
                    {p.contract_url ? (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(p.contract_url, "_blank")}>
                        {p.contract_file_type === "pdf" ? <FileText className="w-4 h-4 text-destructive" /> : <Image className="w-4 h-4 text-primary" />}
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(p.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < (p.rating || 0) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMut.mutate(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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

export default PartnersTab;
