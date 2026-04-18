import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight, ArrowLeft, User, MapPin, Bike,
  CheckCircle, Loader2, AlertCircle, Phone, Mail,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const STEPS = [
  { label: "Basic Information", icon: User,   desc: "Tell us your name and contact details" },
  { label: "Home Address",      icon: MapPin,  desc: "Where are you located?" },
  { label: "Transport Type",    icon: Bike,    desc: "How will you make deliveries?" },
];

const TRANSPORT_OPTIONS = [
  { value: "bicycle", label: "Bicycle",        icon: "🚲", description: "Eco-friendly city deliveries" },
  { value: "moped",   label: "Moped / Scooter", icon: "🛵", description: "Fast urban deliveries" },
  { value: "car",     label: "Car",             icon: "🚗", description: "Larger deliveries & longer routes" },
];

const PHONE_REGEX = /^\+?[0-9\s\-()]{6,20}$/;
const POSTCODE_REGEX = /^\d{3}\s?\d{2}$/;

export default function Register() {
  const [step, setStep]               = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailError, setEmailError]   = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", email: "",
    street: "", apartment: "", city: "", postCode: "",
    transport: "",
  });

  const update = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setFieldErrors(prev => ({ ...prev, [field]: "" }));
    if (field === "email") setEmailError("");
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  /* ---------- email duplicate check ---------- */
  useEffect(() => {
    if (!form.email || !form.email.includes("@")) return;
    const timer = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const { data, error } = await supabase.rpc("check_email_registered", {
          p_email: form.email.trim().toLowerCase(),
        });
        if (!error && data === true) {
          setEmailError("This email is already registered. Please sign in or use a different email.");
        }
      } catch { /* ignore */ } finally {
        setEmailChecking(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [form.email]);

  /* ---------- per-step validation ---------- */
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!form.firstName.trim()) errs.firstName = "First name is required";
      if (!form.lastName.trim())  errs.lastName  = "Last name is required";
      if (!form.phone.trim()) {
        errs.phone = "Phone number is required";
      } else if (!PHONE_REGEX.test(form.phone)) {
        errs.phone = "Enter a valid phone number (e.g. +46 70 123 4567)";
      }
      if (!form.email.trim()) {
        errs.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errs.email = "Enter a valid email address";
      } else if (emailError) {
        errs.email = emailError;
      }
    }
    if (step === 1) {
      if (!form.street.trim()) errs.street = "Street address is required";
      if (!form.city.trim())   errs.city   = "City is required";
      if (!form.postCode.trim()) {
        errs.postCode = "Post code is required";
      } else if (!POSTCODE_REGEX.test(form.postCode.trim())) {
        errs.postCode = "Enter a valid Swedish post code (e.g. 113 50)";
      }
    }
    if (step === 2) {
      if (!form.transport) errs.transport = "Please choose your transport type";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (validate()) setStep(s => s + 1);
  };

  const goBack = () => {
    setStep(s => s - 1);
    setFieldErrors({});
  };

  /* ---------- final submission ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < STEPS.length - 1) { goNext(); return; }
    if (!validate()) return;

    // Final email check before submitting (catches auth.users + partner_applications)
    setIsSubmitting(true);
    try {
      const { data: alreadyExists } = await supabase.rpc("check_email_registered", {
        p_email: form.email.trim().toLowerCase(),
      });

      if (alreadyExists === true) {
        toast({
          title: "Email already registered",
          description: "This email address is already registered. Please sign in.",
          variant: "destructive",
        });
        setStep(0);
        setEmailError("This email is already registered. Please sign in or use a different email.");
        return;
      }

      const applicationId  = crypto.randomUUID();
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      const { error } = await supabase.from("partner_applications").insert({
        id:                      applicationId,
        first_name:              form.firstName.trim(),
        last_name:               form.lastName.trim(),
        email:                   form.email.trim().toLowerCase(),
        phone:                   form.phone.trim(),
        street_address:          form.street.trim(),
        apartment:               form.apartment.trim() || null,
        city:                    form.city.trim(),
        post_code:               form.postCode.trim(),
        personal_number:         null,   // collected during Skatteverket doc upload
        transport:               form.transport as "bicycle" | "moped" | "car",
        status:                  "pending",
        verification_code:       verificationCode,
        verification_expires_at: expiresAt,
      });

      if (error) throw error;

      // Send verification email (non-blocking on failure)
      const verifyUrl = `${window.location.origin}/verify-email?id=${applicationId}&email=${encodeURIComponent(form.email)}&code=${verificationCode}`;
      try {
        await supabase.functions.invoke("send-registration-email", {
          body: {
            to: form.email,
            template: "registration",
            data: { firstName: form.firstName, verificationCode, applicationId, verifyUrl },
          },
        });
      } catch (emailErr) {
        console.warn("Verification email failed (non-fatal):", emailErr);
      }

      localStorage.setItem("am365_application_id", applicationId);
      localStorage.setItem("am365_application_email", form.email);

      toast({ title: "Registration submitted! ✅", description: "Check your email to verify your address and complete setup." });
      navigate(`/verify-email?id=${applicationId}&email=${encodeURIComponent(form.email)}`);
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message || "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StepIcon = STEPS[step].icon;
  const canContinue = step < STEPS.length - 1;

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
            <p className="text-base opacity-70 max-w-sm">
              Register as a delivery partner and get access to employment benefits, payroll management, and more.
            </p>
            <div className="space-y-3 mt-8">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const isActive = i === step;
                const isDone   = i < step;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                      isActive ? "bg-sidebar-accent" : isDone ? "opacity-70" : "opacity-40"
                    }`}
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      isDone || isActive ? "bg-primary text-primary-foreground" : "bg-sidebar-accent text-sidebar-foreground"
                    }`}>
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

            {/* What happens next */}
            <div className="mt-6 p-4 rounded-xl bg-sidebar-accent/50 space-y-2">
              <p className="text-sm font-semibold opacity-90">After registration you will:</p>
              <ul className="space-y-1 text-xs opacity-70">
                <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 shrink-0" /> Verify your email address</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 shrink-0" /> Set your account password</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 shrink-0" /> Upload required ID documents</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 shrink-0" /> Get verified &amp; sign your contract</li>
              </ul>
            </div>
          </div>

          <p className="text-xs opacity-50">© 2025 AM365 Group AB. All rights reserved.</p>
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
              <div className="flex items-center gap-3 mb-1">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <StepIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{STEPS[step].label}</CardTitle>
                  <CardDescription>{STEPS[step].desc}</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div key={step} className="space-y-4 animate-fade-in" style={{ animationDuration: "0.25s" }}>

                  {/* ── Step 0: Basic Info ── */}
                  {step === 0 && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <FieldWrap label="First Name" error={fieldErrors.firstName} required>
                          <Input
                            id="firstName"
                            placeholder="Johan"
                            value={form.firstName}
                            onChange={e => update("firstName", e.target.value)}
                            className={fieldErrors.firstName ? "border-destructive" : ""}
                            autoComplete="given-name"
                          />
                        </FieldWrap>
                        <FieldWrap label="Last Name" error={fieldErrors.lastName} required>
                          <Input
                            id="lastName"
                            placeholder="Andersson"
                            value={form.lastName}
                            onChange={e => update("lastName", e.target.value)}
                            className={fieldErrors.lastName ? "border-destructive" : ""}
                            autoComplete="family-name"
                          />
                        </FieldWrap>
                      </div>

                      <FieldWrap label="Phone Number" error={fieldErrors.phone} required hint="+46 70 123 4567">
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+46 70 123 4567"
                            value={form.phone}
                            onChange={e => update("phone", e.target.value)}
                            className={`pl-9 ${fieldErrors.phone ? "border-destructive" : ""}`}
                            autoComplete="tel"
                          />
                        </div>
                      </FieldWrap>

                      <FieldWrap
                        label="Email Address"
                        error={fieldErrors.email || emailError}
                        required
                        hint="You'll verify this by email"
                      >
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="johan@example.com"
                            value={form.email}
                            onChange={e => update("email", e.target.value)}
                            className={`pl-9 pr-9 ${(fieldErrors.email || emailError) ? "border-destructive" : ""}`}
                            autoComplete="email"
                          />
                          {emailChecking && (
                            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                          {!emailChecking && form.email && !emailError && form.email.includes("@") && (
                            <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-primary" />
                          )}
                        </div>
                      </FieldWrap>
                    </>
                  )}

                  {/* ── Step 1: Address ── */}
                  {step === 1 && (
                    <>
                      <FieldWrap label="Street Address" error={fieldErrors.street} required>
                        <Input
                          placeholder="Sveavägen 42"
                          value={form.street}
                          onChange={e => update("street", e.target.value)}
                          className={fieldErrors.street ? "border-destructive" : ""}
                          autoComplete="street-address"
                        />
                      </FieldWrap>
                      <FieldWrap label="Apartment / Suite">
                        <Input
                          placeholder="Lgh 1102 (optional)"
                          value={form.apartment}
                          onChange={e => update("apartment", e.target.value)}
                          autoComplete="address-line2"
                        />
                      </FieldWrap>
                      <div className="grid grid-cols-2 gap-3">
                        <FieldWrap label="City" error={fieldErrors.city} required>
                          <Input
                            placeholder="Stockholm"
                            value={form.city}
                            onChange={e => update("city", e.target.value)}
                            className={fieldErrors.city ? "border-destructive" : ""}
                            autoComplete="address-level2"
                          />
                        </FieldWrap>
                        <FieldWrap label="Post Code" error={fieldErrors.postCode} required hint="e.g. 113 50">
                          <Input
                            placeholder="113 50"
                            value={form.postCode}
                            onChange={e => update("postCode", e.target.value)}
                            className={fieldErrors.postCode ? "border-destructive" : ""}
                            autoComplete="postal-code"
                            maxLength={6}
                          />
                        </FieldWrap>
                      </div>
                    </>
                  )}

                  {/* ── Step 2: Transport ── */}
                  {step === 2 && (
                    <div className="space-y-3">
                      {fieldErrors.transport && (
                        <p className="text-sm text-destructive flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5" /> {fieldErrors.transport}
                        </p>
                      )}
                      {TRANSPORT_OPTIONS.map(opt => (
                        <div
                          key={opt.value}
                          onClick={() => update("transport", opt.value)}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            form.transport === opt.value
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border hover:border-primary/40 hover:bg-muted/50"
                          }`}
                        >
                          <span className="text-3xl">{opt.icon}</span>
                          <div className="flex-1">
                            <p className="font-semibold">{opt.label}</p>
                            <p className="text-sm text-muted-foreground">{opt.description}</p>
                          </div>
                          {form.transport === opt.value && <CheckCircle className="h-5 w-5 text-primary shrink-0" />}
                        </div>
                      ))}

                      {/* Note about ID */}
                      <div className="flex items-start gap-3 p-4 mt-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Your Swedish ID number (personnummer or coordination number) will be collected
                          when you upload your Skatteverket ID document after registration — <strong>not during this form</strong>.
                          {(form.transport === "car" || form.transport === "moped") && (
                            <> A <strong>driving licence</strong> will also be required for your transport type.</>
                          )}
                        </p>
                      </div>
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
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting || (step === 0 && emailChecking)}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</>
                    ) : canContinue ? (
                      <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>
                    ) : (
                      <>Submit Registration <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already registered?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">Sign in here</Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── helper component ── */
function FieldWrap({
  label, error, hint, required, children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
