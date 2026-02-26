import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Upload, Calendar, Bell, CheckCircle2, AlertTriangle,
  Settings, Plus, Trash2, FileSpreadsheet, FolderOpen, RefreshCw,
  ChevronDown, ChevronUp, Eye
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const SOURCE_TYPES = [
  { value: "keruyun", labelZh: "客如云点单", labelEn: "Keruyun Orders", icon: "🍽️", namingZh: "客如云_YYYYMMDD.xlsx", folder: "keruyun" },
  { value: "lakala", labelZh: "拉卡拉收银", labelEn: "Lakala POS", icon: "💳", namingZh: "拉卡拉_YYYYMMDD.xlsx", folder: "lakala" },
  { value: "bank", labelZh: "银行入账明细", labelEn: "Bank Statement", icon: "🏦", namingZh: "银行明细_YYYYMMDD.xlsx", folder: "bank" },
];

const DAYS_ZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FREQ_OPTIONS = [
  { value: "daily", labelZh: "每天", labelEn: "Daily" },
  { value: "weekly", labelZh: "每周", labelEn: "Weekly" },
  { value: "monthly", labelZh: "每月", labelEn: "Monthly" },
];

const DataImportScheduler = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const { storeName, storeId } = useStore();
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    source_type: "keruyun",
    frequency: "weekly",
    day_of_week: 1,
    day_of_month: 1,
    reminder_hour: 9,
    notes: "",
  });

  // Fetch schedules
  const { data: schedules = [] } = useQuery({
    queryKey: ["import-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_import_schedules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch reminders
  const { data: reminders = [] } = useQuery({
    queryKey: ["import-reminders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_import_reminders")
        .select("*, data_import_schedules(*)")
        .order("due_date", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  // Fetch import records
  const { data: records = [] } = useQuery({
    queryKey: ["import-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_import_records")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Add schedule
  const addSchedule = useMutation({
    mutationFn: async () => {
      const source = SOURCE_TYPES.find(s => s.value === newSchedule.source_type)!;
      const { error } = await supabase.from("data_import_schedules").insert({
        source_type: newSchedule.source_type,
        source_label_zh: source.labelZh,
        source_label_en: source.labelEn,
        file_naming_rule: source.namingZh,
        upload_folder: source.folder,
        frequency: newSchedule.frequency,
        day_of_week: newSchedule.day_of_week,
        day_of_month: newSchedule.day_of_month,
        reminder_hour: newSchedule.reminder_hour,
        notes: newSchedule.notes,
        store_id: storeId || "",
        store_name_zh: storeName(true) || "",
        store_name_en: storeName(false) || "",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["import-schedules"] });
      setShowAddDialog(false);
      toast.success(isZh ? "导入计划已创建" : "Import schedule created");
    },
    onError: () => toast.error(isZh ? "创建失败" : "Failed to create"),
  });

  // Toggle schedule active
  const toggleSchedule = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("data_import_schedules").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["import-schedules"] }),
  });

  // Delete schedule
  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("data_import_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["import-schedules"] });
      toast.success(isZh ? "已删除" : "Deleted");
    },
  });

  // Upload file for a schedule
  const handleFileUpload = async (scheduleId: string, sourceType: string, file: File) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const folder = SOURCE_TYPES.find(s => s.value === sourceType)?.folder || sourceType;
    const filePath = `${folder}/${dateStr}_${file.name}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("data-imports")
      .upload(filePath, file);

    if (uploadError) {
      toast.error(isZh ? "上传失败" : "Upload failed");
      return;
    }

    // Create import record
    const weekNum = getWeekNumber(now);
    const { error: recordError } = await supabase.from("data_import_records").insert({
      schedule_id: scheduleId,
      source_type: sourceType,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      period_label: `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`,
      status: "uploaded",
      uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      store_id: storeId || "",
      store_name_zh: storeName(true) || "",
      store_name_en: storeName(false) || "",
    });

    if (recordError) {
      toast.error(isZh ? "记录创建失败" : "Record creation failed");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["import-records"] });
    toast.success(isZh ? `${file.name} 已上传成功` : `${file.name} uploaded successfully`);
  };

  const getWeekNumber = (d: Date): number => {
    const oneJan = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
  };

  const getFrequencyLabel = (schedule: any) => {
    if (schedule.frequency === "daily") return isZh ? "每天" : "Daily";
    if (schedule.frequency === "weekly") return isZh ? `每${DAYS_ZH[schedule.day_of_week]}` : `Every ${DAYS_EN[schedule.day_of_week]}`;
    return isZh ? `每月${schedule.day_of_month}号` : `${schedule.day_of_month}th of month`;
  };

  const pendingReminders = reminders.filter((r: any) => r.status === "pending" || r.status === "overdue");

  return (
    <div className="space-y-5">
      {/* Pending Reminders Alert */}
      {pendingReminders.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-warning animate-pulse" />
              <span className="text-sm font-bold text-warning">
                {isZh ? `${pendingReminders.length} 项数据待导入` : `${pendingReminders.length} imports pending`}
              </span>
            </div>
            <div className="space-y-1.5">
              {pendingReminders.slice(0, 3).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between text-xs bg-background/50 rounded-md px-3 py-2">
                  <span>
                    {SOURCE_TYPES.find(s => s.value === r.data_import_schedules?.source_type)?.icon}{" "}
                    {isZh ? r.data_import_schedules?.source_label_zh : r.data_import_schedules?.source_label_en}
                  </span>
                  <Badge variant="outline" className={r.status === "overdue" ? "text-destructive border-destructive/30" : "text-warning border-warning/30"}>
                    {r.status === "overdue" ? (isZh ? "已逾期" : "Overdue") : (isZh ? "待上传" : "Pending")}
                  </Badge>
                  <span className="text-muted-foreground">{r.due_date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="schedules">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="schedules" className="text-xs gap-1">
            <Settings className="w-3.5 h-3.5" />{isZh ? "导入计划" : "Schedules"}
          </TabsTrigger>
          <TabsTrigger value="upload" className="text-xs gap-1">
            <Upload className="w-3.5 h-3.5" />{isZh ? "上传数据" : "Upload"}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5" />{isZh ? "导入记录" : "History"}
          </TabsTrigger>
        </TabsList>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {isZh ? "配置定期数据导入计划，系统会提前提醒操作员准备数据" : "Configure import schedules with operator reminders"}
            </p>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs gap-1"><Plus className="w-3.5 h-3.5" />{isZh ? "添加计划" : "Add Schedule"}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isZh ? "新建导入计划" : "New Import Schedule"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{isZh ? "数据来源" : "Data Source"}</Label>
                    <Select value={newSchedule.source_type} onValueChange={v => setNewSchedule(p => ({ ...p, source_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SOURCE_TYPES.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.icon} {isZh ? s.labelZh : s.labelEn}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{isZh ? "导入频率" : "Frequency"}</Label>
                    <Select value={newSchedule.frequency} onValueChange={v => setNewSchedule(p => ({ ...p, frequency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FREQ_OPTIONS.map(f => (
                          <SelectItem key={f.value} value={f.value}>{isZh ? f.labelZh : f.labelEn}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {newSchedule.frequency === "weekly" && (
                    <div>
                      <Label>{isZh ? "每周几" : "Day of Week"}</Label>
                      <Select value={String(newSchedule.day_of_week)} onValueChange={v => setNewSchedule(p => ({ ...p, day_of_week: parseInt(v) }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DAYS_ZH.map((d, i) => (
                            <SelectItem key={i} value={String(i)}>{isZh ? d : DAYS_EN[i]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {newSchedule.frequency === "monthly" && (
                    <div>
                      <Label>{isZh ? "每月几号" : "Day of Month"}</Label>
                      <Input type="number" min={1} max={28} value={newSchedule.day_of_month} onChange={e => setNewSchedule(p => ({ ...p, day_of_month: parseInt(e.target.value) || 1 }))} />
                    </div>
                  )}
                  <div>
                    <Label>{isZh ? "提醒时间（小时）" : "Reminder Hour"}</Label>
                    <Input type="number" min={0} max={23} value={newSchedule.reminder_hour} onChange={e => setNewSchedule(p => ({ ...p, reminder_hour: parseInt(e.target.value) || 9 }))} />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {isZh ? `系统将在导入日${newSchedule.reminder_hour}:00提醒操作员` : `Operator will be reminded at ${newSchedule.reminder_hour}:00`}
                    </p>
                  </div>
                  <div>
                    <Label>{isZh ? "文件命名规则" : "File Naming Rule"}</Label>
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 font-mono">
                      {SOURCE_TYPES.find(s => s.value === newSchedule.source_type)?.namingZh}
                    </div>
                  </div>
                  <div>
                    <Label>{isZh ? "备注" : "Notes"}</Label>
                    <Input value={newSchedule.notes} onChange={e => setNewSchedule(p => ({ ...p, notes: e.target.value }))} placeholder={isZh ? "可选" : "Optional"} />
                  </div>
                  <Button className="w-full" onClick={() => addSchedule.mutate()} disabled={addSchedule.isPending}>
                    {isZh ? "创建计划" : "Create Schedule"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {schedules.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Calendar className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">{isZh ? "暂无导入计划，请点击上方添加" : "No schedules yet, add one above"}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {schedules.map((s: any) => {
                const source = SOURCE_TYPES.find(st => st.value === s.source_type);
                return (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{source?.icon}</span>
                        <div>
                          <p className="text-sm font-bold">{isZh ? s.source_label_zh : s.source_label_en}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {getFrequencyLabel(s)} · {s.reminder_hour}:00 {isZh ? "提醒" : "reminder"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono">{s.file_naming_rule}</Badge>
                        <Switch
                          checked={s.is_active}
                          onCheckedChange={(v) => toggleSchedule.mutate({ id: s.id, is_active: v })}
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteSchedule.mutate(s.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {s.notes && <p className="text-[10px] text-muted-foreground mt-2 pl-9">{s.notes}</p>}
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {isZh ? "按照命名规则上传对应的数据文件，支持 .xlsx/.xls/.csv 格式" : "Upload data files following the naming rules (.xlsx/.xls/.csv)"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SOURCE_TYPES.map(source => {
              const schedule = schedules.find((s: any) => s.source_type === source.value && s.is_active);
              const latestRecord = records.find((r: any) => r.source_type === source.value);
              return (
                <Card key={source.value} className="relative overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span>{source.icon}</span>
                      {isZh ? source.labelZh : source.labelEn}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-[10px] text-muted-foreground space-y-1">
                      <p>📁 {isZh ? "命名规则" : "Naming"}: <span className="font-mono text-foreground">{source.namingZh}</span></p>
                      <p>📂 {isZh ? "上传目录" : "Folder"}: <span className="font-mono text-foreground">data-imports/{source.folder}/</span></p>
                      {schedule && (
                        <p>⏰ {getFrequencyLabel(schedule)} · {schedule.reminder_hour}:00</p>
                      )}
                    </div>
                    {latestRecord && (
                      <div className="text-[10px] bg-muted/50 rounded-md px-2 py-1.5">
                        <span className="text-muted-foreground">{isZh ? "最近上传" : "Last"}: </span>
                        <span className="font-medium">{latestRecord.file_name}</span>
                        <Badge className="ml-1 text-[8px]" variant={latestRecord.status === "completed" ? "default" : "secondary"}>
                          {latestRecord.status}
                        </Badge>
                      </div>
                    )}
                    <label className="block">
                      <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                        <Upload className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                        <p className="text-[10px] text-muted-foreground">{isZh ? "点击或拖拽上传" : "Click or drag to upload"}</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".xlsx,.xls,.csv"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(schedule?.id || "", source.value, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          {records.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <FileSpreadsheet className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">{isZh ? "暂无导入记录" : "No import records yet"}</p>
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{isZh ? "来源" : "Source"}</TableHead>
                  <TableHead className="text-xs">{isZh ? "文件名" : "File"}</TableHead>
                  <TableHead className="text-xs">{isZh ? "周期" : "Period"}</TableHead>
                  <TableHead className="text-xs">{isZh ? "大小" : "Size"}</TableHead>
                  <TableHead className="text-xs">{isZh ? "状态" : "Status"}</TableHead>
                  <TableHead className="text-xs">{isZh ? "上传时间" : "Uploaded"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r: any) => {
                  const source = SOURCE_TYPES.find(s => s.value === r.source_type);
                  const statusColor: Record<string, string> = {
                    pending: "bg-muted text-muted-foreground",
                    uploaded: "bg-info/10 text-info",
                    processing: "bg-warning/10 text-warning",
                    completed: "bg-success/10 text-success",
                    failed: "bg-destructive/10 text-destructive",
                  };
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{source?.icon} {isZh ? source?.labelZh : source?.labelEn}</TableCell>
                      <TableCell className="text-xs font-mono">{r.file_name}</TableCell>
                      <TableCell className="text-xs">{r.period_label}</TableCell>
                      <TableCell className="text-xs">{(r.file_size / 1024).toFixed(1)} KB</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${statusColor[r.status] || ""}`}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString(isZh ? "zh-CN" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataImportScheduler;
