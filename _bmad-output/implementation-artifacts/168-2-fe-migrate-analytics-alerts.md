# Story 168.2 — Migrate Analytics Alerts `/analytics/alerts`

- **Status:** done — (was: "review (awaiting orchestrator commit/PR)"; synced by Story 174.5 on 2026-09-02; authoritative delivery/gate evidence: sprint-status.yaml row with PR/merge/review/vitest)
- **Branch / worktree:** `cdx/epic-168-story-2-alerts` @ `/private/tmp/wb-fe-168-2-migrate-analytics-alerts`
- **Base SHA:** `e9370c7b` (= FE origin/main)
- **Acceptance criterion:** Given the alerts center with summary KPI cards, rule list, and history when migrated to shadcn semantic tokens then query keys, URL state, tab semantics (`summary|rules|history`), Russian labels, aria-labels, testids, `useAlertsPageState` contract, role gating (`canManageOperationalData`), threshold parse semantics (parseInt radix 10, NaN-skip), `all`-sentinel filter semantics, and formatting remain unchanged — only presentation tokens change.

## Behavior-Lock Inventory (pre-flight)

Targeted baseline: `npx vitest run "src/app/(dashboard)/analytics/alerts"` → **5 files / 61 tests, all green**.

Locked (untouched in diff): `useAlertsPageState.ts`, `page.tsx` state/tab logic, `ThresholdInput.tsx` parse semantics, both dialogs' form contracts, `AlertHistoryTable.tsx` filter `all`-sentinel, all Russian labels/aria-labels/testids, e2e assertions in `e2e/alerts-page.spec.ts` (file unmodified).

## Changes

| File | Change |
|---|---|
| `components/AlertHistoryHelpers.tsx` | `statusStyles` typed static map → semantic tokens (see tone maps below); StatusBadge unknown-fallback `bg-gray-100 text-gray-800` → `bg-muted text-muted-foreground`. |
| `components/AlertRulesList.tsx` | `severityColors` typed static map → semantic tokens. Badge `variant="outline"` kept. RuleRow container/ghost buttons untouched (already semantic: `rounded-lg border`, `text-muted-foreground`). Empty state untouched (BellOff + documented h2). |
| `components/AlertSummaryCards.tsx` | MetricCard `color` chips: `bg-red-500`/`bg-yellow-500`/`bg-blue-500` → `bg-status-error`/`bg-status-warning`/`bg-status-information`; `bg-primary` stays; icons keep `text-white`. |
| `components/AlertsPageHeader.tsx` | h1 upgraded to match 168.1 analytics-hub scale `text-3xl font-bold tracking-tight text-foreground` (was `text-2xl font-bold tracking-tight`); header row responsive wrap `flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`. Copy untouched. |
| `components/__tests__/AlertRulesList.test.tsx` | +4 semantic-token pins (3 severity it.each + legacy-palette DOM guard). |
| `components/__tests__/AlertSummaryCards.test.tsx` | +4 semantic-token pins (3 chip it.each + legacy-palette DOM guard). |
| `components/__tests__/AlertHistoryHelpers.test.tsx` | NEW (no prior StatusBadge coverage existed): 3 status it.each + muted fallback + legacy-palette guard + 2 `parseMessage` pins = 6 tests. |

**Forbidden files untouched:** nothing outside the owned alerts surface (no `src/components/ui/`, hooks, lib, types).

## Tone maps introduced (exact class strings)

- `statusStyles` (AlertHistoryHelpers, `Record<string,string>`):
  - `sent` → `'bg-status-success/15 text-status-success'`
  - `pending` → `'bg-status-warning/15 text-status-warning'`
  - `failed` → `'bg-status-error/15 text-status-error'`
  - fallback → `'bg-muted text-muted-foreground'`
- `severityColors` (AlertRulesList, `Record<AlertSeverity,string>`):
  - `critical` → `'bg-status-error/15 text-status-error'`
  - `warning` → `'bg-status-warning/15 text-status-warning'`
  - `info` → `'bg-status-information/15 text-status-information'`
- Summary chips (literal props): `bg-status-error`, `bg-status-warning`, `bg-status-information`, `bg-primary`.

All maps are typed static records — zero runtime class interpolation.

## Gates (worktree, Node 24.18.0)

- Targeted vitest: **6 files / 76 passed / 0 failed** (baseline 61 → +15, count only grew)
- `npm run lint` → 0 errors 0 warnings
- `npm run type-check` → 0 errors
- `npm run check:max-lines` → OK (source 200, test 800)
- `npm run format:check` → all files pass
- Full vitest / next build / e2e: intentionally NOT run (main session owns)

## Dev Agent Record

- Precedent check: 168.1 hub h1 = `text-3xl font-bold tracking-tight text-foreground` (`AnalyticsPageHeader.tsx:21`) — matched for cross-route consistency.
- e2e `alerts-page.spec.ts` has no legacy-class scan pattern → no e2e addition (recorded as gap below), no assertion weakened.

## Lessons

_(placeholder — filled at review)_

## Gaps

- No e2e legacy-palette DOM scan for this route (file has no analogous pattern to extend); unit-level DOM guards cover the migrated components.
- `StatusBadge`/`AlertHistoryHelpers` had zero prior unit coverage — new test file created for the pins (smallest viable addition).

## Change Log

| Date | Pass | Findings (verdict REQUEST-CHANGES) | Fixes |
|------|------|-----------------------------------|-------|
| 2026-08-17 | Review pass-1 | F1 (HIGH): dark-mode contrast — MetricCard chips hardcoded `text-white` icons on theme-flipping status bg tokens (white-on-pastel ≈1.5:1). F2 (MEDIUM): LEGACY_PALETTE_RE incomplete (missed rose/amber/emerald/sky/etc + border-). F3 (MEDIUM): `[class*=]` substring selectors could false-pass (e.g. `bg-status-error-foreground`). Non-blocking: AlertHistoryHelpers docblock claimed "Typed" for a `Record<string,string>`. | F1: MetricCard gained explicit `iconClassName` prop; icons now paired-foreground (`text-primary-foreground` / `text-status-{error,warning,information}-foreground`), hardcoded `text-white` removed. F2: expanded regex applied in all 3 test files (AlertRulesList/AlertSummaryCards/AlertHistoryHelpers). F3: replaced substring querySelector with exact `classList.contains(token)` scan in all 3 test files (tokens updated to exact class entries, e.g. `text-status-error`). Docblock softened to "Static status tone map" (zero `as` casts). Gates: vitest alerts 76/76, lint clean, tsc clean, prettier clean. |
