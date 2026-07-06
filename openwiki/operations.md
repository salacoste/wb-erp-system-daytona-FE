# Operations

## PM2 Process Management

All PM2 processes are defined in `ecosystem.config.js`. There are **two app definitions sharing port 3100 — never run both simultaneously**.

| App Name | Mode | Script | Port |
|----------|------|--------|------|
| `wb-repricer-frontend-dev` | Development | `npm run dev` | 3100 |
| `wb-repricer-frontend` | Production | `next start` | 3100 |

**Anti-loop configuration** (both apps):
- `max_restarts: 5` — stops after 5 failures
- `min_uptime: 30s` — process must survive 30s to be considered "stable"
- `restart_delay: 5000` — 5s delay between restart attempts
- `exp_backoff_restart_delay: 100` — exponential backoff
- `kill_timeout: 5000` — 5s graceful shutdown
- Logs: separate error/out files in `./logs/` with timestamps

### Starting via PM2

```bash
# Development
pm2 start ecosystem.config.js --only wb-repricer-frontend-dev

# Production (must build first)
npm run build
pm2 start ecosystem.config.js --only wb-repricer-frontend --env production
```

## PM2 Shell Scripts

### `pm2-safe-restart.sh` — Safe Dev Restart
1. Checks for existing process on port 3100 via `lsof`
2. Kills any process found (`kill -9`)
3. Deletes existing PM2 dev process + `pm2 save --force`
4. Starts fresh: `pm2 start ecosystem.config.js --only wb-repricer-frontend-dev`
5. Shows status and recent logs

### `pm2-switch-dev.sh` — Switch to Development
Requires `jq`. Stops production process if running, then checks dev process status:
- **Not exists** → Start fresh
- **Online** → No-op
- **Stopped** → Start it
- **Errored** → Delete and recreate

### `pm2-switch-prod.sh` — Switch to Production
Most complex script:
1. Stops dev process if running
2. **Pre-build corruption detection**: Checks `.next/` for missing `BUILD_ID`/`build-manifest.json` or error markers → cleans if corrupted
3. Runs `npm run build`, captures output
4. **Post-build error classification**:
   - Corruption signals (`corrupt`, `EISDIR`, `ENOENT`) → Clean `.next`, suggest retry
   - Code/dependency errors (`Module not found`, `Cannot resolve`, `Type error`) → No auto-clean, suggest manual fix
   - Generic errors → Suggest `npm run clean && ./pm2-switch-prod.sh`
5. Starts production: `pm2 start ecosystem.config.js --only wb-repricer-frontend --env production`

## Troubleshooting PM2

See `PM2-TROUBLESHOOTING.md` for full details. Key issue: **runaway restart loops** caused by `EADDRINUSE` on port 3100 → crash → autorestart → repeat → high CPU (documented case: 42,176+ restarts).

### Quick Fixes

```bash
# Stop the runaway process
pm2 stop wb-repricer-frontend-dev
pm2 delete wb-repricer-frontend-dev
pm2 save --force

# Safe restart
./pm2-safe-restart.sh

# Nuclear option (full PM2 reset)
pm2 kill
pm2 flush
# kill anything on port 3100
fuser -k 3100/tcp
pm2 start ecosystem.config.js --only wb-repricer-frontend-dev
```

### Health Check

Verify PM2 status, port availability, and error logs after any restart.

## Deployment Scripts

### `start-fresh-next-dev.mjs`
Safe dev-server start: checks port is free, clears `.next` + `node_modules/.cache`, then spawns `next dev`. Used by `npm run dev:clean` / `npm run restart:safe`.

### Code Quality Scripts (`scripts/`)

| Script | Purpose |
|--------|---------|
| `check-doc-citations.sh` | Validate doc source citations |
| `check-eslint-rules.sh` | Validate ESLint rule configuration |
| `check-max-lines.sh` | Enforce 200-line file limit |
| `check-next-async-params.sh` | Validate Next.js 15 async params |
| `check-locale-percent.sh` | Russian-locale percent format ratchet |
| `check-fix-propagation.sh` | Check fix propagation |
| `count-test-changes.sh` | Count test changes |

## CI/CD

CI runs on a **self-hosted VPS** (2 vCPU / 2 GB RAM + 2 GB swap). The quality pipeline runs sequentially to avoid memory exhaustion. See [testing.md](testing.md) for pipeline details.

OpenWiki documentation auto-updates daily via `openwiki-update.yml` (cron 09:00 UTC) using z.ai GLM 5.2.
