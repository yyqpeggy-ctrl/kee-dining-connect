import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Music2, Search, Play, Pause, Check, Upload, Loader2, Library, Plus } from "lucide-react";
import { toast } from "sonner";

interface BGMTrack {
  id: string;
  name: string;
  name_en: string;
  artist: string;
  category: string;
  style: string;
  duration_seconds: number;
  file_url: string;
  bpm: number;
  mood: string;
  tags: string[];
  is_preset: boolean;
}

interface BGMLibraryProps {
  onSelect: (url: string, name: string) => void;
  isZh: boolean;
}

const CATEGORIES = [
  { key: "all", zh: "全部", en: "All" },
  { key: "ambient", zh: "氛围", en: "Ambient" },
  { key: "upbeat", zh: "活力", en: "Upbeat" },
  { key: "chill", zh: "轻松", en: "Chill" },
  { key: "cinematic", zh: "电影感", en: "Cinematic" },
  { key: "jazz", zh: "爵士", en: "Jazz" },
  { key: "electronic", zh: "电子", en: "Electronic" },
  { key: "classical", zh: "古典", en: "Classical" },
  { key: "custom", zh: "自定义", en: "Custom" },
];

const formatDuration = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const BGMLibrary = ({ onSelect, isZh }: BGMLibraryProps) => {
  const [open, setOpen] = useState(false);
  const [tracks, setTracks] = useState<BGMTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const fetchTracks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bgm_library")
      .select("*")
      .order("play_count", { ascending: false });
    if (!error && data) setTracks(data as BGMTrack[]);
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchTracks();
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, [open]);

  const filtered = tracks.filter(t => {
    const matchCat = category === "all" || t.category === category;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.name_en.toLowerCase().includes(search.toLowerCase()) || t.artist.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const togglePlay = (track: BGMTrack) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(track.file_url);
    audio.volume = 0.5;
    audio.play().catch(() => {});
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(track.id);
  };

  const handleSelect = (track: BGMTrack) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlayingId(null);
    // Increment play count
    supabase.from("bgm_library").update({ play_count: (track as any).play_count + 1 }).eq("id", track.id).then(() => {});
    onSelect(track.file_url, isZh ? track.name : (track.name_en || track.name));
    setOpen(false);
    toast.success(isZh ? `🎵 已选择: ${track.name}` : `🎵 Selected: ${track.name_en || track.name}`);
  };

  const handleUpload = async (file: File) => {
    if (!file || !file.type.startsWith("audio/")) {
      toast.error(isZh ? "请选择音频文件" : "Please select an audio file");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "mp3";
    const path = `custom/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("bgm-library").upload(path, file);
    if (uploadError) {
      toast.error(isZh ? "上传失败" : "Upload failed");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("bgm-library").getPublicUrl(path);
    const nameWithoutExt = file.name.replace(/\.[^.]+$/, "");

    // Get duration
    let dur = 0;
    try {
      const audio = new Audio(URL.createObjectURL(file));
      await new Promise<void>((resolve) => {
        audio.onloadedmetadata = () => { dur = Math.round(audio.duration); resolve(); };
        audio.onerror = () => resolve();
        setTimeout(resolve, 5000);
      });
    } catch {}

    const { error: insertError } = await supabase.from("bgm_library").insert({
      name: nameWithoutExt,
      name_en: nameWithoutExt,
      artist: isZh ? "自定义" : "Custom",
      category: "custom",
      style: "",
      duration_seconds: dur,
      file_url: urlData.publicUrl,
      bpm: 0,
      mood: "",
      tags: [],
      is_preset: false,
      uploaded_by: (await supabase.auth.getUser()).data.user?.id || null,
    });
    if (insertError) {
      toast.error(isZh ? "保存失败" : "Save failed");
    } else {
      toast.success(isZh ? "🎵 BGM 已上传到音乐库" : "🎵 BGM uploaded to library");
      fetchTracks();
    }
    setUploading(false);
  };

  const moodColors: Record<string, string> = {
    ambient: "bg-blue-500/10 text-blue-600",
    upbeat: "bg-orange-500/10 text-orange-600",
    chill: "bg-emerald-500/10 text-emerald-600",
    cinematic: "bg-purple-500/10 text-purple-600",
    jazz: "bg-amber-500/10 text-amber-700",
    electronic: "bg-cyan-500/10 text-cyan-600",
    classical: "bg-rose-500/10 text-rose-600",
    custom: "bg-muted text-muted-foreground",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full h-10 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center gap-2 text-xs text-primary hover:border-primary/60 hover:bg-primary/5 transition-colors">
          <Library className="w-3.5 h-3.5" />
          {isZh ? "从音乐库选择 BGM" : "Browse BGM Library"}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-primary" />
            {isZh ? "BGM 音乐库" : "BGM Library"}
          </DialogTitle>
        </DialogHeader>

        {/* Search + Upload */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder={isZh ? "搜索音乐名称、艺术家..." : "Search name, artist..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => uploadRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {isZh ? "上传" : "Upload"}
          </Button>
          <input ref={uploadRef} type="file" accept="audio/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                category === c.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {isZh ? c.zh : c.en}
            </button>
          ))}
        </div>

        {/* Track List */}
        <ScrollArea className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Music2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>{isZh ? "暂无音乐，点击上传添加" : "No tracks found. Upload to add."}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map(track => (
                <div
                  key={track.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer ${
                    playingId === track.id ? "bg-primary/5 ring-1 ring-primary/20" : ""
                  }`}
                >
                  {/* Play button */}
                  <button
                    onClick={() => togglePlay(track)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      playingId === track.id ? "bg-primary text-primary-foreground" : "bg-muted group-hover:bg-primary/10"
                    }`}
                  >
                    {playingId === track.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{isZh ? track.name : (track.name_en || track.name)}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {track.artist && <span className="text-[10px] text-muted-foreground">{track.artist}</span>}
                      {track.duration_seconds > 0 && <span className="text-[10px] text-muted-foreground">{formatDuration(track.duration_seconds)}</span>}
                      {track.bpm > 0 && <span className="text-[10px] text-muted-foreground">{track.bpm} BPM</span>}
                    </div>
                  </div>

                  {/* Tags */}
                  <Badge variant="outline" className={`text-[10px] ${moodColors[track.category] || ""}`}>
                    {CATEGORIES.find(c => c.key === track.category)?.[isZh ? "zh" : "en"] || track.category}
                  </Badge>

                  {/* Select button */}
                  <Button size="sm" variant="ghost" className="h-7 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleSelect(track)}>
                    <Check className="w-3 h-3 mr-1" />
                    {isZh ? "选用" : "Use"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BGMLibrary;
