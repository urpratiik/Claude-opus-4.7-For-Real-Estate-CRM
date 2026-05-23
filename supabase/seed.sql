-- =============================================================================
-- EstateFlow CRM - seed.sql
-- Demo organization "Acme Realty" with admin, 2 agents, 1 field exec,
-- 20 leads, 10 properties, sample calls, follow-ups, attendance, social posts.
--
-- HOW TO USE:
--   1. Create real auth users first with `npm run seed` (scripts/seed.ts) which
--      uses the service-role key to call auth.admin.createUser, then upserts
--      profiles + this seed data.
--   2. This SQL file is also runnable standalone for quick demos: it inserts
--      synthetic UUIDs into `profiles` directly (bypasses auth.users FK if you
--      pre-create matching auth users, otherwise use scripts/seed.ts).
-- =============================================================================

-- Disable RLS for seed
set session role postgres;

-- Organization
insert into organizations (id, name, slug, timezone)
values ('00000000-0000-0000-0000-000000000001', 'Acme Realty', 'acme-realty', 'Asia/Kolkata')
on conflict (id) do nothing;

insert into integration_settings (organization_id, assignment_mode, service_mode)
values ('00000000-0000-0000-0000-000000000001', 'round_robin', 'dry-run')
on conflict (organization_id) do nothing;

-- NOTE: The profiles below assume matching auth.users rows already exist.
-- scripts/seed.ts handles that. For SQL-only runs, comment these out or pre-create users.
-- Profiles
insert into profiles (id, organization_id, full_name, email, phone, role) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Priya Admin',     'admin@acme.test',   '+919900000001', 'admin'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Rohit Manager',   'manager@acme.test', '+919900000002', 'sales_manager'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Anita Agent',     'anita@acme.test',   '+919900000003', 'sales_agent'),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 'Vikram Agent',    'vikram@acme.test',  '+919900000004', 'sales_agent'),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', 'Suresh Field',    'field@acme.test',   '+919900000005', 'field_executive'),
  ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000001', 'Neha Social',     'social@acme.test',  '+919900000006', 'social_media_manager')
on conflict (id) do nothing;

-- Properties (10)
insert into properties (id, organization_id, title, description, property_type, status, location, address, price, size_sqft, bedrooms, bathrooms, floor, furnishing, amenities, developer_name, created_by)
values
  ('a0000001-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','3BHK Luxury Apartment in Golf Course Road','Spacious 3BHK with modular kitchen, balcony, and city view.','apartment','available','Gurgaon, Sector 54','Golf Course Road, Sector 54, Gurgaon',18500000,1850,3,3,'12','semi','{"Swimming Pool","Gym","Club House","24x7 Security","Power Backup"}','DLF','11111111-1111-1111-1111-111111111111'),
  ('a0000002-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','2BHK Affordable Flat near Metro','Well-ventilated 2BHK close to Yellow Line metro.','apartment','available','Noida, Sector 76','Sector 76, Noida',7200000,1100,2,2,'5','unfurnished','{"Lift","Park","CCTV"}','ATS','11111111-1111-1111-1111-111111111111'),
  ('a0000003-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','4BHK Villa with Private Garden','Independent villa with garden, terrace, and 2 car parking.','villa','available','Gurgaon, Sushant Lok','Sushant Lok Phase 1, Gurgaon',42000000,3200,4,5,'G+1','furnished','{"Garden","Servant Room","Modular Kitchen","Private Pool"}','Independent','22222222-2222-2222-2222-222222222222'),
  ('a0000004-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','Commercial Office Space','Plug-and-play office with 30 workstations.','commercial','available','Gurgaon, Cyber City','Cyber City Tower B, Gurgaon',55000000,2400,null,2,'8','furnished','{"Conference Room","Cafeteria","Reception"}','Embassy','22222222-2222-2222-2222-222222222222'),
  ('a0000005-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000001','Plot in Upcoming Township','Residential plot in approved layout.','plot','available','Faridabad, Sector 88','Sector 88, Faridabad',9500000,1800,null,null,null,null,'{"Gated","Park","Wide Roads"}','BPTP','11111111-1111-1111-1111-111111111111'),
  ('a0000006-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001','3BHK Premium Apartment','Newly handed over project with all amenities.','apartment','available','Noida, Sector 150','Jaypee Greens, Noida',13500000,1650,3,2,'18','semi','{"Pool","Gym","Spa","Sports Arena"}','Jaypee','11111111-1111-1111-1111-111111111111'),
  ('a0000007-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000001','2BHK on Rent','Fully furnished 2BHK available for immediate move-in.','rental','available','Gurgaon, Sector 49','Uniworld Garden, Sector 49',45000,1200,2,2,'7','furnished','{"AC","Wifi","Parking","Gym"}','Unitech','33333333-3333-3333-3333-333333333333'),
  ('a0000008-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000001','Studio Apartment Investor Special','Pre-leased studio with 6% yield.','apartment','hold',  'Gurgaon, Sector 65','M3M Heights, Sector 65',6500000,650,1,1,'10','furnished','{"Lift","Pool","Gym"}','M3M','22222222-2222-2222-2222-222222222222'),
  ('a0000009-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000001','Penthouse with Terrace','Top-floor 5BHK with private terrace and skyline view.','apartment','available','Gurgaon, MG Road','Ireo Grand Arch, Gurgaon',82000000,4100,5,5,'24','furnished','{"Private Terrace","Pool","Concierge","Smart Home"}','Ireo','11111111-1111-1111-1111-111111111111'),
  ('a000000a-0000-0000-0000-00000000000a','00000000-0000-0000-0000-000000000001','Retail Shop Ground Floor','High-footfall retail unit in mixed-use complex.','commercial','available','Noida, Sector 18','DLF Mall of India Ext, Sector 18',38000000,1200,null,1,'G','unfurnished','{"High Footfall","Glass Front","Power Backup"}','DLF','22222222-2222-2222-2222-222222222222')
