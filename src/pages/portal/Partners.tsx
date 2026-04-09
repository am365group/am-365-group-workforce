import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search, UserPlus, Users, Eye, Mail, MapPin, Phone,
  Loader2, Trash2, AlertTriangle, ChevronDown, ChevronRight,
  RotateCcw, DatabaseZap, ShieldAlert
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type Partner = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  transport: string | null;
  status: string;
  created_at: string;
  user_id: string | null;
  wolt_partner_id: string | null;
  reg_path: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  active:          "bg-emerald-100 text-emerald-800 border-emerald-200",
  contract_signed: "bg-teal-100 text-teal-800 border-teal-200",
  contract_sent:   "bg-cyan-100 text-cyan-800 border-cyan-200",
  verified:        "bg-green-100 text-green-800 border-green-200",
  under_review:    "bg-purple-100 text-purple-800 border-purple-200",
  email_verified:  "bg-blue-100 text-blue-800 border-blue-200",
  pending:         "bg-amber-100 text-amber-800 border-amber-200",
  rejected:        "bg-red-100 text-red-800 border-red-200",
  deactivated:     "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  active:          "Active",
  contract_signed: "Contract Signed",
  contract_sent:   "Contract Sent",
  verified:        "Verified",
  under_review:    "Under Review",
  email_verified:  "Email Verified",
  pending:         "Pending",
  rejected:        "Rejected",
  deactivated:     "Deactivated",
};

const TRANSPORT_ICON: Record<string, string> = {
  bicycle: "🚲",
  moped:   "🛵",
  car:     "🚗",
};

