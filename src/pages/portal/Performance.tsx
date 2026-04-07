import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  TrendingUp, Upload, Download, Trash2, AlertCircle, CheckCircle,
  Loader2, Search, ChevronDown, ChevronUp, FileText, Info,
  AlertTriangle, WifiOff, Activity,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ─────────────────────────────────────────────────────────────────────
type PerfRow = {
  id: string;
  import_batch_id: string;
  period_label: string | null;
  imported_at: string;
  partner_name: string;
  phone: string | null;
  email: string | null;
  vehicle: string | null;
  wolt_id: string | null;
  team: string | null;
  set_offline: boolean;
  weekly_max_hours: string | null;
  deliveries: number;
  tar_pct: number;
  tasks_shown: number;
  tcr_pct: number;
  dph: number;
  dat_minutes: number;
  total_online_minutes: number;
  total_on_task_minutes: number;
  total_idle_minutes: number;
  travelled_distance_m: number;
  on_task_distance_m: number;
};

type Batch = {
  import_batch_id: string;
  period_label: string | null;
  imported_at: string;
  row_count: number;
  flagged_count: number;
  avg_tar: number;
  avg_tcr: number;
};

// ─── Parsers ────────────────────────────────────────────────────────────────────

/** "92 %" → 92  |  "100%" → 100  |  "" → 0 */
function parsePct(raw: string): number {
  if (!raw || raw === "-") return 0;
  return parseFloat(raw.replace(/\s*%\s*/g, "").replace(",", ".")) || 0;
}

/** "1,76" → 1.76  |  "2.3" → 2.3 */
function parseDecimal(raw: string): number {
  if (!raw || raw === "-") return 0;
  // Swedish decimal comma
  return parseFloat(raw.replace(/\./g, "").replace(",", ".")) || 0;
}

/** "18m 30s" | "1h 5m" | "189h 21m" → minutes */
function parseTimeToMinutes(raw: string): number {
  if (!raw || raw === "-") return 0;
  let mins = 0;
  const hMatch = raw.match(/(\d+)\s*h/);
  const mMatch = raw.match(/(\d+)\s*m/);
  if (hMatch) mins += parseInt(hMatch[1]) * 60;
  if (mMatch) mins += parseInt(mMatch[1]);
  return mins;
}

/** "1.825.542" (Swedish thousands with dots) → 1825542 */
function parseSwedishInt(raw: string): number {
  if (!raw || raw === "-") return 0;
  return parseInt(raw.replace(/\./g, "").replace(/\s/g, "")) || 0;
}

/** minutes → "189h 21m" */
function fmtMinutes(m: number): string {
  if (m === 0) return "—";
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
}

