# Story 172.3-FE: Migrate the Installed Automation Rules List

Status: done — PR #282 merged (`629b74c1`, commit `8193e3c1`); MINOR-GAP-plus — 6 файлов (3 M прод + гард + e2e fixture + e2e спека, +291/−9); 1×opus APPROVE-WITH-NOTES (0 блокирующих, 2 LOW hardening применены); targeted 5/58; полный пол **19 311/0** (floor 19 304 → 19 311, +7); e2e 10/0 с первого прогона; light/dark/390; cleanup 0/0/0.

## Story

As an operator, I want `/automation/installed-rules` to keep lifecycle-status review and detail navigation while the list surface moves fully onto semantic tokens.

Plan: `.omx/plans/172.3-migrate-the-installed-automation-rules-list.md` (authoritative — branch `cdx/epic-172-story-3-installed-rules`, worktree `/private/tmp/wb-repricer-fe-172-3-installed-rules`).

## Acceptance Criteria

Per plan (canonical AC + execution checklist) — все закрыты.

## Tasks / Subtasks

- [x] Task 0: prerequisites (base `e0629720`); registry carry-in grep «172.3» — обязательных НЕТ (урок 172.1).
- [x] Task 1: behavior lock — targeted baseline **4 файла / 51 тест / EXIT=0** (вкл. editor-тесты 172.4-дерева — не тронуты, остались зелёными).
- [x] Task 2: pre-flight — owned = page.tsx + PageContent (route) + List/Row/PostInstallBanner (widgets); editor/** и [id]/page.tsx — 172.4. Долг: **6 palette-строк** (Row: enabled-Badge `bg-green-100 text-green-800`, safety `text-yellow-600/700`; Banner: `border-green-300 bg-green-50` + `text-green-800/700`), py-6 ×3, e2e-спеки нет, гарда нет. **Инцидент подсчёта**: zsh не word-split'ит `$FILES` → первый rg-скан молча не выполнился (вывел «0») — пересчёт явными путями вскрыл палитру; урок в memory.
- [x] Task 3 (правки, оркестратор): Row/Banner → status-success/warning-идиомы (byte-identical 171.6 прецеденту `STATUS_BADGE_CONFIG.active`, подтверждено ревьюером); py-6 ×3 снят; провенанс ×2.
- [x] Task 4: guard 7 тестов (каталог pinned 2 c RELATIVE-segment эксклюзиями `editor/`+`[id]/` — разделитель-анкерные после ревью; no-palette/no-hex по route+widgets; padding/badge/warning/banner пины; идентичность обоих файлов каталога).
- [x] Task 5: e2e СОЗДАН: fixture (GET /v1/automation/rules populated/empty/error, read-only) + спека 5 тестов (populated+badges+RU-лейблы с 30s cold-compile wait — урок 172.2 применён; restricted-action writeback safety + негативный toHaveCount(0); empty + href-пин gallery-линка; error+retry; highlight border-primary + негативный not-match).
- [x] Task 6: валидация (node 24 PATH) + 1 ревью + PR #282 + cleanup 0/0/0.

## Dev Notes

- Baselines: targeted 4/51 → **5/58**; полный пол **19 311/0** (+7).
- Hex-долга не было; page.tsx и InstalledRulesList.tsx — born-clean (не правлены, покрыты гардом).

### References

- [Source: plan `.omx/plans/172.3-migrate-the-installed-automation-rules-list.md`]
- Эталоны: badge-идиома model-list-helpers.ts:32 (171.6); e2e — 163.3 канон; гард — 171.9 шаблон.

## Dev Agent Record

### Agent Model Used

- Implementation: orchestrator-direct (MINOR). Review: 1× code-reviewer (opus fresh) — APPROVE-WITH-NOTES.

### Post-1st-pass-review fixes (2026-08-27)

- **[LOW×2 APPLIED] Guard-hardening**: (a) prefix-фильтры разделитель-анкерные (`f !== 'editor' && !f.startsWith('editor/')`) — иначе будущий `editorial.tsx` молча выпал бы из каталога; (b) идентичность каталога — добавлен endsWith-пин `installed-rules/page.tsx`. Гард перепрогнан 7/7.
- Наблюдения ревьюера (диспозиция без правки): default-Badge hover `hover:bg-primary/80` на зелёном тинте — pre-existing (не регрессия, вне color-only скоупа); padding-pin не ловит py-8 (ratchet-note); вторичный линк Banner'а выровнялся по цвету с первичным (token-correct).

### Debug Log References

- /tmp logs: `172.3-{baseline,targeted,lint,tsc,build,full,e2e,guards,guards2,fix1,devserver,review-diff}.log`; скриншоты `172.3-visual-{light,dark,390}.png`.

### Completion Notes List

- E2E первый прогон зелёный (10 passed EXIT=0) — 30s cold-compile wait вшит с первого раза (урок 172.2).
- Визуал: live BE, страница рендерится; состояния детерминированно покрыты e2e (mock-режимы) + юнит-тестами.
- Ревьюер независимо: гард 7/7 в свежем контексте; e2e-регекс `/rules(\?.*)?$` доказуемо не матчит install/detail эндпоинты 172.4; href-пин сверен с ROUTES.AUTOMATION.CANNED_RULES (routes.ts:104).

### Gaps

- 200% zoom / reduced-motion прогоны не сняты (трек 174.3, MINOR-пропорциональность).
- Editor-дерево (172.4) не сканировалось намеренно — вне surface.

### File List

PR #282: commit `8193e3c1` = **6 файлов** (3 M + 3 A), +291/−9.

### Change Log

| Date | Change |
|---|---|
| 2026-08-27 | Story planned (MINOR-GAP-plus: 6 palette + py-6 + e2e/гард-гэпы). Plan authoritative. |
| 2026-08-27 | MINOR-цикл: токены + гард(7) + e2e(fixture+spec 5); zsh word-split инцидент пересчёта задокументирован; 1×opus APPROVE-WITH-NOTES (2 LOW applied). Status: ready-for-dev → review. |
| 2026-08-27 | Merged: PR #282 (`8193e3c1`, merge `629b74c1`); targeted 5/58, full **19 311/0**, e2e 10/0 first-run, visual light/dark/390; cleanup 0/0/0. **Эпик 172: 3/17.** Status: review → done. **Lessons:** (1) zsh не word-split'ит $VAR — rg получает один путь и молча молчит: только явные пути в сканах. (2) Гард-эксклюзии — по разделитель-анкерным префиксам ('editor/'), не голому startsWith. (3) Cold-compile wait 30s в первом e2e-тесте — с первого прогона зелёный. |
