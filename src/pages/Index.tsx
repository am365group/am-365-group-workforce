import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Shield, DollarSign, Truck, CheckCircle, Building2, Globe } from "lucide-react";

const features = [
  { icon: Users, title: "Employer of Record", description: "We handle payroll, taxes, insurance, and compliance so delivery partners can focus on what they do best." },
  { icon: Shield, title: "BankID Verification", description: "Seamless identity verification using Swedish BankID for fast, secure onboarding of new delivery partners." },
  { icon: DollarSign, title: "Automated Payroll", description: "Automatic salary calculations, tax withholding, pension contributions, and timely payouts every month." },
  { icon: Truck, title: "Platform Integration", description: "Direct API integration with Wolt, Foodora, and other delivery platforms for real-time data synchronization." },
];

const stats = [
  { value: "247+", label: "Active Partners" },
  { value: "19,200+", label: "Monthly Deliveries" },
  { value: "2.8M SEK", label: "Monthly Payroll" },
  { value: "99.9%", label: "Payout Accuracy" },
];

const partners = ["Wolt", "Foodora"];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">AM</div>
            <div>
              <span className="text-xl font-bold">AM:365</span>
              <span className="text-sm text-muted-foreground ml-2 hidden sm:inline">Workforce Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/portal/login">
              <Button variant="ghost" size="sm">Staff Login</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="sm">Partner Login</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Join as Partner <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32 relative">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-6 text-sm px-4 py-1.5">
              <Globe className="h-3.5 w-3.5 mr-1.5" /> Sweden's Trusted EoR for Delivery Partners
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
              The complete workforce
              <span className="text-primary"> platform</span> for delivery partners
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl">
              AM:365 is the Employer of Record (EoR) solution for gig delivery workers in Sweden. 
              We manage employment, payroll, compliance, and benefits — so platforms and partners can thrive.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg" className="text-base px-8 h-12">
                  Register as Partner <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/portal/login">
                <Button variant="outline" size="lg" className="text-base px-8 h-12">
                  <Building2 className="mr-2 h-5 w-5" /> Platform Access
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-card">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">Everything you need, in one platform</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From onboarding to payroll, AM:365 handles the full employment lifecycle for delivery partners across Sweden.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Partners */}
      <section className="bg-card border-y">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Trusted by leading delivery platforms</h2>
            <p className="text-muted-foreground">Integrated with the platforms your partners already work on</p>
          </div>
          <div className="flex items-center justify-center gap-12">
            {partners.map((name) => (
              <div key={name} className="flex items-center gap-3 px-8 py-4 rounded-xl bg-muted/50 border">
                <Building2 className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <Card className="bg-foreground text-card overflow-hidden">
          <CardContent className="p-12 lg:p-16 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
            <div className="relative max-w-2xl">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to get started?</h2>
              <p className="text-lg text-white/70 mb-8">
                Join hundreds of delivery partners across Sweden. Register today and start working with full employment benefits.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <Button size="lg" className="text-base px-8 h-12">Register Now <ArrowRight className="ml-2 h-5 w-5" /></Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="text-base px-8 h-12 border-white/20 text-white hover:bg-white/10">
                    Partner Login
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">AM</div>
              <span className="font-bold">AM:365 Group AB</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2024 AM365 Group AB. All rights reserved. Org.nr: 559XXX-XXXX</p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">Privacy Policy</a>
              <a href="#" className="hover:text-foreground">Terms of Service</a>
              <a href="#" className="hover:text-foreground">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
