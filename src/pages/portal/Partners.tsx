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
  Loader2, Trash2, AlertTriangle, ChevronRight
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
};

const TRANSPORT_ICON: Record<string, string> = {
  bicycle: "🚲",
  moped:   "🛵",
  car:     "🚗",
};

export default function AdminPartners() {
  const [partners, setPartners]       = useState<Partner[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Add partner dialog
  const [showAdd, setShowAdd]         = useState(false);
  const [addLoading, setAddLoading]   = useState(false);
  const [addForm, setAddForm]         = useState({
    first_name: "", last_name: "", email: "", phone: "",
    city: "", transport: "bicycle", reg_path: "wolt",
  });

  // Delete dialog
  const [showDelete, setShowDelete]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

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
        first_name:     addForm.first_name.trim(),
        last_name:      addForm.last_name.trim(),
        email:          addForm.email.trim().toLowerCase(),
        phone:          addForm.phone.trim() || null,
        city:           addForm.city.trim() || null,
        transport:      addForm.transport,
        reg_path:       addForm.reg_path,
        status:         "pending",
        personal_number: "000000-0000",  // placeholder for admin-created entries
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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const fullName = `${deleteTarget.first_name} ${deleteTarget.last_name}`;
    if (deleteConfirm !== fullName) {
      toast({ title: "Name does not match", description: `Type exactly: ${fullName}`, variant: "destructive" });
      return;
    }
    setDeleteLoading(true);
    try {
      // Delete linked documents first
      await supabase.from("partner_documents").delete().eq("application_id", deleteTarget.id);
      // Delete contracts
      await supabase.from("partner_contracts").delete().eq("application_id", deleteTarget.id);
      // Delete application
      const { error } = await supabase.from("partner_applications").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      toast({ title: "Partner removed", description: `${fullName} has been permanently deleted.` });
      setShowDelete(false);
      setDeleteTarget(null);
      setDeleteConfirm("");
      loadPartners();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = partners.filter(p => {
    const matchSearch = !searchTerm ||
      `${p.first_name} ${p.last_name} ${p.email} ${p.city ?? ""} ${p.wolt_partner_id ?? ""}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = {
    active:   partners.filter(p => p.status === "active").length,
    pending:  partners.filter(p => ["pending", "email_verified"].includes(p.status)).length,
    inReview: partners.filter(p => ["under_review", "verified", "contract_sent", "contract_signed"].includes(p.status)).length,
    rejected: partners.filter(p => p.status === "rejected").length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Partner Management</h1>
          <p className="text-base text-muted-foreground mt-1">All registered delivery partners — {partners.length} total</p>
        </div>
        <Button size="lg" onClick={() => setShowAdd(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Add Partner
        </Button>
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

      {/* Table */}
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
                {filtered.map(p => {
                  const initials = `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase();
                  const statusColor = STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-700";
                  const statusLabel = STATUS_LABELS[p.status] ?? p.status;
                  return (
                    <TableRow key={p.id} className="hover:bg-muted/50">
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
                            title="Delete partner"
                            onClick={() => { setDeleteTarget(p); setDeleteConfirm(""); setShowDelete(true); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDelete} onOpenChange={v => { setShowDelete(v); if (!v) setDeleteConfirm(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Delete Partner
            </DialogTitle>
            <DialogDescription>
              This permanently deletes the partner record, all their documents, and contracts. This action <strong>cannot be undone</strong>.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <p className="text-sm font-semibold">{deleteTarget.first_name} {deleteTarget.last_name}</p>
                <p className="text-xs text-muted-foreground">{deleteTarget.email}</p>
                <p className="text-xs text-muted-foreground mt-1">Status: {STATUS_LABELS[deleteTarget.status] ?? deleteTarget.status}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">
                  Type <strong>{deleteTarget.first_name} {deleteTarget.last_name}</strong> to confirm deletion:
                </Label>
                <Input
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder={`${deleteTarget.first_name} ${deleteTarget.last_name}`}
                  className={deleteConfirm && deleteConfirm !== `${deleteTarget.first_name} ${deleteTarget.last_name}` ? "border-destructive" : ""}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteLoading || !deleteTarget || deleteConfirm !== `${deleteTarget.first_name} ${deleteTarget.last_name}`}
            >
              {deleteLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
