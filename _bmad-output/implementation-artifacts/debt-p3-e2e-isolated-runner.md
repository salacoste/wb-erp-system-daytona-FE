# debt-p3-e2e-isolated-runner — harness restart-per-run (обобщение канона 174.3)

| Поле | Значение |
|---|---|
| **Status** | review (5 ревью-проходов, 2×REJECT→fixed, финал APPROVE+CONVERGED; flip → done пост-merge) |
| **PR** | pending (номер вторым коммитом после `gh pr create`) |
| **Head-SHA** | `01e114bb` (ветка `debt/e2e-isolated-runner`, база `dff15987` = post-#430 main) |
| **Класс** | behavior (новая тест-инфраструктура); tests-first; live-verified |
| **Источник** | FINAL-94-94 §176; реестр §11.9(5); V19-handoff §3.0 №2; V20 §4 п.2 |
| **Дата** | 2026-09-10 |

## Tasks

- [x] Pre-flight 0.3a: Story-105.2 — обобщение ОТСУТСТВУЕТ (recon: «канон 174.3» = операционный протокол в доках, НЕ код; 174.3-скрипты = evidence-харнессы)
- [x] Pre-flight 0.3b: манифест 174.3 пиннит только `e2e/*.spec.ts` (grep package.json/scripts = 0) → реген НЕ требуется
- [x] Pre-flight 0.3c: e2e-видимость — item САМ является e2e-инфраструктурой → живые proof-runs обязательны (выполнены ×3 полных + 2 fail-closed abort'а)
- [x] Pre-flight 0.3d: дизайн-решения по существующему канону (не owner-класс): PM2-автоматизация с гарантированным restore; 1 логин/прогон (setup-проект неизбежен, --no-deps запрещён); фиксированный 3100-свап
- [x] Recon explore(sonnet): карта харнесса (handshake-гард кодом в e2e-preflight, 3100-пин, wrapper=probe-only), анатомия 174.3, опции A/B/C (A = аддитивный скрипт) — лог `/tmp/debt-e2e-isolated-recon.log`
- [x] Волна executor(opus) tests-first: RED (module missing) → GREEN (21 тест) → коммит `7d03e15a`
- [x] Live-цикл: proof-run #1 поймал argv-дефект (fail-closed, 0 side-effects) → фикс `9ae026e3`; #2 поймал классификатор-дефект (fail-closed) → фикс `ba9a6602`; #3 PASSED полный цикл → vitest-exclude фикс `d4aec887` (соло поймало, batch нет) → prettier `bbfe5b43`
- [x] Ревью-проходы 1-5 (opus, свежие контексты, дифф-файлы `/tmp/e2e-isolated-review-diff-{1..5}.txt`): pass-1 REJECT → фикс `1d4c5c04`; pass-2 APPROVE → фикс `87230afa`; pass-3 APPROVE → фикс `130e3d97`; pass-4 REJECT (1 CRITICAL, эмпирически воспроизведён) → фикс `01e114bb`; pass-5 **APPROVE, CONVERGED (3 находки ≤5)**
- [x] Финальный live confirmation-run #5 на сошедшемся коде: PASSED (см. Dev Agent Record)
- [x] Closeout: реестр §22 APPEND + этот артефакт

## Dev Agent Record

### Имплементация

`scripts/run-e2e-isolated.mjs` (CLI-оркестратор) + `scripts/lib/e2e-isolated-plan.mjs` (чистая логика) +
node:test-сьют + package.json `test:e2e:isolated` + vitest.config.ts exclude. Flow: fail-closed пре-флайт
(порт-классификация `lsof -ti tcp:3100 -sTCP:LISTEN` с process-tree-матчингом по ps pid-таблице; lsof
spawn-фейл/неизвестный exit = loud abort; exit 1 = free) → detached-HEAD tmp-worktree (symlink node_modules,
`cp -p`+`chmod 600` env-копии, dirty-tree warning) → PM2 stop (только pm2-owned) → свой dev через DEV_COMMAND
(npx + error-handler) с readiness-поллом и interrupt-поддержкой → КОМПОЗИЦИЯ защищённого `test:e2e:full`
(handshake/3100-пины байт-нетронуты) → гарантированный teardown (kill группы → pm2 restart ТОЛЬКО при swapped →
тройная restore-аттестация: HTTP 200 /login + pm2 jlist online + порт re-classified pm2-owned → worktree remove
с rmSync-fallback и prune-после-fallback) с per-step try/catch в summary.teardownErrors. Сигналы: отложены до
границ фаз, проглочены во время teardown, unregister после drain-aware summary. Гварды не тронуты (проверено
ревью-проходами `git diff --name-only`).

### Живые доказательства (3 полных прогона + 2 fail-closed abort'а)

| Прогон | Результат |
|---|---|
| #1 | fail-closed abort: argv-семантика (npm съедает `--`) — 0 side-effects |
| #2 | fail-closed abort: порт-классификатор «foreign» на легитимном PM2 (сокет держит потомок) — 0 side-effects |
| #3 | **PASSED** первый полный цикл (pre-hardening): 4 passed/1 skipped, restoreVerified/worktreeRemoved true |
| #5 (final, на сошедшемся коде) | **PASSED, exit 0**: `{"exitCode":0,"durationMs":26046,"phases":{"provisionMs":1164,"swapMs":10650,"runMs":9389,"pm2RestartMs":269},"restoreVerified":true,"portFreed":true,"swapped":true,"worktreeKept":false,"worktreeRemoved":true,"teardownErrors":[],"interrupted":null}`; PM2 восстановлен (свежий pid, :3100→200); worktree удалён; артефакты чисты; privacy 0 |

### Ревью-проходы (все — code-reviewer opus, свежие вызовы)

- **Pass-1: REJECT** (1 blocking HIGH: spawn-error мог убить процесс мимо finally → PM2 остался бы остановлен).
  Фикс: npx-spawn + error-handler; фолды M2/M3/M5/M7/L8/L10 + 4 новых теста.
- **Pass-2: APPROVE** (5 MEDIUM should-fix; адверсариальная верификация всех pass-1 фиксов HELD).
  Фикс: пин-сиды до всех команд, hermetic-тесты, Ctrl+C в readiness, green-path integration, 46 тестов.
- **Pass-3: APPROVE** (3 MEDIUM + 7 LOW + 5 INFO; Trigger-2/3 эскалация).
  Фикс: drain-aware summary, teardown-signal guard, dirty-warning, lsof -sTCP:LISTEN, prune-after-fallback,
  chmod 600 env, npx-сим, keep-worktree тест, interrupted-поле; 50 тестов.
- **Pass-4: REJECT — 1 CRITICAL, эмпирически воспроизведён на этой машине**: pass-3 фикс L5 сломал lsof argv
  (getopt привязал `-i` к фильтру, `tcp:3100` стал filename → lsof всегда exit 1 → порт всегда «free» → PM2
  никогда бы не остановился + attestation leg недостижим). Перформативный fake `sh` принимал любой argv —
  потому сьют оставался зелёным; поймал следующий свежий контекст. Фикс: порядок `-ti, tcp:3100, -sTCP:LISTEN`
  + deep-регрессион-тест (deepEqual на КАЖДЫЙ lsof-вызов) + fail-closed lsof-ошибки + swapped/restart-skip +
  2 негативных attestation-теста; 56 тестов.
- **Pass-5: APPROVE, CONVERGED** (3 находки: 1 MEDIUM — restore-verify в free-port пре-стейте громко exit 1,
  задокументированное fail-safe design-решение, запинено тестом; 2 LOW — follow-up). lsof-инвариант
  эмпирически валидирован на этом хосте; все call-sites через один `listenerPidsNow()`.

Траектория находок: 13 → 11 → 15 → 10 → 3 (сходимость по Trigger-3). Диспозиции: APPLIED — все blocking +
should-fix; DISPOSITIONED — pass-5 MEDIUM (design-решение, fail-safe направление, JSON `swapped:false`
позволяет консьюмерам различать) и 2 LOW (латентность dev-spawn-фейла до 180s — чистый latency; 2 тест-пина
ps-фейл/jlist-коррупт абортов — ветви fail-closed и код-верифицированы) как follow-up.

### Мета-клейм бланкет-квалификатор (116.1 A-2)

Этот блок + Change Log + реестр §22 содержат формулировки о структурных свойствах («гварды байт-нетронуты»,
«инвариант выдержал все ветви», «fail-closed перед любым изменением состояния») — все такие клеймы
**unaudited meta-claims** per Trigger 4, кроме подтверждённых: живыми прогонами (таблица выше, JSON-summaries),
5 независимыми ревью-проходами с file:line-цитатами, и `git diff --name-only`-проверками гвардов.

### Валидация (живые прогоны; логи /tmp/e2e-isolated-*.log)

| Гейт | Результат |
|---|---|
| node --test (сьют раннера) | **56/56**, exit 0 (tests-first; 21→26→31→41→46→50→56) |
| lint / tsc | 0/0 / 0 |
| Контракты 174.3 | 33/33 |
| **Полный vitest СОЛО (final HEAD `01e114bb`)** | **19570/0** (1287 файлов), exit 0 |
| `next build --webpack` (final HEAD) | exit 0 |
| boundary / docs / locale / lessons / privacy | 118 / 95 / 4 / 0 / 0 (bare) |
| prettier на изменённых | все чисты (mjs по корпусу scripts) |
| `git diff --check` | чисто |
| **Живой e2e** | proof-run #5 PASSED (полный цикл + restore) — см. таблицу выше |

Манифест 174.3: 0 пинов на все тронутые файлы — реген не требовался. Rate-limit: 3 полных e2e-прогона суммарно
(в разные часы, ≤2/час соблюдён), 2 abort'а до запуска playwright логинов не жгли.

## File List

| Файл | Дельта |
|---|---|
| `scripts/run-e2e-isolated.mjs` | NEW (~430 строк, CLI-оркестратор) |
| `scripts/lib/e2e-isolated-plan.mjs` | NEW (~430 строк, чистая логика + executeTeardown/killProcessGroup) |
| `scripts/run-e2e-isolated.test.mjs` | NEW (56 тестов, hermetic, инъекционные симоы) |
| `package.json` | +1 строка (`test:e2e:isolated`) |
| `vitest.config.ts` | +1 строка (exclude node:test-сьют по прецеденту) |

## Change Log

| Дата | Событие |
|---|---|
| 2026-09-10 | Item исполнен: recon → tests-first волна executor(opus) → 3 live proof-runs (2 пойманных дефекта) → 5 ревью-проходов (2 REJECT→fixed, финал CONVERGED) → финальный live confirmation-run PASSED → closeout |

**Lessons:** (1) Фейковый sh, принимающий любой argv, маскирует регрессию формы команды — пинь argv deepEqual'ом на каждый вызов, не «вызывает с флагом». (2) Сокет слушает потомок pm2, не fork-pid: порт-классификация — по дереву процессов из ps-таблицы, не по равенству pid. (3) Фикс N-го ревью может сам быть дефектом — аттестационная нога (pm2-owned) поймала бы его живьём: fail-safe аттестация окупает сложность.
