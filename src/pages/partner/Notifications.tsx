import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, AlertCircle, Info, Clock, Check, Trash2, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read_at: string | null;
  action_url: string | null;
  created_at: string;
};

const iconMap: Record<string, React.ElementType> = {
  success: CheckCircle,
  warning: AlertCircle,
  info: Info,
  error: AlertCircle,
};
const colorMap: Record<string, string> = {
  success: "text-primary",
  warning: "text-amber-500",
  info: "text-blue-500",
  error: "text-destructive",
};
const bgMap: Record<string, string> = {
  success: "bg-primary/10",
  warning: "bg-amber-500/10",
  info: "bg-blue-500/10",
  error: "bg-destructive/10",
};

function timeAgo(date: string): string {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString("sv-SE");
}

export default function PartnerNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications((data as Notification[]) || []);
    } catch (err: any) {
      toast({ title: "Error loading notifications", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
    if (unreadIds.length > 0) {
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", unreadIds);
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    }
    setMarkingAll(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-base text-muted-foreground mt-1">Stay updated with important messages and alerts</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-sm px-3 py-1">{unreadCount} unread</Badge>
          )}
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markingAll}>
              {markingAll ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No notifications</h2>
            <p className="text-muted-foreground">You're all caught up! Notifications will appear here when there's something for you.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = iconMap[n.type] ?? Bell;
            const iconColor = colorMap[n.type] ?? "text-muted-foreground";
            const iconBg = bgMap[n.type] ?? "bg-muted";
            const isUnread = !n.read_at;
            return (
              <Card
                key={n.id}
                className={`transition-all ${isUnread ? "border-primary/30 bg-primary/5 shadow-sm" : "hover:bg-muted/30"}`}
                onClick={() => isUnread && handleMarkRead(n.id)}
              >
                <CardContent className="p-5 flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-semibold ${isUnread ? "" : "text-muted-foreground"}`}>{n.title}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        {isUnread && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        {n.action_url && (
                          <a href={n.action_url}>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="h-3.5 w-3.5" /></Button>
                          </a>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={e => { e.stopPropagation(); handleDelete(n.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> {timeAgo(n.created_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
