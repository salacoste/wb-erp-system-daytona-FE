# debt-C5-W1 — chart-token canon: токены + канон-декларация (волна 1/4 эпика C5)

> **Эпик C5** (owner-ledger, реестр §3.2): chart-palette канон — закрывает boundary-residue 118
> (95 chart-hex + 23 legacy-класса), waterfall double-color-source, chart-2 dark selHover 3.71,
> WCAG 1.4.11 valence-каналы (бандл).
> **Волна 1/4**: токен-фундамент + канон-декларация; boundary-миграции НЕ входят (кроме dead-файла).
> **Дата**: 2026-09-11 (сессия-12). **Ветка**: `debt/c5-w1-chart-token-canon`.
> **Процесс**: V20 §5 (A–J); ревью 4 прохода (кодификационная, Trigger 1+4).

---

## 1. Owner-решения C5 (8 вопросов, сессия-12, 2026-09-11)

| # | Вопрос | Решение |
|---|---|---|
| 1 | Канон-источник chart-цветов | **CSS-токены** (`var(--chart-N)` и пр.) — единственный канон; hex-литералы и `CHART_COLORS` уходят |
| 2 | Категориальная 10-палитра unit-economics | **Расширение до `chart-1..10`** (light+dark), маппинг серий 1:1 |
| 3 | Валенс-шкала profitability (6 тиеров) | **Валенс-токены** `--valence-1..5` + `--valence-neutral`; **WCAG 1.4.11 бандлится** в C5 (вкл. warn/40 бордеры 2.66) |
| 4 | Waterfall double-color-source | **Валенс-семантика**: increase→chart-positive, decrease→chart-negative, total→нейтраль; exception снимается (wave-4) |
| 5 | chart-2 dark selHover 3.71 | **Фикс токена в дизайн-проходе** (L↑, hue сохранён) |
| 6 | Скоуп/цель boundary | **Полный 118 → 0**, все 3 exceptions снимаются; 23 legacy-класса → status/tint-токены |
| 7 | Форма поставки | **4 волны × PR**: ① токены+канон ② lib-hex (61) ③ components/app+legacy (57) ④ waterfall+exceptions+baseline 0+доки |
| 8 | Режим ревью | **4/2/2/4**: wave-1/4 кодификационные (4 прохода), wave-2/3 behavior (2+триггеры) |

## 2. Рекон/твин-свип (2026-09-11, паттерновый скан чекером, не handoff-списком)

Полный состав 118 (21 файл; `node scripts/check-shadcn-ui-boundary.mjs`):

- **lib (61)**: liquidity-category-config 12 · liquidity-action-benchmark 11 · unit-economics-config 10 · seasonal-localization 7 · profitability-utils 6 · orders-status-config 5 · **chart-colors 4 (dead)** · liquidity-utils 3 · fbs-analytics-formatters 3
- **components+app+types (57)**: expense-chart-config 18 · TrendGraph 14 · ProductOrganicChart 7 · ElasticitySkuChart 4 · ExpenseChart 3 · supply-planning-config 3 · ProductAdvTrendChart 2 · LiquiditySummaryBar 2 · advertising-tokens 2 · trend-graph-config 1 · FbsTrendsChart 1 (+ мелочь app/types)

Ключевые находки рекон-а:

1. **`src/lib/chart-colors.ts` — production-dead**: 0 импортёров, 0 тестов (grep по `lib/chart-colors`, `chart-colors` — только сам файл). Заголовок сам запрещал ретро-миграцию («Do NOT refactor existing chart files retroactively»). → удаляется в wave-1: −4 сайта, boundary **118 → 114**.
2. **Второй одноимённый `CHART_COLORS`** живёт в `src/components/custom/dashboard/chart-config.ts` (dashboard-метрики; METRIC_LABELS/METRIC_AXIS) — отдельная сущность, мигрирует в wave-3; после удаления lib-тёзки требует различающий комментарий (CLAUDE.md same-name convention уже соблюдён комментарием в trends-config).
3. **Byte-идентичные двойники токенов** (прецедент 172.x «verify HSL not names»): light `chart-4 ≡ chart-positive ≡ status-success ≡ availability-available ≡ financial-positive`; dark `chart-2 ≡ chart-target ≡ availability-partial`. Правило C5: меняем только объявленный ролью токен; двойники-роли не трогаем без отдельного решения (rider ниже).
4. **Пин 3.71 идентифицирован**: `ProductTableRow.tsx:133` `<span className="text-chart-2">` (storage-акцент) на selected-row стеке (canon: rest=card, hover=muted/50, selected=info/10, selected-hover=info/20; cogs page Card mount). **Коммитед-пина контраста НЕТ** — число 3.71 живёт в артефакте волны-6 + реестре; существующий `ProductTableRow.selected-stack.test.tsx` пиннет классы ремедий, не число.
5. **`supply-planning-chart.ts` жив** (реэкспорт из supply-planning-utils) — не dead, wave-3.
6. Color-math на `CHART_COLORS.*` (concat/slice/replace) — не найден (пусто).

