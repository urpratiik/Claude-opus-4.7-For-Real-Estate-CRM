import { requireProfile } from "@/lib/auth";
import { listAgentsForOrg } from "@/lib/db/leads";
import { PageShell, PageHeader } from "@/components/layout/page-shell";
import { LeadCreateForm } from "./lead-create-form";

export const metadata = { title: "New lead" };

export default async function NewLeadPage() {
  const profile = await requireProfile();
  const agents = await listAgentsForOrg(profile.organization_id);

  return (
    <PageShell>
      <PageHeader title="Add a new lead" subtitle="Manually create a lead. It will be auto-assigned if you don't pick an agent." />
      <LeadCreateForm agents={agents} />
    </PageShell>
  );
}
