import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = readFileSync(join(root, ".env"), "utf8");
const url = env.match(/^DATABASE_URL=(.+)$/m)[1].trim().replace(/^["']|["']$/g, "");
const sql = postgres(url, { ssl: false, max: 1 });

await sql.unsafe(readFileSync(join(root, "scripts/migrate-chats.sql"), "utf8"));
console.log("Chats migration completed.");
await sql.end();
