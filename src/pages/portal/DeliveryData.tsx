import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Truck, Upload, RefreshCw, Download, AlertCircle, CheckCircle, Clock, Building2, BarChart3 } from "lucide-react";

const deliveryData = [
  { partner: "Johan Andersson", partnerId: "P-001", date: "Apr 1", deliveries: 14, hours: 8, distance: "42 km", earnings: "1,440 SEK", source: "API", platform: "Wolt" },
  { partner: "Erik Johansson", partnerId: "P-002", date: "Apr 1", deliveries: 11, hours: 6, distance: "35 km", earnings: "1,080 SEK", source: "API", platform: "Wolt" },
  { partner: "Fatima Noor", partnerId: "P-007", date: "Apr 1", deliveries: 18, hours: 9.5, distance: "56 km", earnings: "1,710 SEK", source: "API", platform: "Wolt" },
  { partner: "Mohammed Al-Hassan", partnerId: "P-004", date: "Apr 1", deliveries: 16, hours: 9, distance: "51 km", earnings: "1,620 SEK", source: "Excel", platform: "Wolt" },
  { partner: "Lars Eriksson", partnerId: "P-006", date: "Mar 31", deliveries: 9, hours: 5, distance: "28 km", earnings: "900 SEK", source: "API", platform: "Foodora" },
  { partner: "Klara Nilsson", partnerId: "P-009", date: "Mar 31", deliveries: 12, hours: 7, distance: "38 km", earnings: "1,260 SEK", source: "API", platform: "Wolt" },
  { partner: "Anders Svensson", partnerId: "P-010", date: "Mar 31", deliveries: 15, hours: 8, distance: "45 km", earnings: "1,440 SEK", source: "API", platform: "Foodora" },
];

const syncHistory = [
  { time: "14:32", type: "API Sync", platform: "Wolt", records: 142, status: "Success" },
  { time: "14:15", type: "API Sync", platform: "Foodora", records: 68, status: "Success" },
  { time: "12:00", type: "Excel Import", platform: "Wolt", records: 24, status: "Success" },
  { time: "09:00", type: "API Sync", platform: "Wolt", records: 138, status: "Partial — 3 errors" },
];

export default function AdminDeliveryData() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Delivery Data</h1>
          <p className="text-base text-muted-foreground mt-1">EoR delivery data from Wolt & Foodora — API & Excel imports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg"><Upload className="mr-2 h-4 w-4" /> Import Excel</Button>
          <Button size="lg"><RefreshCw className="mr-2 h-4 w-4" /> Sync All APIs</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-5 md:grid-cols-4">
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold">1,842</p><p className="text-sm text-muted-foreground mt-1">Total Deliveries (MTD)</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold">423h</p><p className="text-sm text-muted-foreground mt-1">Total Hours (MTD)</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold">1,284 km</p><p className="text-sm text-muted-foreground mt-1">Total Distance (MTD)</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-primary">2.45M SEK</p><p className="text-sm text-muted-foreground mt-1">Total Earnings (MTD)</p></CardContent></Card>
      </div>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><RefreshCw className="h-5 w-5 text-primary" /> Recent Sync Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {syncHistory.map((sync, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${sync.status === "Success" ? "bg-primary/10" : "bg-warning/10"}`}>
                    {sync.status === "Success" ? <CheckCircle className="h-5 w-5 text-primary" /> : <AlertCircle className="h-5 w-5 text-warning" />}
                  </div>
                  <div>
                    <p className="font-medium">{sync.type} — {sync.platform}</p>
                    <p className="text-sm text-muted-foreground">{sync.records} records · Today at {sync.time}</p>
                  </div>
                </div>
                <Badge variant={sync.status === "Success" ? "default" : "secondary"}>{sync.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> Delivery Records</CardTitle>
          <Button variant="outline" size="sm"><Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV</Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-sm">Partner</TableHead>
                <TableHead className="text-sm">Platform</TableHead>
                <TableHead className="text-sm">Date</TableHead>
                <TableHead className="text-sm">Deliveries</TableHead>
                <TableHead className="text-sm">Hours</TableHead>
                <TableHead className="text-sm">Distance</TableHead>
                <TableHead className="text-sm">Earnings</TableHead>
                <TableHead className="text-sm">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryData.map((d, i) => (
                <TableRow key={i} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{d.partner}</p>
                      <p className="text-xs text-muted-foreground">{d.partnerId}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{d.platform}</Badge></TableCell>
                  <TableCell>{d.date}</TableCell>
                  <TableCell className="font-medium">{d.deliveries}</TableCell>
                  <TableCell>{d.hours}h</TableCell>
                  <TableCell>{d.distance}</TableCell>
                  <TableCell className="font-semibold">{d.earnings}</TableCell>
                  <TableCell><Badge variant={d.source === "API" ? "default" : "secondary"} className="text-xs">{d.source}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
