"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import { leadFormSchema, followupFormSchema } from "@/lib/validation/schemas";
import { initiateBridgeCall, placeOneClickCall } from "@/lib/services/callService";
import { sendMessage, renderTemplate } from "@/lib/services/messageService";
import { sendEmail } from "@/lib/services/emailService";
import { shareProperty as svcShareProperty } from "@/lib/services/propertyShareService";
import { pickNextAgent, markAgentAssigned } from "@/lib/services/leadAssignmentService";
import { createNotification } from "@/lib/services/notificationService";
import type { LeadStatus, LeadTemperature, MessageChannel, FollowupType } from "@/lib/types";

export type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

// ---- Create lead manually ------------------------------------------------
export async function createLeadAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const profile = await requireProfile();

  const parsed = leadFormSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    email: (formData.get("email") as string) || "",
    source: formData.get("source") || "manual",
    property_type: (formData.get("property_type") as string) || undefined,
    budget_min: formData.get("budget_min") || undefined,
    budget_max: formData.get("budget_max") || undefined,
    preferred_location: (formData.get("preferred_location") as string) || "",
    notes: (formData.get("notes") as string) || "",
    temperature: (formData.get("temperature") as string) || "warm",
    assigned_agent_id: (formData.get("assigned_agent_id") as string) || null,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  // If no agent specified, auto-assign
  let agentId = parsed.data.assigned_agent_id ?? null;
  if (!agentId) {
    const agent = await pickNextAgent(profile.organization_id);
    agentId = agent?.id ?? null;
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      organization_id: profile.organization_id,
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      source: parsed.data.source,
      property_type: parsed.data.property_type ?? null,
      budget_min: parsed.data.budget_min ?? null,
      budget_max: parsed.data.budget_max ?? null,
      preferred_location: parsed.data.preferred_location || null,
      temperature: parsed.data.temperature ?? "warm",
      assigned_agent_id: agentId,
      notes: parsed.data.notes || null,
      status: "new",
    })
    .select()
    .single();

  if (error || !lead) return { ok: false, error: error?.message ?? "Insert failed" };

  // Activity + notification
  await admin.from("activities").insert({
    organization_id: profile.organization_id,
    actor_id: profile.id,
    type: "lead_created",
    lead_id: lead.id,
    payload: { source: lead.source, manual: true },
  });

  if (agentId) {
    await markAgentAssigned(agentId);
    await admin.from("activities").insert({
      organization_id: profile.organization_id,
      actor_id: profile.id,
      type: "lead_assigned",
      lead_id: lead.id,
      payload: { agent_id: agentId },
    });
    await createNotification({
      organizationId: profile.organization_id,
      userId: agentId,
      title: "New lead assigned",
      body: `${lead.full_name} (${lead.source})`,
      type: "lead_assigned",
      link: `/leads/${lead.id}`,
    });
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  redirect(`/leads/${lead.id}`);
}

// ---- Update lead --------------------------------------------------------
export async function updateLeadAction(
  leadId: string,
  patch: Partial<{
    status: LeadStatus;
    temperature: LeadTemperature;
    assigned_agent_id: string | null;
    notes: string;
    next_followup_at: string | null;
  }>,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: existing } = await supabase
    .from("leads")
    .select("status, temperature, assigned_agent_id")
    .eq("id", leadId)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Lead not found" };

  const { error } = await supabase.from("leads").update(patch).eq("id", leadId);
  if (error) return { ok: false, error: error.message };

  // Activity logging on key changes
  if (patch.status && patch.status !== existing.status) {
    await admin.from("activities").insert({
      organization_id: profile.organization_id,
      actor_id: profile.id,
      type: "lead_status_changed",
      lead_id: leadId,
      payload: { from: existing.status, to: patch.status },
    });
  }
  if (patch.temperature && patch.temperature !== existing.temperature) {
    await admin.from("activities").insert({
      organization_id: profile.organization_id,
      actor_id: profile.id,
      type: "lead_temperature_changed",
      lead_id: leadId,
      payload: { from: existing.temperature, to: patch.temperature },
    });
  }
  if (
    patch.assigned_agent_id !== undefined &&
    patch.assigned_agent_id !== existing.assigned_agent_id
  ) {
    await admin.from("activities").insert({
      organization_id: profile.organization_id,
      actor_id: profile.id,
      type: "lead_assigned",
      lead_id: leadId,
      payload: { agent_id: patch.assigned_agent_id },
    });
    if (patch.assigned_agent_id) {
      await markAgentAssigned(patch.assigned_agent_id);
      await createNotification({
        organizationId: profile.organization_id,
        userId: patch.assigned_agent_id,
        title: "New lead assigned",
        body: `Lead reassigned by ${profile.full_name}`,
        type: "lead_assigned",
        link: `/leads/${leadId}`,
      });
    }
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { ok: true };
}

