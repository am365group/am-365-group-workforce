import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Send, Download, Eye, CheckCircle, Clock, Users, Mail } from "lucide-react";

const payslips = [
  { partner: "Johan Andersson", id: "P-001", period: "March 2024", gross: "28,800 SEK", tax: "-7,200 SEK", pension: "-1,296 SEK", net: "20,304 SEK", generated: true, sent: true },
  { partner: "Erik Johansson", id: "P-002", period: "March 2024", gross: "25,200 SEK", tax: "-6,300 SEK", pension: "-1,134 SEK", net: "17,766 SEK", generated: true, sent: true },
  { partner: "Fatima Noor", id: "P-007", period: "March 2024", gross: "31,140 SEK", tax: "-7,785 SEK", pension: "-1,401 SEK", net: "21,954 SEK", generated: true, sent: false },
  { partner: "Mohammed Al-Hassan", id: "P-004", period: "March 2024", gross: "22,500 SEK", tax: "-5,625 SEK", pension: "-1,013 SEK", net: "15,862 SEK", generated: false, sent: false },
  { partner: "Lars Eriksson", id: "P-006", period: "March 2024", gross: "16,020 SEK", tax: "-4,005 SEK", pension: "-721 SEK", net: "11,294 SEK", generated: false, sent: false },
  { partner: "Klara Nilsson", id: "P-009", period: "March 2024", gross: "19,800 SEK", tax: "-4,950 SEK", pension: "-891 SEK", net: "13,959 SEK", generated: false, sent: false },
];

export default function AdminPayslips() {
  const generated = payslips.filter(p => p.generated).length;
  const sent = payslips.filter(p => p.sent).length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payslip Generation</h1>
          <p className="text-base text-muted-foreground mt-1">Generate, review, and distribute partner payslips</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg"><Download className="mr-2 h-4 w-4" /> Export All</Button>
          <Button variant="outline" size="lg"><Mail className="mr-2 h-4 w-4" /> Send All</Button>
          <Button size="lg"><Receipt className="mr-2 h-4 w-4" /> Generate All</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-5 md:grid-cols-4">
        <Card><CardContent className="p-5 text-center"><Users className="h-5 w-5 text-primary mx-auto mb-2" /><p className="text-3xl font-bold">{payslips.length}</p><p className="text-sm text-muted-foreground mt-1">Total Partners</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><CheckCircle className="h-5 w-5 text-primary mx-auto mb-2" /><p className="text-3xl font-bold text-primary">{generated}</p><p className="text-sm text-muted-foreground mt-1">Generated</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><Send className="h-5 w-5 text-info mx-auto mb-2" /><p className="text-3xl font-bold text-info">{sent}</p><p className="text-sm text-muted-foreground mt-1">Sent to Partner</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><Clock className="h-5 w-5 text-warning mx-auto mb-2" /><p className="text-3xl font-bold text-warning">{payslips.length - generated}</p><p className="text-sm text-muted-foreground mt-1">Pending</p></CardContent></Card>
      </div>

      {/* Payslip List */}
      <div className="space-y-4">
        {payslips.map((p, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                  {p.partner.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold text-lg">{p.partner}</p>
                  <p className="text-sm text-muted-foreground">{p.id} · {p.period}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="hidden md:flex gap-8">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-0.5">Gross</p>
                    <p className="font-medium">{p.gross}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-0.5">Tax</p>
                    <p className="font-medium text-destructive">{p.tax}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-0.5">Pension</p>
                    <p className="font-medium">{p.pension}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-0.5">Net</p>
                    <p className="font-bold text-primary text-base">{p.net}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.generated && p.sent && <Badge className="flex items-center gap-1"><Send className="h-3 w-3" /> Sent</Badge>}
                  {p.generated && !p.sent && <Badge variant="secondary" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Ready</Badge>}
                  {!p.generated && <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>}
                </div>
                <div className="flex gap-1">
                  {p.generated ? (
                    <>
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      {!p.sent && <Button variant="ghost" size="icon"><Send className="h-4 w-4" /></Button>}
                      <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                    </>
                  ) : (
                    <Button size="sm"><Receipt className="mr-1.5 h-3.5 w-3.5" /> Generate</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
