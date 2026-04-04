import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Play, Download, CheckCircle } from "lucide-react";

const payrollRuns = [
  { period: "April 2024", status: "Draft", partners: 247, gross: "2,845,000 SEK", tax: "711,250 SEK", net: "2,133,750 SEK" },
  { period: "March 2024", status: "Completed", partners: 241, gross: "2,712,000 SEK", tax: "678,000 SEK", net: "2,034,000 SEK" },
  { period: "February 2024", status: "Completed", partners: 235, gross: "2,585,000 SEK", tax: "646,250 SEK", net: "1,938,750 SEK" },
];

export default function AdminPayroll() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground">Process and manage partner payroll</p>
        </div>
        <Button><Play className="mr-2 h-4 w-4" /> Run Payroll</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">2.85M SEK</p><p className="text-xs text-muted-foreground">Gross This Month</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">711K SEK</p><p className="text-xs text-muted-foreground">Tax Withholding</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">2.13M SEK</p><p className="text-xs text-muted-foreground">Net Payout</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Payroll Runs</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead><TableHead>Status</TableHead><TableHead>Partners</TableHead>
                <TableHead>Gross</TableHead><TableHead>Tax</TableHead><TableHead>Net</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollRuns.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.period}</TableCell>
                  <TableCell><Badge variant={r.status === "Completed" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                  <TableCell>{r.partners}</TableCell>
                  <TableCell>{r.gross}</TableCell>
                  <TableCell className="text-destructive">{r.tax}</TableCell>
                  <TableCell className="font-semibold text-primary">{r.net}</TableCell>
                  <TableCell>
                    {r.status === "Draft" ? (
                      <Button size="sm"><CheckCircle className="mr-1 h-3.5 w-3.5" /> Process</Button>
                    ) : (
                      <Button variant="outline" size="sm"><Download className="mr-1 h-3.5 w-3.5" /> Export</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
