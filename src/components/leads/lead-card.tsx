import Link from "next/link";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { StatusBadge, TemperatureBadge, SourceBadge } from "./lead-badges";
import { formatBudgetRange, relativeTime, maskPhone } from "@/lib/utils";
import type { LeadListRow } from "@/lib/db/leads";

export function LeadCard({ lead }: { lead: LeadListRow }) {
  const agentName = Array.isArray(lead.agent) ? lead.agent[0]?.full_name : (lead.agent as { full_name?: string } | null)?.full_name;

  return (
    <Link
      href={`/leads/${lead.id}`}
      className="block rounded-xl border bg-card p-3 shadow-sm transition-colors hover:bg-accent/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{lead.full_name}</h3>
            <TemperatureBadge temperature={lead.temperature} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {maskPhone(lead.phone)}
            </span>
            {lead.preferred_location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {lead.preferred_location}
              </span>
            )}
            {lead.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {lead.email}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={lead.status} />
            <SourceBadge source={lead.source} />
            <span className="text-xs text-muted-foreground">
              {formatBudgetRange(lead.budget_min, lead.budget_max)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end text-right">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {relativeTime(lead.created_at)}
          </span>
          {agentName && (
            <span className="mt-1 text-xs text-muted-foreground">{agentName}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
