import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload, FileText, CheckCircle, Clock, AlertCircle, Eye,
  XCircle, Info, Download, Send, Loader2, ShieldCheck, Car,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type DocRecord = {
  id: string;
  document_type: string;
  doc_category: string | null;
  file_url: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  expiry_date: string | null;
  id_number: string | null;
};

type DocSlot = {
  category: "skatteverket_id" | "driving_license";
  label: string;
  icon: React.ElementType;
  description: string;
  required: boolean;
  hasPersonalNumber: boolean;   // only skatteverket_id asks for personnummer
};

function buildSlots(transport: string): DocSlot[] {
  const slots: DocSlot[] = [
    {
      category: "skatteverket_id",
      label: "Skatteverket ID",
      icon: ShieldCheck,
      description:
        "Upload your Skatteverket identity document (Skattsedel / Tax Certificate). You will also enter your personnummer or coordination number below.",
      required: true,
      hasPersonalNumber: true,
    },
  ];
  if (transport === "car" || transport === "moped") {
    slots.push({
      category: "driving_license",
      label: "Driving Licence",
      icon: Car,
      description:
        "Upload your valid Swedish driving licence (both front and back). Required for your transport type.",
      required: true,
      hasPersonalNumber: false,
    });
  }
  return slots;
}

const STATUS_CONFIG = {
  missing:  { label: "Required",     variant: "outline" as const,      Icon: AlertCircle,  iconColor: "text-muted-foreground", borderClass: "border-dashed border-border" },
  uploaded: { label: "Under Review", variant: "secondary" as const,    Icon: Clock,        iconColor: "text-amber-500",        borderClass: "border-amber-500/30" },
  verified: { label: "Verified",     variant: "default" as const,      Icon: CheckCircle,  iconColor: "text-primary",          borderClass: "border-primary/30" },
  rejected: { label: "Rejected",     variant: "destructive" as const,  Icon: XCircle,      iconColor: "text-destructive",      borderClass: "border-destructive/30" },
};

