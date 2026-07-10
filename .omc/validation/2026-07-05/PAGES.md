# Full-Page Validation Tracker — 2026-07-05

> Companion to `docs/VALIDATION-PLAN.md` §7 + `REPORT.md`. Goal: every user-facing page validated for **functionality** (interactive elements — filters, tabs, toggles, buttons, mutations) **+ data correctness** (numbers match their API source, AP#8 runtime, no fabrication, labels honest). One doc per page under `pages/<slug>.md`; BE-owned bugs funnel to `BE-BUGS.md`.

**Stack:** FE `:3100`, BE `:3000`, JWT `/tmp/feval-token`, cabinet `/tmp/feval-cab` (`f75836f7-…`). Creds `test@test.com`/`Russia23!`. Latest week **W26** (06-22→06-28). Re-login if token expires.
**Concurrency:** ≤2 sub-agents per wave.

## Per-page doc template (`pages/<slug>.md`)
```
# <route> — <title>
**Route:** /… · **Filters state:** (week=W26 / tab / sort / search)
## 1. Load — HTTP statusMap of /v1/ calls; main renders (rows/₽/skeleton resolve)? console errors?
## 2. Interactive elements — each filter/tab/button/toggle/mutation: action → effect (URL? data reload? toast?). Pass/fail.
## 3. Data vs API — for each shown number: rendered value == API field (post-format)? table of value/api/✅/⚠️/❌.
## 4. AP#8 runtime — null money/ratio renders «—» not 0/0%? fabricated numbers?
## 5. Findings — FE (`BD-*`) / BE (`BE-*` in BE-BUGS.md`) / none. Severity + evidence (file:line / API field).
```

## Inventory + status (✅ validated · 🔄 in-wave · ⬜ pending · ➖ out-of-scope/P0-done)

### P0 financial — DONE (see REPORT.md)
- ✅ /dashboard · ✅ /analytics/sku · ✅ /analytics/brand · ✅ /analytics/category · ✅ /analytics/advertising · ✅ /analytics/orders · ✅ /analytics/unit-economics · ✅ /analytics/liquidity

### Wave 1
**Cluster A — COGS/Products:**
- ⬜ /cogs · ⬜ /cogs/bulk · ⬜ /cogs/history · ⬜ /cogs/price-calculator · ⬜ /products
**Cluster B — Orders/Supplies/Shipments:**
- ⬜ /orders (new actions deep-check) · ⬜ /orders/fbo · ⬜ /orders/integrity · ⬜ /supplies · ⬜ /supplies/[id] (acceptance-act) · ⬜ /shipments · ⬜ /shipments/[id] · ⬜ /shipments/box-types · ⬜ /shipments/sku-packaging

### Wave 2
**Cluster C — Analytics inventory/ops:**
- ✅ /analytics/storage · ✅ /analytics/supply-planning · ✅ /analytics/reorder · ✅ /analytics/fbs-stock · ✅ /analytics/fbs-enhanced · ⬜ /analytics/funnel · ⬜ /analytics/buyout · ⬜ /analytics/buyout-reconciliation · ⬜ /analytics/returns
**Cluster D — Analytics commercial/AI + new:**
- ✅ /analytics/acquiring (+/period, /reports/[id]) · ✅ /analytics/search (Jam-gated) · ✅ /analytics/cross-reference (Jam-gated) · ✅ /analytics/forecast · ✅ /analytics/forecast-accuracy · ✅ /analytics/pricing · ✅ /analytics/product/[nmId] · ✅ /analytics/brand-share (new)

### Wave 3
**Cluster E — AI-admin + misc analytics:**
- ⬜ /analytics/models (+[id]/evaluations, /performance, /sku-accuracy) · ⬜ /analytics/ai-admin/models · ⬜ /analytics/ai-admin/preferences · ⬜ /analytics/ai-admin/anomalies · ⬜ /analytics/dashboard (Сводка) · ⬜ /analytics (root) · ⬜ /analytics/alerts · ⬜ /analytics/gaps · ⬜ /analytics/finance-history · ⬜ /analytics/time-period
**Cluster F — Settings/Monitoring/Auth/Onboarding + new:**
- ⬜ /settings · ⬜ /settings/cabinet · ⬜ /settings/expenses · ⬜ /settings/notifications · ⬜ /settings/tariffs · ⬜ /settings/tax · ⬜ /settings/backfill · ⬜ /monitor · ⬜ /monitoring · ⬜ /moysklad · ⬜ /automation/canned-rules (new) · ⬜ /login · ⬜ /register · ⬜ /onboarding/{cabinet,wb-token,processing}

## Aggregates (filled at the end)
- `BE-BUGS.md` — detailed BE-owned issues (handoff to BE team).
- `REPORT.md` — master findings (FE BD-* continuation + cross-page).
- Fix plan — drafted after all pages validated.
