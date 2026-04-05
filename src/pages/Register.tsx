import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, User, MapPin, IdCard, Bike, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const STEPS = [
  { label: "Basic Information", icon: User },
  { label: "Location", icon: MapPin },
  { label: "Who am I?", icon: IdCard },
  { label: "Transport", icon: Bike },
];

const transportOptions = [
  { value: "bicycle", label: "Bicycle", icon: "🚲", description: "Eco-friendly city deliveries" },
  { value: "moped", label: "Moped / Scooter", icon: "🛵", description: "Fast urban deliveries" },
  { value: "car", label: "Car", icon: "🚗", description: "Larger deliveries & longer routes" },
];

export default function Register() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    street: "",
    apartment: "",
    city: "",
    postCode: "",
    personalNumber: "",
    transport: "",
  });

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const progress = ((step + 1) / STEPS.length) * 100;

  const canProceed = () => {
    if (step === 0) return form.firstName && form.lastName && form.phone && form.email;
    if (step === 1) return form.street && form.city && form.postCode;
    if (step === 2) return form.personalNumber;
    if (step === 3) return form.transport;
    return false;
  };

  const goNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      goNext();
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate 6-digit verification code and client-side ID
      const applicationId = crypto.randomUUID();
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

      // Insert application into database
      const { error } = await supabase
        .from("partner_applications")
        .insert({
          id: applicationId,
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          phone: form.phone,
          street_address: form.street,
          apartment: form.apartment || null,
          city: form.city,
          post_code: form.postCode,
          personal_number: form.personalNumber,
          transport: form.transport as "bicycle" | "moped" | "car",
          status: "pending",
          verification_code: verificationCode,
          verification_expires_at: expiresAt,
        });

      if (error) throw error;

      // Send verification email
      try {
        await supabase.functions.invoke("send-registration-email", {
          body: {
            to: form.email,
            template: "registration",
            data: {
              firstName: form.firstName,
              verificationCode,
              applicationId,
            },
          },
        });
      } catch (emailErr) {
        console.warn("Email sending failed, but registration saved:", emailErr);
      }

      toast({
        title: "Registration submitted! ✅",
        description: "Check your email for a verification code. We'll review your application shortly.",
      });
      navigate("/login");
    } catch (err: any) {
      console.error("Registration error:", err);
      toast({
        title: "Registration failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StepIcon = STEPS[step].icon;

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
            <h2 className="text-3xl font-bold leading-tight">Join the AM:365<br />Partner Family</h2>
            <p className="text-base opacity-70 max-w-sm">Register as a delivery partner and get access to employment benefits, payroll management, and more.</p>

            {/* Step indicators */}
            <div className="space-y-3 mt-8">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const isActive = i === step;
                const isDone = i < step;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                      isActive ? "bg-sidebar-accent" : isDone ? "opacity-70" : "opacity-40"
                    }`}
                  >
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        isDone || isActive ? "bg-primary text-primary-foreground" : "bg-sidebar-accent text-sidebar-foreground"
                      }`}
                    >
                      {isDone ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="text-xs opacity-60">Step {i + 1} of {STEPS.length}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs opacity-50">© 2024 AM365 Group AB. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-lg">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold">AM</div>
            <span className="text-2xl font-bold">AM:365</span>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
              <p className="text-sm font-medium text-primary">{Math.round(progress)}%</p>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <StepIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{STEPS[step].label}</CardTitle>
                  <CardDescription>
                    {step === 0 && "Tell us your basic details"}
                    {step === 1 && "Where are you located?"}
                    {step === 2 && "Your Swedish ID for verification"}
                    {step === 3 && "How will you deliver?"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div key={step} className="space-y-4 animate-fade-in" style={{ animationDuration: "0.3s" }}>
                  {step === 0 && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input id="firstName" placeholder="Johan" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input id="lastName" placeholder="Andersson" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input id="phone" type="tel" placeholder="+46 70 123 4567" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input id="email" type="email" placeholder="johan@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
                      </div>
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="street">Street Address *</Label>
                        <Input id="street" placeholder="Sveavägen 42" value={form.street} onChange={(e) => update("street", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apartment">Apartment / Suite <span className="text-muted-foreground text-xs">(optional)</span></Label>
                        <Input id="apartment" placeholder="Lgh 1102" value={form.apartment} onChange={(e) => update("apartment", e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input id="city" placeholder="Stockholm" value={form.city} onChange={(e) => update("city", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postCode">Post Code *</Label>
                          <Input id="postCode" placeholder="113 50" value={form.postCode} onChange={(e) => update("postCode", e.target.value)} />
                        </div>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="personalNumber">Swedish ID / Coordination Number *</Label>
                        <Input id="personalNumber" placeholder="YYYYMMDD-XXXX" value={form.personalNumber} onChange={(e) => update("personalNumber", e.target.value)} />
                        <p className="text-xs text-muted-foreground">Your personnummer or samordningsnummer. This is required for employment registration.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="flex items-start gap-3">
                          <IdCard className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Secure Verification</p>
                            <p className="text-xs text-muted-foreground mt-1">Your personal number is encrypted and only used for employment verification with Skatteverket. We follow GDPR data protection guidelines.</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <div className="space-y-3">
                      {transportOptions.map((opt) => (
                        <div
                          key={opt.value}
                          onClick={() => update("transport", opt.value)}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            form.transport === opt.value
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border hover:border-primary/30 hover:bg-muted/50"
                          }`}
                        >
                          <span className="text-3xl">{opt.icon}</span>
                          <div className="flex-1">
                            <p className="font-semibold">{opt.label}</p>
                            <p className="text-sm text-muted-foreground">{opt.description}</p>
                          </div>
                          {form.transport === opt.value && <CheckCircle className="h-5 w-5 text-primary" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-3 pt-2">
                  {step > 0 && (
                    <Button type="button" variant="outline" onClick={goBack} className="flex-1">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                  )}
                  <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" disabled={!canProceed() || isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                    ) : step < STEPS.length - 1 ? (
                      <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>
                    ) : (
                      <>Submit Registration <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already registered?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
