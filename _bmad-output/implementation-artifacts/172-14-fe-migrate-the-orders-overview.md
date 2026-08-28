# Story 172.14-FE: Migrate the Orders Overview (owner-story)

Status: done — PR #319 merged (`4b988aae`, commit `4213dbfd`); **FULL-класс, owner-стори** — 30 файлов (29 M + 1 A гард, +350/−132): статус-бейдж токен-карты (Supplier 4; Operational 7, SHIPPED → **status-pending** фиолетовый нативный hue-277; ASSEMBLED/PACKED альфа-тиры /10-/15; RETURNED muted); WB-vs-local различение = pending/muted; analytics-семейство; 4 raw-button → ui-Button (type=button, дефолты нейтрализованы); ~50 тест-репинов + **зеркало теста заменено импортом реальной lib-функции** (pass-2 finding #1 — suite сертифицирует прод навсегда); гард 8 (dual-root каталог 6+55=61 exact-array с исключением fbo/integrity); targeted 27/995; полный пол **19 447/0/1224** (floor 19 439 → +8 exact); e2e 7✓×2; 2 ревью-прохода; cross-restraint верифицирован (0 импортов семейства из fbo/integrity); cleanup 0/0/0.

## Story

As a seller, I want the orders overview (filters, table, history timelines, analytics widgets) to keep its behavior while the shared orders family completes its token migration — как owner-prerequisite для 172.15 (FBO) и 172.16 (integrity).

Plan: `.omx/plans/172.14-migrate-the-orders-overview.md` (authoritative — branch `cdx/epic-172-story-14-orders`, worktree `/private/tmp/wb-repricer-fe-172-14-orders`).

## Acceptance Criteria

Per plan — все закрыты. Поведение/RU-строки/ARIA заморожены; F-49 enum-fallback'и не тронуты.

## Tasks / Subtasks

