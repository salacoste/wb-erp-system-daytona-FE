# /analytics/storage — Аналитика расходов на хранение (Paid Storage)

**Route:** `/analytics/storage` · **Filters state:** weekStart=2026-W24, weekEnd=2026-W26 (default = last 4 weeks), brands=all, warehouses=all, no `week` chart-filter
**Validated:** 2026-07-06 · FE `:3100` (PM2 dev) · BE `:3000` · cabinet `f75836f7-…`

## 1. Load — ✅
- `/v1/analytics/storage/by-sku?weekStart=2026-W24&weekEnd=2026-W26&limit=20` → **200**
- `/v1/analytics/storage/top-consumers?weekStart=2026-W24&weekEnd=2026-W26&limit=5&include_revenue=true` → **200**
- `/v1/analytics/storage/trends?weekStart=2026-W24&weekEnd=2026-W26&metrics=storage_cost` → **200**
- Plus unfiltered `by-sku?limit=200` for filter dropdowns → **200**
- Page renders: summary cards, trends chart (recharts bars W24/W25/W26), top-5 table, by-SKU table (8 cols). No skeleton stuck.
- Console: `[Trends] COGS fetch failed for 2026-W18/W19/W23` warnings (data-absent, expected). `Failed to fetch` errors present but are **stale-dev-server abort artifacts** (per `reference_e2e_playwright_gotchas.md`), not storage-endpoint failures — the storage endpoints all returned 200.

## 2. Interactive elements — mostly ✅, one UX gap
| Element | Action | Effect | Verdict |
|---|---|---|---|
| Period-from / Period-to (`weekStart`/`weekEnd`) | change | URL `?weekStart&weekEnd` updates; data reloads | ✅ |
| Brands multi-select | select | `?brands=` URL; data refilter | ✅ (options populated from unfiltered call) |
| Warehouses multi-select | select | `?warehouses=` URL; data refilter | ✅ |
| Сбросить button | click | clears brands+warehouses | ✅ |
| Search (Поиск по артикулу, бренду) | type `LL-20` | "Найдено: 2 из 20", rows filter client-side, debounced | ✅ |
| Sort headers (Хранение / ₽/день / Объём / Дней) | click | toggles asc/desc, reorders rows | ✅ |
| Импорт данных button | click | opens PaidStorageImportDialog | ✅ (not deep-tested) |
| Trends chart bar click (Story 24.10 — click-to-filter to a week) | click W25 bar | **❌ no URL `?week=` update observed via synthetic click** (recharts internal event system — test-harness limitation, not a proven bug) | ⚠️ harness-blocked |
| **Deep-link `?week=2026-W25`** | navigate directly | **❌ `selectedWeek` state init only reads `searchParams.get('week')` at mount (`useStoragePageState.ts:42-44`); a URL change without remount does NOT apply the week filter** — table stayed at W24-W26 totals (42 SKU / 11 746 ₽) instead of W25-only (39 SKU / 3 554,69 ₽). Minor deep-link gap. | ⚠️ BD-40 (new, low) |
| Row click | click | navigates to product detail (nmId) | ✅ (not deep-tested) |

## 3. Data vs API (W24-W26) — ✅ exact
Raw payloads: `storage-bysku-W24-W26.raw.json`, `storage-topconsumers-W24-W26.raw.json`, `storage-trends-W23-W26.raw.json`.

| Rendered | API field | ✅/⚠️/❌ |
|---|---|---|
| Summary «Всего расходы 11 746 ₽» | `summary.total_storage_cost = 11745.81` → round ₽ | ✅ |
| Summary «Товаров 42» | `summary.products_count = 42` | ✅ |
| Summary «Среднее на товар 280 ₽» | `summary.avg_cost_per_product = 279.66` → round | ✅ |
| Summary «Период 22 дней / 2026-W24 — 2026-W26» | `period.days_count=22`, `from/to` | ✅ |
| Trends «Мин: 3 555 ₽ / Макс: 4 310 ₽ / Среднее: 3 915 ₽ / +11,0 %» | `summary.storage_cost.min=3554.69/max=4309.65/avg=3915.66/trend=10.03` | ✅ |
| Top-1 LL-20-WH «1 648 ₽ / 14,0 % / 9,7 % Низкие затраты» | `storage_cost=1647.94` / `percent_of_total=14.03` / `storage_to_revenue_ratio=9.74` | ✅ |
| Top-3 izoblack_20 «0,1 %» (Хран/Выр) | `storage_to_revenue_ratio=0.09` (rev=1 251 552,9) | ✅ |
| Table LL-20-WH «1 648 ₽ / 34 ₽/день / 0.1 л / 21 дней» | `storage_cost_total=1647.94` / `storage_cost_avg_daily=34.33` / `volume_avg=0.1354` / `days_stored=21` | ✅ |

**Aggregation note (correct):** the `limit=20` paginates the *rows* but `summary.products_count=42` is the **full filtered count** (not the page size) — card "42" is right; "Все товары (42)" label too. The `(42)` count comes from `bySkuData.summary.products_count`, consistent.

## 4. AP#8 runtime — ⚠️ BD-16 LIVE (latent on current data)
- Normalizer `storage-queries-normalizer.ts:44-45,63,94` uses **`toCount` (null→0)** on money fields `storage_cost_total`, `storage_cost_avg_daily`, `storage_cost`, `avg_cost_per_product`. Type declared `number` (non-nullable) → ESLint anti-pattern #8 rule doesn't fire (rule targets component/hook code, not normalizers — the systemic gap noted in the BD audit summary, line 91).
- `formatCurrency(value: number)` in `storage-sku-table-utils.ts:48` and `StorageSummaryCards.tsx:31` both take **`number`** (no null guard) → a null upstream renders **"0 ₽" not "—"**.
- **On current W24-W26 data:** all SKUs have non-null storage costs (every SKU on the page genuinely incurred storage), so "0 ₽" is NOT currently displayed — BD-16 is **latent** here, not actively mis-rendering. ✅ data-condition.
- `formatVolume(null) → "—"` (`storage-sku-table-utils.ts:53`) correctly guards. ✅
- `revenue_net`/`storage_to_revenue_ratio` in top-consumers normalizer use `?? undefined` → render blank/dash. ✅

## 5. Findings
- **BD-16 (latent, low)** — storage money fields use `toCount` (null→0) at the normalizer + `formatCurrency(value: number)` has no null guard → would render "0 ₽" if a SKU had null storage cost. Not active on current data (all SKUs have costs). File:line `src/lib/api/storage-queries-normalizer.ts:44-45,63,94` + `src/app/(dashboard)/analytics/storage/components/storage-sku-table-utils.ts:48` + `StorageSummaryCards.tsx:31`. Fix: `toNullableNumber` + null-guarded currency formatter. Already documented in the BD audit (BD-16).
- **BD-40 (new, low)** — deep-link `?week=YYYY-Www` does not apply the chart week-filter on direct navigation because `selectedWeek` is seeded from `searchParams.get('week')` only at `useState` init (`useStoragePageState.ts:42-44`); subsequent URL changes don't update it. UX gap (deep-linking a week filter silently no-ops). Fix: sync `selectedWeek` from `searchParams` via `useEffect`, or read directly.
- **No BE-owned storage bugs.** All 3 storage endpoints 200 with consistent, correctly-formatted data.
