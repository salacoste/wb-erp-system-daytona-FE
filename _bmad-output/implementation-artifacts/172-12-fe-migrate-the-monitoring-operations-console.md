# Story 172.12-FE: Migrate the Monitoring Operations Console

Status: done — PR #315 merged (`9498cb76`, commit `ef59a7cf`); **FULL-class MINOR** — 23 файла (22 M + 1 A гард, +352/−134): 74 legacy-palette + 20 hex + 2 raw-button → семантические токены по 19 компонентам/константам; heatmap STATUS-карта + LEGEND_ITEMS синхронизированы (recovered = color-mix-альфа — все зелёные делят один HSL-тройник, проверено в обеих темах); 2 конверсии ui-Button (type=button восстановлен); 10 тест-репинов; гард 10 (каталог 32 exact-array с честной dead-трио-аннотацией, per-key heatmap-пины, cross-file legend-sync пин); побочный a11y-фикс контраста тултипа; targeted 10/70; полный пол **19 433/0/1222** (floor 19 423 → +10 exact); e2e 11✓×2; 2 ревью-прохода; cleanup 0/0/0.

## Story

As an operator, I want `/monitoring` to keep heatmap, telegram health, recovery, completeness and report surfaces while the console completes its token migration (dark-mode-correct semantic colors).

Plan: `.omx/plans/172.12-migrate-the-monitoring-operations-console.md` (authoritative — branch `cdx/epic-172-story-12-monitoring`, worktree `/private/tmp/wb-repricer-fe-172-12-monitoring`).

## Acceptance Criteria

Per plan (canonical AC + execution checklist) — все закрыты. Severity-by-text/иконке сохранена; канонические состояния консоли не тронуты (презентационный слой).

## Tasks / Subtasks

- [x] Task 0: prerequisites (base `73174259` = origin/main после 172.11-closeout); carry-in: STATUS_COLORS из 172.11 — в forbidden src/lib, подтверждён carry-out (потребители /monitoring + /monitor).
- [x] Task 1: behavior lock — targeted baseline **9 файлов / 60 тестов / EXIT=0**; комплаенс: 19 файлов с legacy (74 palette + 20 hex + 3 rawbtn из 32 прод).
- [x] Task 2 (волна 1, executor sonnet): Telegram×3 + Heatmap×3 + каркас×4 — 12 файлов; девиации приняты (color-mix recovered — обосновано HSL-тройником; incidental text-white/border чистки).
- [x] Task 3 (волна 2, executor, умер по FailedToOpenSocket на финале): все 9 прод-файлов УСПЕЛ применить (проверено свипами 0/0/0); хвост-репин PipelineStatusGrid.test (3 ассерта) дочищен контролёром.
- [x] Task 4: гард 10 тестов (каталог 32 exact-array; no-palette/no-hex self-tested; per-key heatmap; legend-sync cross-file; severity-баннеры; completeness badge/bar; rate-bar тернарник; empty/page/telegram пины) — после pass-1-фиксов.
- [x] Task 5: валидация: targeted 10/70 EXIT=0; lint 0/0; tsc 0; max-lines OK; build --webpack EXIT=0; полный пол **СОЛО 19 433/0/1222 EXIT=0** (+10 exact); e2e 11✓ ×2 (до/после фиксов); diff --check чист.
- [x] Task 6: ревью ×2 (свежие opus): pass-1 APPROVE-WITH-NOTES (2 MEDIUM применены: legend-sync пин + per-key анкеры; LOW: type=button ×2 применён; dead-трио аннотировано по §5.2); pass-2 APPROVE-WITH-NOTES (4 LOW — carry-outs/acceptable; все pass-1-фиксы подтверждены).

## Dev Notes

- Floor: 19 423 → **19 433 (+10 exact)** = 10 гард-тестов; файлы 1221 → 1222.
- E2e-разложение: 11 = 3 setup + 2 orders + 6 monitoring; спеку не меняли (в отличие от 172.10/172.11 — здесь stale-ассертов не оказалось).
- Ключевая механика: все зелёные токены (chart-positive ≡ status-success ≡ chart-4) делят ОДИН HSL-тройник в обеих темах → «Восстановлено» обязан отличаться альфой (color-mix 60%), иначе легенда теряет смысл; потребители — inline-style, где var()/color-mix резолвятся.
- Побочный a11y-фикс: HeatmapTooltip slate-300/red-300 на белом popover был почти нечитаем — теперь muted-foreground/status-error.
- Сетевые смерти: волна-2 executor (FailedToOpenSocket после ~90% работы) — по уроку 21 проверено фактическое состояние свипами, хвост дочищен вручную; дешевле резюма.

