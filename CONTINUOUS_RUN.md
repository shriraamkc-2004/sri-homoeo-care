# Keep Sri Homoeo Care Running Continuously

Your live site: **https://srihomoeocare.onvoroa.com/**

Goal: web app + MySQL stay available 24/7 with auto-restart and health checks.

---

## 1. What must stay online

| Piece | Role |
|-------|------|
| **Web process** (Node `.output/server`) | Serves site + API / portals |
| **MySQL** | Profiles, appointments, prescriptions |
| **HTTPS edge** (Cloudflare / Onvoroa) | TLS, CDN, optional health routing |
| **APK / EXE** | Clients only — they call the live URL; no server process of their own |

---

## 2. Recommended production loop

```bash
cd Sri
cp .env.example .env          # set real MYSQL_* secrets once
pnpm install --frozen-lockfile
pnpm build
pnpm pm2:start                # or: pm2 start ecosystem.config.cjs
pm2 save
pm2 startup                   # enable start on server reboot
```

Useful commands:

```bash
pnpm pm2:logs
pnpm pm2:reload               # zero-ish downtime reload after rebuild
pnpm health                   # local health JSON check
curl -s https://srihomoeocare.onvoroa.com/api/health
```

---

## 3. Health endpoint

After deploy, this URL should respond:

`GET /api/health`

Example healthy response:

```json
{
  "ok": true,
  "service": "sri-homoeo-care",
  "version": "1.2.0",
  "database": "up",
  "uptimeSec": 3600
}
```

- **200** = app + DB OK  
- **503** = app up, DB down (degraded)  
- **timeout / connection error** = process or host down  

Point an uptime monitor (UptimeRobot, Better Stack, Cloudflare Health Checks) at `/api/health` every 1–5 minutes.

---

## 4. If you use Onvoroa / a managed host

1. Set environment variables in the host dashboard (`MYSQL_*`, `NODE_ENV=production`).
2. Build command: `pnpm install && pnpm build`
3. Start command: `pnpm start` (or PM2 if the host allows long-running Node).
4. Enable **auto-restart** / always-on if the panel has it.
5. Keep Cloudflare **proxy ON** for HTTPS and DDoS protection.

---

## 5. MySQL continuous availability

- Run MySQL as a service (`systemctl enable mysql` on VPS).
- Or use managed MySQL (RDS, PlanetScale, Railway, etc.) so backups and failover are handled.
- App pool settings already use keep-alive + limited connections (`mysql.ts`).
- Take daily backups:

```bash
mysqldump -u sri_app_user -p sri_homoeo_clinic > backup-$(date +%F).sql
```

---

## 6. Windows EXE & Android APK

- Rebuild EXE so it opens **https://srihomoeocare.onvoroa.com/?portal=true** (already set in source).
- APK should call the same production API/URL — no local server required on the phone.
- Users only need the store/sideload install once; continuous run is entirely on the server side.

---

## 7. Minimal ops checklist (weekly)

- [ ] `curl https://srihomoeocare.onvoroa.com/api/health` → 200 + `"database":"up"`
- [ ] PM2 / host shows process online
- [ ] Disk not full; logs rotated
- [ ] MySQL backup exists
- [ ] TLS certificate valid (Cloudflare usually handles this)

---

## 8. Incident quick actions

| Symptom | Action |
|---------|--------|
| Site down | `pm2 restart sri-homoeo-care` or host “Restart app” |
| Health 503 | Check MySQL service + env credentials |
| High memory | `pm2 reload`; review max_memory_restart in ecosystem file |
| After code update | `pnpm build && pm2 reload ecosystem.config.cjs` |

---

## Summary

**Continuous run = managed Node process (PM2/host) + always-on MySQL + health monitor + Cloudflare HTTPS.**  
APK/EXE are clients; keep the **web + database** alive and the product stays available.
