import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const globalForDb = globalThis as typeof globalThis & {
  __hostellizerSql?: ReturnType<typeof postgres>;
};

/** Single shared pool — avoids Neon "max clients reached" when each route created its own `postgres()`. */
export const sql =
  globalForDb.__hostellizerSql ??
  postgres(connectionString, {
    ssl: "require",
    max: 1,
    idle_timeout: 20,
    connect_timeout: 15,
  });

globalForDb.__hostellizerSql = sql;
