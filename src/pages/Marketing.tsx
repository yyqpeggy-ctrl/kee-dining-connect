import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import StoreIndicator from "@/components/StoreIndicator";
import { useStore } from "@/contexts/StoreContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Youtube, ShoppingBag, Megaphone, BarChart3, Star, CalendarDays, PieChart, Handshake, UsersRound, Layers, TrendingUp, Users, Palette, MessageCircle, Video, Brain } from "lucide-react";
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
import WechatGroupsTab from "@/components/marketing/WechatGroupsTab";
import VideoChannelTab from "@/components/marketing/VideoChannelTab";
import AICustomerAcquisitionTab from "@/components/marketing/AICustomerAcquisitionTab";
import { cn } from "@/lib/utils";

interface NavGroup {
  key: string;
  label: string;
  icon: React.ReactNode;
  items: { key: string; label: string; icon: React.ReactNode }[];
}

const Marketing = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const { storeName } = useStore();

  const [activeTab, setActiveTab] = useState("social");

  const groups: NavGroup[] = [
    {
      key: "content",
      label: isZh ? "内容与渠道" : "Content & Channels",
      icon: <Palette className="w-4 h-4" />,
      items: [
        { key: "social", label: isZh ? "社交媒体" : "Social Media", icon: <Youtube className="w-3.5 h-3.5" /> },
        { key: "ecommerce", label: isZh ? "电商平台" : "E-commerce", icon: <ShoppingBag className="w-3.5 h-3.5" /> },
        { key: "reviews", label: isZh ? "大众点评" : "Reviews", icon: <Star className="w-3.5 h-3.5" /> },
      ],
    },
    {
      key: "promotion",
      label: isZh ? "活动与推广" : "Activities & Promotion",
      icon: <Megaphone className="w-4 h-4" />,
      items: [
        { key: "campaigns", label: isZh ? "营销活动" : "Campaigns", icon: <Megaphone className="w-3.5 h-3.5" /> },
        { key: "events", label: isZh ? "活动策划" : "Events", icon: <CalendarDays className="w-3.5 h-3.5" /> },
      ],
    },
    {
      key: "crm",
      label: isZh ? "客户与合作" : "Customers & Partners",
      icon: <Users className="w-4 h-4" />,
      items: [
        { key: "customers", label: isZh ? "客群分析" : "Customers", icon: <PieChart className="w-3.5 h-3.5" /> },
        { key: "partners", label: isZh ? "合作伙伴" : "Partners", icon: <Handshake className="w-3.5 h-3.5" /> },
        { key: "clubs", label: isZh ? "社团管理" : "Clubs", icon: <UsersRound className="w-3.5 h-3.5" /> },
        { key: "wechat", label: isZh ? "微信群" : "WeChat Groups", icon: <MessageCircle className="w-3.5 h-3.5" /> },
        { key: "video", label: isZh ? "视频号" : "Video Channel", icon: <Video className="w-3.5 h-3.5" /> },
      ],
    },
    {
      key: "analytics",
      label: isZh ? "数据分析" : "Analytics",
      icon: <TrendingUp className="w-4 h-4" />,
      items: [
        { key: "analytics", label: isZh ? "流量分析" : "Traffic Analytics", icon: <BarChart3 className="w-3.5 h-3.5" /> },
        { key: "ai-acquisition", label: isZh ? "AI 智能获客" : "AI Acquisition", icon: <Brain className="w-3.5 h-3.5" /> },
      ],
    },
  ];

  const activeGroup = groups.find(g => g.items.some(i => i.key === activeTab));

  const contentMap: Record<string, React.ReactNode> = {
    social: <SocialMediaTab />,
    ecommerce: <EcommerceTab />,
    campaigns: <CampaignsTab />,
    reviews: <DianpingReviewsTab />,
    events: <EventsTab />,
    customers: <CustomerAnalysisTab />,
    partners: <PartnersTab />,
    clubs: <ClubsTab />,
    wechat: <WechatGroupsTab />,
    video: <VideoChannelTab />,
    analytics: <TrafficAnalyticsTab />,
    "ai-acquisition": <AICustomerAcquisitionTab />,
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">{t("marketingMgmt.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{storeName(isZh)} · {t("marketingMgmt.subtitle")}</p>
        </div>

        <StoreIndicator />

        {/* Group-level navigation */}
        <div className="flex flex-wrap gap-2">
          {groups.map((group) => {
            const isActive = group === activeGroup;
            return (
              <button
                key={group.key}
                onClick={() => setActiveTab(group.items[0].key)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all border",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {group.icon}
                {group.label}
              </button>
            );
          })}
        </div>

        {/* Sub-tab navigation within active group */}
        {activeGroup && activeGroup.items.length > 1 && (
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
            {activeGroup.items.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all",
                  activeTab === item.key
                    ? "bg-background text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div>{contentMap[activeTab]}</div>
      </div>
    </AppLayout>
  );
};

export default Marketing;
