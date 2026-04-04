import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, MapPin, Car, Save } from "lucide-react";

export default function PartnerProfile() {
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle>Johan Andersson</CardTitle>
              <p className="text-sm text-muted-foreground">Partner since January 2024</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> First Name</Label>
              <Input defaultValue="Johan" />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input defaultValue="Andersson" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Email</Label>
            <Input defaultValue="johan.andersson@email.com" type="email" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> Phone</Label>
            <Input defaultValue="+46 70 123 4567" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Address</Label>
            <Input defaultValue="Sveavägen 42, 111 34 Stockholm" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Car className="h-3.5 w-3.5" /> Vehicle Type</Label>
            <Input defaultValue="Electric Moped" />
          </div>
          <div className="pt-2">
            <Button><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
