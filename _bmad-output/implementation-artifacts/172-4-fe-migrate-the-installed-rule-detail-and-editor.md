# Story 172.4-FE: Migrate the Dynamic Installed-Rule Editor

Status: done — PR #285 merged (`25c8bc19`, commit `3b7202d7`); MINOR-GAP-plus — 5 файлов (2 M прод + гард + e2e-апдейт 163.3 + юнит-близнец, +144/−15); 1×opus APPROVE-WITH-NOTES (0 блокирующих; 2 MEDIUM attestation + 3 LOW — все применены); targeted 4/60; полный пол **19 319/0** (floor 19 311 → 19 319, +8); **163.3-спека впервые live** (editor 8/8; полный wrapper-прогон 13/0/1↓, репорт верифицирован ревьюером); cleanup 0/0/0.

## Story

As an operator, I want `/automation/installed-rules/[id]` to keep load/edit/validate/safe-writeback/unsaved-guard behavior while the editor surface moves fully onto semantic tokens.

Plan: `.omx/plans/172.4-migrate-the-installed-rule-detail-and-editor.md` (authoritative — branch `cdx/epic-172-story-4-installed-rule-detail`, worktree `/private/tmp/wb-repricer-fe-172-4-installed-rule-detail`).

## Acceptance Criteria

Per plan (canonical AC + execution checklist) — все закрыты.

## Tasks / Subtasks

