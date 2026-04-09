import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DollarSign, Clock, Calendar, TrendingUp, ArrowUpRight, FileText,
  Truck, MapPin, Star, ChevronRight, Upload, CheckCircle, AlertCircle,
  User, Shield, FileCheck, Info, Loader2, XCircle, ShieldCheck, Car,
  Sparkles, ClipboardCheck, Mail, Briefcase, Send, ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingTour, TourStep } from "@/components/partner/OnboardingTour";

/* ── Tour steps ─────────────────────────────────────────────────────────── */
const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="tour-dashboard"]',
    title: "Your Dashboard",
    description: "This is your home base. Track your onboarding progress, upload documents, and see your status at a glance.",
    placement: "right",
  },
  {
    target: '[data-tour="tour-schedule"]',
    title: "Schedule",
    description: "Once active, view your upcoming shifts and delivery schedule here.",
    placement: "right",
  },
  {
    target: '[data-tour="tour-profile"]',
    title: "My Profile",
    description: "Review and update your personal information, address, and transport type.",
    placement: "right",
  },
  {
    target: '[data-tour="tour-contract"]',
    title: "Contract",
    description: "After verification, your employment contract will appear here for review and signing.",
    placement: "right",
  },
  {
    target: '[data-tour="tour-documents"]',
    title: "Documents",
    description: "Upload and manage your identity documents. You can also access the full document management page from here.",
    placement: "right",
  },
  {
    target: '[data-tour="tour-payslips"]',
    title: "Payslips",
    description: "View your monthly payslips and payment history once you start working.",
    placement: "right",
  },
  {
    target: '[data-tour="tour-notifications"]',
    title: "Notifications",
    description: "Stay updated with important messages about your application, shifts, and payments.",
    placement: "right",
  },
  {
    target: '[data-tour="tour-support"]',
    title: "Need Help?",
    description: "Contact our support team anytime. We're here to help you get started!",
    placement: "right",
  },
  {
    target: '[data-tour="welcome-docs"]',
    title: "Upload Your Documents",
    description: "Start by uploading your Skatteverket ID (and driving licence if applicable). Once uploaded, submit them for verification.",
    placement: "top",
  },
];

const TOUR_STORAGE_KEY = "am365_partner_tour_done";

/* ── How-it-works steps ─────────────────────────────────────────────────── */
const HOW_IT_WORKS = [
  { icon: ClipboardCheck, title: "Register", desc: "Create your account with basic info" },
  { icon: Upload, title: "Upload Documents", desc: "Skatteverket ID & driving licence" },
  { icon: Shield, title: "Verification", desc: "Our team reviews your documents" },
  { icon: Mail, title: "Contract", desc: "Receive & sign your employment contract" },
  { icon: Briefcase, title: "Start Working", desc: "Begin delivering and earning!" },
];

/* ── Doc slot types (aligned with Documents.tsx) ────────────────────────── */
type DocSlot = {
  category: "skatteverket_id" | "driving_license";
  label: string;
  icon: React.ElementType;
  description: string;
  required: boolean;
  hasPersonalNumber: boolean;
};

function buildSlots(transport: string): DocSlot[] {
  const slots: DocSlot[] = [
    {
      category: "skatteverket_id",
      label: "Skatteverket ID",
      icon: ShieldCheck,
      description: "Your tax registration certificate (Skattsedel) from Skatteverket.",
      required: true,
      hasPersonalNumber: true,
    },
  ];
  if (transport === "car" || transport === "moped") {
    slots.push({
      category: "driving_license",
      label: "Driving Licence",
      icon: Car,
      description: "Your valid Swedish driving licence (front & back).",
      required: true,
      hasPersonalNumber: false,
    });
  }
  return slots;
}

