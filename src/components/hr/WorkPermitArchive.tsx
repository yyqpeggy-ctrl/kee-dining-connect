import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  FileText, Upload, FolderArchive, History, Sparkles, ChevronDown, ChevronRight,
  Download, Eye, Clock, CheckCircle, AlertTriangle, Plus, RotateCcw, FileCheck, Zap
} from "lucide-react";

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
  notes?: string;
}

interface EmployeeInfo {
  id: string;
  nameZh: string;
  nameEn: string;
  nationality: string;
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

// ===== Required docs per application type =====
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
  {
    id: "wpa-002",
    type: "renewal",
    status: "preparing",
    applicationDate: "2026-03-01",
    documents: [
      { id: "d8", name: "护照扫描件（更新）", nameEn: "Passport Scan (Updated)", category: "passport", uploadedAt: "2026-02-20", version: 2 },
      { id: "d9", name: "续聘合同", nameEn: "Renewal Contract", category: "employment", uploadedAt: "2026-02-22", expiryDate: "2028-05-14", version: 1 },
    ],
    aiAnalysis: {
      completeness: 35,
      missingDocs: ["体检报告（需更新）", "现工作许可证原件", "个人所得税完税证明", "近期证件照"],
      suggestions: [
        "体检报告已超1年，需重新体检",
        "可复用初次申请的学历认证（仍在有效期内）",
        "建议提前准备完税证明，税务局办理需5-7个工作日",
        "现工作许可证将于2026-06-09到期，建议在4月15日前提交续签",
      ],
      riskLevel: "medium",
    },
    notes: "需在工作许可到期前30天提交续签申请",
  },
];

