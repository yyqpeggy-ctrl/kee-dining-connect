import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Mock platform API responses - replace with real API calls when keys are configured
function mockPublishEvent(platform: string, eventData: any) {
  const platformUrls: Record<string, string> = {
    huodongxing: `https://huodongxing.com/event/${Math.random().toString(36).slice(2, 10)}`,
    cumen: `https://cumen.fun/activity/${Math.random().toString(36).slice(2, 10)}`,
    douyin: `https://douyin.com/event/${Math.random().toString(36).slice(2, 10)}`,
    wechat: `https://mp.weixin.qq.com/s/${Math.random().toString(36).slice(2, 10)}`,
    xiaohongshu: `https://xiaohongshu.com/event/${Math.random().toString(36).slice(2, 10)}`,
    dianping: `https://dianping.com/event/${Math.random().toString(36).slice(2, 10)}`,
    keep: `https://keep.com/event/${Math.random().toString(36).slice(2, 10)}`,
  };

  return {
    success: true,
    platform,
    externalId: `ext_${platform}_${Date.now()}`,
    url: platformUrls[platform] || `https://${platform}.com/event/mock`,
    publishedAt: new Date().toISOString(),
    message: `Event "${eventData.name}" published to ${platform} successfully`,
  };
}

function mockSyncSignups(platform: string, externalId?: string) {
  const names = [
    { nameZh: "张伟", nameEn: "Zhang Wei" },
    { nameZh: "李娜", nameEn: "Li Na" },
    { nameZh: "王芳", nameEn: "Wang Fang" },
    { nameZh: "刘洋", nameEn: "Liu Yang" },
    { nameZh: "陈静", nameEn: "Chen Jing" },
    { nameZh: "赵磊", nameEn: "Zhao Lei" },
    { nameZh: "Mark Johnson", nameEn: "Mark Johnson" },
    { nameZh: "Sarah Lee", nameEn: "Sarah Lee" },
    { nameZh: "Tom Wilson", nameEn: "Tom Wilson" },
    { nameZh: "Emily Chen", nameEn: "Emily Chen" },
  ];

  const count = Math.floor(Math.random() * 8) + 3;
  const signups = Array.from({ length: count }, (_, i) => {
    const person = names[i % names.length];
    return {
      id: `signup_${platform}_${i}_${Date.now()}`,
      ...person,
      phone: `1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      email: `${person.nameEn.toLowerCase().replace(' ', '.')}@example.com`,
      signupTime: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
      source: platform,
      status: Math.random() > 0.1 ? "confirmed" : "pending",
      ticketType: Math.random() > 0.5 ? "standard" : "vip",
    };
  });

  return {
    success: true,
    platform,
    totalSignups: count,
    newSignups: Math.floor(count * 0.3),
    signups,
    syncedAt: new Date().toISOString(),
  };
}

function mockSyncReviews(platform: string) {
  const reviewTexts = [
    { zh: "活动组织得很好，飞镖比赛非常刺激！下次还来", en: "Great event! Darts was exciting. Will come again!" },
    { zh: "场地很棒，酒水也很好喝，推荐给朋友了", en: "Awesome venue, great drinks. Recommended to friends!" },
    { zh: "跑步路线设计不错，完赛啤酒是亮点", en: "Nice running route, post-run beer was the highlight!" },
    { zh: "集市很有趣，买到了很多特色手工艺品", en: "Fun market, got lots of unique handmade crafts!" },
    { zh: "AI展示很有意思，希望下次能有更多互动环节", en: "AI demos were interesting, hope for more interactive sessions next time" },
  ];

  const count = Math.floor(Math.random() * 5) + 2;
  const reviews = Array.from({ length: count }, (_, i) => {
    const review = reviewTexts[i % reviewTexts.length];
    return {
      id: `review_${platform}_${i}_${Date.now()}`,
      author: `User_${Math.floor(Math.random() * 1000)}`,
      rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
      contentZh: review.zh,
      contentEn: review.en,
      createdAt: new Date(Date.now() - Math.random() * 14 * 86400000).toISOString(),
      source: platform,
      replied: Math.random() > 0.5,
    };
  });

  return {
    success: true,
    platform,
    averageRating: (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1),
    totalReviews: count,
    newReviews: Math.floor(count * 0.4),
    reviews,
    syncedAt: new Date().toISOString(),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, platform, eventData, externalId } = await req.json();

    let result;
    switch (action) {
      case "publish":
        console.info(`Publishing event to ${platform} (mock mode)`);
        result = mockPublishEvent(platform, eventData);
        break;
      case "sync_signups":
        console.info(`Syncing signups from ${platform} (mock mode)`);
        result = mockSyncSignups(platform, externalId);
        break;
      case "sync_reviews":
        console.info(`Syncing reviews from ${platform} (mock mode)`);
        result = mockSyncReviews(platform);
        break;
      case "publish_all":
        console.info(`Publishing event to all platforms (mock mode)`);
        const platforms = eventData.platforms || ["huodongxing", "cumen", "douyin", "wechat"];
        result = {
          success: true,
          results: platforms.map((p: string) => mockPublishEvent(p, eventData)),
        };
        break;
      case "sync_all_signups":
        console.info(`Syncing signups from all platforms (mock mode)`);
        const syncPlatforms = eventData?.platforms || ["huodongxing", "cumen"];
        result = {
          success: true,
          results: syncPlatforms.map((p: string) => mockSyncSignups(p)),
          totalNewSignups: 0,
        };
        result.totalNewSignups = result.results.reduce((s: number, r: any) => s + r.newSignups, 0);
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Event platform sync error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
