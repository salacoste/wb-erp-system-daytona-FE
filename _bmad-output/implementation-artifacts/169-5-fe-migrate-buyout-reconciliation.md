# 169.5 FE — Migrate Buyout Reconciliation (`/analytics/buyout-reconciliation`) to shadcn tokens

- **Status**: Code-complete (uncommitted in worktree, per wave protocol)
- **Branch**: `cdx/epic-169-story-5-buyout-reconciliation-shadcn`
- **Base**: `f4b41290` (origin/main)
- **Worktree**: `/private/tmp/wb-repricer-fe-169-5-buyout-reconciliation-shadcn`

## Acceptance

Presentation-only token migration of the buyout-reconciliation route (page orchestrator +
controls + state machine + table + anomaly indicator). Warning semantics → `status-warning`,
success state → `status-success/15+30` idiom, h1 → 169.x canon, focus ring → `ring-ring`.
RTC additions: `TableCaption` naming table + period (threaded `periodLabel` prop
PageContent → StateMachine → Table with «за всё время» fallback), `tabular-nums` on the 5
numeric value columns (nmId stays font-mono only). Behavior locked: baseline 23 →
**30 passed / 0 failed** (3 files, it( only grew).

## Changes (per file, was → became)

| File | Sites | Change |
|---|---|---|
| `components/AnomalyIndicator.tsx` | 3 | count `text-amber-700` → `text-status-warning`; AlertTriangle `text-amber-500` → `text-status-warning` (matched pair); `focus-visible:ring-amber-400` → `focus-visible:ring-ring` (weight `ring-2` + `rounded` preserved). Header comment "amber count" → "warning count". |
| `components/BuyoutReconciliationPageContent.tsx` | 1 + RTC | h1 `text-3xl … text-gray-900` → `text-2xl font-bold tracking-tight` (169.x canon, foreground inherited). NEW: `periodLabel` computed from `dateRange` via `formatDate` (ru-RU `DD.MM.YYYY — DD.MM.YYYY`), `dateRange === undefined` → `'за всё время'` (picker `onChange` accepts undefined — fallback reachable); passed to StateMachine. |
| `components/ReconciliationControls.tsx` | 1 | validation hint `text-amber-700` → `text-status-warning`. |
| `components/ReconciliationStateMachine.tsx` | 3 + RTC | stale banner `border-amber-200 bg-amber-50 … text-amber-800` → `border-status-warning/30 bg-status-warning/15 … text-status-warning` (/15-chip banner idiom; `data-testid="stale-data-banner"` preserved); no-anomalies Alert `border-green-200 bg-green-50` → `border-status-success/30 bg-status-success/15`, icon `text-green-600` → `text-status-success`, description `text-green-800` → `text-status-success`. NEW optional `periodLabel` prop forwarded to `ReconciliationTable`. Loading/no-data/error branches untouched. |
| `components/ReconciliationTable.tsx` | 0 + RTC | NEW `TableCaption` `Реконсиляция выкупов за период {periodLabel ?? 'за всё время'}` (caption always names the period — no blank-period caption); NEW optional `periodLabel?: string` prop; `tabular-nums` added to buyoutQuantity, returnQuantity, returnWithoutBuyout, orphanBuyout, returnQuantityMismatch cells. nmId `font-mono` untouched (ID, not compared value). No aria-sort (static table, no sorting). |
| `page.tsx` | 0 | untouched. |

## Token mapping (before → after)

| Legacy | Token | Sites |
|---|---|---|
| `text-amber-700` | `text-status-warning` | 2 (AnomalyIndicator count, Controls hint) |
| `text-amber-500` | `text-status-warning` | 1 (icon — matched pair) |
| `focus-visible:ring-amber-400` | `focus-visible:ring-ring` | 1 (weight preserved) |
| `text-3xl … text-gray-900` (h1) | `text-2xl font-bold tracking-tight` | 1 |
| `border-amber-200 bg-amber-50 … text-amber-800` (banner) | `border-status-warning/30 bg-status-warning/15 … text-status-warning` | 1 site / 3 literals |
| `border-green-200 bg-green-50` | `border-status-success/30 bg-status-success/15` | 1 |
| `text-green-600` / `text-green-800` | `text-status-success` | 2 |

Методика подсчёта: **site = изменённый className-выражение**; сырых legacy-literal вхождений
(grep до правок, `(text|bg|border|ring)-(amber|green|gray)-[0-9]` в source) = **12**;
migration-sites = **9**. Post-migration legacy grep (excl. tests): **0 hits** (exit 1).

## RTC additions

- `TableCaption` — именует таблицу + период; `periodLabel` строится в PageContent
  (единственный потребитель) и проксируется StateMachine → Table. `dateRange` опционален
  (picker позволяет сброс) → fallback «за всё время» в компоненте; тест пинит оба пути.
- `tabular-nums` × 5 колонок × строку (exact-count pin = 5 на 1-строчной фикстуре;
  AnomalyIndicator span'ы класса не несут — td считается, span нет).
- aria-sort не добавлен — сортировки в таблице нет (статичная, решение оркестратора).

## Test changes (23 → 30, +7 it(, 0 dropped)

- `AnomalyIndicator.test.tsx` (+2): exact пин `text-status-warning` на count + icon,
  негативный пин `not.toHaveClass('text-amber-700')`; пин `focus-visible:ring-ring` +
  `focus-visible:ring-2` на триггере.
- `BuyoutReconciliationPageContent.test.tsx` (+2, + пин в существующем M-1):
  stale-banner тройка `border-status-warning/30`+`bg-status-warning/15`+`text-status-warning`
  + testid сохранён; no-anomalies Alert success/15+30 пары + icon/description tokens;
  валидационная строка `text-status-warning` пин.
- `ReconciliationTable.test.tsx` (+3): caption presence + период-лейбл regex
  `/\d{2}\.\d{2}\.\d{4} — \d{2}\.\d{2}\.\d{4}/`; caption fallback «за всё время»;
  exact-count `td.tabular-nums` = 5.

Все пины exact (`toHaveClass` / `querySelector`), `[class*=]` не добавлен.

## Gaps

- `periodLabel` опционален и на StateMachine, и на Table (не non-optional): dateRange
  сбрасываем пикером (onChange: `(range: DateRange | undefined) => void`), поэтому
  «undefined невозможен» — неверно; fallback «за всё время» в рендере Table покрывает
  прямой рендер без пропа (тест пинит). Соответствует решению оркестратора.
- MAIN-verify: двойной fallback caption («за период за всё время») — периодная фраза
  консолидирована в PageContent, Table рендерит как есть.
- /15-chip `text-status-warning` на `bg-status-warning/15` — известная
  foundation-owned contrast-эскалация (консолидация в 174.2, см. 169.4 Gaps).

## Verification

- `npx vitest run "src/app/(dashboard)/analytics/buyout-reconciliation"` → 3 files / **30 passed / 0 failed** (baseline 23).
- `npm run type-check` → exit 0.
- Legacy grep (source, excl. tests): **0 hits**.
- `npx eslint … --max-warnings 0` → clean (`lint-ok`).
- Prettier check: clean; source files ≤200 lines (max: PageContent 131).
- No `as any` added; no state-machine/query/URL/polling/tooltip-contract/copy/SourceBadge changes.

## Review outcome (2-pass opus, 2026-08-19)

**PASS-with-findings · PASS-with-findings** (0 CRITICAL/HIGH). Триаж оркестратора:

- **[false-negative P1]** «артефакт-record отсутствует» — ОПРОВЕРГНУТО: файл существует
  (ls-пруф MAIN-сессии; паттерн #22 — reviewer false-negative, канонический путь проверен
  оркестратором).
- **[folded, контраст-числа]** /15-chip light: warning-banner text-status-warning на /15 =
  **3.96** (legacy amber-800/amber-50 был 6.84); success-alert text-status-success на /15 =
  **4.21** (legacy green-800/green-50 был 6.81); dark 10.37/7.77 PASS. Оба = KNOWN
  foundation-owned /15-эскалация, консолидация 174.2 (волновой прецедент 3.97-4.19; не хуже).
  Остальные пары PASS: text-status-warning на card 4.81/13.38 (legacy amber-700 5.02 — чуть
  ниже, всё ещё AA); ring на background 5.62/8.67.
- **[folded]** formatDate invalid-Date guard (pathological: DateRange типизирован Date).
- **[folded]** no-anomalies тест на isError:true-моке (баннер+алерт рендерятся вместе —
  семантически стоило бы чистый isError:false; пины валидны, cosmetic).
- **[folded]** periodLabel вычисляется безусловно (читаемость > микро-рендер); дубль
  'за всё время' в 2 точках (PageContent-источник + Table-safety-fallback, тест пинит
  консистентность).
- MAIN-verify фикс до ревью: двойной fallback caption («за период за всё время») — устранён
  (single-source фраза в PageContent).
