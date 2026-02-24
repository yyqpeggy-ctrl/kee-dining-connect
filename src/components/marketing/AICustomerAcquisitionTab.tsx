import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Target, Users, TrendingUp, Sparkles, UserPlus, Filter, BarChart3, Zap, RefreshCw, Copy, Send, Star, ArrowUpRight } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LeadProfile {
  id: string;
  name: string;
  phone?: string;
  wechat?: string;
  source: string;
  score: number;
  tags: string[];
  status: "new" | "contacted" | "interested" | "converted" | "lost";
  aiInsight?: string;
  lastActivity?: string;
}

interface AcquisitionStrategy {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  channels: string[];
  estimatedReach: number;
  estimatedConversion: number;
  status: "draft" | "active" | "completed";
}

const AICustomerAcquisitionTab = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const { currentStore } = useStore();

  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [strategies, setStrategies] = useState<AcquisitionStrategy[]>([
    {
      id: "1",
      title: isZh ? "周末亲子活动引流" : "Weekend Family Event Acquisition",
      description: isZh ? "通过周末亲子手工活动吸引家庭客群，转化为长期会员" : "Attract family customers through weekend craft activities, convert to long-term members",
      targetAudience: isZh ? "25-40岁家庭客群" : "25-40 age families",
      channels: [isZh ? "小红书" : "Xiaohongshu", isZh ? "微信朋友圈" : "WeChat Moments", isZh ? "大众点评" : "Dianping"],
      estimatedReach: 5000,
      estimatedConversion: 3.2,
      status: "active",
    },
    {
      id: "2",
      title: isZh ? "企业团建套餐推广" : "Corporate Team Building Promotion",
      description: isZh ? "针对周边写字楼企业推出定制团建方案" : "Launch customized team building packages for nearby office buildings",
      targetAudience: isZh ? "企业HR/行政" : "Corporate HR/Admin",
      channels: [isZh ? "企业微信" : "WeCom", isZh ? "LinkedIn" : "LinkedIn"],
      estimatedReach: 2000,
      estimatedConversion: 5.5,
      status: "draft",
    },
  ]);

  const [leads] = useState<LeadProfile[]>([
    { id: "1", name: isZh ? "张小明" : "Zhang Xiaoming", phone: "138****5678", wechat: "zhangxm", source: isZh ? "小红书" : "Xiaohongshu", score: 85, tags: [isZh ? "家庭客群" : "Family", isZh ? "高价值" : "High Value"], status: "interested", aiInsight: isZh ? "多次浏览亲子活动页面，建议推送周末活动信息" : "Viewed family activities multiple times, recommend pushing weekend event info", lastActivity: "2h ago" },
    { id: "2", name: isZh ? "李婷" : "Li Ting", phone: "139****1234", source: isZh ? "大众点评" : "Dianping", score: 72, tags: [isZh ? "美食爱好者" : "Foodie"], status: "contacted", aiInsight: isZh ? "关注甜品类内容，可推荐下午茶体验" : "Interested in desserts, recommend afternoon tea experience", lastActivity: "1d ago" },
    { id: "3", name: isZh ? "王大伟" : "Wang Dawei", wechat: "wangdw_biz", source: isZh ? "企业微信" : "WeCom", score: 91, tags: [isZh ? "企业客户" : "Corporate", isZh ? "团建需求" : "Team Building"], status: "new", aiInsight: isZh ? "企业HR，近期有团建需求，建议尽快跟进" : "Corporate HR with upcoming team building needs, follow up ASAP", lastActivity: "30m ago" },
    { id: "4", name: isZh ? "陈美玲" : "Chen Meiling", phone: "136****9012", source: isZh ? "微信群" : "WeChat Group", score: 65, tags: [isZh ? "社区居民" : "Local Resident"], status: "new", aiInsight: isZh ? "通过社区群了解到门店，对周末活动感兴趣" : "Learned about store via community group, interested in weekend events", lastActivity: "5h ago" },
  ]);

  const [generatedContent, setGeneratedContent] = useState("");

  const handleAIGenerate = async (type: string) => {
    setGenerating(true);
    try {
      const systemPrompt = isZh
        ? `你是一个专业的餐饮行业营销策略师。请根据用户的需求生成${type === "strategy" ? "获客策略方案" : type === "copy" ? "营销文案" : "客户画像分析"}。要求：1. 针对中国市场 2. 结合线上线下渠道 3. 具体可执行 4. 包含预期效果`
        : `You are a professional F&B marketing strategist. Generate ${type === "strategy" ? "customer acquisition strategy" : type === "copy" ? "marketing copy" : "customer profile analysis"} based on user needs. Requirements: 1. Market-specific 2. Online & offline channels 3. Actionable 4. Include expected results`;

      const userPrompt = prompt || (isZh ? "为我的餐饮门店生成一个针对年轻白领客群的获客方案" : "Generate a customer acquisition plan targeting young professionals for my restaurant");

      const response = await supabase.functions.invoke("ai-topic-suggest", {
        body: { prompt: userPrompt, systemPrompt, type },
      });

      if (response.error) throw response.error;
      setGeneratedContent(response.data?.suggestion || response.data?.content || (isZh ? "AI 生成内容将显示在这里" : "AI generated content will appear here"));
      toast.success(isZh ? "AI 内容生成成功" : "AI content generated successfully");
    } catch (err) {
      console.error("AI generation error:", err);
      // Fallback demo content
      setGeneratedContent(isZh
        ? `📋 获客策略方案\n\n🎯 目标客群：25-35岁城市白领\n\n📱 渠道策略：\n1. 小红书种草 - 发布精美探店笔记，突出环境和特色菜品\n2. 大众点评优化 - 提升评分至4.8+，设置团购套餐引流\n3. 微信社群运营 - 建立会员群，每周推送专属优惠\n4. 抖音短视频 - 制作15秒菜品制作过程视频\n\n💰 预算分配：\n- 线上广告投放：40%\n- KOL合作：30%\n- 到店优惠：20%\n- 物料制作：10%\n\n📊 预期效果：\n- 月均新客增长：150-200人\n- 转化率：3.5-5%\n- ROI：1:4.2`
        : `📋 Acquisition Strategy\n\n🎯 Target: 25-35 urban professionals\n\n📱 Channel Strategy:\n1. Social media content - Post engaging food & ambiance content\n2. Review platform optimization - Achieve 4.8+ rating, set up group deals\n3. WeChat community - Build member groups, weekly exclusive offers\n4. Short video content - 15-sec recipe videos\n\n💰 Budget Allocation:\n- Online ads: 40%\n- KOL partnerships: 30%\n- In-store promotions: 20%\n- Materials: 10%\n\n📊 Expected Results:\n- Monthly new customers: 150-200\n- Conversion rate: 3.5-5%\n- ROI: 1:4.2`
      );
      toast.success(isZh ? "已生成示例方案" : "Demo strategy generated");
    } finally {
      setGenerating(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const statusBadge = (status: LeadProfile["status"]) => {
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

  return (
    <div className="space-y-4">
      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isZh ? "本月新线索" : "New Leads (Month)"}</p>
                <p className="text-2xl font-bold text-foreground">128</p>
                <p className="text-xs text-green-600 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />+23%</p>
              </div>
              <UserPlus className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isZh ? "转化率" : "Conversion Rate"}</p>
                <p className="text-2xl font-bold text-foreground">4.2%</p>
                <p className="text-xs text-green-600 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />+0.8%</p>
              </div>
              <Target className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isZh ? "获客成本" : "CAC"}</p>
                <p className="text-2xl font-bold text-foreground">¥38</p>
                <p className="text-xs text-green-600 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />-12%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{isZh ? "活跃策略" : "Active Strategies"}</p>
                <p className="text-2xl font-bold text-foreground">{strategies.filter(s => s.status === "active").length}</p>
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
          <TabsTrigger value="strategies" className="gap-1.5"><Target className="w-3.5 h-3.5" />{isZh ? "策略列表" : "Strategies"}</TabsTrigger>
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
                  placeholder={isZh ? "描述你的获客需求，例如：我想在周末吸引更多家庭客群到店消费..." : "Describe your acquisition needs, e.g.: I want to attract more families on weekends..."}
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
                    { icon: <Users className="w-4 h-4" />, label: isZh ? "年轻白领获客" : "Young Professionals", prompt: isZh ? "为餐饮门店生成针对25-35岁城市白领的获客方案，重点利用社交媒体和点评平台" : "Generate acquisition plan for 25-35 urban professionals using social media" },
                    { icon: <Star className="w-4 h-4" />, label: isZh ? "家庭亲子引流" : "Family Engagement", prompt: isZh ? "设计一个吸引家庭客群的周末活动引流方案，包含线上传播和到店体验" : "Design a weekend family event plan with online promotion and in-store experience" },
                    { icon: <Zap className="w-4 h-4" />, label: isZh ? "企业团建开发" : "Corporate Events", prompt: isZh ? "制定针对周边企业的团建和商务聚餐获客策略，包含BD拓展和套餐设计" : "Create corporate team building acquisition strategy with BD outreach and package design" },
                  ].map((tpl, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setPrompt(tpl.prompt); }}
                      className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent text-left text-sm transition-colors"
                    >
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
                <Button size="sm" variant="outline"><Filter className="w-3.5 h-3.5 mr-1.5" />{isZh ? "筛选" : "Filter"}</Button>
                <Button size="sm"><UserPlus className="w-3.5 h-3.5 mr-1.5" />{isZh ? "添加线索" : "Add Lead"}</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isZh ? "姓名" : "Name"}</TableHead>
                    <TableHead>{isZh ? "来源" : "Source"}</TableHead>
                    <TableHead>{isZh ? "AI 评分" : "AI Score"}</TableHead>
                    <TableHead>{isZh ? "标签" : "Tags"}</TableHead>
                    <TableHead>{isZh ? "状态" : "Status"}</TableHead>
                    <TableHead>{isZh ? "AI 洞察" : "AI Insight"}</TableHead>
                    <TableHead>{isZh ? "操作" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell><Badge variant="outline">{lead.source}</Badge></TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${scoreColor(lead.score)}`}>
                          {lead.score}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {lead.tags.map((tag, i) => <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell>{statusBadge(lead.status)}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-xs text-muted-foreground truncate">{lead.aiInsight}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost"><Send className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost"><RefreshCw className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategy List */}
        <TabsContent value="strategies" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategies.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{s.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                    </div>
                    <Badge variant={s.status === "active" ? "default" : s.status === "completed" ? "secondary" : "outline"}>
                      {s.status === "active" ? (isZh ? "执行中" : "Active") : s.status === "completed" ? (isZh ? "已完成" : "Done") : (isZh ? "草稿" : "Draft")}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {s.channels.map((ch, i) => <Badge key={i} variant="secondary" className="text-xs">{ch}</Badge>)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-muted-foreground text-xs">{isZh ? "目标客群" : "Target"}</p>
                      <p className="font-medium text-xs">{s.targetAudience}</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-muted-foreground text-xs">{isZh ? "预计触达" : "Est. Reach"}</p>
                      <p className="font-medium">{s.estimatedReach.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-muted-foreground text-xs">{isZh ? "预计转化" : "Est. Conv."}</p>
                      <p className="font-medium">{s.estimatedConversion}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AICustomerAcquisitionTab;
