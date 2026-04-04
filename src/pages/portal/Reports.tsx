import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, DollarSign, Truck, Download, Calendar, ArrowUpRight, Building2 } from "lucide-react";

const monthlyData = [
  { month: "Jan", revenue: 2.1, partners: 210, deliveries: 14200, newPartners: 18 },
  { month: "Feb", revenue: 2.3, partners: 225, deliveries: 15800, newPartners: 15 },
  { month: "Mar", revenue: 2.7, partners: 241, deliveries: 18400, newPartners: 16 },
  { month: "Apr", revenue: 2.85, partners: 247, deliveries: 19200, newPartners: 12 },
];

const kpis = [
  { label: "Revenue Growth (YoY)", value: "+35.7%", icon: TrendingUp, color: "text-primary" },
  { label: "Partner Retention", value: "94.2%", icon: Users, color: "text-primary" },
  { label: "Avg Deliveries/Day", value: "640", icon: Truck, color: "text-info" },
  { label: "Avg Earning/Partner", value: "11,538 SEK", icon: DollarSign, color: "text-primary" },
  { label: "Partner Growth (YoY)", value: "+17.6%", icon: Users, color: "text-primary" },
  { label: "Avg Hours/Partner", value: "142h/mo", icon: Calendar, color: "text-info" },
];

const platformBreakdown = [
  { platform: "Wolt", partners: 142, revenue: "1.84M SEK", deliveries: 12800, share: 66.8 },
  { platform: "Foodora", partners: 68, revenue: "612K SEK", deliveries: 6400, share: 33.2 },
];

const topPerformers = [
  { name: "Fatima Noor", deliveries: 312, hours: 173, earnings: "31,140 SEK" },
  { name: "Johan Andersson", deliveries: 284, hours: 142, earnings: "25,560 SEK" },
  { name: "Erik Johansson", deliveries: 198, hours: 110, earnings: "19,800 SEK" },
  { name: "Mohammed Al-Hassan", deliveries: 156, hours: 87, earnings: "15,660 SEK" },
  { name: "Klara Nilsson", deliveries: 145, hours: 81, earnings: "14,580 SEK" },
];

export default function AdminReports() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-base text-muted-foreground mt-1">Platform performance metrics, insights, and trends</p>
        </div>
        <Button variant="outline" size="lg"><Download className="mr-2 h-4 w-4" /> Export Report</Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-5 text-center">
              <kpi.icon className={`h-5 w-5 ${kpi.color} mx-auto mb-2`} />
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Monthly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {monthlyData.map((m) => (
              <div key={m.month} className="flex items-center gap-5">
                <span className="font-semibold w-10 text-lg">{m.month}</span>
                <div className="flex-1">
                  <div className="h-10 bg-muted rounded-xl overflow-hidden">
                    <div className="h-full bg-primary/80 rounded-xl flex items-center px-4" style={{ width: `${(m.revenue / 3) * 100}%` }}>
                      <span className="text-sm font-semibold text-primary-foreground">{m.revenue}M SEK</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground w-28 text-right">{m.partners} partners</div>
                <div className="text-sm text-muted-foreground w-32 text-right">{m.deliveries.toLocaleString()} deliveries</div>
                <Badge variant="outline" className="text-xs w-20 justify-center">+{m.newPartners} new</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Platform Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Platform Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {platformBreakdown.map((p) => (
                <div key={p.platform} className="p-4 rounded-xl border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-semibold text-lg">{p.platform}</span>
                    </div>
                    <span className="text-xl font-bold text-primary">{p.revenue}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><p className="text-muted-foreground">Partners</p><p className="font-medium">{p.partners}</p></div>
                    <div><p className="text-muted-foreground">Deliveries</p><p className="font-medium">{p.deliveries.toLocaleString()}</p></div>
                    <div><p className="text-muted-foreground">Revenue Share</p><p className="font-medium">{p.share}%</p></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Top Performers (MTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? "bg-yellow-100 text-yellow-700" : "bg-primary/10 text-primary"}`}>
                      #{i + 1}
                    </div>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-muted-foreground">{p.deliveries} deliveries · {p.hours}h</p>
                    </div>
                  </div>
                  <p className="font-semibold text-primary">{p.earnings}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
