# ATDD Checklist — 169.5-FE Buyout Reconciliation token migration

| # | Acceptance criterion | Test | Status |
|---|---|---|---|
| 1 | Anomaly count + icon use `text-status-warning` (matched pair), no legacy amber count | `AnomalyIndicator.test.tsx` — exact `toHaveClass('text-status-warning')` on count+icon + negative `not.toHaveClass('text-amber-700')` | ✅ |
| 2 | Tooltip trigger focus ring = `focus-visible:ring-ring`, weight `ring-2` preserved | `AnomalyIndicator.test.tsx` — `focus-visible:ring-ring` + `focus-visible:ring-2` pins on `[tabindex="0"]` | ✅ |
| 3 | h1 = 169.x canon `text-2xl font-bold tracking-tight` (foreground inherited) | Covered by existing heading-role test (behavior-lock); token = presentation-only swap | ✅ |
| 4 | nmId validation hint = `text-status-warning` | `BuyoutReconciliationPageContent.test.tsx` M-1 test — exact class pin on hint | ✅ |
| 5 | Stale-data banner = /15-chip idiom (`border-status-warning/30` + `bg-status-warning/15` + `text-status-warning`), testid preserved | `BuyoutReconciliationPageContent.test.tsx` — triple exact pin + `stale-data-banner` testid | ✅ |
| 6 | No-anomalies Alert = success/15+30 pair; icon + description `text-status-success` | `BuyoutReconciliationPageContent.test.tsx` — Alert border/bg pins + icon/description token pins | ✅ |
| 7 | Table named for AT: `TableCaption` with period identity (ru-RU `DD.MM.YYYY — DD.MM.YYYY`) | `ReconciliationTable.test.tsx` — caption presence + `/\d{2}\.\d{2}\.\d{4} — \d{2}\.\d{2}\.\d{4}/` regex | ✅ |
| 8 | Caption never blank-period: «за всё время» fallback when no periodLabel | `ReconciliationTable.test.tsx` — fallback-text assertion | ✅ |
| 9 | Numeric value cells `tabular-nums` (5 count columns); nmId font-mono without tabular-nums | `ReconciliationTable.test.tsx` — exact-count pin `td.tabular-nums` = 5 per row | ✅ |
| 10 | Behavior lock: baseline 23 still pass, it( only grew | Full targeted run **30 passed / 0 failed** (3 files, 23 → 30; 0 baseline tests dropped) | ✅ |
| 11 | Zero legacy palette literals in source | grep `(text|bg|border|ring)-(amber|green|gray|blue|orange|red|yellow)-[0-9]` (excl. tests) → 0 hits | ✅ |
| 12 | Exact pins only (no `[class*=]`) | Review of new assertions — all `toHaveClass` / `querySelector` | ✅ |
| 13 | Owned surface only | `git status --short` — 8 owned files modified + 2 artifacts | ✅ |

Validation: vitest targeted 30/0 · tsc exit 0 · eslint clean (--max-warnings 0) · prettier clean · source files ≤200 lines (max 131).
