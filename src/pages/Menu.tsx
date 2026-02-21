import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, UtensilsCrossed, Wine, CakeSlice, Martini, Star, Gamepad2, X, ChevronDown, ChevronUp, FlaskConical, AlertTriangle, TrendingUp, PieChart as PieChartIcon, Clock, CalendarDays, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

type Ingredient = {
  name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
};

type MenuItem = {
  id: string;
  name_zh: string;
  name_en: string;
  description_zh: string;
  description_en: string;
  category: string;
  price: number;
  image_url: string;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  ingredients: Ingredient[];
  cost_price: number;
  schedule_days: string[];
  schedule_time: string;
  max_participants: number;
};

const CATEGORIES = ["tapas", "mains", "cocktails", "drinks", "desserts", "entertainment"];

const categoryIcons: Record<string, React.ReactNode> = {
  tapas: <UtensilsCrossed className="w-4 h-4" />,
  mains: <UtensilsCrossed className="w-4 h-4" />,
  cocktails: <Martini className="w-4 h-4" />,
  drinks: <Wine className="w-4 h-4" />,
  desserts: <CakeSlice className="w-4 h-4" />,
  entertainment: <Gamepad2 className="w-4 h-4" />,
};

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const emptyItem: Omit<MenuItem, "id"> = {
  name_zh: "", name_en: "", description_zh: "", description_en: "",
  category: "tapas", price: 0, image_url: "", is_available: true, is_featured: false, sort_order: 0,
  ingredients: [], cost_price: 0, schedule_days: [], schedule_time: "", max_participants: 0,
};

