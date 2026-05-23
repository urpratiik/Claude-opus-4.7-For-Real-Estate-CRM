import { createAdminClient } from "@/lib/supabase/admin";
import { getIntegrationContext, isDryRun } from "./integration";

/**
 * emailService — Resend (preferred) or SMTP fallback.
 *
 * Uses fetch directly to keep the bundle small (no Resend SDK dependency).
 * SMTP path is left as a TODO since serverless Vercel functions need a
 * compatible SMTP library (e.g. nodemailer) configured separately.
 */

export interface SendEmailParams {
  organizationId: string;
  leadId?: string | null;
  senderId?: string | null;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  templateName?: string | null;
}

export async function sendEmail(p: SendEmailParams) {
  const admin = createAdminClient();
  const ctx = await getIntegrationContext(p.organizationId);

  // Persist message row
  const { data: msg, error } = await admin
    .from("messages")
    .insert({
      organization_id: p.organizationId,
      lead_id: p.leadId ?? null,
      sender_id: p.senderId ?? null,
      channel: "email",
      direction: "outbound",
      to_address: p.to,
      from_address: ctx.email.from,
      body: p.html ?? p.text ?? "",
      template_name: p.templateName ?? null,
      status: "queued",
      is_dry_run: isDryRun(ctx),
      metadata: { subject: p.subject },
    })
    .select()
    .single();

  if (error || !msg) {
    throw new Error(`emailService: failed to log message: ${error?.message}`);
  }

  if (p.leadId) {
    await admin.from("activities").insert({
      organization_id: p.organizationId,
      actor_id: p.senderId ?? null,
      type: "message_sent",
      lead_id: p.leadId,
      message_id: msg.id,
      payload: { channel: "email", subject: p.subject },
    });
    await admin
      .from("leads")
      .update({ last_contacted_at: new Date().toISOString() })
      .eq("id", p.leadId);
  }

  if (isDryRun(ctx) || !ctx.email.resendApiKey) {
    await admin
      .from("messages")
      .update({ status: "delivered", provider_id: `dry_${msg.id}` })
      .eq("id", msg.id);
    return { messageId: msg.id, isDryRun: true };
  }

  // Resend
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ctx.email.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: ctx.email.from,
        to: p.to,
        subject: p.subject,
        html: p.html,
        text: p.text,
      }),
    });
    const data = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) throw new Error(data.message ?? `Resend error ${res.status}`);

    await admin
      .from("messages")
      .update({ status: "sent", provider_id: data.id ?? null })
      .eq("id", msg.id);
    return { messageId: msg.id, isDryRun: false, providerId: data.id };
  } catch (err) {
    const m = err instanceof Error ? err.message : "Unknown email error";
    await admin
      .from("messages")
      .update({ status: "failed", metadata: { error: m } })
      .eq("id", msg.id);
    throw err;
  }
}
