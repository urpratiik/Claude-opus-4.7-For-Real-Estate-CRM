import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";
import { getIntegrationContext } from "./integration";

/**
 * Pick the next sales agent in an organization based on the configured mode.
 *
 * Modes:
 * - round_robin   - cycles through active sales agents using `last_assigned_at`
 * - manual        - returns null (caller assigns explicitly)
 * - least_busy    - agent with the fewest open leads in `new`/`contacted`/`interested`
 */
export async function pickNextAgent(
  organizationId: string,
): Promise<Profile | null> {
  const ctx = await getIntegrationContext(organizationId);
  const admin = createAdminClient();

  if (ctx.assignmentMode === "manual") return null;

  const { data: agents } = await admin
    .from("profiles")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .in("role", ["sales_agent", "sales_manager"])
    .order("last_assigned_at", { ascending: true, nullsFirst: true });

  if (!agents || agents.length === 0) return null;

  if (ctx.assignmentMode === "round_robin") {
    return agents[0] as Profile;
  }

  // least_busy
  const ids = agents.map((a) => a.id);
  const { data: counts } = await admin
    .from("leads")
    .select("assigned_agent_id")
    .eq("organization_id", organizationId)
    .in("status", ["new", "contacted", "interested"])
    .in("assigned_agent_id", ids);

  const tally = new Map<string, number>();
  for (const id of ids) tally.set(id, 0);
  for (const row of counts ?? []) {
    if (!row.assigned_agent_id) continue;
    tally.set(row.assigned_agent_id, (tally.get(row.assigned_agent_id) ?? 0) + 1);
  }

  const sorted = [...agents].sort(
    (a, b) => (tally.get(a.id) ?? 0) - (tally.get(b.id) ?? 0),
  );
  return sorted[0] as Profile;
}

/** Mark this agent as the most-recently-assigned, advancing the round robin. */
export async function markAgentAssigned(agentId: string) {
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ last_assigned_at: new Date().toISOString() })
    .eq("id", agentId);
}
