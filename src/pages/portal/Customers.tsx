import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Plus, Settings, Wifi, WifiOff, MoreHorizontal } from "lucide-react";

const customers = [
  { name: "Wolt", type: "Delivery Platform", partners: 142, apiStatus: "Connected", integration: "API + Excel", region: "Stockholm, Gothenburg" },
  { name: "Foodora", type: "Delivery Platform", partners: 68, apiStatus: "Connected", integration: "API", region: "Stockholm" },
  { name: "Uber Eats", type: "Delivery Platform", partners: 0, apiStatus: "Not Connected", integration: "Pending", region: "—" },
  { name: "Bolt Food", type: "Delivery Platform", partners: 0, apiStatus: "Not Connected", integration: "Pending", region: "—" },
];

export default function AdminCustomers() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">Manage delivery platform customers and integrations</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" /> Add Customer</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead><TableHead>Type</TableHead><TableHead>Partners</TableHead>
                <TableHead>API Status</TableHead><TableHead>Integration</TableHead><TableHead>Region</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{c.type}</TableCell>
                  <TableCell>{c.partners}</TableCell>
                  <TableCell>
                    <Badge variant={c.apiStatus === "Connected" ? "default" : "secondary"} className="flex items-center gap-1 w-fit">
                      {c.apiStatus === "Connected" ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                      {c.apiStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{c.integration}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.region}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button>
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
