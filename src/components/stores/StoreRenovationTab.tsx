import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Hammer, Package, Calendar, AlertTriangle, CheckCircle, Clock,
  MoreHorizontal, Plus, Trash2, Pencil,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const storeOptions = [
  { id: "1", zh: "总店", en: "Main Store" },
  { id: "2", zh: "国贸分店", en: "Guomao Branch" },
  { id: "3", zh: "三里屯分店", en: "Sanlitun Branch" },
  { id: "4", zh: "望京分店", en: "Wangjing Branch" },
];

const categoryOptions = [
  { value: "equipment", zh: "厨房设备", en: "Kitchen Equipment" },
  { value: "electronics", zh: "电子设备", en: "Electronics" },
  { value: "furniture", zh: "家具", en: "Furniture" },
  { value: "infrastructure", zh: "基础设施", en: "Infrastructure" },
  { value: "entertainment", zh: "娱乐设备", en: "Entertainment" },
  { value: "other", zh: "其他", en: "Other" },
];

const phaseOptions = [
  { value: "design", zh: "设计审批", en: "Design Approval" },
  { value: "demolition", zh: "拆除改造", en: "Demolition" },
  { value: "interior", zh: "内部装修", en: "Interior Renovation" },
  { value: "partial", zh: "局部翻新", en: "Partial Renovation" },
  { value: "inspection", zh: "验收阶段", en: "Inspection" },
];

