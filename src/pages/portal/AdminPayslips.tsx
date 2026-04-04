import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Send, Download, Eye } from "lucide-react";

const payslips = [
  { partner: "Johan Andersson", period: "March 2024", gross: "28,800 SEK", net: "21,600 SEK", generated: true },
  { partner: "Erik Johansson", period: "March 2024", gross: "25,200 SEK", net: "18,900 SEK", generated: true },
  { partner: "Mohammed Al-Hassan", period: "March 2024", gross: "22,500 SEK", net: "16,875 SEK", generated: false },
  { partner: "Lars Eriksson", period: "March 2024", gross: "16,020 SEK", net: "12,015 SEK", generated: false },
];

export default function AdminPayslips() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payslip Generation</h1>
          <p className="text-muted-foreground">Generate and distribute partner payslips</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export All</Button>
          <Button><Receipt className="mr-2 h-4 w-4" /> Generate All</Button>
        </div>
      </div>

      <div className="space-y-3">
        {payslips.map((p, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {p.partner.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="font-medium text-sm">{p.partner}</p>
                  <p className="text-xs text-muted-foreground">{p.period}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-sm"><span className="text-muted-foreground">Gross: </span><span className="font-medium">{p.gross}</span></div>
                <div className="text-sm"><span className="text-muted-foreground">Net: </span><span className="font-bold text-primary">{p.net}</span></div>
                <Badge variant={p.generated ? "default" : "secondary"}>{p.generated ? "Generated" : "Pending"}</Badge>
                <div className="flex gap-1">
                  {p.generated ? (
                    <>
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><Send className="h-4 w-4" /></Button>
                    </>
                  ) : (
                    <Button size="sm"><Receipt className="mr-1 h-3.5 w-3.5" /> Generate</Button>
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
