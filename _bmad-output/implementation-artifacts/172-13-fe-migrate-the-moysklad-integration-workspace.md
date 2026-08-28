# Story 172.13-FE: Migrate the Moysklad Integration Workspace

Status: done — PR #317 merged (`485fa27d`, commit `5fe9af95`); **MINOR-GAP** — 8 файлов (7 M однострочных + 1 A гард, +115/−7): 7 palette → семантика (configured-бейдж success-токены, 3 идентичных warning-баннера ReportPendingBanner-канона, headline непривязанных → status-warning, линк → primary, recalc-бейдж); гард 6 (каталог 13 exact-array по BFS, no-palette/no-hex, тернарник/баннер-шейп/recalc/link/headline пины; мутационно-проверен); targeted 5/45; полный пол **19 439/0/1223** (floor 19 433 → +6 exact); e2e 12✓ (4 спеки по плану); 1×opus APPROVE-WITH-NOTES; cleanup 0/0/0.

## Story

As a seller using МойСклад, I want the integration workspace (overview, mappings, stock/products/variants tables) to keep its behavior while completing the token migration.

Plan: `.omx/plans/172.13-migrate-the-moysklad-integration-workspace.md` (authoritative — branch `cdx/epic-172-story-13-moysklad`, worktree `/private/tmp/wb-repricer-fe-172-13-moysklad`).

## Acceptance Criteria

Per plan — все закрыты; className-only изменения, поведение/RU-строки заморожены.

## Tasks / Subtasks

- [x] Task 0: prerequisites (base `11fc6038`); carry-in grep — обязательных НЕТ.
- [x] Task 1: baseline **4 файла / 39 тестов / EXIT=0**; комплаенс: 7 файлов × 1 palette-строка, hex 0, rawbtn 0.
- [x] Task 2 (правки, orchestrator-direct): 7 однострочных свапов канон-маппингом (см. Status); тест-репинов не потребовалось (цвет-ассертов в тестах нет).
- [x] Task 3: гард 6 тестов (каталог 13 exact-array; пины всех 7 миграций).
- [x] Task 4: валидация: targeted 5/45 EXIT=0; lint 0/0; tsc 0; max-lines OK; build --webpack EXIT=0; полный пол **СОЛО 19 439/0/1223 EXIT=0** (+6 exact); e2e 12✓ (3 setup + 2 orders + 7 по 4 спекам плана); diff --check чист.
- [x] Task 5: 1×opus ревью (микро-дифф <50 прод-строк) — APPROVE-WITH-NOTES (0 блокирующих).

## Dev Notes

- Floor: 19 433 → **19 439 (+6 exact)** = 6 гард-тестов; файлы 1222 → 1223.
- Ревьюер подтвердил: headline-метрика = счётчик «Не привязаны» → warning-валентность корректна; баннеры байт-совместимы с ReportPendingBanner-каноном; text-primary имеет 8+ прецедентов в мигрированных роутах.
- Мутационный тест гарда: все 5 удалённых legacy-строк ловятся регексом; новые токены не дают ложных срабатываний.

### References

- [Source: plan `.omx/plans/172.13-migrate-the-moysklad-integration-workspace.md`]
- Каноны: ReportPendingBanner (баннеры); sibling-гарды finances/monitor (регексы байт-в-байт).

## Dev Agent Record

### Agent Model Used

- Implementation: orchestrator-direct (MINOR 7 строк). Review: 1× code-reviewer (opus fresh) — APPROVE-WITH-NOTES.

### Post-1st-pass-review fixes (2026-08-28)

- Кодовых изменений нет: 3 LOW информационные — presence-пины vs exclusivity (флит-вайд канон-ограничение), recalc-бейдж «обновлена»=informational-кандидат (semantic-pass carry-out), pre-existing `?? 0` на счётчике (AP#8 counts-исключение).

### Debug Log References

- /tmp logs: `172.13-{baseline,fix1,guard,lint,tsc,build,full,e2e,devserver}.log`; дифф `172.13-review-diff.txt`.

### Completion Notes List

- Замыкание 13/13 BFS ↔ гард-каталог 1:1 (ревьюер строил сам, dead-файлов нет).
- Самая маленькая стори сессии: 7 прод-строк, конвейер полный без пропусков.

### Gaps

- Visual light/dark + zoom — 174.3 (прецедент). Carry-out: recalc-бейдж semantic-классификация (informational vs warning).

### File List

PR #317: commit `5fe9af95` = **8 файлов** (7 M + 1 A), +115/−7: гард NEW; M — CogsRecalcBadge, MoyskladHealthBadge, MoyskladMappingRow, MoyskladOverview, MoyskladProductsTable, MoyskladStockTable, MoyskladVariantsTable.

### Change Log

| Date | Change |
|---|---|
| 2026-08-28 | Story planned (MINOR-GAP 7 строк). Plan authoritative. |
| 2026-08-28 | 7 свапов + гард 6; 1×opus APPROVE-WITH-NOTES. Status: ready-for-dev → review. |
| 2026-08-28 | Merged: PR #317 (`5fe9af95`, merge `485fa27d`); targeted 5/45, full **19 439/0/1223** (+6 exact), e2e 12✓, cleanup 0/0/0. **Эпик 172: 13/17.** Status: review → done. **Lessons:** (1) 7-line stories still run the FULL A-J pipeline — guard + BFS-closure + review catch what line-count intuition misses. (2) Headline metrics need valence verification from context (unmapped-count IS warning; a total-count would NOT be). (3) Presence-pins are the fleet canon; exclusivity-pins remain a documented limitation. |
