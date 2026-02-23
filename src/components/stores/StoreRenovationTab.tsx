import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Hammer,
  Package,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Plus,
  Wrench,
  Monitor,
  Sofa,
  UtensilsCrossed,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const StoreRenovationTab = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";

  const renovationProjects = [
    {
      id: "1",
      storeZh: "望京分店",
      storeEn: "Wangjing Branch",
      phaseZh: "内部装修",
      phaseEn: "Interior Renovation",
      statusZh: "进行中",
      statusEn: "In Progress",
      status: "in_progress",
      progress: 65,
      startDate: "2026-01-15",
      endDate: "2026-03-20",
      budget: 580000,
      spent: 372000,
      managerZh: "刘工",
      managerEn: "Engineer Liu",
      notes: isZh ? "吧台区域已完工，KTV区域施工中" : "Bar area completed, KTV area in progress",
    },
    {
      id: "2",
      storeZh: "中关村新店",
      storeEn: "Zhongguancun New Store",
      phaseZh: "设计审批",
      phaseEn: "Design Approval",
      statusZh: "待审批",
      statusEn: "Pending Approval",
      status: "pending",
      progress: 20,
      startDate: "2026-03-01",
      endDate: "2026-06-15",
      budget: 920000,
      spent: 45000,
      managerZh: "陈工",
      managerEn: "Engineer Chen",
      notes: isZh ? "设计方案已提交，等待消防审批" : "Design submitted, awaiting fire safety approval",
    },
    {
      id: "3",
      storeZh: "三里屯分店",
      storeEn: "Sanlitun Branch",
      phaseZh: "局部翻新",
      phaseEn: "Partial Renovation",
      statusZh: "已完成",
      statusEn: "Completed",
      status: "completed",
      progress: 100,
      startDate: "2025-11-01",
      endDate: "2026-01-10",
      budget: 280000,
      spent: 265000,
      managerZh: "张工",
      managerEn: "Engineer Zhang",
      notes: isZh ? "卫生间和外立面翻新完毕" : "Restroom and facade renovation completed",
    },
  ];

  const fixedAssets = [
    { id: "1", nameZh: "商用冰箱（双门）", nameEn: "Commercial Fridge (Double)", categoryZh: "厨房设备", categoryEn: "Kitchen Equipment", icon: UtensilsCrossed, storeZh: "总店", storeEn: "Main Store", purchaseDate: "2024-06-15", value: 28000, depreciation: 4667, netValue: 23333, status: "normal", lifeYears: 6 },
    { id: "2", nameZh: "POS收银系统", nameEn: "POS System", categoryZh: "电子设备", categoryEn: "Electronics", icon: Monitor, storeZh: "国贸分店", storeEn: "Guomao Branch", purchaseDate: "2025-01-10", value: 15000, depreciation: 3000, netValue: 12000, status: "normal", lifeYears: 5 },
    { id: "3", nameZh: "KTV音响设备", nameEn: "KTV Sound System", categoryZh: "娱乐设备", categoryEn: "Entertainment", icon: Monitor, storeZh: "三里屯分店", storeEn: "Sanlitun Branch", purchaseDate: "2025-03-20", value: 45000, depreciation: 9000, netValue: 36000, status: "normal", lifeYears: 5 },
    { id: "4", nameZh: "定制吧台桌椅", nameEn: "Custom Bar Furniture", categoryZh: "家具", categoryEn: "Furniture", icon: Sofa, storeZh: "总店", storeEn: "Main Store", purchaseDate: "2024-02-01", value: 62000, depreciation: 12400, netValue: 49600, status: "normal", lifeYears: 5 },
    { id: "5", nameZh: "中央空调系统", nameEn: "Central AC System", categoryZh: "基础设施", categoryEn: "Infrastructure", icon: Wrench, storeZh: "国贸分店", storeEn: "Guomao Branch", purchaseDate: "2023-08-10", value: 120000, depreciation: 30000, netValue: 90000, status: "maintenance", lifeYears: 10 },
    { id: "6", nameZh: "户外遮阳棚", nameEn: "Outdoor Canopy", categoryZh: "基础设施", categoryEn: "Infrastructure", icon: Wrench, storeZh: "三里屯分店", storeEn: "Sanlitun Branch", purchaseDate: "2025-05-01", value: 35000, depreciation: 7000, netValue: 28000, status: "normal", lifeYears: 5 },
  ];

  const totalAssetValue = fixedAssets.reduce((s, a) => s + a.value, 0);
  const totalNetValue = fixedAssets.reduce((s, a) => s + a.netValue, 0);
  const totalBudget = renovationProjects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = renovationProjects.reduce((s, p) => s + p.spent, 0);

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      in_progress: { variant: "default", label: isZh ? "进行中" : "In Progress" },
      pending: { variant: "secondary", label: isZh ? "待审批" : "Pending" },
      completed: { variant: "outline", label: isZh ? "已完成" : "Completed" },
      normal: { variant: "outline", label: isZh ? "正常" : "Normal" },
      maintenance: { variant: "destructive", label: isZh ? "维修中" : "Maintenance" },
    };
    const info = map[status] || map.normal;
    return <Badge variant={info.variant}>{info.label}</Badge>;
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

        {/* Fixed Assets */}
        <TabsContent value="assets" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{isZh ? "门店固定资产台账与折旧管理" : "Fixed asset ledger and depreciation tracking"}</p>
            <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" />{isZh ? "登记资产" : "Register Asset"}
            </button>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {fixedAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{isZh ? asset.nameZh : asset.nameEn}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{isZh ? asset.categoryZh : asset.categoryEn}</TableCell>
                    <TableCell className="text-xs">{isZh ? asset.storeZh : asset.storeEn}</TableCell>
                    <TableCell className="text-xs">{asset.purchaseDate}</TableCell>
                    <TableCell className="text-right text-sm">¥{asset.value.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">¥{asset.depreciation.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm font-medium">¥{asset.netValue.toLocaleString()}</TableCell>
                    <TableCell>{statusBadge(asset.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="text-xs text-muted-foreground text-center py-2">
            {isZh ? "固定资产数据将在接入ERP系统后自动同步，当前为示例数据" : "Asset data will auto-sync after ERP integration, currently showing sample data"}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StoreRenovationTab;
