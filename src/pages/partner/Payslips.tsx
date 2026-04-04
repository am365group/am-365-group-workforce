import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, Download, Eye, DollarSign, TrendingUp, Calendar } from "lucide-react";

const payslips = [
  { period: "March 2024", gross: "28,800 SEK", tax: "-7,200 SEK", pension: "-1,296 SEK", net: "20,304 SEK", date: "Mar 25, 2024", status: "Paid", hours: 160, deliveries: 284 },
  { period: "February 2024", gross: "25,200 SEK", tax: "-6,300 SEK", pension: "-1,134 SEK", net: "17,766 SEK", date: "Feb 25, 2024", status: "Paid", hours: 140, deliveries: 248 },
  { period: "January 2024", gross: "22,500 SEK", tax: "-5,625 SEK", pension: "-1,013 SEK", net: "15,862 SEK", date: "Jan 25, 2024", status: "Paid", hours: 125, deliveries: 221 },
  { period: "December 2023", gross: "19,800 SEK", tax: "-4,950 SEK", pension: "-891 SEK", net: "13,959 SEK", date: "Dec 25, 2023", status: "Paid", hours: 110, deliveries: 195 },
];

const yearlyStats = [
  { label: "YTD Gross", value: "76,500 SEK", icon: DollarSign },
  { label: "YTD Tax Paid", value: "19,125 SEK", icon: TrendingUp },
  { label: "YTD Net", value: "53,932 SEK", icon: DollarSign },
  { label: "Payslips Issued", value: "4", icon: Calendar },
];

export default function PartnerPayslips() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payslips</h1>
          <p className="text-base text-muted-foreground mt-1">Your salary statements and payment history</p>
        </div>
        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Download All (ZIP)</Button>
      </div>

      {/* YTD Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {yearlyStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5 text-center">
              <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payslip Cards */}
      <div className="space-y-4">
        {payslips.map((slip, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="h-13 w-13 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Receipt className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{slip.period}</p>
                    <p className="text-sm text-muted-foreground">Paid on {slip.date} · {slip.hours}h · {slip.deliveries} deliveries</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="hidden md:flex gap-8 text-sm">
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs mb-0.5">Gross</p>
                      <p className="font-semibold">{slip.gross}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs mb-0.5">Tax</p>
                      <p className="font-semibold text-destructive">{slip.tax}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs mb-0.5">Pension</p>
                      <p className="font-semibold text-muted-foreground">{slip.pension}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs mb-0.5">Net</p>
                      <p className="font-bold text-primary text-base">{slip.net}</p>
                    </div>
                  </div>
                  <Badge className="text-xs">{slip.status}</Badge>
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
