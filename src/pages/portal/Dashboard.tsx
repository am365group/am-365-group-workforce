import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, ShieldCheck, Building2, TrendingUp, AlertCircle,
  ArrowUpRight, ChevronRight, Loader2, FileText, Bell, CheckCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StatItem {
  label: string;
  value: string;
  icon: React.ElementType;
  change: string;
  bg: string;
  color: string;
  link: string;
}

interface AlertItem {
  title: string;
  type: "warning" | "info" | "success";
  action: string;
  link: string;
}

interface RecentPartner {
  name: string;
  status: string;
  city: string;
  joined: string;
  vehicle: string;
}

interface PlatformStat {
  id: string;
  name: string;
  partners: number;
  invoices: number;
  status: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [recentPartners, setRecentPartners] = useState<RecentPartner[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStat[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [markingRead, setMarkingRead] = useState(false);

  useEffect(() => {
    loadDashboardData();

    // Realtime: refresh when new applications come in or notifications change
    const channel = supabase
      .channel("admin_dashboard_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "partner_applications" }, () => {
        loadDashboardData();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, title, message, type, action_url, read_at, created_at")
      .eq("user_id", user.id)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(10);
    setNotifications((data as Notification[]) || []);
  };

  const handleMarkAllRead = async () => {
    setMarkingRead(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null);
      setNotifications([]);
    } finally {
      setMarkingRead(false);
    }
  };

  async function loadDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const [
        activePartnersRes,
        pendingPartnersRes,
        activeCustomersRes,
        totalInvoicesRes,
        recentPartnersRes,
        customersRes,
        notificationsRes,
      ] = await Promise.all([
        supabase.from("partner_applications").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("partner_applications").select("id", { count: "exact", head: true }).in("status", ["pending", "email_verified", "under_review"]),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("invoices").select("id", { count: "exact", head: true }),
        supabase.from("partner_applications").select("first_name, last_name, status, city, transport, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("customers").select("id, name, is_active").eq("is_active", true),
        user
          ? supabase.from("notifications").select("id, title, message, type, action_url, read_at, created_at").eq("user_id", user.id).is("read_at", null).order("created_at", { ascending: false }).limit(10)
          : Promise.resolve({ data: [] }),
      ]);

      const activeCount  = activePartnersRes.count  ?? 0;
      const pendingCount = pendingPartnersRes.count  ?? 0;
      const customerCount = activeCustomersRes.count ?? 0;
      const invoiceCount  = totalInvoicesRes.count   ?? 0;

      setStats([
        { label: "Active Partners",       value: activeCount.toLocaleString(),   icon: Users,      change: `${activeCount} total active`,         bg: "bg-primary/10",  color: "text-primary",     link: "/portal/partners" },
        { label: "Pending Verification",  value: pendingCount.toLocaleString(),  icon: ShieldCheck, change: `${pendingCount} awaiting review`,     bg: "bg-amber-500/10", color: "text-amber-500",  link: "/portal/verification" },
        { label: "Active Customers",      value: customerCount.toLocaleString(), icon: Building2,  change: `${customerCount} platforms connected`, bg: "bg-primary/10",  color: "text-primary",     link: "/portal/customers" },
        { label: "Total Invoices",        value: invoiceCount.toLocaleString(),  icon: FileText,   change: `${invoiceCount} invoices generated`,   bg: "bg-blue-500/10", color: "text-blue-500",    link: "/portal/invoices" },
      ]);

      const dynamicAlerts: AlertItem[] = [];
      if (pendingCount > 0) {
        dynamicAlerts.push({
          title: `${pendingCount} partner${pendingCount !== 1 ? "s" : ""} awaiting verification`,
          type: "warning",
          action: "Review Now",
          link: "/portal/verification",
        });
      }
      if (customerCount > 0) {
        dynamicAlerts.push({
          title: `${customerCount} active customer platform${customerCount !== 1 ? "s" : ""}`,
          type: "info",
          action: "View Customers",
          link: "/portal/customers",
        });
      }
      dynamicAlerts.push({ title: "View all partner records", type: "success", action: "All Partners", link: "/portal/partners" });
      dynamicAlerts.push({ title: "Payroll & invoice management", type: "info", action: "Payroll", link: "/portal/payroll" });
      setAlerts(dynamicAlerts);

      setNotifications((notificationsRes.data as Notification[]) || []);

      const formatStatus = (s: string) => ({
        active: "Verified", pending: "Pending", email_verified: "Email Verified",
        under_review: "In Review", rejected: "Rejected", deactivated: "Deactivated",
      }[s] ?? s);

      const formatTransport = (t: string) => ({
        bicycle: "Bicycle", ebike: "E-bike", moped: "Moped", car: "Car", walking: "Walking",
      }[t] ?? t);

      if (recentPartnersRes.data) {
        setRecentPartners(
          recentPartnersRes.data.map((p) => ({
            name: `${p.first_name} ${p.last_name}`,
            status: formatStatus(p.status),
            city: p.city,
            joined: new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            vehicle: formatTransport(p.transport),
          }))
        );
      }

      if (customersRes.data && customersRes.data.length > 0) {
        const platformResults = await Promise.all(
          customersRes.data.map(async (customer) => {
            const [partnerLinksRes, invoicesRes] = await Promise.all([
              supabase.from("customer_partner_links").select("id", { count: "exact", head: true }).eq("customer_id", customer.id),
              supabase.from("invoices").select("id", { count: "exact", head: true }).eq("customer_id", customer.id),
            ]);
            return { id: customer.id, name: customer.name, partners: partnerLinksRes.count ?? 0, invoices: invoicesRes.count ?? 0, status: "Connected" };
          })
        );
        setPlatformStats(platformResults);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Control Panel</h1>
          <p className="text-base text-muted-foreground mt-1">AM:365 Workforce Platform — Real-time overview</p>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <Bell className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* ── Stats — clickable ──────────────────────────────────────── */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card
            key={s.label}
            className="hover:shadow-md transition-all hover:border-primary/30 cursor-pointer group"
            onClick={() => navigate(s.link)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
                <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                <ArrowUpRight className="h-3.5 w-3.5 text-primary" /> {s.change}
              </p>
              <p className="text-xs text-primary opacity-0 group-hover:opacity-100 mt-2 transition-opacity flex items-center gap-1">
                View details <ChevronRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Platform Performance ──────────────────────────────────── */}
      {platformStats.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {platformStats.map((platform) => (
            <Card
              key={platform.id}
              className="hover:shadow-md transition-all hover:border-primary/30 cursor-pointer"
              onClick={() => navigate("/portal/customers")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{platform.name}</p>
                      <Badge variant="default" className="text-xs">{platform.status}</Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-primary/5 transition-colors" onClick={(e) => { e.stopPropagation(); navigate("/portal/partners"); }}>
                    <p className="text-sm text-muted-foreground">Linked Partners</p>
                    <p className="text-xl font-bold">{platform.partners}</p>
                    <p className="text-xs text-primary mt-1">View →</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-primary/5 transition-colors" onClick={(e) => { e.stopPropagation(); navigate("/portal/invoices"); }}>
                    <p className="text-sm text-muted-foreground">Invoices</p>
                    <p className="text-xl font-bold">{platform.invoices.toLocaleString()}</p>
                    <p className="text-xs text-primary mt-1">View →</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Recent Partners + Alerts ──────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Recent Partner Activity</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/portal/partners")}>
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentPartners.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No partners found yet.</p>
            ) : (
              <div className="space-y-3">
                {recentPartners.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border transition-all cursor-pointer"
                    onClick={() => navigate("/portal/partners")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                        {p.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.city} · {p.vehicle} · Joined {p.joined}</p>
                      </div>
                    </div>
                    <Badge variant={p.status === "Verified" ? "default" : "secondary"}>{p.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Alerts & Actions + Notifications ─────────────────── */}
        <div className="space-y-4">
          {/* Unread notifications from DB */}
          {unreadCount > 0 && (
            <Card className="border-amber-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-500" />
                    Notifications
                    <Badge className="bg-amber-500 text-white text-xs px-2 py-0.5">{unreadCount}</Badge>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={handleMarkAllRead}
                    disabled={markingRead}
                  >
                    <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 cursor-pointer hover:bg-amber-500/10 transition-colors"
                      onClick={() => n.action_url && navigate(n.action_url)}
                    >
                      <Bell className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(n.created_at).toLocaleString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Static alerts/quick actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" /> Alerts &amp; Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No alerts at this time.</p>
              ) : (
                <div className="space-y-3">
                  {alerts.map((a, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-muted/50 border hover:border-primary/20 hover:bg-muted/70 transition-all cursor-pointer group"
                      onClick={() => navigate(a.link)}
                    >
                      <div className="flex items-start gap-3">
                        <TrendingUp className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                          a.type === "warning" ? "text-amber-500" :
                          a.type === "success" ? "text-primary" : "text-blue-500"
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{a.title}</p>
                          <p className="text-xs text-primary mt-1 group-hover:underline">
                            {a.action} →
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
