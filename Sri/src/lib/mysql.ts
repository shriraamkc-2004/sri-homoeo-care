import mysql from "mysql2/promise";

/**
 * Sri Homoeo Care — High-Performance Minimal MySQL Connection Pool (Ponytail Optimized)
 */

export interface MySqlConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

const config: MySqlConfig = {
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "sri_homoeo_clinic",
};

let pool: mysql.Pool | null = null;
let isConnected = false;

export function getMySqlPool(): mysql.Pool {
  if (!pool) {
    const uri = process.env.DATABASE_URL || process.env.MYSQL_URL;
    pool = mysql.createPool({
      ...(uri ? { uri } : config),
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      enableKeepAlive: true,
      ssl: process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: true } : undefined,
    });
  }
  return pool;
}

export async function testMySqlConnection(): Promise<{ success: boolean; message: string }> {
  try {
    await getMySqlPool().query("SELECT 1 AS connected");
    isConnected = true;
    return { success: true, message: "Connected to MySQL successfully." };
  } catch (error: any) {
    isConnected = false;
    return { success: false, message: `MySQL Error: ${error?.message || "Unreachable"}` };
  }
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    const [results] = await getMySqlPool().execute(sql, params);
    return results as T[];
  } catch (error) {
    console.error("[MySQL Query Error]:", error);
    throw error;
  }
}

export { config as mysqlConfig, isConnected as isMySqlConnected };
