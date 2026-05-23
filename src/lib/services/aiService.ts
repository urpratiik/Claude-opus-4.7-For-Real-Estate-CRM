import { getIntegrationContext, isDryRun } from "./integration";

/**
 * aiService — OpenAI-compatible adapter for caption / description / message
 * drafting. Works with any provider exposing a /v1/chat/completions endpoint
 * (OpenAI, Azure OpenAI, Together, OpenRouter, Groq, ...).
 *
 * In dry-run mode we return a templated stub so UI flows can be tested without
 * incurring cost.
 */

export interface DraftRequest {
  organizationId: string;
  prompt: string;
  system?: string;
  maxTokens?: number;
}

export async function draftText({
  organizationId,
  prompt,
  system,
  maxTokens = 600,
}: DraftRequest): Promise<string> {
  const ctx = await getIntegrationContext(organizationId);

  if (isDryRun(ctx) || !ctx.ai.apiKey) {
    return stubReply(prompt);
  }

  const res = await fetch(`${ctx.ai.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ctx.ai.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ctx.ai.model,
      max_tokens: maxTokens,
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`AI provider error ${res.status}`);
  }
  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message?.content ?? "";
}

export async function draftPropertyDescription(
  organizationId: string,
  property: {
    title: string;
    location: string;
    property_type: string;
    bedrooms: number | null;
    bathrooms: number | null;
    size_sqft: number | null;
    amenities: string[];
  },
) {
  return draftText({
    organizationId,
    system:
      "You are a real estate copywriter. Write concise, persuasive 80-120 word property descriptions in clear English. Avoid clichés. Mention 2-3 standout features.",
    prompt: `Property: ${property.title}
Location: ${property.location}
Type: ${property.property_type}
Bedrooms: ${property.bedrooms ?? "—"}, Bathrooms: ${property.bathrooms ?? "—"}, Size: ${property.size_sqft ?? "—"} sqft
Amenities: ${(property.amenities ?? []).join(", ")}`,
  });
}

export async function draftSocialCaption(
  organizationId: string,
  context: { platform: string; topic: string; tone?: string },
) {
  return draftText({
    organizationId,
    system:
      "You are a real estate social media manager. Draft platform-appropriate captions with 1-3 emojis and 3-5 relevant hashtags.",
    prompt: `Platform: ${context.platform}
Topic: ${context.topic}
Tone: ${context.tone ?? "professional, warm"}`,
  });
}

function stubReply(prompt: string): string {
  return `[DRY-RUN AI] Configure OPENAI_API_KEY (or per-org openai_api_key) to enable real generation.\n\nPrompt was:\n${prompt.slice(0, 280)}${prompt.length > 280 ? "…" : ""}`;
}
