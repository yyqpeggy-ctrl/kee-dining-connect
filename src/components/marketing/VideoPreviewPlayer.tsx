import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Maximize2, Subtitles, Type, AudioLines, Download, RotateCcw
} from "lucide-react";
import type { VideoSubtitle, SubtitleStyle } from "@/lib/videoEditor";

interface VideoPreviewPlayerProps {
  videoSrc?: string;
  isZh: boolean;
  subtitles: VideoSubtitle[];
  subtitleStyle: SubtitleStyle;
  showSubtitles: boolean;
  setShowSubtitles: (v: boolean) => void;
  showWaveform: boolean;
  setShowWaveform: (v: boolean) => void;
  showSubtitleSettings: boolean;
  setShowSubtitleSettings: (v: boolean) => void;
  onSubtitleStyleChange: (style: SubtitleStyle) => void;
  defaultSubtitleStyle: SubtitleStyle;
  bgmName?: string;
  bgmUrl?: string;
  isPlaying: boolean;
  playProgress: number;
  currentTime: number;
  videoDuration: number;
  playbackRate: number;
  isMuted: boolean;
  onTogglePlay: () => void;
  onSeek: (values: number[]) => void;
  onSkip: (delta: number) => void;
  onSetPlaybackRate: (rate: number) => void;
  onSetMuted: (v: boolean) => void;
  onDownload?: () => void;
  compact?: boolean;
}

