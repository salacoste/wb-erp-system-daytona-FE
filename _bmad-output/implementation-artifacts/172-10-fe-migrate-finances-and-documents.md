# Story 172.10-FE: Migrate Finances and Documents

Status: done — feature PR #308 merged (`eb09f735`, commit `e1406cd2`); closeout PR #309 merged (`e6d05de4`, commit `de5519db`); **born-clean + absorbed parallel delta** — 10 файлов (6 M + 4 A, +558/−105): caption RTC-контракт, download-a11y (+сброс stale-фидбека при смене формата), categoryState loading/error, filtered-empty + reset, error.tsx boundary, DocumentsBody-extraction (max-lines), гард 10 тестов (каталог 8 exact-array), **e2e-спека ПОЧИНЕНА** (glob→RegExp query-фикс, bisect-доказанный pre-existing на main); targeted 6/46; полный пол **19 414/0/1220** (floor 19 394 → +20 exact); e2e **12 passed / 1 intentional manager-setup skip** (3 setup + 2 orders + 7 финансов passed); 3 ревью-прохода (все findings применены/диспозиц.); feature + closeout cleanup 0/0/0.

## Story

As a seller, I want the `/finances` route to keep balance summary, document filters, table, pagination, and downloads while the surface completes its token migration with every async state understandable.

Plan: `.omx/plans/172.10-migrate-finances-and-documents.md` (authoritative — branch `cdx/epic-172-story-10-finances`, worktree `/private/tmp/wb-repricer-fe-172-10-finances`).

## Acceptance Criteria

Canonical functional AC закрыт. A11y-контракты: accessible table (caption + scroll-контейнер), named downloads, pending status announcement, non-color document/status meaning. Live light/dark, width-matrix, 200% zoom, reduced-motion и real-SR evidence не перемаркированы как pass: это явный carry-out Story 174.3, зафиксированный в PR #308.

## Tasks / Subtasks

