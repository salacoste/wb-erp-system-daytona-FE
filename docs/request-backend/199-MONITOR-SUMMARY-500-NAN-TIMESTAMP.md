# #199 — Monitor /summary 500: "invalid input syntax for type timestamp: NaN-NaN-NaN"

**Status**: RESOLVED (2026-06-06) — Fixed in monitor-summary.service.ts: getMoscowDate now uses toLocaleDateString('en-CA') for clean YYYY-MM-DD parsing.
**Reported**: 2026-06-03 (iter-76 validation loop)
**Page**: `/monitor` (Epic 92-FE business KPI dashboard)
**Severity**: CRITICAL (the entire Monitor page blanks — `useMonitorSummary` is the page's primary data source)
**Frontend status**: FE behaves correctly — on a 500 with no cached data it renders the destructive Alert ("Не удалось загрузить метрики монитора"). The 500 is server-side; the FE sends only `cabinetId`.

---

## Problem

`GET /v1/analytics/monitor/summary?cabinetId=<uuid>` returns **HTTP 500** (3/3 reproductions). Backend error log:

```
Raw query failed. Code: 22007 ... invalid input syntax for type timestamp: "NaN-NaN-NaN"
```

The backend constructs a SQL timestamp from date parts that resolve to `NaN`, producing the literal string `"NaN-NaN-NaN"` which Postgres rejects (SQLSTATE 22007). Because the FE request carries **only** `cabinetId` (no date params — confirmed in `MonitorPageContent.tsx` / `monitor-summary.ts`), the NaN originates entirely in backend date-derivation (likely a "current week" / period computation that divides or parses an empty/undefined value).

This is the PRIMARY hook for the Monitor page, so its failure hides everything: KPI cards, the metrics table, the weekly chart, the buyout gauge, and pipeline health (the supplementary hooks degrade gracefully per Multi-Source Pattern 1, but the primary blanks the page by design).

## Ask

1. Fix the date-part derivation in the `monitor/summary` query so it never yields `NaN` (guard the period/week computation; default to the latest completed week when no range is supplied).
2. Return a proper empty/zero summary (HTTP 200) for a cabinet with no data rather than 500.

## Reproduction

```bash
TOKEN=...  # from e2e/.auth/user.json
CAB=f75836f7-c0bc-4b2c-823c-a1f3508cce8e
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" -H "X-Cabinet-Id: $CAB" \
  "http://localhost:3000/v1/analytics/monitor/summary?cabinetId=$CAB"
# → 500  (backend log: invalid input syntax for type timestamp: "NaN-NaN-NaN")
```

## Frontend disposition

No FE change — the Monitor page's state machine correctly surfaces the error (it does NOT fabricate data). Once the backend returns 200 (with real or empty data), the page renders without further FE work. (Distinct from #187 recovery-status, which is already FE-hardened + shipped.)
