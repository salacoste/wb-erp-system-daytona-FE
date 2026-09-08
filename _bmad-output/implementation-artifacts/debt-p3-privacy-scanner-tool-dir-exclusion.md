# Debt P3: privacy-сканер × BMAD tool-директории — exclusion из change-set скана (сессия-9, V19)

> **Status**: done · **PR**: [#425](https://github.com/salacoste/wb-erp-system-daytona-FE/pull/425) · **Branch**: `debt/bmad-knowledge-token-redaction` @ `5934c313` (worktree /private/tmp/bmad-token-redaction)
> **Источник**: реестр §18a (MEDIUM от ревью #423); исполнен оркестратором сессии-9 (2026-09-08/09)
> **Класс**: behavior-change гейт-скрипта → обязательные 2 ревью-прохода (CLAUDE.md); **owner decision on record 2026-09-08** (AskUserQuestion: «Исключить 5 tool-дир из скана»)

---

## Context

- §18a оценивал residual в «135 authorization-value матчей». Точная энумерация самим сканером (`scanPrivacyFiles` над 4657 файлами 5 директорий): **630 нарушений в 4 классах** — raw-browser-diagnostic 270 · authorization-value 180 · sensitive-raw-url 135 · raw-browser-capture 45.
- Природа контента: вендоренный BMAD framework knowledge-базис (5 дубликатов; `_bmad/` трекается инсталлер-манифестом `_bmad/_config/files-manifest.csv`, 4 IDE-диры — инсталлер-выход по контенту); 4865 трекнутых файлов; регенерируется `npx bmad-method install` → редакции не переживают обновление фреймворка. Не в PRIVACY_SCAN_ROOTS; триггерили только через change-set путь.
- **Owner-решение (2026-09-08, AskUserQuestion)**: исключить 5 дир из change-set скана (опция 1 из 4; альтернативы: гибрид-редакция 180, ничего, редакция всех 630 — отклонены).

## Implementation (tests-first, executor sonnet; полировка — executor sonnet по находкам прохода-1)

- `scripts/check-privacy-console.mjs`: экспорт `EXCLUDED_CHANGE_SET_PREFIXES` (+ module-scope `_LIST`); `isExcludedFromChangeSet()`; фильтр в `collectGitChangeFiles` — **fallback-решение по RAW change-set** (excluded-only dirty tree не проваливается к стухшим HEAD-кандидатам; прокомментировано в коде), фильтрация обеих ветвей.
- `IGNORED_DIRECTORIES` и PRIVACY_SCAN_ROOTS walk НЕ тронуты (запинено тестом «scan-roots walk still scans»).
- Тесты: +3 (exclusion-only-in-change-set с точным deepEqual сета-трипвайром · scan-roots independence · **HEAD-fallback filter pin**), 24→27, все зелёные (`node --test` — канонический раннер файла; vitest исключает его по дизайну, vitest.config.ts:53). Пины мутационно верифицированы (filter→false → релевантные тесты краснеют).
- RED→GREEN: поведенческий RED до имплементации зафиксирован (26-тест-файл fail 1); ловушка `npx vitest run` («No test files found») задокументирована.

## Accepted residual (both records per review MEDIUM, owner authority 2026-09-08)

Gate больше НЕ видит через change-set путь (working-tree, staged, untracked, stale-HEAD-fallback) пути под 5 префиксов: (1) реальные секреты в 4865 файлах (вкл. 143 не-разрешённых расширений: 117 csv/20 py/5 groovy/1 bak) невидимы, (2) **strict fail-closed ошибки (unsupported type, symlink-in-scope, escape) для этих путей подавлены** — это осознанное следствие: иначе `bmad-method install` регенерация валила бы гейт на benign-вендорном контенте, (3) `git mv` файла ВНУТРЬ этих дир убирает его из поля зрения, (4) excluded-only dirty tree скипает stale-HEAD fallback (pre-existing семантика fallback'а — он и раньше срабатывал только на чистом дереве). Gate по-прежнему полностью покрывает: PRIVACY_SCAN_ROOTS walks, 6 PII-файлов, ВСЕ change-set пути вне 5 префиксов, вложенные (`src/_bmad/**` — запинено пробой, root-anchored prefixes), lookalikes (`_bmadfoo/` — over-scan, безопасное направление). Case-sensitive matching — fail-closed направление.

## Validation (финальное дерево `5934c313`)

| Гейт | Результат |
|---|---|
| node --test privacy suite | **27/27** (3 новых пина; мутационная непустота доказана) |
| privacy CLI (bare) | exit 0, 3656 files |
| docs / lessons / locale | 0 · 0 · 4 |
| lint / tsc | 0 · 0 |
| vitest полный соло | 19559/0 exit 0 (на dd06b14d; дельта после — только node:test-файл, vitest'ом не покрываемый) |
| build --webpack | exit 0 (на dd06b14d; сканер вне app-графа компиляции — дельта не влияет) |
| prettier (обоих файлов) | clean |

## Post-1st-pass-review fixes (2026-09-09)

Review pass 1 (code-reviewer, opus, свежий контекст) — **APPROVE, 0 blocking** (4 эмпирические пробы: анкоринг `src/_bmad/` сканируется; excluded-only no-fallthrough; move-out renames детектируются в обеих настройках rename-detection; 143 файла подтверждены). Применено: hoist префикс-листа (LOW), точная формулировка regeneration-клейма (LOW), пин fallback-ветки (coverage gap) → `5934c313`.

### Post-2nd-pass review (2026-09-09)

Review pass 2 (code-reviewer, opus, свежий контекст) — **APPROVE, 0 blocking**. Все 4 клейма прохода-1 независимо верифицированы disposable-пробами в /tmp (worktree pristine пост-ревью); герметичность пин-теста доказана против враждебного глобального git-конфига (gpgsign, hooksPath exit-1, autocrlf, custom defaultBranch); mutation-proven reach. Зарегистрирован: MEDIUM (strict-error relaxation — см. Accepted residual, ОБЕ записи внесены), LOW move-into silencing (в пределах accepted residual), LOW pre-existing root-commit fallback gap (`diff-tree` без `--root`; future hardening, вне scope), INFO POSIX-only `hooksPath=/dev/null` в фикстуре (CI macOS/Linux — приемлемо).

**Meta-claim qualifier**: аттестационные формулировки о полноте покрытия — unaudited meta-claims (Trigger 4); первичный evidence — ревью-статьи с их coverage-gap декларациями.

## File List

- `scripts/check-privacy-console.mjs` (dd06b14d + 5934c313)
- `scripts/check-privacy-console.test.mjs` (там же; additions-only, 0 модификаций существующих тестов)
- `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md` (§19 APPEND)
- `_bmad-output/implementation-artifacts/debt-p3-privacy-scanner-tool-dir-exclusion.md` (этот артефакт)

## Change Log

| Date | Change |
|---|---|
| 2026-09-09 | Создан; owner-decision исполнение tests-first; 2×APPROVE; обе MEDIUM-записи (exclusion + strict-error relaxation) внесены |

**Lessons:** (1) IGNORED_DIRECTORIES не фильтрует change-set путь — файлы добавляются поштучно; точка фильтра — collectGitChangeFiles (2) Гейт на чистом дереве видит HEAD merge-diff: документируя quirk, не воспроизводи триггер-паттерн в реестре (3) Мутационная проверка (ломаешь фикс → тест краснеет) — дешёвое доказательство непустоты пина
