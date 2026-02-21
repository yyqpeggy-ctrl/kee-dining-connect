import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Youtube, Music2, Instagram, Play } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useTranslation } from "react-i18next";
import { useSocialMediaStats } from "@/hooks/useSocialMediaStats";
import { Skeleton } from "@/components/ui/skeleton";

const platformIcons: Record<string, { icon: any; color: string; bgColor: string }> = {
  YouTube: { icon: Youtube, color: "text-red-500", bgColor: "bg-red-500/10" },
  TikTok: { icon: Music2, color: "text-foreground", bgColor: "bg-muted" },
  Instagram: { icon: Instagram, color: "text-pink-500", bgColor: "bg-pink-500/10" },
};

const SocialMediaTab = () => {
  const { data, isLoading, error } = useSocialMediaStats();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (<Card key={i}><CardContent className="pt-6"><Skeleton className="h-32" /></CardContent></Card>))}
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
      <Card><CardContent className="pt-6 text-center text-destructive">
        <p>{(error as Error).message}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
      </CardContent></Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {data.dataSource === "mock" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          {t("marketingMgmt.mockDataMode")}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.platforms.map((p) => {
          const style = platformIcons[p.platform] || platformIcons.YouTube;
          const Icon = style.icon;
          return (
            <Card key={p.platform}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${style.bgColor} flex items-center justify-center`}><Icon className={`w-5 h-5 ${style.color}`} /></div>
                    <div>
                      <p className="font-semibold text-foreground">{p.platform}</p>
                      <p className="text-xs text-muted-foreground">{p.followersFormatted} {t("marketingMgmt.followers")}</p>
                    </div>
                  </div>
                  {p.connected ? (
                    <Badge variant="outline" className="text-success border-success/30 bg-success/10">{t("marketingMgmt.connected")}</Badge>
                  ) : (
                    <Button size="sm" variant="outline">{t("marketingMgmt.connect")}</Button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div><p className="text-lg font-bold text-foreground">{p.growth}</p><p className="text-[10px] text-muted-foreground">{t("marketingMgmt.followerGrowth")}</p></div>
                  <div><p className="text-lg font-bold text-foreground">{p.posts}</p><p className="text-[10px] text-muted-foreground">{t("marketingMgmt.postsCount")}</p></div>
                  <div><p className="text-lg font-bold text-foreground">{p.engagement}</p><p className="text-[10px] text-muted-foreground">{t("marketingMgmt.engagementRate")}</p></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("marketingMgmt.dailyViews")}</CardTitle>
            <CardDescription>{t("marketingMgmt.dailyViewsDesc")}</CardDescription>
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
            <CardTitle className="text-base">{t("marketingMgmt.followerTrend")}</CardTitle>
            <CardDescription>{t("marketingMgmt.followerTrendDesc")}</CardDescription>
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

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{t("marketingMgmt.contentManagement")}</CardTitle>
              <CardDescription>{t("marketingMgmt.contentManagementDesc")}</CardDescription>
            </div>
            <Button size="sm"><Play className="w-3 h-3 mr-1" />{t("marketingMgmt.createContent")}</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("marketingMgmt.postTitle")}</TableHead>
                <TableHead>{t("marketingMgmt.platform")}</TableHead>
                <TableHead className="text-right">{t("marketingMgmt.views")}</TableHead>
                <TableHead className="text-right">{t("marketingMgmt.likes")}</TableHead>
                <TableHead className="text-right">{t("marketingMgmt.comments")}</TableHead>
                <TableHead className="text-right">{t("marketingMgmt.shares")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell><Badge variant="outline">{post.platform}</Badge></TableCell>
                  <TableCell className="text-right">{post.viewsFormatted}</TableCell>
                  <TableCell className="text-right">{post.likesFormatted}</TableCell>
                  <TableCell className="text-right">{post.comments}</TableCell>
                  <TableCell className="text-right">{post.shares}</TableCell>
                  <TableCell>
                    <Badge variant={post.status === "published" ? "default" : "secondary"}>
                      {post.status === "published" ? t("marketingMgmt.published") : t("marketingMgmt.scheduled")}
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
