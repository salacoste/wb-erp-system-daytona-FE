# P2 boundary-sweep волна-5: lib-residue (12 файлов, 149 сайтов)

**Status**: done (2026-09-05, сессия-5 оркестратора V16; PR #408, merged)
**Branch**: `debt/p2-w5-lib-residue` (worktree `/private/tmp/p2-w5-lib`, base main `27f7f173`)
**Owner-track**: P2 boundary 372→267→**118** owner-sweep, волна 5 (handoff SESSION3 §3.1; каноны: волны 1-4; волна-3 = слоистая композитинг-модель — действующий)

## Дефект (verified live, pre-flight)

Live-скан (regex'ами гейта): src/lib = **210 / 19 файлов** (каталог §3.1 дрейфовал: profitability 12→18 и orders 10→15 из-за hex-полей, не перечисленных в каталоге; +5 файлов вне каталога). Классификация по канону «chart-hex НЕ трогать до C5»: **отложено 61** (liquidity-* 26 целыми файлами по глоубу §3.1, seasonal-localization 7, unit-economics-config 10 hex, chart-colors 4, fbs-analytics-formatters 3, profitability 6 hex, orders 5 hex); **волна-5 = 149 palette-сайтов / 12 файлов** (21+20+18+15+12+12+11+10+10+9+6+5).

## Tasks

- [x] Pre-flight: live-пересчёт + построчная разбивка palette/hex; манифест-префлайт 174.3 (пересечение с пинами); e2e-пины проверены (3 упоминания = комментарии, не ассерты)
- [x] Recon (explore/sonnet): import-closure по 12 файлам — **7 из 12 = production-dead каналы** (только тесты наблюдают значения); живых монтирований 5 файлов/8 сайтов (chips, calendar-ячейки, ProfitabilityBadge в таблице = hover-слой, sync-бейдж+тултип, cargo-бейджи); ре-пин-инвентарь; токены `src/styles/globals.css`
- [x] Волна (executor opus → сетевая смерть после 12/12 прод-файлов → продолжатель executor sonnet): 149/149 сайтов → токены; харнесс `/tmp/p2-w5-contrast.mjs` (волна-4 + W5-строки), sanity 4/4 волны-4 канон воспроизведён; ре-пин **116 ассертов / 14 тест-файлов** (109 волна — рекон недосчитал 3 файла + 3 bg-пина — + 7 фикс-волна)
- [x] Компонент-фикс ×2 (см. Маппинг-решения 5-6)
- [x] Манифест 174.3: CoefficientCalendar.test.tsx (манифест-source) изменён ре-пином → **реген раннером `--owner-units` ×2** (после волны и после фикс-волны), оба EXIT=0 fail-closed; контракты 33/33; дифф = метаданные раннера + ровно 1 sourceSha256
- [x] Ratchet: 267 → **118** (ровно −149); baseline + CLAUDE.md тем же коммитом
- [x] 2 ревью-прохода opus свежим контекстом (2+2 находок; оба APPROVE-with-riders; триггеры 2/3 не исполнены: кумулятив 4 ≤ 12, максимум/проход 2 ≤ 5; Trigger 4 RECOMMENDED → квалификатор применён)

## Маппинг-решения (канон-наследование + новые прецеденты волны)

1. **Идиомы**: SOLID = `bg-status-X` + `text-status-X-foreground` (4.81-7.17 / 8.00-12.23); SOFT same-hue = `/5`-тинт + `text-status-X` (success 4.80/8.72, warn 4.52/12.23 — same-hue на /15 отклонён замером 4.19-4.49 light); SOFT fg-on-tint = `/15` + `text-foreground` (12.19-15.36 на card/hover/muted-20 стеках — волна-4 hover-прецедент); MUTED = `bg-muted` + `text-muted-foreground` (7.17/8.06); ERROR-SOFT = error/15 + text-status-error (5.10/8.22 — единственный hue, проходящий на /15).
2. **Коллапс двухзелёных тиров** (green+emerald / green+lime в 4 файлах) по Story 170.1: excellent → SOLID, good → SOFT; text-only геттеры (unit-economics-formatters 5→3, two-level-pricing) → status-токены (риск-семантика; financial-* отклонён осознанно, закомментировано).
3. **dark:-половины отброшены** (two-level-pricing `bg-X-50 dark:bg-X-950` → `bg-status-X/5`): токены переопределяются темой, dark:-варианты пост-миграции не нужны.
4. **Production-dead каналы** (7 файлов) мигрированы когерентно с живыми (значения наблюдают только тесты); hex-поля profitability (6) и orders (5) сохранены байт-точно (C5-дискриминатор).
5. **Computed-key коллапс** (НОВОЕ, исполнитель): SOLID-тиры дают `bgColor === bgColorActive` → два computed-ключа `[bg]: !isActive` / `[bgActive]: isActive` в object-literal коллапсируют (later-`false` выигрывает) → **неактивные chips теряли фон** (text-status-X-foreground на card = невидимы). Фикс: один вычисленный ключ-тернарник + комментарий (EfficiencyFilterChips.tsx:108-118).
6. **Актив-аффорданс SOLID-тиров** (pass-1 MEDIUM): border-status-X на bg-status-X невидим → актив/неактив пиксельно идентичны. Ремеди: `ring-2 ring-ring ring-offset-1` при `isSolidTier && isActive` — зеркалит repo-прецедент `CoefficientCalendarCells.tsx:58`; замер **5.62/8.27** vs card (≥3:1, 1.4.11); 6 двусторонних стейт-ассертов в тесте.
7. **Строка CLAUDE.md = scope-контракт C5-owner** (pass-2 MEDIUM): residue ≠ «chart-hex only» — **95 hex + 23 legacy-класса** (TrendGraph/expense-chart-config/trend-graph-config/liquidity-category-config bg-классы/supply-planning-config/LiquiditySummaryBar/advertising-tokens) = lib 61 + components 37 + app 17 + types 3.

## Dev Agent Record

### Post-1st-pass-review fixes (2026-09-05)

Findings (2: 1M/1L; VERDICT APPROVE-with-riders; ревьюер — независимый контраст-калькулятор: 11/11 пересчётов воспроизвели аттестации до второго знака; 149-site headline пережил adversarial-пересчёт):
- **F1 [M]** SOLID-чипы (excellent/poor/loss) теряют визуальное различие актив/неактив (border в цвет фона). **APPLIED**: ring-аффорданс + замер 5.62/8.27 + 6 стейт-ассертов (Маппинг 6).
- **F2 [L]** Ре-пины SOLID-тиров потеряли стейт-дискриминацию (дубль-ключ баг прошёл бы). **APPLIED**: негативные пины обеих сторон + CoefficientCalendar negative-sibling (`not.toContain('bg-status-warning/15')` — субстринг-коллизия предупреждена).
- **[RIDER]** border-status-*/40 = 1.71-2.03 light < 3:1 (1.4.11) — **DISPOSITIONED**: совпадает с owner-ledger §3.5 valence-каналы (уже ждёт owner-решения); декоративное подкрепление, не единственный индикатор.
- **[RIDER]** AdvertisingSyncStatus TDD expectedConfig сам-на-себя — **DISPOSITIONED**: pre-existing паттерн, строки обновлены когерентно; опциональная уборка в follow-ups.

### Post-2nd-pass-review fixes (2026-09-05)

Findings (2: 1M/1L; VERDICT APPROVE-with-riders; линза факты/атрибуции/сходимость: 6/6 независимых пересчётов контраста, 769/770 манифест-хэшей живы, единственный stale = запланированный реген):
- **N1 [M]** Строка CLAUDE.md: «residue = chart-hex only» ложна (23 класса) + пропущены types 3. **APPLIED** оркестратором (doc-класс): «95 chart-hex + 23 legacy-palette classes: lib 61 + components 37 + app 17 + types 3».
- **N2 [L]** «13.3+» в комментарии efficiency-filter-config завышает dark worst-end (13.28/12.88). **APPLIED** оркестратором (doc-класс): обе темы явно.
- **[RIDER]** Счётная единица «109 ре-пинов» невоспроизводима чужими подсчётами (82/121/146 в других единицах). **DISPOSITIONED**: единица = изменённые ассерты (assertion-level census исполнителя); все счётчики артефакта — unaudited meta-claims (Trigger 4 RECOMMENDED-квалификатор).
- **[RIDER]** Hue-name data-contract поля (`color: 'green'` в dimension/coefficient) пережили волну (11 пинов) — вне сканера гейта по конструкции. **DISPOSITIONED**: follow-up для волны, ретайряющей поле.
- **[RIDER]** Peak-пин CoefficientCalendar без негативного sibling (`bg-status-error` ⊃ гипотетический `error/15`). **DISPOSITIONED (declined)**: субстрата коллизии нет (error/15 в coefficient-types не существует); симметрия ради симметрии = лишний churn манифест-source.

**Trigger-учёт**: проход-1 = 2, проход-2 = 2 (оба ≤5); кумулятив 4 ≤ 12 (Trigger 2 не исполнен); Trigger 3 не исполнен (ни один проход >5); стори НЕ codification ( baseline-сдвиг ≠ кодификация); Trigger 4 RECOMMENDED: числовые аттестации этого артефакта (счётчики 149/116/109, N-of-N, «~61 титул») — **unaudited meta-claims**, квалифицированы коллективно здесь.

## File List

Modified (30): 12 × `src/lib/*.ts` (backfill-utils, campaign-utils, coefficient-types, dimension-types, efficiency-filter-config, efficiency-utils, fbs-analytics-utils, orders-status-config, profitability-utils, sync-status-config, two-level-pricing, unit-economics-formatters) + 14 тест-файлов (AdvertisingEfficiencyFilter, AdvertisingSyncStatus, OrdersStatusBreakdown, UnitEconomicsEnhancement, CoefficientCalendar, DeliveryDatePicker, campaign-utils, coefficient-utils.story-44.9, dimension-utils, efficiency-filter-config, efficiency-utils, fbs-analytics-utils, sync-status-config, two-level-pricing) + `EfficiencyFilterChips.tsx` + `e2e/fixtures/story-174-3/execution-manifest.json` (MACHINE, раннер `--owner-units` ×2) + `scripts/.shadcn-ui-boundary-baseline.txt` (267→118) + CLAUDE.md (boundary row) + этот артефакт + debt-registry (APPEND) + SESSION3-handoff (§3.1 flip).

## Гейты (финальное состояние, живые прогоны)

vitest полный **19439/0** (×2: post-manifest-regen + финальный после всех фикс-волн) · lint 0/0 · tsc 0 · build --webpack 0 · **boundary 118 = новый baseline (ratchet ↓ с 267 тем же PR)** · docs exit 0 · locale 4 · lessons 0 · privacy pass (0 новых) · prettier на изменённых чисто (CLAUDE.md/txt-фейлы идентичны main) · diff --check чист · контракт-тесты 174.3 **33/33** · манифест реген раннером EXIT=0 (×2).

## Contrast-харнесс

`/tmp/p2-w5-contrast.mjs` (волна-4-база + W5-строки: SOLID/SOFT/fg-on-tint/hover-стеки/popover/muted-20 + W5-G ring 5.62/8.27). SANITY 4/4 волны-4 канон воспроизведён (7.81/10.05, 5.13/9.38, 4.78/8.77, ANCHOR-2 4.34/10.89). Числа сверены тремя независимыми калькуляторами (исполнитель + оба ревьюера; 11+6 независимых пересчётов).

## Follow-ups

1. **C5-owner** (гейтит весь остаток 118: 95 chart-hex + 23 legacy-класса в components/app/lib/types) — owner-ledger §3.5.
2. **1.4.11 valence-каналы** (border /40 1.71-2.03 light) — уже в owner-ledger §3.5; волна-5 числа согласуются.
3. Hue-name data-contract поля (dimension/coefficient `color: 'green'|…`, 11 пинов) — ретайрить при следующем касании типов.
4. AdvertisingSyncStatus TDD expectedConfig сам-на-себя (pre-existing) — опциональная уборка.
5. Следующий item бэклога: §3.2 /80-sweep (замер слоистой моделью repo-wide) ИЛИ FE-D3 getErrorMessage (behavior, tests-first).

## Change Log

- 2026-09-05: Волна-5 исполнена (executor opus + продолжатель sonnet после сетевой смерти; фикс-волны: sonnet ×1 + оркестратор doc-класс ×1; 2 ревью-прохода opus свежим контекстом, оба с независимыми контраст-калькуляторами; манифест 174.3 регенерирован официальным раннером ×2 после ре-пина манифест-source CoefficientCalendar.test.tsx). Boundary 267→118 (−149 ровно); флор 19439 не тронут.
  **Lessons:** (1) Манифест-префлайт пересекает RED-тесты живого прогона, не плановый список правок — recon пропустил CoefficientCalendar. (2) SOLID-коллапс тиров ломает двухключевой computed-bg и актив-аффорданс — проверяй оба стейта чипов. (3) Residue-строка CLAUDE.md = scope-контракт owner-трека: «chart-hex only» без пересчёта скрывала 23 сайта.
