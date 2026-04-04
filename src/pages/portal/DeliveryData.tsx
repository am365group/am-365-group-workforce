import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Truck, Upload, RefreshCw, Download } from "lucide-react";

const deliveryData = [
  { partner: "Johan Andersson", date: "Apr 1", deliveries: 14, hours: 8, distance: "42 km", earnings: "1,440 SEK", source: "API" },
  { partner: "Erik Johansson", date: "Apr 1", deliveries: 11, hours: 6, distance: "35 km", earnings: "1,080 SEK", source: "API" },
  { partner: "Mohammed Al-Hassan", date: "Apr 1", deliveries: 16, hours: 9, distance: "51 km", earnings: "1,620 SEK", source: "Excel" },
  { partner: "Lars Eriksson", date: "Mar 31", deliveries: 9, hours: 5, distance: "28 km", earnings: "900 SEK", source: "API" },
  { partner: "Klara Nilsson", date: "Mar 31", deliveries: 12, hours: 7, distance: "38 km", earnings: "1,260 SEK", source: "API" },
];

export default function AdminDeliveryData() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delivery Data</h1>
          <p className="text-muted-foreground">Wolt EoR delivery data — API & Excel imports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import Excel</Button>
          <Button><RefreshCw className="mr-2 h-4 w-4" /> Sync API</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">1,842</p><p className="text-xs text-muted-foreground">Total Deliveries</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">423h</p><p className="text-xs text-muted-foreground">Total Hours</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">1,284 km</p><p className="text-xs text-muted-foreground">Total Distance</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">245K SEK</p><p className="text-xs text-muted-foreground">Total Earnings</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> Recent Data</CardTitle>
          <Button variant="outline" size="sm"><Download className="mr-1 h-3.5 w-3.5" /> Export</Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead><TableHead>Date</TableHead><TableHead>Deliveries</TableHead>
                <TableHead>Hours</TableHead><TableHead>Distance</TableHead><TableHead>Earnings</TableHead><TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryData.map((d, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{d.partner}</TableCell>
                  <TableCell>{d.date}</TableCell>
                  <TableCell>{d.deliveries}</TableCell>
                  <TableCell>{d.hours}h</TableCell>
                  <TableCell>{d.distance}</TableCell>
                  <TableCell className="font-semibold">{d.earnings}</TableCell>
                  <TableCell><Badge variant={d.source === "API" ? "default" : "secondary"}>{d.source}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
