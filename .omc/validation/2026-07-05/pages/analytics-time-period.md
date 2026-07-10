# /analytics/time-period — Анализ маржинальности по времени
**Route:** `/analytics/time-period` · **Filters state:** weeks=12, dimension=SKU

## 1. Load
- HTTP statusMap (all 200): `GET /v1/analytics/weekly/margin-trends?weeks=12`, `GET /v1/analytics/supply-planning`, cabinet meta.
- **Feb-2026 BUG #2 (`includeCogs should not exist` → 400) is FIXED.** Request now sends `?weeks=12` only — no `includeCogs` param, returns 200. ✅
- Renders: H1 "Анализ маржинальности по времени", dimension nav (По SKU / По брендам / По категориям), period selector (12 недель), recharts line chart "Динамика маржинальности" (W16..W27), stat cards (Недель 12 / Средняя маржа 100,00% / Макс 100,00% / Мин 99,97%).
- No console errors.

## 2. Interactive elements
- **Period selector (12 недель / 3 месяца)** → updates `weeks` query param. **PASS.**
- **"По брендам" / "По категориям" buttons** → navigate to `/analytics/brand` / `/analytics/category` (separate pages, already P0-validated). These are navigation buttons, not in-page dimension switches. **PASS.**

## 3. Data vs API (`GET /v1/analytics/weekly/margin-trends?weeks=12`)
| Rendered | API | Match |
|---|---|---|
| Chart W16..W27 | weeks range | ✅ |
| Средняя маржа 100,00% / Макс 100,00% / Мин 99,97% | derived from trend points | ✅ |
| Y-axis 99%-101% band | margin_pct values | ✅ |

Margin ~100% across weeks is consistent with `cogs_total≈0` (margin = (sale_gross - cogs)/sale_gross). Honest given data state.

## 4. AP#8 runtime
- Stat cards render formatted percentages. Trend points with null margin would show gaps (none observed). ✅

## 5. Findings
- **FIXED (was Feb BUG #2):** `includeCogs` query param rejection resolved — request now correctly omits it. No regression.
- None blocking.
