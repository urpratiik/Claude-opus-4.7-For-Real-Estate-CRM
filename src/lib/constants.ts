export const APP_NAME = "EstateFlow CRM";

export const LEAD_SOURCES = [
  { value: "36_acre", label: "36 Acre" },
  { value: "magicbricks", label: "MagicBricks" },
  { value: "housing", label: "Housing.com" },
  { value: "facebook", label: "Facebook Ads" },
  { value: "instagram", label: "Instagram Ads" },
  { value: "website", label: "Website" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "referral", label: "Referral" },
  { value: "manual", label: "Manual" },
  { value: "other", label: "Other" },
] as const;

export const LEAD_STATUSES = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-700" },
  { value: "contacted", label: "Contacted", color: "bg-cyan-100 text-cyan-700" },
  { value: "interested", label: "Interested", color: "bg-emerald-100 text-emerald-700" },
  { value: "site_visit_scheduled", label: "Site Visit", color: "bg-violet-100 text-violet-700" },
  { value: "negotiation", label: "Negotiation", color: "bg-amber-100 text-amber-700" },
  { value: "won", label: "Won", color: "bg-green-100 text-green-700" },
  { value: "lost", label: "Lost", color: "bg-red-100 text-red-700" },
  { value: "not_responding", label: "Not Responding", color: "bg-zinc-100 text-zinc-700" },
] as const;

export const LEAD_TEMPERATURES = [
  { value: "cold", label: "Cold", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "warm", label: "Warm", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "hot", label: "Hot", color: "bg-red-50 text-red-700 border-red-200" },
] as const;

export const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "plot", label: "Plot" },
  { value: "commercial", label: "Commercial" },
  { value: "rental", label: "Rental" },
] as const;

export const PROPERTY_STATUSES = [
  { value: "available", label: "Available", color: "bg-emerald-100 text-emerald-700" },
  { value: "hold", label: "On Hold", color: "bg-amber-100 text-amber-700" },
  { value: "sold", label: "Sold", color: "bg-zinc-100 text-zinc-700" },
  { value: "rented", label: "Rented", color: "bg-zinc-100 text-zinc-700" },
] as const;

export const USER_ROLES = [
  { value: "admin", label: "Admin / Owner" },
  { value: "sales_manager", label: "Sales Manager" },
  { value: "sales_agent", label: "Sales Agent" },
  { value: "field_executive", label: "Field Executive" },
  { value: "social_media_manager", label: "Social Media Manager" },
] as const;

export const SOCIAL_PLATFORMS = [
  { value: "instagram_post", label: "Instagram Post" },
  { value: "instagram_reel", label: "Instagram Reel" },
  { value: "facebook_post", label: "Facebook Post" },
  { value: "linkedin_post", label: "LinkedIn Post" },
  { value: "story", label: "Story" },
] as const;

export const SOCIAL_STATUSES = [
  { value: "idea", label: "Idea", color: "bg-zinc-100 text-zinc-700" },
  { value: "draft", label: "Draft", color: "bg-blue-100 text-blue-700" },
  { value: "scheduled", label: "Scheduled", color: "bg-amber-100 text-amber-700" },
  { value: "published", label: "Published", color: "bg-emerald-100 text-emerald-700" },
  { value: "failed", label: "Failed", color: "bg-red-100 text-red-700" },
] as const;

export const FOLLOWUP_TYPES = [
  { value: "call", label: "Call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "site_visit", label: "Site Visit" },
] as const;

export const DEFAULT_FOLLOWUP_TEMPLATES = [
  {
    name: "check_in",
    label: "Check-in",
    body: "Hi {{leadName}}, just checking if you had a chance to review the property details I shared.",
  },
  {
    name: "callback",
    label: "Callback request",
    body: "Hi {{leadName}}, are you available for a quick call today to discuss properties in {{preferredLocation}}?",
  },
  {
    name: "new_options",
    label: "New options",
    body: "Hi {{leadName}}, we have a few new options matching your budget. Should I share them?",
  },
  {
    name: "site_visit",
    label: "Site visit confirmation",
    body: "Hi {{leadName}}, confirming our site visit on {{date}}. See you at {{location}}.",
  },
  {
    name: "negotiation",
    label: "Offer letter",
    body: "Hi {{leadName}}, sharing the revised offer for {{propertyTitle}}. Let me know if it works.",
  },
  {
    name: "property_share",
    label: "Property share",
    body: "Hi {{leadName}}, sharing details of {{propertyTitle}} in {{location}}. Price: {{price}}. Photos and details: {{shareLink}}",
  },
] as const;

export const NAV_BOTTOM = [
  { href: "/dashboard", label: "Home", icon: "Home" },
  { href: "/leads", label: "Leads", icon: "Users" },
  { href: "/properties", label: "Properties", icon: "Building2" },
  { href: "/followups", label: "Follow-ups", icon: "Bell" },
  { href: "/more", label: "More", icon: "Menu" },
] as const;
