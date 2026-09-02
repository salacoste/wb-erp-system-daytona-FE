# Debt D-3 + D-4 — WCAG 1.4.3 solid-пары (handoff §8-P1): PB-4 FeedbackButtons + /15-family price-calculator

**Status**: review — 2026-09-02; пройдено 2 ревью-прохода (проход-1 code-reviewer/opus, структура: APPROVE-WITH-FINDINGS, 5 findings, все закрыты фикс-волной; проход-2 свежий контекст, визуальная согласованность + факты: APPROVE-WITH-FINDINGS, 7 findings + 1 INFO-positive); плотность 7 > 5 → **проход-3 MANDATORY запланирован** (Trigger 3) после closeout-правок; PR: TBD (оркестратор)
**Item**: D-3 (**PB-4**) + D-4 (**/15-family**) одной волной — debt-канон: final handoff §8-P1 (D-3/D-4) + §4 (PB-4, /15-family, BOUNDARY_EXCEPTIONS) · **PR**: TBD · **Base**: main `0bceadf4` · **Branch**: `debt/d3-d4-wcag-solid-pairs` · **Worktree**: `/private/tmp/d3-d4-wcag-solid-pairs` · **Date**: 2026-09-02

> **Контраст-канон этого артефакта.** Все послеволновые значения — WCAG relative luminance, live-вычисление по токенам из `src/styles/globals.css`; независимо ПЕРЕСЧИТАНЫ ревьюером-1 (побитово) и ревьюером-2 (до третьего знака). Исторические замеры legacy-палитры (light 5.02 / muted 4.56 / dark 3.53) — из 174.5 pass-2, до волны; уточнение поверхностных hex см. F-7 (выводы неизменны).

## 1. Долг и DoD

