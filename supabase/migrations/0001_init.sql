-- =============================================================================
-- EstateFlow CRM - 0001_init.sql
-- Core schema: organizations, profiles, leads, properties, calls, messages,
-- followups, attendance, social posts, activities, integrations, notifications.
-- =============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------- Enums ---------------------------------------------------------
create type user_role as enum (
  'admin',
  'sales_manager',
  'sales_agent',
  'field_executive',
  'social_media_manager'
);

create type lead_source as enum (
  '36_acre',
  'magicbricks',
  'housing',
  'facebook',
  'instagram',
  'website',
  'whatsapp',
  'referral',
  'manual',
  'other'
);

create type lead_status as enum (
  'new',
  'contacted',
  'interested',
  'site_visit_scheduled',
  'negotiation',
  'won',
  'lost',
  'not_responding'
);

create type lead_temperature as enum ('cold', 'warm', 'hot');

create type property_type as enum (
  'apartment',
  'villa',
  'plot',
  'commercial',
  'rental'
);

create type property_status as enum (
  'available',
  'hold',
  'sold',
  'rented'
);

create type call_status as enum (
  'queued',
  'agent_ringing',
  'agent_no_answer',
  'lead_ringing',
  'in_progress',
  'completed',
  'failed',
  'no_agent_available'
);

create type call_outcome as enum (
  'connected',
  'voicemail',
  'no_answer',
  'busy',
  'wrong_number',
  'callback_requested',
  'not_interested',
  'interested',
  'pending'
);

create type message_channel as enum ('whatsapp', 'sms', 'email');
create type message_direction as enum ('inbound', 'outbound');
create type message_status as enum ('queued', 'sent', 'delivered', 'read', 'failed');

create type followup_type as enum ('call', 'whatsapp', 'sms', 'email', 'site_visit');
create type followup_status as enum ('pending', 'completed', 'snoozed', 'cancelled');

create type attendance_status as enum ('present', 'late', 'absent', 'half_day', 'on_leave');

create type social_platform as enum ('instagram_post', 'instagram_reel', 'facebook_post', 'linkedin_post', 'story');
create type social_status as enum ('idea', 'draft', 'scheduled', 'published', 'failed');

create type activity_type as enum (
  'lead_created',
  'lead_assigned',
  'lead_status_changed',
  'lead_temperature_changed',
  'note_added',
  'call_initiated',
  'call_completed',
  'message_sent',
  'property_shared',
  'followup_scheduled',
  'followup_completed',
  'attendance_check_in',
  'attendance_check_out',
  'site_visit_scheduled'
);

create type assignment_mode as enum ('round_robin', 'manual', 'least_busy');

