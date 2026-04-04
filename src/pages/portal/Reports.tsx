import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, DollarSign, Truck } from "lucide-react";

const monthlyData = [
  { month: "Jan", revenue: 2.1, partners: 210, deliveries: 14200 },
  { month: "Feb", revenue: 2.3, partners: 225, deliveries: 15800 },
  { month: "Mar", revenue: 2.7, partners: 241, deliveries: 18400 },
  { month: "Apr", revenue: 2.85, partners: 247, deliveries: 19200 },
];

export default function AdminReports() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">Platform performance metrics and insights</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-sm text-muted-foreground">Revenue Growth</span></div><p className="text-2xl font-bold">+35.7%</p><p className="text-xs text-muted-foreground">YoY</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><Users className="h-4 w-4 text-primary" /><span className="text-sm text-muted-foreground">Partner Growth</span></div><p className="text-2xl font-bold">+17.6%</p><p className="text-xs text-muted-foreground">YoY</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><Truck className="h-4 w-4 text-primary" /><span className="text-sm text-muted-foreground">Avg Deliveries/Day</span></div><p className="text-2xl font-bold">640</p><p className="text-xs text-muted-foreground">Per day avg</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><DollarSign className="h-4 w-4 text-primary" /><span className="text-sm text-muted-foreground">Avg Earning/Partner</span></div><p className="text-2xl font-bold">11,538 SEK</p><p className="text-xs text-muted-foreground">Per month</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Monthly Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.map((m) => (
              <div key={m.month} className="flex items-center gap-4">
                <span className="text-sm font-medium w-8">{m.month}</span>
                <div className="flex-1">
                  <div className="h-8 bg-muted rounded-lg overflow-hidden">
                    <div className="h-full bg-primary/80 rounded-lg flex items-center px-3" style={{ width: `${(m.revenue / 3) * 100}%` }}>
                      <span className="text-xs font-medium text-primary-foreground">{m.revenue}M SEK</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground w-24 text-right">{m.partners} partners</div>
                <div className="text-sm text-muted-foreground w-28 text-right">{m.deliveries.toLocaleString()} deliveries</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
