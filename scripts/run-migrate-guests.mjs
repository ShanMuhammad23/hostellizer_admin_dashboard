import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { loadDatabaseUrl } from "./load-env.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = loadDatabaseUrl();
const isLocal = /localhost|127\.0\.0\.1/i.test(url);
const sql = postgres(url, { ssl: isLocal ? false : "require", max: 1 });

await sql.unsafe(readFileSync(join(root, "scripts/migrate-guests.sql"), "utf8"));
console.log("Guest visits migration completed.");
await sql.end();
