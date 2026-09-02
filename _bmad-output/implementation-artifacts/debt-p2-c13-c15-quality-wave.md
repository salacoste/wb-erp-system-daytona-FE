# P2 волна: C13 (GapsTable caption-dup) + C15 (URGENCY_CLASS типизация по tier)

**Status**: done (2026-09-02, сессия-2 оркестратора V15; PR — см. Change Log)
**Branch**: `debt/p2-c13-c15-quality` (worktree `/private/tmp/p2-c13-c15`, base main `c21a571e`)
**Owner-track**: P2 качество/консистентность (волнами — канон V15 §4.2)

## Дефекты (verified live, pre-flight)

- **C13**: `GapsTable.tsx` — `scrollContainerAriaLabel="Таблица пропущенных дней финансовых данных"` (:65) ≈ `TableCaption>Пропущенные дни в финансовых данных` (:67): SR анонсирует таблицу дважды (caption = идентичность; region-лейбл дублирует).
- **C15**: `LiquidationScenarioCard.tsx` — `URGENCY_CLASS: Record<string, string>` с кириллическими ключами («Агрессивный» и т.д.): rename лейбла в lib = тихий loss класса (`?? 'text-foreground'` маскировал).

## Tasks

- [x] Pre-flight: file-локация (пути дрейфнули от плана — оба найдены), тест-пины инвентаризированы, манифест-пины проверены (GapsTable.test.tsx пинится ×2)
- [x] C13: aria-label → «Область прокрутки таблицы пропущенных дней» (описывает scroll-region, ≠ caption-идентичность); тест-пин :146 перепинен; caption не тронут
- [x] C15: `ScenarioUrgencyTier` union + `getScenarioUrgencyTier()` (пороги ≤30/≤60/else идентичны) — single classification source; `getScenarioUrgencyLabel` = tier-map; `URGENCY_CLASS: Record<ScenarioUrgencyTier,string>`; fallback дропнут (тотальный мэп)
- [x] Tier-тесты: 14/30/31/60/61 (границы + внутренняя точка)
- [x] Манифест 174.3 регенерирован (--owner-units, на финальном состоянии волны)
- [x] 2 ревью-прохода (обе плотности ≤5 — Trigger 3 не сработал; два APPROVE = сходимость)
- [x] Валидация: полный vitest 19424/0 (флор 19421→19424, +3 tier-теста) · lint 0/0 · tsc 0 · prettier · fast-гейты

## Dev Agent Record

### Post-1st-pass-review fixes (2026-09-02)

Findings (5: 2 MEDIUM / 3 LOW; VERDICT APPROVE):
- **F1 [MEDIUM]** stale-комментарий «urgency LABEL» → tier. **APPLIED**.
- **F2 [MEDIUM]** `getScenarioUrgencyColor` — вторая копия порогов + hex ≠ статус-токены. **APPLIED**: рефактор на `switch (getScenarioUrgencyTier(...))` (единый источник порогов) + disclosure-комментарий (production-dead, non-use запинен source-contract'ом; hex/token мисматч — follow-up, не «чинить» молча).
- **F3 [LOW]** stale титул теста → tier. **APPLIED**.
- **F4 [LOW]** сиблинг-таблицы (FinanceHistoryTable exact-dup, LiquidityTable near-dup) — тот же C13-класс. **DISPOSITIONED** → Follow-ups.
- **F5 [LOW]** tier(14) тест. **APPLIED**.

### Post-2nd-pass-review fixes (2026-09-02)

Findings (4: 2 MEDIUM / 2 LOW; VERDICT APPROVE):
- **F1 [MEDIUM]** «registered as follow-up debt» указывал в никуда → **APPLIED**: регистрация в ЭТОМ артефакте (Follow-ups ниже) + флипы реестров тем же PR.
- **F2 [MEDIUM]** реестры всё ещё показывали C13/C15 открытыми → **APPLIED**: флипы (debt-registry :198/:200 + FINAL-handoff C13/C15 rows) тем же PR.
- **F3 [LOW]** exhaustiveness-guard для color-switch. **APPLIED** (с коррекцией паттерна: narrowing по захваченному значению `const tier = ...`, не по повторному вызову — первая попытка не прошла tsc; урок ниже).
- **F4 [LOW]** ~20 сиблинг-таблиц с label≈caption дупом. **DISPOSITIONED** → Follow-ups.

**Trigger-учёт**: проход 1 = 5 (≤5), проход 2 = 4 (≤5) — Trigger 3 не сработал; сходимость по двум APPROVE.

## File List

Modified (6):
- `src/app/(dashboard)/analytics/gaps/components/GapsTable.tsx` — aria-label дедуп + комментарий
- `src/app/(dashboard)/analytics/gaps/components/__tests__/GapsTable.test.tsx` — ре-пин region-лейбла
- `src/lib/liquidity-utils.ts` — ScenarioUrgencyTier + getScenarioUrgencyTier + label-map + color-switch (exhaustive)
- `src/lib/__tests__/liquidity-utils.test.ts` — tier-тесты (14/30/31/60/61)
- `src/app/(dashboard)/analytics/liquidity/components/LiquidationScenarioCard.tsx` — typed URGENCY_CLASS, fallback дропнут, комментарии
- `src/app/(dashboard)/analytics/liquidity/components/__tests__/LiquidationScenarioCard.test.tsx` — титул → tier
- `e2e/fixtures/story-174-3/execution-manifest.json` — MACHINE-GENERATED (--owner-units)

## Гейты (финальное состояние)

vitest полный 19424/0 (1275 файлов) · lint 0/0 · tsc 0 · prettier clean · docs/locale/boundary/privacy — без изменений (волна их не касается; прогнаны на основном скоупе сессии).

## Follow-ups (зарегистрированы этой волной)

1. **C13-класс сиблинг-sweep (~20 таблиц)**: `scrollContainerAriaLabel` ≈ caption (SR double-announce): FinanceHistoryTable.tsx:66 (exact-dup), LiquidityTable.tsx:84, FunnelTable, StorageBySkuTable, MarginBy* и др. — волна 5-10 файлов, канон = «Область прокрутки …» + caption-идентичность.
2. **`getScenarioUrgencyColor` hex ≠ статус-токены** (#EF4444/#EAB308/#22C55E vs hsl-токены): функция production-dead (non-use запинен source-contract'ом); решение — удалить экспорт+тесты ИЛИ привести hex к токенам — owner-скоуп (удаление public API).

## Change Log

- 2026-09-02: Волна исполнена конвейером A–J (executor sonnet + 2 fix-волны; 2 ревью-прохода opus свежим контекстом; манифест реген на финальном состоянии). Флор 19421→19424 (+3).
  **Lessons:** (1) TS-narrowing не распространяется на повторный вызов функции — exhaustive-switch требует захвата значения в const. (2) «Registered as follow-up» без места регистрации = stale-comment на день позже — регистрируй в том же PR. (3) Канон-соседи сами могут нести фиксируемый дефект — сверяй паттерн с фактом, не с комментарием соседа.
