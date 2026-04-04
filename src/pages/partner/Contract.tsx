import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Calendar, Building2, Clock, DollarSign, Shield, Heart, CheckCircle } from "lucide-react";

const contractDetails = [
  { icon: Calendar, label: "Start Date", value: "January 15, 2024" },
  { icon: Calendar, label: "End Date", value: "Ongoing (tillsvidare)" },
  { icon: Building2, label: "Employer", value: "AM365 Group AB" },
  { icon: FileText, label: "Type", value: "Employer of Record – Delivery Partner" },
  { icon: DollarSign, label: "Hourly Rate", value: "180 SEK/hour" },
  { icon: Clock, label: "Standard Hours", value: "40 hours/week" },
];

const benefits = [
  { icon: DollarSign, title: "Overtime Compensation", description: "1.5x rate after 40 hours per week, 2x on public holidays" },
  { icon: Heart, title: "Health Insurance", description: "Full coverage via AM365 collective agreement (Fora)" },
  { icon: Shield, title: "Pension (Tjänstepension)", description: "4.5% employer contribution via Avtalat ITP" },
  { icon: Calendar, title: "Paid Vacation", description: "25 days per year, vacation pay 12% of gross salary" },
  { icon: FileText, title: "Sick Leave", description: "Day 1: karensdag, Day 2-14: 80% sick pay from AM365" },
  { icon: Building2, title: "Workers' Compensation", description: "Full coverage for work-related injuries and accidents" },
];

const contractHistory = [
  { version: "v2.0", date: "Jan 15, 2024", change: "Transferred to EoR agreement — rate updated to 180 SEK/h", status: "Current" },
  { version: "v1.0", date: "Oct 1, 2023", change: "Initial partner onboarding agreement", status: "Superseded" },
];

export default function PartnerContract() {
  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">My Contract</h1>
        <p className="text-base text-muted-foreground mt-1">Your current employment agreement with AM365 Group AB</p>
      </div>

      {/* Contract Header */}
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Partner Employment Agreement</h2>
                <p className="text-muted-foreground">Contract #AM365-2024-0142 · Version 2.0</p>
                <p className="text-sm text-muted-foreground mt-1">Signed digitally via BankID on January 15, 2024</p>
              </div>
            </div>
            <Badge className="text-sm px-3 py-1">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Contract Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Contract Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {contractDetails.map((detail) => (
              <div key={detail.label} className="p-4 rounded-xl bg-muted/50 border">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
                  <detail.icon className="h-3.5 w-3.5" /> {detail.label}
                </p>
                <p className="font-semibold">{detail.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benefits & Compensation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> Benefits & Compensation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{benefit.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Key Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p><span className="font-medium">Notice Period:</span> 1 month from either party. During probation (6 months): 2 weeks.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p><span className="font-medium">Working Hours:</span> Flexible scheduling via the platform. Max 48h/week average over 4 weeks.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p><span className="font-medium">Collective Agreement:</span> This contract follows the Swedish collective agreement for transport workers.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p><span className="font-medium">GDPR Compliance:</span> Personal data is processed in accordance with EU GDPR regulations.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p><span className="font-medium">Governing Law:</span> Swedish law applies. Disputes handled by Arbetsdomstolen (Labour Court).</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Contract History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {contractHistory.map((version) => (
              <div key={version.version} className="flex items-center justify-between p-4 rounded-xl border">
                <div className="flex items-center gap-4">
                  <Badge variant={version.status === "Current" ? "default" : "secondary"}>{version.version}</Badge>
                  <div>
                    <p className="font-medium text-sm">{version.change}</p>
                    <p className="text-sm text-muted-foreground">{version.date}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm"><Download className="mr-1.5 h-3.5 w-3.5" /> Download</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full h-12" size="lg"><Download className="mr-2 h-5 w-5" /> Download Current Contract (PDF)</Button>
    </div>
  );
}
