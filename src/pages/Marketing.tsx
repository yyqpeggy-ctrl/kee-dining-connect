import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Youtube, ShoppingBag, Megaphone, BarChart3 } from "lucide-react";
import SocialMediaTab from "@/components/marketing/SocialMediaTab";
import EcommerceTab from "@/components/marketing/EcommerceTab";
import CampaignsTab from "@/components/marketing/CampaignsTab";
import TrafficAnalyticsTab from "@/components/marketing/TrafficAnalyticsTab";

const Marketing = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">市场管理</h1>
          <p className="text-sm text-muted-foreground mt-1">社交媒体运营 · 电子商务 · 营销活动 · 流量分析</p>
        </div>

        <Tabs defaultValue="social" className="space-y-4">
          <TabsList>
            <TabsTrigger value="social" className="gap-1.5">
              <Youtube className="w-3.5 h-3.5" />社交媒体
            </TabsTrigger>
            <TabsTrigger value="ecommerce" className="gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" />电子商务
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1.5">
              <Megaphone className="w-3.5 h-3.5" />营销活动
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />流量分析
            </TabsTrigger>
          </TabsList>

          <TabsContent value="social"><SocialMediaTab /></TabsContent>
          <TabsContent value="ecommerce"><EcommerceTab /></TabsContent>
          <TabsContent value="campaigns"><CampaignsTab /></TabsContent>
          <TabsContent value="analytics"><TrafficAnalyticsTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Marketing;
