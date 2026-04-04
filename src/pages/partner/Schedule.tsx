import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, ChevronLeft, ChevronRight, Truck } from "lucide-react";

const scheduleData = [
  { day: "Mon, Apr 1", shift: "08:00 – 16:00", area: "Södermalm", status: "Confirmed", client: "Wolt", deliveries: 14, earnings: "1,440 SEK" },
  { day: "Tue, Apr 2", shift: "10:00 – 18:00", area: "Vasastan", status: "Confirmed", client: "Wolt", deliveries: 11, earnings: "1,080 SEK" },
  { day: "Wed, Apr 3", shift: "—", area: "—", status: "Day Off", client: "—", deliveries: 0, earnings: "—" },
  { day: "Thu, Apr 4", shift: "12:00 – 20:00", area: "Kungsholmen", status: "Pending", client: "Wolt", deliveries: 0, earnings: "Est. 1,260 SEK" },
  { day: "Fri, Apr 5", shift: "08:00 – 16:00", area: "Östermalm", status: "Confirmed", client: "Foodora", deliveries: 0, earnings: "Est. 1,440 SEK" },
  { day: "Sat, Apr 6", shift: "09:00 – 15:00", area: "Södermalm", status: "Confirmed", client: "Wolt", deliveries: 0, earnings: "Est. 900 SEK" },
  { day: "Sun, Apr 7", shift: "—", area: "—", status: "Day Off", client: "—", deliveries: 0, earnings: "—" },
];

const weekStats = [
  { label: "Scheduled Hours", value: "37h" },
  { label: "Confirmed Shifts", value: "4" },
  { label: "Est. Earnings", value: "6,120 SEK" },
  { label: "Avg. Per Shift", value: "1,530 SEK" },
];

export default function PartnerSchedule() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schedule</h1>
          <p className="text-base text-muted-foreground mt-1">Your upcoming assignments and shifts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium px-3">Apr 1 – Apr 7, 2024</span>
          <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Week Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {weekStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5 text-center">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schedule List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> This Week's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduleData.map((item, i) => (
              <div key={i} className={`flex items-center justify-between p-5 rounded-xl border ${item.status === "Day Off" ? "bg-muted/30 opacity-60" : "hover:bg-muted/50 hover:border-primary/20"} transition-all`}>
                <div className="flex items-center gap-5">
                  <div className="text-center min-w-[90px]">
                    <p className="font-semibold">{item.day.split(", ")[0]}</p>
                    <p className="text-sm text-muted-foreground">{item.day.split(", ")[1]}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" /> {item.shift}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" /> {item.area}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {item.client !== "—" && (
                    <Badge variant="outline" className="text-xs">{item.client}</Badge>
                  )}
                  {item.earnings !== "—" && (
                    <span className="text-sm font-medium text-muted-foreground">{item.earnings}</span>
                  )}
                  <Badge variant={item.status === "Confirmed" ? "default" : item.status === "Pending" ? "secondary" : "outline"}>
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-primary" /> Confirmed</span>
        <span className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-muted-foreground" /> Pending</span>
        <span className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-muted" /> Day Off</span>
      </div>
    </div>
  );
}
