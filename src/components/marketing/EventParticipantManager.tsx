import { useState, useMemo, useEffect, useCallback } from "react";
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
  Hash, Star, Loader2, ScanLine, AlertCircle, ChevronDown, ChevronUp
} from "lucide-react";

interface Participant {
  id: string;
  name: string;
  phone: string;
  wechat?: string;
  email?: string;
  source: "wechat_group" | "platform" | "manual" | "miniprogram";
  sourceDetail?: string;
  tags: string[];
  status: "registered" | "confirmed" | "checked_in" | "no_show" | "cancelled";
  ticketType: "standard" | "vip";
  isNewCustomer: boolean;
  registeredAt: string;
  checkedInAt?: string;
  eventCount: number; // how many events attended
  notes?: string;
  isDuplicate?: boolean;
  mergedFrom?: string[];
}

// Mock data generator
const generateMockParticipants = (): Participant[] => [
  { id: "p1", name: "张伟", phone: "13812345678", wechat: "zhangwei_wx", email: "zhangwei@example.com", source: "wechat_group", sourceDetail: "飞镖爱好者群", tags: ["飞镖常客", "VIP"], status: "checked_in", ticketType: "vip", isNewCustomer: false, registeredAt: "2026-02-20T10:30:00Z", checkedInAt: "2026-02-27T19:05:00Z", eventCount: 12 },
  { id: "p2", name: "李娜", phone: "13987654321", wechat: "lina2023", source: "platform", sourceDetail: "活动行", tags: ["运动达人"], status: "confirmed", ticketType: "standard", isNewCustomer: false, registeredAt: "2026-02-21T14:00:00Z", eventCount: 5 },
  { id: "p3", name: "王芳", phone: "15012340001", wechat: "wangfang_sh", source: "miniprogram", sourceDetail: "小程序报名", tags: ["新客户", "女性"], status: "registered", ticketType: "standard", isNewCustomer: true, registeredAt: "2026-02-22T09:00:00Z", eventCount: 0 },
  { id: "p4", name: "Mark Johnson", phone: "13700001111", wechat: "markj_cn", email: "mark.j@example.com", source: "manual", sourceDetail: "前台登记", tags: ["外籍", "常客"], status: "checked_in", ticketType: "vip", isNewCustomer: false, registeredAt: "2026-02-18T16:00:00Z", checkedInAt: "2026-02-27T18:55:00Z", eventCount: 20 },
  { id: "p5", name: "陈静", phone: "18612349876", source: "wechat_group", sourceDetail: "周五活动群", tags: ["飞镖常客"], status: "confirmed", ticketType: "standard", isNewCustomer: false, registeredAt: "2026-02-23T11:30:00Z", eventCount: 8 },
  { id: "p6", name: "赵磊", phone: "13511112222", wechat: "zhaolei99", source: "platform", sourceDetail: "粗门", tags: ["运动达人", "社群KOL"], status: "no_show", ticketType: "standard", isNewCustomer: false, registeredAt: "2026-02-19T08:00:00Z", eventCount: 3 },
  { id: "p7", name: "Emily Chen", phone: "15898765432", email: "emily.c@company.com", source: "wechat_group", sourceDetail: "外籍朋友群", tags: ["外籍", "新客户"], status: "registered", ticketType: "standard", isNewCustomer: true, registeredAt: "2026-02-24T15:20:00Z", eventCount: 0 },
  { id: "p8", name: "刘洋", phone: "13612345555", wechat: "liuyang_dart", source: "platform", sourceDetail: "活动行", tags: ["飞镖常客", "VIP"], status: "checked_in", ticketType: "vip", isNewCustomer: false, registeredAt: "2026-02-20T12:00:00Z", checkedInAt: "2026-02-27T19:02:00Z", eventCount: 15 },
  { id: "p9", name: "Tom Wilson", phone: "13700002222", source: "manual", sourceDetail: "电话预约", tags: ["外籍"], status: "cancelled", ticketType: "standard", isNewCustomer: true, registeredAt: "2026-02-25T10:00:00Z", eventCount: 0 },
  { id: "p10", name: "孙丽丽", phone: "18700003333", wechat: "sunlili_fit", source: "miniprogram", sourceDetail: "小程序报名", tags: ["运动达人", "新客户", "女性"], status: "registered", ticketType: "standard", isNewCustomer: true, registeredAt: "2026-02-26T08:30:00Z", eventCount: 0 },
  { id: "p11", name: "张伟", phone: "13812345678", wechat: "zhangwei_wx2", source: "platform", sourceDetail: "粗门", tags: ["飞镖常客"], status: "confirmed", ticketType: "standard", isNewCustomer: false, registeredAt: "2026-02-21T09:00:00Z", eventCount: 12, isDuplicate: true, mergedFrom: ["p1"] },
  { id: "p12", name: "黄明", phone: "15600004444", wechat: "huangming_beer", source: "wechat_group", sourceDetail: "精酿啤酒群", tags: ["啤酒爱好者"], status: "confirmed", ticketType: "standard", isNewCustomer: false, registeredAt: "2026-02-22T17:00:00Z", eventCount: 6 },
];

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

  const [participants, setParticipants] = useState<Participant[]>(generateMockParticipants);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [wechatInput, setWechatInput] = useState(mockWechatMessages);
  const [aiParsing, setAiParsing] = useState(false);
  const [parsedResults, setParsedResults] = useState<any[]>([]);
  const [parseSummary, setParseSummary] = useState<any>(null);
  const [manualForm, setManualForm] = useState({ name: "", phone: "", wechat: "", email: "", ticketType: "standard" });
  const [notifyDialog, setNotifyDialog] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyTarget, setNotifyTarget] = useState("all");
  const [notifyChannel, setNotifyChannel] = useState("wechat_template");
  const [notifySending, setNotifySending] = useState(false);
  const [notifyHistory, setNotifyHistory] = useState<any[]>([]);
  const [reminderRules, setReminderRules] = useState<any[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);

  // Computed stats
  const stats = useMemo(() => {
    const unique = participants.filter(p => !p.isDuplicate);
    return {
      total: unique.length,
      checkedIn: unique.filter(p => p.status === "checked_in").length,
      confirmed: unique.filter(p => p.status === "confirmed").length,
      registered: unique.filter(p => p.status === "registered").length,
      noShow: unique.filter(p => p.status === "no_show").length,
      cancelled: unique.filter(p => p.status === "cancelled").length,
      newCustomers: unique.filter(p => p.isNewCustomer).length,
      vip: unique.filter(p => p.ticketType === "vip").length,
      duplicates: participants.filter(p => p.isDuplicate).length,
      bySource: {
        wechat_group: unique.filter(p => p.source === "wechat_group").length,
        platform: unique.filter(p => p.source === "platform").length,
        manual: unique.filter(p => p.source === "manual").length,
        miniprogram: unique.filter(p => p.source === "miniprogram").length,
      },
    };
  }, [participants]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    participants.forEach(p => p.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet);
  }, [participants]);

  const filtered = useMemo(() => {
    return participants.filter(p => {
      if (p.isDuplicate && !showDuplicates) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (sourceFilter !== "all" && p.source !== sourceFilter) return false;
      if (tagFilter !== "all" && !p.tags.includes(tagFilter)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.phone.includes(q) || (p.wechat || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [participants, statusFilter, sourceFilter, tagFilter, searchQuery, showDuplicates]);

  const statusIcons: Record<string, typeof CheckCircle2> = {
    checked_in: CheckCircle2, confirmed: UserCheck, registered: Clock, no_show: XCircle, cancelled: AlertCircle,
  };
  const statusLabels: Record<string, { zh: string; en: string; color: string }> = {
    checked_in: { zh: "已签到", en: "Checked In", color: "text-green-600" },
    confirmed: { zh: "已确认", en: "Confirmed", color: "text-blue-600" },
    registered: { zh: "已报名", en: "Registered", color: "text-yellow-600" },
    no_show: { zh: "未到场", en: "No Show", color: "text-red-500" },
    cancelled: { zh: "已取消", en: "Cancelled", color: "text-muted-foreground" },
  };
  const sourceLabels: Record<string, { zh: string; en: string; icon: typeof MessageSquare }> = {
    wechat_group: { zh: "微信群", en: "WeChat Group", icon: MessageSquare },
    platform: { zh: "平台同步", en: "Platform", icon: RefreshCw },
    manual: { zh: "手动录入", en: "Manual", icon: UserPlus },
    miniprogram: { zh: "小程序", en: "Mini Program", icon: Smartphone },
  };

  // AI Parse WeChat messages via real AI model
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
        const dups = data.participants.filter((p: any) => p.isDuplicate).length;
        toast({
          title: isZh ? "AI解析完成" : "AI Parsing Complete",
          description: isZh
            ? `识别出 ${data.participants.length} 条记录（${data.summary?.signupCount || 0} 报名，${data.summary?.inquiryCount || 0} 咨询，${dups} 重复）`
            : `Found ${data.participants.length} records (${data.summary?.signupCount || 0} signups, ${data.summary?.inquiryCount || 0} inquiries, ${dups} duplicates)`,
        });
      }
    } catch (err: any) {
      console.error("AI parse error:", err);
      toast({ title: isZh ? "AI解析失败" : "AI Parse Failed", description: err.message, variant: "destructive" });
    } finally {
      setAiParsing(false);
    }
  };

  const importParsed = () => {
    const signups = parsedResults.filter((p: any) => p.intent === "signup" && !p.isDuplicate);
    const added = signups.map((p: any, i: number) => ({
      id: `new_${Date.now()}_${i}`,
      name: p.name || "",
      phone: p.phone || "",
      wechat: p.wechat || undefined,
      email: p.email || undefined,
      source: "wechat_group" as const,
      sourceDetail: isZh ? "微信群AI解析" : "WeChat AI Parse",
      tags: p.isNewCustomer ? ["新客户"] : [],
      status: "registered" as const,
      ticketType: "standard" as const,
      isNewCustomer: p.isNewCustomer || false,
      registeredAt: new Date().toISOString(),
      eventCount: 0,
    }));
    setParticipants(prev => [...prev, ...added]);
    setParsedResults([]);
    setParseSummary(null);
    toast({ title: isZh ? "导入成功" : "Imported", description: isZh ? `新增 ${added.length} 位参与者` : `Added ${added.length} participants` });
  };

  const handleManualAdd = () => {
    if (!manualForm.name || !manualForm.phone) return;
    const dup = participants.find(p => p.phone === manualForm.phone);
    const newP: Participant = {
      id: `manual_${Date.now()}`,
      name: manualForm.name,
      phone: manualForm.phone,
      wechat: manualForm.wechat || undefined,
      email: manualForm.email || undefined,
      source: "manual",
      sourceDetail: isZh ? "手动添加" : "Manual entry",
      tags: [],
      status: "registered",
      ticketType: manualForm.ticketType as "standard" | "vip",
      isNewCustomer: !dup,
      registeredAt: new Date().toISOString(),
      eventCount: 0,
      isDuplicate: !!dup,
      mergedFrom: dup ? [dup.id] : undefined,
    };
    setParticipants(prev => [...prev, newP]);
    setManualForm({ name: "", phone: "", wechat: "", email: "", ticketType: "standard" });
    toast({
      title: dup ? (isZh ? "⚠️ 检测到重复" : "⚠️ Duplicate Detected") : (isZh ? "添加成功" : "Added"),
      description: dup ? (isZh ? `${manualForm.name} 已存在，已标记为重复` : `${manualForm.name} already exists, marked as duplicate`) : undefined,
      variant: dup ? "destructive" : "default",
    });
  };

  const handleCheckIn = (id: string) => {
    setParticipants(prev => prev.map(p =>
      p.id === id ? { ...p, status: "checked_in", checkedInAt: new Date().toISOString() } : p
    ));
    toast({ title: isZh ? "签到成功 ✅" : "Checked In ✅" });
  };

  const handleBatchCheckIn = () => {
    setParticipants(prev => prev.map(p =>
      selectedIds.has(p.id) ? { ...p, status: "checked_in", checkedInAt: new Date().toISOString() } : p
    ));
    toast({ title: isZh ? "批量签到成功" : "Batch Check-in Complete", description: isZh ? `${selectedIds.size} 人已签到` : `${selectedIds.size} checked in` });
    setSelectedIds(new Set());
  };

  const handleMergeDuplicates = () => {
    setParticipants(prev => prev.filter(p => !p.isDuplicate));
    toast({ title: isZh ? "去重完成" : "Dedup Complete", description: isZh ? `已合并 ${stats.duplicates} 条重复记录` : `Merged ${stats.duplicates} duplicates` });
  };

  const handleBatchTag = (tag: string) => {
    setParticipants(prev => prev.map(p =>
      selectedIds.has(p.id) && !p.tags.includes(tag) ? { ...p, tags: [...p.tags, tag] } : p
    ));
    setSelectedIds(new Set());
    toast({ title: isZh ? "标签已添加" : "Tags Added" });
  };

  // Load reminder rules and notification history from DB
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
    if (activeTab === "notify") {
      loadRules();
      loadHistory();
    }
  }, [activeTab, loadRules, loadHistory]);

  const handleSendNotification = async () => {
    if (!notifyMessage.trim()) return;
    
    // Get recipients based on target
    let recipients: { name: string; phone: string }[] = [];
    const unique = participants.filter(p => !p.isDuplicate);
    
    if (notifyTarget === "all") {
      recipients = unique.map(p => ({ name: p.name, phone: p.phone }));
    } else if (notifyTarget === "confirmed") {
      recipients = unique.filter(p => p.status === "confirmed" || p.status === "registered").map(p => ({ name: p.name, phone: p.phone }));
    } else if (notifyTarget === "no_checkin") {
      recipients = unique.filter(p => p.status !== "checked_in" && p.status !== "cancelled").map(p => ({ name: p.name, phone: p.phone }));
    } else if (notifyTarget === "selected") {
      recipients = unique.filter(p => selectedIds.has(p.id)).map(p => ({ name: p.name, phone: p.phone }));
    }

    if (recipients.length === 0) {
      toast({ title: isZh ? "无发送目标" : "No Recipients", variant: "destructive" });
      return;
    }

    setNotifySending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-event-notification", {
        body: {
          action: "send",
          eventId,
          eventName,
          eventDate: "",
          eventTime: "",
          channel: notifyChannel,
          targetType: notifyTarget,
          recipients,
          messageTemplate: notifyMessage,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: isZh ? "通知发送完成" : "Notification Sent",
        description: isZh
          ? `成功 ${data.delivered}/${data.totalSent}，失败 ${data.failed}`
          : `Delivered ${data.delivered}/${data.totalSent}, Failed ${data.failed}`,
      });
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
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{isZh ? "重复记录" : "Duplicates"}</p>
                <p className="text-xl font-bold text-orange-500">{stats.duplicates}</p>
                {stats.duplicates > 0 && (
                  <Button variant="link" size="sm" className="h-4 p-0 text-[10px] text-orange-500" onClick={handleMergeDuplicates}>
                    {isZh ? "一键合并" : "Merge All"}
                  </Button>
                )}
              </div>
              <Merge className="w-6 h-6 text-orange-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source breakdown mini badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">{isZh ? "来源分布：" : "Sources:"}</span>
        {Object.entries(stats.bySource).map(([src, count]) => {
          const sl = sourceLabels[src];
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
          <TabsTrigger value="overview" className="flex-1 gap-1 text-xs"><Users className="w-3 h-3" />{isZh ? "参与者列表" : "Participants"}</TabsTrigger>
          <TabsTrigger value="collect" className="flex-1 gap-1 text-xs"><Sparkles className="w-3 h-3" />{isZh ? "智能收集" : "Smart Collect"}</TabsTrigger>
          <TabsTrigger value="checkin" className="flex-1 gap-1 text-xs"><ScanLine className="w-3 h-3" />{isZh ? "签到管理" : "Check-in"}</TabsTrigger>
          <TabsTrigger value="notify" className="flex-1 gap-1 text-xs"><Bell className="w-3 h-3" />{isZh ? "通知提醒" : "Notify"}</TabsTrigger>
        </TabsList>

        {/* Participants List */}
        <TabsContent value="overview" className="mt-3 space-y-3">
          {/* Filters */}
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
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="h-8 w-[110px] text-xs"><Tag className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isZh ? "全部标签" : "All Tags"}</SelectItem>
                {allTags.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Batch actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-xs font-medium text-primary">{isZh ? `已选 ${selectedIds.size} 人` : `${selectedIds.size} selected`}</span>
              <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={handleBatchCheckIn}>
                <CheckCircle2 className="w-2.5 h-2.5" />{isZh ? "批量签到" : "Batch Check-in"}
              </Button>
              <Select onValueChange={handleBatchTag}>
                <SelectTrigger className="h-6 w-[100px] text-[10px]"><Tag className="w-2.5 h-2.5 mr-1" />{isZh ? "打标签" : "Add Tag"}</SelectTrigger>
                <SelectContent>
                  {["VIP", "飞镖常客", "运动达人", "新客户", "社群KOL", "外籍"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
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
              <label className="flex items-center gap-1 cursor-pointer">
                <Checkbox checked={showDuplicates} onCheckedChange={(c) => setShowDuplicates(!!c)} className="h-3 w-3" />
                <span className="text-[10px]">{isZh ? "显示重复" : "Show duplicates"}</span>
              </label>
            </div>
            <Button size="sm" variant="ghost" className="h-6 gap-1 text-[10px]"><Download className="w-2.5 h-2.5" />{isZh ? "导出" : "Export"}</Button>
          </div>

          {/* Participant rows */}
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {filtered.map(p => {
              const SIcon = statusIcons[p.status] || Clock;
              const sl = statusLabels[p.status];
              const srcL = sourceLabels[p.source];
              const SrcIcon = srcL.icon;
              return (
                <div key={p.id} className={`flex items-center justify-between p-2.5 rounded-lg border bg-card text-xs ${p.isDuplicate ? "border-orange-300 bg-orange-50/50 dark:bg-orange-950/20" : "border-border"}`}>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} className="h-3.5 w-3.5" />
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground">{p.name}</span>
                        {p.isDuplicate && <Badge variant="outline" className="text-[8px] px-1 h-3.5 text-orange-500 border-orange-300">{isZh ? "重复" : "Dup"}</Badge>}
                        {p.isNewCustomer && <Badge variant="secondary" className="text-[8px] px-1 h-3.5">{isZh ? "新" : "New"}</Badge>}
                        {p.ticketType === "vip" && <Badge className="text-[8px] px-1 h-3.5 bg-yellow-500">{`VIP`}</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Smartphone className="w-2.5 h-2.5" />{p.phone}</span>
                        {p.wechat && <span className="flex items-center gap-0.5"><MessageSquare className="w-2.5 h-2.5" />{p.wechat}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-0.5 max-w-[120px] justify-end">
                      {p.tags.slice(0, 2).map(t => <Badge key={t} variant="secondary" className="text-[8px] px-1 h-3.5">{t}</Badge>)}
                      {p.tags.length > 2 && <span className="text-[8px] text-muted-foreground">+{p.tags.length - 2}</span>}
                    </div>
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
                  </div>
                </div>
              );
            })}
          </div>
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
                <p className="text-xs text-muted-foreground">{isZh ? "粘贴微信群聊天记录，AI自动识别报名信息（姓名、手机号、微信号）" : "Paste WeChat group chat, AI extracts signup info"}</p>
                <Textarea value={wechatInput} onChange={e => setWechatInput(e.target.value)} rows={6} className="text-xs font-mono" placeholder={isZh ? "粘贴微信群聊天记录..." : "Paste chat messages..."} />
                <Button size="sm" className="w-full gap-1.5" onClick={handleAiParse} disabled={aiParsing || !wechatInput.trim()}>
                  {aiParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {aiParsing ? (isZh ? "AI解析中..." : "AI Parsing...") : (isZh ? "AI智能解析" : "AI Smart Parse")}
                </Button>

                {parsedResults.length > 0 && (
                  <div className="space-y-2">
                    <Separator />
                    {/* AI Summary */}
                    {parseSummary && (
                      <div className="flex flex-wrap gap-2 text-[10px]">
                        <Badge variant="secondary" className="gap-0.5"><UserPlus className="w-2.5 h-2.5" />{isZh ? "报名" : "Signup"}: {parseSummary.signupCount || 0}</Badge>
                        {(parseSummary.inquiryCount || 0) > 0 && <Badge variant="outline" className="gap-0.5"><Search className="w-2.5 h-2.5" />{isZh ? "咨询" : "Inquiry"}: {parseSummary.inquiryCount}</Badge>}
                        {(parseSummary.cancelCount || 0) > 0 && <Badge variant="outline" className="gap-0.5 text-red-500"><XCircle className="w-2.5 h-2.5" />{isZh ? "取消" : "Cancel"}: {parseSummary.cancelCount}</Badge>}
                        {(parseSummary.proxyCount || 0) > 0 && <Badge variant="outline" className="gap-0.5"><Users className="w-2.5 h-2.5" />{isZh ? "代报" : "Proxy"}: {parseSummary.proxyCount}</Badge>}
                        {(parseSummary.duplicateCount || 0) > 0 && <Badge variant="outline" className="gap-0.5 text-orange-500"><Merge className="w-2.5 h-2.5" />{isZh ? "重复" : "Dup"}: {parseSummary.duplicateCount}</Badge>}
                        {(parseSummary.newCustomerCount || 0) > 0 && <Badge variant="outline" className="gap-0.5 text-blue-500"><Star className="w-2.5 h-2.5" />{isZh ? "新客" : "New"}: {parseSummary.newCustomerCount}</Badge>}
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
                      <UserPlus className="w-3.5 h-3.5" />{isZh ? `导入 ${parsedResults.filter((p: any) => p.intent === "signup" && !p.isDuplicate).length} 位报名者` : `Import ${parsedResults.filter((p: any) => p.intent === "signup" && !p.isDuplicate).length} signups`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Manual / Import */}
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
                  <div className="flex gap-2">
                    <Select value={manualForm.ticketType} onValueChange={v => setManualForm(f => ({ ...f, ticketType: v }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">{isZh ? "标准票" : "Standard"}</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="h-8 gap-1 flex-1" onClick={handleManualAdd} disabled={!manualForm.name || !manualForm.phone}>
                      <UserPlus className="w-3.5 h-3.5" />{isZh ? "添加" : "Add"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5"><FileSpreadsheet className="w-4 h-4 text-green-600" />{isZh ? "Excel批量导入" : "Excel Import"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                    <p className="text-xs text-muted-foreground mb-2">{isZh ? "拖拽Excel文件到此处，或点击上传" : "Drag Excel file here or click to upload"}</p>
                    <Button size="sm" variant="outline" className="gap-1 text-xs"><Upload className="w-3 h-3" />{isZh ? "选择文件" : "Choose File"}</Button>
                    <p className="text-[10px] text-muted-foreground mt-2">{isZh ? "支持 .xlsx, .csv 格式，需包含姓名和手机号列" : "Supports .xlsx, .csv with name and phone columns"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-blue-500" />{isZh ? "小程序表单收集" : "Mini Program Form"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">{isZh ? "生成小程序报名表单链接，自动收集参与者信息" : "Generate mini program form link for auto collection"}</p>
                  <div className="flex gap-2">
                    <Input value={`wxmp://event/${eventId}/signup`} readOnly className="h-8 text-xs font-mono bg-muted" />
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => { navigator.clipboard.writeText(`wxmp://event/${eventId}/signup`); toast({ title: isZh ? "已复制" : "Copied" }); }}>
                      {isZh ? "复制" : "Copy"}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">{isZh ? `已通过小程序收集 ${stats.bySource.miniprogram} 人` : `${stats.bySource.miniprogram} collected via mini program`}</p>
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
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><ScanLine className="w-3 h-3" />{isZh ? "人脸签到" : "Face Check-in"}</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-[350px] overflow-y-auto">
                  {participants.filter(p => !p.isDuplicate && p.status !== "cancelled").map(p => {
                    const isIn = p.status === "checked_in";
                    return (
                      <div key={p.id} className={`flex items-center justify-between p-2 rounded-md border text-xs ${isIn ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" : "border-border bg-card"}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isIn ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-primary/10 text-primary"}`}>
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-medium text-foreground">{p.name}</span>
                            {p.ticketType === "vip" && <Badge className="text-[8px] px-1 h-3.5 ml-1 bg-yellow-500">VIP</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isIn ? (
                            <span className="text-green-600 text-[10px] flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              {p.checkedInAt ? new Date(p.checkedInAt).toLocaleTimeString(isZh ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ""}
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
                <Separator />
                <div className="space-y-2 text-xs">
                  <p className="font-medium text-foreground">{isZh ? "票种分布" : "Ticket Types"}</p>
                  <div className="flex justify-between"><span className="text-muted-foreground">{isZh ? "VIP票" : "VIP"}</span><span className="font-medium text-foreground">{stats.vip}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{isZh ? "标准票" : "Standard"}</span><span className="font-medium text-foreground">{stats.total - stats.vip}</span></div>
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
                  { id: "wechat_template", icon: MessageSquare, color: "text-green-600", zh: "微信模板消息", en: "WeChat Template", descZh: "通过微信公众号/服务号推送（模拟）", descEn: "Push via WeChat (mock mode)" },
                  { id: "sms", icon: Mail, color: "text-blue-500", zh: "短信通知", en: "SMS Notification", descZh: "通过短信网关发送提醒（模拟）", descEn: "Send reminders via SMS (mock mode)" },
                  { id: "miniprogram", icon: Smartphone, color: "text-purple-500", zh: "小程序推送", en: "Mini Program Push", descZh: "通过小程序订阅消息推送（模拟）", descEn: "Push via mini program (mock mode)" },
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
                    <SelectItem value="all">{isZh ? `全部参与者 (${stats.total}人)` : `All Participants (${stats.total})`}</SelectItem>
                    <SelectItem value="confirmed">{isZh ? `已确认+已报名 (${stats.confirmed + stats.registered}人)` : `Confirmed+Registered (${stats.confirmed + stats.registered})`}</SelectItem>
                    <SelectItem value="no_checkin">{isZh ? `未签到 (${stats.total - stats.checkedIn}人)` : `Not Checked In (${stats.total - stats.checkedIn})`}</SelectItem>
                    <SelectItem value="selected">{isZh ? `已选中 (${selectedIds.size}人)` : `Selected (${selectedIds.size})`}</SelectItem>
                  </SelectContent>
                </Select>

                <div className="space-y-2">
                  {(() => {
                    const templates = [
                      { zh: "您好{name}，\u201C{event}\u201D即将开始，请准时到场！", en: "Hi {name}, '{event}' is starting soon. See you there!" },
                      { zh: "您好{name}，请确认是否参加\u201C{event}\u201D", en: "Hi {name}, please confirm attendance for '{event}'" },
                      { zh: "通知：\u201C{event}\u201D活动时间/地点有变更", en: "Notice: '{event}' time/venue has changed" },
                      { zh: "很遗憾，\u201C{event}\u201D已取消，敬请谅解", en: "Unfortunately, '{event}' has been cancelled" },
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
                  <Textarea value={notifyMessage} onChange={e => setNotifyMessage(e.target.value)} rows={3} className="text-xs" placeholder={isZh ? "输入通知内容，支持使用 {name} {event} {date} {time} 等变量" : "Enter message. Use {name} {event} {date} {time} variables"} />
                </div>

                <div className="flex gap-2">
                  <Button className="gap-1.5 flex-1" onClick={handleSendNotification} disabled={!notifyMessage.trim() || notifySending}>
                    {notifySending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {notifySending ? (isZh ? "发送中..." : "Sending...") : (isZh ? "发送通知" : "Send Notification")}
                  </Button>
                  <Button variant="outline" className="gap-1.5">
                    <Clock className="w-3.5 h-3.5" />{isZh ? "定时发送" : "Schedule"}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Auto Reminder Rules from DB */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{isZh ? "自动提醒规则" : "Auto Reminder Rules"}</p>
                  <Badge variant="outline" className="text-[9px] gap-1"><Clock className="w-2.5 h-2.5" />{isZh ? "每15分钟检查" : "Checks every 15min"}</Badge>
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
                            {isZh ? `${rule.trigger_relative_to === "event_start" ? "活动开始" : "活动结束"}${rule.trigger_offset_minutes > 0 ? "后" : "前"}${Math.abs(rule.trigger_offset_minutes)}分钟` : `${Math.abs(rule.trigger_offset_minutes)}min ${rule.trigger_offset_minutes > 0 ? "after" : "before"} ${rule.trigger_relative_to === "event_start" ? "start" : "end"}`}
                            {" · "}{rule.channel === "all" ? (isZh ? "全渠道" : "All channels") : rule.channel}
                            {" · "}{isZh ? `目标: ${rule.target_type}` : `Target: ${rule.target_type}`}
                          </p>
                        </div>
                        <Button size="sm" variant={rule.is_active ? "default" : "secondary"} className="h-6 text-[9px] gap-1 ml-2" onClick={() => handleToggleRule(rule.id, rule.is_active)}>
                          {rule.is_active ? (isZh ? "已启用" : "Active") : (isZh ? "已禁用" : "Inactive")}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {[
                      { zh: "活动前24小时自动提醒已确认参与者", en: "Auto remind confirmed 24h before event", active: true },
                      { zh: "活动前2小时发送签到提醒", en: "Send check-in reminder 2h before event", active: true },
                      { zh: "活动结束后发送感谢消息及评价邀请", en: "Send thank you & review request after event", active: false },
                      { zh: "未签到者活动后30分钟标记为No Show", en: "Mark no-shows 30min after event start", active: true },
                    ].map((rule, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-md border border-border bg-card text-xs">
                        <span className="text-foreground">{isZh ? rule.zh : rule.en}</span>
                        <Badge variant={rule.active ? "default" : "secondary"} className="text-[9px]">{rule.active ? (isZh ? "已启用" : "Active") : (isZh ? "未启用" : "Inactive")}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notification History */}
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
                              <span className="font-medium text-foreground">{isZh ? `发送给 ${h.recipient_count} 人` : `Sent to ${h.recipient_count}`}</span>
                              <Badge variant={h.status === "sent" ? "default" : h.status === "failed" ? "destructive" : "secondary"} className="text-[8px] px-1 h-3.5">
                                {h.status === "sent" ? (isZh ? "已发送" : "Sent") : h.status === "failed" ? (isZh ? "失败" : "Failed") : h.status}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[300px]">{h.message_template}</p>
                          </div>
                          <div className="text-right text-[10px] text-muted-foreground ml-2 shrink-0">
                            <p>{h.delivery_stats?.delivered || 0}/{h.recipient_count} {isZh ? "送达" : "delivered"}</p>
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
      </Tabs>
    </div>
  );
};

export default EventParticipantManager;
