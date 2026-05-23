import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, "Phone must be E.164 (e.g. +919999999999)");

export const leadSourceSchema = z.enum([
  "36_acre",
  "magicbricks",
  "housing",
  "facebook",
  "instagram",
  "website",
  "whatsapp",
  "referral",
  "manual",
  "other",
]);

export const leadStatusSchema = z.enum([
  "new",
  "contacted",
  "interested",
  "site_visit_scheduled",
  "negotiation",
  "won",
  "lost",
  "not_responding",
]);

export const leadTemperatureSchema = z.enum(["cold", "warm", "hot"]);

export const propertyTypeSchema = z.enum([
  "apartment",
  "villa",
  "plot",
  "commercial",
  "rental",
]);

export const propertyStatusSchema = z.enum([
  "available",
  "hold",
  "sold",
  "rented",
]);

export const followupTypeSchema = z.enum([
  "call",
  "whatsapp",
  "sms",
  "email",
  "site_visit",
]);

// ---- Lead webhook input -------------------------------------------------
export const leadWebhookSchema = z.object({
  fullName: z.string().min(1).max(200),
  phone: phoneSchema,
  email: z.string().email().nullable().optional(),
  source: z
    .union([leadSourceSchema, z.string().min(1)])
    .default("other")
    .transform((s) => normalizeSource(s as string)),
  propertyType: propertyTypeSchema.nullable().optional(),
  budgetMin: z.number().int().nonnegative().nullable().optional(),
  budgetMax: z.number().int().nonnegative().nullable().optional(),
  preferredLocation: z.string().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  externalId: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type LeadWebhookInput = z.infer<typeof leadWebhookSchema>;

function normalizeSource(s: string): z.infer<typeof leadSourceSchema> {
  const lower = s.toLowerCase().replace(/[\s.-]+/g, "_");
  const map: Record<string, z.infer<typeof leadSourceSchema>> = {
    "36_acre": "36_acre",
    "36acre": "36_acre",
    magicbricks: "magicbricks",
    housing: "housing",
    "housing_com": "housing",
    facebook: "facebook",
    fb: "facebook",
    instagram: "instagram",
    ig: "instagram",
    website: "website",
    web: "website",
    whatsapp: "whatsapp",
    referral: "referral",
    manual: "manual",
  };
  return map[lower] ?? "other";
}

// ---- Lead form (manual create / edit) -----------------------------------
export const leadFormSchema = z.object({
  full_name: z.string().min(1).max(200),
  phone: phoneSchema,
  email: z.string().email().or(z.literal("")).optional(),
  source: leadSourceSchema.default("manual"),
  property_type: propertyTypeSchema.nullable().optional(),
  budget_min: z.coerce.number().int().nonnegative().nullable().optional(),
  budget_max: z.coerce.number().int().nonnegative().nullable().optional(),
  preferred_location: z.string().max(200).optional(),
  status: leadStatusSchema.optional(),
  temperature: leadTemperatureSchema.optional(),
  assigned_agent_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(5000).optional(),
  next_followup_at: z.string().datetime().nullable().optional(),
});
export type LeadFormInput = z.infer<typeof leadFormSchema>;

// ---- Property form ------------------------------------------------------
export const propertyFormSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  property_type: propertyTypeSchema,
  status: propertyStatusSchema.default("available"),
  location: z.string().min(2).max(200),
  address: z.string().max(500).optional(),
  price: z.coerce.number().int().nonnegative().nullable().optional(),
  size_sqft: z.coerce.number().int().nonnegative().nullable().optional(),
  bedrooms: z.coerce.number().int().nonnegative().nullable().optional(),
  bathrooms: z.coerce.number().int().nonnegative().nullable().optional(),
  floor: z.string().max(50).optional(),
  furnishing: z.string().max(50).optional(),
  amenities: z.array(z.string()).default([]),
  developer_name: z.string().max(200).optional(),
  internal_tags: z.array(z.string()).default([]),
});
export type PropertyFormInput = z.infer<typeof propertyFormSchema>;

// ---- Follow-up ---------------------------------------------------------
export const followupFormSchema = z.object({
  lead_id: z.string().uuid(),
  type: followupTypeSchema,
  due_at: z.string().datetime(),
  template_name: z.string().optional(),
  notes: z.string().max(2000).optional(),
});
export type FollowupFormInput = z.infer<typeof followupFormSchema>;

// ---- Attendance --------------------------------------------------------
export const checkInSchema = z.object({
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  selfie_path: z.string().nullable().optional(),
  notes: z.string().max(500).optional(),
});

export const checkOutSchema = z.object({
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  selfie_path: z.string().nullable().optional(),
  notes: z.string().max(500).optional(),
});

// ---- Social post -------------------------------------------------------
export const socialPostSchema = z.object({
  title: z.string().max(200).optional(),
  caption: z.string().max(5000).optional(),
  platform: z.enum([
    "instagram_post",
    "instagram_reel",
    "facebook_post",
    "linkedin_post",
    "story",
  ]),
  status: z.enum(["idea", "draft", "scheduled", "published", "failed"]).default("idea"),
  scheduled_at: z.string().datetime().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000).optional(),
});
export type SocialPostInput = z.infer<typeof socialPostSchema>;

// ---- Auth --------------------------------------------------------------
export const signupSchema = z.object({
  full_name: z.string().min(2).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  organization_name: z.string().min(2).max(200),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum([
    "admin",
    "sales_manager",
    "sales_agent",
    "field_executive",
    "social_media_manager",
  ]),
  full_name: z.string().min(2).max(200),
  password: z.string().min(8).max(128),
});
