import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { FileText, CheckCircle, Clock, AlertCircle, Pen, Loader2, Calendar, Download, History, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ContractData = {
  id: string;
  application_id: string;
  partner_user_id: string | null;
  contract_content: string | null;
  status: string;
  sent_at: string | null;
  signed_at: string | null;
  created_at: string;
};

/* ── Download helper: open print window with styled HTML ─────────────── */
function downloadContract(contract: ContractData) {
  const content = contract.contract_content ?? "<p>No contract content available.</p>";
  const sentDate = contract.sent_at
    ? new Date(contract.sent_at).toLocaleDateString("sv-SE")
    : "—";
  const signedDate = contract.signed_at
    ? new Date(contract.signed_at).toLocaleDateString("sv-SE")
    : null;

  const html = `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8" />
  <title>Employment Contract — AM:365 Group AB</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 13px;
      line-height: 1.6;
      color: #111;
      max-width: 820px;
      margin: 0 auto;
      padding: 40px 48px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #22C55E;
      padding-bottom: 18px;
      margin-bottom: 28px;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-mark {
      width: 40px; height: 40px;
      background: #22C55E;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 14px;
    }
    .logo-text { font-size: 20px; font-weight: 700; color: #111; }
    .meta { font-size: 11px; color: #666; text-align: right; line-height: 1.5; }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      margin-top: 8px;
    }
    .status-signed { background: #dcfce7; color: #15803d; }
    .status-sent   { background: #fef3c7; color: #b45309; }
    .content { margin-top: 24px; }
    .content h1 { font-size: 18px; margin-bottom: 4px; }
    .content h2 { font-size: 15px; margin-top: 20px; margin-bottom: 6px; }
    .content p  { margin: 6px 0; }
    .content ul, .content ol { margin: 6px 0 6px 20px; }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #888;
      text-align: center;
    }
    @media print {
      body { padding: 20mm 25mm; }
      .header { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <div class="logo-mark">AM</div>
      <div>
        <div class="logo-text">AM:365 Group AB</div>
        <div style="font-size:11px;color:#666">Workforce Platform</div>
      </div>
    </div>
    <div class="meta">
      Sent: ${sentDate}<br/>
      ${signedDate ? `Signed: ${signedDate}<br/>` : ""}
      <span class="status-badge ${contract.status === "signed" ? "status-signed" : "status-sent"}">
        ${contract.status === "signed" ? "✓ Signed" : "Awaiting Signature"}
      </span>
    </div>
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    AM:365 Group AB · Org. Nr: 559292-4798 · Stockholm, Sweden<br/>
    Generated ${new Date().toLocaleString("sv-SE")} · Confidential
  </div>
  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, "_blank");
  if (!win) {
    // Fallback: direct download
    const a = document.createElement("a");
    a.href = url;
    a.download = `AM365_Contract_${new Date().toISOString().split("T")[0]}.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/* ════════════════════════════════════════════════════════════════════════ */
export default function PartnerContract() {
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [loading, setLoading]     = useState(true);
  const [signing, setSigning]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeContract, setActiveContract] = useState<ContractData | null>(null);
  const { toast } = useToast();

  useEffect(() => { loadContracts(); }, []);

  const loadContracts = async () => {
    try {
      await supabase.rpc("link_my_application");

      const { data, error } = await supabase
        .from("partner_contracts")
        .select("id, application_id, partner_user_id, contract_content, status, sent_at, signed_at, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const all = (data as ContractData[]) || [];
      setContracts(all);
      // Active = the latest unsigned, or the most recent if all signed
      const pending = all.find(c => c.status === "sent");
      setActiveContract(pending ?? all[0] ?? null);
    } catch (err: any) {
      toast({ title: "Error loading contracts", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!activeContract) return;
    setSigning(true);
    try {
      const { error: contractError } = await supabase
        .from("partner_contracts")
        .update({ status: "signed", signed_at: new Date().toISOString() })
        .eq("id", activeContract.id);
      if (contractError) throw contractError;

      const { error: appError } = await supabase
        .from("partner_applications")
        .update({ status: "contract_signed" })
        .eq("id", activeContract.application_id);
      if (appError) throw appError;

      toast({ title: "Contract signed! 🎉", description: "Your employment contract has been accepted. AM:365 will activate your account shortly." });
      setShowConfirm(false);
      await loadContracts();
    } catch (err: any) {
      toast({ title: "Error signing contract", description: err.message, variant: "destructive" });
    } finally {
      setSigning(false);
    }
  };

  /* ── helpers ─────────────────────────────────────────────────────── */
  const statusBadge = (status: string) => {
    if (status === "signed")    return <Badge variant="default"     className="text-xs">Signed</Badge>;
    if (status === "sent")      return <Badge variant="secondary"   className="text-xs">Awaiting Signature</Badge>;
    if (status === "cancelled") return <Badge variant="destructive" className="text-xs">Cancelled</Badge>;
    return <Badge variant="outline" className="text-xs capitalize">{status}</Badge>;
  };

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" }) : "—";

  /* ── loading ─────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  /* ── no contract yet ─────────────────────────────────────────────── */
  if (contracts.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold">My Contract</h1>
          <p className="text-base text-muted-foreground mt-1">Your employment agreement with AM:365 Group AB</p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Contract not ready yet</h2>
            <p className="text-muted-foreground">
              Your contract will appear here once your identity documents have been verified and
              an employment contract has been prepared by the AM:365 team.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const latest   = contracts[0];
  const isPending = activeContract?.status === "sent";
  const isSigned  = activeContract?.status === "signed";
  const history   = contracts.slice(1);

  /* ════════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">My Contract</h1>
        <p className="text-base text-muted-foreground mt-1">Your employment agreement with AM:365 Group AB</p>
      </div>

      {/* ── Action banner ─────────────────────────────────────────── */}
      {isPending && (
        <div className="flex items-start gap-4 p-5 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-700 dark:text-amber-400">Action required — Please review and sign</p>
            <p className="text-sm text-muted-foreground mt-1">
              Read your employment contract carefully below. When you're ready, click <strong>Sign Contract</strong> to accept.
            </p>
          </div>
          <Button onClick={() => setShowConfirm(true)} className="shrink-0">
            <Pen className="mr-1.5 h-4 w-4" /> Sign Contract
          </Button>
        </div>
      )}

      {isSigned && (
        <div className="flex items-start gap-4 p-5 rounded-xl bg-primary/10 border border-primary/30">
          <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-primary">Contract signed</p>
            <p className="text-sm text-muted-foreground mt-1">
              Signed on {fmtDate(activeContract!.signed_at)}. Your account is being activated by the AM:365 team.
            </p>
          </div>
        </div>
      )}

      {/* ── Contract header card ──────────────────────────────────── */}
      {activeContract && (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Employment Contract — AM:365 Group AB</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Sent {activeContract.sent_at ? new Date(activeContract.sent_at).toLocaleDateString("sv-SE") : "—"}
                    {activeContract.signed_at && ` · Signed ${new Date(activeContract.signed_at).toLocaleDateString("sv-SE")}`}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                {statusBadge(activeContract.status)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadContract(activeContract)}
                  className="text-xs gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Download / Print
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Contract content ──────────────────────────────────────── */}
      {activeContract?.contract_content && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Contract Terms
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadContract(activeContract)}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" /> Open full view
            </Button>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm dark:prose-invert max-w-none border rounded-xl p-6 bg-muted/20 max-h-[500px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: activeContract.contract_content }}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Sign button (bottom) ──────────────────────────────────── */}
      {isPending && (
        <Button size="lg" className="w-full h-14 text-base" onClick={() => setShowConfirm(true)}>
          <Pen className="mr-2 h-5 w-5" /> Sign &amp; Accept Contract
        </Button>
      )}

      {/* ── Contract history ──────────────────────────────────────── */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" /> Contract History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {history.map((c, i) => (
                <div key={c.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Contract v{history.length - i}
                        {c.status === "signed" && (
                          <span className="ml-2 text-xs text-primary">✓ Signed</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Sent {c.sent_at ? new Date(c.sent_at).toLocaleDateString("sv-SE") : "—"}
                        {c.signed_at && ` · Signed ${new Date(c.signed_at).toLocaleDateString("sv-SE")}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(c.status)}
                    {c.contract_content && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadContract(c)}
                        className="h-8 text-xs gap-1"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Confirmation dialog ──────────────────────────────────── */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm Digital Signature</DialogTitle>
            <DialogDescription>
              By clicking <strong>Sign Contract</strong> below, you confirm that you have read and
              agree to all terms of the employment contract with AM:365 Group AB. This acts as your
              legally binding digital signature.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Signature date: <strong>{new Date().toLocaleDateString("sv-SE")}</strong></span>
            </div>
            <p className="text-xs text-muted-foreground">
              A copy of your signed contract will remain accessible from this page at any time.
              Use the <strong>Download / Print</strong> button to save a PDF copy.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={signing}>
              Review again
            </Button>
            <Button onClick={handleSign} disabled={signing}>
              {signing
                ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                : <CheckCircle className="mr-1.5 h-4 w-4" />}
              Sign Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
