import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageCircle, ThumbsUp, Clock, TrendingUp, Award, Send, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  contentZh: string;
  contentEn: string;
  tags: string[];
  likes: number;
  images: number;
  replyZh?: string;
  replyEn?: string;
  replyDate?: string;
}

const reviews: Review[] = [
  {
    id: "1", author: "吃货小王", avatar: "🧑", rating: 5, date: "2026-02-20",
    contentZh: "超级棒的飞镖酒吧！环境很Chill，适合朋友聚会。Tapas很好吃，特别推荐西班牙火腿和蒜香虾。KTV包厢音响效果也不错，下次还来！",
    contentEn: "Amazing darts bar! Super chill vibe, great for hangouts. Tapas are delicious, especially the Jamón and Gambas. KTV sound system is great too. Will be back!",
    tags: ["飞镖", "Tapas", "KTV", "聚会"],
    likes: 42, images: 3,
    replyZh: "感谢您的五星好评！很高兴您喜欢我们的飞镖区和Tapas，期待下次再见！🎯",
    replyEn: "Thank you for your 5-star review! Glad you enjoyed our darts area and tapas. See you next time! 🎯",
    replyDate: "2026-02-20",
  },
  {
    id: "2", author: "ShanghaiExpat_Mike", avatar: "👨", rating: 4, date: "2026-02-19",
    contentZh: "Great place for a casual night out. Darts area is well maintained. Cocktails are solid. Only minus - gets a bit crowded on Friday nights. Recommend the Sangria!",
    contentEn: "Great place for a casual night out. Darts area is well maintained. Cocktails are solid. Only minus - gets a bit crowded on Friday nights. Recommend the Sangria!",
    tags: ["飞镖", "鸡尾酒", "夜生活"],
    likes: 28, images: 2,
  },
  {
    id: "3", author: "美食达人Lisa", avatar: "👩", rating: 5, date: "2026-02-18",
    contentZh: "朋友生日来的KTV包厢，服务态度超好！送了生日小蛋糕，很贴心。点了一桌Tapas配Sangria，氛围感拉满。强烈推荐周五飞镖之夜活动！",
    contentEn: "Came for a birthday KTV session. Staff was super nice — they even brought a birthday cake! Ordered tapas with Sangria, amazing atmosphere. Highly recommend Friday Darts Night!",
    tags: ["KTV", "生日", "服务好", "飞镖之夜"],
    likes: 86, images: 5,
    replyZh: "Lisa生日快乐！🎂 很开心能为您的生日增添欢乐，欢迎常来玩！",
    replyEn: "Happy Birthday Lisa! 🎂 So glad we could add joy to your celebration. Come back anytime!",
    replyDate: "2026-02-18",
  },
  {
    id: "4", author: "飞镖爱好者老张", avatar: "🧔", rating: 4, date: "2026-02-17",
    contentZh: "专业的飞镖设备，镖靶质量很好。有比赛活动可以参加，认识了不少镖友。酒水价格适中，小食也不错。建议增加更多飞镖赛事。",
    contentEn: "Professional darts equipment, high quality boards. They host tournaments where I've met many fellow dart enthusiasts. Reasonable drink prices, good snacks. Would love more tournaments!",
    tags: ["飞镖", "比赛", "专业设备"],
    likes: 35, images: 1,
  },
  {
    id: "5", author: "小红书种草来的", avatar: "👧", rating: 3, date: "2026-02-16",
    contentZh: "小红书看到来打卡的，环境确实不错拍照很出片。但是等位有点久，周末人太多了。Tapas味道还行，价格偏贵。飞镖很好玩就是不太会😂",
    contentEn: "Came after seeing it on Xiaohongshu. Great ambiance for photos. But the wait was long, too crowded on weekends. Tapas taste okay but pricey. Darts were fun but I'm bad at it 😂",
    tags: ["打卡", "拍照", "等位久"],
    likes: 18, images: 4,
  },
  {
    id: "6", author: "外滩常客Tom", avatar: "🧑‍💼", rating: 5, date: "2026-02-15",
    contentZh: "Best casual bar in Shanghai! Love the mix of international and local vibes. KTV rooms are clean and modern. Happy Hour的买一送一太划算了！每周必来。",
    contentEn: "Best casual bar in Shanghai! Love the mix of international and local vibes. KTV rooms are clean and modern. Happy Hour BOGO is such a steal! Weekly regular now.",
    tags: ["Happy Hour", "KTV", "国际化", "常客"],
    likes: 52, images: 2,
    replyZh: "Tom 谢谢你的支持！你已经是我们的VIP老朋友了，下次来给你留最好的包厢！🍻",
    replyEn: "Thanks for the love Tom! You're a VIP regular now — we'll save the best room for you next time! 🍻",
    replyDate: "2026-02-15",
  },
];

