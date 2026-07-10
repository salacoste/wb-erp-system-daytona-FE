# /cogs — Управление себестоимостью

**Route:** `/cogs` · **Filters state:** none (single "Все товары" tab), search box, 25-per-page cursor pagination.
**Validated:** 2026-07-06 · live BE :3000 + FE :3100 (Playwright, JWT-injected).

## 1. Load
- `/v1/products?limit=25&include_cogs=true&include_storage=true` → **200**, total **69** products, renders 25 rows ✅.
- Page H1 "Управление себестоимостью", info banner, full-width product table, slide-out Sheet panel all render ✅.
- Console: only background-poll noise (orders/funnel/FBO prefetch, "Failed to fetch" on a polling import-check) — **no /cogs-blocking errors**. `[Trends] COGS fetch failed for 2026-W18…` warnings are unrelated dashboard-sidebar polling.

## 2. Interactive elements
| Element | Action | Effect | Verdict |
|---|---|---|---|
| Search box (`Поиск по артикулу или названию…`) | type `148190095` | Row filtered, shows the single COGS product | ✅ |
| Row "Выбрать" button (no-cogs product `785352608`) | click | Slide-out Sheet opens: «Назначение себестоимости … Укажите себестоимость для товара 785352608», shows form (cost, date, notes) | ✅ |
| Sheet date `2026-07-06` (today, after W26 midpoint) | render | **Temporal warning shown**: «COGS назначен с даты после последней завершенной недели (2026-W26). Автоматический пересчет маржи для прошлых недель не запустит…» — honest UX | ✅ |
| Cost input + «Назначить себестоимость» submit | enter `100`, date `2026-06-15`, submit | `POST /v1/products/785352608/cogs {unit_cost_rub:100, valid_from, source:'manual'}` fired; **BE persisted** (verified: `cogs=100, valid_from=2026-06-15, source=manual`); Sheet closed; list re-fetched | ✅ |
| Sheet Escape / overlay close | — | `handleSheetOpenChange` clears selection | ✅ (rendered) |

**Mutation verified end-to-end** (single COGS assign): request → 200 → BE persistence → UI reflects. Non-spamming: 1 assignment performed.

## 3. Data vs API (post-format)
Source: `GET /v1/products?…&include_cogs=true&include_storage=true`.

| Rendered | API field | Verdict |
|---|---|---|
| Row `202867769`: `846,00 ₽` / `с 05.07.2026` | `cogs.unit_cost_rub="846"` (string) → 846,00 ₽; `cogs.valid_from=2026-07-05…` | ✅ |
| Row `148190095`: `6,45 ₽/д` storage | `storage_cost_daily_avg: 6.45` | ✅ exact |
| Row `148190095`: «Нет продаж за W26 / Нет предыдущих COGS» | `missing_data_reason: COGS_NOT_ASSIGNED`, `current_margin_pct: null` | ✅ |
| «Показано 25 из 69 товаров» | `pagination.total: 69` | ✅ |
| No-cogs rows: «Нет COGS» + «—» in cost & margin cells | `has_cogs: false`, `cogs: null` | ✅ AP#8 |
| Sheet «Текущая себестоимость 846,00 ₽ с 05.07.2026» | matches `cogs.unit_cost_rub` + `valid_from` | ✅ |

## 4. AP#8 runtime
- ✅ No-cogs products render **«—»** in cost & margin cells (not `0 ₽` / `0 %`).
- ✅ `missing_data_reason: COGS_NOT_ASSIGNED` surfaced as «Нет COGS» badge.
- ⚠️ **Degenerate historical-margin hint (BD-5 family, BE-owned):** for products that had sales in a prior week but no COGS that week, the row reads «Последняя продажа: W26 • **100,0 %** • N шт». The `100,0 %` is a faithful render of the backend's `last_sales_margin_pct=100.0` — a degenerate value (margin=100% because cogs=0 ⇒ (rev−0)/rev=100%). FE displays honestly; **the backend should return `null` for margin when cogs was absent in that week**, not 100%.

## 5. Findings
- **BD-5-family (BE, ⚠️)**: backend `last_sales_margin_pct = 100.0` for no-COGS historical weeks → FE renders misleading «100,0 %» in the "Последняя продажа" hint. Filed as BE bug (see BE-BUGS.md). FE source: `src/components/custom/HistoricalMarginContext.tsx:101` renders `lastSalesMarginPct` verbatim.
- No FE-owned data-correctness defect on this page. Load, search, pagination, Sheet, single-COGS mutation all ✅.
