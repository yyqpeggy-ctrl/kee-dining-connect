import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Film, Music2, Subtitles, Plus, Trash2, GripVertical,
  Sparkles, Loader2, Check, Upload, AudioLines,
  ArrowUp, ArrowDown, RotateCcw
} from "lucide-react";
import type { TrimSegment, VideoSubtitle, TransitionType } from "@/lib/videoEditor";
import BGMLibrary from "@/components/marketing/BGMLibrary";

interface VideoTimelineProps {
  isZh: boolean;
  playProgress: number;
  // Segments
  editableSegments: TrimSegment[];
  setEditableSegments: (segs: TrimSegment[]) => void;
  segmentsConfirmed: boolean;
  setSegmentsConfirmed: (v: boolean) => void;
  isGeneratingSegments: boolean;
  generateSegments: () => void;
  uploadedVideoCount: number;
  getVideoNameFromUrl: (url: string) => string;
  segThumbnails: Record<string, string>;
  uploadedVideoUrls: string[];
  // Subtitles
  subtitles: VideoSubtitle[];
  setSubtitles: (s: VideoSubtitle[]) => void;
  subtitlesConfirmed: boolean;
  setSubtitlesConfirmed: (v: boolean) => void;
  isLoadingSubtitles: boolean;
  generateAISubtitles: () => void;
  // BGM
  bgmUrl: string;
  bgmName: string;
  bgmFile: File | null;
  setBgmUrl: (v: string) => void;
  setBgmName: (v: string) => void;
  setBgmFile: (v: File | null) => void;
  bgmVolume: number;
  setBgmVolume: (v: number) => void;
  originalAudioVolume: number;
  setOriginalAudioVolume: (v: number) => void;
  // Transition
  selectedTransition: TransitionType;
  setSelectedTransition: (v: TransitionType) => void;
  // AI suggestions
  aiRecommendedBgm?: { name: string; style: string }[];
}

const TRACK_COLORS = {
  videoA: "hsl(36, 90%, 55%)",    // primary/amber
  videoB: "hsl(210, 70%, 55%)",   // info/blue
  audio: "hsl(152, 60%, 45%)",    // success/green
  subtitle: "hsl(280, 60%, 60%)", // purple
};

