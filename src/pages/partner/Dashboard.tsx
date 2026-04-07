import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DollarSign, Clock, Calendar, TrendingUp, ArrowUpRight, FileText,
  Truck, MapPin, Star, ChevronRight, Upload, CheckCircle, AlertCircle,
  User, Shield, FileCheck, Info, IdCard, Loader2, XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ID_DOC_OPTIONS = [
  { value: "driving_licence", label: "Driving Licence" },
  { value: "passport", label: "Passport" },
  { value: "national_id", label: "National ID Card" },
  { value: "residency_card", label: "Residency Card (Uppehållstillstånd)" },
];

const getRequiredDocuments = (registrationPath?: string) => {
  const docs = [
    {
      type: "Identity Document",
      slotKey: "id_document",
      dbTypes: ["driving_licence", "passport", "national_id", "residency_card"],
      icon: Shield,
      description: "One valid photo ID: Driving Licence, Passport, National ID Card, or Residency Card (front & back if applicable)",
      howTo: "Take a clear photo in good lighting. All text must be readable and no corners cut off.",
    },
  ];
  if (registrationPath === "manual") {
    docs.push({
      type: "Skatt ID Certificate",
      slotKey: "skatt_id",
      dbTypes: ["skatt_id"],
      icon: IdCard,
      description: "Your tax registration certificate (Skattsedel) issued by Skatteverket",
      howTo: "Log in to Mina Sidor at skatteverket.se, go to 'Min skattesedel', and download the PDF.",
    });
  }
  return docs;
};

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

