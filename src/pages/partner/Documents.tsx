import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload, FileText, CheckCircle, Clock, AlertCircle, Eye, XCircle, Info, Download, Send, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// SOW-defined identity document options (all registration paths)
const ID_DOC_OPTIONS = [
  { value: "driving_licence", label: "Driving Licence" },
  { value: "passport", label: "Passport" },
  { value: "national_id", label: "National ID Card" },
  { value: "residency_card", label: "Residency Card (Uppehållstillstånd)" },
];

type DocRecord = {
  id: string;
  document_type: string;
  file_url: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  uploaded_at: string | null;
};

export default function PartnerDocuments() {
  const [userId, setUserId] = useState<string | null>(null);
  const [application, setApplication] = useState<any>(null);
  const [documents, setDocuments] = useState<DocRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [selectedIdType, setSelectedIdType] = useState("passport");
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewIsPdf, setPreviewIsPdf] = useState(false);
  const [previewDocName, setPreviewDocName] = useState("");
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Auto-link application.user_id by email so RLS queries succeed
      await supabase.rpc("link_my_application");

      const { data: app } = await supabase
        .from("partner_applications")
        .select("id, reg_path, status, documents_submitted_at")
        .eq("user_id", user.id)
        .maybeSingle();

      setUserId(user.id);
      if (app) {
        setApplication(app);
        const { data: docs } = await supabase
          .from("partner_documents")
          .select("*")
          .eq("application_id", app.id)
          .order("created_at", { ascending: false });
        setDocuments(docs || []);
        loadThumbnails(docs || []);
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

  const isManualPath = application?.reg_path === "manual";

  // Document slots required per registration path (SOW §3.2)
  const requiredSlots = [
    {
      key: "id_document",
      label: "Identity Document",
      required: true,
      description: "One valid photo ID: Driving Licence, Passport, National ID Card, or Residency Card. Both front and back if applicable.",
    },
    ...(isManualPath
      ? [{
          key: "skatt_id",
          label: "Skatt ID Certificate",
          required: true,
          description: "Your tax registration certificate (Skattsedel) issued by Skatteverket.",
        }]
      : []),
  ];

  // Resolve the stored doc for a slot
  const getDoc = (key: string): DocRecord | undefined => {
    if (key === "id_document") {
      return documents.find(d => ID_DOC_OPTIONS.some(opt => opt.value === d.document_type));
    }
    return documents.find(d => d.document_type === key);
  };

  const handleUpload = async (slotKey: string, file: File) => {
    if (!application || !userId) return;

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 50 MB.", variant: "destructive" });
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
      toast({ title: "Invalid file type", description: "Only PDF, JPG, PNG, and WEBP are accepted.", variant: "destructive" });
      return;
    }

    const docType = slotKey === "id_document" ? selectedIdType : slotKey;
    setUploading(prev => ({ ...prev, [slotKey]: true }));

    try {
      const ext = file.name.split(".").pop() ?? "bin";
      // Storage RLS: path must start with auth.uid() (userId), not application.id
      const filePath = `${userId}/${docType}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("partner-documents")
        .upload(filePath, file, { upsert: false, contentType: file.type });

      if (uploadError) throw uploadError;

      const existingDoc = getDoc(slotKey);
      if (existingDoc) {
        await supabase
          .from("partner_documents")
          .update({ file_url: filePath, status: "uploaded", rejection_reason: null })
          .eq("id", existingDoc.id);
      } else {
        await supabase.from("partner_documents").insert({
          application_id: application.id,
          document_type: docType,
          file_url: filePath,
          status: "uploaded",
        });
      }

      toast({ title: "Document uploaded", description: "Your document has been submitted for review." });
      await loadData();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(prev => ({ ...prev, [slotKey]: false }));
    }
  };

  const handlePreview = async (doc: DocRecord) => {
    try {
      const { data } = await supabase.storage
        .from("partner-documents")
        .createSignedUrl(doc.file_url, 3600);
      if (data?.signedUrl) {
        setPreviewUrl(data.signedUrl);
        setPreviewIsPdf(doc.file_url.toLowerCase().endsWith(".pdf") || doc.document_type.includes("pdf"));
        setPreviewDocName(doc.document_type.replace(/_/g, " "));
      }
    } catch {
      toast({ title: "Preview failed", description: "Could not load document preview.", variant: "destructive" });
    }
  };

  const handleSubmitDocuments = async () => {
    if (!application) return;

    // Validate all required slots are uploaded
    const missing = requiredSlots.filter(s => !getDoc(s.key));
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
      const { error } = await supabase
        .from("partner_applications")
        .update({ status: "under_review", documents_submitted_at: new Date().toISOString() })
        .eq("id", application.id);

      if (error) throw error;

      toast({
        title: "Documents submitted for review",
        description: "AM:365 staff will review your documents. You'll be notified once verified.",
      });
      await loadData();
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const totalRequired = requiredSlots.length;
  const totalUploaded = requiredSlots.filter(s => getDoc(s.key)).length;
  const totalPending = requiredSlots.filter(s => getDoc(s.key)?.status === "uploaded").length;
  const totalVerified = requiredSlots.filter(s => getDoc(s.key)?.status === "verified").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">My Documents</h1>
        <p className="text-base text-muted-foreground mt-1">Upload and manage your verification documents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-foreground">{totalRequired}</p><p className="text-sm text-muted-foreground mt-1">Required</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-blue-500">{totalUploaded}</p><p className="text-sm text-muted-foreground mt-1">Uploaded</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-amber-500">{totalPending}</p><p className="text-sm text-muted-foreground mt-1">Under Review</p></CardContent></Card>
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
        {requiredSlots.map((slot) => {
          const doc = getDoc(slot.key);
          const isUploading = uploading[slot.key] ?? false;
          const status = doc?.status ?? "missing";

          const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType; iconColor: string; borderClass: string }> = {
            missing:  { label: "Required",      variant: "outline",      icon: AlertCircle,   iconColor: "text-muted-foreground", borderClass: "border-dashed border-border" },
            uploaded: { label: "Under Review",  variant: "secondary",    icon: Clock,         iconColor: "text-amber-500",        borderClass: "border-amber-500/30" },
            verified: { label: "Verified",      variant: "default",      icon: CheckCircle,   iconColor: "text-primary",          borderClass: "border-primary/30" },
            rejected: { label: "Rejected",      variant: "destructive",  icon: XCircle,       iconColor: "text-destructive",      borderClass: "border-destructive/30" },
          };
          const cfg = statusConfig[status] ?? statusConfig.missing;
          const StatusIcon = cfg.icon;

          return (
            <Card key={slot.key} className={`border-2 ${cfg.borderClass} transition-all`}>
              <CardContent className="p-6 space-y-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                      status === "verified" ? "bg-primary/10" :
                      status === "rejected" ? "bg-destructive/10" :
                      status === "uploaded" ? "bg-amber-500/10" : "bg-muted"
                    }`}>
                      <StatusIcon className={`h-6 w-6 ${cfg.iconColor}`} />
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
                {status === "rejected" && doc?.rejection_reason && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-destructive">Reason for rejection</p>
                      <p className="text-sm text-muted-foreground mt-1">{doc.rejection_reason}</p>
                    </div>
                  </div>
                )}

                {/* Uploaded / Verified state */}
                {(status === "uploaded" || status === "verified") && doc && (
                  <div className="space-y-3">
                    {/* Thumbnail or PDF indicator */}
                    {thumbnails[doc.id] ? (
                      <div className="relative rounded-xl overflow-hidden border bg-black/5 h-48">
                        <img
                          src={thumbnails[doc.id]}
                          alt="Document preview"
                          className="w-full h-full object-contain cursor-pointer"
                          onClick={() => handlePreview(doc)}
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
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
                    {/* File info row */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium capitalize">{doc.document_type.replace(/_/g, " ")}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.file_url.split("/").pop()} · Submitted {new Date(doc.created_at).toLocaleDateString("sv-SE")}
                        </p>
                      </div>
                      {status === "verified" && <CheckCircle className="h-5 w-5 text-primary shrink-0" />}
                      {status === "uploaded" && <Clock className="h-5 w-5 text-amber-500 shrink-0" />}
                    </div>
                  </div>
                )}

                {/* Upload area (shown when missing or rejected) */}
                {(status === "missing" || status === "rejected") && (
                  <div className="space-y-4">
                    {/* ID type selector */}
                    {slot.key === "id_document" && (
                      <div className="space-y-1.5">
                        <Label>Select document type</Label>
                        <Select value={selectedIdType} onValueChange={setSelectedIdType}>
                          <SelectTrigger className="w-full md:w-80">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ID_DOC_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <input
                      ref={el => { fileInputRefs.current[slot.key] = el; }}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(slot.key, file);
                        e.target.value = "";
                      }}
                    />
                    <div
                      className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                      onClick={() => !isUploading && fileInputRefs.current[slot.key]?.click()}
                    >
                      <Upload className={`h-10 w-10 mx-auto mb-3 ${isUploading ? "text-primary animate-bounce" : "text-muted-foreground"}`} />
                      <p className="font-medium mb-1">
                        {isUploading ? "Uploading, please wait…" : status === "rejected" ? "Upload replacement document" : "Click or drag to upload"}
                      </p>
                      <p className="text-sm text-muted-foreground">PDF, JPG, PNG, WEBP · Max 50 MB</p>
                      {isUploading && (
                        <div className="mt-4 h-1.5 w-full max-w-xs mx-auto bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary animate-pulse rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submit for Review — shown when all docs uploaded but not yet submitted */}
      {application && !application.documents_submitted_at && totalUploaded === totalRequired && totalRequired > 0 && (
        <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-primary/5 border border-primary/20">
          <div className="text-center">
            <h3 className="font-semibold text-lg">Ready to submit for review?</h3>
            <p className="text-muted-foreground text-sm mt-1">
              All required documents have been uploaded. Click below to submit your application for verification.
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
      {application?.documents_submitted_at && !["verified", "contract_sent", "contract_signed", "active"].includes(application.status) && (
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

      {/* Document History — all uploads ever made */}
      {documents.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Upload History</h2>
          <Card>
            <CardContent className="p-0 divide-y">
              {documents.map(doc => {
                const statusConfig: Record<string, { label: string; color: string }> = {
                  uploaded: { label: "Under Review", color: "text-amber-500" },
                  verified: { label: "Verified",     color: "text-primary" },
                  rejected: { label: "Rejected",     color: "text-destructive" },
                };
                const cfg = statusConfig[doc.status] ?? { label: doc.status, color: "text-muted-foreground" };
                return (
                  <div key={doc.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-4">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium capitalize text-sm">{doc.document_type.replace(/_/g, " ")}</p>
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
                      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
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
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
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
              {previewIsPdf ? (
                <iframe src={previewUrl} className="w-full h-[65vh]" title="Document preview" />
              ) : (
                <img src={previewUrl} alt="Document preview" className="w-full h-auto object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
