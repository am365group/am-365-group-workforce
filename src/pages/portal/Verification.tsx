import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CheckCircle, XCircle, Eye, Clock, AlertTriangle, FileText, User, Camera } from "lucide-react";

const queue = [
  { name: "Anna Lindström", type: "Passport (Swedish)", submitted: "Mar 30, 2024", priority: "High", idNumber: "SE-****-4521", city: "Gothenburg", age: "28", selfie: true, docFront: true, docBack: true },
  { name: "Sofia Bergqvist", type: "National ID Card", submitted: "Apr 1, 2024", priority: "Medium", idNumber: "SE-****-7893", city: "Stockholm", age: "32", selfie: true, docFront: true, docBack: false },
  { name: "Carlos Garcia", type: "Residence Permit (UT-kort)", submitted: "Apr 2, 2024", priority: "High", idNumber: "RP-****-1245", city: "Uppsala", age: "26", selfie: true, docFront: true, docBack: true },
  { name: "Fatima Noor", type: "Passport (Somali)", submitted: "Apr 2, 2024", priority: "Low", idNumber: "SO-****-8834", city: "Stockholm", age: "24", selfie: false, docFront: true, docBack: false },
  { name: "Ahmed Hassan", type: "Passport (Iraqi)", submitted: "Apr 3, 2024", priority: "Medium", idNumber: "IQ-****-2291", city: "Malmö", age: "30", selfie: true, docFront: true, docBack: true },
];

const recentDecisions = [
  { name: "Erik Johansson", decision: "Approved", date: "Mar 28, 2024", reviewer: "Verifier — Peter N." },
  { name: "Klara Nilsson", decision: "Approved", date: "Mar 27, 2024", reviewer: "Verifier — Peter N." },
  { name: "James Smith", decision: "Rejected", date: "Mar 26, 2024", reviewer: "Verifier — Peter N.", reason: "Document expired" },
  { name: "Maria Santos", decision: "Approved", date: "Mar 25, 2024", reviewer: "Admin" },
];

export default function AdminVerification() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ID Verification</h1>
          <p className="text-base text-muted-foreground mt-1">Review and verify partner identity documents for compliance</p>
        </div>
        <Badge variant="secondary" className="text-sm px-4 py-1.5">{queue.length} pending review</Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-5 md:grid-cols-4">
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-primary">142</p><p className="text-sm text-muted-foreground mt-1">Verified Partners</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-warning">5</p><p className="text-sm text-muted-foreground mt-1">Pending Review</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-destructive">3</p><p className="text-sm text-muted-foreground mt-1">Rejected (MTD)</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-info">4.2h</p><p className="text-sm text-muted-foreground mt-1">Avg Review Time</p></CardContent></Card>
      </div>

      {/* Verification Queue */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Verification Queue</h2>
        {queue.map((item, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-5">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-lg font-semibold">{item.name}</p>
                      <Badge variant={item.priority === "High" ? "destructive" : item.priority === "Medium" ? "default" : "secondary"}>
                        {item.priority} Priority
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{item.type} · {item.idNumber}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.city} · Age: {item.age} · Submitted {item.submitted}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs flex items-center gap-1">
                        <Camera className={`h-3.5 w-3.5 ${item.selfie ? "text-primary" : "text-destructive"}`} />
                        Selfie {item.selfie ? "✓" : "✗"}
                      </span>
                      <span className="text-xs flex items-center gap-1">
                        <FileText className={`h-3.5 w-3.5 ${item.docFront ? "text-primary" : "text-destructive"}`} />
                        Doc Front {item.docFront ? "✓" : "✗"}
                      </span>
                      <span className="text-xs flex items-center gap-1">
                        <FileText className={`h-3.5 w-3.5 ${item.docBack ? "text-primary" : "text-destructive"}`} />
                        Doc Back {item.docBack ? "✓" : "—"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm"><Eye className="mr-1.5 h-3.5 w-3.5" /> Review</Button>
                  <Button size="sm" className="bg-primary"><CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Approve</Button>
                  <Button variant="destructive" size="sm"><XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Decisions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Recent Decisions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentDecisions.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${d.decision === "Approved" ? "bg-primary/10" : "bg-destructive/10"}`}>
                    {d.decision === "Approved" ? <CheckCircle className="h-5 w-5 text-primary" /> : <XCircle className="h-5 w-5 text-destructive" />}
                  </div>
                  <div>
                    <p className="font-medium">{d.name}</p>
                    <p className="text-sm text-muted-foreground">{d.reviewer} · {d.date}</p>
                    {d.reason && <p className="text-xs text-destructive mt-0.5">Reason: {d.reason}</p>}
                  </div>
                </div>
                <Badge variant={d.decision === "Approved" ? "default" : "destructive"}>{d.decision}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