// ---- Add note -----------------------------------------------------------
export async function addLeadNoteAction(
  leadId: string,
  note: string,
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!note.trim()) return { ok: false, error: "Note cannot be empty" };

  const supabase = await createClient();
  const admin = createAdminClient();

  // Append to lead.notes
  const { data: lead } = await supabase
    .from("leads")
    .select("notes")
    .eq("id", leadId)
    .maybeSingle();
  const stamp = new Date().toLocaleString();
  const block = `\n\n[${stamp} · ${profile.full_name}]\n${note.trim()}`;
  await supabase
    .from("leads")
    .update({ notes: ((lead?.notes ?? "") + block).trim() })
    .eq("id", leadId);

  await admin.from("activities").insert({
    organization_id: profile.organization_id,
    actor_id: profile.id,
    type: "note_added",
    lead_id: leadId,
    payload: { preview: note.trim().slice(0, 140) },
  });

  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

// ---- One-click call -----------------------------------------------------
export async function oneClickCallAction(leadId: string): Promise<ActionResult> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("organization_id, phone, full_name")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return { ok: false, error: "Lead not found" };

  await placeOneClickCall({
    organizationId: lead.organization_id,
    leadId,
    agentId: profile.id,
    leadPhone: lead.phone,
  });

  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

// ---- Trigger bridge call (admin/manager) -------------------------------
export async function triggerBridgeCallAction(leadId: string): Promise<ActionResult> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("organization_id, phone, full_name, source, assigned_agent_id")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return { ok: false, error: "Lead not found" };

  let agentId = lead.assigned_agent_id;
  if (!agentId) {
    const agent = await pickNextAgent(lead.organization_id);
    agentId = agent?.id ?? null;
    if (!agentId) return { ok: false, error: "No active agent available." };
    await supabase.from("leads").update({ assigned_agent_id: agentId }).eq("id", leadId);
  }

  await initiateBridgeCall({
    organizationId: lead.organization_id,
    leadId,
    agentId,
    leadName: lead.full_name,
    leadPhone: lead.phone,
    source: lead.source,
  });

  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

// ---- One-click message (WA / SMS) --------------------------------------
export async function sendQuickMessageAction(
  leadId: string,
  channel: MessageChannel,
  body: string,
  templateName?: string,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("organization_id, phone, email, full_name, preferred_location")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return { ok: false, error: "Lead not found" };

  const rendered = renderTemplate(body, {
    leadName: lead.full_name,
    preferredLocation: lead.preferred_location ?? "",
  });

  if (channel === "email") {
    if (!lead.email) return { ok: false, error: "Lead has no email." };
    await sendEmail({
      organizationId: lead.organization_id,
      leadId,
      senderId: profile.id,
      to: lead.email,
      subject: "Following up",
      text: rendered,
      html: `<p>${rendered.replace(/\n/g, "<br/>")}</p>`,
      templateName: templateName ?? null,
    });
  } else {
    await sendMessage({
      organizationId: lead.organization_id,
      leadId,
      senderId: profile.id,
      channel,
      to: lead.phone,
      body: rendered,
      templateName: templateName ?? null,
    });
  }

  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}

// ---- Schedule follow-up -------------------------------------------------
export async function scheduleFollowupAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = followupFormSchema.safeParse({
    lead_id: formData.get("lead_id"),
    type: formData.get("type"),
    due_at: formData.get("due_at"),
    template_name: (formData.get("template_name") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("assigned_agent_id, full_name")
    .eq("id", parsed.data.lead_id)
    .maybeSingle();
  if (!lead) return { ok: false, error: "Lead not found" };

  const { data: fu, error } = await supabase
    .from("followups")
    .insert({
      organization_id: profile.organization_id,
      lead_id: parsed.data.lead_id,
      assigned_to: lead.assigned_agent_id ?? profile.id,
      type: parsed.data.type as FollowupType,
      due_at: parsed.data.due_at,
      template_name: parsed.data.template_name ?? null,
      notes: parsed.data.notes ?? null,
      created_by: profile.id,
    })
    .select()
    .single();

  if (error || !fu) return { ok: false, error: error?.message ?? "Insert failed" };

  await supabase
    .from("leads")
    .update({ next_followup_at: parsed.data.due_at })
    .eq("id", parsed.data.lead_id);

  await admin.from("activities").insert({
    organization_id: profile.organization_id,
    actor_id: profile.id,
    type: "followup_scheduled",
    lead_id: parsed.data.lead_id,
    followup_id: fu.id,
    payload: { type: parsed.data.type, due_at: parsed.data.due_at },
  });

  revalidatePath(`/leads/${parsed.data.lead_id}`);
  revalidatePath("/followups");
  return { ok: true };
}

// ---- Share property to lead --------------------------------------------
export async function sharePropertyAction(
  leadId: string,
  propertyId: string,
  channel: MessageChannel,
  customBody?: string,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("organization_id")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return { ok: false, error: "Lead not found" };

  await svcShareProperty({
    organizationId: lead.organization_id,
    leadId,
    propertyId,
    sharedBy: profile.id,
    channel,
    customBody,
  });

  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}
