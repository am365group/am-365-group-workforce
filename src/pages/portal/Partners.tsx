import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, UserPlus, MoreHorizontal, Users, Eye, Mail, MapPin, Car } from "lucide-react";

const partners = [
  { id: "P-001", name: "Johan Andersson", email: "johan@email.com", phone: "+46 70 123 4567", city: "Stockholm", area: "Södermalm", vehicle: "E-Moped", status: "Active", platform: "Wolt", deliveries: 284, hours: 142, earnings: "25,560 SEK" },
  { id: "P-002", name: "Erik Johansson", email: "erik@email.com", phone: "+46 73 456 7890", city: "Stockholm", area: "Vasastan", vehicle: "Bicycle", status: "Active", platform: "Wolt", deliveries: 198, hours: 110, earnings: "19,800 SEK" },
  { id: "P-003", name: "Anna Lindström", email: "anna@email.com", phone: "+46 76 789 0123", city: "Gothenburg", area: "Centrum", vehicle: "Car", status: "Pending", platform: "Foodora", deliveries: 0, hours: 0, earnings: "0 SEK" },
  { id: "P-004", name: "Mohammed Al-Hassan", email: "mohammed@email.com", phone: "+46 70 234 5678", city: "Malmö", area: "Möllevången", vehicle: "Moped", status: "Active", platform: "Wolt", deliveries: 156, hours: 87, earnings: "15,660 SEK" },
  { id: "P-005", name: "Sofia Bergqvist", email: "sofia@email.com", phone: "+46 72 345 6789", city: "Stockholm", area: "Östermalm", vehicle: "E-bike", status: "In Review", platform: "Foodora", deliveries: 0, hours: 0, earnings: "0 SEK" },
  { id: "P-006", name: "Lars Eriksson", email: "lars@email.com", phone: "+46 70 567 8901", city: "Uppsala", area: "Centrum", vehicle: "Bicycle", status: "Inactive", platform: "Wolt", deliveries: 89, hours: 49, earnings: "8,820 SEK" },
  { id: "P-007", name: "Fatima Noor", email: "fatima@email.com", phone: "+46 73 678 9012", city: "Stockholm", area: "Kungsholmen", vehicle: "E-Moped", status: "Active", platform: "Wolt", deliveries: 312, hours: 173, earnings: "31,140 SEK" },
  { id: "P-008", name: "Carlos Garcia", email: "carlos@email.com", phone: "+46 76 012 3456", city: "Gothenburg", area: "Hisingen", vehicle: "Car", status: "Pending", platform: "Foodora", deliveries: 0, hours: 0, earnings: "0 SEK" },
];

const statusStats = [
  { label: "Active", count: 210, color: "text-primary" },
  { label: "Pending", count: 8, color: "text-warning" },
  { label: "In Review", count: 5, color: "text-info" },
  { label: "Inactive", count: 24, color: "text-destructive" },
];

export default function AdminPartners() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Partner Management</h1>
          <p className="text-base text-muted-foreground mt-1">Manage all registered delivery partners across platforms</p>
        </div>
        <Button size="lg"><UserPlus className="mr-2 h-4 w-4" /> Add Partner</Button>
      </div>

      {/* Status Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.count}</p>
              </div>
              <Users className={`h-8 w-8 ${stat.color} opacity-20`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search/Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, city, or partner ID..." className="pl-9 h-11" />
        </div>
        <Button variant="outline" className="h-11"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
      </div>

      {/* Partners Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-sm">ID</TableHead>
                <TableHead className="text-sm">Partner</TableHead>
                <TableHead className="text-sm">Location</TableHead>
                <TableHead className="text-sm">Platform</TableHead>
                <TableHead className="text-sm">Vehicle</TableHead>
                <TableHead className="text-sm">Status</TableHead>
                <TableHead className="text-sm">Deliveries</TableHead>
                <TableHead className="text-sm">Earnings (MTD)</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">{p.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {p.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{p.city}</p>
                      <p className="text-xs text-muted-foreground">{p.area}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{p.platform}</Badge></TableCell>
                  <TableCell className="text-sm">{p.vehicle}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "Active" ? "default" : p.status === "Inactive" ? "destructive" : "secondary"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{p.deliveries}</TableCell>
                  <TableCell className="font-semibold">{p.earnings}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
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
