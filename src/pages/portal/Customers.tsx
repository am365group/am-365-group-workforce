import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Plus, Settings, Wifi, WifiOff, MoreHorizontal, Users, DollarSign, Globe, Phone, Mail } from "lucide-react";

const customers = [
  { name: "Wolt", type: "Delivery Platform", partners: 142, apiStatus: "Connected", integration: "API + Excel", region: "Stockholm, Gothenburg", monthlyRevenue: "1.84M SEK", contact: "ops@wolt.com", phone: "+358 9 123 4567", apiEndpoint: "api.wolt.com/v1/eor", lastSync: "2 min ago" },
  { name: "Foodora", type: "Delivery Platform", partners: 68, apiStatus: "Connected", integration: "API", region: "Stockholm", monthlyRevenue: "612K SEK", contact: "partner@foodora.se", phone: "+46 8 987 6543", apiEndpoint: "api.foodora.se/v2/partners", lastSync: "15 min ago" },
  { name: "Uber Eats", type: "Delivery Platform", partners: 0, apiStatus: "Not Connected", integration: "Pending", region: "—", monthlyRevenue: "—", contact: "—", phone: "—", apiEndpoint: "—", lastSync: "—" },
  { name: "Bolt Food", type: "Delivery Platform", partners: 0, apiStatus: "Not Connected", integration: "Pending", region: "—", monthlyRevenue: "—", contact: "—", phone: "—", apiEndpoint: "—", lastSync: "—" },
];

export default function AdminCustomers() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-base text-muted-foreground mt-1">Manage delivery platform customers, integrations, and API connections</p>
        </div>
        <Button size="lg"><Plus className="mr-2 h-4 w-4" /> Add Customer</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-5 md:grid-cols-4">
        <Card><CardContent className="p-5 text-center"><Building2 className="h-5 w-5 text-primary mx-auto mb-2" /><p className="text-3xl font-bold">4</p><p className="text-sm text-muted-foreground mt-1">Total Customers</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><Wifi className="h-5 w-5 text-primary mx-auto mb-2" /><p className="text-3xl font-bold text-primary">2</p><p className="text-sm text-muted-foreground mt-1">APIs Connected</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><Users className="h-5 w-5 text-primary mx-auto mb-2" /><p className="text-3xl font-bold">210</p><p className="text-sm text-muted-foreground mt-1">Total Partners</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><DollarSign className="h-5 w-5 text-primary mx-auto mb-2" /><p className="text-3xl font-bold text-primary">2.45M SEK</p><p className="text-sm text-muted-foreground mt-1">Monthly Revenue</p></CardContent></Card>
      </div>

      {/* Customer Cards */}
      <div className="space-y-4">
        {customers.map((c, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold">{c.name}</h3>
                      <Badge variant={c.apiStatus === "Connected" ? "default" : "secondary"} className="flex items-center gap-1">
                        {c.apiStatus === "Connected" ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {c.apiStatus}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{c.type}</p>
                  </div>
                </div>
                <Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Configure</Button>
              </div>
              {c.apiStatus === "Connected" && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Partners</p>
                    <p className="font-semibold text-lg">{c.partners}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                    <p className="font-semibold text-lg text-primary">{c.monthlyRevenue}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Integration</p>
                    <p className="font-semibold">{c.integration}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Region</p>
                    <p className="font-semibold">{c.region}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Last Sync</p>
                    <p className="font-semibold">{c.lastSync}</p>
                  </div>
                </div>
              )}
              {c.apiStatus !== "Connected" && (
                <div className="p-4 rounded-lg bg-muted/30 border-dashed border text-center">
                  <p className="text-muted-foreground">Integration not yet configured. Click "Configure" to set up API connection.</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
