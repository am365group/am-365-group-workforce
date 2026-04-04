import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, MessageSquare, Phone, Mail, FileQuestion, Send, Clock, CheckCircle, ExternalLink } from "lucide-react";

const faqs = [
  { q: "How do I update my bank details?", a: "Go to My Profile → Bank Details section and update your information. Changes take effect from the next pay cycle (25th of the month)." },
  { q: "When are payouts processed?", a: "Payouts are processed on the 25th of each month. If the 25th falls on a weekend or public holiday, payment is made on the previous business day." },
  { q: "How do I report a sick day?", a: "Contact your scheduler via the portal or call our support line. Day 1 is karensdag (unpaid), days 2-14 are covered at 80% by AM365." },
  { q: "How does overtime work?", a: "Hours exceeding 40h/week are paid at 1.5x your hourly rate. Public holidays are paid at 2x. Overtime is automatically calculated from delivery data." },
  { q: "Can I work for multiple platforms?", a: "Yes! AM365 supports Wolt and Foodora. Your schedule can include shifts from different platforms. All earnings are consolidated in one payslip." },
  { q: "How do I download my tax certificate?", a: "Go to Documents → Tax section. Your annual Kontrolluppgift is uploaded in January each year for the previous tax year." },
];

const recentTickets = [
  { id: "T-042", subject: "Payslip discrepancy — March hours", status: "Resolved", date: "Mar 28, 2024" },
  { id: "T-038", subject: "Vehicle type change request", status: "Resolved", date: "Mar 15, 2024" },
  { id: "T-035", subject: "Schedule conflict — double booking", status: "Resolved", date: "Mar 8, 2024" },
];

export default function PartnerSupport() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Support & Help</h1>
        <p className="text-base text-muted-foreground mt-1">Get help from our team or find answers in our FAQ</p>
      </div>

      {/* Contact Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="text-center hover:shadow-md transition-shadow hover:border-primary/30">
          <CardContent className="p-7">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Phone className="h-7 w-7 text-primary" />
            </div>
            <p className="font-semibold text-lg">Call Us</p>
            <p className="text-base text-muted-foreground mt-1">+46 8 123 4567</p>
            <p className="text-sm text-muted-foreground">Mon–Fri 9:00–17:00 CET</p>
          </CardContent>
        </Card>
        <Card className="text-center hover:shadow-md transition-shadow hover:border-primary/30">
          <CardContent className="p-7">
            <div className="h-14 w-14 rounded-xl bg-info/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-7 w-7 text-info" />
            </div>
            <p className="font-semibold text-lg">Email</p>
            <p className="text-base text-muted-foreground mt-1">support@am365group.se</p>
            <p className="text-sm text-muted-foreground">Response within 24 hours</p>
          </CardContent>
        </Card>
        <Card className="text-center hover:shadow-md transition-shadow hover:border-primary/30">
          <CardContent className="p-7">
            <div className="h-14 w-14 rounded-xl bg-warning/10 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-7 w-7 text-warning" />
            </div>
            <p className="font-semibold text-lg">Live Chat</p>
            <p className="text-base text-muted-foreground mt-1">Available now</p>
            <Button size="sm" className="mt-3">Start Chat</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><FileQuestion className="h-5 w-5 text-primary" /> Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="p-4 rounded-xl bg-muted/50 border hover:border-primary/20 transition-colors">
                <p className="font-medium flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  {faq.q}
                </p>
                <p className="text-sm text-muted-foreground mt-2 ml-6 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Support Form + Recent Tickets */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Submit a Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Subject</Label>
                  <Input placeholder="What do you need help with?" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <Input placeholder="Payroll / Schedule / Contract / Other" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <Textarea placeholder="Describe your issue in detail..." rows={5} />
                </div>
                <Button className="w-full h-11"><Send className="mr-2 h-4 w-4" /> Submit Ticket</Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Tickets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Recent Tickets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 rounded-xl border">
                  <div>
                    <p className="font-medium text-sm">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{ticket.id} · {ticket.date}</p>
                  </div>
                  <Badge variant="default" className="flex items-center gap-1 text-xs">
                    <CheckCircle className="h-3 w-3" /> {ticket.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
