# Proposal: end the dot-locale-percent whack-a-mole (consolidation + lint gate)

**Status**: ✅ ADOPTED & COMPLETED (2026-06-04) — see [Outcome](#outcome-2026-06-04) below
**Raised**: 2026-06-02, validation iter-66 (both adversarial review passes converged on this)
**Class**: systemic Russian-locale-formatting debt

---

## Problem

The codebase renders percentages two ways:
- **Canonical**: `formatPercentage` (`src/lib/utils.ts`) → `"15,5 %"` (comma decimal + NBSP), per the
  documented rule (`frontend/CLAUDE.md` § Formatters).
- **Dot-locale (wrong)**: inline `` `${value.toFixed(N)}%` `` / `value.toFixed(N) + '%'` → `"15.5%"`
  (dot decimal, no separator).

> **Count note (iter-67):** the gate baseline is **108** occurrences (106 template-form + 2 concat-form,
> counting occurrences not lines, broader regex). The "107" below was the iter-66 measurement under a
> narrower single-digit regex — both are correct for their measurement method; 108 is authoritative.

**Scale (measured iter-66):** ~**107 dot-locale percent sites across ~73 non-test source files**
(`grep -rEn "toFixed\([0-9]\)\}%" src` = 105 + 2 concat-form). Examples span monitor, monitoring,
forecast, models, storage, buyout, returns, funnel, sku, dashboard top-tables, ProductMarginCell,
KPICard, delta-indicator, expense-chart, CogsCoverageMetricCard, etc.

**Why it keeps recurring:** validation has fixed it **page-by-page 7 times** (iter-58 unit-econ,
iter-59 search, iter-61 advertising, iter-62 cross-ref, iter-64 — , iter-66 cogs-margin), each
patching 1–3 files. There is **no gate** preventing a new `.toFixed(N)%` from being written, so the
stream is unbounded. At ~2 sites/iteration with the mandatory 2-pass adversarial review per fix,
clearing 107 sites is ~50 more iterations of disproportionate process cost.

## Recommendation — adopt the anti-pattern #8 playbook

The project already solved an identical "recurring formatting defect with no enforcement" problem
(anti-pattern #8, `?? 0` on money/ratio) with a `no-restricted-syntax` ESLint rule + baseline
allowlist + canonical-helper docs. Mirror it:

1. **Helpers** (`src/lib/utils.ts`): keep `formatPercentage` (min1/max2) and ADD a zero-decimal
   variant `formatPercentageInt` (`Intl … style:'percent', maximumFractionDigits:0`) so integer
   coverage/CTR displays (e.g. `CogsCoverageMetricCard.tsx:145` `toFixed(0)%` → `"75 %"`) migrate
   without gaining a spurious decimal. Optionally a `decimals` param.
2. **ESLint `no-restricted-syntax` rule** banning `<expr>.toFixed(N)` immediately followed by a `%`
   quasi in a TemplateLiteral, and the `+ '%'` BinaryExpression form. Allowlist comment convention
   like anti-pattern #8 (`// eslint-disable-next-line … -- LOCALE-EXCEPTION: <reason>`).
3. **Baseline allowlist** (mirror `.check-docs-baseline.txt`) of the 107 pre-existing sites so the
   rule **stops the bleeding** (no NEW dot-locale) while the backlog migrates incrementally without
   blocking unrelated stories.
4. **Genuine exceptions** to allowlist (NOT migrate): aria-label spoken text (a comma decimal can
   confuse screen-reader number parsing — see `HistoricalMarginContext.tsx:90`), recharts axis-tick
   formatters that need a plain string, CSV-export numerics (locale-neutral for spreadsheets), and
   debug/log strings.

## Domain caveat for the migration (the ×100 trap)

Each site's input domain MUST be verified before swapping to `formatPercentage` (which does
`value/100`): some inputs are already 0-100 percent (format `value`), others are 0-1 fractions
rendered via `(value*100).toFixed(...)` (format `value*100` → i.e. pass the fraction to a percent
helper directly). Getting this wrong is a 100× error (cf. iter-61 advertising ROI, which was a real
100× bug). The migration should be done in domain-cohesive batches, not a blind regex sweep.

## Net

Page-by-page has negative ROI at 107 sites. The lint rule is the load-bearing deliverable: it
converts an unbounded recurring-defect stream into a bounded one-time migration + a permanent gate.

## Outcome (2026-06-04)

The proposal was adopted and the migration is **complete**. What shipped:

1. **Gate** (the load-bearing deliverable): `scripts/check-locale-percent.sh` + a COUNT baseline
   `scripts/.locale-percent-baseline.txt` — a ratchet that fails on any NEW dot-locale percent and
   must be lowered (same commit) when sites migrate. Mirrors the anti-pattern #8 playbook as proposed.
2. **Helpers**: `formatPercentageInt` (zero-decimal `"75 %"`) was added alongside the existing
   `formatPercentage` (1-2 decimals). A canonical `formatDecimal(value, decimals=1)` was later added
   for the adjacent **bare-decimal** class (Russian comma on plain numbers without `%`/`₽`), replacing
   ad-hoc `toFixed(n).replace('.',',')` and duplicate local helpers — all in `src/lib/utils.ts`.
3. **Baseline ratcheted 108 → 11.** The remaining 11 are the permanent floor — ~6 demonstrative
   citations in docs/comments, plus the documented aria-label spoken-text exceptions, plus the deferred
   `ExpenseBarTooltip` site (a separate latent math bug, not a pure locale migration) — totalling 11.
4. **Both streams cleared:** the gate-TRACKED `.toFixed(N)%` sites (ratcheted to floor) AND the
   gate-BLIND sites the regex never saw — raw `{x}%` JSX, `Math.round(x)%`, split-line
   `toFixed`+`'%'`, and comma-without-NBSP `Intl.format()+'%'`.
5. **Exceptions honored exactly as predicted** (NOT migrated): aria-label spoken text, recharts
   axis-tick formatters, CSV-export numerics, debug/log strings.
6. **The ×100 trap held:** every migration verified the field's scale (0-100 percent-units → pass
   straight; 0-1 ratio → `* 100`) and precision (slider step / integer source → Int; fractional →
   N decimals) before swapping — no 100× regressions introduced.

**Not closed by this initiative (need product/owner decisions, tracked separately):** three unconsumed
dead-code components surfaced during the sweep (`OrdersCogsMetricCard`, `ProductStorageInfo`,
`WarehouseTariffDisplay` — delete vs keep-as-API); `AuditValueDisplay` (whether admin audit-echo values
should be locale-formatted or shown raw); the `ExpenseBarTooltip` math bug; and one backend-owned display
string the FE cannot fix per the Defensive Frontend Principle — filed as backend request
`docs/request-backend/208-FORECAST-AIVSNAIVE-DOT-LOCALE.md` (forecast `aiVsNaive`).
