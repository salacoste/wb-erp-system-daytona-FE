# ATDD Checklist — 169.2-FE Acquiring Period Detail token migration

| # | Acceptance criterion | Test | Status |
|---|---|---|---|
| 1 | h1 uses wave-canonical `text-2xl` | DetailPage "h1 uses wave-canonical text-2xl size" | ✅ |
| 2 | Inline refetch-error chip = status-warning matched-pair (`bg-status-warning/15`, `text-status-warning`, `border-status-warning/30`), zero amber | DetailPage "inline refetch-error chip uses status-warning matched-pair tokens (no amber)" | ✅ |
| 3 | Summary footnotes = `text-status-warning`, no amber | Summary "data-quality footnotes use text-status-warning token (no amber)" | ✅ |
| 4 | Money headlines (`Всего комиссий`, `Всего НДС`) = `tabular-nums`; counter card NOT | Summary "money headlines use tabular-nums; transaction counter does NOT" | ✅ |
| 5 | State machine preserved: skeleton → slow-loading → rate-limit banner → full-error → empty/cached | Baseline tests 1-4 (skeleton, slow-loading, empty) + new rate-limit-vs-full-error priority test | ✅ |
| 6 | Behavior lock: baseline 11 tests still pass | Full run 16 passed / 0 failed (11 baseline + 5 new) | ✅ |
| 7 | No `[class*=]` selectors; exact `getAttribute('class')` contains-pins only | Review of new assertions | ✅ |
| 8 | Owned-surface only (page.tsx/components/tests) | `git status --short` | ✅ |

Validation: vitest 16/0 · tsc 0 · eslint 0/0 · prettier clean.
