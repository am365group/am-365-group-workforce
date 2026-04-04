import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock } from "lucide-react";

const history = [
  { date: "Apr 1, 2024", client: "Wolt", area: "Södermalm", hours: 8, deliveries: 14, amount: "1,440 SEK", status: "Approved" },
  { date: "Mar 31, 2024", client: "Wolt", area: "Vasastan", hours: 6, deliveries: 11, amount: "1,080 SEK", status: "Approved" },
  { date: "Mar 30, 2024", client: "Wolt", area: "Kungsholmen", hours: 7, deliveries: 12, amount: "1,260 SEK", status: "Approved" },
  { date: "Mar 29, 2024", client: "Wolt", area: "Östermalm", hours: 5, deliveries: 9, amount: "900 SEK", status: "Pending" },
  { date: "Mar 28, 2024", client: "Wolt", area: "Södermalm", hours: 8, deliveries: 15, amount: "1,440 SEK", status: "Approved" },
  { date: "Mar 27, 2024", client: "Foodora", area: "Vasastan", hours: 6, deliveries: 10, amount: "1,080 SEK", status: "Approved" },
];

export default function PartnerWorkHistory() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Work History</h1>
        <p className="text-muted-foreground">Your completed assignments and deliveries</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">284</p><p className="text-xs text-muted-foreground">Total Deliveries</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">142h</p><p className="text-xs text-muted-foreground">Hours This Month</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">25,560 SEK</p><p className="text-xs text-muted-foreground">Earned This Month</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead><TableHead>Client</TableHead><TableHead>Area</TableHead>
                <TableHead>Hours</TableHead><TableHead>Deliveries</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{row.date}</TableCell>
                  <TableCell>{row.client}</TableCell>
                  <TableCell>{row.area}</TableCell>
                  <TableCell>{row.hours}h</TableCell>
                  <TableCell>{row.deliveries}</TableCell>
                  <TableCell className="font-semibold">{row.amount}</TableCell>
                  <TableCell><Badge variant={row.status === "Approved" ? "default" : "secondary"}>{row.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
