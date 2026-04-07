import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Truck, Upload, Download, Trash2, AlertCircle, CheckCircle,
  Loader2, Search, ChevronDown, ChevronUp, FileText, Info,
  RefreshCw, Wifi, WifiOff, AlertTriangle, FileSpreadsheet, Database,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type WoltRow = {
  id: string;
  import_batch_id: string;
  period_label: string | null;
  imported_at: string;
  partner_name: string;
  phone: string | null;
  email: string | null;
  wolt_id: string | null;
  team: string | null;
  weekly_max_hours: string | null;
  amount_excl_tips: number;
  amount_incl_tips: number;
  tips: number;
  adjustments: number;
  task_related_amount: number;
};

type ParsedRow = Omit<WoltRow, "id" | "import_batch_id" | "imported_at"> & {
  _rowNum: number;
  _warnings: string[];
};

type Batch = {
  import_batch_id: string;
  period_label: string | null;
  imported_at: string;
  row_count: number;
  total_amount: number;
  total_tips: number;
};

// Parse Swedish/Danish currency: "kr1.669,7" → 1669.70
function parseSekAmount(raw: string): number {
  if (!raw || raw === "-") return 0;
  const cleaned = raw.replace(/kr/gi, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

// Parse Wolt financial CSV (semicolon-delimited)
function parseWoltFinancialCsv(text: string): ParsedRow[] {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(";");
    if (cols.length < 7) continue;
    const warnings: string[] = [];
    const name = cols[0]?.trim() ?? "";
    if (!name) warnings.push("Missing partner name");
    const amtExcl = parseSekAmount(cols[6] ?? "");
    if (amtExcl === 0 && cols[6]?.trim() && cols[6]?.trim() !== "0") warnings.push("Could not parse amount");
    rows.push({
      _rowNum: i,
      _warnings: warnings,
      period_label: null,
      partner_name: name,
      phone: cols[1]?.trim() || null,
      email: cols[2]?.trim() || null,
      wolt_id: cols[3]?.trim() || null,
      team: cols[4]?.trim() || null,
      weekly_max_hours: cols[5]?.trim() || null,
      amount_excl_tips: amtExcl,
      amount_incl_tips: parseSekAmount(cols[7] ?? ""),
      tips: parseSekAmount(cols[8] ?? ""),
      adjustments: parseSekAmount(cols[9] ?? ""),
      task_related_amount: parseSekAmount(cols[10] ?? ""),
    });
  }
  return rows;
}

function exportToCsv(rows: WoltRow[], filename: string) {
  const header = "Partner Name;Phone;Email;Wolt ID;Team;Weekly Max Hours;Amount Excl Tips;Amount Incl Tips;Tips;Adjustments;Task Related;Imported At;Period";
  const lines = rows.map(r =>
    [r.partner_name, r.phone ?? "", r.email ?? "", r.wolt_id ?? "", r.team ?? "",
     r.weekly_max_hours ?? "", r.amount_excl_tips, r.amount_incl_tips,
     r.tips, r.adjustments, r.task_related_amount, r.imported_at, r.period_label ?? ""].join(";")
  );
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const CSV_SAMPLE_HEADER = "Name;Phone;Email;Id;Team;Weekly max hours;Total Amount (w.o. tips);Total Amount (w. tips);Tips;Adjustments;Task Related";
const CSV_SAMPLE_ROW = "Johan Andersson;+46701234567;johan@example.com;wlt_abc123;Stockholm;40;kr4.500,00;kr4.800,00;kr300,00;kr0,00;kr4.500,00";

export default function AdminDeliveryData() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [rows, setRows] = useState<WoltRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [importTab, setImportTab] = useState("csv");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteBatchId, setDeleteBatchId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [parsePreview, setParsePreview] = useState<ParsedRow[]>([]);
  const [periodLabel, setPeriodLabel] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("wolt_delivery_imports")
        .select("*")
        .order("imported_at", { ascending: false });
      if (error) throw error;
      const all = (data as WoltRow[]) || [];
      setRows(all);

      const batchMap: Record<string, Batch> = {};
      for (const r of all) {
        if (!batchMap[r.import_batch_id]) {
          batchMap[r.import_batch_id] = {
            import_batch_id: r.import_batch_id,
            period_label: r.period_label,
            imported_at: r.imported_at,
            row_count: 0,
            total_amount: 0,
            total_tips: 0,
          };
        }
        batchMap[r.import_batch_id].row_count++;
        batchMap[r.import_batch_id].total_amount += r.amount_excl_tips;
        batchMap[r.import_batch_id].total_tips += r.tips;
      }
      setBatches(Object.values(batchMap).sort((a, b) => b.imported_at.localeCompare(a.imported_at)));
    } catch (err: any) {
      toast({ title: "Error loading data", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setParsePreview([]);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        const parsed = parseWoltFinancialCsv(text);
        setParsePreview(parsed);
      } catch {
        toast({ title: "Parse error", description: "Failed to read file. Ensure UTF-8 CSV with ; delimiter.", variant: "destructive" });
      }
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  };

  const handleImport = async () => {
    const validRows = parsePreview.filter(r => r._warnings.length === 0 || r.partner_name);
    if (!validRows.length) return;
    setImporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const batchId = crypto.randomUUID();
      const toInsert = validRows.map(({ _rowNum: _, _warnings: __, ...row }) => ({
        ...row,
        import_batch_id: batchId,
        period_label: periodLabel || null,
        imported_by: user?.id ?? null,
      }));

      const { error } = await supabase.from("wolt_delivery_imports").insert(toInsert);
      if (error) throw error;

      const skipped = parsePreview.length - validRows.length;
      toast({
        title: "Import successful!",
        description: `${toInsert.length} records imported${skipped > 0 ? `, ${skipped} rows skipped (errors)` : ""}.`,
      });
      setShowImportDialog(false);
      setSelectedFile(null); setParsePreview([]); setPeriodLabel("");
      loadData();
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteBatchId) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("wolt_delivery_imports")
        .delete()
        .eq("import_batch_id", deleteBatchId);
      if (error) throw error;
      toast({ title: "Dataset deleted" });
      setShowDeleteDialog(false); setDeleteBatchId(null);
      loadData();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleExportBatch = (batchId: string) => {
    const batchRows = rows.filter(r => r.import_batch_id === batchId);
    const batch = batches.find(b => b.import_batch_id === batchId);
    exportToCsv(batchRows, `wolt-delivery-${batch?.period_label ?? batchId.slice(0, 8)}.csv`);
  };

  const handleExportAll = () => {
    exportToCsv(rows, `wolt-delivery-all-${new Date().toISOString().slice(0,10)}.csv`);
  };

  const totalAmount = rows.reduce((s, r) => s + r.amount_excl_tips, 0);
  const totalAmountInclTips = rows.reduce((s, r) => s + r.amount_incl_tips, 0);
  const totalTips = rows.reduce((s, r) => s + r.tips, 0);
  const totalAdjustments = rows.reduce((s, r) => s + r.adjustments, 0);
  const totalPartners = new Set(rows.map(r => r.wolt_id).filter(Boolean)).size;
  const totalTeams = new Set(rows.map(r => r.team).filter(Boolean)).size;

  const fmtSek = (n: number) => `${n.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SEK`;

  const getBatchRows = (batchId: string) =>
    rows.filter(r => r.import_batch_id === batchId && (
      !searchTerm || [r.partner_name, r.email, r.team, r.wolt_id].some(v => v?.toLowerCase().includes(searchTerm.toLowerCase()))
    ));

  const errorRows = parsePreview.filter(r => r._warnings.length > 0);
  const validRows = parsePreview.filter(r => r._warnings.length === 0 || r.partner_name);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Delivery Data</h1>
          <p className="text-base text-muted-foreground mt-1">Wolt partner financial data — import, review, and export</p>
        </div>
        <div className="flex gap-2">
          {rows.length > 0 && (
            <Button variant="outline" size="lg" onClick={handleExportAll}>
              <Download className="mr-2 h-4 w-4" /> Export All
            </Button>
          )}
          <Button size="lg" onClick={() => setShowImportDialog(true)}>
            <Upload className="mr-2 h-4 w-4" /> Import Data
          </Button>
        </div>
      </div>

      {/* API Sync status (placeholder) */}
      <Card className="border-dashed">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <WifiOff className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Wolt API Sync</p>
                <p className="text-sm text-muted-foreground">Automatic data sync not configured — Wolt API credentials required.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-muted-foreground">Not connected</Badge>
              <Button variant="outline" size="sm" disabled title="Requires Wolt API credentials">
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Sync Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card><CardContent className="p-5 text-center"><p className="text-2xl font-bold">{rows.length}</p><p className="text-xs text-muted-foreground mt-1">Total Records</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-2xl font-bold">{batches.length}</p><p className="text-xs text-muted-foreground mt-1">Import Batches</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-2xl font-bold">{totalPartners}</p><p className="text-xs text-muted-foreground mt-1">Unique Partners</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-2xl font-bold">{totalTeams}</p><p className="text-xs text-muted-foreground mt-1">Cities / Teams</p></CardContent></Card>
        <Card className="md:col-span-1 lg:col-span-1"><CardContent className="p-5 text-center"><p className="text-lg font-bold text-primary">{fmtSek(totalAmount)}</p><p className="text-xs text-muted-foreground mt-1">Total (excl. tips)</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-lg font-bold text-amber-500">{fmtSek(totalTips)}</p><p className="text-xs text-muted-foreground mt-1">Total Tips</p></CardContent></Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search partner, team, email..."
          className="pl-9"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Import batches */}
      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : batches.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <Truck className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No delivery data yet</h2>
            <p className="text-muted-foreground mb-6">Import a Wolt financial export CSV to get started.</p>
            <Button onClick={() => setShowImportDialog(true)}>
              <Upload className="mr-2 h-4 w-4" /> Import First Dataset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {batches.map(batch => {
            const expanded = expandedBatch === batch.import_batch_id;
            const batchData = getBatchRows(batch.import_batch_id);
            return (
              <Card key={batch.import_batch_id} className={expanded ? "border-primary/30" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setExpandedBatch(expanded ? null : batch.import_batch_id)}
                      className="flex items-center gap-3 text-left"
                    >
                      {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                      <div>
                        <p className="font-semibold text-base">
                          {batch.period_label ?? "Import " + new Date(batch.imported_at).toLocaleDateString("sv-SE")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {batch.row_count} partners · {fmtSek(batch.total_amount)} excl. tips · {fmtSek(batch.total_tips)} tips · Imported {new Date(batch.imported_at).toLocaleString("sv-SE")}
                        </p>
                      </div>
                    </button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleExportBatch(batch.import_batch_id)}>
                        <Download className="h-3.5 w-3.5 mr-1" /> Export
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => { setDeleteBatchId(batch.import_batch_id); setShowDeleteDialog(true); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {expanded && (
                  <CardContent className="pt-0 p-0">
                    {batchData.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">No results matching search.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Partner Name</TableHead>
                              <TableHead>Wolt ID</TableHead>
                              <TableHead>Team / City</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead className="text-right">Excl. Tips</TableHead>
                              <TableHead className="text-right">Incl. Tips</TableHead>
                              <TableHead className="text-right">Tips</TableHead>
                              <TableHead className="text-right">Adjustments</TableHead>
                              <TableHead className="text-right">Task Related</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {batchData.map(r => (
                              <TableRow key={r.id} className="hover:bg-muted/40">
                                <TableCell>
                                  <p className="font-medium text-sm">{r.partner_name}</p>
                                  {r.email && <p className="text-xs text-muted-foreground">{r.email}</p>}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground font-mono">{r.wolt_id ?? "—"}</TableCell>
                                <TableCell className="text-sm">{r.team ?? "—"}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{r.phone ?? "—"}</TableCell>
                                <TableCell className="text-right font-medium text-sm">{fmtSek(r.amount_excl_tips)}</TableCell>
                                <TableCell className="text-right text-sm">{fmtSek(r.amount_incl_tips)}</TableCell>
                                <TableCell className="text-right text-sm text-amber-600">{r.tips > 0 ? fmtSek(r.tips) : "—"}</TableCell>
                                <TableCell className={`text-right text-sm ${r.adjustments < 0 ? "text-destructive" : r.adjustments > 0 ? "text-primary" : ""}`}>
                                  {r.adjustments !== 0 ? fmtSek(r.adjustments) : "—"}
                                </TableCell>
                                <TableCell className="text-right text-sm">{fmtSek(r.task_related_amount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={v => { setShowImportDialog(v); if (!v) { setSelectedFile(null); setParsePreview([]); setPeriodLabel(""); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Upload className="h-5 w-5 text-primary" /> Import Delivery Data
            </DialogTitle>
            <DialogDescription>
              Upload a Wolt financial export file or sync via API (when configured).
            </DialogDescription>
          </DialogHeader>

          <Tabs value={importTab} onValueChange={setImportTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="csv"><FileText className="h-3.5 w-3.5 mr-1.5" /> CSV Upload</TabsTrigger>
              <TabsTrigger value="excel"><FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" /> Excel Guide</TabsTrigger>
              <TabsTrigger value="api" disabled><Wifi className="h-3.5 w-3.5 mr-1.5" /> API Sync</TabsTrigger>
            </TabsList>

            <TabsContent value="csv" className="space-y-4 mt-4">
              {/* Format reference */}
              <div className="rounded-xl border overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Expected CSV format (semicolon-delimited)</span>
                </div>
                <div className="p-4 space-y-2">
                  <div className="overflow-x-auto">
                    <table className="text-xs font-mono w-full border-collapse">
                      <thead>
                        <tr>
                          {CSV_SAMPLE_HEADER.split(";").map((h, i) => (
                            <th key={i} className="text-left px-2 py-1.5 bg-muted/80 border border-border whitespace-nowrap text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {CSV_SAMPLE_ROW.split(";").map((v, i) => (
                            <td key={i} className="px-2 py-1.5 border border-border whitespace-nowrap">{v}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground">Amounts use Swedish format: <code className="bg-muted px-1 rounded">kr1.234,56</code> (period = thousands separator, comma = decimal)</p>
                </div>
              </div>

              {/* Period label */}
              <div className="space-y-1.5">
                <Label>Period label <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  placeholder="e.g. Week 14, 2026 or April 2026"
                  value={periodLabel}
                  onChange={e => setPeriodLabel(e.target.value)}
                />
              </div>

              {/* File picker */}
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileSelect} />
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                onClick={() => fileRef.current?.click()}
              >
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">{selectedFile ? selectedFile.name : "Click to select CSV file"}</p>
                <p className="text-sm text-muted-foreground mt-1">Wolt financial export (.csv) · UTF-8 encoding</p>
              </div>

              {/* Parse results */}
              {parsePreview.length > 0 && (
                <div className="space-y-3">
                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="font-semibold text-primary">{validRows.length}</p>
                        <p className="text-xs text-muted-foreground">Valid rows</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${errorRows.length > 0 ? "bg-destructive/10 border border-destructive/20" : "bg-muted/50 border"}`}>
                      <AlertCircle className={`h-4 w-4 shrink-0 ${errorRows.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
                      <div>
                        <p className={`font-semibold ${errorRows.length > 0 ? "text-destructive" : ""}`}>{errorRows.length}</p>
                        <p className="text-xs text-muted-foreground">Rows with warnings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border text-sm">
                      <Database className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-semibold">{fmtSek(parsePreview.reduce((s, r) => s + r.amount_excl_tips, 0))}</p>
                        <p className="text-xs text-muted-foreground">Total (excl. tips)</p>
                      </div>
                    </div>
                  </div>

                  {/* Errors detail */}
                  {errorRows.length > 0 && (
                    <div className="rounded-xl border border-destructive/20 overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-2 bg-destructive/5 border-b border-destructive/20">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">{errorRows.length} rows with warnings (will be imported with best-effort)</span>
                      </div>
                      <div className="divide-y max-h-32 overflow-y-auto">
                        {errorRows.map(r => (
                          <div key={r._rowNum} className="flex items-center gap-3 px-4 py-2 text-xs">
                            <span className="text-muted-foreground shrink-0">Row {r._rowNum}</span>
                            <span className="font-medium">{r.partner_name || "(no name)"}</span>
                            <span className="text-destructive">{r._warnings.join(", ")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview table */}
                  <div className="rounded-xl border overflow-hidden max-h-52 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Partner Name</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead className="text-right">Amount (excl. tips)</TableHead>
                          <TableHead className="text-right">Tips</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsePreview.slice(0, 10).map((r, i) => (
                          <TableRow key={i} className={r._warnings.length > 0 ? "bg-amber-500/5" : ""}>
                            <TableCell className="text-sm font-medium">{r.partner_name || <span className="text-muted-foreground italic">—</span>}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{r.team ?? "—"}</TableCell>
                            <TableCell className="text-right text-sm">{fmtSek(r.amount_excl_tips)}</TableCell>
                            <TableCell className="text-right text-sm">{r.tips > 0 ? fmtSek(r.tips) : "—"}</TableCell>
                            <TableCell className="text-right">
                              {r._warnings.length > 0 && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 inline" />}
                            </TableCell>
                          </TableRow>
                        ))}
                        {parsePreview.length > 10 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                              +{parsePreview.length - 10} more rows
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="excel" className="space-y-4 mt-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <FileSpreadsheet className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-blue-700 dark:text-blue-400">Using an Excel file from Wolt?</p>
                  <p className="text-muted-foreground">Wolt exports data as Excel (.xlsx). To import it here:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Open the Excel file in Microsoft Excel or Google Sheets</li>
                    <li>Go to <strong>File → Save As</strong> (Excel) or <strong>File → Download → CSV</strong> (Sheets)</li>
                    <li>Choose format: <strong>CSV UTF-8 (Comma delimited)</strong> — then manually change separators to <code className="bg-muted px-1 rounded">;</code></li>
                    <li>Or use <strong>File → Save As → CSV (semicolon)</strong> if your Excel locale uses semicolons</li>
                    <li>Upload the resulting .csv file in the <strong>CSV Upload</strong> tab</li>
                  </ol>
                </div>
              </div>
              <div className="rounded-xl border overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/50 border-b text-sm font-medium">Expected column order</div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    {CSV_SAMPLE_HEADER.split(";").map((col, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded bg-primary/10 text-primary text-xs flex items-center justify-center font-mono shrink-0">{String.fromCharCode(65 + i)}</span>
                        <span>{col}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="api" className="mt-4">
              <div className="p-8 text-center rounded-xl bg-muted/30 border border-dashed">
                <WifiOff className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Wolt API not configured</h3>
                <p className="text-sm text-muted-foreground">
                  Automatic sync requires Wolt API credentials. Once configured, data will sync automatically and appear here.
                </p>
                {/* TODO: Add Wolt API credentials and implement handleApiSync() */}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowImportDialog(false); setParsePreview([]); setSelectedFile(null); }}>
              Cancel
            </Button>
            {importTab === "csv" && (
              <Button
                onClick={handleImport}
                disabled={importing || validRows.length === 0}
              >
                {importing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
                Import {validRows.length > 0 ? `${validRows.length} rows` : ""}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Delete Dataset
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all records from this import batch. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />}
              Delete Dataset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
