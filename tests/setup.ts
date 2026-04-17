import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

/** Match CLI env loading so integration tests see OPENAI_API_KEY from .env.local */
const root = process.cwd();
for (const name of [".env.local", ".env"]) {
  const p = resolve(root, name);
  if (existsSync(p)) {
    config({ path: p });
  }
}
