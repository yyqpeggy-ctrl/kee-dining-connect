import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Hammer,
  Package,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const StoreRenovationTab = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const queryClient = useQueryClient();
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name_zh: "", name_en: "", category: "equipment",
    store_id: "1", store_name_zh: "总店", store_name_en: "Main Store",
    purchase_date: new Date().toISOString().split("T")[0],
    original_value: 0, salvage_value: 0, useful_life_years: 5,
  });

  // Fetch fixed assets from DB
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["fixed-assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fixed_assets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Create asset mutation
  const createAsset = useMutation({
    mutationFn: async (asset: typeof newAsset) => {
      const netValue = asset.original_value - asset.salvage_value;
      const monthlyDep = asset.useful_life_years > 0
        ? (asset.original_value - asset.salvage_value) / (asset.useful_life_years * 12)
        : 0;
      const monthsSincePurchase = Math.max(0, Math.floor(
        (Date.now() - new Date(asset.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
      ));
      const accDep = Math.min(netValue, monthlyDep * monthsSincePurchase);

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
      setNewAsset({ name_zh: "", name_en: "", category: "equipment", store_id: "1", store_name_zh: "总店", store_name_en: "Main Store", purchase_date: new Date().toISOString().split("T")[0], original_value: 0, salvage_value: 0, useful_life_years: 5 });
      toast({ title: isZh ? "资产登记成功" : "Asset registered" });
    },
    onError: () => toast({ title: isZh ? "登记失败" : "Failed", variant: "destructive" }),
  });

  // Delete asset
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

  // Renovation projects remain mock (no DB table yet)
  const renovationProjects = [
    { id: "1", storeZh: "望京分店", storeEn: "Wangjing Branch", phaseZh: "内部装修", phaseEn: "Interior Renovation", status: "in_progress", progress: 65, startDate: "2026-01-15", endDate: "2026-03-20", budget: 580000, spent: 372000, managerZh: "刘工", managerEn: "Engineer Liu", notes: isZh ? "吧台区域已完工，KTV区域施工中" : "Bar area completed, KTV area in progress" },
    { id: "2", storeZh: "中关村新店", storeEn: "Zhongguancun New Store", phaseZh: "设计审批", phaseEn: "Design Approval", status: "pending", progress: 20, startDate: "2026-03-01", endDate: "2026-06-15", budget: 920000, spent: 45000, managerZh: "陈工", managerEn: "Engineer Chen", notes: isZh ? "设计方案已提交，等待消防审批" : "Design submitted, awaiting fire safety approval" },
    { id: "3", storeZh: "三里屯分店", storeEn: "Sanlitun Branch", phaseZh: "局部翻新", phaseEn: "Partial Renovation", status: "completed", progress: 100, startDate: "2025-11-01", endDate: "2026-01-10", budget: 280000, spent: 265000, managerZh: "张工", managerEn: "Engineer Zhang", notes: isZh ? "卫生间和外立面翻新完毕" : "Restroom and facade renovation completed" },
  ];

  const totalAssetValue = assets.reduce((s, a) => s + Number(a.original_value), 0);
  const totalNetValue = assets.reduce((s, a) => s + Number(a.net_value), 0);
  const totalBudget = renovationProjects.reduce((s, p) => s + p.budget, 0);

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      in_use: { variant: "outline", label: isZh ? "使用中" : "In Use" },
      in_progress: { variant: "default", label: isZh ? "进行中" : "In Progress" },
      pending: { variant: "secondary", label: isZh ? "待审批" : "Pending" },
      completed: { variant: "outline", label: isZh ? "已完成" : "Completed" },
      maintenance: { variant: "destructive", label: isZh ? "维修中" : "Maintenance" },
      disposed: { variant: "secondary", label: isZh ? "已报废" : "Disposed" },
      idle: { variant: "secondary", label: isZh ? "闲置" : "Idle" },
    };
    const info = map[status] || { variant: "outline" as const, label: status };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

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

  const getCategoryLabel = (cat: string) => {
    const found = categoryOptions.find((c) => c.value === cat);
    return found ? (isZh ? found.zh : found.en) : cat;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: isZh ? "装修项目" : "Renovation Projects", value: renovationProjects.length, icon: Hammer, suffix: isZh ? "个" : "" },
          { label: isZh ? "装修总预算" : "Total Budget", value: `¥${(totalBudget / 10000).toFixed(1)}万`, icon: Calendar },
          { label: isZh ? "固定资产原值" : "Asset Original Value", value: `¥${(totalAssetValue / 10000).toFixed(1)}万`, icon: Package },
          { label: isZh ? "资产净值" : "Asset Net Value", value: `¥${(totalNetValue / 10000).toFixed(1)}万`, icon: CheckCircle },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
            <p className="text-xl font-bold font-display">{kpi.value}{kpi.suffix || ""}</p>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="renovation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="renovation">{isZh ? "装修项目" : "Renovation"}</TabsTrigger>
          <TabsTrigger value="assets">{isZh ? "固定资产" : "Fixed Assets"}</TabsTrigger>
        </TabsList>

        {/* Renovation Projects */}
        <TabsContent value="renovation" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{isZh ? "新店装修与门店翻新项目跟踪" : "Track new store build-outs and renovations"}</p>
            <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" />{isZh ? "新建项目" : "New Project"}
            </button>
          </div>

          <div className="space-y-4">
            {renovationProjects.map((project, i) => (
              <motion.div key={project.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass-card rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${project.status === "completed" ? "bg-success/15" : project.status === "in_progress" ? "bg-primary/15" : "bg-muted"}`}>
                      {project.status === "completed" ? <CheckCircle className="w-5 h-5 text-success" /> : project.status === "in_progress" ? <Hammer className="w-5 h-5 text-primary" /> : <Clock className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <h3 className="font-bold font-display">{isZh ? project.storeZh : project.storeEn}</h3>
                      <p className="text-xs text-muted-foreground">{isZh ? project.phaseZh : project.phaseEn} · {isZh ? project.managerZh : project.managerEn}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(project.status)}
                    <button className="p-1.5 rounded-md hover:bg-muted transition-colors"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
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
                    <p className="text-sm font-bold">¥{(project.budget / 10000).toFixed(1)}万</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">{isZh ? "已支出" : "Spent"}</p>
                    <p className="text-sm font-bold text-primary">¥{(project.spent / 10000).toFixed(1)}万</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">{isZh ? "开始" : "Start"}</p>
                    <p className="text-sm font-medium">{project.startDate}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">{isZh ? "预计完工" : "ETA"}</p>
                    <p className="text-sm font-medium">{project.endDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/20 rounded-lg p-2">
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{project.notes}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Fixed Assets from DB */}
        <TabsContent value="assets" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{isZh ? "门店固定资产台账与折旧管理" : "Fixed asset ledger and depreciation tracking"}</p>
            <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
              <DialogTrigger asChild>
                <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1">
                  <Plus className="w-3 h-3" />{isZh ? "登记资产" : "Register Asset"}
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{isZh ? "登记固定资产" : "Register Fixed Asset"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
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
                        <SelectContent>
                          {categoryOptions.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{isZh ? c.zh : c.en}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">{isZh ? "所属门店" : "Store"}</Label>
                      <Select value={newAsset.store_id} onValueChange={(v) => {
                        const store = storeOptions.find((s) => s.id === v);
                        setNewAsset({ ...newAsset, store_id: v, store_name_zh: store?.zh || "", store_name_en: store?.en || "" });
                      }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {storeOptions.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{isZh ? s.zh : s.en}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                  <button
                    onClick={() => createAsset.mutate(newAsset)}
                    disabled={!newAsset.name_zh || createAsset.isPending}
                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {createAsset.isPending ? (isZh ? "提交中..." : "Submitting...") : (isZh ? "确认登记" : "Confirm")}
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
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
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
                        <button onClick={() => deleteAsset.mutate(asset.id)} className="p-1 rounded hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
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
