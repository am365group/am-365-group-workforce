import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Download, FileText, Image, File, Upload, CheckCircle, Clock, AlertCircle } from "lucide-react";

const documents = [
  { name: "Employment Contract v2.0", type: "PDF", size: "245 KB", date: "Jan 15, 2024", icon: FileText, category: "Contract", status: "Active" },
  { name: "ID Verification — Passport", type: "JPG", size: "1.2 MB", date: "Jan 10, 2024", icon: Image, category: "Identity", status: "Verified" },
  { name: "Tax Certificate 2023 (Skattsedel)", type: "PDF", size: "180 KB", date: "Feb 1, 2024", icon: FileText, category: "Tax", status: "Active" },
  { name: "Insurance Policy — Fora", type: "PDF", size: "320 KB", date: "Jan 15, 2024", icon: File, category: "Insurance", status: "Active" },
  { name: "Work Permit / Uppehållstillstånd", type: "PDF", size: "150 KB", date: "Jan 8, 2024", icon: FileText, category: "Legal", status: "Verified" },
  { name: "BankID Verification Certificate", type: "PDF", size: "95 KB", date: "Jan 10, 2024", icon: FileText, category: "Identity", status: "Verified" },
  { name: "March 2024 Payslip", type: "PDF", size: "120 KB", date: "Mar 25, 2024", icon: FileText, category: "Payslip", status: "Active" },
  { name: "Onboarding Checklist", type: "PDF", size: "85 KB", date: "Jan 8, 2024", icon: FileText, category: "Onboarding", status: "Completed" },
];

const statusColors: Record<string, { icon: React.ElementType; color: string }> = {
  Active: { icon: CheckCircle, color: "text-primary" },
  Verified: { icon: CheckCircle, color: "text-primary" },
  Completed: { icon: CheckCircle, color: "text-primary" },
  Pending: { icon: Clock, color: "text-warning" },
  Expired: { icon: AlertCircle, color: "text-destructive" },
};

export default function PartnerDocuments() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-base text-muted-foreground mt-1">Your uploaded and system-generated documents</p>
        </div>
        <Button><Upload className="mr-2 h-4 w-4" /> Upload Document</Button>
      </div>

      {/* Document Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-primary">8</p><p className="text-sm text-muted-foreground mt-1">Total Documents</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-primary">6</p><p className="text-sm text-muted-foreground mt-1">Verified</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-warning">0</p><p className="text-sm text-muted-foreground mt-1">Pending Review</p></CardContent></Card>
      </div>

      {/* Upload Zone */}
      <Card className="border-dashed border-2 hover:border-primary/40 transition-colors cursor-pointer">
        <CardContent className="p-8 text-center">
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium mb-1">Drag & drop files here, or click to browse</p>
          <p className="text-sm text-muted-foreground">Accepted: PDF, JPG, PNG up to 10 MB. Documents are encrypted and stored securely.</p>
        </CardContent>
      </Card>

      {/* Document List */}
      <div className="space-y-3">
        {documents.map((doc, i) => {
          const statusInfo = statusColors[doc.status] || statusColors.Active;
          const StatusIcon = statusInfo.icon;
          return (
            <Card key={i} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                    <doc.icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">{doc.type} · {doc.size} · Uploaded {doc.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">{doc.category}</Badge>
                  <Badge variant={doc.status === "Verified" || doc.status === "Active" ? "default" : "secondary"} className="flex items-center gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {doc.status}
                  </Badge>
                  <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
