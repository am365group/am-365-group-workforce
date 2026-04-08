import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Building2, Plus, Search, Loader2, Trash2, AlertTriangle,
  ChevronDown, ChevronRight, RotateCcw, DatabaseZap, ShieldAlert,
  Wifi, WifiOff, Users, FileText, Calendar, Mail, Phone, MapPin,
  Pencil, Globe, Hash
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/* ---------- types ---------- */
type Customer = {
  id: string;
  name: string;
  org_number: string | null;
  contact_email: string | null;
  finance_email: string | null;
  phone: string | null;
  address: string | null;
  api_type: string | null;
  is_active: boolean | null;
  settings: any;
  created_at: string;
  updated_at: string;
};

type CustomerStats = {
  partnersCount: number;
  invoicesCount: number;
  schedulesCount: number;
};

const API_TYPE_LABELS: Record<string, string> = {
  wolt:   "Wolt",
  foodora: "Foodora",
  uber_eats: "Uber Eats",
  bolt_food: "Bolt Food",
  manual: "Manual / CSV",
  other:  "Other",
};

const EMPTY_FORM = {
  name: "", org_number: "", contact_email: "", finance_email: "",
  phone: "", address: "", api_type: "manual",
};

export default function AdminCustomers() {
  const [customers, setCustomers]           = useState<Customer[]>([]);
  const [customerStats, setCustomerStats]   = useState<Record<string, CustomerStats>>({});
  const [loading, setLoading]               = useState(true);
  const [searchTerm, setSearchTerm]         = useState("");
  const [showDeactivated, setShowDeactivated] = useState(false);
  const { toast } = useToast();

  // Add / Edit
  const [showForm, setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // Deactivate
  const [showDeactivate, setShowDeactivate]     = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<Customer | null>(null);
  const [deactivateConfirm, setDeactivateConfirm] = useState("");
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Reactivate
  const [showReactivate, setShowReactivate]     = useState(false);
  const [reactivateTarget, setReactivateTarget] = useState<Customer | null>(null);
  const [reactivateLoading, setReactivateLoading] = useState(false);

  // Clean DB
  const [showClean, setShowClean]     = useState(false);
  const [cleanConfirm, setCleanConfirm] = useState("");
  const [cleanLoading, setCleanLoading] = useState(false);

  useEffect(() => { loadCustomers(); }, []);

  /* ---------- data loading ---------- */
  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const custs = (data as Customer[]) || [];
      setCustomers(custs);

      // Load related stats for each customer
      const stats: Record<string, CustomerStats> = {};
      for (const c of custs) {
        const [partners, invoices, schedules] = await Promise.all([
          supabase.from("customer_partner_links").select("id", { count: "exact", head: true }).eq("customer_id", c.id),
          supabase.from("invoices").select("id", { count: "exact", head: true }).eq("customer_id", c.id),
          supabase.from("schedules").select("id", { count: "exact", head: true }).eq("customer_id", c.id),
        ]);
        stats[c.id] = {
          partnersCount: partners.count ?? 0,
          invoicesCount: invoices.count ?? 0,
          schedulesCount: schedules.count ?? 0,
        };
      }
      setCustomerStats(stats);
    } catch (err: any) {
      toast({ title: "Error loading customers", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- add / edit ---------- */
  const openAddForm = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEditForm = (c: Customer) => {
    setEditTarget(c);
    setForm({
      name:          c.name,
      org_number:    c.org_number ?? "",
      contact_email: c.contact_email ?? "",
      finance_email: c.finance_email ?? "",
      phone:         c.phone ?? "",
      address:       c.address ?? "",
      api_type:      c.api_type ?? "manual",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setFormLoading(true);
    try {
      const payload = {
        name:          form.name.trim(),
        org_number:    form.org_number.trim() || null,
        contact_email: form.contact_email.trim().toLowerCase() || null,
        finance_email: form.finance_email.trim().toLowerCase() || null,
        phone:         form.phone.trim() || null,
        address:       form.address.trim() || null,
        api_type:      form.api_type,
      };

      if (editTarget) {
        const { error } = await supabase
          .from("customers")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editTarget.id);
        if (error) throw error;
        toast({ title: "Customer updated", description: `${payload.name} has been updated.` });
      } else {
        const { error } = await supabase.from("customers").insert(payload);
        if (error) throw error;
        toast({ title: "Customer added", description: `${payload.name} has been added.` });
      }
      setShowForm(false);
      setEditTarget(null);
      loadCustomers();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  /* ---------- deactivate (soft delete) ---------- */
  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    if (deactivateConfirm !== deactivateTarget.name) {
      toast({ title: "Name does not match", description: `Type exactly: ${deactivateTarget.name}`, variant: "destructive" });
      return;
    }
    setDeactivateLoading(true);
    try {
      const { error } = await supabase
        .from("customers")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", deactivateTarget.id);
      if (error) throw error;
      toast({ title: "Customer deactivated", description: `${deactivateTarget.name} has been deactivated and archived.` });
      setShowDeactivate(false);
      setDeactivateTarget(null);
      setDeactivateConfirm("");
      loadCustomers();
    } catch (err: any) {
      toast({ title: "Deactivation failed", description: err.message, variant: "destructive" });
    } finally {
      setDeactivateLoading(false);
    }
  };

  /* ---------- reactivate ---------- */
  const handleReactivate = async () => {
    if (!reactivateTarget) return;
    setReactivateLoading(true);
    try {
      const { error } = await supabase
        .from("customers")
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq("id", reactivateTarget.id);
      if (error) throw error;
      toast({ title: "Customer reactivated", description: `${reactivateTarget.name} is now active.` });
      setShowReactivate(false);
      setReactivateTarget(null);
      loadCustomers();
    } catch (err: any) {
      toast({ title: "Reactivation failed", description: err.message, variant: "destructive" });
    } finally {
      setReactivateLoading(false);
    }
  };

  /* ---------- clean database ---------- */
  const handleCleanDatabase = async () => {
    if (cleanConfirm !== "CLEAN DATABASE") {
      toast({ title: "Confirmation does not match", description: 'Type exactly: CLEAN DATABASE', variant: "destructive" });
      return;
    }
    setCleanLoading(true);
    try {
      // Delete in dependency order
      await supabase.from("customer_partner_links").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("invoices").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("schedule_assignments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("schedules").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const { error } = await supabase.from("customers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast({ title: "Database cleaned", description: "All customer data has been permanently deleted." });
      setShowClean(false);
      setCleanConfirm("");
      loadCustomers();
    } catch (err: any) {
      toast({ title: "Clean failed", description: err.message, variant: "destructive" });
    } finally {
      setCleanLoading(false);
    }
  };

  /* ---------- derived data ---------- */
  const activeCustomers      = customers.filter(c => c.is_active !== false);
  const deactivatedCustomers = customers.filter(c => c.is_active === false);

  const filtered = activeCustomers.filter(c => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return [c.name, c.org_number, c.contact_email, c.api_type, c.address]
      .filter(Boolean).join(" ").toLowerCase().includes(s);
  });

  const totalPartners  = Object.values(customerStats).reduce((s, v) => s + v.partnersCount, 0);
  const totalInvoices  = Object.values(customerStats).reduce((s, v) => s + v.invoicesCount, 0);
  const apiConnected   = activeCustomers.filter(c => c.api_type && c.api_type !== "manual").length;

  /* ---------- render ---------- */
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-base text-muted-foreground mt-1">
            {activeCustomers.length} active customer{activeCustomers.length !== 1 ? "s" : ""}
            {deactivatedCustomers.length > 0 && ` · ${deactivatedCustomers.length} deactivated`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline" size="lg"
            className="border-destructive/40 text-destructive hover:bg-destructive/5 hover:border-destructive"
            onClick={() => { setCleanConfirm(""); setShowClean(true); }}
          >
            <DatabaseZap className="mr-2 h-4 w-4" /> Clean Database
          </Button>
          <Button size="lg" onClick={openAddForm}>
            <Plus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-5 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Active Customers</p><p className="text-3xl font-bold text-primary">{activeCustomers.length}</p></div><Building2 className="h-8 w-8 text-primary opacity-20" /></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">API Connected</p><p className="text-3xl font-bold text-emerald-600">{apiConnected}</p></div><Wifi className="h-8 w-8 text-emerald-600 opacity-20" /></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Linked Partners</p><p className="text-3xl font-bold text-blue-600">{totalPartners}</p></div><Users className="h-8 w-8 text-blue-600 opacity-20" /></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Invoices</p><p className="text-3xl font-bold text-amber-600">{totalInvoices}</p></div><FileText className="h-8 w-8 text-amber-600 opacity-20" /></CardContent></Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, org number, email, platform..." className="pl-9 h-11" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {/* Customer Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No customers found</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first customer to get started.</p>
            <Button className="mt-4" onClick={openAddForm}><Plus className="mr-2 h-4 w-4" /> Add Customer</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(c => {
            const st = customerStats[c.id] || { partnersCount: 0, invoicesCount: 0, schedulesCount: 0 };
            const isApi = c.api_type && c.api_type !== "manual";
            return (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold">{c.name}</h3>
                          <Badge variant={isApi ? "default" : "secondary"} className="flex items-center gap-1">
                            {isApi ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                            {isApi ? "API" : "Manual"}
                          </Badge>
                          {c.api_type && (
                            <Badge variant="outline">{API_TYPE_LABELS[c.api_type] ?? c.api_type}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          {c.org_number && <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{c.org_number}</span>}
                          {c.contact_email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.contact_email}</span>}
                          {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditForm(c)}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Deactivate customer"
                        onClick={() => { setDeactivateTarget(c); setDeactivateConfirm(""); setShowDeactivate(true); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Partners</p>
                      <p className="font-semibold text-lg">{st.partnersCount}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Invoices</p>
                      <p className="font-semibold text-lg">{st.invoicesCount}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Schedules</p>
                      <p className="font-semibold text-lg">{st.schedulesCount}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Integration</p>
                      <p className="font-semibold">{API_TYPE_LABELS[c.api_type ?? ""] ?? "Manual"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Added</p>
                      <p className="font-semibold">{new Date(c.created_at).toLocaleDateString("sv-SE")}</p>
                    </div>
                  </div>

                  {/* Address */}
                  {c.address && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-3">
                      <MapPin className="h-3.5 w-3.5" /> {c.address}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Deactivated archive */}
      {deactivatedCustomers.length > 0 && (
        <div>
          <button
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
            onClick={() => setShowDeactivated(v => !v)}
          >
            {showDeactivated ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Deactivated Customers ({deactivatedCustomers.length})
          </button>
          {showDeactivated && (
            <Card className="border-dashed border-gray-300">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Customer</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deactivatedCustomers.map(c => (
                      <TableRow key={c.id} className="opacity-60 hover:opacity-80">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                              {c.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{c.name}</p>
                              {c.org_number && <p className="text-xs text-muted-foreground">{c.org_number}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                            {API_TYPE_LABELS[c.api_type ?? ""] ?? "Manual"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.contact_email ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString("sv-SE")}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost" size="sm"
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => { setReactivateTarget(c); setShowReactivate(true); }}
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reactivate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========== DIALOGS ========== */}

      {/* Add / Edit Customer Dialog */}
      <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditTarget(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editTarget ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              {editTarget ? "Edit Customer" : "Add New Customer"}
            </DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Update customer details. Changes affect all linked invoices, schedules, and partner links."
                : "Add a new delivery platform customer. You can configure API integration after creation."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Customer Name <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Wolt AB" />
              </div>
              <div className="space-y-1.5">
                <Label>Org Number</Label>
                <Input value={form.org_number} onChange={e => setForm(f => ({ ...f, org_number: e.target.value }))} placeholder="559000-1234" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Contact Email</Label>
                <Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="ops@wolt.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Finance Email</Label>
                <Input type="email" value={form.finance_email} onChange={e => setForm(f => ({ ...f, finance_email: e.target.value }))} placeholder="finance@wolt.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+46 8 123 4567" />
              </div>
              <div className="space-y-1.5">
                <Label>Platform / API Type</Label>
                <Select value={form.api_type} onValueChange={v => setForm(f => ({ ...f, api_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wolt">Wolt</SelectItem>
                    <SelectItem value="foodora">Foodora</SelectItem>
                    <SelectItem value="uber_eats">Uber Eats</SelectItem>
                    <SelectItem value="bolt_food">Bolt Food</SelectItem>
                    <SelectItem value="manual">Manual / CSV</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Textarea rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Klarabergsgatan 60, 111 21 Stockholm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={formLoading}>
              {formLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : editTarget ? <Pencil className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
              {editTarget ? "Save Changes" : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Dialog */}
      <Dialog open={showDeactivate} onOpenChange={v => { setShowDeactivate(v); if (!v) setDeactivateConfirm(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Deactivate Customer
            </DialogTitle>
            <DialogDescription>
              This customer and all its linked data (invoices, schedules, partner links) will be archived. You can reactivate at any time.
            </DialogDescription>
          </DialogHeader>
          {deactivateTarget && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <p className="text-sm font-semibold">{deactivateTarget.name}</p>
                <p className="text-xs text-muted-foreground">{deactivateTarget.contact_email ?? "No email"}</p>
                {deactivateTarget.org_number && <p className="text-xs text-muted-foreground mt-0.5">Org: {deactivateTarget.org_number}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Type <strong>{deactivateTarget.name}</strong> to confirm:</Label>
                <Input
                  value={deactivateConfirm}
                  onChange={e => setDeactivateConfirm(e.target.value)}
                  placeholder={deactivateTarget.name}
                  className={deactivateConfirm && deactivateConfirm !== deactivateTarget.name ? "border-destructive" : ""}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeactivate(false); setDeactivateConfirm(""); }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={deactivateLoading || !deactivateTarget || deactivateConfirm !== deactivateTarget.name}
            >
              {deactivateLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />}
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate Dialog */}
      <Dialog open={showReactivate} onOpenChange={setShowReactivate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <RotateCcw className="h-5 w-5" /> Reactivate Customer
            </DialogTitle>
            <DialogDescription>
              This will restore the customer to active status. All linked data will become accessible again.
            </DialogDescription>
          </DialogHeader>
          {reactivateTarget && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-sm font-semibold">{reactivateTarget.name}</p>
              <p className="text-xs text-muted-foreground">{reactivateTarget.contact_email ?? "No email"}</p>
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
              Reactivate Customer
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
              <strong className="text-destructive">Pre-handover only.</strong> Permanently deletes <strong>all</strong> customers, invoices, schedules, and partner links. No undo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-sm space-y-1">
              <p className="font-semibold text-destructive">What will be deleted:</p>
              <p className="text-muted-foreground">- All customers ({customers.length} records)</p>
              <p className="text-muted-foreground">- All customer invoices</p>
              <p className="text-muted-foreground">- All schedules & assignments</p>
              <p className="text-muted-foreground">- All customer-partner links</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Type <strong>CLEAN DATABASE</strong> to confirm:</Label>
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
            <Button variant="destructive" onClick={handleCleanDatabase} disabled={cleanLoading || cleanConfirm !== "CLEAN DATABASE"}>
              {cleanLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <DatabaseZap className="mr-1.5 h-4 w-4" />}
              Wipe All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
