import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ShieldCheck, CheckCircle, XCircle, Eye, Clock, FileText, User,
  Send, AlertTriangle, Loader2, Search,
  Mail, MapPin, Phone, Download, ZoomIn, RotateCw, X
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContractEditor } from "@/components/ContractEditor";
import { contractTemplates } from "@/lib/contractTemplates";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Application = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  street_address: string;
  apartment: string | null;
  post_code: string;
  personal_number: string;
  transport: string;
  status: string;
  created_at: string;
  id_verified: boolean | null;
  documents_verified: boolean | null;
  address_verified: boolean | null;
  bank_details_verified: boolean | null;
  review_notes: string | null;
  user_id: string | null;
};

// SOW-defined structured rejection reason codes
const REJECTION_REASONS = [
  { value: "blurry_photo", label: "Blurry or illegible photo" },
  { value: "expired_document", label: "Document is expired" },
  { value: "name_mismatch", label: "Name does not match application" },
  { value: "type_not_accepted", label: "Document type not accepted" },
  { value: "incomplete_document", label: "Document incomplete (missing back side)" },
  { value: "poor_lighting", label: "Poor lighting or glare" },
  { value: "other", label: "Other (specify in notes)" },
];

type PartnerDoc = {
  id: string;
  document_type: string;
  file_url: string;
  status: string;
  rejection_reason: string | null;
};

type Contract = {
  id: string;
  application_id: string;
  contract_content: string | null;
  status: string;
  sent_at: string | null;
  signed_at: string | null;
  signing_link: string | null;
};

const defaultContractTemplate = (app: Application) => `
EMPLOYMENT CONTRACT — AM:365 GROUP AB

EMPLOYER: AM365 Group AB, Stockholm, Sweden (Org. Nr: 559XXX-XXXX)
EMPLOYEE: ${app.first_name} ${app.last_name}
PERSONAL NUMBER: ${app.personal_number}
ADDRESS: ${app.street_address}${app.apartment ? `, ${app.apartment}` : ""}, ${app.post_code} ${app.city}

1. POSITION
The Employee is engaged as a Delivery Partner under the Employer of Record (EoR) arrangement with AM:365 Group AB.

2. EMPLOYMENT TYPE
Employment Type: Variable hours (anställning med varierande arbetstid)
Start Date: [To be determined upon signing]
Transport Mode: ${app.transport.charAt(0).toUpperCase() + app.transport.slice(1)}

3. COMPENSATION
- Hourly rate as per collective agreement and platform rate
- Overtime compensation per Swedish labor law
- Holiday pay (semesterlön) at 12% of gross salary

4. BENEFITS
- Occupational pension (tjänstepension) from day one
- Accident insurance (TFA)
- Health insurance
- Sick pay (sjuklön) as per Swedish law

5. WORKING CONDITIONS
- The Employee will perform delivery services through platform partners (Wolt, Foodora, etc.)
- Scheduling will be coordinated through the AM:365 workforce platform
- The Employee must maintain valid identification and work permits

6. TERMINATION
- Notice period: 1 month for both parties
- Immediate termination for gross misconduct

7. GDPR & DATA PROTECTION
Personal data is processed in accordance with GDPR. See our privacy policy at am365group.se/privacy.

8. GOVERNING LAW
This contract is governed by Swedish law.

SIGNATURES

Employer: AM365 Group AB
By: _________________________ Date: _________

Employee: ${app.first_name} ${app.last_name}
Signature: _________________________ Date: _________
`;

