# Sri Homoeo Care — Codebase Map (Graphify-style)

## Purpose
Single map so humans and agents do not re-explain the repo.

## Runtime graph
```
Browser / APK / EXE
    → Web (TanStack Start)  Sri/
        → Auth gate (clinic-auth) → role portals
        → Server functions (clinic.functions.ts)
            → PostgreSQL (postgres.ts)  [Voroa DATABASE_URL]
        → Static downloads  public/downloads/*.apk|*.exe
Android  Sri-App/  (Compose UI; talks to same live URL)
Windows  Sri/src/desktop/*.cs  (launches production HTTPS)
```

## Important modules
| Path | Role |
|------|------|
| `Sri/src/lib/postgres.ts` | DB pool + SQL dialect adapter |
| `Sri/src/lib/security.ts` | scrypt passwords |
| `Sri/src/lib/clinic.functions.ts` | Server actions: auth, booking, queue, Rx |
| `Sri/src/lib/clinic-auth.ts` | Client session cache (sanitized) |
| `Sri/src/components/clinic/*` | Portals + landing |
| `Sri/src/routes/api/health.ts` | Uptime probe |
| `Sri/src/lib/sentry.ts` | Optional error tracking |
| `sri_homoeo_clinic_schema_postgres.sql` | Voroa schema |

## Auth model (do not replace casually)
Roles: `patient | doctor | member | admin`  
Passwords: scrypt in Postgres.  
**Clerk** is optional later for social login only — clinic roles stay in Postgres.

## Commands
```bash
cd Sri
pnpm typecheck
pnpm test
pnpm test:e2e          # needs app running
pnpm build && pnpm start
```

## Optional tools
- Graphify CLI: `uv tool install graphifyy` then `graphify extract .`
- Watermelon UI: `npx shadcn@latest add https://registry.watermelon.sh/r/<component>.json`
- Originkit: `npx originkit@latest add <name>` (animated blocks)
- Lighthouse: `pnpm lighthouse` (Chrome required)
