# Request #166: Acquiring Cost Reports API — WB Finance Integration

**Date:** 2026-04-15
**Source:** WB Dev announcement (2026-04-15) — новые методы отчётов об издержках на приём платежей
**Status:** Open — awaiting backend integration
**Priority:** P2 (new feature, no user-facing blocker)
**Related frontend epic:** Epic 90-FE (proposed — see `_bmad-output/planning-artifacts/epics-90-fe.md`)

---

## Problem / Opportunity

Wildberries released 3 new Finance API endpoints for **acquiring cost reports** (издержки на приём платежей — payment-processing fees the seller pays on card transactions). These costs are currently opaque to sellers in our analytics; integrating them will let us show per-period and per-report payment-acceptance cost data alongside the existing commission/logistics/storage expense breakdown.

**Business value:** Sellers already see WB commission, logistics, and storage as expense lines. Payment-acceptance cost is a fourth material expense that currently lives outside our analytics surface. Adding it closes a blind spot for margin/profit accuracy.

---

## WB API Endpoints (source of truth)

Per the WB announcement (2026-04-15):

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/finance/v1/acquiring/list` | List of acquiring cost reports |
| POST | `/api/finance/v1/acquiring/detailed/{reportId}` | Detail rows for a specific report ID |
| POST | `/api/finance/v1/acquiring/detailed` | Detail rows for a period (cross-report) |

Full docs: https://dev.wildberries.ru/docs/openapi/financial-reports-and-accounting#tag/Finansovye-otchyoty

---

## Backend Team Response

**Status**: RESOLVED
**Resolution date**: 2026-05-03 (confirmed in #169 backend update)
**Summary**: Epic 101 (Acquiring Analytics) implemented 3 endpoints: `GET /v1/analytics/acquiring/reports`, `GET /v1/analytics/acquiring/reports/:id/detail`, `GET /v1/analytics/acquiring/detail`. JWT + CabinetGuard auth, 30-min cache, rate limit resilience with 503 + Retry-After. Frontend Epic 90-FE already integrated.
**Remaining frontend action**: None - already integrated in Epic 90-FE. Note: endpoints are at `/v1/analytics/acquiring/*` (not `/v1/acquiring/*`).
**Note**: All 3 endpoints are `POST` (not GET) — this is the WB convention for report-generation endpoints. Request bodies carry the date-range / filter parameters.

---

## Request to Backend Team

### 1. SDK upgrade check

- Check whether `daytona-wildberries-typescript-sdk` already exposes these 3 methods under `FinancesAPI` / `AcquiringAPI`.
- If NOT exposed: bump SDK to the latest version OR add a thin direct-fetch client as a temporary bridge.
- Report SDK version + method names in the frontend request doc response.

### 2. Frontend-facing backend endpoints

Expose 3 endpoints with **frontend-canonical** snake_case + null-preserving shapes (per the Boundary Normalizer Pattern in `frontend/CLAUDE.md` — new section from Story 88.4-FE):

| Frontend endpoint | Maps to WB endpoint | Auth |
|---|---|---|
| `GET /v1/analytics/acquiring/reports` | `POST /api/finance/v1/acquiring/list` | X-Cabinet-Id header |
| `GET /v1/analytics/acquiring/reports/:id/detail` | `POST /api/finance/v1/acquiring/detailed/{reportId}` | X-Cabinet-Id header |
| `GET /v1/analytics/acquiring/detail?from=...&to=...` | `POST /api/finance/v1/acquiring/detailed` | X-Cabinet-Id header |

**Why GET on the frontend side**: frontend conventions favor GET for read operations; the backend converts to WB's POST internally. Matches the existing pattern for `/v1/analytics/buyout/*`, `/v1/analytics/returns/*`, etc.

### 3. Response shape requirements

- **snake_case fields** (frontend canonical).
- **Preserve null** semantically — if an acquiring report is still being generated, fields like `total_amount` must be `null`, not `0` (per the null-vs-zero invariant documented in CLAUDE.md anti-pattern #8, Story 88.2-FE).
- Include a `cached_at` timestamp per response envelope so frontend can show freshness.

### 4. Caching & rate limits

- Recommend 30 min cache TTL (matches buyout/returns pattern — report data is slow-moving).
- WB rate limits: likely in the "finance" scope (historically ~3-5 req/min). Confirm exact limits from WB docs and surface to frontend via `Retry-After` headers.

### 5. Error handling

- Return 404 when `reportId` doesn't exist.
- Return 503 (not 500) when WB API rate-limits us, with `Retry-After` populated.
- All error bodies follow existing `{ error: { code, message } }` envelope.

### 6. test-api/ examples

Add runnable HTTP examples to `test-api/34-acquiring-analytics.http` (next available number; verify collision with existing test-api files) covering:
- Happy path: fetch report list, then detail by ID, then detail by period.
- Error path: invalid `reportId`, invalid date range.
- Rate-limit simulation.

### 7. Response samples

Please attach 2-3 representative response samples (anonymized) to this doc once the backend spike is complete. Frontend will use these to drive type generation.

---

## Frontend Integration Blockers

Until the 3 `/v1/analytics/acquiring/*` backend endpoints exist, frontend work on Epic 90-FE is blocked (stories are scoped but not implementable). The epic's planning artifact lists the per-story dependencies:

- Story 90.1-FE (Types + API client + hooks) needs the finalized response shapes.
- Stories 90.2–90.4 (UI pages) need the backend endpoints live in staging at minimum.

---

## Open Questions for Backend Team

1. Does the WB SDK already have these methods, or do we need to upgrade?
2. What cache TTL does backend recommend (30 min default OK?)?
3. Will `acquiring_total` aggregate be added to the existing `finance-summary` endpoint, or stays standalone?
4. Does backend want to expose the `reportId` directly to frontend, or abstract it behind a period-based paginated list?

Frontend team's preference on #3: **include `acquiring_total` in `finance-summary`** (so existing expense-breakdown charts get a new "Acquiring" slice for free), AND keep the standalone endpoints for the dedicated Acquiring Reports page.

---

## Timeline

No firm deadline. This is net-new functionality, not a bug fix. Suggest queuing behind current backend priorities. Frontend will NOT begin Story 90.1 until backend confirms response shapes are stable.

---

## Related Docs

- `_bmad-output/planning-artifacts/epics-90-fe.md` — frontend epic scope (NEW, this session)
- `frontend/CLAUDE.md` § Boundary Normalizer Pattern — backend→frontend contract expectations
- `docs/request-backend/151-EPICS-68-71-ANALYTICS-API.md` — reference for similar multi-endpoint integration
- WB source: https://dev.wildberries.ru/docs/openapi/financial-reports-and-accounting
