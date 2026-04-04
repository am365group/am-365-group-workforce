import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollText, Search, User, Settings, FileText, Shield } from "lucide-react";

const logs = [
  { time: "14:32:01", user: "Admin User", action: "Approved ID verification", target: "Anna Lindström", type: "Verification", ip: "192.168.1.45" },
  { time: "14:28:15", user: "Admin User", action: "Generated payslip", target: "Johan Andersson", type: "Payroll", ip: "192.168.1.45" },
  { time: "13:55:42", user: "System", action: "Wolt API sync completed", target: "142 records", type: "Integration", ip: "—" },
  { time: "13:12:08", user: "Controller", action: "Updated partner status", target: "Lars Eriksson → Inactive", type: "Partner", ip: "192.168.1.22" },
  { time: "12:45:33", user: "Admin User", action: "Created invoice INV-2024-043", target: "Wolt AB", type: "Finance", ip: "192.168.1.45" },
  { time: "11:20:17", user: "System", action: "Payroll reminder sent", target: "All controllers", type: "Notification", ip: "—" },
  { time: "10:05:44", user: "Verifier", action: "Rejected ID document", target: "Carlos Garcia", type: "Verification", ip: "192.168.1.33" },
];

const iconMap: Record<string, React.ElementType> = { Verification: Shield, Payroll: FileText, Integration: Settings, Partner: User, Finance: FileText, Notification: Settings };

export default function AdminAuditLog() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">Complete activity trail for compliance</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search audit log..." className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {logs.map((log, i) => {
              const Icon = iconMap[log.type] || ScrollText;
              return (
                <div key={i} className="p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center mt-0.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm"><span className="font-medium">{log.user}</span> {log.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Target: {log.target} · IP: {log.ip}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{log.type}</Badge>
                    <span className="text-xs text-muted-foreground font-mono">{log.time}</span>
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
