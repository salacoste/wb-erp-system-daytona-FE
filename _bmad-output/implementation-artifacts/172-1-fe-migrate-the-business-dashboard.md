# Story 172.1-FE: Migrate the Business Dashboard

Status: done — PR #278 merged (`a001abee`, commit `e5a42171`); FULL-цикл, крупнейшая стори миграции (**127 файлов**: 125 M + 2 A guards, +941/−609); 3 свежеконтекстных ревью-прохода (REJECT→APPROVE-WITH-NOTES→APPROVE-WITH-NOTES); волны OMC-executor'ов; e2e 28✓/1↓/1 pre-existing (бисект против main); light+dark+390px visual; cleanup 0/0/0.

## Story

As a business owner, I want `/dashboard` to keep its prioritized owner orientation, period context, metrics, trends, cost/profit evidence and next actions while the whole render tree moves to semantic design tokens, so that behavior stays identical and theming becomes complete.

Plan: `.omx/plans/172.1-migrate-the-business-dashboard.md` (authoritative — branch `cdx/epic-172-story-1-dashboard`, worktree `/private/tmp/wb-repricer-fe-172-1-dashboard`). **FULL story** — recon `docs/recon-172-1-dashboard.md` (92 файла / 339 palette + hex; перепроверено на базе: 92/339 exact + +1 файл BaseMetricCard с gradient-префиксами, регексом recon не покрытый → 99 прод-целей).

## Acceptance Criteria

Per plan (canonical AC + execution checklist 1-10). Все пункты закрыты; детали ниже и в PR #270-прецедентной структуре.

## Tasks / Subtasks

- [x] Task 0: prerequisites verified (Epic 166-FE `ab12ffe9`, Story 167.1 `a8dfe353` reachable from main; base `3d2b4274`).
- [x] Task 1: Behavior lock — targeted baseline **65 files / 1394 tests / EXIT=0** ДО правок (log `/tmp/172.1-baseline-targeted.log`).
- [x] Task 2: разведка (готовая recon + уточнение: gradient-префиксы `from|to|via` дали +1 файл; hex-инвентарь пересобран цветовым регексом с letter-lookahead; списки в `/tmp/172.1-*-files.txt`).
- [x] Task 3: **волны executor'ов** (4, непересекающиеся списки; канон-таблица в промпте; кластер «конфиг+потребители+тесты» в одной волне):
  - W1 (19): route-tree ×3 + chart-config/trends-config/expense-chart-config/sales-price-level + charts + их тесты.
  - W2 (28): карточки A–F (BaseMetricCardHelpers, DeltaIndicator, DailyMetrics*, DataAvailabilityBadge…).
  - W3 (31): карточки F–R (Margin/GrossMargin 4-band, popovers, ROICard, FulfillmentShareBar…).
  - W4 (45): widgets/toggles/banners/storage-семейство + 15 тест-файлов.
  - Post-wave targeted vitest после каждой волны; межволновые re-pin'ы (18 loose-пинов `/green/`-класса, 2 cohorts) — оркестратор.
- [x] Task 4: guard-тесты ×2 (16 тестов): route (каталог 15 pinned, no-palette/no-hex, severity/banner/padding) + widget (каталог ≥140 sanity, no-palette/no-hex по 146, chart-config пины с pairwise-distinct 8/7/2×chart-5, storage chart-2, chart-tooltip, primary, tabular-nums). Anchor-safe relative-first (171.8); 169.11 contextual-hex канон; регекс расширен оттенками indigo|violet|teal|cyan|pink|fuchsia|emerald + shadow-префиксами (ревью-проходы 1-2).
- [x] Task 5: полная валидация + 3 ревью-прохода + PR #278 + cleanup 0/0/0.

## Dev Notes

- Owned: `src/app/(dashboard)/dashboard/**` (15 прод) + `src/components/custom/dashboard/**` (146 прод) + тесты. Ревью-пасс 3 подтвердил 127/127 файлов в surface, независимый скан 161 прод-файла = 0 palette/hex.
- Baselines: targeted 65/1394 → **67/1410** (+2 guard-файла); full floor **19 281 → 19 297** (+16 = 16 guard-тестов; арифметика независимо сверена ревьюером).
- Series-token таблицы (chart-config/trends-config/expense-chart-config) — в отчётах волн и пинах гарда; ключевые решения см. Post-pass-разделы.

