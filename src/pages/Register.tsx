import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Fingerprint, FileText, ArrowRight, ArrowLeft, Check } from "lucide-react";

type RegistrationPath = null | "bankid" | "manual";

export default function Register() {
  const [path, setPath] = useState<RegistrationPath>(null);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  if (!path) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold">AM</div>
              <span className="text-2xl font-bold">AM:365</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Join as a Partner</h1>
            <p className="text-muted-foreground">Choose your verification method to get started</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:border-primary hover:shadow-md transition-all" onClick={() => setPath("bankid")}>
              <CardHeader className="text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                  <Fingerprint className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">BankID Verification</CardTitle>
                <CardDescription>Fast-track with Swedish BankID. Instant identity verification.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Instant verification</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Auto-fill personal details</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Most secure option</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary hover:shadow-md transition-all" onClick={() => setPath("manual")}>
              <CardHeader className="text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-info/10 flex items-center justify-center mb-2">
                  <FileText className="h-8 w-8 text-info" />
                </div>
                <CardTitle className="text-lg">Manual Registration</CardTitle>
                <CardDescription>Upload ID documents for manual verification by our team.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-info" /> No BankID needed</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-info" /> International ID accepted</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-info" /> 1-2 business day review</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already registered? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) setStep(step + 1);
    else navigate("/login");
  };

  const steps = ["Personal Info", "Work Details", "Review & Submit"];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <button onClick={() => { if (step === 1) setPath(null); else setStep(step - 1); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <CardTitle>{path === "bankid" ? "BankID Registration" : "Manual Registration"}</CardTitle>
          <CardDescription>Step {step} of 3: {steps[step - 1]}</CardDescription>
          <div className="flex gap-1 mt-3">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                {path === "bankid" && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm text-center mb-4">
                    <Fingerprint className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-medium">Open your BankID app</p>
                    <p className="text-muted-foreground">Waiting for verification...</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>First Name</Label><Input placeholder="Johan" /></div>
                  <div className="space-y-2"><Label>Last Name</Label><Input placeholder="Andersson" /></div>
                </div>
                <div className="space-y-2"><Label>Personal Number / ID</Label><Input placeholder="YYYYMMDD-XXXX" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="johan@example.com" /></div>
                <div className="space-y-2"><Label>Phone</Label><Input type="tel" placeholder="+46 70 123 4567" /></div>
              </>
            )}
            {step === 2 && (
              <>
                <div className="space-y-2"><Label>Preferred Work City</Label><Input placeholder="Stockholm" /></div>
                <div className="space-y-2"><Label>Vehicle Type</Label><Input placeholder="Bicycle, Moped, Car..." /></div>
                <div className="space-y-2"><Label>Availability</Label><Input placeholder="Full-time / Part-time" /></div>
                {path === "manual" && (
                  <div className="space-y-2">
                    <Label>Upload ID Document</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground hover:border-primary transition-colors cursor-pointer">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Click to upload passport or ID card</p>
                      <p className="text-xs mt-1">PDF, JPG or PNG up to 10MB</p>
                    </div>
                  </div>
                )}
              </>
            )}
            {step === 3 && (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-muted space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">Johan Andersson</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">johan@example.com</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Verification</span><span className="font-medium capitalize">{path}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">City</span><span className="font-medium">Stockholm</span></div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-1" />
                  <span className="text-muted-foreground">I agree to the <a href="#" className="text-primary underline">Terms of Service</a> and <a href="#" className="text-primary underline">Privacy Policy</a></span>
                </div>
              </div>
            )}
            <Button type="submit" className="w-full">
              {step < 3 ? "Continue" : "Submit Registration"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
