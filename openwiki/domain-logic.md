---
type: "Domain Reference"
title: "Domain Logic"
description: "Financial and business-logic helpers as pure functions in src/lib/ — theoretical profit, margin/COGS temporal logic, unit economics, liquidity, cost/tariff calculations, ISO-week/Moscow-timezone handling, and Russian-locale formatters."
---
# Domain Logic

Financial and business-logic helpers that encode the core domain rules of the Wildberries seller analytics ERP. These live primarily in `src/lib/` as pure functions, separate from API calls and React hooks.

## Theoretical Profit Formula

**File**: `src/lib/theoretical-profit.ts`

The core profitability formula:

> **Теор. прибыль = Выкупы − COGS − реклама − логистика − хранение**

Key design decisions:
- Uses **sales (выкупы)**, not orders, as the revenue base — orders include items that may be returned.
- Returns a `TheoreticalProfitResult` with a breakdown of each cost component and tracking of missing fields.
<!-- openwiki: broken internal link [api-and-normalizers.md#anti-pattern-8-null--0-collapse-on-moneyratio-fields] heading anchor "anti-pattern-8-null--0-collapse-on-moneyratio-fields" does not exist in "api-and-normalizers.md". Fix the href or restore the target, then delete this comment. -->
- Missing COGS or tariff data results in `null` profit, not a fabricated zero — consistent with [Anti-Pattern #8](api-and-normalizers.md#anti-pattern-8-null--0-collapse-on-moneyratio-fields).

## Margin & COGS

| File | Purpose |
|------|---------|
| `margin-helpers.ts` | Moscow-timezone-anchored week calculation (`nowInMoscow()`, `getLastCompletedWeek()`), COGS temporal validity checks (`isCogsAfterLastCompletedWeek()`), affected-weeks calculation |
| `margin-polling-helpers.ts` | Margin recalculation polling config and ETA estimation |
| `week-calculation-helpers.ts` | Extracted week arithmetic (file-size compliance) |

**COGS temporal validity**: COGS entries are valid for a specific ISO week. The system checks whether a COGS record was set after the last completed Moscow-timezone week to determine if margin calculations are current or need recalculation.

## Profitability Status

**File**: `src/lib/profitability-utils.ts`

`EXTENDED_STATUS_CONFIG` defines profitability tiers with thresholds, colors, Russian labels, and actionable recommendations:

| Status | Threshold |
|--------|-----------|
| Excellent | > 25% |
| Good | 15–25% |
| Warning | (below good) |
| Critical | (below warning) |

**File**: `src/lib/roi-profit-utils.ts` — ROI color coding (≥100% green, <0% red), `formatProfitPerUnit()`.

## Cabinet Target Margin

Each cabinet carries an explicit **target margin** (`targetMarginPct`, Epic 121 GAP-3) that the UI uses as the configurable pricing/profitability target instead of a hardcoded threshold.

| Aspect | Detail |
|--------|--------|
| **Type** | `Cabinet.targetMarginPct: number \| null` (`src/types/cabinet/core.ts`). `null` means "not configured" — the UI falls back to a proposed **20%**. |
| **Persistence** | Stored per-cabinet on the backend alongside tax/VAT settings; updated via `PUT /v1/cabinets/:id` with body field `target_margin_pct` (snake_case). |
| **API boundary** | `updateCabinetTaxSettings()` in `src/lib/api/cabinet.ts` translates the camelCase `targetMarginPct` to the backend `target_margin_pct` field and omits it entirely when `undefined` (so unrelated tax updates don't clear the value). The response is re-normalized so consumers read the same canonical shape as the GET path. |
<!-- openwiki: broken internal link [api-and-normalizers.md#anti-pattern-8-null--0-collapse-on-moneyratio-fields] heading anchor "anti-pattern-8-null--0-collapse-on-moneyratio-fields" does not exist in "api-and-normalizers.md". Fix the href or restore the target, then delete this comment. -->
| **Normalization** | `normalizeCabinetResponse()` (`src/lib/api/cabinet-normalizer.ts`) accepts either `targetMarginPct` or `target_margin_pct` from the raw payload and coerces to `number | null` (consistent with [Anti-Pattern #8](api-and-normalizers.md#anti-pattern-8-null--0-collapse-on-moneyratio-fields) — a missing target stays `null`, never `0`). |
| **Validation** | zod schema: trimmed string, finite number, range `0–100%` (0.01 step). Applied identically in both surfaces below. |

**Two entry points for editing target margin**:

| Surface | Component | Behavior |
|---------|-----------|----------|
| Settings → Cabinet | `TargetMarginSettingsCard` (`src/components/custom/settings/TargetMarginSettingsCard.tsx`), mounted on `src/app/(dashboard)/settings/cabinet/page.tsx` | React Hook Form + zod, resets to the stored value (or 20% fallback), saves via `useUpdateTaxSettings`, gated by `canManageOperationalData` (read-only for Analyst). |
| Onboarding (cabinet creation) | `CabinetCreationForm` (`src/components/custom/CabinetCreationForm.tsx`) | Collects target margin alongside the cabinet name; if a cabinet already exists for the session, submitting updates that cabinet's margin via `useUpdateTaxSettings` instead of creating a new one. Includes a retry path: if cabinet creation succeeds but the margin save fails ("target margin" error), the form re-binds to the existing cabinet so the operator can retry just the margin. |

The mutation hook `useUpdateTaxSettings` (`src/hooks/useCabinetTaxSettings.ts`) invalidates both the `cabinet-tax` and `financial` query families on success, so dashboards pick up the new target alongside the canonical tax config.

## Unit Economics

| File | Purpose |
|------|---------|
| `unit-economics-utils.ts` | Barrel re-export + waterfall chart transformation (`transformToWaterfallData`) |
| `unit-economics-config.ts` | Cost categories, profitability status configs |
| `unit-economics-analysis.ts` | `getTopMarginKillers`, `calculateHealthScore`, `sortByProfitability`, `filterLossMaking`, `filterMissingCogs` |
| `unit-economics-formatters.ts` | Domain-specific formatting |

## Liquidity Analysis

| File | Purpose |
|------|---------|
| `liquidity-utils.ts` | Summary helpers: `getIlliquidSkuCount`, `isFrozenCapitalHealthy`, `calculatePotentialUnlock`, `getRecommendedScenario` |
| `liquidity-category-config.ts` | Category definitions: highly_liquid, medium, low, illiquid (with colors/labels) |
| `liquidity-action-benchmark.ts` | Action types, benchmark statuses, trend insights |
| `liquidity-formatters.ts` | Turnover days, velocity, frozen capital formatters |
| `liquidity-sort.ts` | Sort field mapping and item sorting |

## Cost & Tariff Calculations

| File | Purpose |
|------|---------|
| `acceptance-cost-formulas.ts` / `acceptance-cost-utils.ts` | WB acceptance (приёмка) cost calculations |
| `storage-cost-utils.ts` / `storage-cost-helpers.ts` | Storage cost per box type |
| `logistics-tariff.ts` / `logistics-tariff-helpers.ts` / `logistics-calculation-utils.ts` | Logistics tariff calculations |
| `tariff-system-utils.ts` / `tariff-extraction-utils.ts` | Tariff system parsing and validation |
| `coefficient-utils.ts` / `coefficient-date-helpers.ts` | WB coefficient calculations (dimensional, etc.) |

## ISO Week & Moscow Timezone

The entire analytics system operates on **ISO weeks anchored to Moscow timezone** (UTC+3). Week boundaries, period comparisons, and "last completed week" calculations all use Moscow time.

| File | Purpose |
|------|---------|
| `src/lib/iso-week/core.ts` | Core ISO week calculation |
| `src/lib/iso-week/navigation.ts` | Week navigation (prev/next) |
| `src/lib/iso-week/ranges.ts` | Week range generation |
| `src/lib/iso-week/comparison.ts` | Period comparison utilities |
| `src/lib/date-utils.ts` / `src/lib/date-range-utils.ts` | General date manipulation |

## Formatters

All formatters use **Russian locale** (`ru-RU`) for number/currency display.

| File | Key Functions |
|------|---------------|
| `src/lib/formatters/currency-formatters.ts` | `formatCurrency` (RUB), `formatCurrencyCompact` (1.2 млн ₽), `formatCogsCost` (2 decimals, null→"—") |
| `src/lib/formatters/percentage-formatters.ts` | `formatPercentage`, `formatPercentageInt`, `formatPercentagePoints` |
| `src/lib/formatters/number-formatters.ts` | `formatNumber`, `formatDecimal`, `formatRoas` |
| `src/lib/formatters/date-formatters.ts` | `formatDate`, `formatDateTime`, `formatIsoWeek`, `formatWeeksAgo` |

**Locale formatting rule**: Percentages must render as `"15,5 %"` (comma + non-breaking space), not `"15.5%"`. Use `formatPercentage` / `formatPercentageInt` — inline `toFixed(N) + '%'` is banned by the dot-locale percent ratchet (see [Conventions & Quality Gates](conventions-and-quality.md)).

## Null Helpers

**File**: `src/lib/null-helpers.ts`

Enforces the "null not undefined" standard for missing data: `isNullish`, `coerceToNull`, `hasValue`, `nullSafe`. This is the foundation of AP#8 null semantics — missing money/ratio data is `null`, not `0` or `undefined`.

**File**: `src/lib/decimal-utils.ts` — `parseDecimal()` handles Prisma DECIMAL strings ("96000.0000" → 96000).

## Order Expiration (WB Shelf-Life Management)

Wildberries supports per-order product expiration dates (shelf-life / срок годности). This feature lets operators manually set or auto-fill the expiration date on FBS orders, with a reconcile-and-retry strategy for WB API write uncertainties.

**Backend capability metadata** (`ExpirationMeta` in `src/types/orders.ts`):
- `requirement` — `'required'` or `'optional'` per SKU/category
- `value` — current committed expiration date (`null` if unset)
- `editable` / `manualEditable` / `fefoAvailable` — which write workflows are available
- `reconciliationRequired` — a previous WB write has no definitive read-back; must reconcile before another PUT
- `minimumDate` — earliest acceptable date (backend-authoritative)

**Three write workflows** (`src/hooks/useOrdersExpirationMutations.ts`, API in `src/lib/api/orders-actions.ts`):

| Workflow | Endpoint | Description |
|----------|----------|-------------|
| Manual update | `PUT /v1/orders/:orderUuid/meta/expiration` | Operator enters a date directly |
| FEFO auto-fill | `PUT /v1/orders/:orderUuid/meta/expiration/from-stock-batch` | Backend picks the soonest-expiring stock batch (First-Expire-First-Out), reserves it, and writes the date |
| Reconcile | `POST /v1/orders/:orderUuid/meta/expiration/reconcile` | Read-only WB read-back to verify a previous uncertain write; never repeats the PUT |

**Uncertain-write handling** (`src/lib/api/order-expiration-error.ts`):
- HTTP 502 with `ORDER_EXPIRATION_OUTCOME_UNCERTAIN` — the WB write may or may not have succeeded. The mutation hooks automatically call reconcile; if verified, the date is confirmed; otherwise the write stays blocked until the operator intervenes.
- HTTP 400 with `ORDER_EXPIRATION_DATE_TOO_EARLY` — `extractExpirationMinimumDate()` reads the authoritative minimum from the backend envelope and surfaces it so the UI can clamp the date picker.

**Date validation** (`src/lib/order-expiration-date.ts`): `isIsoCalendarDate()` performs strict `YYYY-MM-DD` pattern + UTC calendar round-trip validation, guarding against invalid dates like `2026-02-31`.

**UI**: `OrderExpirationSection` (`src/components/custom/orders/OrderExpirationSection.tsx`) — integrated into `OrderDetailsModal`, renders the date input, FEFO auto-fill button, and reconcile button based on `ExpirationMeta` capability flags.