- [x] Task 0: prerequisites (base `e733f485`); carry-in grep «172.4» — обязательных НЕТ.
- [x] Task 1: behavior lock — plan-cmd **1/15** (automation API) + editor-юниты **2/38** EXIT=0.
- [x] Task 2: pre-flight — owned = editor/** (7 прод) + [id]/page.tsx (shell). Долг: **6 palette-строк** (success-Alert green ×1 в InstalledRuleEditor; writeback-safety панель yellow ×5), py-6 ×1, raw back-`<button>`.
- [x] Task 3 (правки): success-Alert → `border-status-success/40 bg-status-success/10 text-status-success` + testid `editor-update-success`; safety-панель → status-warning (панель/иконка/текст/code-чип /20/пассивная нота /80); back → `Button variant="link" size="sm"`; py-6 снят; провенанс ×2.
- [x] Task 4: гард 7 тестов — каталог pinned 8 (7 editor + [id] shell, per-file идентичность + toHaveLength-tripwire), no-palette/no-hex, success/warning пины, **каталог-wide** no-raw-button (ревью-hardening), nested-`__tests__` эксклюзия, padding-пин.
- [x] Task 5: **e2e-веха** — 163.3-спека впервые live: полный wrapper-прогон 13 passed/0 failed/1 annotated skip, editor-спека **8/8 post-change** (репорт верифицирован ревьюером независимо); stale-заголовок «WRITTEN, not run live» заменён фактом прогона; AC5 дополнен потреблением `editor-update-success`.
- [x] Task 6: валидация + 1 ревью + PR #285 + cleanup 0/0/0.

## Dev Notes

- Baselines: plan-cmd 1/15 + editor 2/38 → targeted **4/60**; полный пол **19 319/0** (+7 гард +1 юнит-близнец).
- **Логин-троттл-инцидент**: повторный e2e-прогон (после добавления ассерта в спеку) заблокирован BE-лимитом 5/hr (исчерпан валидационными циклами сессии; обёртка ОТКАЗЫВАЕТ `--no-deps` — «authentication setup is required», память про --no-deps устарела для этой обёртки). Диспозиция: новый ассерт верифицирован **юнит-близнецом** (success-alert тест в editor suite, 46/46); полный live-прогон той же спеки (версия без нового ассерта) зелёный ПОСЛЕ кода-правок; re-run с ассертом — явный validation gap с next-best proof, follow-up по истечении троттл-окна.
- Визуал live-страницы редактора не снят (тот же троттл): покрытие = live e2e 8/8 в реальном браузере + token-семейство status-success/warning валидировано dark-скриншотами 172.2/172.3. Явный gap в артефакте.

### References

- [Source: plan `.omx/plans/172.4-migrate-the-installed-rule-detail-and-editor.md`]
- Эталоны: status-warning-идиома DashboardStatusStrip/model-performance-helpers (подтверждено ревьюером); Button-link back-идиома 172.2 canned-rules page.

## Dev Agent Record

### Agent Model Used

- Implementation: orchestrator-direct (MINOR). Review: 1× code-reviewer (opus fresh) — APPROVE-WITH-NOTES; независимо прогнал editor-сьют 45/45, eslint/tsc/diff-check, декодировал playwright-report (ok:True, 14 total, 13 expected, 0 unexpected, таймстемп ПОСЛЕ правок).

### Post-1st-pass-review fixes (2026-08-27)

- **[MEDIUM×2] Attestation-гигиена**: (a) stale «WRITTEN, not run live» заголовок 163.3-спеки → заменён фактом первого live-прогона; (b) «13 passed» аттестация уточнена: editor-спека 8/8, полный wrapper-прогон 13/0/1↓ (вкл. auth.setup ×3 + orders ×2).
- **[LOW×3 APPLIED]**: (a) `editor-update-success` testid теперь потребляется (e2e AC5-ассерт + юнит-близнец); (b) no-raw-button пин каталог-wide + strict same-tag Button-регекс; (c) эксклюзия nested `__tests__`.
- Диспозиции: Button без type=button — вне формы (как 172.2); текст-idiom text-status-warning на /10-тине — канонный дом-идиом (прецеденты DashboardStatusStrip и др.; ревьюер сверил).

### Debug Log References

- /tmp logs: `172.4-{baseline,baseline-editor,targeted,lint,tsc,build,full,full2,e2e,e2e2,e2e3,fix1,fix2,devserver*,review-diff}.log`.

### Completion Notes List

- E2E обёртка: `npm run test:e2e -- e2e/automation/installed-rule-editor.spec.ts` — live 13/0/1↓ (первый прогон), повторный заблокирован троттлом (см. Dev Notes).
- Ревьюер подтвердил: граница владения 172.3↔172.4 взаимно закодирована в обоих гардах (172.3 исключает editor/, 172.4 пинит его) — нулевое перекрытие.

### Gaps

- E2E re-run с новым AC5-ассертом — троттл-блок (next-best proof: юнит-близнец + первый live-прогон); прогнать при следующем открытом троттл-окне.
- Live-скриншоты редактора light/dark не сняты (троттл); 200% zoom / reduced-motion — трек 174.3.

### File List

PR #285: commit `3b7202d7` = **5 файлов** (4 M + 1 A), +144/−15: InstalledRuleEditor.tsx, WritebackSafetyAcknowledgement.tsx, InstalledRuleEditor.test.tsx, installed-rule-editor.spec.ts (163.3), гард (new).

### Change Log

| Date | Change |
|---|---|
| 2026-08-27 | Story planned (MINOR-GAP-plus: 6 palette + py-6 + raw-button + гард). Plan authoritative. |
| 2026-08-27 | MINOR-цикл: токены + гард(7) + **163.3-спека впервые live 8/8** + юнит-близнец; троттл-инцидент задокументирован; 1×opus APPROVE-WITH-NOTES (5 фиксов применено). Status: ready-for-dev → review. |
| 2026-08-27 | Merged: PR #285 (`3b7202d7`, merge `25c8bc19`); targeted 4/60, full **19 319/0**, build OK; cleanup 0/0/0. **Эпик 172: 4/17 — automation-домен (gallery+list+editor) полностью мигрирован.** Status: review → done. **Lessons:** (1) Stale-заголовок «not run live» в спеке — attestation-долг: обновляй при первом live-прогоне. (2) e2e-обёртка ОТКАЗЫВАЕТ --no-deps — троттл-блок лечится юнит-близнецом + честным gap, не обходом. (3) «N passed» обёртки ≠ N тестов спеки — аттестуй разложение (8+3+2). |
