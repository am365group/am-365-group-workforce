import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Users, MapPin } from "lucide-react";

const shifts = [
  { date: "Apr 4", time: "08:00–16:00", area: "Södermalm", partners: 12, filled: 10, status: "Open" },
  { date: "Apr 4", time: "12:00–20:00", area: "Vasastan", partners: 8, filled: 8, status: "Full" },
  { date: "Apr 4", time: "16:00–00:00", area: "Kungsholmen", partners: 6, filled: 4, status: "Open" },
  { date: "Apr 5", time: "08:00–16:00", area: "Östermalm", partners: 10, filled: 7, status: "Open" },
  { date: "Apr 5", time: "10:00–18:00", area: "Södermalm", partners: 15, filled: 15, status: "Full" },
  { date: "Apr 5", time: "14:00–22:00", area: "City Center", partners: 8, filled: 3, status: "Critical" },
];

export default function AdminScheduling() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schedule Management</h1>
          <p className="text-muted-foreground">Manage partner shifts and assignments</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" /> Create Shift</Button>
      </div>

      <div className="space-y-3">
        {shifts.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center min-w-[60px]">
                  <p className="font-bold text-sm">{s.date.split(" ")[0]}</p>
                  <p className="text-xs text-muted-foreground">{s.date.split(" ")[1]}</p>
                </div>
                <div>
                  <p className="font-medium text-sm flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {s.time}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.area}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{s.filled}</span>
                  <span className="text-muted-foreground">/ {s.partners}</span>
                </div>
                <Badge variant={s.status === "Full" ? "default" : s.status === "Critical" ? "destructive" : "secondary"}>
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
