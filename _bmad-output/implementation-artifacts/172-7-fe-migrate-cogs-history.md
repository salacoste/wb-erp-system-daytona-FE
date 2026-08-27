# Story 172.7-FE: Migrate COGS History

Status: done — PR #293 merged (`da3e9078`, commit `00368153`); **MINOR-GAP born-clean** — 4 файла (2 M прод + тест + гард, +160/−3); 1×opus APPROVE-WITH-NOTES (0 блокирующих; MEDIUM + 2 LOW применены); targeted 4/25; полный пол **19 343/0** (floor 19 334 → 19 343, +9); e2e 11✓ + 2 cold-flake → warm 5/0; cleanup 0/0/0.

## Story

As a seller, I want `/cogs/history?nmId=` to keep versioned COGS history review (dates/cost/source/affected weeks/notes + edit/delete + soft-deleted filter) while the surface completes its token migration.

Plan: `.omx/plans/172.7-migrate-cogs-history.md` (authoritative — branch `cdx/epic-172-story-7-cogs-history`, worktree `/private/tmp/wb-repricer-fe-172-7-cogs-history`).

## Acceptance Criteria

Per plan (canonical AC + execution checklist) — все закрыты.

## Tasks / Subtasks

- [x] Task 0: prerequisites (base `1821304a`); carry-in grep «172.7» — обязательных НЕТ.
- [x] Task 1: behavior lock — targeted baseline **3 файла / 18 тестов / EXIT=0**; closure-предскан: замыкание = собственные виджеты (CogsHistoryMeta/Pagination/Table + AffectedWeeksCell + CogsHistoryTableCells), всё чисто.
- [x] Task 2: pre-flight — **born-clean**: palette 0 / hex 0 / route-padding 0 по всей поверхности (вкл. cell-компоненты); тест-пинов 0. Гэпы: caption (RTC-контракт), tabular-nums, гард, провенанс.
- [x] Task 3 (правки): `captionText`-проп (optional, без дефолта) → условный `TableCaption` перед `TableHeader` (171.9 EvaluationHistoryTable канон; визуально снизу по mt-4 примитива); page передаёт «История себестоимости — {product_name||товар}»; tabular-nums ×3 (даты + себестоимость; cn()-merge line-through сохранён); провенанс ×2.
- [x] Task 4: гард 7 тестов — каталог pinned **5 route + 5 widget** (per-file identity; depth-4 резолв); born-clean no-palette/no-hex; caption-пин (render-shape регекс + page-шаблон); tabular/deleted-row (bg-muted/50 opacity-60); padding-пин **скоупед на route-контейнер** с документированной intra-card pt-6 экземпляцией (ui CardContent `p-6 pt-0` + Card без header = легитимный no-header-паттерн; ревьюер сверил построчно).
- [x] Task 5: **поведенческие caption-тесты ×2** (getByRole('caption') позитив + негатив без пропа — по MEDIUM-находке ревью; идиома файла createWrapper/React.createElement). Валидация + 1 ревью + PR #293 + cleanup 0/0/0.

## Dev Notes

- Baselines: targeted 3/18 → **4/25**; полный пол **19 343/0** (+7 гард +2 caption-теста).
- E2E: cogs-pages 11✓ + **2 cold-compile флейка** (30s 'COGS'-линк таймауты; класс 172.5/172.6; прогрев-кури 307 не компилируют страницу — auth-редирект) → тёплый ретрай обоих **5/0**.
- Процессные микро-инциденты (все пойманы до ревью): `*/`-ловушка в док-комментарии гарда (`CogsHistory*/Affected…` — рекуррент 172.5); ghost-переменная `productName` (не существует — Бreadcrumbs берёт `data?.meta?.product_name` inline) поймана tsc-хуком; гард-хелпер — идиома файла (`createWrapper`), не `renderWithProviders`.

### References

- [Source: plan `.omx/plans/172.7-migrate-cogs-history.md`]
- Caption-канон: EvaluationHistoryTable.tsx (171.9); padding-экземпляция: ui/card.tsx CardContent.

## Dev Agent Record

### Agent Model Used

- Implementation: orchestrator-direct (MINOR born-clean). Review: 1× code-reviewer (opus fresh) — APPROVE-WITH-NOTES; независимо: sweep 10 файлов = 0 палитры, owned-сьют 46/46, ui/card+table сверены, finance-history (analytics-домен) корректно исключён из каталога.

### Post-1st-pass-review fixes (2026-08-27)

- **[MEDIUM APPLIED] Поведенческий caption-тест** (171.9-прецедент): +2 теста в CogsHistoryTable.test.tsx (позитив getByRole('caption') + негатив queryByRole null) — контракт теперь покрыт поведением, не только source-регексом.
- **[LOW APPLIED] Caption-пин гарда усилен**: `/TableCaption/` → `/captionText \? <TableCaption>/` (render-shape, не голый импорт).
- **[LOW APPLIED] existsSync** вместо no-throw readFileSync для каталог-проверки виджетов.
- Диспозиция: padding-пин остаётся скоупед на page.tsx (state-views чисты; intra-card pt-6 задокументирован в NOTE).

### Debug Log References

- /tmp logs: `172.7-{baseline,guard,guard2,guard3,lint,tsc,build,full,full2,e2e,e2e2,fix1,fix2,devserver*}.log`; дифф `172.7-review-diff.txt`.

### Completion Notes List

- Born-clean подтверждён дважды (pre-flight + независимый sweep ревьюера по всем 10 файлам).
- Dialog'и CogsEdit/CogsDelete (172.5-семья) вне каталога — и чисты (проверено ревьюером).

### Gaps

- Live-скриншоты (троттл-гэп как 172.4-172.6); 200% zoom / reduced-motion — трек 174.3.

### File List

PR #293: commit `00368153` = **4 файла** (3 M + 1 A гард), +160/−3.

### Change Log

| Date | Change |
|---|---|
| 2026-08-27 | Story planned (born-clean; гэпы = caption/tabular/гард/провенанс). Plan authoritative. |
| 2026-08-27 | MINOR-цикл: caption-контракт + tabular + гард(7) + 2 поведенческих теста; 1×opus APPROVE-WITH-NOTES (MEDIUM+2 LOW применены). Status: ready-for-dev → review. |
| 2026-08-27 | Merged: PR #293 (`00368153`, merge `da3e9078`); targeted 4/25, full **19 343/0**, e2e 11+2 cold-flake→warm 5/0, cleanup 0/0/0. **Эпик 172: 7/17 — COGS-домен (single+bulk+history) полностью мигрирован.** Status: review → done. **Lessons:** (1) Born-clean поверхность всё равно несёт контракты (caption/tabular) — pre-flight считает не только палитру. (2) Прогрев dev кури 307-редиректами НЕ компилирует страницу — грейAuthenticated-URL'ом или мирись с cold-flake. (3) Гард-пины скоупь на реальный контейнер: intra-card pt-6 — легитимный паттерн, не §9.9. |