const Menu = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(emptyItem);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["menu-items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_items").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []).map((d: any) => ({ ...d, ingredients: (d.ingredients ?? []) as Ingredient[], schedule_days: d.schedule_days ?? [], schedule_time: d.schedule_time ?? "", max_participants: d.max_participants ?? 0 })) as MenuItem[];
    },
  });

  // Fetch participant counts for entertainment items
  const entertainmentIds = items.filter(i => i.category === "entertainment").map(i => i.id);
  const { data: participantCounts = {} } = useQuery({
    queryKey: ["entertainment-participant-counts", entertainmentIds],
    queryFn: async () => {
      if (entertainmentIds.length === 0) return {};
      const { data, error } = await supabase
        .from("event_participants")
        .select("event_id")
        .in("event_id", entertainmentIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((p: any) => {
        counts[p.event_id] = (counts[p.event_id] || 0) + 1;
      });
      return counts;
    },
    enabled: entertainmentIds.length > 0,
  });

  const upsertMutation = useMutation({
    mutationFn: async (item: Omit<MenuItem, "id"> & { id?: string }) => {
      if (item.id) {
        const { error } = await supabase.from("menu_items").update(item).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("menu_items").insert(item);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyItem);
      toast({ title: isZh ? "保存成功" : "Saved successfully" });
    },
    onError: () => toast({ title: isZh ? "保存失败" : "Save failed", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      toast({ title: isZh ? "删除成功" : "Deleted successfully" });
    },
  });

  const toggleAvailability = useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { error } = await supabase.from("menu_items").update({ is_available }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu-items"] }),
  });

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setForm({ ...item });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyItem, sort_order: items.length + 1 });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const priceRequired = form.category !== "entertainment";
    if (!form.name_zh || !form.name_en || (priceRequired && form.price <= 0)) {
      toast({ title: isZh ? "请填写必填字段" : "Please fill required fields", variant: "destructive" });
      return;
    }
    upsertMutation.mutate(editing ? { ...form, id: editing.id } : form);
  };

  const filtered = items.filter((item) => {
    const matchSearch = search === "" || item.name_zh.includes(search) || item.name_en.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const categoryLabel = (cat: string) => t(`menuMgmt.cat_${cat}`);

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">{t("menuMgmt.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("menuMgmt.subtitle")}</p>
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="w-4 h-4 mr-1" /> {t("menuMgmt.addItem")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {CATEGORIES.map((cat) => {
          const count = items.filter((i) => i.category === cat).length;
          return (
            <motion.div key={cat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={`cursor-pointer transition-colors ${categoryFilter === cat ? "border-primary" : ""}`} onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{categoryIcons[cat]}</div>
                  <div>
                    <p className="text-xs text-muted-foreground">{categoryLabel(cat)}</p>
                    <p className="text-lg font-bold text-foreground">{count}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Cost Analysis Dashboard */}
      {items.length > 0 && (() => {
        const CHART_COLORS = ["hsl(36, 90%, 55%)", "hsl(24, 85%, 50%)", "hsl(152, 60%, 45%)", "hsl(210, 70%, 55%)", "hsl(280, 60%, 55%)", "hsl(340, 70%, 55%)"];

        // Category stats
        const categoryStats = CATEGORIES.filter(cat => cat !== "entertainment").map((cat, idx) => {
          const catItems = items.filter(i => i.category === cat && i.price > 0 && i.cost_price > 0);
          const totalRevenue = catItems.reduce((s, i) => s + i.price, 0);
          const totalCost = catItems.reduce((s, i) => s + (i.cost_price || 0), 0);
          const avgMargin = catItems.length > 0 ? catItems.reduce((s, i) => s + ((i.price - (i.cost_price || 0)) / i.price * 100), 0) / catItems.length : 0;
          return { cat, label: categoryLabel(cat), count: catItems.length, totalCost, totalRevenue, avgMargin, color: CHART_COLORS[idx] };
        }).filter(s => s.count > 0);

        const costPieData = categoryStats.map(s => ({ name: s.label, value: Math.round(s.totalCost) }));

        // High cost alert: items with margin < 50%
        const highCostItems = items
          .filter(i => i.category !== "entertainment" && i.price > 0 && i.cost_price > 0 && ((i.price - i.cost_price) / i.price * 100) < 50)
          .sort((a, b) => ((a.price - (a.cost_price || 0)) / a.price) - ((b.price - (b.cost_price || 0)) / b.price))
          .slice(0, 8);

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Avg Margin by Category */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">{isZh ? "品类平均利润率" : "Avg Margin by Category"}</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryStats.map(s => ({ name: s.label, margin: Math.round(s.avgMargin) }))} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" horizontal={false} />
                  <XAxis type="number" unit="%" stroke="hsl(220, 10%, 55%)" fontSize={11} domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" stroke="hsl(220, 10%, 55%)" fontSize={11} width={70} />
                  <Tooltip contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px", fontSize: "12px", color: "hsl(40, 20%, 92%)" }} formatter={(v: number) => [`${v}%`, isZh ? "利润率" : "Margin"]} />
                  <Bar dataKey="margin" radius={[0, 4, 4, 0]}>
                    {categoryStats.map((s, i) => (
                      <Cell key={i} fill={s.avgMargin >= 60 ? "hsl(152, 60%, 45%)" : s.avgMargin >= 45 ? "hsl(36, 90%, 55%)" : "hsl(0, 70%, 55%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Cost Breakdown Pie */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">{isZh ? "成本占比分布" : "Cost Distribution"}</h3>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={costPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {costPieData.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px", fontSize: "12px", color: "hsl(40, 20%, 92%)" }} formatter={(v: number) => [`¥${v}`, isZh ? "成本" : "Cost"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {categoryStats.map((s, i) => (
                  <div key={s.cat} className="flex items-center gap-1 text-[11px]">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                    <span className="text-muted-foreground">{s.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* High Cost Alert List */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <h3 className="text-sm font-semibold">{isZh ? "高成本预警" : "High Cost Alert"}</h3>
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 ml-auto">{highCostItems.length}</Badge>
              </div>
              {highCostItems.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">{isZh ? "所有菜品利润率均在50%以上" : "All items have margins above 50%"}</p>
              ) : (
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                  {highCostItems.map((item) => {
                    const m = ((item.price - (item.cost_price || 0)) / item.price * 100);
                    return (
                      <div key={item.id} className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 border border-border/50">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant={m < 30 ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0 shrink-0">
                            {m.toFixed(0)}%
                          </Badge>
                          <span className="text-sm truncate">{isZh ? item.name_zh : item.name_en}</span>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          ¥{Number(item.cost_price || 0).toFixed(0)}/¥{Number(item.price).toFixed(0)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        );
      })()}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t("menuMgmt.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>{t("menuMgmt.itemName")}</TableHead>
                <TableHead>{t("menuMgmt.category")}</TableHead>
                <TableHead className="text-right">{t("menuMgmt.price")}</TableHead>
                <TableHead className="text-right">{t("menuMgmt.costPrice")}</TableHead>
                <TableHead className="text-right">{t("menuMgmt.profitMargin")}</TableHead>
                <TableHead className="text-center">{t("menuMgmt.featured")}</TableHead>
                <TableHead className="text-center">{t("menuMgmt.available")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{isZh ? "加载中..." : "Loading..."}</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{isZh ? "暂无菜品" : "No items found"}</TableCell></TableRow>
              ) : filtered.map((item, i) => {
                const margin = item.price > 0 ? ((item.price - (item.cost_price || 0)) / item.price * 100) : 0;
                const isExpanded = expandedRow === item.id;
                const hasIngredients = item.ingredients && item.ingredients.length > 0;
                return (
                  <React.Fragment key={item.id}>
                    <TableRow className="group">
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{isZh ? item.name_zh : item.name_en}</p>
                          <p className="text-xs text-muted-foreground">{isZh ? item.name_en : item.name_zh}</p>
                          {item.category === "entertainment" && (item.schedule_days.length > 0 || item.schedule_time) && (
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                              {item.schedule_days.length > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <CalendarDays className="w-3 h-3" />
                                  {item.schedule_days.map(d => {
                                    const labels: Record<string, string> = isZh
                                      ? { mon: "一", tue: "二", wed: "三", thu: "四", fri: "五", sat: "六", sun: "日" }
                                      : { mon: "Mo", tue: "Tu", wed: "We", thu: "Th", fri: "Fr", sat: "Sa", sun: "Su" };
                                    return labels[d] || d;
                                  }).join("/")}
                                </span>
                              )}
                              {item.schedule_time && (
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" />
                                  {item.schedule_time}
                                </span>
                              )}
                            </div>
                          )}
                          {item.category === "entertainment" && (
                            <div className="flex items-center gap-1 mt-1 text-[11px]">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span className={`${item.max_participants > 0 && (participantCounts[item.id] || 0) >= item.max_participants ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                                {participantCounts[item.id] || 0}
                                {item.max_participants > 0 ? `/${item.max_participants}` : ""}
                              </span>
                              {item.max_participants > 0 && (participantCounts[item.id] || 0) >= item.max_participants && (
                                <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3.5">{isZh ? "已满" : "Full"}</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">{categoryIcons[item.category]} {categoryLabel(item.category)}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        {item.category === "entertainment" ? (
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-0">{isZh ? "免费" : "Free"}</Badge>
                        ) : `¥${Number(item.price).toFixed(0)}`}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => hasIngredients && setExpandedRow(isExpanded ? null : item.id)}
                          className={`inline-flex items-center gap-1 text-sm ${hasIngredients ? "cursor-pointer hover:text-primary transition-colors" : ""}`}
                          disabled={!hasIngredients}
                        >
                          <span className="text-muted-foreground">¥{Number(item.cost_price || 0).toFixed(1)}</span>
                          {hasIngredients && (
                            <>
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 ml-1">
                                <FlaskConical className="w-2.5 h-2.5 mr-0.5" />{item.ingredients.length}
                              </Badge>
                              {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                            </>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.category === "entertainment" ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : item.price > 0 ? (
                          <Badge variant={margin > 60 ? "default" : "secondary"}>
                            {margin.toFixed(0)}%
                          </Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.is_featured && <Star className="w-4 h-4 text-yellow-500 mx-auto fill-yellow-500" />}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={item.is_available} onCheckedChange={(v) => toggleAvailability.mutate({ id: item.id, is_available: v })} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && hasIngredients && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-muted/30 p-0">
                          <div className="px-6 py-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">{t("menuMgmt.ingredients")} — {isZh ? "成本明细" : "Cost Breakdown"}</p>
                            <div className="grid grid-cols-[1fr_80px_60px_80px_90px] gap-x-4 text-xs text-muted-foreground font-medium mb-1 border-b border-border/50 pb-1">
                              <span>{t("menuMgmt.ingredientName")}</span>
                              <span className="text-right">{t("menuMgmt.quantity")}</span>
                              <span>{t("menuMgmt.unit")}</span>
                              <span className="text-right">{t("menuMgmt.unitCost")}</span>
                              <span className="text-right">{isZh ? "小计" : "Subtotal"}</span>
                            </div>
                            {item.ingredients.map((ing, idx) => (
                              <div key={idx} className="grid grid-cols-[1fr_80px_60px_80px_90px] gap-x-4 text-sm py-1 border-b border-border/20 last:border-0">
                                <span className="text-foreground">{ing.name}</span>
                                <span className="text-right text-muted-foreground">{ing.quantity}</span>
                                <span className="text-muted-foreground">{ing.unit}</span>
                                <span className="text-right text-muted-foreground">¥{ing.unit_cost}</span>
                                <span className="text-right font-medium text-foreground">¥{(ing.quantity * ing.unit_cost).toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="grid grid-cols-[1fr_80px_60px_80px_90px] gap-x-4 text-sm pt-2 mt-1 border-t border-border font-semibold">
                              <span className="text-foreground">{isZh ? "合计成本" : "Total Cost"}</span>
                              <span></span><span></span><span></span>
                              <span className="text-right text-primary">¥{item.ingredients.reduce((s, i) => s + i.quantity * i.unit_cost, 0).toFixed(2)}</span>
                            </div>
                            {item.price > 0 && (
                              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                <span>{isZh ? "售价" : "Price"}: ¥{Number(item.price).toFixed(0)}</span>
                                <span>{isZh ? "毛利" : "Gross Profit"}: ¥{(item.price - (item.cost_price || 0)).toFixed(1)}</span>
                                <span>{isZh ? "毛利率" : "Margin"}: {margin.toFixed(1)}%</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t("menuMgmt.editItem") : t("menuMgmt.addItem")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("menuMgmt.nameZh")}</Label>
                <Input value={form.name_zh} onChange={(e) => setForm({ ...form, name_zh: e.target.value })} />
              </div>
              <div>
                <Label>{t("menuMgmt.nameEn")}</Label>
                <Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("menuMgmt.category")}</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v, ...(v === "entertainment" ? { price: 0, cost_price: 0 } : {}) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{categoryLabel(c)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.category !== "entertainment" && (
                <div>
                  <Label>{t("menuMgmt.price")} (¥)</Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
              )}
              {form.category === "entertainment" && (
                <div className="flex items-center pt-6">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-sm">{isZh ? "🎉 公共区域免费活动" : "🎉 Free Public Activity"}</Badge>
                </div>
              )}
            </div>
            {/* Entertainment Schedule Fields */}
            {form.category === "entertainment" && (
              <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  {isZh ? "活动时间安排" : "Activity Schedule"}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">{isZh ? "举办日期（每周）" : "Days of Week"}</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((day) => {
                      const dayLabels: Record<string, string> = isZh
                        ? { mon: "周一", tue: "周二", wed: "周三", thu: "周四", fri: "周五", sat: "周六", sun: "周日" }
                        : { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };
                      const checked = form.schedule_days.includes(day);
                      return (
                        <label key={day} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-pointer text-sm transition-colors ${checked ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                          <Checkbox checked={checked} onCheckedChange={(v) => {
                            const days = v ? [...form.schedule_days, day] : form.schedule_days.filter(d => d !== day);
                            setForm({ ...form, schedule_days: days });
                          }} className="h-3.5 w-3.5" />
                          {dayLabels[day]}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">{isZh ? "活动时间" : "Time"}</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <Input
                      value={form.schedule_time}
                      placeholder={isZh ? "如：20:00-22:00" : "e.g. 8:00 PM - 10:00 PM"}
                      onChange={(e) => setForm({ ...form, schedule_time: e.target.value })}
                      className="max-w-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">{isZh ? "参与人数上限" : "Max Participants"}</Label>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={form.max_participants}
                      placeholder={isZh ? "0 = 不限" : "0 = unlimited"}
                      onChange={(e) => setForm({ ...form, max_participants: Number(e.target.value) })}
                      className="max-w-xs"
                    />
                    <span className="text-xs text-muted-foreground">{isZh ? "（0为不限制）" : "(0 = no limit)"}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("menuMgmt.descZh")}</Label>
                <Textarea value={form.description_zh} onChange={(e) => setForm({ ...form, description_zh: e.target.value })} rows={2} />
              </div>
              <div>
                <Label>{t("menuMgmt.descEn")}</Label>
                <Textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} rows={2} />
              </div>
            </div>
            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">{t("menuMgmt.ingredients")}</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  const newIngredients = [...form.ingredients, { name: "", quantity: 0, unit: "ml", unit_cost: 0 }];
                  const cost = newIngredients.reduce((s, i) => s + i.quantity * i.unit_cost, 0);
                  setForm({ ...form, ingredients: newIngredients, cost_price: cost });
                }}>
                  <Plus className="w-3 h-3 mr-1" /> {t("menuMgmt.addIngredient")}
                </Button>
              </div>
              {form.ingredients.length > 0 && (
                <div className="space-y-2 border rounded-md p-3 bg-muted/30">
                  <div className="grid grid-cols-[1fr_60px_60px_80px_32px] gap-2 text-xs text-muted-foreground font-medium">
                    <span>{t("menuMgmt.ingredientName")}</span>
                    <span>{t("menuMgmt.quantity")}</span>
                    <span>{t("menuMgmt.unit")}</span>
                    <span>{t("menuMgmt.unitCost")}</span>
                    <span></span>
                  </div>
                  {form.ingredients.map((ing, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_60px_60px_80px_32px] gap-2 items-center">
                      <Input value={ing.name} placeholder={isZh ? "如：伏特加" : "e.g. Vodka"} onChange={(e) => {
                        const arr = [...form.ingredients]; arr[idx] = { ...arr[idx], name: e.target.value }; setForm({ ...form, ingredients: arr });
                      }} className="h-8 text-sm" />
                      <Input type="number" value={ing.quantity} onChange={(e) => {
                        const arr = [...form.ingredients]; arr[idx] = { ...arr[idx], quantity: Number(e.target.value) };
                        setForm({ ...form, ingredients: arr, cost_price: arr.reduce((s, i) => s + i.quantity * i.unit_cost, 0) });
                      }} className="h-8 text-sm" />
                      <Input value={ing.unit} onChange={(e) => {
                        const arr = [...form.ingredients]; arr[idx] = { ...arr[idx], unit: e.target.value }; setForm({ ...form, ingredients: arr });
                      }} className="h-8 text-sm" />
                      <Input type="number" value={ing.unit_cost} onChange={(e) => {
                        const arr = [...form.ingredients]; arr[idx] = { ...arr[idx], unit_cost: Number(e.target.value) };
                        setForm({ ...form, ingredients: arr, cost_price: arr.reduce((s, i) => s + i.quantity * i.unit_cost, 0) });
                      }} className="h-8 text-sm" />
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                        const arr = form.ingredients.filter((_, i) => i !== idx);
                        setForm({ ...form, ingredients: arr, cost_price: arr.reduce((s, i) => s + i.quantity * i.unit_cost, 0) });
                      }}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t text-sm">
                    <span className="text-muted-foreground">{t("menuMgmt.totalCost")}</span>
                    <span className="font-semibold text-foreground">¥{form.cost_price.toFixed(2)}</span>
                  </div>
                  {form.price > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("menuMgmt.profitMargin")}</span>
                      <span className="font-semibold text-foreground">{((form.price - form.cost_price) / form.price * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_available} onCheckedChange={(v) => setForm({ ...form, is_available: v })} />
                <Label>{t("menuMgmt.available")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                <Label>{t("menuMgmt.featured")}</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
              <Button onClick={handleSave} disabled={upsertMutation.isPending}>{t("common.save")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Menu;
