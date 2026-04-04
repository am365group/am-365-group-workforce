import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Users, MapPin, Clock, ChevronLeft, ChevronRight, Truck, AlertCircle } from "lucide-react";

const shifts = [
  { date: "Apr 4", day: "Friday", time: "08:00–16:00", area: "Södermalm", platform: "Wolt", partners: 12, filled: 10, status: "Open" },
  { date: "Apr 4", day: "Friday", time: "12:00–20:00", area: "Vasastan", platform: "Wolt", partners: 8, filled: 8, status: "Full" },
  { date: "Apr 4", day: "Friday", time: "16:00–00:00", area: "Kungsholmen", platform: "Foodora", partners: 6, filled: 4, status: "Open" },
  { date: "Apr 5", day: "Saturday", time: "08:00–16:00", area: "Östermalm", platform: "Wolt", partners: 10, filled: 7, status: "Open" },
  { date: "Apr 5", day: "Saturday", time: "10:00–18:00", area: "Södermalm", platform: "Wolt", partners: 15, filled: 15, status: "Full" },
  { date: "Apr 5", day: "Saturday", time: "14:00–22:00", area: "City Center", platform: "Foodora", partners: 8, filled: 3, status: "Critical" },
  { date: "Apr 6", day: "Sunday", time: "09:00–17:00", area: "Vasastan", platform: "Wolt", partners: 10, filled: 6, status: "Open" },
  { date: "Apr 6", day: "Sunday", time: "11:00–19:00", area: "Kungsholmen", platform: "Wolt", partners: 8, filled: 2, status: "Critical" },
];

const scheduleStats = [
  { label: "Total Shifts", value: "24", color: "text-foreground" },
  { label: "Fully Staffed", value: "8", color: "text-primary" },
  { label: "Open Positions", value: "12", color: "text-warning" },
  { label: "Critical Gaps", value: "2", color: "text-destructive" },
];

export default function AdminScheduling() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schedule Management</h1>
          <p className="text-base text-muted-foreground mt-1">Manage partner shifts, assignments, and coverage</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium px-3">Apr 4 – Apr 6, 2024</span>
            <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <Button size="lg"><Plus className="mr-2 h-4 w-4" /> Create Shift</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {scheduleStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5 text-center">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Shifts */}
      <div className="space-y-3">
        {shifts.map((s, i) => (
          <Card key={i} className={`hover:shadow-md transition-shadow ${s.status === "Critical" ? "border-destructive/30" : ""}`}>
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="text-center min-w-[70px]">
                  <p className="font-bold text-lg">{s.date.split(" ")[1]}</p>
                  <p className="text-sm text-muted-foreground">{s.day}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" /> {s.time}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" /> {s.area}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <Badge variant="outline" className="text-xs">{s.platform}</Badge>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="w-24">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold">{s.filled}</span>
                      <span className="text-muted-foreground">/ {s.partners}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.status === "Full" ? "bg-primary" : s.status === "Critical" ? "bg-destructive" : "bg-warning"}`}
                        style={{ width: `${(s.filled / s.partners) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <Badge variant={s.status === "Full" ? "default" : s.status === "Critical" ? "destructive" : "secondary"}>
                  {s.status === "Critical" && <AlertCircle className="h-3 w-3 mr-1" />}
                  {s.status}
                </Badge>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
