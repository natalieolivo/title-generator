import Anthropic from "@anthropic-ai/sdk";

export type AnthropicGenerateTitleParams = {
  subject: string;
  count: number;
  tone?: string;
};

const MODEL = "claude-haiku-4-5-20251001";

const TITLES_SCHEMA = {
  type: "object",
  properties: {
    variants: { type: "array", items: { type: "string" } },
  },
  required: ["variants"],
  additionalProperties: false,
} as const;

function isExpectedTitlesPayload(value: unknown): value is { variants: string[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { variants?: unknown }).variants) &&
    (value as { variants: unknown[] }).variants.every(
      (v) => typeof v === "string",
    )
  );
}

/**
 * generateTitles() in ../generateTitles.ts already validates inputs and checks
 * ANTHROPIC_API_KEY before calling this function.
 */
export async function generateWithAnthropic({
  subject,
  count,
  tone,
}: AnthropicGenerateTitleParams): Promise<string[]> {
  const titleCriteriaInstruction = tone
    ? `Use "${tone}" as a stylistic hint for every title.`
    : "Mix criteria across the titles: benefit-driven, curiosity-driven, social-proof, and urgency.";

  const client = new Anthropic();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    output_config: {
      format: { type: "json_schema", schema: TITLES_SCHEMA },
    },
    messages: [
      {
        role: "user",
        content: `Write ${count} distinct titles for "${subject}". ${titleCriteriaInstruction}`,
      },
    ],
  });

  const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === "text");
  if (!textBlock) {
    throw new Error(
      "generateWithAnthropic: response contained no text content block.",
    );
  }

  const parsed: unknown = JSON.parse(textBlock.text);
  if (!isExpectedTitlesPayload(parsed)) {
    throw new Error(
      "generateWithAnthropic: response did not match the expected { variants: string[] } shape.",
    );
  }

  return parsed.variants;
}
