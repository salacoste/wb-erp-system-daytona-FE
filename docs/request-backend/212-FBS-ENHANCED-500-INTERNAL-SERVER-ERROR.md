# 212 — FBS Enhanced analytics: `GET /v1/analytics/fbs/enhanced` → 500 (whole page dead)

**Status**: ✅ RESOLVED — fixed + verified live 2026-06-25.
**Severity**: HIGH — the entire `/analytics/fbs-enhanced` page is unusable («Не удалось загрузить данные»)
**Found**: `/loop` UX validation (iter-2/3, 2026-06-24), Playwright dwell-probe against live app :3100 ↔ backend :3000
**Endpoint**: `GET /v1/analytics/fbs/enhanced?from=2026-05-26&to=2026-06-24`
**Related**: #202 (FBS-ENHANCED-CONTRACT-MISMATCH — ✅ DELIVERED, added FE-compat aliases; this 500 may be a regression introduced by that alias code path or a separate failure — verify)

## Problem

`GET /v1/analytics/fbs/enhanced?from=2026-05-26&to=2026-06-24` returns **500 Internal Server Error** for cabinet `f75836f7-c0bc-4b2c-823c-a1f3508cce8e` (test user `<test-user-email>`). The frontend degrades gracefully (shows «Не удалось загрузить данные») but the page is otherwise blank — all 5 sections (orderStats, stockAnalytics, regionalData, calculatedMetrics, funnelData) fail to render.

Sibling endpoints called from the same page all return **200**:

- `/v1/cabinets/{id}/token-status` 200
- `/v1/cabinets/{id}/seller-info` 200
- `/v1/analytics/supply-planning` 200
- `/v1/cabinets/{id}/jam-status` 200

Only `/v1/analytics/fbs/enhanced` 500s.

## Root Cause

Unknown — the structured response gives no `details[]`. Backend logs carry the trace; the stack was not surfaced in the response body.

**Response body:**

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Internal server error",
    "details": [],
    "trace_id": "9a7db6a6-90ea-4795-afdf-f4c6f44e26eb",
    "timestamp": "2026-06-24T14:16:18.088Z",
    "path": "/v1/analytics/fbs/enhanced?from=2026-05-26&to=2026-06-24"
  }
}
```

**Backend log confirms** (pm2 `wb-repricer`):

```
[2026-06-24 17:16:18.088 +0300] ERROR: 9a7db6a6-… f75836f7-… - Unhandled exception
  url: "/v1/analytics/fbs/enhanced?from=2026-05-26&to=2026-06-24"
  error_code: "INTERNAL_SERVER_ERROR"
  trace_id: "9a7db6a6-90ea-4795-afdf-f4c6f44e26eb"
```

## Impact

- `/analytics/fbs-enhanced` («Расширенная аналитика FBS») is completely broken for the test cabinet — a whole sidebar route returns no data.
- Operations manager persona loses the FBS warehouse overview (orders/stock/regional/funnel) — directly supports the user-reported symptom «данные не всегда подгружаются».
- If this 500 reproduces on production cabinets (not just the seed test cabinet), it blocks a shipped analytics section.

## Reproduction

1. Login with a seeded test user (`<test-user-email>` / `<redacted-password>`) → cabinet auto-selected.
2. `GET http://localhost:3000/v1/analytics/fbs/enhanced?from=2026-05-26&to=2026-06-24` with `Authorization: Bearer <jwt>` + `X-Cabinet-Id: f75836f7-c0bc-4b2c-823c-a1f3508cce8e`.
3. Observe 500. Open `/analytics/fbs-enhanced` in the app → «Не удалось загрузить данные».

Reproduced 3× across two separate validation probes on 2026-06-24.

## Fix Scope (backend)

1. Look up trace_id `9a7db6a6-90ea-4795-afdf-f4c6f44e26eb` in backend logs for the unhandled exception stack.
2. Investigate `FbsEnhancedAnalyticsController` / the service building the `fbs/enhanced` response — check whether the #202 FE-compat aliasing code (`…controller.ts:230-298`) throws on this cabinet's data shape (e.g. a field that is null/undefined where the alias mapper dereferences it).
3. Add a guard + a regression test that hits `fbs/enhanced` with the test cabinet's actual data and asserts 200.

## Resolution

**FIXED — 2026-06-25.** Root cause: `TypeError: result.cachedAt?.toISOString is not a function`
at `FbsEnhancedAnalyticsController.getEnhancedAnalytics`. The endpoint is **intermittent** —
500 only on a **Redis cache hit**: the service `getFromCache` does `JSON.parse(cached) as
{ cachedAt?: Date }`, a type-lie (JSON round-trip turns `cachedAt` + `sources[].fetchedAt`
into **strings**). `?.toISOString()` guards null/undefined, not string → throws on cache hit
(cache miss returned a real `Date` → 200, masking the bug on first load).

**Fix:**
- `fbs-enhanced-analytics.controller.ts` — added `toIsoSafe(value, fallback?)` that coerces
  `string|Date|garbage` → ISO via `new Date(...)` + `isNaN(getTime())` guard, applied to both
  `cachedAt` and `sources[].recordedAt` (the latter falls back to `now`, never 500).
- `fbs-analytics-aggregation.service.ts` — `getFromCache` now rehydrates `cachedAt` to a real
  `Date` (the field it owns) + a comment flagging `sources[].fetchedAt` stays a string.

**Live-verified:** 3 consecutive requests all **HTTP 200** (incl. cache-hit attempts 2 & 3
that previously 500'd); `cachedAt`/`generatedAt`/`sources[0].recordedAt` are valid ISO strings.

**QA gate:** tsc/ESLint clean; analytics sweep 128 suites / 2726 tests green; 3 controller
unit tests (string cachedAt, real Date, malformed/missing fetchedAt); 1-pass fresh-context
review (all findings closed).

**Follow-up (out of scope):** `task-idempotency.service.ts:174` has the same `new Date(result.cachedAt)`
pattern, but it's try/catch-wrapped (blast radius = silently-dropped idempotency cache, not a 500) —
harden opportunistically.
