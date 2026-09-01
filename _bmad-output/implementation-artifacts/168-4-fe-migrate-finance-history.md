# Story 168.4 — Migrate Finance History `/analytics/finance-history`

- **Status:** done — (was: "review (awaiting orchestrator commit/PR)"; synced by Story 174.5 on 2026-09-02; authoritative delivery/gate evidence: sprint-status.yaml row with PR/merge/review/vitest)
- **Branch / worktree:** `cdx/epic-168-story-4-finance-history` @ `/private/tmp/wb-fe-168-4-migrate-finance-history`
- **Base SHA:** `3f01f972` (= FE origin/main at story start)
- **Acceptance criterion:** Given the multi-week P&L grid when migrated to shadcn semantic tokens then WoW delta coloring (incl. isNegativeMetric inversion), formatting, and page structure remain correct — only presentation tokens change.

## Behavior-Lock Inventory (pre-flight)

Targeted baseline (all green, pre-edit):

- `npx vitest run "src/components/custom/finance-history" "src/app/(dashboard)/analytics/finance-history"` → **36 passed**

Locked (untouched semantics): `computeWowDelta` (currency % vs percent п.п., null for oldest column / zero-previous), `finance-history-rows` row kinds, `FinanceHistoryCell` presenter, `FinanceHistoryTable` columns/testids, page data flow (available-weeks → last completed filter → per-week finance-summary), Russian labels, period selector, Alert copy.

## Changes

| File | Change |
|---|---|
| `finance-history/finance-history-delta.ts` | `deltaColorClass()` (line 57): `text-green-600` → `text-financial-positive`, `text-red-600` → `text-financial-negative`. `'same'` → `text-muted-foreground` unchanged. isNegativeMetric inversion logic and the anti-pattern doc-comment preserved exactly. |
| `finance-history/__tests__/finance-history-delta.test.ts` | 4 pins in `deltaColorClass` block flipped to semantic tokens; test names updated to note inversion cases (up+isNegativeMetric → financial-negative, down+isNegativeMetric → financial-positive). 'same' pin was already present and remains. |
| `analytics/finance-history/page.tsx` | h1 gains `text-foreground` (was missing, cross-route consistency with 168.2/168.3 precedent). ONLY page.tsx change. |

**Forbidden files untouched:** hooks/financial, lib/margin-helpers, ui/**, shared selectors, all other routes/components.

## Token mapping table (old → new)

| Legacy | Semantic |
|---|---|
| `text-green-600` (delta positive) | `text-financial-positive` |
| `text-red-600` (delta negative) | `text-financial-negative` |
| h1 (no color token) | `text-foreground` |

## Raw-palette sweep proof

Widened regex `(bg|text|border|ring|divide|fill|stroke)-(red|yellow|blue|green|gray|rose|amber|emerald|sky|orange|slate|zinc|neutral|stone|lime|teal|cyan|indigo|violet|purple|fuchsia|pink)(-\d+)?` over `src/components/custom/finance-history/**` + `src/app/(dashboard)/analytics/finance-history/**` → **ZERO hits** after the delta fix. Visual pass over `FinanceHistoryTable.tsx` / `FinanceHistoryCell.tsx`: already fully semantic (hover/muted/border tokens) — no changes made.

## Gates (worktree, Node 24.18.0)

- Targeted vitest: **36 passed / 0 failed** (baseline 36 → 36; pins flipped, no count change — expected for a micro-migration)
- `npm run lint` → exit 0
- `npm run type-check` → exit 0
- `npx prettier --check` on owned files → all pass (page glob with parens needed direct-file invocation; components glob fine)
- Full vitest / next build / e2e: intentionally NOT run (main session owns)

## Gaps / escalations

None. Pure .ts helper — no DOM, so no legacy-palette DOM guard test added; the unit pins on all tone×isNegativeMetric combinations (incl. 'same') are the guard, per story instruction.

## Lessons

_(placeholder — filled at review)_

## Change Log

- **2026-08-18 — implementation**: delta token flip + 4 test pins + h1 `text-foreground`. No other changes.
