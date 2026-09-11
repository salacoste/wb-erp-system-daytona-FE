# HANDOFF 2026-09-12 — Сессия-12: эпик C5, волны ①②③ смержены (PR #441–#443), boundary 118 → 0 — осталась финальная волна ④ (детальный план внутри)

> **Аудитория**: агент-команда, продолжающая разработку (сессия-13). Этот документ = вход-точка.
> **Процесс-канон**: V20 (`ORCHESTRATOR-PROMPT-2026-09-10-V20-DEBT-CONTINUATION-OMC-SUBAGENTS.md`) — петля §0, матрица §2, конвейер A–J §5, стопы §8; без изменений.
> **Цепочка**: [`HANDOFF-2026-09-10-SESSION11-FOLLOWUPS-EXECUTED.md`](HANDOFF-2026-09-10-SESSION11-FOLLOWUPS-EXECUTED.md) → SESSION10-4-ITEMS → V19 → … → FINAL-94-94.
> **Артефакт эпика**: [`_bmad-output/implementation-artifacts/debt-c5-w1-chart-token-canon.md`](../_bmad-output/implementation-artifacts/debt-c5-w1-chart-token-canon.md) (§1–§11: 8 owner-решений, дизайн-проход, записи волн W1–W3, Post-Nth блоки).
> **Реестр долгов**: `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md` §31–§33 (APPEND-ONLY; вкл. дисклоужи §31.1, §32.1).
> **Приоритет при конфликте**: мини-план волны > этот документ > V20 > CLAUDE.md; **живые гейты — финальная инстанция**.

---

## 1. Сессия-12 (2026-09-11): 8 owner-решений C5 + три волны смержены

Owner-опрос (8 вопросов, AskUserQuestion): ① канон = CSS-токены (`var(--color-<role>)`), hex-литералы и константы `CHART_COLORS` уходят; ② категориальная 10-палитра → расширение `chart-1..10` (unit-economics индексно 1:1); ③ валенс-шкала → `--valence-1..5` + `--valence-neutral`; **WCAG 1.4.11 бандлится в C5**; ④ waterfall → валенс-семантика; ⑤ chart-2 dark selHover 3.71 → фикс токена (L 59.6→70%, hue сохранён); ⑥ скоуп полный 118→0, все 3 exceptions снимаются; ⑦ 4 волны × PR; ⑧ ревью 4/2/2/4 (кодификационные ①④ — Trigger 1+4).

| Волна | PR / merge | Содержание | Boundary |
|---|---|---|---|
| ① токены+канон | **#441** (`1613265e`) | +10 ролей ×2 темы (light пиксель-идентичен легаси — контракт-тесты); dark chart-2 fix (RED-check воспроизвёл 3.6979 ≈ аттестацию волны-6); канон-декларация в globals.css; dead `lib/chart-colors.ts` удалён (0 импортёров) | 118→114 |
| ② lib-hex | **#442** (`a0b98a74`) | 8 lib-файлов, 57 сайтов → токены; **CRITICAL прохода-1**: сырой триплет ≠ цвет → канон `var(--color-<role>)` доказан computed-style пробой; color-mix рецепт тинтов | 114→57 |
| ③ components/app/types | **#443** (`2b2f1254`) | 11 файлов, 57 сайтов (7 comment-only) → токены; байт-якоря brand #E53935 / chart-10 #14B8A6; fg-on-tint баннер (wave-6 канон) | 57→**0** |

Каждая волна: свежеконтекстные opus-проходы (W1 — 4 прохода, Trigger 2 взыскан; W2/W3 — по 2 + исполненные REQUEST-CHANGES), APPEND-ONLY реестр, PR-литерал до мержа, ветки удалены.

## 2. Живое состояние (main `2b2f1254`, сверено 2026-09-12)

