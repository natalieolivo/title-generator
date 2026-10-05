import { generateTitles } from "../src/generateTitles.js";
import { parseArgs } from "../src/cli/parseArgs.js";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const titles = await generateTitles({
    subject: args.subject,
    ...(args.count !== undefined ? { count: args.count } : {}),
    ...(args.tone !== undefined ? { tone: args.tone } : {}),
  });

  for (const title of titles) {
    console.log(title);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`title-generator: ${message}`);
  process.exit(1);
});
