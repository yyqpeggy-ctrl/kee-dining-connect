import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Users, Megaphone, CalendarDays, TrendingUp, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

const campaigns = [
  { id: 1, nameZh: "周五飞镖之夜 — 赢免单！", nameEn: "Friday Darts Night — Win Free Drinks!", type: "promotion", channelZh: "全渠道", channelEn: "All Channels", startDate: "2026-02-20", endDate: "2026-02-26", budget: 15000, spent: 8200, reach: "12.3万", conversions: 892, conversionRate: "7.2%", status: "inProgress" },
  { id: 2, nameZh: "KTV畅唱套餐推广", nameEn: "Karaoke Unlimited Package Promo", type: "advertising", channelZh: "TikTok + Instagram", channelEn: "TikTok + Instagram", startDate: "2026-02-15", endDate: "2026-02-28", budget: 25000, spent: 18600, reach: "45.8万", conversions: 2340, conversionRate: "5.1%", status: "inProgress" },
  { id: 3, nameZh: "Happy Hour 买一送一", nameEn: "Happy Hour BOGO", type: "promotion", channelZh: "微信公众号", channelEn: "WeChat", startDate: "2026-02-18", endDate: "2026-02-18", budget: 5000, spent: 5000, reach: "3.2万", conversions: 1560, conversionRate: "12.8%", status: "ended" },
  { id: 4, nameZh: "世界杯观赛派对", nameEn: "World Cup Watch Party", type: "brand", channelZh: "全渠道", channelEn: "All Channels", startDate: "2026-03-01", endDate: "2026-03-15", budget: 35000, spent: 0, reach: "—", conversions: 0, conversionRate: "—", status: "notStarted" },
  { id: 5, nameZh: "外国博主KTV体验合作", nameEn: "Expat Blogger KTV Experience Collab", type: "collaboration", channelZh: "YouTube + Instagram", channelEn: "YouTube + Instagram", startDate: "2026-02-10", endDate: "2026-02-20", budget: 20000, spent: 20000, reach: "68.5万", conversions: 3120, conversionRate: "4.6%", status: "ended" },
  { id: 6, nameZh: "小红书探店种草笔记投放", nameEn: "Xiaohongshu KOL Seeding Campaign", type: "collaboration", channelZh: "小红书", channelEn: "Xiaohongshu", startDate: "2026-02-12", endDate: "2026-02-28", budget: 18000, spent: 12400, reach: "52.6万", conversions: 1860, conversionRate: "3.5%", status: "inProgress" },
  { id: 7, nameZh: "微信公众号会员日推文", nameEn: "WeChat Member Day Push Article", type: "promotion", channelZh: "微信公众号", channelEn: "WeChat", startDate: "2026-02-14", endDate: "2026-02-14", budget: 3000, spent: 3000, reach: "4.8万", conversions: 2100, conversionRate: "15.2%", status: "ended" },
  { id: 8, nameZh: "大众点评霸王餐体验活动", nameEn: "Dianping Free Meal Experience Event", type: "promotion", channelZh: "大众点评", channelEn: "Dianping", startDate: "2026-02-08", endDate: "2026-02-22", budget: 12000, spent: 10800, reach: "8.6万", conversions: 3400, conversionRate: "18.6%", status: "inProgress" },
  { id: 9, nameZh: "小红书飞镖挑战赛话题", nameEn: "Xiaohongshu Darts Challenge Hashtag", type: "brand", channelZh: "小红书", channelEn: "Xiaohongshu", startDate: "2026-02-16", endDate: "2026-03-01", budget: 8000, spent: 4200, reach: "31.2万", conversions: 980, conversionRate: "3.1%", status: "inProgress" },
  { id: 10, nameZh: "微信社群裂变拉新", nameEn: "WeChat Group Referral Growth", type: "membership", channelZh: "微信社群", channelEn: "WeChat Groups", startDate: "2026-02-01", endDate: "2026-02-28", budget: 6000, spent: 4500, reach: "2.1万", conversions: 1680, conversionRate: "22.4%", status: "inProgress" },
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
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

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
                      <CardTitle className="text-sm">{isZh ? c.nameZh : c.nameEn}</CardTitle>
                      <CardDescription className="text-xs">{isZh ? c.channelZh : c.channelEn}</CardDescription>
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
