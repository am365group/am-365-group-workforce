import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Wifi, WifiOff, Bell, RefreshCw, Save } from "lucide-react";

const integrations = [
  { name: "Wolt API", status: "Connected", lastSync: "2 min ago", endpoint: "api.wolt.com/v1" },
  { name: "Foodora API", status: "Connected", lastSync: "15 min ago", endpoint: "api.foodora.se/v2" },
  { name: "BankID", status: "Connected", lastSync: "Active", endpoint: "auth.bankid.com" },
  { name: "Skatteverket", status: "Not Connected", lastSync: "—", endpoint: "—" },
];

export default function AdminSettings() {
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">Configure platform settings and integrations</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wifi className="h-5 w-5 text-primary" /> Integration Status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {integrations.map((int, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                {int.status === "Connected" ? <Wifi className="h-5 w-5 text-primary" /> : <WifiOff className="h-5 w-5 text-muted-foreground" />}
                <div>
                  <p className="font-medium text-sm">{int.name}</p>
                  <p className="text-xs text-muted-foreground">{int.endpoint}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Last sync: {int.lastSync}</span>
                <Badge variant={int.status === "Connected" ? "default" : "secondary"}>{int.status}</Badge>
                <Button variant="outline" size="sm"><RefreshCw className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Email Notifications</p><p className="text-xs text-muted-foreground">Receive email alerts for important events</p></div><Switch defaultChecked /></div>
          <div className="flex items-center justify-between"><div><p className="text-sm font-medium">API Disconnect Alerts</p><p className="text-xs text-muted-foreground">Get notified when a customer API disconnects</p></div><Switch defaultChecked /></div>
          <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Payroll Reminders</p><p className="text-xs text-muted-foreground">Automatic reminders before payroll deadlines</p></div><Switch defaultChecked /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">General Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Company Name</Label><Input defaultValue="AM365 Group AB" /></div>
          <div className="space-y-2"><Label>Org Number</Label><Input defaultValue="559XXX-XXXX" /></div>
          <div className="space-y-2"><Label>Support Email</Label><Input defaultValue="info@extra2share.net" /></div>
          <Button><Save className="mr-2 h-4 w-4" /> Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
