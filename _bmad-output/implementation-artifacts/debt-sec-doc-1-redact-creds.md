# Debt SEC-DOC-1 — S-2 (§8-P0, security-lane): изъятие plaintext-литералов тестового пароля из tracked docs/artifacts

**Status**: review — 2026-09-02; doc-only механика: 1 запланированный ревью-проход (code-reviewer/opus, APPROVE-WITH-FINDINGS, 5 findings, все закрыты волной-2) + независимая финальная верификация оркестратора; PR: TBD (впишет оркестратор)
**Item**: S-2 (SEC-DOC-1) — debt-канон: [`docs/HANDOFF-2026-08-29-EPIC-173-174-FULL-MIGRATION-AND-DEBT.md`](../../docs/HANDOFF-2026-08-29-EPIC-173-174-FULL-MIGRATION-AND-DEBT.md) §11.9:646 (security-lane, §8-P0) · **PR**: TBD · **Base**: main `f53b493d` · **Branch**: `debt/sec-doc-1-redact-creds` · **Worktree**: `/private/tmp/sec-doc-1-redact-creds` · **Date**: 2026-09-02

> **Маски литералов.** Секретные строки в этом артефакте НЕ печатаются: «stale-литерал» — устаревший пароль (в живом `.env.e2e` = 0 хитов), «live-литерал» — действующий пароль (подтверждён живым `.env.e2e`). Каноническое значение — только untracked `.env.e2e`; в tracked-файлах — плейсхолдер `<E2E_TEST_PASSWORD>`.

## 1. Долг и DoD

**Долг** (канон §11.9 handoff 2026-08-29:646). Plaintext-литерал локального тестового пароля (`E2E_TEST_PASSWORD`) лежал в tracked docs/artifacts.

**DoD (fix-канон §11.9).**

1. security-lane изымает каждое tracked-вхождение каждого литерала секрета.
2. Non-echoing `git ls-files`-скан = 0 вхождений.
3. Ротация и git-history — отдельно owner; автономный history-rewrite запрещён.

**Выполнение DoD.** Изъяты ОБА литерала (stale + live). Финальная независимая верификация оркестратора: `git grep` по каждому литералу = exit 1 (0 вхождений). Ротация live-литерала — owner decision-запрос D-1 (§4); до решения статус item'а: **redacted**.

**Ключевое открытие item'а.** Первоначальный скан-каталог (30 файлов / 42 вхождения) покрывал ТОЛЬКО stale-литерал (в живом `.env.e2e` = 0 хитов). Adversarial ревью-проход нашёл ВТОРОЙ, ДЕЙСТВУЮЩИЙ литерал (live, подтверждён живым `.env.e2e`) — 8 файлов / 13 вхождений, включая действующий процесс-канон V10 и 3 свежих handoff. Оба изъяты.

## 2. Method (конвейер)

Оркестратор: волны — субагентам (executor/sonnet); сканы секрета, валидация и git — у оркестратора. Ревью — code-reviewer/opus, свежий контекст, вход — дифф-файл; ЕДИНСТВЕННЫЙ запланированный проход (doc-only механика), вторая независимая верификация — orchestrator-скан. Все сканы секрета non-echoing: файлы + счётчики, без содержимого строк — секрет не перепечатывается в логи и артефакты.

## 3. Tasks

1. [x] Pre-flight — канон §11.9 прочитан; non-echoing скан: FE stale = 30 файлов / 42; email-вариант = 104 файла → НЕ-секрет (вне скоупа); BE-репо = 135 stale (read-only, owner-отчёт).
2. [x] Волна 1 (executor/sonnet) — 30 файлов: stale-литерал → плейсхолдер; итог: скан stale = 0, docs exit 0, lessons 0, privacy 3 pre-existing / 0 новых.
3. [x] Ревью-проход 1 (code-reviewer/opus) — APPROVE-WITH-FINDINGS, 5 findings (F-1 HIGH: live-литерал остался).
4. [x] Подтверждение F-1 оркестратором — живой прогон: `.env.e2e` содержит live-литерал (1 хит), stale = 0.
5. [x] Волна 2 (executor/sonnet) — W1 live 13/13 → плейсхолдер; W2 кавычки в bash-примере; W3 CLAUDE.md-пример; W4a/W4b disclosure.
6. [x] Финальная верификация (оркестратор) — оба литерала `git grep` = exit 1; 35 M / 0 новых; `git diff --check` = 0.
7. [x] Owner decision-запрос создан (`docs/security/SEC-DOC-1-rotation-owner-decision-2026-09-02.md`).