- [x] Task 0: prerequisites (base `65f8f9b3` → mid-flight main-advance `50d49e7f` = docs-only PR #307, нулевое пересечение); carry-in grep «172.10» — обязательных НЕТ.
- [x] Task 1: behavior lock — targeted baseline **4 файла / 26 тестов / EXIT=0** (`'src/app/(dashboard)/finances' src/lib/finances`); closure-предскан: замыкание = ровно route-дерево (finance-history / FinancialSummaryTable / SkuFinancialsTable — analytics-домен, импортов из /finances нет; подтверждено pass-1 BFS).
- [x] Task 2: pre-flight — **born-clean**: palette 0 / hex 0 / raw-button 0 по 6 route-файлам. Гэпы: caption (RTC), pending-announcement скачивания, гард, провенанс.
- [x] Task 3 (правки, orchestrator-direct MINOR): captionText-проп → условный TableCaption (171.9 канон; визуально снизу по mt-4 примитива) + page передаёт «Финансовые документы Wildberries»; sr-only role="status" «Скачивание документа…» + aria-hidden ×3 иконки; поведенческие тесты ×3 (caption ±, pending live-region через never-resolving MSW).
- [x] Task 4: гард (эталоны 172.9): каталог per-file + no-palette/no-hex (self-tested) + caption render-shape + download pins + destructive ×2 + AP#8 + tabular ×3 + padding-скоупинг.
- [x] Task 5: **ремонт e2e/finances.spec.ts** (bisect на stash-clean дереве: тот же фейл → pre-existing на main): (a) Playwright end-anchored globs `'**/v1/finances/documents'`/`categories` НИКОГДА не матчили request'ы с query (`?locale=ru&limit=…`) → таблица рендерила живые BE-документы вместо стабов → RegExp `/…documents(?:\?.*)?$/` (truth-table без коллизий с /categories и /download подтверждена ревью); (b) strict-mode violations: `getByText('Баланс кабинета')` = 2 элемента (subtitle!), `'Финансовые документы'` = 3 (+caption), `'Платёжное поручение 1'` = 11 (substring 10-19) → `{ exact: true }` + точные комментарии.
- [x] Task 6: **mid-flight коллизия + абсорбция**: параллельная сессия дописывала ЧУЖУЮ дельту внутрь стори-worktree (error.tsx boundary, categoryState, download success/failure-семантика `mutation.data === true/false` — проверено по хуку `useMutation<boolean>`, +75 строк юнит-тестов, 7-й e2e-тест filtered-empty+reset, расширение моего гарда). По решению владельца (AskUserQuestion): снапшот `/tmp/172.10-collision-snapshot/` → абсорбция → полный повторный конвейер на объединённом дереве: extraction DocumentsBody (объединённый DocumentsTable вышел за 200-эффективных), гард → каталог 8, валидация заново, ревью-pass 3 по объединённому диффу.
- [x] Task 7: валидация финальная (соло, без CPU-конкуренции): targeted 6/46; lint 0/0; tsc 0; max-lines OK; Prettier OK; `npm run build -- --webpack` EXIT=0 (70/70 static pages); стандартный Turbopack build — честный worktree-infrastructure gap до Story compilation из-за `node_modules` symlink за filesystem root, не pass; полный пол **19 414/0/1220 EXIT=0**; e2e npm-обёрткой **12 passed / 1 intentional skip**; `git diff --check` чист.

## Dev Notes

- Floor-арифметика: 19 394 → **19 414 (+20 exact)** = 10 source-contract guard tests + 10 behavior/error tests (DocumentsTable: +9 exact с учётом двух кейсов `it.each`; route error boundary: +1); файлы 1218 → 1220 (+гард, +error.test).
- E2e-разложение обёртки: 13 total = **12 passed + 1 intentional manager-setup skip**; passed = 3 setup + 2 orders + 7 финансов (6 починенных + 1 новый filtered-empty). BE login-троттл: 5 логинов израсходовано ровно (3 полных обёртки + 1 bisect + 1 финальная) — на пределе окна.
- Сетевой блэкаут api.github.com (~10 мин, тот же класс сбоя убил pass-3-агента на полпути — продолжен через SendMessage) — PR создан после восстановления.
- Фоновый полный пол одновременно с build+e2e дал «Timeout starting forks runner» ×8 (похоже на пропажу 8 файлов/70 тестов) — самопричинённая CPU-конкуренция, соло-прогон чист.

### References

- [Source: plan `.omx/plans/172.10-migrate-finances-and-documents.md`]
- Caption-канон: EvaluationHistoryTable.tsx (171.9); guard-канон: communications (172.9); truth-table регексов: pass-1 review.

## Dev Agent Record

### Agent Model Used

- Implementation: orchestrator-direct (MINOR born-clean + абсорбция) + параллельная сессия (дельта задачи 6). Review: 3× code-reviewer (opus fresh): pass-1 APPROVE-WITH-NOTES, pass-2 APPROVE-WITH-NOTES, pass-3 (объединённый дифф) APPROVE-WITH-NOTES.

### Post-1st-pass-review fixes (2026-08-28)

- **[LOW APPLIED] Guard catalog** → exact relative-path array equality (rename-fail, не endsWith-superstring); попутно пойман мой порядок сортировки ('page.tsx' после 'components/*').
- **[LOW APPLIED] Спек-комментарий** уточнён (какие именно строки содержат коллизии).
- **[LOW APPLIED] Untracked гард** — явный add в коммит-манифесте (процесс).
- **[LOW DISPOSITIONED] DocumentsTable 184/200** — extraction-таргет; РЕАЛИЗОВАН в задаче 6 (объединённый файл вышел за cap).
- **[LOW-conf DISPOSITIONED] SR-insertion live region** — репо-прецедент (WritebackStatus 172.9, MarginCalculationStatus); real-SR validation → 174.3.

### Post-2nd-pass-review fixes (2026-08-28)

- Кодовых изменений нет: **[LOW] extraction-таргет** (реализован позже в задаче 6), **[NIT ×2] double-sort** (оборонительный, оставлен) и pre-existing tautological assert (carry-out).

### Post-3rd-pass-review fixes (2026-08-28)

- **[MEDIUM APPLIED] Stale download feedback**: смена формата теперь вызывает `mutation.reset()` — видимый «Не удалось скачать»/sr-only «Документ скачан» не переживают переключение; +поведенческий тест-пин (pdf→XLSX гасит alert).
- **[LOW APPLIED] Guard header** 6→8 route prod files.
- **[LOW DISPOSITIONED] Category dead-end** (categories error при активном фильтре) — UX-affordance вопрос, carry-out.
- **[LOW DISPOSITIONED] error.tsx digest** не логируется — observability-nicety, carry-out (check:privacy-риск console).

### Debug Log References

- Финальные authoritative logs: `/tmp/172.10-final-full.log` (1,220 files / 19,414 passed / EXIT=0; исторический jsdom `Not implemented: navigation` diagnostic не был test failure) и `/tmp/172.10-mixed-e2e.log` (12 passed / 1 intentional skip / EXIT=0). Ранние `172.10-e2e.log` / `172.10-e2e2.log` содержат исправленные failures и являются debug history, не pass-evidence. Остальные /tmp logs: `172.10-{baseline,fix1,fix2,fix3,guard1,lint,tsc,maxlines,build,full,full2,mixed*,final-*,e2e,e2e2,e2e3,bisect,devserver*}.log`; диффы `172.10-review-diff.txt` (авторский) и `172.10-review-diff-v2.txt` (объединённый); коллизия: `/tmp/172.10-collision-snapshot/`.

### Completion Notes List

- Born-clean подтверждён pre-flight сканом + BFS-аудитом ревьюера pass-1 (замыкание = 6 файлов, analytics-компоненты корректно исключены).
- Параллельная дельта абсорбирована ПОЛНЫМ повторным конвейером (валидация + свежее ревью объединённого диффа) — ничего не пошло в merge непроверенным.
- e2e-спека была сломана на main ДО стори (два независимых класса: interception-промахи + strict-mode) — теперь детерминированна; живые BE-данные больше не утекают в стаб-тесты.
- Lifecycle: feature PR #308 (`e1406cd2` → `eb09f735`) и closeout PR #309 (`de5519db` → `e6d05de4`) merged; обе local/remote branches и remote-tracking refs отсутствуют; `/private/tmp/wb-repricer-fe-172-10-finances` отсутствует; `git worktree prune` выполнен, active Story 172.11 worktree не затронут.

### Gaps

- Live axe, light/dark скриншоты, width matrix, 200% zoom, keyboard/focus, reduced-motion и real-SR валидация — трек 174.3 (прецедент 172.4-172.8). Текущее evidence ограничено route/component tests, source-contract pins и E2E DOM assertions (caption, labels, named downloads, alert/status roles); это не переименовано в live visual/axe pass.
- Route-ledger `/finances` остаётся `planned` вместе со всеми ранее доставленными rows; полная 76-route status/evidence reconciliation — явный owner Story 174.1, однострочное исключение для 172.10 не создаётся.
- Carry-outs: category-dead-end affordance (pass-3), error.tsx digest logging (pass-3), tautological e2e assert (pass-2, строка ~231) — при следующем касании файлов.

### File List

PR #308: commit `e1406cd2` = **10 файлов** (6 M + 4 A), +558/−105:
- M `e2e/finances.spec.ts`
- M `src/app/(dashboard)/finances/page.tsx`
- M `src/app/(dashboard)/finances/components/DocumentDownloadButton.tsx`
- M `src/app/(dashboard)/finances/components/DocumentsFilters.tsx`
- M `src/app/(dashboard)/finances/components/DocumentsTable.tsx`
- M `src/app/(dashboard)/finances/components/__tests__/DocumentsTable.test.tsx`
- A `src/app/(dashboard)/finances/error.tsx`
- A `src/app/(dashboard)/finances/__tests__/error.test.tsx`
- A `src/app/(dashboard)/finances/components/DocumentsBody.tsx`
- A `src/app/(dashboard)/finances/__tests__/finances-presentation-source-contracts.test.ts`

### Change Log

| Date | Change |
|---|---|
| 2026-08-28 | Story planned (born-clean; гэпы = caption/pending/гард/e2e-репаир). Plan authoritative. |
| 2026-08-28 | MINOR-цикл: caption + pending-a11y + гард(9→10) + e2e-ремонт (glob→RegExp, exact-дизамбигуация); pass-1/2 APPROVE-WITH-NOTES. Mid-flight коллизия: параллельная сессия дописала дельту в worktree → снапшот + STOP + владелец выбрал абсорбцию. Status: ready-for-dev → review. |
| 2026-08-28 | Merged: feature PR #308 (`e1406cd2`, merge `eb09f735`) + closeout PR #309 (`de5519db`, merge `e6d05de4`); объединённый дифф: +categoryState/error-boundary/download-семантика/filtered-empty, DocumentsBody-extraction; targeted 6/46, full **19 414/0/1220** (+20 exact), e2e 12 passed + 1 intentional skip, 3 прохода (pass-3 MEDIUM применён); feature + closeout cleanup 0/0/0. **Эпик 172: 10/17.** Status: review → done. **Lessons:** (1) Playwright globs end-anchored — query URLs bypass stubs silently; RegExp routes fix; bisect proved pre-existing on main. (2) Concurrent session co-developed inside my worktree: snapshot, STOP, owner arbitration, then absorb + full re-validation. (3) Background full-suite racing build/e2e starves vitest forks (pool timeouts read as missing files) — run the floor solo. |
