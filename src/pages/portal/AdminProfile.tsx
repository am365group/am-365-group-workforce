import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User, Mail, Shield, Save, Loader2, AlertCircle,
  Calendar, Key, CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const roleLabels: Record<string, { label: string; color: string }> = {
  admin:      { label: "Administrator", color: "bg-red-100 text-red-800 border-red-200" },
  controller: { label: "Controller",    color: "bg-blue-100 text-blue-800 border-blue-200" },
  verifier:   { label: "Verifier",      color: "bg-purple-100 text-purple-800 border-purple-200" },
};

export default function AdminProfile() {
  const [email, setEmail]           = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole]             = useState("");
  const [memberSince, setMemberSince] = useState("");
  const [initials, setInitials]     = useState("A");
  const [userId, setUserId]         = useState("");

  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

  // Password change fields
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const { toast } = useToast();

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      setEmail(user.email ?? "");
      setMemberSince(new Date(user.created_at).toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" }));

      // Load profile row
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const name = profile?.display_name ?? user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "Admin";
      setDisplayName(name);
      setInitials(name.slice(0, 2).toUpperCase());

      // Load role
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      setRole(roleRow?.role ?? "");
    } catch (err: any) {
      toast({ title: "Error loading profile", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!userId || !displayName.trim()) return;
    setSaving(true);
    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ user_id: userId, display_name: displayName.trim(), user_type: "staff", updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (profileError) throw profileError;

      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { display_name: displayName.trim() },
      });
      if (authError) throw authError;

      setInitials(displayName.trim().slice(0, 2).toUpperCase());
      toast({ title: "Profile updated", description: "Display name saved successfully." });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) return;
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Minimum 8 characters required.", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password updated", description: "Your password has been changed." });
      setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Password change failed", description: err.message, variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/portal/login";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const roleInfo = roleLabels[role];

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-base text-muted-foreground mt-1">Manage your account information and security settings</p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">{initials}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{displayName}</h2>
                {roleInfo && (
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${roleInfo.color}`}>
                    <Shield className="h-3 w-3" /> {roleInfo.label}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-1 text-sm flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {email}
              </p>
              <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1">
                <Calendar className="h-3.5 w-3.5" /> Member since {memberSince}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Display Name</Label>
            <Input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="h-11"
              placeholder="Your full name"
            />
            <p className="text-xs text-muted-foreground">
              This name appears in the admin portal header and audit logs.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email Address
            </Label>
            <Input value={email} disabled className="h-11 bg-muted" />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed from this page. Contact the system owner.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Role
            </Label>
            <div className="h-11 flex items-center px-3 rounded-md border bg-muted">
              {roleInfo
                ? <span className={`inline-flex items-center gap-1 text-sm font-medium px-2.5 py-0.5 rounded-full border ${roleInfo.color}`}>
                    <Shield className="h-3 w-3" /> {roleInfo.label}
                  </span>
                : <span className="text-sm text-muted-foreground">{role || "—"}</span>
              }
            </div>
            <p className="text-xs text-muted-foreground">Role is managed by the system administrator.</p>
          </div>

          <Button size="lg" onClick={handleSaveName} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Display Name
          </Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="h-11"
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="h-11"
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Passwords do not match
              </p>
            )}
            {newPassword && confirmPassword && newPassword === confirmPassword && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Passwords match
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={handleChangePassword}
            disabled={changingPassword || !newPassword || newPassword !== confirmPassword}
          >
            {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" /> Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Sign out of the admin portal. You will need to log in again to access the system.
          </p>
          <Button variant="destructive" onClick={handleSignOut}>
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
