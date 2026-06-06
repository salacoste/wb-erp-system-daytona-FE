# Request #208 — forecast `aiVsNaive` is dot-locale "+12.3%" (should be ru-RU "+12,3 %")

**Originated by**: Frontend Russian-locale tech-debt campaign (bare-decimal stream), 2026-06-04
**Severity**: P3 — minor display-locale inconsistency in one forecast-table column. No functional impact.
**Status**: RESOLVED (2026-06-06) — ai-baseline.service.ts now uses comma decimal separator + space before %

---

## Problem

The AI-forecast row field **`aiVsNaive`** is delivered as a **pre-formatted display string** (e.g. `"+12.3%"`), not a numeric value. The frontend renders it **verbatim** at `frontend/src/app/(dashboard)/analytics/forecast/components/ForecastTable.tsx:81`:

```tsx
{p.aiVsNaive ?? '—'}
```

The normalizer is a pure passthrough — it does NOT (and per the project's **Defensive Frontend Principle** must not) re-parse or reformat a backend-owned display string (`frontend/src/lib/api/ai/forecast.ts:93`):

```ts
aiVsNaive: p.aiVsNaive ?? null,
```

Types: `frontend/src/types/ai/forecast.ts:44` (`aiVsNaive: string | null`), raw API `frontend/src/lib/api/ai/forecast.ts:23`.

The backend currently formats it in **dot-locale**: `"+12.3%"` — a dot decimal separator and no non-breaking space before `%`.

## Impact

The forecast table renders this column **inconsistently** with every sibling numeric column, which the FE formats in Russian locale (comma decimal + NBSP):

| Column | Source | Rendered |
|--------|--------|----------|
| Прогноз продаж (`predictedSales`) | FE `formatDecimal` | `42,0` |
| Наивный прогноз (`naiveBaseline`) | FE `formatDecimal` | `38,5` |
| Уверенность (`confidence`) | FE `formatPercentageInt` | `85 %` |
| **AI vs наивный (`aiVsNaive`)** | **backend string** | **`+12.3%`** ← dot decimal, no NBSP |

So a Russian-locale user sees `"+12.3%"` next to `"42,0"`, `"85 %"`, etc. — a visible inconsistency the FE cannot correct without violating the Defensive Frontend Principle (re-parsing a backend display string is fragile and erases the backend's formatting contract).

## Requested fix

Format `aiVsNaive` on the backend in **Russian locale**:
- **Comma** decimal separator: `12.3` → `12,3`
- **NBSP (U+00A0)** before the `%`: `"+12,3 %"`
- **Keep the leading sign** (`+` / `-`).

Expected output: `"+12,3 %"` (was `"+12.3%"`).

## Constraint — keep the sign prefix (FE color logic depends on it)

The FE color helper keys off the **first character** of the string (`frontend/src/app/(dashboard)/analytics/forecast/components/ForecastTable.tsx:30` — `getAiVsNaiveColor`): `value.startsWith('+')` → green, `value.startsWith('-')` → red. The localized string MUST still begin with `+` or `-` (which `"+12,3 %"` does). Do **not** switch to a Unicode minus (U+2212) for negatives — the helper checks ASCII `-`.

## Why this is a backend fix (not FE)

`aiVsNaive` is a **backend-owned pre-formatted display string**. Per `frontend/CLAUDE.md` (Defensive Frontend Principle), the FE indicates/consumes such strings but does not transform them — re-parsing `"+12.3%"` back to a number to reformat it would be fragile and is explicitly discouraged. The correct place for locale formatting of a backend-formatted string is the backend.
