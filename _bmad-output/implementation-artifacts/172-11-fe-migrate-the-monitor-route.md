# Story 172.11-FE: Migrate the Monitor Route

Status: done — PR #311 merged (`8b172445`, commit `d39ad37c`); **MINOR-GAP** — 14 файлов (13 M + 1 A гард, +213/−52): 18 legacy-palette классов + 9 hex-литералов → семантические токены (status-valence, chart-series/grid, muted-foreground, destructive, foreground); гейдж: band-хелпер hex→color CSS-var + style-prop stroke; weekly chart на recharts var()-идиоме; репины тестов на токены; гард 9 (каталог 14 exact-array по BFS-замыканию, мутационно-проверен ревьюером); **e2e legend-ассерт ПОЧИНЕН** (BD-22 rename #41 → strict-mode, bisect + git-археология доказали pre-existing); targeted 21/155; полный пол **19 423/0/1221** (floor 19 414 → +9 exact); 1×opus APPROVE-WITH-NOTES; cleanup 0/0/0.

## Story

As a seller, I want `/monitor` to keep KPI gauges, pipeline health, weekly trends and metric tables while the surface completes its token migration with dark-mode-correct semantic colors.

Plan: `.omx/plans/172.11-migrate-the-monitor-route.md` (authoritative — branch `cdx/epic-172-story-11-monitor`, worktree `/private/tmp/wb-repricer-fe-172-11-monitor`).

## Acceptance Criteria

Per plan (canonical AC + execution checklist) — все закрыты. Severity-by-text сохранена (bandLabel текстом + иконки + токены, не цветом-единообразно); канонические состояния (loading/empty/stale/partial/degraded/healthy/error) не тронуты — презентационный слой только.

## Tasks / Subtasks

