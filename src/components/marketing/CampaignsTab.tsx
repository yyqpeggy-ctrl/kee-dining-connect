import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Users, Megaphone, CalendarDays, TrendingUp, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

const campaigns = [
  { id: 1, name: "元宵节满减活动", type: "promotion", channel: "全渠道", startDate: "2026-02-20", endDate: "2026-02-26", budget: 15000, spent: 8200, reach: "12.3万", conversions: 892, conversionRate: "7.2%", status: "inProgress" },
  { id: 2, name: "新品试吃推广", type: "advertising", channel: "TikTok + YouTube", startDate: "2026-02-15", endDate: "2026-02-28", budget: 25000, spent: 18600, reach: "45.8万", conversions: 2340, conversionRate: "5.1%", status: "inProgress" },
  { id: 3, name: "会员日双倍积分", type: "membership", channel: "小程序", startDate: "2026-02-18", endDate: "2026-02-18", budget: 5000, spent: 5000, reach: "3.2万", conversions: 1560, conversionRate: "12.8%", status: "ended" },
  { id: 4, name: "春季新菜单发布", type: "brand", channel: "全渠道", startDate: "2026-03-01", endDate: "2026-03-15", budget: 35000, spent: 0, reach: "—", conversions: 0, conversionRate: "—", status: "notStarted" },
  { id: 5, name: "KOL探店合作", type: "collaboration", channel: "TikTok", startDate: "2026-02-10", endDate: "2026-02-20", budget: 20000, spent: 20000, reach: "68.5万", conversions: 3120, conversionRate: "4.6%", status: "ended" },
];

const statusColor = (s: string) => {
  if (s === "inProgress") return "default";
  if (s === "ended") return "secondary";
  return "outline";
};

const typeIcon = (t: string) => {
  if (t === "promotion") return Target;
  if (t === "advertising") return Megaphone;
  if (t === "membership") return Users;
  if (t === "collaboration") return Zap;
  return Megaphone;
};

const CampaignsTab = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t("marketingMgmt.campaignManagement")}</h3>
          <p className="text-sm text-muted-foreground">{t("marketingMgmt.campaignManagementDesc")}</p>
        </div>
        <Button size="sm"><Plus className="w-3 h-3 mr-1" />{t("marketingMgmt.createCampaign")}</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {campaigns.map((c) => {
          const Icon = typeIcon(c.type);
          const budgetPercent = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;
          return (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{c.name}</CardTitle>
                      <CardDescription className="text-xs">{c.channel}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={statusColor(c.status)}>{t(`marketingMgmt.${c.status}`)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="w-3 h-3" />
                  {c.startDate} ~ {c.endDate}
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{t("marketingMgmt.budgetSpent")}</span>
                    <span className="text-foreground font-medium">¥{c.spent.toLocaleString()} / ¥{c.budget.toLocaleString()}</span>
                  </div>
                  <Progress value={budgetPercent} className="h-1.5" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-border">
                  <div>
                    <p className="text-sm font-bold text-foreground">{c.reach}</p>
                    <p className="text-[10px] text-muted-foreground">{t("marketingMgmt.reach")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{c.conversions.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{t("marketingMgmt.conversions")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{c.conversionRate}</p>
                    <p className="text-[10px] text-muted-foreground">{t("marketingMgmt.conversionRate")}</p>
                  </div>
                </div>

                <Button variant="ghost" size="sm" className="w-full">{t("marketingMgmt.viewDetails")}</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CampaignsTab;
