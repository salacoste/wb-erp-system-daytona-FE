# Story 173.12-FE: Migrate Supplies List (owner-story)

Status: done — PR #361 merged (`747f8449`, commit `1447c293` post-rebase); **MINOR-GAP на list/shared поверхности** — 6 файлов (5 M + 1 A гард, +199/−56): SupplyStatusBadge 5-статусная карта → семантика (OPEN=information, **CLOSED=WCAG solid-пара** bg-status-warning + text-status-warning-foreground — тинт 4.06:1@12px пойман e2e-axe, bisect-доказан, root-cause = tint-слепота compiled-contrast теста; DELIVERED=success, CANCELLED=error; DELIVERING=**status-pending** фиолетовый канон); SyncStatusIndicator ×2; CreateSupplyModal alert; ~31 тест-репин (вкл. 2 rewrite на className-стратегию — opacity-токены невалидны в CSS-селекторах); гард 6 (dual-root каталог 4+12 exact-array, **18-файловый DETAIL_EXCLUDED = точное транзитивное замыкание [id]-страницы — load-bearing**, regex self-tests обеих полярностей, solid-pair пин); targeted 257/257; полный пол **19 800/0/1252** (clean-base 19 794 → +6 exact); e2e 51/2-axe→**53/0**; 2 ревью-прохода APPROVE-WITH-NOTES; cleanup 0/0/0.

## Story

As a seller, I want the supplies list (статусы поставок, синк-индикатор, создание) to keep behavior while the LIST/shared surface completes its token migration — как owner-prerequisite для 173.13 (detail).

Plan: `.omx/plans/173.12-migrate-supplies-list.md` (authoritative — branch `cdx/epic-173-story-12-supplies`, worktree `/private/tmp/wb-repricer-fe-173-12-supplies`).

## Acceptance Criteria

Per plan — все закрыты; detail-exclusive файлы (18) сознательно НЕ тронуты = 173.13.

## Parallel-lane record