export default function AdminVerification() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [contractContent, setContractContent] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("standard_eor");
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [partnerDocs, setPartnerDocs] = useState<PartnerDoc[]>([]);
  const [rejectionCode, setRejectionCode] = useState("blurry_photo");
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docPreviewIsPdf, setDocPreviewIsPdf] = useState(false);
  const [verifyChecks, setVerifyChecks] = useState({
    id_verified: false,
    address_verified: false,
    bank_details_verified: false,
    documents_verified: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("partner_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications((data as Application[]) || []);
    } catch (err) {
      console.error("Error loading applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch = !searchTerm || 
      `${app.first_name} ${app.last_name} ${app.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === "pending") return matchesSearch && ["pending", "email_verified", "under_review"].includes(app.status);
    if (activeTab === "verified") return matchesSearch && ["verified", "contract_sent", "contract_signed"].includes(app.status);
    if (activeTab === "active") return matchesSearch && app.status === "active";
    if (activeTab === "rejected") return matchesSearch && app.status === "rejected";
    return matchesSearch;
  });

  const handleReview = async (app: Application) => {
    setSelectedApp(app);
    setReviewNotes(app.review_notes || "");
    setRejectionCode("blurry_photo");
    setDocPreviewUrl(null);
    setVerifyChecks({
      id_verified: app.id_verified ?? false,
      address_verified: app.address_verified ?? false,
      bank_details_verified: app.bank_details_verified ?? false,
      documents_verified: app.documents_verified ?? false,
    });
    setShowReviewDialog(true);

    // Load submitted documents for this application
    const { data: docs } = await supabase
      .from("partner_documents")
      .select("id, document_type, file_url, status, rejection_reason")
      .eq("application_id", app.id);
    setPartnerDocs(docs || []);
  };

  const handleDocPreview = async (doc: PartnerDoc) => {
    const { data } = await supabase.storage
      .from("partner-documents")
      .createSignedUrl(doc.file_url, 3600);
    if (data?.signedUrl) {
      setDocPreviewUrl(data.signedUrl);
      setDocPreviewIsPdf(doc.file_url.toLowerCase().endsWith(".pdf"));
    }
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      const { error: updateError } = await supabase
        .from("partner_applications")
        .update({
          status: "verified",
          id_verified: verifyChecks.id_verified,
          documents_verified: verifyChecks.documents_verified,
          address_verified: verifyChecks.address_verified,
          bank_details_verified: verifyChecks.bank_details_verified,
          review_notes: reviewNotes,
        })
        .eq("id", selectedApp.id);

      if (updateError) throw updateError;

      // Send verification done email (non-blocking)
      supabase.functions.invoke("send-registration-email", {
        body: { to: selectedApp.email, template: "verificationDone", data: { firstName: selectedApp.first_name } },
      });

      // Audit log (non-blocking – best effort)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        supabase.rpc("log_audit_event", {
          p_user_id: user.id,
          p_action: "application_approved",
          p_entity_type: "partner_application",
          p_entity_id: selectedApp.id,
          p_after: { status: "verified", notes: reviewNotes },
        });
      }

      toast({ title: "Application approved", description: `${selectedApp.first_name} ${selectedApp.last_name} has been verified.` });
      setShowReviewDialog(false);
      loadApplications();
    } catch (err: any) {
      toast({ title: "Error approving application", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    const rejectionLabel = REJECTION_REASONS.find(r => r.value === rejectionCode)?.label ?? rejectionCode;
    const fullReason = reviewNotes ? `${rejectionLabel}: ${reviewNotes}` : rejectionLabel;

    setActionLoading(true);
    try {
      const { error: updateError } = await supabase
        .from("partner_applications")
        .update({ status: "rejected", review_notes: fullReason })
        .eq("id", selectedApp.id);

      if (updateError) throw updateError;

      // Update all pending docs with the rejection reason (non-blocking)
      for (const doc of partnerDocs.filter(d => d.status === "uploaded")) {
        supabase.from("partner_documents")
          .update({ status: "rejected", rejection_reason: fullReason })
          .eq("id", doc.id);
      }

      supabase.functions.invoke("send-registration-email", {
        body: {
          to: selectedApp.email,
          template: "notification",
          data: { firstName: selectedApp.first_name, title: "Application Update", message: `Your documents need attention: ${fullReason}` },
        },
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        supabase.rpc("log_audit_event", {
          p_user_id: user.id,
          p_action: "application_rejected",
          p_entity_type: "partner_application",
          p_entity_id: selectedApp.id,
          p_after: { status: "rejected", reason_code: rejectionCode, notes: reviewNotes },
        });
      }

      toast({ title: "Application rejected", description: "Partner has been notified with the reason." });
      setShowReviewDialog(false);
      loadApplications();
    } catch (err: any) {
      toast({ title: "Error rejecting application", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!selectedApp || !reviewNotes) {
      toast({ title: "Notes required", description: "Please specify what information is needed.", variant: "destructive" });
      return;
    }
    setActionLoading(true);
    try {
      await supabase
        .from("partner_applications")
        .update({ status: "under_review", review_notes: reviewNotes })
        .eq("id", selectedApp.id);

      await supabase.functions.invoke("send-registration-email", {
        body: {
          to: selectedApp.email,
          template: "documentReminder",
          data: { firstName: selectedApp.first_name, documentType: reviewNotes },
        },
      });

      toast({ title: "Info requested", description: "Partner has been notified to provide additional information." });
      setShowReviewDialog(false);
      loadApplications();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenContract = (app: Application) => {
    setSelectedApp(app);
    const template = contractTemplates.find(t => t.id === selectedTemplateId) ?? contractTemplates[0];
    setContractContent(template.generate(app));
    setShowContractDialog(true);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (selectedApp) {
      const template = contractTemplates.find(t => t.id === templateId) ?? contractTemplates[0];
      setContractContent(template.generate(selectedApp));
    }
  };

  const handleSendContract = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      const signingLink = `${window.location.origin}/partner/contract?sign=${selectedApp.id}`;

      // Create or update contract
      const { data: existing } = await supabase
        .from("partner_contracts")
        .select("id")
        .eq("application_id", selectedApp.id)
        .maybeSingle();

      if (existing) {
        await supabase.from("partner_contracts")
          .update({ contract_content: contractContent, status: "sent", sent_at: new Date().toISOString(), signing_link: signingLink, partner_user_id: selectedApp.user_id })
          .eq("id", existing.id);
      } else {
        await supabase.from("partner_contracts").insert({
          application_id: selectedApp.id,
          contract_content: contractContent,
          status: "sent",
          sent_at: new Date().toISOString(),
          signing_link: signingLink,
          partner_user_id: selectedApp.user_id,
        });
      }

      // Update application status
      await supabase.from("partner_applications")
        .update({ status: "contract_sent" })
        .eq("id", selectedApp.id);

      // Send contract email
      await supabase.functions.invoke("send-registration-email", {
        body: {
          to: selectedApp.email,
          template: "contractSigning",
          data: { firstName: selectedApp.first_name, signingLink },
        },
      });

      await supabase.from("onboarding_events").insert({
        application_id: selectedApp.id,
        event_type: "contract_sent",
        notes: "Contract sent for signing",
      });

      toast({ title: "Contract sent! 📝", description: `Contract sent to ${selectedApp.first_name} ${selectedApp.last_name}` });
      setShowContractDialog(false);
      loadApplications();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishPartner = async (app: Application) => {
    setActionLoading(true);
    try {
      await supabase.from("partner_applications")
        .update({ status: "active" })
        .eq("id", app.id);

      // Send welcome email
      await supabase.functions.invoke("send-registration-email", {
        body: { to: app.email, template: "welcome", data: { firstName: app.first_name } },
      });

      await supabase.from("onboarding_events").insert({
        application_id: app.id,
        event_type: "activated",
        notes: "Partner published to resource pool",
      });

      toast({ title: "Partner activated! 🎉", description: `${app.first_name} ${app.last_name} is now active.` });
      loadApplications();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const statusCounts = {
    pending: applications.filter((a) => ["pending", "email_verified", "under_review"].includes(a.status)).length,
    verified: applications.filter((a) => ["verified", "contract_sent", "contract_signed"].includes(a.status)).length,
    active: applications.filter((a) => a.status === "active").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      email_verified: { variant: "secondary", label: "Email Verified" },
      under_review: { variant: "secondary", label: "Under Review" },
      verified: { variant: "default", label: "Verified" },
      contract_sent: { variant: "secondary", label: "Contract Sent" },
      contract_signed: { variant: "default", label: "Contract Signed" },
      active: { variant: "default", label: "Active" },
      rejected: { variant: "destructive", label: "Rejected" },
    };
    const cfg = map[status] || { variant: "outline" as const, label: status };
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  const getTransportIcon = (transport: string) => {
    if (transport === "bicycle") return "🚲";
    if (transport === "moped") return "🛵";
    if (transport === "car") return "🚗";
    return "🚗";
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Partner Verification & Onboarding</h1>
          <p className="text-base text-muted-foreground mt-1">Review applications, verify documents, manage contracts</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-5 md:grid-cols-4">
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-amber-500">{statusCounts.pending}</p><p className="text-sm text-muted-foreground mt-1">Pending Review</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-primary">{statusCounts.verified}</p><p className="text-sm text-muted-foreground mt-1">Verified / Contract</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-primary">{statusCounts.active}</p><p className="text-sm text-muted-foreground mt-1">Active Partners</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-destructive">{statusCounts.rejected}</p><p className="text-sm text-muted-foreground mt-1">Rejected</p></CardContent></Card>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." className="pl-9 h-11" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
          <TabsTrigger value="verified">Verified ({statusCounts.verified})</TabsTrigger>
          <TabsTrigger value="active">Active ({statusCounts.active})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({statusCounts.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredApps.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">No applications found in this category.</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {filteredApps.map((app) => (
                <Card key={app.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-5">
                        <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                          <User className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <p className="text-lg font-semibold">{app.first_name} {app.last_name}</p>
                            {getStatusBadge(app.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {app.email}</span>
                            <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {app.phone}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {app.city}</span>
                            <span>{getTransportIcon(app.transport)} {app.transport}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(app.created_at).toLocaleDateString()}</span>
                          </div>
                          {app.review_notes && (
                            <p className="text-sm text-amber-600 mt-2 flex items-start gap-1">
                              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {app.review_notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {["pending", "email_verified", "under_review"].includes(app.status) && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleReview(app)}>
                              <Eye className="mr-1.5 h-3.5 w-3.5" /> Review
                            </Button>
                          </>
                        )}
                        {app.status === "verified" && (
                          <Button size="sm" onClick={() => handleOpenContract(app)}>
                            <FileText className="mr-1.5 h-3.5 w-3.5" /> Send Contract
                          </Button>
                        )}
                        {app.status === "contract_signed" && (
                          <Button size="sm" className="bg-primary" onClick={() => handlePublishPartner(app)}>
                            <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Publish to Pool
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Review Application</DialogTitle>
            <DialogDescription>
              {selectedApp && `${selectedApp.first_name} ${selectedApp.last_name} — ${selectedApp.email}`}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-5">
              {/* Application Details */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/50 border text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                  <p className="font-medium">{selectedApp.first_name} {selectedApp.last_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Personal Number</p>
                  {/* Masked for security — Admin role only sees full value via DB function */}
                  <p className="font-medium font-mono text-muted-foreground tracking-widest">
                    {selectedApp.personal_number
                      ? selectedApp.personal_number.replace(/^(\d{8})(.+)$/, "$1-****")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{selectedApp.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <p className="font-medium">{selectedApp.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Address</p>
                  <p className="font-medium">{selectedApp.street_address}{selectedApp.apartment ? `, ${selectedApp.apartment}` : ""}</p>
                  <p className="text-muted-foreground">{selectedApp.post_code} {selectedApp.city}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Transport</p>
                  <p className="font-medium">{getTransportIcon(selectedApp.transport)} {selectedApp.transport}</p>
                </div>
              </div>

              {/* Submitted Documents */}
              <div className="space-y-2">
                <p className="font-semibold text-base">Submitted Documents</p>
                {partnerDocs.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50 border">No documents uploaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {partnerDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-sm font-medium capitalize">{doc.document_type.replace(/_/g, " ")}</p>
                            <p className="text-xs text-muted-foreground capitalize">{doc.status}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleDocPreview(doc)}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Inline document preview */}
              {docPreviewUrl && (
                <div className="rounded-xl border overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-muted border-b">
                    <span className="text-sm font-medium">Document Preview</span>
                    <div className="flex gap-1">
                      <a href={docPreviewUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm"><Download className="h-3.5 w-3.5" /></Button>
                      </a>
                      <Button variant="ghost" size="sm" onClick={() => setDocPreviewUrl(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {docPreviewIsPdf ? (
                    <iframe src={docPreviewUrl} className="w-full h-64" title="Document preview" />
                  ) : (
                    <img src={docPreviewUrl} alt="Document" className="w-full max-h-64 object-contain bg-black/5" />
                  )}
                </div>
              )}

              {/* Verification Checklist — interactive */}
              <div className="space-y-2">
                <p className="font-semibold text-base">Verification Checklist</p>
                <div className="space-y-3 p-4 rounded-xl bg-muted/50 border">
                  {([
                    { key: "id_verified" as const, label: "ID Document verified against application data" },
                    { key: "documents_verified" as const, label: "All required documents uploaded and legible" },
                    { key: "address_verified" as const, label: "Address confirmed" },
                    { key: "bank_details_verified" as const, label: "Bank details confirmed" },
                  ]).map((item) => (
                    <div key={item.key} className="flex items-center gap-3">
                      <Checkbox
                        id={item.key}
                        checked={verifyChecks[item.key]}
                        onCheckedChange={(checked) =>
                          setVerifyChecks(prev => ({ ...prev, [item.key]: !!checked }))
                        }
                        className="h-5 w-5"
                      />
                      <label
                        htmlFor={item.key}
                        className={`text-sm cursor-pointer select-none ${verifyChecks[item.key] ? "text-foreground font-medium" : "text-muted-foreground"}`}
                      >
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejection Reason (structured) */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Rejection Reason</Label>
                <Select value={rejectionCode} onValueChange={setRejectionCode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REJECTION_REASONS.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Review Notes */}
              <div className="space-y-2">
                <Label>Additional Notes (optional)</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any specific details for the partner..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleRequestInfo} disabled={actionLoading}>
              <Mail className="mr-1.5 h-3.5 w-3.5" /> Request Info
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
              <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
            </Button>
            <Button onClick={handleApprove} disabled={actionLoading} className="bg-primary text-primary-foreground">
              {actionLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="mr-1.5 h-3.5 w-3.5" />}
              Approve & Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contract Dialog */}
      <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Edit & Send Contract
            </DialogTitle>
            <DialogDescription>
              {selectedApp && `Contract for ${selectedApp.first_name} ${selectedApp.last_name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Template selector */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4 rounded-xl bg-muted/50 border">
              <div className="flex-1 space-y-1">
                <Label className="text-sm">Contract Template</Label>
                <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                  <SelectTrigger className="w-full sm:w-80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contractTemplates.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        <div>
                          <p className="font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="outline" className="shrink-0">Draft — edit before sending</Badge>
            </div>

            {/* Tiptap rich-text editor */}
            <ContractEditor
              content={contractContent}
              onChange={setContractContent}
              editable={true}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContractDialog(false)}>Cancel</Button>
            <Button onClick={handleSendContract} disabled={actionLoading} className="bg-primary text-primary-foreground">
              {actionLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
              Send Contract for Signing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
