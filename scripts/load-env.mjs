import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");

export function loadDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim().replace(/^["']|["']$/g, "");
  }

  if (!existsSync(envPath)) {
    throw new Error(
      `Missing .env at ${envPath}. Create it with DATABASE_URL=postgresql://...`
    );
  }

  const { size } = statSync(envPath);
  if (size === 0) {
    throw new Error(
      `.env exists but is empty (0 bytes). Save the file in your editor (Ctrl+S) — unsaved buffer content is not visible to Node scripts.`
    );
  }

  const env = readFileSync(envPath, "utf8").replace(/^\uFEFF/, "");
  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (trimmed.startsWith("DATABASE_URL=")) {
      const value = trimmed.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
      if (!value) {
        throw new Error("DATABASE_URL is set in .env but has no value.");
      }
      return value;
    }
  }

  throw new Error(
    `DATABASE_URL not found in ${envPath}. Add a line: DATABASE_URL=postgresql://user:pass@localhost:5432/dbname`
  );
}
