import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Send, Download, Eye } from "lucide-react";

const invoices = [
  { id: "INV-2024-042", customer: "Wolt AB", period: "March 2024", amount: "1,845,000 SEK", status: "Paid", due: "Apr 15" },
  { id: "INV-2024-041", customer: "Foodora AB", period: "March 2024", amount: "612,000 SEK", status: "Sent", due: "Apr 20" },
  { id: "INV-2024-040", customer: "Wolt AB", period: "February 2024", amount: "1,712,000 SEK", status: "Paid", due: "Mar 15" },
  { id: "INV-2024-039", customer: "Foodora AB", period: "February 2024", amount: "585,000 SEK", status: "Paid", due: "Mar 20" },
  { id: "INV-2024-043", customer: "Wolt AB", period: "April 2024", amount: "1,920,000 SEK", status: "Draft", due: "May 15" },
];

export default function AdminInvoices() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoice Management</h1>
          <p className="text-muted-foreground">Create and manage customer invoices</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" /> Create Invoice</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead><TableHead>Customer</TableHead><TableHead>Period</TableHead>
                <TableHead>Amount</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm">{inv.id}</TableCell>
                  <TableCell className="font-medium">{inv.customer}</TableCell>
                  <TableCell>{inv.period}</TableCell>
                  <TableCell className="font-semibold">{inv.amount}</TableCell>
                  <TableCell>{inv.due}</TableCell>
                  <TableCell>
                    <Badge variant={inv.status === "Paid" ? "default" : inv.status === "Sent" ? "secondary" : "outline"}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      {inv.status === "Draft" && <Button variant="ghost" size="icon"><Send className="h-4 w-4" /></Button>}
                      <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                    </div>
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
