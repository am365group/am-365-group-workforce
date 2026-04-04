import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, TrendingUp, Truck, DollarSign, Download, Filter, Calendar } from "lucide-react";

const history = [
  { date: "Apr 1, 2024", client: "Wolt", area: "Södermalm", hours: 8, deliveries: 14, distance: "42 km", amount: "1,440 SEK", status: "Approved" },
  { date: "Mar 31, 2024", client: "Wolt", area: "Vasastan", hours: 6, deliveries: 11, distance: "35 km", amount: "1,080 SEK", status: "Approved" },
  { date: "Mar 30, 2024", client: "Wolt", area: "Kungsholmen", hours: 7, deliveries: 12, distance: "38 km", amount: "1,260 SEK", status: "Approved" },
  { date: "Mar 29, 2024", client: "Foodora", area: "Östermalm", hours: 5, deliveries: 9, distance: "28 km", amount: "900 SEK", status: "Pending" },
  { date: "Mar 28, 2024", client: "Wolt", area: "Södermalm", hours: 8, deliveries: 15, distance: "48 km", amount: "1,440 SEK", status: "Approved" },
  { date: "Mar 27, 2024", client: "Foodora", area: "Vasastan", hours: 6, deliveries: 10, distance: "32 km", amount: "1,080 SEK", status: "Approved" },
  { date: "Mar 26, 2024", client: "Wolt", area: "City Center", hours: 8, deliveries: 16, distance: "52 km", amount: "1,440 SEK", status: "Approved" },
  { date: "Mar 25, 2024", client: "Wolt", area: "Kungsholmen", hours: 7, deliveries: 13, distance: "40 km", amount: "1,260 SEK", status: "Approved" },
];

const monthlyStats = [
  { label: "Total Deliveries", value: "284", icon: Truck, color: "text-primary" },
  { label: "Hours Worked", value: "142h", icon: Clock, color: "text-info" },
  { label: "Total Distance", value: "892 km", icon: TrendingUp, color: "text-warning" },
  { label: "Total Earned", value: "25,560 SEK", icon: DollarSign, color: "text-primary" },
];

export default function PartnerWorkHistory() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Work History</h1>
          <p className="text-base text-muted-foreground mt-1">Your completed assignments, deliveries, and earnings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {monthlyStats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <Badge variant="outline" className="text-xs">This Month</Badge>
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Activity Log</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" /> March – April 2024
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-sm">Date</TableHead>
                <TableHead className="text-sm">Client</TableHead>
                <TableHead className="text-sm">Area</TableHead>
                <TableHead className="text-sm">Hours</TableHead>
                <TableHead className="text-sm">Deliveries</TableHead>
                <TableHead className="text-sm">Distance</TableHead>
                <TableHead className="text-sm">Amount</TableHead>
                <TableHead className="text-sm">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((row, i) => (
                <TableRow key={i} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{row.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{row.client}</Badge>
                  </TableCell>
                  <TableCell>{row.area}</TableCell>
                  <TableCell>{row.hours}h</TableCell>
                  <TableCell>{row.deliveries}</TableCell>
                  <TableCell>{row.distance}</TableCell>
                  <TableCell className="font-semibold">{row.amount}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === "Approved" ? "default" : "secondary"}>{row.status}</Badge>
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
