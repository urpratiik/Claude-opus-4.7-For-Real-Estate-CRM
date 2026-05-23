import { createAdminClient } from "@/lib/supabase/admin";
import type { MessageChannel } from "@/lib/types";
import { getIntegrationContext, isDryRun } from "./integration";

/**
 * messageService — WhatsApp / SMS via Twilio.
 *
 * For WhatsApp: requires a Twilio WhatsApp sender (sandbox or business approved).
 * For SMS: any Twilio number works.
 *
 * Templates with `{{var}}` placeholders are rendered before sending.
 */

export interface SendMessageParams {
  organizationId: string;
  leadId?: string | null;
  senderId?: string | null;
  channel: MessageChannel;
  to: string; // E.164 phone for whatsapp/sms; email for email channel
  body: string;
  templateName?: string | null;
  metadata?: Record<string, unknown>;
}

export interface SendMessageResult {
  messageId: string;
  isDryRun: boolean;
  providerId?: string;
}

export async function sendMessage(p: SendMessageParams): Promise<SendMessageResult> {
  const admin = createAdminClient();
  const ctx = await getIntegrationContext(p.organizationId);

  if (p.channel === "email") {
    throw new Error("Use emailService for email channel.");
  }

  // 1. Persist message row first so timeline shows it even if provider fails
  const { data: msg, error } = await admin
    .from("messages")
    .insert({
      organization_id: p.organizationId,
      lead_id: p.leadId ?? null,
      sender_id: p.senderId ?? null,
      channel: p.channel,
      direction: "outbound",
      to_address: p.to,
      from_address:
        p.channel === "whatsapp" ? ctx.twilio.whatsappFrom : ctx.twilio.phoneNumber,
      body: p.body,
      template_name: p.templateName ?? null,
      status: "queued",
      is_dry_run: isDryRun(ctx),
      metadata: p.metadata ?? {},
    })
    .select()
    .single();

  if (error || !msg) {
    throw new Error(`messageService: failed to log message: ${error?.message}`);
  }

  // Activity
  if (p.leadId) {
    await admin.from("activities").insert({
      organization_id: p.organizationId,
      actor_id: p.senderId ?? null,
      type: "message_sent",
      lead_id: p.leadId,
      message_id: msg.id,
      payload: { channel: p.channel, template: p.templateName ?? null },
    });
    await admin
      .from("leads")
      .update({ last_contacted_at: new Date().toISOString() })
      .eq("id", p.leadId);
  }

  // ---------- DRY RUN ----------------------------------------------------
  if (
    isDryRun(ctx) ||
    !ctx.twilio.accountSid ||
    !ctx.twilio.authToken ||
    (p.channel === "whatsapp" ? !ctx.twilio.whatsappFrom : !ctx.twilio.phoneNumber)
  ) {
    await admin
      .from("messages")
      .update({
        status: "delivered",
        provider_id: `dry_${msg.id}`,
      })
      .eq("id", msg.id);
    return { messageId: msg.id, isDryRun: true };
  }

  // ---------- PRODUCTION -------------------------------------------------
  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(ctx.twilio.accountSid!, ctx.twilio.authToken!);

    const result = await client.messages.create({
      from:
        p.channel === "whatsapp" ? ctx.twilio.whatsappFrom! : ctx.twilio.phoneNumber!,
      to: p.channel === "whatsapp" ? `whatsapp:${p.to}` : p.to,
      body: p.body,
    });

    await admin
      .from("messages")
      .update({ status: "sent", provider_id: result.sid })
      .eq("id", msg.id);

    return { messageId: msg.id, isDryRun: false, providerId: result.sid };
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : "Unknown Twilio error";
    await admin
      .from("messages")
      .update({ status: "failed", metadata: { ...(p.metadata ?? {}), error: errMessage } })
      .eq("id", msg.id);
    throw err;
  }
}

/** Render a `{{var}}` template with the provided variable map. */
export function renderTemplate(
  template: string,
  vars: Record<string, string | number | null | undefined>,
): string {
  return template.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_, k: string) => {
    const v = vars[k];
    return v == null ? "" : String(v);
  });
}
