import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, TrendingUp, Truck, DollarSign, Download, Search, Loader2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type DeliveryRow = {
  id: string;
  import_batch_id: string;
  period_label: string | null;
  imported_at: string;
  partner_name: string;
  email: string | null;
  team: string | null;
  weekly_max_hours: string | null;
  amount_excl_tips: number;
  amount_incl_tips: number;
  tips: number;
  adjustments: number;
  task_related_amount: number;
};

function fmtSek(n: number): string {
  return `${n.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SEK`;
}

export default function PartnerWorkHistory() {
  const [rows, setRows]             = useState<DeliveryRow[]>([]);
  const [appEmail, setAppEmail]     = useState<string>("");
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc("link_my_application");

      const { data: app } = await supabase
        .from("partner_applications")
        .select("email, wolt_partner_email")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!app) return;

      // Look up by wolt_partner_email if set, otherwise partner's own email
      const lookupEmail = app.wolt_partner_email || app.email;
      setAppEmail(lookupEmail);

      const { data, error } = await supabase
        .from("wolt_delivery_imports")
        .select("*")
        .ilike("email", lookupEmail)
        .order("imported_at", { ascending: false });

      if (error) throw error;
      setRows((data as DeliveryRow[]) || []);
    } catch (err: any) {
      toast({ title: "Error loading work history", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const header = "Period;Team;Amount (excl tips);Amount (incl tips);Tips;Adjustments;Task Related;Imported At";
    const lines = rows.map(r =>
      [r.period_label ?? "", r.team ?? "", r.amount_excl_tips, r.amount_incl_tips,
       r.tips, r.adjustments, r.task_related_amount, r.imported_at].join(";")
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "work-history.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalEarnings = rows.reduce((s, r) => s + r.amount_excl_tips, 0);
  const totalTips     = rows.reduce((s, r) => s + r.tips, 0);
  const totalIncl     = rows.reduce((s, r) => s + r.amount_incl_tips, 0);
  const uniquePeriods = new Set(rows.map(r => r.period_label).filter(Boolean)).size;

  const filtered = rows.filter(r =>
    !searchTerm ||
    `${r.period_label ?? ""} ${r.team ?? ""}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Work History</h1>
          <p className="text-base text-muted-foreground mt-1">Your Wolt delivery earnings and work data</p>
        </div>
        {rows.length > 0 && (
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-5 text-center"><Truck className="h-5 w-5 text-primary mx-auto mb-2" /><p className="text-xl font-bold">{rows.length}</p><p className="text-sm text-muted-foreground mt-1">Import Periods</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><DollarSign className="h-5 w-5 text-primary mx-auto mb-2" /><p className="text-xl font-bold text-primary">{fmtSek(totalEarnings)}</p><p className="text-sm text-muted-foreground mt-1">Total (excl. tips)</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><TrendingUp className="h-5 w-5 text-amber-500 mx-auto mb-2" /><p className="text-xl font-bold text-amber-600">{fmtSek(totalTips)}</p><p className="text-sm text-muted-foreground mt-1">Total Tips</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><Clock className="h-5 w-5 text-blue-500 mx-auto mb-2" /><p className="text-xl font-bold">{fmtSek(totalIncl)}</p><p className="text-sm text-muted-foreground mt-1">Total (incl. tips)</p></CardContent></Card>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No delivery data yet</h2>
            <p className="text-muted-foreground">
              Your Wolt delivery data will appear here once AM:365 imports your weekly reports.
              {appEmail && <span className="block mt-1 text-xs font-mono text-muted-foreground">Linked to: {appEmail}</span>}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search period, team…" className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Team / City</TableHead>
                    <TableHead className="text-right">Amount (excl. tips)</TableHead>
                    <TableHead className="text-right">Tips</TableHead>
                    <TableHead className="text-right">Total (incl. tips)</TableHead>
                    <TableHead className="text-right">Adjustments</TableHead>
                    <TableHead>Imported</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{r.period_label ?? "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.team ?? "—"}</TableCell>
                      <TableCell className="text-right font-medium text-sm text-primary">{fmtSek(r.amount_excl_tips)}</TableCell>
                      <TableCell className="text-right text-sm text-amber-600">{r.tips > 0 ? fmtSek(r.tips) : "—"}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">{fmtSek(r.amount_incl_tips)}</TableCell>
                      <TableCell className={`text-right text-sm ${r.adjustments < 0 ? "text-destructive" : r.adjustments > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {r.adjustments !== 0 ? fmtSek(r.adjustments) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(r.imported_at).toLocaleDateString("sv-SE")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