/** metres → "1,825 km" */
function fmtDistanceKm(m: number): string {
  if (m === 0) return "—";
  return `${(m / 1000).toLocaleString("sv-SE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

// ─── CSV Parser ─────────────────────────────────────────────────────────────────
function parseWoltPerformanceCsv(text: string): Omit<PerfRow, "id" | "import_batch_id" | "imported_at">[] {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const rows: Omit<PerfRow, "id" | "import_batch_id" | "imported_at">[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(";");
    if (c.length < 10) continue;
    rows.push({
      period_label: null,
      partner_name:          c[0]?.trim() ?? "",
      phone:                 c[1]?.trim() || null,
      email:                 c[2]?.trim() || null,
      vehicle:               c[3]?.trim() || null,
      wolt_id:               c[4]?.trim() || null,
      team:                  c[5]?.trim() || null,
      set_offline:           c[6]?.trim().toLowerCase() === "true",
      weekly_max_hours:      c[7]?.trim() === "-" ? null : c[7]?.trim() || null,
      deliveries:            parseSwedishInt(c[8] ?? ""),
      tar_pct:               parsePct(c[9] ?? ""),
      tasks_shown:           parseSwedishInt(c[10] ?? ""),
      tcr_pct:               parsePct(c[11] ?? ""),
      dph:                   parseDecimal(c[12] ?? ""),
      dat_minutes:           parseTimeToMinutes(c[13] ?? ""),
      total_online_minutes:  parseTimeToMinutes(c[14] ?? ""),
      total_on_task_minutes: parseTimeToMinutes(c[15] ?? ""),
      total_idle_minutes:    parseTimeToMinutes(c[16] ?? ""),
      travelled_distance_m:  parseSwedishInt(c[17] ?? ""),
      on_task_distance_m:    parseSwedishInt(c[18] ?? ""),
    });
  }
  return rows;
}

// ─── CSV export ─────────────────────────────────────────────────────────────────
function exportToCsv(rows: PerfRow[], filename: string) {
  const header = [
    "Partner Name", "Phone", "Email", "Vehicle", "Wolt ID", "Team",
    "Set Offline", "Weekly Max Hours", "Deliveries", "TAR %", "Tasks Shown",
    "TCR %", "DPH", "DAT (min)", "Total Online (min)", "On-Task (min)",
    "Idle (min)", "Distance (m)", "On-Task Distance (m)", "Period", "Imported At",
  ].join(";");
  const lines = rows.map(r => [
    r.partner_name, r.phone ?? "", r.email ?? "", r.vehicle ?? "", r.wolt_id ?? "",
    r.team ?? "", r.set_offline, r.weekly_max_hours ?? "", r.deliveries,
    r.tar_pct, r.tasks_shown, r.tcr_pct, r.dph, r.dat_minutes,
    r.total_online_minutes, r.total_on_task_minutes, r.total_idle_minutes,
    r.travelled_distance_m, r.on_task_distance_m,
    r.period_label ?? "", r.imported_at,
  ].join(";"));
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Flag logic ─────────────────────────────────────────────────────────────────
const TAR_THRESHOLD = 80;
const TCR_THRESHOLD = 90;

function isFlagged(r: Pick<PerfRow, "tar_pct" | "tcr_pct" | "set_offline">): boolean {
  return r.tar_pct < TAR_THRESHOLD || r.tcr_pct < TCR_THRESHOLD || r.set_offline;
}

function tarColor(v: number) {
  if (v >= 90) return "text-green-600";
  if (v >= TAR_THRESHOLD) return "text-amber-600";
  return "text-red-600";
}
function tcrColor(v: number) {
  if (v >= 95) return "text-green-600";
  if (v >= TCR_THRESHOLD) return "text-amber-600";
  return "text-red-600";
}

// ─── Component ──────────────────────────────────────────────────────────────────
export default function AdminPerformance() {
  const [batches, setBatches]             = useState<Batch[]>([]);
  const [rows, setRows]                   = useState<PerfRow[]>([]);
  const [loading, setLoading]             = useState(true);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [searchTerm, setSearchTerm]       = useState("");
  const [flaggedOnly, setFlaggedOnly]     = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteBatchId, setDeleteBatchId] = useState<string | null>(null);
  const [importing, setImporting]         = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [parsePreview, setParsePreview]   = useState<ReturnType<typeof parseWoltPerformanceCsv>>([]);
  const [parseErrors, setParseErrors]     = useState<string[]>([]);
  const [periodLabel, setPeriodLabel]     = useState("");
  const [selectedFile, setSelectedFile]   = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("wolt_performance_imports")
        .select("*")
        .order("imported_at", { ascending: false });
      if (error) throw error;
      const all = (data as PerfRow[]) || [];
      setRows(all);

      // Group into batches
      const batchMap: Record<string, Batch> = {};
      for (const r of all) {
        if (!batchMap[r.import_batch_id]) {
          batchMap[r.import_batch_id] = {
            import_batch_id: r.import_batch_id,
            period_label: r.period_label,
            imported_at: r.imported_at,
            row_count: 0,
            flagged_count: 0,
            avg_tar: 0,
            avg_tcr: 0,
          };
        }
        const b = batchMap[r.import_batch_id];
        b.row_count++;
        if (isFlagged(r)) b.flagged_count++;
        b.avg_tar += r.tar_pct;
        b.avg_tcr += r.tcr_pct;
      }
      // Compute averages
      for (const b of Object.values(batchMap)) {
        b.avg_tar = b.row_count ? b.avg_tar / b.row_count : 0;
        b.avg_tcr = b.row_count ? b.avg_tcr / b.row_count : 0;
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
    setParseErrors([]);
    setParsePreview([]);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const errors: string[] = [];
      try {
        const parsed = parseWoltPerformanceCsv(text);
        if (parsed.length === 0) errors.push("No valid rows found. Check file format (semicolon-delimited CSV).");
        const nameless = parsed.filter(r => !r.partner_name);
        if (nameless.length > 0) errors.push(`${nameless.length} rows missing partner name.`);
        setParsePreview(parsed);
        setParseErrors(errors);
      } catch {
        setParseErrors(["Failed to parse file. Ensure it is UTF-8 encoded CSV with ; delimiter."]);
      }
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  };

  const handleImport = async () => {
    if (!parsePreview.length) return;
    setImporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const batchId = crypto.randomUUID();
      const toInsert = parsePreview.map(row => ({
        ...row,
        import_batch_id: batchId,
        period_label: periodLabel || null,
        imported_by: user?.id ?? null,
      }));
      const { error } = await supabase.from("wolt_performance_imports").insert(toInsert);
      if (error) throw error;
      toast({ title: "Import successful!", description: `${toInsert.length} partner records imported.` });
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
        .from("wolt_performance_imports")
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
    exportToCsv(batchRows, `wolt-performance-${batch?.period_label ?? batchId.slice(0, 8)}.csv`);
  };

  const handleExportAll = () => {
    exportToCsv(rows, `wolt-performance-all-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // ── Aggregate stats ────────────────────────────────────────────────────────
  const totalPartners    = new Set(rows.map(r => r.wolt_id).filter(Boolean)).size;
  const totalFlagged     = rows.filter(r => isFlagged(r)).length;
  const avgTar           = rows.length ? rows.reduce((s, r) => s + r.tar_pct, 0) / rows.length : 0;
  const avgTcr           = rows.length ? rows.reduce((s, r) => s + r.tcr_pct, 0) / rows.length : 0;
  const setOfflineCount  = rows.filter(r => r.set_offline).length;

  const getBatchRows = (batchId: string) =>
    rows.filter(r => r.import_batch_id === batchId && (
      (!searchTerm || [r.partner_name, r.email, r.team, r.wolt_id, r.vehicle].some(v => v?.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (!flaggedOnly || isFlagged(r))
    ));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Partner Performance</h1>
          <p className="text-base text-muted-foreground mt-1">
            Wolt delivery performance data — analyse TAR, TCR, DPH, and flag underperforming partners
          </p>
        </div>
        <div className="flex gap-2">
          {rows.length > 0 && (
            <Button variant="outline" size="lg" onClick={handleExportAll}>
              <Download className="mr-2 h-4 w-4" /> Export All
            </Button>
          )}
          <Button size="lg" onClick={() => setShowImportDialog(true)}>
            <Upload className="mr-2 h-4 w-4" /> Import CSV
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold">{totalPartners}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Partners</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className={`text-3xl font-bold ${avgTar < TAR_THRESHOLD ? "text-red-600" : avgTar < 90 ? "text-amber-600" : "text-green-600"}`}>
              {rows.length ? avgTar.toFixed(1) : "—"}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">Avg TAR</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className={`text-3xl font-bold ${avgTcr < TCR_THRESHOLD ? "text-red-600" : avgTcr < 95 ? "text-amber-600" : "text-green-600"}`}>
              {rows.length ? avgTcr.toFixed(1) : "—"}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">Avg TCR</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-red-600">{totalFlagged}</p>
            <p className="text-sm text-muted-foreground mt-1">Flagged Partners</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-bold text-orange-500">{setOfflineCount}</p>
            <p className="text-sm text-muted-foreground mt-1">Set Offline</p>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-muted-foreground">TAR &lt; {TAR_THRESHOLD}% or TCR &lt; {TCR_THRESHOLD}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <WifiOff className="h-4 w-4 text-orange-500" />
            <span className="text-muted-foreground">Set Offline by Wolt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">All metrics healthy</span>
          </div>
        </div>
      )}

      {/* Search + filter row */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search partner, team, vehicle, Wolt ID..."
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          variant={flaggedOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setFlaggedOnly(!flaggedOnly)}
        >
          <AlertTriangle className="h-4 w-4 mr-1.5" />
          {flaggedOnly ? "All Partners" : "Flagged Only"}
        </Button>
      </div>

      {/* Batches */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : batches.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <Activity className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No performance data yet</h2>
            <p className="text-muted-foreground mb-6">Import a Wolt performance export CSV to start analysing partner metrics.</p>
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
                      className="flex items-center gap-3 text-left flex-1 min-w-0"
                    >
                      {expanded
                        ? <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                        : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-base">
                            {batch.period_label ?? "Import " + new Date(batch.imported_at).toLocaleDateString("sv-SE")}
                          </p>
                          {batch.flagged_count > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {batch.flagged_count} flagged
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {batch.row_count} partners · Avg TAR {batch.avg_tar.toFixed(1)}% · Avg TCR {batch.avg_tcr.toFixed(1)}% · Imported {new Date(batch.imported_at).toLocaleString("sv-SE")}
                        </p>
                      </div>
                    </button>
                    <div className="flex gap-2 shrink-0 ml-4">
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
                      <p className="text-center text-muted-foreground py-6">No results matching filter.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Partner</TableHead>
                              <TableHead>Vehicle</TableHead>
                              <TableHead>Team</TableHead>
                              <TableHead className="text-center">Status</TableHead>
                              <TableHead className="text-right">Deliveries</TableHead>
                              <TableHead className="text-right">TAR</TableHead>
                              <TableHead className="text-right">TCR</TableHead>
                              <TableHead className="text-right">DPH</TableHead>
                              <TableHead className="text-right">DAT</TableHead>
                              <TableHead className="text-right">Online</TableHead>
                              <TableHead className="text-right">On-Task</TableHead>
                              <TableHead className="text-right">Idle</TableHead>
                              <TableHead className="text-right">Distance</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {batchData.map(r => {
                              const flagged = isFlagged(r);
                              return (
                                <TableRow
                                  key={r.id}
                                  className={flagged ? "bg-red-500/5 hover:bg-red-500/10" : "hover:bg-muted/40"}
                                >
                                  <TableCell>
                                    <p className="font-medium text-sm">{r.partner_name}</p>
                                    {r.email && <p className="text-xs text-muted-foreground">{r.email}</p>}
                                    {r.wolt_id && <p className="text-xs text-muted-foreground font-mono">{r.wolt_id}</p>}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{r.vehicle ?? "—"}</TableCell>
                                  <TableCell className="text-sm">{r.team ?? "—"}</TableCell>
                                  <TableCell className="text-center">
                                    {r.set_offline ? (
                                      <Badge variant="destructive" className="text-xs gap-1">
                                        <WifiOff className="h-3 w-3" /> Offline
                                      </Badge>
                                    ) : r.tar_pct < TAR_THRESHOLD || r.tcr_pct < TCR_THRESHOLD ? (
                                      <Badge variant="outline" className="text-xs gap-1 border-red-400 text-red-600">
                                        <AlertTriangle className="h-3 w-3" /> Flagged
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs gap-1 border-green-400 text-green-600">
                                        <CheckCircle className="h-3 w-3" /> OK
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right text-sm font-medium">{r.deliveries.toLocaleString("sv-SE")}</TableCell>
                                  <TableCell className={`text-right text-sm font-semibold ${tarColor(r.tar_pct)}`}>
                                    {r.tar_pct}%
                                  </TableCell>
                                  <TableCell className={`text-right text-sm font-semibold ${tcrColor(r.tcr_pct)}`}>
                                    {r.tcr_pct}%
                                  </TableCell>
                                  <TableCell className="text-right text-sm">{r.dph.toFixed(2)}</TableCell>
                                  <TableCell className="text-right text-sm text-muted-foreground">{fmtMinutes(r.dat_minutes)}</TableCell>
                                  <TableCell className="text-right text-sm">{fmtMinutes(r.total_online_minutes)}</TableCell>
                                  <TableCell className="text-right text-sm">{fmtMinutes(r.total_on_task_minutes)}</TableCell>
                                  <TableCell className="text-right text-sm text-muted-foreground">{fmtMinutes(r.total_idle_minutes)}</TableCell>
                                  <TableCell className="text-right text-sm">{fmtDistanceKm(r.travelled_distance_m)}</TableCell>
                                </TableRow>
                              );
                            })}
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

      {/* ── Import Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={showImportDialog} onOpenChange={v => { setShowImportDialog(v); if (!v) { setParsePreview([]); setSelectedFile(null); setPeriodLabel(""); setParseErrors([]); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Upload className="h-5 w-5 text-primary" /> Import Wolt Performance CSV
            </DialogTitle>
            <DialogDescription>
              Upload a semicolon-delimited performance export from Wolt's courier management system.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Format info */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-400">Expected format</p>
                <p className="text-muted-foreground mt-0.5">
                  Semicolon-delimited (;) with columns: Name, Phone, Email, Vehicle, Id, Team, Set offline, Weekly max hours, Deliveries, TAR, Tasks shown, TCR, DPH, DAT, Total online time, On-task time, Idle time, Travelled Distance (m), On-task distance (m)
                </p>
              </div>
            </div>

            {/* Performance thresholds info */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">Flagging thresholds</p>
                <p className="text-muted-foreground mt-0.5">
                  Partners are automatically flagged if: TAR &lt; {TAR_THRESHOLD}%, TCR &lt; {TCR_THRESHOLD}%, or they are set offline by Wolt.
                </p>
              </div>
            </div>

            {/* Period label */}
            <div className="space-y-1.5">
              <Label>Period label (optional)</Label>
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
              <p className="text-sm text-muted-foreground mt-1">Wolt performance export (.csv)</p>
            </div>

            {/* Parse errors */}
            {parseErrors.length > 0 && (
              <div className="space-y-2">
                {parseErrors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p>{e}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Parse preview */}
            {parsePreview.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  <p className="font-medium text-primary">
                    {parsePreview.length} rows parsed · {parsePreview.filter(r => isFlagged(r)).length} would be flagged
                  </p>
                </div>
                <div className="rounded-xl border overflow-hidden max-h-52 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partner Name</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-right">Deliveries</TableHead>
                        <TableHead className="text-right">TAR</TableHead>
                        <TableHead className="text-right">TCR</TableHead>
                        <TableHead className="text-center">Flag</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsePreview.slice(0, 10).map((r, i) => (
                        <TableRow key={i} className={isFlagged(r) ? "bg-red-500/5" : ""}>
                          <TableCell className="text-sm font-medium">{r.partner_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.team ?? "—"}</TableCell>
                          <TableCell className="text-right text-sm">{r.deliveries}</TableCell>
                          <TableCell className={`text-right text-sm font-semibold ${tarColor(r.tar_pct)}`}>{r.tar_pct}%</TableCell>
                          <TableCell className={`text-right text-sm font-semibold ${tcrColor(r.tcr_pct)}`}>{r.tcr_pct}%</TableCell>
                          <TableCell className="text-center">
                            {isFlagged(r)
                              ? <AlertTriangle className="h-4 w-4 text-red-500 mx-auto" />
                              : <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />}
                          </TableCell>
                        </TableRow>
                      ))}
                      {parsePreview.length > 10 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                            +{parsePreview.length - 10} more rows
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowImportDialog(false); setParsePreview([]); setSelectedFile(null); setParseErrors([]); setPeriodLabel(""); }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={parsePreview.length === 0 || importing}
            >
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import {parsePreview.length > 0 ? `${parsePreview.length} Records` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ────────────────────────────────────── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Dataset?</DialogTitle>
            <DialogDescription>
              This will permanently remove all partner performance records in this import batch. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Dataset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
