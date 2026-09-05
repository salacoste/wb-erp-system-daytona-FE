# P2 волна-3: AA-quick-wins — 19 тинт-миграций + слоистая композитинг-модель (структурные ремедии)

**Status**: done (2026-09-05, сессия-3; PR — см. Change Log)
**Branch**: `debt/p2-wave3-aa-quickwins` (worktree `/private/tmp/p2-w3-aa`, base main `fd216510`)
**Owner-track**: P2 качество; зарегистрированные sub-AA сайты волн 1-2 + хост-файлы семейства

## Дефект → открытие волны

Зарегистрированные /15-,/10-сайты (замеры волны-2: 3.97–4.49 light). В ходе исполнения **проход-1 фальсифицировал модель «over card»**: реальные DOM-стеки содержат градиентные карточки (`bg-gradient-to-br from-status-information/10 to-status-warning/10`), вложенные тинты и `muted/50`-родители → in-situ 2.79–4.41 FAIL при «PASS»-аттестациях. Волна эволюционировала из тинт-миграций в **структурные ремедии + слоистую модель измерений**.

## Канон волны-3 (суперсет волны-1/2)

1. **Модель**: контраст меряется over ФАКТИЧЕСКИМ композитинг-стеком (последовательные alpha-слои над card; градиенты — worst-end). Bare-card валиден только с верифицированной цепочкой монтирования.
2. **Структурные ремедии** (когда tint-тюнинг бессилен): **fg-on-tint** (`text-foreground` на тинте; valence = tint+border+label+icon) ИЛИ **solid-пары** (`bg-status-X text-status-X-foreground` — kill композитинг). Financial-токены НЕ имеют -foreground → solid невозможен → fg-on-tint.
3. Волоценция на суб-перцептивных каналах (tint 1.07-1.21:1, border 1.52-1.89:1 < 3:1) — **WCAG 1.4.11 follow-up зарегистрирован** (см. Follow-ups).

## Изменения (15 файлов)

- **CashflowRowPrimitives** (градиент-карточка): всё семейство → fg-on-tint (9.98–13.4 in-situ); info/15-retain отменён (3.59 in-situ)
- **SkuCashflowSection** (хост-фолд-ин): ИТОГО → fg; вложенный бейдж /20-on-/15 (**2.79 — худший репо-сайт**) → solid warning
- **CashflowExpenseGrid** (хост): labels/pct → fg; **/80-альфы удалены**; difference-span → fg (3.82/3.48 both-theme FAIL → 10.93)
- **unit-economics-config**: 4 чипа → textClass fg (selected-row стек `card>info/10`: 3.93–4.45 FAIL → 10.97–13.15); loss-retain 4.52 PASS
- **MarginSlider**: medium/high/labels → fg (стек `card>primary/5`: 4.19/4.45 FAIL → 13.98–14.89); low-retain 5.16
- **GrossProfitSection**: чип + coverage-box → solid warning (4.81/11.41); margin-value 4.61 PASS
- **TwoLevelPriceHeader**: warning-box → solid; retains 4.68–4.69 (muted-grad); border /40-паритет
- **MarginSection + margin-status-helpers**: аттестации → in-situ 4.68 (gradient)
- Тесты: 8 файлов ре-пин + 3 добавленных (19436→**19439**)

## Dev Agent Record (3 прохода, Trigger 3)

### Post-1st-pass-review fixes (2026-09-05)
Findings (2H/2M/2L; REJECT): модель over-card фальсифицирована (градиент-семейство 3.59–4.26; muted/50-чипы 4.34; хост-файлы 2.79). **APPLIED**: харнесс-апгрейд (stack + grad worst-end), структурные ремедии (fg-on-tint градиент-семейство; solid warning-пары; хост-фолд-ины), слоистые аттестации.
### Post-2nd-pass-review fixes (2026-09-05)
Findings (2H/4M/4L; REJECT): ещё 2 пропущенных слоя — `bg-primary/5`-бокс (MarginSlider 4.19/4.45) и selected-row `info/10` (UE-чипы 3.93–4.45); difference-span both-theme-fail; ложные «plain-card»-аттестации. **APPLIED**: все fg-on-tint + аттестации к in-situ; +critical-чип по замеру; border-паритет; unpinned-chip запинен.
### Post-3rd-pass-review fixes (2026-09-05, convergence)
Findings (1M/5L; APPROVE): 1.4.11-регистрация + 3 числовых PASS-side-дрейфа (9.98 не 11.2; >10.2 не >11; per-theme цитирования) + канон-ноты. **APPLIED**: комментарии; канон-ноты — этим же PR (ниже); 30+ чисел независимо воспроизведены ревьюером-3.

**Trigger-учёт**: проход-1 = 6 (>5), проход-2 = 10 (>5), проход-3 = 7 (≤CRITICAL/HIGH=0 — сходимость). Кумулятив 23.

## Evidence

vitest полный **19439/0** (флор 19436→19439, +3) · lint 0/0 · tsc 0 · boundary **372 без изменений** (семантические токены) · prettier · diff-check · манифест регенерирован ×3 (раннер). Гейт-материал: все PASS-заявки цитируют in-situ числа; 4474/4474 на superset-прогоне ревьюера-3.

## Follow-ups

1. **WCAG 1.4.11 valence-каналы**: tint 1.07–1.21 / border 1.52–1.89 < 3:1 — нужен ≥3:1-носитель валентности (solid-бордер/иконка) — дизайн-решение owner-скоупа
2. `TwoLevelPriceHeader.tsx:129` `text-primary/70` ₽-глиф (3.36 light; проходит только как large-text) — снять /70
3. `PctBadge colorClass` escape-hatch (SalesFunnelSection передаёт text-only классы) — компонентный API-вопрос
4. MarginSlider /20-трек-сегменты несут зоновый цвет (3.47 ≥ 3:1 non-text — PASS, мониторить)

## Change Log

- 2026-09-05: Волна исполнена (executor sonnet→opus→sonnet + 2 fix-волны; 3 ревью-прохода opus). Открытие: over-card-модель фальсифицирована реальными стеками — канон обновлён до слоистого композитинга; структурные ремедии вместо тинт-тюнинга для нефиксируемых баз.
  **Lessons:** (1) Контраст-модель обязана верифицировать ЦЕПОЧКУ МОНТИРОВАНИЯ — «over card» лгал для градиентных/муted-баз (2.79-худший найден только проходом-1). (2) Тинт-тюнинг бессилен над тонированной базой — структурные ремедии (fg-on-tint/solid) раньше, чем N-ная итерация альфы. (3) Каждый fix-волна вскрывает следующий пропущенный слой — трассируй потребителей файла, не только файл.
