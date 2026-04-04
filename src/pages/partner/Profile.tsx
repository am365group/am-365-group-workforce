import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, MapPin, Car, Save, Shield, Building2, CreditCard, Calendar, Globe } from "lucide-react";

export default function PartnerProfile() {
  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-base text-muted-foreground mt-1">Manage your personal and work information</p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">Johan Andersson</h2>
                <Badge className="text-xs">Verified</Badge>
              </div>
              <p className="text-muted-foreground mt-1">Partner since January 2024 · ID: P-001</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Stockholm</span>
                <span className="flex items-center gap-1"><Car className="h-3.5 w-3.5" /> Electric Moped</span>
                <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> Wolt, Foodora</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">First Name</Label>
              <Input defaultValue="Johan" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Last Name</Label>
              <Input defaultValue="Andersson" className="h-11" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Personal Number (Personnummer)</Label>
            <Input defaultValue="19950215-****" disabled className="h-11 bg-muted" />
            <p className="text-xs text-muted-foreground">Verified via BankID. Cannot be changed.</p>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
              <Input defaultValue="johan.andersson@email.com" type="email" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone</Label>
              <Input defaultValue="+46 70 123 4567" className="h-11" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Address</Label>
            <Input defaultValue="Sveavägen 42, 111 34 Stockholm" className="h-11" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Nationality</Label>
            <Input defaultValue="Swedish" className="h-11" />
          </div>
        </CardContent>
      </Card>

      {/* Work Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Car className="h-5 w-5 text-primary" /> Work Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Vehicle Type</Label>
              <Input defaultValue="Electric Moped" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preferred City</Label>
              <Input defaultValue="Stockholm" className="h-11" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Preferred Areas</Label>
            <Input defaultValue="Södermalm, Vasastan, Östermalm" className="h-11" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Availability</Label>
            <Input defaultValue="Full-time (Mon–Sat)" className="h-11" />
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Bank Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Bank Name</Label>
              <Input defaultValue="Swedbank" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Clearing Number</Label>
              <Input defaultValue="8327-9" className="h-11" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Account Number</Label>
            <Input defaultValue="••••••••4521" className="h-11" />
          </div>
          <p className="text-xs text-muted-foreground">Bank details are used for monthly salary payments. Changes take effect next pay cycle.</p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" className="px-8"><Save className="mr-2 h-4 w-4" /> Save All Changes</Button>
      </div>
    </div>
  );
}
