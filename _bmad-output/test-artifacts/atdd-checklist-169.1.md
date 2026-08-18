# ATDD Checklist — Story 169.1 (Acquiring Report Index /analytics/acquiring migration)

| # | Invariant | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Banner /15-chip matched pair → exact `bg-status-warning/15` + `text-status-warning` + `border-status-warning/30`, no `amber` | AcquiringRateLimitBanner.test className contains pins (+not-contains amber) | PASS |
| 2 | Inline refetch-error chip (cached data + failed refetch) → same matched pair | AcquiringPageContent.test chip-pinned className contains pins | PASS |
| 3 | h1 → exact `text-2xl font-bold tracking-tight` (168.11 precedent), no `text-3xl` | AcquiringPageContent.test heading-level-1 className pins | PASS |
| 4 | Summary footnote → exact `text-status-warning`, no amber | AcquiringSummaryCards.test footnotes getAllByText className pins | PASS |
| 5 | Anomaly icon svg → exact `text-status-warning` (class read via getAttribute — SVGAnimatedString lesson) | AnomalyVatIndicator.test svg attribute pin | PASS |
| 6 | Table caption present and names the table (`Отчёты эквайринга`, `<caption>` tag) | AcquiringReportsTable.test caption tagName assertion | PASS |
| 7 | aria-sort reflects direction on active sortable th; absent on inactive; default column (Создан) desc on mount | AcquiringReportsTable.test th aria-sort assertions across states | PASS |
| 8 | Keyboard Enter/Space activate sorting on focused th (tabindex=0) | AcquiringReportsTable.test user.keyboard focus-driven sort reorder assertions | PASS |
| 9 | Money cells (Комиссия/НДС) → `tabular-nums`; non-money cells unaffected | AcquiringReportsTable.test cells[3]/cells[4] contains + cells[0] not-contains | PASS |
| 10 | Null money still renders `'—'` (anti-pattern #8 discipline, untouched) | existing baseline test "null acquiringFeeSum renders as —" still green | PASS |
| 11 | Behavior-lock: state machine (skeleton → banner → error → empty/cached), sort semantics, anomaly rule, pluralization — untouched | 67 baseline tests untouched + green; 75/0 total; only className strings + caption/a11y attrs + comments changed | PASS |
| 12 | Owned surface only: no period/reports siblings, no shared infra, no hex introduced | git status = 6 prod-adjacent files (5 owned components, page.tsx untouched) + 5 test files + 2 artifacts; hex-sweep only `#166` (Request number in comment) | PASS |
| 13 | Shared components (banner, anomaly) keep public contract for 169.2/169.3 | role="status", data-testid, aria-label, copy, props — unchanged; only className strings migrated | PASS |
| 14 | Test fixtures typed (AcquiringListResponse via emptyAcquiringListResponse spread) — no `as any` (mockHook cast pre-existing, untouched) | tsc --noEmit exit 0; eslint 0/0 on all changed files | PASS |

Targeted gates: vitest 75/0 (baseline 67) · tsc 0 errors · eslint 0/0 · prettier pass. Full vitest/build/e2e — main-session owned.
