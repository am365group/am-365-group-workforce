import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CheckCircle, XCircle, Eye, Clock } from "lucide-react";

const queue = [
  { name: "Anna Lindström", type: "Passport", submitted: "Mar 30, 2024", priority: "High", idNumber: "SE-****-4521" },
  { name: "Sofia Bergqvist", type: "National ID", submitted: "Apr 1, 2024", priority: "Medium", idNumber: "SE-****-7893" },
  { name: "Carlos Garcia", type: "Residence Permit", submitted: "Apr 2, 2024", priority: "High", idNumber: "RP-****-1245" },
  { name: "Fatima Noor", type: "Passport", submitted: "Apr 2, 2024", priority: "Low", idNumber: "SO-****-8834" },
];

export default function AdminVerification() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ID Verification</h1>
          <p className="text-muted-foreground">Review and verify partner identity documents</p>
        </div>
        <Badge variant="secondary" className="text-sm">{queue.length} pending</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">142</p><p className="text-xs text-muted-foreground">Verified</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-warning">4</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">2</p><p className="text-xs text-muted-foreground">Rejected</p></CardContent></Card>
      </div>

      <div className="space-y-4">
        {queue.map((item, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.type} · {item.idNumber}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Clock className="h-3 w-3" /> Submitted {item.submitted}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.priority === "High" ? "destructive" : item.priority === "Medium" ? "default" : "secondary"}>
                    {item.priority}
                  </Badge>
                  <Button variant="outline" size="sm"><Eye className="mr-1 h-3.5 w-3.5" /> Review</Button>
                  <Button size="sm" className="bg-primary"><CheckCircle className="mr-1 h-3.5 w-3.5" /> Approve</Button>
                  <Button variant="destructive" size="sm"><XCircle className="mr-1 h-3.5 w-3.5" /> Reject</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
