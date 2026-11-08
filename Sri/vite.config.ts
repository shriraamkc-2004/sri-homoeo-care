import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Voroa / Node continuous hosting
process.env["NITRO_PRESET"] = process.env["NITRO_PRESET"] || "node-server";

export default defineConfig({
  server: {
    port: Number(process.env["PORT"]) || 3000,
    host: true,
  },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      // SSR entry with security headers wrapper
      server: { entry: "server" },
    }),
    viteReact(),
  ],
});
