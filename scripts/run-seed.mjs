import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import postgres from "postgres";
import { loadDatabaseUrl } from "./load-env.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const SEED_HOSTEL_PASSWORD = "Password123!";
const SEED_ADMIN_PASSWORD = "Admin123!";

const rootDir = root;
const sqlFile = readFileSync(join(rootDir, "scripts/seed.sql"), "utf8");
const url = loadDatabaseUrl();
const isLocal = /localhost|127\.0\.0\.1/i.test(url);
const sql = postgres(url, { ssl: isLocal ? false : "require", max: 1 });

const hostelPasswordHash = bcrypt.hashSync(SEED_HOSTEL_PASSWORD, 10);
const adminPasswordHash = bcrypt.hashSync(SEED_ADMIN_PASSWORD, 10);

const seedSql = sqlFile
  .replace(":hostel_password_hash", `'${hostelPasswordHash.replace(/'/g, "''")}'`)
  .replace(":admin_password_hash", `'${adminPasswordHash.replace(/'/g, "''")}'`);

try {
  await sql.unsafe(seedSql);
  console.log("Seed completed successfully.\n");
  console.log("Dashboard login (hostel account):");
  console.log("  Email:    demo@hostellizer.pk");
  console.log(`  Password: ${SEED_HOSTEL_PASSWORD}`);
  console.log("\nAdmin user record (users table):");
  console.log("  Email:    admin@hostellizer.pk");
  console.log(`  Password: ${SEED_ADMIN_PASSWORD}`);
  console.log("\nSeeded: 1 hostel, 1 admin user, 4 students, 4 expenses, 3 staff (+ attendance & advance)");
} catch (error) {
  console.error("Seed failed:", error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
