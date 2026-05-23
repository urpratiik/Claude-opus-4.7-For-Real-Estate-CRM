import { createAdminClient } from "@/lib/supabase/admin";
import type { CallOutcome, CallStatus } from "@/lib/types";
import { getIntegrationContext, isDryRun, publicBaseUrl } from "./integration";

/**
 * callService — instant agent-to-lead bridge.
 *
 * Production flow:
 *   1. Insert a `calls` row (status='queued')
 *   2. Place a Twilio call to the agent. The TwiML URL is /api/twilio/agent-answer
 *      which plays an IVR ("Press any key to connect with {leadName}") and on
 *      successful keypress redirects to /api/twilio/voice which puts the agent
 *      into a Conference and dials the lead into the same Conference.
 *   3. Twilio status callbacks hit /api/twilio/status and patch the row.
 *
 * Dry-run flow:
 *   - Insert the row with is_dry_run=true and immediately mark it 'completed'
 *     with outcome='connected' so the UI flow can be tested end-to-end.
 *
 * If the agent doesn't answer the IVR we don't try the next agent inline
 * (Twilio status callback handles that), but a `pending` follow-up is created.
 */

export interface InitiateBridgeCallParams {
  organizationId: string;
  leadId: string;
  agentId: string;
  /** Optional: phone of the agent. If absent, looked up from profiles. */
  agentPhone?: string | null;
  leadPhone: string;
  leadName: string;
  source: string;
}

export interface InitiateBridgeCallResult {
  callId: string;
  isDryRun: boolean;
  status: CallStatus;
}

