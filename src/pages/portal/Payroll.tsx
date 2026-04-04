import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Play, Download, CheckCircle, Calendar, Users, AlertCircle, Clock } from "lucide-react";

const payrollRuns = [
  { period: "April 2024", status: "Draft", partners: 247, gross: "2,845,000 SEK", tax: "711,250 SEK", pension: "128,025 SEK", net: "2,005,725 SEK", deadline: "Apr 20" },
  { period: "March 2024", status: "Completed", partners: 241, gross: "2,712,000 SEK", tax: "678,000 SEK", pension: "122,040 SEK", net: "1,911,960 SEK", deadline: "Mar 20" },
  { period: "February 2024", status: "Completed", partners: 235, gross: "2,585,000 SEK", tax: "646,250 SEK", pension: "116,325 SEK", net: "1,822,425 SEK", deadline: "Feb 20" },
  { period: "January 2024", status: "Completed", partners: 228, gross: "2,394,000 SEK", tax: "598,500 SEK", pension: "107,730 SEK", net: "1,687,770 SEK", deadline: "Jan 20" },
];

const payrollBreakdown = [
  { category: "Base Salary (180 SEK/h)", amount: "2,520,000 SEK", percentage: 88.6 },
  { category: "Overtime (1.5x)", amount: "198,000 SEK", percentage: 7.0 },
  { category: "Holiday Supplements (2x)", amount: "72,000 SEK", percentage: 2.5 },
  { category: "Bonuses & Adjustments", amount: "55,000 SEK", percentage: 1.9 },
];

export default function AdminPayroll() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-base text-muted-foreground mt-1">Process and manage monthly partner payroll</p>
        </div>
        <Button size="lg"><Play className="mr-2 h-4 w-4" /> Run April Payroll</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-5 md:grid-cols-4">
        <Card className="border-primary/20">
          <CardContent className="p-5 text-center">
            <DollarSign className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-3xl font-bold">2.85M SEK</p>
            <p className="text-sm text-muted-foreground mt-1">Gross This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-destructive">711K SEK</p>
            <p className="text-sm text-muted-foreground mt-1">Tax Withholding</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-muted-foreground">128K SEK</p>
            <p className="text-sm text-muted-foreground mt-1">Pension (4.5%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-primary">2.01M SEK</p>
            <p className="text-sm text-muted-foreground mt-1">Net Payout</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Month Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">April 2024 — Salary Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payrollBreakdown.map((item) => (
              <div key={item.category} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium">{item.category}</span>
                    <span className="font-semibold">{item.amount}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/70 rounded-full" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payroll Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Payroll History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-sm">Period</TableHead>
                <TableHead className="text-sm">Status</TableHead>
                <TableHead className="text-sm">Partners</TableHead>
                <TableHead className="text-sm">Gross</TableHead>
                <TableHead className="text-sm">Tax</TableHead>
                <TableHead className="text-sm">Pension</TableHead>
                <TableHead className="text-sm">Net</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollRuns.map((r, i) => (
                <TableRow key={i} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{r.period}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "Completed" ? "default" : "secondary"} className="flex items-center gap-1 w-fit">
                      {r.status === "Completed" ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.partners}</TableCell>
                  <TableCell>{r.gross}</TableCell>
                  <TableCell className="text-destructive">{r.tax}</TableCell>
                  <TableCell>{r.pension}</TableCell>
                  <TableCell className="font-semibold text-primary">{r.net}</TableCell>
                  <TableCell>
                    {r.status === "Draft" ? (
                      <Button size="sm"><CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Process</Button>
                    ) : (
                      <Button variant="outline" size="sm"><Download className="mr-1.5 h-3.5 w-3.5" /> Export</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Important Note */}
      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="p-5 flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Payroll Deadline Reminder</p>
            <p className="text-sm text-muted-foreground mt-1">
              April payroll must be processed by April 20 to ensure on-time payout on April 25. Tax reporting to Skatteverket is due by the 12th of the following month.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