export default function AdminPartners() {
  const [partners, setPartners]           = useState<Partner[]>([]);
  const [loading, setLoading]             = useState(true);
  const [searchTerm, setSearchTerm]       = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [showDeactivated, setShowDeactivated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Add partner dialog
  const [showAdd, setShowAdd]             = useState(false);
  const [addLoading, setAddLoading]       = useState(false);
  const [addForm, setAddForm]             = useState({
    first_name: "", last_name: "", email: "", phone: "",
    city: "", transport: "bicycle", reg_path: "wolt",
  });

  // Deactivate dialog
  const [showDeactivate, setShowDeactivate]   = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<Partner | null>(null);
  const [deactivateConfirm, setDeactivateConfirm] = useState("");
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Reactivate dialog
  const [showReactivate, setShowReactivate]   = useState(false);
  const [reactivateTarget, setReactivateTarget] = useState<Partner | null>(null);
  const [reactivateLoading, setReactivateLoading] = useState(false);

  // Clean database dialog
  const [showClean, setShowClean]         = useState(false);
  const [cleanConfirm, setCleanConfirm]   = useState("");
  const [cleanLoading, setCleanLoading]   = useState(false);

  useEffect(() => { loadPartners(); }, []);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("partner_applications")
        .select("id, first_name, last_name, email, phone, city, transport, status, created_at, user_id, wolt_partner_id, reg_path")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPartners((data as Partner[]) || []);
    } catch (err: any) {
      toast({ title: "Error loading partners", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!addForm.first_name || !addForm.last_name || !addForm.email) {
      toast({ title: "Required fields missing", description: "First name, last name, and email are required.", variant: "destructive" });
      return;
    }
    setAddLoading(true);
    try {
      const { error } = await supabase.from("partner_applications").insert({
        first_name:      addForm.first_name.trim(),
        last_name:       addForm.last_name.trim(),
        email:           addForm.email.trim().toLowerCase(),
        phone:           addForm.phone.trim() || null,
        city:            addForm.city.trim() || null,
        transport:       addForm.transport,
        reg_path:        addForm.reg_path,
        status:          "pending",
        personal_number: "000000-0000",
        street_address:  "—",
        post_code:       "000 00",
      });
      if (error) throw error;
      toast({ title: "Partner added", description: `${addForm.first_name} ${addForm.last_name} has been added with Pending status.` });
      setShowAdd(false);
      setAddForm({ first_name: "", last_name: "", email: "", phone: "", city: "", transport: "bicycle", reg_path: "wolt" });
      loadPartners();
    } catch (err: any) {
      toast({ title: "Failed to add partner", description: err.message, variant: "destructive" });
    } finally {
      setAddLoading(false);
    }
  };

  // Soft delete — sets status to 'deactivated'
  const handleDeactivateConfirm = async () => {
    if (!deactivateTarget) return;
    const fullName = `${deactivateTarget.first_name} ${deactivateTarget.last_name}`;
    if (deactivateConfirm !== fullName) {
      toast({ title: "Name does not match", description: `Type exactly: ${fullName}`, variant: "destructive" });
      return;
    }
    setDeactivateLoading(true);
    try {
      const { error } = await supabase
        .from("partner_applications")
        .update({ status: "deactivated" })
        .eq("id", deactivateTarget.id);
      if (error) throw error;
      toast({ title: "Partner deactivated", description: `${fullName} has been deactivated and moved to the archive.` });
      setShowDeactivate(false);
      setDeactivateTarget(null);
      setDeactivateConfirm("");
      loadPartners();
    } catch (err: any) {
      toast({ title: "Deactivation failed", description: err.message, variant: "destructive" });
    } finally {
      setDeactivateLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!reactivateTarget) return;
    setReactivateLoading(true);
    try {
      const { error } = await supabase
        .from("partner_applications")
        .update({ status: "pending" })
        .eq("id", reactivateTarget.id);
      if (error) throw error;
      toast({ title: "Partner reactivated", description: `${reactivateTarget.first_name} ${reactivateTarget.last_name} is now Pending.` });
      setShowReactivate(false);
      setReactivateTarget(null);
      loadPartners();
    } catch (err: any) {
      toast({ title: "Reactivation failed", description: err.message, variant: "destructive" });
    } finally {
      setReactivateLoading(false);
    }
  };

  // Hard wipe — deletes ALL partner data permanently (DB + Storage + Auth users)
  const handleCleanDatabase = async () => {
    if (cleanConfirm !== "CLEAN DATABASE") {
      toast({ title: "Confirmation text does not match", description: 'Type exactly: CLEAN DATABASE', variant: "destructive" });
      return;
    }
    setCleanLoading(true);
    try {
      // Step 1: Collect storage file paths before DB deletion
      const { data: allDocs } = await supabase
        .from("partner_documents")
        .select("file_url");
      const filePaths = (allDocs || []).map((d: any) => d.file_url).filter(Boolean);

      // Step 2: Delete files from Supabase Storage (in batches of 100)
      for (let i = 0; i < filePaths.length; i += 100) {
        await supabase.storage.from("partner-documents").remove(filePaths.slice(i, i + 100));
      }

      // Step 3: Sweep all remaining user folders in storage (orphaned files)
      const { data: folders } = await supabase.storage.from("partner-documents").list("", { limit: 1000 });
      if (folders && folders.length > 0) {
        for (const folder of folders) {
          const { data: files } = await supabase.storage.from("partner-documents").list(folder.name, { limit: 1000 });
          if (files && files.length > 0) {
            await supabase.storage.from("partner-documents").remove(files.map(f => `${folder.name}/${f.name}`));
          }
        }
      }

      // Step 4: Call SECURITY DEFINER function to wipe DB rows AND auth.users
      const { data: result, error } = await supabase.rpc("admin_clean_all_partner_data");
      if (error) throw error;

      const deleted = result as { deleted_applications: number; deleted_auth_users: number };
      toast({
        title: "Database cleaned",
        description: `Deleted ${deleted.deleted_applications} partner records, ${deleted.deleted_auth_users} auth accounts, and ${filePaths.length} storage files.`,
      });
      setShowClean(false);
      setCleanConfirm("");
      loadPartners();
    } catch (err: any) {
      toast({ title: "Clean failed", description: err.message, variant: "destructive" });
    } finally {
      setCleanLoading(false);
    }
  };

  const activePartners     = partners.filter(p => p.status !== "deactivated");
  const deactivatedPartners = partners.filter(p => p.status === "deactivated");

  const filtered = activePartners.filter(p => {
    const matchSearch = !searchTerm ||
      `${p.first_name} ${p.last_name} ${p.email} ${p.city ?? ""} ${p.wolt_partner_id ?? ""}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = {
    active:   activePartners.filter(p => p.status === "active").length,
    pending:  activePartners.filter(p => ["pending", "email_verified"].includes(p.status)).length,
    inReview: activePartners.filter(p => ["under_review", "verified", "contract_sent", "contract_signed"].includes(p.status)).length,
    rejected: activePartners.filter(p => p.status === "rejected").length,
  };

  const PartnerRow = ({ p, isDeactivated = false }: { p: Partner; isDeactivated?: boolean }) => {
    const initials    = `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase();
    const statusColor = STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-700";
    const statusLabel = STATUS_LABELS[p.status] ?? p.status;
    return (
      <TableRow key={p.id} className={isDeactivated ? "opacity-60 hover:opacity-80 hover:bg-muted/30" : "hover:bg-muted/50"}>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {initials}
            </div>
            <div>
              <p className="font-medium text-sm">{p.first_name} {p.last_name}</p>
              {p.wolt_partner_id && <p className="text-xs text-muted-foreground font-mono">Wolt: {p.wolt_partner_id}</p>}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm">
            <p className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" /> {p.email}</p>
            {p.phone && <p className="flex items-center gap-1 text-muted-foreground mt-0.5"><Phone className="h-3 w-3" /> {p.phone}</p>}
          </div>
        </TableCell>
        <TableCell>
          {p.city ? (
            <span className="flex items-center gap-1 text-sm"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {p.city}</span>
          ) : <span className="text-muted-foreground text-sm">—</span>}
        </TableCell>
        <TableCell className="text-sm">
          {p.transport ? `${TRANSPORT_ICON[p.transport] ?? ""} ${p.transport.charAt(0).toUpperCase() + p.transport.slice(1)}` : "—"}
        </TableCell>
        <TableCell>
          <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusColor}`}>
            {statusLabel}
          </span>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {new Date(p.created_at).toLocaleDateString("sv-SE")}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            {isDeactivated ? (
              <Button
                variant="ghost" size="sm"
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                onClick={() => { setReactivateTarget(p); setShowReactivate(true); }}
                title="Reactivate partner"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reactivate
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => navigate("/portal/verification")}
                  title="View in Verification"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" /> View
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Deactivate partner"
                  onClick={() => { setDeactivateTarget(p); setDeactivateConfirm(""); setShowDeactivate(true); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Partner Management</h1>
          <p className="text-base text-muted-foreground mt-1">
            {activePartners.length} active partners
            {deactivatedPartners.length > 0 && ` · ${deactivatedPartners.length} deactivated`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            className="border-destructive/40 text-destructive hover:bg-destructive/5 hover:border-destructive"
            onClick={() => { setCleanConfirm(""); setShowClean(true); }}
          >
            <DatabaseZap className="mr-2 h-4 w-4" /> Clean Database
          </Button>
          <Button size="lg" onClick={() => setShowAdd(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Add Partner
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-5 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Active</p><p className="text-3xl font-bold text-emerald-600">{statusCounts.active}</p></div><Users className="h-8 w-8 text-emerald-600 opacity-20" /></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">In Review</p><p className="text-3xl font-bold text-blue-600">{statusCounts.inReview}</p></div><Users className="h-8 w-8 text-blue-600 opacity-20" /></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Pending</p><p className="text-3xl font-bold text-amber-600">{statusCounts.pending}</p></div><Users className="h-8 w-8 text-amber-600 opacity-20" /></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Rejected</p><p className="text-3xl font-bold text-destructive">{statusCounts.rejected}</p></div><Users className="h-8 w-8 text-destructive opacity-20" /></CardContent></Card>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, city, Wolt ID..."
            className="pl-9 h-11"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 h-11">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="contract_signed">Contract Signed</SelectItem>
            <SelectItem value="contract_sent">Contract Sent</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="email_verified">Email Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Partners Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No partners found.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Transport</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => <PartnerRow key={p.id} p={p} />)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Deactivated Partners — collapsible section at the bottom */}
      {deactivatedPartners.length > 0 && (
        <div>
          <button
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
            onClick={() => setShowDeactivated(v => !v)}
          >
            {showDeactivated ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Deactivated Partners ({deactivatedPartners.length})
          </button>
          {showDeactivated && (
            <Card className="border-dashed border-gray-300">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Partner</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Transport</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deactivatedPartners.map(p => <PartnerRow key={p.id} p={p} isDeactivated />)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add Partner Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Add New Partner
            </DialogTitle>
            <DialogDescription>
              Manually create a partner record. They will need to complete registration and verification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name <span className="text-destructive">*</span></Label>
                <Input value={addForm.first_name} onChange={e => setAddForm(f => ({ ...f, first_name: e.target.value }))} placeholder="Johan" />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name <span className="text-destructive">*</span></Label>
                <Input value={addForm.last_name} onChange={e => setAddForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Andersson" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="partner@email.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} placeholder="+46 70 123 4567" />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={addForm.city} onChange={e => setAddForm(f => ({ ...f, city: e.target.value }))} placeholder="Stockholm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Transport</Label>
                <Select value={addForm.transport} onValueChange={v => setAddForm(f => ({ ...f, transport: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bicycle">🚲 Bicycle</SelectItem>
                    <SelectItem value="moped">🛵 Moped</SelectItem>
                    <SelectItem value="car">🚗 Car</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Select value={addForm.reg_path} onValueChange={v => setAddForm(f => ({ ...f, reg_path: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wolt">Wolt</SelectItem>
                    <SelectItem value="foodora">Foodora</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={addLoading}>
              {addLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <UserPlus className="mr-1.5 h-4 w-4" />}
              Add Partner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={showDeactivate} onOpenChange={v => { setShowDeactivate(v); if (!v) setDeactivateConfirm(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Deactivate Partner
            </DialogTitle>
            <DialogDescription>
              The partner record will be archived and moved to the deactivated list. You can reactivate them at any time.
            </DialogDescription>
          </DialogHeader>
          {deactivateTarget && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <p className="text-sm font-semibold">{deactivateTarget.first_name} {deactivateTarget.last_name}</p>
                <p className="text-xs text-muted-foreground">{deactivateTarget.email}</p>
                <p className="text-xs text-muted-foreground mt-1">Status: {STATUS_LABELS[deactivateTarget.status] ?? deactivateTarget.status}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">
                  Type <strong>{deactivateTarget.first_name} {deactivateTarget.last_name}</strong> to confirm:
                </Label>
                <Input
                  value={deactivateConfirm}
                  onChange={e => setDeactivateConfirm(e.target.value)}
                  placeholder={`${deactivateTarget.first_name} ${deactivateTarget.last_name}`}
                  className={deactivateConfirm && deactivateConfirm !== `${deactivateTarget.first_name} ${deactivateTarget.last_name}` ? "border-destructive" : ""}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeactivate(false); setDeactivateConfirm(""); }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeactivateConfirm}
              disabled={deactivateLoading || !deactivateTarget || deactivateConfirm !== `${deactivateTarget.first_name} ${deactivateTarget.last_name}`}
            >
              {deactivateLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />}
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate Confirmation Dialog */}
      <Dialog open={showReactivate} onOpenChange={v => { setShowReactivate(v); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <RotateCcw className="h-5 w-5" /> Reactivate Partner
            </DialogTitle>
            <DialogDescription>
              This will restore the partner to <strong>Pending</strong> status so they can continue through the verification flow.
            </DialogDescription>
          </DialogHeader>
          {reactivateTarget && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-sm font-semibold">{reactivateTarget.first_name} {reactivateTarget.last_name}</p>
              <p className="text-xs text-muted-foreground">{reactivateTarget.email}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReactivate(false)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleReactivate}
              disabled={reactivateLoading}
            >
              {reactivateLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-1.5 h-4 w-4" />}
              Reactivate Partner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clean Database Dialog */}
      <Dialog open={showClean} onOpenChange={v => { setShowClean(v); if (!v) setCleanConfirm(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> Clean Database
            </DialogTitle>
            <DialogDescription>
              <strong className="text-destructive">Pre-handover only.</strong> This permanently and irreversibly deletes <strong>all</strong> partner applications, documents, and contracts from the database. There is no undo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-sm space-y-1">
              <p className="font-semibold text-destructive">What will be deleted:</p>
              <p className="text-muted-foreground">• All partner applications ({partners.length} records)</p>
              <p className="text-muted-foreground">• All uploaded partner documents</p>
              <p className="text-muted-foreground">• All partner contracts</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">
                Type <strong>CLEAN DATABASE</strong> to confirm:
              </Label>
              <Input
                value={cleanConfirm}
                onChange={e => setCleanConfirm(e.target.value)}
                placeholder="CLEAN DATABASE"
                className={cleanConfirm && cleanConfirm !== "CLEAN DATABASE" ? "border-destructive" : ""}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowClean(false); setCleanConfirm(""); }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleCleanDatabase}
              disabled={cleanLoading || cleanConfirm !== "CLEAN DATABASE"}
            >
              {cleanLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <DatabaseZap className="mr-1.5 h-4 w-4" />}
              Wipe All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
