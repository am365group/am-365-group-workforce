import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, File, CheckCircle, AlertCircle, Clock, Trash2, Download, Loader2 } from "lucide-react";

interface DocumentItem {
  id: string;
  name: string;
  required: boolean;
  description: string;
  accepted_formats: string;
  status: "pending" | "uploaded" | "verified" | "rejected";
  file_url?: string;
  rejection_reason?: string;
  uploaded_at?: string;
}

const requiredDocuments: Omit<DocumentItem, "id" | "status" | "file_url" | "uploaded_at">[] = [
  {
    name: "Swedish ID or Passport",
    required: true,
    description: "Clear photo of both sides of your valid Swedish ID or passport",
    accepted_formats: "PDF, JPG, PNG (Max 10MB)",
    status: "pending",
  },
  {
    name: "Proof of Address",
    required: true,
    description: "Recent utility bill or rental contract showing your name and address",
    accepted_formats: "PDF, JPG, PNG (Max 10MB)",
    status: "pending",
  },
  {
    name: "Bank Account Details",
    required: true,
    description: "IBAN and BIC for salary payment",
    accepted_formats: "PDF, JPG, PNG (Max 5MB)",
    status: "pending",
  },
  {
    name: "Tax Certificate (if self-employed)",
    required: false,
    description: "F-tax certificate or similar",
    accepted_formats: "PDF (Max 10MB)",
    status: "pending",
  },
];

// Security classification for documents
const getDocumentSecurityLevel = (documentName: string): "secure" | "non-secure" => {
  const secureDocuments = ["Swedish ID or Passport", "Bank Account Details"];
  return secureDocuments.includes(documentName) ? "secure" : "non-secure";
};

