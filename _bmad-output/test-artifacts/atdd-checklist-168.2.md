# ATDD Checklist — Story 168.2 (Migrate Analytics Alerts /analytics/alerts)

Acceptance criterion: Given the alerts center when migrated to shadcn semantic tokens then all behavior (query keys, URL state, tabs, labels, aria, testids, hook contract, role gating, threshold parse, filter sentinel, formatting, semantic-zero) remains unchanged and only presentation tokens change.

| # | Invariant | Evidence | Result |
|---|---|---|---|
| 1 | Severity badges: critical→`status-error`, warning→`status-warning`, info→`status-information` | `AlertRulesList.test.tsx` it.each (new) | PASS |
| 2 | StatusBadge: sent→`status-success`, pending→`status-warning`, failed→`status-error` | `AlertHistoryHelpers.test.tsx` it.each (new) | PASS |
| 3 | StatusBadge unknown-status fallback → `bg-muted text-muted-foreground` | `AlertHistoryHelpers.test.tsx` (new) | PASS |
| 4 | No legacy palette classes in migrated components' DOM | legacy-palette regex guards in all 3 test files (new) | PASS |
| 5 | Summary chips semantic: error/warning/information solid + `bg-primary` total | `AlertSummaryCards.test.tsx` it.each (new) | PASS |
| 6 | Russian labels/aria/testids unchanged | all pre-existing tests green, no label strings in diff | PASS |
| 7 | Tab semantics `summary\|rules\|history` + URL state unchanged | page.tsx / useAlertsPageState.ts unmodified in diff | PASS |
| 8 | Role gating `canManageOperationalData` unchanged | pre-existing AlertRulesList gating tests green | PASS |
| 9 | Threshold parseInt radix 10 / NaN-skip unchanged | `ThresholdInput.tsx` + dialogs unmodified | PASS |
| 10 | Filter `all`-sentinel semantics unchanged | `AlertHistoryTable.tsx` unmodified | PASS |
| 11 | Formatting (formatNumber/formatDate) + semantic-zero `?? 0` unchanged | pre-existing AlertSummaryCards tests green; files untouched | PASS |
| 12 | e2e headings/tabs/labels/filters/toggle/patch-body unweakened | `e2e/alerts-page.spec.ts` unmodified | PASS |
| 13 | h1 scale matches 168.1 hub (`text-3xl font-bold tracking-tight text-foreground`) | AlertsPageHeader diff; hub `AnalyticsPageHeader.tsx:21` | PASS |

Gaps: no e2e legacy-palette scan (no analogous pattern in alerts spec); StatusBadge previously had no unit coverage — new `AlertHistoryHelpers.test.tsx` created.
