import { createClient } from "@/lib/supabase/server";
import type { Lead, LeadStatus, LeadTemperature, LeadSource } from "@/lib/types";

export interface LeadFilters {
  q?: string;
  status?: LeadStatus | "all";
  source?: LeadSource | "all";
  temperature?: LeadTemperature | "all";
  agentId?: string | "all";
  scope?: "all" | "mine" | "unassigned";
}

/** Caller's profile is read by RLS; we never have to filter org_id explicitly. */
export async function listLeads(filters: LeadFilters = {}, currentUserId?: string) {
  const supabase = await createClient();
  let q = supabase
    .from("leads")
    .select(
      `
      id, full_name, phone, email, source, status, temperature,
      property_type, budget_min, budget_max, preferred_location,
      assigned_agent_id, next_followup_at, last_contacted_at,
      created_at, updated_at,
      agent:profiles!leads_assigned_agent_id_fkey ( id, full_name, role )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters.status && filters.status !== "all") q = q.eq("status", filters.status);
  if (filters.source && filters.source !== "all") q = q.eq("source", filters.source);
  if (filters.temperature && filters.temperature !== "all")
    q = q.eq("temperature", filters.temperature);
  if (filters.agentId && filters.agentId !== "all")
    q = q.eq("assigned_agent_id", filters.agentId);
  if (filters.scope === "mine" && currentUserId) q = q.eq("assigned_agent_id", currentUserId);
  if (filters.scope === "unassigned") q = q.is("assigned_agent_id", null);
  if (filters.q && filters.q.trim()) {
    const pattern = `%${filters.q.trim()}%`;
    q = q.or(
      `full_name.ilike.${pattern},phone.ilike.${pattern},email.ilike.${pattern},preferred_location.ilike.${pattern}`,
    );
  }

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getLead(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select(
      `
      *,
      agent:profiles!leads_assigned_agent_id_fkey ( id, full_name, phone, role, avatar_url )
    `,
    )
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function getLeadTimeline(leadId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select(
      `
      id, type, payload, created_at,
      actor:profiles ( id, full_name ),
      lead:leads ( id, full_name ),
      property:properties ( id, title ),
      call:calls ( id, status, outcome, duration_seconds, recording_url, is_dry_run ),
      message:messages ( id, channel, body, status, is_dry_run ),
      followup:followups ( id, type, status, due_at )
    `,
    )
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function listAgentsForOrg(orgId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .in("role", ["sales_agent", "sales_manager", "admin"])
    .order("full_name");
  return data ?? [];
}

export type LeadListRow = Awaited<ReturnType<typeof listLeads>>[number];
