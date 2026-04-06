import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, Lock } from "lucide-react";

type VerifyStep = "verify" | "password" | "success";

export default function Verify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<VerifyStep>("verify");
  const [isLoading, setIsLoading] = useState(false);
  const [applicationId, setApplicationId] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>(searchParams.get("code") || "");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const appId = searchParams.get("appId");
    const code = searchParams.get("code");

    console.log("URL parameters:", { appId, code });

    if (appId) {
      setApplicationId(appId);
    }
    if (code) {
      setVerificationCode(code);
    }
  }, [searchParams]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || !applicationId) {
      console.error("Missing verification data:", { verificationCode, applicationId });
      toast({
        title: "Missing information",
        description: "Please enter the verification code and ensure app ID is set.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Verifying code for application via secure RPC:", applicationId);

      const { data: app, error } = await supabase.rpc(
        "verify_partner_application",
        {
          app_id: applicationId,
          code: verificationCode,
        }
      );

      console.log("RPC verification result:", { app, error });

      if (error || !app) {
        throw new Error(error?.message || "Application not found. Please check your verification link or register again.");
      }

      setEmail((app as any).email);
      setStep("password");
      toast({
        title: "Code verified! ✅",
        description: "Now set up your password to continue.",
      });
    } catch (err: any) {
      console.error("Verification error:", err);
      toast({
        title: "Verification failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast({
        title: "Missing password",
        description: "Please enter and confirm your password.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Sign up the user with email and password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: email,
          },
        },
      });

      if (authError) throw authError;

      // Update partner application status to email_verified
      const { error: updateError } = await supabase
        .from("partner_applications")
        .update({ status: "email_verified" })
        .eq("id", applicationId);

      if (updateError) throw updateError;

      setStep("success");
      toast({
        title: "Password set successfully! ✅",
        description: "Redirecting to your dashboard...",
      });

      // Redirect to partner dashboard after 2 seconds
      setTimeout(() => {
        navigate("/partner/dashboard");
      }, 2000);
    } catch (err: any) {
      console.error("Password setup error:", err);
      toast({
        title: "Password setup failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              AM
            </div>
            <span className="text-2xl font-bold">AM:365</span>
          </div>
          <p className="text-sm text-muted-foreground">Verify your registration</p>
        </div>

        {/* Verify Step */}
        {step === "verify" && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Verify Your Email</CardTitle>
              <CardDescription>
                Enter the 6-digit code we sent to your email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-center text-lg tracking-widest font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    This code expires in 30 minutes
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Pass Setup Step */}
        {step === "password" && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Set Your Password</CardTitle>
              <CardDescription>
                Create a secure password for your AM:365 account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    At least 8 characters with mix of letters and numbers
                  </p>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Complete Registration
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Success Step */}
        {step === "success" && (
          <Card className="border shadow-sm">
            <CardContent className="pt-8 text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">All Set! 🎉</h2>
              <p className="text-muted-foreground mb-6">
                Your account is ready. Redirecting to your dashboard...
              </p>
              <Button disabled className="w-full">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground mt-6">
          © 2024 AM365 Group AB. All rights reserved.
        </p>
      </div>
    </div>
  );
}
