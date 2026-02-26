import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  FileText, Upload, FolderArchive, History, Sparkles, ChevronDown, ChevronRight,
  Download, Eye, Clock, CheckCircle, AlertTriangle, Plus, RotateCcw, FileCheck, Zap,
  Loader2, Shield, DollarSign, CalendarDays, FileEdit, UserCheck, Printer,
  MapPin, Globe, RefreshCw, Bell, BellRing, BookOpen, Search, ExternalLink, Building2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ===== Types =====
interface WorkPermitDoc {
  id: string;
  name: string;
  nameEn: string;
  category: "work_permit" | "visa" | "health_check" | "education" | "employment" | "photo" | "passport" | "other";
  fileUrl?: string;
  uploadedAt: string;
  expiryDate?: string;
  notes?: string;
  version: number;
}

interface WorkPermitApplication {
  id: string;
  type: "initial" | "renewal";
  status: "preparing" | "submitted" | "approved" | "rejected" | "completed";
  applicationDate: string;
  approvalDate?: string;
  permitNumber?: string;
  permitExpiry?: string;
  documents: WorkPermitDoc[];
  aiAnalysis?: {
    completeness: number;
    missingDocs: string[];
    suggestions: string[];
    riskLevel: "low" | "medium" | "high";
  };
  aiChecklist?: AIChecklistResult;
  notes?: string;
}

interface AIChecklistItem {
  docName: string;
  docNameEn: string;
  category: string;
  status: "reusable" | "needs_update" | "needs_new" | "ready";
  statusReason: string;
  priority: "critical" | "important" | "optional";
  estimatedDays: number;
  templateData: {
    title: string;
    fields: { label: string; labelEn: string; value: string; editable: boolean }[];
  };
}

interface AIChecklistResult {
  applicationType: "initial" | "renewal";
  typeReason: string;
  permitCategory: "A" | "B" | "C";
  categoryReason: string;
  riskLevel: "low" | "medium" | "high";
  riskNotes: string;
  deadline: string;
  estimatedProcessingDays: number;
  checklist: AIChecklistItem[];
  specialNotes: string[];
  taxBenefits: { benefit: string; benefitEn: string; description: string; eligibility: string }[];
}

interface EmployeeInfo {
  id: string;
  nameZh: string;
  nameEn: string;
  nationality: string;
  roleZh?: string;
  roleEn?: string;
  visa?: {
    type: string;
    number: string;
    issueDate: string;
    expiryDate: string;
    status: string;
    notes?: string;
  };
}

interface Props {
  employee: EmployeeInfo;
  isZh: boolean;
}

// ===== Document Categories =====
const DOC_CATEGORIES = [
  { key: "passport", zh: "护照", en: "Passport" },
  { key: "photo", zh: "证件照", en: "ID Photo" },
  { key: "education", zh: "学历认证", en: "Education Cert" },
  { key: "health_check", zh: "体检报告", en: "Health Check" },
  { key: "employment", zh: "聘用合同/证明", en: "Employment Contract" },
  { key: "work_permit", zh: "工作许可证", en: "Work Permit" },
  { key: "visa", zh: "签证/居留许可", en: "Visa/Residence" },
  { key: "other", zh: "其他材料", en: "Other" },
] as const;

// ===== Required docs =====
const REQUIRED_DOCS_INITIAL: Record<string, { zh: string; en: string }> = {
  passport: { zh: "护照原件扫描件（有效期6个月以上）", en: "Passport scan (6+ months validity)" },
  photo: { zh: "近期免冠证件照（白底2寸）", en: "Recent ID photo (white background)" },
  education: { zh: "最高学历证明（经认证）", en: "Highest education certificate (authenticated)" },
  health_check: { zh: "外国人体格检查记录", en: "Foreigner Physical Examination Record" },
  employment: { zh: "聘用合同或意向书", en: "Employment contract or letter of intent" },
  work_experience: { zh: "2年以上相关工作经验证明", en: "2+ years relevant work experience proof" },
  no_criminal: { zh: "无犯罪记录证明", en: "No criminal record certificate" },
  company_license: { zh: "公司营业执照副本", en: "Company business license copy" },
};

const REQUIRED_DOCS_RENEWAL: Record<string, { zh: string; en: string }> = {
  passport: { zh: "护照原件扫描件（有效期6个月以上）", en: "Passport scan (6+ months validity)" },
  photo: { zh: "近期免冠证件照", en: "Recent ID photo" },
  current_permit: { zh: "现工作许可证原件", en: "Current work permit original" },
  current_visa: { zh: "现居留许可复印件", en: "Current residence permit copy" },
  employment: { zh: "续聘合同或延期证明", en: "Renewal contract or extension proof" },
  health_check: { zh: "体检报告（1年内有效）", en: "Health check (valid within 1 year)" },
  tax_record: { zh: "个人所得税完税证明", en: "Personal income tax certificate" },
};

