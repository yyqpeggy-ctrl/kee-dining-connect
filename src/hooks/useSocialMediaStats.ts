import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformData {
  platform: string;
  channelId?: string;
  followers: number;
  followersFormatted: string;
  growth: string;
  totalViews: number;
  posts: number;
  engagement: string;
  connected: boolean;
  rating?: number;
  reviews?: number;
}

export interface PostData {
  id: string;
  title?: string;
  titleZh?: string;
  titleEn?: string;
  platform: string;
  views: number;
  viewsFormatted: string;
  likes: number;
  likesFormatted: string;
  comments: number;
  shares: number;
  date: string;
  status: "published" | "scheduled";
}

export interface WeeklyViewData {
  day?: string;
  dayZh?: string;
  dayEn?: string;
  youtube: number;
  tiktok: number;
  instagram: number;
  wechat: number;
  xiaohongshu: number;
}

export interface FollowerTrendData {
  month?: string;
  monthZh?: string;
  monthEn?: string;
  youtube: number;
  tiktok: number;
  instagram: number;
  wechat: number;
  xiaohongshu: number;
}

export interface SocialMediaStats {
  platforms: PlatformData[];
  recentPosts: PostData[];
  weeklyViews: WeeklyViewData[];
  followerTrend: FollowerTrendData[];
  dataSource: "mock" | "youtube_live" | "full_live";
}

export function useSocialMediaStats() {
  return useQuery<SocialMediaStats>({
    queryKey: ["social-media-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("social-media-stats");
      if (error) throw error;
      return data as SocialMediaStats;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000,
  });
}
