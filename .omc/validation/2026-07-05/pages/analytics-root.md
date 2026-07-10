# /analytics — Analytics Hub (root)
**Route:** `/analytics` · **Filters state:** none (navigation hub)

## 1. Load
- HTTP statusMap (all 200): `GET /v1/analytics/weekly/available-weeks`, `GET /v1/analytics/weekly/finance-summary?week=2026-W26`, `GET /v1/analytics/search/orders`, `GET /v1/analytics/supply-planning`, cabinet meta.
- Renders: H1 "Аналитика", navigation cards grouped — "Финансовый анализ" (По товарам/брендам/категориям/времени/Финансовая история/Сверка выкупов), "Операционная аналитика", plus week selector + financial summary.
- No console errors.
- **Note on earlier "redirect to /dashboard" false read:** was caused by `playwright-cli goto <url> --wait-until domcontentloaded` — the `--wait-until` flag is NOT a valid option for `goto` and silently aborted navigation, leaving browser on `/dashboard`. Verified `/analytics` renders correctly with plain `goto`.

## 2. Interactive elements
- **Navigation cards** → link to respective `/analytics/*` sub-pages. **PASS.**
- **Week selector** → updates finance-summary fetch. **PASS.**

## 3. Data vs API
- Navigation hub; finance-summary values match `/analytics/dashboard` (already verified). ✅

## 4. AP#8 runtime
- N/A (hub).

## 5. Findings
- None.
