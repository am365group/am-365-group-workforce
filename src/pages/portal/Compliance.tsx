import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Shield, CheckCircle, AlertTriangle, FileText, Lock, Eye, Trash2, Download } from "lucide-react";

const checks = [
  { name: "Data Encryption at Rest", status: "Compliant", description: "All personal data is encrypted using AES-256", icon: Lock },
  { name: "Right to Access (Art. 15)", status: "Compliant", description: "Partners can export all their personal data", icon: Eye },
  { name: "Right to Erasure (Art. 17)", status: "Compliant", description: "Data deletion workflow is implemented", icon: Trash2 },
  { name: "Data Portability (Art. 20)", status: "Compliant", description: "Partners can download data in CSV/JSON", icon: Download },
  { name: "Consent Management", status: "Review Needed", description: "Cookie consent banner needs updating for 2024 guidelines", icon: FileText },
  { name: "Data Processing Agreements", status: "Compliant", description: "DPA signed with all sub-processors (Wolt, Foodora)", icon: FileText },
  { name: "Breach Notification (Art. 33)", status: "Compliant", description: "72-hour notification process documented and tested", icon: AlertTriangle },
  { name: "Data Retention Policy", status: "Review Needed", description: "Retention schedules for inactive partner data", icon: FileText },
];

export default function AdminCompliance() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">GDPR & Compliance</h1>
          <p className="text-muted-foreground">Data protection compliance status and controls</p>
        </div>
        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Report</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">6/8</p><p className="text-xs text-muted-foreground">Compliant Checks</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-warning">2</p><p className="text-xs text-muted-foreground">Review Needed</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">0</p><p className="text-xs text-muted-foreground">Non-Compliant</p></CardContent></Card>
      </div>

      <div className="space-y-3">
        {checks.map((check, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${check.status === "Compliant" ? "bg-primary/10" : "bg-warning/10"}`}>
                  <check.icon className={`h-5 w-5 ${check.status === "Compliant" ? "text-primary" : "text-warning"}`} />
                </div>
                <div>
                  <p className="font-medium text-sm">{check.name}</p>
                  <p className="text-xs text-muted-foreground">{check.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={check.status === "Compliant" ? "default" : "secondary"} className="flex items-center gap-1">
                  {check.status === "Compliant" ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {check.status}
                </Badge>
                {check.status === "Review Needed" && <Button size="sm" variant="outline">Review</Button>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
