import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, Clock, Calendar, TrendingUp, ArrowUpRight, FileText, Truck, MapPin, Star, ChevronRight, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const stats = [
  { label: "Current Balance", value: "12,450 SEK", icon: DollarSign, change: "+8.2%", color: "text-primary", bg: "bg-primary/10" },
  { label: "Hours This Month", value: "142h", icon: Clock, change: "+12h", color: "text-info", bg: "bg-info/10" },
  { label: "Next Payout", value: "Apr 25", icon: Calendar, change: "In 3 days", color: "text-warning", bg: "bg-warning/10" },
  { label: "Total Deliveries", value: "284", icon: Truck, change: "+24 this week", color: "text-primary", bg: "bg-primary/10" },
];

const recentActivity = [
  { date: "Apr 1", description: "Wolt delivery — Södermalm", hours: "6h", amount: "1,080 SEK", status: "Completed", deliveries: 11 },
  { date: "Mar 31", description: "Wolt delivery — Vasastan", hours: "8h", amount: "1,440 SEK", status: "Completed", deliveries: 14 },
  { date: "Mar 30", description: "Wolt delivery — Kungsholmen", hours: "5h", amount: "900 SEK", status: "Completed", deliveries: 9 },
  { date: "Mar 29", description: "Foodora delivery — Östermalm", hours: "7h", amount: "1,260 SEK", status: "Pending", deliveries: 12 },
  { date: "Mar 28", description: "Wolt delivery — City Center", hours: "8h", amount: "1,440 SEK", status: "Completed", deliveries: 15 },
];

const upcomingShifts = [
  { day: "Tomorrow", time: "08:00 – 16:00", area: "Södermalm", client: "Wolt" },
  { day: "Thu, Apr 4", time: "12:00 – 20:00", area: "Vasastan", client: "Wolt" },
  { day: "Fri, Apr 5", time: "09:00 – 17:00", area: "Östermalm", client: "Foodora" },
];

export default function PartnerDashboard() {
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [userName, setUserName] = useState("Partner");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          setIsLoading(false);
          return;
        }

        const { data: app, error: appError } = await supabase
          .from("partner_applications")
          .select("status, first_name")
          .eq("email", userData.user.email)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!appError && app) {
          setAppStatus(app.status);
          setUserName(app.first_name || "Partner");
        }
      } catch (e) {
        console.error("Error fetching user data:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const isIncomplete = appStatus === "pending" || appStatus === "email_verified";

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {userName} 👋</h1>
        <p className="text-base text-muted-foreground mt-1">Here's your overview for April 2024</p>
      </div>

      {isIncomplete && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="flex items-center justify-between gap-4">
              <div>
                <strong>Complete your profile:</strong> Upload your ID and required documents to activate your account and access all features.
              </div>
              <Link to="/partner/documents">
                <Button variant="default" size="sm">Upload Documents</Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                <ArrowUpRight className="h-3.5 w-3.5 text-primary" /> {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-sm">View All <ChevronRight className="ml-1 h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">{item.date} · {item.hours} · {item.deliveries} deliveries</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-base">{item.amount}</p>
                    <Badge variant={item.status === "Completed" ? "default" : "secondary"} className="text-xs mt-1">
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Payout Card */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl">Next Payout</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-primary">12,450 SEK</p>
                <p className="text-sm text-muted-foreground mt-2">Scheduled for April 25, 2024</p>
              </div>
              <div className="p-4 rounded-xl bg-muted space-y-2.5">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gross Pay</span><span className="font-medium">14,200 SEK</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax (30%)</span><span className="font-medium text-destructive">-1,750 SEK</span></div>
                <div className="flex justify-between text-sm border-t pt-2 font-semibold"><span>Net Pay</span><span className="text-primary">12,450 SEK</span></div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">Monthly target</span>
                  <span className="font-medium">71%</span>
                </div>
                <Progress value={71} className="h-2.5" />
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Shifts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Upcoming Shifts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingShifts.map((shift, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{shift.day}</span>
                    <Badge variant="outline" className="text-xs">{shift.client}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {shift.time}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {shift.area}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Button variant="outline" className="w-full justify-start h-11 text-sm"><FileText className="mr-2 h-4 w-4" /> View Latest Payslip</Button>
              <Button variant="outline" className="w-full justify-start h-11 text-sm"><Calendar className="mr-2 h-4 w-4" /> My Schedule</Button>
              <Button variant="outline" className="w-full justify-start h-11 text-sm"><Star className="mr-2 h-4 w-4" /> Performance Report</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
