import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Youtube, Music2, Instagram, ExternalLink, TrendingUp, Eye, Heart, MessageCircle, Share2, Play } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const platformData = [
  {
    platform: "YouTube",
    icon: Youtube,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    followers: "12.8万",
    growth: "+2.3%",
    posts: 48,
    engagement: "4.2%",
    connected: true,
  },
  {
    platform: "TikTok",
    icon: Music2,
    color: "text-foreground",
    bgColor: "bg-muted",
    followers: "28.5万",
    growth: "+8.7%",
    posts: 156,
    engagement: "6.8%",
    connected: true,
  },
  {
    platform: "Instagram",
    icon: Instagram,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    followers: "8.2万",
    growth: "+1.5%",
    posts: 92,
    engagement: "3.1%",
    connected: false,
  },
];

const recentPosts = [
  { id: 1, title: "招牌菜制作过程揭秘", platform: "TikTok", views: "52.3万", likes: "3.2万", comments: 1842, shares: 892, date: "2026-02-20", status: "已发布" },
  { id: 2, title: "厨师长教你做年夜饭", platform: "YouTube", views: "18.7万", likes: "1.1万", comments: 634, shares: 421, date: "2026-02-19", status: "已发布" },
  { id: 3, title: "新春限定套餐预告", platform: "TikTok", views: "31.2万", likes: "2.4万", comments: 1203, shares: 756, date: "2026-02-18", status: "已发布" },
  { id: 4, title: "后厨一日Vlog", platform: "YouTube", views: "8.9万", likes: "5600", comments: 287, shares: 198, date: "2026-02-17", status: "已发布" },
  { id: 5, title: "元宵节特别活动预热", platform: "TikTok", views: "—", likes: "—", comments: 0, shares: 0, date: "2026-02-22", status: "待发布" },
];

const weeklyData = [
  { day: "周一", youtube: 12400, tiktok: 34200 },
  { day: "周二", youtube: 15600, tiktok: 28900 },
  { day: "周三", youtube: 18200, tiktok: 45100 },
  { day: "周四", youtube: 14300, tiktok: 38700 },
  { day: "周五", youtube: 22100, tiktok: 52300 },
  { day: "周六", youtube: 28900, tiktok: 68400 },
  { day: "周日", youtube: 25600, tiktok: 61200 },
];

const followerTrend = [
  { month: "9月", youtube: 98000, tiktok: 180000 },
  { month: "10月", youtube: 105000, tiktok: 205000 },
  { month: "11月", youtube: 112000, tiktok: 235000 },
  { month: "12月", youtube: 118000, tiktok: 252000 },
  { month: "1月", youtube: 124000, tiktok: 270000 },
  { month: "2月", youtube: 128000, tiktok: 285000 },
];

const SocialMediaTab = () => {
  return (
    <div className="space-y-6">
      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {platformData.map((p) => (
          <Card key={p.platform}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${p.bgColor} flex items-center justify-center`}>
                    <p.icon className={`w-5 h-5 ${p.color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{p.platform}</p>
                    <p className="text-xs text-muted-foreground">{p.followers} 粉丝</p>
                  </div>
                </div>
                {p.connected ? (
                  <Badge variant="outline" className="text-success border-success/30 bg-success/10">已连接</Badge>
                ) : (
                  <Button size="sm" variant="outline">连接</Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-foreground">{p.growth}</p>
                  <p className="text-[10px] text-muted-foreground">粉丝增长</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{p.posts}</p>
                  <p className="text-[10px] text-muted-foreground">发布内容</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{p.engagement}</p>
                  <p className="text-[10px] text-muted-foreground">互动率</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">每日播放量</CardTitle>
            <CardDescription>本周各平台视频播放趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} />
                <Tooltip formatter={(v: number) => `${(v / 10000).toFixed(1)}万`} />
                <Bar dataKey="youtube" name="YouTube" fill="hsl(0, 70%, 55%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tiktok" name="TikTok" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">粉丝增长趋势</CardTitle>
            <CardDescription>近6个月粉丝总量变化</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={followerTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} />
                <Tooltip formatter={(v: number) => `${(v / 10000).toFixed(1)}万`} />
                <Line type="monotone" dataKey="youtube" name="YouTube" stroke="hsl(0, 70%, 55%)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="tiktok" name="TikTok" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">内容管理</CardTitle>
              <CardDescription>最近发布和待发布的内容</CardDescription>
            </div>
            <Button size="sm"><Play className="w-3 h-3 mr-1" />创建内容</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead>平台</TableHead>
                <TableHead className="text-right">播放量</TableHead>
                <TableHead className="text-right">点赞</TableHead>
                <TableHead className="text-right">评论</TableHead>
                <TableHead className="text-right">分享</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{post.platform}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{post.views}</TableCell>
                  <TableCell className="text-right">{post.likes}</TableCell>
                  <TableCell className="text-right">{post.comments}</TableCell>
                  <TableCell className="text-right">{post.shares}</TableCell>
                  <TableCell>
                    <Badge variant={post.status === "已发布" ? "default" : "secondary"}>
                      {post.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialMediaTab;
