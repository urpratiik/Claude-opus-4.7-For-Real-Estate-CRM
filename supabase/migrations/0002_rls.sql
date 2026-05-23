-- =============================================================================
-- EstateFlow CRM - 0002_rls.sql
-- Row Level Security: every row is scoped to organization_id = current_user_org().
-- Admins/managers can read all org data; agents/field-execs are further restricted
-- to their own work where appropriate.
-- =============================================================================

-- Enable RLS on every table
alter table organizations         enable row level security;
alter table profiles              enable row level security;
alter table team_invites          enable row level security;
alter table leads                 enable row level security;
alter table properties            enable row level security;
alter table property_images       enable row level security;
alter table property_documents    enable row level security;
alter table lead_property_shares  enable row level security;
alter table calls                 enable row level security;
alter table messages              enable row level security;
alter table followups             enable row level security;
alter table tasks                 enable row level security;
alter table attendance            enable row level security;
alter table social_posts          enable row level security;
alter table activities            enable row level security;
alter table notifications         enable row level security;
alter table integration_settings  enable row level security;

-- Generic policy: members of the org can read; admin/manager can write.
-- For agent-restricted tables we add separate policies.

-- ---------- organizations ------------------------------------------------
create policy org_self_read on organizations
  for select using (id = current_user_org());
create policy org_self_update on organizations
  for update using (id = current_user_org() and is_admin_or_manager())
  with check (id = current_user_org());

-- ---------- profiles -----------------------------------------------------
create policy profiles_org_read on profiles
  for select using (organization_id = current_user_org());

create policy profiles_self_update on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and organization_id = current_user_org());

create policy profiles_admin_manage on profiles
  for all using (organization_id = current_user_org() and is_admin_or_manager())
  with check (organization_id = current_user_org());

-- ---------- team_invites -------------------------------------------------
create policy invites_admin_all on team_invites
  for all using (organization_id = current_user_org() and is_admin_or_manager())
  with check (organization_id = current_user_org());

-- ---------- leads --------------------------------------------------------
create policy leads_org_read on leads
  for select using (
    organization_id = current_user_org()
    and (
      is_admin_or_manager()
      or assigned_agent_id = auth.uid()
      or assigned_agent_id is null
    )
  );

create policy leads_org_insert on leads
  for insert with check (organization_id = current_user_org());

create policy leads_org_update on leads
  for update using (
    organization_id = current_user_org()
    and (is_admin_or_manager() or assigned_agent_id = auth.uid())
  )
  with check (organization_id = current_user_org());

create policy leads_admin_delete on leads
  for delete using (organization_id = current_user_org() and is_admin_or_manager());

-- ---------- properties (everyone in org can read; managers+ write) -------
create policy properties_org_read on properties
  for select using (organization_id = current_user_org());
create policy properties_admin_write on properties
  for all using (organization_id = current_user_org() and is_admin_or_manager())
  with check (organization_id = current_user_org());

-- Sales agents can also create/edit listings they own
create policy properties_owner_write on properties
  for all using (organization_id = current_user_org() and created_by = auth.uid())
  with check (organization_id = current_user_org());

-- ---------- property_images / documents (mirror property access) ---------
create policy property_images_read on property_images
  for select using (organization_id = current_user_org());
create policy property_images_write on property_images
  for all using (organization_id = current_user_org() and is_admin_or_manager())
  with check (organization_id = current_user_org());

create policy property_documents_read on property_documents
  for select using (organization_id = current_user_org());
create policy property_documents_write on property_documents
  for all using (organization_id = current_user_org() and is_admin_or_manager())
  with check (organization_id = current_user_org());

-- ---------- lead_property_shares -----------------------------------------
create policy shares_org_read on lead_property_shares
  for select using (organization_id = current_user_org());
create policy shares_org_write on lead_property_shares
  for insert with check (organization_id = current_user_org());

-- ---------- calls --------------------------------------------------------
create policy calls_org_read on calls
  for select using (
    organization_id = current_user_org()
    and (is_admin_or_manager() or agent_id = auth.uid())
  );
create policy calls_org_write on calls
  for all using (organization_id = current_user_org())
  with check (organization_id = current_user_org());

-- ---------- messages -----------------------------------------------------
create policy messages_org_read on messages
  for select using (organization_id = current_user_org());
create policy messages_org_write on messages
  for all using (organization_id = current_user_org())
  with check (organization_id = current_user_org());

-- ---------- followups ----------------------------------------------------
create policy followups_org_read on followups
  for select using (
    organization_id = current_user_org()
    and (is_admin_or_manager() or assigned_to = auth.uid() or created_by = auth.uid())
  );
create policy followups_org_write on followups
  for all using (organization_id = current_user_org())
  with check (organization_id = current_user_org());

-- ---------- tasks --------------------------------------------------------
create policy tasks_org_read on tasks
  for select using (organization_id = current_user_org());
create policy tasks_org_write on tasks
  for all using (organization_id = current_user_org())
  with check (organization_id = current_user_org());

-- ---------- attendance ---------------------------------------------------
-- Self read/write; admin/manager read all.
create policy attendance_self_read on attendance
  for select using (
    organization_id = current_user_org()
    and (user_id = auth.uid() or is_admin_or_manager())
  );
create policy attendance_self_write on attendance
  for all using (organization_id = current_user_org() and user_id = auth.uid())
  with check (organization_id = current_user_org() and user_id = auth.uid());
create policy attendance_admin_write on attendance
  for all using (organization_id = current_user_org() and is_admin_or_manager())
  with check (organization_id = current_user_org());

-- ---------- social_posts -------------------------------------------------
create policy social_org_read on social_posts
  for select using (organization_id = current_user_org());
create policy social_org_write on social_posts
  for all using (organization_id = current_user_org())
  with check (organization_id = current_user_org());

-- ---------- activities ---------------------------------------------------
create policy activities_org_read on activities
  for select using (organization_id = current_user_org());
create policy activities_org_insert on activities
  for insert with check (organization_id = current_user_org());

-- ---------- notifications ------------------------------------------------
create policy notif_self_read on notifications
  for select using (user_id = auth.uid());
create policy notif_self_update on notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy notif_org_insert on notifications
  for insert with check (organization_id = current_user_org());

-- ---------- integration_settings (admin only) ----------------------------
create policy integration_admin_all on integration_settings
  for all using (organization_id = current_user_org() and current_user_role() = 'admin')
  with check (organization_id = current_user_org());
