# Deploy Sri Homoeo Care on Voroa (PostgreSQL)

## 1. Create free Postgres on Voroa
1. Open Voroa dashboard → **Databases** → **PostgreSQL**
2. Create free/nano size DB in Mumbai
3. Copy **connection URL** (DATABASE_URL)

## 2. Load schema
In Voroa SQL console (or `psql`):

```bash
psql "$DATABASE_URL" -f sri_homoeo_clinic_schema_postgres.sql
```

## 3. App environment on Voroa service
```
DATABASE_URL=<paste from Voroa>
NODE_ENV=production
NITRO_PRESET=node-server
PORT=3000
```

## 4. Build & start
```
pnpm install
pnpm build
pnpm start
```

Or PM2: `pnpm pm2:start`

## 5. Health
`GET /api/health` should show `"engine":"postgresql"` and `"database":"up"`.

## Temporary staff passwords
See CREDENTIALS_SETUP.md — change after first login.

## Notes
- MySQL was removed; app uses `pg` only.
- Lovable vite config removed; standard Vite + TanStack Start.
- Free Voroa hours are shared by app + database (~750 h/month).
