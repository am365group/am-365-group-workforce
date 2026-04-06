import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function SetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const applicationId = searchParams.get("id") || "";
  const email = searchParams.get("email") || "";

  const passwordChecks = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "Contains uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "Contains a number", valid: /[0-9]/.test(password) },
    { label: "Passwords match", valid: password === confirmPassword && confirmPassword.length > 0 },
  ];

  const allValid = passwordChecks.every((c) => c.valid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) return;

    setIsSubmitting(true);
    try {
      // Use Edge Function with service-role key so the user is created with
      // email_confirm: true — partner already verified email via OTP, so Supabase
      // must NOT send a second confirmation email.
      const { data, error: fnError } = await supabase.functions.invoke("create-partner-account", {
        body: {
          email,
          password,
          applicationId,
          displayName: email.split("@")[0],
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      // Sign the new user in immediately (they are already email-confirmed)
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      setIsDone(true);
      toast({ title: "Account created!", description: "Welcome to AM:365. Redirecting to your dashboard..." });

      // Clean up localStorage
      localStorage.removeItem("am365_application_id");
      localStorage.removeItem("am365_application_email");

      setTimeout(() => {
        navigate("/partner/dashboard");
      }, 2500);
    } catch (err: any) {
      toast({
        title: "Account creation failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-12">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome to AM:365! 🎉</h2>
            <p className="text-muted-foreground">Your account has been created. Redirecting to your dashboard...</p>
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
            <h2 className="text-3xl font-bold leading-tight">Set your<br />password</h2>
            <p className="text-base opacity-70 max-w-sm">Create a secure password for your AM:365 partner account.</p>
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
              <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lock className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Create Your Password</CardTitle>
              <CardDescription className="text-base">
                Set a password for <span className="font-medium text-foreground">{email}</span>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Password requirements */}
                <div className="space-y-1.5 p-4 rounded-xl bg-muted/50 border">
                  {passwordChecks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`h-3.5 w-3.5 ${check.valid ? "text-primary" : "text-muted-foreground/40"}`} />
                      <span className={check.valid ? "text-foreground" : "text-muted-foreground"}>{check.label}</span>
                    </div>
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!allValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</>
                  ) : (
                    <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
