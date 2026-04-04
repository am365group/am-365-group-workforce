import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Download, FileText, Image, File } from "lucide-react";

const documents = [
  { name: "Employment Contract", type: "PDF", size: "245 KB", date: "Jan 15, 2024", icon: FileText, category: "Contract" },
  { name: "ID Verification", type: "JPG", size: "1.2 MB", date: "Jan 10, 2024", icon: Image, category: "Identity" },
  { name: "Tax Certificate 2023", type: "PDF", size: "180 KB", date: "Feb 1, 2024", icon: FileText, category: "Tax" },
  { name: "Insurance Policy", type: "PDF", size: "320 KB", date: "Jan 15, 2024", icon: File, category: "Insurance" },
  { name: "Work Permit", type: "PDF", size: "150 KB", date: "Jan 8, 2024", icon: FileText, category: "Legal" },
];

export default function PartnerDocuments() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Your uploaded and generated documents</p>
        </div>
        <Button><FolderOpen className="mr-2 h-4 w-4" /> Upload Document</Button>
      </div>
      <div className="space-y-3">
        {documents.map((doc, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <doc.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.type} · {doc.size} · {doc.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{doc.category}</Badge>
                <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