- [x] Task 0: prerequisites (base `e6d05de4` = origin/main после closeout-PR #309); carry-in grep «172.11» — обязательных НЕТ.
- [x] Task 1: behavior lock — targeted baseline **20 файлов / 146 тестов / EXIT=0**; closure-предскан: BFS = 14 route-файлов (подтверждено ревьюером 1:1).
- [x] Task 2: pre-flight — **MINOR-GAP**: palette 18 (7 файлов) + hex 9 (band-хелпер ×4, gauge track, LINE_COLORS ×3, CartesianGrid; hex-скан BRE-промахом — дополнен ERE-свипом). 0 raw-button.
- [x] Task 3 (волна 1, executor sonnet): 7 прод + 3 тест-репина; отклонения D1 (var(--color-*) форма по прецеденту unit-economics-config/BrandShareChart) и D2 (gauge track вне инвентаря, в файле волны) — приняты; STOP-доклад о weekly-chart hex и lib STATUS_COLORS.
- [x] Task 4 (волна 2, orchestrator-direct после ConnectionRefused-смерти executor'а): LINE_COLORS → var(--color-chart-1/positive/status-warning); CartesianGrid → var(--color-chart-grid) (DailyBreakdownChart-идиома). Hex-ассертов в weekly-тестах не было.
- [x] Task 5: гард 9 тестов (каталог 14 exact-array — после самопойманного 15→14; no-palette/no-hex self-tested; band var-пины; banner-токен-счёт ×2; margin/delta валентность; chart series/grid; gauge style-идиома).
- [x] Task 6: **e2e-ремонт**: legend `/Продажи/` → exact (BD-22 rename #41 «Продажи + Возвраты» = 2 элемента; stash-bisect на чистом main воспроизвёл фейл + git-археология дат). Sidebar-nav флейк: passed clean-main bisect + warm `-g` retry 4/0 → load-зависимый, вне диффа.
- [x] Task 7: валидация: targeted 21/155 EXIT=0; lint 0/0; tsc 0; max-lines OK; build --webpack EXIT=0; полный пол **СОЛО 19 423/0/1221 EXIT=0** (+9 exact; урок 20 — без параллельных тяжёлых процессов); e2e по протоколу §7.13.

## Dev Notes

- Floor-арифметика: 19 414 → **19 423 (+9 exact)** = 9 гард-тестов; файлы 1220 → 1221 (+гард).
- E2e-окно логинов исчерпано 5/5 (4 прогона + bisect); аттестация full-suite e2e = repair-green + флейк-диспозиция по прецеденту 172.7 (cold-flake → warm).
- Токен-карта верифицирована ревьюером побайтово: `--chart-positive` ≡ `--status-success`, `--destructive` ≡ `--status-error` (light); `--chart-1` сохраняет синий интент #3B82F6.
- Executor-волна пережила 2 сетевых смерти (ConnectionRefused): волна 1 дошла, волна 2 умерла до правок → выполнена контролёром. Ревьюер тоже умирал — восстановлен SendMessage-резюмом из транскрипта.

### References

- [Source: plan `.omx/plans/172.11-migrate-the-monitor-route.md`]
- Идиомы: MarginTrendChart.tsx (recharts var()-атрибут), DailyBreakdownChart.tsx (chart-grid), ReportPendingBanner.tsx (warning-banner shape), unit-economics-config.ts (var(--color-*) форма).

## Dev Agent Record

### Agent Model Used

- Implementation: executor (sonnet, волна 1) + orchestrator-direct (волна 2, гард, e2e-ремонт). Review: 1× code-reviewer (opus fresh, восстановлен после ConnectionRefused) — APPROVE-WITH-NOTES.

### Post-1st-pass-review fixes (2026-08-28)

- **[LOW APPLIED] Гейдж-комментарий** переформулирован (style-prop = robustness-выбор для raw-SVG, НЕ «атрибуты не работают» — противоречил shipped-идиоме).
- **[LOW DISPOSITIONED] Attestation-пункты** (full/build/e2e не перезапущены ревьюером — троттл 5/5): записаны как author-attested с логами /tmp; arithmetic exact, blast radius = монитор-дерево.
- **[NIT ×2 DISPOSITIONED] visual-дельты** no-data/grid темнее hex-предшественников — dark-mode-корректно, флаг для 174.3 UX-матрицы; гард blind-spots by-design (комментарии, .jsx) — задокументировано.
- Открытый вопрос: pre-existing `null as any` в monitor-weekly-chart-tooltip.test.tsx:27 (файл вне диффа) — в debt-заметку.

### Debug Log References

- /tmp logs: `172.11-{baseline,w2-*,guard,guard2,lint,maxlines,build,full,e2e,e2e2,e2e3,e2e4,bisect,final,devserver}.log`; дифф `172.11-review-diff.txt`.

### Completion Notes List

- Замыкание 14/14 BFS ↔ гард-каталог 1:1 (ревьюер строил сам); переименованные экспорты (`hex`→`color`, LINE_COLORS) не имеют потребителей вне дерева (repo-wide grep).
- Hex-эрадикация полная по дереву (вкл. тесты/фикстуры) — двойное покрытие value-position hex (регекс + гейдж-вар-пин).

### Gaps

- STATUS_COLORS в forbidden `src/lib/monitoring-constants.ts` (shared с /monitoring) — carry-out → 172.12.
- Visual light/dark скриншоты, 200% zoom, reduced-motion — 174.3 (прецедент); DOM-evidence = гард-пины + e2e.
- BE login-троттл исчерпан — финальный full-suite e2e не перезапускался в этом окне (repair-green + warm-retry аттестация).

### File List

PR #311: commit `d39ad37c` = **14 файлов** (13 M + 1 A), +213/−52: гард NEW; M — e2e/monitor.spec.ts, MonitorBuyoutGauge/KpiCards/MetricsTable/PageContent/PipelineHealth/WeeklyChart.tsx, monitor-metrics-utils.ts, monitor-pipeline-utils.ts, monitor-weekly-chart-utils.ts, тесты MetricsTable/metrics-utils/pipeline-utils.

### Change Log

| Date | Change |
|---|---|
| 2026-08-28 | Story planned (MINOR-GAP 18+9). Plan authoritative. |
| 2026-08-28 | Волна 1 (executor) + волна 2 (orchestrator после смерти executor) + гард 9 + e2e-ремонт; 1×opus APPROVE-WITH-NOTES (LOW-комментарий применён). Status: ready-for-dev → review. |
| 2026-08-28 | Merged: PR #311 (`d39ad37c`, merge `8b172445`); targeted 21/155, full **19 423/0/1221** (+9 exact), e2e repair-green + флейк-диспозиция, cleanup 0/0/0 (local -D обоснован ancestor-проверкой). **Эпик 172: 11/17.** Status: review → done. **Lessons:** (1) Stale e2e specs bite again: grep spec asserts vs current labels before cycles — BD-22 rename made /Продажи/ ambiguous. (2) recharts stroke="var()" attribute is shipped canon; style-prop for raw SVG only — don't overgeneralize in comments. (3) Load-order e2e flake: classify via clean-main bisect + warm retry before chasing. |
