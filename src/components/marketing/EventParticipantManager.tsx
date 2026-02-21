import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Users, UserPlus, MessageSquare, Upload, QrCode, Search, Tag, Bell,
  CheckCircle2, XCircle, Clock, Smartphone, Mail, Merge, Sparkles,
  Filter, Download, RefreshCw, UserCheck, Send, FileSpreadsheet,
  Hash, Star, Loader2, ScanLine, AlertCircle, ChevronDown, ChevronUp,
  TrendingUp, BarChart3, Repeat
} from "lucide-react";

interface Participant {
  id: string;
  name: string;
  phone: string;
  wechat?: string;
  email?: string;
  source: string;
  status: string;
  is_new_customer: boolean;
  notes?: string;
  check_in_at?: string;
  created_at: string;
  event_id: string;
  event_name: string;
  // computed
  tags?: string[];
  eventCount?: number;
  isDuplicate?: boolean;
}

// Mock WeChat messages for AI parsing
const mockWechatMessages = `张伟：我报名周五飞镖赛！13812345678
李娜：我也来+1 手机13987654321
Emily：Count me in! 15898765432
王芳：帮我报名 微信号wangfang_sh 电话15012340001
@赵磊 你来吗？
赵磊：来！赵磊 13511112222
新人小周：我第一次来，周明 18900005555 微信zm2026`;

interface EventParticipantManagerProps {
  eventId: string;
  eventName: string;
  eventNameEn: string;
  expectedGuests: number;
}

