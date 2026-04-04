import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, Search, User } from "lucide-react";

const messages = [
  { from: "Johan Andersson", subject: "Schedule question", preview: "Can I switch my Thursday shift?", time: "2h ago", unread: true },
  { from: "Erik Johansson", subject: "Payslip issue", preview: "My March payslip shows incorrect hours.", time: "5h ago", unread: true },
  { from: "Anna Lindström", subject: "Document upload", preview: "I've uploaded my updated ID.", time: "1d ago", unread: false },
  { from: "Mohammed Al-Hassan", subject: "Vehicle change", preview: "I'm switching from bicycle to moped.", time: "2d ago", unread: false },
];

export default function AdminMessages() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Partner communications and announcements</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search messages..." className="pl-9" />
          </div>
          <div className="space-y-2">
            {messages.map((m, i) => (
              <Card key={i} className={`cursor-pointer hover:border-primary/30 transition-colors ${m.unread ? "border-primary/20 bg-primary/5" : ""}`}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary mt-0.5">
                    {m.from.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{m.from}</p>
                      <span className="text-xs text-muted-foreground">{m.time}</span>
                    </div>
                    <p className="text-sm font-medium">{m.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.preview}</p>
                  </div>
                  {m.unread && <div className="h-2 w-2 rounded-full bg-primary mt-2" />}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Send Announcement</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2"><Label>To</Label><Input placeholder="All partners / Select..." /></div>
              <div className="space-y-2"><Label>Subject</Label><Input placeholder="Announcement subject" /></div>
              <div className="space-y-2"><Label>Message</Label><Textarea placeholder="Type your message..." rows={4} /></div>
              <Button className="w-full"><Send className="mr-2 h-4 w-4" /> Send</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