## 4. Dev Agent Record

### Implementation

1. **Pre-flight.** Канон §11.9 прочитан. Non-echoing скан (файлы + счётчики, без содержимого строк): FE stale-литерал = **30 файлов / 42 вхождения**; email-вариант (`test@test.com`) = **104 файла** → диспозиция НЕ-секрет (seeded test user identity), вне скоупа, задокументировано (§ Dispositions); BE-репо = **135 stale** (read-only, owner-отчёт).
2. **Волна 1 (executor/sonnet) — 30 файлов.** stale-литерал → `<E2E_TEST_PASSWORD>` (env-плейсхолдер; каноническое значение = untracked `.env.e2e`). Спец-блок CLAUDE.md «Test Credentials» → env-ссылка. Исторические артефакты — замена ТОЛЬКО литерала (APPEND-ONLY нарратив сохранён). `test-api/*.http` — плейсхолдер в `@password`. Итог волны: скан stale = 0; docs-citations exit 0 (baseline 95); lessons 0; privacy 3 pre-existing / 0 новых.
3. **Ревью-проход 1** — см. § Review: 5 findings, в т.ч. F-1 HIGH (второй, live-литерал).
4. **Подтверждение F-1 (оркестратор, живой прогон).** `.env.e2e` содержит live-литерал (1 хит); stale-литерал = 0 хитов.
5. **Волна 2 (executor/sonnet):**
   - W1 — live-литерал 13/13 вхождений → плейсхолдер (8 файлов; V9 содержал оба литерала и уже был в change-set);
   - W2 — закавычен плейсхолдер в env-префиксе bash-примера (`docs/request-backend/133-DASHBOARD-VALIDATION-REPORT.md:116`);
   - W3 — CLAUDE.md-пример → пустое значение + комментарий «never commit (SEC-DOC-1)»;
   - W4a — disclosure-строка APPEND-ONLY в Change Log артефакта 171-6;
   - W4b — блокquote-примечание в HANDOFF-epic-171 §3.3 (`docs/HANDOFF-2026-08-26-epic-171-models-tree-and-full-debt-registry.md`).
6. **Финальная верификация (оркестратор, независимо).** `git grep` по stale-литералу = exit 1; по live-литералу = exit 1 (0 вхождений каждый). 35 файлов M / 0 новых. `git diff --check` = 0.

### Validation

Финальные гейты — 2026-09-02.

| Gate | Результат |
|---|---|
| `git grep` stale-литерал | exit 1 (0 вхождений) |
| `git grep` live-литерал | exit 1 (0 вхождений) |
| check:docs (docs-95) | exit 0; baseline 95 не сдвинут |
| check:lessons-length | 0 violations |
| Vitest полный | 19415 passed / 0 failed — прогон на состоянии волны 1; волна 2 трогала только `.md`, `src/` неизменен → результат валиден |
| `next build --webpack` | 0 (тот же принцип: `src/` не менялся после прогона) |
| check:privacy | ровно 3 pre-existing / 0 новых; 2 error-строки `unsupported file type .http` — инструментальная слепая зона сканера, НЕ утечка (owner-запрос D-4) |
| prettier (CLAUDE.md) | fail pre-existing на main (format-39 P3-долг), не внесён этим диффом; исторические artifacts не форматируются по конвенции |
| `git diff --check` | 0 |
| Объём диффа | 35 M / 0 новых на момент финальной верификации; +2 M / +2 NEW closeout тем же PR (§5) |

### Review

**Проход 1 (code-reviewer/opus, свежий контекст, вход — дифф-файл) — ЕДИНСТВЕННЫЙ запланированный** (doc-only механика; вторая независимая верификация = orchestrator-скан). Вердикт: **APPROVE-WITH-FINDINGS, 5 findings**:

- **F-1 (HIGH)** — live-литерал остался: 8 файлов / 13 строк (скан-слепота по одному литералу; включая строки, которые дифф трогал);
- **F-2 (MEDIUM)** — сломанный bash-пример: незакавыченный плейсхолдер в env-префиксе (`docs/request-backend/133-DASHBOARD-VALIDATION-REPORT.md:114`);
- **F-3 (MEDIUM)** — present-tense утверждения в действующих доках стали ложными (решение: APPEND-ONLY disclosure-строки);
- **F-4 (LOW)** — тавтология `E2E_TEST_PASSWORD=<E2E_TEST_PASSWORD>` в CLAUDE.md-примере;
- **F-5 (LOW)** — BE-зеркало `frontend/` содержит оба литерала до mirror-синка (owner-отчёт, D-2).