## 3. Wave-1 scope-контракт

**Входит**:
- `src/styles/globals.css`: +`--chart-7..10`, +`--valence-1..5`, +`--valence-neutral` (light+dark); dark `--chart-2` L↑; `--color-*` маппинги в theme-блоке; канон-декларация в шапке chart-блока.
- Удаление `src/lib/chart-colors.ts` (dead) → boundary 118→114, baseline ↓ тем же PR + строка CLAUDE.md.
- `src/styles/__tests__/globals-token-contract.test.ts`: requiredRoles + новые роли; пиксель-контракты light (hslTripletToHex == исходные hex); hue-различимость chart-1..10; численный dark selected-stack контраст-тест для chart-2 ≥4.5.
- Дисклоужи: артефакт + реестр §31 (APPEND-ONLY) + CLAUDE.md boundary/vitest строки.

**Не входит** (волны ②–④): миграция 95−4 hex-сайтов; 23 legacy-класса; waterfall; снятие exceptions; CLAUDE.md scope-контракт-перепись.

**Rider (двойники)**: dark `chart-target`/`availability-partial` остаются 291.25°/59.6% (не мигрируют за chart-2) — если target-линия когда-либо попадёт на selection-стек, это отдельный owner-вопрос; сейчас зарегистрированных FAIL нет.

## 4. Дизайн-проход (значения токенов)

Light = **пиксель-идентичность** исходным hex (доказывается тестом `hslTripletToHex`):

