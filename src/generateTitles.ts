import { generateWithAnthropic } from "./providers/anthropic.js";

export type GenerateTitlesParams = {
  /** The thing to generate titles for — a product, blog post, ad, etc. */
  subject: string;
  /** Number of distinct titles to generate. Defaults to 4. */
  count?: number;
  /**
   * Optional stylistic hint (e.g. "urgent", "playful"). When omitted, the
   * provider defaults to a mix of benefit/curiosity/social-proof/urgency
   * angles — see providers/anthropic.ts for details.
   */
  tone?: string;
};

/**
 * Generate title/headline variants for a given subject using the configured
 * AI provider (currently Anthropic's Claude API).
 *
 * Validates input, confirms an API key is configured, then delegates the
 * actual generation to `generateWithAnthropic`.
 *
 * @throws {Error} if `subject` is empty, `count` is not a positive integer,
 *   or `ANTHROPIC_API_KEY` is not set.
 */
export async function generateTitles({
  subject,
  count = 4,
  tone,
}: GenerateTitlesParams): Promise<string[]> {
  if (typeof subject !== "string" || subject.trim().length === 0) {
    throw new Error(
      "generateTitles: `subject` must be a non-empty string.",
    );
  }

  if (!Number.isInteger(count) || count <= 0) {
    throw new Error(
      `generateTitles: \`count\` must be a positive integer, received ${JSON.stringify(count)}.`,
    );
  }

  if (!process.env["ANTHROPIC_API_KEY"]) {
    throw new Error(
      "generateTitles: ANTHROPIC_API_KEY environment variable is not set. " +
        "Set it before calling generateTitles (e.g. `export ANTHROPIC_API_KEY=sk-ant-...`).",
    );
  }

  return generateWithAnthropic({ subject, count, tone });
}
