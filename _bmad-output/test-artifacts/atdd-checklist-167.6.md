# ATDD Checklist — Story 167.6 (Migrate /processing)

Acceptance criterion: polling cadence, stage/progress, safe-leave, recovery, next navigation remain correct without misleading zeros or duplicate requests; completed onboarding state retained.

| # | Invariant | Evidence | Result |
|---|---|---|---|
| 1 | Loading shows no fabricated progress | `ProcessingStatus.test.tsx` — no `%` text, no `progressbar` role while unknown | PASS |
| 2 | Running state: server progress + honest percents | component test `45 %`/`30 %` anchored; e2e `40 %` + `aria-valuenow=40` | PASS |
| 3 | progressbar semantics + accessible names | component test: 2 bars, `aria-valuenow`, names | PASS |
| 4 | Task status text per stage (in_progress/pending) | pre-existing test (`выполняется`/`ожидает начала`) still green | PASS |
| 5 | Completed → success alert | component + e2e `Обработка завершена!` | PASS |
| 6 | Completed → dashboard redirect exactly once, 2s delay, cleanup on unmount | component test `mockPush` 1× across rerender; e2e single navigation observation | PASS |
| 7 | Failed → destructive alert + server error or fallback copy | component test fallback copy | PASS |
| 8 | Failed recovery CTAs: reload retry + dashboard push | component test button roles + push target; e2e buttons visible | PASS |
| 9 | API error → «Ошибка загрузки статуса» + reload CTA | pre-existing test still green | PASS |
| 10 | `no_data` terminal: neutral copy, manual CTA, no auto-redirect | pre-existing test (167.x) still green | PASS |
| 11 | No duplicate/overlapping polling requests | e2e: `maxConcurrentRequests ≤ 1`, `listAttempts ≥ 3` | PASS |
| 12 | Terminal status stops polling | e2e: list attempts settle over 7s window | PASS |
| 13 | Failed-batch reconcile exactly once | e2e: `reconcileAttempts === 1` | PASS |
| 14 | Polling cadence (3s) preserved | read-only hook/polling-strategy untouched (diff-verified) | PASS |
| 15 | Completed onboarding state retained (no auth/onboarding mutation by route) | route mutates no store; diff shows presentation-only changes | PASS |
| 16 | Single h1 + main landmark after PageHeader migration | page test | PASS |
| 17 | Russian copy unchanged | manual diff review of all copy strings | PASS |
| 18 | Reduced motion | `motion-reduce:animate-none` on skeleton; e2e emulated `reducedMotion: 'reduce'` | PASS |

Gaps: real screen-reader audit (see story record).
