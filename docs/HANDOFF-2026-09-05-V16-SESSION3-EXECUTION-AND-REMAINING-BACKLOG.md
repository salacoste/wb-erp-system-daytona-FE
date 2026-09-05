# HANDOFF 2026-09-05 — Сессии-2/3 исполнены (P1 полностью, P2 волны 1-3) + полный оставшийся объём работ и технический долг

> **Аудитория**: агент-команда, продолжающая разработку (сессия-4). Этот документ = вход-точка.
> **Процесс-канон**: [`docs/ORCHESTRATOR-PROMPT-2026-09-03-V16-SESSION3-CONTINUATION-OMC.md`](ORCHESTRATOR-PROMPT-2026-09-03-V16-SESSION3-CONTINUATION-OMC.md) (петля §0, делегационная матрица §2, конвейер §5, стопы §8) — читать целиком.
> **Цепочка справочников**: [`HANDOFF-2026-09-03-V15-SESSION2-...`](HANDOFF-2026-09-03-V15-SESSION2-EXECUTION-AND-REMAINING-BACKLOG.md) (§3-каталоги, BE-история) → [`HANDOFF-2026-09-02-V14-DEBT-SESSION1-...`](HANDOFF-2026-09-02-V14-DEBT-SESSION1-EXECUTION-AND-REMAINING-BACKLOG.md) → [`HANDOFF-2026-09-02-FINAL-94-94-...`](HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md) §4/§8.
> **Приоритет при конфликте**: мини-план item'а > этот документ > V16-промпт > CLAUDE.md > предыдущие handoff'ы; **живые гейты — финальная инстанция**.

---

## 1. Сессии-2/3 (2026-09-02/05): 13 PR, всё merged, cleanup 0/0/0

| # | Item | PR / merge | Ключевое |
|---|---|---|---|
| 1 | D-1 (PB-1) silent cabinet-create | #390 / `56529ced` | nonce-mint + recovery alert; e2e true-pin; флор →19421 |
| 2 | D-2 → BE-стоп + request #230 | #391 / `36916754` | refresh-эндпоинта нет (на момент) |
| 3 | P2 /10-family ASB | #392 / `c21a571e` | solid-пары; эскалация /60-vs-/40 |
| 4 | P2 C13+C15 | #393 / `c4c7bf3c` | SR-дедуп; ScenarioUrgencyTier; флор →19424 |
| 5 | P2 boundary волна-1 (finsum ×11) | #394 / `d7205094` | 459→401; house-rule + харнесс-канон |
| 6 | P2 boundary волна-2 (Margin + D-4 fold-in) | #395 / `86fb550c` | 401→372; **живой AA-fail 4.19/4.42, скрытый аттестацией D-4** → /15→/5 + registry-коррекция |
| 7-8 | BE-пакет (handoff + аннекс контракта) | #396/#397 | PB-3 → CONTRACT-READY; 2 FE-хазарда |
| 9 | **D-2 (PB-3) реактивный 401-refresh** | #403 / `f772eee6` | interceptor (single-flight + каскад-гейт + replay-once + 10s-дедлайн); nonce-safe пративная ветка; opt-outs ×3; G4=12; e2e EXIT=0; **live-цепочка верифицирована**; флор →19436; 4 ревью-прохода |
| 10 | Handoff сессии-2 + V16-промпт | #398/#400 | документация передачи |
| 11 | owner-ок + live-статус D-2 | #401 | BE пересобран локально |
| 12 | **P2 волна-3 AA-quick-wins** | #404 / `afb2915f` | 19 тинт-миграций → **открытие: слоистая композитинг-модель** (over-card фальсифицирован); структурные ремедии (fg-on-tint/solid); хост-фолд-ины (2.79 — худший AA-сайт); флор →**19439**; 3 ревью-прохода |

Артефакты: `_bmad-output/implementation-artifacts/debt-{d1-pb1-silent-cabinet-create, p2-10-family-asb, p2-c13-c15-quality-wave, p2-boundary-wave1-finsum, p2-boundary-wave2-margin, d2-pb3-reactive-refresh, p2-wave3-aa-quickwins}.md`. **Артефакт волны-3 = актуальный WCAG-канон** (слоистая модель; APPEND-ноты в волны 1-2 уже внесены).

## 2. Живое состояние (main `afb2915f`, 2026-09-05)

