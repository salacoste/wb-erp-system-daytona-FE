# Request #179 — Backend `wb_user` Prisma DB credentials failure (production-impact auth blocker)

**Discovered**: Story 119.3-FE Task 1 live-verification attempt — 2026-05-30 11:21-11:22 UTC
**Filed by**: Story 119.3-FE Pass-1 F-5 cross-discovery (per Story 117.2-FE precedent for side-discoveries becoming independent backend tickets — Story 117.2-FE spun off Request #175 for separate by-product/by-query 500s)
**Severity**: **P0 — production blocker** if reproduced on prod env (currently affects local dev env). Every `Authorization: Bearer`-gated endpoint fails when this surfaces because `POST /v1/auth/login` is the gate.
**Status**: PENDING BACKEND
**Related**: Story 119.3-FE (workaround: backend-source-of-truth grep substituted for live verification — see story file § Live Verification Evidence + Request #178)

---

## Problem

`POST /v1/auth/login` returns `INTERNAL_SERVER_ERROR` 500 across all attempts when the backend's Prisma client cannot authenticate against the local Postgres database. PM2 backend error log shows repeated:

```
Authentication failed against database server at `localhost`,
the provided database credentials for `wb_user` are not valid.
```

**Affected**: ALL endpoints requiring authentication (any `Authorization: Bearer` header). Login fails → no JWT obtainable → no session-gated calls possible. The backend HTTP layer responds 200 OK to the unauthenticated build-info endpoint (`GET /v1/meta/version` still works, confirming the Express layer is healthy — the issue is purely Prisma → Postgres connection auth).

## Evidence

### Live capture (2026-05-30, Story 119.3-FE Task 1 attempt)

- Backend build: `build_timestamp 2026-05-30T11:20:44.825Z` (verified via `GET /v1/meta/version`)
- Login attempts: 4 retries, all returned 500
- Trace IDs captured:
  - `e046b919-7a28-42b3-90ef-780ee670722f`
  - `31f00394-be79-408c-b438-4f0ef76ffd83`
  - `180a3c3f-2700-4868-9be0-6377642f6f76`
  - `1ff48345` (truncated)
- Capture window: 11:21-11:22 UTC

### Backend error log location

`/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/logs/pm2-api-error.log` (local dev)

### Reproduction

```bash
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Russia23!"}'
# Returns: {"error":{"code":"INTERNAL_SERVER_ERROR", ...}}
# PM2 log shows the Prisma auth failure
```

---

## Likely root causes (backend to investigate)

1. **Postgres `wb_user` password rotation** without corresponding `DATABASE_URL` / `.env` update in backend deployment
2. **Postgres `pg_hba.conf`** changed authentication method (md5 → scram-sha-256, peer → md5, etc.) without backend Prisma client config update
3. **Postgres role `wb_user` dropped or renamed** without backend migration
4. **DATABASE_URL** env var URL-encoding regression (special chars in password not properly escaped in PM2 ecosystem config)
5. **Postgres server itself** not running at localhost:5432 (would emit different connection error, but worth ruling out)

## Fix request

1. **Investigate Postgres role state**:
   ```bash
   psql -U postgres -c "\du wb_user"
   psql -U postgres -c "SHOW hba_file;"
   ```
2. **Verify DATABASE_URL** in backend env matches the actual `wb_user` credentials
3. **Test Prisma connection** in isolation: `npx prisma db pull` or equivalent connectivity check
4. **Restart backend** via PM2 after credential rotation: `pm2 restart wb-repricer`
5. **Verify auth flow end-to-end** post-fix:
   ```bash
   curl -s -X POST http://localhost:3000/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"Russia23!"}' | jq '.data.access_token // .access_token'
   # Should return a JWT, not 500
   ```

## Acceptance criteria (backend)

1. `POST /v1/auth/login` returns 200 OK with a valid JWT for the test credentials (`test@test.com` / `Russia23!`)
2. `Authorization: Bearer <JWT>` flow works end-to-end against any session-gated endpoint (e.g., `GET /v1/cabinets`)
3. PM2 backend error log shows no further `Authentication failed against database server` entries
4. Root cause documented in this ticket's resolution (which of the 5 likely causes above was the culprit)
5. Add a `/v1/meta/health` check that includes Prisma connectivity status (defense-in-depth: surface this class of failure proactively in the future)

## Frontend posture (current)

- **Story 119.3-FE proceeded via static backend-source-of-truth verification** (stronger evidence than live snapshot — SQL aggregations don't compute the requested field). Live verification was substituted, not skipped. See Story 119.3-FE Dev Agent Record § Live Verification Evidence for full rationale.
- **All future verify-first stories in Epic 119 (119.4 onwards) require this defect resolved** before live verification is possible. If 119.4 is doc-only (Request #177 micro-story per spec), no immediate blocker; if Epic 120 stories require live data, this gates them.
- **Workaround for FE devs**: until resolved, verify-first Tasks should attempt live + fallback to backend-source-of-truth grep + document the blocker in this Request #179.

---

## Cross-references

- **Story 119.3-FE** — `_bmad-output/implementation-artifacts/119-3-fe-search-to-cart-conversion-metric.md` (the story that discovered this defect during its Task 1 live-verification attempt)
- **Request #178** — `docs/request-backend/178-SEARCH-CART-ADDS-ENRICHMENT.md` (Story 119.3-FE's primary deliverable; references this Request #179 as the blocker for live verification)
- **Story 117.2-FE precedent** — `_bmad-output/implementation-artifacts/117-2-fe-search-revenue-metrics.md` (canonical pattern: side-discoveries during verify-first become independent Requests; Request #175 was spun off for separate by-product/by-query 500s)
- **PM2 ecosystem config** — `ecosystem.config.js` (likely env-var location for `DATABASE_URL`)
- **Prisma schema** — `prisma/schema.prisma` (defines the `datasource` block consuming `DATABASE_URL`)
