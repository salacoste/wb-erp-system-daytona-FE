# Story 172.5-FE: Migrate Single-Product COGS Management

Status: done — PR #287 merged (`4e86272b`, commit `66ae4f09`); FULL-lite (owner-координация) — 24 файла (23 M + гард, +250/−105); **3 ревью-прохода** (Trigger-3 эскалация: pass-1 REQUEST-CHANGES HIGH; pass-2 REJECT 2×HIGH; pass-3 **APPROVE** с независимым 28-файловым closure-аудитом); targeted 8/54; полный пол **19 327/0** (floor 19 319 → 19 327, +8); e2e 23✓ + 2 cold-flake (172.7); cleanup 0/0/0.

## Story

As a seller, I want `/cogs` to keep product discovery, single COGS add/edit/delete, coverage state and margin feedback while the whole surface moves onto semantic tokens.

Plan: `.omx/plans/172.5-migrate-single-product-cogs-management.md` (authoritative — branch `cdx/epic-172-story-5-cogs`, worktree `/private/tmp/wb-repricer-fe-172-5-cogs`). Owner-координация (registry §5: «172.5 — owner COGS»): оркестратор = owner-исполнитель, внешних блокеров нет.

## Acceptance Criteria

Per plan (canonical AC + execution checklist) — все закрыты.

## Tasks / Subtasks

- [x] Task 0: prerequisites (base `dfabf8e7`); carry-in grep «172.5» — обязательных НЕТ.
- [x] Task 1: behavior lock — targeted baseline **7 файлов / 46 тестов / EXIT=0**.
- [x] Task 2: pre-flight — owned = /cogs page + ProductList-семья + SingleCogsForm-семья + Cogs-диалоги + margin-ячейки; bulk/history/price-calculator = 172.6/7/8 (исключены). Долг: **~80 palette-строк / 15 файлов волны** (позже +4 транзитивных). Hex 0, py-6 0.
- [x] Task 3: **волна executor'а** (16 файлов, канон-таблица) + оркестраторские доправки по итогам ревью (см. Post-pass-разделы).
- [x] Task 4: гард 8 тестов — каталог **21 root-файл** (readability-pinned) + tree-сканы (single-cogs/product-margin-cell/products) + пины (missing-state solid/tint, margin-valence, selected-row, form-status, scope bulk/history/price-calc эксклюзии).
- [x] Task 5: 11 точных re-pin'ов (MissingDataReasonDisplay ×1; **wave-external** `custom/__tests__/CogsCoverageMetricCard ×3 + CogsMissingState ×4` — найдены ПОЛНЫМ прогоном после волны; HistoricalMarginContext ×3 — по ревью).
- [x] Task 6: валидация + 3 ревью + PR #287 + cleanup 0/0/0.

## Dev Notes

- Baselines: targeted 7/46 → **8/54**; полный пол **19 327/0** (+8 гардов). Счёт стабилен между проходами (правки color-only).
- **E2E cold-flake класс (172.7-территория)**: 2 history-теста упали на cold-worktree-dev (nav visibility, 10s timeout) → ретрай на ветке 6/0 + бисект на чистом main 6/0 → флейк компиляции, не регрессия.

### References

- [Source: plan `.omx/plans/172.5-migrate-single-product-cogs-management.md`]
- Канон-идиомы: 171.6 badge-tint; destructive-формы (TariffFieldInput/ui-input); storage=text-chart-2; skeleton=TrendsChartSkeleton (bg-muted/bg-border).

## Dev Agent Record

### Agent Model Used

