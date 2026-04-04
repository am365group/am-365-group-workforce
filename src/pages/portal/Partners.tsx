import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, UserPlus, MoreHorizontal, Users } from "lucide-react";

const partners = [
  { id: "P-001", name: "Johan Andersson", email: "johan@email.com", city: "Stockholm", status: "Active", deliveries: 284, earnings: "42,300 SEK" },
  { id: "P-002", name: "Erik Johansson", email: "erik@email.com", city: "Stockholm", status: "Active", deliveries: 198, earnings: "35,640 SEK" },
  { id: "P-003", name: "Anna Lindström", email: "anna@email.com", city: "Gothenburg", status: "Pending", deliveries: 0, earnings: "0 SEK" },
  { id: "P-004", name: "Mohammed Al-Hassan", email: "mohammed@email.com", city: "Malmö", status: "Active", deliveries: 156, earnings: "28,080 SEK" },
  { id: "P-005", name: "Sofia Bergqvist", email: "sofia@email.com", city: "Stockholm", status: "In Review", deliveries: 0, earnings: "0 SEK" },
  { id: "P-006", name: "Lars Eriksson", email: "lars@email.com", city: "Uppsala", status: "Inactive", deliveries: 89, earnings: "16,020 SEK" },
];

export default function AdminPartners() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partner Management</h1>
          <p className="text-muted-foreground">Manage all registered delivery partners</p>
        </div>
        <Button><UserPlus className="mr-2 h-4 w-4" /> Add Partner</Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search partners..." className="pl-9" />
        </div>
        <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead><TableHead>Partner</TableHead><TableHead>City</TableHead>
                <TableHead>Status</TableHead><TableHead>Deliveries</TableHead><TableHead>Earnings</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell>
                    <div><p className="font-medium text-sm">{p.name}</p><p className="text-xs text-muted-foreground">{p.email}</p></div>
                  </TableCell>
                  <TableCell>{p.city}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "Active" ? "default" : p.status === "Inactive" ? "destructive" : "secondary"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{p.deliveries}</TableCell>
                  <TableCell className="font-semibold">{p.earnings}</TableCell>
                  <TableCell><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
