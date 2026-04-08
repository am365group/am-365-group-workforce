import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ShieldCheck, DollarSign, Building2, TrendingUp, AlertCircle, ArrowUpRight, ChevronRight, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StatItem {
  label: string;
  value: string;
  icon: React.ElementType;
  change: string;
  bg: string;
  color: string;
}

interface AlertItem {
  title: string;
  type: "warning" | "info" | "success";
  action: string;
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

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [recentPartners, setRecentPartners] = useState<RecentPartner[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStat[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Run all queries in parallel
        const [
          activePartnersRes,
          pendingPartnersRes,
          activeCustomersRes,
          totalInvoicesRes,
          recentPartnersRes,
          customersRes,
        ] = await Promise.all([
          // Active partners count
          supabase
            .from("partner_applications")
            .select("id", { count: "exact", head: true })
            .eq("status", "active"),
          // Pending verification count
          supabase
            .from("partner_applications")
            .select("id", { count: "exact", head: true })
            .in("status", ["pending", "email_verified", "under_review"]),
          // Active customers count
          supabase
            .from("customers")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true),
          // Total invoices count
          supabase
            .from("invoices")
            .select("id", { count: "exact", head: true }),
          // Recent 5 partners
          supabase
            .from("partner_applications")
            .select("first_name, last_name, status, city, transport, created_at")
            .order("created_at", { ascending: false })
            .limit(5),
          // Active customers with details for platform stats
          supabase
            .from("customers")
            .select("id, name, is_active")
            .eq("is_active", true),
        ]);

        const activeCount = activePartnersRes.count ?? 0;
        const pendingCount = pendingPartnersRes.count ?? 0;
        const customerCount = activeCustomersRes.count ?? 0;
        const invoiceCount = totalInvoicesRes.count ?? 0;

        // Build stats cards
        setStats([
          {
            label: "Active Partners",
            value: activeCount.toLocaleString(),
            icon: Users,
            change: `${activeCount} total active`,
            bg: "bg-primary/10",
            color: "text-primary",
          },
          {
            label: "Pending Verification",
            value: pendingCount.toLocaleString(),
            icon: ShieldCheck,
            change: `${pendingCount} awaiting review`,
            bg: "bg-warning/10",
            color: "text-warning",
          },
          {
            label: "Active Customers",
            value: customerCount.toLocaleString(),
            icon: Building2,
            change: `${customerCount} platforms connected`,
            bg: "bg-primary/10",
            color: "text-primary",
          },
          {
            label: "Total Invoices",
            value: invoiceCount.toLocaleString(),
            icon: FileText,
            change: `${invoiceCount} invoices generated`,
            bg: "bg-info/10",
            color: "text-info",
          },
        ]);

        // Build alerts dynamically
        const dynamicAlerts: AlertItem[] = [];
        if (pendingCount > 0) {
          dynamicAlerts.push({
            title: `${pendingCount} partner${pendingCount !== 1 ? "s" : ""} awaiting verification`,
            type: "warning",
            action: "Review Now",
          });
        }
        if (customerCount > 0) {
          dynamicAlerts.push({
            title: `${customerCount} active customer platform${customerCount !== 1 ? "s" : ""}`,
            type: "info",
            action: "View Customers",
          });
        }
        dynamicAlerts.push({
          title: "System ready",
          type: "success",
          action: "View Status",
        });
        setAlerts(dynamicAlerts);

        // Format recent partners
        const formatStatus = (status: string) => {
          switch (status) {
            case "active": return "Verified";
            case "pending": return "Pending";
            case "email_verified": return "Email Verified";
            case "under_review": return "In Review";
            case "rejected": return "Rejected";
            case "deactivated": return "Deactivated";
            default: return status;
          }
        };

        const formatTransport = (transport: string) => {
          switch (transport) {
            case "bicycle": return "Bicycle";
            case "ebike": return "E-bike";
            case "moped": return "Moped";
            case "car": return "Car";
            case "walking": return "Walking";
            default: return transport;
          }
        };

        if (recentPartnersRes.data) {
          setRecentPartners(
            recentPartnersRes.data.map((p) => ({
              name: `${p.first_name} ${p.last_name}`,
              status: formatStatus(p.status),
              city: p.city,
              joined: new Date(p.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
              vehicle: formatTransport(p.transport),
            }))
          );
        }

        // Build platform stats: for each active customer, get partner + invoice counts
        if (customersRes.data && customersRes.data.length > 0) {
          const platformResults = await Promise.all(
            customersRes.data.map(async (customer) => {
              const [partnerLinksRes, invoicesRes] = await Promise.all([
                supabase
                  .from("customer_partner_links")
                  .select("id", { count: "exact", head: true })
                  .eq("customer_id", customer.id),
                supabase
                  .from("invoices")
                  .select("id", { count: "exact", head: true })
                  .eq("customer_id", customer.id),
              ]);
              return {
                id: customer.id,
                name: customer.name,
                partners: partnerLinksRes.count ?? 0,
                invoices: invoicesRes.count ?? 0,
                status: "Connected",
              };
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

    loadDashboardData();
  }, []);

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

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Control Panel</h1>
        <p className="text-base text-muted-foreground mt-1">AM:365 Workforce Platform — Real-time overview</p>
      </div>

      {/* Stats */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Platform Performance */}
      {platformStats.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {platformStats.map((platform) => (
            <Card key={platform.id}>
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
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Linked Partners</p>
                    <p className="text-xl font-bold">{platform.partners}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Invoices</p>
                    <p className="text-xl font-bold">{platform.invoices.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Partners + Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Recent Partner Activity</CardTitle>
            <Button variant="ghost" size="sm">View All <ChevronRight className="ml-1 h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            {recentPartners.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No partners found yet.</p>
            ) : (
              <div className="space-y-3">
                {recentPartners.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border transition-all">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><AlertCircle className="h-5 w-5 text-warning" /> Alerts & Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No alerts at this time.</p>
            ) : (
              <div className="space-y-3">
                {alerts.map((a, i) => (
                  <div key={i} className="p-4 rounded-xl bg-muted/50 border hover:border-primary/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <TrendingUp className={`h-4 w-4 mt-0.5 flex-shrink-0 ${a.type === "warning" ? "text-warning" : a.type === "success" ? "text-primary" : "text-info"}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{a.title}</p>
                        <Button variant="link" className="h-auto p-0 text-xs text-primary mt-1">{a.action} →</Button>
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
  );
}
