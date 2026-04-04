import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, AlertCircle, Info, Clock, Check, Trash2 } from "lucide-react";

const notifications = [
  { title: "Payslip Available", message: "Your March 2024 payslip has been generated and is ready to view. Net amount: 20,304 SEK.", time: "2 hours ago", type: "success", read: false },
  { title: "Schedule Updated", message: "Your Thursday shift (Apr 4) has been confirmed for Kungsholmen area, 12:00–20:00.", time: "5 hours ago", type: "info", read: false },
  { title: "Contract Renewal Notice", message: "Your employment contract will auto-renew on April 15. Please review the updated terms and conditions.", time: "1 day ago", type: "warning", read: false },
  { title: "Document Verified", message: "Your passport ID document has been verified by our compliance team. No further action needed.", time: "2 days ago", type: "success", read: true },
  { title: "System Maintenance", message: "Planned platform maintenance on April 5 from 02:00-04:00 CET. Portal will be briefly unavailable.", time: "3 days ago", type: "info", read: true },
  { title: "Wolt Integration Update", message: "Delivery data sync from Wolt has been updated. Your March hours have been automatically imported.", time: "4 days ago", type: "success", read: true },
  { title: "Tax Certificate Ready", message: "Your 2023 tax certificate (Kontrolluppgift) is now available in the Documents section.", time: "5 days ago", type: "info", read: true },
  { title: "New Area Available", message: "City Center area is now available for scheduling. Update your preferences in Profile settings.", time: "1 week ago", type: "info", read: true },
];

const iconMap = { success: CheckCircle, warning: AlertCircle, info: Info };
const colorMap = { success: "text-primary", warning: "text-warning", info: "text-info" };
const bgMap = { success: "bg-primary/10", warning: "bg-warning/10", info: "bg-info/10" };

export default function PartnerNotifications() {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-base text-muted-foreground mt-1">Stay updated with important messages and alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm px-3 py-1">{unreadCount} unread</Badge>
          <Button variant="outline" size="sm"><Check className="mr-1.5 h-3.5 w-3.5" /> Mark All Read</Button>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.map((n, i) => {
          const Icon = iconMap[n.type as keyof typeof iconMap] || Bell;
          const iconColor = colorMap[n.type as keyof typeof colorMap] || "text-muted-foreground";
          const iconBg = bgMap[n.type as keyof typeof bgMap] || "bg-muted";
          return (
            <Card key={i} className={`transition-all ${!n.read ? "border-primary/30 bg-primary/5 shadow-sm" : "hover:bg-muted/30"}`}>
              <CardContent className="p-5 flex items-start gap-4">
                <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 mt-0.5 ${iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{n.title}</p>
                    <div className="flex items-center gap-2">
                      {!n.read && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5"><Clock className="h-3 w-3" />{n.time}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
