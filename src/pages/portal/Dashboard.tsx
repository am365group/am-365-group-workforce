import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, ShieldCheck, DollarSign, Truck, TrendingUp, AlertCircle, ArrowUpRight, Clock, Calendar, Building2, ChevronRight } from "lucide-react";

const stats = [
  { label: "Active Partners", value: "247", icon: Users, change: "+12 this month", trend: "up", bg: "bg-primary/10", color: "text-primary" },
  { label: "Pending Verification", value: "8", icon: ShieldCheck, change: "-3 from last week", trend: "down", bg: "bg-warning/10", color: "text-warning" },
  { label: "Monthly Revenue", value: "2.85M SEK", icon: DollarSign, change: "+15% MoM", trend: "up", bg: "bg-primary/10", color: "text-primary" },
  { label: "Deliveries Today", value: "1,842", icon: Truck, change: "+124 vs yesterday", trend: "up", bg: "bg-info/10", color: "text-info" },
];

const alerts = [
  { title: "3 partners awaiting ID verification", type: "warning", action: "Review Now" },
  { title: "Payroll deadline in 2 days — April cycle", type: "info", action: "Open Payroll" },
  { title: "Wolt API sync completed — 142 records updated", type: "success", action: "View Data" },
  { title: "2 contracts expiring this week", type: "warning", action: "Review" },
  { title: "Foodora integration: rate limit warning (80%)", type: "info", action: "Check" },
];

const recentPartners = [
  { name: "Erik Johansson", status: "Verified", city: "Stockholm", joined: "Mar 28", vehicle: "Bicycle" },
  { name: "Anna Lindström", status: "Pending", city: "Gothenburg", joined: "Mar 30", vehicle: "Car" },
  { name: "Mohammed Al-Hassan", status: "Verified", city: "Malmö", joined: "Apr 1", vehicle: "Moped" },
  { name: "Sofia Bergqvist", status: "In Review", city: "Stockholm", joined: "Apr 2", vehicle: "E-bike" },
  { name: "Carlos Garcia", status: "Pending", city: "Uppsala", joined: "Apr 2", vehicle: "Bicycle" },
];

const platformStats = [
  { name: "Wolt", partners: 142, deliveriesToday: 1284, status: "Connected", revenue: "1.84M SEK" },
  { name: "Foodora", partners: 68, deliveriesToday: 558, status: "Connected", revenue: "612K SEK" },
];

export default function AdminDashboard() {
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
      <div className="grid gap-6 lg:grid-cols-2">
        {platformStats.map((platform) => (
          <Card key={platform.name}>
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
                <p className="text-xl font-bold text-primary">{platform.revenue}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Active Partners</p>
                  <p className="text-xl font-bold">{platform.partners}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Deliveries Today</p>
                  <p className="text-xl font-bold">{platform.deliveriesToday.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Partners + Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Recent Partner Activity</CardTitle>
            <Button variant="ghost" size="sm">View All <ChevronRight className="ml-1 h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><AlertCircle className="h-5 w-5 text-warning" /> Alerts & Actions</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
