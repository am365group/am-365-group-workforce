import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollText, Search, User, Settings, FileText, Shield, Clock, Filter, Download } from "lucide-react";

const logs = [
  { time: "14:32:01", date: "Apr 4, 2024", user: "Admin User", role: "Admin", action: "Approved ID verification", target: "Anna Lindström (P-003)", type: "Verification", ip: "192.168.1.45" },
  { time: "14:28:15", date: "Apr 4, 2024", user: "Maria Svensson", role: "Controller", action: "Generated payslip for March 2024", target: "Johan Andersson (P-001)", type: "Payroll", ip: "192.168.1.22" },
  { time: "13:55:42", date: "Apr 4, 2024", user: "System", role: "Automated", action: "Wolt API sync completed — 142 delivery records", target: "All Wolt partners", type: "Integration", ip: "—" },
  { time: "13:12:08", date: "Apr 4, 2024", user: "Admin User", role: "Admin", action: "Updated partner status to Inactive", target: "Lars Eriksson (P-006)", type: "Partner", ip: "192.168.1.45" },
  { time: "12:45:33", date: "Apr 4, 2024", user: "Maria Svensson", role: "Controller", action: "Created invoice INV-2024-043", target: "Wolt AB — April 2024", type: "Finance", ip: "192.168.1.22" },
  { time: "11:20:17", date: "Apr 4, 2024", user: "System", role: "Automated", action: "Payroll deadline reminder sent to controllers", target: "Maria Svensson, Eva Karlsson", type: "Notification", ip: "—" },
  { time: "10:05:44", date: "Apr 4, 2024", user: "Peter Nilsson", role: "Verifier", action: "Rejected ID document — expired passport", target: "Carlos Garcia (P-008)", type: "Verification", ip: "192.168.1.33" },
  { time: "09:30:12", date: "Apr 4, 2024", user: "Sara Ahmed", role: "Verifier", action: "Approved ID verification", target: "Mohammed Al-Hassan (P-004)", type: "Verification", ip: "192.168.1.34" },
  { time: "08:15:55", date: "Apr 3, 2024", user: "System", role: "Automated", action: "Foodora API sync completed — 68 records", target: "All Foodora partners", type: "Integration", ip: "—" },
  { time: "16:42:08", date: "Apr 3, 2024", user: "Admin User", role: "Admin", action: "Updated notification settings", target: "System configuration", type: "Settings", ip: "192.168.1.45" },
];

const iconMap: Record<string, React.ElementType> = { Verification: Shield, Payroll: FileText, Integration: Settings, Partner: User, Finance: FileText, Notification: Settings, Settings: Settings };
const colorMap: Record<string, string> = { Verification: "text-primary", Payroll: "text-info", Integration: "text-warning", Partner: "text-foreground", Finance: "text-primary", Notification: "text-info", Settings: "text-muted-foreground" };

export default function AdminAuditLog() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Log</h1>
          <p className="text-base text-muted-foreground mt-1">Complete activity trail for compliance, security, and accountability</p>
        </div>
        <Button variant="outline" size="lg"><Download className="mr-2 h-4 w-4" /> Export Log</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search audit log by user, action, or target..." className="pl-9 h-11" />
        </div>
        <Button variant="outline" className="h-11"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
      </div>

      {/* Log Entries */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {logs.map((log, i) => {
              const Icon = iconMap[log.type] || ScrollText;
              const iconColor = colorMap[log.type] || "text-muted-foreground";
              return (
                <div key={i} className="p-5 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                  <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center mt-0.5 ${iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      <span className="text-primary">{log.user}</span>
                      <span className="text-muted-foreground"> ({log.role})</span>
                      {" "}{log.action}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">Target: {log.target}</p>
                    <p className="text-xs text-muted-foreground mt-1">IP: {log.ip}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge variant="outline" className="text-xs">{log.type}</Badge>
                    <div className="text-right">
                      <p className="text-sm font-mono">{log.time}</p>
                      <p className="text-xs text-muted-foreground">{log.date}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