const VideoTimeline = ({
  isZh, playProgress,
  editableSegments, setEditableSegments, segmentsConfirmed, setSegmentsConfirmed,
  isGeneratingSegments, generateSegments, uploadedVideoCount,
  getVideoNameFromUrl, segThumbnails, uploadedVideoUrls,
  subtitles, setSubtitles, subtitlesConfirmed, setSubtitlesConfirmed,
  isLoadingSubtitles, generateAISubtitles,
  bgmUrl, bgmName, bgmFile, setBgmUrl, setBgmName, setBgmFile,
  bgmVolume, setBgmVolume, originalAudioVolume, setOriginalAudioVolume,
  selectedTransition, setSelectedTransition,
  aiRecommendedBgm,
}: VideoTimelineProps) => {
  const [activeTrack, setActiveTrack] = useState<"video" | "audio" | "subtitle">("video");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const bgmInputRef = useRef<HTMLInputElement>(null);

  const totalSegmentDuration = editableSegments.reduce((acc, s) => acc + Math.max(0, s.endTime - s.startTime), 0);

  // Segment manipulation
  const moveSegment = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= editableSegments.length) return;
    const arr = [...editableSegments];
    const [item] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, item);
    setEditableSegments(arr);
    setSegmentsConfirmed(false);
  };

  const updateSegmentTime = (idx: number, field: "startTime" | "endTime", value: number) => {
    setEditableSegments(editableSegments.map((s, i) => i === idx ? { ...s, [field]: Math.max(0, value) } : s));
    setSegmentsConfirmed(false);
  };

  const removeSegment = (idx: number) => {
    setEditableSegments(editableSegments.filter((_, i) => i !== idx));
    setSegmentsConfirmed(false);
  };

  const addSegment = () => {
    if (uploadedVideoUrls.length === 0) return;
    setEditableSegments([...editableSegments, { videoUrl: uploadedVideoUrls[0], startTime: 0, endTime: 3 }]);
    setSegmentsConfirmed(false);
  };

  // Subtitle manipulation
  const updateSubtitle = (index: number, field: "zh" | "en", value: string) => {
    setSubtitles(subtitles.map((s, i) => i === index ? { ...s, [field]: value } : s));
    setSubtitlesConfirmed(false);
  };

  const removeSubtitle = (index: number) => {
    setSubtitles(subtitles.filter((_, i) => i !== index));
    setSubtitlesConfirmed(false);
  };

  const addSubtitle = () => {
    const last = subtitles[subtitles.length - 1];
    const newStart = last ? last.endPct : 0;
    setSubtitles([...subtitles, { startPct: newStart, endPct: Math.min(newStart + 15, 100), zh: "", en: "" }]);
    setSubtitlesConfirmed(false);
  };

  const distributeSubtitlesEvenly = () => {
    if (subtitles.length === 0) return;
    const count = subtitles.length;
    const gap = 1;
    const totalGap = (count - 1) * gap;
    const segLen = (100 - totalGap) / count;
    setSubtitles(subtitles.map((s, i) => ({
      ...s,
      startPct: Math.round((i * (segLen + gap)) * 10) / 10,
      endPct: Math.round((i * (segLen + gap) + segLen) * 10) / 10,
    })));
    setSubtitlesConfirmed(false);
  };

  const transitions: { id: TransitionType; icon: string; name: string }[] = [
    { id: "fade", icon: "🌅", name: isZh ? "淡入淡出" : "Fade" },
    { id: "dissolve", icon: "✨", name: isZh ? "溶解" : "Dissolve" },
    { id: "wipe-left", icon: "👈", name: isZh ? "左擦除" : "Wipe L" },
    { id: "wipe-right", icon: "👉", name: isZh ? "右擦除" : "Wipe R" },
    { id: "slide-left", icon: "⬅️", name: isZh ? "左滑" : "Slide L" },
    { id: "slide-right", icon: "➡️", name: isZh ? "右滑" : "Slide R" },
    { id: "zoom", icon: "🔍", name: isZh ? "缩放" : "Zoom" },
    { id: "none", icon: "⚡", name: isZh ? "硬切" : "Cut" },
  ];

  // Visual timeline ruler
  const timelineWidth = Math.max(600, totalSegmentDuration * 20);

  return (
    <div className="flex flex-col h-full bg-secondary/30 border-t border-border/50">
      {/* Track tabs + actions */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/30 bg-secondary/20">
        {/* Track selectors */}
        <div className="flex items-center gap-0.5">
          {([
            { key: "video" as const, icon: Film, label: isZh ? "视频轨" : "Video", color: TRACK_COLORS.videoA },
            { key: "audio" as const, icon: Music2, label: isZh ? "音频轨" : "Audio", color: TRACK_COLORS.audio },
            { key: "subtitle" as const, icon: Subtitles, label: isZh ? "字幕轨" : "Subtitle", color: TRACK_COLORS.subtitle },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTrack(t.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeTrack === t.key
                  ? "bg-secondary text-foreground border border-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              }`}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
              <t.icon className="w-3 h-3" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Transition selector - compact */}
        <div className="flex items-center gap-1 mr-2">
          <span className="text-[9px] text-muted-foreground">{isZh ? "转场:" : "Trans:"}</span>
          <div className="flex gap-[1px] bg-muted/30 rounded-md p-0.5">
            {transitions.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTransition(t.id)}
                className={`w-6 h-5 rounded text-[10px] flex items-center justify-center transition-all ${
                  selectedTransition === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"
                }`}
                title={t.name}
              >
                {t.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Track-specific actions */}
        {activeTrack === "video" && (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2" onClick={generateSegments} disabled={isGeneratingSegments || uploadedVideoCount < 2}>
              {isGeneratingSegments ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
              {isZh ? "AI生成" : "AI Gen"}
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 px-2" onClick={addSegment}>
              <Plus className="w-2.5 h-2.5" />
            </Button>
            {editableSegments.length > 0 && !segmentsConfirmed && (
              <Button size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => setSegmentsConfirmed(true)}>
                <Check className="w-2.5 h-2.5" />{isZh ? "确认" : "OK"}
              </Button>
            )}
            {segmentsConfirmed && (
              <Badge className="text-[8px] bg-green-500/10 text-green-600 border-green-500/20 h-5">
                <Check className="w-2 h-2 mr-0.5" />{isZh ? "已确认" : "OK"}
              </Badge>
            )}
          </div>
        )}
        {activeTrack === "subtitle" && (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2" onClick={generateAISubtitles} disabled={isLoadingSubtitles}>
              {isLoadingSubtitles ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
              {isZh ? "AI生成" : "AI Gen"}
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 px-2" onClick={addSubtitle}>
              <Plus className="w-2.5 h-2.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 px-2" onClick={distributeSubtitlesEvenly} disabled={subtitles.length < 2}>
              <RotateCcw className="w-2.5 h-2.5" />
            </Button>
            {subtitles.length > 0 && !subtitlesConfirmed && (
              <Button size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => setSubtitlesConfirmed(true)}>
                <Check className="w-2.5 h-2.5" />{isZh ? "确认" : "OK"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Visual Timeline */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Video Track */}
        {activeTrack === "video" && (
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {/* Timeline ruler */}
              <div className="relative h-5 mb-1">
                <div className="absolute inset-0 flex items-end">
                  {totalSegmentDuration > 0 && Array.from({ length: Math.ceil(totalSegmentDuration) + 1 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0" style={{ width: `${100 / (totalSegmentDuration || 1)}%` }}>
                      {i % 5 === 0 && <span className="text-[8px] text-muted-foreground/60 font-mono">{i}s</span>}
                    </div>
                  ))}
                </div>
                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-destructive z-10"
                  style={{ left: `${playProgress}%` }}
                >
                  <div className="w-2 h-2 bg-destructive rounded-full -translate-x-[3px] -translate-y-0.5" />
                </div>
              </div>

              {/* Visual clip blocks */}
              {editableSegments.length > 0 ? (
                <div className="flex gap-[2px] items-stretch min-h-[52px]">
                  {editableSegments.map((seg, idx) => {
                    const duration = seg.endTime - seg.startTime;
                    const widthPct = totalSegmentDuration > 0 ? (duration / totalSegmentDuration) * 100 : 100 / editableSegments.length;
                    const isVideoA = uploadedVideoUrls[0] === seg.videoUrl;
                    const midTime = (seg.startTime + seg.endTime) / 2;
                    const thumbKey = `${seg.videoUrl}|${midTime.toFixed(1)}`;
                    const thumb = segThumbnails[thumbKey];

                    return (
                      <div
                        key={idx}
                        draggable
                        onDragStart={() => setDragIdx(idx)}
                        onDragOver={(e) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== idx) { moveSegment(dragIdx, idx); setDragIdx(idx); } }}
                        onDragEnd={() => setDragIdx(null)}
                        className={`relative rounded-md overflow-hidden cursor-grab active:cursor-grabbing group transition-all ${
                          dragIdx === idx ? "ring-2 ring-primary scale-[1.02]" : "hover:ring-1 hover:ring-primary/40"
                        }`}
                        style={{
                          width: `${widthPct}%`,
                          minWidth: 48,
                          borderLeft: `3px solid ${isVideoA ? TRACK_COLORS.videoA : TRACK_COLORS.videoB}`,
                        }}
                      >
                        {/* Thumbnail background */}
                        {thumb ? (
                          <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                        ) : (
                          <div className="absolute inset-0 bg-secondary/60" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />

                        {/* Clip info overlay */}
                        <div className="relative z-10 p-1.5 h-full flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-mono text-white/80 bg-black/30 px-1 rounded">
                              {idx + 1}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeSegment(idx); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-destructive"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <div>
                            <p className="text-[8px] text-white/90 font-medium truncate">{getVideoNameFromUrl(seg.videoUrl)}</p>
                            <p className="text-[7px] text-white/60 font-mono">
                              {seg.startTime.toFixed(1)}s → {seg.endTime.toFixed(1)}s ({duration.toFixed(1)}s)
                            </p>
                          </div>
                        </div>

                        {/* Transition indicator between clips */}
                        {idx < editableSegments.length - 1 && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 w-4 h-4 rounded-full bg-muted border border-border flex items-center justify-center">
                            <span className="text-[7px]">{transitions.find(t => t.id === selectedTransition)?.icon}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-12 text-muted-foreground/40 text-[11px] border border-dashed border-border/30 rounded-lg">
                  {isZh ? "点击「AI生成」或「+」添加视频片段" : "Click 'AI Gen' or '+' to add clips"}
                </div>
              )}

              {/* Segment detail list */}
              {editableSegments.length > 0 && (
                <div className="space-y-0.5 mt-2">
                  {editableSegments.map((seg, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/20 hover:bg-muted/30 text-[10px]">
                      <span className="font-mono text-muted-foreground w-3">{idx + 1}</span>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: uploadedVideoUrls[0] === seg.videoUrl ? TRACK_COLORS.videoA : TRACK_COLORS.videoB }} />
                      <span className="text-foreground/80 truncate flex-1">{getVideoNameFromUrl(seg.videoUrl)}</span>
                      <input type="number" step="0.1" min="0" value={seg.startTime} onChange={e => updateSegmentTime(idx, "startTime", parseFloat(e.target.value) || 0)}
                        className="w-12 h-4 text-[9px] px-1 rounded border border-border/50 bg-background/50 text-foreground text-center" />
                      <span className="text-muted-foreground">→</span>
                      <input type="number" step="0.1" min="0" value={seg.endTime} onChange={e => updateSegmentTime(idx, "endTime", parseFloat(e.target.value) || 0)}
                        className="w-12 h-4 text-[9px] px-1 rounded border border-border/50 bg-background/50 text-foreground text-center" />
                      <span className="text-muted-foreground/60 font-mono w-8">({(seg.endTime - seg.startTime).toFixed(1)}s)</span>
                      <div className="flex gap-0.5">
                        <button onClick={() => moveSegment(idx, idx - 1)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="w-2.5 h-2.5" /></button>
                        <button onClick={() => moveSegment(idx, idx + 1)} disabled={idx === editableSegments.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="w-2.5 h-2.5" /></button>
                        <button onClick={() => removeSegment(idx)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-2.5 h-2.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary bar */}
              {editableSegments.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="outline" className="text-[9px] h-4">{editableSegments.length} {isZh ? "片段" : "clips"}</Badge>
                  <Badge variant="outline" className="text-[9px] h-4">≈ {totalSegmentDuration.toFixed(1)}s</Badge>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Audio Track */}
        {activeTrack === "audio" && (
          <div className="p-3 space-y-3 h-full overflow-y-auto">
            {!bgmUrl ? (
              <div className="space-y-2">
                <BGMLibrary
                  isZh={isZh}
                  onSelect={(url, name) => { setBgmUrl(url); setBgmName(name); setBgmFile(null); }}
                />
                <button
                  onClick={() => bgmInputRef.current?.click()}
                  className="w-full h-9 border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center gap-2 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  {isZh ? "上传音频 (MP3/WAV)" : "Upload audio (MP3/WAV)"}
                </button>
                <input ref={bgmInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) { setBgmFile(file); setBgmUrl(URL.createObjectURL(file)); setBgmName(file.name); }
                }} />
                {aiRecommendedBgm?.[0] && (
                  <p className="text-[9px] text-muted-foreground italic px-1">
                    💡 AI {isZh ? "推荐" : "suggests"}: {aiRecommendedBgm[0].name} · {aiRecommendedBgm[0].style}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Waveform visualization */}
                <div className="flex items-end gap-[2px] h-10 bg-muted/20 rounded-md px-1 py-1 overflow-hidden">
                  {Array.from({ length: 48 }).map((_, i) => {
                    const seed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
                    const h = (seed - Math.floor(seed)) * 0.6 + 0.2;
                    const isPast = i / 48 <= playProgress / 100;
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-sm transition-all duration-75 ${isPast ? "bg-green-500" : "bg-muted-foreground/15"}`}
                        style={{ height: `${Math.max(8, h * 100)}%`, opacity: isPast ? 0.85 : 0.4 }}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                  <Music2 className="w-3 h-3 text-green-500" />
                  <span className="text-foreground/80 truncate flex-1">{bgmName}</span>
                  <Button variant="ghost" size="sm" className="h-5 text-[9px] text-destructive px-1" onClick={() => {
                    if (bgmUrl) URL.revokeObjectURL(bgmUrl);
                    setBgmFile(null); setBgmUrl(""); setBgmName("");
                  }}>
                    <Trash2 className="w-2.5 h-2.5 mr-0.5" />{isZh ? "移除" : "Remove"}
                  </Button>
                </div>

                {/* Volume controls */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-muted-foreground">🎵 BGM</span>
                      <span className="font-mono text-foreground">{Math.round(bgmVolume * 100)}%</span>
                    </div>
                    <Slider value={[bgmVolume * 100]} max={100} step={1} onValueChange={([v]) => setBgmVolume(v / 100)} className="h-1" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-muted-foreground">🎤 {isZh ? "原声" : "Original"}</span>
                      <span className="font-mono text-foreground">{Math.round(originalAudioVolume * 100)}%</span>
                    </div>
                    <Slider value={[originalAudioVolume * 100]} max={100} step={1} onValueChange={([v]) => setOriginalAudioVolume(v / 100)} className="h-1" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Subtitle Track */}
        {activeTrack === "subtitle" && (
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {/* Visual subtitle blocks on timeline */}
              <div className="relative h-8 bg-muted/10 rounded-md overflow-hidden">
                {/* Playhead */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-destructive z-10" style={{ left: `${playProgress}%` }} />
                {subtitles.map((sub, idx) => (
                  <div
                    key={idx}
                    className="absolute top-1 bottom-1 rounded-sm flex items-center px-1 overflow-hidden cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all"
                    style={{
                      left: `${sub.startPct}%`,
                      width: `${sub.endPct - sub.startPct}%`,
                      backgroundColor: `${TRACK_COLORS.subtitle}40`,
                      borderLeft: `2px solid ${TRACK_COLORS.subtitle}`,
                    }}
                    title={sub.zh}
                  >
                    <span className="text-[7px] text-white/80 truncate">{sub.zh}</span>
                  </div>
                ))}
              </div>

              {/* Subtitle detail list */}
              {subtitles.map((sub, idx) => (
                <div key={idx} className="flex items-start gap-1.5 p-1.5 rounded-md bg-muted/15 hover:bg-muted/25">
                  <span className="text-[9px] font-mono text-muted-foreground mt-1 w-3">{idx + 1}</span>
                  <div className="flex-1 space-y-0.5">
                    <input type="text" value={sub.zh} onChange={e => updateSubtitle(idx, "zh", e.target.value)}
                      placeholder={isZh ? "中文" : "Chinese"}
                      className="w-full text-[11px] px-1.5 py-0.5 rounded border border-border/30 bg-background/30 text-foreground focus:ring-1 focus:ring-primary/30 outline-none" />
                    <input type="text" value={sub.en} onChange={e => updateSubtitle(idx, "en", e.target.value)}
                      placeholder={isZh ? "英文" : "English"}
                      className="w-full text-[10px] px-1.5 py-0.5 rounded border border-border/30 bg-background/30 text-muted-foreground focus:ring-1 focus:ring-primary/30 outline-none" />
                  </div>
                  <div className="flex items-center gap-0.5 text-[9px] font-mono text-muted-foreground mt-1">
                    <span>{sub.startPct.toFixed(0)}%</span>
                    <span>→</span>
                    <span>{sub.endPct.toFixed(0)}%</span>
                  </div>
                  <button onClick={() => removeSubtitle(idx)} className="text-muted-foreground hover:text-destructive mt-1">
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}

              {subtitles.length === 0 && (
                <div className="flex items-center justify-center h-12 text-muted-foreground/40 text-[11px] border border-dashed border-border/30 rounded-lg">
                  {isZh ? "点击「AI生成」生成双语字幕" : "Click 'AI Gen' for bilingual subtitles"}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default VideoTimeline;
