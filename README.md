# title-generator

An AI-powered title/headline generator — usable as an importable library or as a standalone CLI. Given a subject (a product, a blog post, an ad, anything that needs a headline), it generates several distinct title variants.

This is a personal portfolio package. **It is not published to npm** — clone it and use it locally, or link it into another project with `npm link`.

## Status

The public API (`generateTitles`, the CLI) is fully implemented. The call to the Anthropic API — `src/providers/anthropic.ts` is an implementation that makes a call with subject, count, and tone inputs. Response is parsed and returns a set of title variants. Everything around it (validation, the CLI, tests) is done and tested against a mocked provider.

## Install

```bash
git clone https://github.com/<you>/title-generator.git
cd title-generator
npm install
npm run build
```

To use it as a CLI from anywhere on your machine:

```bash
npm link
```

To use it as a library in another local project (also not published, so this is a local link, not an npm registry install):

```bash
cd ../title-generator && npm link
cd ../your-other-project && npm link title-generator
```

## Configuration

Set your Anthropic API key before calling `generateTitles` or running the CLI:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

If it's unset, both the library function and the CLI fail fast with a clear error — no silent fallback, no partial request.

## Usage as a library

```ts
import { generateTitles } from "@natalieolivo/title-generator";

const titles = await generateTitles({
  subject: "a productivity app for freelancers",
  count: 5,        // optional, defaults to 4
  tone: "playful",  // optional stylistic hint — see note below
});

console.log(titles);
// [ "...", "...", "...", "...", "..." ]
```

`subject` can be anything that needs a headline: a product, a blog post, an ad, a landing page. `tone` is an optional stylistic hint ("urgent", "playful", "formal", etc.). When you omit it, the provider defaults to generating a mix of angles across the requested titles — benefit-driven, curiosity-driven, social-proof, and urgency — rather than committing to one tone.

Note again: until `src/providers/anthropic.ts` is implemented, calling `generateTitles` will reject with `"TODO: implement generateWithAnthropic"` once past input validation and the API-key check.

## Scoring titles (`scoreTitles`)

`scoreTitles` is a second, separate LLM call that judges candidate titles, so the model that writes titles does not grade them. It sees all candidates at once and ranks them against each other. Call `generateTitles` first, then `scoreTitles`.

```ts
import { generateTitles, scoreTitles, SEO_RUBRIC } from "@natalieolivo/title-generator";

const titles = await generateTitles({ subject: "a productivity app for freelancers" });
const scored = await scoreTitles({
  subject: "a productivity app for freelancers",
  keyword: "freelance productivity app", // optional, defaults to subject
  titles,
});
```

Input: `subject` (string), optional `keyword` (string, defaults to `subject`), `titles` (non-empty `string[]`).

Limits (exported constants): `MAX_TITLES` = 50, `MAX_TITLE_LENGTH` = 300 characters per title, `MAX_SUBJECT_LENGTH` = 200, `MAX_KEYWORD_LENGTH` = 200. Over-limit input throws a plain `Error`.

Output: `ScoredTitle[]`, one per input title in the same order. Each has `title`, `scores` (one integer per criterion), `total` (0-100), `rank` (1 = best among the candidates in this call) and a one-sentence `rationale` (trimmed and capped at `MAX_RATIONALE_LENGTH` = 300 characters).

Scores are an estimate of how a title might perform in search, not real Google data. The model supplies per-criterion scores and a rationale. Scores are clamped to each criterion's range and rounded to integers, `total` is recomputed from them, and `rank` is derived from the totals (ties go to the earlier input title). Results are matched to your input titles by position, after normalizing both sides (Unicode NFKC, curly and straight quotes folded, en and em dashes folded to a hyphen, whitespace collapsed and trimmed, case-insensitive). A reordered response is not accepted. The returned `title` is always your original string, never the model's.

Bad input, over-limit input, or a missing `ANTHROPIC_API_KEY` throws a plain `Error`. Model-side failures throw `ScoreTitlesError` with a `code`: `refusal`, `truncated` (hit `max_tokens` or the context window), `no_content`, `invalid_response`, or `result_mismatch`.

Rubric (`SEO_RUBRIC`, total 100):

| Criterion | Max |
| --- | --- |
| `keywordPosition` | 25 |
| `length` | 15 |
| `intentMatch` | 25 |
| `uniqueness` | 20 |
| `clickAppeal` | 15 |

The CLI does not expose scoring.

## Usage as a CLI

```bash
title-generator "a productivity app for freelancers" --count 5 --tone urgent
```

Each generated title prints on its own line on success. On failure (missing API key, bad input, provider error) it prints a single clear line to stderr and exits with status 1 — no stack trace.

```
title-generator: generateTitles: ANTHROPIC_API_KEY environment variable is not set. Set it before calling generateTitles (e.g. `export ANTHROPIC_API_KEY=sk-ant-...`).
```

## Optional pairing with launch-light

This repo has **zero package dependency on `launch-light`** — there is no such published package, and title-generator does not import or require anything from it or any other local project. This section is just a documented convention for anyone who happens to use both: `generateTitles` returns a plain array of strings, and it's easy to map that into whatever shape a lightweight launch/experimentation tool expects, e.g.:

```ts
const titles = await generateTitles({ subject: "a productivity app for freelancers" });

const variants = titles.map((headline, i) => ({
  id: `variant-${i}`,
  weight: 1 / titles.length,
  payload: { headline },
}));
```

That's a plain object literal recipe, not an integration — copy it, adapt the shape to whatever your experimentation tool actually expects, and move on.

## Development

```bash
npm run dev     # tsup --watch
npm run build   # production build (ESM + CJS + .d.ts for the library, ESM for the CLI)
npm test        # vitest run
```

## License

MIT — see [LICENSE](./LICENSE).
