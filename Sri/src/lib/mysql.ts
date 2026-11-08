import mysql from "mysql2/promise";

/**
 * Sri Homoeo Care — MySQL connection pool
 * Production requires MYSQL_* or DATABASE_URL. Does not default to root with empty password.
 */

export interface MySqlConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

function isProduction(): boolean {
  return (
    process.env["NODE_ENV"] === "production" ||
    process.env["VERCEL"] === "1" ||
    Boolean(process.env["CF_PAGES"])
  );
}

function resolveConfig(): MySqlConfig {
  const host = process.env["MYSQL_HOST"] || process.env["DATABASE_HOST"] || "localhost";
  const port = Number(process.env["MYSQL_PORT"] || process.env["DATABASE_PORT"] || 3306);
  const user = process.env["MYSQL_USER"] || process.env["DATABASE_USER"] || "";
  const password = process.env["MYSQL_PASSWORD"] || process.env["DATABASE_PASSWORD"] || "";
  const database = process.env["MYSQL_DATABASE"] || process.env["DATABASE_NAME"] || "sri_homoeo_clinic";

  if (isProduction()) {
    if (!user || password === undefined || password === null) {
      throw new Error(
        "[MySQL] Production requires MYSQL_USER and MYSQL_PASSWORD (or DATABASE_URL). Refusing unsafe defaults."
      );
    }
    if (user === "root") {
      console.warn("[MySQL] Warning: using root in production is discouraged. Prefer a least-privilege app user.");
    }
  }

  return {
    host,
    port,
    user: user || "sri_app_user",
    password,
    database,
  };
}

const config: MySqlConfig = resolveConfig();

let pool: mysql.Pool | null = null;
let isConnected = false;

export function getMySqlPool(): mysql.Pool {
  if (!pool) {
    const uri = process.env["DATABASE_URL"] || process.env["MYSQL_URL"];
    const poolOptions: mysql.PoolOptions = uri
      ? { uri }
      : {
          host: config.host,
          port: config.port,
          user: config.user,
          password: config.password,
          database: config.database,
        };

    poolOptions.waitForConnections = true;
    poolOptions.connectionLimit = 10;
    poolOptions.maxIdle = 10;
    poolOptions.idleTimeout = 60000;
    poolOptions.enableKeepAlive = true;

    if (process.env["MYSQL_SSL"] === "true") {
      poolOptions.ssl = { rejectUnauthorized: true };
    }

    pool = mysql.createPool(poolOptions);
  }
  return pool;
}

export async function testMySqlConnection(): Promise<{ success: boolean; message: string }> {
  try {
    await getMySqlPool().query("SELECT 1 AS connected");
    isConnected = true;
    return { success: true, message: "Connected to MySQL successfully." };
  } catch (error: unknown) {
    isConnected = false;
    const message = error instanceof Error ? error.message : "Unreachable";
    return { success: false, message: `MySQL Error: ${message}` };
  }
}

export async function query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [results] = await getMySqlPool().execute(sql, params as any);
    return results as T[];
  } catch (error) {
    console.error("[MySQL Query Error]:", error instanceof Error ? error.message : "query failed");
    throw error;
  }
}

export { config as mysqlConfig, isConnected as isMySqlConnected };
