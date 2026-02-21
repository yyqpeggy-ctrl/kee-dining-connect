import { useState } from "react";
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
import { Plus, Pencil, Trash2, Search, UtensilsCrossed, Wine, CakeSlice, Martini, Star, Gamepad2, X } from "lucide-react";

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

const emptyItem: Omit<MenuItem, "id"> = {
  name_zh: "", name_en: "", description_zh: "", description_en: "",
  category: "tapas", price: 0, image_url: "", is_available: true, is_featured: false, sort_order: 0,
  ingredients: [], cost_price: 0,
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

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["menu-items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_items").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []).map((d: any) => ({ ...d, ingredients: (d.ingredients ?? []) as Ingredient[] })) as MenuItem[];
    },
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
    if (!form.name_zh || !form.name_en || form.price <= 0) {
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
              ) : filtered.map((item, i) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{isZh ? item.name_zh : item.name_en}</p>
                      <p className="text-xs text-muted-foreground">{isZh ? item.name_en : item.name_zh}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1">{categoryIcons[item.category]} {categoryLabel(item.category)}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-foreground">¥{Number(item.price).toFixed(0)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">¥{Number(item.cost_price || 0).toFixed(1)}</TableCell>
                  <TableCell className="text-right">
                    {item.price > 0 ? (
                      <Badge variant={((item.price - (item.cost_price || 0)) / item.price * 100) > 60 ? "default" : "secondary"}>
                        {((item.price - (item.cost_price || 0)) / item.price * 100).toFixed(0)}%
                      </Badge>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.is_featured && <Star className="w-4 h-4 text-yellow-500 mx-auto fill-yellow-500" />}
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
              ))}
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
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{categoryLabel(c)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("menuMgmt.price")} (¥)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
            </div>
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