export default function PartnerDashboard() {
  const [application, setApplication] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isNewPartner, setIsNewPartner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [selectedIdType, setSelectedIdType] = useState("passport");
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { loadPartnerData(); }, []);

  const loadPartnerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsNewPartner(false); setLoading(false); return; }

      const { data: app } = await supabase
        .from("partner_applications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (app) {
        setApplication(app);
        setIsNewPartner(!["active", "contract_signed"].includes(app.status));
        const { data: docs } = await supabase
          .from("partner_documents")
          .select("*")
          .eq("application_id", app.id);
        const allDocs = docs || [];
        setDocuments(allDocs);
        loadThumbnails(allDocs);
      }
    } catch (err) {
      console.error("Error loading partner data:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const getDocRecord = (dbTypes: string[]) =>
    documents.find(d => dbTypes.includes(d.document_type));

  const getDocStatus = (dbTypes: string[]) => {
    const doc = getDocRecord(dbTypes);
    if (!doc) return "missing";
    return doc.status || "uploaded";
  };

  const handleUpload = async (slotKey: string, file: File) => {
    if (!application) return;
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum 50 MB.", variant: "destructive" }); return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
      toast({ title: "Invalid file type", description: "PDF, JPG, PNG or WEBP only.", variant: "destructive" }); return;
    }
    const docType = slotKey === "id_document" ? selectedIdType : slotKey;
    setUploading(prev => ({ ...prev, [slotKey]: true }));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.name.split(".").pop() ?? "bin";
      const filePath = `${user.id}/${docType}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("partner-documents")
        .upload(filePath, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;

      const requiredDoc = getRequiredDocuments(application.reg_path).find(d => d.slotKey === slotKey);
      const existingDoc = requiredDoc ? getDocRecord(requiredDoc.dbTypes) : null;
      if (existingDoc) {
        await supabase.from("partner_documents")
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
      toast({ title: "Document uploaded ✓", description: "Submitted for review. We'll notify you once verified." });
      await loadPartnerData();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(prev => ({ ...prev, [slotKey]: false }));
    }
  };

  const completionSteps = [
    { label: "Email Verified", done: application?.status !== "pending" },
    { label: "Documents Uploaded", done: application?.documents_verified || false },
    { label: "Identity Verified", done: application?.id_verified || false },
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

  // ── Onboarding view ─────────────────────────────────────────────────────────
  if (isNewPartner && application) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {application.first_name}! 👋</h1>
          <p className="text-base text-muted-foreground mt-1">Complete your profile to start working with AM:365</p>
        </div>

        {/* Progress */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Onboarding Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Profile Completion</span>
              <span className="text-sm font-bold text-primary">{completionPercent}%</span>
            </div>
            <Progress value={completionPercent} className="h-3 mb-6" />
            <div className="grid gap-3 md:grid-cols-5">
              {completionSteps.map((step, i) => (
                <div key={i} className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center ${step.done ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {step.done ? <CheckCircle className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                  </div>
                  <span className={`text-xs font-medium ${step.done ? "text-primary" : "text-muted-foreground"}`}>{step.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Info className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Status: {application.status.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </h3>
                <p className="text-muted-foreground mt-1">
                  {application.status === "email_verified" && "Your email is verified. Please upload your required documents below."}
                  {application.status === "under_review" && "Your documents are being reviewed. We'll notify you when done."}
                  {application.status === "verified" && "Identity verified! Your employment contract is being prepared."}
                  {application.status === "contract_sent" && "Your contract is ready — check the Contract page."}
                  {application.status === "pending" && "Please verify your email to continue the onboarding process."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Required Documents — inline upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Required Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {getRequiredDocuments(application.reg_path).map((doc) => {
              const status = getDocStatus(doc.dbTypes);
              const docRecord = getDocRecord(doc.dbTypes);
              const thumbUrl = docRecord ? thumbnails[docRecord.id] : undefined;
              const isUploading = uploading[doc.slotKey] ?? false;
              const DocIcon = doc.icon;

              return (
                <div key={doc.slotKey} className={`p-5 rounded-xl border-2 transition-all ${
                  status === "verified"  ? "border-primary/30 bg-primary/5" :
                  status === "uploaded" ? "border-blue-500/30 bg-blue-500/5" :
                  status === "rejected" ? "border-destructive/30 bg-destructive/5" :
                  "border-dashed border-border"
                }`}>
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                      status === "verified"  ? "bg-primary/10 text-primary" :
                      status === "uploaded" ? "bg-blue-500/10 text-blue-500" :
                      status === "rejected" ? "bg-destructive/10 text-destructive" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      <DocIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{doc.type}</h4>
                        <Badge variant={
                          status === "verified" ? "default" :
                          status === "uploaded" ? "secondary" :
                          status === "rejected" ? "destructive" : "outline"
                        } className="text-xs">
                          {status === "missing" ? "Required" :
                           status === "uploaded" ? "Under Review" :
                           status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                    </div>
                  </div>

                  {/* Thumbnail — show when uploaded or verified */}
                  {(status === "uploaded" || status === "verified") && (
                    <div className="mb-4">
                      {thumbUrl ? (
                        <div className="relative rounded-xl overflow-hidden border bg-black/5 h-40">
                          <img
                            src={thumbUrl}
                            alt="Document thumbnail"
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute top-2 right-2">
                            <Badge variant={status === "verified" ? "default" : "secondary"} className="text-xs shadow">
                              {status === "verified" ? "✓ Verified" : "Under Review"}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
                          <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-sm font-medium capitalize">
                              {docRecord?.document_type?.replace(/_/g, " ") ?? doc.type}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PDF document · Submitted {docRecord ? new Date(docRecord.created_at).toLocaleDateString("sv-SE") : ""}
                            </p>
                          </div>
                          {status === "verified" && <CheckCircle className="h-5 w-5 text-primary ml-auto" />}
                        </div>
                      )}
                      {docRecord?.created_at && thumbUrl && (
                        <p className="text-xs text-muted-foreground mt-1.5 pl-1">
                          Submitted {new Date(docRecord.created_at).toLocaleDateString("sv-SE")} ·{" "}
                          {docRecord.document_type?.replace(/_/g, " ")}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Rejection reason */}
                  {status === "rejected" && docRecord?.rejection_reason && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 mb-4">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive">{docRecord.rejection_reason}</p>
                    </div>
                  )}

                  {/* How-to hint */}
                  {status !== "verified" && (
                    <div className="p-3 rounded-lg bg-muted/50 border border-border mb-4">
                      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span><strong>How to:</strong> {doc.howTo}</span>
                      </p>
                    </div>
                  )}

                  {/* Inline upload area — shown when missing or rejected */}
                  {(status === "missing" || status === "rejected") && (
                    <div className="space-y-3">
                      {/* ID type selector */}
                      {doc.slotKey === "id_document" && (
                        <div className="space-y-1.5">
                          <Label className="text-sm">Document type</Label>
                          <Select value={selectedIdType} onValueChange={setSelectedIdType}>
                            <SelectTrigger className="w-full md:w-72">
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
                        ref={el => { fileInputRefs.current[doc.slotKey] = el; }}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(doc.slotKey, file);
                          e.target.value = "";
                        }}
                      />

                      <div
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                          isUploading ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-primary/5"
                        }`}
                        onClick={() => !isUploading && fileInputRefs.current[doc.slotKey]?.click()}
                      >
                        {isUploading ? (
                          <Loader2 className="h-9 w-9 text-primary animate-spin mx-auto mb-2" />
                        ) : (
                          <Upload className="h-9 w-9 text-muted-foreground mx-auto mb-2" />
                        )}
                        <p className="font-medium text-sm">
                          {isUploading ? "Uploading, please wait…" :
                           status === "rejected" ? "Click to upload replacement document" :
                           "Click to upload document"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, WEBP · Max 50 MB</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => navigate("/partner/documents")}>
                <FileText className="mr-2 h-4 w-4" /> Manage All Documents
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
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
    );
  }

  // ── Active partner dashboard ─────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {application?.first_name || "Partner"} 👋</h1>
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