**Clean zones ревью:** покрытие волны 1 — 30/30; base64 / url-encoded / разбиения литерала = 0; другие секреты в тронутых файлах = 0; JSON/YAML/http-структуры целы.

### Post-1st-pass-review fixes (2026-09-02)

**Подтверждение F-1 оркестратором** (живой прогон): `.env.e2e` содержит live-литерал (1 хит), stale = 0 — F-1 подтверждён.

**Фикс-волна 2 (executor/sonnet):** W1 — live-литерал 13/13 → плейсхолдер (8 файлов; V9 с обоими литералами уже был в change-set); W2 — закавычен плейсхолдер (`docs/request-backend/133-DASHBOARD-VALIDATION-REPORT.md:116`); W3 — CLAUDE.md-пример → пустое значение + «never commit (SEC-DOC-1)»; W4a — APPEND-ONLY disclosure-строка в Change Log 171-6; W4b — блокquote-примечание в HANDOFF-epic-171 §3.3. Все 5 findings закрыты.

### Owner decision-запрос

NEW `docs/security/SEC-DOC-1-rotation-owner-decision-2026-09-02.md` (создан оркестратором):

| # | Решение | Рекомендация |
|---|---|---|
| D-1 | Ротация live-литерала | ротировать |
| D-2 | BE-cleanup: 135 stale в BE-репо + зеркало `frontend/` | owner |
| D-3 | git-history | не трогать |
| D-4 | `.http`-поддержка privacy-сканера | owner |

До решения D-1 статус item'а: **redacted**; ротация — owner-lane (no autonomous history rewrite).

### Dispositions

- **Email `test@test.com`** (104 файла) — НЕ секрет: seeded test user identity; вне скоупа, задокументировано здесь и в owner-запросе.
- **BE-репо** (135 stale) и **BE-зеркало `frontend/`** — read-only для FE security-lane; owner-отчёт (D-2, F-5).
- **git-history** — не тронут; history-rewrite только по owner-решению (D-3).
- **CLAUDE.md prettier-fail** — pre-existing на main (format-39 P3-долг); исторические artifacts не форматируются по конвенции.
- **Vitest/build на состоянии волны 1** — валидны: волна 2 doc-only, `src/` неизменен.

## 5. File List

Итог (живой счёт worktree, 2026-09-02): **39 файлов = 37 M + 2 NEW** (35 redaction-M + 2 closeout-M тем же PR + 2 NEW).

### Redaction-scope — 35 modified

- `CLAUDE.md` — 1 (спец-блок «Test Credentials» → env-ссылка)
- `docs/**` — 29: handoffs (4), orchestrator-prompts V9+V10 (2), archive (5), request-backend (11, вкл. 133), stories (3), ux (1), qa (1), pages (1), epics (1)
- `test-api/*.http` — 2 (`check-available-weeks.http`, `diagnose-empty-data.http`; плейсхолдер в `@password`)
- `thoughts/**` — 1 (`2026-01-17_21-08-18_project-context-handoff.md`)
- `_bmad-output/implementation-artifacts/` — 2 (`171-6-fe-migrate-model-registry-and-training-entry.md`, `171-7-fe-migrate-model-evaluations-list.md`)

### NEW (2)

- `docs/security/SEC-DOC-1-rotation-owner-decision-2026-09-02.md` — owner decision-запрос (D-1..D-4)
- `_bmad-output/implementation-artifacts/debt-sec-doc-1-redact-creds.md` — этот артефакт (gitignored, `git add -f`)

### Closeout — тем же PR (2 modified; redaction-правок в диффах нет — счётчик плейсхолдера = 0)

- `docs/HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md` — §4 SEC-DOC-1, §5 п.4, §8 S-2
- `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md` — строка 250: SEC-DOC-1 update

## 6. Change Log

| Date | Scope | Status | Lessons |
|---|---|---|---|
| 2026-09-02 | Implemented S-2 (SEC-DOC-1): изъяты оба парольных литерала (35 файлов, скан=0), owner-запрос на ротацию создан | review | **Lessons:** (1) Скан по одному литералу слеп ко второму: перед redaction-волной составить каталог ВСЕХ форм секрета, не одного токена. (2) Живость креда проверять по .env-источнику, не по документации: доки называли live оба литерала, .env.e2e — только один. (3) Замена ломает shell-примеры: незакавыченный плейсхолдер меняет bash-токенизацию — ревью нужно даже для doc-only волн. |
