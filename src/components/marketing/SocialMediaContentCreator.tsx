import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Image, ImagePlus, Video, Lightbulb, Sparkles, Clock, TrendingUp, Send, Wand2, Palette, Film, Hash, CalendarClock, Eye, ThumbsUp, Target, Upload, Play, Pause, Scissors, Music2, Type, RotateCcw, Check, X, FileVideo, Trash2, ChevronRight, Loader2, RefreshCw, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AISuggestion {
  tip: string;
  impact: string;
  category: string;
}

interface AIVideoResult {
  suggestions: AISuggestion[];
  recommended_bgm: { name: string; artist?: string; style: string; match_score: number }[];
  recommended_titles: string[];
  recommended_tags: string[];
  best_post_time: { day: string; time: string; reason: string };
}

interface AIPosterResult {
  headlines: { main_title: string; subtitle: string; body_copy: string; style: string }[];
  design_tips: { tip: string; category: string }[];
  platform_adaptations: { platform: string; size: string; copy_tip: string }[];
  recommended_tags: string[];
  color_palette: string[];
}

interface UploadedVideo {
  id: string;
  file: File;
  name: string;
  size: string;
  duration: string;
  url: string;
  thumbnail?: string;
}

interface EditTask {
  id: string;
  videoName: string;
  template: string;
  platform: string;
  status: "queued" | "processing" | "done" | "error";
  progress: number;
  outputUrl?: string;
  instructions: string;
}

