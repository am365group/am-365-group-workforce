import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Users, MapPin, Clock, Building2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Schedule {
  id: string;
  customer_id: string | null;
  title: string;
  description: string | null;
  start_datetime: string;
  end_datetime: string;
  location: string | null;
  max_partners: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customers: { name: string } | null;
  schedule_assignments: { id: string; status: string }[];
}

interface Customer {
  id: string;
  name: string;
}

export default function AdminScheduling() {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create shift form state
  const [form, setForm] = useState({
    customer_id: "",
    title: "",
    start_datetime: "",
    end_datetime: "",
    location: "",
    max_partners: 1,
    notes: "",
  });

  const fetchSchedules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("schedules")
      .select("*, customers(name), schedule_assignments(id, status)")
      .order("start_datetime", { ascending: true });

    if (error) {
      toast({ title: "Error loading schedules", description: error.message, variant: "destructive" });
    } else {
      setSchedules((data as unknown as Schedule[]) || []);
    }
    setLoading(false);
  };

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("id, name")
      .order("name");

    if (error) {
      toast({ title: "Error loading customers", description: error.message, variant: "destructive" });
    } else {
      setCustomers(data || []);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchCustomers();
  }, []);

  const handleCreateShift = async () => {
    if (!form.customer_id || !form.title || !form.start_datetime || !form.end_datetime) {
      toast({ title: "Missing fields", description: "Customer, title, start and end times are required.", variant: "destructive" });
      return;
    }
    setSaving(true);

    const { error } = await supabase.from("schedules").insert({
      customer_id: form.customer_id,
      title: form.title,
      start_datetime: form.start_datetime,
      end_datetime: form.end_datetime,
      location: form.location || null,
      max_partners: form.max_partners,
      notes: form.notes || null,
    });

    setSaving(false);

    if (error) {
      toast({ title: "Error creating shift", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Shift created" });
      setDialogOpen(false);
      setForm({ customer_id: "", title: "", start_datetime: "", end_datetime: "", location: "", max_partners: 1, notes: "" });
      fetchSchedules();
    }
  };

  // Filter schedules by customer
  const filtered = selectedCustomerId === "all"
    ? schedules
    : schedules.filter((s) => s.customer_id === selectedCustomerId);

  // Compute filled count (exclude declined)
  const filledCount = (s: Schedule) =>
    s.schedule_assignments.filter((a) => a.status !== "declined").length;

  // Compute stats
  const totalShifts = filtered.length;
  const fullyStaffed = filtered.filter((s) => filledCount(s) >= s.max_partners).length;
  const openPositions = filtered.reduce((sum, s) => sum + Math.max(0, s.max_partners - filledCount(s)), 0);
  const criticalGaps = filtered.filter((s) => s.max_partners > 0 && filledCount(s) / s.max_partners < 0.5).length;

  const stats = [
    { label: "Total Shifts", value: String(totalShifts), color: "text-foreground" },
    { label: "Fully Staffed", value: String(fullyStaffed), color: "text-primary" },
    { label: "Open Positions", value: String(openPositions), color: "text-warning" },
    { label: "Critical Gaps", value: String(criticalGaps), color: "text-destructive" },
  ];

  // Date formatting helpers (Swedish locale)
  const formatDatePart = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  };

  const formatDayName = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("sv-SE", { weekday: "long" });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  };

  const getStatus = (s: Schedule) => {
    const filled = filledCount(s);
    if (s.max_partners > 0 && filled >= s.max_partners) return "Full";
    if (s.max_partners > 0 && filled / s.max_partners < 0.5) return "Critical";
    return "Open";
  };

  const getBarColor = (status: string) => {
    if (status === "Full") return "bg-primary";
    if (status === "Critical") return "bg-destructive";
    return "bg-warning";
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schedule Management</h1>
          <p className="text-base text-muted-foreground mt-1">Manage partner shifts, assignments, and coverage</p>
        </div>
        <div className="flex gap-3 items-center">
          <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All customers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All customers</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="lg" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Shift
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5 text-center">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Shifts */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No schedules found</h3>
            <p className="text-muted-foreground">Create a shift to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const filled = filledCount(s);
            const status = getStatus(s);
            const fillPct = s.max_partners > 0 ? (filled / s.max_partners) * 100 : 0;

            return (
              <Card key={s.id} className={`hover:shadow-md transition-shadow ${status === "Critical" ? "border-destructive/30" : ""}`}>
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="text-center min-w-[70px]">
                      <p className="font-bold text-lg">{formatDatePart(s.start_datetime)}</p>
                      <p className="text-sm text-muted-foreground capitalize">{formatDayName(s.start_datetime)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-base">{s.title}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" /> {formatTime(s.start_datetime)}–{formatTime(s.end_datetime)}
                      </p>
                      {s.location && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" /> {s.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    {s.customers?.name && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {s.customers.name}
                      </Badge>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div className="w-24">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold">{filled}</span>
                          <span className="text-muted-foreground">/ {s.max_partners}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getBarColor(status)}`}
                            style={{ width: `${Math.min(fillPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <Badge variant={status === "Full" ? "default" : status === "Critical" ? "destructive" : "secondary"}>
                      {status === "Critical" && <AlertCircle className="h-3 w-3 mr-1" />}
                      {status}
                    </Badge>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Shift Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Shift</DialogTitle>
            <DialogDescription>Add a new shift to the schedule.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Morning Delivery Shift" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start *</Label>
                <Input type="datetime-local" value={form.start_datetime} onChange={(e) => setForm({ ...form, start_datetime: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End *</Label>
                <Input type="datetime-local" value={form.end_datetime} onChange={(e) => setForm({ ...form, end_datetime: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Södermalm" />
            </div>
            <div className="space-y-2">
              <Label>Max Partners</Label>
              <Input type="number" min={1} value={form.max_partners} onChange={(e) => setForm({ ...form, max_partners: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateShift} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
