# Debt D-5 — PB-2: nested `<main>` removed (handoff §8-P1)

**Status**: review — 2026-09-02; 2 ревью-прохода (структура: APPROVE 3 LOW; факты/финал: APPROVE 1 LOW — оба LOW dispositioned); PR #385 (оркестратор)
**Item**: D-5 (**PB-2**) — handoff §8-P1 · **PR**: #385 · **Head**: `47661aef` · **Base**: main `3b094836` · **Branch**: `debt/d5-pb2-nested-main` · **Worktree**: `/private/tmp/d5-pb2-nested-main` · **Date**: 2026-09-02

## 1. Долг и DoD

Nested `<main>` на `/analytics/ai-admin/preferences` (shell уже рендерит `<main id="main-content">` в `(dashboard)/layout.tsx:113`) — два main-landmark на роуте (axe-нарушение, PB-2 confirmed-live из report-only D3 / артефакт 174.4).

**Выполнение**: `<main>` → `<div className="container mx-auto p-6">` (классы байтово сохранены — нулевая визуальная дельта). **Расширение скоупа**: propagation-grep (дисциплина 97.1-FE) нашёл параллельную локацию `ai-admin/models/page.tsx:16` с идентичным вложенным `<main>` — закрыта той же правкой в этом же PR. Sweep-верификация: `rg -ln "<main" "src/app/(dashboard)"` → единственный файл `layout.tsx` (shell).

## 2. Dev Agent Record

### Implementation (волны executor/sonnet ×2 + 1 comment-only правка оркестратора)

1. `src/app/(dashboard)/analytics/ai-admin/preferences/page.tsx:16` — main→div + комментарий PB-2/D-5.
2. Параллельная локация `src/app/(dashboard)/analytics/ai-admin/models/page.tsx:16` — идентичная правка (комментарий помечает parallel location).
3. `e2e/ai-admin-preferences.spec.ts:40` — протухший комментарий «Page wraps content in `<main>`» → факт-честный (shell main + div внутри). **Comment-only, ассерты нетронуты; спека НЕ входит в 174.3 SHA-pinned набор** (проверено: pinned = dedicated `story-174-3-*.spec.ts`; execution-manifest 0 sha256-полей на ai-admin; правка вне forbidden-поверхности §3). Правка внесена оркестратором (doc-класс; disclosed здесь).

### Review

- **Проход-1** (code-reviewer/opus, структура): **APPROVE**, 3 LOW — (a) протухший e2e-комментарий → ИСПРАВЛЕН; (b) `//`-комментарий в return-скобках → KEEP (валидный JSX; tsc/eslint/prettier зелёные; конвенция-нит); (c) реестр-строка не покрывает models → закрыто в closeout (handoff §4/§8).
- **Проход-2** (свежий, факты/финал): **APPROVE**, 1 LOW (та же реестр-строка → closeout). Байт-тождество диффа sha256-сверено; 174.3-пиннинг проверен ревьюером независимо; убывающий ряд 3→1 = сходимость.

### Validation (живые прогоны)

| Gate | Результат |
|---|---|
| Vitest полный | **19415 passed / 0 failed** (1275 файлов; счётчик не сдвинут — тесты не менялись) |
| targeted ai-admin | 10 файлов / 125 passed |
| `npx next build --webpack` | 0 |
| lint / tsc / prettier | 0/0 · 0 · чисто (все 3 файла) |
| `<main>`-sweep (dashboard) | только layout.tsx |
| diff-check | 0 |

### Dispositions

- e2e-усиление ассерта (`toHaveCount(1)` на main) — follow-up-предложение ревьюера-1 (behavior-изменение e2e требует e2e-прогон-дисциплины; не в этой волне).
- `//` в return-скобках — KEEP.

## 3. File List

- `src/app/(dashboard)/analytics/ai-admin/preferences/page.tsx` — main→div
- `src/app/(dashboard)/analytics/ai-admin/models/page.tsx` — main→div (parallel, 97.1)
- `e2e/ai-admin-preferences.spec.ts` — comment-only
- `docs/HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md` — §4 PB-2 RESOLVED + §5 + §8 D-5 DONE
- NEW `_bmad-output/implementation-artifacts/debt-d5-pb2-nested-main.md` (этот файл; gitignored → `git add -f`)

## 4. Change Log

| Date | Scope | Status | Lessons |
|---|---|---|---|
| 2026-09-02 | Implemented D-5 (PB-2): nested main → div на preferences + models (parallel), e2e-комментарий актуализирован | review | **Lessons:** (1) Propagation-grep обязателен даже для «однорутовых» дефектов: параллельный models нашёлся за секунды. (2) e2e-комментарии — тоже документация: протухшее описание структуры = narrative-drift для будущего ревьюера. (3) Comment-only правка не-pinned e2e-спеки легальна; pinned-набор = dedicated story-174-3-*.spec.ts. |
