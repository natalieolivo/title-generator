export const SEO_RUBRIC = {
  keywordPosition: 25,
  length: 15,
  intentMatch: 25,
  uniqueness: 20,
  clickAppeal: 15,
} as const;

export const MAX_TITLES = 50;
export const MAX_TITLE_LENGTH = 300;
export const MAX_SUBJECT_LENGTH = 200;
export const MAX_KEYWORD_LENGTH = 200;
export const MAX_RATIONALE_LENGTH = 300;

export type SeoCriterion = keyof typeof SEO_RUBRIC;

export const SEO_CRITERIA = Object.keys(SEO_RUBRIC) as SeoCriterion[];

export type SeoCriterionScores = Record<SeoCriterion, number>;

export type ScoredTitle = {
  title: string;
  scores: SeoCriterionScores;
  /** Sum of the clamped criterion scores, 0-100. Computed in code. */
  total: number;
  /** 1 = best among the candidates in the same call. Ties go to the earlier input. */
  rank: number;
  rationale: string;
};

export type ScoreTitlesErrorCode =
  | "refusal"
  | "truncated"
  | "no_content"
  | "invalid_response"
  | "result_mismatch";

export class ScoreTitlesError extends Error {
  readonly code: ScoreTitlesErrorCode;

  constructor(code: ScoreTitlesErrorCode, message: string) {
    super(message);
    this.name = "ScoreTitlesError";
    this.code = code;
  }
}
