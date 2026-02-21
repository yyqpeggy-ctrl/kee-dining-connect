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
        connected: true,
      },
      {
        platform: "WeChat",
        followers: 156000,
        followersFormatted: "15.6万",
        growth: "+3.8%",
        totalViews: 8200000,
        posts: 124,
        engagement: "5.6%",
        connected: true,
      },
      {
        platform: "Xiaohongshu",
        followers: 93000,
        followersFormatted: "9.3万",
        growth: "+12.1%",
        totalViews: 6800000,
        posts: 89,
        engagement: "8.2%",
        connected: true,
      },
      {
        platform: "Dianping",
        followers: 0,
        followersFormatted: "—",
        growth: "—",
        totalViews: 0,
        posts: 0,
        engagement: "—",
        rating: 4.8,
        reviews: 2360,
        connected: true,
      },
    ],
    recentPosts: [
      { id: "1", titleZh: "飞镖之夜现场实况！老外们嗨翻了", titleEn: "Darts Night LIVE! Expats Going Wild", platform: "TikTok", views: 623000, viewsFormatted: "62.3万", likes: 42000, likesFormatted: "4.2万", comments: 2842, shares: 1292, date: "2026-02-20", status: "published" },
      { id: "2", titleZh: "KTV包厢里的中外友谊之歌", titleEn: "Karaoke Night: Where Cultures Meet", platform: "YouTube", views: 187000, viewsFormatted: "18.7万", likes: 11000, likesFormatted: "1.1万", comments: 634, shares: 421, date: "2026-02-19", status: "published" },
      { id: "3", titleZh: "上海最Chill的Casual酒吧", titleEn: "Shanghai's Chillest Casual Bar", platform: "Xiaohongshu", views: 412000, viewsFormatted: "41.2万", likes: 34000, likesFormatted: "3.4万", comments: 1603, shares: 956, date: "2026-02-18", status: "published" },
      { id: "4", titleZh: "飞镖技巧教学｜从新手到高手", titleEn: "Darts Tutorial: Beginner to Pro", platform: "YouTube", views: 89000, viewsFormatted: "8.9万", likes: 5600, likesFormatted: "5600", comments: 287, shares: 198, date: "2026-02-17", status: "published" },
      { id: "5", titleZh: "本周五KTV主题之夜预告🎤", titleEn: "This Friday: KTV Theme Night Teaser 🎤", platform: "WeChat", views: 0, viewsFormatted: "—", likes: 0, likesFormatted: "—", comments: 0, shares: 0, date: "2026-02-22", status: "scheduled" },
      { id: "6", titleZh: "探店｜上海最有趣的飞镖酒吧🎯", titleEn: "Review: Shanghai's Most Fun Darts Bar 🎯", platform: "Xiaohongshu", views: 358000, viewsFormatted: "35.8万", likes: 28000, likesFormatted: "2.8万", comments: 1820, shares: 2340, date: "2026-02-16", status: "published" },
      { id: "7", titleZh: "微信推文｜周末活动预告+会员优惠", titleEn: "WeChat: Weekend Events + Member Deals", platform: "WeChat", views: 45000, viewsFormatted: "4.5万", likes: 3200, likesFormatted: "3200", comments: 186, shares: 892, date: "2026-02-15", status: "published" },
      { id: "8", titleZh: "Instagram Reels: Cocktail制作过程🍹", titleEn: "Instagram Reels: Cocktail Making 🍹", platform: "Instagram", views: 126000, viewsFormatted: "12.6万", likes: 9800, likesFormatted: "9800", comments: 342, shares: 567, date: "2026-02-14", status: "published" },
    ],
    weeklyViews: [
      { dayZh: "周一", dayEn: "Mon", youtube: 12400, tiktok: 34200, instagram: 8100, wechat: 18600, xiaohongshu: 15200 },
      { dayZh: "周二", dayEn: "Tue", youtube: 15600, tiktok: 28900, instagram: 9500, wechat: 21300, xiaohongshu: 12800 },
      { dayZh: "周三", dayEn: "Wed", youtube: 18200, tiktok: 45100, instagram: 11200, wechat: 24500, xiaohongshu: 19600 },
      { dayZh: "周四", dayEn: "Thu", youtube: 14300, tiktok: 38700, instagram: 7800, wechat: 19800, xiaohongshu: 16400 },
      { dayZh: "周五", dayEn: "Fri", youtube: 22100, tiktok: 52300, instagram: 13600, wechat: 32100, xiaohongshu: 28900 },
      { dayZh: "周六", dayEn: "Sat", youtube: 28900, tiktok: 68400, instagram: 18200, wechat: 41200, xiaohongshu: 38600 },
      { dayZh: "周日", dayEn: "Sun", youtube: 25600, tiktok: 61200, instagram: 15900, wechat: 35800, xiaohongshu: 32100 },
    ],
    followerTrend: [
      { monthZh: "9月", monthEn: "Sep", youtube: 98000, tiktok: 180000, instagram: 58000, wechat: 110000, xiaohongshu: 42000 },
      { monthZh: "10月", monthEn: "Oct", youtube: 105000, tiktok: 205000, instagram: 63000, wechat: 120000, xiaohongshu: 52000 },
      { monthZh: "11月", monthEn: "Nov", youtube: 112000, tiktok: 235000, instagram: 68000, wechat: 132000, xiaohongshu: 63000 },
      { monthZh: "12月", monthEn: "Dec", youtube: 118000, tiktok: 252000, instagram: 73000, wechat: 141000, xiaohongshu: 74000 },
      { monthZh: "1月", monthEn: "Jan", youtube: 124000, tiktok: 270000, instagram: 78000, wechat: 149000, xiaohongshu: 85000 },
      { monthZh: "2月", monthEn: "Feb", youtube: 128000, tiktok: 285000, instagram: 82000, wechat: 156000, xiaohongshu: 93000 },
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