Соседняя команда (Epic-173 lane) работала одновременно: их 173.11 (PR #359 feature + #360 closeout) влита ПОВЕРХ моего base; моё ребейз-поле чисто (docs-only у них, пересечений 0 в обе стороны — проверено ревьюерами по импорт-замыканиям). Мой feature-commit перебазирован на b2136273 (#360) перед PR; их auxiliary lifecycle lane (`docs-story-173-11-final-lifecycle-record`) активна — closeout-гейты моего PR гонялись по живому состоянию.

## Tasks / Subtasks

- [x] Task 0: prerequisites (base `7ee1f51e` → rebase на `b2136273`); carry-in grep — обязательных НЕТ.
- [x] Task 1: baseline **3 файла / 213 тестов** (plan-фильтр); комплаенс: 13 грязных файлов в supplies-семействе → **граница 173.12/173.13 построна по потребителям** (list-page vs [id]-page транзитивно): мои = 3 prod (badge/shared + sync + modal), их = 10 грязных detail.
- [x] Task 2 (правки, orchestrator-direct): 15+2+1 классов + репины.
- [x] Task 3: гард 6 (dual-root, DETAIL_EXCLUDED 18).
- [x] Task 4: валидация: targeted 257; lint 0/0; tsc 0; prettier clean; build ×2 (включая финальное WCAG-состояние); полный пол **СОЛО 19 800/0/1252** (+6 exact, stash-арифметика); e2e: **axe поймал реальную контраст-регрессию** (bisect на чистой базе 31/0 → фейл мой) → solid-pair фикс → 53/0.
- [x] Task 5: ревью ×2 (opus fresh) — оба APPROVE-WITH-NOTES; boundary-audit ревьюера подтвердил DETAIL_EXCLUDED = точное замыкание (18/18, ни больше ни меньше); pass-2 hardening применён (regex positive self-test, solid-bg пин).

## Dev Notes

- Floor: clean-base **19 794** → **19 800 (+6 exact)** = 6 гард-тестов; файлы 1251 → 1252. NB: CLAUDE.md на main отставал (19615) — их lane не апдейтит floor каждой стори; мой closeout ставит живое 19 800.
- **WCAG-находка (главный урок стори)**: `text-status-warning` (≈4.8:1 на белом) — ЕДИНСТВЕННЫЙ из пяти токенов, падающий ниже 4.5:1 на /10-тинте (4.06:1@12px); compiled-contrast тест темы проверяет только solid-пары → tint-композиты — слепая зона, ловятся только e2e-axe. Solid-пара (`bg-X` + `text-X-foreground`) — машина-тестированный канон (globals-compiled-contrast textPairs).
- Селектор-урок: opacity-токены (`bg-status-error/10`) невалидны в `querySelector` — в toContain валидны; 2 теста переписаны на closest('[class]')-стратегию с комментарием.
- Мёртвый legacy-twin `SUPPLY_STATUS_CONFIG` в `src/types/supplies/helpers.ts` (0 прод-потребителей, только 3 теста) — **carry-out → 173.13** (мigrate-or-delete).

### References

- [Source: plan `.omx/plans/173.12-migrate-supplies-list.md`]
- Токен-канон: globals-compiled-contrast.test.ts textPairs; status-pending (hue 277, 172.14).

## Dev Agent Record

### Agent Model Used

- Implementation: orchestrator-direct (MINOR). Review: 2× code-reviewer (opus fresh) — оба APPROVE-WITH-NOTES.

### Post-1st-pass-review fixes (2026-08-30)

- **[LOW APPLIED] Build на финальном дереве** (WCAG-фикс постдатировал первый build) — EXIT=0.
- **[LOW DISPOSITIONED] Guard [id]-filter комментарий** — optional; анкер переформатирован форматтером, комментарий не лёг (declined, belt-and-suspenders и так).
- **[INFO ×3]** — числа тестов (38/63) в артефакт; pre-existing `as` в CreateSupplyModal:139 (вне диффа); rebase (выполнен при коммите).

### Post-2nd-pass-review fixes (2026-08-30)

- **[LOW APPLIED] LEGACY_PALETTE positive self-test** + dedup no-palette блока.
- **[LOW APPLIED] Solid-bg пин** (`'bg-status-warning'` — load-bearing половина WCAG-фикса).
- **[MEDIUM DISPOSITIONED→carry-out]** legacy-twin SUPPLY_STATUS_CONFIG (src/types, вне owned-поверхности, 0 рендеров) → 173.13/debt-registry.

### Debug Log References

- /tmp logs: `173.12-{baseline,fix1,fix2,guard,postrebase*,full,full2,final-full,basefull,build,build2,e2e,e2e2,bisect,badge*,lint}-log`; дифф `173.12-review-diff.txt`.

### Completion Notes List

- Граница owner-стори выстроена ДО правок и защищена гардом; оба ревьюера независимо верифицировали 18-файловое исключение как точное транзитивное замыкание.
- e2e-axe gate отработал как задуман: поймал реальную a11y-регрессию миграции (не flake) — bisect-доказательство.

### Gaps

- Carry-out → 173.13: (1) legacy-twin SUPPLY_STATUS_CONFIG (src/types/supplies/helpers.ts) migrate-or-delete; (2) 18 detail-exclusive файлов мигрируют в своей стори. Программный вопрос: text-on-/10-tint идиома на других поверхностях без axe-спек — латентный контраст-риск (audit-кандидат 174.3).

### File List

PR #361: commit `1447c293` = **6 файлов** (5 M + 1 A), +199/−56: SupplyStatusBadge.tsx, SyncStatusIndicator.tsx, CreateSupplyModal.tsx + тесты SupplyStatusBadge/SuppliesTable + гард NEW.

### Change Log

| Date | Change |
|---|---|
| 2026-08-30 | Story planned (owner; MINOR-GAP 3 файла после boundary-разметки). Plan authoritative. |
| 2026-08-30 | Свапы + WCAG solid-pair пивот (axe-поймано) + гард 6; 2×APPROVE-WITH-NOTES; rebase на #360. Status: ready-for-dev → review. |
| 2026-08-30 | Merged: PR #361 (`1447c293`, merge `747f8449`); targeted 257/257, full **19 800/0/1252** (+6 exact), e2e 53/0 post-fix, cleanup 0/0/0. **Эпик 173: 12/13.** Status: review → done. **Lessons:** (1) text-status-warning on /10 tint = 4.06:1 — the only failing token; solid -foreground pair is the tested fix. (2) compiled-contrast tests check solid pairs only — tint composites are axe-only territory. (3) Opacity tokens break CSS selectors: querySelector('.bg-x/10') throws — use className.toContain. (4) Owner-boundary by transitive consumer-closure BEFORE migrating; guard the exclusion list. |
