import mysql from "mysql2/promise";

/**
 * Sri Homoeo Care — MySQL Workbench & Database Connection Pool
 * Configured for MySQL 8.0+ / MySQL Workbench
 */

export interface MySqlConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

const config: MySqlConfig = {
  host: process.env["MYSQL_HOST"] || "localhost",
  port: Number(process.env["MYSQL_PORT"] || 3306),
  user: process.env["MYSQL_USER"] || "root",
  password: process.env["MYSQL_PASSWORD"] || "",
  database: process.env["MYSQL_DATABASE"] || "sri_homoeo_clinic",
};

let pool: mysql.Pool | null = null;
let isConnected = false;

export function getMySqlPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }
  return pool;
}

/**
 * Test connectivity to MySQL database server (e.g. MySQL Workbench instance)
 */
export async function testMySqlConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const p = getMySqlPool();
    await p.query("SELECT 1 AS connected");
    isConnected = true;
    return { success: true, message: "Connected to MySQL database successfully." };
  } catch (error: any) {
    isConnected = false;
    return {
      success: false,
      message: `MySQL Connection Error: ${error?.message || "Could not reach MySQL server"}`,
    };
  }
}

/**
 * Helper to execute MySQL queries with error handling
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    const p = getMySqlPool();
    const [results] = await p.execute(sql, params);
    return results as T[];
  } catch (error) {
    console.error("[MySQL Query Error]:", error);
    throw error;
  }
}

export { config as mysqlConfig, isConnected as isMySqlConnected };
