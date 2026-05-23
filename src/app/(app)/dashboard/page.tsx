import Link from "next/link";
import {
  Bell,
  Building2,
  CalendarDays,
  Flame,
  PhoneCall,
  Plus,
  UserPlus,
  Users2,
} from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { getDashboardStats, getRecentActivity } from "@/lib/db/dashboard";
import { PageShell, PageHeader } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LeadsTrendChart } from "@/components/dashboard/leads-trend-chart";
import { ActivityItem, type ActivityRow } from "@/components/dashboard/activity-item";
import { LEAD_SOURCES } from "@/lib/constants";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const profile = await requireProfile();
  const [stats, activity] = await Promise.all([
    getDashboardStats(profile.organization_id),
    getRecentActivity(profile.organization_id, 12),
  ]);

  const sourceLabel = (s: string) =>
    LEAD_SOURCES.find((x) => x.value === s)?.label ?? s;

  return (
    <PageShell>
      <PageHeader
        title={`Hi, ${profile.full_name.split(" ")[0]} 👋`}
        subtitle="Here's what's happening today."
        action={
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/leads/new">
              <Plus className="h-4 w-4" /> New lead
            </Link>
          </Button>
        }
      />

      {/* Top metrics */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="New today"
          value={stats.newLeadsToday}
          icon={<UserPlus />}
          tone="primary"
        />
        <StatCard
          label="Calls today"
          value={stats.callsToday}
          icon={<PhoneCall />}
          tone="success"
        />
        <StatCard
          label="Follow-ups due"
          value={stats.followupsDueToday}
          icon={<Bell />}
          tone="warning"
        />
        <StatCard label="Hot leads" value={stats.hotLeads} icon={<Flame />} tone="destructive" />
      </section>

      {/* Secondary metrics */}
      <section className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Site visits"
          value={stats.siteVisitsScheduled}
          icon={<CalendarDays />}
          hint="Scheduled"
        />
        <StatCard
          label="Inventory"
          value={stats.availableInventory}
          icon={<Building2 />}
          hint="Available"
        />
        <StatCard
          label="On duty"
          value={`${stats.teamPresent}/${stats.teamTotal}`}
          icon={<Users2 />}
          hint="Currently checked in"
        />
      </section>

      {/* Leads trend + sources */}
      <section className="mt-6 grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Leads in the last 7 days</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadsTrendChart data={stats.leadsTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top sources (30d)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.sourceBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leads yet.</p>
            ) : (
              stats.sourceBreakdown.slice(0, 6).map((row) => {
                const total =
                  stats.sourceBreakdown.reduce((s, r) => s + r.count, 0) || 1;
                const pct = Math.round((row.count / total) * 100);
                return (
                  <div key={row.source}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="truncate">{sourceLabel(row.source)}</span>
                      <span className="ml-2 shrink-0 text-muted-foreground">
                        {row.count}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>

      {/* Quick actions */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Quick actions</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button asChild variant="outline" className="h-auto justify-start py-3">
            <Link href="/leads/new" className="flex flex-col items-start">
              <UserPlus className="h-5 w-5 text-primary" />
              <span className="mt-1.5 text-sm font-medium">Add lead</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto justify-start py-3">
            <Link href="/properties/new" className="flex flex-col items-start">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="mt-1.5 text-sm font-medium">Add property</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto justify-start py-3">
            <Link href="/attendance" className="flex flex-col items-start">
              <CalendarDays className="h-5 w-5 text-primary" />
              <span className="mt-1.5 text-sm font-medium">Attendance</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto justify-start py-3">
            <Link href="/followups" className="flex flex-col items-start">
              <Bell className="h-5 w-5 text-primary" />
              <span className="mt-1.5 text-sm font-medium">Follow-ups</span>
            </Link>
          </Button>
        </div>
      </section>

      {/* Recent activity */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Recent activity</h2>
          <Link href="/leads" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
        {activity.length === 0 ? (
          <EmptyState
            title="Nothing yet"
            description="As leads, calls, and shares happen, you'll see them here."
          />
        ) : (
          <div className="rounded-xl border bg-card p-1.5">
            {(activity as unknown as ActivityRow[]).map((a) => (
              <ActivityItem key={a.id} a={a} />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
