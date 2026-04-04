import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ShieldCheck, DollarSign, Truck, TrendingUp, AlertCircle, ArrowUpRight } from "lucide-react";

const stats = [
  { label: "Active Partners", value: "247", icon: Users, change: "+12", trend: "up" },
  { label: "Pending Verification", value: "8", icon: ShieldCheck, change: "-3", trend: "down" },
  { label: "Monthly Revenue", value: "1.2M SEK", icon: DollarSign, change: "+15%", trend: "up" },
  { label: "Deliveries Today", value: "1,842", icon: Truck, change: "+124", trend: "up" },
];

const alerts = [
  { title: "3 partners awaiting ID verification", type: "warning" },
  { title: "Payroll deadline in 2 days", type: "info" },
  { title: "Wolt API sync completed", type: "success" },
  { title: "2 contracts expiring this week", type: "warning" },
];

const recentPartners = [
  { name: "Erik Johansson", status: "Verified", city: "Stockholm", joined: "Mar 28" },
  { name: "Anna Lindström", status: "Pending", city: "Gothenburg", joined: "Mar 30" },
  { name: "Mohammed Al-Hassan", status: "Verified", city: "Malmö", joined: "Apr 1" },
  { name: "Sofia Bergqvist", status: "In Review", city: "Stockholm", joined: "Apr 2" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Control Panel</h1>
        <p className="text-muted-foreground">AM:365 Workforce Platform Overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-primary" /> {s.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Recent Partners</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPartners.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {p.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.city} · Joined {p.joined}</p>
                    </div>
                  </div>
                  <Badge variant={p.status === "Verified" ? "default" : "secondary"}>{p.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertCircle className="h-5 w-5 text-warning" /> Alerts</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((a, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted text-sm flex items-start gap-2">
                  <TrendingUp className={`h-4 w-4 mt-0.5 ${a.type === "warning" ? "text-warning" : a.type === "success" ? "text-primary" : "text-info"}`} />
                  <span>{a.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
