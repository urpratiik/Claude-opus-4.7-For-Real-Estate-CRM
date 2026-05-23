import { createAdminClient } from "@/lib/supabase/admin";

export interface CreateNotificationParams {
  organizationId: string;
  userId: string;
  title: string;
  body?: string;
  type: string;
  link?: string;
}

export async function createNotification(p: CreateNotificationParams) {
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    organization_id: p.organizationId,
    user_id: p.userId,
    title: p.title,
    body: p.body ?? null,
    type: p.type,
    link: p.link ?? null,
  });
}
