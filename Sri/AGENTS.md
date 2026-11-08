# Agent notes — Sri Homoeo Care

- Stack: TanStack Start + React + Tailwind + **PostgreSQL** (Voroa-ready)
- Do not reintroduce `@lovable.dev/*` packages or `mysql2`
- DB access: `@/lib/postgres` (`query`, `testDbConnection`)
- Auth: scrypt hashes only (`@/lib/security`)
- Deploy: see `../VOROA_POSTGRES.md` and `../CONTINUOUS_RUN.md`
