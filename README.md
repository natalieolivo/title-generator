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
import { generateTitles } from "title-generator";

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