**Долг D-3 (PB-4).** FeedbackButtons success-спан `text-green-700` (#15803d): dark-тема **3.53:1 — WCAG 1.4.3 AA fail** (light 5.02:1, muted 4.56:1). Origin-комментарий `FeedbackButtons.tsx:16` ложно заявлял «~6.5:1» и ссылался на «F-10 TECH-DEBT ledger» — записи не существует (висячая ссылка, дублировалась в boundary-скрипте и manifest §7). Файл дополнительно держал одно из 4 boundary-исключений `BOUNDARY_EXCEPTIONS`.

**Долг D-4 (/15-family).** `text-status-X` на /15-тинтах <4.5:1: `src/components/custom/price-calculator/margin-status-helpers.ts:13,:16` (good/warning) + `src/components/custom/price-calculator/AcceptanceStatusBadge.tsx:49` (high).

**Fix-канон**: solid-пары `bg-status-X text-status-X-foreground` (173.12 / 174.4-D5).

**Выполнение DoD.** 3 компонента переведены на solid-пары; контраст 4/4 пар ≥4.5:1 в обеих темах (live, дважды независимо пересчитан); origin-комментарий переписан без legacy-литералов; boundary-исключение снято (4 синхронных правки, см. Lessons); манифесты / гейт-строки / реестр синхронизированы.

**Контраст после волны (4/4 PASS):**

| Пара | light | dark |
|---|---|---|
| `bg-status-success` × `text-status-success-foreground` | **5.13:1** | **8.00:1** |
| `bg-status-warning` × `text-status-warning-foreground` | **4.81:1** | **11.41:1** |

**Ключевое ограничение item'а.** `--financial-*`-токены (positive/negative/neutral, globals.css) НЕ имеют `-foreground`-компаньонов → excellent (`:10`) и critical (`:21`) margin-шкалы НЕ переводятся на solid-пару без дизайн-решения о новых токенах — осознанно оставлены на /15-тинтах; источник residual F-3 (§ Dispositions).

## 2. Method (конвейер)

Оркестратор: recon (explore/sonnet) → волна имплементации (executor/sonnet) → live-вычисление контраста → ревью-проход 1 (code-reviewer/opus, структура) → фикс-волна → ревью-проход 2 (свежий контекст, визуальная согласованность + факты). Ревью-вход — дифф; контраст-числа независимо пересчитаны каждым ревьюером (проход-1 побитово, проход-2 до третьего знака). Гейты — только живые прогоны в worktree.

## 3. Tasks

1. [x] Recon (explore/sonnet) — 3 компонента; consumers: FeedbackButtons ×2 таблицы (ForecastTable, EvaluationsTable), MarginSection — единственный рендерер `MARGIN_STATUS_CONFIG`, AcceptanceStatusBadge → DeliveryDatePicker; boundary-механика (suppressed НЕ входят в 459; сценарии a/b/c self-test; скрытые связи: size-пин self-test, манифест-инвариант «§7 = BOUNDARY_EXCEPTIONS», жёсткие тест-пины классов); `--financial-*` без `-foreground`-токенов → `:10`/`:21` вне скоупа.
2. [x] Волна (executor/sonnet) — solid-пары в 3 компонентах; origin-комментарий переписан (без legacy-литералов — boundary-сканер матчит и комментарии); boundary-скрипт: exception снят (Map 4→3), комментарии вычищены; self-test: фикстура → waterfall (реальный файл, 2 hex-мэтча), size-пин 4→3; тест-пины high-строк в 2 файлах AcceptanceStatusBadge; манифесты §7/§4 синхронизированы (3 файла / 3 suppressing / 22 suppressed = 11+6+5); registry APPEND disclosure (7).
3. [x] Контраст live-вычисление — 4/4 ≥4.5:1 (таблица §1); независимо пересчитан ревьюером-1 (побитово) и ревьюером-2 (до третьего знака).
4. [x] Ревью-проход 1 (code-reviewer/opus, структура) — APPROVE-WITH-FINDINGS, 5 findings (2 MEDIUM, 3 LOW).
5. [x] Фикс-волна — чип-геометрия `rounded px-2 py-0.5` (прецедент `StorageComparisonCard:37`); ассерт `toHaveClass` в СУЩЕСТВУЮЩИЙ it F-9 (19 it до/после — флор не сдвинут); /tmp-цитаты убраны (числа инлайн); историческая строка §7 маркирована.
6. [x] Ревью-проход 2 (свежий, визуальная согласованность + факты) — APPROVE-WITH-FINDINGS, 7 findings + 1 INFO-positive.
7. [x] Проход-3 (сходимость) — **APPROVE, 2 findings ≤5 → сходится** (плотность 5→7→2); оба закрыты в `### Post-3rd-pass-review fixes` (doc-only).

## 4. Dev Agent Record

### Implementation

1. **Recon.** Consumers зафиксированы (см. Tasks 1): FeedbackButtons рендерится в 2 таблицах (forecast + evaluations), MarginSection — единственный потребитель `MARGIN_STATUS_CONFIG`, AcceptanceStatusBadge — единственный non-test потребитель в DeliveryDatePicker; правка конфига/мапы не требует правок consumers. Boundary-механика: suppressed-матчи НЕ входят в ratchet-счёт 459; снятие исключения не меняет total (файл после волны больше не несёт legacy-матчей). Скрытые связи снятия: (a) size-пин `BOUNDARY_EXCEPTIONS.size` в self-test, (b) манифест-инвариант §7-таблица = Map 1:1, (c) жёсткие пины `/15`-классов в 2 тест-файлах AcceptanceStatusBadge, (d) гейт-строки «4 exceptions» в delivery-manifest + final handoff. `--financial-*` без foreground → excellent/critical вне скоупа.
2. **Волна (executor/sonnet).** FeedbackButtons: success-спан → `bg-status-success text-status-success-foreground` + чип-геометрия; origin-комментарий переписан (без `text-green-700`/hex — сканер матчит комментарии). margin-status-helpers: good/warning → solid-пары (excellent/critical — осознанно на /15, комментарий в коде). AcceptanceStatusBadge: high → solid-пара (warning), бордер `/40` сохранён. Boundary-скрипт: FeedbackButtons-исключение удалено, комментарий-блок заменён на lift-заметку (Map 4→3). Self-test: exception-фикстура переведена на waterfall (реальный файл исключения, 2 hex-мэтча), size-пин 4→3. Тест-пины: `bg-status-warning/15`+`text-status-warning` → `bg-status-warning`+`text-status-warning-foreground` в обоих файлах AcceptanceStatusBadge. Манифесты: classification §7 — 3 строки + историческая строка Removed; §1 — исторический маркер snapshot; final-delivery §4 + гейт-строка «3 registered exceptions». Registry: APPEND disclosure (7) «RESOLVED 2026-09-02».
3. **Контраст live-вычисление.** Токены из `src/styles/globals.css` (обе темы), WCAG relative luminance: success 5.13 (light) / 8.00 (dark); warning 4.81 (light) / 11.41 (dark) — 4/4 ≥4.5 PASS. Независимо пересчитано дважды (ревьюер-1 побитово; ревьюер-2 до третьего знака) — расхождений нет.
4. **Фикс-волна (после прохода-1).** Чип-геометрия `rounded px-2 py-0.5` по прецеденту `StorageComparisonCard:37`; юнит-пин новой пары — `toHaveClass('bg-status-success', 'text-status-success-foreground')` в существующий it F-9 (19 it до/после — полный-прогон флор не сдвигается); /tmp-цитаты в записях убраны (числа инлайн); историческая строка §7 промаркирована `(historical, superseded)`.

### Validation

Финальные гейты — 2026-09-02, живые прогоны в worktree.

| Gate | Результат |
|---|---|
| UI boundary ratchet (`node scripts/check-shadcn-ui-boundary.mjs`) | **459 = 459 PASS** (ratchet; exit 1 только на рост); 3 exceptions; self-suite 10/10 |
| Vitest полный | **19415 passed / 0 failed** (1275 файлов); прогон на состоянии до фикс-волны — фикс-волна добавила только ассерт в существующий it + классы, счётчик it не менялся; targeted после фикс-волны: 19/19 FeedbackButtons + 102/102 спеков AcceptanceStatusBadge (44 + 58; = 121/121 суммарно по трём файлам) |
| `npx next build --webpack` | 0 |
| `npm run lint` | 0 errors / 0 warnings |
| `npm run type-check` | 0 |
| max-lines | 0 |
| check:docs (baseline 95) | exit 0 |
| prettier (изменённые src-файлы) | чисто |
| `git diff --check` | 0 |

### Review

**Проход 1 (code-reviewer/opus, свежий контекст, структура) — APPROVE-WITH-FINDINGS, 5 findings:**

- **F-1 (MEDIUM)** — solid-чип без padding/rounded: голый solid-фон без геометрии чипа;
- **F-2 (MEDIUM)** — отсутствие юнит-пина новой пары (замена классов не запинена тестом);
- **F-3..F-5 (LOW ×3)** — в т.ч. /tmp-цитаты в записях (перечисляют пути, которых нет в диффе) и непомаркированная историческая строка §7; все закрыты фикс-волной (см. Implementation 4).

**Проход 2 (свежий контекст, визуальная согласованность + факты) — APPROVE-WITH-FINDINGS, 7 findings + 1 INFO-positive:**

- **F-1 (MEDIUM)** — висячая ссылка на артефакт волны в closeout-доках → **закрыто этим файлом** (артефакт существует, ссылка валидна);
- **F-2 (MEDIUM)** — handoff §4: PB-4-строка RESOLVED, но соседняя строка всё ещё «BOUNDARY_EXCEPTIONS ×4» → **закрыто closeout-правками оркестратора тем же PR** (теперь ×3);
- **F-3 (LOW-MEDIUM)** — инверсия визуального веса margin-шкалы: excellent = /15 tint, good/warning = solid, critical = /15 → **осознанный residual** (нужны `--financial-*-foreground` токены = дизайн-решение; см. Dispositions);
- **F-4 (LOW)** — §1-манифест: исторический snapshot без маркера → **закрыто** (исторический мостик добавлен);
- **F-5 (LOW)** — асимметрия success-чип / error-plain-text → **KEEP** (error 6.54/11.66 AA+, длинный текст, обосновано);
- **F-6 (LOW)** — бордер `/40` на solid-парах → **no action** (бордер поверх solid нейтрален для контраста);
- **F-7 (LOW)** — исторические hex поверхностей уточнены (4.56→4.60, 3.53→3.95 — выводы неизменны: dark всё равно <4.5) → **задокументировано**;
- **F-8 (INFO-positive)** — чип каноничен, место в таблицах достаточно.

**Плотность прохода-2 = 7 > 5 → Trigger 3: проход-3 MANDATORY** — запланирован после closeout-правок (вход: финальный дифф включая этот артефакт).

### Post-1st-pass-review fixes (2026-09-02)

Чип-геометрия `rounded px-2 py-0.5` (прецедент `StorageComparisonCard:37`); юнит-ассерт `toHaveClass` добавлен в СУЩЕСТВУЮЩИЙ it F-9 (`FeedbackButtons.test.tsx`, 19 it до/после — флор полного прогона не сдвинут, CI-пруф честен); /tmp-цитаты убраны — контраст-числа инлайн; историческая строка §7 classification-манифеста маркирована `(historical, superseded)`. Все 5 findings прохода-1 закрыты.

### Post-2nd-pass-review fixes (2026-09-02)

F-1 закрыт созданием этого артефакта; F-2 закрыт closeout-правками оркестратора (handoff §4 «BOUNDARY_EXCEPTIONS ×4» → «×3» с lift-пометкой); F-4 закрыт историческим маркером в §1-манифесте; F-5 KEEP, F-6 no action, F-3/F-7 — residual/disposition (ниже). Отдельных код-правок волна не потребовала.

### Residual risks / dispositions

- **F-3 (инверсия веса margin-шкалы)** — owner/дизайн-решение: ввести `--financial-*-foreground` токены и перевести excellent/critical на solid-пары; до тогда шкала смешивает tint/solid осознанно.
- **F-5** — KEEP: error остаётся plain-text (6.54 light / 11.66 dark, AA+; длинный текст, чип-обёртка не обоснована).
- **F-6** — no action (бордер `/40` на solid).
- **F-7** — уточнённые поверхностные hex (4.56→4.60 muted, 3.53→3.95 dark) задокументированы; выводы legacy-замеров неизменны (dark fail подтверждён). Уточнить hex в доках при следующем касании.
- **~100 /15-сайтов по репо** — вне registered-скоупа D-4; owner-scoped sweep (registered, handoff §5 п.2).
- **/10-семья того же AcceptanceStatusBadge** (проход-3, live-пересчёт) — success /10 = 4.49:1 и warning /10 = 4.26:1 в light-теме (<4.5 AA; dark обе ≥7.1 pass) — строки не входили в registered-скоуп D-4 (только :49 high); кандидат в owner-sweep /10-family.

### Post-3rd-pass-review fixes (2026-09-02)

Проход-3 (сходимость, вход — дифф с артефактом): APPROVE, 2 findings, оба doc-only, закрыты здесь: (1) числовая атрибуция targeted-прогонов исправлена (19/19 + 102/102 = 121/121 суммарно, а не «121/121 спеков ASB»); (2) residual-список дополнен /10-семьёй ASB (light 4.49/4.26 < AA). Код не менялся.
- **~10 `text-green-700`-файлов** — в активных 459 residue boundary-скана; owner-sweep через ratchet.

## 5. File List

Итог (живой счёт worktree, 2026-09-02): **13 файлов = 12 M + 1 NEW**.

### Implementation — 8 modified (src 6 + scripts 2)

- `src/components/custom/ai/FeedbackButtons.tsx` — solid-чип + новый origin-комментарий
- `src/components/custom/ai/__tests__/FeedbackButtons.test.tsx` — +ассерт пары в it F-9
- `src/components/custom/price-calculator/margin-status-helpers.ts` — good/warning solid
- `src/components/custom/price-calculator/AcceptanceStatusBadge.tsx` — high solid
- `src/components/custom/price-calculator/__tests__/AcceptanceStatusBadge.test.tsx` — high-пины
- `src/components/custom/price-calculator/__tests__/AcceptanceStatusBadge.story-44.43.test.tsx` — high-пины
- `scripts/check-shadcn-ui-boundary.mjs` — exception снят (Map 4→3)
- `scripts/__tests__/check-shadcn-ui-boundary.test.mjs` — фикстура waterfall, size-пин 3

### Closeout — 4 modified

- `_bmad-output/planning-artifacts/shadcn-ui-boundary-classification-manifest.md` — §7 sync + §1 исторический мостик
- `_bmad-output/planning-artifacts/shadcn-migration-final-delivery-manifest.md` — §4 + гейт-строка
- `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md` — APPEND disclosure (7)
- `docs/HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md` — §3/§4 (PB-4, /15, ×3)/§5/§8 (D-3, D-4)

### NEW (1)

- `_bmad-output/implementation-artifacts/debt-d3-d4-wcag-solid-pairs.md` — этот артефакт (gitignored → `git add -f`)

## 6. Change Log

| Date | Scope | Status | Lessons |
|---|---|---|---|
| 2026-09-02 | Implemented D-3 (PB-4) + D-4 (/15-family): solid-пары 3 компонентов, boundary exception снят (4→3), контраст 4/4 ≥4.5 live | review | **Lessons:** (1) Снятие boundary-исключения требует 4 синхронных правки: скрипт, self-test size-пин, манифест-таблица, гейт-строки доков. (2) Контраст пары = bg-токен против *-foreground, не bg против text-X: пара без foreground молча падает до ~2:1. (3) Ассерт в существующий it вместо нового — флор полного прогона не сдвигается, CI-пруф остаётся честным. |
