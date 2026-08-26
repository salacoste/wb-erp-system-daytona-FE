# Story 172.2-FE: Migrate the Canned Automation Rules Gallery

Status: done — PR #280 merged (`d35f1e09`, commit `f79795c7`); MINOR-GAP (born-clean) — 5 файлов (2 M прод + гард + e2e fixture + e2e спека, +437/−7); 1×opus review (REQUEST CHANGES → все фиксы → e2e re-run green); targeted 2/14; полный пол **19 297 → 19 304** (+7 гардов); e2e 11/0; light+dark+390 visual; cleanup 0/0/0.

## Story

As an operator, I want `/automation/canned-rules` to keep discovery, status, warning and installation-entry behavior complete and accessible while the surface moves fully onto merged primitives and semantic tokens.

Plan: `.omx/plans/172.2-migrate-the-canned-automation-rules-gallery.md` (authoritative — branch `cdx/epic-172-story-2-canned-rules`, worktree `/private/tmp/wb-repricer-fe-172-2-canned-rules`).

## Acceptance Criteria

Per plan (canonical AC + execution checklist). Все закрыты; прецедент-структура 171.x.

## Tasks / Subtasks

- [x] Task 0: prerequisites (Epic 166-FE `ab12ffe9`, Story 167.1 `a8dfe353` reachable; base `b7f8af33`); registry carry-in grep по «172.2» — обязательных carry-in НЕТ (урок 172.1 применён).
- [x] Task 1: behavior lock — targeted baseline **1 файл / 7 тестов / EXIT=0** (`CannedRulesGallery.test.tsx`).
- [x] Task 2: pre-flight source-trace — owned surface = `page.tsx` + `CannedRulesGallery.tsx`: **palette 0 / hex 0** (born-clean; Gallery уже на Card/Button/Badge/Dialog/Input/Label + `text-muted-foreground`). Гэпы найдены: `container py-6` ×3 (§9.9 double-padding поверх `layout.tsx:118 p-4 lg:p-6`), raw `<button>` retry (bypass примитива), НЕТ e2e-спеки (план: создать, где нет), НЕТ гарда, НЕТ провенанса.
- [x] Task 3 (правки, оркестратор — MINOR ≤10 файлов):
  1. `page.tsx`: `py-6` удалён из 3 state-обёрток; retry → `<Button variant="link" size="sm" className="mt-4 px-0" data-testid="canned-rules-retry">`; провенанс-комментарий.
  2. `CannedRulesGallery.tsx`: провенанс-комментарий ONLY (код born-clean).
- [x] Task 4: guard `canned-rules-presentation-source-contracts.test.ts` — 7 тестов: каталог pinned 1 (route prod), no-palette/no-hex (169.11 contextual + extended hues/shadows) по page+gallery, primitive pin (Button import + бан raw `<button`), padding pin (p-6/py-6/p-4), badge pin (destructive + текст), Dialog-a11y pin (Title/Description/htmlFor). Anchor-safe relative-first (171.8).
- [x] Task 5: e2e СОЗДАН (план-мандат): fixture `story-172-2-canned-rules.ts` (163.3-канон: exact-API-path маршруты, GET gallery/empty/error, POST install 200(→201)/409/500, route-side delay как network-симуляция, `setInstallStatus` для mid-test флипа) + спека 6 тестов по канонической матрице: AC1 загрузка/группировка/summary (30s cold-compile wait), AC2 price arm-writeback бейдж, AC3 empty, AC4 error+retry Button, AC5/6 pending→success + wire-контракт (key в пути, пустой body), AC7 409→rename→200 детерминированный терминал (banner + body name + диалог закрыт).
- [x] Task 6: валидация + 1 ревью + PR #280 + cleanup 0/0/0.

## Dev Notes

- Baselines: targeted 1/7 → **2/14** (+7 гардов); полный пол **19 304/0** (floor 19 297 → 19 304).
- **Node-инцидент (P12-класс, новый)**: системный node обновился до **v26.7.0** mid-session (brew) → `next build --webpack` падает `TypeError: WasmHash._updateWithBuffer` (null length). Все гейты перепрогнаны на пиннованных **v24.18.0** (`/opt/homebrew/opt/node@24/bin`) — build/targeted/lint/tsc/max-lines/full/e2e. Фикс-паттерн: `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"` перед npm-командами.

