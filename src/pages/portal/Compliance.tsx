import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, AlertTriangle, FileText, Lock, Eye, Trash2, Download, Calendar, Users, Database, Globe } from "lucide-react";

const checks = [
  { name: "Data Encryption at Rest", status: "Compliant", description: "All personal data is encrypted using AES-256 in PostgreSQL. Backups are encrypted.", icon: Lock, article: "Art. 32" },
  { name: "Right to Access", status: "Compliant", description: "Partners can view and export all their personal data via the portal.", icon: Eye, article: "Art. 15" },
  { name: "Right to Erasure", status: "Compliant", description: "Data deletion workflow is implemented. Partners can request full data removal.", icon: Trash2, article: "Art. 17" },
  { name: "Data Portability", status: "Compliant", description: "Partners can download data in CSV/JSON format from the Documents section.", icon: Download, article: "Art. 20" },
  { name: "Consent Management", status: "Review Needed", description: "Cookie consent banner needs updating for 2024 ePrivacy guidelines. Review required.", icon: FileText, article: "Art. 7" },
  { name: "Data Processing Agreements", status: "Compliant", description: "DPA signed with all sub-processors: Wolt, Foodora, Resend, BankID.", icon: FileText, article: "Art. 28" },
  { name: "Breach Notification Protocol", status: "Compliant", description: "72-hour notification process documented and tested. Last drill: March 2024.", icon: AlertTriangle, article: "Art. 33" },
  { name: "Data Retention Policy", status: "Review Needed", description: "Retention schedules for inactive partner data need updating for 2024.", icon: Calendar, article: "Art. 5(1)(e)" },
  { name: "Privacy Impact Assessment", status: "Compliant", description: "DPIA completed for Wolt/Foodora data processing. Annual review scheduled.", icon: Shield, article: "Art. 35" },
  { name: "International Data Transfers", status: "Compliant", description: "All data stored within EU (Sweden). No international transfers.", icon: Globe, article: "Art. 44-49" },
];

const complianceStats = [
  { label: "Compliant", value: 8, total: 10, color: "text-primary" },
  { label: "Review Needed", value: 2, total: 10, color: "text-warning" },
  { label: "Non-Compliant", value: 0, total: 10, color: "text-destructive" },
  { label: "Last Full Audit", value: "Mar 2024", total: null, color: "text-info" },
];

const dataSubjects = [
  { type: "Active Partners", count: 247, dataPoints: "Personal info, work history, payroll, documents" },
  { type: "Inactive Partners", count: 24, dataPoints: "Personal info, historical work data" },
  { type: "Staff Users", count: 6, dataPoints: "Name, email, role, login history" },
  { type: "Customer Contacts", count: 4, dataPoints: "Name, email, phone, company" },
];

export default function AdminCompliance() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GDPR & Compliance</h1>
          <p className="text-base text-muted-foreground mt-1">Data protection compliance status, controls, and data subject register</p>
        </div>
        <Button variant="outline" size="lg"><Download className="mr-2 h-4 w-4" /> Export Compliance Report</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-5 md:grid-cols-4">
        {complianceStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5 text-center">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}{stat.total ? `/${stat.total}` : ""}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Subject Register */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Database className="h-5 w-5 text-primary" /> Data Subject Register</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dataSubjects.map((ds) => (
              <div key={ds.type} className="flex items-center justify-between p-4 rounded-xl border">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{ds.type}</p>
                    <p className="text-sm text-muted-foreground">{ds.dataPoints}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-sm px-3 py-1">{ds.count} records</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Checks */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Compliance Checklist</h2>
        {checks.map((check, i) => (
          <Card key={i} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${check.status === "Compliant" ? "bg-primary/10" : "bg-warning/10"}`}>
                  <check.icon className={`h-6 w-6 ${check.status === "Compliant" ? "text-primary" : "text-warning"}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{check.name}</p>
                    <Badge variant="outline" className="text-xs">{check.article}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{check.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={check.status === "Compliant" ? "default" : "secondary"} className="flex items-center gap-1 text-sm px-3 py-1">
                  {check.status === "Compliant" ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
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
