import AppLayout from "@/components/AppLayout";
import StoreIndicator from "@/components/StoreIndicator";
import { useStore } from "@/contexts/StoreContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Youtube, ShoppingBag, Megaphone, BarChart3, Star, CalendarDays, PieChart, Handshake, UsersRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import SocialMediaTab from "@/components/marketing/SocialMediaTab";
import EcommerceTab from "@/components/marketing/EcommerceTab";
import CampaignsTab from "@/components/marketing/CampaignsTab";
import TrafficAnalyticsTab from "@/components/marketing/TrafficAnalyticsTab";
import DianpingReviewsTab from "@/components/marketing/DianpingReviewsTab";
import EventsTab from "@/components/marketing/EventsTab";
import CustomerAnalysisTab from "@/components/marketing/CustomerAnalysisTab";
import PartnersTab from "@/components/marketing/PartnersTab";
import ClubsTab from "@/components/marketing/ClubsTab";

const Marketing = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const { storeName } = useStore();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">{t("marketingMgmt.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{storeName(isZh)} · {t("marketingMgmt.subtitle")}</p>
        </div>

        <StoreIndicator />

        <Tabs defaultValue="social" className="space-y-4">
          <TabsList>
            <TabsTrigger value="social" className="gap-1.5"><Youtube className="w-3.5 h-3.5" />{t("marketingMgmt.socialMedia")}</TabsTrigger>
            <TabsTrigger value="ecommerce" className="gap-1.5"><ShoppingBag className="w-3.5 h-3.5" />{t("marketingMgmt.ecommerce")}</TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1.5"><Megaphone className="w-3.5 h-3.5" />{t("marketingMgmt.campaigns")}</TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1.5"><Star className="w-3.5 h-3.5" />{isZh ? "大众点评" : "Reviews"}</TabsTrigger>
            <TabsTrigger value="events" className="gap-1.5"><CalendarDays className="w-3.5 h-3.5" />{isZh ? "活动策划" : "Events"}</TabsTrigger>
            <TabsTrigger value="customers" className="gap-1.5"><PieChart className="w-3.5 h-3.5" />{isZh ? "客群分析" : "Customers"}</TabsTrigger>
            <TabsTrigger value="partners" className="gap-1.5"><Handshake className="w-3.5 h-3.5" />{isZh ? "合作伙伴" : "Partners"}</TabsTrigger>
            <TabsTrigger value="clubs" className="gap-1.5"><UsersRound className="w-3.5 h-3.5" />{isZh ? "社团管理" : "Clubs"}</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" />{t("marketingMgmt.trafficAnalytics")}</TabsTrigger>
          </TabsList>

          <TabsContent value="social"><SocialMediaTab /></TabsContent>
          <TabsContent value="ecommerce"><EcommerceTab /></TabsContent>
          <TabsContent value="campaigns"><CampaignsTab /></TabsContent>
          <TabsContent value="reviews"><DianpingReviewsTab /></TabsContent>
          <TabsContent value="events"><EventsTab /></TabsContent>
          <TabsContent value="customers"><CustomerAnalysisTab /></TabsContent>
          <TabsContent value="partners"><PartnersTab /></TabsContent>
          <TabsContent value="clubs"><ClubsTab /></TabsContent>
          <TabsContent value="analytics"><TrafficAnalyticsTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Marketing;