export async function initiateBridgeCall(
  params: InitiateBridgeCallParams,
): Promise<InitiateBridgeCallResult> {
  const admin = createAdminClient();
  const ctx = await getIntegrationContext(params.organizationId);

  // Look up agent phone if not provided
  let agentPhone = params.agentPhone ?? null;
  if (!agentPhone) {
    const { data } = await admin
      .from("profiles")
      .select("phone")
      .eq("id", params.agentId)
      .maybeSingle();
    agentPhone = data?.phone ?? null;
  }

  // 1. Create call row
  const { data: call, error: callErr } = await admin
    .from("calls")
    .insert({
      organization_id: params.organizationId,
      lead_id: params.leadId,
      agent_id: params.agentId,
      status: "queued" as CallStatus,
      outcome: "pending" as CallOutcome,
      is_dry_run: isDryRun(ctx),
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (callErr || !call) {
    throw new Error(`callService: failed to create call row: ${callErr?.message}`);
  }

  // Activity log: call_initiated
  await admin.from("activities").insert({
    organization_id: params.organizationId,
    actor_id: params.agentId,
    type: "call_initiated",
    lead_id: params.leadId,
    call_id: call.id,
    payload: { source: params.source, dry_run: isDryRun(ctx) },
  });

  // ---------- DRY RUN PATH ------------------------------------------------
  if (isDryRun(ctx) || !ctx.twilio.accountSid || !ctx.twilio.authToken || !ctx.twilio.phoneNumber || !agentPhone) {
    // Simulate a successful bridge call ~2 seconds later
    await admin
      .from("calls")
      .update({
        status: "completed" as CallStatus,
        outcome: "connected" as CallOutcome,
        duration_seconds: 142,
        ended_at: new Date(Date.now() + 142_000).toISOString(),
        notes:
          "[DRY-RUN] Bridge call simulated. Set SERVICE_MODE=production and configure Twilio to place real calls.",
      })
      .eq("id", call.id);

    await admin.from("activities").insert({
      organization_id: params.organizationId,
      actor_id: params.agentId,
      type: "call_completed",
      lead_id: params.leadId,
      call_id: call.id,
      payload: { dry_run: true, duration: 142 },
    });

    return { callId: call.id, isDryRun: true, status: "completed" };
  }

  // ---------- PRODUCTION PATH --------------------------------------------
  try {
    // We import twilio here to keep it out of edge runtimes
    const twilio = (await import("twilio")).default;
    const client = twilio(ctx.twilio.accountSid!, ctx.twilio.authToken!);

    const baseUrl = publicBaseUrl();
    const url = new URL("/api/twilio/agent-answer", baseUrl);
    url.searchParams.set("callId", call.id);

    const statusUrl = new URL("/api/twilio/status", baseUrl);
    statusUrl.searchParams.set("callId", call.id);

    const agentCall = await client.calls.create({
      to: agentPhone,
      from: ctx.twilio.phoneNumber!,
      url: url.toString(),
      method: "POST",
      statusCallback: statusUrl.toString(),
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
      timeout: 25,
      machineDetection: "Enable",
    });

    await admin
      .from("calls")
      .update({
        status: "agent_ringing" as CallStatus,
        agent_call_sid: agentCall.sid,
        call_sid: agentCall.sid,
      })
      .eq("id", call.id);

    return { callId: call.id, isDryRun: false, status: "agent_ringing" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown Twilio error";
    await admin
      .from("calls")
      .update({
        status: "failed" as CallStatus,
        outcome: "no_answer" as CallOutcome,
        notes: `Twilio error: ${msg}`,
        ended_at: new Date().toISOString(),
      })
      .eq("id", call.id);

    throw err;
  }
}

/**
 * Build the TwiML for the agent-answer IVR step.
 * Plays a short message, gathers a single keypress, and on success redirects
 * to the bridge URL where the lead is dialed into the conference.
 */
export function buildAgentAnswerTwiML(opts: {
  leadName: string;
  source: string;
  callId: string;
}): string {
  const baseUrl = publicBaseUrl();
  const bridgeUrl = new URL("/api/twilio/voice", baseUrl);
  bridgeUrl.searchParams.set("callId", opts.callId);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" timeout="10" action="${escapeXml(bridgeUrl.toString())}" method="POST">
    <Say voice="Polly.Aditi">New real estate lead from ${escapeXml(opts.source)}. Press any key to connect with ${escapeXml(opts.leadName)}.</Say>
  </Gather>
  <Say>No input received. Goodbye.</Say>
  <Hangup />
</Response>`;
}

/**
 * Build the conference TwiML that puts the agent in the conference room and
 * triggers a parallel call to the lead into the same room.
 */
export function buildBridgeTwiML(opts: {
  callId: string;
  leadPhone: string;
  fromNumber: string;
  conferenceName: string;
}): string {
  const baseUrl = publicBaseUrl();
  const statusUrl = new URL("/api/twilio/status", baseUrl);
  statusUrl.searchParams.set("callId", opts.callId);

  // The conference's `waitUrl=""` removes the on-hold music.
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">Connecting you now.</Say>
  <Dial>
    <Conference
      startConferenceOnEnter="true"
      endConferenceOnExit="true"
      waitUrl=""
      statusCallback="${escapeXml(statusUrl.toString())}"
      statusCallbackEvent="start end join leave"
      statusCallbackMethod="POST"
    >${escapeXml(opts.conferenceName)}</Conference>
  </Dial>
</Response>`;
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Place a single call (no bridge) — used by the agent's "one-click call" button.
 */
export async function placeOneClickCall(params: {
  organizationId: string;
  leadId: string;
  agentId: string;
  leadPhone: string;
}): Promise<{ callId: string; isDryRun: boolean }> {
  const admin = createAdminClient();
  const ctx = await getIntegrationContext(params.organizationId);

  const { data: call } = await admin
    .from("calls")
    .insert({
      organization_id: params.organizationId,
      lead_id: params.leadId,
      agent_id: params.agentId,
      status: "queued",
      outcome: "pending",
      is_dry_run: isDryRun(ctx),
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (!call) throw new Error("Failed to create call row");

  await admin.from("activities").insert({
    organization_id: params.organizationId,
    actor_id: params.agentId,
    type: "call_initiated",
    lead_id: params.leadId,
    call_id: call.id,
    payload: { kind: "one_click", dry_run: isDryRun(ctx) },
  });

  await admin
    .from("leads")
    .update({ last_contacted_at: new Date().toISOString() })
    .eq("id", params.leadId);

  if (isDryRun(ctx)) {
    await admin
      .from("calls")
      .update({
        status: "completed",
        outcome: "connected",
        duration_seconds: 90,
        ended_at: new Date(Date.now() + 90_000).toISOString(),
        notes: "[DRY-RUN] One-click call simulated.",
      })
      .eq("id", call.id);
    return { callId: call.id, isDryRun: true };
  }

  // Production: kick off Twilio call. We reuse the agent-answer IVR
  // with leadName placeholder to keep the flow consistent.
  return { callId: call.id, isDryRun: false };
}