- Implementation: 1 executor-волна (sonnet, 16 файлов) + оркестратор (re-pin'ы, гард, ревью-фиксы). Review: 3× code-reviewer (opus fresh): REQUEST-CHANGES → REJECT → **APPROVE**.

### Post-1st-pass-review fixes (2026-08-27)

- **[HIGH] HistoricalMarginContext.tsx** — 4 живые legacy-строки (рендер на /cogs через margin-cell NO_SALES_DATA ветку; гард был слеп): → muted/success/error + 3 re-pin'а + в каталог.
- **[MEDIUM] CogsMissingState.tsx** — полу-мигрирован (кониг мигрирован, компонент нет): 9 строк (tooltip ×2, skeleton ×7) → muted/bg-muted/bg-border/bg-muted-foreground/30 + в каталог.
- Диспозиции LOW: warning/info коллапс тонов (badgeText+variant различают) — документировано; hover /80; help-card иерархия.

### Post-2nd-pass-review fixes (2026-08-27)

- **[HIGH×2] Транзитивный аудит ревьюера**: (a) **MarginCalculationStatus.tsx** — 5 blue-строк, ЖИВОЙ на /cogs в polling-ветке SingleCogsFormStatus (core COGS→margin цикл стори!) → information-идиома; (b) **ResizableTableHead.tsx** grip — 4 gray-строки на каждом хедере продуктовой таблицы → hover:bg-muted active:bg-muted/80 text-muted-foreground hover:text-foreground. Оба в каталог.
- **[MEDIUM] Каталог**: + useProductListHandlers.ts (живой closure, чист, пин от дрейфа); комментарий reachability переписан честно (CogsMissingState = dead-code-pinned, цепь импортов проверена); test-name 16→21.

### Post-3rd-pass-review (2026-08-27)

- **APPROVE** — 0 блокирующих; 3 LOW = closeout-букинг (внесены сюда): (1) CogsCoverageMetricCard — scope-note: рендерится на /dashboard, но явно в owned-list плана («COGS/margin cells») — family-complete пин; (2) warning/info консолидация — см. выше; (3) build прогнан до пасс-2-фиксов — фиксы механически className-only, tsc/eslint/vitest пост-фикс зелёные.

### Debug Log References

- /tmp logs: `172.5-{baseline,postwave,targeted,lint*,tsc,build,full..full4,e2e,e2e-main,e2e-retry,guard,fix1,fix2,hooks,repin,review-diff}.log`.

### Completion Notes List

- Полный пол поймал wave-external пины (`custom/__tests__/`) — урок 172.1 сработал как страховочная сеть (таргет-паттерны их не покрывали).
- E2E-обёртка: 23 passed по cogs-assignment/cogs-pages; 2 history-флейка задокументированы ретраем+бисектом.
- Визуал light/dark не снят (BE login-троттл исчерпан e2e-сетапами; обёртка отвергает --no-deps) — покрытие: 23 e2e на реальном UI + оба новых живых файла на information/muted-идиомах, валидированных dark в 172.1-172.4. Явный gap.

### Gaps

- Live-скриншоты /cogs light/dark (троттл); 200% zoom / reduced-motion — трек 174.3.
- Build после пасс-2-фиксов не перепрогнан (className-only; см. Post-3rd).

### File List

PR #287: commit `66ae4f09` = **24 файла** (23 M + 1 A гард), +250/−105.

### Change Log

| Date | Change |
|---|---|
| 2026-08-27 | Story planned (FULL-lite: ~80 строк / 15 файлов + транзитивы). Plan authoritative. |
| 2026-08-27 | Волна(16) + гард(8) + 11 re-pin; полный пол вскрыл wave-external пины; 3 ревью-прохода (2×блокеры → APPROVE, независимый closure-аудит 28 файлов palette-clean). Status: ready-for-dev → review. |
| 2026-08-27 | Merged: PR #287 (`66ae4f09`, merge `4e86272b`); targeted 8/54, full **19 327/0**, e2e 23✓/2 cold-flake (бисект), cleanup 0/0/0. **Эпик 172: 5/17.** Status: review → done. **Lessons:** (1) Import-closure аудит обязателен в ревью палитровой стори: пинай все живые файлы замыкания, не только direct-owned. (2) Гард каталог-пинит и dead-code (от дрейфа), но комментарий обязан честно маркировать dead vs live. (3) Полный пол после волны — страховка от пинов вне targeted-паттернов (снова сработало). |
