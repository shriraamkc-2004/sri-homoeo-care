/**
 * Compatibility shim — project uses PostgreSQL (Voroa).
 * Prefer importing from "@/lib/postgres".
 */
export {
  query,
  getPool,
  getMySqlPool,
  testDbConnection,
  testMySqlConnection,
  toPostgresSql,
  isDbConnected as isMySqlConnected,
} from "./postgres";