const EventParticipantManager = ({ eventId, eventName, eventNameEn, expectedGuests }: EventParticipantManagerProps) => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const { toast } = useToast();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [wechatInput, setWechatInput] = useState(mockWechatMessages);
  const [aiParsing, setAiParsing] = useState(false);
  const [parsedResults, setParsedResults] = useState<any[]>([]);
  const [parseSummary, setParseSummary] = useState<any>(null);
  const [manualForm, setManualForm] = useState({ name: "", phone: "", wechat: "", email: "" });
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyTarget, setNotifyTarget] = useState("all");
  const [notifyChannel, setNotifyChannel] = useState("wechat_template");
  const [notifySending, setNotifySending] = useState(false);
  const [notifyHistory, setNotifyHistory] = useState<any[]>([]);
  const [reminderRules, setReminderRules] = useState<any[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  // Excel import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelPreview, setExcelPreview] = useState<{ name: string; phone: string; wechat?: string; email?: string }[]>([]);
  const [excelImporting, setExcelImporting] = useState(false);
  const [excelFileName, setExcelFileName] = useState("");
  // Cross-event analysis
  const [crossEventData, setCrossEventData] = useState<{ phone: string; name: string; eventCount: number; events: string[] }[]>([]);
  const [crossEventLoading, setCrossEventLoading] = useState(false);

  // Load participants from DB
  const loadParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("event_participants")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setParticipants((data || []) as Participant[]);
    } catch (err: any) {
      console.error("Load participants error:", err);
      toast({ title: isZh ? "加载失败" : "Load Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [eventId, isZh, toast]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  // Computed stats
  const stats = useMemo(() => {
    return {
      total: participants.length,
      checkedIn: participants.filter(p => p.status === "checked_in").length,
      confirmed: participants.filter(p => p.status === "confirmed").length,
      registered: participants.filter(p => p.status === "registered").length,
      noShow: participants.filter(p => p.status === "no_show").length,
      cancelled: participants.filter(p => p.status === "cancelled").length,
      newCustomers: participants.filter(p => p.is_new_customer).length,
      bySource: {
        wechat_group: participants.filter(p => p.source === "wechat_group").length,
        platform: participants.filter(p => p.source === "platform").length,
        manual: participants.filter(p => p.source === "manual").length,
        miniprogram: participants.filter(p => p.source === "miniprogram").length,
      },
    };
  }, [participants]);

  const filtered = useMemo(() => {
    return participants.filter(p => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (sourceFilter !== "all" && p.source !== sourceFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.phone || "").includes(q) || (p.wechat || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [participants, statusFilter, sourceFilter, searchQuery]);

  const statusLabels: Record<string, { zh: string; en: string; color: string }> = {
    checked_in: { zh: "已签到", en: "Checked In", color: "text-green-600" },
    confirmed: { zh: "已确认", en: "Confirmed", color: "text-blue-600" },
    registered: { zh: "已报名", en: "Registered", color: "text-yellow-600" },
    no_show: { zh: "未到场", en: "No Show", color: "text-red-500" },
    cancelled: { zh: "已取消", en: "Cancelled", color: "text-muted-foreground" },
  };
  const statusIcons: Record<string, typeof CheckCircle2> = {
    checked_in: CheckCircle2, confirmed: UserCheck, registered: Clock, no_show: XCircle, cancelled: AlertCircle,
  };
  const sourceLabels: Record<string, { zh: string; en: string; icon: typeof MessageSquare }> = {
    wechat_group: { zh: "微信群", en: "WeChat Group", icon: MessageSquare },
    platform: { zh: "平台同步", en: "Platform", icon: RefreshCw },
    manual: { zh: "手动录入", en: "Manual", icon: UserPlus },
    miniprogram: { zh: "小程序", en: "Mini Program", icon: Smartphone },
  };

  // --- DB CRUD Operations ---

  const handleManualAdd = async () => {
    if (!manualForm.name || !manualForm.phone) return;
    try {
      // Check duplicate in this event
      const existing = participants.find(p => p.phone === manualForm.phone);
      if (existing) {
        toast({ title: isZh ? "⚠️ 该手机号已存在" : "⚠️ Phone already exists", variant: "destructive" });
        return;
      }
      // Check if new customer (never attended any event)
      const { count } = await supabase
        .from("event_participants")
        .select("*", { count: "exact", head: true })
        .eq("phone", manualForm.phone);
      const isNew = (count || 0) === 0;

      const { data, error } = await supabase.from("event_participants").insert({
        event_id: eventId,
        event_name: eventName,
        name: manualForm.name,
        phone: manualForm.phone,
        wechat: manualForm.wechat || null,
        email: manualForm.email || null,
        source: "manual",
        status: "registered",
        is_new_customer: isNew,
      }).select().single();
      if (error) throw error;
      setParticipants(prev => [data as Participant, ...prev]);
      setManualForm({ name: "", phone: "", wechat: "", email: "" });
      toast({ title: isZh ? "添加成功" : "Added", description: isNew ? (isZh ? "新客户" : "New customer") : undefined });
    } catch (err: any) {
      toast({ title: isZh ? "添加失败" : "Add Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleCheckIn = async (id: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("event_participants")
      .update({ status: "checked_in", check_in_at: now })
      .eq("id", id);
    if (error) {
      toast({ title: isZh ? "签到失败" : "Check-in Failed", variant: "destructive" });
      return;
    }
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, status: "checked_in", check_in_at: now } : p));
    toast({ title: isZh ? "签到成功 ✅" : "Checked In ✅" });
  };

  const handleBatchCheckIn = async () => {
    const ids = Array.from(selectedIds);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("event_participants")
      .update({ status: "checked_in", check_in_at: now })
      .in("id", ids);
    if (error) {
      toast({ title: isZh ? "批量签到失败" : "Batch check-in failed", variant: "destructive" });
      return;
    }
    setParticipants(prev => prev.map(p => ids.includes(p.id) ? { ...p, status: "checked_in", check_in_at: now } : p));
    toast({ title: isZh ? "批量签到成功" : "Batch Check-in Complete", description: `${ids.length} ✅` });
    setSelectedIds(new Set());
  };

  const handleDeleteParticipant = async (id: string) => {
    const { error } = await supabase.from("event_participants").delete().eq("id", id);
    if (error) {
      toast({ title: isZh ? "删除失败" : "Delete Failed", variant: "destructive" });
      return;
    }
    setParticipants(prev => prev.filter(p => p.id !== id));
    toast({ title: isZh ? "已删除" : "Deleted" });
  };

  // Excel/CSV helpers
  const mapFileRows = (rawRows: Record<string, string>[]): { name: string; phone: string; wechat?: string; email?: string }[] => {
    return rawRows
      .map(row => {
        // Flexible column name matching (Chinese & English)
        const name = row["姓名"] || row["name"] || row["Name"] || row["名字"] || row["联系人"] || "";
        const phone = row["手机"] || row["手机号"] || row["phone"] || row["Phone"] || row["电话"] || row["联系电话"] || "";
        const wechat = row["微信"] || row["微信号"] || row["wechat"] || row["WeChat"] || "";
        const email = row["邮箱"] || row["email"] || row["Email"] || row["电子邮件"] || "";
        return { name: name.toString().trim(), phone: phone.toString().trim(), wechat: wechat.toString().trim() || undefined, email: email.toString().trim() || undefined };
      })
      .filter(r => r.name && r.phone);
  };

  const handleExcelImport = async () => {
    if (excelPreview.length === 0) return;
    setExcelImporting(true);
    try {
      // Check existing phones for new customer detection
      const phones = excelPreview.map(r => r.phone);
      const { data: existingData } = await supabase
        .from("event_participants")
        .select("phone")
        .in("phone", phones);
      const existingPhones = new Set((existingData || []).map((r: any) => r.phone));

      // Also check duplicates within this event
      const eventPhones = new Set(participants.map(p => p.phone));
      const newRows = excelPreview.filter(r => !eventPhones.has(r.phone));

      if (newRows.length === 0) {
        toast({ title: isZh ? "全部重复" : "All Duplicates", description: isZh ? "所有记录已存在于此活动中" : "All records already exist in this event", variant: "destructive" });
        setExcelImporting(false);
        return;
      }

      const rows = newRows.map(r => ({
        event_id: eventId,
        event_name: eventName,
        name: r.name,
        phone: r.phone,
        wechat: r.wechat || null,
        email: r.email || null,
        source: "manual",
        status: "registered",
        is_new_customer: !existingPhones.has(r.phone),
      }));

      const { data, error } = await supabase.from("event_participants").insert(rows).select();
      if (error) throw error;
      setParticipants(prev => [...(data as Participant[]), ...prev]);
      setExcelPreview([]);
      setExcelFileName("");
      const skipped = excelPreview.length - newRows.length;
      toast({
        title: isZh ? "导入成功" : "Import Complete",
        description: isZh
          ? `新增 ${data?.length} 人${skipped > 0 ? `，跳过 ${skipped} 条重复` : ""}`
          : `Added ${data?.length}${skipped > 0 ? `, skipped ${skipped} duplicates` : ""}`,
      });
    } catch (err: any) {
      toast({ title: isZh ? "导入失败" : "Import Failed", description: err.message, variant: "destructive" });
    } finally {
      setExcelImporting(false);
    }
  };

  // AI Parse WeChat messages
  const handleAiParse = async () => {
    if (!wechatInput.trim()) return;
    setAiParsing(true);
    setParsedResults([]);
    setParseSummary(null);
    try {
      const existingPhones = participants.map(p => p.phone);
      const { data, error } = await supabase.functions.invoke("parse-wechat-signups", {
        body: { chatText: wechatInput, existingPhones },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: isZh ? "解析失败" : "Parse Failed", description: data.error, variant: "destructive" });
        return;
      }
      if (data?.participants) {
        setParsedResults(data.participants);
        setParseSummary(data.summary);
        toast({
          title: isZh ? "AI解析完成" : "AI Parsing Complete",
          description: isZh
            ? `识别出 ${data.participants.length} 条记录`
            : `Found ${data.participants.length} records`,
        });
      }
    } catch (err: any) {
      toast({ title: isZh ? "AI解析失败" : "AI Parse Failed", description: err.message, variant: "destructive" });
    } finally {
      setAiParsing(false);
    }
  };

  const importParsed = async () => {
    const signups = parsedResults.filter((p: any) => p.intent === "signup" && !p.isDuplicate);
    if (signups.length === 0) return;
    try {
      const rows = signups.map((p: any) => ({
        event_id: eventId,
        event_name: eventName,
        name: p.name || "",
        phone: p.phone || "",
        wechat: p.wechat || null,
        email: p.email || null,
        source: "wechat_group",
        status: "registered",
        is_new_customer: p.isNewCustomer || false,
      }));
      const { data, error } = await supabase.from("event_participants").insert(rows).select();
      if (error) throw error;
      setParticipants(prev => [...(data as Participant[]), ...prev]);
      setParsedResults([]);
      setParseSummary(null);
      toast({ title: isZh ? "导入成功" : "Imported", description: isZh ? `新增 ${data?.length} 位参与者` : `Added ${data?.length} participants` });
    } catch (err: any) {
      toast({ title: isZh ? "导入失败" : "Import Failed", description: err.message, variant: "destructive" });
    }
  };

  // Cross-event analysis
  const loadCrossEventAnalysis = useCallback(async () => {
    setCrossEventLoading(true);
    try {
      // Get all participants across all events, grouped by phone
      const { data, error } = await supabase
        .from("event_participants")
        .select("phone, name, event_name, event_id")
        .order("phone");
      if (error) throw error;
      // Group by phone
      const phoneMap: Record<string, { name: string; events: Set<string>; eventNames: string[] }> = {};
      (data || []).forEach((row: any) => {
        if (!row.phone) return;
        if (!phoneMap[row.phone]) {
          phoneMap[row.phone] = { name: row.name, events: new Set(), eventNames: [] };
        }
        if (!phoneMap[row.phone].events.has(row.event_id)) {
          phoneMap[row.phone].events.add(row.event_id);
          phoneMap[row.phone].eventNames.push(row.event_name);
        }
      });
      const result = Object.entries(phoneMap)
        .map(([phone, info]) => ({ phone, name: info.name, eventCount: info.events.size, events: info.eventNames }))
        .filter(r => r.eventCount > 1)
        .sort((a, b) => b.eventCount - a.eventCount);
      setCrossEventData(result);
    } catch (err: any) {
      console.error("Cross-event analysis error:", err);
    } finally {
      setCrossEventLoading(false);
    }
  }, []);

  // Notification logic (same as before)
  const loadRules = useCallback(async () => {
    setRulesLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-event-notification", {
        body: { action: "get_rules" },
      });
      if (error) throw error;
      if (data?.rules) setReminderRules(data.rules);
    } catch (err) {
      console.error("Failed to load rules:", err);
    } finally {
      setRulesLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("send-event-notification", {
        body: { action: "get_history", eventId },
      });
      if (error) throw error;
      if (data?.history) setNotifyHistory(data.history);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }, [eventId]);

  useEffect(() => {
    if (activeTab === "notify") { loadRules(); loadHistory(); }
    if (activeTab === "analysis") { loadCrossEventAnalysis(); }
  }, [activeTab, loadRules, loadHistory, loadCrossEventAnalysis]);

  const handleSendNotification = async () => {
    if (!notifyMessage.trim()) return;
    let recipients: { name: string; phone: string }[] = [];
    if (notifyTarget === "all") {
      recipients = participants.map(p => ({ name: p.name, phone: p.phone }));
    } else if (notifyTarget === "confirmed") {
      recipients = participants.filter(p => p.status === "confirmed" || p.status === "registered").map(p => ({ name: p.name, phone: p.phone }));
    } else if (notifyTarget === "no_checkin") {
      recipients = participants.filter(p => p.status !== "checked_in" && p.status !== "cancelled").map(p => ({ name: p.name, phone: p.phone }));
    } else if (notifyTarget === "selected") {
      recipients = participants.filter(p => selectedIds.has(p.id)).map(p => ({ name: p.name, phone: p.phone }));
    }
    if (recipients.length === 0) {
      toast({ title: isZh ? "无发送目标" : "No Recipients", variant: "destructive" });
      return;
    }
    setNotifySending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-event-notification", {
        body: { action: "send", eventId, eventName, eventDate: "", eventTime: "", channel: notifyChannel, targetType: notifyTarget, recipients, messageTemplate: notifyMessage },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: isZh ? "通知发送完成" : "Notification Sent", description: isZh ? `成功 ${data.delivered}/${data.totalSent}` : `Delivered ${data.delivered}/${data.totalSent}` });
      setNotifyMessage("");
      loadHistory();
    } catch (err: any) {
      toast({ title: isZh ? "发送失败" : "Send Failed", description: err.message, variant: "destructive" });
    } finally {
      setNotifySending(false);
    }
  };

  const handleToggleRule = async (ruleId: string, currentActive: boolean) => {
    try {
      const { data: ruleData } = await supabase.from("event_reminder_rules" as any).update({ is_active: !currentActive }).eq("id", ruleId).select().single();
      if (ruleData) {
        setReminderRules(prev => prev.map(r => r.id === ruleId ? { ...r, is_active: !currentActive } : r));
        toast({ title: isZh ? (currentActive ? "规则已禁用" : "规则已启用") : (currentActive ? "Rule Disabled" : "Rule Enabled") });
      }
    } catch (err) {
      console.error("Toggle rule error:", err);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  };

  const checkinRate = stats.total > 0 ? (stats.checkedIn / stats.total * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{isZh ? "总参与者" : "Total"}</p>
                <p className="text-xl font-bold text-foreground">{stats.total}</p>
                <p className="text-[10px] text-muted-foreground">{isZh ? `目标 ${expectedGuests}` : `Goal ${expectedGuests}`}</p>
              </div>
              <Users className="w-6 h-6 text-primary opacity-60" />
            </div>
            <Progress value={expectedGuests > 0 ? (stats.total / expectedGuests) * 100 : 0} className="h-1 mt-2" />
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{isZh ? "签到率" : "Check-in"}</p>
                <p className="text-xl font-bold text-green-600">{checkinRate.toFixed(0)}%</p>
                <p className="text-[10px] text-muted-foreground">{stats.checkedIn}/{stats.total}</p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-green-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{isZh ? "新客户" : "New"}</p>
                <p className="text-xl font-bold text-blue-600">{stats.newCustomers}</p>
                <p className="text-[10px] text-muted-foreground">{stats.total > 0 ? (stats.newCustomers / stats.total * 100).toFixed(0) : 0}%</p>
              </div>
              <Star className="w-6 h-6 text-blue-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{isZh ? "来源分布" : "Sources"}</p>
                <p className="text-xl font-bold text-foreground">{Object.values(stats.bySource).filter(v => v > 0).length}</p>
                <p className="text-[10px] text-muted-foreground">{isZh ? "个渠道" : "channels"}</p>
              </div>
              <BarChart3 className="w-6 h-6 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source breakdown mini badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">{isZh ? "来源分布：" : "Sources:"}</span>
        {Object.entries(stats.bySource).filter(([, c]) => c > 0).map(([src, count]) => {
          const sl = sourceLabels[src];
          if (!sl) return null;
          const Icon = sl.icon;
          return (
            <Badge key={src} variant="secondary" className="text-[10px] gap-1">
              <Icon className="w-2.5 h-2.5" />{isZh ? sl.zh : sl.en}: {count}
            </Badge>
          );
        })}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex-1 gap-1 text-xs"><Users className="w-3 h-3" />{isZh ? "参与者" : "Participants"}</TabsTrigger>
          <TabsTrigger value="collect" className="flex-1 gap-1 text-xs"><Sparkles className="w-3 h-3" />{isZh ? "智能收集" : "Collect"}</TabsTrigger>
          <TabsTrigger value="checkin" className="flex-1 gap-1 text-xs"><ScanLine className="w-3 h-3" />{isZh ? "签到" : "Check-in"}</TabsTrigger>
          <TabsTrigger value="notify" className="flex-1 gap-1 text-xs"><Bell className="w-3 h-3" />{isZh ? "通知" : "Notify"}</TabsTrigger>
          <TabsTrigger value="analysis" className="flex-1 gap-1 text-xs"><TrendingUp className="w-3 h-3" />{isZh ? "跨活动" : "Cross-Event"}</TabsTrigger>
        </TabsList>

        {/* Participants List */}
        <TabsContent value="overview" className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder={isZh ? "搜索姓名/手机/微信..." : "Search name/phone/wechat..."} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 h-8 text-xs" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-[120px] text-xs"><Filter className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isZh ? "全部状态" : "All Status"}</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{isZh ? v.zh : v.en}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isZh ? "全部来源" : "All Sources"}</SelectItem>
                {Object.entries(sourceLabels).map(([k, v]) => <SelectItem key={k} value={k}>{isZh ? v.zh : v.en}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={loadParticipants}>
              <RefreshCw className="w-3 h-3" />{isZh ? "刷新" : "Refresh"}
            </Button>
          </div>

          {/* Batch actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-xs font-medium text-primary">{isZh ? `已选 ${selectedIds.size} 人` : `${selectedIds.size} selected`}</span>
              <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={handleBatchCheckIn}>
                <CheckCircle2 className="w-2.5 h-2.5" />{isZh ? "批量签到" : "Batch Check-in"}
              </Button>
              <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setSelectedIds(new Set())}>
                {isZh ? "取消" : "Clear"}
              </Button>
            </div>
          )}

          {/* List header */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={selectAll} className="h-3.5 w-3.5" />
              <span>{isZh ? `共 ${filtered.length} 人` : `${filtered.length} participants`}</span>
            </div>
            <Button size="sm" variant="ghost" className="h-6 gap-1 text-[10px]"><Download className="w-2.5 h-2.5" />{isZh ? "导出" : "Export"}</Button>
          </div>

          {loading ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {isZh ? "暂无参与者，请通过\"智能收集\"添加" : "No participants yet. Use \"Collect\" tab to add."}
            </div>
          ) : (
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {filtered.map(p => {
                const SIcon = statusIcons[p.status] || Clock;
                const sl = statusLabels[p.status] || statusLabels.registered;
                const srcL = sourceLabels[p.source] || sourceLabels.manual;
                const SrcIcon = srcL.icon;
                return (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-xs">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} className="h-3.5 w-3.5" />
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">{p.name}</span>
                          {p.is_new_customer && <Badge variant="secondary" className="text-[8px] px-1 h-3.5">{isZh ? "新" : "New"}</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="flex items-center gap-0.5"><Smartphone className="w-2.5 h-2.5" />{p.phone}</span>
                          {p.wechat && <span className="flex items-center gap-0.5"><MessageSquare className="w-2.5 h-2.5" />{p.wechat}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[8px] gap-0.5 px-1.5 h-4">
                        <SrcIcon className="w-2 h-2" />{isZh ? srcL.zh : srcL.en}
                      </Badge>
                      <span className={`flex items-center gap-0.5 text-[10px] font-medium ${sl.color}`}>
                        <SIcon className="w-3 h-3" />{isZh ? sl.zh : sl.en}
                      </span>
                      {p.status !== "checked_in" && p.status !== "cancelled" && (
                        <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => handleCheckIn(p.id)}>
                          <QrCode className="w-3 h-3" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteParticipant(p.id)}>
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Smart Collection */}
        <TabsContent value="collect" className="mt-3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WeChat Group AI Parse */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-green-600" />{isZh ? "微信群聊天记录解析" : "WeChat Group Parsing"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{isZh ? "粘贴微信群聊天记录，AI自动识别报名信息" : "Paste WeChat group chat, AI extracts signup info"}</p>
                <Textarea value={wechatInput} onChange={e => setWechatInput(e.target.value)} rows={6} className="text-xs font-mono" placeholder={isZh ? "粘贴微信群聊天记录..." : "Paste chat messages..."} />
                <Button size="sm" className="w-full gap-1.5" onClick={handleAiParse} disabled={aiParsing || !wechatInput.trim()}>
                  {aiParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {aiParsing ? (isZh ? "AI解析中..." : "AI Parsing...") : (isZh ? "AI智能解析" : "AI Smart Parse")}
                </Button>

                {parsedResults.length > 0 && (
                  <div className="space-y-2">
                    <Separator />
                    {parseSummary && (
                      <div className="flex flex-wrap gap-2 text-[10px]">
                        <Badge variant="secondary" className="gap-0.5"><UserPlus className="w-2.5 h-2.5" />{isZh ? "报名" : "Signup"}: {parseSummary.signupCount || 0}</Badge>
                        {(parseSummary.inquiryCount || 0) > 0 && <Badge variant="outline" className="gap-0.5">{isZh ? "咨询" : "Inquiry"}: {parseSummary.inquiryCount}</Badge>}
                        {(parseSummary.duplicateCount || 0) > 0 && <Badge variant="outline" className="gap-0.5 text-orange-500">{isZh ? "重复" : "Dup"}: {parseSummary.duplicateCount}</Badge>}
                        {(parseSummary.newCustomerCount || 0) > 0 && <Badge variant="outline" className="gap-0.5 text-blue-500">{isZh ? "新客" : "New"}: {parseSummary.newCustomerCount}</Badge>}
                      </div>
                    )}
                    <p className="text-xs font-medium text-foreground">{isZh ? "解析结果" : "Parsed Results"}：</p>
                    {parsedResults.map((p: any, i: number) => {
                      const intentConfig: Record<string, { zh: string; en: string; color: string }> = {
                        signup: { zh: "报名", en: "Signup", color: "text-green-600" },
                        inquiry: { zh: "咨询", en: "Inquiry", color: "text-blue-500" },
                        cancel: { zh: "取消", en: "Cancel", color: "text-red-500" },
                        proxy: { zh: "代报", en: "Proxy", color: "text-purple-500" },
                      };
                      const ic = intentConfig[p.intent] || intentConfig.signup;
                      return (
                        <div key={i} className={`p-2 rounded-md border text-xs space-y-1 ${p.isDuplicate ? "border-orange-300 bg-orange-50/30 dark:bg-orange-950/20" : "border-border bg-card"}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{p.name}</span>
                              <span className="text-muted-foreground">{p.phone}</span>
                              {p.wechat && <span className="text-muted-foreground">wx: {p.wechat}</span>}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-medium ${ic.color}`}>{isZh ? ic.zh : ic.en}</span>
                              {p.confidence != null && <span className="text-[9px] text-muted-foreground">{(p.confidence * 100).toFixed(0)}%</span>}
                              {p.isDuplicate && <Badge variant="outline" className="text-[8px] px-1 h-3.5 text-orange-500 border-orange-300">{isZh ? "已存在" : "Exists"}</Badge>}
                              {p.isNewCustomer && <Badge variant="secondary" className="text-[8px] px-1 h-3.5">{isZh ? "新客" : "New"}</Badge>}
                            </div>
                          </div>
                          {p.intentDetail && <p className="text-[10px] text-muted-foreground italic">{p.intentDetail}</p>}
                          {p.originalMessage && <p className="text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5 font-mono">"{p.originalMessage}"</p>}
                        </div>
                      );
                    })}
                    <Button size="sm" className="w-full gap-1" onClick={importParsed} disabled={parsedResults.filter((p: any) => p.intent === "signup" && !p.isDuplicate).length === 0}>
                      <UserPlus className="w-3.5 h-3.5" />{isZh ? `导入 ${parsedResults.filter((p: any) => p.intent === "signup" && !p.isDuplicate).length} 位报名者到数据库` : `Import ${parsedResults.filter((p: any) => p.intent === "signup" && !p.isDuplicate).length} signups to DB`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Manual Add */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5"><UserPlus className="w-4 h-4 text-primary" />{isZh ? "手动添加" : "Manual Add"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder={isZh ? "姓名 *" : "Name *"} value={manualForm.name} onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))} className="h-8 text-xs" />
                    <Input placeholder={isZh ? "手机号 *" : "Phone *"} value={manualForm.phone} onChange={e => setManualForm(f => ({ ...f, phone: e.target.value }))} className="h-8 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder={isZh ? "微信号" : "WeChat"} value={manualForm.wechat} onChange={e => setManualForm(f => ({ ...f, wechat: e.target.value }))} className="h-8 text-xs" />
                    <Input placeholder="Email" value={manualForm.email} onChange={e => setManualForm(f => ({ ...f, email: e.target.value }))} className="h-8 text-xs" />
                  </div>
                  <Button size="sm" className="h-8 gap-1 w-full" onClick={handleManualAdd} disabled={!manualForm.name || !manualForm.phone}>
                    <UserPlus className="w-3.5 h-3.5" />{isZh ? "添加到数据库" : "Add to Database"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5"><FileSpreadsheet className="w-4 h-4 text-green-600" />{isZh ? "Excel/CSV批量导入" : "Excel/CSV Import"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setExcelFileName(file.name);
                      const isCsv = file.name.endsWith(".csv");

                      if (isCsv) {
                        Papa.parse(file, {
                          header: true,
                          skipEmptyLines: true,
                          complete: (results) => {
                            const rows = mapFileRows(results.data as Record<string, string>[]);
                            setExcelPreview(rows);
                            toast({ title: isZh ? "解析完成" : "Parsed", description: isZh ? `${rows.length} 条记录` : `${rows.length} rows` });
                          },
                          error: (err) => {
                            toast({ title: isZh ? "解析失败" : "Parse Failed", description: err.message, variant: "destructive" });
                          },
                        });
                      } else {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          try {
                            const wb = XLSX.read(evt.target?.result, { type: "array" });
                            const ws = wb.Sheets[wb.SheetNames[0]];
                            const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
                            const rows = mapFileRows(jsonData);
                            setExcelPreview(rows);
                            toast({ title: isZh ? "解析完成" : "Parsed", description: isZh ? `${rows.length} 条记录` : `${rows.length} rows` });
                          } catch (err: any) {
                            toast({ title: isZh ? "解析失败" : "Parse Failed", description: err.message, variant: "destructive" });
                          }
                        };
                        reader.readAsArrayBuffer(file);
                      }
                      // Reset so same file can be re-selected
                      e.target.value = "";
                    }}
                  />
                  {excelPreview.length === 0 ? (
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files[0];
                        if (file && fileInputRef.current) {
                          const dt = new DataTransfer();
                          dt.items.add(file);
                          fileInputRef.current.files = dt.files;
                          fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
                        }
                      }}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                      <p className="text-xs text-muted-foreground mb-2">{isZh ? "拖拽文件到此处或点击上传" : "Drag file here or click to upload"}</p>
                      <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                        <Upload className="w-3 h-3" />{isZh ? "选择文件" : "Choose File"}
                      </Button>
                      <p className="text-[10px] text-muted-foreground mt-2">{isZh ? "支持 .xlsx, .csv，需包含「姓名/name」和「手机/phone」列" : "Requires 'name' and 'phone' columns"}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-foreground">{excelFileName} — {excelPreview.length} {isZh ? "条记录" : "rows"}</p>
                        <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => { setExcelPreview([]); setExcelFileName(""); }}>
                          {isZh ? "清除" : "Clear"}
                        </Button>
                      </div>
                      <div className="max-h-[180px] overflow-y-auto space-y-1">
                        {excelPreview.slice(0, 20).map((row, i) => (
                          <div key={i} className="flex items-center gap-2 p-1.5 rounded border border-border bg-card text-xs">
                            <span className="font-medium text-foreground w-20 truncate">{row.name}</span>
                            <span className="text-muted-foreground">{row.phone}</span>
                            {row.wechat && <span className="text-muted-foreground text-[10px]">wx:{row.wechat}</span>}
                            {row.email && <span className="text-muted-foreground text-[10px]">{row.email}</span>}
                          </div>
                        ))}
                        {excelPreview.length > 20 && <p className="text-[10px] text-muted-foreground text-center">...{isZh ? `还有 ${excelPreview.length - 20} 条` : `${excelPreview.length - 20} more`}</p>}
                      </div>
                      <Button size="sm" className="w-full gap-1.5" onClick={handleExcelImport} disabled={excelImporting}>
                        {excelImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        {excelImporting ? (isZh ? "导入中..." : "Importing...") : (isZh ? `导入 ${excelPreview.length} 条到数据库` : `Import ${excelPreview.length} to DB`)}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-blue-500" />{isZh ? "小程序表单收集" : "Mini Program Form"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">{isZh ? "生成小程序报名表单链接" : "Generate mini program form link"}</p>
                  <div className="flex gap-2">
                    <Input value={`wxmp://event/${eventId}/signup`} readOnly className="h-8 text-xs font-mono bg-muted" />
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { navigator.clipboard.writeText(`wxmp://event/${eventId}/signup`); toast({ title: isZh ? "已复制" : "Copied" }); }}>
                      {isZh ? "复制" : "Copy"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Check-in Management */}
        <TabsContent value="checkin" className="mt-3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{isZh ? "签到列表" : "Check-in List"}</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><QrCode className="w-3 h-3" />{isZh ? "扫码签到" : "QR Check-in"}</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-6"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
                ) : (
                  <div className="space-y-1 max-h-[350px] overflow-y-auto">
                    {participants.filter(p => p.status !== "cancelled").map(p => {
                      const isIn = p.status === "checked_in";
                      return (
                        <div key={p.id} className={`flex items-center justify-between p-2 rounded-md border text-xs ${isIn ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" : "border-border bg-card"}`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isIn ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-primary/10 text-primary"}`}>
                              {p.name.charAt(0)}
                            </div>
                            <span className="font-medium text-foreground">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isIn ? (
                              <span className="text-green-600 text-[10px] flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" />
                                {p.check_in_at ? new Date(p.check_in_at).toLocaleTimeString(isZh ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ""}
                              </span>
                            ) : (
                              <Button size="sm" variant="default" className="h-6 text-[10px] gap-1" onClick={() => handleCheckIn(p.id)}>
                                <CheckCircle2 className="w-2.5 h-2.5" />{isZh ? "签到" : "Check In"}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{isZh ? "签到统计" : "Check-in Stats"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-600">{checkinRate.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">{isZh ? "签到率" : "Check-in Rate"}</p>
                </div>
                <Separator />
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-600" />{isZh ? "已签到" : "Checked In"}</span><span className="font-medium text-foreground">{stats.checkedIn}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><UserCheck className="w-3 h-3 text-blue-600" />{isZh ? "已确认" : "Confirmed"}</span><span className="font-medium text-foreground">{stats.confirmed}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3 text-yellow-600" />{isZh ? "待确认" : "Registered"}</span><span className="font-medium text-foreground">{stats.registered}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" />{isZh ? "未到场" : "No Show"}</span><span className="font-medium text-foreground">{stats.noShow}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notification */}
        <TabsContent value="notify" className="mt-3 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5"><Bell className="w-4 h-4 text-primary" />{isZh ? "活动通知与提醒" : "Event Notifications"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Channel selector */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: "wechat_template", icon: MessageSquare, color: "text-green-600", zh: "微信模板消息", en: "WeChat Template", descZh: "模拟模式", descEn: "Mock mode" },
                  { id: "sms", icon: Mail, color: "text-blue-500", zh: "短信通知", en: "SMS", descZh: "模拟模式", descEn: "Mock mode" },
                  { id: "miniprogram", icon: Smartphone, color: "text-purple-500", zh: "小程序推送", en: "Mini Program", descZh: "模拟模式", descEn: "Mock mode" },
                ].map(ch => (
                  <Card key={ch.id} className={`cursor-pointer transition-all border-2 ${notifyChannel === ch.id ? "border-primary bg-primary/5" : "bg-muted/30 border-border hover:border-primary/30"}`} onClick={() => setNotifyChannel(ch.id)}>
                    <CardContent className="pt-4 pb-3 px-4 text-center">
                      <ch.icon className={`w-8 h-8 mx-auto mb-2 ${ch.color} opacity-60`} />
                      <p className="text-sm font-medium text-foreground">{isZh ? ch.zh : ch.en}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{isZh ? ch.descZh : ch.descEn}</p>
                      {notifyChannel === ch.id && <Badge className="mt-1.5 text-[9px]">{isZh ? "已选择" : "Selected"}</Badge>}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              {/* Compose */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">{isZh ? "编辑通知内容" : "Compose Notification"}</p>
                <Select value={notifyTarget} onValueChange={setNotifyTarget}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isZh ? `全部参与者 (${stats.total}人)` : `All (${stats.total})`}</SelectItem>
                    <SelectItem value="confirmed">{isZh ? `已确认+已报名 (${stats.confirmed + stats.registered}人)` : `Confirmed+Registered (${stats.confirmed + stats.registered})`}</SelectItem>
                    <SelectItem value="no_checkin">{isZh ? `未签到 (${stats.total - stats.checkedIn}人)` : `Not Checked In (${stats.total - stats.checkedIn})`}</SelectItem>
                    <SelectItem value="selected">{isZh ? `已选中 (${selectedIds.size}人)` : `Selected (${selectedIds.size})`}</SelectItem>
                  </SelectContent>
                </Select>

                <div className="space-y-2">
                  {(() => {
                    const templates = [
                      { zh: "您好{name}，\u201C{event}\u201D即将开始，请准时到场！", en: "Hi {name}, '{event}' is starting soon!" },
                      { zh: "您好{name}，请确认是否参加\u201C{event}\u201D", en: "Hi {name}, please confirm for '{event}'" },
                    ];
                    return (
                      <div className="flex gap-2 flex-wrap">
                        {templates.map((tpl, i) => (
                          <Button key={i} size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setNotifyMessage(isZh ? tpl.zh : tpl.en)}>
                            {(isZh ? tpl.zh : tpl.en).replace(/\{.*?\}/g, "...").substring(0, 20)}...
                          </Button>
                        ))}
                      </div>
                    );
                  })()}
                  <Textarea value={notifyMessage} onChange={e => setNotifyMessage(e.target.value)} rows={3} className="text-xs" placeholder={isZh ? "输入通知内容，支持 {name} {event} 变量" : "Enter message with {name} {event} vars"} />
                </div>

                <Button className="gap-1.5 w-full" onClick={handleSendNotification} disabled={!notifyMessage.trim() || notifySending}>
                  {notifySending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {notifySending ? (isZh ? "发送中..." : "Sending...") : (isZh ? "发送通知" : "Send")}
                </Button>
              </div>

              <Separator />

              {/* Auto Reminder Rules */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{isZh ? "自动提醒规则" : "Auto Reminder Rules"}</p>
                  <Badge variant="outline" className="text-[9px] gap-1"><Clock className="w-2.5 h-2.5" />{isZh ? "每15分钟检查" : "Every 15min"}</Badge>
                </div>
                {rulesLoading ? (
                  <div className="text-center py-4"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
                ) : reminderRules.length > 0 ? (
                  <div className="space-y-1.5">
                    {reminderRules.map(rule => (
                      <div key={rule.id} className="flex items-center justify-between p-2.5 rounded-md border border-border bg-card text-xs">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{isZh ? rule.rule_name_zh : rule.rule_name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {isZh ? `${rule.trigger_relative_to === "event_start" ? "活动开始" : "活动结束"}${rule.trigger_offset_minutes > 0 ? "后" : "前"}${Math.abs(rule.trigger_offset_minutes)}分钟` : `${Math.abs(rule.trigger_offset_minutes)}min ${rule.trigger_offset_minutes > 0 ? "after" : "before"} ${rule.trigger_relative_to}`}
                            {" · "}{rule.channel}
                          </p>
                        </div>
                        <Button size="sm" variant={rule.is_active ? "default" : "secondary"} className="h-6 text-[9px] gap-1 ml-2" onClick={() => handleToggleRule(rule.id, rule.is_active)}>
                          {rule.is_active ? (isZh ? "已启用" : "Active") : (isZh ? "已禁用" : "Inactive")}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">{isZh ? "暂无规则" : "No rules"}</p>
                )}
              </div>

              {/* History */}
              {notifyHistory.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">{isZh ? "发送记录" : "Send History"}</p>
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                      {notifyHistory.map((h: any) => (
                        <div key={h.id} className="flex items-center justify-between p-2 rounded-md border border-border bg-card text-xs">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[8px] px-1 h-3.5">{h.channel}</Badge>
                              <span className="font-medium text-foreground">{isZh ? `${h.recipient_count} 人` : `${h.recipient_count} sent`}</span>
                              <Badge variant={h.status === "sent" ? "default" : "destructive"} className="text-[8px] px-1 h-3.5">
                                {h.status === "sent" ? (isZh ? "已发送" : "Sent") : (isZh ? "失败" : "Failed")}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[300px]">{h.message_template}</p>
                          </div>
                          <div className="text-right text-[10px] text-muted-foreground ml-2 shrink-0">
                            <p>{h.sent_at ? new Date(h.sent_at).toLocaleString(isZh ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ""}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cross-Event Analysis */}
        <TabsContent value="analysis" className="mt-3 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-primary" />{isZh ? "跨活动参与者关联分析" : "Cross-Event Participant Analysis"}</CardTitle>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={loadCrossEventAnalysis}>
                  <RefreshCw className="w-3 h-3" />{isZh ? "刷新" : "Refresh"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">{isZh ? "展示参加过多个活动的回头客，帮助识别忠实客户群" : "Shows repeat attendees across events for loyalty insights"}</p>

              {crossEventLoading ? (
                <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
              ) : crossEventData.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Repeat className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  {isZh ? "暂无跨活动数据，需要至少在两个活动中有相同参与者" : "No cross-event data yet. Need same participants across multiple events."}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="bg-card">
                      <CardContent className="pt-3 pb-2 px-3 text-center">
                        <p className="text-xl font-bold text-foreground">{crossEventData.length}</p>
                        <p className="text-[10px] text-muted-foreground">{isZh ? "回头客" : "Repeat Visitors"}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card">
                      <CardContent className="pt-3 pb-2 px-3 text-center">
                        <p className="text-xl font-bold text-primary">{crossEventData.length > 0 ? (crossEventData.reduce((s, d) => s + d.eventCount, 0) / crossEventData.length).toFixed(1) : 0}</p>
                        <p className="text-[10px] text-muted-foreground">{isZh ? "平均参与次数" : "Avg Events"}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card">
                      <CardContent className="pt-3 pb-2 px-3 text-center">
                        <p className="text-xl font-bold text-green-600">{crossEventData.filter(d => d.eventCount >= 3).length}</p>
                        <p className="text-[10px] text-muted-foreground">{isZh ? "忠实客户(3+)" : "Loyal (3+)"}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
                    {crossEventData.map((d, i) => (
                      <div key={d.phone} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                            {d.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-foreground">{d.name}</span>
                              {d.eventCount >= 3 && <Badge className="text-[8px] px-1 h-3.5 bg-yellow-500">⭐</Badge>}
                            </div>
                            <span className="text-muted-foreground">{d.phone}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">{d.eventCount} {isZh ? "次活动" : "events"}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{d.events.join(", ")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventParticipantManager;
