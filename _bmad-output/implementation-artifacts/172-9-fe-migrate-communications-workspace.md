# Story 172.9-FE: Migrate Communications Workspace

Status: done — PR #305 merged (`feb35cfd`, commit `2ec7c7c5`); **MINOR-GAP** — 11 файлов (8 M прод + гард + e2e fixture + e2e spec, +591/−18); 1×opus fresh APPROVE-WITH-NOTES (0 CRITICAL/MAJOR; 2 MEDIUM + 3 LOW — 4 fixed, 1 dispositioned; closure-аудит 64 файла чист); targeted 84/84 (73 баз + 11 гард); полный пол **19 394/0/1218** (floor 19 383 → 19 394, +11 exact); e2e 11✓+1skip (3 setup + 2 orders-smoke + 6 communications) ×2 прогона (после AC4-race-фикса); lint 0/0, tsc 0, max-lines OK, build --webpack 0 ×2; визуал light+dark (unread-дот красный в обоих); cleanup 0/0/0.

## Story

As a business user, I want the communications workspace (feedbacks, questions, chats, claims, pinned reviews, reply/composer workflows, unread states) to keep every workflow and state while the owned surface moves to semantic shadcn/UI presentation.

Plan: `.omx/plans/172.9-migrate-communications-workspace.md` (authoritative — branch `cdx/epic-172-story-9-communications`, worktree `/private/tmp/wb-repricer-fe-172-9-communications`).

## Acceptance Criteria

> **Given** representative conversations, unread states, drafts, and retryable failures
> **When** the workspace is migrated
> **Then** section navigation, selection, reply, retry, and status behavior remain complete without draft loss
> **And** the route uses consistent responsive and accessible compositions.

## Tasks / Subtasks

- [x] Task 0: pre-flight — registry carry-in по 172.9 пуст; owned surface = только route-tree (18 прод-файлов); hooks/api/types/mocks — forbidden; e2e-спеки не было → создать.
- [x] Task 1: behavior-lock — targeted baseline на чистом worktree: 12 файлов / 73 теста / EXIT=0.
- [x] Task 2: комплаенс-подсчёт — вердикт MINOR-GAP: 15 palette-хитов / 8 файлов + 1 raw `<button>` (ChatsSection:156) + py-6 intra-card (легитимен); hex 0; closure-предскан чист.
- [x] Task 3: правки — статус-токены (text-status-success/-error valence ×6, text-destructive writeback ×5, bg-destructive дот+каунтер, bg-primary seller-пузырь, fill-status-warning звёзды), raw button → ui Button ghost (h-auto/w-full/justify-between/whitespace-normal/px-0/py-3).
- [x] Task 4: гард 11 тестов (каталог 18 per-file identity, no-palette/no-hex 172.5-канон, контракты valence/seller/unread/rating/writeback-5/thread-row-ghost/tabular-nums/padding).
- [x] Task 5: e2e СОЗДАН — fixture (точные пути без `**`, нормализаторные raw-shapes, per-section setSectionStatus flip) + спека 6 тестов (AC1 populated+дот+звёзды+чипы, AC2 drill-in/каунтер/назад, AC3 empty, AC4 error+sibling-health, AC4b retry-recovery, AC5 pinned-чип+претензии+tab-round-trip).
- [x] Task 6: универсальная валидация — lint 0/0, tsc 0, max-lines OK, build --webpack 0 (×2 — до и после ревью-фиксов), полный пол 19 394/0/1218 EXIT=0.
- [x] Task 7: ревью 1×opus fresh APPROVE-WITH-NOTES + import-closure аудит (64 файла, каталог 18/18, 0 palette в замыкании); фиксы: px-0 (MEDIUM-1), dead error-mode (LOW-3), response-фильтр якоря (LOW-4), claims-ассерт (LOW-5); disposition: e2e-evidence (MEDIUM-2 — см. Dev Notes), NIT-6/7/8 (canon-consistent); перепрогон targeted+lint+tsc+build+e2e после фиксов.
- [x] Task 8: PR #305 (`2ec7c7c5`, merge `feb35cfd`); cleanup 0/0/0 (remote/local/worktree + prune; primary IN-SYNC).
- [x] Task 9: closeout — артефакт + sprint-flip + registry SHIPPED/NEXT + handoff §0 + CLAUDE.md floor одним docs-PR.

## Dev Notes

### References

- Токен-канон (живой): `--color-status-success/-warning/-error` globals.css:39-46; Badge-идиома `InstalledRuleRow.tsx:67`; каунтер-канон `MobileSidebarSheet.tsx:99`; `fill-` с токенами — прецедент `radio-group.tsx:31`.
- Эталоны: гард — 172.7; e2e fixture+spec — 172.2; MINOR-цикл — 172.3/172.4.

### e2e-инцидент AC4 (найден и закрыт в цикле)

Первый прогон: AC4 timeout. Диагноз по fixture-логу: `feedbacks 500×3 → 200` — TanStack retry-бюджет + ремаунт секции при возврате на вкладку запускает mount-refetch, который поглощает флип-статус и «съедает» retry-кнопку до клика. Фикс: split AC4 (error+sibling, без возврата на вкладку) / AC4b (flip→retry.click без ухода со вкладки). Второй прогон: EXIT=0.