// ===== Sample Data =====
const SAMPLE_APPLICATIONS: WorkPermitApplication[] = [
  {
    id: "wpa-001",
    type: "initial",
    status: "completed",
    applicationDate: "2024-05-20",
    approvalDate: "2024-06-10",
    permitNumber: "沪外工许字[2024]第003412号",
    permitExpiry: "2026-06-09",
    documents: [
      { id: "d1", name: "护照扫描件", nameEn: "Passport Scan", category: "passport", uploadedAt: "2024-05-15", version: 1 },
      { id: "d2", name: "学历认证报告", nameEn: "Education Cert Report", category: "education", uploadedAt: "2024-05-16", expiryDate: "2029-05-16", version: 1 },
      { id: "d3", name: "体检报告", nameEn: "Health Check Report", category: "health_check", uploadedAt: "2024-05-18", expiryDate: "2025-05-18", version: 1 },
      { id: "d4", name: "聘用合同", nameEn: "Employment Contract", category: "employment", uploadedAt: "2024-05-14", expiryDate: "2026-05-14", version: 1 },
      { id: "d5", name: "证件照", nameEn: "ID Photo", category: "photo", uploadedAt: "2024-05-12", version: 1 },
      { id: "d6", name: "工作许可证", nameEn: "Work Permit", category: "work_permit", uploadedAt: "2024-06-10", expiryDate: "2026-06-09", version: 1 },
      { id: "d7", name: "居留许可", nameEn: "Residence Permit", category: "visa", uploadedAt: "2024-06-15", expiryDate: "2026-06-14", version: 1 },
    ],
    aiAnalysis: {
      completeness: 100,
      missingDocs: [],
      suggestions: ["所有初次申请材料齐全", "建议在2026年3月前启动续签"],
      riskLevel: "low",
    },
  },
];

// ===== Policy Types =====
interface CityPolicy {
  title: string;
  content: string;
  summary_zh: string;
  summary_en: string;
  category: string;
  effective_date?: string;
  tags: string[];
  source_name: string;
  importance: string;
}

interface CityOverview {
  processing_days_initial: number;
  processing_days_renewal: number;
  special_advantages: string[];
  key_contacts: string;
  notes: string;
}

interface PolicySearchResult {
  policies: CityPolicy[];
  city_overview: CityOverview;
  city: string;
  province: string;
  cityEn: string;
  searchedAt: string;
}

const CITY_LIST = [
  { city: "上海", province: "上海市", en: "Shanghai" },
  { city: "北京", province: "北京市", en: "Beijing" },
  { city: "广州", province: "广东省", en: "Guangzhou" },
  { city: "深圳", province: "广东省", en: "Shenzhen" },
  { city: "成都", province: "四川省", en: "Chengdu" },
  { city: "杭州", province: "浙江省", en: "Hangzhou" },
  { city: "武汉", province: "湖北省", en: "Wuhan" },
  { city: "南京", province: "江苏省", en: "Nanjing" },
  { city: "苏州", province: "江苏省", en: "Suzhou" },
  { city: "重庆", province: "重庆市", en: "Chongqing" },
  { city: "天津", province: "天津市", en: "Tianjin" },
  { city: "西安", province: "陕西省", en: "Xi'an" },
  { city: "长沙", province: "湖南省", en: "Changsha" },
  { city: "青岛", province: "山东省", en: "Qingdao" },
  { city: "郑州", province: "河南省", en: "Zhengzhou" },
  { city: "大连", province: "辽宁省", en: "Dalian" },
  { city: "宁波", province: "浙江省", en: "Ningbo" },
  { city: "厦门", province: "福建省", en: "Xiamen" },
  { city: "昆明", province: "云南省", en: "Kunming" },
  { city: "合肥", province: "安徽省", en: "Hefei" },
];