on conflict (id) do nothing;

-- Property images (placeholder URLs)
insert into property_images (organization_id, property_id, storage_path, public_url, sort_order)
select '00000000-0000-0000-0000-000000000001', p.id,
       'demo/' || p.id || '/cover.jpg',
       'https://picsum.photos/seed/' || replace(p.id::text,'-','') || '/800/600',
       0
from properties p where p.organization_id = '00000000-0000-0000-0000-000000000001'
on conflict do nothing;

-- 20 leads
insert into leads (id, organization_id, full_name, phone, email, source, property_type, budget_min, budget_max, preferred_location, status, temperature, assigned_agent_id, notes, next_followup_at)
values
  ('b0000001-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Rahul Sharma',  '+919811100001','rahul1@example.com', '36_acre',     'apartment', 7500000, 12000000,'Gurgaon Golf Course Rd','new','warm','33333333-3333-3333-3333-333333333333','Looking for 3BHK near Golf Course Road', now() + interval '1 day'),
  ('b0000002-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','Anjali Verma',  '+919811100002','anjali2@example.com','magicbricks','apartment', 5000000,  8000000,'Noida Sector 76','contacted','warm','44444444-4444-4444-4444-444444444444','Wants 2BHK ready-to-move',         now() + interval '2 days'),
  ('b0000003-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','Karan Mehta',   '+919811100003','karan3@example.com', 'housing',     'villa',    35000000,50000000,'Gurgaon Sushant Lok','interested','hot','33333333-3333-3333-3333-333333333333','Has finance ready, wants villa',    now() + interval '6 hours'),
  ('b0000004-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','Pooja Iyer',    '+919811100004','pooja4@example.com', 'facebook',    'rental',      30000,   60000,'Gurgaon Sector 49','site_visit_scheduled','hot','44444444-4444-4444-4444-444444444444','Needs furnished 2BHK rental',      now() + interval '1 day'),
  ('b0000005-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000001','Aman Gupta',    '+919811100005','aman5@example.com',  'instagram',   'plot',     7000000, 10000000,'Faridabad Sector 88','new','cold','33333333-3333-3333-3333-333333333333','Investor for plot',                now() + interval '3 days'),
  ('b0000006-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001','Sneha Kapoor',  '+919811100006','sneha6@example.com', 'website',     'apartment',12000000,16000000,'Noida Sector 150','negotiation','hot','44444444-4444-4444-4444-444444444444','Final negotiation on premium 3BHK',now() + interval '12 hours'),
  ('b0000007-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000001','Vivek Rao',     '+919811100007','vivek7@example.com', 'whatsapp',    'commercial',40000000,60000000,'Gurgaon Cyber City','interested','warm','33333333-3333-3333-3333-333333333333','Office space for IT firm',         now() + interval '2 days'),
  ('b0000008-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000001','Neeraj Sethi',  '+919811100008','neeraj8@example.com','referral',    'apartment', 5000000,  7000000,'Gurgaon Sector 65','contacted','warm','44444444-4444-4444-4444-444444444444','Studio investment property',       now() + interval '1 day'),
  ('b0000009-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000001','Ritika Bhatt',  '+919811100009','ritika9@example.com','manual',      'apartment', 8000000, 11000000,'Noida','new','warm','33333333-3333-3333-3333-333333333333','Walked in to office',              now() + interval '3 days'),
  ('b000000a-0000-0000-0000-00000000000a','00000000-0000-0000-0000-000000000001','Manoj Tiwari',  '+919811100010','manoj10@example.com','36_acre',     'villa',    30000000,45000000,'Gurgaon','interested','hot','44444444-4444-4444-4444-444444444444','Looking at villas this weekend',   now() + interval '8 hours'),
  ('b000000b-0000-0000-0000-00000000000b','00000000-0000-0000-0000-000000000001','Deepak Khanna', '+919811100011','deepak11@example.com','magicbricks','plot',      6000000, 10000000,'Faridabad','not_responding','cold','33333333-3333-3333-3333-333333333333','Tried 3 calls, no answer',         now() + interval '5 days'),
  ('b000000c-0000-0000-0000-00000000000c','00000000-0000-0000-0000-000000000001','Shweta Joshi',  '+919811100012','shweta12@example.com','facebook',   'apartment', 4500000,  6500000,'Noida Sector 76','contacted','warm','44444444-4444-4444-4444-444444444444','Interested in 2BHK',               now() + interval '2 days'),
  ('b000000d-0000-0000-0000-00000000000d','00000000-0000-0000-0000-000000000001','Arjun Nair',    '+919811100013','arjun13@example.com','housing',    'apartment',15000000,20000000,'Gurgaon MG Road','interested','hot','33333333-3333-3333-3333-333333333333','High-budget penthouse seeker',     now() + interval '1 day'),
  ('b000000e-0000-0000-0000-00000000000e','00000000-0000-0000-0000-000000000001','Riya Saxena',   '+919811100014','riya14@example.com','instagram',  'rental',      25000,   45000,'Gurgaon','new','warm','44444444-4444-4444-4444-444444444444','Newly relocated, urgent rental',   now() + interval '6 hours'),
  ('b000000f-0000-0000-0000-00000000000f','00000000-0000-0000-0000-000000000001','Sumit Yadav',   '+919811100015','sumit15@example.com','website',    'apartment', 9000000, 13000000,'Noida Sector 150','site_visit_scheduled','hot','33333333-3333-3333-3333-333333333333','Site visit Saturday',              now() + interval '2 days'),
  ('b0000010-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000001','Tanya Roy',     '+919811100016','tanya16@example.com','referral',   'villa',    20000000,30000000,'Gurgaon','won','hot','44444444-4444-4444-4444-444444444444','Closed villa deal',                null),
  ('b0000011-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000001','Mohit Bansal',  '+919811100017','mohit17@example.com','36_acre',    'commercial',30000000,45000000,'Noida','lost','cold','33333333-3333-3333-3333-333333333333','Went with competitor',             null),
  ('b0000012-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000001','Nidhi Pillai',  '+919811100018','nidhi18@example.com','magicbricks','apartment',10000000,14000000,'Gurgaon Sector 54','interested','warm','44444444-4444-4444-4444-444444444444','Compares 2-3 options weekly',      now() + interval '4 days'),
  ('b0000013-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000001','Hemant Singh',  '+919811100019','hemant19@example.com','manual',    'apartment', 6500000,  9000000,'Faridabad','new','warm','33333333-3333-3333-3333-333333333333','Came via walk-in',                 now() + interval '3 days'),
  ('b0000014-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000001','Ankit Malhotra','+919811100020','ankit20@example.com','facebook',   'apartment',11000000,15000000,'Gurgaon','contacted','hot','44444444-4444-4444-4444-444444444444','Very engaged, wants demo today',   now() + interval '4 hours')
