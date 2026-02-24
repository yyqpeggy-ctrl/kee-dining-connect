import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Target, Users, TrendingUp, Sparkles, UserPlus, Filter, BarChart3, Zap, RefreshCw, Copy, Send, Star, ArrowUpRight, Edit, Trash2, X, Globe, MapPin, Sliders } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Lead = Tables<"leads">;

const AICustomerAcquisitionTab = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const { currentStore } = useStore();
  const isHQ = currentStore.id === "hq";

  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");

  // Lead form state
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", wechat: "", email: "", source: "manual", score: 50, status: "new", tags: "", notes: "" });

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterChannel, setFilterChannel] = useState<"all" | "online" | "offline">("all");
  const [filterSource, setFilterSource] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterScoreMin, setFilterScoreMin] = useState(0);
  const [filterScoreMax, setFilterScoreMax] = useState(100);

  const onlineSources = isZh
    ? ["小红书", "大众点评", "微信群", "企业微信", "抖音", "微博", "LinkedIn"]
    : ["Xiaohongshu", "Dianping", "WeChat Group", "WeCom", "Douyin", "Weibo", "LinkedIn"];
  const offlineSources = isZh
    ? ["线下活动", "门店到访", "朋友推荐", "传单", "电话咨询"]
    : ["Offline Event", "Walk-in", "Referral", "Flyer", "Phone Inquiry"];
  const allSources = [...onlineSources, ...offlineSources, "manual"];

  const getChannelCategory = (source: string): "online" | "offline" => {
    if (offlineSources.includes(source)) return "offline";
    return "online";
  };

  const filteredLeads = leads.filter(lead => {
    if (filterChannel !== "all" && getChannelCategory(lead.source) !== filterChannel) return false;
    if (filterSource !== "all" && lead.source !== filterSource) return false;
    if (filterStatus !== "all" && lead.status !== filterStatus) return false;
    if (lead.score < filterScoreMin || lead.score > filterScoreMax) return false;
    return true;
  });

  const activeFilterCount = [
    filterChannel !== "all",
    filterSource !== "all",
    filterStatus !== "all",
    filterScoreMin > 0 || filterScoreMax < 100,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterChannel("all");
    setFilterSource("all");
    setFilterStatus("all");
    setFilterScoreMin(0);
    setFilterScoreMax(100);
  };

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (!isHQ) {
      query = query.eq("store_id", currentStore.id);
    }
    const { data, error } = await query;
    if (!error) setLeads(data || []);
    else toast.error(isZh ? "加载线索失败" : "Failed to load leads");
    setLoading(false);
  }, [currentStore.id, isHQ, isZh]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleSaveLead = async () => {
    const payload = {
      name: leadForm.name,
      phone: leadForm.phone,
      wechat: leadForm.wechat,
      email: leadForm.email,
      source: leadForm.source,
      score: leadForm.score,
      status: leadForm.status,
      tags: leadForm.tags ? leadForm.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      notes: leadForm.notes,
      store_id: currentStore.id,
      store_name_zh: currentStore.name,
      store_name_en: currentStore.nameEn,
    };

    if (editingLead) {
      const { error } = await supabase.from("leads").update(payload).eq("id", editingLead.id);
      if (error) { toast.error(isZh ? "更新失败" : "Update failed"); return; }
      toast.success(isZh ? "线索已更新" : "Lead updated");
    } else {
      const { error } = await supabase.from("leads").insert(payload);
      if (error) { toast.error(isZh ? "添加失败" : "Add failed"); return; }
      toast.success(isZh ? "线索已添加" : "Lead added");
    }
    setShowLeadDialog(false);
    setEditingLead(null);
    fetchLeads();
  };

  const handleDeleteLead = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (!error) { toast.success(isZh ? "已删除" : "Deleted"); fetchLeads(); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (!error) { toast.success(isZh ? "状态已更新" : "Status updated"); fetchLeads(); }
  };

  const openAddDialog = () => {
    setEditingLead(null);
    setLeadForm({ name: "", phone: "", wechat: "", email: "", source: "manual", score: 50, status: "new", tags: "", notes: "" });
    setShowLeadDialog(true);
  };

  const openEditDialog = (lead: Lead) => {
    setEditingLead(lead);
    setLeadForm({
      name: lead.name, phone: lead.phone || "", wechat: lead.wechat || "", email: lead.email || "",
      source: lead.source, score: lead.score, status: lead.status,
      tags: (lead.tags || []).join(", "), notes: lead.notes || "",
    });
    setShowLeadDialog(true);
  };

  const handleAIGenerate = async (type: string) => {
    setGenerating(true);
    try {
      const systemPrompt = isZh
        ? `你是一个专业的餐饮行业营销策略师。请根据用户的需求生成${type === "strategy" ? "获客策略方案" : type === "copy" ? "营销文案" : "客户画像分析"}。`
        : `You are a professional F&B marketing strategist. Generate ${type === "strategy" ? "customer acquisition strategy" : type === "copy" ? "marketing copy" : "customer profile analysis"}.`;

      const userPrompt = prompt || (isZh ? "为我的餐饮门店生成一个针对年轻白领客群的获客方案" : "Generate a customer acquisition plan targeting young professionals");

      const response = await supabase.functions.invoke("ai-topic-suggest", {
        body: { prompt: userPrompt, systemPrompt, type },
      });

      if (response.error) throw response.error;
      setGeneratedContent(response.data?.suggestion || response.data?.content || "");
      toast.success(isZh ? "AI 内容生成成功" : "AI content generated");
    } catch {
      setGeneratedContent(isZh
        ? `📋 获客策略方案\n\n🎯 目标客群：25-35岁城市白领\n\n📱 渠道策略：\n1. 小红书种草 - 发布精美探店笔记\n2. 大众点评优化 - 提升评分至4.8+\n3. 微信社群运营 - 建立会员群\n4. 抖音短视频 - 菜品制作过程\n\n📊 预期效果：\n- 月均新客增长：150-200人\n- 转化率：3.5-5%\n- ROI：1:4.2`
        : `📋 Acquisition Strategy\n\n🎯 Target: 25-35 urban professionals\n\n📱 Channels:\n1. Social media content\n2. Review platform optimization\n3. WeChat community\n4. Short video content\n\n📊 Expected:\n- Monthly new customers: 150-200\n- Conversion: 3.5-5%\n- ROI: 1:4.2`
      );
      toast.success(isZh ? "已生成示例方案" : "Demo strategy generated");
    } finally {
      setGenerating(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100 dark:bg-green-900/30";
    if (score >= 60) return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
    return "text-red-600 bg-red-100 dark:bg-red-900/30";
  };

  const statusOptions = [
    { value: "new", label: isZh ? "新线索" : "New" },
    { value: "contacted", label: isZh ? "已联系" : "Contacted" },
    { value: "interested", label: isZh ? "有意向" : "Interested" },
    { value: "converted", label: isZh ? "已转化" : "Converted" },
    { value: "lost", label: isZh ? "已流失" : "Lost" },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      new: { label: isZh ? "新线索" : "New", variant: "default" },
      contacted: { label: isZh ? "已联系" : "Contacted", variant: "secondary" },
      interested: { label: isZh ? "有意向" : "Interested", variant: "outline" },
      converted: { label: isZh ? "已转化" : "Converted", variant: "default" },
      lost: { label: isZh ? "已流失" : "Lost", variant: "destructive" },
    };
    const info = map[status] || map.new;
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const totalLeads = leads.length;
  const convertedCount = leads.filter(l => l.status === "converted").length;
  const conversionRate = totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : "0";
  const newLeadsCount = leads.filter(l => l.status === "new").length;

  return (
    <div className="space-y-4">
      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isZh ? "总线索数" : "Total Leads"}</p>
                <p className="text-2xl font-bold text-foreground">{totalLeads}</p>
              </div>
              <UserPlus className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isZh ? "新线索" : "New Leads"}</p>
                <p className="text-2xl font-bold text-foreground">{newLeadsCount}</p>
              </div>
              <Target className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isZh ? "转化率" : "Conversion"}</p>
                <p className="text-2xl font-bold text-foreground">{conversionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isZh ? "已转化" : "Converted"}</p>
                <p className="text-2xl font-bold text-foreground">{convertedCount}</p>
              </div>
              <Zap className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5"><Brain className="w-3.5 h-3.5" />{isZh ? "AI 策略生成" : "AI Strategy"}</TabsTrigger>
          <TabsTrigger value="leads" className="gap-1.5"><Users className="w-3.5 h-3.5" />{isZh ? "线索管理" : "Lead Management"}</TabsTrigger>
        </TabsList>

        {/* AI Strategy Generator */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4 text-primary" />
                {isZh ? "AI 智能获客助手" : "AI Customer Acquisition Assistant"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder={isZh ? "描述你的获客需求..." : "Describe your acquisition needs..."}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => handleAIGenerate("strategy")} disabled={generating} size="sm">
                    <Brain className="w-3.5 h-3.5 mr-1.5" />
                    {generating ? (isZh ? "生成中..." : "Generating...") : (isZh ? "生成获客策略" : "Generate Strategy")}
                  </Button>
                  <Button onClick={() => handleAIGenerate("copy")} disabled={generating} variant="outline" size="sm">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    {isZh ? "生成营销文案" : "Generate Copy"}
                  </Button>
                  <Button onClick={() => handleAIGenerate("profile")} disabled={generating} variant="outline" size="sm">
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    {isZh ? "客户画像分析" : "Profile Analysis"}
                  </Button>
                </div>
              </div>

              {generatedContent && (
                <div className="bg-muted/50 border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      {isZh ? "AI 生成结果" : "AI Generated Result"}
                    </h4>
                    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(generatedContent); toast.success(isZh ? "已复制" : "Copied"); }}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <pre className="text-sm whitespace-pre-wrap text-foreground/80 font-sans">{generatedContent}</pre>
                </div>
              )}

              {/* Quick Templates */}
              <div>
                <h4 className="text-sm font-medium mb-2">{isZh ? "快捷模板" : "Quick Templates"}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    { icon: <Users className="w-4 h-4" />, label: isZh ? "年轻白领获客" : "Young Professionals", p: isZh ? "为餐饮门店生成针对25-35岁城市白领的获客方案" : "Generate plan for 25-35 urban professionals" },
                    { icon: <Star className="w-4 h-4" />, label: isZh ? "家庭亲子引流" : "Family Engagement", p: isZh ? "设计一个吸引家庭客群的周末活动引流方案" : "Design a weekend family event plan" },
                    { icon: <Zap className="w-4 h-4" />, label: isZh ? "企业团建开发" : "Corporate Events", p: isZh ? "制定针对周边企业的团建获客策略" : "Create corporate team building strategy" },
                  ].map((tpl, idx) => (
                    <button key={idx} onClick={() => setPrompt(tpl.p)} className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent text-left text-sm transition-colors">
                      <span className="text-primary">{tpl.icon}</span>
                      <span>{tpl.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lead Management */}
        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">{isZh ? "线索池" : "Lead Pool"}</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant={showFilters ? "secondary" : "outline"} onClick={() => setShowFilters(!showFilters)}>
                  <Sliders className="w-3.5 h-3.5 mr-1.5" />
                  {isZh ? "筛选" : "Filter"}
                  {activeFilterCount > 0 && (
                    <Badge variant="default" className="ml-1.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]">{activeFilterCount}</Badge>
                  )}
                </Button>
                <Button size="sm" onClick={openAddDialog}><UserPlus className="w-3.5 h-3.5 mr-1.5" />{isZh ? "添加线索" : "Add Lead"}</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Filter Panel */}
              {showFilters && (
                <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5" />
                      {isZh ? "筛选条件" : "Filters"}
                    </h4>
                    {activeFilterCount > 0 && (
                      <Button size="sm" variant="ghost" onClick={clearFilters} className="h-7 text-xs">
                        <X className="w-3 h-3 mr-1" />{isZh ? "清除筛选" : "Clear"}
                      </Button>
                    )}
                  </div>

                  {/* Channel Category: Online / Offline */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{isZh ? "渠道类型" : "Channel Type"}</label>
                    <div className="flex gap-1.5">
                      {([
                        { value: "all", label: isZh ? "全部" : "All", icon: null },
                        { value: "online", label: isZh ? "线上渠道" : "Online", icon: <Globe className="w-3.5 h-3.5" /> },
                        { value: "offline", label: isZh ? "线下渠道" : "Offline", icon: <MapPin className="w-3.5 h-3.5" /> },
                      ] as const).map(ch => (
                        <button
                          key={ch.value}
                          onClick={() => { setFilterChannel(ch.value); setFilterSource("all"); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                            filterChannel === ch.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground border-border hover:bg-accent"
                          }`}
                        >
                          {ch.icon}{ch.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Source Filter */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{isZh ? "具体来源" : "Source"}</label>
                      <Select value={filterSource} onValueChange={setFilterSource}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="all">{isZh ? "全部来源" : "All Sources"}</SelectItem>
                          {filterChannel === "all" && (
                            <>
                              <SelectItem value="__online_header" disabled className="font-semibold text-xs text-muted-foreground">
                                ── {isZh ? "线上渠道" : "Online"} ──
                              </SelectItem>
                              {onlineSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                              <SelectItem value="__offline_header" disabled className="font-semibold text-xs text-muted-foreground">
                                ── {isZh ? "线下渠道" : "Offline"} ──
                              </SelectItem>
                              {offlineSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                              <SelectItem value="manual">{isZh ? "手动录入" : "Manual"}</SelectItem>
                            </>
                          )}
                          {filterChannel === "online" && onlineSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          {filterChannel === "offline" && offlineSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{isZh ? "线索状态" : "Status"}</label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="all">{isZh ? "全部状态" : "All Statuses"}</SelectItem>
                          {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Score Range */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{isZh ? "评分范围" : "Score Range"}</label>
                      <div className="flex items-center gap-2">
                        <Input type="number" min={0} max={100} value={filterScoreMin} onChange={e => setFilterScoreMin(Number(e.target.value))} className="h-8 text-xs w-16" placeholder="Min" />
                        <span className="text-xs text-muted-foreground">–</span>
                        <Input type="number" min={0} max={100} value={filterScoreMax} onChange={e => setFilterScoreMax(Number(e.target.value))} className="h-8 text-xs w-16" placeholder="Max" />
                      </div>
                    </div>
                  </div>

                  {/* Filter summary */}
                  <p className="text-xs text-muted-foreground">
                    {isZh ? `共 ${filteredLeads.length} 条线索（总计 ${leads.length} 条）` : `${filteredLeads.length} of ${leads.length} leads shown`}
                  </p>
                </div>
              )}

              {loading ? (
                <p className="text-center text-muted-foreground py-8">{isZh ? "加载中..." : "Loading..."}</p>
              ) : filteredLeads.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {leads.length === 0
                    ? (isZh ? "暂无线索数据" : "No leads yet")
                    : (isZh ? "没有符合筛选条件的线索" : "No leads match filters")}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isZh ? "姓名" : "Name"}</TableHead>
                      <TableHead>{isZh ? "联系方式" : "Contact"}</TableHead>
                      <TableHead>{isZh ? "渠道" : "Channel"}</TableHead>
                      <TableHead>{isZh ? "来源" : "Source"}</TableHead>
                      <TableHead>{isZh ? "评分" : "Score"}</TableHead>
                      <TableHead>{isZh ? "标签" : "Tags"}</TableHead>
                      <TableHead>{isZh ? "状态" : "Status"}</TableHead>
                      {isHQ && <TableHead>{isZh ? "门店" : "Store"}</TableHead>}
                      <TableHead>{isZh ? "AI 洞察" : "AI Insight"}</TableHead>
                      <TableHead>{isZh ? "操作" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {lead.phone && <div>{lead.phone}</div>}
                          {lead.wechat && <div>WeChat: {lead.wechat}</div>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getChannelCategory(lead.source) === "online" ? "default" : "secondary"} className="text-xs">
                            {getChannelCategory(lead.source) === "online"
                              ? <><Globe className="w-3 h-3 mr-1" />{isZh ? "线上" : "Online"}</>
                              : <><MapPin className="w-3 h-3 mr-1" />{isZh ? "线下" : "Offline"}</>}
                          </Badge>
                        </TableCell>
                        <TableCell><Badge variant="outline">{lead.source}</Badge></TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${scoreColor(lead.score)}`}>
                            {lead.score}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(lead.tags || []).map((tag, i) => <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select value={lead.status} onValueChange={(v) => handleStatusChange(lead.id, v)}>
                            <SelectTrigger className="w-24 h-7 text-xs">{statusBadge(lead.status)}</SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              {statusOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        {isHQ && <TableCell className="text-xs">{isZh ? lead.store_name_zh : lead.store_name_en}</TableCell>}
                        <TableCell className="max-w-[180px]">
                          <p className="text-xs text-muted-foreground truncate">{lead.ai_insight}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openEditDialog(lead)}><Edit className="w-3.5 h-3.5" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteLead(lead.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Lead Dialog */}
      <Dialog open={showLeadDialog} onOpenChange={setShowLeadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLead ? (isZh ? "编辑线索" : "Edit Lead") : (isZh ? "添加线索" : "Add Lead")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">{isZh ? "姓名" : "Name"} *</label>
              <Input value={leadForm.name} onChange={e => setLeadForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">{isZh ? "手机号" : "Phone"}</label>
                <Input value={leadForm.phone} onChange={e => setLeadForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">{isZh ? "微信" : "WeChat"}</label>
                <Input value={leadForm.wechat} onChange={e => setLeadForm(f => ({ ...f, wechat: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{isZh ? "邮箱" : "Email"}</label>
              <Input value={leadForm.email} onChange={e => setLeadForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">{isZh ? "来源" : "Source"}</label>
                <Select value={leadForm.source} onValueChange={v => setLeadForm(f => ({ ...f, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="manual">{isZh ? "手动录入" : "Manual"}</SelectItem>
                    <SelectItem value="__online_h" disabled className="font-semibold text-xs text-muted-foreground">── {isZh ? "线上渠道" : "Online"} ──</SelectItem>
                    {onlineSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    <SelectItem value="__offline_h" disabled className="font-semibold text-xs text-muted-foreground">── {isZh ? "线下渠道" : "Offline"} ──</SelectItem>
                    {offlineSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">{isZh ? "评分" : "Score"} (0-100)</label>
                <Input type="number" min={0} max={100} value={leadForm.score} onChange={e => setLeadForm(f => ({ ...f, score: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{isZh ? "状态" : "Status"}</label>
              <Select value={leadForm.status} onValueChange={v => setLeadForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{isZh ? "标签（逗号分隔）" : "Tags (comma separated)"}</label>
              <Input value={leadForm.tags} onChange={e => setLeadForm(f => ({ ...f, tags: e.target.value }))} placeholder={isZh ? "家庭客群, 高价值" : "Family, High Value"} />
            </div>
            <div>
              <label className="text-sm font-medium">{isZh ? "备注" : "Notes"}</label>
              <Textarea value={leadForm.notes} onChange={e => setLeadForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
            <Button onClick={handleSaveLead} className="w-full" disabled={!leadForm.name}>
              {editingLead ? (isZh ? "保存修改" : "Save Changes") : (isZh ? "添加线索" : "Add Lead")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AICustomerAcquisitionTab;
