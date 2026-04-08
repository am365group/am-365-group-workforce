import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileText, Plus, Send, Download, Eye, DollarSign,
  Building2, Calendar, CheckCircle, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/* ---------- types ---------- */
type Invoice = {
  id: string;
  customer_id: string;
  period_year: number;
  period_month: number;
  invoice_number: string | null;
  total_hours: number | null;
  total_deliveries: number | null;
  subtotal: number;
  platform_margin: number | null;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  pdf_storage_path: string | null;
  sent_at: string | null;
  paid_at: string | null;
  due_date: string | null;
  fortnox_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customers: { name: string } | null;
};

type Customer = {
  id: string;
  name: string;
};

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  paid: "default",
  sent: "secondary",
  draft: "outline",
  overdue: "destructive",
};

const formatSEK = (amount: number): string =>
  amount.toLocaleString("sv-SE", { style: "currency", currency: "SEK", minimumFractionDigits: 0, maximumFractionDigits: 0 });

const EMPTY_FORM = {
  customer_id: "",
  period_month: new Date().getMonth() + 1,
  period_year: new Date().getFullYear(),
  invoice_number: "",
  subtotal: 0,
  vat_rate: 25,
  notes: "",
  due_date: "",
};

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState("all");
  const { toast } = useToast();

  // Create dialog
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  useEffect(() => {
    loadData();
  }, []);

  /* ---------- data loading ---------- */
  const loadData = async () => {
    setLoading(true);
    try {
      const [invoiceRes, customerRes] = await Promise.all([
        supabase
          .from("invoices")
          .select("*, customers(name)")
          .order("created_at", { ascending: false }),
        supabase
          .from("customers")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),
      ]);
      if (invoiceRes.error) throw invoiceRes.error;
      if (customerRes.error) throw customerRes.error;
      setInvoices((invoiceRes.data as Invoice[]) || []);
      setCustomers((customerRes.data as Customer[]) || []);
    } catch (err: any) {
      toast({ title: "Error loading invoices", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- create invoice ---------- */
  const generateInvoiceNumber = (): string => {
    const year = form.period_year;
    const existing = invoices.filter(
      (inv) => inv.invoice_number?.startsWith(`INV-${year}-`)
    );
    const maxNum = existing.reduce((max, inv) => {
      const parts = inv.invoice_number?.split("-");
      const n = parts ? parseInt(parts[2], 10) : 0;
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    return `INV-${year}-${String(maxNum + 1).padStart(3, "0")}`;
  };

  const openCreateForm = () => {
    const defaults = { ...EMPTY_FORM };
    setForm(defaults);
    setShowForm(true);
  };

  const computedVatAmount = Math.round(form.subtotal * (form.vat_rate / 100));
  const computedTotalAmount = form.subtotal + computedVatAmount;

  const handleCreate = async () => {
    if (!form.customer_id) {
      toast({ title: "Customer is required", variant: "destructive" });
      return;
    }
    if (form.subtotal <= 0) {
      toast({ title: "Subtotal must be greater than 0", variant: "destructive" });
      return;
    }
    setFormLoading(true);
    try {
      const invoiceNumber = form.invoice_number.trim() || generateInvoiceNumber();
      const payload = {
        customer_id: form.customer_id,
        period_month: form.period_month,
        period_year: form.period_year,
        invoice_number: invoiceNumber,
        subtotal: form.subtotal,
        vat_rate: form.vat_rate,
        vat_amount: computedVatAmount,
        total_amount: computedTotalAmount,
        due_date: form.due_date || null,
        notes: form.notes.trim() || null,
        status: "draft" as const,
      };
      const { error } = await supabase.from("invoices").insert(payload);
      if (error) throw error;
      toast({ title: "Invoice created", description: `${invoiceNumber} has been created as draft.` });
      setShowForm(false);
      loadData();
    } catch (err: any) {
      toast({ title: "Failed to create invoice", description: err.message, variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  /* ---------- derived data ---------- */
  const filtered = selectedCustomerId === "all"
    ? invoices
    : invoices.filter((inv) => inv.customer_id === selectedCustomerId);

  const currentYear = new Date().getFullYear();
  const ytdInvoices = invoices.filter((inv) => inv.period_year === currentYear);

  const totalInvoicedYTD = ytdInvoices.reduce((s, inv) => s + (inv.total_amount ?? 0), 0);
  const outstandingAmount = invoices
    .filter((inv) => inv.status === "draft" || inv.status === "sent")
    .reduce((s, inv) => s + (inv.total_amount ?? 0), 0);
  const paidYTD = ytdInvoices
    .filter((inv) => inv.status === "paid")
    .reduce((s, inv) => s + (inv.total_amount ?? 0), 0);

  const stats = [
    { label: "Total Invoiced (YTD)", value: formatSEK(totalInvoicedYTD), icon: DollarSign },
    { label: "Outstanding", value: formatSEK(outstandingAmount), icon: FileText },
    { label: "Paid (YTD)", value: formatSEK(paidYTD), icon: CheckCircle },
    { label: "Average Per Invoice", value: invoices.length > 0 ? formatSEK(Math.round(totalInvoicedYTD / (ytdInvoices.length || 1))) : "0 SEK", icon: Calendar },
  ];

  /* ---------- render ---------- */
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoice Management</h1>
          <p className="text-base text-muted-foreground mt-1">
            Create and manage customer invoices for Wolt, Foodora, and other platforms
          </p>
        </div>
        <Button size="lg" onClick={openCreateForm}>
          <Plus className="mr-2 h-4 w-4" /> Create Invoice
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-5 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5 text-center">
              <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invoice Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">All Invoices</CardTitle>
          <div className="flex items-center gap-3">
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No invoices found</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first invoice to get started.</p>
              <Button className="mt-4" onClick={openCreateForm}>
                <Plus className="mr-2 h-4 w-4" /> Create Invoice
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm">Invoice</TableHead>
                  <TableHead className="text-sm">Customer</TableHead>
                  <TableHead className="text-sm">Period</TableHead>
                  <TableHead className="text-sm">Amount (ex. VAT)</TableHead>
                  <TableHead className="text-sm">VAT</TableHead>
                  <TableHead className="text-sm">Total</TableHead>
                  <TableHead className="text-sm">Due</TableHead>
                  <TableHead className="text-sm">Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">
                      {inv.invoice_number ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {inv.customers?.name ?? "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {MONTH_NAMES[inv.period_month] ?? inv.period_month} {inv.period_year}
                    </TableCell>
                    <TableCell>{formatSEK(inv.subtotal)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatSEK(inv.vat_amount)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatSEK(inv.total_amount)}
                    </TableCell>
                    <TableCell>
                      {inv.due_date
                        ? new Date(inv.due_date).toLocaleDateString("sv-SE")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[inv.status] ?? "outline"}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {inv.status === "draft" && (
                          <Button variant="ghost" size="icon" title="Send">
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="Download">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ========== CREATE INVOICE DIALOG ========== */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create Invoice
            </DialogTitle>
            <DialogDescription>
              Create a new invoice for a customer. The invoice will be saved as a draft.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Customer */}
            <div className="space-y-1.5">
              <Label>Customer <span className="text-destructive">*</span></Label>
              <Select value={form.customer_id} onValueChange={(v) => setForm((f) => ({ ...f, customer_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Period */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Period Month</Label>
                <Select
                  value={String(form.period_month)}
                  onValueChange={(v) => setForm((f) => ({ ...f, period_month: parseInt(v, 10) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.slice(1).map((name, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Period Year</Label>
                <Input
                  type="number"
                  value={form.period_year}
                  onChange={(e) => setForm((f) => ({ ...f, period_year: parseInt(e.target.value, 10) || currentYear }))}
                />
              </div>
            </div>

            {/* Invoice number */}
            <div className="space-y-1.5">
              <Label>Invoice Number</Label>
              <Input
                value={form.invoice_number}
                onChange={(e) => setForm((f) => ({ ...f, invoice_number: e.target.value }))}
                placeholder={`Auto: ${generateInvoiceNumber()}`}
              />
              <p className="text-xs text-muted-foreground">Leave blank to auto-generate.</p>
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Subtotal (SEK) <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  value={form.subtotal || ""}
                  onChange={(e) => setForm((f) => ({ ...f, subtotal: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>VAT Rate (%)</Label>
                <Input
                  type="number"
                  value={form.vat_rate}
                  onChange={(e) => setForm((f) => ({ ...f, vat_rate: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* Computed amounts */}
            {form.subtotal > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT ({form.vat_rate}%)</span>
                  <span className="font-medium">{formatSEK(computedVatAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">{formatSEK(computedTotalAmount)}</span>
                </div>
              </div>
            )}

            {/* Due date */}
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={formLoading}>
              {formLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
