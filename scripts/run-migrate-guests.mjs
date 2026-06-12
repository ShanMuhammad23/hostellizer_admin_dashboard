import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = readFileSync(join(root, ".env"), "utf8");
const url = env.match(/^DATABASE_URL=(.+)$/m)[1].trim().replace(/^["']|["']$/g, "");
const isLocal = /localhost|127\.0\.0\.1/i.test(url);
const sql = postgres(url, { ssl: isLocal ? false : "require", max: 1 });

await sql.unsafe(readFileSync(join(root, "scripts/migrate-guests.sql"), "utf8"));
console.log("Guest visits migration completed.");
await sql.end();
