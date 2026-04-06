import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { CheckCircle, Loader2, Mail, ArrowRight, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function VerifyEmail() {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [autoVerifying, setAutoVerifying] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const applicationId = searchParams.get("id") || localStorage.getItem("am365_application_id") || "";
  const email = searchParams.get("email") || localStorage.getItem("am365_application_email") || "";
  const linkCode = searchParams.get("code");

  // Auto-verify if code is in URL (from email link click)
  useEffect(() => {
    if (linkCode && applicationId && !isVerified) {
      setCode(linkCode);
      setAutoVerifying(true);
      verifyCode(linkCode);
    }
  }, [linkCode, applicationId]);

  const verifyCode = async (verificationCode: string) => {
    if (!applicationId) {
      toast({ title: "Error", description: "Application not found. Please register again.", variant: "destructive" });
      return;
    }
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.rpc("verify_partner_application", {
        app_id: applicationId,
        code: verificationCode,
      });

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Invalid or expired verification code");
      }

      // Update status to email_verified
      await supabase
        .from("partner_applications")
        .update({ status: "email_verified", verified_at: new Date().toISOString() })
        .eq("id", applicationId);

      setIsVerified(true);
      toast({ title: "Email verified! ✅", description: "Now set your password to complete account setup." });

      // Redirect to set-password page after short delay
      setTimeout(() => {
        navigate(`/set-password?id=${applicationId}&email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message || "Invalid code. Please try again.", variant: "destructive" });
    } finally {
      setIsVerifying(false);
      setAutoVerifying(false);
    }
  };

  const handleSubmit = () => {
    if (code.length === 6) verifyCode(code);
  };

  const handleResend = async () => {
    try {
      await supabase.functions.invoke("send-registration-email", {
        body: { to: email, template: "registration", data: { firstName: "", verificationCode: "", applicationId } },
      });
      toast({ title: "Code resent!", description: "Check your inbox for the new code." });
    } catch {
      toast({ title: "Failed to resend", description: "Please try again later.", variant: "destructive" });
    }
  };

  if (autoVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Verifying your email...</h2>
            <p className="text-muted-foreground">Please wait while we verify your email address.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-sidebar relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-sidebar-foreground">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center font-bold text-lg text-primary-foreground">AM</div>
              <span className="text-2xl font-bold">AM:365</span>
            </div>
            <p className="text-sm opacity-70">Workforce Platform</p>
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-bold leading-tight">Almost there!<br />Verify your email</h2>
            <p className="text-base opacity-70 max-w-sm">Enter the 6-digit code we sent to your email or click the link in the email.</p>
          </div>
          <p className="text-xs opacity-50">© 2024 AM365 Group AB. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold">AM</div>
            <span className="text-2xl font-bold">AM:365</span>
          </div>

          <Card className="border shadow-sm">
            <CardHeader className="text-center pb-4">
              {isVerified ? (
                <>
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Email Verified! ✅</CardTitle>
                  <CardDescription className="text-base">Redirecting to set your password...</CardDescription>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Verify Your Email</CardTitle>
                  <CardDescription className="text-base">
                    We've sent a 6-digit code to <span className="font-medium text-foreground">{email || "your email"}</span>
                  </CardDescription>
                </>
              )}
            </CardHeader>

            {!isVerified && (
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={code.length !== 6 || isVerifying}
                >
                  {isVerifying ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                  ) : (
                    <>Verify Email <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
                  <Button variant="ghost" size="sm" onClick={handleResend}>
                    <RefreshCw className="mr-2 h-3.5 w-3.5" /> Resend Code
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Code expires in 30 minutes. Check your spam folder if you don't see the email.
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
