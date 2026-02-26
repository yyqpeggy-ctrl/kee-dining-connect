import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { toast } from "sonner";
import {
  MessageSquare, Upload, RefreshCw, Clock, CheckCircle, AlertCircle,
  FileText, Users, ShoppingCart, DollarSign, MapPin, Calendar, Loader2,
  Brain, Trash2, ChevronDown, ChevronUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ExtractJob {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  status: string;
  source_module: string;
  extracted_data: any[];
  summary: any;
  error_message: string | null;
  processed_at: string | null;
  created_at: string;
}

const moduleIcons: Record<string, any> = {
  marketing: Users,
  procurement: ShoppingCart,
  hr: FileText,
  finance: DollarSign,
  inventory: MapPin,
  general: MessageSquare,
};

const moduleColors: Record<string, string> = {
  marketing: "bg-blue-500/10 text-blue-600",
  procurement: "bg-orange-500/10 text-orange-600",
  hr: "bg-purple-500/10 text-purple-600",
  finance: "bg-green-500/10 text-green-600",
  inventory: "bg-amber-500/10 text-amber-600",
  general: "bg-muted text-muted-foreground",
};

const typeIcons: Record<string, any> = {
  contact: Users,
  signup: Users,
  procurement: ShoppingCart,
  document: FileText,
  date: Calendar,
  amount: DollarSign,
  address: MapPin,
  task: CheckCircle,
};

export default function WechatExtractCenter() {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const { currentStore } = useStore();

  const [jobs, setJobs] = useState<ExtractJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    const { data, error } = await supabase
      .from("wechat_extract_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) setJobs(data as ExtractJob[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let uploaded = 0;

    for (const file of Array.from(files)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const safeName = `${timestamp}_${file.name}`;
      
      const { error } = await supabase.storage
        .from("wechat-exports")
        .upload(safeName, file);

      if (error) {
        toast.error(`${isZh ? "上传失败" : "Upload failed"}: ${file.name}`);
        console.error(error);
      } else {
        uploaded++;
      }
    }

    if (uploaded > 0) {
      toast.success(isZh ? `${uploaded}个文件已上传，点击"立即提取"开始处理` : `${uploaded} files uploaded. Click "Extract Now" to process.`);
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleProcessNow = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-wechat-exports");
      if (error) throw error;

      const result = data as any;
      if (result.processed > 0) {
        toast.success(isZh ? `已处理 ${result.processed} 个文件` : `Processed ${result.processed} files`);
      } else {
        toast.info(isZh ? "没有新文件需要处理" : "No new files to process");
      }
      await loadJobs();
    } catch (err) {
      toast.error(isZh ? "提取失败" : "Extraction failed");
      console.error(err);
    }
    setProcessing(false);
  };

  const handleDelete = async (job: ExtractJob) => {
    await supabase.from("wechat_extract_jobs").delete().eq("id", job.id);
    // Also delete from storage
    const fileName = job.file_name;
    await supabase.storage.from("wechat-exports").remove([fileName]);
    toast.success(isZh ? "已删除" : "Deleted");
    loadJobs();
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />{isZh ? "已提取" : "Extracted"}</Badge>;
      case "processing": return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Loader2 className="w-3 h-3 mr-1 animate-spin" />{isZh ? "处理中" : "Processing"}</Badge>;
      case "failed": return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />{isZh ? "失败" : "Failed"}</Badge>;
      default: return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{isZh ? "等待中" : "Pending"}</Badge>;
    }
  };

  const completedCount = jobs.filter(j => j.status === "completed").length;
  const totalExtracted = jobs.reduce((sum, j) => sum + (j.extracted_data?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="w-4 h-4 text-primary" /></div>
            <div><p className="text-2xl font-bold">{jobs.length}</p><p className="text-xs text-muted-foreground">{isZh ? "总文件数" : "Total Files"}</p></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{completedCount}</p><p className="text-xs text-muted-foreground">{isZh ? "已处理" : "Processed"}</p></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center"><Brain className="w-4 h-4 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{totalExtracted}</p><p className="text-xs text-muted-foreground">{isZh ? "提取信息条数" : "Items Extracted"}</p></div>
          </div>
        </motion.div>
      </div>

      {/* How it works + Actions */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          {isZh ? "微信聊天记录自动提取" : "WeChat Chat Auto-Extract"}
        </h3>
        <div className="text-sm text-muted-foreground mb-4 space-y-1">
          <p>{isZh
            ? "📋 步骤1: 在微信电脑端选择聊天记录 → 右键复制 → 粘贴到txt文件保存"
            : "📋 Step 1: Select chat records in WeChat Desktop → Right click copy → Paste into txt file"
          }</p>
          <p>{isZh
            ? "📤 步骤2: 上传txt文件到下方（支持批量上传多个文件）"
            : "📤 Step 2: Upload txt files below (supports batch upload)"
          }</p>
          <p>{isZh
            ? "🤖 步骤3: 点击\"立即提取\"，AI自动识别联系人、报名、采购、费用等信息"
            : "🤖 Step 3: Click 'Extract Now', AI auto-identifies contacts, signups, procurement, costs"
          }</p>
          <p>{isZh
            ? "⏰ 提示: 系统每天自动扫描新上传的文件，也可手动触发"
            : "⏰ Tip: System auto-scans new uploads daily, or trigger manually"
          }</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <label className="cursor-pointer">
            <input type="file" accept=".txt,.csv,.log" multiple onChange={handleUpload} className="hidden" />
            <Button variant="outline" asChild disabled={uploading}>
              <span>
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                {isZh ? "上传聊天记录" : "Upload Chat Records"}
              </span>
            </Button>
          </label>
          <Button onClick={handleProcessNow} disabled={processing}>
            {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
            {isZh ? "立即提取" : "Extract Now"}
          </Button>
          <Button variant="ghost" size="icon" onClick={loadJobs}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />{isZh ? "加载中..." : "Loading..."}</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>{isZh ? "暂无提取记录，请上传微信聊天记录文件" : "No records yet. Upload WeChat chat files to get started."}</p>
          </div>
        ) : (
          <AnimatePresence>
            {jobs.map((job, idx) => {
              const ModuleIcon = moduleIcons[job.source_module] || MessageSquare;
              const isExpanded = expandedJob === job.id;
              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="glass-card rounded-xl overflow-hidden"
                >
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${moduleColors[job.source_module] || moduleColors.general}`}>
                        <ModuleIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{job.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(job.created_at).toLocaleString()} · {(job.file_size / 1024).toFixed(1)}KB
                          {job.extracted_data?.length > 0 && ` · ${job.extracted_data.length} ${isZh ? "条信息" : "items"}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusBadge(job.status)}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="border-t border-border">
                      <div className="p-4 space-y-3">
                        {/* Summary */}
                        {job.summary?.summary_zh && (
                          <div className="bg-muted/30 rounded-lg p-3 text-sm">
                            <p className="font-medium mb-1">{isZh ? "📊 提取摘要" : "📊 Summary"}</p>
                            <p className="text-muted-foreground">{isZh ? job.summary.summary_zh : (job.summary.summary_en || job.summary.summary_zh)}</p>
                          </div>
                        )}

                        {/* Extracted Items */}
                        {job.extracted_data?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">{isZh ? "提取详情" : "Extracted Details"}</p>
                            {job.extracted_data.map((item: any, i: number) => {
                              const TypeIcon = typeIcons[item.type] || FileText;
                              return (
                                <div key={i} className="flex items-start gap-3 bg-muted/20 rounded-lg p-3 text-sm">
                                  <TypeIcon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium">{item.title}</span>
                                      <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                                      {item.priority === "high" && <Badge className="bg-destructive/10 text-destructive text-[10px]">{isZh ? "高" : "High"}</Badge>}
                                    </div>
                                    <p className="text-muted-foreground">{item.detail}</p>
                                    {item.source_message && (
                                      <p className="text-xs text-muted-foreground/70 mt-1 italic">"{item.source_message}"</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Error */}
                        {job.error_message && (
                          <div className="bg-destructive/10 rounded-lg p-3 text-sm text-destructive">
                            <AlertCircle className="w-4 h-4 inline mr-1" />{job.error_message}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end">
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(job)}>
                            <Trash2 className="w-3 h-3 mr-1" />{isZh ? "删除" : "Delete"}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
