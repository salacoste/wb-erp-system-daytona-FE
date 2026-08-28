# Story 172.16-FE: Migrate Order Integrity Analysis

Status: done — PR #323 merged (`8939aea4`, commit `ca0330cb`); **MINOR-GAP** — 3 файла (2 M + 1 A гард, +84/−6): 6 однострочных palette→token свапов (IntegrityStatusCard healthy/warning/unhealthy + IntegrityChecksGrid pass/warn/fail; иконки/RU-лейблы/логика нетронуты); гард 5 (каталог 6 exact-array, no-palette/no-hex self-tested, валентность + точная карта пинов; HEAD-мутационно проверен ревьюером); targeted 4/22; полный пол **19 463/0/1226** (floor 19 458 → +5 exact); prettier-clean; e2e 11✓; 1×opus APPROVE; cleanup 0/0/0.

## Story

As a seller, I want /orders/integrity (сверка выкупов, чек-грид, статус-карточка) to keep behavior while the surface completes its token migration.

Plan: `.omx/plans/172.16-migrate-order-integrity-analysis.md` (authoritative — branch `cdx/epic-172-story-16-order-integrity`, worktree `/private/tmp/wb-repricer-fe-172-16-order-integrity`).

## Acceptance Criteria

Per plan — все закрыты.

## Tasks / Subtasks

- [x] Task 0: prerequisites (base `688a7ad2`). Процесс-инцидент: первый worktree создан с неверным именем (`-16-integrity` vs план `-16-order-integrity`) — пересоздан по плану (plan authoritative).
- [x] Task 1: baseline **3 файла / 17 тестов / EXIT=0**; комплаенс: MINOR-GAP (2 файла × 3 palette, hex 0, rawbtn 0).
- [x] Task 2 (правки, orchestrator-direct): 6 свапов; тест-репинов не потребовалось (0 цвет-ассертов).
- [x] Task 3: гард 5 тестов.
- [x] Task 4: валидация: targeted 4/22; lint 0/0; tsc 0; max-lines OK; prettier clean; build 0; полный пол **СОЛО 19 463/0/1226** (+5 exact); e2e 11✓ (3 setup + 2 orders + 6 integrity); diff --check чист.
- [x] Task 5: 1×opus ревью — **APPROVE** (все claims воспроизведены; гард проверен HEAD-мутацией — кусается на регресс; 4 LOW канон-наследуемые: ring-offset в регексе, rgb()/oklch, css-модули, визуальная дельта muted-green).

## Dev Notes

- Floor: 19 458 → **19 463 (+5 exact)** = 5 гард-тестов; файлы 1225 → 1226.
- Ревьюер прогнал широкий свип (шире канона) — 0 остатков; токены имеют WCAG compiled-contrast тест в репо.

### References

- [Source: plan `.omx/plans/172.16-migrate-order-integrity-analysis.md`]

## Dev Agent Record

### Agent Model Used

- Implementation: orchestrator-direct (MINOR 6 строк). Review: 1× code-reviewer (opus fresh) — APPROVE.

### Post-1st-pass-review fixes (2026-08-29)

- Кодовых изменений нет: 4 LOW — канон-наследуемые слепые зоны гарда (ring-offset/rgb()/css — для будущего process-story) и визуальная дельта (назначение миграции, контраст-тестировано).

### Debug Log References

- /tmp logs: `172.16-{baseline,fix1,guard,lint,tsc,build,full,e2e,devserver}-log`; дифф `172.16-review-diff.txt`.

### Completion Notes List

- Гард «кусается»: no-palette матчит HEAD-версии обоих компонентов (до свапов) — доказано мутационной проверкой ревьюера.

### Gaps

- Канон-эволюция (наследуемая): ring-offset в LEGACY_PALETTE, rgb()/oklch в HEX, css-модули в энумерации — будущая process-story. Visual light/dark — 174.3.

### File List

PR #323: commit `ca0330cb` = **3 файла** (2 M + 1 A), +84/−6: IntegrityStatusCard.tsx, IntegrityChecksGrid.tsx + гард NEW.

### Change Log

| Date | Change |
|---|---|
| 2026-08-29 | Story planned (MINOR-GAP 6 строк). Plan authoritative. |
| 2026-08-29 | 6 свапов + гард 5; 1×opus APPROVE (мутационная проверка). Status: ready-for-dev → review. |
| 2026-08-29 | Merged: PR #323 (`ca0330cb`, merge `8939aea4`); targeted 4/22, full **19 463/0/1226** (+5 exact), e2e 11✓, cleanup 0/0/0. **Эпик 172: 16/17.** Status: review → done. **Lessons:** (1) Plan-named worktree/branch is authoritative — read the frontmatter BEFORE worktree add; shorthand names cost recreates. (2) Head-mutation testing (guard vs git show HEAD:file) is the cheapest proof a guard bites. (3) Canon-inherited regex blind spots (ring-offset, rgb()) belong to a future process story, not the story at hand. |
