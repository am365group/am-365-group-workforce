import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, CheckCircle, Clock, AlertCircle, Pen, Loader2, Calendar } from "lucide-react";
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
};

export default function PartnerContract() {
  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadContract(); }, []);

  const loadContract = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Auto-link contract.partner_user_id by email so RLS query succeeds
      await supabase.rpc("link_my_application");

      const { data, error } = await supabase
        .from("partner_contracts")
        .select("id, application_id, partner_user_id, contract_content, status, sent_at, signed_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setContract(data);
    } catch (err: any) {
      toast({ title: "Error loading contract", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!contract) return;
    setSigning(true);
    try {
      // 1. Mark contract as signed
      const { error: contractError } = await supabase
        .from("partner_contracts")
        .update({ status: "signed", signed_at: new Date().toISOString() })
        .eq("id", contract.id);

      if (contractError) throw contractError;

      // 2. Update application status
      const { error: appError } = await supabase
        .from("partner_applications")
        .update({ status: "contract_signed" })
        .eq("id", contract.application_id);

      if (appError) throw appError;

      toast({
        title: "Contract signed! 🎉",
        description: "Your employment contract has been accepted. AM:365 will activate your account shortly.",
      });
      setShowConfirm(false);
      await loadContract();
    } catch (err: any) {
      toast({ title: "Error signing contract", description: err.message, variant: "destructive" });
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // No contract yet
  if (!contract) {
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

  const isPending = contract.status === "sent";
  const isSigned = contract.status === "signed";

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">My Contract</h1>
        <p className="text-base text-muted-foreground mt-1">Your employment agreement with AM:365 Group AB</p>
      </div>

      {/* Status Banner */}
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
              Signed on {contract.signed_at ? new Date(contract.signed_at).toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" }) : "—"}.
              Your account is being activated by the AM:365 team.
            </p>
          </div>
        </div>
      )}

      {/* Contract Header Card */}
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
                  Sent {contract.sent_at ? new Date(contract.sent_at).toLocaleDateString("sv-SE") : "—"}
                </p>
              </div>
            </div>
            <Badge variant={isSigned ? "default" : "secondary"} className="shrink-0 text-sm px-3 py-1">
              {isSigned ? "Signed" : isPending ? "Awaiting Signature" : contract.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Contract Content */}
      {contract.contract_content && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Contract Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm dark:prose-invert max-w-none border rounded-xl p-6 bg-muted/20"
              dangerouslySetInnerHTML={{ __html: contract.contract_content }}
            />
          </CardContent>
        </Card>
      )}

      {/* Sign Button (bottom) */}
      {isPending && (
        <Button size="lg" className="w-full h-14 text-base" onClick={() => setShowConfirm(true)}>
          <Pen className="mr-2 h-5 w-5" /> Sign & Accept Contract
        </Button>
      )}

      {/* Confirmation Dialog */}
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
              A copy of your signed contract will be accessible from this page at any time.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={signing}>
              Review again
            </Button>
            <Button onClick={handleSign} disabled={signing}>
              {signing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1.5 h-4 w-4" />}
              Sign Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
