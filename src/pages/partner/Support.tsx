import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HelpCircle, MessageSquare, Phone, Mail, FileQuestion, Send } from "lucide-react";

const faqs = [
  { q: "How do I update my bank details?", a: "Go to My Profile and update your bank information. Changes take effect next pay cycle." },
  { q: "When are payouts processed?", a: "Payouts are processed on the 25th of each month. If it falls on a weekend, the previous Friday." },
  { q: "How do I report a sick day?", a: "Contact your scheduler or use the Schedule page to mark yourself unavailable." },
];

export default function PartnerSupport() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Support & Help</h1>
        <p className="text-muted-foreground">Get help or contact our support team</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="text-center">
          <CardContent className="p-6">
            <Phone className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="font-semibold">Call Us</p>
            <p className="text-sm text-muted-foreground">+46 8 123 4567</p>
            <p className="text-xs text-muted-foreground">Mon-Fri 9:00-17:00</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-6">
            <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="font-semibold">Email</p>
            <p className="text-sm text-muted-foreground">support@am365group.se</p>
            <p className="text-xs text-muted-foreground">Response within 24h</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-6">
            <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="font-semibold">Live Chat</p>
            <p className="text-sm text-muted-foreground">Available now</p>
            <Button size="sm" className="mt-2">Start Chat</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileQuestion className="h-5 w-5 text-primary" /> FAQ</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="p-3 rounded-lg bg-muted">
              <p className="font-medium text-sm flex items-center gap-2"><HelpCircle className="h-4 w-4 text-primary" />{faq.q}</p>
              <p className="text-sm text-muted-foreground mt-1 ml-6">{faq.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Send a Message</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2"><Label>Subject</Label><Input placeholder="What do you need help with?" /></div>
            <div className="space-y-2"><Label>Message</Label><Textarea placeholder="Describe your issue..." rows={4} /></div>
            <Button><Send className="mr-2 h-4 w-4" /> Send Message</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
