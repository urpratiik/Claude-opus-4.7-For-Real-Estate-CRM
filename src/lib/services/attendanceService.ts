import { createAdminClient } from "@/lib/supabase/admin";
import type { AttendanceRecord } from "@/lib/types";

const LATE_AFTER_HOUR = 10; // 10:00 AM org-local

export interface CheckInParams {
  organizationId: string;
  userId: string;
  latitude?: number | null;
  longitude?: number | null;
  selfiePath?: string | null;
  notes?: string | null;
}

export async function checkIn(p: CheckInParams): Promise<AttendanceRecord> {
  const admin = createAdminClient();

  // Disallow if there's an open record already
  const { data: open } = await admin
    .from("attendance")
    .select("*")
    .eq("user_id", p.userId)
    .is("check_out_time", null)
    .maybeSingle();
  if (open) {
    throw new Error("You're already checked in. Please check out first.");
  }

  const now = new Date();
  const hour = now.getHours();
  const status = hour >= LATE_AFTER_HOUR ? "late" : "present";

  const { data, error } = await admin
    .from("attendance")
    .insert({
      organization_id: p.organizationId,
      user_id: p.userId,
      check_in_time: now.toISOString(),
      check_in_latitude: p.latitude ?? null,
      check_in_longitude: p.longitude ?? null,
      check_in_selfie_url: p.selfiePath ?? null,
      notes: p.notes ?? null,
      status,
    })
    .select()
    .single();

  if (error || !data) throw new Error(`Check-in failed: ${error?.message}`);

  await admin.from("activities").insert({
    organization_id: p.organizationId,
    actor_id: p.userId,
    type: "attendance_check_in",
    payload: { lat: p.latitude, lng: p.longitude, status },
  });

  return data as AttendanceRecord;
}

export async function checkOut(
  organizationId: string,
  userId: string,
  opts: { latitude?: number | null; longitude?: number | null; selfiePath?: string | null; notes?: string | null } = {},
) {
  const admin = createAdminClient();

  const { data: open } = await admin
    .from("attendance")
    .select("*")
    .eq("user_id", userId)
    .is("check_out_time", null)
    .maybeSingle();

  if (!open) throw new Error("No open check-in found.");

  const { data, error } = await admin
    .from("attendance")
    .update({
      check_out_time: new Date().toISOString(),
      check_out_latitude: opts.latitude ?? null,
      check_out_longitude: opts.longitude ?? null,
      check_out_selfie_url: opts.selfiePath ?? null,
      notes: opts.notes ?? open.notes,
    })
    .eq("id", open.id)
    .select()
    .single();

  if (error || !data) throw new Error(`Check-out failed: ${error?.message}`);

  await admin.from("activities").insert({
    organization_id: organizationId,
    actor_id: userId,
    type: "attendance_check_out",
    payload: { lat: opts.latitude, lng: opts.longitude },
  });

  return data as AttendanceRecord;
}

export async function getOpenAttendance(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("attendance")
    .select("*")
    .eq("user_id", userId)
    .is("check_out_time", null)
    .maybeSingle();
  return (data as AttendanceRecord | null) ?? null;
}
