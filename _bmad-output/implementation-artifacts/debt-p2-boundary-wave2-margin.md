# P2 boundary-sweep волна-2: Margin-семейство + D-4 fold-in (2 файла, 29 сайтов + 2 класса)

**Status**: done (2026-09-03, сессия-2 оркестратора V15; PR #395, merged)
**Branch**: `debt/p2-boundary-wave2-margin` (worktree `/private/tmp/p2-bw2-margin`, base main `d7205094`)
**Owner-track**: P2 boundary 401→**372** owner-sweep, волна 2 (канон волны-1: `debt-p2-boundary-wave1-finsum.md`)

## Дефекты (verified live, pre-flight)

- Каталог 174.2 заявлял Margin-семейство 58 сайтов; **живой пересчёт**: MarginAggregatedTableRow (22) и MarginRowCells (7) уже чисты (окно 174.3/PR #384 — часть известного ↓64). Живой скоуп = MarginBadge 15 + MarginAggregatedTableHeader 14 = **29**.
- **D-4 fold-in** (найден executor'ом, верифицирован ревью pass-1): `margin-status-helpers.ts` excellent/critical на financial-/15-тинтах мерили **4.19/4.42 light = WCAG 1.4.3 FAIL** — аттестация D-4 «контраст обеих тем ≥4.5» покрывала только 2 solid-пары good/warning. Реестр-строка (7) корригирована APPEND-ONLY disclosure'ом (2026-09-03).

## Tasks

- [x] Pre-flight: live-пересчёт (дрейф каталога пойман), инвентарь (29 сайтов), потребители (MarginDisplay ре-экспорт, MarginByBrand/CategoryTable, PriceBasisBadge), манифест-пины
- [x] Волна (executor opus): 29/29 → семантические токены; харнесс волны-1 перестроен (`/tmp/p2-bw2-contrast.mjs`), 4 sanity-числа волны-1 воспроизведены точно
- [x] Семантика: margin-чипы = money-direction → **financial-valence** (паритет с W3-сиблингом MarginDisplay), НЕ status; сортировочные синие → status-information (паритет с SkuFinancialsTable-каноном)
- [x] House rule применён: fin-pos/10 = 4.49 (0.01 short!) → **/5** (4.80/8.72); fin-neg/5 = 5.20/8.19; чипы `bg-financial-*/5 + text-financial-* + border-financial-*/20`
- [x] InfoCard `bg-white` → `bg-card` (dark-mode фикс: буквальный белый бокс)
- [x] D-4 fold-in: excellent/critical /15→/5 (2 класса + комментарии с числами); price-calculator dir 1473/1473
- [x] Test sweep (урок F1): 4 consumer-файла перепинены (MarginDisplay ×2, MarginByBrand/Category ×3 селектора каждый); 2 переименования тайтлов ОТКАТЫ (pinned scenarioIds `owner-state-evidence-b.ts:502,572` — load-bearing); repo-wide residual = 23 тест-файла (чужие компоненты)
- [x] Манифест 174.3: executor вручную обновил 5 хэшей → **оркестратор нормализовал официальным раннером** `--owner-units` (fail-closed EXIT=0; 19 SHA объяснены: 6 волна + 13 волна-1 stale-по-времени)
- [x] Ratchet: 401 → **372** ровно (−29); baseline + CLAUDE.md тем же коммитом
- [x] 2 ревью-прохода: APPROVE(riders) → фиксы → pass-2

## Dev Agent Record

### Post-1st-pass-review fixes (2026-09-03)

Findings (5: 1 HIGH out-of-diff / 1 MEDIUM / 3 LOW; VERDICT APPROVE с riders):
- **F1 [HIGH] D-4 аттестация маскирует живой AA-fail** — ревьюер независимо (свой калькулятор, anchor-валидированный: black/white=21.00, #767676/white=4.5422) подтвердил 4.19/4.42 light FAIL; харнесс волны-2 = канон. **APPLIED**: fold-in /15→/5 в этой волне + APPEND-ONLY коррекция реестра + follow-up на unit-economics/GrossProfitSection (тот же класс).
- **F2 [MEDIUM]** baseline/CLAUDE.md не снижены. **APPLIED** (372).
- **F3 [LOW]** pinned-титулы «error-colour badge» теперь семантически неточны. **DISPOSITIONED**: переименование сломает scenarioId-пины; отложено до волны с регенерацией манифеста через раннер.
- **F4 [LOW]** zero/no-data чипы стали class-идентичны. **DISPOSITIONED**: тесты дискриминируют контентом (0,00 % vs —); informational.
- **F5 [LOW]** артефакт волны-2. **APPLIED** (этот файл).

**Trigger-учёт**: проход 1 = 5 (≤5); сходимость по плану (pass-2 фиксирует fold-in).

## File List

Modified (8): `MarginBadge.tsx`, `MarginAggregatedTableHeader.tsx`, `price-calculator/margin-status-helpers.ts` (fold-in), `MarginDisplay.test.tsx`, `__tests__/margin-display.test.tsx`, `MarginByBrandTable.test.tsx`, `MarginByCategoryTable.test.tsx`, `e2e/fixtures/story-174-3/execution-manifest.json` (MACHINE, раннер). Плюс: baseline 401→372 + CLAUDE.md row + debt-registry APPEND-correction.

## Гейты (финальное состояние — см. pass-2 прогон)

vitest полный 19424/0 (пре-fold-in; fold-in покрыт dir-прогоном 1473/1473 + pass-2 финальным) · lint 0/0 · tsc 0 · boundary 372=new baseline · docs 95 · locale 4 · prettier.

## Follow-ups

1. **Colored-token-on-/15 класс** вне семьи (pass-2 полная энумерация): `src/lib/unit-economics-config.ts` (3 фейлящих entry из 5: pos/15=4.19, **warning/15=3.97 — худший в классе**, neg/15=4.42) + `GrossProfitSection.tsx` (2) + **`CashflowRowPrimitives.tsx:27,82,109,152` (4 /15-сайта — пропущен в pass-1 коррекции)** — замерить и /15→/5 (sku-financials-паттерн fg-on-tint безопасен — не трогать).
2. **Sub-AA /10-пары ВНУТРИ price-calculator** (pre-existing, pass-2 F1): `TwoLevelPriceHeader.tsx:16` (fin-pos/10=4.49) + `:23` (warning/10=4.24), `MarginSlider.tsx:35` (4.49) + `:33` (4.24), `MarginSection.tsx:139` (4.49) — тот же house-rule /10→/5.
3. Тест-файлы с legacy-пинами (базис pass-2): 44 пиняют любые legacy-классы / 17 — точные классы этой волны / 9 — только bg-*-50; идут со своими волнами 3-6.
4. Pinned-титулы «error-colour» (pass-1 F3) — при следующей регенерации манифеста раннером.

## Change Log

- 2026-09-03: Волна-2 исполнена конвейером; PR #395. A–J (executor opus; ревью pass-1 с независимым контраст-калькулятором поймал over-claim аттестации D-4 → fold-in + registry-коррекция). Boundary 401→372; флор 19424 не тронут.
  **Lessons:** (1) Аттестация «≥4.5 подтверждён» валидна только для ЗАМЕРЕННЫХ пар — retained-объекты рядом с фиксом не наследуют вердикт. (2) Каталог устаревает: live-пересчёт перед волной обязателен (58→29). (3) Манифест-пин pre-flight должен крыть consumer-тесты, не только компоненты — ручное обновление хэшей нормализуется только официальным раннером.
