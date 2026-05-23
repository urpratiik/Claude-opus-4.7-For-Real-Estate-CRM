import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { listLeads, listAgentsForOrg, type LeadFilters } from "@/lib/db/leads";
import { PageShell, PageHeader } from "@/components/layout/page-shell";
import { LeadCard } from "@/components/leads/lead-card";
import { LeadFilters as LeadFiltersUI } from "@/components/leads/lead-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { FAB } from "@/components/layout/fab";

export const metadata = { title: "Leads" };

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Partial<Record<string, string>>>;
}) {
  const profile = await requireProfile();
  const params = await searchParams;
  const filters: LeadFilters = {
    q: params.q,
    status: (params.status as LeadFilters["status"]) ?? "all",
    source: (params.source as LeadFilters["source"]) ?? "all",
    temperature: (params.temperature as LeadFilters["temperature"]) ?? "all",
    agentId: params.agentId ?? "all",
    scope: (params.scope as LeadFilters["scope"]) ?? "all",
  };

  const [leads, agents] = await Promise.all([
    listLeads(filters, profile.id),
    listAgentsForOrg(profile.organization_id),
  ]);

  return (
    <PageShell>
      <PageHeader
        title="Leads"
        subtitle={`${leads.length} ${leads.length === 1 ? "lead" : "leads"} matching your filters`}
        action={
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/leads/new">
              <Plus className="h-4 w-4" /> Add lead
            </Link>
          </Button>
        }
      />

      <LeadFiltersUI agents={agents} />

      <div className="mt-3 space-y-2">
        {leads.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="No leads yet"
            description="Add a lead manually or wire up your lead sources to the webhook."
            action={
              <Button asChild>
                <Link href="/leads/new">Add your first lead</Link>
              </Button>
            }
          />
        ) : (
          leads.map((l) => <LeadCard key={l.id} lead={l} />)
        )}
      </div>

      <FAB href="/leads/new" label="New lead" icon={<Plus className="h-5 w-5" />} />
    </PageShell>
  );
}
