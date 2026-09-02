# SEC-DOC-1 → D-2: BE-repo remediation plan (135→110 остаточных вхождений, оба креда мертвы)

**Дата**: 2026-09-02 · **From**: V14 FE-orchestrator · **Статус**: план готов к исполнению BE-мейнтейнером/агентом (FE-оркестратор BE-репо не правит без явного разрешения)
**Компаньон**: [`SEC-DOC-1-rotation-owner-decision-2026-09-02.md`](SEC-DOC-1-rotation-owner-decision-2026-09-02.md) — D-1 ротация ИСПОЛНЕНА и верифицирована; D-3 (history) — рекомендация «не трогать» принята; D-4 (сканер `.http`) — исполнен в FE (PR #386).

> **Non-echoing**: literals обозначены масками — **L-A** (stale-кред, мёртв всегда) и **L-B** (бывший live-кред, **мёртв с ротации 2026-09-02** — «password re-hashed» re-seed'ом). Neither is a live credential anymore: this is documentation hygiene, not an active leak.

## 0. Живой инвентарь (сверен 2026-09-02, `git grep`, BE main `e8cff608d` + working tree)

| Литерал | Файлов | Вхождений | Зона |
|---|---|---|---|
| L-A (stale) | 53 | 99 | **все BE-native** (mirror = 0) |
| L-B (dead post-rotation) | 10 | 11 | **все BE-native** (mirror = 0) |
| Итого (уник-файлы ≈ 59-63) | — | **110** | docs/guides/handoffs/orchestrator-prompts/README/CLAUDE-API/backlog/daytona-project-docs/TECH-DEBT |

Примечания:
- Счётчик упал со 135 (мой ранний скан) до 110 — в BE working tree появились **1338 незакоммиченных изменений `frontend/*`** (незавершённый mirror-sync, см. Фазу 1). `frontend/`-mirror в working tree уже НЕ содержит литералов (редакции FE PR #383/#385 доехали зеркалом), но эти изменения НЕ закоммичены.
- У BE уже есть собственный `CREDENTIAL-SECURITY-REMEDIATION.md` (закрывал критичные КОД-файлы: `frontend/e2e/fixtures/test-data.ts`, `scripts/backfill-commission.ts`, `scripts/create-sync-tasks.js`, `scripts/test_seed_crypto.ts`). Настоящий план закрывает оставшийся **doc-only residue** и не дублирует его.

## ⚠️ Предусловие (Фаза 0) — разобрать 1338-файловый WIP в BE working tree

`git status` BE показывает ~1338 изменённых `frontend/*` (mirror-sync WIP от параллельного актора/сессии). По дисциплине чужого WIP (FE-канон §6, урок 174.1):

1. Проверить живость (stat-дельта дважды ~15 мин; сомнение → спросить владельца).
2. Либо закоммитить осознанным `mirror(frontend):` PR (с `FRONTEND_MIRROR_OK=1`, прецедент `6daf32119`), либо откатить.
3. **НЕ смешивать** mirror-sync-коммит с redaction-волной Фазы 2 (разные PR).

## Фаза 1 — зафиксировать mirror с FE main

- Источник истины FE = main (текущий `d61875e6` или новее): оба литерала изъяты из FE tracked-дерева (PR #383 — 35 файлов; актуализирующие #384/#385).
- После mirror-коммита: `git grep -c "<L-A>" -- frontend/` и `<L-B>` → оба exit 1 (0 вхождений).
- Если mirror-sync НЕ планируется — Фаза 2 остаётся самодостаточной (native-файлы не зависят от mirror), mirror-остатки закрыть позже тем же способом.

## Фаза 2 — BE-native sweep (~59-63 файла, doc-only механика)

1. **Замена**: оба литерала (формы с `!` и без) → плейсхолдер `<TEST_PASSWORD>` (BE-семантика: `prisma/seed.ts:13,153` берёт пароль из env `TEST_PASSWORD`; для http-примеров — `<TEST_PASSWORD>` в соотв. переменные). FE-прецедент паттерна — PR #383 (perl -pi, цикл по одному файлу; zsh-ловушка на batch-аргументах).
2. **APPEND-ONLY**: исторические handoffs/ORCHESTRATOR-PROMPTS V3-V8/TECH-DEBT-2026-08 — менять ТОЛЬКО литерал; нарратив/даты/статусы не трогать. Disclosure — одной датированной строкой в TECH-DEBT ledger (BE-канон), не в каждом файле.
3. **Особые файлы**:
   - `CREDENTIAL-SECURITY-REMEDIATION.md` — сам документирует креды: литералы → маски, в конец добавить датированное примечание «2026-09-02: оба тест-креда ротированы/мертвы; doc-residue изъят (SEC-DOC-1 D-2)»;
   - `backlog/tasks/task-153-*.md`, `daytona-project-docs/database/02-tenant-tables.md` — та же механика;
   - README / CLAUDE-API / docs/*-GUIDE / API-TESTING-QUICK-START — заменить литерал + рядом дать env-указатель (`TEST_PASSWORD` при `npm run seed`), FE-прецедент — блок «Test Credentials» в FE CLAUDE.md.
4. **Верификация (DoD)**: non-echoing `git grep -c` по ОБОИМ литералам по всему BE tracked-дереву → exit 1 (0 вхождений). Гейты BE на doc-only волну: свои lint/docs-проверки по канону BE-репо; код не меняется.

## Фаза 3 — cross-repo registry sync

- BE: строка в TECH-DEBT ledger + статус в CREDENTIAL-SECURITY-REMEDIATION.md (см. выше).
- FE: оркестратор V14 переведёт D-2 → RESOLVED в `docs/security/SEC-DOC-1-rotation-owner-decision-2026-09-02.md` и handoff §4 SEC-DOC-1 (строку про «BE-репо 135 stale») по факту подтверждения (PR-ссылка BE).

## Рамки и запреты (наследуют D-3/D-5 решения)

- **История git НЕ переписывается** (D-3, owner-принято).
- Ротация уже закрыта (D-1) — новых секрет-действий нет; оба литерала в истории мертвы.
- BE-код/сид не меняется (план doc-only; код-файлы закрыты прежним BE-ремедиацией).
- Оценка: ~63 файла, механика одного вечера, риск низкий (мёртвые креды, APPEND-ONLY сохраняется).

## Что нужно от владельца BE-репо

1. Разрешить исполнение (своё ИЛИ явное разрешение FE-оркестратору/агенту работать в BE-репо — тогда исполню тем же конвейером: волны + верификация + 2 ревью-прохода).
2. Определиться с 1338-файловым mirror-WIP (Фаза 0).
