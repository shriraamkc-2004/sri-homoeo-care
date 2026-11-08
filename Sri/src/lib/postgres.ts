import pg from "pg";

/**
 * Sri Homoeo Care — PostgreSQL pool for Voroa / Neon / Supabase
 * query() accepts MySQL-style "?" placeholders and converts to $1, $2, ...
 */

const { Pool } = pg;

function isProduction(): boolean {
  return (
    process.env["NODE_ENV"] === "production" ||
    process.env["VERCEL"] === "1" ||
    Boolean(process.env["CF_PAGES"])
  );
}

function resolveConnectionString(): string | undefined {
  return (
    process.env["DATABASE_URL"] ||
    process.env["POSTGRES_URL"] ||
    process.env["POSTGRESQL_URL"] ||
    undefined
  );
}

function resolveConfig(): pg.PoolConfig | null {
  const connectionString = resolveConnectionString();
  if (connectionString) return { connectionString };

  const host = process.env["PGHOST"] || process.env["POSTGRES_HOST"] || "localhost";
  const port = Number(process.env["PGPORT"] || process.env["POSTGRES_PORT"] || 5432);
  const user = process.env["PGUSER"] || process.env["POSTGRES_USER"] || "";
  const password = process.env["PGPASSWORD"] || process.env["POSTGRES_PASSWORD"] || "";
  const database = process.env["PGDATABASE"] || process.env["POSTGRES_DB"] || "sri_homoeo_clinic";

  if (isProduction() && (!user || password === "")) {
    return null;
  }

  const cfg: pg.PoolConfig = {
    host,
    port,
    user: user || "postgres",
    password,
    database,
  };

  const useSsl = process.env["PGSSL"] === "true" || process.env["POSTGRES_SSL"] === "true";
  if (useSsl) {
    cfg.ssl = { rejectUnauthorized: process.env["PGSSL_REJECT_UNAUTHORIZED"] !== "false" };
  }

  return cfg;
}

let pool: pg.Pool | null = null;
let isConnected = false;

export function getPool(): pg.Pool {
  if (!pool) {
    const cfg = resolveConfig();
    if (!cfg) {
      throw new Error(
        "[Postgres] Database not configured. Set DATABASE_URL or PGUSER & PGPASSWORD in environment.",
      );
    }
    pool = new Pool({
      ...cfg,
      max: 10,
      idleTimeoutMillis: 60_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return pool;
}

/** Convert `?` placeholders to Postgres `$1..$n` and normalize common MySQL SQL. */
export function toPostgresSql(sql: string): string {
  let i = 0;
  let out = sql.replace(/\?/g, () => `$${++i}`);
  out = out.replace(/IFNULL\s*\(/gi, "COALESCE(");
  out = out.replace(/TIME_FORMAT\s*\(\s*([^,]+),\s*'%H:%i'\s*\)/gi, "to_char($1, 'HH24:MI')");
  out = out.replace(/\bTRUE\b/g, "TRUE");
  out = out.replace(/\bFALSE\b/g, "FALSE");
  // LENGTH works in both; RIGHT/REPLACE are fine in Postgres
  return out;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const text = toPostgresSql(sql);
  try {
    const p = getPool();
    const result = await p.query(text, params);
    return result.rows as T[];
  } catch (error) {
    console.error("[Postgres Query Error]:", error instanceof Error ? error.message : "query failed");
    throw error;
  }
}

export async function testDbConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const p = getPool();
    await p.query("SELECT 1 AS connected");
    isConnected = true;
    return { success: true, message: "Connected to PostgreSQL successfully." };
  } catch (error: unknown) {
    isConnected = false;
    const message = error instanceof Error ? error.message : "Unreachable";
    return { success: false, message: `PostgreSQL Error: ${message}` };
  }
}

// Back-compat aliases used by older imports
export const testMySqlConnection = testDbConnection;
export const getMySqlPool = getPool;
export { isConnected as isDbConnected };
