import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import {
  Upload, FileVideo, Trash2, X, Image, Loader2, Sparkles,
  Scissors, Film, Palette, ChevronRight, Target, RefreshCw,
  Check, Play, Music2, Send, CalendarClock, Download, Plus,
  Lightbulb, Hash, Type, TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import VideoPreviewPlayer from "./VideoPreviewPlayer";
import VideoTimeline from "./VideoTimeline";
import BGMLibrary from "./BGMLibrary";
import type { TrimSegment, VideoSubtitle, SubtitleStyle, TransitionType, BGMOptions } from "@/lib/videoEditor";

interface UploadedVideo {
  id: string;
  file: File;
  name: string;
  size: string;
  duration: string;
  url: string;
  thumbnail?: string;
}

interface UploadedImage {
  id: string;
  file: File;
  name: string;
  size: string;
  url: string;
  dataUrl?: string;
  analysis?: any;
  analysisStatus?: "idle" | "analyzing" | "done" | "error";
}

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

interface VideoEditorWorkspaceProps {
  isZh: boolean;
  // Videos
  uploadedVideos: UploadedVideo[];
  uploadedImages: UploadedImage[];
  isUploading: boolean;
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeVideo: (id: string) => void;
  removeImage: (id: string) => void;
  // Style & template
  videoStyles: { id: string; name: string; desc: string; color: string }[];
  videoTemplates: { id: string; name: string; platform: string; ratio: string }[];
  selectedVideoStyle: string | null;
  setSelectedVideoStyle: (s: string) => void;
  selectedVideoTemplate: string | null;
  setSelectedVideoTemplate: (s: string) => void;
  // Segments
  editableSegments: TrimSegment[];
  setEditableSegments: (s: TrimSegment[]) => void;
  segmentsConfirmed: boolean;
  setSegmentsConfirmed: (v: boolean) => void;
  isGeneratingSegments: boolean;
  generateSegments: () => void;
  segThumbnails: Record<string, string>;
  getVideoNameFromUrl: (url: string) => string;
  // Subtitles
  generatedSubtitles: VideoSubtitle[];
  setGeneratedSubtitles: (s: VideoSubtitle[]) => void;
  subtitlesConfirmed: boolean;
  setSubtitlesConfirmed: (v: boolean) => void;
  isLoadingSubtitles: boolean;
  generateAISubtitles: () => void;
  subtitleStyle: SubtitleStyle;
  setSubtitleStyle: (s: SubtitleStyle) => void;
  defaultSubtitleStyle: SubtitleStyle;
  // BGM
  bgmFile: File | null;
  bgmUrl: string;
  bgmName: string;
  setBgmFile: (f: File | null) => void;
  setBgmUrl: (u: string) => void;
  setBgmName: (n: string) => void;
  bgmVolume: number;
  setBgmVolume: (v: number) => void;
  originalAudioVolume: number;
  setOriginalAudioVolume: (v: number) => void;
  // Transition
  selectedTransition: TransitionType;
  setSelectedTransition: (t: TransitionType) => void;
  // Target duration
  targetDuration: number;
  setTargetDuration: (d: number) => void;
  // Edit
  startAIEdit: () => void;
  isFFmpegLoading: boolean;
  ffmpegProgress: number;
  // AI
  aiSuggestions: AIVideoResult | null;
  isLoadingAI: boolean;
  fetchAISuggestions: () => void;
}

const defaultSubStyle: SubtitleStyle = {
  zhFontScale: 1.0, enFontScale: 1.0,
  zhColor: "#FFFFFF", enColor: "#CCCCCC",
  bgColor: "#000000", bgOpacity: 0.65, position: "bottom",
};

const VideoEditorWorkspace = (props: VideoEditorWorkspaceProps) => {
  const {
    isZh, uploadedVideos, uploadedImages, isUploading,
    handleVideoUpload, handleImageUpload, removeVideo, removeImage,
    videoStyles, videoTemplates, selectedVideoStyle, setSelectedVideoStyle,
    selectedVideoTemplate, setSelectedVideoTemplate,
    editableSegments, setEditableSegments, segmentsConfirmed, setSegmentsConfirmed,
    isGeneratingSegments, generateSegments, segThumbnails, getVideoNameFromUrl,
    generatedSubtitles, setGeneratedSubtitles, subtitlesConfirmed, setSubtitlesConfirmed,
    isLoadingSubtitles, generateAISubtitles,
    subtitleStyle, setSubtitleStyle, defaultSubtitleStyle,
    bgmFile, bgmUrl, bgmName, setBgmFile, setBgmUrl, setBgmName,
    bgmVolume, setBgmVolume, originalAudioVolume, setOriginalAudioVolume,
    selectedTransition, setSelectedTransition,
    targetDuration, setTargetDuration,
    startAIEdit, isFFmpegLoading, ffmpegProgress,
    aiSuggestions, isLoadingAI, fetchAISuggestions,
  } = props;

  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showWaveform, setShowWaveform] = useState(true);
  const [showSubtitleSettings, setShowSubtitleSettings] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [leftPanel, setLeftPanel] = useState<"assets" | "style" | "ai">("assets");
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playIntervalRef.current = setInterval(() => {
        setPlayProgress(prev => {
          if (prev >= 100) {
            if (playIntervalRef.current) clearInterval(playIntervalRef.current);
            playIntervalRef.current = null;
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.5;
        });
      }, 100);
    }
  }, [isPlaying]);

  const handleSeek = useCallback((values: number[]) => { setPlayProgress(values[0]); }, []);
  const handleSkip = useCallback((delta: number) => {
    setPlayProgress(prev => Math.max(0, Math.min(100, prev + delta * 3)));
  }, []);

  useEffect(() => {
    return () => { if (playIntervalRef.current) clearInterval(playIntervalRef.current); };
  }, []);

  const totalSegmentDuration = editableSegments.reduce((acc, s) => acc + Math.max(0, s.endTime - s.startTime), 0);

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden bg-background/50" style={{ height: "calc(100vh - 220px)", minHeight: 500 }}>
      <ResizablePanelGroup direction="vertical">
        {/* Top section: Left panel + Preview */}
        <ResizablePanel defaultSize={65} minSize={40}>
          <ResizablePanelGroup direction="horizontal">
            {/* Left Panel - Assets / Style / AI */}
            <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
              <div className="h-full flex flex-col bg-secondary/20 border-r border-border/30">
                {/* Panel tabs */}
                <div className="flex border-b border-border/30 bg-secondary/30">
                  {([
                    { key: "assets" as const, icon: FileVideo, label: isZh ? "素材" : "Assets" },
                    { key: "style" as const, icon: Palette, label: isZh ? "风格" : "Style" },
                    { key: "ai" as const, icon: Sparkles, label: "AI" },
                  ]).map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setLeftPanel(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                        leftPanel === tab.key
                          ? "text-primary border-b-2 border-primary bg-primary/5"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <tab.icon className="w-3 h-3" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Panel content */}
                <ScrollArea className="flex-1">
                  {leftPanel === "assets" && (
                    <div className="p-3 space-y-3">
                      {/* Video import */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-medium text-foreground flex items-center gap-1">
                            <FileVideo className="w-3 h-3 text-primary" />
                            {isZh ? "视频素材" : "Videos"}
                            {uploadedVideos.length > 0 && <Badge variant="outline" className="text-[8px] h-4 ml-1">{uploadedVideos.length}</Badge>}
                          </span>
                          <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5 gap-1" onClick={() => videoInputRef.current?.click()}>
                            <Plus className="w-2.5 h-2.5" />{isZh ? "添加" : "Add"}
                          </Button>
                        </div>
                        <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleVideoUpload} />

                        {uploadedVideos.length === 0 ? (
                          <button
                            onClick={() => videoInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-border/50 hover:border-primary/40 rounded-lg p-4 text-center transition-colors hover:bg-primary/5"
                          >
                            {isUploading ? (
                              <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
                            ) : (
                              <>
                                <FileVideo className="w-6 h-6 text-muted-foreground/30 mx-auto mb-1" />
                                <p className="text-[10px] text-muted-foreground">{isZh ? "导入视频素材" : "Import videos"}</p>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="space-y-1.5">
                            {uploadedVideos.map(v => (
                              <div key={v.id} className="flex items-center gap-2 p-1.5 rounded-md bg-muted/20 hover:bg-muted/30 group">
                                <div className="w-12 h-8 rounded overflow-hidden bg-muted shrink-0">
                                  {v.thumbnail ? (
                                    <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <FileVideo className="w-4 h-4 text-muted-foreground/30 m-auto mt-1.5" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-medium text-foreground truncate">{v.name}</p>
                                  <p className="text-[8px] text-muted-foreground">{v.duration} · {v.size}</p>
                                </div>
                                <button onClick={() => removeVideo(v.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Image/brand assets */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-medium text-foreground flex items-center gap-1">
                            <Image className="w-3 h-3 text-primary" />
                            {isZh ? "品牌素材" : "Brand Assets"}
                          </span>
                          <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5 gap-1" onClick={() => imageInputRef.current?.click()}>
                            <Plus className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                        <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                        {uploadedImages.length === 0 ? (
                          <button
                            onClick={() => imageInputRef.current?.click()}
                            className="w-full border border-dashed border-border/40 rounded-lg p-3 text-center transition-colors hover:bg-primary/5"
                          >
                            <Image className="w-4 h-4 text-muted-foreground/30 mx-auto mb-0.5" />
                            <p className="text-[9px] text-muted-foreground">{isZh ? "LOGO、产品图等" : "Logo, product images"}</p>
                          </button>
                        ) : (
                          <div className="grid grid-cols-3 gap-1">
                            {uploadedImages.map(img => (
                              <div key={img.id} className="relative group rounded-md overflow-hidden border border-border/30">
                                <img src={img.url} alt="" className="w-full aspect-square object-cover" />
                                <button onClick={() => removeImage(img.id)} className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 bg-black/50 rounded-full p-0.5 transition-opacity">
                                  <X className="w-2.5 h-2.5 text-white" />
                                </button>
                                {img.analysis?.has_logo && (
                                  <div className="absolute bottom-0.5 left-0.5">
                                    <Badge className="text-[6px] h-3 px-1 bg-primary/80 border-none">LOGO</Badge>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Target Duration */}
                      <div>
                        <span className="text-[11px] font-medium text-foreground flex items-center gap-1 mb-2">
                          🎯 {isZh ? "目标时长" : "Duration"}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {[15, 30, 60, 90, 180].map(sec => (
                            <button
                              key={sec}
                              onClick={() => setTargetDuration(sec)}
                              className={`px-2 py-1 rounded-md text-[10px] font-medium border transition-all ${
                                targetDuration === sec
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border/40 text-muted-foreground hover:border-primary/30"
                              }`}
                            >
                              {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Output Format */}
                      <div>
                        <span className="text-[11px] font-medium text-foreground flex items-center gap-1 mb-2">
                          <Film className="w-3 h-3 text-primary" />
                          {isZh ? "输出格式" : "Format"}
                        </span>
                        <div className="space-y-1">
                          {videoTemplates.map(v => (
                            <button
                              key={v.id}
                              onClick={() => setSelectedVideoTemplate(v.id)}
                              className={`w-full text-left px-2 py-1.5 rounded-md text-[10px] transition-all ${
                                selectedVideoTemplate === v.id
                                  ? "bg-primary/10 border border-primary/30 text-foreground"
                                  : "bg-muted/10 border border-transparent text-muted-foreground hover:bg-muted/20"
                              }`}
                            >
                              <span className="font-medium">{v.name}</span>
                              <span className="text-muted-foreground ml-1">· {v.ratio}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {leftPanel === "style" && (
                    <div className="p-3 space-y-1.5">
                      <p className="text-[11px] font-medium text-foreground mb-2">{isZh ? "剪辑风格" : "Edit Style"}</p>
                      {videoStyles.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedVideoStyle(s.id)}
                          className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                            selectedVideoStyle === s.id
                              ? "border-primary bg-primary/5"
                              : "border-border/30 hover:border-primary/30 hover:bg-muted/10"
                          }`}
                        >
                          <p className="text-[11px] font-semibold text-foreground">{s.name}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {leftPanel === "ai" && (
                    <div className="p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-foreground flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-primary" />
                          {isZh ? "AI 建议" : "AI Tips"}
                        </span>
                        <Button size="sm" variant="outline" className="h-5 text-[9px] gap-1 px-2" onClick={fetchAISuggestions} disabled={isLoadingAI}>
                          {isLoadingAI ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <RefreshCw className="w-2.5 h-2.5" />}
                        </Button>
                      </div>

                      {isLoadingAI ? (
                        <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-[10px]">{isZh ? "分析中..." : "Analyzing..."}</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(aiSuggestions?.suggestions || [
                            { tip: isZh ? "🎬 前3秒加入吸睛画面" : "🎬 Eye-catching first 3s", impact: "+35%", category: "opening" },
                            { tip: isZh ? "🎵 推荐热门BGM" : "🎵 Use trending BGM", impact: "+22%", category: "bgm" },
                            { tip: isZh ? "📝 添加字幕提升互动" : "📝 Add subtitles for engagement", impact: "+18%", category: "subtitle" },
                          ]).map((tip, i) => (
                            <div key={i} className="p-2 rounded-md bg-muted/15 border border-border/20">
                              <p className="text-[10px] text-foreground leading-relaxed">{tip.tip}</p>
                              <Badge className="mt-1 text-[8px] h-4 bg-green-500/10 text-green-500 border-green-500/20">{tip.impact}</Badge>
                            </div>
                          ))}

                          {aiSuggestions?.recommended_titles && (
                            <div className="pt-2 border-t border-border/20">
                              <p className="text-[9px] text-muted-foreground mb-1">{isZh ? "推荐标题" : "Titles"}</p>
                              {aiSuggestions.recommended_titles.map((t, i) => (
                                <p key={i} className="text-[10px] text-foreground p-1.5 rounded bg-muted/10 cursor-pointer hover:bg-primary/5 mb-0.5"
                                  onClick={() => { navigator.clipboard.writeText(t); toast.success(isZh ? "已复制" : "Copied"); }}>
                                  {t}
                                </p>
                              ))}
                            </div>
                          )}

                          {aiSuggestions?.recommended_tags && (
                            <div className="pt-2 border-t border-border/20">
                              <p className="text-[9px] text-muted-foreground mb-1">{isZh ? "标签" : "Tags"}</p>
                              <div className="flex flex-wrap gap-1">
                                {aiSuggestions.recommended_tags.map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-[8px] cursor-pointer hover:bg-primary/10"
                                    onClick={() => { navigator.clipboard.writeText(tag); toast.success(isZh ? "已复制" : "Copied"); }}>
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {aiSuggestions?.best_post_time && (
                            <div className="pt-2 border-t border-border/20">
                              <div className="p-2 rounded-md bg-primary/5 border border-primary/15">
                                <p className="text-[10px] font-medium text-foreground">
                                  ⏰ {aiSuggestions.best_post_time.day} {aiSuggestions.best_post_time.time}
                                </p>
                                <p className="text-[8px] text-muted-foreground">{aiSuggestions.best_post_time.reason}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                {/* Start Edit Button */}
                <div className="p-3 border-t border-border/30 bg-secondary/30">
                  <Button
                    className="w-full gap-1.5 h-9"
                    onClick={startAIEdit}
                    disabled={uploadedVideos.length < 2 || !selectedVideoStyle || !selectedVideoTemplate || isFFmpegLoading}
                  >
                    {isFFmpegLoading ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" />{isZh ? `剪辑中 ${ffmpegProgress}%` : `Editing ${ffmpegProgress}%`}</>
                    ) : (
                      <><Scissors className="w-3.5 h-3.5" />{isZh
                        ? editableSegments.length > 0
                          ? `开始剪辑 (${editableSegments.length}段·${totalSegmentDuration.toFixed(0)}s)`
                          : `一键剪辑 → ${targetDuration}s`
                        : editableSegments.length > 0
                          ? `Edit (${editableSegments.length} clips·${totalSegmentDuration.toFixed(0)}s)`
                          : `Edit → ${targetDuration}s`
                      }</>
                    )}
                  </Button>
                  {(uploadedVideos.length < 2 || !selectedVideoStyle) && (
                    <p className="text-[9px] text-muted-foreground text-center mt-1">
                      {uploadedVideos.length < 2 ? (isZh ? "需要两段视频" : "Need 2 videos") : (isZh ? "选择风格" : "Pick style")}
                    </p>
                  )}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Center - Preview Player */}
            <ResizablePanel defaultSize={70}>
              <VideoPreviewPlayer
                isZh={isZh}
                subtitles={generatedSubtitles}
                subtitleStyle={subtitleStyle}
                showSubtitles={showSubtitles}
                setShowSubtitles={setShowSubtitles}
                showWaveform={showWaveform}
                setShowWaveform={setShowWaveform}
                showSubtitleSettings={showSubtitleSettings}
                setShowSubtitleSettings={setShowSubtitleSettings}
                onSubtitleStyleChange={setSubtitleStyle}
                defaultSubtitleStyle={defaultSubtitleStyle}
                bgmName={bgmName}
                bgmUrl={bgmUrl}
                isPlaying={isPlaying}
                playProgress={playProgress}
                currentTime={currentTime}
                videoDuration={videoDuration}
                playbackRate={playbackRate}
                isMuted={isMuted}
                onTogglePlay={togglePlay}
                onSeek={handleSeek}
                onSkip={handleSkip}
                onSetPlaybackRate={setPlaybackRate}
                onSetMuted={setIsMuted}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Bottom - Multi-track Timeline */}
        <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
          <VideoTimeline
            isZh={isZh}
            playProgress={playProgress}
            editableSegments={editableSegments}
            setEditableSegments={setEditableSegments}
            segmentsConfirmed={segmentsConfirmed}
            setSegmentsConfirmed={setSegmentsConfirmed}
            isGeneratingSegments={isGeneratingSegments}
            generateSegments={generateSegments}
            uploadedVideoCount={uploadedVideos.length}
            getVideoNameFromUrl={getVideoNameFromUrl}
            segThumbnails={segThumbnails}
            uploadedVideoUrls={uploadedVideos.map(v => v.url)}
            subtitles={generatedSubtitles}
            setSubtitles={setGeneratedSubtitles}
            subtitlesConfirmed={subtitlesConfirmed}
            setSubtitlesConfirmed={setSubtitlesConfirmed}
            isLoadingSubtitles={isLoadingSubtitles}
            generateAISubtitles={generateAISubtitles}
            bgmUrl={bgmUrl}
            bgmName={bgmName}
            bgmFile={bgmFile}
            setBgmUrl={setBgmUrl}
            setBgmName={setBgmName}
            setBgmFile={setBgmFile}
            bgmVolume={bgmVolume}
            setBgmVolume={setBgmVolume}
            originalAudioVolume={originalAudioVolume}
            setOriginalAudioVolume={setOriginalAudioVolume}
            selectedTransition={selectedTransition}
            setSelectedTransition={setSelectedTransition}
            aiRecommendedBgm={aiSuggestions?.recommended_bgm}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default VideoEditorWorkspace;
