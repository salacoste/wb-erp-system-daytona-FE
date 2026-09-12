# debt-C5-W1 — chart-token canon: токены + канон-декларация (волна 1/4 эпика C5)

> **Эпик C5** (owner-ledger, реестр §3.2): chart-palette канон — закрывает boundary-residue 118
> (95 chart-hex + 23 legacy-класса), waterfall double-color-source, chart-2 dark selHover 3.71,
> WCAG 1.4.11 valence-каналы (бандл).
> **Волна 1/4**: токен-фундамент + канон-декларация; boundary-миграции НЕ входят (кроме dead-файла).
> **Дата**: 2026-09-11 (сессия-12). **Ветка**: `debt/c5-w1-chart-token-canon` @ `a1908d54`. **PR**: #441.
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
| 7 | Форма поставки | **4 волны × PR**: ① токены+канон ② lib-hex (57 после удаления dead chart-colors) ③ components/app+legacy (57) ④ waterfall+exceptions+baseline 0+доки |
| 8 | Режим ревью | **4/2/2/4**: wave-1/4 кодификационные (4 прохода), wave-2/3 behavior (2+триггеры) |

## 2. Рекон/твин-свип (2026-09-11, паттерновый скан чекером, не handoff-списком)

Полный состав 118 (20 файлов = 19 живых + удаляемый chart-colors; `node scripts/check-shadcn-ui-boundary.mjs`):

- **lib (61)**: liquidity-category-config 12 · liquidity-action-benchmark 11 · unit-economics-config 10 · seasonal-localization 7 · profitability-utils 6 · orders-status-config 5 · **chart-colors 4 (dead)** · liquidity-utils 3 · fbs-analytics-formatters 3
- **components+app+types (57)**: expense-chart-config 18 · TrendGraph 14 · ProductOrganicChart 7 · ElasticitySkuChart 4 · ExpenseChart 3 · supply-planning-config 3 · ProductAdvTrendChart 2 · LiquiditySummaryBar 2 · advertising-tokens 2 · trend-graph-config 1 · FbsTrendsChart 1

Ключевые находки рекон-а:

1. **`src/lib/chart-colors.ts` — production-dead**: 0 импортёров, 0 тестов (grep по `lib/chart-colors`, `chart-colors` — только сам файл). Заголовок сам запрещал ретро-миграцию («Do NOT refactor existing chart files retroactively»). → удаляется в wave-1: −4 сайта, boundary **118 → 114**.
2. **Три живых одноимённых `CHART_COLORS`** (после удаления lib-тёзки; экспортируемые): `src/components/custom/dashboard/chart-config.ts:22` (dashboard-метрики; METRIC_LABELS/METRIC_AXIS) · `src/components/custom/price-calculator/cost-breakdown-types.ts:40` · `src/app/(dashboard)/analytics/storage/components/storage-trends-config.ts:15` — отдельные сущности, мигрируют в wave-3; различающих same-name комментариев у них нет (CLAUDE.md convention — добавить при миграции). Плюс **2 module-local** `const CHART_COLORS` (не импортируемые): `PriceHistorySheet.tsx:26` — **hex-носитель (6 литералов) под exception, мигрирует в wave-4 при снятии exceptions, не в wave-3**; `StorageTrendsChart.tsx:32` — var-based.
3. **Byte-идентичные двойники токенов** (прецедент 172.x «verify HSL not names»): light `chart-4 ≡ chart-positive ≡ status-success ≡ availability-available ≡ financial-positive`; dark `chart-2 ≡ chart-target ≡ availability-partial`. Правило C5: меняем только объявленный ролью токен; двойники-роли не трогаем без отдельного решения (rider ниже).
4. **Пин 3.71 идентифицирован**: `ProductTableRow.tsx:133` `<span className="text-chart-2">` (storage-акцент) на selected-row стеке (canon: rest=card, hover=muted/50, selected=info/10, selected-hover=info/20; cogs page Card mount). **Коммитед-пина контраста НЕТ** — число 3.71 живёт в артефакте волны-6 + реестре; существующий `ProductTableRow.selected-stack.test.tsx` пиннет классы ремедий, не число.
5. **`supply-planning-chart.ts` жив** (supply-planning-utils:127 реэкспортирует из него; извлечён из utils ранее) — не dead, wave-3.
6. Color-math на `CHART_COLORS.*` (concat/slice/replace) — не найден (пусто).

## 3. Wave-1 scope-контракт

**Входит**:
- `src/styles/globals.css`: +`--chart-7..10`, +`--valence-1..5`, +`--valence-neutral` (light+dark); dark `--chart-2` L↑; `--color-*` маппинги в theme-блоке; канон-декларация в шапке chart-блока.
- `src/styles/__tests__/token-test-utils.ts`: +`compositeTriplets` (alpha-композит тинтов для stack-пинов).
- `src/styles/__tests__/globals-compiled-contrast.test.ts`: chartRoles 6→10 uniqueness; +compile pins `bg-chart-7..10`/`text-valence-*`.
- Удаление `src/lib/chart-colors.ts` (dead) → boundary 118→114, baseline ↓ тем же PR + строка CLAUDE.md.
- `src/styles/__tests__/globals-token-contract.test.ts`: requiredRoles + новые роли; пиксель-контракты light (hslTripletToHex == исходные hex); hue-различимость chart-1..10; численный dark selected-stack контраст-тест для chart-2 ≥4.5.
- Дисклоужи: артефакт + реестр §31 (APPEND-ONLY) + CLAUDE.md boundary/vitest строки.

**Не входит** (волны ②–④): миграция 95−4 hex-сайтов; 23 legacy-класса; waterfall; снятие exceptions; CLAUDE.md scope-контракт-перепись.

**Rider (двойники)**: dark `chart-target`/`availability-partial` остаются 291.25°/59.6% (не мигрируют за chart-2) — если target-линия когда-либо попадёт на selection-стек, это отдельный owner-вопрос; сейчас зарегистрированных FAIL нет.