const StoreRenovationTab = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const queryClient = useQueryClient();

  // Asset dialog state
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<string | null>(null);
  const [newAsset, setNewAsset] = useState({
    name_zh: "", name_en: "", category: "equipment",
    store_id: "1", store_name_zh: "总店", store_name_en: "Main Store",
    purchase_date: new Date().toISOString().split("T")[0],
    original_value: 0, salvage_value: 0, useful_life_years: 5,
    status: "in_use", notes: "", serial_number: "", supplier: "",
    location: "", warranty_expiry: "",
  });

  // Renovation dialog state
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({
    store_id: "1", store_name_zh: "总店", store_name_en: "Main Store",
    phase_zh: "内部装修", phase_en: "Interior Renovation",
    status: "pending", progress: 0,
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    budget: 0, spent: 0,
    manager_zh: "", manager_en: "", notes: "", contractor: "",
  });

  // === Queries ===
  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ["fixed-assets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fixed_assets").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["renovation-projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("renovation_projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // === Asset Mutations ===
  const createAsset = useMutation({
    mutationFn: async (asset: typeof newAsset) => {
      const depreciable = asset.original_value - asset.salvage_value;
      const monthlyDep = asset.useful_life_years > 0 ? depreciable / (asset.useful_life_years * 12) : 0;
      const months = Math.max(0, Math.floor((Date.now() - new Date(asset.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 30)));
      const accDep = Math.min(depreciable, monthlyDep * months);
      const { error } = await supabase.from("fixed_assets").insert({
        ...asset,
        accumulated_depreciation: Math.round(accDep * 100) / 100,
        net_value: Math.round((asset.original_value - accDep) * 100) / 100,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-assets"] });
      setAssetDialogOpen(false);
      resetAssetForm();
      toast({ title: isZh ? "资产登记成功" : "Asset registered" });
    },
    onError: () => toast({ title: isZh ? "登记失败" : "Failed", variant: "destructive" }),
  });

  const updateAsset = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("fixed_assets").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-assets"] });
      setAssetDialogOpen(false);
      setEditingAsset(null);
      resetAssetForm();
      toast({ title: isZh ? "资产已更新" : "Asset updated" });
    },
    onError: () => toast({ title: isZh ? "更新失败" : "Update failed", variant: "destructive" }),
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fixed_assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-assets"] });
      toast({ title: isZh ? "已删除" : "Deleted" });
    },
  });

  // === Renovation Mutations ===
  const createProject = useMutation({
    mutationFn: async (project: typeof newProject) => {
      const { error } = await supabase.from("renovation_projects").insert({
        ...project,
        end_date: project.end_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["renovation-projects"] });
      setProjectDialogOpen(false);
      resetProjectForm();
      toast({ title: isZh ? "项目创建成功" : "Project created" });
    },
    onError: () => toast({ title: isZh ? "创建失败" : "Failed", variant: "destructive" }),
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<typeof newProject> }) => {
      const { error } = await supabase.from("renovation_projects").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["renovation-projects"] });
      setProjectDialogOpen(false);
      setEditingProject(null);
      resetProjectForm();
      toast({ title: isZh ? "已更新" : "Updated" });
    },
    onError: () => toast({ title: isZh ? "更新失败" : "Update failed", variant: "destructive" }),
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("renovation_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["renovation-projects"] });
      toast({ title: isZh ? "已删除" : "Deleted" });
    },
  });

  const resetAssetForm = () => setNewAsset({ name_zh: "", name_en: "", category: "equipment", store_id: "1", store_name_zh: "总店", store_name_en: "Main Store", purchase_date: new Date().toISOString().split("T")[0], original_value: 0, salvage_value: 0, useful_life_years: 5, status: "in_use", notes: "", serial_number: "", supplier: "", location: "", warranty_expiry: "" });

  const openEditAsset = (a: typeof assets[0]) => {
    setEditingAsset(a.id);
    setNewAsset({
      name_zh: a.name_zh, name_en: a.name_en,
      category: a.category, store_id: a.store_id,
      store_name_zh: a.store_name_zh, store_name_en: a.store_name_en,
      purchase_date: a.purchase_date,
      original_value: Number(a.original_value), salvage_value: Number(a.salvage_value),
      useful_life_years: a.useful_life_years,
      status: a.status, notes: a.notes || "",
      serial_number: a.serial_number || "", supplier: a.supplier || "",
      location: a.location || "", warranty_expiry: a.warranty_expiry || "",
    });
    setAssetDialogOpen(true);
  };

  const handleAssetSubmit = () => {
    if (editingAsset) {
      const depreciable = newAsset.original_value - newAsset.salvage_value;
      const monthlyDep = newAsset.useful_life_years > 0 ? depreciable / (newAsset.useful_life_years * 12) : 0;
      const months = Math.max(0, Math.floor((Date.now() - new Date(newAsset.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 30)));
      const accDep = Math.min(depreciable, monthlyDep * months);
      const disposed_at = newAsset.status === "disposed" ? new Date().toISOString() : null;
      updateAsset.mutate({
        id: editingAsset,
        updates: {
          ...newAsset,
          warranty_expiry: newAsset.warranty_expiry || null,
          accumulated_depreciation: Math.round(accDep * 100) / 100,
          net_value: Math.round((newAsset.original_value - accDep) * 100) / 100,
          disposed_at,
        },
      });
    } else {
      createAsset.mutate(newAsset);
    }
  };

  const resetProjectForm = () => setNewProject({ store_id: "1", store_name_zh: "总店", store_name_en: "Main Store", phase_zh: "内部装修", phase_en: "Interior Renovation", status: "pending", progress: 0, start_date: new Date().toISOString().split("T")[0], end_date: "", budget: 0, spent: 0, manager_zh: "", manager_en: "", notes: "", contractor: "" });

  const openEditProject = (p: typeof projects[0]) => {
    setEditingProject(p.id);
    setNewProject({
      store_id: p.store_id, store_name_zh: p.store_name_zh, store_name_en: p.store_name_en,
      phase_zh: p.phase_zh, phase_en: p.phase_en,
      status: p.status, progress: p.progress,
      start_date: p.start_date, end_date: p.end_date || "",
      budget: Number(p.budget), spent: Number(p.spent),
      manager_zh: p.manager_zh, manager_en: p.manager_en,
      notes: p.notes || "", contractor: p.contractor || "",
    });
    setProjectDialogOpen(true);
  };

  const handleProjectSubmit = () => {
    if (editingProject) {
      updateProject.mutate({ id: editingProject, updates: { ...newProject, end_date: newProject.end_date || null } });
    } else {
      createProject.mutate(newProject);
    }
  };

  // === Computed ===
  const totalAssetValue = assets.reduce((s, a) => s + Number(a.original_value), 0);
  const totalNetValue = assets.reduce((s, a) => s + Number(a.net_value), 0);
  const totalBudget = projects.reduce((s, p) => s + Number(p.budget), 0);

  const getCategoryLabel = (cat: string) => {
    const found = categoryOptions.find((c) => c.value === cat);
    return found ? (isZh ? found.zh : found.en) : cat;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      in_use: { variant: "outline", label: isZh ? "使用中" : "In Use" },
      in_progress: { variant: "default", label: isZh ? "进行中" : "In Progress" },
      pending: { variant: "secondary", label: isZh ? "待审批" : "Pending" },
      completed: { variant: "outline", label: isZh ? "已完成" : "Completed" },
      maintenance: { variant: "destructive", label: isZh ? "维修中" : "Maintenance" },
      disposed: { variant: "secondary", label: isZh ? "已报废" : "Disposed" },
      idle: { variant: "secondary", label: isZh ? "闲置" : "Idle" },
      cancelled: { variant: "destructive", label: isZh ? "已取消" : "Cancelled" },
    };
    const info = map[status] || { variant: "outline" as const, label: status };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const handleStoreChange = (v: string, setter: (val: any) => void, current: any) => {
    const store = storeOptions.find((s) => s.id === v);
    setter({ ...current, store_id: v, store_name_zh: store?.zh || "", store_name_en: store?.en || "" });
  };

  const handlePhaseChange = (v: string) => {
    const phase = phaseOptions.find((p) => p.value === v);
    setNewProject({ ...newProject, phase_zh: phase?.zh || v, phase_en: phase?.en || v });
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: isZh ? "装修项目" : "Renovation Projects", value: `${projects.length}${isZh ? "个" : ""}`, icon: Hammer },
          { label: isZh ? "装修总预算" : "Total Budget", value: `¥${(totalBudget / 10000).toFixed(1)}万`, icon: Calendar },
          { label: isZh ? "固定资产原值" : "Asset Original Value", value: `¥${(totalAssetValue / 10000).toFixed(1)}万`, icon: Package },
          { label: isZh ? "资产净值" : "Asset Net Value", value: `¥${(totalNetValue / 10000).toFixed(1)}万`, icon: CheckCircle },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
            <p className="text-xl font-bold font-display">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="renovation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="renovation">{isZh ? "装修项目" : "Renovation"}</TabsTrigger>
          <TabsTrigger value="assets">{isZh ? "固定资产" : "Fixed Assets"}</TabsTrigger>
        </TabsList>

        {/* ====== Renovation Projects from DB ====== */}
        <TabsContent value="renovation" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{isZh ? "新店装修与门店翻新项目跟踪" : "Track new store build-outs and renovations"}</p>
            <Dialog open={projectDialogOpen} onOpenChange={(open) => { setProjectDialogOpen(open); if (!open) { setEditingProject(null); resetProjectForm(); } }}>
              <DialogTrigger asChild>
                <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1">
                  <Plus className="w-3 h-3" />{isZh ? "新建项目" : "New Project"}
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingProject ? (isZh ? "编辑装修项目" : "Edit Project") : (isZh ? "新建装修项目" : "New Renovation Project")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">{isZh ? "所属门店" : "Store"}</Label>
                      <Select value={newProject.store_id} onValueChange={(v) => handleStoreChange(v, setNewProject, newProject)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{storeOptions.map((s) => <SelectItem key={s.id} value={s.id}>{isZh ? s.zh : s.en}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">{isZh ? "装修阶段" : "Phase"}</Label>
                      <Select value={phaseOptions.find(p => p.zh === newProject.phase_zh)?.value || "interior"} onValueChange={handlePhaseChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{phaseOptions.map((p) => <SelectItem key={p.value} value={p.value}>{isZh ? p.zh : p.en}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">{isZh ? "状态" : "Status"}</Label>
                      <Select value={newProject.status} onValueChange={(v) => setNewProject({ ...newProject, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{isZh ? "待审批" : "Pending"}</SelectItem>
                          <SelectItem value="in_progress">{isZh ? "进行中" : "In Progress"}</SelectItem>
                          <SelectItem value="completed">{isZh ? "已完成" : "Completed"}</SelectItem>
                          <SelectItem value="cancelled">{isZh ? "已取消" : "Cancelled"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">{isZh ? "进度(%)" : "Progress(%)"}</Label>
                      <Input type="number" min={0} max={100} value={newProject.progress} onChange={(e) => setNewProject({ ...newProject, progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">{isZh ? "开始日期" : "Start Date"}</Label>
                      <Input type="date" value={newProject.start_date} onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">{isZh ? "预计完工" : "End Date"}</Label>
                      <Input type="date" value={newProject.end_date} onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">{isZh ? "预算(¥)" : "Budget(¥)"}</Label>
                      <Input type="number" value={newProject.budget} onChange={(e) => setNewProject({ ...newProject, budget: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <Label className="text-xs">{isZh ? "已支出(¥)" : "Spent(¥)"}</Label>
                      <Input type="number" value={newProject.spent} onChange={(e) => setNewProject({ ...newProject, spent: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">{isZh ? "负责人(中文)" : "Manager(CN)"}</Label>
                      <Input value={newProject.manager_zh} onChange={(e) => setNewProject({ ...newProject, manager_zh: e.target.value })} placeholder={isZh ? "如：刘工" : "e.g. Liu"} />
                    </div>
                    <div>
                      <Label className="text-xs">{isZh ? "负责人(英文)" : "Manager(EN)"}</Label>
                      <Input value={newProject.manager_en} onChange={(e) => setNewProject({ ...newProject, manager_en: e.target.value })} placeholder="e.g. Engineer Liu" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">{isZh ? "施工单位" : "Contractor"}</Label>
                    <Input value={newProject.contractor} onChange={(e) => setNewProject({ ...newProject, contractor: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">{isZh ? "备注" : "Notes"}</Label>
                    <Textarea value={newProject.notes} onChange={(e) => setNewProject({ ...newProject, notes: e.target.value })} rows={2} />
                  </div>
                  <button
                    onClick={handleProjectSubmit}
                    disabled={createProject.isPending || updateProject.isPending}
                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {(createProject.isPending || updateProject.isPending) ? (isZh ? "提交中..." : "Submitting...") : editingProject ? (isZh ? "保存修改" : "Save Changes") : (isZh ? "确认创建" : "Create")}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {projectsLoading ? (
            <div className="text-center py-12 text-muted-foreground">{isZh ? "加载中..." : "Loading..."}</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">{isZh ? "暂无装修项目，点击「新建项目」开始添加" : "No projects yet. Click 'New Project' to add."}</div>
          ) : (
            <div className="space-y-4">
              {projects.map((project, i) => (
                <motion.div key={project.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass-card rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${project.status === "completed" ? "bg-success/15" : project.status === "in_progress" ? "bg-primary/15" : "bg-muted"}`}>
                        {project.status === "completed" ? <CheckCircle className="w-5 h-5 text-success" /> : project.status === "in_progress" ? <Hammer className="w-5 h-5 text-primary" /> : <Clock className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div>
                        <h3 className="font-bold font-display">{isZh ? project.store_name_zh : (project.store_name_en || project.store_name_zh)}</h3>
                        <p className="text-xs text-muted-foreground">{isZh ? project.phase_zh : (project.phase_en || project.phase_zh)} · {isZh ? project.manager_zh : (project.manager_en || project.manager_zh)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusBadge(project.status)}
                      <button onClick={() => openEditProject(project)} className="p-1.5 rounded-md hover:bg-muted transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => deleteProject.mutate(project.id)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" /></button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{isZh ? "进度" : "Progress"}</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="bg-muted/30 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground">{isZh ? "预算" : "Budget"}</p>
                      <p className="text-sm font-bold">¥{(Number(project.budget) / 10000).toFixed(1)}万</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground">{isZh ? "已支出" : "Spent"}</p>
                      <p className="text-sm font-bold text-primary">¥{(Number(project.spent) / 10000).toFixed(1)}万</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground">{isZh ? "开始" : "Start"}</p>
                      <p className="text-sm font-medium">{project.start_date}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground">{isZh ? "预计完工" : "ETA"}</p>
                      <p className="text-sm font-medium">{project.end_date || "-"}</p>
                    </div>
                  </div>

                  {project.notes && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/20 rounded-lg p-2">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>{project.notes}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ====== Fixed Assets from DB ====== */}
        <TabsContent value="assets" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{isZh ? "门店固定资产台账与折旧管理" : "Fixed asset ledger and depreciation tracking"}</p>
            <Dialog open={assetDialogOpen} onOpenChange={(open) => { setAssetDialogOpen(open); if (!open) { setEditingAsset(null); resetAssetForm(); } }}>
              <DialogTrigger asChild>
                <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1">
                  <Plus className="w-3 h-3" />{isZh ? "登记资产" : "Register Asset"}
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingAsset ? (isZh ? "编辑固定资产" : "Edit Asset") : (isZh ? "登记固定资产" : "Register Fixed Asset")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">{isZh ? "中文名称" : "Chinese Name"}</Label>
                      <Input value={newAsset.name_zh} onChange={(e) => setNewAsset({ ...newAsset, name_zh: e.target.value })} placeholder={isZh ? "如：商用冰箱" : "e.g. Commercial Fridge"} />
                    </div>
                    <div>
                      <Label className="text-xs">{isZh ? "英文名称" : "English Name"}</Label>
                      <Input value={newAsset.name_en} onChange={(e) => setNewAsset({ ...newAsset, name_en: e.target.value })} placeholder="e.g. Commercial Fridge" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">{isZh ? "分类" : "Category"}</Label>
                      <Select value={newAsset.category} onValueChange={(v) => setNewAsset({ ...newAsset, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{categoryOptions.map((c) => <SelectItem key={c.value} value={c.value}>{isZh ? c.zh : c.en}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">{isZh ? "所属门店" : "Store"}</Label>
                      <Select value={newAsset.store_id} onValueChange={(v) => handleStoreChange(v, setNewAsset, newAsset)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{storeOptions.map((s) => <SelectItem key={s.id} value={s.id}>{isZh ? s.zh : s.en}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">{isZh ? "状态" : "Status"}</Label>
                      <Select value={newAsset.status} onValueChange={(v) => setNewAsset({ ...newAsset, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_use">{isZh ? "使用中" : "In Use"}</SelectItem>
                          <SelectItem value="maintenance">{isZh ? "维修中" : "Maintenance"}</SelectItem>
                          <SelectItem value="idle">{isZh ? "闲置" : "Idle"}</SelectItem>
                          <SelectItem value="disposed">{isZh ? "已报废" : "Disposed"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">{isZh ? "存放位置" : "Location"}</Label>
                      <Input value={newAsset.location} onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })} placeholder={isZh ? "如：后厨" : "e.g. Kitchen"} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">{isZh ? "购入日期" : "Purchase Date"}</Label>
                      <Input type="date" value={newAsset.purchase_date} onChange={(e) => setNewAsset({ ...newAsset, purchase_date: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">{isZh ? "使用年限" : "Useful Life (yrs)"}</Label>
                      <Input type="number" value={newAsset.useful_life_years} onChange={(e) => setNewAsset({ ...newAsset, useful_life_years: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">{isZh ? "原值(¥)" : "Original Value(¥)"}</Label>
                      <Input type="number" value={newAsset.original_value} onChange={(e) => setNewAsset({ ...newAsset, original_value: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <Label className="text-xs">{isZh ? "残值(¥)" : "Salvage Value(¥)"}</Label>
                      <Input type="number" value={newAsset.salvage_value} onChange={(e) => setNewAsset({ ...newAsset, salvage_value: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">{isZh ? "序列号" : "Serial Number"}</Label>
                      <Input value={newAsset.serial_number} onChange={(e) => setNewAsset({ ...newAsset, serial_number: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">{isZh ? "供应商" : "Supplier"}</Label>
                      <Input value={newAsset.supplier} onChange={(e) => setNewAsset({ ...newAsset, supplier: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">{isZh ? "质保到期" : "Warranty Expiry"}</Label>
                    <Input type="date" value={newAsset.warranty_expiry} onChange={(e) => setNewAsset({ ...newAsset, warranty_expiry: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">{isZh ? "备注" : "Notes"}</Label>
                    <Textarea value={newAsset.notes} onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })} rows={2} />
                  </div>
                  <button
                    onClick={handleAssetSubmit}
                    disabled={!newAsset.name_zh || createAsset.isPending || updateAsset.isPending}
                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {(createAsset.isPending || updateAsset.isPending) ? (isZh ? "提交中..." : "Submitting...") : editingAsset ? (isZh ? "保存修改" : "Save Changes") : (isZh ? "确认登记" : "Confirm")}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isZh ? "资产名称" : "Asset Name"}</TableHead>
                  <TableHead>{isZh ? "分类" : "Category"}</TableHead>
                  <TableHead>{isZh ? "所属门店" : "Store"}</TableHead>
                  <TableHead>{isZh ? "购入日期" : "Purchase Date"}</TableHead>
                  <TableHead className="text-right">{isZh ? "原值(¥)" : "Original(¥)"}</TableHead>
                  <TableHead className="text-right">{isZh ? "累计折旧(¥)" : "Depreciation(¥)"}</TableHead>
                  <TableHead className="text-right">{isZh ? "净值(¥)" : "Net Value(¥)"}</TableHead>
                  <TableHead>{isZh ? "状态" : "Status"}</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assetsLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{isZh ? "加载中..." : "Loading..."}</TableCell></TableRow>
                ) : assets.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{isZh ? "暂无资产数据，点击「登记资产」开始添加" : "No assets yet. Click 'Register Asset' to add."}</TableCell></TableRow>
                ) : (
                  assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{isZh ? asset.name_zh : (asset.name_en || asset.name_zh)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{getCategoryLabel(asset.category)}</TableCell>
                      <TableCell className="text-xs">{isZh ? asset.store_name_zh : (asset.store_name_en || asset.store_name_zh)}</TableCell>
                      <TableCell className="text-xs">{asset.purchase_date}</TableCell>
                      <TableCell className="text-right text-sm">¥{Number(asset.original_value).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">¥{Number(asset.accumulated_depreciation).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm font-medium">¥{Number(asset.net_value).toLocaleString()}</TableCell>
                      <TableCell>{statusBadge(asset.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditAsset(asset)} className="p-1 rounded hover:bg-muted transition-colors">
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => deleteAsset.mutate(asset.id)} className="p-1 rounded hover:bg-destructive/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StoreRenovationTab;
