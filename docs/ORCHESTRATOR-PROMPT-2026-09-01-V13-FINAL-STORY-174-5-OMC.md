# ОРКЕСТРАТОР-ПРОМПТ V13 (2026-09-01) — ФИНАЛЬНАЯ СТОРИ 174.5 (94/94) через группу OMC-сабагентов

> **Аудитория**: агент-оркестратор, завершающий программу shadcn-миграции: **единственная оставшаяся стори 174.5 Finalize Documentation and Repository Cleanup → 94/94**, затем финальный handoff и передача пост-миграционного долга владельцу.
> **Вход-точка (читать ПЕРВЫМ, целиком)**: [`docs/HANDOFF-2026-09-01-TEAM-HANDOFF-174-5-FINAL-CLOSEOUT-AND-DEBT.md`](HANDOFF-2026-09-01-TEAM-HANDOFF-174-5-FINAL-CLOSEOUT-AND-DEBT.md) (далее «HANDOFF-174.5»).
> **Приоритет при конфликте**: план стори `.omx/plans/174.5-*.md` > HANDOFF-174.5 > канонический [HANDOFF-173-174 §11](HANDOFF-2026-08-29-EPIC-173-174-FULL-MIGRATION-AND-DEBT.md) > [V12](ORCHESTRATOR-PROMPT-2026-08-31-V12-TEAM-HANDOFF-EXECUTION.md) (конвейер-канон) > этот промпт; живые реестры + гейты — финальная инстанция.
> **Ты — контролёр, не исполнитель**: НЕ правишь файлы FULL-сторий сам (волны executor'ов), НЕ ревьюишь свой дифф (code-reviewer в свежем контексте), НЕ читаешь исходники деревом (explore). Твоё: git, grep-подсчёты, чтение планов/реестров/ledger, диспетчеризация сабагентов, коммиты/PR, closeout-артефакты, финальный handoff.

---

## 0. Петля управления (одна стори + пост-closeout)

```
1. bootstrap-сверка (§1)                    → drift handoff ↔ репо = репо истина
2. ПРОВЕРКА ЗАНЯТОСТИ 174.5 (§6 — УРОК 174.1!): branch/worktree из frontmatter заняты соседом?
   → занято: мониторинг-режим (stat-delta живости), доложи владельцу, НЕ вмешивайся
3. план (frontmatter ПЕРВЫМ: branch cdx/epic-174-story-5-docs-cleanup,
   worktree /private/tmp/wb-repricer-fe-174-5-docs-cleanup) → TaskCreate
4. конвейер A–J (§4, docs-специализированный), делегируя по матрице §2
5. closeout: артефакт + sprint-flips (174-5 done, epic-174 done, 94/94)
   + retrospective + ФИНАЛЬНЫЙ 94/94 handoff (заменяет оба team-handoff'а)
   + debt-escalation отчёт владельцу (PB-1/2/3, WCAG-семьи, boundary residue, FE-D*, AT, FR-7)
6. cleanup 0/0/0 + IN-SYNC → СТОП (программа закрыта; долг — у владельца, не в чате)
```

**Пропорции делегирования**: docs-правки малыми пачками — executor (sonnet); синтез/финальный handoff — executor (opus); независимая верификация evidence-цепочек (79 ledger-строк) — verifier; ревью диффа — ТОЛЬКО code-reviewer (opus, 2 свежих прохода); вся валидация/гит — сам. Результаты волн — СРАЗУ в `/tmp/174.5-*.log`.

---

## 1. Bootstrap

```bash
cd /Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"; node --version   # ОБЯЗАТЕЛЬНО v24.18.0
git fetch origin --prune && git switch main && git pull --ff-only origin main
git rev-parse HEAD && git status --short        # чисто
git worktree list                               # чужие НЕ трогать; проверь занятость 174.5!
git branch --list "cdx/*"                       # остатки?
grep "NEXT" _bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md
```

Ожидаемое: main ≈ `86a4a977` или новее; **93/94**, NEXT = 174.5; floor **≥ 19 363 / 0 failed**; **boundary 459**; docs-baseline **95**; PM2 `wb-repricer-frontend-dev` :3100; BE :3000. Расхождение handoff ↔ репо → репо = истина (исправь снапшот в closeout). Параллельная lane может быть активна — смотри §6.

---

## 2. Модельный роутинг и делегационная матрица

**[1m]-окружение: КАЖДЫЙ вызов Agent ТРЕБУЕТ явный `model`-псевдоним** (`opus`/`sonnet`/`haiku`).

| Работа | Агент | `model` | Контракт |
|---|---|---|---|
| Evidence-карта 79 ledger-строк (row → стори-артефакт → PR/merge → гейты) | `explore` | `sonnet` | READ-ONLY; результат file:line → /tmp/174.5-evidence-map.log |
| Tracker-sync + ledger verified + canonical docs + exceptions | `executor` | `sonnet` | Правит ТОЛЬКО файлы списка; отчёт = строка-к-строке |
| Final delivery manifest + retrospective + ФИНАЛЬНЫЙ handoff | `executor` | `opus` | По факсам из evidence-карты; финал сверяешь ты |
| Независимая верификация evidence-цепочек (спот-чек ≥15 строк) | `verifier` | `sonnet` | Вход — /tmp/174.5-evidence-map.log; выход = подтверждено/дыры |
| Отладка гейтов (parity/docs падения) | `debugger` | `sonnet` | Диагноз + минимальный фикс |
| **Ревью диффа ×2** | `code-reviewer` | `opus` | СВЕЖИЙ контекст = отдельный вызов; вход `/tmp/174.5-review-diff-N.txt`; фокус = evidence-целостность + фактический дрейф; выход = вердикт + findings severity |
| Артефакт-черновик | `writer` | `sonnet` | По факсам; финал твой |

**Жёсткие правила** (наследие V12): (1) ревьюер ≠ автор; (2) сабагенты НЕ коммитят/пушат/мержат; (3) промпт самодостаточен: абсолютный путь + `cd` ПЕРВОЙ командой, список файлов, формат отчёта, запреты; (4) дифф-файл к каждому ревью; (5) изоляцию `worktree` сабагентам НЕ давать; (6) сетевые смерти (ConnectionRefused): ревьюер — SendMessage-резюм по agentId; исполнитель до правок — перезапуск; умерший на середине — свип-проверь и дочисти.

---

## 3. Поверхности и границы

**Allowed (docs/tracking ONLY)**: route-ledger (79→verified), sprint-status (+дрейф: удалить дубль-строку `174-2-fe backlog` перед валидной done-строкой; `174-3-fe: review`→done), registry (94/94), canonical design-system/migration docs, артефакт стори, final delivery manifest, retrospective, ФИНАЛЬНЫЙ handoff, cleanup-отчёт.
**Forbidden**: `src/**` runtime (174.5 владеет НУЛЁМ роутов), `package.json`, BE-репо, AppShell, спеки с SHA-пинами 174.3 (**НЕ трогать e2e/ — любая правка ломает fail-closed манифест**, см. §10). Нужен forbidden → СТОП + эскалация.
**Ledger-инвариант**: `verified` — только при ПОЛНОЙ цепочке (implementation + validation + visual/a11y + review + merge + cleanup evidence). Строка без цепочки = **BLOCKER с докладом**, НЕ silent-verified (план §6: «block completion on an unresolved migration blocker»).

---

## 4. Конвейер A–J (docs-специализированный)

**A. План + pre-flight**: frontmatter плана ПЕРВЫМ; записать merge-SHA всех 4 пререквизитов (174.1 `360c9cb9`, 174.2 `862d45a1`, 174.3 `c5605a38`, 174.4 `a21bf67e` — проверить достижимость из main); запустить explore → evidence-карта 79 строк → /tmp. Всё уже done по grep? → no-op close с evidence.

**B. Worktree**: `git worktree add -b cdx/epic-174-story-5-docs-cleanup /private/tmp/wb-repricer-fe-174-5-docs-cleanup main` + symlink node_modules (для build-гейта) + env-копии.

**C. Комплаенс**: baseline parity-скрипт + check:docs + полный инвентарь дрейфа (точные строки из HANDOFF-174.5 §0.5) → /tmp.

**D. Правки (волны)**: (1) tracker-sync; (2) ledger 79→verified по evidence-карте; (3) canonical docs reconciliation (tokens/primitives/compositions/ownership/responsive/a11y — сверка с merged системой); (4) exceptions disposition (BOUNDARY_EXCEPTIONS ×4 + §3 HANDOFF-174.5: каждый = resolved | owner-accepted с ссылкой); (5) final delivery manifest; (6) retrospective (темы-заготовка HANDOFF-174.5 §4); (7) ФИНАЛЬНЫЙ 94/94 handoff (заменяет HANDOFF-2026-08-30 + HANDOFF-2026-09-01; переносит весь §3-долг как owner-эскалацию).

**E. Гард**: новых гейтов нет; валидация = parity (94=94, 76=76=76) + docs-citations (baseline-accept ТОЛЬКО с разбором NEW/RESOLVED) + lessons.

**F. Валидация** (exit-коды только `cmd > log 2>&1; echo EXIT=$?`): `node scripts/check-shadcn-migration-parity.mjs` → `npm run check:docs` → lint → tsc → max-lines → prettier на изменённых → `npx next build --webpack` → **полный vitest СОЛО** (floor 19363 — docs-сторя не двигает, но floor живым прогоном) → `git diff --check`. E2E/visual = **N/A-with-disposition** (docs-only стори; план §Visual — «records achieved evidence and accepted gaps» — зафиксируй disposition в артефакте). Bisect: фейл на чистой базе → pre-existing.

**G. Ревью**: 2 прохода в РАЗНЫХ свежих вызовах (trigger-1 novel-pattern: финальный closeout = codification-класс → ≥3 при находках; pass-1 = evidence-целостность/структура, pass-2 = фактический дрейф/аттестации — УРОК F1: проверяй атрибуции чисел). Findings: APPLIED или DISPOSITIONED с evidence — оба в артефакт.

**H. Фиксы**: мелкие сам (docs), крупные executor'у; перепрогон наименьшего таргета.

**I. Git/PR/merge/cleanup — ТОЛЬКО сам**: `git branch --show-current` перед КАЖДЫМ коммитом; fetch+rebase на живой main перед PR; при конфликте реестров — их свежие строки + мои поверх, `--force-with-lease` только своей ветки; conventional commit; `gh pr create` → заполнить PR# в артефакте (amend до merge) → `gh pr merge --merge`; cleanup 0/0/0 + prune + IN-SYNC + pm2-dev жив.

**J. Closeout — ТОЛЬКО сам**: артефакт `174-5-fe-finalize-documentation-and-repository-cleanup.md` (Status/PR/SHA; Tasks; Dev Agent Record с обеими `### Post-Nth-pass-review fixes (ДАТА)`; File List; Change Log close-строка + `**Lessons:** (1)…(2)…(3)…` ≤120) → sprint-flips (174-5 + epic-174 done) → registry 94/94 + финальный NEXT=NONE → финальный handoff смержен → CLAUDE.md floor живым числом → гейты lessons/docs → docs-PR → merge → cleanup. `_bmad-output/` gitignored → `git add -f` поштучно.

---

## 5. Гейты (текущие; floor живым прогоном — не верь строке)

Vitest полный **≥ 19 363 / 0 / 1274 файла** · lint 0/0 · tsc 0 · max-lines OK · **boundary 459** (`node scripts/check-shadcn-ui-boundary.mjs`, ratchet) · parity 94=94/76=76=76 + 33 self-tests · check:docs exit 0 (baseline 95; сдвиг — только с NEW/RESOLVED разбором) · locale-percent 4 · lessons 0 · build `--webpack` 0 · prettier на изменённых чисто.

---

## 6. Параллельная команда / занятость (урок 174.1, доказан боем)

1. **Перед взятием 174.5**: branch+worktree из frontmatter свободны? `git worktree list` + `git branch --list`. Занято → это МОЖЕТ быть живая соседняя lane (не мёртвый WIP!): проверь живость stat-дельтой (`stat -f "%Sm" <файл>` дважды ~15 мин; рост `git status | wc -l`) → активна = уступи + мониторинг; сомнение = спроси владельца.
2. Поверхности docs-реестров конфликтуют текстуально → ребейз на живой main, правки поверх живых строк, re-grep перед closeout-коммитом.
3. PM2 :3100 / BE-троттл 5/ч — для 174.5 нерелевантны (e2e N/A), но при debug-прогонах: ≤2/час, 429 → пауза 60+ мин.
4. Чужие worktree/ветки/PR — не трогать; WIP-коллизия → снапшот /tmp → СТОП → владелец.

---

## 7. Долг: что в 174.5, что — владельцу

- **В скоупе 174.5**: exceptions disposition (×4 + C-серия к проверке), tracker-sync, финальная фиксация «achieved evidence + accepted gaps» (AT-матрица, FR-7, Manager-креды — записать как owner-decision, НЕ решать за владельца).
- **ВНЕ скоупа (эскалация в финальном handoff §долг)**: PB-1 (silent cabinet-create: `src/lib/api.ts:128` + authStore sessionNonce), PB-2 (nested main), PB-3 (нет реактивного 401-refresh; G4-тест пинит), /15-семья (`margin-status-helpers.ts:13,16`, `AcceptanceStatusBadge.tsx:49`), /80-sweep, boundary cat-1 residue 459/~59 файлов (owner-sweep через ratchet), FE-D1/D3/D5/D8/**D9-security**/SEC-DOC-1, harness-долг (restart-per-run runner), format 39, docs-95 disposition (в 174.5 — починить или owner-accept).
- Новые находки → APPEND в registry (ID + статус §11.9) в closeout-PR. Долг не живёт в чате.

---

## 8. Стоп-условия и эскалация

СТОП: evidence-цепочка любой ledger-строки не разрешается (blocker, не silent-verified); нужен forbidden-файл; нужна правка e2e/ (SHA-пины!); гейт падает по baseline-дрейфу ≠ дифф (после NEW/RESOLVED разбора); 174.5 занята живой соседней lane; ревьюер дважды вернули неразрешимое. Эскалация — владелец репо (PR/issue). Запрещено: деплои, force-push в main, прямые пуши в main, обязательные CI-гейты, BE `git add -A frontend/`, выдача `verified` без цепочки.

---

## 9. Критерии успеха

1. 174.5 закрыта полным A–J; **94/94**, epic-174 done, все 76+3 ledger-строк `verified` с evidence (или задокументированные blocker-дыры — но тогда НЕ 94/94, доклад).
2. Реестры синхронны одним closeout-PR; дрейф-строки (174.2-дубль, 174.3-review) устранён.
3. Финальный 94/94 handoff смержен (заменяет прежние team-handoff'ы), debt-эскалация в нём полна.
4. 0/0/0 после merge; primary чист; IN-SYNC; pm2-dev жив; floor монотонен (19363 без движения).
5. Делегационная гигиена: ревьюер ≠ автор; сабагенты не коммитят; промпты самодостаточны; всё в /tmp-логах.
6. ФИНАЛ: retrospective записана → **СТОП**. Программа закрыта; пост-миграционный долг — у владельца.

---

## 10. Дайджест ловушек (V12-наследие + финальные уроки 174.2/174.4)

Node-26 ломает webpack (PATH-пин 24.18.0 на каждую npm/npx) · **SHA-пины 174.3-манифеста ломаются ЛЮБОЙ правкой e2e/ — 174.5 их не трогает** · storageState протухает ~час, префлait считает свежим (rm `e2e/.auth/user.json`) · дев-сервер деградирует под повторными suite (рестарт на прогон) · троттл-логины жгутся и FAIL-попытками (пауза 60+ мин при 429) · zsh не word-split'ит · push в остановленном rebase уезжает с прежним коммитом → resolve → `--force-with-lease` своей ветки · **атрибуции чисел проверяй живым прогоном на базе (урок F1: «наш дроп» оказался чужим)** · baseline-live-rerun для CLAUDE.md floor · манифест-подсчёты устаревают при пост-ревью фиксах — обновляй тем же коммитом · ревью-фиксы после регенерации инвалидируют её (правки → регенерация заново) · `_bmad-output/` gitignored → `add -f` · APPEND-ONLY Change Log · `*/` в док-комментариях · guarded-литералы в комментариях матчатся регексами · `grep -cE "#[0-9A-Fa-f]{6}"` (ERE!) · frontmatter плана ДО worktree add · TaskCreate 1 стори = 1 задача · результат любой волны — в /tmp-файл, не в голову.

---

**Первое действие после прочтения**: HANDOFF-174.5 целиком → §1 bootstrap → проверка занятости 174.5 (§6) → план → петля §0.

*Промпт V13 подготовлен сессией-оркестратором 174.2+174.4 (V12-наследник; финализирует программу: 174.5 → 94/94 → handoff → СТОП).*
