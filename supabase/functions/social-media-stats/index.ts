import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Mock data that mirrors real API response structure
function getMockData() {
  return {
    platforms: [
      {
        platform: "YouTube",
        channelId: "mock_channel_id",
        followers: 128000,
        followersFormatted: "12.8万",
        growth: "+2.3%",
        totalViews: 5620000,
        posts: 48,
        engagement: "4.2%",
        connected: true,
      },
      {
        platform: "TikTok",
        followers: 285000,
        followersFormatted: "28.5万",
        growth: "+8.7%",
        totalViews: 18900000,
        posts: 156,
        engagement: "6.8%",
        connected: true,
      },
      {
        platform: "Instagram",
        followers: 82000,
        followersFormatted: "8.2万",
        growth: "+1.5%",
        totalViews: 2100000,
        posts: 92,
        engagement: "3.1%",
        connected: false,
      },
    ],
    recentPosts: [
      { id: "1", title: "招牌菜制作过程揭秘", platform: "TikTok", views: 523000, viewsFormatted: "52.3万", likes: 32000, likesFormatted: "3.2万", comments: 1842, shares: 892, date: "2026-02-20", status: "published" },
      { id: "2", title: "厨师长教你做年夜饭", platform: "YouTube", views: 187000, viewsFormatted: "18.7万", likes: 11000, likesFormatted: "1.1万", comments: 634, shares: 421, date: "2026-02-19", status: "published" },
      { id: "3", title: "新春限定套餐预告", platform: "TikTok", views: 312000, viewsFormatted: "31.2万", likes: 24000, likesFormatted: "2.4万", comments: 1203, shares: 756, date: "2026-02-18", status: "published" },
      { id: "4", title: "后厨一日Vlog", platform: "YouTube", views: 89000, viewsFormatted: "8.9万", likes: 5600, likesFormatted: "5600", comments: 287, shares: 198, date: "2026-02-17", status: "published" },
      { id: "5", title: "元宵节特别活动预热", platform: "TikTok", views: 0, viewsFormatted: "—", likes: 0, likesFormatted: "—", comments: 0, shares: 0, date: "2026-02-22", status: "scheduled" },
    ],
    weeklyViews: [
      { day: "周一", youtube: 12400, tiktok: 34200 },
      { day: "周二", youtube: 15600, tiktok: 28900 },
      { day: "周三", youtube: 18200, tiktok: 45100 },
      { day: "周四", youtube: 14300, tiktok: 38700 },
      { day: "周五", youtube: 22100, tiktok: 52300 },
      { day: "周六", youtube: 28900, tiktok: 68400 },
      { day: "周日", youtube: 25600, tiktok: 61200 },
    ],
    followerTrend: [
      { month: "9月", youtube: 98000, tiktok: 180000 },
      { month: "10月", youtube: 105000, tiktok: 205000 },
      { month: "11月", youtube: 112000, tiktok: 235000 },
      { month: "12月", youtube: 118000, tiktok: 252000 },
      { month: "1月", youtube: 124000, tiktok: 270000 },
      { month: "2月", youtube: 128000, tiktok: 285000 },
    ],
    dataSource: "mock",
  };
}

// Real YouTube API fetch (activated when YOUTUBE_API_KEY is set)
async function fetchYouTubeData(apiKey: string, channelId: string) {
  try {
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`
    );
    if (!channelRes.ok) throw new Error(`YouTube API error: ${channelRes.status}`);
    const channelData = await channelRes.json();

    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=10&type=video&key=${apiKey}`
    );
    if (!videosRes.ok) throw new Error(`YouTube API error: ${videosRes.status}`);
    const videosData = await videosRes.json();

    const videoIds = videosData.items?.map((v: any) => v.id.videoId).join(",");
    let videoStats: any[] = [];
    if (videoIds) {
      const statsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`
      );
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        videoStats = statsData.items || [];
      }
    }

    return { channel: channelData.items?.[0], videos: videoStats };
  } catch (error) {
    console.error("YouTube API fetch failed:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");
    const youtubeChannelId = Deno.env.get("YOUTUBE_CHANNEL_ID");

    // If no API keys configured, return mock data
    if (!youtubeApiKey || !youtubeChannelId) {
      console.log("No API keys configured, returning mock data");
      return new Response(JSON.stringify(getMockData()), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch real data
    const youtubeData = await fetchYouTubeData(youtubeApiKey, youtubeChannelId);
    const mockData = getMockData();

    if (youtubeData?.channel) {
      const stats = youtubeData.channel.statistics;
      const subscriberCount = parseInt(stats.subscriberCount || "0");
      mockData.platforms[0] = {
        ...mockData.platforms[0],
        followers: subscriberCount,
        followersFormatted: subscriberCount >= 10000 ? `${(subscriberCount / 10000).toFixed(1)}万` : `${subscriberCount}`,
        totalViews: parseInt(stats.viewCount || "0"),
        posts: parseInt(stats.videoCount || "0"),
        connected: true,
      };

      // Map real video data
      if (youtubeData.videos.length > 0) {
        const realPosts = youtubeData.videos.map((v: any, i: number) => {
          const s = v.statistics;
          const views = parseInt(s.viewCount || "0");
          const likes = parseInt(s.likeCount || "0");
          return {
            id: v.id,
            title: v.snippet.title,
            platform: "YouTube",
            views,
            viewsFormatted: views >= 10000 ? `${(views / 10000).toFixed(1)}万` : `${views}`,
            likes,
            likesFormatted: likes >= 10000 ? `${(likes / 10000).toFixed(1)}万` : `${likes}`,
            comments: parseInt(s.commentCount || "0"),
            shares: 0,
            date: v.snippet.publishedAt?.split("T")[0] || "",
            status: "published",
          };
        });
        // Replace YouTube posts in recentPosts
        mockData.recentPosts = [
          ...realPosts.slice(0, 3),
          ...mockData.recentPosts.filter((p) => p.platform !== "YouTube"),
        ];
      }

      mockData.dataSource = "youtube_live";
    }

    return new Response(JSON.stringify(mockData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