- Vitest полный **19573/19573** (1287 файлов; СОЛО-прогон после каждой волны) · lint 0/0 · tsc 0 (bare!) · build не требовался (нет runtime-конфигов)
- **Boundary 0 = baseline 0, PASS** (`node scripts/check-shadcn-ui-boundary.mjs`, bare exit 0); **exceptions = 3 registered, 3 suppressing** (waterfall C5-rider + PriceHistorySheet «#7C3AED» + FunnelTab «#7C3AED») — снимаются+мигрируются в W4
- Контраст-контракты: `src/styles/__tests__/globals-token-contract.test.ts` (requiredRoles +70, пиксель-пины, hue-различимость chart-1..10, selected-stack AA) · `globals-compiled-contrast.test.ts` (uniqueness 1..10, compile pins, boundary-regex де-маскировка)
- docs exit 0 (95) · locale 4 · lessons 0 · privacy 0 · дерево чистое
- Окружение: Node 24 PATH-пин (NODE-26: brew-апгрейд ломает webpack — пинуть PATH); PM2 id 3 BE :3000 healthy, id 5 FE dev :3100→200; креды проба — `.env.e2e` (untracked, SEC-DOC-1: не коммитить литералы)

## 3. Оставшийся объём

### 3.1 ★ ГЛАВНОЕ: волна ④ — финал эпика C5 (детальный план)

**Ветка**: `debt/c5-w4-waterfall-close`. **Ревью: 4 прохода** (кодификационная: Trigger 1 — канон-завершение; Trigger 4 — CLAUDE.md scope-контракт). **Цель: boundary 0 при exceptions = 0** (чекер должен печатать «exceptions = 0 registered»).

**Шаг 0 — owner-опрос (до имплементации, AskUserQuestion, 2 вопроса)**:
1. **Light-форк WCAG 1.4.11** (rider из §4/§31.1, созревший): light-валенс/chart-7/8/10 как ТЕКСТ = 1.92–3.76:1 (пиксель-идентичность легаси; chart-9 = 4.83 AA-PASS вне форка). Рекон W2 опроверг премиссу «текст-сайты в W2» — все валенс-потребители = fills/свотчи. Опции: (a) «1.4.11 закрывается для dark + компонентных пар; легаси-light принят» (рекомендуется — ноль визуальных изменений); (b) ретюн light-валенс до ≥4.5 (ломает пиксель-контракт W1, сдвиг всех валенс-свотчей в light); (c) отложить 1.4.11 отдельным треком (C5 закрывается без бандла). Учёт: TrendGraph-баннер 5.00:1 (AA-pass, запас тоньше легаси 6.16), warn/40 бордеры 2.66 (rider волны-6).
2. **Исторические метки #7C3AED** (PriceHistorySheet + FunnelTab, exceptions «classified not migrated»): мигрировать на ближайшую роль (с учетом owner-решения ⑥ «все 3 exceptions снимаются» — по умолчанию ДА; подтвердить, т.к. метки редковидимые).

**Шаг 1 — рекон/твин-свип** (прецедент (a): НЕ по спискам, паттерново): чекер с `_w4`- dry-инспекцией suppressed-матчей (раскомментировать exceptions временно НЕЛЬЗЯ — вместо этого читать suppressed files напрямую); grep `CHART_COLORS` (3 экспортируемых тёзки + 2 module-local); потребители waterfall (unit-economics-utils зелёная сторона vs waterfall-chart-config синяя); тесты, пинующие waterfall/PriceHistorySheet/FunnelTab/dashboard chart-config.

**Шаг 2 — waterfall валенс-семантика** (решение ④): `waterfall-chart-config.ts`: increase→`var(--color-chart-positive)`, decrease→`var(--color-chart-negative)`, total→нейтраль (`var(--color-chart-9)`/muted — выбрать по рендеру); убедиться `unit-economics-utils` больше НЕ дублирует цвет (double-source закрывается — реестр §191-C5); визуальный проб waterfall-графика. Снять exception №1 из `BOUNDARY_EXCEPTIONS` в `scripts/check-shadcn-ui-boundary.mjs`.

**Шаг 3 — PriceHistorySheet (6 hex, не 1!) + FunnelTab**: module-local `CHART_COLORS` (:26) → токен-карта; все 6 suppressed-hex → `var(--color-*)`; #7C3AED метки → `var(--color-chart-2)` (или решение шага-0); снять exceptions №2/№3. **Внимание**: самофайлы чекера — его self-тесты (`__tests__/check-shadcn-ui-boundary.test.mjs`) пинуют exceptions-реестр («exceptions register suppresses…») — обновить тесты тем же PR.

**Шаг 4 — тёзки CHART_COLORS** (решение ①): `dashboard/chart-config.ts:22` (метрики orders/revenue/…; METRIC_LABELS/METRIC_AXIS от него зависят) → значения в `var(--color-*)`; `cost-breakdown-types.ts:40`; `storage-trends-config.ts:15`; module-local `StorageTrendsChart.tsx:32` (уже var-based — сверить). После миграции константы либо удаляются, либо сохраняют имена с различающими комментариями (CLAUDE.md same-name convention) — по факту потребителей.

**Шаг 5 — WCAG 1.4.11 закрытие** (по решению шага-0): валенс-каналы; warn/40 бордеры 2.66 → пары ≥3:1 (fg-on-tint/border-swap, wave-6 рецепты); задокументировать вердикт по баннеру 5.00:1. Если (a) — дисклоужа «легаси-light принят» в CLAUDE.md Design System + реестр.

**Шаг 6 — гейты**: boundary **0=0, exceptions 0** (все три сняты, suppressed-матчей нет) · lint/tsc 0 (bare) · vitest ≥19573+Δ/0 СОЛО (Δ = новые пины; CLAUDE.md floor тем же PR) · docs/locale/lessons/privacy 0 · **computed-style проб** живого браузера: waterfall (increase/decrease/total), PriceHistorySheet marks, FunnelTab — формы резолвятся (протокол §10/§11; НЕ скриншоты, НЕ jsdom — прецеденты (d)).

**Шаг 7 — доки/закрытие**: CLAUDE.md boundary-строка → терминальная («0, exceptions 0 — boundary track complete; canon: var(--color-<role>) / bg-<role> utilities / color-mix тинты»); канон-декларация переносится в CLAUDE.md Design System; артефакт §12 (W4 record + Post-Nth блоки); реестр §34 (APPEND-ONLY) + строка owner-ledger C5 → done, WCAG 1.4.11 → закрыт по решению; handoff-цепочка обновляется этим же PR (следующий вход-документ сессии-14 или пометка «C5 complete» здесь).

**Шаг 8 — 4 прохода + PR**: pro-active blanket-qualifier; каждый фикс-клейм — grep на диск до коммита (прецедент (i) — 3 волны подряд!); push/merge по §6; PR-литерал до мержа.

### 3.2 Owner-ledger (после W4)

| Решение | Статус |
|---|---|
| C5 chart-palette | 🔄 волна ④ (последняя, план §3.1) |
| WCAG 1.4.11 valence-каналы | 🔄 бандл C5, закрывается в W4 (light-форк — решение шага-0) |
| A2 OrganicTab /80-тир | ⏳ |
| apiClient-санитизация (~128 .tsx echo) | ⏳ |
| финансовые токены / logger-redact / сканер-семантика | ⏳ |
| docs-baseline энфорсмент по зонам (§24) | ⏳ низкий |
| free-port restore-verify «ложная тревога» (§29) | ⏳ низкий |

### 3.3 BE-вопросы (мониторить, без изменений)

Remote publish BE-ветки (D-2) · FE-D3-residual · BE-seed для Manager-creds (machinery готова, §23).

### 3.4 Зарегистрированные residuals (не блокеры)

1. `e2e/fixtures/dbw-order-seed.ts:16` — единственный живой `__dirname` (infra-fixture)
2. `scripts/` ×10 `process.cwd()` — infra-инструменты (CLI-параметры чекеров)
3. `src/` cwd ×6 — registered (primitive-semantic-surfaces #427, token-test-utils:6, outbound-node-network-guard:18, playwright-static-boundary:315)
4. FU-3 §29: ~500ms race последнего тика + clear-on-success — dispositioned
5. **новое W3**: `bg-white` тултипов (expense/trend-graph-config) — вне banned-палитры и вне C5; dark-поведение тултипов — отдельный не-эпиковый вопрос
6. **новое W3**: TrendGraph X-кнопка без hover-аффорданса (wave-6 канон, sibling TaxWarningBanner так же) — опциональный UX-полиш `transition-colors`

## 4. Канон-прецеденты сессии-12 (жёстко выработанные, детали в §31–§33 + Post-Nth блоках)

(a) **Инвентари/head-списки недосчитывают** — твин-свип чекером/паттерном; W3: 13 сайтов оказались вне head-обрезанного списка; W2: 7 сайтов action-benchmark ушли от первого паттерна замены (поймал ratchet-down дельту).
(b) **Comment-only сайты** — резидуа-чекеры считают и комментарии; переписывание формулировок = легитимная миграция не-кода (7 из 57 в W3).
(c) **Сырой триплет ≠ цвет** (CRITICAL W2): `var(--valence-1)` в globals.css — HSL-компоненты; канон TS-строк = `var(--color-<role>)`; `hsl(var(--x))` валиден, но матчится CONTEXTUAL_HEX-регекс чекера → re-инфляция boundary; `var(--color-*)` — checker-чистая форма с production-прецедентом.
(d) **jsdom слеп к CSS-var резолву; скриншоты лживы** (видимые цвета идут из других источников — shim/классы/компонентные конфиги). Единственное доказательство цветовой миграции = **computed-style проба живого браузера** (`getComputedStyle` на синтетическом узле с точной формой значения; ожидаемые rgb сверять с расчётом из globals.css).
(e) **color-mix рецепт тинтов**: `color-mix(in srgb, var(--color-token) N%, var(--color-card))` — theme-aware, checker-чист; peak-глубина — примесь `var(--color-foreground)`.
(f) **tsc/lint/boundary — BARE, никогда не пайпить** (`| tail` съедает exit-code; TS1003 был пропущен пайпом).
(g) **EOL-регекс стрип в JSX съедает ` />`** self-closing тегов (2 случая W3, tsc поймал) — после пакетных правок JSX валидировать tsc немедленно.
(h) **Гомоглифы в search-строках** («витест»/«vitest») — replace молча не срабатывает; каждый replace — с `assert` или post-grep.
(i) **Fix-attestation-vs-disk — 3 волны подряд** (W1 pass-3: 2 из 12; W2 pass-1: счёт пинов; W3 pass-2: гомоглиф): клеймы фиксов в Post-Nth блоках и коммит-месседжах верифицировать grep'ом ДО коммита; в ревью-мандаты включать пункт «verify each fix-claim on disk».
(j) **Byte-claim гигиена**: клейм «≡ байт» — только после вычисления из globals.css; gray-400 (#9CA3AF = valence-neutral) ≠ gray-500 (#6B7280 = chart-9) — конфляция между волнами поймана проходом-1 W3.
(k) **4 прохода ловят 4 РАЗНЫХ класса** (W1: структура → нарратив-дрейф → fix-attestation+кодификация → close-row); классы не дублируются между проходами — сокращать расписание нельзя.
(l) **SendMessage-resume**: упавший по сети субагент оживляется по agentId (транскрипт цел, 39 tool-use'ов не потеряны).
(m) **Unstaged deletion → ENOENT**: `src/test/playwright-static-boundary.test.ts:322` (полный путь — урок LOW-12 W1: голая форма байпасит check:docs) читает `git ls-files` — стейдж ДО соло-прогона сюиты.
(n) **Промежуточный «очевидный» фикс может быть хуже бага** (`hsl(var())` → re-инфляция boundary) — проверять фикс против ВСЕХ гейтов, не только против найденного дефекта.

## 5. Операционные паттерны (окружение/сеть/процесс)

- **Push/PR при флапающем GitHub** (прецедент (h) сессии-11 + W3 DNS-флап): `git -c credential.helper='!gh auth git-credential' push https://github.com/salacoste/wb-erp-system-daytona-FE.git HEAD:refs/heads/<branch>` (fetch-remote = HTTPS, push-remote = SSH — SSH умирает); retry после `nslookup github.com`; верификация `git ls-remote`; `gh pr create --head <branch>`; **никогда не пайпить push/merge** (инцидент #436).
- **PR-литерал до мержа**: номер PR вписывается в реестр-строку отдельным коммитом ДО `gh pr merge` (урок #436); после мержа — `git checkout main && git pull && git branch -d <branch> && git push <https-url> --delete <branch>`.
- **Гейты волны** (все bare): `npm run lint` · `npm run type-check` · `npm test -- --run` (СОЛО, не параллельно с lint/tsc — ap8-гонка) · `node scripts/check-shadcn-ui-boundary.mjs` · `npm run check:docs` · `bash scripts/check-locale-percent.sh` · `bash scripts/check-lessons-length.sh` · `npm run check:privacy`.
- **Computed-style проб**: `PLAYWRIGHT_CLI_SESSION=<name> playwright-cli open http://localhost:3100/login` → логин из `.env.e2e` (`E2E_TEST_EMAIL/PASSWORD` через shell-переменные, не литералом) → `playwright-cli --raw eval "(() => { const d=document.createElement('div'); d.setAttribute('style','<ТОЧНАЯ ФОРМА ЗНАЧЕНИЯ>'); …getComputedStyle(d)… })()"` → сверить rgb с расчётом.
- **Артефакт/реестр force-add**: `_bmad-output/` в .gitignore — новые файлы `git add -f`; реестр уже tracked.
- **Ревью**: свежеконтекстные opus-агенты (subagent_type code-reviewer, read-only мандат), вердикт-строка обязательна, у каждого прохода СВОЙ класс дефектов (см. (k)); мандаты включать «verify fix-claims against disk» + «recompute числа, не доверять прозе».

_Подготовлено оркестратором сессии-12 (2026-09-12); факты сверены живыми прогонами на main `2b2f1254`. Следующая команда начинает с §3.1 шага 0 (owner-опрос)._
