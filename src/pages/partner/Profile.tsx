import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  User, Mail, Phone, MapPin, Car, Save, Shield, Building2,
  CreditCard, Globe, Loader2, CheckCircle, AlertCircle, Bike,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Application = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  street_address: string;
  apartment: string | null;
  city: string;
  post_code: string;
  personal_number: string;
  transport: "bicycle" | "moped" | "car";
  status: string;
  nationality: string | null;
  wolt_partner_id: string | null;
  wolt_partner_email: string | null;
  bank_clearing_number: string | null;
  bank_account_number: string | null;
  created_at: string;
  reg_path: string | null;
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending:          { label: "Pending",          color: "bg-amber-100 text-amber-800 border-amber-200" },
  email_verified:   { label: "Email Verified",   color: "bg-blue-100 text-blue-800 border-blue-200" },
  under_review:     { label: "Under Review",     color: "bg-purple-100 text-purple-800 border-purple-200" },
  verified:         { label: "Verified",         color: "bg-green-100 text-green-800 border-green-200" },
  contract_sent:    { label: "Contract Sent",    color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  contract_signed:  { label: "Contract Signed",  color: "bg-teal-100 text-teal-800 border-teal-200" },
  active:           { label: "Active",           color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  rejected:         { label: "Rejected",         color: "bg-red-100 text-red-800 border-red-200" },
};

const transportIcons: Record<string, React.ReactNode> = {
  bicycle: <Bike className="h-3.5 w-3.5" />,
  moped:   <Car className="h-3.5 w-3.5" />,
  car:     <Car className="h-3.5 w-3.5" />,
};

export default function PartnerProfile() {
  const [app, setApp]         = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  // editable field state
  const [phone, setPhone]               = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [apartment, setApartment]       = useState("");
  const [city, setCity]                 = useState("");
  const [postCode, setPostCode]         = useState("");
  const [transport, setTransport]       = useState<"bicycle" | "moped" | "car">("bicycle");
  const [nationality, setNationality]   = useState("");
  const [woltId, setWoltId]             = useState("");
  const [woltEmail, setWoltEmail]       = useState("");
  const [bankClearing, setBankClearing] = useState("");
  const [bankAccount, setBankAccount]   = useState("");

  const { toast } = useToast();

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Auto-link application.user_id by email so RLS queries succeed
      await supabase.rpc("link_my_application");

      const { data, error } = await supabase
        .from("partner_applications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return;

      const a = data as Application;
      setApp(a);
      setPhone(a.phone ?? "");
      setStreetAddress(a.street_address ?? "");
      setApartment(a.apartment ?? "");
      setCity(a.city ?? "");
      setPostCode(a.post_code ?? "");
      setTransport(a.transport ?? "bicycle");
      setNationality(a.nationality ?? "");
      setWoltId(a.wolt_partner_id ?? "");
      setWoltEmail(a.wolt_partner_email ?? "");
      setBankClearing(a.bank_clearing_number ?? "");
      setBankAccount(a.bank_account_number ?? "");
    } catch (err: any) {
      toast({ title: "Error loading profile", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!app) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("partner_applications")
        .update({
          phone,
          street_address: streetAddress,
          apartment: apartment || null,
          city,
          post_code: postCode,
          transport,
          nationality: nationality || null,
          wolt_partner_id: woltId || null,
          wolt_partner_email: woltEmail || null,
          bank_clearing_number: bankClearing || null,
          bank_account_number: bankAccount || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", app.id);

      if (error) throw error;
      toast({ title: "Profile updated", description: "Your profile has been saved successfully." });
      await loadProfile();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="max-w-3xl">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No profile found</h2>
            <p className="text-muted-foreground">Your application data could not be loaded. Please contact support.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = statusLabels[app.status] ?? { label: app.status, color: "" };
  const memberSince = new Date(app.created_at).toLocaleDateString("sv-SE", { year: "numeric", month: "long" });
  const initials = `${app.first_name?.[0] ?? ""}${app.last_name?.[0] ?? ""}`.toUpperCase();
  const maskedPN = app.personal_number
    ? app.personal_number.slice(0, 6) + "-****"
    : "—";

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-base text-muted-foreground mt-1">Manage your personal and work information</p>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">{initials || <User className="h-10 w-10 text-primary" />}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{app.first_name} {app.last_name}</h2>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusInfo.color}`}>
                  <CheckCircle className="h-3 w-3" /> {statusInfo.label}
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">Partner since {memberSince}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {app.city}
                </span>
                <span className="flex items-center gap-1.5">
                  {transportIcons[app.transport]}
                  {app.transport.charAt(0).toUpperCase() + app.transport.slice(1)}
                </span>
                {app.wolt_partner_id && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> Wolt ID: {app.wolt_partner_id}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">First Name</Label>
              <Input value={app.first_name} disabled className="h-11 bg-muted" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Last Name</Label>
              <Input value={app.last_name} disabled className="h-11 bg-muted" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Personal Number (Personnummer)
            </Label>
            <Input value={maskedPN} disabled className="h-11 bg-muted font-mono" />
            <p className="text-xs text-muted-foreground">Verified during registration. Cannot be changed.</p>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email
              </Label>
              <Input value={app.email} disabled className="h-11 bg-muted" />
              <p className="text-xs text-muted-foreground">Contact support to change email.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Phone
              </Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} className="h-11" placeholder="+46 70 123 4567" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Nationality
            </Label>
            <Input value={nationality} onChange={e => setNationality(e.target.value)} className="h-11" placeholder="e.g. Swedish" />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Street Address</Label>
            <Input value={streetAddress} onChange={e => setStreetAddress(e.target.value)} className="h-11" placeholder="Sveavägen 42" />
          </div>
          <div className="grid grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Apartment</Label>
              <Input value={apartment} onChange={e => setApartment(e.target.value)} className="h-11" placeholder="Apt 4B" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">City</Label>
              <Input value={city} onChange={e => setCity(e.target.value)} className="h-11" placeholder="Stockholm" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Post Code</Label>
              <Input value={postCode} onChange={e => setPostCode(e.target.value)} className="h-11" placeholder="111 34" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" /> Work Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Vehicle Type</Label>
            <Select value={transport} onValueChange={v => setTransport(v as typeof transport)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bicycle">Bicycle</SelectItem>
                <SelectItem value="moped">Moped</SelectItem>
                <SelectItem value="car">Car</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Wolt Partner ID
              </Label>
              <Input value={woltId} onChange={e => setWoltId(e.target.value)} className="h-11" placeholder="e.g. 5194828" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Wolt Partner Email
              </Label>
              <Input value={woltEmail} onChange={e => setWoltEmail(e.target.value)} className="h-11" placeholder="partner@email.com" type="email" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> Bank Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Clearing Number</Label>
              <Input value={bankClearing} onChange={e => setBankClearing(e.target.value)} className="h-11" placeholder="e.g. 8327-9" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Account Number</Label>
              <Input value={bankAccount} onChange={e => setBankAccount(e.target.value)} className="h-11" placeholder="e.g. 12345678" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Bank details are used for monthly salary payments. Changes take effect next pay cycle.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end pb-4">
        <Button size="lg" className="px-8" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save All Changes
        </Button>
      </div>
    </div>
  );
}