export default function PartnerDocuments() {
  const [userId, setUserId]           = useState<string | null>(null);
  const [application, setApplication] = useState<any>(null);
  const [documents, setDocuments]     = useState<DocRecord[]>([]);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [uploading, setUploading]     = useState<Record<string, boolean>>({});
  const [thumbnails, setThumbnails]   = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null);
  const [previewIsPdf, setPreviewIsPdf] = useState(false);
  const [previewDocName, setPreviewDocName] = useState("");

  // Personnummer input (only for Skatteverket doc slot)
  const [personnummer, setPersonnummer] = useState("");
  const [pnError, setPnError]           = useState("");

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.rpc("link_my_application");

      const { data: app } = await supabase
        .from("partner_applications")
        .select("id, reg_path, status, documents_submitted_at, transport, personal_number")
        .eq("user_id", user.id)
        .maybeSingle();

      setUserId(user.id);
      if (app) {
        setApplication(app);
        // Pre-fill personnummer if already saved
        if (app.personal_number) setPersonnummer(app.personal_number);

        const { data: docs } = await supabase
          .from("partner_documents")
          .select("id, document_type, doc_category, file_url, status, rejection_reason, created_at, expiry_date, id_number")
          .eq("application_id", app.id)
          .order("created_at", { ascending: false });
        setDocuments(docs as DocRecord[] || []);
        loadThumbnails(docs as DocRecord[] || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadThumbnails = async (docs: DocRecord[]) => {
    const thumbs: Record<string, string> = {};
    for (const doc of docs) {
      if (doc.file_url && !doc.file_url.toLowerCase().endsWith(".pdf")) {
        try {
          const { data } = await supabase.storage
            .from("partner-documents")
            .createSignedUrl(doc.file_url, 3600);
          if (data?.signedUrl) thumbs[doc.id] = data.signedUrl;
        } catch { /* skip */ }
      }
    }
    setThumbnails(thumbs);
  };

  const getDoc = (category: string): DocRecord | undefined =>
    documents.find(d => d.doc_category === category);

  /* ---- personnummer validation ---- */
  const validatePN = (value: string): string => {
    const cleaned = value.replace(/[-\s]/g, "");
    if (!cleaned) return "Personnummer or coordination number is required";
    if (!/^\d{10,12}$/.test(cleaned)) return "Enter in format YYYYMMDD-XXXX or YYYYMMDDXXXX";
    return "";
  };

  /* ---- save personnummer to application ---- */
  const savePersonnummer = async (): Promise<boolean> => {
    if (!application) return true;
    const err = validatePN(personnummer);
    if (err) { setPnError(err); return false; }
    const { error } = await supabase
      .from("partner_applications")
      .update({ personal_number: personnummer.trim(), updated_at: new Date().toISOString() })
      .eq("id", application.id);
    if (error) {
      toast({ title: "Could not save ID number", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  };

  /* ---- upload ---- */
  const handleUpload = async (category: "skatteverket_id" | "driving_license", file: File) => {
    if (!application || !userId) return;

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 50 MB.", variant: "destructive" }); return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
      toast({ title: "Invalid file type", description: "Only PDF, JPG, PNG, and WEBP are accepted.", variant: "destructive" }); return;
    }

    // Save personnummer first if this is the Skatteverket slot
    if (category === "skatteverket_id") {
      const ok = await savePersonnummer();
      if (!ok) return;
    }

    setUploading(prev => ({ ...prev, [category]: true }));
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const filePath = `${userId}/${category}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("partner-documents")
        .upload(filePath, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;

      const existingDoc = getDoc(category);
      if (existingDoc) {
        await supabase.from("partner_documents").update({
          file_url: filePath, status: "uploaded",
          rejection_reason: null, document_type: category,
        }).eq("id", existingDoc.id);
      } else {
        await supabase.from("partner_documents").insert({
          application_id: application.id,
          document_type: category,
          doc_category: category,
          file_url: filePath,
          status: "uploaded",
        });
      }
      toast({ title: "Document uploaded ✓", description: "Submitted for review." });
      await loadData();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(prev => ({ ...prev, [category]: false }));
    }
  };

  const handlePreview = async (doc: DocRecord) => {
    try {
      const { data } = await supabase.storage
        .from("partner-documents")
        .createSignedUrl(doc.file_url, 3600);
      if (data?.signedUrl) {
        setPreviewUrl(data.signedUrl);
        setPreviewIsPdf(doc.file_url.toLowerCase().endsWith(".pdf"));
        setPreviewDocName(doc.doc_category?.replace(/_/g, " ") ?? doc.document_type.replace(/_/g, " "));
      }
    } catch {
      toast({ title: "Preview failed", description: "Could not load document preview.", variant: "destructive" });
    }
  };

  const handleSubmitDocuments = async () => {
    if (!application) return;
    const slots = buildSlots(application.transport ?? "bicycle");

    // Validate personnummer is filled
    const pnErr = validatePN(personnummer);
    if (pnErr) { setPnError(pnErr); return; }

    const missing = slots.filter(s => !getDoc(s.category));
    if (missing.length > 0) {
      toast({
        title: "Documents missing",
        description: `Please upload: ${missing.map(s => s.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await savePersonnummer();
      const { error } = await supabase
        .from("partner_applications")
        .update({ status: "under_review", documents_submitted_at: new Date().toISOString() })
        .eq("id", application.id);
      if (error) throw error;
      toast({ title: "Documents submitted for review ✓", description: "AM:365 staff will verify your documents and notify you by email." });
      await loadData();
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const slots = buildSlots(application?.transport ?? "bicycle");
  const totalRequired = slots.length;
  const totalUploaded = slots.filter(s => getDoc(s.category)).length;
  const totalVerified = slots.filter(s => getDoc(s.category)?.status === "verified").length;
  const allUploaded   = totalUploaded === totalRequired;
  const alreadySubmitted = !!application?.documents_submitted_at;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">My Documents</h1>
        <p className="text-base text-muted-foreground mt-1">Upload and manage your verification documents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold">{totalRequired}</p><p className="text-sm text-muted-foreground mt-1">Required</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-amber-500">{totalUploaded}</p><p className="text-sm text-muted-foreground mt-1">Uploaded</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-primary">{totalVerified}</p><p className="text-sm text-muted-foreground mt-1">Verified</p></CardContent></Card>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm">
        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-700 dark:text-blue-400">Accepted formats</p>
          <p className="text-muted-foreground mt-0.5">
            PDF, JPG, PNG, WEBP — max 50 MB per file. All documents are encrypted and stored securely in Sweden (EU).
          </p>
        </div>
      </div>

      {/* Document slots */}
      <div className="space-y-6">
        {slots.map((slot) => {
          const doc = getDoc(slot.category);
          const isUploading = uploading[slot.category] ?? false;
          const statusKey = (doc?.status ?? "missing") as keyof typeof STATUS_CONFIG;
          const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.missing;
          const { Icon: StatusIcon } = cfg;
          const SlotIcon = slot.icon;

          return (
            <Card key={slot.category} className={`border-2 ${cfg.borderClass} transition-all`}>
              <CardContent className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                      statusKey === "verified" ? "bg-primary/10" :
                      statusKey === "rejected" ? "bg-destructive/10" :
                      statusKey === "uploaded" ? "bg-amber-500/10" : "bg-muted"
                    }`}>
                      <SlotIcon className={`h-6 w-6 ${cfg.iconColor}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{slot.label}</h3>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{slot.description}</p>
                    </div>
                  </div>
                  {doc && (
                    <Button variant="ghost" size="sm" className="shrink-0" onClick={() => handlePreview(doc)}>
                      <Eye className="h-4 w-4 mr-1" /> Preview
                    </Button>
                  )}
                </div>

                {/* Rejection reason */}
                {statusKey === "rejected" && doc?.rejection_reason && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-destructive">Reason for rejection</p>
                      <p className="text-sm text-muted-foreground mt-1">{doc.rejection_reason}</p>
                    </div>
                  </div>
                )}

                {/* Personnummer input — only for Skatteverket slot, when not yet verified */}
                {slot.hasPersonalNumber && statusKey !== "verified" && (
                  <div className="space-y-1.5 p-4 rounded-xl bg-muted/40 border">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      Personnummer / Coordination Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="YYYYMMDD-XXXX"
                      value={personnummer}
                      onChange={e => { setPersonnummer(e.target.value); setPnError(""); }}
                      className={`font-mono ${pnError ? "border-destructive" : ""}`}
                      maxLength={13}
                    />
                    {pnError ? (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {pnError}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Your personnummer or samordningsnummer. Required for employment registration with Skatteverket. Stored securely and only visible to AM:365 administrators.
                      </p>
                    )}
                  </div>
                )}

                {/* Verified / uploaded preview */}
                {(statusKey === "uploaded" || statusKey === "verified") && doc && (
                  <div className="space-y-3">
                    {thumbnails[doc.id] ? (
                      <div className="relative rounded-xl overflow-hidden border bg-black/5 h-48">
                        <img
                          src={thumbnails[doc.id]}
                          alt="Document preview"
                          className="w-full h-full object-contain cursor-pointer"
                          onClick={() => handlePreview(doc)}
                        />
                        <div className="absolute top-2 right-2">
                          <Button variant="secondary" size="sm" className="h-7 text-xs shadow" onClick={() => handlePreview(doc)}>
                            <Eye className="h-3 w-3 mr-1" /> View full
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border">
                        <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">PDF Document</p>
                          <p className="text-xs text-muted-foreground">{doc.file_url.split("/").pop()}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handlePreview(doc)}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium capitalize">{doc.doc_category?.replace(/_/g, " ") ?? slot.label}</p>
                        <p className="text-xs text-muted-foreground">
                          Submitted {new Date(doc.created_at).toLocaleDateString("sv-SE")}
                          {doc.expiry_date && ` · Expires ${new Date(doc.expiry_date).toLocaleDateString("sv-SE")}`}
                        </p>
                      </div>
                      {statusKey === "verified" && <CheckCircle className="h-5 w-5 text-primary shrink-0" />}
                      {statusKey === "uploaded" && <Clock className="h-5 w-5 text-amber-500 shrink-0" />}
                    </div>
                    {/* Allow re-upload if rejected */}
                    {statusKey !== "verified" && (
                      <Button
                        variant="outline" size="sm"
                        onClick={() => fileInputRefs.current[slot.category]?.click()}
                        disabled={isUploading}
                      >
                        <Upload className="h-3.5 w-3.5 mr-1.5" /> Replace document
                      </Button>
                    )}
                  </div>
                )}

                {/* Upload area */}
                {(statusKey === "missing" || statusKey === "rejected") && (
                  <>
                    <input
                      ref={el => { fileInputRefs.current[slot.category] = el; }}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(slot.category, file);
                        e.target.value = "";
                      }}
                    />
                    <div
                      className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                      onClick={() => !isUploading && fileInputRefs.current[slot.category]?.click()}
                    >
                      <Upload className={`h-10 w-10 mx-auto mb-3 ${isUploading ? "text-primary animate-bounce" : "text-muted-foreground"}`} />
                      <p className="font-medium mb-1">
                        {isUploading ? "Uploading, please wait…" : "Click or drag to upload"}
                      </p>
                      <p className="text-sm text-muted-foreground">PDF, JPG, PNG, WEBP · Max 50 MB</p>
                      {isUploading && (
                        <div className="mt-4 h-1.5 w-full max-w-xs mx-auto bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary animate-pulse rounded-full" />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Hidden file input for "replace" button */}
                {(statusKey === "uploaded") && (
                  <input
                    ref={el => { fileInputRefs.current[slot.category] = el; }}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(slot.category, file);
                      e.target.value = "";
                    }}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submit for Review */}
      {application && !alreadySubmitted && allUploaded && (
        <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-primary/5 border border-primary/20">
          <div className="text-center">
            <h3 className="font-semibold text-lg">Ready to submit for review?</h3>
            <p className="text-muted-foreground text-sm mt-1">
              All required documents have been uploaded. Click below to send your application for verification.
            </p>
          </div>
          <Button size="lg" className="w-full md:w-auto px-10" onClick={handleSubmitDocuments} disabled={submitting}>
            {submitting
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</>
              : <><Send className="mr-2 h-4 w-4" /> Submit Documents for Review</>}
          </Button>
        </div>
      )}

      {/* Submitted confirmation banner */}
      {alreadySubmitted && !["verified", "contract_sent", "contract_signed", "active"].includes(application?.status) && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-700 dark:text-amber-400">Documents submitted — under review</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Submitted on {new Date(application.documents_submitted_at).toLocaleDateString("sv-SE")}. Our team will verify your documents and notify you by email.
            </p>
          </div>
        </div>
      )}

      {/* Upload history */}
      {documents.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Upload History</h2>
          <Card>
            <CardContent className="p-0 divide-y">
              {documents.map(doc => {
                const statusCfg: Record<string, { label: string; color: string }> = {
                  uploaded: { label: "Under Review", color: "text-amber-500" },
                  verified: { label: "Verified",     color: "text-primary" },
                  rejected: { label: "Rejected",     color: "text-destructive" },
                };
                const c = statusCfg[doc.status] ?? { label: doc.status, color: "text-muted-foreground" };
                return (
                  <div key={doc.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-4">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium capitalize text-sm">
                          {(doc.doc_category ?? doc.document_type).replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">{doc.file_url.split("/").pop()}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded {new Date(doc.created_at).toLocaleDateString("sv-SE")}
                        </p>
                        {doc.rejection_reason && (
                          <p className="text-xs text-destructive mt-0.5">Reason: {doc.rejection_reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium ${c.color}`}>{c.label}</span>
                      <Button variant="outline" size="sm" onClick={() => handlePreview(doc)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview overlay */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <div
            className="bg-card rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <h3 className="font-semibold capitalize">{previewDocName}</h3>
              <div className="flex gap-2">
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Download</Button>
                </a>
                <Button variant="ghost" size="icon" onClick={() => setPreviewUrl(null)}>
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="overflow-auto flex-1">
              {previewIsPdf
                ? <iframe src={previewUrl} className="w-full h-[65vh]" title="Document preview" />
                : <img src={previewUrl} alt="Document preview" className="w-full h-auto object-contain" />
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