### MEDIUM-2 disposition (e2e-evidence)

Ревьюер застал порт :3100 занятым pm2-dev primary (post-restore). Хронология прогона: e2e выполнялся на worktree-деве (`npx next dev --webpack -p 3100` из worktree, лог `/tmp/172.9-devserver.log` + `/tmp/172.9-devserver2.log`, фоновые задачи bi5z43a50/bc44u56p7), pm2-dev был остановлен на время прогона и восстановлен после; оба e2e-прогона — против worktree-сборки.

### Post-1st-pass-review fixes (2026-08-28)

- [MEDIUM-1 FIXED] ChatsSection row-Button: добавлен `px-0` — ui Button default `px-4` делал строки чатов врезанными относительно sibling-секций (FeedbackRow/QuestionRow px-0).
- [MEDIUM-2 DISPOSITIONED] e2e-evidence — см. Dev Notes (хронология прогонов).
- [LOW-3 FIXED] fixture: удалан мёртвая ветка `mode: 'error'` (ни один тест не использовал; per-section flips покрывают).
- [LOW-4 FIXED] spec: `waitForResponse`-фильтры AC1/AC4b заякорены `/\/v1\/communications\/feedbacks(\?|$)/` (не матчят `/feedbacks/pinned`).
- [LOW-5 FIXED] spec AC5: добавлен claims-ассерт (`A-123` orderId) — контент претензий покрыт.
- [NIT-6/7/8 DISPOSITIONED] guard hex self-test fail-safe; thread-row `<button`-бан скоуплен на ChatsSection (sibling-guard breadth канон); fixture 237 строк < 800 cap.

### Debug Log References

`/tmp/172.9-{baseline,after-edits,guard,targeted2,targeted3,lint,tsc,maxlines,build,build2,fullrun,fullrun2,e2e,e2e2,e2e3,ac4-debug,ac4-debug2,devserver,devserver2}.log`; визуал `/tmp/172.9-visual-light.png`, `/tmp/172.9-visual-dark2.png`.

### Completion Notes List

- Вердикт комплаенса MINOR-GAP: поверхность была структурно на shadcn (Button/Card/Textarea/Tabs/AlertDialog уже импортировались) — остался чисто цветовой долг + 1 raw button.
- Канон цветности: valence = status-семейство, ошибки = destructive, brand-идентичность (seller) = primary, звёзды = status-warning. Дот и каунтер непрочитанных унифицированы на destructive (MobileSidebarSheet-канон).
- e2e-обёртка: 11 passed + 1 skipped = 3 setup (2 unauth + 1 auth) + 2 orders-smoke + 6 communications (AC1/AC2/AC3/AC4/AC4b/AC5); 0 failed.

### Gaps

- Динамический playwright-прогон шел против worktree-дев с копией `.env.e2e` — разложение обёртки аттестовано по листингу тестов.
- Chart-требований у стори нет (план: «no chart requirement») — chart-гварды неприменимы.

### File List

M `src/app/(dashboard)/communications/components/ChatMessages.tsx`
M `src/app/(dashboard)/communications/components/ChatsSection.tsx`
M `src/app/(dashboard)/communications/components/FeedbackRow.tsx`
M `src/app/(dashboard)/communications/components/FeedbacksSection.tsx`
M `src/app/(dashboard)/communications/components/PinnedReviewsSection.tsx`
M `src/app/(dashboard)/communications/components/QuestionRow.tsx`
M `src/app/(dashboard)/communications/components/UnreadBadge.tsx`
M `src/app/(dashboard)/communications/components/WritebackStatus.tsx`
A `src/app/(dashboard)/communications/__tests__/communications-presentation-source-contracts.test.ts`
A `e2e/communications.spec.ts`
A `e2e/fixtures/story-172-9-communications.ts`

### Change Log

| Date | Note |
|---|---|
| 2026-08-28 | Story planned (MINOR-GAP: 15 palette/8 файлов + raw-button; e2e-пакета нет). Plan authoritative. |
| 2026-08-28 | MINOR-цикл: статус-токены + ghost-Button + гард(11) + e2e fixture+spec(6); AC4-race найден и закрыт split'ом; 1×opus APPROVE-WITH-NOTES (4 fixed, 1 dispositioned); re-validation green. Status: ready-for-dev → review. |
| 2026-08-28 | Merged: PR #305 (`2ec7c7c5`, merge `feb35cfd`); targeted 84/84, полный пол **19 394/0** (floor 19 383 → 19 394, +11 exact), e2e 11✓+1skip ×2, lint 0/0, tsc 0, build 0 ×2, light+dark; cleanup 0/0/0. **Эпик 172: 9/17.** Status: review → done. **Lessons:** (1) TanStack mount-refetch на error-стейте глотает e2e-флип — не уходи с вкладки между flip и retry. (2) ui-Button замена row-button тянет дефолт px-4 — сверяй горизонталь с sibling-строками (px-0). (3) Форматтер ломает однострочные пины — считай token-вхождения, а не целые строки. |
