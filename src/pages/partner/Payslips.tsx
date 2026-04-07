import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Download, Eye, DollarSign, TrendingUp, Calendar, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type PayslipRow = {
  id: string;
  period_year: number;
  period_month: number;
  pdf_storage_path: string | null;
  created_at: string;
  payroll_entry: {
    hours_worked: number | null;
    deliveries: number | null;
    gross_salary: number | null;
    tax_amount: number | null;
    net_salary: number | null;
    employer_fee: number | null;
  } | null;
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtSek(n: number | null): string {
  if (n === null || n === undefined) return "—";
  return `${Number(n).toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SEK`;
}

export default function PartnerPayslips() {
  const [payslips, setPayslips]   = useState<PayslipRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { loadPayslips(); }, []);

  const loadPayslips = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc("link_my_application");

      const { data: app } = await supabase
        .from("partner_applications")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!app) return;

      const { data, error } = await supabase
        .from("payslips")
        .select("id, period_year, period_month, pdf_storage_path, created_at, payroll_entry:payroll_entry_id(hours_worked, deliveries, gross_salary, tax_amount, net_salary, employer_fee)")
        .eq("partner_application_id", app.id)
        .order("period_year", { ascending: false })
        .order("period_month", { ascending: false });

      if (error) throw error;
      setPayslips((data as unknown as PayslipRow[]) || []);
    } catch (err: any) {
      toast({ title: "Error loading payslips", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleViewPdf = async (path: string) => {
    try {
      const { data } = await supabase.storage
        .from("payslips")
        .createSignedUrl(path, 3600);
      if (data?.signedUrl) {
        setPreviewUrl(data.signedUrl);
      }
    } catch {
      toast({ title: "Could not load PDF", variant: "destructive" });
    }
  };

  // YTD stats (current year)
  const currentYear = new Date().getFullYear();
  const ytd = payslips.filter(p => p.period_year === currentYear);
  const ytdGross = ytd.reduce((s, p) => s + (p.payroll_entry?.gross_salary ?? 0), 0);
  const ytdTax   = ytd.reduce((s, p) => s + (p.payroll_entry?.tax_amount ?? 0), 0);
  const ytdNet   = ytd.reduce((s, p) => s + (p.payroll_entry?.net_salary ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Payslips</h1>
        <p className="text-base text-muted-foreground mt-1">Your salary statements and payment history</p>
      </div>

      {/* YTD Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-5 text-center"><DollarSign className="h-5 w-5 text-primary mx-auto mb-2" /><p className="text-xl font-bold">{fmtSek(ytdGross)}</p><p className="text-sm text-muted-foreground mt-1">YTD Gross</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><TrendingUp className="h-5 w-5 text-amber-500 mx-auto mb-2" /><p className="text-xl font-bold">{fmtSek(ytdTax)}</p><p className="text-sm text-muted-foreground mt-1">YTD Tax Paid</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><DollarSign className="h-5 w-5 text-primary mx-auto mb-2" /><p className="text-xl font-bold">{fmtSek(ytdNet)}</p><p className="text-sm text-muted-foreground mt-1">YTD Net</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><Calendar className="h-5 w-5 text-muted-foreground mx-auto mb-2" /><p className="text-xl font-bold">{ytd.length}</p><p className="text-sm text-muted-foreground mt-1">Payslips {currentYear}</p></CardContent></Card>
      </div>

      {payslips.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No payslips yet</h2>
            <p className="text-muted-foreground">Payslips will appear here once your first payroll has been processed by AM:365.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payslips.map(p => {
            const pe = p.payroll_entry;
            const periodLabel = `${MONTH_NAMES[(p.period_month - 1) % 12]} ${p.period_year}`;
            return (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Receipt className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-lg font-semibold">{periodLabel}</p>
                          <Badge variant="default" className="text-xs">Paid</Badge>
                        </div>
                        {pe && (
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span className="text-muted-foreground">Gross: <span className="text-foreground font-medium">{fmtSek(pe.gross_salary)}</span></span>
                            <span className="text-muted-foreground">Tax: <span className="text-foreground font-medium">-{fmtSek(pe.tax_amount)}</span></span>
                            <span className="text-muted-foreground">Net: <span className="text-primary font-semibold">{fmtSek(pe.net_salary)}</span></span>
                          </div>
                        )}
                        {pe && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {pe.hours_worked !== null ? `${pe.hours_worked}h worked` : ""}
                            {pe.deliveries ? ` · ${pe.deliveries} deliveries` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {p.pdf_storage_path && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleViewPdf(p.pdf_storage_path!)}>
                            <Eye className="h-3.5 w-3.5 mr-1" /> View
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleViewPdf(p.pdf_storage_path!)}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {!p.pdf_storage_path && (
                        <Badge variant="outline" className="text-xs">PDF not available</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* PDF Preview overlay */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <div className="bg-card rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <h3 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Payslip</h3>
              <div className="flex gap-2">
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Download</Button>
                </a>
                <Button variant="ghost" size="sm" onClick={() => setPreviewUrl(null)}>Close</Button>
              </div>
            </div>
            <iframe src={previewUrl} className="w-full h-[75vh]" title="Payslip PDF" />
          </div>
        </div>
      )}
    </div>
  );
}
