import { createFileRoute } from "@tanstack/react-router";
import { testMySqlConnection } from "@/lib/mysql";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Route = (createFileRoute as any)("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const started = Date.now();
        let db: { success: boolean; message: string } = {
          success: false,
          message: "not_checked",
        };
        try {
          db = await testMySqlConnection();
        } catch (error) {
          db = {
            success: false,
            message: error instanceof Error ? error.message : "db_error",
          };
        }

        const body = {
          ok: true,
          service: "sri-homoeo-care",
          version: "1.2.0",
          time: new Date().toISOString(),
          uptimeSec: Math.floor(process.uptime()),
          latencyMs: Date.now() - started,
          database: db.success ? "up" : "down",
          databaseDetail: db.message,
        };

        // App is considered alive even if DB is down (so process monitors stay green);
        // status field lets ops distinguish degraded mode.
        const status = db.success ? 200 : 503;
        return new Response(JSON.stringify(body), {
          status,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
