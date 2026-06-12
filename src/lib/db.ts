import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const isLocalDb =
  /localhost|127\.0\.0\.1/i.test(connectionString) ||
  process.env.DATABASE_SSL === "false";

const globalForDb = globalThis as typeof globalThis & {
  __hostellizerSql?: ReturnType<typeof postgres>;
};

export const sql =
  globalForDb.__hostellizerSql ??
  postgres(connectionString, {
    ssl: isLocalDb ? false : "require",
    max: 1,
    idle_timeout: 20,
    connect_timeout: 15,
  });

globalForDb.__hostellizerSql = sql;
