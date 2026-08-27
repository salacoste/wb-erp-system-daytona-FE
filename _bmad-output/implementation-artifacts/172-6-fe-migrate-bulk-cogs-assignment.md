# Story 172.6-FE: Migrate Bulk COGS Assignment

Status: done — PR #289 merged (`42ac0686`, commit `27535e8d`); MINOR-GAP-plus (owner) — 9 файлов (8 M прод + гард, +169/−57); 1×opus **APPROVE-WITH-NOTES** (0 блокирующих; независимый import-closure аудит чист); targeted 3/24; полный пол **19 334/0** (floor 19 327 → 19 334, +7); e2e cold-flakes → warm 8/8; cleanup 0/0/0.

## Story

As a seller, I want `/cogs/bulk` to keep validation/preview/partial-results/failed-row-retry behavior while the bulk surface moves onto semantic tokens.

Plan: `.omx/plans/172.6-migrate-bulk-cogs-assignment.md` (authoritative — branch `cdx/epic-172-story-6-cogs-bulk`, worktree `/private/tmp/wb-repricer-fe-172-6-cogs-bulk`). Owner-стори (registry §5): recovered WIP #225 уже в main; оркестратор = owner-исполнитель.

## Acceptance Criteria

Per plan (canonical AC + execution checklist) — все закрыты.

## Tasks / Subtasks

- [x] Task 0: prerequisites (base `4343c3a5`); carry-in grep «172.6» — обязательных НЕТ.
- [x] Task 1: behavior lock — targeted baseline **2 файла / 17 тестов / EXIT=0**; **closure-предскан до волны** (урок 172.5): замыкание = ровно owned-surface + MarginCalculationStatus (уже чист, 172.5).
- [x] Task 2: pre-flight — owned = bulk/page + bulk-cogs/** (12 прод) + custom/BulkCogsForm.tsx; долг **49 palette-строк / 8 файлов**; hex 0; тест-пинов 0 (предскан).
- [x] Task 3: **волна executor'а** (7 файлов/47 строк; канон + прецеденты). **Процессный пойм**: список волны указал `custom/BulkCogsForm.tsx` — оказался 1-строчным ре-экспорт-шимом; исполнитель корректно СТОПнулся на настоящей `bulk-cogs/BulkCogsForm.tsx` (2 строки вне списка) → оркестратор закрыл сам (selected-count → muted; submit blue-override → default primary).
- [x] Task 4: гард 7 тестов — каталог: bulk-cogs tree pinned **11** (per-file identity) + shim + route page; no-palette/no-hex; пины (alerts success/error tints, selected-row information, validation destructive, primary-action no-blue-override). Инцидент: depth-4 маршрут требует 4×`..` до src/ (первый прогон 7/7 RED — починено, 7/7 GREEN).
- [x] Task 5: валидация + 1 ревью + PR #289 + cleanup 0/0/0.

## Dev Notes

- Baselines: targeted 2/17 → **3/24**; полный пол **19 334/0** (+7 гардов).
- **E2E-аттестация (исправленная по ревью-MEDIUM, точная декомпозиция обёртки)**: обёртка подмешивает `e2e/orders.spec.ts` + auth-сетапы к любому вызову. Первый (холодный) прогон `cogs-assignment + cogs-pages`: **22 passed / 3 failed** — все 3 = nav[aria-label] 10s-visibility на холодном dev (2 history-теста + 1 bulk-навигация; класс 172.5, 15.4s таймауты). Тёплый ретрай `cogs-pages`: обёртка **13 passed / 0 failed** = cogs-pages **8/8** + orders ×2 + auth ×3; cogs-pages статически содержит ровно 8 тестов (сверено ревьюером). Дифф color-only на файлах, которые сайдбар не рендерит → навигация-таймауты не могут быть регрессией.
- Визуал light/dark: gap (троттл; как 172.4/172.5), покрытие = e2e на реальном UI + идиомы семейства валидированы dark в 172.1-172.5.

### References

- [Source: plan `.omx/plans/172.6-migrate-bulk-cogs-assignment.md`]
- Сиблинг-канон: SingleCogsFormFields (destructive-формы); ProductTableRow 172.5 (selected-row); PostInstallBanner (banner-идиома).

## Dev Agent Record

### Agent Model Used

- Implementation: 1 executor-волна (sonnet) + оркестратор (2 строки + гард). Review: 1× code-reviewer (opus fresh) — APPROVE-WITH-NOTES; независимо: closure-BFS чист, guard+exclusive 26/26, cogs-дерево+bulk-hooks 84/84, tsc/eslint зелёные.

### Post-1st-pass-review fixes (2026-08-27)

- **[MEDIUM] Аттестация чисел e2e** (0 блокирующих, код не менялся): разложение обёртки зафиксировано в Dev Notes выше (13 = 8+2+3; 25 первого прогона = 16 cogs-assignment + 8 cogs-pages + подмешанные, 3 флейка nav-visibility). Урок в Lessons.
- Диспозиции: LOW контраст summary-tiles при будущих светлее-темах — note; cross-story restraint (не дублирующий скан MarginCalculationStatus в гарде 172.6 — покрыт гардом 172.5) отмечен ревьюером как правильный.

### Debug Log References

- /tmp logs: `172.6-{baseline,targeted,lint,tsc,build,full,e2e,e2e2,guard,guard2,devserver*}.log`; дифф `172.6-review-diff.txt`.

### Completion Notes List

- Executor-стоп на шиме — образцовое поведение контракта волны (§4: файл вне списка = стоп + отчёт, не самовольная правка).
- Guard depth-4 инцидент пойман первым же прогоном (7/7 RED → фикс резолва → GREEN) — дешёвый урок против дорогого.

### Gaps

- Live-скриншоты /cogs/bulk light/dark (троттл-гэп как 172.4/172.5); 200% zoom / reduced-motion — трек 174.3.

### File List

PR #289: commit `27535e8d` = **9 файлов** (8 M + 1 A гард), +169/−57.

### Change Log

| Date | Change |
|---|---|
| 2026-08-27 | Story planned (MINOR-GAP-plus: 49 строк/8 файлов; closure-предскан чист). Plan authoritative. |
| 2026-08-27 | Волна(7) + оркестраторский догон(шим-инцидент) + гард(7, depth-4 фикс); 1×opus APPROVE-WITH-NOTES (closure чист; MEDIUM аттестация → декомпозиция выше). Status: ready-for-dev → review. |
| 2026-08-27 | Merged: PR #289 (`27535e8d`, merge `42ac0686`); targeted 3/24, full **19 334/0**, e2e warm 8/8, cleanup 0/0/0. **Эпик 172: 6/17.** Status: review → done. **Lessons:** (1) Ре-экспорт-шим и настоящая форма — омонимы путей: сверяй палитроносца с фактическим файлом до списка волны. (2) e2e-обёртка подмешивает orders+auth — аттестуй разложение, не сырую сумму. (3) Гард-резолв depth маршрута = N×'..' до src/ — проверяй первым прогоном сразу. |