-- ---------- Helper: trigger to keep updated_at fresh ---------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Organizations ------------------------------------------------
create table organizations (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text unique not null,
  logo_url    text,
  timezone    text default 'Asia/Kolkata',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create trigger trg_org_updated before update on organizations
for each row execute function set_updated_at();

-- ---------- Profiles (extends auth.users) --------------------------------
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name       text not null,
  email           text not null,
  phone           text,
  role            user_role not null default 'sales_agent',
  avatar_url      text,
  is_active       boolean default true,
  -- For round-robin lead assignment
  rr_position     int default 0,
  last_assigned_at timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_profiles_org on profiles(organization_id);
create index idx_profiles_role on profiles(organization_id, role) where is_active;

create trigger trg_profile_updated before update on profiles
for each row execute function set_updated_at();

-- ---------- Team invites -------------------------------------------------
create table team_invites (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email           text not null,
  role            user_role not null default 'sales_agent',
  invited_by      uuid references profiles(id) on delete set null,
  token           text unique not null default encode(gen_random_bytes(24), 'hex'),
  accepted_at     timestamptz,
  expires_at      timestamptz default (now() + interval '7 days'),
  created_at      timestamptz default now()
);
create index idx_invites_org on team_invites(organization_id);
create index idx_invites_token on team_invites(token);

-- ---------- Leads --------------------------------------------------------
create table leads (
  id                  uuid primary key default uuid_generate_v4(),
  organization_id     uuid not null references organizations(id) on delete cascade,
  full_name           text not null,
  phone               text not null,
  email               text,
  source              lead_source not null default 'manual',
  source_meta         jsonb default '{}'::jsonb,
  property_type       property_type,
  budget_min          bigint,
  budget_max          bigint,
  preferred_location  text,
  status              lead_status not null default 'new',
  temperature         lead_temperature not null default 'warm',
  assigned_agent_id   uuid references profiles(id) on delete set null,
  notes               text,
  next_followup_at    timestamptz,
  last_contacted_at   timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index idx_leads_org on leads(organization_id);
create index idx_leads_org_status on leads(organization_id, status);
create index idx_leads_org_agent on leads(organization_id, assigned_agent_id);
create index idx_leads_org_temp on leads(organization_id, temperature);
create index idx_leads_phone on leads(phone);
create index idx_leads_followup on leads(organization_id, next_followup_at) where next_followup_at is not null;

create trigger trg_leads_updated before update on leads
for each row execute function set_updated_at();

-- ---------- Properties ---------------------------------------------------
create table properties (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  title             text not null,
  description       text,
  property_type     property_type not null,
  status            property_status not null default 'available',
  location          text not null,
  address           text,
  price             bigint,
  size_sqft         int,
  bedrooms          int,
  bathrooms         int,
  floor             text,
  furnishing        text, -- 'unfurnished' | 'semi' | 'furnished'
  amenities         text[] default '{}',
  developer_name    text,
  share_slug        text unique default encode(gen_random_bytes(8), 'hex'),
  internal_tags     text[] default '{}',
  created_by        uuid references profiles(id) on delete set null,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index idx_props_org on properties(organization_id);
create index idx_props_org_type on properties(organization_id, property_type, status);
create index idx_props_org_loc on properties(organization_id, location);
create index idx_props_share_slug on properties(share_slug);

create trigger trg_props_updated before update on properties
for each row execute function set_updated_at();

-- ---------- Property images / documents ----------------------------------
create table property_images (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  property_id     uuid not null references properties(id) on delete cascade,
  storage_path    text not null,
  public_url      text,
  caption         text,
  sort_order      int default 0,
  created_at      timestamptz default now()
);
create index idx_prop_images_property on property_images(property_id);

create table property_documents (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  property_id     uuid not null references properties(id) on delete cascade,
  storage_path    text not null,
  public_url      text,
  name            text not null,
  mime_type       text,
  size_bytes      bigint,
  created_at      timestamptz default now()
);
create index idx_prop_docs_property on property_documents(property_id);

-- ---------- Lead-property shares -----------------------------------------
create table lead_property_shares (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id         uuid not null references leads(id) on delete cascade,
  property_id     uuid not null references properties(id) on delete cascade,
  shared_by       uuid references profiles(id) on delete set null,
  channel         message_channel not null,
  message_id      uuid,                 -- FK below
  share_link      text not null,
  template_name   text,
  created_at      timestamptz default now()
);
create index idx_share_org on lead_property_shares(organization_id);
create index idx_share_lead on lead_property_shares(lead_id);
create index idx_share_property on lead_property_shares(property_id);

-- ---------- Calls --------------------------------------------------------
create table calls (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  lead_id           uuid references leads(id) on delete set null,
  agent_id          uuid references profiles(id) on delete set null,
  call_sid          text,         -- Twilio CallSid for the bridge / parent
  agent_call_sid    text,         -- Twilio CallSid for agent leg
  lead_call_sid     text,         -- Twilio CallSid for lead leg
  conference_sid    text,
  status            call_status not null default 'queued',
  outcome           call_outcome not null default 'pending',
  duration_seconds  int default 0,
  recording_url     text,
  notes             text,
  is_dry_run        boolean default false,
  started_at        timestamptz,
  ended_at          timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
create index idx_calls_org on calls(organization_id);
create index idx_calls_lead on calls(lead_id);
create index idx_calls_agent on calls(agent_id);
create index idx_calls_call_sid on calls(call_sid);

create trigger trg_calls_updated before update on calls
for each row execute function set_updated_at();

-- ---------- Messages -----------------------------------------------------
create table messages (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id         uuid references leads(id) on delete set null,
  sender_id       uuid references profiles(id) on delete set null,
  channel         message_channel not null,
  direction       message_direction not null default 'outbound',
  to_address      text not null,
  from_address    text,
  body            text not null,
  template_name   text,
  status          message_status not null default 'queued',
  provider_id     text, -- Twilio MessageSid / Resend id
  is_dry_run      boolean default false,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index idx_msg_org on messages(organization_id);
create index idx_msg_lead on messages(lead_id);
create index idx_msg_status on messages(organization_id, status);

create trigger trg_msg_updated before update on messages
for each row execute function set_updated_at();

-- Now wire the share -> message FK
alter table lead_property_shares
  add constraint lead_property_shares_message_fk
  foreign key (message_id) references messages(id) on delete set null;

-- ---------- Followups ----------------------------------------------------
create table followups (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id         uuid not null references leads(id) on delete cascade,
  assigned_to     uuid references profiles(id) on delete set null,
  type            followup_type not null,
  status          followup_status not null default 'pending',
  due_at          timestamptz not null,
  completed_at    timestamptz,
  template_name   text,
  notes           text,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index idx_followups_org on followups(organization_id);
create index idx_followups_due on followups(organization_id, due_at) where status = 'pending';
create index idx_followups_assigned on followups(assigned_to, status);

create trigger trg_followups_updated before update on followups
for each row execute function set_updated_at();

-- ---------- Tasks (general) ---------------------------------------------
create table tasks (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title           text not null,
  description     text,
  assigned_to     uuid references profiles(id) on delete set null,
  related_lead_id uuid references leads(id) on delete set null,
  related_property_id uuid references properties(id) on delete set null,
  due_at          timestamptz,
  completed_at    timestamptz,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index idx_tasks_org on tasks(organization_id);
create trigger trg_tasks_updated before update on tasks
for each row execute function set_updated_at();

-- ---------- Attendance --------------------------------------------------
create table attendance (
  id                  uuid primary key default uuid_generate_v4(),
  organization_id     uuid not null references organizations(id) on delete cascade,
  user_id             uuid not null references profiles(id) on delete cascade,
  check_in_time       timestamptz not null default now(),
  check_out_time      timestamptz,
  check_in_latitude   double precision,
  check_in_longitude  double precision,
  check_out_latitude  double precision,
  check_out_longitude double precision,
  check_in_selfie_url  text,
  check_out_selfie_url text,
  status              attendance_status not null default 'present',
  notes               text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
create index idx_att_org on attendance(organization_id);
create index idx_att_user_day on attendance(user_id, check_in_time desc);
create unique index idx_att_user_open on attendance(user_id) where check_out_time is null;

create trigger trg_att_updated before update on attendance
for each row execute function set_updated_at();

-- ---------- Social posts -------------------------------------------------
create table social_posts (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title           text,
  caption         text,
  platform        social_platform not null,
  status          social_status not null default 'idea',
  scheduled_at    timestamptz,
  published_at    timestamptz,
  media_paths     text[] default '{}',
  assigned_to     uuid references profiles(id) on delete set null,
  notes           text,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index idx_social_org on social_posts(organization_id);
create index idx_social_scheduled on social_posts(organization_id, scheduled_at);

create trigger trg_social_updated before update on social_posts
for each row execute function set_updated_at();

-- ---------- Activities (timeline) ----------------------------------------
create table activities (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_id        uuid references profiles(id) on delete set null,
  type            activity_type not null,
  lead_id         uuid references leads(id) on delete cascade,
  property_id     uuid references properties(id) on delete set null,
  call_id         uuid references calls(id) on delete set null,
  message_id      uuid references messages(id) on delete set null,
  followup_id     uuid references followups(id) on delete set null,
  payload         jsonb default '{}'::jsonb,
  created_at      timestamptz default now()
);
create index idx_act_org on activities(organization_id);
create index idx_act_lead on activities(lead_id, created_at desc);
create index idx_act_org_recent on activities(organization_id, created_at desc);

-- ---------- Notifications ------------------------------------------------
create table notifications (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  title           text not null,
  body            text,
  type            text not null,            -- e.g. 'lead_assigned', 'followup_due'
  link            text,                     -- e.g. '/leads/abc'
  read_at         timestamptz,
  created_at      timestamptz default now()
);
create index idx_notif_user on notifications(user_id, created_at desc);
create index idx_notif_unread on notifications(user_id) where read_at is null;

-- ---------- Integration settings (per-org) -------------------------------
create table integration_settings (
  organization_id     uuid primary key references organizations(id) on delete cascade,
  twilio_account_sid  text,
  twilio_auth_token   text,
  twilio_phone_number text,
  whatsapp_from       text,
  resend_api_key      text,
  smtp_host           text,
  smtp_port           int,
  smtp_user           text,
  smtp_pass           text,
  email_from          text,
  webhook_secret      text default encode(gen_random_bytes(24), 'hex'),
  openai_api_key      text,
  openai_base_url     text default 'https://api.openai.com/v1',
  openai_model        text default 'gpt-4o-mini',
  assignment_mode     assignment_mode default 'round_robin',
  service_mode        text default 'dry-run',  -- 'dry-run' | 'production'
  social_publish_webhook text,
  updated_at          timestamptz default now()
);
create trigger trg_integration_updated before update on integration_settings
for each row execute function set_updated_at();

-- ---------- Helper: get current user's organization ----------------------
create or replace function current_user_org()
returns uuid language sql stable security definer set search_path = public as $$
  select organization_id from profiles where id = auth.uid()
$$;

create or replace function current_user_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_admin_or_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin', 'sales_manager') from profiles where id = auth.uid()), false)
$$;
