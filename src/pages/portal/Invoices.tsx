import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Send, Download, Eye, DollarSign, Building2, Calendar, CheckCircle } from "lucide-react";

const invoices = [
  { id: "INV-2024-043", customer: "Wolt AB", period: "April 2024", amount: "1,920,000 SEK", vat: "480,000 SEK", total: "2,400,000 SEK", status: "Draft", due: "May 15", partners: 142 },
  { id: "INV-2024-042", customer: "Wolt AB", period: "March 2024", amount: "1,845,000 SEK", vat: "461,250 SEK", total: "2,306,250 SEK", status: "Paid", due: "Apr 15", partners: 142 },
  { id: "INV-2024-041", customer: "Foodora AB", period: "March 2024", amount: "612,000 SEK", vat: "153,000 SEK", total: "765,000 SEK", status: "Sent", due: "Apr 20", partners: 68 },
  { id: "INV-2024-040", customer: "Wolt AB", period: "February 2024", amount: "1,712,000 SEK", vat: "428,000 SEK", total: "2,140,000 SEK", status: "Paid", due: "Mar 15", partners: 138 },
  { id: "INV-2024-039", customer: "Foodora AB", period: "February 2024", amount: "585,000 SEK", vat: "146,250 SEK", total: "731,250 SEK", status: "Paid", due: "Mar 20", partners: 65 },
];

const invoiceStats = [
  { label: "Total Invoiced (YTD)", value: "8.34M SEK", icon: DollarSign },
  { label: "Outstanding", value: "765K SEK", icon: FileText },
  { label: "Paid (YTD)", value: "7.58M SEK", icon: CheckCircle },
  { label: "Average Per Invoice", value: "1.67M SEK", icon: Calendar },
];

export default function AdminInvoices() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoice Management</h1>
          <p className="text-base text-muted-foreground mt-1">Create and manage customer invoices for Wolt, Foodora, and other platforms</p>
        </div>
        <Button size="lg"><Plus className="mr-2 h-4 w-4" /> Create Invoice</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-5 md:grid-cols-4">
        {invoiceStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5 text-center">
              <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invoice Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">All Invoices</CardTitle>
          <Button variant="outline" size="sm"><Download className="mr-1.5 h-3.5 w-3.5" /> Export</Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-sm">Invoice</TableHead>
                <TableHead className="text-sm">Customer</TableHead>
                <TableHead className="text-sm">Period</TableHead>
                <TableHead className="text-sm">Partners</TableHead>
                <TableHead className="text-sm">Amount (ex. VAT)</TableHead>
                <TableHead className="text-sm">VAT (25%)</TableHead>
                <TableHead className="text-sm">Total</TableHead>
                <TableHead className="text-sm">Due</TableHead>
                <TableHead className="text-sm">Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">{inv.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="font-medium">{inv.customer}</span>
                    </div>
                  </TableCell>
                  <TableCell>{inv.period}</TableCell>
                  <TableCell>{inv.partners}</TableCell>
                  <TableCell>{inv.amount}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.vat}</TableCell>
                  <TableCell className="font-semibold">{inv.total}</TableCell>
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
