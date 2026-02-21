import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Youtube, Music2, Instagram, Play } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useSocialMediaStats } from "@/hooks/useSocialMediaStats";
import { Skeleton } from "@/components/ui/skeleton";

const platformIcons: Record<string, { icon: any; color: string; bgColor: string }> = {
  YouTube: { icon: Youtube, color: "text-red-500", bgColor: "bg-red-500/10" },
  TikTok: { icon: Music2, color: "text-foreground", bgColor: "bg-muted" },
  Instagram: { icon: Instagram, color: "text-pink-500", bgColor: "bg-pink-500/10" },
};

const SocialMediaTab = () => {
  const { data, isLoading, error } = useSocialMediaStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-32" /></CardContent></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card><CardContent className="pt-6"><Skeleton className="h-64" /></CardContent></Card>
          <Card><CardContent className="pt-6"><Skeleton className="h-64" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-destructive">
          <p>加载社交媒体数据失败: {(error as Error).message}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>重试</Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Data source indicator */}
      {data.dataSource === "mock" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          模拟数据模式 — 配置API密钥后将自动切换为实时数据
        </div>
      )}

      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.platforms.map((p) => {
          const style = platformIcons[p.platform] || platformIcons.YouTube;
          const Icon = style.icon;
          return (
            <Card key={p.platform}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${style.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${style.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{p.platform}</p>
                      <p className="text-xs text-muted-foreground">{p.followersFormatted} 粉丝</p>
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
          );
        })}
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
              <BarChart data={data.weeklyViews}>
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
              <LineChart data={data.followerTrend}>
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
              {data.recentPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{post.platform}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{post.viewsFormatted}</TableCell>
                  <TableCell className="text-right">{post.likesFormatted}</TableCell>
                  <TableCell className="text-right">{post.comments}</TableCell>
                  <TableCell className="text-right">{post.shares}</TableCell>
                  <TableCell>
                    <Badge variant={post.status === "published" ? "default" : "secondary"}>
                      {post.status === "published" ? "已发布" : "待发布"}
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