on conflict (id) do nothing;

-- Sample calls
insert into calls (organization_id, lead_id, agent_id, status, outcome, duration_seconds, started_at, ended_at, notes, is_dry_run)
values
  ('00000000-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333','completed','connected',184, now() - interval '2 hours', now() - interval '2 hours' + interval '184 seconds','First contact, interested', true),
  ('00000000-0000-0000-0000-000000000001','b0000003-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333333','completed','interested',420, now() - interval '5 hours', now() - interval '5 hours' + interval '7 minutes','Will visit on Sat',         true),
  ('00000000-0000-0000-0000-000000000001','b000000b-0000-0000-0000-00000000000b','33333333-3333-3333-3333-333333333333','completed','no_answer',0, now() - interval '1 day',     now() - interval '1 day','Did not pick up',                true),
  ('00000000-0000-0000-0000-000000000001','b0000004-0000-0000-0000-000000000004','44444444-4444-4444-4444-444444444444','completed','connected',310, now() - interval '6 hours',   now() - interval '6 hours' + interval '310 seconds','Fixed site visit', true);

-- Sample follow-ups
insert into followups (organization_id, lead_id, assigned_to, type, status, due_at, template_name, notes, created_by)
values
  ('00000000-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333','whatsapp','pending', now() + interval '1 day', 'check_in','Send 3BHK photo set',                    '11111111-1111-1111-1111-111111111111'),
  ('00000000-0000-0000-0000-000000000001','b0000003-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333333','call',    'pending', now() + interval '6 hours', 'callback','Confirm Saturday visit',                '22222222-2222-2222-2222-222222222222'),
  ('00000000-0000-0000-0000-000000000001','b0000006-0000-0000-0000-000000000006','44444444-4444-4444-4444-444444444444','email',   'pending', now() + interval '12 hours','negotiation','Send revised offer letter',          '22222222-2222-2222-2222-222222222222'),
  ('00000000-0000-0000-0000-000000000001','b0000008-0000-0000-0000-000000000008','44444444-4444-4444-4444-444444444444','whatsapp','completed', now() - interval '1 day', 'check_in','Customer asked for more options',     '22222222-2222-2222-2222-222222222222');

