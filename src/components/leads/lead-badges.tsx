import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LEAD_STATUSES, LEAD_TEMPERATURES, LEAD_SOURCES } from "@/lib/constants";
import type { LeadStatus, LeadTemperature, LeadSource } from "@/lib/types";

export function StatusBadge({ status }: { status: LeadStatus }) {
  const meta = LEAD_STATUSES.find((s) => s.value === status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        meta?.color,
      )}
    >
      {meta?.label ?? status}
    </span>
  );
}

export function TemperatureBadge({ temperature }: { temperature: LeadTemperature }) {
  const meta = LEAD_TEMPERATURES.find((t) => t.value === temperature);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        meta?.color,
      )}
    >
      {temperature === "hot" ? "🔥" : temperature === "warm" ? "☀️" : "❄️"} {meta?.label}
    </span>
  );
}

export function SourceBadge({ source }: { source: LeadSource }) {
  const meta = LEAD_SOURCES.find((s) => s.value === source);
  return <Badge variant="muted">{meta?.label ?? source}</Badge>;
}