### References

- [Source: plan `.omx/plans/172.12-migrate-the-monitoring-operations-console.md`]
- Каноны: ReportPendingBanner (баннеры), monitor-pipeline-utils (band-карта), MarginTrendChart/DailyBreakdownChart (recharts var()).

## Dev Agent Record

### Agent Model Used

- Implementation: 2× executor (sonnet; волна 2 умерла на финале — добита контролёром) + orchestrator-direct (гард, репин-хвост, фикс-раунды). Review: 2× code-reviewer (opus fresh) — оба APPROVE-WITH-NOTES.

### Post-1st-pass-review fixes (2026-08-28)

- **[MEDIUM APPLIED] Legend-sync пин**: heatmap-constants LEGEND_ITEMS ×7 закреплён (cross-file drift теперь RED).
- **[MEDIUM DISPOSITIONED→APPLIED частично] Dead-трио** (TelegramDetailPanel/Sections + use-telegram-health, 0 импортёров): аннотировано в каталоге гарда честной пометкой dead (§5.2 канон); удаление — carry-out.
- **[LOW APPLIED] Per-key анкеры** heatmap-пинов (голый token-матч спуфился recovered-строкой).
- **[LOW APPLIED] type="button"** восстановлен на обеих Button-конверсиях.

### Post-2nd-pass-review fixes (2026-08-28)

- Кодовых изменений нет: 4 LOW — cursor-pointer на чипах (консистентно со всеми Button приложения, acceptable), text-white статус-круги (pre-existing carry-out), role="listitem" на кнопках (pre-existing carry-out), дубль BOT_STATUS_CONFIG в dead-панели (immaterial пока dead).

### Debug Log References

- /tmp logs: `172.12-{baseline,w2test,w2tsc,guard,lint,maxlines,build,full,full2,fix1,fix2,e2e,e2e2,devserver*}.log`; диффы `172.12-review-diff{,-v2}.txt`.

### Completion Notes List

- Все численные claims pass-1 воспроизвёл своими прогонами (targeted/full/eslint); pass-2 подтвердил приземление всех фиксов + прогнал deep-checks A-E.
- src/lib/monitoring-constants.ts STATUS_COLORS не тронут (forbidden) — обновлены только inline-цвета route-файлов.

### Gaps

- Carry-outs: dead-трио удаление; STATUS_COLORS в src/lib (shared с /monitor); text-white статус-круги; role="listitem"-кнопки; cursor-pointer в общем Button-base. Visual light/dark + zoom — 174.3.

### File List

PR #315: commit `ef59a7cf` = **23 файла** (22 M + 1 A), +352/−134: гард NEW; M — CompletenessRow, data-completeness-constants, HealthHistoryChart, health-history-helpers, HealthReportSheet, HealthReportSheetBody, HealthScoreWidget, heatmap-constants, HeatmapCell, HeatmapTooltip, MonitoringEmptyState, MonitoringPageContent, PipelineHeatmap, PipelineStatusGrid, RecoveryPanel, RecoveryPanelSubcomponents, TelegramDetailPanel, TelegramDetailSections, TelegramStatusCard + тесты TelegramStatusCard/TelegramDetailSections/PipelineStatusGrid.

### Change Log

| Date | Change |
|---|---|
| 2026-08-28 | Story planned (FULL-класс: 74+20+3). Plan authoritative. |
| 2026-08-28 | Волны 1-2 + гард 10 + фиксы pass-1; 2×APPROVE-WITH-NOTES. Status: ready-for-dev → review. |
| 2026-08-28 | Merged: PR #315 (`ef59a7cf`, merge `9498cb76`); targeted 10/70, full **19 433/0/1222** (+10 exact), e2e 11✓×2, cleanup 0/0/0. **Эпик 172: 12/17.** Status: review → done. **Lessons:** (1) All greens share one HSL triple — distinct «recovered» REQUIRES alpha (color-mix), bare token collides with success. (2) Executor died at 90% (FailedToOpenSocket): sweep-verify actual state, finish the tail manually — cheaper than resume. (3) Cross-file literal mirrors (cell map vs LEGEND) need an explicit sync pin — claimed comments don't catch drift. |
