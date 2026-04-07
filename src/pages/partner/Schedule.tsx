import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Assignment = {
  id: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  responded_at: string | null;
  schedule: {
    id: string;
    title: string;
    description: string | null;
    start_datetime: string;
    end_datetime: string;
    location: string | null;
    notes: string | null;
  };
};

function formatDt(dt: string) {
  return new Date(dt).toLocaleString("sv-SE", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function durationHours(start: string, end: string): string {
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / 3600000;
  return `${diff.toFixed(1)}h`;
}

export default function PartnerSchedule() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [appId, setAppId]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [responding, setResponding]   = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { loadSchedule(); }, []);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc("link_my_application");

      const { data: app } = await supabase
        .from("partner_applications")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!app) return;
      setAppId(app.id);

      const { data, error } = await supabase
        .from("schedule_assignments")
        .select("id, status, admin_notes, created_at, responded_at, schedule:schedules(id, title, description, start_datetime, end_datetime, location, notes)")
        .eq("partner_application_id", app.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssignments((data as unknown as Assignment[]) || []);
    } catch (err: any) {
      toast({ title: "Error loading schedule", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (assignmentId: string, newStatus: "confirmed" | "declined") => {
    setResponding(assignmentId);
    try {
      const { error } = await supabase
        .from("schedule_assignments")
        .update({ status: newStatus, responded_at: new Date().toISOString() })
        .eq("id", assignmentId);
      if (error) throw error;
      toast({ title: newStatus === "confirmed" ? "Shift confirmed!" : "Shift declined" });
      await loadSchedule();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setResponding(null);
    }
  };

  const now = new Date();
  const upcoming = assignments.filter(a => new Date(a.schedule.end_datetime) >= now);
  const past     = assignments.filter(a => new Date(a.schedule.end_datetime) < now);

  const STATUS_STYLE: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    assigned:  { label: "Pending Response", color: "text-amber-600 bg-amber-50 border-amber-200", icon: AlertCircle },
    confirmed: { label: "Confirmed",        color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle },
    declined:  { label: "Declined",         color: "text-red-600 bg-red-50 border-red-200", icon: XCircle },
    completed: { label: "Completed",        color: "text-blue-700 bg-blue-50 border-blue-200", icon: CheckCircle },
  };

  const confirmed = upcoming.filter(a => a.status === "confirmed").length;
  const pendingCount = upcoming.filter(a => a.status === "assigned").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const AssignmentCard = ({ a }: { a: Assignment }) => {
    const s = STATUS_STYLE[a.status] ?? STATUS_STYLE.assigned;
    const Icon = s.icon;
    const isPending = a.status === "assigned";
    const isFuture = new Date(a.schedule.start_datetime) > now;
    return (
      <Card className={`border-l-4 ${
        a.status === "confirmed" ? "border-l-emerald-400" :
        a.status === "declined"  ? "border-l-red-400" :
        a.status === "assigned"  ? "border-l-amber-400" : "border-l-muted"
      }`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{a.schedule.title}</h3>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${s.color}`}>
                  <Icon className="h-3 w-3" /> {s.label}
                </span>
              </div>
              {a.schedule.description && (
                <p className="text-sm text-muted-foreground">{a.schedule.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDt(a.schedule.start_datetime)} — {formatDt(a.schedule.end_datetime)}
                  <span className="text-xs font-medium text-foreground ml-1">({durationHours(a.schedule.start_datetime, a.schedule.end_datetime)})</span>
                </span>
                {a.schedule.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {a.schedule.location}
                  </span>
                )}
              </div>
              {a.admin_notes && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border">{a.admin_notes}</p>
              )}
            </div>
            {isPending && isFuture && (
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm" variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  disabled={responding === a.id}
                  onClick={() => handleRespond(a.id, "declined")}
                >
                  {responding === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  size="sm"
                  disabled={responding === a.id}
                  onClick={() => handleRespond(a.id, "confirmed")}
                >
                  {responding === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                  Confirm
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Schedule</h1>
        <p className="text-base text-muted-foreground mt-1">Your upcoming assignments and shifts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold">{upcoming.length}</p><p className="text-sm text-muted-foreground mt-1">Upcoming</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-emerald-600">{confirmed}</p><p className="text-sm text-muted-foreground mt-1">Confirmed</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-amber-600">{pendingCount}</p><p className="text-sm text-muted-foreground mt-1">Awaiting Response</p></CardContent></Card>
        <Card><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-muted-foreground">{past.length}</p><p className="text-sm text-muted-foreground mt-1">Completed</p></CardContent></Card>
      </div>

      {/* Upcoming */}
      {upcoming.length === 0 && past.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No shifts assigned</h2>
            <p className="text-muted-foreground">Your schedule will appear here once AM:365 assigns you to shifts.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Upcoming Shifts</h2>
              {upcoming.map(a => <AssignmentCard key={a.id} a={a} />)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-muted-foreground">Past Shifts</h2>
              {past.map(a => <AssignmentCard key={a.id} a={a} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
