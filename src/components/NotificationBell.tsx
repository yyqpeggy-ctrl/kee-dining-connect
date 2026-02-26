import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  city: string | null;
  is_read: boolean;
  created_at: string;
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from("hr_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    await supabase
      .from("hr_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);
    loadNotifications();
  };

  const markAllRead = async () => {
    await supabase
      .from("hr_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("is_read", false);
    loadNotifications();
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case "high": return "text-red-500";
      case "medium": return "text-amber-500";
      default: return "text-muted-foreground";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">通知中心</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={markAllRead}>
              全部已读
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">暂无通知</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`border-b px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                  !n.is_read ? "bg-primary/5" : ""
                }`}
                onClick={() => !n.is_read && markAsRead(n.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-xs font-medium ${priorityColor(n.priority)}`}>
                    {n.title}
                  </span>
                  {!n.is_read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{n.message}</p>
                <span className="mt-1 block text-[10px] text-muted-foreground/60">
                  {format(new Date(n.created_at), "MM/dd HH:mm")}
                </span>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