export default function PartnerDocuments() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [appStatus, setAppStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          setIsLoading(false);
          return;
        }

        setUserId(userData.user.id);

        // Fetch application status
        const { data: app, error: appError } = await supabase
          .from("partner_applications")
          .select("id, status")
          .eq("email", userData.user.email)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!appError && app) {
          setAppStatus(app.status);

          // Fetch uploaded documents
          const { data: docs, error: docsError } = await supabase
            .from("partner_documents")
            .select("id, document_type, status, file_url, rejection_reason, uploaded_at")
            .eq("application_id", app.id);

          if (!docsError && docs) {
            const documentMap = new Map(
              docs.map((doc) => [
                doc.document_type,
                {
                  id: doc.id,
                  status: doc.status,
                  file_url: doc.file_url,
                  rejection_reason: doc.rejection_reason,
                  uploaded_at: doc.uploaded_at,
                },
              ])
            );

            const updatedDocs = requiredDocuments.map((req, idx) => ({
              id: `doc-${idx}`,
              ...req,
              ...(documentMap.get(req.name) || {}),
            }));

            setDocuments(updatedDocs);
          }
        }
      } catch (e) {
        console.error("Error fetching data:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleFileUpload = async (document: DocumentItem, file: File) => {
    if (!file) return;

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const validTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, JPG, and PNG files are allowed",
        variant: "destructive",
      });
      return;
    }

    setUploading(document.id);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data: app } = await supabase
        .from("partner_applications")
        .select("id")
        .eq("email", userData.user.email)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!app) throw new Error("Application not found");

      const fileName = `${document.id}-${Date.now()}-${file.name}`;
      const securityLevel = getDocumentSecurityLevel(document.name);
      const filePath = `${securityLevel}/partner-documents/${app.id}/${fileName}`;

      console.log(`Uploading ${document.name} to ${securityLevel} folder:`, filePath);

      // Upload file to storage
      const { error: uploadError, data } = await supabase.storage
        .from("documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      // Save document record
      const { error: dbError } = await supabase
        .from("partner_documents")
        .upsert({
          application_id: app.id,
          document_type: document.name,
          file_url: urlData.publicUrl,
          status: "uploaded",
          uploaded_at: new Date().toISOString(),
        });

      if (dbError) throw dbError;

      // Update local state
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === document.id
            ? {
                ...doc,
                status: "uploaded",
                file_url: urlData.publicUrl,
                uploaded_at: new Date().toISOString(),
              }
            : doc
        )
      );

      toast({
        title: "Document uploaded successfully ✅",
        description: `${document.name} has been uploaded and is awaiting verification.`,
      });

      // If all required documents are uploaded, update application status
      const allRequired = documents.filter((d) => d.required);
      const allUploaded = allRequired.every(
        (d) => d.id === document.id || d.status === "uploaded" || d.status === "verified"
      );

      if (allUploaded && appStatus === "email_verified") {
        await supabase
          .from("partner_applications")
          .update({ status: "under_review" })
          .eq("id", app.id);

        setAppStatus("under_review");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({
        title: "Upload failed",
        description: err.message || "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (document: DocumentItem) => {
    if (!document.file_url) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data: app } = await supabase
        .from("partner_applications")
        .select("id")
        .eq("email", userData.user.email)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!app) throw new Error("Application not found");

      // Delete from storage
      const filePath = document.file_url.split("/documents/")[1];
      await supabase.storage.from("documents").remove([filePath]);

      // Delete database record
      await supabase
        .from("partner_documents")
        .delete()
        .eq("application_id", app.id)
        .eq("document_type", document.name);

      // Update local state
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === document.id
            ? { ...doc, status: "pending", file_url: undefined, uploaded_at: undefined }
            : doc
        )
      );

      toast({
        title: "Document deleted",
        description: `${document.name} has been removed. You can upload a new one.`,
      });
    } catch (err: any) {
      console.error("Delete error:", err);
      toast({
        title: "Delete failed",
        description: err.message || "Failed to delete document.",
        variant: "destructive",
      });
    }
  };

  const uploadedCount = documents.filter((d) => d.status !== "pending").length;
  const verifiedCount = documents.filter((d) => d.status === "verified").length;
  const requiredCount = documents.filter((d) => d.required).length;
  const requiredUploaded = documents.filter(
    (d) => d.required && d.status !== "pending"
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Documents & Verification</h1>
        <p className="text-base text-muted-foreground mt-1">
          Upload required documents to complete your account verification
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Documents Uploaded</p>
              <p className="text-3xl font-bold">{uploadedCount}</p>
              <p className="text-xs text-muted-foreground">of {documents.length} total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Verified</p>
              <p className="text-3xl font-bold text-green-600">{verifiedCount}</p>
              <p className="text-xs text-muted-foreground">fully verified</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Required Documents</p>
              <p className="text-3xl font-bold">{requiredUploaded}/{requiredCount}</p>
              <p className="text-xs text-muted-foreground">ready for review</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Required Documents</span>
              <span className="text-muted-foreground">{requiredUploaded}/{requiredCount}</span>
            </div>
            <Progress value={(requiredUploaded / requiredCount) * 100} className="h-2.5" />
          </div>
          {requiredUploaded === requiredCount && appStatus === "email_verified" && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                All required documents uploaded! Our team will review and verify them within 24-48 hours.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="space-y-4">
        {documents.map((document) => (
          <Card key={document.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{document.name}</CardTitle>
                    {document.required && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Required
                      </Badge>
                    )}
                    {document.status === "verified" && (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        ✓ Verified
                      </Badge>
                    )}
                    {document.status === "uploaded" && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Pending Review
                      </Badge>
                    )}
                    {document.status === "rejected" && (
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                        Rejected
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1">{document.description}</CardDescription>
                  <p className="text-xs text-muted-foreground mt-2">Formats: {document.accepted_formats}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {document.rejection_reason && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Rejection reason:</strong> {document.rejection_reason}
                  </AlertDescription>
                </Alert>
              )}

              {document.status === "pending" ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer group relative">
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(document, e.target.files[0]);
                      }
                    }}
                    disabled={uploading === document.id}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {uploading === document.id ? (
                    <>
                      <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
                      <p className="text-sm font-medium">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2 group-hover:text-primary transition-colors" />
                      <p className="text-sm font-medium">Drop your file here or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supported formats: PDF, JPG, PNG • Max 10MB
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg border">
                  <div className="flex items-center gap-3">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Document uploaded</p>
                      {document.uploaded_at && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(document.uploaded_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {document.file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(document.file_url, "_blank")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {document.status !== "verified" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(document)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Information */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Privacy & Security:</strong> All documents are encrypted and stored securely. Our team will review them within 24-48 hours and you'll receive updates via email.
        </AlertDescription>
      </Alert>
    </div>
  );
}
