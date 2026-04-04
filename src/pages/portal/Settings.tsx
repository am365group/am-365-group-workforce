import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Wifi, WifiOff, Bell, RefreshCw, Save, Shield, Mail, Globe, Database, Key, Clock, CheckCircle } from "lucide-react";

const integrations = [
  { name: "Wolt API", status: "Connected", lastSync: "2 min ago", endpoint: "api.wolt.com/v1/eor", health: "Healthy", uptime: "99.9%" },
  { name: "Foodora API", status: "Connected", lastSync: "15 min ago", endpoint: "api.foodora.se/v2/partners", health: "Healthy", uptime: "99.7%" },
  { name: "BankID", status: "Connected", lastSync: "Active", endpoint: "auth.bankid.com", health: "Healthy", uptime: "100%" },
  { name: "Skatteverket (Tax)", status: "Not Connected", lastSync: "—", endpoint: "—", health: "—", uptime: "—" },
  { name: "Resend (Email)", status: "Connected", lastSync: "Active", endpoint: "api.resend.com/v1", health: "Healthy", uptime: "99.8%" },
];

const emailSettings = [
  { label: "From Domain", value: "extra2share.net" },
  { label: "Reply-To", value: "info@extra2share.net" },
  { label: "Production Domain (planned)", value: "am365group.se" },
];

export default function AdminSettings() {
  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-base text-muted-foreground mt-1">Configure platform settings, integrations, and notifications</p>
      </div>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Wifi className="h-5 w-5 text-primary" /> Integration Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrations.map((int, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${int.status === "Connected" ? "bg-primary/10" : "bg-muted"}`}>
                  {int.status === "Connected" ? <Wifi className="h-5 w-5 text-primary" /> : <WifiOff className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div>
                  <p className="font-semibold">{int.name}</p>
                  <p className="text-sm text-muted-foreground">{int.endpoint}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {int.status === "Connected" && (
                  <>
                    <div className="text-sm text-right hidden md:block">
                      <p className="text-muted-foreground">Uptime: <span className="font-medium text-foreground">{int.uptime}</span></p>
                      <p className="text-xs text-muted-foreground">Last sync: {int.lastSync}</p>
                    </div>
                    <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {int.health}</Badge>
                  </>
                )}
                {int.status !== "Connected" && <Badge variant="secondary">Not Connected</Badge>}
                <Button variant="outline" size="sm"><RefreshCw className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Email Configuration (Resend)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailSettings.map((setting) => (
            <div key={setting.label} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <span className="text-sm font-medium">{setting.label}</span>
              <code className="text-sm font-mono bg-muted px-3 py-1 rounded">{setting.value}</code>
            </div>
          ))}
          <p className="text-sm text-muted-foreground">
            Emails are sent via Resend from <code className="text-xs">info@extra2share.net</code>. 
            Production domain will be updated to <code className="text-xs">am365group.se</code>.
          </p>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Notification Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between p-4 rounded-xl border">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive email alerts for important events</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl border">
            <div>
              <p className="font-medium">API Disconnect Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified immediately when a customer API disconnects</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl border">
            <div>
              <p className="font-medium">Payroll Deadline Reminders</p>
              <p className="text-sm text-muted-foreground">Automatic reminders 3 days before payroll processing deadline</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl border">
            <div>
              <p className="font-medium">New Partner Registration Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified when new partners register on the platform</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl border">
            <div>
              <p className="font-medium">Compliance Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified when GDPR compliance checks need review</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2"><Label className="text-sm font-medium">Company Name</Label><Input defaultValue="AM365 Group AB" className="h-11" /></div>
            <div className="space-y-2"><Label className="text-sm font-medium">Org Number</Label><Input defaultValue="559XXX-XXXX" className="h-11" /></div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2"><Label className="text-sm font-medium">Support Email</Label><Input defaultValue="info@extra2share.net" className="h-11" /></div>
            <div className="space-y-2"><Label className="text-sm font-medium">Support Phone</Label><Input defaultValue="+46 8 123 4567" className="h-11" /></div>
          </div>
          <div className="space-y-2"><Label className="text-sm font-medium">Website</Label><Input defaultValue="https://am365group.se" className="h-11" /></div>
          <div className="space-y-2"><Label className="text-sm font-medium">Address</Label><Input defaultValue="Stockholm, Sweden" className="h-11" /></div>
          <Button size="lg"><Save className="mr-2 h-4 w-4" /> Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