/* ── Active dashboard hardcoded stats ───────────────────────────────────── */
const stats = [
  { label: "Current Balance", value: "12,450 SEK", icon: DollarSign, change: "+8.2%", color: "text-primary", bg: "bg-primary/10" },
  { label: "Hours This Month", value: "142h", icon: Clock, change: "+12h", color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Next Payout", value: "Apr 25", icon: Calendar, change: "In 3 days", color: "text-amber-500", bg: "bg-amber-500/10" },
  { label: "Total Deliveries", value: "284", icon: Truck, change: "+24 this week", color: "text-primary", bg: "bg-primary/10" },
];

const recentActivity = [
  { date: "Apr 1", description: "Wolt delivery — Södermalm", hours: "6h", amount: "1,080 SEK", status: "Completed", deliveries: 11 },
  { date: "Mar 31", description: "Wolt delivery — Vasastan", hours: "8h", amount: "1,440 SEK", status: "Completed", deliveries: 14 },
  { date: "Mar 30", description: "Wolt delivery — Kungsholmen", hours: "5h", amount: "900 SEK", status: "Completed", deliveries: 9 },
  { date: "Mar 29", description: "Foodora delivery — Östermalm", hours: "7h", amount: "1,260 SEK", status: "Pending", deliveries: 12 },
];

const upcomingShifts = [
  { day: "Tomorrow", time: "08:00 – 16:00", area: "Södermalm", client: "Wolt" },
  { day: "Thu, Apr 4", time: "12:00 – 20:00", area: "Vasastan", client: "Wolt" },
  { day: "Fri, Apr 5", time: "09:00 – 17:00", area: "Östermalm", client: "Foodora" },
];

/* ══════════════════════════════════════════════════════════════════════════ */
export default function PartnerDashboard() {
  const [application, setApplication] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isNewPartner, setIsNewPartner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmCheck, setConfirmCheck] = useState(false);

  // Tour state
  const [showTour, setShowTour] = useState(false);

  // Personnummer
  const [personnummer, setPersonnummer] = useState("");
  const [pnError, setPnError] = useState("");

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadPartnerData();

    // Real-time: refresh documents when partner_documents changes (e.g. admin verifies)
    const channel = supabase
      .channel("partner_dashboard_docs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partner_documents" },
        () => { loadPartnerData(true); }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "partner_applications" },
        () => { loadPartnerData(true); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadPartnerData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsNewPartner(false); setLoading(false); return; }

      await supabase.rpc("link_my_application");

      const { data: app } = await supabase
        .from("partner_applications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (app) {
        setApplication(app);
        const isNew = !["active", "contract_signed"].includes(app.status);
        setIsNewPartner(isNew);
        // Only pre-fill personnummer if not already typed by user
        if (app.personal_number) setPersonnummer(prev => prev || app.personal_number);

        const { data: docs } = await supabase
          .from("partner_documents")
          .select("*")
          .eq("application_id", app.id)
          .order("created_at", { ascending: false }); // newest first → getDoc() picks latest
        const allDocs = docs || [];
        setDocuments(allDocs);
        await loadThumbnails(allDocs); // await so thumbnails are ready on re-render

        // Show tour on first login if not already completed
        if (isNew && !localStorage.getItem(TOUR_STORAGE_KEY)) {
          setTimeout(() => setShowTour(true), 800);
        }
      }
    } catch (err) {
      console.error("Error loading partner data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadThumbnails = async (docs: any[]) => {
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

  const getDoc = (category: string) =>
    documents.find(d => d.doc_category === category || d.document_type === category);

  /* ── Personnummer validation ────────────────────────────────────── */
  const validatePN = (value: string): string => {
    const cleaned = value.replace(/[-\s]/g, "");
    if (!cleaned) return "Personnummer or coordination number is required";
    if (!/^\d{10,12}$/.test(cleaned)) return "Enter in format YYYYMMDD-XXXX or YYYYMMDDXXXX";
    return "";
  };

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

  /* ── Upload handler ─────────────────────────────────────────────── */
  const handleUpload = async (category: "skatteverket_id" | "driving_license", file: File) => {
    if (!application) return;
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum 50 MB.", variant: "destructive" }); return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
      toast({ title: "Invalid file type", description: "PDF, JPG, PNG or WEBP only.", variant: "destructive" }); return;
    }

    if (category === "skatteverket_id") {
      const ok = await savePersonnummer();
      if (!ok) return;
    }

    setUploading(prev => ({ ...prev, [category]: true }));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.name.split(".").pop() ?? "bin";
      const filePath = `${user.id}/${category}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("partner-documents")
        .upload(filePath, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;

      const existingDoc = getDoc(category);
      if (existingDoc) {
        await supabase.from("partner_documents")
          .update({ file_url: filePath, status: "uploaded", rejection_reason: null, document_type: category })
          .eq("id", existingDoc.id);
      } else {
        await supabase.from("partner_documents").insert({
          application_id: application.id,
          document_type: category,
          doc_category: category,
          file_url: filePath,
          status: "uploaded",
        });
      }
      toast({ title: "Document uploaded", description: "Document saved. Check progress below." });
      await loadPartnerData(true); // silent reload — no spinner flash
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(prev => ({ ...prev, [category]: false }));
    }
  };

  /* ── Submit for verification ────────────────────────────────────── */
  const handleSubmitDocuments = async () => {
    if (!application) return;
    const slots = buildSlots(application.transport ?? "bicycle");

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
      toast({ title: "Documents submitted for review", description: "We'll notify you by email once verified." });
      await loadPartnerData(true);
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Completion data ────────────────────────────────────────────── */
  const slots = buildSlots(application?.transport ?? "bicycle");
  const totalRequired = slots.length;
  const totalUploaded = slots.filter(s => getDoc(s.category)).length;
  const allUploaded = totalUploaded === totalRequired;
  const alreadySubmitted = !!application?.documents_submitted_at;

  const completionSteps = [
    { label: "Email Verified", done: application?.status !== "pending" },
    { label: "Documents Uploaded", done: allUploaded },
    { label: "Under Review", done: ["under_review", "verified", "contract_sent", "contract_signed", "active"].includes(application?.status) },
    { label: "Contract Signed", done: ["contract_signed", "active"].includes(application?.status) },
    { label: "Account Active", done: application?.status === "active" },
  ];
  const completionPercent = Math.round((completionSteps.filter(s => s.done).length / completionSteps.length) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /*  ONBOARDING VIEW                                                      */
  /* ══════════════════════════════════════════════════════════════════════ */
  if (isNewPartner && application) {
    return (
      <>
        {/* Tour overlay */}
        {showTour && (
          <OnboardingTour
            steps={TOUR_STEPS}
            storageKey={TOUR_STORAGE_KEY}
            onComplete={() => setShowTour(false)}
          />
        )}

        <div className="space-y-8 animate-fade-in">
          {/* ── Welcome hero ──────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8">
            <div className="absolute top-4 right-4 opacity-10">
              <Sparkles className="h-32 w-32 text-primary" />
            </div>
            <div className="relative">
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                <Sparkles className="h-3 w-3 mr-1" /> Welcome to AM:365
              </Badge>
              <h1 className="text-3xl font-bold mb-2">
                Hello, {application.first_name}!
              </h1>
              <p className="text-muted-foreground max-w-xl">
                You're just a few steps away from becoming an AM:365 delivery partner.
                Complete the steps below to get verified and start earning.
              </p>
              {!localStorage.getItem(TOUR_STORAGE_KEY) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowTour(true)}
                >
                  <Info className="h-4 w-4 mr-2" /> Take a Quick Tour
                </Button>
              )}
            </div>
          </div>

          {/* ── How It Works ──────────────────────────────────────── */}
          <div>
            <h2 className="text-lg font-semibold mb-4">How It Works</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {HOW_IT_WORKS.map((step, i) => {
                const isDone = i < completionSteps.filter(s => s.done).length;
                return (
                  <div
                    key={step.title}
                    className="relative group"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all duration-500
                      ${isDone
                        ? "border-primary/30 bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/20 hover:bg-primary/5"
                      }`}
                    >
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all
                        ${isDone
                          ? "bg-primary text-primary-foreground scale-110"
                          : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        }`}
                      >
                        {isDone ? <CheckCircle className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                      </div>
                      <p className={`text-sm font-medium ${isDone ? "text-primary" : "text-foreground"}`}>{step.title}</p>
                      <p className="text-xs text-muted-foreground leading-tight">{step.desc}</p>
                    </div>
                    {/* Connector arrow */}
                    {i < HOW_IT_WORKS.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                        <ArrowRight className={`h-4 w-4 ${isDone ? "text-primary" : "text-muted-foreground/30"}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Progress bar ──────────────────────────────────────── */}
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Onboarding Progress</span>
                </div>
                <span className="text-sm font-bold text-primary">{completionPercent}%</span>
              </div>
              <Progress value={completionPercent} className="h-3 mb-4" />
              <div className="grid gap-2 md:grid-cols-5">
                {completionSteps.map((step, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                    step.done ? "text-primary bg-primary/5" : "text-muted-foreground"
                  }`}>
                    {step.done
                      ? <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                      : <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                    }
                    {step.label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Status message ────────────────────────────────────── */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                  application.status === "under_review" ? "bg-amber-500/10" :
                  application.status === "verified" ? "bg-primary/10" :
                  application.status === "contract_sent" ? "bg-blue-500/10" :
                  "bg-amber-500/10"
                }`}>
                  <Info className={`h-6 w-6 ${
                    application.status === "under_review" ? "text-amber-500" :
                    application.status === "verified" ? "text-primary" :
                    application.status === "contract_sent" ? "text-blue-500" :
                    "text-amber-500"
                  }`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    Status: {application.status.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {application.status === "email_verified" && "Your email is verified. Please upload your required documents below."}
                    {application.status === "under_review" && "Your documents are being reviewed by our team. We'll notify you by email when done."}
                    {application.status === "verified" && "Identity verified! Your employment contract is being prepared."}
                    {application.status === "contract_sent" && "Your contract is ready — check the Contract page to review and sign."}
                    {application.status === "pending" && "Please verify your email to continue the onboarding process."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Document Upload Section ───────────────────────────── */}
          <div data-tour="welcome-docs">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" /> Required Documents
                  </CardTitle>
                  <Badge variant={allUploaded ? "default" : "outline"} className="text-xs">
                    {totalUploaded} / {totalRequired} uploaded
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload your Skatteverket ID{slots.length > 1 ? " and Driving Licence" : ""}. Accepted formats: PDF, JPG, PNG, WEBP (max 50 MB).
                </p>
                <Progress value={(totalUploaded / totalRequired) * 100} className="h-2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-5">
                {slots.map((slot) => {
                  const doc = getDoc(slot.category);
                  const statusKey = (doc?.status ?? "missing") as string;
                  const isUploading = uploading[slot.category] ?? false;
                  const SlotIcon = slot.icon;

                  return (
                    <div key={slot.category} className={`p-5 rounded-xl border-2 transition-all ${
                      statusKey === "verified"  ? "border-primary/30 bg-primary/5" :
                      statusKey === "uploaded"  ? "border-amber-500/30 bg-amber-500/5" :
                      statusKey === "rejected"  ? "border-destructive/30 bg-destructive/5" :
                      "border-dashed border-border"
                    }`}>
                      {/* Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                          statusKey === "verified"  ? "bg-primary/10 text-primary" :
                          statusKey === "uploaded"  ? "bg-amber-500/10 text-amber-500" :
                          statusKey === "rejected"  ? "bg-destructive/10 text-destructive" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          <SlotIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{slot.label}</h4>
                            <Badge variant={
                              statusKey === "verified"  ? "default" :
                              statusKey === "uploaded"  ? "secondary" :
                              statusKey === "rejected"  ? "destructive" : "outline"
                            } className="text-xs">
                              {statusKey === "missing"  ? "Required" :
                               statusKey === "uploaded" ? "Under Review" :
                               statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{slot.description}</p>
                        </div>
                      </div>

                      {/* Thumbnail preview */}
                      {(statusKey === "uploaded" || statusKey === "verified") && doc && (
                        <div className="mb-4">
                          {thumbnails[doc.id] ? (
                            <div className="relative rounded-xl overflow-hidden border bg-black/5 h-40">
                              <img src={thumbnails[doc.id]} alt="Document" className="w-full h-full object-contain" />
                              <div className="absolute top-2 right-2">
                                <Badge variant={statusKey === "verified" ? "default" : "secondary"} className="text-xs shadow">
                                  {statusKey === "verified" ? "Verified" : "Under Review"}
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
                              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-sm font-medium capitalize">{slot.label}</p>
                                <p className="text-xs text-muted-foreground">
                                  Submitted {new Date(doc.created_at).toLocaleDateString("sv-SE")}
                                </p>
                              </div>
                              {statusKey === "verified" && <CheckCircle className="h-5 w-5 text-primary ml-auto" />}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Rejection reason */}
                      {statusKey === "rejected" && doc?.rejection_reason && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 mb-4">
                          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                          <p className="text-sm text-destructive">{doc.rejection_reason}</p>
                        </div>
                      )}

                      {/* Personnummer input for Skatteverket slot */}
                      {slot.hasPersonalNumber && statusKey !== "verified" && (
                        <div className="space-y-1.5 p-4 rounded-xl bg-muted/40 border mb-4">
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
                              Required for Skatteverket employment registration. Stored securely.
                            </p>
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
                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                              isUploading ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-primary/5"
                            }`}
                            onClick={() => !isUploading && fileInputRefs.current[slot.category]?.click()}
                          >
                            {isUploading ? (
                              <Loader2 className="h-9 w-9 text-primary animate-spin mx-auto mb-2" />
                            ) : (
                              <Upload className="h-9 w-9 text-muted-foreground mx-auto mb-2" />
                            )}
                            <p className="font-medium text-sm">
                              {isUploading ? "Uploading, please wait…" :
                               statusKey === "rejected" ? "Click to upload replacement document" :
                               "Click to upload document"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, WEBP · Max 50 MB</p>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Submit for Review */}
                {!alreadySubmitted && allUploaded && (
                  <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="text-center">
                      <CheckCircle className="h-10 w-10 text-primary mx-auto mb-2" />
                      <h3 className="font-semibold text-lg">All documents uploaded!</h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        Please confirm that all information is correct and submit for verification.
                      </p>
                    </div>
                    <label className="flex items-start gap-3 p-4 rounded-xl bg-card border cursor-pointer hover:bg-muted/50 transition-colors w-full max-w-lg">
                      <Checkbox
                        checked={confirmCheck}
                        onCheckedChange={(v) => setConfirmCheck(v === true)}
                        className="mt-0.5"
                      />
                      <span className="text-sm leading-relaxed">
                        I confirm that all uploaded documents are <strong>authentic and correct</strong>, and the personal information provided is <strong>true and complete</strong>. I understand that falsified documents will result in rejection.
                      </span>
                    </label>
                    <Button
                      size="lg"
                      className="w-full md:w-auto px-10"
                      onClick={handleSubmitDocuments}
                      disabled={submitting || !confirmCheck}
                    >
                      {submitting
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</>
                        : <><Send className="mr-2 h-4 w-4" /> Submit for Approval</>}
                    </Button>
                  </div>
                )}

                {/* Submitted / Under review banner */}
                {alreadySubmitted && !["verified", "contract_sent", "contract_signed", "active"].includes(application?.status) && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-700 dark:text-amber-400">Documents submitted — under review</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Submitted on {new Date(application.documents_submitted_at).toLocaleDateString("sv-SE")}.
                          Our team will verify your documents and send your employment contract by email.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <Mail className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-700 dark:text-blue-400">What happens next?</p>
                        <ol className="text-sm text-muted-foreground mt-1 space-y-1 list-decimal list-inside">
                          <li>Our verifier reviews your documents (typically 1–2 business days)</li>
                          <li>Once verified, you'll receive your employment contract by email</li>
                          <li>Sign the contract and you're ready to start working!</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={() => navigate("/partner/documents")}>
                    <FileText className="mr-2 h-4 w-4" /> Manage All Documents
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Quick Links ───────────────────────────────────────── */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/partner/profile")}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center"><User className="h-5 w-5 text-primary" /></div>
                <div><p className="font-semibold">My Profile</p><p className="text-sm text-muted-foreground">Review your information</p></div>
                <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/partner/contract")}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-blue-500/10 flex items-center justify-center"><FileCheck className="h-5 w-5 text-blue-500" /></div>
                <div><p className="font-semibold">My Contract</p><p className="text-sm text-muted-foreground">View contract status</p></div>
                <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/partner/support")}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center"><AlertCircle className="h-5 w-5 text-amber-500" /></div>
                <div><p className="font-semibold">Need Help?</p><p className="text-sm text-muted-foreground">Contact support</p></div>
                <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /*  ACTIVE PARTNER DASHBOARD                                             */
  /* ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {application?.first_name || "Partner"}!</h1>
        <p className="text-base text-muted-foreground mt-1">Here's your overview for April 2024</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                <ArrowUpRight className="h-3.5 w-3.5 text-primary" /> {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-sm">View All <ChevronRight className="ml-1 h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">{item.date} · {item.hours} · {item.deliveries} deliveries</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-base">{item.amount}</p>
                    <Badge variant={item.status === "Completed" ? "default" : "secondary"} className="text-xs mt-1">{item.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader><CardTitle className="text-xl">Next Payout</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-primary">12,450 SEK</p>
                <p className="text-sm text-muted-foreground mt-2">Scheduled for April 25, 2024</p>
              </div>
              <div className="p-4 rounded-xl bg-muted space-y-2.5">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gross Pay</span><span className="font-medium">14,200 SEK</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax (30%)</span><span className="font-medium text-destructive">-1,750 SEK</span></div>
                <div className="flex justify-between text-sm border-t pt-2 font-semibold"><span>Net Pay</span><span className="text-primary">12,450 SEK</span></div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">Monthly target</span>
                  <span className="font-medium">71%</span>
                </div>
                <Progress value={71} className="h-2.5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl">Upcoming Shifts</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {upcomingShifts.map((shift, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{shift.day}</span>
                    <Badge variant="outline" className="text-xs">{shift.client}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {shift.time}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {shift.area}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              <Button variant="outline" className="w-full justify-start h-11 text-sm" onClick={() => navigate("/partner/payslips")}><FileText className="mr-2 h-4 w-4" /> View Latest Payslip</Button>
              <Button variant="outline" className="w-full justify-start h-11 text-sm" onClick={() => navigate("/partner/schedule")}><Calendar className="mr-2 h-4 w-4" /> My Schedule</Button>
              <Button variant="outline" className="w-full justify-start h-11 text-sm" onClick={() => navigate("/partner/work-history")}><Star className="mr-2 h-4 w-4" /> Performance Report</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