const WorkPermitArchive = ({ employee, isZh }: Props) => {
  const [applications, setApplications] = useState<WorkPermitApplication[]>(SAMPLE_APPLICATIONS);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<{ appId: string; category: string } | null>(null);

  // AI Initiation state
  const [initiateDialogOpen, setInitiateDialogOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIChecklistResult | null>(null);
  const [activeResultTab, setActiveResultTab] = useState("checklist");
  const [selectedTemplate, setSelectedTemplate] = useState<AIChecklistItem | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateEdits, setTemplateEdits] = useState<Record<string, string>>({});

  // Policy sync state
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("上海");
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyResult, setPolicyResult] = useState<PolicySearchResult | null>(null);
  const [policyTab, setPolicyTab] = useState("all");
  const [savedPolicies, setSavedPolicies] = useState<CityPolicy[]>([]);
  const [policyAlerts, setPolicyAlerts] = useState<{ city: string; count: number }[]>([]);

  // Search policies for a city
  const handleSearchPolicies = async (city?: string) => {
    const targetCity = city || selectedCity;
    setPolicyLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-policy-search", {
        body: { city: targetCity, action: "search_policies" },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setPolicyResult(data as PolicySearchResult);
      toast.success(isZh ? `已获取${targetCity}最新政策信息` : `Fetched latest policies for ${targetCity}`);
    } catch (err: any) {
      console.error("Policy search error:", err);
      toast.error(isZh ? `政策搜索失败: ${err.message}` : `Policy search failed: ${err.message}`);
    } finally {
      setPolicyLoading(false);
    }
  };

  const handleSavePolicy = (policy: CityPolicy) => {
    setSavedPolicies(prev => [...prev, policy]);
    toast.success(isZh ? "政策已确认入库" : "Policy confirmed and saved");
  };

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, { zh: string; en: string; color: string }> = {
      work_permit: { zh: "工作许可", en: "Work Permit", color: "bg-primary/10 text-primary border-primary/20" },
      visa: { zh: "签证居留", en: "Visa", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
      talent: { zh: "人才引进", en: "Talent", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
      tax: { zh: "税收优惠", en: "Tax Benefits", color: "bg-success/10 text-success border-success/20" },
      compliance: { zh: "合规要求", en: "Compliance", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
      update: { zh: "最新变化", en: "Updates", color: "bg-destructive/10 text-destructive border-destructive/20" },
    };
    const m = map[cat] || { zh: cat, en: cat, color: "bg-muted text-muted-foreground" };
    return <Badge className={`${m.color} text-[9px]`}>{isZh ? m.zh : m.en}</Badge>;
  };

  const getImportanceBadge = (imp: string) => {
    if (imp === "high") return <Badge variant="destructive" className="text-[9px]">{isZh ? "重要" : "High"}</Badge>;
    if (imp === "medium") return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px]">{isZh ? "一般" : "Medium"}</Badge>;
    return <Badge variant="outline" className="text-[9px]">{isZh ? "参考" : "Low"}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; labelEn: string; variant: string }> = {
      preparing: { label: "准备中", labelEn: "Preparing", variant: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
      submitted: { label: "已提交", labelEn: "Submitted", variant: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
      approved: { label: "已批准", labelEn: "Approved", variant: "bg-success/10 text-success border-success/20" },
      rejected: { label: "被退回", labelEn: "Rejected", variant: "bg-destructive/10 text-destructive border-destructive/20" },
      completed: { label: "已完成", labelEn: "Completed", variant: "bg-success/10 text-success border-success/20" },
    };
    const s = map[status] || map.preparing;
    return <Badge className={`${s.variant} text-[10px]`}>{isZh ? s.label : s.labelEn}</Badge>;
  };

  const getRiskBadge = (risk: string) => {
    if (risk === "low") return <Badge className="bg-success/10 text-success border-success/20 text-[10px]">{isZh ? "低风险" : "Low Risk"}</Badge>;
    if (risk === "medium") return <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px]">{isZh ? "中风险" : "Medium"}</Badge>;
    return <Badge variant="destructive" className="text-[10px]">{isZh ? "高风险" : "High Risk"}</Badge>;
  };

  const getDocStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      reusable: { label: isZh ? "可复用" : "Reusable", color: "bg-success/10 text-success border-success/20" },
      ready: { label: isZh ? "已就绪" : "Ready", color: "bg-success/10 text-success border-success/20" },
      needs_update: { label: isZh ? "需更新" : "Update", color: "bg-warning/10 text-warning border-warning/20" },
      needs_new: { label: isZh ? "需新办" : "New", color: "bg-destructive/10 text-destructive border-destructive/20" },
    };
    const s = map[status] || map.needs_new;
    return <Badge className={`${s.color} text-[9px]`}>{s.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === "critical") return <Badge variant="destructive" className="text-[9px]">{isZh ? "必需" : "Critical"}</Badge>;
    if (priority === "important") return <Badge className="bg-warning/10 text-warning border-warning/20 text-[9px]">{isZh ? "重要" : "Important"}</Badge>;
    return <Badge variant="outline" className="text-[9px]">{isZh ? "可选" : "Optional"}</Badge>;
  };

  const handleUpload = () => {
    toast.success(isZh ? "文件已上传并归档" : "File uploaded and archived");
    setUploadDialogOpen(false);
  };

  // ===== AI Smart Initiation =====
  const handleInitiateApplication = async () => {
    setAiLoading(true);
    setAiResult(null);
    setInitiateDialogOpen(true);

    try {
      // Gather all historical docs from all applications
      const allDocs = applications.flatMap(a => a.documents);

      const { data, error } = await supabase.functions.invoke("ai-workpermit-checklist", {
        body: {
          employee: {
            nameZh: employee.nameZh,
            nameEn: employee.nameEn,
            nationality: employee.nationality,
            roleZh: employee.roleZh || "",
            roleEn: employee.roleEn || "",
            visa: employee.visa,
          },
          historicalApplications: applications.map(a => ({
            type: a.type,
            status: a.status,
            applicationDate: a.applicationDate,
            permitNumber: a.permitNumber,
            permitExpiry: a.permitExpiry,
          })),
          currentDocuments: allDocs.map(d => ({
            name: d.name,
            category: d.category,
            uploadedAt: d.uploadedAt,
            expiryDate: d.expiryDate,
            version: d.version,
          })),
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAiResult(data as AIChecklistResult);
      toast.success(isZh ? "AI 已完成申请类型判断和材料分析" : "AI analysis complete");
    } catch (err: any) {
      console.error("AI checklist error:", err);
      toast.error(isZh ? `AI 分析失败: ${err.message}` : `AI analysis failed: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleConfirmAndCreate = () => {
    if (!aiResult) return;
    const newApp: WorkPermitApplication = {
      id: `wpa-${Date.now()}`,
      type: aiResult.applicationType,
      status: "preparing",
      applicationDate: new Date().toISOString().split("T")[0],
      documents: [],
      aiAnalysis: {
        completeness: 0,
        missingDocs: aiResult.checklist.filter(c => c.status !== "reusable" && c.status !== "ready").map(c => isZh ? c.docName : c.docNameEn),
        suggestions: aiResult.specialNotes,
        riskLevel: aiResult.riskLevel,
      },
      aiChecklist: aiResult,
    };
    setApplications(prev => [newApp, ...prev]);
    setExpandedApp(newApp.id);
    setInitiateDialogOpen(false);
    setAiResult(null);
    toast.success(isZh 
      ? `已创建${aiResult.applicationType === "initial" ? "初次申请" : "续签申请"}，专业人员可开始审核` 
      : `${aiResult.applicationType === "initial" ? "Initial" : "Renewal"} application created for review`
    );
  };

  const handleViewTemplate = (item: AIChecklistItem) => {
    setSelectedTemplate(item);
    const edits: Record<string, string> = {};
    item.templateData.fields.forEach(f => { edits[f.label] = f.value; });
    setTemplateEdits(edits);
    setTemplateDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderArchive className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">{isZh ? "工作许可档案" : "Work Permit Archive"}</h3>
          <Badge variant="secondary" className="text-[10px]">{applications.length} {isZh ? "次申请" : "applications"}</Badge>
          {savedPolicies.length > 0 && (
            <Badge className="bg-success/10 text-success border-success/20 text-[10px]">
              {savedPolicies.length} {isZh ? "条政策" : "policies"}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setPolicyDialogOpen(true)}>
            <Globe className="w-3.5 h-3.5 mr-1" />{isZh ? "政策法规同步" : "Policy Sync"}
            {policyAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-4 w-4 p-0 text-[9px] flex items-center justify-center rounded-full">
                {policyAlerts.reduce((s, a) => s + a.count, 0)}
              </Badge>
            )}
          </Button>
          <Button size="sm" onClick={handleInitiateApplication}>
            <Sparkles className="w-3.5 h-3.5 mr-1" />{isZh ? "AI 智能发起申请" : "AI Smart Application"}
          </Button>
        </div>
      </div>

      {/* Application Timeline */}
      {applications.map((app, idx) => (
        <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
          <Card className={`${app.status === "preparing" ? "border-primary/30" : ""}`}>
            <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {expandedApp === app.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  <div className="flex items-center gap-2">
                    {app.type === "initial" ? <FileCheck className="w-4 h-4 text-primary" /> : <RotateCcw className="w-4 h-4 text-amber-500" />}
                    <CardTitle className="text-sm">
                      {app.type === "initial" ? (isZh ? "初次工作许可申请" : "Initial Work Permit") : (isZh ? "工作许可续签" : "Work Permit Renewal")}
                    </CardTitle>
                  </div>
                  {getStatusBadge(app.status)}
                  {app.aiAnalysis && getRiskBadge(app.aiAnalysis.riskLevel)}
                  {app.aiChecklist && (
                    <Badge variant="outline" className="text-[9px]">
                      {app.aiChecklist.permitCategory}{isZh ? "类" : "-Class"}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{isZh ? "申请日期" : "Date"}: {app.applicationDate}</span>
                  {app.permitNumber && <span className="font-mono text-[10px]">{app.permitNumber}</span>}
                </div>
              </div>
            </CardHeader>

            {expandedApp === app.id && (
              <CardContent className="space-y-4">
                {/* AI Analysis Section */}
                {app.aiAnalysis && (
                  <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold">{isZh ? "AI 智能分析" : "AI Analysis"}</span>
                      <div className="flex-1" />
                      <span className="text-xs text-muted-foreground">{isZh ? "完整度" : "Completeness"}: </span>
                      <span className={`text-sm font-bold ${app.aiAnalysis.completeness >= 80 ? "text-success" : app.aiAnalysis.completeness >= 50 ? "text-warning" : "text-destructive"}`}>
                        {app.aiAnalysis.completeness}%
                      </span>
                    </div>

                    <div className="w-full h-2 bg-muted rounded-full mb-3">
                      <div
                        className={`h-full rounded-full transition-all ${app.aiAnalysis.completeness >= 80 ? "bg-success" : app.aiAnalysis.completeness >= 50 ? "bg-warning" : "bg-destructive"}`}
                        style={{ width: `${app.aiAnalysis.completeness}%` }}
                      />
                    </div>

                    {app.aiAnalysis.missingDocs.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[10px] font-medium text-destructive mb-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />{isZh ? "缺失材料" : "Missing Documents"}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {app.aiAnalysis.missingDocs.map((doc, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] border-destructive/30 text-destructive bg-destructive/5">
                              {doc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-[10px] font-medium text-primary mb-1.5 flex items-center gap-1">
                        <Zap className="w-3 h-3" />{isZh ? "AI 建议" : "AI Suggestions"}
                      </p>
                      <ul className="space-y-1">
                        {app.aiAnalysis.suggestions.map((s, i) => (
                          <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                            <CheckCircle className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* AI Checklist Detail (for apps created with AI) */}
                {app.aiChecklist && (
                  <div className="space-y-3">
                    {/* Summary bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                        <p className="text-lg font-bold text-foreground">{app.aiChecklist.permitCategory}</p>
                        <p className="text-[10px] text-muted-foreground">{isZh ? "许可类别" : "Permit Class"}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                        <p className="text-lg font-bold text-foreground">{app.aiChecklist.estimatedProcessingDays}</p>
                        <p className="text-[10px] text-muted-foreground">{isZh ? "预计工作日" : "Est. Days"}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                        <p className="text-lg font-bold text-foreground">{app.aiChecklist.checklist.length}</p>
                        <p className="text-[10px] text-muted-foreground">{isZh ? "所需材料" : "Documents"}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                        <p className="text-sm font-bold text-foreground">{app.aiChecklist.deadline}</p>
                        <p className="text-[10px] text-muted-foreground">{isZh ? "建议截止" : "Deadline"}</p>
                      </div>
                    </div>

                    {/* Checklist Table */}
                    <div className="rounded-lg border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[10px]">{isZh ? "材料名称" : "Document"}</TableHead>
                            <TableHead className="text-[10px] text-center">{isZh ? "状态" : "Status"}</TableHead>
                            <TableHead className="text-[10px] text-center">{isZh ? "优先级" : "Priority"}</TableHead>
                            <TableHead className="text-[10px]">{isZh ? "说明" : "Notes"}</TableHead>
                            <TableHead className="text-[10px] text-center">{isZh ? "预计天数" : "Days"}</TableHead>
                            <TableHead className="text-[10px] text-center">{isZh ? "操作" : "Actions"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {app.aiChecklist.checklist.map((item, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-[11px] font-medium">{isZh ? item.docName : item.docNameEn}</TableCell>
                              <TableCell className="text-center">{getDocStatusBadge(item.status)}</TableCell>
                              <TableCell className="text-center">{getPriorityBadge(item.priority)}</TableCell>
                              <TableCell className="text-[10px] text-muted-foreground max-w-[200px] truncate">{item.statusReason}</TableCell>
                              <TableCell className="text-center text-[10px]">{item.estimatedDays}{isZh ? "天" : "d"}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[9px]" onClick={() => handleViewTemplate(item)}>
                                    <FileEdit className="w-3 h-3 mr-0.5" />{isZh ? "模板" : "Template"}
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setUploadTarget({ appId: app.id, category: item.category }); setUploadDialogOpen(true); }}>
                                    <Upload className="w-3 h-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Tax Benefits */}
                    {app.aiChecklist.taxBenefits.length > 0 && (
                      <div className="bg-success/5 border border-success/10 rounded-lg p-3">
                        <p className="text-[10px] font-semibold text-success mb-2 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />{isZh ? "适用税收优惠政策" : "Applicable Tax Benefits"}
                        </p>
                        <div className="space-y-2">
                          {app.aiChecklist.taxBenefits.map((tb, i) => (
                            <div key={i} className="bg-background/50 rounded p-2">
                              <p className="text-[11px] font-medium">{isZh ? tb.benefit : tb.benefitEn}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{tb.description}</p>
                              <p className="text-[10px] text-success/80 mt-0.5">{isZh ? "适用条件：" : "Eligibility: "}{tb.eligibility}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Special Notes */}
                    {app.aiChecklist.specialNotes.length > 0 && (
                      <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
                        <p className="text-[10px] font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" />{isZh ? "特别注意事项" : "Special Notes"}
                        </p>
                        <ul className="space-y-1">
                          {app.aiChecklist.specialNotes.map((n, i) => (
                            <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                              <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                              {n}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Documents Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      {isZh ? "归档材料" : "Archived Documents"} ({app.documents.length})
                    </p>
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => { setUploadTarget({ appId: app.id, category: "" }); setUploadDialogOpen(true); }}>
                      <Upload className="w-3 h-3 mr-1" />{isZh ? "上传材料" : "Upload"}
                    </Button>
                  </div>

                  {app.documents.length > 0 ? (
                    <div className="rounded-lg border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[10px]">{isZh ? "文件名" : "File Name"}</TableHead>
                            <TableHead className="text-[10px]">{isZh ? "类别" : "Category"}</TableHead>
                            <TableHead className="text-[10px] text-center">{isZh ? "版本" : "Ver."}</TableHead>
                            <TableHead className="text-[10px] text-center">{isZh ? "上传日期" : "Uploaded"}</TableHead>
                            <TableHead className="text-[10px] text-center">{isZh ? "有效期" : "Expiry"}</TableHead>
                            <TableHead className="text-[10px] text-center">{isZh ? "操作" : "Actions"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {app.documents.map(doc => {
                            const cat = DOC_CATEGORIES.find(c => c.key === doc.category);
                            const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                            return (
                              <TableRow key={doc.id} className={isExpired ? "bg-destructive/5" : ""}>
                                <TableCell className="text-[11px]">
                                  <div className="flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    <span className="font-medium">{isZh ? doc.name : doc.nameEn}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-[9px]">
                                    {cat ? (isZh ? cat.zh : cat.en) : doc.category}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center text-[10px]">v{doc.version}</TableCell>
                                <TableCell className="text-center text-[10px] text-muted-foreground">{doc.uploadedAt}</TableCell>
                                <TableCell className="text-center text-[10px]">
                                  {doc.expiryDate ? (
                                    <span className={isExpired ? "text-destructive font-medium" : "text-muted-foreground"}>
                                      {doc.expiryDate} {isExpired && "⚠️"}
                                    </span>
                                  ) : <span className="text-muted-foreground">—</span>}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Eye className="w-3 h-3" /></Button>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Download className="w-3 h-3" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-muted-foreground border rounded-lg border-dashed">
                      {isZh ? "暂无归档材料，请上传申请所需文件" : "No documents archived yet."}
                    </div>
                  )}
                </div>

                {/* Required Documents Checklist (non-AI fallback) */}
                {app.status === "preparing" && !app.aiChecklist && (
                  <div className="bg-muted/20 rounded-lg p-3">
                    <p className="text-[10px] font-semibold mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-primary" />
                      {isZh ? "所需材料清单" : "Required Documents Checklist"}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {Object.entries(app.type === "initial" ? REQUIRED_DOCS_INITIAL : REQUIRED_DOCS_RENEWAL).map(([key, doc]) => {
                        const hasDoc = app.documents.some(d => d.category === key);
                        return (
                          <div key={key} className={`flex items-start gap-2 text-[11px] p-1.5 rounded ${hasDoc ? "bg-success/5" : "bg-muted/30"}`}>
                            {hasDoc ? <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 mt-0.5 shrink-0" />}
                            <span className={hasDoc ? "text-muted-foreground line-through" : ""}>{isZh ? doc.zh : doc.en}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {app.notes && (
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-md p-2.5">
                    <p className="text-[10px] text-amber-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {app.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </motion.div>
      ))}

      {/* ===== AI Smart Initiation Dialog ===== */}
      <Dialog open={initiateDialogOpen} onOpenChange={setInitiateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {isZh ? "AI 智能申请发起" : "AI Smart Application"}
            </DialogTitle>
          </DialogHeader>

          {aiLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">{isZh ? "AI 正在分析员工信息和历史材料..." : "AI analyzing employee data and history..."}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{isZh ? "自动判断申请类型，生成材料清单和模板" : "Auto-detecting type, generating checklist & templates"}</p>
            </div>
          )}

          {aiResult && !aiLoading && (
            <div className="space-y-4">
              {/* Type Detection Result */}
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {aiResult.applicationType === "initial" ? <FileCheck className="w-5 h-5 text-primary" /> : <RotateCcw className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">
                        {aiResult.applicationType === "initial" ? (isZh ? "初次工作许可申请" : "Initial Application") : (isZh ? "工作许可续签" : "Renewal Application")}
                      </p>
                      <Badge variant="outline" className="text-[10px]">{aiResult.permitCategory}{isZh ? "类人才" : "-Class"}</Badge>
                      {getRiskBadge(aiResult.riskLevel)}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{aiResult.typeReason}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-background rounded p-2">
                    <p className="text-xs font-bold">{aiResult.estimatedProcessingDays} {isZh ? "工作日" : "days"}</p>
                    <p className="text-[9px] text-muted-foreground">{isZh ? "预计审批时间" : "Processing Time"}</p>
                  </div>
                  <div className="bg-background rounded p-2">
                    <p className="text-xs font-bold">{aiResult.checklist.length} {isZh ? "份" : "docs"}</p>
                    <p className="text-[9px] text-muted-foreground">{isZh ? "所需材料" : "Required"}</p>
                  </div>
                  <div className="bg-background rounded p-2">
                    <p className="text-xs font-bold">{aiResult.deadline}</p>
                    <p className="text-[9px] text-muted-foreground">{isZh ? "建议截止日" : "Deadline"}</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">{isZh ? "许可类别判断依据：" : "Category reason: "}{aiResult.categoryReason}</p>
              </div>

              {/* Tabs for checklist, tax, notes */}
              <Tabs value={activeResultTab} onValueChange={setActiveResultTab}>
                <TabsList className="h-8">
                  <TabsTrigger value="checklist" className="text-xs">
                    <FileText className="w-3 h-3 mr-1" />{isZh ? "材料清单" : "Checklist"} ({aiResult.checklist.length})
                  </TabsTrigger>
                  <TabsTrigger value="tax" className="text-xs">
                    <DollarSign className="w-3 h-3 mr-1" />{isZh ? "税收优惠" : "Tax"} ({aiResult.taxBenefits.length})
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />{isZh ? "注意事项" : "Notes"} ({aiResult.specialNotes.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="checklist" className="mt-3">
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px]">{isZh ? "材料" : "Document"}</TableHead>
                          <TableHead className="text-[10px] text-center">{isZh ? "状态" : "Status"}</TableHead>
                          <TableHead className="text-[10px] text-center">{isZh ? "优先级" : "Priority"}</TableHead>
                          <TableHead className="text-[10px]">{isZh ? "说明" : "Notes"}</TableHead>
                          <TableHead className="text-[10px] text-center">{isZh ? "天数" : "Days"}</TableHead>
                          <TableHead className="text-[10px] text-center">{isZh ? "模板" : "Template"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {aiResult.checklist.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-[11px] font-medium">{isZh ? item.docName : item.docNameEn}</TableCell>
                            <TableCell className="text-center">{getDocStatusBadge(item.status)}</TableCell>
                            <TableCell className="text-center">{getPriorityBadge(item.priority)}</TableCell>
                            <TableCell className="text-[10px] text-muted-foreground max-w-[180px]">{item.statusReason}</TableCell>
                            <TableCell className="text-center text-[10px]">{item.estimatedDays}</TableCell>
                            <TableCell className="text-center">
                              <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[9px]" onClick={() => handleViewTemplate(item)}>
                                <FileEdit className="w-3 h-3 mr-0.5" />{isZh ? "查看" : "View"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="tax" className="mt-3 space-y-2">
                  {aiResult.taxBenefits.map((tb, i) => (
                    <div key={i} className="bg-success/5 border border-success/10 rounded-lg p-3">
                      <p className="text-[11px] font-semibold flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-success" />
                        {isZh ? tb.benefit : tb.benefitEn}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">{tb.description}</p>
                      <p className="text-[10px] text-success/80 mt-0.5">{isZh ? "适用条件：" : "Eligibility: "}{tb.eligibility}</p>
                    </div>
                  ))}
                  {aiResult.taxBenefits.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">{isZh ? "暂无适用税收优惠" : "No applicable tax benefits"}</p>
                  )}
                </TabsContent>

                <TabsContent value="notes" className="mt-3">
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 space-y-2">
                    {aiResult.specialNotes.map((n, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <span>{n}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">{isZh ? "风险评估：" : "Risk: "}{aiResult.riskNotes}</p>
                </TabsContent>
              </Tabs>

              {/* Professional Review Actions */}
              <div className="border-t pt-4 space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  {isZh ? "专业人员审核确认" : "Professional Review & Confirm"}
                </p>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleConfirmAndCreate}>
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    {isZh ? "确认并创建申请" : "Confirm & Create"}
                  </Button>
                  <Button variant="outline" onClick={() => toast.success(isZh ? "清单已导出为PDF供审核" : "Exported as PDF for review")}>
                    <Printer className="w-4 h-4 mr-1.5" />
                    {isZh ? "导出审核" : "Export"}
                  </Button>
                  <Button variant="outline" onClick={() => setInitiateDialogOpen(false)}>
                    {isZh ? "取消" : "Cancel"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Template Preview Dialog ===== */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileEdit className="w-4 h-4 text-primary" />
              {selectedTemplate ? (isZh ? selectedTemplate.docName : selectedTemplate.docNameEn) : ""}
              {isZh ? " — AI 预填模板" : " — AI Template"}
            </DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-3">
              <div className="bg-primary/5 rounded-lg p-3">
                <p className="text-[10px] font-medium text-primary mb-1">{selectedTemplate.templateData.title}</p>
                <div className="flex items-center gap-2">
                  {getDocStatusBadge(selectedTemplate.status)}
                  {getPriorityBadge(selectedTemplate.priority)}
                  <span className="text-[10px] text-muted-foreground">{selectedTemplate.statusReason}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {selectedTemplate.templateData.fields.map((field, i) => (
                  <div key={i}>
                    <Label className="text-[10px] text-muted-foreground">{isZh ? field.label : field.labelEn}</Label>
                    <Input
                      className="mt-0.5 text-xs h-8"
                      value={templateEdits[field.label] || ""}
                      readOnly={!field.editable}
                      onChange={e => setTemplateEdits(prev => ({ ...prev, [field.label]: e.target.value }))}
                    />
                    {!field.editable && (
                      <p className="text-[9px] text-muted-foreground mt-0.5">{isZh ? "🔒 系统自动填充，不可修改" : "🔒 Auto-filled, read-only"}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Button className="flex-1" size="sm" onClick={() => { toast.success(isZh ? "模板已保存" : "Template saved"); setTemplateDialogOpen(false); }}>
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />{isZh ? "保存模板" : "Save"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { toast.success(isZh ? "模板已导出" : "Template exported"); }}>
                  <Download className="w-3.5 h-3.5 mr-1" />{isZh ? "导出" : "Export"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isZh ? "上传材料归档" : "Upload & Archive Document"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">{isZh ? "文件类别" : "Document Category"}</Label>
              <Select defaultValue={uploadTarget?.category || ""}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={isZh ? "选择类别" : "Select category"} /></SelectTrigger>
                <SelectContent>
                  {DOC_CATEGORIES.map(cat => (
                    <SelectItem key={cat.key} value={cat.key}>{isZh ? cat.zh : cat.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{isZh ? "文件名称" : "Document Name"}</Label>
              <Input className="mt-1" placeholder={isZh ? "如：护照扫描件" : "e.g., Passport Scan"} />
            </div>
            <div>
              <Label className="text-xs">{isZh ? "有效期（如适用）" : "Expiry Date (if applicable)"}</Label>
              <Input type="date" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{isZh ? "选择文件" : "Choose File"}</Label>
              <div className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{isZh ? "点击上传或拖拽文件至此" : "Click or drag files here"}</p>
              </div>
            </div>
            <Button className="w-full" onClick={handleUpload}>
              <Upload className="w-3.5 h-3.5 mr-1" />{isZh ? "上传并归档" : "Upload & Archive"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Policy Sync Dialog ===== */}
      <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              {isZh ? "各城市工作许可政策法规同步" : "City Work Permit Policy Sync"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* City Selector & Search */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CITY_LIST.map(c => (
                      <SelectItem key={c.city} value={c.city}>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" />
                          {c.city} ({c.province}) — {c.en}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => handleSearchPolicies()} disabled={policyLoading}>
                {policyLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Search className="w-4 h-4 mr-1" />}
                {isZh ? "AI 搜索最新政策" : "AI Search Policies"}
              </Button>
            </div>

            {/* Loading State */}
            {policyLoading && (
              <div className="flex flex-col items-center py-10">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">{isZh ? `正在搜索${selectedCity}最新政策法规...` : `Searching ${selectedCity} policies...`}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{isZh ? "AI 分析工作许可、签证、税收、合规等政策" : "Analyzing work permit, visa, tax, compliance policies"}</p>
              </div>
            )}

            {/* Results */}
            {policyResult && !policyLoading && (
              <div className="space-y-4">
                {/* City Overview */}
                {policyResult.city_overview && (
                  <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold">{policyResult.city} {isZh ? "政策概览" : "Policy Overview"}</span>
                        <Badge variant="outline" className="text-[9px]">{policyResult.province}</Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {isZh ? "更新于" : "Updated"}: {new Date(policyResult.searchedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                      <div className="bg-background rounded p-2 text-center">
                        <p className="text-lg font-bold text-foreground">{policyResult.city_overview.processing_days_initial}</p>
                        <p className="text-[9px] text-muted-foreground">{isZh ? "初次申请(工作日)" : "Initial (days)"}</p>
                      </div>
                      <div className="bg-background rounded p-2 text-center">
                        <p className="text-lg font-bold text-foreground">{policyResult.city_overview.processing_days_renewal}</p>
                        <p className="text-[9px] text-muted-foreground">{isZh ? "续签(工作日)" : "Renewal (days)"}</p>
                      </div>
                      <div className="bg-background rounded p-2 text-center col-span-2">
                        <p className="text-[11px] text-muted-foreground">{policyResult.city_overview.key_contacts}</p>
                        <p className="text-[9px] text-muted-foreground">{isZh ? "办理机构" : "Authority"}</p>
                      </div>
                    </div>
                    {policyResult.city_overview.special_advantages?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {policyResult.city_overview.special_advantages.map((a, i) => (
                          <Badge key={i} className="bg-success/10 text-success border-success/20 text-[9px]">{a}</Badge>
                        ))}
                      </div>
                    )}
                    {policyResult.city_overview.notes && (
                      <p className="text-[10px] text-muted-foreground">{policyResult.city_overview.notes}</p>
                    )}
                  </div>
                )}

                {/* Policy Filter Tabs */}
                <Tabs value={policyTab} onValueChange={setPolicyTab}>
                  <TabsList className="h-8 flex-wrap">
                    <TabsTrigger value="all" className="text-[10px]">
                      {isZh ? "全部" : "All"} ({policyResult.policies.length})
                    </TabsTrigger>
                    {["work_permit", "visa", "talent", "tax", "compliance", "update"].map(cat => {
                      const count = policyResult.policies.filter(p => p.category === cat).length;
                      if (count === 0) return null;
                      const labels: Record<string, string> = { work_permit: isZh ? "工作许可" : "Permit", visa: isZh ? "签证" : "Visa", talent: isZh ? "人才" : "Talent", tax: isZh ? "税收" : "Tax", compliance: isZh ? "合规" : "Compliance", update: isZh ? "变更" : "Updates" };
                      return <TabsTrigger key={cat} value={cat} className="text-[10px]">{labels[cat]} ({count})</TabsTrigger>;
                    })}
                  </TabsList>

                  <TabsContent value={policyTab} className="mt-3">
                    <ScrollArea className="h-[350px]">
                      <div className="space-y-2.5 pr-2">
                        {policyResult.policies
                          .filter(p => policyTab === "all" || p.category === policyTab)
                          .map((policy, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                              <Card className="border">
                                <CardContent className="p-3">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        {getCategoryLabel(policy.category)}
                                        {getImportanceBadge(policy.importance)}
                                        {policy.effective_date && (
                                          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                            <CalendarDays className="w-3 h-3" />{policy.effective_date}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] font-semibold">{policy.title}</p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-[9px] shrink-0"
                                      onClick={() => handleSavePolicy(policy)}
                                    >
                                      <CheckCircle className="w-3 h-3 mr-0.5" />
                                      {isZh ? "确认入库" : "Save"}
                                    </Button>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground leading-relaxed">{policy.content}</p>
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex flex-wrap gap-1">
                                      {policy.tags?.map((tag, ti) => (
                                        <Badge key={ti} variant="outline" className="text-[8px] h-4">{tag}</Badge>
                                      ))}
                                    </div>
                                    <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                      <BookOpen className="w-3 h-3" />{policy.source_name}
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>

                {/* Saved Policies Count */}
                {savedPolicies.length > 0 && (
                  <div className="bg-success/5 border border-success/10 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-xs font-medium">{isZh ? `已确认入库 ${savedPolicies.length} 条政策` : `${savedPolicies.length} policies confirmed`}</span>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => toast.success(isZh ? "政策已导出" : "Policies exported")}>
                      <Download className="w-3 h-3 mr-1" />{isZh ? "导出" : "Export"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!policyResult && !policyLoading && (
              <div className="text-center py-12 border rounded-lg border-dashed">
                <Globe className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{isZh ? "选择城市后点击搜索，AI 将自动获取该城市最新外国人工作许可政策" : "Select a city and search to fetch latest policies via AI"}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{isZh ? "覆盖工作许可、签证、人才引进、税收优惠、合规要求等" : "Covers work permits, visas, talent policies, tax benefits, compliance"}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkPermitArchive;
