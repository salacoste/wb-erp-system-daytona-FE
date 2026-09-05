# P2 boundary-sweep волна-1: financial-summary family (11 файлов, 58 сайтов)

**Status**: done (2026-09-02, сессия-2 оркестратора V15; PR #394, merged)
**Branch**: `debt/p2-boundary-wave1-finsum` (worktree `/private/tmp/p2-bw1-finsum`, base main `c4c7bf3c`)
**Owner-track**: P2 boundary 459 owner-sweep, волна 1 из ~6 (каталог `_bmad-output/planning-artifacts/shadcn-ui-boundary-classification-manifest.md`)

## Дефект (verified live, pre-flight)

59 файлов / 459 legacy-palette нарушений (ratchet baseline). Волна-1 = когерентное семейство `src/components/custom/financial-summary/` (11 файлов, 58 сайтов, 0 hex — консервативный скоуп: без chart-hex файлов). Живой пересчёт сошёлся с каталогом 1:1.

## Tasks

- [x] Pre-flight: живой per-file пересчёт (58/0), инвентарь классов (29 уникальных), токены, тест-пины (ProfitSection.test.tsx манифест-пинен — не потребовался), потребитель-closure (1 ре-экспорт FinancialSummaryTable → AnalyticsSummaryContent)
- [x] Волна (executor opus): все 58 сайтов → семантические токены; WCAG-харнесс (/tmp) с HSL→sRGB + alpha-blend; каждый replacement замерен (обе темы, card+background)
- [x] Ratchet: boundary 459 → **401** (ровно −58); baseline + CLAUDE.md тем же коммитом
- [x] 2 ревью-прохода: REJECT(2H/1M/2L) → fix-волна → APPROVE(2M/3L, все attestation-слой) → fix-волна-2 (doc-класс)
- [x] Валидация: полный vitest 19424/0 · lint 0/0 · tsc 0 · docs 95 · locale 4 · prettier · boundary 401 ratchet-down

## Маппинг-решения (канон для следующих волн)

1. **Нейтральные**: gray-400/500/600 → `text-muted-foreground`; `border-gray-200` → `border-border`.
2. **Money-direction** (дельты чисел): green/red-600 → `text-financial-positive/negative` (5.13/5.62 light на card).
3. **Tinted-паттерны**: по смыслу emerald/green→success, blue/indigo→information, amber/orange→warning, red→error; канон W2a `bg-status-*/10 + border-status-*/20`.
4. **HOUSE RULE (pass-2, канон)**: цветной текст на тинте обязан мерить ≥4.5:1 light; при фейле — ЛИБО тинт /5 (financial-строки: 4.44→4.78 light / 8.77 dark), ЛИБО текст → foreground/muted (success-заголовки: 14.11/6.85 на /10). Замеренный pass на /10 остаётся /10 (status-information на info/10 = 4.98).
5. **Дельта ≠ ошибка**: returns-arrow red → financial-negative (направление денег, не error-state).

## Dev Agent Record

### Post-1st-pass-review fixes (2026-09-02)

Findings (5: 2 HIGH / 1 MEDIUM / 2 LOW; VERDICT REJECT-as-is):
- **F1 [HIGH]** 3 stale-пина в co-located ре-экспорт-тесте `FinancialSummaryTable.test.tsx` (ВНЕ семейной директории — scope-инструкт исполнителя скрывал их; «exactly 1 re-pin» аттестация была ложна). **APPLIED**: 3 ре-пина (включая CSS-escaped `/`-селектор) + repo-wide grep (47 хитов — все чужие компоненты, вне скоупа).
- **F2 [HIGH]** незамеренная пара `financial-positive on info/10` = **4.44 sub-AA** на центральном паттерне (ChangeIndicator в подсвеченных MetricRow). **APPLIED**: /10→/5 на MetricRow info + ExpenseRow warning (замеры 4.78-5.28 light / 8.02-8.77 dark, все AA) + house-rule комментарий.
- **F3 [MEDIUM]** baseline/CLAUDE.md не снижены. **APPLIED** оркестратором в closeout (этот же PR).
- **F4 [LOW]** FunnelLevel без бордера (канон + комментарий). **APPLIED**: per-kind бордеры через COLOR_MAP.
- **F5 [LOW]** ChangeIndicator комментарий — on-card числа при on-tint контекстах. **APPLIED**.

### Post-2nd-pass-review fixes (2026-09-02)

Findings (5: 2 MEDIUM / 3 LOW; VERDICT APPROVE — все функциональные/гейт-заявки верифицированы НЕЗАВИСИМО, включая переписанный контраст-калькулятор ревьюером):
- **F1 [MEDIUM]** харнесс считал dark-числа тинтов над background вместо card (card=6.67% vs bg=3.92%) — вердикты не перевернулись, но 3 комментария врали числами. **APPLIED**: onCard-default → card, лог регенерирован, комментарии исправлены (8.77/8.20, 8.57/8.02, 7.32).
- **F2 [MEDIUM]** house-rule комментарий формулировал правило неверно («/10 только для foreground/muted» — опровергнуто 4.98-pass внутри волны) + цитировал /5-числа как /10-пример. **APPLIED**: пороговая формулировка + правильный пример.
- **F3 [LOW]** FunnelLevel border 1px ≠ заявленный border-2-match. **APPLIED**: success → `border-2` (совпадает с FunnelProfitLevel), info — deliberate 1px (задокументировано).
- **F4 [LOW]** «see artifact» ×9 указывал в никуда + харнесс эфемерен. **APPLIED**: артефакт этим же PR; харнесс встроен ниже.
- **F5 [LOW]** stale-проза у ре-пинов. **APPLIED**.

**Trigger-учёт**: проход 1 = 5 (≤5), проход 2 = 5 (≤5) — Trigger 3 не сработал. Сходимость: REJECT→fix→APPROVE→fix(doc).

## File List

Modified (13): 11 × `src/components/custom/financial-summary/*.tsx` + `src/components/custom/FinancialSummaryTable.test.tsx` + `src/components/custom/financial-summary/__tests__/FinancialSummaryTables.a11y.test.tsx` (1 ре-пин). Плюс этим же коммитом: `scripts/.shadcn-ui-boundary-baseline.txt` (459→401) + CLAUDE.md (boundary row).

## Гейты (финальное состояние)

vitest полный 19424/0 · lint 0/0 · tsc 0 · **boundary 401 = новый baseline (ratchet ↓ с 459 тем же PR)** · docs exit 0 (95) · locale 4 · prettier · diff --check. Манифест 174.3: ProfitSection.test.tsx не менялся — регенерация не потребовалась.

## Contrast-харнесс (для следующих волн — копировать отсюда)

Модель: HSL→sRGB (CSS Color 4), WCAG relative luminance, alpha-тинт — float-blend в sRGB над ПОВЕРХНОСТЬЮ (tinted-строки живут на Card → default `card`; light: card=bg=white). Ключевые замеры волны (light/dark над card): muted-fg 7.81/10.05 · fin-pos 5.13/9.38 · fin-neg 5.62/8.78 · status-info на info/10 4.98/7.32 · fin-pos/neg на info/5 4.78/8.77 + 5.24/8.20 · на warning/5 4.81/8.57 + 5.28/8.02 · fg/mut на success/10 14.11/15.36 + 6.85/8.53 · status-success на success/10 4.49/7.97 (FAIL — только graphic ≥3:1). Полный скрипт: сессия-2, `/tmp/p2-bw1-contrast.mjs` (паттерн воспроизводим по этому описанию; проверять токены живым grep globals.css).

## Follow-ups

1. **Волны 2-6** остатка 401: каталожные файлы (Margin-семейство ~58, SourceBadge 16, RequireJam 13, lib-residue: efficiency-utils 24, backfill-utils 21 и др.).
2. **47 stale legacy-пинов** в тестах чужих компонентов (grep pass-1) — идти волнами вместе со своими компонентами.
3. Chart-hex файлы (ElasticitySku/ProductAdv/ProductOrganic/TrendGraph/expense-chart-config и lib chart-константы) — отдельный трек, смежный с C5 owner-решением.

## Change Log

- 2026-09-02: Волна-1 исполнена конвейером; PR #394. A–J (executor opus + 2 fix-волны; 2 ревью-прохода opus свежим контекстом; оба ревьюера независимо воспроизводили контраст-математику). Boundary 459→401; флор 19424 не тронут (ре-пины).
  **Lessons:** (1) Свип семейной директории обязан крыть и co-located потребительские тесты — «exactly N re-pins» без repo-wide grep ложен. (2) Контраст-харнесс обязан моделировать ПОВЕРХНОСТЬ рендера (card ≠ background в dark) — иначе dark-аттестации врут. (3) Правило-в-комментарии формулируй как измеримый порог, не как номинальную схему классов.

## APPEND-ONLY correction (2026-09-05, волна-3)

Модель измерений этой волны («над ПОВЕРХНОСТЬЮ card») **суперседирована слоистой композитинг-моделью** волны-3 (`debt-p2-wave3-aa-quickwins.md`): контраст обязан мериться over фактическим стеком монтирования (градиентные базы, вложенные тинты, muted/50-родители). Числа волны-1 валидны для сайтов с верифицированной plain-`bg-card`-базой; слоистые сайты волны-1 (если найдутся) подлежат перемеру.
