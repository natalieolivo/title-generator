import { scoreWithAnthropic } from "./providers/anthropicScore.js";
import {
  MAX_KEYWORD_LENGTH,
  MAX_RATIONALE_LENGTH,
  MAX_SUBJECT_LENGTH,
  MAX_TITLES,
  MAX_TITLE_LENGTH,
  SEO_CRITERIA,
  SEO_RUBRIC,
  ScoreTitlesError,
  type ScoredTitle,
  type SeoCriterionScores,
} from "./scoreTypes.js";

export type ScoreTitlesParams = {
  /** The thing the titles are for, same meaning as in generateTitles. */
  subject: string;
  /** Target search keyword. Defaults to `subject`. */
  keyword?: string;
  /** Candidate titles, e.g. the output of generateTitles. */
  titles: string[];
};

function clampScore(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(max, Math.max(0, Math.round(value)));
}

function normalizeTitle(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Score candidate titles with a separate LLM call from generation. Scores are
 * an estimate, not real search data. Totals and ranks are computed here, never
 * taken from the model. Results are in input order.
 *
 * @throws {Error} on invalid input or a missing `ANTHROPIC_API_KEY`.
 * @throws {ScoreTitlesError} on refusal, truncation, or a response that does
 *   not match the input titles.
 */
export async function scoreTitles({
  subject,
  keyword,
  titles,
}: ScoreTitlesParams): Promise<ScoredTitle[]> {
  if (typeof subject !== "string" || subject.trim().length === 0) {
    throw new Error("scoreTitles: `subject` must be a non-empty string.");
  }

  if (subject.length > MAX_SUBJECT_LENGTH) {
    throw new Error(`scoreTitles: \`subject\` must be at most ${MAX_SUBJECT_LENGTH} characters.`);
  }

  if (keyword !== undefined && (typeof keyword !== "string" || keyword.trim().length === 0)) {
    throw new Error("scoreTitles: `keyword` must be a non-empty string when provided.");
  }

  if (
    !Array.isArray(titles) ||
    titles.length === 0 ||
    !titles.every((t) => typeof t === "string" && t.trim().length > 0)
  ) {
    throw new Error("scoreTitles: `titles` must be a non-empty array of non-empty strings.");
  }

  if (keyword !== undefined && keyword.length > MAX_KEYWORD_LENGTH) {
    throw new Error(`scoreTitles: \`keyword\` must be at most ${MAX_KEYWORD_LENGTH} characters.`);
  }

  if (titles.length > MAX_TITLES) {
    throw new Error(`scoreTitles: \`titles\` must contain at most ${MAX_TITLES} titles.`);
  }

  if (titles.some((t) => t.length > MAX_TITLE_LENGTH)) {
    throw new Error(`scoreTitles: each title must be at most ${MAX_TITLE_LENGTH} characters.`);
  }

  if (!process.env["ANTHROPIC_API_KEY"]) {
    throw new Error(
      "scoreTitles: ANTHROPIC_API_KEY environment variable is not set. " +
        "Set it before calling scoreTitles (e.g. `export ANTHROPIC_API_KEY=sk-ant-...`).",
    );
  }

  const raw = await scoreWithAnthropic({
    subject,
    keyword: keyword ?? subject,
    titles,
  });

  if (raw.length !== titles.length) {
    throw new ScoreTitlesError(
      "result_mismatch",
      `scoreTitles: expected ${titles.length} results but the model returned ${raw.length}.`,
    );
  }

  const scored = titles.map((title, i) => {
    const item = raw[i]!;
    if (normalizeTitle(item.title) !== normalizeTitle(title)) {
      throw new ScoreTitlesError(
        "result_mismatch",
        `scoreTitles: result at position ${i} (of ${titles.length}) does not match the input title at that position.`,
      );
    }

    const scores = {} as SeoCriterionScores;
    let total = 0;
    for (const name of SEO_CRITERIA) {
      scores[name] = clampScore(item.scores[name] as number, SEO_RUBRIC[name]);
      total += scores[name];
    }
    return { title, scores, total, rationale: item.rationale.trim().slice(0, MAX_RATIONALE_LENGTH) };
  });

  const order = scored
    .map((s, i) => ({ total: s.total, i }))
    .sort((a, b) => b.total - a.total || a.i - b.i);
  const ranks = new Array<number>(scored.length);
  order.forEach((entry, position) => {
    ranks[entry.i] = position + 1;
  });

  return scored.map((s, i) => ({ ...s, rank: ranks[i]! }));
}
