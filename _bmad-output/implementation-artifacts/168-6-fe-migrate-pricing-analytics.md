# Story 168.6 — Migrate Pricing Analytics /analytics/pricing

- **Status:** done — (was: "review (awaiting orchestrator commit/PR)"; synced by Story 174.5 on 2026-09-02; authoritative delivery/gate evidence: sprint-status.yaml row with PR/merge/review/vitest)
- **Branch / worktree:** cdx/epic-168-story-6-pricing @ /private/tmp/wb-fe-168-6-migrate-pricing-analytics
- **Base SHA:** 625e998c
- **Acceptance criterion:** Given pricing rows and detail states when migrated then filters, recommendation/break-even values, units, zero/missing, selected SKU, focus/return, and recovery remain correct and algorithms are untouched.

## Behavior-Lock Inventory (pre-flight)

- Targeted baseline: `npx vitest run "src/app/(dashboard)/analytics/pricing"` → **76 passed / 0 failed** (5 files: page.test, PricingBasisToggle, PricingPageHeader, PricingSummaryCards, PricingTable) — verified in worktree before any edit.
- Locked behavior: gap sign logic (`gap >= 0` = above), MarginCell 3-tier thresholds **15 / 0** (unchanged — NOT collapsed to 2-tier, NOT widened to 168.3's 4-tier ≥30/≥15/≥0), formatCurrency/formatPercentage (ru-RU, NBS + ₽), BD-37 null-gap semantics, SPP-1.7 basis badge behavior.

## Changes

| File | Site | Old | New |
|------|------|-----|-----|
| `components/PricingSummaryCards.tsx:68` | «Ниже цели» card valueClass | `text-red-600` | `text-financial-negative` |
| `components/PricingSummaryCards.tsx:76` | «Выше цели» card valueClass | `text-green-600` | `text-financial-positive` |
| `components/PricingTable.tsx:55-56` | GapCell cls | `text-green-600` / `text-red-600` | `text-financial-positive` / `text-financial-negative` |
| `components/PricingTable.tsx:73-78` | MarginCell cls (3-tier, thresholds 15/0 unchanged) | `text-green-600` / `text-amber-600` / `text-red-600` | `text-financial-positive` / `text-status-warning/80` / `text-financial-negative` |
| `components/__tests__/PricingTable.test.tsx` | +describe `PricingTable — 168.6 semantic tokens` (6 it) | — | 3 MarginCell exact-pins (20/10/−5), 2 GapCell exact-pins (+/−), scoped legacy DOM guard |
| `components/__tests__/PricingSummaryCards.test.tsx` | +describe `PricingSummaryCards — 168.6 semantic tokens` (3 it) | — | 2 card-value exact-pins («Ниже цели»→negative, «Выше цели»→positive), legacy DOM guard |

## Token mapping table (old → new)

| Legacy | Semantic |
|--------|----------|
| `text-red-600` | `text-financial-negative` |
| `text-green-600` | `text-financial-positive` |
| `text-amber-600` | `text-status-warning/80` (интенсивность-идиома 168.3, precedent: TopProductsTableRow.tsx, TopBrandsTableRow.tsx) |

## Raw-palette sweep proof

Regex: `(bg|text|border|ring|divide|fill|stroke|outline)-(red|yellow|blue|green|gray|rose|amber|emerald|sky|orange|slate|zinc|neutral|stone|lime|teal|cyan|indigo|violet|purple|fuchsia|pink)(-\d+)?`

`grep -rEn <regex> "src/app/(dashboard)/analytics/pricing"` → **0 hits in production files**. Only 2 hits total, both negative assertions in `__tests__/PricingSummaryCards.test.tsx` (`classList.contains('text-red-600') → false` guard lines) — intentional legacy-absence checks, not usage.

## External consumers check

`grep -rln "analytics/pricing/components|from '../Pricing|from './Pricing" src | grep -v pricing-surface` → **0 importers outside the route**. PricingSummaryCards/PricingTable consumed only by the pricing page within the owned surface.

## Gates (worktree, all green)

- Targeted vitest: 76 → **85 passed / 0 failed** (+9: 6 PricingTable + 3 PricingSummaryCards additions; 0 baseline tests touched)
- `npm run lint` → exit 0 (0 warnings, `--max-warnings 0`)
- `npm run type-check` → exit 0
- `npx prettier --check` on all 4 changed files → pass
- (full vitest / build / e2e — NOT run, main-session owned)

## Gaps / escalations

- Shared `PriceBasisBadge` still emits legacy `border-gray-200 bg-gray-50 text-gray-700` — FORBIDDEN surface for 168.6 (shared component), left untouched. The PricingTable DOM guard is scoped to `tbody tr` owned spans/tds excluding `[aria-label]` badge subtree for this reason.
- PostToolUse formatter hook reformatted both test files after edits; final state prettier-clean.

## Lessons

_(placeholder — filled at review)_

## Change Log

- PricingSummaryCards.tsx: 2 token swaps + decision comments (168.6)
- PricingTable.tsx: GapCell 2-token swap + MarginCell 3-tier swap (thresholds 15/0 preserved) + comments
- PricingTable.test.tsx: +85 lines (describe block, 6 pins/guards)
- PricingSummaryCards.test.tsx: +34 lines (describe block, 3 pins/guards)
