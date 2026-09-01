# 169.1 FE — Migrate Acquiring Report Index (`/analytics/acquiring`) to shadcn tokens

- **Status**: done — (was: "Code-complete (uncommitted in worktree, per wave protocol)"; synced by Story 174.5 on 2026-09-02; authoritative delivery/gate evidence: sprint-status.yaml row with PR/merge/review/vitest)
- **Branch**: `cdx/epic-169-story-1-acquiring-shadcn`
- **Base**: `ecdebde0` (origin/main)
- **Worktree**: `/private/tmp/wb-repricer-fe-169-1-acquiring-shadcn`

## Acceptance

Presentation-only migration of the acquiring index page (page.tsx wrapper untouched —
already clean). Legacy amber literals replaced with `status-warning` matched-pair /15-chip
idiom; h1 to wave-canonical scale; table gains `<TableCaption>` (RTC contract), sortable
headers gain `aria-sort` + keyboard activation (AX contract), money cells gain
`tabular-nums`. Behavior locked: baseline 67 targeted tests → 75 after (0 fail), it( only
grew. Shared components (AcquiringRateLimitBanner, AnomalyVatIndicator) migrated in this
story; sibling consumers (169.2/169.3) will inherit on their own passes.

## Changes (per file, was → became)

| File | Sites | Change |
|---|---|---|
| `components/AcquiringPageContent.tsx` | 2 | h1 `text-3xl font-bold tracking-tight text-foreground` → `text-2xl font-bold tracking-tight` (168.11 UnitEconomicsHeader precedent, foreground inherited); inline refetch-error chip `border-amber-200 bg-amber-50 text-amber-800` → `border-status-warning/30 bg-status-warning/15 text-status-warning` (/15-chip matched pair). ui/alert variants (destructive + default) untouched — already semantic. |
| `components/AcquiringSummaryCards.tsx` | 2 | footnote `text-amber-700` → `text-status-warning` (data-quality nuance = warning semantics). |
| `components/AcquiringReportsTable.tsx` | 4+ | added `<TableCaption>Отчёты эквайринга</TableCaption>` (RTC); sortable `th` gains `aria-sort={ascending|descending|undefined}`, `tabIndex={0}`, `onKeyDown` (Enter/Space → handleSort with preventDefault); Комиссия + НДС cells `text-sm` → `text-sm tabular-nums`. `'—'` null rendering untouched (anti-pattern #8). |
| `components/shared/AcquiringRateLimitBanner.tsx` | 1 | `border-amber-200 bg-amber-50 text-amber-800` → `border-status-warning/30 bg-status-warning/15 text-status-warning`. role="status", data-testid, copy, button, comments preserved (comment "Amber banner" → "Amber (status-warning token) banner"). |
| `components/shared/AnomalyVatIndicator.tsx` | 1 | icon `text-amber-500` → `text-status-warning`; comment updated. aria-label + Tooltip untouched. |
| `page.tsx` | 0 | untouched (11-line wrapper, already clean). |

## Class mapping (before → after)

- `text-3xl … text-foreground` (h1) → `text-2xl font-bold tracking-tight`
- `border-amber-200 bg-amber-50 text-amber-800` → `border-status-warning/30 bg-status-warning/15 text-status-warning` (2 sites: chip + banner)
- `text-amber-700` (footnote) → `text-status-warning`
- `text-amber-500` (icon) → `text-status-warning`

## Test changes

- `AcquiringRateLimitBanner.test.tsx`: "renders amber styling classes" pin (`toContain('amber')`) → matched-pair token pin (bg/15 + text + border/30 + not-amber). 4 → 4 it(.
- `AcquiringPageContent.test.tsx`: +2 it( — h1 canonical scale pin; inline chip matched-pair pin (uses `emptyAcquiringListResponse()` spread for the typed `cachedAt` field). 4 → 6.
- `AcquiringReportsTable.test.tsx`: +4 it( — caption present and is `<caption>`; aria-sort direction (inactive → ascending → descending, default column desc); keyboard Enter/Space focus-driven sort; money cells tabular-nums (fee+vat yes, ID cell no). 10 → 14.
- `AcquiringSummaryCards.test.tsx`: +1 it( — footnotes text-status-warning. 18 → 19.
- `AnomalyVatIndicator.test.tsx`: +1 it( — SVG class via `getAttribute('class')` (SVGAnimatedString lesson) contains text-status-warning. 6 → 7.

## Verification (commands + exit codes)

| Check | Command | Result |
|---|---|---|
| Baseline (lock) | `npx vitest run "src/app/(dashboard)/analytics/acquiring"` | 67 passed / 9 files, exit 0 |
| After edits | same | **75 passed / 9 files / 0 failed**, exit 0 |
| Types | `npx tsc --noEmit` | 0 errors, exit 0 |
| Lint | `npx eslint <each changed file, quoted>` | 0 errors / 0 warnings, exit 0 |
| Format | `npx prettier --check <each changed file, quoted>` | all pass, exit 0 |
| Hex-sweep | `grep -rnE "#[0-9A-Fa-f]{3,8}\b" components/` | only `#166` (Request number in comment), no color hex |

## Gaps / deviations

1. **h1 dropped `text-foreground`** — the prompt inventory suggested keeping it, but the
   canonical 168.11 precedent (`UnitEconomicsHeader.tsx` on origin/main) is
   `text-2xl font-bold tracking-tight` with no explicit foreground (inherits). Followed
   the precedent over the inventory line.
2. **aria-sort assertion order fixed once** — first draft asserted the default-sorted
   column AFTER re-sorting another column (state had moved); restructured to assert
   before activation + re-assert inactive after. No production change involved.
3. No e2e/full-suite/build run — out of scope for executor lane (main-session duties).

## Review questions

- Banner/chip matched-pair contrast: `text-status-warning` on `bg-status-warning/15` over
  page background — same idiom as AlertHistoryHelpers /15-chip; flagged for dark-mode
  visual pass (174.3) rather than changed here.

## Post-pass-1-review fixes

### Fix 1 (MEDIUM): «Детали» link aria-label names its target

- **Finding**: `AcquiringReportsTable.tsx` ~L143 — generic «Детали» link violated the AX contract
  "report links name their target"; every row has its own reportId.
- **Fix**: added `aria-label={`Детали отчёта ${item.reportId}`}` on the Link (visible text «Детали» kept).
- **Test-pin**: new it( renders 2 items → `screen.getByLabelText('Детали отчёта 1'|'Детали отчёта 2')`
  exist with unique labels + hrefs `/analytics/acquiring/reports/1|2`.
- **Validation**: `npx vitest run "src/app/(dashboard)/analytics/acquiring"` → **76 passed / 0 failed**
  (9 files); eslint 0/0 on both changed files; prettier --check pass (after --write on the test file).
- **Files**: `src/app/(dashboard)/analytics/acquiring/components/AcquiringReportsTable.tsx`,
  `src/app/(dashboard)/analytics/acquiring/components/__tests__/AcquiringReportsTable.test.tsx`.

## Post-pass-2-review fixes

### Fix 1 (MEDIUM): money summary totals gain `tabular-nums` (RTC contract)

- **Finding**: `AcquiringSummaryCards.tsx` L81/L97 — «Всего комиссий» + «Всего НДС» headlines were
  `text-2xl font-bold` without `tabular-nums`, violating the RTC contract "financial totals use
  tabular RUB precision". (Any pass-1 LOW-fold on card tabular-nums is now **resolved by this fix** —
  history preserved, no open folds remain.)
- **Fix**: `className="text-2xl font-bold tabular-nums"` on both money `<p>` headlines. Precedent on
  origin/main: `src/app/(dashboard)/analytics/components/MarketingKpiCard.tsx:84`
  (`text-xl font-bold tabular-nums`). Cards «Отчётов» (counter) and «Период» (date) intentionally
  left non-tabular.
- **Test-pin**: new it( in `__tests__/AcquiringSummaryCards.test.tsx` — money totals'
  `closest('p')` className contains `tabular-nums`; counter + period paragraphs do not.
- **Validation**: `npx vitest run "src/app/(dashboard)/analytics/acquiring"` → **77 passed / 0 failed**
  (9 files); eslint 0/0 and prettier --check pass on both changed files.
- **Files**: `src/app/(dashboard)/analytics/acquiring/components/AcquiringSummaryCards.tsx`,
  `src/app/(dashboard)/analytics/acquiring/components/__tests__/AcquiringSummaryCards.test.tsx`.
