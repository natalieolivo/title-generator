export type ParsedArgs = {
  subject: string;
  count?: number;
  tone?: string;
};

/**
 * Minimal manual argv parser for the title-generator CLI.
 *
 * Usage: title-generator "<subject>" [--count N] [--tone STRING]
 *
 * Pure function — no I/O, no process.exit — so it can be unit tested directly.
 * Throws a plain Error with a clear, user-facing message on any parse failure.
 */
export function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  let count: number | undefined;
  let tone: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--count") {
      const value = argv[++i];
      if (value === undefined) {
        throw new Error("--count requires a value");
      }
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(
          `--count must be a positive integer, received "${value}"`,
        );
      }
      count = parsed;
      continue;
    }

    if (arg === "--tone") {
      const value = argv[++i];
      if (value === undefined) {
        throw new Error("--tone requires a value");
      }
      tone = value;
      continue;
    }

    if (arg !== undefined && arg.startsWith("--")) {
      throw new Error(`Unknown flag: ${arg}`);
    }

    if (arg !== undefined) {
      positionals.push(arg);
    }
  }

  const subject = positionals.join(" ").trim();
  if (subject.length === 0) {
    throw new Error(
      'Missing required argument: <subject>. Usage: title-generator "<subject>" [--count N] [--tone STRING]',
    );
  }

  const result: ParsedArgs = { subject };
  if (count !== undefined) result.count = count;
  if (tone !== undefined) result.tone = tone;
  return result;
}
