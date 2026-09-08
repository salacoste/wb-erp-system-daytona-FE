# Debt P3: prettier-md — нормализация docs/**/*.md (сессия-9, V19)

> **Status**: done · **PR**: [#420](https://github.com/salacoste/wb-erp-system-daytona-FE/pull/420) · **Branch**: `debt/prettier-md-docs` @ `ac366ad9` (worktree /private/tmp/prettier-md-docs)
> **Источник**: HANDOFF-2026-09-06-V18 §3.0 item 1 «prettier md (~1189)»; исполнен оркестратором сессии-9 (2026-09-08)
> **Режим ревью**: single-pass owner-approved (CLAUDE.md doc-only exception) с обязательной fix-верификацией после REJECT

---

## Context

- Scope реконструирован префлайтом: `prettier --check "docs/**/*.md"` на V19-старте = **1191 dirty** (= «~1189» handoff + дрейф новых доков сессий 7-8). Остальные ~5250 tracked md (tool-директории `.opencode/.agent/.gemini`/…) вне scope.
- Префлайт 105.2: item не был починен. Манифест 174.3: **0 пинов** на `docs/` (grep execution-manifest.json). e2e-видимость: нет (md не пинится спеками; e2e не запускался).
- Базлайны ДО правок (в worktree): docs exit 0 · lessons 0 · locale 4 — логи /tmp (потеряны при /tmp-инциденте, значения зафиксированы в истории сессии; пост-прогоны повторены на финальном дереве).

## Owner-решения (2026-09-08, AskUserQuestion)

1. **Ревью**: 1 проход code-reviewer(opus) вместо канонных 2 (doc-only механика; CLAUDE.md §Two-pass scope: «trivial process-cleanup (doc-only…)»).
2. **HIGH-находка pass-1** (~30k in-fence строк embedded-переформатирования): **строгий путь** — перегон с `--embedded-language-formatting=off` (фенсы байт-нетронуты), НЕ accept+amend.
3. **CRITICAL-сайты**: фиксить (восстановление литералов + prettier-стабильные эскейпы).

## Tasks

- [x] Pre-flight: scope 1191 · manifest 0 pins · occupancy free (0 worktree)
- [x] Прогон №1 (embedded=on, 1191 файлов) — уничтожен /tmp-инцидентом ДО коммита; **потеря 0** (детерминированный редо)
- [x] Прогон №2 strict (embedded=off) + commit-immediately: `61c14b87`, 1189 файлов 36289+/22817−
- [x] Review pass 1 (code-reviewer opus, свежий контекст): **REJECT** (2 CRITICAL + 1 HIGH + LOW + INFO)
- [x] Фикс-волна: `0771645d` (7 literal-сайтов) + `ac366ad9` (2 corpus-файла до идемпотентности)
- [x] Fix-верификация тем же ревьюером (SendMessage-резюм ×3 после 2 сетевых смертей): **APPROVE**, none above INFO
- [x] Полная гейт-панель финального дерева (см. Dev Agent Record)
- [x] Артефакт + реестр §16 + PR/merge + cleanup 0/0/0

## Dev Agent Record

### Implementation notes

- **Strict-режим**: `npx prettier --embedded-language-formatting=off --write "docs/**/*.md"` — 1189 файлов (2 файла, менявшихся только in-fence, выпали из сета). Классы изменений: table re-padding · blank-line нормализация · closing-fence completion · emphasis/list нормализация вне фенсов.
- **Fence-сохранность**: собственный in-fence-валькер (trimEnd-нормализация): 1188/1189 exact-or-additions-only; 1 файл (story-36.5) объяснён (fence-marker upgrade ``` → ```` + prose list-interruption — слова идентичны). Независимый валькер ревьюера на финальном дереве: 30 in-fence дельт = 28 blank-line-only + 2 broken-fence REPAIRS (проза, проглоченная незакрытыми фенсами main, ре-экспонирована; token-multiset delta 0, zero content loss).
- **7 literal-сайтов**: 6× `__tests__`→`**tests**` (emphasis-нормализация в bold/prose/heading) восстановлены с эскейпом `\_\_tests\_\_` (CommonMark `\.`-семантика: рендер = литерал; prettier-стабильно); 1× `--include=*.tsx`→`_.tsx` (GFM cell pipe-split ломал code span) восстановлен + внутренние пайпы ячейки экранированы `\|` (table-layer escaping, рендер = литерал `|`).
- **Corpus-идемпотентность**: 2 scraped-файла (`competitors/selsup/product/corpus/voprosy-i-otvety…`, `vozmozhnye-oshibki…`) неприттиер-стабильны на main-байтах → применена желаемая emphasis-escape-нормализация; treewide `--check` = exit 0 идемпотентно.
- **story-36.5 list-interruption** (принято, семьи LOW «loose lists»): ревьюер доказал token-multiset 0 + CommonMark-реальность — упорядоченный список, начинающийся с `2.`, не может прервать абзац, main УЖЕ рендерил эти строки слитным prose; source теперь совпадает с рендером.
- **/tmp-инцидент**: worktree /private/tmp уничтожен между ходами (~2ч окно; известный паттерн concurrent-сессий). Прогон №1 (1191 файл, все гейты зелёные) потерян незакоммиченным → **протокол commit-immediately** введён с прогона №2: write+commit одной цепочкой; редо детерминировано (статистика байт-идентична: 48709/35308 обоих прогонов №1).

### Post-1st-pass-review fixes (2026-09-08)

Review pass 1 (code-reviewer, opus, свежий вызов; дифф `/tmp/prettier-md-review-diff-1.txt`) — VERDICT: **REJECT**.

- **CRITICAL-1** `__tests__`→`**tests**` ×9 (emphasis-нормализация; 2 сайта рендерились сломанным `****tests**`) → FIXED: 3 in-fence сайта исцелены strict-redo нативно (ревьюер самокорректировал pass-1: считал их pre-existing), 6 out-of-fence — эскейпами (`0771645d`).
- **CRITICAL-2** `--include=*.tsx`→`_.tsx` (документированная shell-команда в GFM-ячейке) → FIXED: восстановление + `\|`-экранирование (`0771645d`).
- **HIGH** ~30k in-fence строк embedded-переформатирования (AST-эквивалентно, но байтовый дрейф документированных примеров: `0.00`→`0.0`, кавычки/point-с-запятой) → FIXED по owner-решению: strict redo (`61c14b87`).
- LOW loose-lists / INFO autolink-wrapping — принято (prettier-consistent, рендер-семантика без изменения слов).

### Fix-wave verification (2026-09-08)

Тот же ревьюер (SendMessage-резюм; 2 сетевые смерти — socket close, ConnectionRefused — резюм по agentId сработал оба раза) — VERDICT: **APPROVE**, findings none above INFO:

- INFO-1: 2 broken-fence repairs (EPIC-37-COMPONENTS-REVIEW, front-end-architecture) ре-нестят бывший fenced-prose как обычный md — рендер ИСПРАВЛЕН, слова идентичны; раскрыто в PR description.
- INFO-2: +6 literal `_` в одном scraped-corpus-файле от escape-нормализации — пунктуационный уровень, принято.
- Гейты, перегнанные ревьюером независимо на финальном дереве: treewide prettier --check exit 0 · check:docs exit 0 (baseline 95) · lessons exit 0 (96 строк, 0 нарушений) · scope 1189/1189 `docs/*.md`.

### Validation (финальное дерево `ac366ad9`)

| Гейт | Результат | Примечание |
|---|---|---|
| vitest полный соло | **19559/0** exit 0 | на строгом дереве `61c14b87`; дельта после — md-only (9 файлов) |
| `next build --webpack` | exit 0 | там же |
| lint / tsc / boundary | 0/0 · 0 · 3 exceptions | там же |
| check:docs | exit 0 | baseline 95 = set-match; перегнан ревьюером |
| lessons / locale / privacy | 0 / 4 / exit 0 | privacy: 3658 text files |
| prettier treewide (embedded=off) | **exit 0** | идемпотентность |
| fence-сохранность | 1189/1189 | 2 валькера (orchestrator + reviewer) сходятся |
| `git diff --check` / git status | чисто | 0 нестейдженных |

## File List

- `docs/**/*.md` — 1189 файлов (61c14b87, форматирование)
- `docs/archive/ANALYTICS-INTEGRATION-SUMMARY.md`, `docs/archive/DEV-HANDOFF-EPIC-34-FE.md`, `docs/stories/epic-33/story-33.8-fe-integration-testing.md`, `docs/stories/epic-37/story-37.3-aggregate-metrics-display.BMAD.md`, `docs/stories/epic-37/story-37.5-testing-documentation.BMAD.md`, `docs/stories/epic-44/story-44.27-fe-logistics-field-naming-fix.md`, `docs/HANDOFF-2026-09-03-V15-SESSION2-EXECUTION-AND-REMAINING-BACKLOG.md` (0771645d, literal-фиксы)
- `docs/competitors/selsup/product/corpus/voprosy-i-otvety-po-fbs-wildberries.md`, `docs/competitors/selsup/product/corpus/vozmozhnye-oshibki-v-sozdanii-kartochek-v-servisah.md` (ac366ad9, идемпотентность)
- `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md` (§16 APPEND)
- `_bmad-output/implementation-artifacts/debt-p3-prettier-md-docs.md` (этот артефакт)

## Change Log

| Date | Change |
|---|---|
| 2026-09-08 | Создан; single-pass owner-approved режим; REJECT→fix→APPROVE-цикл; полная гейт-панель зелёная; /tmp-инцидент задокументирован (commit-immediately протокол) |

**Lessons:** (1) commit-immediately после механических волн в /tmp-worktree — /tmp вычищен между ходами вновь, редo без потерь (2) prettier-md emphasis-нормализация портит литеральный `__x__` в prose — эскейп `\_\_` там, где подчёркивания семантически литеральные (3) `--embedded-language-formatting=off` сохраняет байты фенсов: embedded-реformat молча переписывает документированные API/shell-примеры