const stats = {
  avgRating: 4.8,
  totalReviews: 2360,
  thisMonth: 186,
  replyRate: 78,
  avgReplyTime: "2.5h",
  fiveStar: 68,
  fourStar: 22,
  threeStar: 7,
  twoStar: 2,
  oneStar: 1,
};

const DianpingReviewsTab = () => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const [expandedReply, setExpandedReply] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "unreplied" | "negative">("all");

  const filtered = reviews.filter((r) => {
    if (filter === "unreplied") return !r.replyZh;
    if (filter === "negative") return r.rating <= 3;
    return true;
  });

  const ratingBars = [
    { stars: 5, pct: stats.fiveStar },
    { stars: 4, pct: stats.fourStar },
    { stars: 3, pct: stats.threeStar },
    { stars: 2, pct: stats.twoStar },
    { stars: 1, pct: stats.oneStar },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-5 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-5 h-5 text-orange-500 fill-orange-500" />
              <span className="text-2xl font-bold text-foreground">{stats.avgRating}</span>
            </div>
            <p className="text-xs text-muted-foreground">{isZh ? "综合评分" : "Avg Rating"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.totalReviews.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{isZh ? "总评价数" : "Total Reviews"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.thisMonth}</p>
            <p className="text-xs text-muted-foreground">{isZh ? "本月新增" : "This Month"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.replyRate}%</p>
            <p className="text-xs text-muted-foreground">{isZh ? "回复率" : "Reply Rate"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <div className="flex items-center justify-center gap-1 mb-0">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold text-foreground">{stats.avgReplyTime}</span>
            </div>
            <p className="text-xs text-muted-foreground">{isZh ? "平均回复时长" : "Avg Reply Time"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Rating Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{isZh ? "评分分布" : "Rating Distribution"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ratingBars.map((r) => (
              <div key={r.stars} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-8">{r.stars}★</span>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${r.pct}%` }} />
                </div>
                <span className="text-xs text-foreground w-8 text-right">{r.pct}%</span>
              </div>
            ))}
            <div className="pt-2 border-t border-border mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{isZh ? "好评率 (4-5星)" : "Positive (4-5★)"}</span>
                <span className="font-bold text-foreground">{stats.fiveStar + stats.fourStar}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(["all", "unreplied", "negative"] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? (isZh ? "全部" : "All") : f === "unreplied" ? (isZh ? "待回复" : "Unreplied") : (isZh ? "差评" : "Negative")}
                  {f === "unreplied" && <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5">{reviews.filter(r => !r.replyZh).length}</Badge>}
                </Button>
              ))}
            </div>
          </div>

          {filtered.map((review) => {
            const isExpanded = expandedReply === review.id;
            const hasReply = !!review.replyZh;
            return (
              <Card key={review.id}>
                <CardContent className="pt-5 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-lg">{review.avatar}</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{review.author}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? "text-orange-500 fill-orange-500" : "text-muted"}`} />
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {review.images > 0 && <span>📷 {review.images}</span>}
                      <span className="flex items-center gap-0.5"><ThumbsUp className="w-3 h-3" /> {review.likes}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-sm text-foreground leading-relaxed">{isZh ? review.contentZh : review.contentEn}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {review.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>

                  {/* Existing Reply */}
                  {hasReply && (
                    <div className="bg-muted/50 rounded-lg p-3 border border-border">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge variant="outline" className="text-[10px]">{isZh ? "商家回复" : "Owner Reply"}</Badge>
                        <span className="text-[10px] text-muted-foreground">{review.replyDate}</span>
                      </div>
                      <p className="text-sm text-foreground">{isZh ? review.replyZh : review.replyEn}</p>
                    </div>
                  )}

                  {/* Reply Action */}
                  {!hasReply && (
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedReply(isExpanded ? null : review.id)}
                        className="text-xs"
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {isZh ? "回复评价" : "Reply"}
                        {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                      </Button>
                      {isExpanded && (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            placeholder={isZh ? "输入回复内容..." : "Type your reply..."}
                            value={replyTexts[review.id] || ""}
                            onChange={(e) => setReplyTexts((prev) => ({ ...prev, [review.id]: e.target.value }))}
                            className="text-sm min-h-[80px]"
                          />
                          <div className="flex justify-end">
                            <Button size="sm" disabled={!replyTexts[review.id]?.trim()}>
                              <Send className="w-3 h-3 mr-1" />
                              {isZh ? "发送回复" : "Send Reply"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DianpingReviewsTab;
