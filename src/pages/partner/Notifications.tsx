import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertCircle, Info, Clock } from "lucide-react";

const notifications = [
  { title: "Payslip Available", message: "Your March 2024 payslip is ready to view.", time: "2 hours ago", type: "success", read: false },
  { title: "Schedule Updated", message: "Your Thursday shift has been confirmed for Kungsholmen.", time: "5 hours ago", type: "info", read: false },
  { title: "Contract Renewal", message: "Your contract will auto-renew on April 15. Review the terms.", time: "1 day ago", type: "warning", read: false },
  { title: "Document Verified", message: "Your ID document has been verified by our team.", time: "2 days ago", type: "success", read: true },
  { title: "System Maintenance", message: "Planned maintenance on April 5 from 02:00-04:00 CET.", time: "3 days ago", type: "info", read: true },
];

const iconMap = { success: CheckCircle, warning: AlertCircle, info: Info };
const colorMap = { success: "text-primary", warning: "text-warning", info: "text-info" };

export default function PartnerNotifications() {
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with important messages</p>
        </div>
        <Badge variant="secondary">{notifications.filter(n => !n.read).length} unread</Badge>
      </div>
      <div className="space-y-3">
        {notifications.map((n, i) => {
          const Icon = iconMap[n.type as keyof typeof iconMap] || Bell;
          return (
            <Card key={i} className={!n.read ? "border-primary/30 bg-primary/5" : ""}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`mt-0.5 ${colorMap[n.type as keyof typeof colorMap]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{n.title}</p>
                    {!n.read && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Clock className="h-3 w-3" />{n.time}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