const VideoPreviewPlayer = ({
  videoSrc, isZh, subtitles, subtitleStyle, showSubtitles, setShowSubtitles,
  showWaveform, setShowWaveform, showSubtitleSettings, setShowSubtitleSettings,
  onSubtitleStyleChange, defaultSubtitleStyle, bgmName, bgmUrl,
  isPlaying, playProgress, currentTime, videoDuration, playbackRate, isMuted,
  onTogglePlay, onSeek, onSkip, onSetPlaybackRate, onSetMuted, onDownload, compact
}: VideoPreviewPlayerProps) => {

  const currentSubtitle = subtitles.find(s => playProgress >= s.startPct && playProgress < s.endPct);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getSubtitlePosition = () => {
    if (subtitleStyle.position === "top") return "top-[10%]";
    if (subtitleStyle.position === "center") return "top-1/2 -translate-y-1/2";
    return "bottom-[8%]";
  };

  return (
    <div className="flex flex-col h-full bg-black/90 rounded-xl overflow-hidden border border-border/30">
      {/* Video Preview Area */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center bg-gradient-to-b from-black/60 to-black/90">
        {videoSrc ? (
          <video
            src={videoSrc}
            className="max-w-full max-h-full object-contain"
            muted={isMuted}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground/40">
            <Play className="w-16 h-16" />
            <p className="text-sm">{isZh ? "预览区域" : "Preview Area"}</p>
          </div>
        )}

        {/* Subtitle Overlay */}
        {showSubtitles && currentSubtitle && (
          <div className={`absolute left-0 right-0 ${getSubtitlePosition()} px-6 z-10 pointer-events-none`}>
            <div
              className="mx-auto max-w-[85%] px-5 py-3 rounded-lg backdrop-blur-md"
              style={{
                backgroundColor: `${subtitleStyle.bgColor}${Math.round(subtitleStyle.bgOpacity * 255).toString(16).padStart(2, '0')}`,
              }}
            >
              <p className="text-center font-bold leading-snug" style={{ color: subtitleStyle.zhColor, fontSize: `${1.1 * subtitleStyle.zhFontScale}rem` }}>
                {currentSubtitle.zh}
              </p>
              <p className="text-center leading-relaxed italic mt-0.5" style={{ color: subtitleStyle.enColor, fontSize: `${0.75 * subtitleStyle.enFontScale}rem` }}>
                {currentSubtitle.en}
              </p>
            </div>
          </div>
        )}

        {/* Subtitle indicator */}
        {showSubtitles && (
          <div className="absolute bottom-3 left-3 z-10">
            <Badge className="text-[9px] bg-primary/60 text-white border-none gap-1">
              <Subtitles className="w-2.5 h-2.5" />AI {isZh ? "字幕" : "Subs"}
            </Badge>
          </div>
        )}

        {/* Playback Rate Badge */}
        {playbackRate !== 1 && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="text-[9px] bg-black/60 text-white border-none font-mono">
              {playbackRate}x
            </Badge>
          </div>
        )}
      </div>

      {/* Transport Controls */}
      <div className="bg-secondary/40 backdrop-blur-sm border-t border-border/30 px-3 py-2 space-y-1.5">
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground w-10 text-right">
            {videoDuration > 0 ? formatTime(currentTime) : formatTime(playProgress * 0.15 / 100 * 60)}
          </span>
          <div className="flex-1 group relative">
            <Slider
              value={[playProgress]}
              max={100}
              step={0.1}
              onValueChange={onSeek}
              className="flex-1"
            />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground w-10">
            {videoDuration > 0 ? formatTime(videoDuration) : "0:30"}
          </span>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-foreground/70 hover:text-foreground" onClick={() => onSkip(-5)}>
              <SkipBack className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 text-primary"
              onClick={onTogglePlay}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-foreground/70 hover:text-foreground" onClick={() => onSkip(5)}>
              <SkipForward className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Speed control */}
          <div className="flex items-center gap-[2px] bg-muted/40 rounded-md px-0.5 py-0.5">
            {[0.5, 1, 1.5, 2].map(rate => (
              <button
                key={rate}
                onClick={() => onSetPlaybackRate(rate)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors ${
                  playbackRate === rate
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-foreground/70 hover:text-foreground" onClick={() => setShowSubtitles(!showSubtitles)} title={isZh ? "字幕" : "Subtitles"}>
              <Subtitles className={`w-3.5 h-3.5 ${showSubtitles ? "text-primary" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-foreground/70 hover:text-foreground" onClick={() => setShowSubtitleSettings(!showSubtitleSettings)} title={isZh ? "字幕设置" : "Subtitle Settings"}>
              <Type className={`w-3.5 h-3.5 ${showSubtitleSettings ? "text-primary" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-foreground/70 hover:text-foreground" onClick={() => setShowWaveform(!showWaveform)} title={isZh ? "音轨" : "Waveform"}>
              <AudioLines className={`w-3.5 h-3.5 ${showWaveform ? "text-primary" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-foreground/70 hover:text-foreground" onClick={() => onSetMuted(!isMuted)}>
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </Button>
            {onDownload && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-foreground/70 hover:text-foreground" onClick={onDownload}>
                <Download className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Subtitle Settings Popover */}
      {showSubtitleSettings && (
        <div className="bg-secondary/60 backdrop-blur-sm border-t border-border/30 px-4 py-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">{isZh ? "字幕样式" : "Subtitle Style"}</span>
            <Button variant="ghost" size="sm" className="h-5 text-[9px] text-muted-foreground" onClick={() => onSubtitleStyleChange({ ...defaultSubtitleStyle })}>
              <RotateCcw className="w-2.5 h-2.5 mr-1" />{isZh ? "重置" : "Reset"}
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground">{isZh ? "位置" : "Position"}</label>
              <div className="flex gap-0.5">
                {(["top", "center", "bottom"] as const).map(pos => (
                  <Button key={pos} variant={subtitleStyle.position === pos ? "default" : "outline"} size="sm" className="flex-1 h-5 text-[8px] px-1" onClick={() => onSubtitleStyleChange({ ...subtitleStyle, position: pos })}>
                    {pos === "top" ? "↑" : pos === "center" ? "─" : "↓"}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground">{isZh ? "中文色" : "CN"}</label>
              <input type="color" value={subtitleStyle.zhColor} onChange={e => onSubtitleStyleChange({ ...subtitleStyle, zhColor: e.target.value })} className="w-full h-5 rounded border border-border cursor-pointer" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground">{isZh ? "英文色" : "EN"}</label>
              <input type="color" value={subtitleStyle.enColor} onChange={e => onSubtitleStyleChange({ ...subtitleStyle, enColor: e.target.value })} className="w-full h-5 rounded border border-border cursor-pointer" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground">{isZh ? "背景色" : "BG"}</label>
              <input type="color" value={subtitleStyle.bgColor} onChange={e => onSubtitleStyleChange({ ...subtitleStyle, bgColor: e.target.value })} className="w-full h-5 rounded border border-border cursor-pointer" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-0.5">
              <label className="text-[9px] text-muted-foreground">{isZh ? "中文字号" : "CN Size"} {Math.round(subtitleStyle.zhFontScale * 100)}%</label>
              <Slider value={[subtitleStyle.zhFontScale]} min={0.5} max={2.0} step={0.1} onValueChange={([v]) => onSubtitleStyleChange({ ...subtitleStyle, zhFontScale: v })} />
            </div>
            <div className="space-y-0.5">
              <label className="text-[9px] text-muted-foreground">{isZh ? "英文字号" : "EN Size"} {Math.round(subtitleStyle.enFontScale * 100)}%</label>
              <Slider value={[subtitleStyle.enFontScale]} min={0.5} max={2.0} step={0.1} onValueChange={([v]) => onSubtitleStyleChange({ ...subtitleStyle, enFontScale: v })} />
            </div>
            <div className="space-y-0.5">
              <label className="text-[9px] text-muted-foreground">{isZh ? "背景透明" : "BG Opacity"} {Math.round(subtitleStyle.bgOpacity * 100)}%</label>
              <Slider value={[subtitleStyle.bgOpacity]} min={0} max={1} step={0.05} onValueChange={([v]) => onSubtitleStyleChange({ ...subtitleStyle, bgOpacity: v })} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPreviewPlayer;
