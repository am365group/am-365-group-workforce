import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, Search, User, Mail, Clock, Reply, CheckCheck } from "lucide-react";

const messages = [
  { from: "Johan Andersson", id: "P-001", subject: "Schedule question", preview: "Can I switch my Thursday shift at Kungsholmen to Friday? I have a doctor's appointment.", time: "2h ago", unread: true, replies: 0 },
  { from: "Erik Johansson", id: "P-002", subject: "Payslip issue — March hours", preview: "My March payslip shows 140 hours but I worked 148 hours according to my Wolt app. Can you check?", time: "5h ago", unread: true, replies: 1 },
  { from: "Anna Lindström", id: "P-003", subject: "Document upload confirmation", preview: "I've uploaded my updated passport. Can you verify it's received and start the review?", time: "1d ago", unread: false, replies: 2 },
  { from: "Mohammed Al-Hassan", id: "P-004", subject: "Vehicle change request", preview: "I'm switching from bicycle to electric moped starting next week. Do I need to update my contract?", time: "2d ago", unread: false, replies: 3 },
  { from: "Fatima Noor", id: "P-007", subject: "Overtime hours question", preview: "I worked 48 hours last week. When will the overtime pay be reflected in my payslip?", time: "3d ago", unread: false, replies: 1 },
  { from: "Carlos Garcia", id: "P-008", subject: "Registration status", preview: "I registered last week but haven't heard back about my ID verification. What's the status?", time: "4d ago", unread: false, replies: 0 },
];

export default function AdminMessages() {
  const unreadCount = messages.filter(m => m.unread).length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-base text-muted-foreground mt-1">Partner communications, support tickets, and announcements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5">
        <Card><CardContent className="p-5 text-center"><MessageSquare className="h-5 w-5 text-primary mx-auto mb-2" /><p className="text-3xl font-bold">{messages.length}</p><p className="text-sm text-muted-foreground mt-1">Total Messages</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><Mail className="h-5 w-5 text-warning mx-auto mb-2" /><p className="text-3xl font-bold text-warning">{unreadCount}</p><p className="text-sm text-muted-foreground mt-1">Unread</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><Reply className="h-5 w-5 text-info mx-auto mb-2" /><p className="text-3xl font-bold text-info">4</p><p className="text-sm text-muted-foreground mt-1">Awaiting Reply</p></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Message List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search messages by name, subject..." className="pl-9 h-11" />
          </div>
          <div className="space-y-3">
            {messages.map((m, i) => (
              <Card key={i} className={`cursor-pointer hover:shadow-md transition-all ${m.unread ? "border-primary/20 bg-primary/5" : ""}`}>
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary mt-0.5">
                    {m.from.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{m.from}</p>
                        <Badge variant="outline" className="text-xs">{m.id}</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {m.time}</span>
                    </div>
                    <p className="font-medium mt-1">{m.subject}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{m.preview}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {m.replies > 0 && <span className="text-xs text-muted-foreground flex items-center gap-1"><CheckCheck className="h-3 w-3" /> {m.replies} replies</span>}
                    </div>
                  </div>
                  {m.unread && <div className="h-2.5 w-2.5 rounded-full bg-primary mt-2" />}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Send Announcement */}
        <Card>
          <CardHeader><CardTitle className="text-xl">Send Announcement</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">To</Label>
                <Input placeholder="All partners / Select group..." className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Subject</Label>
                <Input placeholder="Announcement subject" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Message</Label>
                <Textarea placeholder="Type your announcement message..." rows={6} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Send via</Label>
                <div className="flex gap-3">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 px-3 py-1.5">Portal</Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 px-3 py-1.5">Email</Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 px-3 py-1.5">Both</Badge>
                </div>
              </div>
              <Button className="w-full h-11"><Send className="mr-2 h-4 w-4" /> Send Announcement</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