### References

- [Source: plan `.omx/plans/172.2-migrate-the-canned-automation-rules-gallery.md`]
- Эталоны: e2e — `story-163-3-installed-rule-editor.ts` (route-controller канон); гард — 171.9 шаблон.

## Dev Agent Record

### Agent Model Used

- Implementation: orchestrator-direct (MINOR). Review: 1× code-reviewer (opus fresh) — REQUEST CHANGES (1 HIGH + 1 MEDIUM + 3 LOW).

### Post-1st-pass-review fixes (2026-08-27)

- **[HIGH FIXED] AC7 reopen-race**: fixture с фиксированным 409 → второй POST тоже 409 → диалог детерминированно ПЕРЕОТКРЫВАЕТСЯ (пиннированное поведение, unit-тест 125); финальный `toBeHidden` проходил только в узком тайминговом окне. Фикс: `setInstallStatus(200)` перед retry → детерминированный терминал (диалог закрыт + post-install banner + body.name). E2E re-run: 11 passed EXIT=0.
- **[MEDIUM FIXED] pending-окно**: route-delay 400→900мс.
- **[LOW FIXED] 201-vs-200**: install-успех фулфилится как контрактный **201 Created**.
- Диспозиции без правки: Button без `type="button"` (не в форме, поведение неизменно); `size="sm"` text-xs вместо text-sm (косметика в рамках миграционного фрейминга).

### Debug Log References

- /tmp logs: `172.2-{baseline,targeted,targeted24,lint,tsc,build,build2,full24,e2e,e2e2,e2e3,devserver*,review-diff}.log`; скриншоты `172.2-visual-{light,dark,390}.png`.

### Completion Notes List

- E2E на ветке через npm-обёртку (node 24): первый прогон 10✓/1skip/**1 FAIL** (AC1: 10s waitForResponse < холодная компиляция dev-маршрута 11.6s) → AC1 wait 30s → re-run **11 passed / EXIT=0** ×2 (второй — после ревью-фиксов).
- Визуал (live BE, реальная галерея): light — 4 категории, карточки, price destructive-бейдж читаем; dark — theme-aware, инверсий нет; 390px — grid-cols-1 стекинг; a11y — h1 «Шаблоны автоматизации» + h2 категорий + доступные «Установить».
- Ошибочное состояние BE (queue down) на e2e/визуал не влияло (спека полностью на route-mocks; визуал — реальный GET отдал галерею).

### Gaps

- 200% zoom / reduced-motion ручные прогоны не сняты (трек 174.3; unit+e2e+light/dark/390 покрывают дельту MINOR-пропорционально).
- System node остаётся v26.7.0 — окружение хрупкое до brew pin; записано в §Dev Notes (паттерн PATH-префикса).

### File List

PR #280: commit `f79795c7` = **5 файлов** (2 M + 3 A), +437/−7: `page.tsx`, `CannedRulesGallery.tsx`, гард-тест, e2e fixture, e2e spec.

### Change Log

| Date | Change |
|---|---|
| 2026-08-27 | Story planned (pre-flight: born-clean; гэпы = паддинг/raw-button/e2e/гард/провенанс). Plan authoritative. |
| 2026-08-27 | MINOR-цикл: правки + гард(7) + e2e(fixture+spec 6); node-инцидент v26→перепрогон на пинн 24; 1×opus REQUEST CHANGES (HIGH AC7 race) → фиксы → e2e 11/0. Status: ready-for-dev → review. |
| 2026-08-27 | Merged: PR #280 (`f79795c7`, merge `d35f1e09`); targeted 2/14, full **19 304/0** (floor 19 297), build OK (node 24), e2e 11/0, visual light/dark/390; cleanup 0/0/0. **Эпик 172: 2/17.** Status: review → done. **Lessons:** (1) Фиксированный статус в e2e-фикстуре делает терминал недетерминированным — статус должен быть переключаем. (2) Системный node может смениться mid-session — пиннь через PATH-префикс до каждой npm-команды. (3) Первый e2e-тест платит холодную компиляцию dev-маршрута — его waitForResponse-таймаут должен быть 30s. |