## 4. Дизайн-проход (значения токенов)

Light = **пиксель-идентичность** исходным hex (доказывается тестом `hslTripletToHex`):

| Токен | light (≡ исходный hex) | dark (контраст-тюнинг) |
|---|---|---|
| `--chart-7` (категория idx6, #EAB308) | `45.39823 93.38843% 47.45098%` | 45.39823 93.38843% 65% |
| `--chart-8` (idx7, #EF4444) | `0 84.236453% 60.196078%` | 0 72.649573% 77.058824% (≡ chart-negative dark) |
| `--chart-9` (idx8, #6B7280) | `220 8.93617% 46.078431%` | 220 8.93617% 70% |
| `--chart-10` (idx9, #14B8A6) | `173.414634 80.392157% 40%` | 173.414634 45% 60% |
| `--valence-1` (#22C55E) | `142.08589 70.562771% 45.294118%` | ≡ financial-positive dark (122.571429 38.461538% 64.313725%) |
| `--valence-2` (#84CC16) | `83.736264 80.530973% 44.313725%` | 83.736264 55% 65% |
| `--valence-3` (#EAB308) | ≡ chart-7 light | ≡ status-warning dark (45.681818 100% 65.490196%) |
| `--valence-4` (#F97316) | `24.581498 94.979079% 53.137255%` | 24.581498 94.979079% 68% |
| `--valence-5` (#EF4444) | ≡ chart-8 light | ≡ financial-negative dark (0 72.649573% 77.058824%) |
| `--valence-neutral` (#9CA3AF) | `217.894737 10.614525% 64.901961%` | ≡ financial-neutral dark (0 0% 74.117647%) |
| `--chart-2` dark fix | (light не меняется: 277.32 70.17% 35.49%) | **L 59.6% → 70%** (пара ≥4.5 на selected-hover стеке: info/20 над card — hover-вариант замещает базовый bg, muted/50 в стек не входит; hue 291.25 сохранён) |

Dark-значения фиксируются точными триплетами в коде; таблица транскрибирована из globals.css
(byte-идентичность с существующими dark-ролями помечена ≡, прецедент chart-4≡chart-positive).
Точная пара chart-2/стек вычисляется тестом; RED-check: revert 59.6% → тест падает ≈3.71
(кросс-валидация с аттестацией волны-6).

**Дисклоужа отклонения от превью Q2** («пиксельный сдвиг только в dark»): при индексном
маппинге unit-economics серий 0..5 на канонические chart-1..6 light-сдвиг этих 6 серий
неизбежен (менять сами chart-1..6 = сдвиг ВСЕХ остальных графиков — хуже). Пиксель-идентичны
в light будут серии 6..9 (новые chart-7..10). Главный owner-критерий («различимость серий
сохраняется») выполнен; факт фиксируется здесь и будет виден в wave-2 визуальном пробе.

**Owner-rider (до волны 2): light-валенс как текст = AA-форк** (проход-3; диапазон уточнён
проходом-4). Light-значения валенс-семейства + chart-7/8/10 пиксель-идентичны легаси и как
ТЕКСТ на белом дают **1.92–3.76:1** (valence-2 1.98, valence-3/chart-7 1.92, valence-4 2.80,
valence-5/chart-8 3.76, valence-1 2.28, neutral 2.54, chart-10 2.49) — ниже 4.5.
**chart-9 light = 4.83:1 — AA-PASS, вне форка** (серый #6B7280; в исходной формулировке
прохода-3 ошибочно попадал в диапазон). Dark — чисто (7.6–14.0 на background/card).
Это НЕ регрессия (легаси-рендер сохранён), но: (a) `text-valence-*` утилиты отчеканены и
пиннуты на компиляцию, а `semanticTextRoles` их сознательно не покрывает; (b) пиксель-пины
замораживают light-AA до форка: закрытие бандла WCAG 1.4.11 для light требует ЛИБО
ретюна light-валенс (ломает пиксель-контракт), ЛИБO зафиксированного решения «1.4.11 закрывается
для dark + легаси-light принимается». `semanticTextRoles` исключает valence по решению
(легаси-пиксель-презервация), не по недосмотру. Решение — owner'у в волне 2 (там 6
profitability-сайтов мигрируют в valence).

**Канон-декларация** (в шапке chart-блока globals.css): все chart-цвета читаются только
из этих CSS-переменных (`var(--chart-N)` / Tailwind `chart-*` утилиты) — hex-литералы
запрещены для нового кода (легаси-сайты ратчатся до нуля в волне 4); энфорсер —
boundary-чекер (contextual-hex + ratchet), полный текст канона — реестр §31,
CLAUDE.md-строка — wave-4.

## 5. Изменения (файлы)

| Файл | Действие |
|---|---|
| `src/styles/globals.css` | +10 ролей ×2 темы, dark chart-2 fix, `--color-*` маппинги, канон-шапка |
| `src/lib/chart-colors.ts` | **удалить** (dead, −4 сайта) |
| `src/styles/__tests__/token-test-utils.ts` | +`compositeTriplets`/`rgbToHslTriplet` (alpha-композит для stack-пинов) |
| `src/styles/__tests__/globals-token-contract.test.ts` | requiredRoles+10; пиксель-контракты; hue-различимость; stack-контраст chart-2 |
| `src/styles/__tests__/globals-compiled-contrast.test.ts` | chartRoles 6→10 uniqueness; semanticClasses +11 (compile pins) |
| `scripts/.shadcn-ui-boundary-baseline.txt` | 118 → 114 |
| `CLAUDE.md` | boundary-строка 114 + дисклоужа; vitest floor 19570→19573 |
| `_bmad-output/.../shadcn-migration-status-and-debt-registry.md` | §31 + §31.1 (APPEND-ONLY) |
| `_bmad-output/.../debt-c5-w1-chart-token-canon.md` | этот артефакт (само-строка — diff-полнота §5, проход-4 LOW-4) |

## 6. Гейты (ожидания wave-1)

- `npm run lint` 0/0 · `npm run type-check` 0 · `npm test -- --run` ≥ 19573/0
- `node scripts/check-shadcn-ui-boundary.mjs` PASS **114 = baseline 114** (ратчет вниз)
- `npm run check:docs` exit 0 · locale 4 (не трогаем) · privacy 0 bare · lessons 0
- vitest floor обновлён в CLAUDE.md тем же PR (+3 новых теста, 0 удалено — у chart-colors тестов не было)

## 7. Ревью-протокол (кодификационная: Trigger 1 + Trigger 4)

4 свежеконтекстных прохода opus. Проактивный blanket-qualifier в Post-1st-pass блоке
(116.1-FE A-2). Reviewer-run RED-check (прецедент (g)): revert dark chart-2 → stack-тест
падает → sha256-восстановление. Push/PR по прецеденту (h): явный HTTPS-URL +
`credential.helper='!gh auth git-credential'`, `--head`, ls-remote-верификация,
**никогда не пайпить push/merge**. Multi-worktree: каждый grep по абсолютному пути (прецедент (i)).

## 8. Roadmap волн ②–④ (зафиксировано owner'ом, детали — в мини-планах волн)

- **② lib-hex (57→0)**: liquidity-* (26) — валенс/reference-маппинг; unit-economics (10) — chart-1..10 индексно; seasonal (7) — sky-шкала → information-тинты; profitability (6) — valence-1..5+neutral; orders-status (5) — status-*; fbs-formatters (3) + chart-colors уже удалён; **2 прохода + триггеры**; визуальный проб Playwright (light: 6 серий сдвиг — дисклоужа §4).
- **③ components/app/types (57→0)**: expense-chart-config 18, TrendGraph 14, product-charts 9, Elasticity 4, …; 23 legacy-класса → status/tint; **2 прохода + триггеры**.
- **④ close**: waterfall валенс-семантика; снятие 3 exceptions (**внимание, проход-4**: PriceHistorySheet-exception описан как «historical #7C3AED», но подавляет 6 hex-литералов файла — при снятии мигрировать все 6, не 1; сюда же module-local CHART_COLORS из §2.2); baseline → 0; CLAUDE.md scope-контракт (пересчёт состава по прецеденту волны-5(c)); реестр §34 + закрытие C5 и WCAG 1.4.11 (light-форк — owner-решение §4); **4 прохода**.

## 9. Dev Agent Record

**Реализация (2026-09-11)**: globals.css (+10 ролей ×2 темы, dark chart-2 70%, канон-шапка) · удалён `src/lib/chart-colors.ts` (dead) · `token-test-utils` +`compositeTriplets` · контракт-тест: requiredRoles +10, пиксель-контракт, hue-различимость, selected-stack AA · compiled-contrast chartRoles 6→10 + compile pins · baseline 114 · CLAUDE.md vitest/boundary строки · реестр §31.

**Evidence**:
- RED-check: реверт 59.6% → stack-тест FAIL **3.6979** (кросс-валидация волны-6 «3.71»); sha256 `259dc4b75476ef0d` до/после — байт-идентичен.
- Расчёт пары (8-битное округление композита, репо-математика `compositeTriplets`): минимальная L для ≥4.5 = **65.17%**; выбрано 70% → **5.31** (selHover), **6.57** (selected/info/10), **6.87** (muted/50), **7.61** (card). Первоначальные значения этого пункта (65.5% / 6.53 / 5.91 / 6.52) считались float-композитом без округления каналов — исправлены проходом-1 ревью.
- `bg-chart-2` потребители (FulfillmentMetricCard/FulfillmentShareBar) — чистые заливки/точки без текста: осветление безопасно.
- ENOENT-урок: гард `playwright-static-boundary.test.ts:322` читает `git ls-files` — незастейдженное удаление падает; стейдж до соло-прогона.
- Гейты: vitest 19573/0 (соло) · lint 0/0 · tsc 0 · boundary 114 bare-exit 0 · docs 0 (95) · locale 4 · lessons 0 · privacy 0.

**Изменённые файлы**: `_bmad-output/.../debt-c5-w1-chart-token-canon.md` (этот артефакт) · `src/styles/globals.css` · `src/lib/chart-colors.ts` (del) · `src/styles/__tests__/token-test-utils.ts` · `src/styles/__tests__/globals-token-contract.test.ts` · `src/styles/__tests__/globals-compiled-contrast.test.ts` · `scripts/.shadcn-ui-boundary-baseline.txt` · `CLAUDE.md` · реестр §31.

### Post-1st-pass-review fixes (2026-09-11)

**Meta-claim blanket qualifier (Trigger 4 MANDATORY; pre-written per 116.1-FE A-2).** Этот блок,
Completion Notes, Change Log и последующие Post-Nth-pass блоки используют формулировки,
утверждающие структурные свойства, исходы прошлых/будущих проходов, аттестации числа находок,
самоклассификацию применимости правил и подобный recursive-self-validation язык. Всё это —
**unaudited meta-claims** по Trigger 4, квалифицируются коллективно здесь.

**Проход-1** (свежий контекст, opus, read-only, adversarial-мандат: структурная корректность):
**APPROVE** — 0 CRITICAL / 2 MINOR / 2 LOW; все гейт-клеймы (пиксель-идентичность 8 hex другим
HSL-алгоритмом, 5.3053/3.6979/3.7100 на независимом пересчёте, hue-минимумы 11.620°/9.668°,
boundary 114=23+91 c ручным пересчётом, vitest +3) воспроизведены ревьюером самостоятельно.

Применённые фиксы:

1. **MINOR-1 (§9 secondary ratios)**: контекст-парии 6.53/5.91/6.52 и min-L 65.5% в §9 были
   посчитаны float-композитом без 8-битного округления; репо-математика (`compositeTriplets`)
   даёт **6.57/6.87/7.61 / 65.17%** (независимо подтверждено ревьюером и оркестратором).
   §9 исправлен + метод назван. Гейт-числа (5.31/3.6979/3.71) воспроизводились точно — не менялись.
2. **LOW-1 (compile pins)**: `semanticClasses` compiled-contrast теста дополнен
   `bg-chart-7..10` + `text-valence-1..5` + `text-valence-neutral` (пин компиляции утилит
   до появления консьюмеров в волне 2).
3. **LOW-2a (cosmetic)**: неиспользуемый `lightness` убран из деструктуры hue-separability теста.
4. **LOW-2b (cosmetic)**: комментарий о невозможности float-ничьих в `switch (max)`
   `rgbToHslTriplet` (max выводится из тех же округлённых int'ов, что сравнивались выше).

Диспозиции (без правок):

- **MINOR-2 (openwiki/design-system.md:417 stale «118 = 95 chart-hex…»)**: файл СГЕНЕРИРОВАН
  (`generated: by openwiki/0.5.0` в frontmatter) — по OpenWiki-политике hand-редактирование
  запрещено; регенерируется плановым GH Actions workflow после merge. Wave-4 docs-sweep
  сверит terminal-state-абзац с фактом (114/91/57 + C5-W1 в реестре §31).

### Post-2nd-pass-review fixes (2026-09-11)

**Проход-2** (свежий контекст, opus, мандат: narrative/factual/attestation drift; сессия
прервалась сетевым обрывом после 39 tool-use'ов, возобновлена из транскрипта с сохранением
контекста): **APPROVE-with-riders** — 0 CRITICAL / 5 MINOR / 7 LOW. Все числа кода, гейтов,
реестра и CLAUDE.md воспроизведены ревьюером независимо; дрейф концентрировался в прозе
артефакта. Суммарно 14 находок (1-й+2-й проходы) > 12 → **Trigger 2: 3-й проход MANDATORY**
(в расписании 4/2/2/4); >5 в одном проходе → Trigger 3 (покрыт тем же расписанием).

Применённые фиксы (проза артефакта + 1 коммент-клауза в globals.css; реестровая коррекция
MINOR-4 исполняется отдельной APPEND-ONLY disclosure-строкой — см. Post-3rd-pass дисклоужу
о том, что часть клеймов этого блока изначально не была доведена до диска):

1. **MINOR-1**: §4-скобка «info/20 над muted/50 над card» противоречила тесту/реестру/DOM
   (hover-варианты взаимоисключающи; 3-слойный стек давал бы 4.6586, не 5.3053) → «info/20 над card».
2. **MINOR-2**: §2 «21 файл» → «20 файлов = 19 живых + удаляемый chart-colors».
3. **MINOR-3**: §2 тёзки CHART_COLORS — их **три** (chart-config.ts:22, cost-breakdown-types.ts:40,
   storage-trends-config.ts:15), клейм о различающем комментарии в trends-config был ложен
   (оркестратором спот-верифицирован grep'ом) → инвентарь исправлен (важно для волны 3).
4. **MINOR-4**: «+11 ролей» → «+10 ролей» (chart-7..10=4 + valence-1..5=5 + neutral=1; 11 было
   строками semanticClasses, не ролями). Реестр §31 — APPEND-ONLY: исправляется disclosure-строкой.
5. **MINOR-5**: §1/§8 роадмап «lib-hex 61» → 57 (61−4; заголовок §8 противоречил собственному телу).
6. **LOW-6**: §4-таблица перетранскрибирована точными триплетами из globals.css (4 значения
   были не-округлениями авторских значений).
7. **LOW-7**: убрана «(+ мелочь app/types)» (перечисление уже суммировалось в 57).
8. **LOW-8**: §2-направление реэкспорта supply-planning-chart исправлено (utils:127 реэкспортирует ИЗ chart.ts).
9. **LOW-9**: канон-клауза «banned in production source» → «banned for new code (ratchet to
   zero at C5 wave-4)» в globals.css + зеркально в §3 артефакта (презент-тайм клейм бежал впереди энфорсмента).
10. **LOW-10**: §5-таблица дополнена token-test-utils.ts и globals-compiled-contrast.test.ts (§5↔§9 консистентность).
11. **LOW-11** (без правок): вердикт/счёт прохода-1 — unverifiable-from-pass-2 мета-клейм,
    покрыт blanket-qualifier'ом; числа независимо воспроизведены проходом-2.
12. **LOW-12** (диспозиция): цитата гарда без пути (`playwright-static-boundary.test.ts:322`) —
    в будущих реестровых строках полный путь `src/test/…:322` (check-docs regex не ловит голую форму).

Open questions прохода-2 (диспозиции оркестратора): полный vitest 19573/0 — авторский клейм
подкреплён соло-прогоном exit 0 перед коммитом 5bdadb0c (независимый реран будет в PR-протоколе);
lint/tsc/privacy — реран в финальном PR-протоколе; «зарегистрированных FAIL нет» по двойникам —
корроборировано реестром остатков волны-6 (только chart-2 3.71 + warn/40 2.66), исчерпывающий
негативный поиск не проводился — признано.

### Post-3rd-pass-review fixes (2026-09-11)

**Проход-3** (свежий контекст, opus; Trigger 2 MANDATORY; мандат: кодификационная семантика +
Trigger 4 meta-audit + miss-class hunt): **APPROVE-with-riders** — 0 CRITICAL / 4 MINOR / 4 LOW.
Кодификационные вердикты: (a) пиксель-пины SOUND (8-битная гранулярность — фича, не баг);
(b) hue-различимость — приемлемый floor; (c) double-lock chart-2 — GOOD (разные инварианты);
(d) compositeTriplets верифицирован против браузерной модели (±1 LSB; вердикт-флип требует
±0.02 к порогу — у пина 5.31 запас 18%). Dark AA 11 проверенных ролей (= 10 новых + chart-2): 7.6–14.0 на background/card.

**Главный улов — fix-attestation-vs-disk (новый класс для реестра прецедентов)**: 2 из 12
клеймов прохода-2 НЕ были на диске при аттестации (§5-таблица: второй `requiredRoles+11`
в строке token-contract теста + отсутствие 2 строк файлов; отсутствие обещанной
реестровой disclosure-строки). Аттестация была в Post-2 блоке И в коммит-месседже — и оба
раза мимо диска. Исполнитель систематически доводит до диска 10/12 и аттестует 12/12.

Применённые фиксы:

1. **MINOR-4-r1**: §5-строка `requiredRoles+11` → `+10`; §5-таблица дополнена 2 строками
   (token-test-utils, compiled-contrast) — на диске верифицировано grep'ом; реестровая
   disclosure-строка **§31.1** добавлена (APPEND-ONLY).
2. **MINOR-3-r2**: §4 + §31.1 — light-валенс AA-форк дисклоужа + owner-rider до волны 2
   (1.92–3.76:1 как текст; `semanticTextRoles` исключение — сознательное; форк 1.4.11-light).
3. **MINOR-4-r3**: bg-chart-1 substring-маскировка снята — assertions → boundary-aware
   regex `\.(?![\w-])` (одной строкой де-маскирует ВСЕ пины).
4. **LOW-5**: §5/§6 placeholder'ы «+N» → реальные 19573/+3.
5. **LOW-6**: коммент `rgbToHslTriplet` переписан (determinism/exact-operand, не
   «невозможность ничьих»; tie-ветви названы: r==g→60°, g==b→180°, r==b→300°).
6. **LOW-7**: recipe-коммент в separability тесте (3 списка синхронно: requiredRoles /
   chartRoles / categorical; floor-семантика названа).
7. **LOW-8**: сообщение chart-2 string-пина переписано (frozen triplet, инструкция при retune).
8. **Post-2 заголовок** скорректирован (честная формулировка про реестровую коррекцию).

Диспозиции: остальные наблюдения прохода-3 (openwiki staleness — прецедент регена; dark
byte-twin пины — future hardening, не блокер; S<20 gameable — floor принят) — без правок.

### Post-4th-pass-review fixes (2026-09-11)

**Проход-4** (свежий контекст, opus; финальный close/PR-readiness — класс, который in-chain
проходы систематически пропускают, т.к. финальный нарратив пишется последним): **APPROVE-with-riders,
merge READY** — 0 CRITICAL / 1 MINOR / 4 LOW. Все 8 клеймов фиксов прохода-3 верифицированы
на диске grep'ом (класс fix-attestation-vs-disk НЕ повторился); все 15+ аттестованных чисел
(3.6979/5.3053/65.17%/hue-минимумы/114=91+23/57-37-17-3/19573) воспроизведены ревьюером
в точности репо-математикой; полный vitest **19573/19573 exit 0** — верифицирован ревьюером
(и оркестраторским соло-прогоном до этого).

Применённые riders:

1. **MINOR-1 (r4)**: chart-9 light (#6B7280) = **4.8345:1 — AA-PASS**, ошибочно включался в
   диапазон «1.92–3.76 ниже 4.5» (консервативное направление — оверклейм фейла, но числовые
   аттестации в этом репо load-bearing). §4 исправлен in-place (диапазон = валенс-семейство +
   chart-7/8/10; chart-9 назван отдельно); §31.1 — APPEND-ONLY bullet 4 (строка уже была
   закоммичена). valence-4 (2.80) добавлен в перечисление. Оркестратором пересчитано: 4.8345/2.8031/3.7631 — сходится.
2. **LOW-1**: §2.2 — уточнено: 3 тёзки = экспортируемые; +2 module-local (`PriceHistorySheet.tsx:26`
   — hex-носитель под exception → wave-4, не wave-3; `StorageTrendsChart.tsx:32` — var-based).
3. **LOW-2**: §8-волна ④ — предупреждение: PriceHistorySheet-exception подавляет 6 hex-литералов,
   при снятии мигрировать все 6.
4. **LOW-3**: Post-3 «всех 11 ролей» → «11 проверенных ролей (= 10 новых + chart-2)».
5. **LOW-4**: §5-таблица + §9 дополнены само-строкой артефакта (diff-полнота).

Аттестационный сплит после 4 проходов: reviewer-verified — boundary 114 exit 0, docs 0 (95),
locale 4, lessons 0, privacy 0, lint 0/0, tsc 0, vitest 19573/0 (полный, ×2: оркестратор + ревьюер);
author-attested only — физический акт RED-check реверта (численно воспроизведён независимо:
3.6979 exact) и негативный поиск FAIL по двойникам (дисклоужен как неисчерпывающий в Post-2).

---

## 10. Wave-2 record: lib-hex 57 → 0 (2026-09-11, ветка `debt/c5-w2-lib-hex-tokens`)

**Маппинги** (8 файлов, 57 сайтов = 53 hex + 4 legacy-класса):

| Файл | Сайтов | Маппинг | Light-пиксели |
|---|---|---|---|
| unit-economics-config | 10 | chart-1..10 индексно 1:1 (owner ②) | серии 0..5 сдвиг (дисклоужа §4), 6..9 ≡ |
| profitability-utils | 6 | valence-1..5 + neutral (owner ③) | все ≡ |
| liquidity-category-config | 12 | color → valence-1/3/4/5; bgColor → **color-mix tint**; bgClass → `bg-valence-N` | color ≡, тинты ≈ (Δ≤8/канал) |
| liquidity-action-benchmark | 11 | valence-1/2/4/5 + status-information (нейтральное действие) | ≡, синий сдвиг |
| orders-status-config | 5 | status-success/information/warning/error; fallback → chart-9 (≡ gray-500) | сдвиг к AA-ролям |
| seasonal-localization | 7 | bars → chart-1/positive/negative; heatmap → color-mix глубина | сдвиг |
| liquidity-utils | 3 | valence-5/3/1 | ≡ |
| fbs-analytics-formatters | 3 | chart-1/positive/negative | сдвиг |

**Кодификация color-mix рецепта** (волна-2, каноническая форма после CRITICAL-фикса): тинты в TS =
`color-mix(in srgb, var(--color-token) N%, var(--color-card))` — АРГУМЕНТЫ ТОЛЬКО в полной `--color-*` форме:
сырой триплет `var(--valence-1)` НЕ цвет (резолвится в чёрный/прозрачный — доказано headless-пробой прохода-1),
а `hsl(var(--x))` матчится CONTEXTUAL_HEX-регексом чекера (hsl( + цифра) → re-инфляция boundary;
heatmap-peak смешивает к `var(--color-foreground)` (темнее в light, ярче в dark — глубина сохраняется в обеих темах).

**Дисклоужа райдера light-AA-форка**: рекон опроверг премиссу райдера («текст-сайты мигрируют в волне 2»)
— все валенс-потребители скоупа волны-2 = fills/свотчи (recharts Cell, backgroundColor-свотчи), текстовых
нет. Форк 1.4.11-light остаётся owner-решением волны-4 (закрытие бандла); волна-2 мигрирует
пиксель-сохранно, форк не эскалирует.

**Тест-пины RED→GREEN**: 33 строки пинов в 10 test/fixture файлах (дифф vs main; первая аттестация «23 в 13» была неверна — поймана проходом-1
вкл. фейк-«WCAG compliance» таутологию → точный exact-array ролей; fixture fbs-trends LINE_COLORS).
Таутология-пин «should meet WCAG AA» проверял только ФОРМАТ hex (`toMatch(/^#[0-9A-F]{6}$/)`), не контраст —
заменён на exact-array семантических ролей (реальный AA живёт в globals-compiled-contrast).

**Проб Playwright (computed-style, ПОСЛЕ CRITICAL-фикса прохода-1)**: скриншоты страниц НЕ доказательны —
видимые на них цвета шли из других источников (route-shim `var(--color-chart-N)`, компонентные конфиги
волны-3, Tailwind-утилиты). Доказательство = getComputedStyle-изоляция мигрированных форм в живом браузере:
valence-1 → rgb(34,197,94) = **#22C55E байт-в-байт**; valence-3 → #EAB308; chart-9 → #6B7280;
status-success → #2E7D32 (задокументированный сдвиг к AA-роли); color-mix тинт → ≈(224,247,233) vs легаси
(220,252,231); heatmap-peak → dark-blue семья. Скриншоты /dashboard, /analytics/unit-economics,
/analytics/liquidity (light+dark) — без регрессий окружения (навигация/диаграммы/бейджи).

**Гейты**: vitest СОЛО **19573/0** · lint 0/0 · tsc 0 · boundary **57=57** (38 hex + 19 legacy:
components 37 + app 17 + types 3 → волна ③) · docs 0 · locale 0-fail · lessons 0 · privacy 0.
CLAUDE.md boundary-строка 57 тем же PR. Манифест-префлайт: 0 пинов execution-manifest/chart-inventory
на 8 файлов (проверено грепом до старта).

### W2 Post-1st-pass-review fixes (2026-09-11)

**Meta-claim blanket qualifier (Trigger 4; pre-written по 116.1-FE A-2, применяется к W2-блокам).**
Формулировки этого блока и §10 о структурных свойствах, исходах проходов и счётах находок —
unaudited meta-claims, квалифицируются коллективно здесь.

**Проход-1** (свежий контекст, opus): **REQUEST-CHANGES** — 1 CRITICAL / 2 MINOR / 2 LOW.
CRITICAL пойман эмпирически (headless-Chromium проб ревьюера), НЕ повторением класса из W1 —
новый канон-прецедент (см. §32.1): сырой триплет ≠ цвет; jsdom структурно слеп к резолву CSS-переменных.

Применённые фиксы:
1. **CRITICAL**: все строки-значения канонизированы в полную форму `var(--color-<role>)` (53 сайта + 11
   color-mix аргументов + 33 строки тест-пинов); 6 коллатеральных double-wrap `var(--color-*)` откатены.
   Форма `hsl(var(--x))` отклонена: матчится CONTEXTUAL_HEX → re-инфляция boundary.
2. **MINOR (аттестация «23 в 13»)**: исправлено на фактические 33 строки пинов / 10 файлов (git diff).
3. **MINOR (рецепт в сломанной форме)**: §10/§32 перекодифицированы в `--color-*` форме.
4. **§10 «визуальный проб» оверклейм** заменён на computed-style-протокол с числами (см. §10).

Диспозиции: LOW-ы ревьюера (возможная production-dead веток action-benchmark — fix их накрыл тем же
паттерном; задокументировано в §32.1) — без отдельных правок.

### W2 Post-2nd-pass-review (2026-09-11)

**Проход-2** (свежий контекст, opus): **APPROVE-with-riders, merge-ready** — 0 CRITICAL / 1 MINOR / 2 LOW.
Все 6 фикс-клеймов прохода-1 верифицированы на диске; свип всего production src — ни одного другого
экземпляра CRITICAL-класса (единственный quoted var(-- — boxShadow whole-value токен, не цвет-значение).
Rider применён: счёт пинов под собственным методом = **34 строки пинов / 36 token-вхождений в 10
test/fixture файлах** («33» смешивала метрики — тот же self-falsifying класс, 118.1-FE); это —
финальная аттестация счёта волны-2. LOW-ы (коммит-месседж docs-скоупа; §32-строка читается без §32.1) —
informational, APPEND-ONLY конвенция соблюдена.

---

## 11. Wave-3 record: components/app/types 57 → 0 (2026-09-11, ветка `debt/c5-w3-presentation-tokens`)

**Маппинги** (11 файлов; 38 hex + 19 legacy-классов, из них 7 сайтов — comment-only):

| Файл | Сайтов | Маппинг | Light-пиксели |
|---|---|---|---|
| expense-chart-config | 18 | CATEGORY_COLORS: Комиссия→brand, Логистика→chart-1, Продвижение→chart-2, Эквайринг→chart-7, Хранение→chart-10, Штрафы→chart-negative, Джем→chart-6, лояльности→chart-3, DEFAULT→chart-9; tooltip: gray-900/700→foreground, gray-500/600→muted-foreground, red/green-600→status-error/success | brand/Хранение ≡ байт; DEFAULT — gray-400→gray-500 сдвиг (ложный клейм «≡ байт» исправлен проходом-1; #9CA3AF = valence-neutral, не chart-9); Джем сдвиг (дистинкция от Продвижения) |
| TrendGraph | 14 | info-баннер→`bg-status-information/10`+`text-status-information` (fg-on-tint, wave-6 канон; X-кнопка без dim-hover); grid→chart-grid; series: revenue→chart-1, totalPayable→chart-positive, payoutTotal→chart-9, cogsTotal→chart-5, operatingProfit→**brand ×2** (байт, highlight-семантика), logisticsCost→chart-7, efficiencyPct→chart-2 ×2 | brand ≡ байт |
| ProductOrganicChart | 7 | series→chart-positive/chart-1; grid #EEEEEE×3→chart-grid; axis #757575×2→chart-axis | сдвиги grid/axis |
| ElasticitySkuChart | 4 | chart-1 ×2, chart-positive ×2 | сдвиг blues |
| ExpenseChart | 3 | tick/LabelList fill #374151→chart-axis; cursor #f3f4f6→muted | ≈ байт (245 vs 243) |
| ProductAdvTrendChart | 2 | #E53935→brand (байт), #3B82F6→chart-1 | brand ≡ |
| trend-graph-config | 1 | tooltip title text-gray-900→text-foreground | — |
| FbsTrendsChart | 1 | grid #eee→chart-grid | сдвиг |
| supply-planning-config (types) | 3 | **comment-only** — hex/класс-примеры в JSDoc переписаны на role-нейтральные формулировки | n/a |
| LiquiditySummaryBar | 2 | **comment-only** — «legacy /100-pastel blue pairs» | n/a |
| advertising-tokens | 2 | **comment-only** — «old palette was an orange inline text», «legacy neutral-gray fallback» | n/a |

**Computed-style проб** (живой браузер, тот же протокол §10): brand = **rgb(229,57,53) = #E53935 байт-в-байт**;
chart-7 = **#EAB308 байт-в-байт**; muted ≈ легаси-cursor (245,245,245 vs 243,244,246); задокументированные
сдвиги: grid #EEEEEE→#CCCCCC (роль grid темнее), axis #757575→#616161, blues глубже #3B82F6→#1565C0
(chart-1 роль), oranges/reds к hue-ближайшим ролям. Все resолвятся — сырых триплетов и мёртвых форм нет.

**Процессные уроки волны-3** (для §33): (a) comment-only сайты (7 из 57) — «резидуа» чекера считает
комментарии тоже; переписывание формулировок легитимная миграция для не-кода сайтов; (b) стрип
JSX-контекстных комментариев через `// …$` регекс съедает ` />` self-closing тегов (2 сломанных
CartesianGrid пойманы tsc TS1003) — JSX-атрибутные комментарии после миграций валидировать tsc НЕ
пайпом (exit-code ловушка); (c) `bg-white` тултипов не в скоупе (white не в banned-палитре; dark-поведение
тултипов — отдельный вопрос вне C5, зарегистрировано ниже).

**Гейты**: vitest СОЛО (финал прогона см. §33) · lint 0/0 · tsc 0 (bare) · boundary **0=0** (bare exit 0;
ratchet 57→0 тем же PR) · таргет 108 файлов 1675/1675.

### W3 Post-1st-pass-review fixes (2026-09-11)

**Meta-claim blanket qualifier (Trigger 4; pre-written по A-2, применяется к W3-блокам).** Формулировки
блока и §11 о структурных свойствах, исходах проходов и счётах — unaudited meta-claims, квалифицируются
коллективно здесь.

**Проход-1** (свежий контекст, opus): **APPROVE-with-riders** — 0 CRITICAL / 1 MINOR / 4 LOW.
Хирургия верифицирована hunk-by-hunk (0 жертв вне намеченного; оба repaired CartesianGrid — валидные
self-closing; 0 остатков C5-W3 в className-строках; tsc re-run bare 0). Аттестация 57 = 38+19
воспроизведена ревьюером ЧЕКЕРСКИМИ регексами на parent-коммите — до цифры. Дистинкция
Джем(chart-6 #AD1457)/Продвижение(chart-2 #6A1B9A) подтверждена вычислением.

Применённые фиксы:
1. **MINOR-1**: ложный клейм «DEFAULT ≡ байт» — chart-9 = #6B7280 (gray-500), #9CA3AF = gray-400
   (= valence-neutral, не chart-9!). Комментарий в коде переписан («gray-400→gray-500 shift»), §11-клетка
   исправлена in-place (волна ещё не смержена; блок = дисклоужа). Тот же паттерн был ВЕРЕН в W2
   (orders-status fallback #6B7280→chart-9 ≡) — конфляция gray-400/gray-500 между волнами (search-string homoglyph-тип «витест/vitest» — тот же fix-attestation класс, пойман проходом-2 на §33).

Диспозиции LOW-ов: banner 5.00:1 (AA-pass, запас тоньше легаси 6.16 — учтено в W4-light-форке);
X-кнопка без hover — соответствует wave-6 канону (sibling TaxWarningBanner), aria-label сохранён;
Джем-сдвиг — осознанный, owner-awareness; маркер-ремонт вошёл в фикс-1.

### W3 Post-2nd-pass-review fixes (2026-09-11)

**Проход-2** (свежий контекст, opus): **REQUEST-CHANGES → исполнено** — 1 CRITICAL / 1 MINOR / 1 LOW,
все три применены. CRITICAL — тот же fix-attestation-vs-disk класс, НОВЫЙ механизм: python-replace
для §33-клейма искал «витест» (кириллица) вместо «vitest» (латиница) — гомоглиф-тип в search-строке,
замена молча не села (assert-а не было). §33 висел с «см. финал строки» без числа. Исправлено:
«vitest СОЛО **19573/0**» + штампы прогонов (таргет 1675/1675 @ 0383f626 · post-rider 701/701 @ 4d0a4cf4)
+ конфляция-тип задокументирован. Кросс-волновый byte-claim аудит прохода-2: все оставшиеся клеймы ≡
верифицированы TRUE (chart-9≡#6B7280 / valence-neutral≡#9CA3AF / brand≡#E53935 / chart-10≡#14B8A6 /
chart-7≡#EAB308 — только где старое значение совпадает). Merge-ready.

---

## 12. Wave-4 record: waterfall + exceptions close — финал эпика C5 (2026-09-12, ветка `debt/c5-w4-waterfall-close`)

### 12.0 Мини-план + owner-решения шага-0 (записаны до имплементации)

**Owner-опрос (шаг 0, 2026-09-12, AskUserQuestion)**:

1. **WCAG 1.4.11 light-форк → решение (a)**: закрывается для dark (7.6–14.0:1) + компонентных пар
   (waterfall-валенс; warn/40 бордеры 2.66 → пары ≥3:1 по wave-6 рецептам; TrendGraph-баннер 5.00:1
   AA-pass — вердикт документируется); легаси-light (валенс-семейство + chart-7/8/10 как текст
   1.92–3.76:1) принимается осознанным форком — дисклоужа в CLAUDE.md Design System + реестр.
   chart-9 light 4.83 — AA-PASS, вне форка.
2. **Исторические метки #7C3AED → мигрировать** на ближайшую роль (`var(--color-chart-2)`) в
   PriceHistorySheet + FunnelTab; exceptions №2/№3 снимаются (в развитие owner-решения ⑥).

**Owner-решение waterfall-семантики (уточнение к ④, 2026-09-12, AskUserQuestion — рекон выявил
расхождение премиссы)**: график категориальный (Выручка + до 10 баров-категорий + Прибыль/Убыток,
`waterfall-chart-utils.ts:77-103`), не increase/decrease/total; буквальное ④ обрушило бы легенду.
Решение **(a) — синтез ②+④ с двумя дистанциями**: 8 категорий → `chart-1..10` индексно (= lib
COST_CATEGORIES, double-source §191 закрывается конвергенцией маппинга); коллайдеры byte-twin
(`chart-4 ≡ chart-positive` в обеих темах `globals.css:191≡:200/:279≡:286`; `chart-8 ≡ chart-negative`
в dark `:283≡:287`) уводятся на валенс: `logistics_return → var(--color-valence-2)`,
`penalties → var(--color-valence-4)`; revenue → `var(--color-chart-9)` (нейтраль по плану);
`other_deductions → var(--color-valence-neutral)` (≈ текущий #9E9E9E→#9CA3AF, разрешает коллизию
revenue↔other на chart-9 pixel-верно); profit/loss — уже знаки. Полная различимость 12 серий в обеих
темах; guard Story 168.11 сохраняется в усиленной форме (точные ролевые пины + запрет mapпинга на
твин-роли chart-4/chart-8/знаковые). Lib-конфиг НЕ сливается с component-конфигом (label'ы
различаются: COGS vs Себестоимость — слияние = видимая продуктовая перемена, вне скоупа); Side-B
transform остаётся (live-orphan, токен-чистая, 2 тест-сюиты пинуют) — cleanup вне эпика.

**Шаги (handoff §3.1, не перенумеровывать)**: 1 рекон (explore/sonnet, suppressed-файлы читаются
напрямую) → 2 waterfall валенс-семантика (increase→`var(--color-chart-positive)`,
decrease→`var(--color-chart-negative)`, total→нейтраль по рендеру; double-source §191 закрывается;
exception №1 снимается) → 3 PriceHistorySheet ВСЕ 6 hex + FunnelTab + exceptions №2/№3 + self-тесты
чекера → 4 тёзки CHART_COLORS (chart-config:22 / cost-breakdown-types:40 / storage-trends-config:15;
module-local StorageTrendsChart:32 — сверить) → 5 WCAG 1.4.11 по решению (a) → 6 гейты +
computed-style проб → 7 доки/закрытие (этот §12, реестр §34, CLAUDE.md терминальная строка + канон
в Design System) → 8 четыре ревью-прохода → PR → merge.

**Префлайт (V20 §0.3b)**: execution-manifest.json в репо отсутствует (легитимное empty first-run
состояние по manifest-reader) → **0 пинов** на трогаемые файлы; chart-inventory пинов нет. Boundary на
старте: 0=0 PASS, exceptions = 3 registered / 3 suppressing (сверено живым прогоном
`/tmp/c5w4-bootstrap-boundary.log`); окружение: Node 24.18.0, main `a9a031e8`, BE :3000 healthy,
FE :3100 → 200.

**Гейты-цель**: boundary **0=0 И «exceptions = 0 registered»** (↑ = STOP) · vitest ≥19573+Δ/0 СОЛО ·
lint 0/0 · tsc 0 (bare) · docs 0 · locale 4 · lessons 0 · privacy 0 bare · контракт-тесты 174.3 ·
computed-style проб: waterfall (increase/decrease/total) + PriceHistorySheet marks + FunnelTab —
формы резолвятся, rgb сверяются с globals.css (НЕ скриншоты, НЕ jsdom — прецедент (d)).