| Токен | light (≡ исходный hex) | dark (контраст-тюнинг) |
|---|---|---|
| `--chart-7` (категория idx6, #EAB308) | `45.39 93.46% 47.45%` | 45.39 ~93% ~65% |
| `--chart-8` (idx7, #EF4444) | `0 84.18% 60.2%` | 0 ~72% ~77% (≡ chart-negative dark) |
| `--chart-9` (idx8, #6B7280) | `220 8.94% 46.1%` | 220 ~9% ~70% |
| `--chart-10` (idx9, #14B8A6) | `173.42 80.4% 40%` | 173.42 ~45% ~60% |
| `--valence-1` (#22C55E) | `142.09 70.6% 45.3%` | ≡ financial-positive dark (122.57 38.46% 64.31%) |
| `--valence-2` (#84CC16) | `83.74 80.5% 44.3%` | 83.74 ~55% ~65% |
| `--valence-3` (#EAB308) | ≡ chart-7 light | ≡ status-warning dark (45.68 100% 65.49%) |
| `--valence-4` (#F97316) | `24.58 94.9% 53.1%` | 24.58 ~95% ~68% |
| `--valence-5` (#EF4444) | ≡ chart-8 light | ≡ financial-negative dark (0 72.65% 77.06%) |
| `--valence-neutral` (#9CA3AF) | `217.93 10.6% 64.9%` | ≡ financial-neutral dark (0 0% 74.12%) |
| `--chart-2` dark fix | (light не меняется: 277.32 70.17% 35.49%) | **L 59.6% → целевое по расчёту ≥4.5 на selected-hover стеке** (info/20 над muted/50 над card; hue 291.25 сохранён) |

Dark-значения фиксируются точными триплетами в коде; приведённые здесь — целевые роли
(byte-идентичность с существующими dark-ролями помечена ≡, прецедент chart-4≡chart-positive).
Точная пара chart-2/стек вычисляется тестом; RED-check: revert 59.6% → тест падает ≈3.71
(кросс-валидация с аттестацией волны-6).

**Дисклоужа отклонения от превью Q2** («пиксельный сдвиг только в dark»): при индексном
маппинге unit-economics серий 0..5 на канонические chart-1..6 light-сдвиг этих 6 серий
неизбежен (менять сами chart-1..6 = сдвиг ВСЕХ остальных графиков — хуже). Пиксель-идентичны
в light будут серии 6..9 (новые chart-7..10). Главный owner-критерий («различимость серий
сохраняется») выполнен; факт фиксируется здесь и будет виден в wave-2 визуальном пробе.

**Канон-декларация** (в шапке chart-блока globals.css): все chart-цвета читаются только
из этих CSS-переменных (`var(--chart-N)` / Tailwind `chart-*` утилиты) — hex-литералы в
production-исходниках запрещены; энфорсер — boundary-чекер (contextual-hex + ratchet),
полный текст канона — реестр §31, CLAUDE.md-строка — wave-4.

## 5. Изменения (файлы)

| Файл | Действие |
|---|---|
| `src/styles/globals.css` | +11 ролей ×2 темы, dark chart-2 fix, `--color-*` маппинги, канон-шапка |
| `src/lib/chart-colors.ts` | **удалить** (dead, −4 сайта) |
| `src/styles/__tests__/globals-token-contract.test.ts` | requiredRoles+11; пиксель-контракты; hue-различимость; stack-контраст chart-2 |
| `scripts/.shadcn-ui-boundary-baseline.txt` | 118 → 114 |
| `CLAUDE.md` | boundary-строка 114 + дисклоужа; vitest floor +N |
| `_bmad-output/.../shadcn-migration-status-and-debt-registry.md` | §31 (APPEND-ONLY) |

## 6. Гейты (ожидания wave-1)

- `npm run lint` 0/0 · `npm run type-check` 0 · `npm test -- --run` ≥ 19570+N/0
- `node scripts/check-shadcn-ui-boundary.mjs` PASS **114 = baseline 114** (ратчет вниз)
- `npm run check:docs` exit 0 · locale 4 (не трогаем) · privacy 0 bare · lessons 0
- vitest floor обновлён в CLAUDE.md тем же PR (+N новых тестов, 0 удалено — у chart-colors тестов не было)

## 7. Ревью-протокол (кодификационная: Trigger 1 + Trigger 4)

4 свежеконтекстных прохода opus. Проактивный blanket-qualifier в Post-1st-pass блоке
(116.1-FE A-2). Reviewer-run RED-check (прецедент (g)): revert dark chart-2 → stack-тест
падает → sha256-восстановление. Push/PR по прецеденту (h): явный HTTPS-URL +
`credential.helper='!gh auth git-credential'`, `--head`, ls-remote-верификация,
**никогда не пайпить push/merge**. Multi-worktree: каждый grep по абсолютному пути (прецедент (i)).

## 8. Roadmap волн ②–④ (зафиксировано owner'ом, детали — в мини-планах волн)

- **② lib-hex (61→0)**: liquidity-* (26) — валенс/reference-маппинг; unit-economics (10) — chart-1..10 индексно; seasonal (7) — sky-шкала → information-тинты; profitability (6) — valence-1..5+neutral; orders-status (5) — status-*; fbs-formatters (3) + chart-colors уже удалён; **2 прохода + триггеры**; визуальный проб Playwright (light: 6 серий сдвиг — дисклоужа §4).
- **③ components/app/types (57→0)**: expense-chart-config 18, TrendGraph 14, product-charts 9, Elasticity 4, …; 23 legacy-класса → status/tint; **2 прохода + триггеры**.
- **④ close**: waterfall валенс-семантика; снятие 3 exceptions; baseline → 0; CLAUDE.md scope-контракт (пересчёт состава по прецеденту волны-5(c)); реестр §34 + закрытие C5 и WCAG 1.4.11; **4 прохода**.

## 9. Dev Agent Record

**Реализация (2026-09-11)**: globals.css (+11 ролей ×2 темы, dark chart-2 70%, канон-шапка) · удалён `src/lib/chart-colors.ts` (dead) · `token-test-utils` +`compositeTriplets` · контракт-тест: requiredRoles +11, пиксель-контракт, hue-различимость, selected-stack AA · compiled-contrast chartRoles 6→10 · baseline 114 · CLAUDE.md vitest/boundary строки · реестр §31.

**Evidence**:
- RED-check: реверт 59.6% → stack-тест FAIL **3.6979** (кросс-валидация волны-6 «3.71»); sha256 `259dc4b75476ef0d` до/после — байт-идентичен.
- Расчёт пары: минимальная L для ≥4.5 = 65.5%; выбрано 70% → 5.31 (selHover), 6.53 (selected/info/10), 5.91 (muted/50), 6.52 (card).
- `bg-chart-2` потребители (FulfillmentMetricCard/FulfillmentShareBar) — чистые заливки/точки без текста: осветление безопасно.
- ENOENT-урок: гард `playwright-static-boundary.test.ts:322` читает `git ls-files` — незастейдженное удаление падает; стейдж до соло-прогона.
- Гейты: vitest 19573/0 (соло) · lint 0/0 · tsc 0 · boundary 114 bare-exit 0 · docs 0 (95) · locale 4 · lessons 0 · privacy 0.

**Изменённые файлы**: `src/styles/globals.css` · `src/lib/chart-colors.ts` (del) · `src/styles/__tests__/token-test-utils.ts` · `src/styles/__tests__/globals-token-contract.test.ts` · `src/styles/__tests__/globals-compiled-contrast.test.ts` · `scripts/.shadcn-ui-boundary-baseline.txt` · `CLAUDE.md` · реестр §31.

### Post-1st-pass-review fixes (YYYY-MM-DD)

**Meta-claim blanket qualifier (Trigger 4 MANDATORY; pre-written per 116.1-FE A-2).** Этот блок,
Completion Notes, Change Log и последующие Post-Nth-pass блоки используют формулировки,
утверждающие структурные свойства, исходы прошлых/будущих проходов, аттестации числа находок,
самоклассификацию применимости правил и подобный recursive-self-validation язык. Всё это —
**unaudited meta-claims** по Trigger 4, квалифицируются коллективно здесь.

_(находки 1-го прохода добавляются при его запуске)_
