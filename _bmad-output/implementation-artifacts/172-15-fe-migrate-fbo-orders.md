# Story 172.15-FE: Migrate FBO Orders

Status: done — PR #321 merged (`81bc35cc`, commit `8af3b18d`); **born-clean** — 6 файлов (5 M + 1 A гард, +184/−6): RTC caption-контракт на обеих таблицах (171.9 канон, RU-каптионы из PageContent), tabular-nums на ячейках дат/денег ×6, +4 поведенческих caption-теста, гард 7 (каталог 7 exact-array, no-palette/no-hex self-tested, caption/tabular/badge/state пины); targeted 6/36; полный пол **19 458/0/1225** (floor 19 447 → +11 exact); prettier-clean (format:check = pre-existing baseline 39, 0 в изменённых); 1×opus APPROVE; e2e-gap честный (плановая спека не существует; born-clean = нулевая behavior-дельта); cleanup 0/0/0.

## Story

As a seller, I want /orders/fbo (заказы и продажи FBO, агрегаты, синк-контролы) to keep behavior while the surface completes its contract set.

Plan: `.omx/plans/172.15-migrate-fbo-orders.md` (authoritative — branch `cdx/epic-172-story-15-orders-fbo`, worktree `/private/tmp/wb-repricer-fe-172-15-orders-fbo`).

## Acceptance Criteria

Per plan — все закрыты (validation-gap клозула плана покрывает отсутствующую e2e-спеку next-best proof).

## Tasks / Subtasks

- [x] Task 0: prerequisites (base `cdc5cfe2`; owner-блокер 172.14 снят).
- [x] Task 1: baseline **5 файлов / 25 тестов / EXIT=0**; комплаенс: **born-clean** (все 12 файлов 0/0/0).
- [x] Task 2 (правки, orchestrator-direct): captionText-пропы ×2 таблицы + page-каптионы; tabular-nums (даты + деньги ×2 в каждой); +4 теста.
- [x] Task 3: гард 7 тестов.
- [x] Task 4: валидация: targeted 6/36; lint 0/0; tsc 0; max-lines OK; build 0; полный пол **СОЛО 19 458/0/1225** (+11 exact); diff --check чист.
- [x] Task 5: 1×opus ревью — **APPROVE** (MEDIUM prettier-регресс пойман — format:check был пропущен из моей батареи; применён же-PR; 2 LOW информационные).

## Dev Notes

- Floor: 19 447 → **19 458 (+11 exact)** = 7 гард + 4 поведенческих; файлы 1224 → 1225.
- format:check — НОВЫЙ ГЕЙТ-УРОК: 3 файла дали prettier-регресс (длинные строки после tabular-добавления); baseline репо = 39 pre-existing warn. Добавлен в чек-лист батареи.
- Процессные микро-инциденты (пойманы прогонами): вставка тестов внутрь чужого it-блока (перенесена); импорт-анкер TableCaption не сматчился по форме блока (добавлен правильным анкером).

### References

- [Source: plan `.omx/plans/172.15-migrate-fbo-orders.md`]
- Caption-канон: DocumentsBody.tsx (172.10) / EvaluationHistoryTable.tsx (171.9).

## Dev Agent Record

### Agent Model Used

- Implementation: orchestrator-direct (born-clean MINOR). Review: 1× code-reviewer (opus fresh) — APPROVE.

### Post-1st-pass-review fixes (2026-08-29)

- **[MEDIUM APPLIED] Prettier**: 3 файла прогнаны --write; format:check вернулся к baseline 39 (0 в моих).
- **[LOW DISPOSITIONED ×2] nmId без tabular** (opaque ID, AP#10 — будущий all-numeric pass); Windows-сепараторы в guard-фильтрах (169.11 канон, darwin/linux only).

### Debug Log References

- /tmp logs: `172.15-{baseline,fix1..4,guard,lint,build,full,final,fmt}-log`; дифф `172.15-review-diff.txt`.

### Completion Notes List

- Ревьюер воспроизвёл ВСЕ численные claims своими прогонами (targeted/full/baseline-арифметика).
- Caption-паттерн байт-консистентен с 171.9/172.10 каноном (greppable across surfaces).

### Gaps

- e2e/orders-fbo.spec.ts не существует — план-таргет; честный gap (создание e2e-пакета = будущий touch, прецедент 172.9 когда стори меняет поведение). Visual light/dark — 174.3.

### File List

PR #321: commit `8af3b18d` = **6 файлов** (5 M + 1 A), +184/−6: гард NEW; M — FboOrdersTable, FboSalesTable, FboOrdersPageContent + тесты FboOrdersTable/FboSalesTable.

### Change Log

| Date | Change |
|---|---|
| 2026-08-29 | Story planned (born-clean; гэпы caption/tabular/гард). Plan authoritative. |
| 2026-08-29 | Caption ×2 + tabular + гард 7 + 4 теста; 1×opus APPROVE (prettier же-PR). Status: ready-for-dev → review. |
| 2026-08-29 | Merged: PR #321 (`8af3b18d`, merge `81bc35cc`); targeted 6/36, full **19 458/0/1225** (+11 exact), cleanup 0/0/0. **Эпик 172: 15/17.** Status: review → done. **Lessons:** (1) format:check belongs in the gate battery — long-line additions regress prettier silently; baseline = 39 pre-existing. (2) Missing plan-targeted e2e spec on a born-clean surface = honest gap, not a blocker (zero behavior delta). (3) Regex-anchored test insertion: verify the anchor sits BETWEEN tests, not mid-test (it-blocks are not safe anchors). |