- Vitest полный **≥ 19 439 / 0** · lint 0/0 · tsc 0 · build --webpack 0 · **boundary 372** (ratchet ↓ волнами; exceptions 3/3 — waterfall/PriceHistorySheet/FunnelTab, НЕ трогать) · docs 95 · locale 4 · lessons 0 · privacy = 3 pre-existing · parity терминальный
- Манифест 174.3: реген ТОЛЬКО `node scripts/run-story-174-3-state-evidence.mjs --owner-units`; pre-flight пинов — компоненты И consumer-тесты
- Окружение: Node **24.18.0** PATH-пин; PM2 `wb-repricer-frontend-dev` :3100; BE :3000 **healthy** (queue up; refresh-контракт live: 200/ротация/401 TOKEN_REVOKED — см. #230 ФИНАЛЬНАЯ)
- **`_ap8_*`-фантомы = гонка тест-фикстуры** (`anti-pattern-8-rule.test.ts` создаёт их во время suite; lint/tsc-кэши ловят) — лечится `rm .eslintcache tsconfig.tsbuildinfo` + перепрогон после suite; НЕ соседняя сессия
- Параллельные сессии реальны (PR #399/#402; уничтожение /tmp-worktree однажды) — WIP коммитить немедленно; чужое не трогать

## 3. Оставшийся объём работ — по приоритету

### 3.0 ⏭ СЛЕДУЮЩИЙ ITEM — P2 boundary волна-4: «компонентные семьи» (live-counts 2026-09-05)

Каталог-остаток после волн 1-3 (src/components = 142): `badges/SourceBadge.tsx` 16 · `jam/RequireJam.tsx` 13 · `AdvertisingEmptyState.tsx` 13 · `expense-chart-badge.tsx` 13 · `MissingCogsAlert.tsx` 12 · `ComparisonBadge.tsx` 6 · `analytics/FbsTrendsTooltip.tsx` 6 · `SidebarCabinetInfo.tsx` 7 · `ComparisonHelpers.tsx` 4 · `AllocatedMarker.tsx`/`TrendIndicator.tsx` ×2 · `DataSourceIndicator.tsx` 9 · `CogsSubRows`-хвосты... (полный live-скан: grep-команда в §5-точках входа; **каталог 174.2 дрейфует — всегда live-пересчёт**).
- Канон: волны 1-2 (маппинг по смыслу) + **волна-3 (слоистая модель — ОБЯЗАТЕЛЬНА: трассировать цепочку монтирования каждого сайта; харнесс `/tmp/p2-w3-aa-contrast.mjs` паттерн — стеки + worst-end)**; structural-ремедии когда база тонирована
- Ratchet ↓ 372 → ожидаемо ~290-300; baseline + CLAUDE.md тем же коммитом
- Consumer-тест-пины в свипе (44 тест-файла с legacy-пинами суммарно — идут со своими компонентами)

### 3.1 P2 boundary волна-5: lib-residue (src/lib = 210)

`backfill-utils` 21 · `efficiency-filter-config` 20 · `efficiency-utils` 18 · `coefficient-types` 15 · `profitability-utils` 12 · `fbs-analytics-utils` 12 · `campaign-utils` 11 · `sync-status-config` 10 · `orders-status-config` 10 · `two-level-pricing` 9 · `dimension-types` 6 · `unit-economics-formatters` 5 · хвост. Это exported class-maps (как W2a/W2b 174.2 — канон monitoring-constants/supply-planning-config). Chart-hex в lib (chart-colors, seasonal-localization, unit-economics-config hex, fbs-analytics-formatters, liquidity-*) — **НЕ трогать до C5-owner**.

### 3.2 P2 остальное

- **/80-sweep**: repo-wide `text-*/80` (3.2-3.45:1 исторические) — замер (слоистой моделью!) → solid/exception; кандидат расширения boundary-сканера
- **FE-D3**: `getErrorMessage` эхо сырого error.message → bounded fallback + scrub + тесты (behavior; tests-first)
- **FE-D1**: mutation retry:1 ретраит 4xx (WB-token PUT ×2; e2e пинит `putAttempts===2`) — behavior + e2e-пин update
- **FE-D5**: cross-tab create duplication → Web Locks API
- **FE-D8**: `getCabinetCreationOperation` middle-path — ТОЛЬКО по UX-жалобе, fresh-ревью
- **C8**: FunnelPageContent = 200 строк (следить при касании)
- **logger-redact архитектура**: ~84 `logger.error` вне logApiError → redact в `src/lib/logger.ts` покроет все (131 файл + 52 мока) — рекомендовано owner отдельной волной ПОСЛЕ boundary

### 3.3 P3 (по окну; быстрые owner-ответы см. §3.5)

harness restart-per-run раннер · FR-7 (reseed nmId 202867769 W26 ИЛИ re-pin 2 e2e) · AT-матрица · Manager-creds (~22 скипа) · docs-95 split · prettier md-долг (~1189) · ~25 route-гардов · pm2 delete 5.

### 3.4 BE-вопросы (вне FE-скоупа, мониторить)

- **Remote publish BE-ветки** (локально всё верифицировано; SEC-DOC-1 doc-sweep 11/10 тоже в ветке) → remote re-check после
- **Post-expiration recovery** (dedicated refresh-token/grace) — след. BE-этап; FE-расширение тривиально поверх D-2 interceptor'а (`api-client-refresh.ts`)

### 3.5 Owner-decision ledger (2026-09-05)

| Решение | Статус / рекомендация |
|---|---|
| **C5 chart-palette** (гейтит chart-hex трек ~50 сайтов: waterfall 11 hex + route-charts + lib-константы) | ⏳ варианты: categorical token-set (рекомендовано) / расширенные exceptions / отложить |
| **WCAG 1.4.11 valence-каналы** (НОВОЕ, волна-3: tint 1.07-1.21 / border 1.52-1.89 < 3:1 — валентность чипов после fg-on-tint миграций на суб-перцептивных каналах) | ⏳ дизайн-решение: ≥3:1-носитель (solid-бордер/иконка) или accept |
| financial-foreground токены | рекомендация: отложить (fg-on-tint закрывает; добавить при спросе на solid financial-чипы) |
| logger-redact волна | рекомендация: после boundary-волн |
| FR-7 / AT-матрица / Manager-creds / docs-95 / prettier-md / pm2-id5 | ⏳ P3 |

## 4. Реестр технического долга (полный, накопленный; детерминанты в артефактах)

**WCAG/a11y**: ~100 сиблинг-/10-сайтов repo-wide (owner-sweep семейство; волна-3-модель обязательна) · C13-класс ~20 таблиц (label≈caption SR-dup) · 1.4.11 valence (см. §3.5) · `TwoLevelPriceHeader:129` ₽/70-глиф (3.36 large-text-only) · `PctBadge colorClass` escape-hatch · MarginSlider /20-трек ≥3:1 (PASS, мониторить) · `getScenarioUrgencyColor` hex ≠ токены (production-dead; owner: удалить/привести) · /80-family (§3.2).
**Auth/сессии**: multi-tab proactive-race → logout (on-false re-read store; `FUTURE:`) · session-cooldown после failed refresh (`FUTURE:`) · `decodeJWT` padding-хрупкость (битый base64 → silent logout; FE-фикс-кандидат) · post-expiration recovery (BE-этап).
**Cabinet-create UX**: stale-settle не сбрасывает phase 'creating' (resubmission тихо no-op) · FE-D5 cross-tab CAS · FE-D8 middle-path.
**Процесс/инфра**: 44 legacy-пин тест-файлов (идут со своими волнами) · pinned scenarioId-титулы «error-colour» (не переименовывать до регена манифеста) · harness restart-per-run · BE login-троттл 5/ч · prettier md ~1189 · docs-95 · route-гарды ~25 · pm2-id5.

## 5. Канон исполнения (свод; полный — V16-промпт §2-§5 + §10-ловушки)

1. Петля §0 V16: bootstrap → выбор item'а → **105.2 pre-flight** (live-пересчёт; манифест-пины вкл. consumer-тесты) → занятость → мини-план → конвейер A–J → closeout (артефакт + registry-flip + baseline тем же PR) → cleanup 0/0/0.
2. **WCAG-модель волны-3 (действующий канон)**: слоистый композитинг over фактическим стеком монтирования (worst-end градиентов); bare-card — только с верифицированной цепочкой; structural-ремедии (fg-on-tint / solid-пары) когда база тонирована; **аттестации цитируют in-situ числа**; аттестация валидна только для замеренных пар (урок D-4) и только на замеренном стеке (урок волны-3).
3. Ревью: ≥2 прохода code-reviewer(opus) свежим контекстом; триггеры CLAUDE.md (>12/>5/novel/meta) → +проходы; findings APPLIED/DISPOSITIONED с evidence — оба в артефакт.
4. Гейты: §2 таблица; флор монотонен (сейчас 19439); boundary ratchet ↓; базлайны — тем же PR.
5. Делегация: механика → executor(sonnet); контраст-волны/behavior → executor(opus); числа — живыми прогонами; сабагенты не коммитят; ревьюер ≠ автор.

**Точки входа**: каталог boundary `shadcn-ui-boundary-classification-manifest.md` (+ live-скан grep из SESSION2-handoff §5) · debt-registry `shadcn-migration-status-and-debt-registry.md` · BE-контракт `request-backend/230-...md` (ANEX + ФИНАЛЬНАЯ) · артефакты волн (каноны) · гейты `CLAUDE.md` Accepted Baselines.

_Подготовлено оркестратором V15/V16 (сессии-2/3, 2026-09-02→05); факты сверены живыми прогонами на main `afb2915f`._
