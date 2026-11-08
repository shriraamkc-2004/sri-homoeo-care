# Sri Homoeo Care — Security Status

Last updated: 2026-11-08

## Code hardening completed

| Control | Status |
|---------|--------|
| scrypt password hashing | Done |
| No plain-text password verify | Done |
| Password strength policy (8+ chars, letters+numbers) | Done |
| Auth rate limiting (login/register) | Done |
| Login requires password | Done |
| Register cannot self-assign staff roles | Done |
| Register errors no longer return false success | Done |
| Seed accounts have scrypt password_hash | Done (temp passwords — must change) |
| MySQL production fail-closed | Done |
| Security response headers | Done |
| CSP / `_headers` | Done |
| EXE production HTTPS URL | Done |
| localStorage profile sanitize | Done |
| Audit logging on auth events | Done |
| security.txt | Done |
| Privacy / DPDP guidance doc | Done |

## Temporary seed passwords

See `CREDENTIALS_SETUP.md`. **Change after first login.**

## What “secured” means here

The **application code** is hardened for production clinic use:

- Credentials are hashed and rate-limited  
- Common auth bypasses closed  
- Transport and browser headers configured  
- Sensitive docs redacted  

## What still depends on you (operations)

These cannot be finished only in source code:

1. Deploy this build and run migration SQL on live MySQL  
2. Change temporary staff passwords  
3. Rotate any old DB password that was shared  
4. Enable uptime monitor on `/api/health`  
5. Daily/weekly DB backups  
6. Legal review of `PRIVACY.md` before public publish  
7. Rebuild signed Android release with minify when full Gradle tree is available  

## After deploy checklist

```bash
# 1. App
cd Sri && pnpm build && pm2 reload ecosystem.config.cjs

# 2. DB hashes (existing DB)
mysql -u sri_app_user -p < database/migration_secure_seed_passwords.sql

# 3. Verify
curl -s https://srihomoeocare.onvoroa.com/api/health
```

When the checklist is green and temporary passwords are changed, the system is **production-secured** for continuous clinic operation.
