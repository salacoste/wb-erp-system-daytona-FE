# ATDD Checklist — 169.3-FE Acquiring Report Transaction Detail token migration

| # | Acceptance criterion | Test | Status |
|---|---|---|---|
| 1 | h1 uses wave-canonical `text-2xl`, keeps «Отчёт #id» identity | DetailPage "h1 uses wave-canonical text-2xl size and names the report" | ✅ |
| 2 | Inline refetch-error chip = status-warning matched-pair, zero amber | DetailPage "inline refetch-error chip uses status-warning matched-pair tokens (no amber)" | ✅ |
| 3 | Summary footnotes = `text-status-warning`, no amber | Summary "data-quality footnotes use text-status-warning token (no amber)" | ✅ |
| 4 | Money headlines + table money cells = `tabular-nums`; counter NOT | Summary "money headlines use tabular-nums..." + TransactionsTable "money cells (Сумма/Комиссия/НДС) use tabular-nums" | ✅ |
| 5 | Table caption carries report identity (RTC), additive optional prop | DetailPage "passes report identity to the transactions table caption" + TransactionsTable caption rendered/omitted pair | ✅ |
| 6 | Sibling safety: period consumer render unchanged without caption | TransactionsTable "does NOT render a caption when prop is omitted" + whole-acquiring suite 93/0 | ✅ |
| 7 | nmId row action names entity: aria-label + `text-status-information` (not blue-600) | TransactionsTable "nmId link has entity-naming aria-label..." | ✅ |
| 8 | Sortable th: aria-sort + tabIndex + Enter/Space keyboard activation | TransactionsTable "sortable th has aria-sort..." + "sortable th is keyboard-activatable..." | ✅ |
| 9 | Behavior lock: baseline 14 tests still pass | Full run 25 passed / 0 failed (14 baseline + 11 new) | ✅ |
| 10 | No `[class*=]` selectors; exact `getAttribute('class')` contains-pins only | Review of new assertions | ✅ |
| 11 | Owned-surface only | `git status --short` | ✅ |

Validation: vitest reports 25/0 · whole-acquiring 93/0 · tsc 0 · eslint 0/0 · prettier clean.
