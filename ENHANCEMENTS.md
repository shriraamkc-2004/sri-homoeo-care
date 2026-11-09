# Project enhancements from recommended stack

| Problem | Tool | What we did |
|---------|------|-------------|
| Vibe UI | Watermelon / Originkit patterns | Premium motion utilities + CSS (`components/premium/motion.tsx`); install extra blocks via registries when needed |
| Untested site | Playwright | `e2e/smoke.spec.ts` + `playwright.config.ts` |
| Slow site | Lighthouse scripts | `pnpm lighthouse` script; keep bundle lean (Sentry lazy-loaded) |
| Auth | Clerk vs clinic auth | **Kept clinic Postgres auth** (roles required). Clerk can be added later as optional IdP |
| Bugs | TypeScript + Sentry | Strict `tsconfig`; `@sentry/react` when `VITE_SENTRY_DSN` set |
| Re-explain code | Graphify-style map | `CODEBASE_MAP.md` |

## Env additions
```env
VITE_SENTRY_DSN=
SENTRY_DSN=
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000
```

## Clerk note
Full Clerk replacement would remove doctor/member/admin portal identity tied to `profiles.role`.  
Recommended path: keep current auth; optionally add Clerk only for patient social login and map `clerkUserId → profiles.id`.