const WorkPermitArchive = ({ employee, isZh }: Props) => {
  const [applications, setApplications] = useState<WorkPermitApplication[]>(SAMPLE_APPLICATIONS);
  const [expandedApp, setExpandedApp] = useState<string | null>("wpa-002");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<{ appId: string; category: string } | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

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

  const handleUpload = () => {
    toast.success(isZh ? "文件已上传并归档" : "File uploaded and archived");
    setUploadDialogOpen(false);
  };

  const handleGenerateChecklist = (app: WorkPermitApplication) => {
    toast.success(isZh ? "AI 已根据历史材料生成续签清单" : "AI generated renewal checklist from historical docs");
    setGenerateDialogOpen(true);
  };

  const handleStartNewRenewal = () => {
    const newApp: WorkPermitApplication = {
      id: `wpa-${Date.now()}`,
      type: "renewal",
      status: "preparing",
      applicationDate: new Date().toISOString().split("T")[0],
      documents: [],
      aiAnalysis: {
        completeness: 0,
        missingDocs: Object.values(REQUIRED_DOCS_RENEWAL).map(d => isZh ? d.zh : d.en),
        suggestions: [isZh ? "系统已基于历史申请自动生成所需材料清单" : "System auto-generated checklist from historical applications"],
        riskLevel: "high",
      },
    };
    setApplications(prev => [newApp, ...prev]);
    setExpandedApp(newApp.id);
    toast.success(isZh ? "已创建新续签申请，AI 已分析历史材料生成清单" : "New renewal created, AI analyzed historical docs");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderArchive className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">{isZh ? "工作许可档案" : "Work Permit Archive"}</h3>
          <Badge variant="secondary" className="text-[10px]">{applications.length} {isZh ? "次申请" : "applications"}</Badge>
        </div>
        <Button size="sm" onClick={handleStartNewRenewal}>
          <Plus className="w-3.5 h-3.5 mr-1" />{isZh ? "新建续签申请" : "New Renewal"}
        </Button>
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

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-muted rounded-full mb-3">
                      <div
                        className={`h-full rounded-full transition-all ${app.aiAnalysis.completeness >= 80 ? "bg-success" : app.aiAnalysis.completeness >= 50 ? "bg-warning" : "bg-destructive"}`}
                        style={{ width: `${app.aiAnalysis.completeness}%` }}
                      />
                    </div>

                    {/* Missing Docs */}
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

                    {/* AI Suggestions */}
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

                    {/* Generate Checklist Button */}
                    {app.type === "renewal" && app.status === "preparing" && (
                      <div className="mt-3 pt-3 border-t border-primary/10 flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => handleGenerateChecklist(app)}>
                          <Sparkles className="w-3.5 h-3.5 mr-1" />{isZh ? "AI 生成续签材料清单" : "AI Generate Checklist"}
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.info(isZh ? "正在对比历史材料..." : "Comparing with historical docs...")}>
                          <History className="w-3.5 h-3.5 mr-1" />{isZh ? "对比历史材料" : "Compare History"}
                        </Button>
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
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toast.info(isZh ? "预览文件..." : "Previewing...")}>
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toast.info(isZh ? "下载中..." : "Downloading...")}>
                                      <Download className="w-3 h-3" />
                                    </Button>
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
                      {isZh ? "暂无归档材料，请上传申请所需文件" : "No documents archived yet. Upload required files."}
                    </div>
                  )}
                </div>

                {/* Required Documents Checklist for preparing apps */}
                {app.status === "preparing" && (
                  <div className="bg-muted/20 rounded-lg p-3">
                    <p className="text-[10px] font-semibold mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-primary" />
                      {isZh ? "所需材料清单（基于历史分析）" : "Required Documents Checklist (from history)"}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {Object.entries(app.type === "initial" ? REQUIRED_DOCS_INITIAL : REQUIRED_DOCS_RENEWAL).map(([key, doc]) => {
                        const hasDoc = app.documents.some(d => d.category === key || d.name.includes(isZh ? doc.zh.slice(0, 4) : doc.en.slice(0, 8)));
                        return (
                          <div key={key} className={`flex items-start gap-2 text-[11px] p-1.5 rounded ${hasDoc ? "bg-success/5" : "bg-muted/30"}`}>
                            {hasDoc ? (
                              <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 mt-0.5 shrink-0" />
                            )}
                            <span className={hasDoc ? "text-muted-foreground line-through" : ""}>{isZh ? doc.zh : doc.en}</span>
                            {!hasDoc && (
                              <Button
                                variant="ghost" size="sm" className="h-5 px-1.5 text-[9px] ml-auto shrink-0"
                                onClick={() => { setUploadTarget({ appId: app.id, category: key }); setUploadDialogOpen(true); }}
                              >
                                <Upload className="w-2.5 h-2.5 mr-0.5" />{isZh ? "上传" : "Upload"}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notes */}
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
                <p className="text-[10px] text-muted-foreground mt-1">{isZh ? "支持 PDF, JPG, PNG（最大 20MB）" : "PDF, JPG, PNG (max 20MB)"}</p>
              </div>
            </div>
            <div>
              <Label className="text-xs">{isZh ? "备注" : "Notes"}</Label>
              <Textarea className="mt-1" rows={2} placeholder={isZh ? "可选备注..." : "Optional notes..."} />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleUpload}>
                <Upload className="w-3.5 h-3.5 mr-1" />{isZh ? "上传并归档" : "Upload & Archive"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleUpload}>
                <Sparkles className="w-3.5 h-3.5 mr-1" />{isZh ? "上传并 AI 分析" : "Upload & AI Analyze"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Generate Checklist Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              {isZh ? "AI 续签材料清单" : "AI Renewal Checklist"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-primary/5 rounded-lg p-3">
              <p className="text-xs font-medium mb-2">{isZh ? "基于历史申请自动生成的分析报告：" : "Auto-generated analysis from historical applications:"}</p>
              <ul className="space-y-2 text-[11px]">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                  <span>{isZh ? "学历认证：可复用初次申请材料（有效期至2029年），无需重新办理" : "Education cert: can reuse from initial application (valid until 2029)"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
                  <span>{isZh ? "体检报告：初次申请时的报告已超1年，需重新体检（建议预约医院）" : "Health check: expired (>1 year), needs renewal (book hospital)"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                  <span>{isZh ? "完税证明：续签新增必要材料，需前往税务局办理（5-7个工作日）" : "Tax cert: new requirement for renewal, takes 5-7 business days"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <span>{isZh ? "护照：已更新上传（v2），满足续签要求" : "Passport: already updated (v2), meets renewal requirements"}</span>
                </li>
              </ul>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">{isZh ? "💡 提示：此清单可导出给专业人员审核" : "💡 Tip: Export this checklist for professional review"}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => { toast.success(isZh ? "清单已导出为PDF" : "Checklist exported as PDF"); setGenerateDialogOpen(false); }}>
                <Download className="w-3.5 h-3.5 mr-1" />{isZh ? "导出清单" : "Export Checklist"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                {isZh ? "关闭" : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkPermitArchive;
