import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone, MessageCircle, MapPin, FileText, UserPlus, ShoppingCart,
  Star, Handshake, Calendar, Plus, Clock, CheckCircle2, ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";

interface Activity {
  id: string;
  lead_id: string;
  activity_type: string;
  title: string;
  description: string;
  created_at: string;
}

interface LeadActivityTimelineProps {
  leadId: string;
  leadName: string;
  leadStatus: string;
}

const activityConfig: Record<string, { icon: React.ReactNode; color: string; labelZh: string; labelEn: string }> = {
  source: { icon: <Star className="w-3.5 h-3.5" />, color: "bg-amber-500", labelZh: "渠道来源", labelEn: "Source" },
  call: { icon: <Phone className="w-3.5 h-3.5" />, color: "bg-blue-500", labelZh: "电话沟通", labelEn: "Call" },
  wechat: { icon: <MessageCircle className="w-3.5 h-3.5" />, color: "bg-green-500", labelZh: "微信互动", labelEn: "WeChat" },
  visit: { icon: <MapPin className="w-3.5 h-3.5" />, color: "bg-purple-500", labelZh: "到店拜访", labelEn: "Visit" },
  meeting: { icon: <Calendar className="w-3.5 h-3.5" />, color: "bg-indigo-500", labelZh: "会议洽谈", labelEn: "Meeting" },
  note: { icon: <FileText className="w-3.5 h-3.5" />, color: "bg-slate-500", labelZh: "跟进备注", labelEn: "Note" },
  referral: { icon: <Handshake className="w-3.5 h-3.5" />, color: "bg-orange-500", labelZh: "引荐推荐", labelEn: "Referral" },
  order: { icon: <ShoppingCart className="w-3.5 h-3.5" />, color: "bg-emerald-500", labelZh: "消费下单", labelEn: "Order" },
  converted: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "bg-primary", labelZh: "转化成功", labelEn: "Converted" },
};

const LeadActivityTimeline = ({ leadId, leadName, leadStatus }: LeadActivityTimelineProps) => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState("note");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from("lead_activities")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true });
    if (!error) setActivities((data as Activity[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchActivities(); }, [leadId]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    const { error } = await supabase.from("lead_activities").insert({
      lead_id: leadId,
      activity_type: newType,
      title: newTitle,
      description: newDesc,
    } as any);
    if (error) { toast.error(isZh ? "添加失败" : "Failed to add"); return; }
    toast.success(isZh ? "跟进记录已添加" : "Activity added");
    setNewTitle(""); setNewDesc(""); setShowAdd(false);
    fetchActivities();
  };

  // Conversion funnel stages
  const stages = ["source", "call", "wechat", "visit", "meeting", "order", "converted"];
  const completedStages = new Set(activities.map(a => a.activity_type));
  const currentStageIndex = stages.reduce((max, stage, idx) => completedStages.has(stage) ? idx : max, -1);

  return (
    <div className="space-y-4">
      {/* Conversion Pipeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-primary" />
            {isZh ? "转化进度" : "Conversion Pipeline"} — {leadName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {stages.map((stage, idx) => {
              const config = activityConfig[stage];
              const completed = completedStages.has(stage);
              const isCurrent = idx === currentStageIndex;
              return (
                <div key={stage} className="flex items-center">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    completed
                      ? isCurrent ? `${config.color} text-white` : "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {config.icon}
                    <span className="whitespace-nowrap">{isZh ? config.labelZh : config.labelEn}</span>
                  </div>
                  {idx < stages.length - 1 && (
                    <div className={`w-4 h-0.5 mx-0.5 ${completed && completedStages.has(stages[idx + 1]) ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            {isZh ? "跟进时间线" : "Activity Timeline"}
            <Badge variant="secondary" className="text-xs">{activities.length}</Badge>
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            {isZh ? "添加记录" : "Add Activity"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add form */}
          {showAdd && (
            <div className="bg-muted/50 border rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {Object.entries(activityConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-1.5">{cfg.icon} {isZh ? cfg.labelZh : cfg.labelEn}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input className="h-8 text-xs" placeholder={isZh ? "标题" : "Title"} value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              </div>
              <Textarea className="text-xs" rows={2} placeholder={isZh ? "详细描述..." : "Details..."} value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>{isZh ? "取消" : "Cancel"}</Button>
                <Button size="sm" onClick={handleAdd} disabled={!newTitle.trim()}>{isZh ? "保存" : "Save"}</Button>
              </div>
            </div>
          )}

          {/* Timeline */}
          {loading ? (
            <p className="text-center text-muted-foreground text-sm py-6">{isZh ? "加载中..." : "Loading..."}</p>
          ) : activities.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">{isZh ? "暂无跟进记录" : "No activities yet"}</p>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="relative pl-6 space-y-0">
                {/* Vertical line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

                {activities.map((activity, idx) => {
                  const config = activityConfig[activity.activity_type] || activityConfig.note;
                  const isLast = idx === activities.length - 1;
                  return (
                    <div key={activity.id} className="relative pb-4">
                      {/* Dot */}
                      <div className={`absolute -left-6 top-1 w-[22px] h-[22px] rounded-full flex items-center justify-center text-white ${config.color} ring-2 ring-background`}>
                        {config.icon}
                      </div>

                      <div className="bg-card border rounded-lg p-3 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {isZh ? config.labelZh : config.labelEn}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(activity.created_at), {
                                  addSuffix: true,
                                  locale: isZh ? zhCN : enUS,
                                })}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground">{activity.title}</p>
                            {activity.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed">{activity.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadActivityTimeline;
