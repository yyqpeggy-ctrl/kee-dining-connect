import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Video, Lightbulb, Sparkles, Clock, TrendingUp, Send, Wand2, Palette, Film, Hash, CalendarClock, Eye, ThumbsUp, Target } from "lucide-react";
import { useTranslation } from "react-i18next";

const SocialMediaContentCreator = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const posterTemplates = [
    { id: "promo", name: isZh ? "促销海报" : "Promo Poster", desc: isZh ? "节日活动、限时优惠" : "Holiday deals, flash sales", color: "bg-red-500/10 text-red-500", icon: Target },
    { id: "newitem", name: isZh ? "新品发布" : "New Item Launch", desc: isZh ? "新菜品、新酒款推荐" : "New dishes, wines", color: "bg-blue-500/10 text-blue-500", icon: Sparkles },
    { id: "event", name: isZh ? "活动宣传" : "Event Promo", desc: isZh ? "品酒会、主题派对" : "Wine tasting, themed party", color: "bg-purple-500/10 text-purple-500", icon: CalendarClock },
    { id: "brand", name: isZh ? "品牌故事" : "Brand Story", desc: isZh ? "品牌理念、团队风采" : "Brand values, team spotlight", color: "bg-amber-500/10 text-amber-500", icon: Palette },
  ];

  const videoTemplates = [
    { id: "short", name: isZh ? "15秒短视频" : "15s Short", platform: "TikTok / 抖音", ratio: "9:16" },
    { id: "reel", name: isZh ? "60秒Reel" : "60s Reel", platform: "Instagram / 小红书", ratio: "9:16" },
    { id: "vlog", name: isZh ? "3分钟Vlog" : "3min Vlog", platform: "YouTube / B站", ratio: "16:9" },
    { id: "live", name: isZh ? "直播预告片" : "Live Preview", platform: isZh ? "全平台" : "All Platforms", ratio: "1:1" },
  ];

  const aiTopics = [
    { topic: isZh ? "🍷 周末微醺指南：5款适合夏夜的低度鸡尾酒" : "🍷 Weekend Sip Guide: 5 Low-ABV Cocktails for Summer Nights", score: 92, trend: "+18%", platform: isZh ? "小红书" : "Xiaohongshu" },
    { topic: isZh ? "🎉 隐藏酒单大公开！调酒师私藏配方" : "🎉 Secret Menu Revealed! Bartender's Hidden Recipes", score: 88, trend: "+25%", platform: "TikTok" },
    { topic: isZh ? "🌿 从农场到酒杯：我们的有机原料故事" : "🌿 Farm to Glass: Our Organic Ingredient Story", score: 85, trend: "+12%", platform: "WeChat" },
    { topic: isZh ? "💡 一分钟学会在家调Espresso Martini" : "💡 Make Espresso Martini at Home in 1 Min", score: 82, trend: "+30%", platform: "Instagram" },
    { topic: isZh ? "🎵 今晚的BGM是什么？酒吧氛围歌单分享" : "🎵 Tonight's Vibe? Our Bar Playlist Share", score: 78, trend: "+8%", platform: "YouTube" },
  ];

  const publishSchedule = [
    { time: isZh ? "周一 12:00" : "Mon 12:00", platform: isZh ? "微信公众号" : "WeChat", type: isZh ? "图文" : "Article", status: "scheduled" },
    { time: isZh ? "周二 18:30" : "Tue 18:30", platform: isZh ? "小红书" : "Xiaohongshu", type: isZh ? "海报+笔记" : "Poster+Note", status: "draft" },
    { time: isZh ? "周三 20:00" : "Wed 20:00", platform: "TikTok", type: isZh ? "短视频" : "Short Video", status: "scheduled" },
    { time: isZh ? "周四 12:00" : "Thu 12:00", platform: "Instagram", type: "Reel", status: "ai_ready" },
    { time: isZh ? "周五 19:00" : "Fri 19:00", platform: isZh ? "全平台" : "All", type: isZh ? "周末活动预告" : "Weekend Event", status: "draft" },
  ];

  const statusBadge = (s: string) => {
    if (s === "scheduled") return <Badge variant="default" className="text-[10px]">{isZh ? "已排期" : "Scheduled"}</Badge>;
    if (s === "ai_ready") return <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">{isZh ? "AI已生成" : "AI Ready"}</Badge>;
    return <Badge variant="secondary" className="text-[10px]">{isZh ? "草稿" : "Draft"}</Badge>;
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center gap-2">
        <Wand2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">{isZh ? "智能内容创作中心" : "AI Content Creation Hub"}</h3>
        <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">{isZh ? "AI 驱动" : "AI Powered"}</Badge>
      </div>

      <Tabs defaultValue="poster" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="poster" className="gap-1.5"><Image className="w-3.5 h-3.5" />{isZh ? "海报设计" : "Poster Design"}</TabsTrigger>
          <TabsTrigger value="video" className="gap-1.5"><Video className="w-3.5 h-3.5" />{isZh ? "视频剪辑" : "Video Edit"}</TabsTrigger>
          <TabsTrigger value="topics" className="gap-1.5"><Lightbulb className="w-3.5 h-3.5" />{isZh ? "智能推荐" : "AI Recommend"}</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5"><Send className="w-3.5 h-3.5" />{isZh ? "智能发布" : "Smart Publish"}</TabsTrigger>
        </TabsList>

        {/* Poster Design */}
        <TabsContent value="poster">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4 text-primary" />{isZh ? "AI 海报模板" : "AI Poster Templates"}</CardTitle>
                <CardDescription>{isZh ? "选择模板，AI 自动生成适合各平台的营销海报" : "Choose a template, AI generates marketing posters for each platform"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {posterTemplates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${selectedTemplate === t.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40"}`}
                    >
                      <div className={`w-10 h-10 rounded-lg ${t.color.split(" ")[0]} flex items-center justify-center mb-3`}>
                        <t.icon className={`w-5 h-5 ${t.color.split(" ")[1]}`} />
                      </div>
                      <p className="font-semibold text-sm text-foreground">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{t.desc}</p>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <Button className="gap-1.5" disabled={!selectedTemplate}>
                    <Sparkles className="w-3.5 h-3.5" />{isZh ? "AI 生成海报" : "Generate Poster"}
                  </Button>
                  <p className="text-xs text-muted-foreground">{isZh ? "将自动适配微信、小红书、Instagram 等平台尺寸" : "Auto-adapts to WeChat, Xiaohongshu, Instagram sizes"}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: isZh ? "本月生成" : "Generated This Month", value: "47", sub: isZh ? "张海报" : "posters" },
                { label: isZh ? "平均互动率" : "Avg Engagement", value: "4.8%", sub: isZh ? "高于行业均值32%" : "+32% vs industry" },
                { label: isZh ? "最佳模板" : "Best Template", value: isZh ? "促销海报" : "Promo", sub: isZh ? "转化率最高" : "Highest conversion" },
              ].map((s, i) => (
                <Card key={i}>
                  <CardContent className="pt-4 pb-3 text-center">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Video Edit */}
        <TabsContent value="video">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Film className="w-4 h-4 text-primary" />{isZh ? "AI 视频模板" : "AI Video Templates"}</CardTitle>
                <CardDescription>{isZh ? "上传素材，AI 自动剪辑生成适合各平台的短视频" : "Upload footage, AI auto-edits videos for each platform"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {videoTemplates.map((v) => (
                    <div key={v.id} className="p-4 rounded-xl border border-border hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                      <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center mb-3">
                        <Video className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="font-semibold text-sm text-foreground">{v.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[11px] text-muted-foreground">{v.platform}</p>
                        <Badge variant="outline" className="text-[10px]">{v.ratio}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <Button variant="outline" className="gap-1.5"><Video className="w-3.5 h-3.5" />{isZh ? "上传素材" : "Upload Footage"}</Button>
                  <Button className="gap-1.5"><Sparkles className="w-3.5 h-3.5" />{isZh ? "AI 智能剪辑" : "AI Auto-Edit"}</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{isZh ? "AI 剪辑建议" : "AI Editing Suggestions"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { tip: isZh ? "🎬 建议在前3秒加入吸睛画面（调酒特写/火焰效果），提升完播率" : "🎬 Add eye-catching visuals in first 3s (cocktail close-up/flame) to boost retention", impact: "+35%" },
                    { tip: isZh ? "🎵 当前热门BGM「Espresso」匹配度92%，建议使用" : "🎵 Trending BGM 'Espresso' has 92% match rate, recommend using", impact: "+22%" },
                    { tip: isZh ? "📝 添加字幕可提升静音播放场景下的互动率" : "📝 Adding subtitles improves engagement for muted playback", impact: "+18%" },
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-sm text-foreground flex-1">{tip.tip}</p>
                      <Badge className="ml-2 bg-green-500/10 text-green-600 border-green-500/20 shrink-0">{isZh ? `互动` : "Eng."} {tip.impact}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Topics */}
        <TabsContent value="topics">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />{isZh ? "AI 热门主题推荐" : "AI Trending Topics"}</CardTitle>
                    <CardDescription>{isZh ? "基于行业趋势和历史数据，AI 推荐最可能引流的内容主题" : "AI recommends topics most likely to drive traffic based on trends"}</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1"><Sparkles className="w-3 h-3" />{isZh ? "刷新推荐" : "Refresh"}</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {aiTopics.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{t.topic}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="outline" className="text-[10px]">{t.platform}</Badge>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-500" />{t.trend}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold text-primary">{t.score}</span>
                          <span className="text-[10px] text-muted-foreground">{isZh ? "分" : "pts"}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{isZh ? "引流指数" : "Traffic Score"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2"><Hash className="w-4 h-4" />{isZh ? "推荐标签" : "Recommended Tags"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(isZh
                      ? ["#周末微醺", "#鸡尾酒推荐", "#酒吧氛围", "#约会圣地", "#深夜食堂", "#调酒教程", "#限时优惠", "#新品上市", "#品酒会", "#城市夜生活"]
                      : ["#WeekendVibes", "#CocktailTime", "#BarLife", "#DateNight", "#LateNightBites", "#Mixology", "#FlashSale", "#NewMenu", "#WineTasting", "#NightLife"]
                    ).map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2"><Eye className="w-4 h-4" />{isZh ? "竞品热门内容" : "Competitor Trending"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { title: isZh ? "「隐藏菜单」类内容爆火" : "'Secret Menu' content trending", views: "50K+", icon: "🔥" },
                      { title: isZh ? "「调酒过程」短视频高转化" : "'Mixology Process' shorts converting", views: "30K+", icon: "📈" },
                      { title: isZh ? "「顾客故事」图文高互动" : "'Customer Stories' high engagement", views: "20K+", icon: "💬" },
                    ].map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <span className="text-sm text-foreground">{c.icon} {c.title}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{c.views}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Smart Publish */}
        <TabsContent value="schedule">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2"><CalendarClock className="w-4 h-4 text-primary" />{isZh ? "AI 智能发布排期" : "AI Smart Publish Schedule"}</CardTitle>
                    <CardDescription>{isZh ? "AI 分析最佳发布时间，自动排期实现最大曝光" : "AI analyzes optimal posting times for maximum exposure"}</CardDescription>
                  </div>
                  <Button size="sm" className="gap-1"><Sparkles className="w-3 h-3" />{isZh ? "AI 优化排期" : "Optimize Schedule"}</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {publishSchedule.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.time}</p>
                          <p className="text-[11px] text-muted-foreground">{s.platform} · {s.type}</p>
                        </div>
                      </div>
                      {statusBadge(s.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: isZh ? "最佳发布时间" : "Best Post Time", value: isZh ? "周三 20:00" : "Wed 8PM", sub: isZh ? "互动峰值时段" : "Peak engagement" },
                { label: isZh ? "本周计划" : "This Week Plan", value: "5", sub: isZh ? "条内容待发布" : "posts scheduled" },
                { label: isZh ? "AI 自动化率" : "AI Automation", value: "72%", sub: isZh ? "内容由AI辅助生成" : "AI-assisted content" },
              ].map((s, i) => (
                <Card key={i}>
                  <CardContent className="pt-4 pb-3 text-center">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialMediaContentCreator;
