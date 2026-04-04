import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock } from "lucide-react";

const scheduleData = [
  { day: "Mon, Apr 1", shift: "08:00 – 16:00", area: "Södermalm", status: "Confirmed" },
  { day: "Tue, Apr 2", shift: "10:00 – 18:00", area: "Vasastan", status: "Confirmed" },
  { day: "Wed, Apr 3", shift: "—", area: "—", status: "Day Off" },
  { day: "Thu, Apr 4", shift: "12:00 – 20:00", area: "Kungsholmen", status: "Pending" },
  { day: "Fri, Apr 5", shift: "08:00 – 16:00", area: "Östermalm", status: "Confirmed" },
  { day: "Sat, Apr 6", shift: "09:00 – 15:00", area: "Södermalm", status: "Confirmed" },
  { day: "Sun, Apr 7", shift: "—", area: "—", status: "Day Off" },
];

export default function PartnerSchedule() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Schedule</h1>
        <p className="text-muted-foreground">Your upcoming assignments for this week</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduleData.map((item, i) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-lg border ${item.status === "Day Off" ? "bg-muted/30 opacity-60" : "hover:bg-muted/50"} transition-colors`}>
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[80px]">
                    <p className="font-semibold text-sm">{item.day.split(", ")[0]}</p>
                    <p className="text-xs text-muted-foreground">{item.day.split(", ")[1]}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {item.shift}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.area}</p>
                  </div>
                </div>
                <Badge variant={item.status === "Confirmed" ? "default" : item.status === "Pending" ? "secondary" : "outline"}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
