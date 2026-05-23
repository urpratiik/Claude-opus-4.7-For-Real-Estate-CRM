import { createAdminClient } from "@/lib/supabase/admin";
import { getIntegrationContext, isDryRun } from "./integration";
import type { SocialPost } from "@/lib/types";

/**
 * socialPostService — manage drafts, schedules, and optionally forward
 * approved posts to a Buffer/Zapier/Make/SocialPilot webhook.
 *
 * The MVP does not natively publish to social platforms; instead any approved
 * post can be POSTed to `social_publish_webhook` for downstream automation.
 */
export async function publishPostViaWebhook(post: SocialPost) {
  const admin = createAdminClient();
  const ctx = await getIntegrationContext(post.organization_id);

  if (isDryRun(ctx) || !ctx.socialPublishWebhook) {
    await admin
      .from("social_posts")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", post.id);
    return { isDryRun: true };
  }

  const res = await fetch(ctx.socialPublishWebhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: post.id,
      platform: post.platform,
      caption: post.caption,
      media_paths: post.media_paths,
      scheduled_at: post.scheduled_at,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    await admin
      .from("social_posts")
      .update({ status: "failed", notes: `Webhook ${res.status}: ${errBody}` })
      .eq("id", post.id);
    throw new Error(`Social publish webhook failed: ${res.status}`);
  }

  await admin
    .from("social_posts")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", post.id);
  return { isDryRun: false };
}
