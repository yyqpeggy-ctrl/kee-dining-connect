import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "@/contexts/StoreContext";
import { Video, Camera, AlertTriangle, Eye, EyeOff, Maximize2, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CameraFeed {
  id: string;
  nameZh: string;
  nameEn: string;
  storeId: string;
  storeNameZh: string;
  storeNameEn: string;
  location: string;
  status: "online" | "offline" | "alert";
  resolution: string;
  lastAlert?: string;
}

const cameras: CameraFeed[] = [
  { id: "cam-1", nameZh: "大堂主摄像头", nameEn: "Main Hall Camera", storeId: "flagship", storeNameZh: "旗舰店", storeNameEn: "Flagship", location: "大堂入口", status: "online", resolution: "1080p" },
  { id: "cam-2", nameZh: "吧台摄像头", nameEn: "Bar Camera", storeId: "flagship", storeNameZh: "旗舰店", storeNameEn: "Flagship", location: "吧台区域", status: "online", resolution: "1080p" },
  { id: "cam-3", nameZh: "厨房摄像头", nameEn: "Kitchen Camera", storeId: "flagship", storeNameZh: "旗舰店", storeNameEn: "Flagship", location: "厨房", status: "alert", resolution: "720p", lastAlert: "检测到异常人员" },
  { id: "cam-4", nameZh: "后门摄像头", nameEn: "Back Door Camera", storeId: "flagship", storeNameZh: "旗舰店", storeNameEn: "Flagship", location: "后门通道", status: "online", resolution: "720p" },
  { id: "cam-5", nameZh: "大堂摄像头", nameEn: "Main Hall Camera", storeId: "french", storeNameZh: "法租界店", storeNameEn: "French Concession", location: "大堂", status: "online", resolution: "1080p" },
  { id: "cam-6", nameZh: "包间摄像头", nameEn: "Private Room Camera", storeId: "french", storeNameZh: "法租界店", storeNameEn: "French Concession", location: "VIP包间走廊", status: "offline", resolution: "1080p" },
  { id: "cam-7", nameZh: "入口摄像头", nameEn: "Entrance Camera", storeId: "jingan", storeNameZh: "静安店", storeNameEn: "Jing'an", location: "正门入口", status: "online", resolution: "1080p" },
  { id: "cam-8", nameZh: "仓库摄像头", nameEn: "Storage Camera", storeId: "jingan", storeNameZh: "静安店", storeNameEn: "Jing'an", location: "仓储区", status: "online", resolution: "720p" },
];

const StoreVideoTab = () => {
  const { currentStore, isHQ } = useStore();
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [layout, setLayout] = useState<"grid" | "single">("grid");

  const filteredCameras = isHQ ? cameras : cameras.filter(c => c.storeId === currentStore.id);

  const onlineCount = filteredCameras.filter(c => c.status === "online").length;
  const alertCount = filteredCameras.filter(c => c.status === "alert").length;
  const offlineCount = filteredCameras.filter(c => c.status === "offline").length;

  const statusColor = (s: string) => {
    if (s === "online") return "bg-emerald-500";
    if (s === "alert") return "bg-amber-500 animate-pulse";
    return "bg-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center"><Camera className="w-5 h-5 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">{isZh ? "摄像头总数" : "Total Cameras"}</p><p className="text-xl font-bold font-display">{filteredCameras.length}</p></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center"><Eye className="w-5 h-5 text-emerald-500" /></div>
          <div><p className="text-xs text-muted-foreground">{isZh ? "在线" : "Online"}</p><p className="text-xl font-bold font-display text-emerald-500">{onlineCount}</p></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-500" /></div>
          <div><p className="text-xs text-muted-foreground">{isZh ? "告警" : "Alerts"}</p><p className="text-xl font-bold font-display text-amber-500">{alertCount}</p></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><EyeOff className="w-5 h-5 text-muted-foreground" /></div>
          <div><p className="text-xs text-muted-foreground">{isZh ? "离线" : "Offline"}</p><p className="text-xl font-bold font-display">{offlineCount}</p></div>
        </motion.div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant={layout === "grid" ? "default" : "outline"} size="sm" onClick={() => { setLayout("grid"); setSelectedCamera(null); }}>
            {isZh ? "多画面" : "Grid"}
          </Button>
          <Button variant={layout === "single" ? "default" : "outline"} size="sm" onClick={() => setLayout("single")}>
            {isZh ? "单画面" : "Single"}
          </Button>
        </div>
        {layout === "single" && (
          <Select value={selectedCamera || ""} onValueChange={setSelectedCamera}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder={isZh ? "选择摄像头" : "Select Camera"} /></SelectTrigger>
            <SelectContent>
              {filteredCameras.map(c => (
                <SelectItem key={c.id} value={c.id}>{isZh ? `${c.storeNameZh} - ${c.nameZh}` : `${c.storeNameEn} - ${c.nameEn}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Camera Grid */}
      <div className={layout === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : ""}>
        {(layout === "single" ? filteredCameras.filter(c => c.id === selectedCamera || !selectedCamera) .slice(0, 1) : filteredCameras).map((cam, i) => (
          <motion.div key={cam.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`glass-card rounded-xl overflow-hidden ${cam.status === "alert" ? "ring-1 ring-amber-500/50" : ""}`}
          >
            {/* Video placeholder */}
            <div className={`relative bg-black/90 flex items-center justify-center ${layout === "single" ? "aspect-video" : "aspect-video"}`}>
              {cam.status === "offline" ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <EyeOff className="w-8 h-8" />
                  <span className="text-xs">{isZh ? "信号中断" : "Signal Lost"}</span>
                </div>
              ) : (
                <>
                  <Video className="w-10 h-10 text-muted-foreground/30" />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${statusColor(cam.status)}`} />
                    <span className="text-[10px] text-white/70 font-mono">LIVE</span>
                  </div>
                  <div className="absolute top-2 right-2 text-[10px] text-white/50 font-mono">{cam.resolution}</div>
                  <div className="absolute bottom-2 left-2 text-[10px] text-white/60 font-mono">
                    {new Date().toLocaleTimeString()}
                  </div>
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    <button className="p-1 rounded bg-white/10 hover:bg-white/20 transition-colors"><Volume2 className="w-3 h-3 text-white/70" /></button>
                    <button className="p-1 rounded bg-white/10 hover:bg-white/20 transition-colors" onClick={() => { setLayout("single"); setSelectedCamera(cam.id); }}><Maximize2 className="w-3 h-3 text-white/70" /></button>
                  </div>
                </>
              )}
            </div>
            {/* Info */}
            <div className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{isZh ? cam.nameZh : cam.nameEn}</span>
                <Badge variant={cam.status === "online" ? "default" : cam.status === "alert" ? "destructive" : "secondary"} className="text-[10px]">
                  {cam.status === "online" ? (isZh ? "在线" : "Online") : cam.status === "alert" ? (isZh ? "告警" : "Alert") : (isZh ? "离线" : "Offline")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{isZh ? cam.storeNameZh : cam.storeNameEn} · {cam.location}</p>
              {cam.lastAlert && <p className="text-xs text-amber-500 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{cam.lastAlert}</p>}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredCameras.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{isZh ? "该门店暂无摄像头" : "No cameras for this store"}</p>
        </div>
      )}
    </div>
  );
};

export default StoreVideoTab;
