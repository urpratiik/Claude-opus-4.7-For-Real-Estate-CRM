import { createAdminClient } from "@/lib/supabase/admin";
import type { MessageChannel } from "@/lib/types";
import { sendMessage, renderTemplate } from "./messageService";
import { sendEmail } from "./emailService";
import { publicBaseUrl } from "./integration";
import { formatINR } from "@/lib/utils";

/**
 * propertyShareService — one-click property share.
 *
 * Composes a templated message that includes a public share link
 * (https://APP/share/<slug>) and dispatches via WhatsApp / SMS / email.
 * Logs the share in `lead_property_shares` and the lead timeline.
 */
export interface SharePropertyParams {
  organizationId: string;
  leadId: string;
  propertyId: string;
  sharedBy: string;
  channel: MessageChannel;
  /** Override the default template body. */
  customBody?: string;
}

export async function shareProperty(p: SharePropertyParams) {
  const admin = createAdminClient();

  const [{ data: lead }, { data: property }] = await Promise.all([
    admin
      .from("leads")
      .select("id, full_name, phone, email, preferred_location")
      .eq("id", p.leadId)
      .maybeSingle(),
    admin
      .from("properties")
      .select("id, title, location, price, share_slug")
      .eq("id", p.propertyId)
      .maybeSingle(),
  ]);

  if (!lead) throw new Error("Lead not found");
  if (!property) throw new Error("Property not found");

  const shareLink = `${publicBaseUrl()}/share/${property.share_slug}`;
  const tpl =
    p.customBody ??
    "Hi {{leadName}}, sharing details of {{propertyTitle}} in {{location}}. Price: {{price}}. Photos and details: {{shareLink}}";

  const body = renderTemplate(tpl, {
    leadName: lead.full_name,
    propertyTitle: property.title,
    location: property.location,
    price: formatINR(property.price ?? null),
    shareLink,
  });

  let messageId: string | undefined;

  if (p.channel === "email") {
    if (!lead.email) throw new Error("Lead has no email on file.");
    const result = await sendEmail({
      organizationId: p.organizationId,
      leadId: p.leadId,
      senderId: p.sharedBy,
      to: lead.email,
      subject: `Property: ${property.title}`,
      html: `<p>${escapeHtml(body).replace(/\n/g, "<br/>")}</p>
             <p><a href="${shareLink}">View property &rarr;</a></p>`,
      text: body,
      templateName: "property_share",
    });
    messageId = result.messageId;
  } else {
    if (!lead.phone) throw new Error("Lead has no phone on file.");
    const result = await sendMessage({
      organizationId: p.organizationId,
      leadId: p.leadId,
      senderId: p.sharedBy,
      channel: p.channel,
      to: lead.phone,
      body,
      templateName: "property_share",
    });
    messageId = result.messageId;
  }

  // Persist the share record
  const { data: share } = await admin
    .from("lead_property_shares")
    .insert({
      organization_id: p.organizationId,
      lead_id: p.leadId,
      property_id: p.propertyId,
      shared_by: p.sharedBy,
      channel: p.channel,
      message_id: messageId,
      share_link: shareLink,
      template_name: "property_share",
    })
    .select()
    .single();

  await admin.from("activities").insert({
    organization_id: p.organizationId,
    actor_id: p.sharedBy,
    type: "property_shared",
    lead_id: p.leadId,
    property_id: p.propertyId,
    message_id: messageId,
    payload: { channel: p.channel, share_link: shareLink },
  });

  return { shareId: share?.id, shareLink, messageId };
}

/** Suggest properties for a lead based on budget / type / location. */
export async function recommendPropertiesForLead(leadId: string, limit = 5) {
  const admin = createAdminClient();
  const { data: lead } = await admin
    .from("leads")
    .select("organization_id, property_type, budget_min, budget_max, preferred_location")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return [];

  let q = admin
    .from("properties")
    .select("*")
    .eq("organization_id", lead.organization_id)
    .eq("status", "available")
    .limit(limit);

  if (lead.property_type) q = q.eq("property_type", lead.property_type);
  if (lead.budget_max) q = q.lte("price", lead.budget_max);
  if (lead.budget_min) q = q.gte("price", lead.budget_min);
  if (lead.preferred_location) q = q.ilike("location", `%${lead.preferred_location}%`);

  const { data } = await q;
  return data ?? [];
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
