import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Mic, MicOff, X, Upload, Loader2, ChevronRight,
  AlertTriangle, CheckCircle2, ArrowRight, Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VoiceTask {
  module: string;
  action: string;
  title_zh: string;
  title_en: string;
  description_zh: string;
  description_en: string;
  priority: "high" | "medium" | "low";
  route: string;
}

interface VoiceResult {
  summary_zh: string;
  summary_en: string;
  voice_command: string | null;
  tasks: VoiceTask[];
}

const MODULE_ICONS: Record<string, string> = {
  procurement: "🛒", inventory: "🍷", orders: "📋", kitchen: "👨‍🍳",
  hr: "👥", finance: "💰", delivery: "🚴", marketing: "📣",
  stores: "🏪", workflow: "⚙️", legal: "⚖️",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  low: "bg-muted text-muted-foreground border-border",
};

const VoiceAssistant = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isZh = i18n.language === "zh";

  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [mode, setMode] = useState<"idle" | "listening" | "uploading" | "result">("idle");

  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Setup Web Speech API
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: isZh ? "不支持语音识别" : "Speech recognition not supported",
        description: isZh ? "请使用 Chrome 浏览器" : "Please use Chrome browser",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = isZh ? "zh-CN" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
      setMode("idle");
    };

    recognition.onend = () => {
      setListening(false);
      if (finalTranscript.trim()) {
        processVoiceText(finalTranscript.trim());
      } else {
        setMode("idle");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setMode("listening");
    setTranscript("");
    setResult(null);
  }, [isZh]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  // Process voice text through AI
  const processVoiceText = async (text: string) => {
    setProcessing(true);
    setMode("result");

    try {
      const { data, error } = await supabase.functions.invoke("ai-voice-task", {
        body: { text, language: isZh ? "zh" : "en" },
      });

      if (error) throw error;

      setResult(data);

      // Handle voice navigation command
      if (data.voice_command) {
        toast({
          title: isZh ? "语音导航" : "Voice Navigation",
          description: isZh ? `正在跳转到 ${data.voice_command}` : `Navigating to ${data.voice_command}`,
        });
        navigate(data.voice_command);
        setOpen(false);
      }
    } catch (err: any) {
      console.error("Voice task error:", err);
      toast({
        title: isZh ? "处理失败" : "Processing failed",
        description: err.message,
        variant: "destructive",
      });
      setMode("idle");
    } finally {
      setProcessing(false);
    }
  };

  // Handle audio file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMode("uploading");
    setProcessing(true);

    // For now, use speech recognition API on the file
    // In production, this would call a transcription service
    toast({
      title: isZh ? "文件已上传" : "File uploaded",
      description: isZh
        ? "正在分析录音内容..."
        : "Analyzing recording...",
    });

    // Simulate transcription from file — use placeholder
    // A real implementation would use ElevenLabs or similar
    setTimeout(() => {
      setTranscript(isZh ? "(录音文件分析功能开发中，请使用实时语音)" : "(File analysis coming soon, please use live voice)");
      setProcessing(false);
      setMode("idle");
    }, 2000);
  };

  const handleTaskClick = (task: VoiceTask) => {
    navigate(task.route);
    setOpen(false);
    toast({
      title: isZh ? task.title_zh : task.title_en,
      description: isZh ? task.description_zh : task.description_en,
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  return (
    <>
      {/* Floating mic button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        whileTap={{ scale: 0.9 }}
        animate={listening ? { boxShadow: ["0 0 0 0 hsl(var(--primary)/0.4)", "0 0 0 20px hsl(var(--primary)/0)", "0 0 0 0 hsl(var(--primary)/0.4)"] } : {}}
        transition={listening ? { duration: 1.5, repeat: Infinity } : {}}
      >
        {listening ? <Volume2 className="w-6 h-6 animate-pulse" /> : <Mic className="w-6 h-6" />}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[520px] rounded-2xl border bg-card shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">
                  {isZh ? "语音智能助手" : "Voice Assistant"}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Controls */}
              <div className="flex gap-2">
                <Button
                  onClick={listening ? stopListening : startListening}
                  variant={listening ? "destructive" : "default"}
                  className="flex-1 gap-2"
                  disabled={processing}
                >
                  {listening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      {isZh ? "停止录音" : "Stop"}
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      {isZh ? "开始说话" : "Start Speaking"}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processing || listening}
                  title={isZh ? "上传录音文件" : "Upload recording"}
                >
                  <Upload className="w-4 h-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Live transcript */}
              {(listening || transcript) && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    {isZh ? "实时转写" : "Live Transcript"}
                  </p>
                  <p className="text-sm leading-relaxed min-h-[40px]">
                    {transcript || (
                      <span className="text-muted-foreground italic">
                        {isZh ? "请开始说话..." : "Start speaking..."}
                      </span>
                    )}
                  </p>
                  {listening && (
                    <div className="flex items-center gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-primary rounded-full"
                          animate={{ height: [4, 16, 4] }}
                          transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Processing */}
              {processing && (
                <div className="flex items-center justify-center gap-2 py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {isZh ? "AI 正在分析任务..." : "AI analyzing tasks..."}
                  </span>
                </div>
              )}

              {/* Results */}
              {result && !processing && (
                <div className="space-y-3">
                  {/* Summary */}
                  <div className="rounded-lg border bg-primary/5 p-3">
                    <p className="text-xs font-medium text-primary mb-1">
                      {isZh ? "AI 理解" : "AI Understanding"}
                    </p>
                    <p className="text-sm">{isZh ? result.summary_zh : result.summary_en}</p>
                  </div>

                  {/* Tasks */}
                  {result.tasks.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {isZh ? `已识别 ${result.tasks.length} 个任务` : `${result.tasks.length} tasks identified`}
                      </p>
                      {result.tasks.map((task, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          onClick={() => handleTaskClick(task)}
                          className="w-full text-left rounded-lg border p-3 hover:bg-accent/50 transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{MODULE_ICONS[task.module] || "📌"}</span>
                              <div>
                                <p className="text-sm font-medium">
                                  {isZh ? task.title_zh : task.title_en}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {isZh ? task.description_zh : task.description_en}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${PRIORITY_COLORS[task.priority]}`}
                              >
                                {task.priority === "high"
                                  ? isZh ? "紧急" : "High"
                                  : task.priority === "medium"
                                  ? isZh ? "中等" : "Med"
                                  : isZh ? "低" : "Low"}
                              </Badge>
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {isZh ? "未识别到需要处理的任务" : "No actionable tasks identified"}
                    </div>
                  )}

                  {/* Reset */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setResult(null);
                      setTranscript("");
                      setMode("idle");
                    }}
                  >
                    {isZh ? "重新开始" : "Start Over"}
                  </Button>
                </div>
              )}

              {/* Idle tips */}
              {mode === "idle" && !result && !transcript && (
                <div className="text-xs text-muted-foreground space-y-2 pt-2">
                  <p className="font-medium">{isZh ? "💡 试试这样说：" : "💡 Try saying:"}</p>
                  <ul className="space-y-1 pl-4">
                    <li>{isZh ? "「帮我下一个青岛啤酒的采购单」" : '"Create a purchase order for Tsingtao Beer"'}</li>
                    <li>{isZh ? "「明天需要多排一个厨师上班」" : '"Schedule an extra chef for tomorrow"'}</li>
                    <li>{isZh ? "「打开财务页面」" : '"Open the finance page"'}</li>
                    <li>{isZh ? "「库存不够了，帮我补货」" : '"Inventory is low, help me restock"'}</li>
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceAssistant;