### References

- [Source: plan `.omx/plans/172.1-migrate-the-business-dashboard.md`]
- [Recon: `docs/recon-172-1-dashboard.md`]
- Chart canon: ForecastChart.tsx (171.4); token registry: `src/styles/globals.css`

## Dev Agent Record

### Agent Model Used

- Implementation: 4 волны OMC-executor (sonnet, fresh-context каждая) + оркестратор (re-pin'ы, гарды, фиксы ревью, git). Review: 3× code-reviewer (opus, fresh) — REJECT(1 MAJOR) → APPROVE-WITH-NOTES(6 LOW) → APPROVE-WITH-NOTES(4 LOW).

### Post-1st-pass-review fixes (2026-08-26)

- **[MAJOR FIXED] chart-config `profit: chart-positive` ≡ `chart-4`** (байт-идентично в light-теме; «Выкупы»+«Теор. прибыль» — дефолтные серии одного цвета; legacy profit был brand-red) → `var(--color-primary)` + pairwise-distinct пин в гард (8 токенов / 7 distinct / 2×chart-5 — осознанный share COGS-серий).
- **[MINOR FIXED] Оттенки гардов** +indigo|violet|teal|cyan|pink|fuchsia|emerald (оба гарда).
- Диспозиции без правки: ordersCogs/salesCogs share chart-5 (pigeonhole 7 серий/6 токенов, legacy сам был near-identical — закомментировано в конфиге); margin 4-band bg-коллапс (idiom TopProductsTableRow, `/80` дифференциатор); NIT ×4 (hover-dim, RankIndicator, text-white CTA, CostsCard foreground).

### Post-2nd-pass-review fixes (2026-08-26)

- Guard test-name дрейф («FulfillmentShareBar pairing» → StorageTrendsChart + StorageMetricCard).
- trends-config комментарий «matches … chart-2» → «parallel» (chart-negative ≠ chart-2 по значению).
- chart-config: заметка о латентной идентичности chart-negative ≡ primary (light) — сегодня холсты не пересекаются.
- Оба гарда: +shadow|inset-shadow|text-shadow префиксы.

### Post-3rd-pass-review fixes (2026-08-26)

- Битая цитата прецедента в WeekdayPatternsChart («LiquidityChips» → LiquidityDistributionCards/LiquidityTableRowCells).
- Финальный гейт: APPROVE-WITH-NOTES — merge. Независимая репродукция ревьюером: guards 16/16, targeted 67/1410, full 19297/19297, tsc 0, eslint 0/0, diff --check чист, closeout-блокер свип чист.

### Pre-flight carry-in: пропущенная обязательная оценка — пост-фактум диспозиция (orchestrator disclosure)

Реестр (§3.3, строка getMarginColor dedupe) помечал **«172.1 carry-in (ОБЯЗАТЕЛЕН в pre-flight 172.1)»** — консолидация локальных 4-tier `getMarginColor` копий (168.3 analytics-копия + shared top-table-utils + dashboard-копии). Мой pre-flight опирался на recon (палитра/hex) и НЕ зафиксировал оценку carry-in — процессный дефект. Пост-фактум оценка: дедуп требует правок в analytics-дереве и shared util — **оба вне Allowed Surface 172.1** (plan запрещает; конфликт «carry-in обязателен» ↔ «forbidden files» разрешается по plan §conflict-rule: forbidden → stop → re-route). Диспозиция: **re-route на 174.2** (dedupe-track владелец); dashboard-локальные копии (MarginCard/GrossMarginCard) мигрированы на токены и готовы к извлечению. Строка реестра обновлена в этом closeout.

### **Carry-out list для владельцев (re-route)**

1. **174.2**: getMarginColor dedupe — 3 локальные копии (analytics 168.3, top-table-utils shared, dashboard MarginCard+GrossMarginCard) → одна shared-утилита; dashboard-копии уже токенизированы (этот PR).
2. **Owners src/lib**: palette/hex в `seasonal-localization.ts`, `sync-status-config.ts`, `efficiency-filter-config.ts`, `orders-status-config.ts`, `profitability-utils.ts` — рендерятся dashboard-виджетами (WeekdayPatterns bars, AdvertisingSyncStatus/Filter, OrdersStatusBreakdown, UnitEconomics) — тесты этих компонентов всё ещё пинят legacy-классы по этой причине.
3. **174.x/owner**: `src/components/custom/TrendIndicator.tsx` (text-red-500/green-500) — shared-компонент вне dashboard-surface; `daily-chart-config.ts` `fill:'white'` (именованный цвет, гардами не ловится); `SubcategoryTooltip.tsx:101` rgba()-тень (pre-existing, гардами не ловится).
4. **locale-percent трек**: `FulfillmentShareBar.tsx:43` `formatNumber(share)%` → «57,647%» (blindspot-класс `Intl+split-line`; форматирование сохранено контрактом стори).
5. **Design sign-off list** (opacity-дифференциация): StatusStrip reportPending vs tax/dataGaps (все status-warning); MarginCard/GrossMarginCard слабейшая полоса (bg общий, `/80` текст/бордер); RankIndicator 1-е vs 3-е место; EfficiencyFilterChips active/inactive (bg-muted общий); expense-pie logistics_return(status-error) vs penalties(chart-negative) — RGB-дистанция ≈22 (legacy ≈27).

### Debug Log References

- /tmp logs: `172.1-{baseline-targeted,wave[1-4]-targeted,guards,lint,tsc,maxlines,build,full-suite,e2e,e2e-retry,e2e-main,fix1,fix2,final-targeted,final-lint,final-tsc}.log`, дифф-артефакт `172.1-review-diff.txt` (4561 строк).

### Completion Notes List

- E2E: `npm run test:e2e -- e2e/dashboard-metrics.spec.ts e2e/dashboard-period.spec.ts e2e/dashboard-session-fixes.spec.ts` на ветке (worktree-dev --webpack :3100, pm2-dev остановлен и возвращён): **28 passed / 1 deliberate skip / 1 failed** — «direct week URL survives reload» падает идентично на чистом main (первичный чекаут, та же команда; спека не содержит className/color-зависимостей) → pre-existing, не блокер (logs e2e{,-retry,-main}).
- Full: `npm test -- --run` = **19 297 passed / 0 failed / EXIT=0** (floor 19 281 → 19 297).
- Build: `npx next build --webpack` EXIT=0 (worktree; Turopack×symlink обойдён).
- Visual (playwright-cli, login→goto): light — данные рендерятся, семантика на месте, «migration visually successful»; dark — theme-aware токены, инверсий нет; 390px — стекинг без переполнений; a11y-снапшот — логичный outline, полная точность в accessible names («82 020,34 ₽»).
- Волновая гигиена: каждый executor получил непересекающийся список + канон; файлы вне списка = стоп + отчёт (§9.19 — не сработал ни разу); git только оркестратор.

### Gaps

- Между-брейкпоинт / 200% zoom / reduced-motion прогоны скриншотами не сняты (unit+e2e+light/dark/390 покрывают дельту; трек 174.3).
- Pre-existing e2e-падение dashboard-period W03 (задокументировано бисектом; владелец — данные/окружение, не UI).
- Carry-in оценка проведена пост-фактум (см. disclosure выше).

### File List

PR #278: commit `e5a42171` = **127 files** (125 M + 2 A guards); +941/−609. Exact: `git diff --name-status main~1..main` (merge `a001abee`); 127/127 в allowed surface (ревью-пасс 3).

### Change Log

| Date | Change |
|---|---|
| 2026-08-26 | Story planned (recon готов отдельной сессией, PR #273). Plan authoritative. |
| 2026-08-26 | FULL-цикл: 4 волны executor'ов + гарды; targeted 65/1394→67/1410; full 19 297/0 (floor 19 281); lint 0/0, tsc 0, build OK, e2e 28/1↓/1 pre-existing (бисект). Status: ready-for-dev → review. |
| 2026-08-26 | 3 ревью-прохода (REJECT 1 MAJOR → 2×APPROVE-WITH-NOTES), все находки закрыты/диспозиционированы; PR #278 (`e5a42171`, merge `a001abee`); cleanup 0/0/0. **FULL-стори конвейером §6 с делегированием §4 — эпик 172 открыт 1/17.** Status: review → done. **Lessons:** (1) Loose-пины `/green/` невидимы string-crossref — скань тесты на color-word-регексы ДО пост-волнового прогона. (2) chart-positive ≡ chart-4 байт-в-байт: сверяй HSL-значения токенов, не имена. (3) Обязательный carry-in из реестра должен явно закрываться в pre-flight — recon его не наследует. |
