import Link from "next/link";
import {
  PhoneCall,
  PhoneIncoming,
  MessageSquare,
  Share2,
  Bell,
  UserPlus,
  CheckCircle2,
  ClipboardCheck,
  StickyNote,
  Building2,
} from "lucide-react";
import { relativeTime } from "@/lib/utils";
import type { ActivityType } from "@/lib/types";

const ICONS: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  lead_created: UserPlus,
  lead_assigned: UserPlus,
  lead_status_changed: CheckCircle2,
  lead_temperature_changed: Bell,
  note_added: StickyNote,
  call_initiated: PhoneCall,
  call_completed: PhoneIncoming,
  message_sent: MessageSquare,
  property_shared: Share2,
  followup_scheduled: Bell,
  followup_completed: CheckCircle2,
  attendance_check_in: ClipboardCheck,
  attendance_check_out: ClipboardCheck,
  site_visit_scheduled: Building2,
};

const LABELS: Record<ActivityType, string> = {
  lead_created: "Lead created",
  lead_assigned: "Lead assigned",
  lead_status_changed: "Status changed",
  lead_temperature_changed: "Temperature updated",
  note_added: "Note added",
  call_initiated: "Call started",
  call_completed: "Call completed",
  message_sent: "Message sent",
  property_shared: "Property shared",
  followup_scheduled: "Follow-up scheduled",
  followup_completed: "Follow-up completed",
  attendance_check_in: "Checked in",
  attendance_check_out: "Checked out",
  site_visit_scheduled: "Site visit scheduled",
};

export interface ActivityRow {
  id: string;
  type: ActivityType;
  payload: Record<string, unknown> | null;
  created_at: string;
  lead: { id: string; full_name: string } | null;
  property: { id: string; title: string } | null;
  actor: { id: string; full_name: string } | null;
}

export function ActivityItem({ a }: { a: ActivityRow }) {
  const Icon = ICONS[a.type] ?? Bell;
  const subject = a.lead?.full_name ?? a.property?.title ?? "—";
  const href = a.lead ? `/leads/${a.lead.id}` : a.property ? `/properties/${a.property.id}` : "#";

  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/60 transition-colors"
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          <span className="font-medium">{LABELS[a.type] ?? a.type}</span>
          <span className="text-muted-foreground"> · {subject}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {a.actor?.full_name ?? "System"} · {relativeTime(a.created_at)}
        </p>
      </div>
    </Link>
  );
}
