# Story 172.17-FE: Migrate Product Management (финал эпика 172)

Status: done — PR #325 merged (`caee8523`, commit `d88b52ed`); **MINOR-GAP** — 2 файла (1 M + 1 A гард, +66/−2): 2 свапа palette→token (error-ветки → status-error, RU заморожены); гард 4 (dual-root каталог 1+1 exact-array, no-palette/no-hex self-tested, валентность ×2 + RU-пины); targeted 3/12; полный пол **19 467/0/1227** (floor 19 463 → +4 exact); prettier-clean; e2e 7✓; 1×opus APPROVE; cleanup 0/0/0. **ЭПИК 172 ЗАВЕРШЁН: 17/17.**

## Story

As a seller, I want the assortment management page (снятые с продажи + подсказки) to keep behavior while the surface completes its token migration.

Plan: `.omx/plans/172.17-migrate-product-management.md` (authoritative — branch `cdx/epic-172-story-17-products`, worktree `/private/tmp/wb-repricer-fe-172-17-products`).

## Acceptance Criteria

Per plan — все закрыты.

## Tasks / Subtasks

- [x] Task 0: prerequisites (base `45e3da76`).
- [x] Task 1: baseline **2 файла / 8 тестов / EXIT=0**; комплаенс: MINOR-GAP (page.tsx palette=2; BrandSubjectFilter born-clean).
- [x] Task 2 (правки, orchestrator-direct): 2 свапа; тест-репинов не потребовалось.
- [x] Task 3: гард 4 теста (dual-root).
- [x] Task 4: валидация: targeted 3/12; lint 0/0; tsc 0; max-lines OK; prettier clean; build 0; полный пол **СОЛО 19 467/0/1227** (+4 exact); e2e 7✓ (3 setup + 2 orders + 2 assortment); diff --check чист.
- [x] Task 5: 1×opus ревью — **APPROVE** (0 блокирующих; 3 LOW — опциональные hardening-заметки guard-семейства: HEX-lookahead `;`, валентность-счётчик compound-классов, extraction-таргет 180/150).

## Dev Notes

- Floor: 19 463 → **19 467 (+4 exact)** = 4 гард-теста; файлы 1226 → 1227.
- Ревьюер проверил резолв токена (light/dark HSL в globals.css) — «не фантомный класс».

### Epic 172 Retrospective (17/17, финал)

Эпик 172 = полная миграция «операционного пояса» приложения (dashboard → automation → COGS → communications → finances → monitor/monitoring → moysklad → orders-family → products). Сессия закрыла 8 стори хвоста (172.10-172.17) за два дня одним конвейером: floor 19 394 → 19 467 (+73 exact), 9 гардов (~70 тестов), 2 e2e-ремонта stale-спек, 1 mid-flight-коллизия разрешена владельцем, owner-блокер 172.14 снят с 0-import proof. Классы вердиктов: 2 born-clean + 6 MINOR/FULL-MINOR. Повторяющиеся уроки: stale e2e-ассерты (BD-22/query-glob), lib-passthrough residue (один carry-out на lib-wave), HEAD-мутация как дешёвое доказательство гарда.

### References

- [Source: plan `.omx/plans/172.17-migrate-product-management.md`]

## Dev Agent Record

### Agent Model Used

- Implementation: orchestrator-direct (MINOR 2 строки). Review: 1× code-reviewer (opus fresh) — APPROVE.

### Post-1st-pass-review fixes (2026-08-29)

- Кодовых изменений нет: 3 LOW — опциональные guard-family hardening (canon-процесс).

### Debug Log References

- /tmp logs: `172.17-{baseline,fix1,guard,lint,tsc,build,full,e2e,devserver}-log`; дифф `172.17-review-diff.txt`.

### Completion Notes List

- Манифест 1 M + 1 A; BrandSubjectFilter не тронут (born-clean).
- Финальная стори эпика — полный конвейер без сокращений (микро-дифф ≠ микро-процесс).

### Gaps

- Guard-family hardening (HEX-lookahead `;`, compound-класс счётчики) — canon process-story. Visual light/dark — 174.3.

### File List

PR #325: commit `d88b52ed` = **2 файла** (1 M + 1 A), +66/−2: page.tsx + гард NEW.

### Change Log

| Date | Change |
|---|---|
| 2026-08-29 | Story planned (MINOR-GAP 2 строки; финал эпика). Plan authoritative. |
| 2026-08-29 | 2 свапа + гард 4; 1×opus APPROVE. Status: ready-for-dev → review. |
| 2026-08-29 | Merged: PR #325 (`d88b52ed`, merge `caee8523`); targeted 3/12, full **19 467/0/1227** (+4 exact), e2e 7✓, cleanup 0/0/0. **ЭПИК 172: 17/17 — ЗАВЕРШЁН.** Status: review → done. **Lessons:** (1) Epic-finale stories still run the full pipeline — micro-diff is not micro-process. (2) Verify the token actually resolves (globals.css light+dark) before swapping — phantom classes pass lint. (3) Epic-level patterns compound: the same 3 lesson classes recurred across 8 stories — canonize early. |
