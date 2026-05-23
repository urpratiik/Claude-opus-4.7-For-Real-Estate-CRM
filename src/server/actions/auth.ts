"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginSchema, signupSchema, inviteSchema } from "@/lib/validation/schemas";

export type ActionResult = { ok: true } | { ok: false; error: string };

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: "Invalid email or password format." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: error.message };

  const next = (formData.get("next") as string) || "/dashboard";
  redirect(next);
}

export async function signupAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = signupSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    organization_name: formData.get("organization_name"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { full_name, email, password, organization_name } = parsed.data;

  const supabase = await createClient();
  const admin = createAdminClient();

  // 1. Create the auth user via admin API so we can mark the email as confirmed
  //    in dev. In production you may prefer the regular signUp flow.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (createErr || !created.user) {
    return { ok: false, error: createErr?.message ?? "Could not create user" };
  }

  // 2. Create organization + admin profile + integration_settings
  const slug =
    slugify(organization_name) + "-" + Math.random().toString(36).slice(2, 6);

  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({ name: organization_name, slug })
    .select()
    .single();
  if (orgErr || !org) {
    return { ok: false, error: `Org creation failed: ${orgErr?.message}` };
  }

  const { error: profileErr } = await admin.from("profiles").insert({
    id: created.user.id,
    organization_id: org.id,
    full_name,
    email,
    role: "admin",
  });
  if (profileErr) {
    return { ok: false, error: `Profile creation failed: ${profileErr.message}` };
  }

  await admin.from("integration_settings").insert({
    organization_id: org.id,
    assignment_mode: "round_robin",
    service_mode: process.env.SERVICE_MODE === "production" ? "production" : "dry-run",
  });

  // 3. Sign the user in
  const { error: signinErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signinErr) return { ok: false, error: signinErr.message };

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Admin-only: invite a new team member by creating their auth user + profile. */
export async function inviteMemberAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: me } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!me || (me.role !== "admin" && me.role !== "sales_manager")) {
    return { ok: false, error: "Only admins or managers can invite team members." };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    full_name: formData.get("full_name"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createAdminClient();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name },
  });
  if (createErr || !created.user) {
    return { ok: false, error: createErr?.message ?? "Could not create user" };
  }

  const { error: profileErr } = await admin.from("profiles").insert({
    id: created.user.id,
    organization_id: me.organization_id,
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    role: parsed.data.role,
  });
  if (profileErr) return { ok: false, error: profileErr.message };

  revalidatePath("/team");
  return { ok: true };
}