- [x] Task 0: prerequisites (base `b2085290`); registry §5 — owner-prerequisite для 172.15/172.16 (sequencing, не внешний блокер).
- [x] Task 1: baseline **26 файлов / 987 тестов / EXIT=0**; комплаенс: 21 прод-файл с legacy (~50 классов) + 4 rawbtn + ~110 цвет-ассертов в 10 тест-файлах; route-локальные 6 файлов ЧИСТЫ (вся грязь — shared-семейство).
- [x] Task 2 (волна 1, executor sonnet): badges + timeline + 12 прод + 6 тестов; выведена полная status→token карта; девиации: WbStatusBadge.test 31 lib-passthrough ассерт оставлен (lib forbidden); OrdersTable.test 4 downstream-репина (fix-block propagation).
- [x] Task 3 (волна 2, тот же executor): PART A — purple→**status-pending** (оркестраторское решение по находке executor'а: в теме есть нативный фиолетовый hue-277) вместо information/15-обхода; PART B — analytics + row/empty/error + 4 Button-конверсии.
- [x] Task 4: гард 8 (dual-root 61 exact-array; fbo/integrity exclusion — пойман моей же ошибкой рекурсивной энумерации до фикса).
- [x] Task 5: валидация: targeted 27/995; lint 0/0; tsc 0; max-lines OK; build 0; полный пол **СОЛО 19 447/0/1224** (+8 exact); e2e 7✓×2 (финальное состояние).
- [x] Task 6: ревью ×2 (opus fresh): pass-1 APPROVE-WITH-NOTES (**MEDIUM: lib-mirror drift** в AtRiskOrdersCard.test — зеркало мигрировано, прод рендерит lib-легаси → тест сертифицировал несуществующие цвета; починено реверсом + disclosure); pass-2 APPROVE-WITH-NOTES (фиксы байт-верифицированы; finding #1 применён: зеркало → импорт реальной lib-функции).

## Dev Notes

- Floor: 19 439 → **19 447 (+8 exact)** = 8 гард-тестов; файлы 1223 → 1224.
- Cross-restraint: fbo/integrity НЕ импортируют shared-семейство (0 hits, проверено ревьюером) — 172.15/172.16 получат уже мигрированное семейство.
- Lib-passthrough residue (задокументировано): wb-status-data-{core,delivery,returns} (WbStatusBadge.test 31 ассерт) + analytics-utils getSlaStatusColor (6) + getConfirmation/CompletionTimeColor (14) + getCountdownColor (теперь через импорт, не зеркало) — lib-wave carry-out.
- Токен-находка сессии: `--status-pending` (hue 277) — нативный фиолетовый; SHIPPED/wb_native мигрированы на него во 2-й волне (волна 1 успела поставить information/15-обход — заменено).
- E2e-разложение: 7 = 3 setup + 2 orders + 2 accessibility (обёртка дедупит orders.spec).

### References

- [Source: plan `.omx/plans/172.14-migrate-the-orders-overview.md`]
- Каноны: ReportPendingBanner; ui/button.tsx cva-дефолты (каждый override сверен ревьюером).

## Dev Agent Record

### Agent Model Used

- Implementation: 2× executor (sonnet, один агент обе волны) + orchestrator-direct (гард, pass-1/2 фиксы). Review: 2× code-reviewer (opus fresh) — оба APPROVE-WITH-NOTES.

### Post-1st-pass-review fixes (2026-08-29)

- **[MEDIUM APPLIED] Lib-mirror drift**: AtRiskOrdersCard.test getCountdownColorClass реверсирован к lib-значениям (red/orange/yellow/gray-600) + residue-комментарий; 4 связанных ассерта репинены (тир-арифметика: 3мин→orange).
- **[LOW APPLIED] AtRiskOrderRow**: whitespace-normal + hover:text-foreground (нейтрализация outline-варианта); role="button" снят (Button нативно даёт роль).
- **[LOW APPLIED] Local-dot комментарии** ×3 (status-vs-source семантика в local-only видах).
- **[LOW APPLIED] Hex-concat комментарий** переформулирован (ложное обоснование снято).
- **[LOW DISPOSITIONED] WB timeline lib-легаси** — residue-ledger.

### Post-2nd-pass-review fixes (2026-08-29)

- **[LOW APPLIED] Mirror → импорт**: локальное зеркало УДАЛЕНО, тест импортирует реальную `getCountdownColor` из `@/lib/analytics-utils` — desync-класс устранён навсегда (запрет lib = на правку, не на импорт в тестах).
- **[LOW ×3 DISPOSITIONED] ASSEMBLED/PACKED альфа-_only**, OrderSyncStatus tier-коллапс (лейблы несут различие), pre-existing tautological hover-тест (future re-pin).

### Debug Log References

- /tmp logs: `172.14-{baseline,guard,lint,tsc,maxlines,build,full,final-*,e2e,e2e2,fix1,devserver*}.log`; диффы `172.14-review-diff{,-v2}.txt`.

### Completion Notes List

- Pass-2 байт-диффицировал зеркало с lib (MIRROR-CLASS-VALUES-IDENTICAL) и каждый Button-override с cva — «комментарии не врут».
- Позитив контраста: WbStatusBadge tooltip green-400-на-белом (~3:1) → токен (AA в обеих темах).

### Gaps

- Lib-wave carry-out: wb-status-data-* + analytics-utils цвето-хелперы (владелец — будущая lib-стория/174.x). Visual light/dark + zoom — 174.3.

### File List

PR #319: commit `4213dbfd` = **30 файлов** (29 M + 1 A), +350/−132: гард NEW; M — OrderStatusBadge, OperationalStatusBadge, Orders{RowHelpers,TableRow,EmptyState,ErrorBoundary}, LocalHistoryEntryItem, WbHistoryTabParts, FullHistoryTab, timeline/{WbStatusBadge,HistoryEntryCard,HistorySourceBadge,LocalTimelineHelpers,LocalTimelineEntry,WbTimelineEntry,TimelineSummary}, analytics/{AtRiskOrdersCard,AtRiskOrderRow,SlaComplianceWidget,VelocityWidgetParts,VolumeMetricsWidget,OrderSyncStatus} + тесты {OrderStatusBadge,OperationalStatusBadge,DurationDisplay,HistoryTimeline,AtRiskOrdersCard,SlaCompliance,OrdersTable}.

### Change Log

| Date | Change |
|---|---|
| 2026-08-29 | Story planned (FULL owner-story; baseline 26/987). Plan authoritative. |
| 2026-08-29 | Волны 1-2 + status-pending-апгрейд + гард 8 + 2×APPROVE-WITH-NOTES (MEDIUM mirror-drift починен). Status: ready-for-dev → review. |
| 2026-08-29 | Merged: PR #319 (`4213dbfd`, merge `4b988aae`); targeted 27/995, full **19 447/0/1224** (+8 exact), e2e 7×2, cleanup 0/0/0. **Эпик 172: 14/17.** Status: review → done. **Lessons:** (1) Test-local mirrors of lib color fns must import the real fn — migrated mirrors certify colors the UI never renders. (2) The theme HAS a native purple --status-pending (hue 277) — grep the full token list before alpha-tier workarounds. (3) Owner-story cross-restraint = verify sibling trees import NOTHING from your surface (0-import proof beats caution). |
