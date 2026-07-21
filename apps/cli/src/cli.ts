import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runAgent } from "@brian-code/agent";

const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
config({ path: resolve(repoRoot, ".env") });

const prompt = process.argv.slice(2).join(" ").trim();

if (!prompt) {
  console.error('Usage: npm run agent -- "<prompt>"');
  process.exit(1);
}

console.log(`[cli] prompt: ${prompt}\n`);

try {
  const text = await runAgent(prompt);
  console.log("\n--- Response ---\n");
  console.log(text);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[cli] error: ${message}`);
  process.exit(1);
}
