# Story 168.8 — Migrate Reorder Analytics /analytics/reorder

- **Status:** done — (was: "review (awaiting orchestrator commit/PR)"; synced by Story 174.5 on 2026-09-02; authoritative delivery/gate evidence: sprint-status.yaml row with PR/merge/review/vitest)
- **Branch / worktree:** cdx/epic-168-story-8-reorder @ /private/tmp/wb-fe-168-8-migrate-reorder-analytics
- **Base SHA:** ca647434
- **Acceptance criterion (BMAD/plan):** Given recommendation and route states when migrated then query/filter/count/total/quantity/stock/source/dates/amount/status/actions remain unchanged and filtered/empty/narrow scope stays explicit.

## Behavior-Lock Inventory (pre-flight)

- Targeted baseline: `npx vitest run "src/app/(dashboard)/analytics/reorder"` → **61 passed / 0 failed** (5 test files) — verified in worktree before any edit.
- Locked behavior: STATUS_BADGE_MAP labels (Russian strings unchanged), Badge stays `variant="outline"`, `expired` chip stays `bg-muted text-muted-foreground` (already semantic, untouched), MetricCard layout/labels/sublabels, skeleton/empty/table structure, action buttons per status — all untouched.
- All 7 legacy sites in 2 files: `ReorderSummaryCards.tsx` (4 icon colors) + `ReorderTable.tsx` (STATUS_BADGE_MAP ×3; expired already semantic). Rest of surface legacy-clean.

## Changes

| File | Site | Old | New |
|------|------|-----|-----|
| `components/ReorderSummaryCards.tsx:67` | Clock icon («Ожидают») | `text-amber-600` | `text-status-warning` |
| `components/ReorderSummaryCards.tsx:77` | ShoppingCart icon («Заказано») | `text-blue-600` | `text-status-information` |
| `components/ReorderSummaryCards.tsx:87` | CheckCircle icon («Получено») | `text-green-600` | `text-status-success` |
| `components/ReorderSummaryCards.tsx:92` | ShieldAlert icon («Покрытие») | `text-red-600` | `text-status-error` |
| `components/ReorderTable.tsx:35` | `pending` chip | `bg-amber-100 text-amber-800` | `bg-status-warning/15 text-status-warning` |
| `components/ReorderTable.tsx:36` | `ordered` chip | `bg-blue-100 text-blue-800` | `bg-status-information/15 text-status-information` |
| `components/ReorderTable.tsx:37` | `received` chip | `bg-green-100 text-green-800` | `bg-status-success/15 text-status-success` |
| `components/__tests__/ReorderTable.test.tsx` | extended | — | +describe 168.8: 3 exact chip pins (bg+text classList.contains), expired-untouched pin (incl. negative contains), legacy DOM guard; `makeItem` helper typed from `ReorderRecommendation` |
| `components/__tests__/ReorderSummaryCards.test.tsx` | extended | — | +describe 168.8: 4 exact svg-icon pins (label → closest card → svg classList.contains), legacy DOM guard |

## Token mapping table (old → new)

| Legacy | Semantic | Rationale |
|--------|----------|-----------|
| `text-amber-600` | `text-status-warning` | «Ожидают» = supply-stage status indicator |
| `text-blue-600` | `text-status-information` | «Заказано» = informational stage status |
| `text-green-600` | `text-status-success` | «Получено» = process completeness — semantic status-success, NOT financial-positive |
| `text-red-600` | `text-status-error` | «Покрытие» = risk metric — status-error, NOT financial-negative |
| `bg-amber-100 text-amber-800` | `bg-status-warning/15 text-status-warning` | chip idiom /15 bg + full text; exact precedent `AlertHistoryHelpers.tsx:16`, `AlertRulesList.tsx:23` |
| `bg-blue-100 text-blue-800` | `bg-status-information/15 text-status-information` | same idiom |
| `bg-green-100 text-green-800` | `bg-status-success/15 text-status-success` | same idiom |
| `expired: bg-muted text-muted-foreground` | (unchanged) | already semantic — untouched per spec |

All 4 tokens verified present in `src/styles/globals.css` (light+dark `--status-*` definitions, lines 39-46/156-163/224+).

## Raw-palette sweep proof

Regex: `(bg|text|border|ring)-(red|yellow|blue|green|amber|emerald|rose|sky|slate|gray|zinc|orange|indigo|violet|purple|pink|lime|teal|cyan|stone|neutral|fuchsia)-[0-9]`

`grep -rnE <regex> "src/app/(dashboard)/analytics/reorder"` → **0 hits** (test files contain only the guard regex string itself, not usage).

## External consumers check

`grep -rln "ReorderSummaryCards|ReorderTable" src | grep -v "analytics/reorder"` → **0 importers outside the route**.

## Gates (worktree, all green)

- Targeted vitest before: **61/0**; after: **71/0** (+10 new: 3 ReorderTable chip pins + expired pin + guard; 4 icon pins + guard). 0 baseline tests touched.
- `npm run lint` → exit 0 (`--max-warnings 0`, 0 warnings)
- `npm run type-check` (`tsc --noEmit`) → exit 0
- `npx prettier --check` on all 4 changed files → pass
- (full vitest / build / e2e — NOT run, main-session owned per instructions)

## Gaps / escalations

- **/15 chip idiom light-mode contrast < AA 4.5:1** (pass-1 finding, 2026-08-18): `text-status-warning` on `bg-status-warning/15` ≈ 3.97:1, `text-status-success` ≈ 4.19:1 in light theme (dark passes 7.1-9.9:1). Inherited from the alerts idiom (AlertHistoryHelpers.tsx:15-17, AlertRulesList.tsx:22-24) — now 2 routes affected. Needs a wave-level contrast-ledger entry + token-level fix (darker chip-text token or /20+ bg) owned by foundation, not per-route. Legacy amber-800/amber-100 was 6.36:1 — light-theme regression, dark-theme improvement.
- Icon `text-status-warning` on `bg-muted` light = 4.42:1 — below 4.5 but icon is decorative (label sibling present); non-text AA 3:1 passes.
- Otherwise: all 7 pre-flight sites migrated exactly as specified; no deviations, no open questions.

## Lessons

_(placeholder — filled at review)_

## Change Log

- ReorderSummaryCards.tsx: 4 icon token swaps + decision comments (168.8)
- ReorderTable.tsx: 3 chip token swaps + idiom comment; expired untouched
- ReorderTable.test.tsx: +5 it (describe 168.8) + makeItem helper
- ReorderSummaryCards.test.tsx: +5 it (describe 168.8)
- Diff-stat: 4 files, +110 / −7
