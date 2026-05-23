import { createClient } from "@/lib/supabase/server";
import { startOfDay, endOfDay, subDays, formatISO } from "date-fns";

export interface DashboardStats {
  newLeadsToday: number;
  callsToday: number;
  followupsDueToday: number;
  hotLeads: number;
  siteVisitsScheduled: number;
  availableInventory: number;
  teamPresent: number;
  teamTotal: number;
  leadsTrend: { day: string; count: number }[];
  sourceBreakdown: { source: string; count: number }[];
}

export async function getDashboardStats(organizationId: string): Promise<DashboardStats> {
  const supabase = await createClient();
  const now = new Date();
  const todayStart = formatISO(startOfDay(now));
  const todayEnd = formatISO(endOfDay(now));
  const sevenDaysAgo = subDays(now, 6);

  const [
    newLeadsRes,
    callsRes,
    followupsRes,
    hotLeadsRes,
    siteVisitsRes,
    inventoryRes,
    presentRes,
    totalUsersRes,
    last7Res,
    sourceRes,
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd),
    supabase
      .from("calls")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd),
    supabase
      .from("followups")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending")
      .gte("due_at", todayStart)
      .lte("due_at", todayEnd),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("temperature", "hot"),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "site_visit_scheduled"),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "available"),
    supabase
      .from("attendance")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("check_in_time", todayStart)
      .is("check_out_time", null),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_active", true),
    supabase
      .from("leads")
      .select("created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", formatISO(sevenDaysAgo)),
    supabase
      .from("leads")
      .select("source")
      .eq("organization_id", organizationId)
      .gte("created_at", formatISO(subDays(now, 30))),
  ]);

  // Bucket leads by day for the 7-day trend
  const dayBuckets = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = subDays(now, i);
    dayBuckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of last7Res.data ?? []) {
    const day = (r.created_at as string).slice(0, 10);
    if (dayBuckets.has(day)) dayBuckets.set(day, (dayBuckets.get(day) ?? 0) + 1);
  }
  const leadsTrend = Array.from(dayBuckets.entries()).map(([day, count]) => ({
    day: day.slice(5), // MM-DD
    count,
  }));

  const sourceCounts = new Map<string, number>();
  for (const r of sourceRes.data ?? []) {
    const src = (r.source as string) ?? "other";
    sourceCounts.set(src, (sourceCounts.get(src) ?? 0) + 1);
  }
  const sourceBreakdown = Array.from(sourceCounts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  return {
    newLeadsToday: newLeadsRes.count ?? 0,
    callsToday: callsRes.count ?? 0,
    followupsDueToday: followupsRes.count ?? 0,
    hotLeads: hotLeadsRes.count ?? 0,
    siteVisitsScheduled: siteVisitsRes.count ?? 0,
    availableInventory: inventoryRes.count ?? 0,
    teamPresent: presentRes.count ?? 0,
    teamTotal: totalUsersRes.count ?? 0,
    leadsTrend,
    sourceBreakdown,
  };
}

export async function getRecentActivity(organizationId: string, limit = 15) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select(
      `
      id, type, payload, created_at,
      lead:leads ( id, full_name, phone ),
      property:properties ( id, title ),
      actor:profiles ( id, full_name )
    `,
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
