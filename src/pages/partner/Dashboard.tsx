import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Clock, Calendar, TrendingUp, ArrowUpRight, FileText } from "lucide-react";

const stats = [
  { label: "Current Balance", value: "12,450 SEK", icon: DollarSign, change: "+8.2%", color: "text-primary" },
  { label: "Hours This Month", value: "142h", icon: Clock, change: "+12h", color: "text-info" },
  { label: "Next Payout", value: "Apr 25", icon: Calendar, change: "3 days", color: "text-warning" },
  { label: "Deliveries", value: "284", icon: TrendingUp, change: "+24", color: "text-primary" },
];

const recentActivity = [
  { date: "Apr 1", description: "Wolt delivery — Södermalm", hours: "6h", amount: "1,080 SEK", status: "Completed" },
  { date: "Mar 31", description: "Wolt delivery — Vasastan", hours: "8h", amount: "1,440 SEK", status: "Completed" },
  { date: "Mar 30", description: "Wolt delivery — Kungsholmen", hours: "5h", amount: "900 SEK", status: "Completed" },
  { date: "Mar 29", description: "Wolt delivery — Östermalm", hours: "7h", amount: "1,260 SEK", status: "Pending" },
];

export default function PartnerDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, Johan 👋</h1>
        <p className="text-muted-foreground">Here's your overview for April 2024</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <div className={`h-9 w-9 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-primary" /> {stat.change} vs last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{item.date} · {item.hours}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{item.amount}</p>
                    <Badge variant={item.status === "Completed" ? "default" : "secondary"} className="text-xs">
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Payout</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">12,450 SEK</p>
                <p className="text-sm text-muted-foreground mt-1">Scheduled for April 25, 2024</p>
                <div className="mt-4 p-3 rounded-lg bg-muted text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Gross</span><span>14,200 SEK</span></div>
                  <div className="flex justify-between mt-1"><span className="text-muted-foreground">Tax</span><span>-1,750 SEK</span></div>
                  <div className="flex justify-between mt-1 font-semibold border-t pt-1"><span>Net</span><span className="text-primary">12,450 SEK</span></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start"><FileText className="mr-2 h-4 w-4" /> View Latest Payslip</Button>
              <Button variant="outline" className="w-full justify-start"><Calendar className="mr-2 h-4 w-4" /> My Schedule</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
