/**
 * EstateFlow CRM - shared TypeScript types.
 * These mirror the Postgres enums and tables in supabase/migrations/0001_init.sql.
 */

export type UserRole =
  | "admin"
  | "sales_manager"
  | "sales_agent"
  | "field_executive"
  | "social_media_manager";

export type LeadSource =
  | "36_acre"
  | "magicbricks"
  | "housing"
  | "facebook"
  | "instagram"
  | "website"
  | "whatsapp"
  | "referral"
  | "manual"
  | "other";

export type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "site_visit_scheduled"
  | "negotiation"
  | "won"
  | "lost"
  | "not_responding";

export type LeadTemperature = "cold" | "warm" | "hot";

export type PropertyType = "apartment" | "villa" | "plot" | "commercial" | "rental";
export type PropertyStatus = "available" | "hold" | "sold" | "rented";

export type CallStatus =
  | "queued"
  | "agent_ringing"
  | "agent_no_answer"
  | "lead_ringing"
  | "in_progress"
  | "completed"
  | "failed"
  | "no_agent_available";

export type CallOutcome =
  | "connected"
  | "voicemail"
  | "no_answer"
  | "busy"
  | "wrong_number"
  | "callback_requested"
  | "not_interested"
  | "interested"
  | "pending";

export type MessageChannel = "whatsapp" | "sms" | "email";
export type MessageDirection = "inbound" | "outbound";
export type MessageStatus = "queued" | "sent" | "delivered" | "read" | "failed";

export type FollowupType = "call" | "whatsapp" | "sms" | "email" | "site_visit";
export type FollowupStatus = "pending" | "completed" | "snoozed" | "cancelled";

export type AttendanceStatus = "present" | "late" | "absent" | "half_day" | "on_leave";

export type SocialPlatform =
  | "instagram_post"
  | "instagram_reel"
  | "facebook_post"
  | "linkedin_post"
  | "story";
export type SocialStatus = "idea" | "draft" | "scheduled" | "published" | "failed";

export type ActivityType =
  | "lead_created"
  | "lead_assigned"
  | "lead_status_changed"
  | "lead_temperature_changed"
  | "note_added"
  | "call_initiated"
  | "call_completed"
  | "message_sent"
  | "property_shared"
  | "followup_scheduled"
  | "followup_completed"
  | "attendance_check_in"
  | "attendance_check_out"
  | "site_visit_scheduled";

export type AssignmentMode = "round_robin" | "manual" | "least_busy";
export type ServiceMode = "production" | "dry-run";

// ---- Row types ----------------------------------------------------------
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  rr_position: number;
  last_assigned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  source: LeadSource;
  source_meta: Record<string, unknown>;
  property_type: PropertyType | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_location: string | null;
  status: LeadStatus;
  temperature: LeadTemperature;
  assigned_agent_id: string | null;
  notes: string | null;
  next_followup_at: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  property_type: PropertyType;
  status: PropertyStatus;
  location: string;
  address: string | null;
  price: number | null;
  size_sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: string | null;
  furnishing: string | null;
  amenities: string[];
  developer_name: string | null;
  share_slug: string;
  internal_tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyImage {
  id: string;
  organization_id: string;
  property_id: string;
  storage_path: string;
  public_url: string | null;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface CallRecord {
  id: string;
  organization_id: string;
  lead_id: string | null;
  agent_id: string | null;
  call_sid: string | null;
  agent_call_sid: string | null;
  lead_call_sid: string | null;
  conference_sid: string | null;
  status: CallStatus;
  outcome: CallOutcome;
  duration_seconds: number;
  recording_url: string | null;
  notes: string | null;
  is_dry_run: boolean;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRecord {
  id: string;
  organization_id: string;
  lead_id: string | null;
  sender_id: string | null;
  channel: MessageChannel;
  direction: MessageDirection;
  to_address: string;
  from_address: string | null;
  body: string;
  template_name: string | null;
  status: MessageStatus;
  provider_id: string | null;
  is_dry_run: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Followup {
  id: string;
  organization_id: string;
  lead_id: string;
  assigned_to: string | null;
  type: FollowupType;
  status: FollowupStatus;
  due_at: string;
  completed_at: string | null;
  template_name: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  organization_id: string;
  user_id: string;
  check_in_time: string;
  check_out_time: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  check_in_selfie_url: string | null;
  check_out_selfie_url: string | null;
  status: AttendanceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: string;
  organization_id: string;
  title: string | null;
  caption: string | null;
  platform: SocialPlatform;
  status: SocialStatus;
  scheduled_at: string | null;
  published_at: string | null;
  media_paths: string[];
  assigned_to: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityRecord {
  id: string;
  organization_id: string;
  actor_id: string | null;
  type: ActivityType;
  lead_id: string | null;
  property_id: string | null;
  call_id: string | null;
  message_id: string | null;
  followup_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface NotificationRecord {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface IntegrationSettings {
  organization_id: string;
  twilio_account_sid: string | null;
  twilio_auth_token: string | null;
  twilio_phone_number: string | null;
  whatsapp_from: string | null;
  resend_api_key: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_pass: string | null;
  email_from: string | null;
  webhook_secret: string | null;
  openai_api_key: string | null;
  openai_base_url: string | null;
  openai_model: string | null;
  assignment_mode: AssignmentMode;
  service_mode: ServiceMode;
  social_publish_webhook: string | null;
  updated_at: string;
}
