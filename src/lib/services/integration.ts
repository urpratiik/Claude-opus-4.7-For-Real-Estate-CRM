import { createAdminClient } from "@/lib/supabase/admin";
import type { IntegrationSettings, ServiceMode } from "@/lib/types";

/**
 * Returns per-organization integration settings, falling back to environment
 * variables so the app works out of the box in development.
 *
 * Resolution order:
 *   1. Row in `integration_settings` for the org (admin-controlled)
 *   2. Process env vars (TWILIO_*, RESEND_API_KEY, ...)
 */
export async function getIntegrationContext(organizationId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("integration_settings")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const settings = (data ?? null) as IntegrationSettings | null;

  const mode: ServiceMode = (settings?.service_mode as ServiceMode | null) ??
    (process.env.SERVICE_MODE === "production" ? "production" : "dry-run");

  return {
    mode,
    twilio: {
      accountSid: settings?.twilio_account_sid ?? process.env.TWILIO_ACCOUNT_SID ?? null,
      authToken: settings?.twilio_auth_token ?? process.env.TWILIO_AUTH_TOKEN ?? null,
      phoneNumber: settings?.twilio_phone_number ?? process.env.TWILIO_PHONE_NUMBER ?? null,
      whatsappFrom: settings?.whatsapp_from ?? process.env.TWILIO_WHATSAPP_FROM ?? null,
    },
    email: {
      resendApiKey: settings?.resend_api_key ?? process.env.RESEND_API_KEY ?? null,
      from: settings?.email_from ?? process.env.EMAIL_FROM ?? "EstateFlow <noreply@estateflow.app>",
      smtp: settings
        ? {
            host: settings.smtp_host,
            port: settings.smtp_port,
            user: settings.smtp_user,
            pass: settings.smtp_pass,
          }
        : null,
    },
    ai: {
      apiKey: settings?.openai_api_key ?? process.env.OPENAI_API_KEY ?? null,
      baseUrl:
        settings?.openai_base_url ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
      model: settings?.openai_model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    },
    webhookSecret:
      settings?.webhook_secret ?? process.env.LEAD_WEBHOOK_SECRET ?? null,
    socialPublishWebhook: settings?.social_publish_webhook ?? null,
    assignmentMode:
      settings?.assignment_mode ??
      (process.env.LEAD_ASSIGNMENT_MODE as IntegrationSettings["assignment_mode"]) ??
      "round_robin",
  };
}

export type IntegrationContext = Awaited<ReturnType<typeof getIntegrationContext>>;

export function isDryRun(ctx: IntegrationContext): boolean {
  return ctx.mode !== "production";
}

export function publicBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