const SocialMediaContentCreator = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([]);
  const [selectedVideoTemplate, setSelectedVideoTemplate] = useState<string | null>(null);
  const [editTasks, setEditTasks] = useState<EditTask[]>([]);
  const [editInstructions, setEditInstructions] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [videoStep, setVideoStep] = useState<"upload" | "edit" | "preview">("upload");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AIVideoResult | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [posterResult, setPosterResult] = useState<AIPosterResult | null>(null);
  const [isLoadingPoster, setIsLoadingPoster] = useState(false);
  const [posterInstructions, setPosterInstructions] = useState("");
  const [generatedPosterImage, setGeneratedPosterImage] = useState<string | null>(null);
  const [posterImageDesc, setPosterImageDesc] = useState<string>("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [selectedHeadlineIdx, setSelectedHeadlineIdx] = useState<number>(0);

  const fetchAISuggestions = async () => {
    const template = videoTemplates.find(t => t.id === (selectedVideoTemplate || "short"));
    setIsLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-video-suggest", {
        body: {
          videos: uploadedVideos.map(v => ({ name: v.name, duration: v.duration, size: v.size })),
          template: template?.name || "15s Short",
          platform: template?.platform || "TikTok",
          instructions: editInstructions || "",
          language: isZh ? "zh" : "en",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiSuggestions(data);
      toast.success(isZh ? "AI 建议已生成" : "AI suggestions generated");
    } catch (e: any) {
      console.error("AI suggest error:", e);
      toast.error(isZh ? `AI 建议生成失败: ${e.message}` : `AI suggestion failed: ${e.message}`);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const fetchPosterSuggestions = async () => {
    if (!selectedTemplate) {
      toast.error(isZh ? "请先选择海报模板" : "Please select a poster template");
      return;
    }
    const template = posterTemplates.find(t => t.id === selectedTemplate);
    if (!template) return;
    setIsLoadingPoster(true);
    setPosterResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-poster-suggest", {
        body: {
          template_id: template.id,
          template_name: template.name,
          template_desc: template.desc,
          extra_instructions: posterInstructions || "",
          language: isZh ? "zh" : "en",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPosterResult(data);
      toast.success(isZh ? "AI 文案已生成" : "AI copy generated");
    } catch (e: any) {
      console.error("Poster AI error:", e);
      toast.error(isZh ? `生成失败: ${e.message}` : `Generation failed: ${e.message}`);
    } finally {
      setIsLoadingPoster(false);
    }
  };

  const generatePosterImage = async (headlineIdx?: number) => {
    if (!posterResult || !selectedTemplate) {
      toast.error(isZh ? "请先生成AI文案" : "Please generate AI copy first");
      return;
    }
    const idx = headlineIdx ?? selectedHeadlineIdx;
    const headline = posterResult.headlines[idx];
    if (!headline) return;
    const template = posterTemplates.find(t => t.id === selectedTemplate);

    setIsGeneratingImage(true);
    setGeneratedPosterImage(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-poster-image", {
        body: {
          template_name: template?.name || "",
          headline: headline.main_title,
          subtitle: headline.subtitle,
          body_copy: headline.body_copy,
          style: headline.style,
          color_palette: posterResult.color_palette,
          extra_instructions: posterInstructions || "",
          language: isZh ? "zh" : "en",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setGeneratedPosterImage(data.image_url);
      setPosterImageDesc(data.description || "");
      toast.success(isZh ? "海报视觉稿已生成！" : "Poster visual generated!");
    } catch (e: any) {
      console.error("Poster image error:", e);
      toast.error(isZh ? `图片生成失败: ${e.message}` : `Image generation failed: ${e.message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);

    const newVideos: UploadedVideo[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("video/")) {
        toast.error(isZh ? `${file.name} 不是视频文件` : `${file.name} is not a video file`);
        continue;
      }
      if (file.size > 500 * 1024 * 1024) {
        toast.error(isZh ? `${file.name} 超过500MB限制` : `${file.name} exceeds 500MB limit`);
        continue;
      }
      const url = URL.createObjectURL(file);
      newVideos.push({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: formatFileSize(file.size),
        duration: "--:--",
        url,
      });
    }

    // Get video durations
    for (const v of newVideos) {
      try {
        const videoEl = document.createElement("video");
        videoEl.preload = "metadata";
        videoEl.src = v.url;
        await new Promise<void>((resolve) => {
          videoEl.onloadedmetadata = () => {
            const mins = Math.floor(videoEl.duration / 60);
            const secs = Math.floor(videoEl.duration % 60);
            v.duration = `${mins}:${secs.toString().padStart(2, "0")}`;
            resolve();
          };
          videoEl.onerror = () => resolve();
        });
      } catch { /* ignore */ }
    }

    setUploadedVideos(prev => [...prev, ...newVideos]);
    setIsUploading(false);
    if (newVideos.length > 0) {
      toast.success(isZh ? `已导入 ${newVideos.length} 个视频` : `Imported ${newVideos.length} video(s)`);
    }
    if (e.target) e.target.value = "";
  };

  const removeVideo = (id: string) => {
    setUploadedVideos(prev => {
      const v = prev.find(x => x.id === id);
      if (v) URL.revokeObjectURL(v.url);
      return prev.filter(x => x.id !== id);
    });
  };

  const startAIEdit = () => {
    if (uploadedVideos.length === 0) {
      toast.error(isZh ? "请先上传视频素材" : "Please upload videos first");
      return;
    }
    if (!selectedVideoTemplate) {
      toast.error(isZh ? "请选择剪辑模板" : "Please select a template");
      return;
    }

    const template = videoTemplates.find(t => t.id === selectedVideoTemplate);
    const newTasks: EditTask[] = uploadedVideos.map(v => ({
      id: crypto.randomUUID(),
      videoName: v.name,
      template: template?.name || "",
      platform: template?.platform || "",
      status: "queued" as const,
      progress: 0,
      instructions: editInstructions,
    }));

    setEditTasks(prev => [...prev, ...newTasks]);
    setVideoStep("edit");

    // Simulate AI processing
    newTasks.forEach((task, idx) => {
      setTimeout(() => {
        setEditTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "processing", progress: 0 } : t));
        const interval = setInterval(() => {
          setEditTasks(prev => prev.map(t => {
            if (t.id !== task.id) return t;
            const newProgress = Math.min(t.progress + Math.random() * 15, 100);
            if (newProgress >= 100) {
              clearInterval(interval);
              return { ...t, status: "done", progress: 100 };
            }
            return { ...t, progress: Math.round(newProgress) };
          }));
        }, 800);
      }, idx * 2000);
    });

    toast.info(isZh ? "AI 正在剪辑视频..." : "AI is editing videos...");
  };

  const handlePublish = (taskId: string) => {
    if (selectedPlatforms.length === 0) {
      toast.error(isZh ? "请选择发布平台" : "Select platforms to publish");
      return;
    }
    toast.success(isZh
      ? `视频已提交发布到 ${selectedPlatforms.join(", ")}`
      : `Video submitted to ${selectedPlatforms.join(", ")}`
    );
    setEditTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

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
                <div className="mt-4 space-y-3">
                  <textarea
                    value={posterInstructions}
                    onChange={(e) => setPosterInstructions(e.target.value)}
                    placeholder={isZh ? "可选：输入额外要求，如'突出周年庆'、'主打鸡尾酒系列'..." : "Optional: extra instructions like 'highlight anniversary', 'feature cocktail series'..."}
                    className="w-full p-3 border border-border rounded-lg bg-background text-foreground text-sm resize-none h-20 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  />
                  <div className="flex items-center gap-3">
                    <Button className="gap-1.5" disabled={!selectedTemplate || isLoadingPoster} onClick={fetchPosterSuggestions}>
                      {isLoadingPoster ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {isLoadingPoster ? (isZh ? "AI 生成中..." : "Generating...") : (isZh ? "AI 生成文案" : "Generate Copy")}
                    </Button>
                    <p className="text-xs text-muted-foreground">{isZh ? "AI 将生成标题、正文、设计建议和多平台适配文案" : "AI generates headlines, body copy, design tips & platform adaptations"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Results */}
            {posterResult && (
              <div className="space-y-4">
                {/* Headlines */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Type className="w-4 h-4 text-primary" />{isZh ? "AI 生成标题与文案" : "AI Generated Headlines & Copy"}</CardTitle>
                    <CardDescription>{isZh ? "点击选择一个文案方案，然后生成对应的海报视觉稿" : "Click to select a copy variant, then generate the poster visual"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {posterResult.headlines.map((h, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedHeadlineIdx(i)}
                        className={`p-4 rounded-xl border-2 space-y-2 cursor-pointer transition-all ${selectedHeadlineIdx === i ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-muted/30 hover:border-primary/40"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{h.style}</Badge>
                            {selectedHeadlineIdx === i && <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">{isZh ? "已选" : "Selected"}</Badge>}
                          </div>
                          <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                        </div>
                        <p className="text-lg font-bold text-foreground">{h.main_title}</p>
                        <p className="text-sm text-muted-foreground font-medium">{h.subtitle}</p>
                        <p className="text-sm text-foreground/80 leading-relaxed mt-2">{h.body_copy}</p>
                      </div>
                    ))}
                    <div className="flex items-center gap-3 pt-2">
                      <Button className="gap-1.5" onClick={() => generatePosterImage()} disabled={isGeneratingImage}>
                        {isGeneratingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                        {isGeneratingImage ? (isZh ? "AI 生成中..." : "Generating...") : (isZh ? "🎨 生成海报视觉稿" : "🎨 Generate Poster Image")}
                      </Button>
                      <p className="text-xs text-muted-foreground">{isZh ? "基于所选文案和配色方案，AI 自动生成海报图片" : "AI generates poster image based on selected copy & color palette"}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Design Tips + Color Palette */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4 text-primary" />{isZh ? "设计建议" : "Design Tips"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {posterResult.design_tips.map((d, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                          <Badge variant="secondary" className="text-[10px] shrink-0 mt-0.5">{d.category}</Badge>
                          <p className="text-sm text-foreground">{d.tip}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4 text-primary" />{isZh ? "推荐配色 & 标签" : "Color Palette & Tags"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">{isZh ? "推荐配色方案" : "Recommended Colors"}</p>
                        <div className="flex gap-2">
                          {posterResult.color_palette.map((color, i) => (
                            <div key={i} className="flex flex-col items-center gap-1">
                              <div className="w-10 h-10 rounded-lg border border-border shadow-sm" style={{ backgroundColor: color }} />
                              <span className="text-[10px] text-muted-foreground font-mono">{color}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">{isZh ? "推荐标签" : "Recommended Tags"}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {posterResult.recommended_tags.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-[11px]">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Platform Adaptations */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Send className="w-4 h-4 text-primary" />{isZh ? "各平台适配建议" : "Platform Adaptations"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {posterResult.platform_adaptations.map((p, i) => (
                        <div key={i} className="p-3 rounded-lg border border-border bg-muted/20">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm text-foreground">{p.platform}</p>
                            <Badge variant="secondary" className="text-[10px]">{p.size}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{p.copy_tip}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Generated Poster Image */}
                {(generatedPosterImage || isGeneratingImage) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ImagePlus className="w-4 h-4 text-primary" />
                        {isZh ? "AI 生成海报视觉稿" : "AI Generated Poster Visual"}
                      </CardTitle>
                      <CardDescription>{isZh ? "基于文案和设计建议自动生成的海报图片" : "Auto-generated poster image based on copy and design suggestions"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isGeneratingImage ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                          <Loader2 className="w-12 h-12 text-primary animate-spin" />
                          <p className="text-sm text-muted-foreground">{isZh ? "AI 正在创作海报视觉稿，请稍候..." : "AI is creating your poster visual, please wait..."}</p>
                          <p className="text-xs text-muted-foreground/60">{isZh ? "通常需要 10-30 秒" : "Usually takes 10-30 seconds"}</p>
                        </div>
                      ) : generatedPosterImage ? (
                        <div className="space-y-4">
                          <div className="relative rounded-xl overflow-hidden border border-border shadow-md">
                            <img
                              src={generatedPosterImage}
                              alt="AI Generated Poster"
                              className="w-full h-auto max-h-[600px] object-contain bg-muted/20"
                            />
                          </div>
                          {posterImageDesc && (
                            <p className="text-xs text-muted-foreground leading-relaxed">{posterImageDesc}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => generatePosterImage()} disabled={isGeneratingImage}>
                              <RefreshCw className="w-3.5 h-3.5" />
                              {isZh ? "重新生成" : "Regenerate"}
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1.5" asChild>
                              <a href={generatedPosterImage} download="poster.png" target="_blank" rel="noopener noreferrer">
                                <Download className="w-3.5 h-3.5" />
                                {isZh ? "下载图片" : "Download"}
                              </a>
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

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
            {/* Step indicator */}
            <div className="flex items-center gap-2 text-sm">
              {[
                { key: "upload", label: isZh ? "① 导入素材" : "① Import" },
                { key: "edit", label: isZh ? "② AI剪辑" : "② AI Edit" },
                { key: "preview", label: isZh ? "③ 预览发布" : "③ Publish" },
              ].map((step, i) => (
                <div key={step.key} className="flex items-center gap-2">
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                  <button
                    onClick={() => setVideoStep(step.key as any)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${videoStep === step.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                  >
                    {step.label}
                  </button>
                </div>
              ))}
            </div>

            {/* Step 1: Upload */}
            {videoStep === "upload" && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Upload className="w-4 h-4 text-primary" />{isZh ? "导入视频素材" : "Import Video Footage"}</CardTitle>
                    <CardDescription>{isZh ? "支持 MP4、MOV、AVI 格式，单个文件最大 500MB" : "Supports MP4, MOV, AVI formats, max 500MB per file"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleVideoUpload} />
                    <div
                      onClick={() => videoInputRef.current?.click()}
                      className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-8 text-center cursor-pointer transition-colors hover:bg-primary/5"
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          <p className="text-sm text-muted-foreground">{isZh ? "正在导入..." : "Importing..."}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <FileVideo className="w-10 h-10 text-muted-foreground/50" />
                          <p className="text-sm font-medium text-foreground">{isZh ? "点击或拖拽视频文件到此处" : "Click or drag video files here"}</p>
                          <p className="text-xs text-muted-foreground">{isZh ? "支持批量导入多个视频" : "Supports batch import"}</p>
                        </div>
                      )}
                    </div>

                    {uploadedVideos.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">{isZh ? `已导入 ${uploadedVideos.length} 个素材` : `${uploadedVideos.length} file(s) imported`}</p>
                        {uploadedVideos.map(v => (
                          <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                                <video src={v.url} className="w-full h-full object-cover" muted />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{v.name}</p>
                                <p className="text-[11px] text-muted-foreground">{v.size} · {v.duration}</p>
                              </div>
                            </div>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeVideo(v.id)}>
                              <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Template selection */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Film className="w-4 h-4 text-primary" />{isZh ? "选择剪辑模板" : "Select Edit Template"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {videoTemplates.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVideoTemplate(v.id)}
                          className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${selectedVideoTemplate === v.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                        >
                          <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center mb-3">
                            <Video className="w-8 h-8 text-muted-foreground/50" />
                          </div>
                          <p className="font-semibold text-sm text-foreground">{v.name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[11px] text-muted-foreground">{v.platform}</p>
                            <Badge variant="outline" className="text-[10px]">{v.ratio}</Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Edit instructions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2"><Wand2 className="w-4 h-4" />{isZh ? "剪辑要求（可选）" : "Edit Instructions (Optional)"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      className="w-full min-h-[80px] p-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder={isZh ? "例如：保留调酒过程的特写镜头，加入节奏感强的BGM，前3秒要有吸睛画面..." : "e.g., Keep cocktail close-ups, add upbeat BGM, eye-catching first 3 seconds..."}
                      value={editInstructions}
                      onChange={(e) => setEditInstructions(e.target.value)}
                    />
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {(isZh
                        ? ["加字幕", "加BGM", "慢动作特写", "快剪节奏", "品牌水印", "片尾CTA"]
                        : ["Add Subtitles", "Add BGM", "Slow-mo Close-up", "Fast Cuts", "Brand Watermark", "End CTA"]
                      ).map(tag => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => setEditInstructions(prev => prev ? `${prev}，${tag}` : tag)}
                        >
                          + {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Button className="gap-1.5" onClick={startAIEdit} disabled={uploadedVideos.length === 0 || !selectedVideoTemplate}>
                        <Sparkles className="w-3.5 h-3.5" />{isZh ? "开始 AI 智能剪辑" : "Start AI Edit"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Step 2: AI Editing Progress */}
            {videoStep === "edit" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Scissors className="w-4 h-4 text-primary" />{isZh ? "AI 剪辑进度" : "AI Editing Progress"}</CardTitle>
                  <CardDescription>{isZh ? "AI 正在根据您的要求智能剪辑视频" : "AI is editing your videos based on instructions"}</CardDescription>
                </CardHeader>
                <CardContent>
                  {editTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Scissors className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">{isZh ? "暂无剪辑任务，请先导入视频" : "No edit tasks. Import videos first."}</p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => setVideoStep("upload")}>{isZh ? "返回导入" : "Go to Import"}</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {editTasks.map(task => (
                        <div key={task.id} className="p-4 rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium text-foreground">{task.videoName}</p>
                              <p className="text-[11px] text-muted-foreground">{task.template} · {task.platform}</p>
                            </div>
                            <div>
                              {task.status === "queued" && <Badge variant="secondary" className="text-[10px]">{isZh ? "排队中" : "Queued"}</Badge>}
                              {task.status === "processing" && <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">{isZh ? "剪辑中" : "Processing"}</Badge>}
                              {task.status === "done" && <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">{isZh ? "已完成" : "Done"}</Badge>}
                              {task.status === "error" && <Badge variant="destructive" className="text-[10px]">{isZh ? "失败" : "Error"}</Badge>}
                            </div>
                          </div>
                          {(task.status === "processing" || task.status === "done") && (
                            <Progress value={task.progress} className="h-2" />
                          )}
                          {task.instructions && (
                            <p className="text-[11px] text-muted-foreground mt-2 truncate">{isZh ? "要求：" : "Instructions: "}{task.instructions}</p>
                          )}
                          {task.status === "done" && (
                            <div className="flex items-center gap-2 mt-3">
                              <Button size="sm" variant="outline" className="gap-1 text-xs h-7">
                                <Play className="w-3 h-3" />{isZh ? "预览" : "Preview"}
                              </Button>
                              <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => {
                                setEditTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "queued", progress: 0 } : t));
                                setTimeout(() => {
                                  setEditTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "processing" } : t));
                                  const interval = setInterval(() => {
                                    setEditTasks(prev => prev.map(t => {
                                      if (t.id !== task.id) return t;
                                      const np = Math.min(t.progress + Math.random() * 15, 100);
                                      if (np >= 100) { clearInterval(interval); return { ...t, status: "done", progress: 100 }; }
                                      return { ...t, progress: Math.round(np) };
                                    }));
                                  }, 800);
                                }, 500);
                              }}>
                                <RotateCcw className="w-3 h-3" />{isZh ? "重新剪辑" : "Re-edit"}
                              </Button>
                              <Button size="sm" className="gap-1 text-xs h-7" onClick={() => setVideoStep("preview")}>
                                <Send className="w-3 h-3" />{isZh ? "去发布" : "Publish"}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Preview & Publish */}
            {videoStep === "preview" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Send className="w-4 h-4 text-primary" />{isZh ? "预览与发布" : "Preview & Publish"}</CardTitle>
                  <CardDescription>{isZh ? "选择发布平台，一键分发到多个社交媒体" : "Select platforms and distribute to multiple channels"}</CardDescription>
                </CardHeader>
                <CardContent>
                  {editTasks.filter(t => t.status === "done").length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">{isZh ? "暂无已完成的视频，请先完成剪辑" : "No completed videos. Finish editing first."}</p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => setVideoStep("edit")}>{isZh ? "返回剪辑" : "Go to Edit"}</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {editTasks.filter(t => t.status === "done").map(task => (
                        <div key={task.id} className="p-4 rounded-lg border border-border">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-24 h-14 rounded-lg bg-muted flex items-center justify-center">
                              <Play className="w-6 h-6 text-muted-foreground/50" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{task.videoName}</p>
                              <p className="text-[11px] text-muted-foreground">{task.template} · {task.platform}</p>
                            </div>
                          </div>

                          <p className="text-xs font-medium text-muted-foreground mb-2">{isZh ? "选择发布平台" : "Select Platforms"}</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {(isZh
                              ? ["抖音/TikTok", "小红书", "Instagram", "YouTube", "微信视频号", "B站"]
                              : ["TikTok", "Xiaohongshu", "Instagram", "YouTube", "WeChat Video", "Bilibili"]
                            ).map(p => (
                              <Badge
                                key={p}
                                variant={selectedPlatforms.includes(p) ? "default" : "outline"}
                                className="cursor-pointer transition-colors"
                                onClick={() => togglePlatform(p)}
                              >
                                {selectedPlatforms.includes(p) && <Check className="w-3 h-3 mr-1" />}
                                {p}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button className="gap-1.5" onClick={() => handlePublish(task.id)}>
                              <Send className="w-3.5 h-3.5" />{isZh ? "立即发布" : "Publish Now"}
                            </Button>
                            <Button variant="outline" className="gap-1.5">
                              <CalendarClock className="w-3.5 h-3.5" />{isZh ? "定时发布" : "Schedule"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* AI suggestions - real or fallback */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {isZh ? "AI 剪辑建议" : "AI Editing Suggestions"}
                    {aiSuggestions && <Badge variant="outline" className="text-[10px] text-primary border-primary/30">AI</Badge>}
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs h-7"
                    onClick={fetchAISuggestions}
                    disabled={isLoadingAI}
                  >
                    {isLoadingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    {isZh ? "获取AI建议" : "Get AI Tips"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingAI ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">{isZh ? "AI 正在分析并生成建议..." : "AI is analyzing and generating suggestions..."}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Suggestions */}
                    <div className="space-y-2">
                      {(aiSuggestions?.suggestions || [
                        { tip: isZh ? "🎬 建议在前3秒加入吸睛画面（调酒特写/火焰效果），提升完播率" : "🎬 Add eye-catching visuals in first 3s (cocktail close-up/flame) to boost retention", impact: "+35%", category: "opening" },
                        { tip: isZh ? "🎵 当前热门BGM「Espresso」匹配度92%，建议使用" : "🎵 Trending BGM 'Espresso' has 92% match rate, recommend using", impact: "+22%", category: "bgm" },
                        { tip: isZh ? "📝 添加字幕可提升静音播放场景下的互动率" : "📝 Adding subtitles improves engagement for muted playback", impact: "+18%", category: "subtitle" },
                      ]).map((tip, i) => (
                        <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-sm text-foreground flex-1">{tip.tip}</p>
                          <Badge className="ml-2 bg-green-500/10 text-green-600 border-green-500/20 shrink-0">{isZh ? "互动" : "Eng."} {tip.impact}</Badge>
                        </div>
                      ))}
                    </div>

                    {/* BGM Recommendations */}
                    {aiSuggestions?.recommended_bgm && aiSuggestions.recommended_bgm.length > 0 && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Music2 className="w-3 h-3" />{isZh ? "推荐BGM" : "Recommended BGM"}</p>
                        <div className="flex flex-wrap gap-2">
                          {aiSuggestions.recommended_bgm.map((bgm, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                              <Music2 className="w-3.5 h-3.5 text-primary" />
                              <div>
                                <p className="text-xs font-medium text-foreground">{bgm.name}{bgm.artist ? ` - ${bgm.artist}` : ""}</p>
                                <p className="text-[10px] text-muted-foreground">{bgm.style} · {isZh ? "匹配度" : "Match"} {bgm.match_score}%</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommended Titles */}
                    {aiSuggestions?.recommended_titles && aiSuggestions.recommended_titles.length > 0 && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Type className="w-3 h-3" />{isZh ? "推荐标题" : "Recommended Titles"}</p>
                        <div className="space-y-1">
                          {aiSuggestions.recommended_titles.map((title, i) => (
                            <p key={i} className="text-sm text-foreground p-2 rounded bg-muted/30 cursor-pointer hover:bg-primary/5 transition-colors" onClick={() => { navigator.clipboard.writeText(title); toast.success(isZh ? "已复制标题" : "Title copied"); }}>
                              {title}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommended Tags */}
                    {aiSuggestions?.recommended_tags && aiSuggestions.recommended_tags.length > 0 && (
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Hash className="w-3 h-3" />{isZh ? "推荐标签" : "Recommended Tags"}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {aiSuggestions.recommended_tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => { navigator.clipboard.writeText(tag); toast.success(isZh ? "已复制" : "Copied"); }}>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Best Post Time */}
                    {aiSuggestions?.best_post_time && (
                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <CalendarClock className="w-4 h-4 text-primary shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {isZh ? "最佳发布时间：" : "Best Post Time: "}{aiSuggestions.best_post_time.day} {aiSuggestions.best_post_time.time}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{aiSuggestions.best_post_time.reason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
