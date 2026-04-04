import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, Download, Eye } from "lucide-react";

const payslips = [
  { period: "March 2024", gross: "28,800 SEK", tax: "-7,200 SEK", net: "21,600 SEK", date: "Mar 25, 2024", status: "Paid" },
  { period: "February 2024", gross: "25,200 SEK", tax: "-6,300 SEK", net: "18,900 SEK", date: "Feb 25, 2024", status: "Paid" },
  { period: "January 2024", gross: "22,500 SEK", tax: "-5,625 SEK", net: "16,875 SEK", date: "Jan 25, 2024", status: "Paid" },
];

export default function PartnerPayslips() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Payslips</h1>
        <p className="text-muted-foreground">Your salary statements</p>
      </div>
      <div className="space-y-4">
        {payslips.map((slip, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{slip.period}</p>
                    <p className="text-xs text-muted-foreground">Paid on {slip.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden md:flex gap-6 text-sm">
                    <div><p className="text-muted-foreground text-xs">Gross</p><p className="font-medium">{slip.gross}</p></div>
                    <div><p className="text-muted-foreground text-xs">Tax</p><p className="font-medium text-destructive">{slip.tax}</p></div>
                    <div><p className="text-muted-foreground text-xs">Net</p><p className="font-bold text-primary">{slip.net}</p></div>
                  </div>
                  <Badge>{slip.status}</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