-- Sample attendance
insert into attendance (organization_id, user_id, check_in_time, check_out_time, check_in_latitude, check_in_longitude, check_out_latitude, check_out_longitude, status)
values
  ('00000000-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333', now() - interval '8 hours', now() - interval '15 minutes', 28.4595, 77.0266, 28.4595, 77.0266, 'present'),
  ('00000000-0000-0000-0000-000000000001','44444444-4444-4444-4444-444444444444', now() - interval '7 hours 30 minutes', null,                28.4744, 77.0497, null,    null,    'present'),
  ('00000000-0000-0000-0000-000000000001','55555555-5555-5555-5555-555555555555', now() - interval '6 hours 45 minutes', null,                28.4089, 77.3178, null,    null,    'late');

-- Sample social posts
insert into social_posts (organization_id, title, caption, platform, status, scheduled_at, assigned_to, created_by)
values
  ('00000000-0000-0000-0000-000000000001','Weekend Property Walkthrough','Tour this stunning 3BHK in Gurgaon Golf Course Rd this weekend. DM for details.','instagram_reel','scheduled', now() + interval '2 days', '66666666-6666-6666-6666-666666666666','11111111-1111-1111-1111-111111111111'),
  ('00000000-0000-0000-0000-000000000001','New Project Launch','Pre-launch offer on Sector 150 premium project. Limited units.',  'facebook_post','draft',     null,                       '66666666-6666-6666-6666-666666666666','11111111-1111-1111-1111-111111111111'),
  ('00000000-0000-0000-0000-000000000001','Customer Testimonial','Hear from Tanya about her dream villa journey.', 'instagram_post','idea',      null,                       '66666666-6666-6666-6666-666666666666','11111111-1111-1111-1111-111111111111');

-- Sample activities (timeline entries)
insert into activities (organization_id, actor_id, type, lead_id, payload)
select '00000000-0000-0000-0000-000000000001', l.assigned_agent_id, 'lead_created', l.id, jsonb_build_object('source', l.source)
from leads l where l.organization_id = '00000000-0000-0000-0000-000000000001';

-- Notifications
insert into notifications (organization_id, user_id, title, body, type, link)
values
  ('00000000-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333','New lead assigned','Rahul Sharma from 36 Acre. Tap to call.','lead_assigned','/leads/b0000001-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001','44444444-4444-4444-4444-444444444444','Follow-up due',     'Anjali Verma is due for follow-up','followup_due','/leads/b0000002-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','Site visit',        'Pooja Iyer - site visit scheduled tomorrow','site_visit_scheduled','/leads/b0000004-0000-0000-0000-000000000004');
