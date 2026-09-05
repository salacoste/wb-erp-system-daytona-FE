# P2 boundary-sweep волна-4: «компонентные семьи» (16 файлов, ~105 сайтов)

**Status**: done (2026-09-05, сессия-4 оркестратора V16; **PR #407**, merged; head `e55886b4` + artifact-commit)
**Branch**: `debt/p2-w4-component-families` (worktree `/private/tmp/p2-w4-families`, base main `60ce70f5`)
**Owner-track**: P2 boundary 372 owner-sweep, волна 4 (handoff SESSION3 §3.0; каноны: волны 1-3, волна-3 = слоистая композитинг-модель — действующий)

## Дефект (verified live, pre-flight)

Live-скан (regex'ами самого гейта): total raw 394 − 22 (3 зарегистрированных exception'а) = **372**; `src/components` = 142 / 21 файл. Каталог handoff'а дрейфовал: в остатке оказались не перечисленные там `expense-chart-config` 18 и `TrendGraph` 14; `ComparisonHelpers`/`CogsSubRows` уже чисты. Классификация по канону «chart-hex НЕ трогать до C5-owner»: **отложено 37** (TrendGraph 14, expense-chart-config 18, trend-graph-config 1, ExpenseChart 3, FbsTrendsChart 1); **волна-4 = 16 файлов / 105 сайтов** (16+13+13+13+12+9+7+6+6+2+2+1+1+1+1+2, вкл. 1 comment-phantom SummaryFooter:74 и 2 rgba в boxShadow SubcategoryTooltip:101).

## Tasks

- [x] Pre-flight: live-пересчёт + инвентарь совпадений по строкам + recon (explore sonnet: consumer-пины ~50 ассертов/6 файлов, import-closure с базами монтирования, токены globals.css, манифест-пины)
- [x] Волна (executor opus): 105/105 сайтов → семантические токены; харнесс волны-3 скопирован (`/tmp/p2-w4-contrast.mjs`), sanity-числа воспроизведены; каждый тинт-сайт замерен по слоистой модели (обе темы, worst-end градиентов)
- [x] Test sweep: 8 тест-файлов перепинены (~50 ассертов, вкл. 3 «внеслужебных» свободных regex-пина — урок F1 волны-1); титулы с мёртвыми классами переименованы (не манифест-sources — проверено)
- [x] Манифест 174.3: `FbsTrendsChart.test.tsx` (манифест-source) изменён ре-пином → **реген официальным раннером** `--owner-units` (оркестратор), EXIT=0 fail-closed; контракт-тесты 33/33
- [x] Ratchet: 372 → **267** (ровно −105); baseline + CLAUDE.md тем же коммитом
- [x] 3 ревью-прохода opus свежим контекстом (Trigger 2+3: кумулятив 14 > 12 на входе прохода-3; сходимость на проходе-3 = 5 ≤ 5)

## Маппинг-решения (канон-наследование + новые прецеденты волны)

1. **Наследовано** (волны 1-3): нейтральные gray→foreground/muted/border; money-direction → financial-* (TrendIndicator иконки, expense-chart-badge, ComparisonBadge); статусные тинты W2a + house rule ≥4.5 light с /10→/5 даунгрейдами; слоистая модель (worst-end градиентов, фактические стеки).
2. **purple → `status-pending`** (RequireJam/SidebarCabinetInfo tier-чипы, DataSourceIndicator «Аналитика»): токен существует (277° hue), семантика «не-fинальный источник».
3. **Hover-слой таблиц = часть стека бейджа** (НОВОЕ, pass-2): `ui/table.tsx:57 hover:bg-muted/50` — тинт-чипы в таблицах обязаны мериться и на hover-стеке. Поймано на SourceBadge blended: warn/5-текст над hover = **4.34 light FAIL** (= волновой-3 ANCHOR-2 класс). Чтение прецедента: ANCHOR-2 волны-3 был **исправлен** (GrossProfitSection → solid warning), не allowlist'ен → ремеди, не исключение.
4. **fg-on-tint для SourceBadge blended** (`text-foreground` на warn/5: 14.50/14.72 даже на hover-стеке; валентность = tint+border+label; паритет ComparisonBadge). Neutral/unknown opaque bg-muted — hover-иммунны.
5. **Solid-хост убивает композитинг**: MissingCogsAlert хостится solid-вариантом ui/alert → counter-чип `bg-card text-status-warning` (4.81/13.38) на всех монтированиях единообразно.
6. **Orphan-механика**: SubcategoryTooltip boxShadow rgba → `var(--shadow-card-hover)` (токен globals.css:100); contract-пин `var(--color-chart-tooltip*)` цел (10/10).
7. **Comment-phantom**: literal `text-amber-700` в комментарии SummaryFooter:74 — переформулирован (код был уже токенизирован).

## Dev Agent Record

### Post-1st-pass-review fixes (2026-09-05)

Findings (8: 2M/6L; VERDICT APPROVE-with-riders; ревьюер — независимый контраст-калькулятор, anchors 21.00/4.5422, все гейты перепрогнаны):
- **F1 [M]** TrendIndicator: 2 из 4 «монтирований» фиктивны (same-name локальные компоненты в buyout-table-cells/SneakPreview/SupplyDetail; bg-muted/warn-15 = ConfidenceBadge). **APPLIED**: комментарий → 2 реальных монтирования (card + gradient), worst finPos 4.49.
- **F2 [M]** ComparisonBadge: аттестации замерены над несуществующим градиентом (info/10→finPos/10 вместо success/10→card). **APPLIED**: полный реальный стек card>grad>badge-tint>fg; pos 12.45/12.60, neg 12.11/12.80; GRAD харнесса исправлен; old-fail 4.18→4.22; neg/5=4.57 marginal + симметрия валентности.
- **F3 [L]** AutoFillWarning не consumer MissingCogsAlert. **APPLIED** в артефакте (вычеркнут из перечисления).
- **F4 [L]** SourceBadge: ReconciliationTable = page background (7.85 dark), не card. **APPLIED**: базы в комментарии (внося впоследствии исправленную hover-аттестацию — см. pass-2 N1).
- **F5 [L]** счётчики отчёта исполнителя дрейфовали (~50 ре-пинов против 41). **APPLIED** в артефакте (корректные числа).
- **F6 [L]** RequireJam стекло: слой размытого preview-контента не смоделирован (worst-case over content 11.68/11.20 PASS). **APPLIED**: скоуп-нота (pass-3: числа помечены illustrative).
- **F7 [L/INFO]** SubcategoryTooltip: консолидация тени меняет визуал (1 слой вместо 2). **DISPOSITIONED**: принято проходом-1 (INFO), токен-консолидация задокументирована.
- **F8 [RIDER]** baseline/CLAUDE.md не снижены. **APPLIED** оркестратором в closeout (этот же PR).

### Post-2nd-pass-review fixes (2026-09-05)

Findings (6: 1M/5L; VERDICT APPROVE-with-riders; линза факты/атрибуции/сходимость; 376/376 ре-пин-тестов перепрогнаны):
- **N1 [M]** Ложная hover-аттестация SourceBadge (внесена фиксом F4!): blended warn/5 над hover-стеком = **4.34 light FAIL**; info 4.78/6.50 (не 6.78); success 4.61/7.80. **APPLIED**: remedy fg-on-tint для blended + re-pin теста + попеременная hover-аттестация; харнесс W4-A дополнен hover-строками (OLD 4.34 FAIL → REMEDY 14.50/14.72).
- **N2 [L]** TrendIndicator 4.92→4.93 (точное 4.9250) + латентная sentimentBg-ветка. **APPLIED** (число ветки уточнено на pass-3: 4.35→4.77/7.31).
- **N3 [L]** RequireJam чипы аттестованы только над чистым стеклом (кастомный previewContent не покрыт). **APPLIED**: скоуп-нота.
- **N4 [L]** ComparisonBadge: у семейства хостов и warn/error концы градиентов. **APPLIED**: hue-robust нота (fg ≥11 на каждом конце; подтверждено pass-3: 14.18/13.67/13.95 light).
- **N5 [L]** FbsTrendsLegend «~1.5» → 1.47/1.64. **APPLIED**.
- **N6 [L]** Мёртвые классы в титулaх тестов (DSI 3+3, MissingCogs 1). **APPLIED** (styling-титулы pass-2; border-титулы добиты pass-3 F1).

### Post-3rd-pass-review fixes (2026-09-05, сходимость)

Findings (5: 3M/2L; VERDICT APPROVE-with-riders; сходимость ≤5, CRITICAL/HIGH = 0; 38/38 файлов 748/748 тестов потребителя перепрогнаны):
- **F1 [M]** N6 применён частично: 3 border-титула DSI-теста с мёртвыми классами. **APPLIED**: переименованы.
- **F2 [M]** Число 4.35 (sentimentBg-ветка, из pass-2) невоспроизводимо; живой пересчёт оркестратора = **4.77 light / 7.31 dark**. **APPLIED**. (Урок: аттестация ревьюера — тоже гипотеза.)
- **F3 [M]** baseline 372→267 + CLAUDE.md. **APPLIED** в closeout (тем же коммитом).
- **F4 [L]** Числа скоуп-ноты RequireJam невоспроизводимы by construction. **APPLIED**: помечены illustrative.
- **F5 [L]** Остаточные palette-слова в титулaх (SourceBadge «indigo»/«amber», MissingCogs «amber»). **APPLIED**: переименованы.

**Trigger-учёт**: проход-1 = 8 (>5), проход-2 = 6 (>5), проход-3 = 5 (≤5 — сходимость); кумулятив 19. Trigger 3 (высокая плотность) → проход-3 обязателен — исполнен; Trigger 2 (кумулятив >12) → тот же проход-3. Trigger 4: стори НЕ codification-класс; числовые аттестации этого артефакта (счётчики находок, N-of-N) — **unaudited meta-claims** per Trigger 4 RECOMMENDED (квалификатор применён).

## File List

Modified (24 + 4): 16 × `src/components/custom/**` (SourceBadge, RequireJam, AdvertisingEmptyState, expense-chart-badge, MissingCogsAlert, DataSourceIndicator, SidebarCabinetInfo, ComparisonBadge, FbsTrendsTooltip, AllocatedMarker, TrendIndicator, AdvertisingDashboardWidget, FbsTrendsLegend, SummaryFooter, ScheduleVersionForm, SubcategoryTooltip) + 8 тест-файлов (SourceBadge.test, DataSourceIndicator.test, MissingCogsAlert.test, MetricCardEnhanced.test, epic65/BaseMetricCard.test, TrendsTooltip.test, FbsTrendsChart.test, SalesMetricCard.test) + `e2e/fixtures/story-174-3/execution-manifest.json` (MACHINE, раннер `--owner-units`) + `scripts/.shadcn-ui-boundary-baseline.txt` (372→267) + CLAUDE.md (boundary row) + этот артефакт + debt-registry (APPEND).

## Гейты (финальное состояние, живые прогоны)

vitest полный **19439/0** (×2: post-manifest + финальный после всех фикс-волн) · lint 0/0 (репо-уровень) · tsc 0 · build --webpack 0 · **boundary 267 = новый baseline (ratchet ↓ с 372 тем же PR)** · docs 95 exit 0 · locale 4 · lessons 0 · privacy pass (0 новых) · prettier на изменённых чисто · diff --check чист · контракт-тесты 174.3 33/33 · манифест реген раннером EXIT=0.

## Contrast-харнесс

`/tmp/p2-w4-contrast.mjs` (копия волны-3 + апгрейды: hover-стек строки W4-A, исправленный GRAD success/10→card W4-H, blended REMEDY-строки). Ключевые замеры: см. Маппинг-решения и комментарии в коде (все числа in-situ, обе темы, сверены тремя независимыми калькуляторами: исполнитель + ревьюер-1 + ревьюер-3/оркестратор).

## Follow-ups

1. **Волна-5 lib-residue** (handoff §3.1, 210 в src/lib) — следующий item.
2. Chart-hex в components (TrendGraph 14, expense-chart-config 18, хвосты 5) — ждут C5-owner.
3. WCAG 1.4.11 valence-каналы (owner-решение, handoff §3.5) — /20-borders волн 2-4 (1.30-1.73 light) в скоупе того трека.
4. Дефолтный Skeleton-preview в RequireJam: при появлении custom previewContent — перемерить (скоуп-нота в коде).

## Change Log

- 2026-09-05: Волна-4 исполнена конвейером A–J (executor opus + 3 фикс-волны оркестратора; 3 ревью-прохода opus свежим контекстом, все — с независимыми контраст-калькуляторами; манифест 174.3 регенерирован официальным раннером после ре-пина манифест-source теста). Boundary 372→267 (−105 ровно); флор 19439 не тронут.
  **Lessons:** (1) Same-name локальные компоненты фальсифицируют «монтирования» — верифицируй импорт-цепочку, не grep-имя. (2) Hover-слой таблиц — часть стека тинт-чипа: меряй бейджи таблиц и на hover-стеке, не только на card. (3) Аттестация ревьюера — тоже гипотеза: чужие числа верифицируй живым прогоном (4.35 → 4.77).
