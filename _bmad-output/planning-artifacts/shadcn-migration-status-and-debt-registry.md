# Shadcn Full-UI Migration — Status & Debt Registry

> **Snapshot date: 2026-08-23** (W9 + Story 169.9 corrective closeout). Канонический статус-реестр программы миграции
> для BMAD-артефактов. Живая история — sprint-status.yaml (по-сторийно) и ledger
> BE-репо (docs/tech-debt/TECH-DEBT-2026-08-SESSION.md, Addendum-4 cont.1-25);
> этот файл = консолидированный срез «что сделано / что осталось / все долги».
> Обновлять в конце каждой orchestrator-сессии.

## 1. Execution status (по эпикам)

| Epic | Stories | Done | Остаток | Статус |
| --- | --- | --- | --- | --- |
| 166-FE foundation | 8 | 8 | — | **CLOSED** (токены, примитивы, композиции, контракты) |
| 167-FE AppShell/auth | 9 (с merge'ами) | 9 | — | **CLOSED** (freeze-8, W1) |
| 168-FE analytics core | 11 | 11 | — | **CLOSED** (hub + 10 маршрутов; 168.2-168.11 orchestrator-волной) |
| 169-FE operational analytics | 13 | **10** | 169.11-169.13 | **IN PROGRESS** (acquiring ×3 + buyout ×2 + fbs ×2 + funnel + gaps + liquidity) |
| 170-FE | 7 | 0 | 170.1-7 | backlog |
| 171-FE | 9 | 0 | 171.1-9 | backlog |
| 172-FE | 17 | 0 | 172.1-17 | backlog (см. owner-заметки §5) |
| 173-FE | 13 | 0 | 173.1-13 | backlog |
| 174-FE консолидация | 5 | 0 | 174.1-5 | финал (СТРОГО после 166-173; 174.2 design-system/source-boundary/contrast; 174.3 visual/a11y; 174.4 functional/backend) |

**Story readiness: 38 of 92 canonical Stories complete.** Волна 22-23.08: 169.8 funnel
(ADOPTION параллельного staged-WIP; PRs #207/#208), 169.9 gaps (полный цикл; PRs #210/#211),
169.10 liquidity (полный цикл + REQUEST-CHANGES-фиксы; PRs #212/#214; между ними параллельная
сессия влила corrective PR #213 gaps-followup). Параллельная сессия также закрыла docs-реконсиляцию #209.

**NEXT = 169.11 returns analytics** (`backlog`; план `.omx/plans/169.11-migrate-returns-analytics.md`).
Его канонические prerequisites: Epic 166, Story 167.1 и Story 168.1 / C2; Story 169.10 не является
prerequisite для 169.11. Пол vitest **18 952/0**; Story 169.9 corrective: **7 files / 55 tests**;
production build: **70/70** static pages. Browser/theme/responsive/axe/keyboard/visual evidence
остаётся carry-out 174.3; credentialed functional E2E, auth/session/error-recovery и local-backend
critical journeys остаются carry-out 174.4.

## 2. Верификационные факты (2026-08-23, W9 + frontend corrective closeout)

- Fresh frontend evidence: PR #213 implementation `e738dd80`, merge `5c6950f3`; merge parents
  `0245f52b e738dd80`; route 55/55, full Vitest 18 952/18 952, build 70/70, final two reviews
  `APPROVE`, implementation branch/remote/worktree cleanup proven.
- FE base observed by this docs reconciliation: origin/main `94e059b6` (OpenWiki refresh over PR #215);
  the docs PR must be rebased/reconciled again if origin/main advances before commit.
- Protected WIP ref (НЕ трогать): `wip/cogs-split-supplies-csv-20260822` remains
  `643c65b41a183549fd299e782d36b41c1159d226`.
- Carried W9 evidence, **not revalidated by this frontend documentation follow-up**: BE main
  `58e1a0a77`, BE jest 13 170/0, PM2 services online, and Docker postgres/redis/mindsdb/prophet up.

## 3. Полный долг-реестр

### 3.1 FE-debt (по триггерам; 174.2 принимает только применимые design-system/source-boundary долги)

| ID | Суть | Триггер/фикс |
| --- | --- | --- |
| FE-D1 | mutations retry:1 ретраит 4xx (WB-токен PUT ×2; e2e пинит putAttempts===2) | behavior-change ОТДЕЛЬНО (full vitest + e2e; обновить e2e-пин) |
| FE-D2 | WbTokenBanner dead code 0 importers | ближайшая FE-story или 174.2 |
| FE-D3 | getErrorMessage эхо сырого error.message юзеру | при касании apiClient/error-пути; scrub/truncate |
| FE-D5 | cross-tab create duplication (нет CAS) | fast-follow Web Locks API |
| FE-D6 | ExportConfigForm дубль ExportDialogForm (dead) | ближайшая чистка или 174.2 |
| FE-D8 | getCabinetCreationOperation middle-path (юзер висит в SAFE_RECONCILIATION) | по UX-жалобе; НЕ менять без fresh-ревью |
| FE-D9 | logApiError логирует non-2xx тела (вкл. plaintext password /register) | БЛИЖАЙШАЯ FE-story трогающая apiClient; redact + isPasswordPolicyError → API-owner |

### 3.2 Волновые carry-outs (от маршрутных миграций 168.10-169.10)

| ID | Суть | Файл | Фикс |
| --- | --- | --- | --- |
| C1 | 4 tooltip-контейнера bg-white (dark-дефект) | dashboard ExpenseChartTooltip/PatternTooltip/StatusTooltip | ближайшая dashboard-стори; bg-popover канон |
| C2 | MarginDisplay legacy-палитра (gray/green/red-600) | components/custom/MarginDisplay.tsx | ближайшая dashboard-стори или sweep; sign→financial, zero→muted |
| C3 | dead exports getProfitabilityColor/BgClass (0 прод-консьюмеров) | lib/unit-economics-config.ts | 174.x sweep (вместе с FE-D2/D6) |
| C4 | getHealthScoreInfo hex+bgColor без прод-консьюмеров | lib/unit-economics-analysis.ts | тот же 174.x sweep |
| C5 | waterfall double-color-source (utils green vs config blue) | unit-economics-utils vs waterfall-chart-config | debt-ID при касании waterfall; решить канон-источник |
| C6 | date-cells tabular-nums отсутствует во всех 3 acquiring-таблицах | acquiring/** | 174.x tree-wide sweep (НЕ пер-роутный фикс) |
| C7 | e2e-комментарий «amber rate-limit banner» устарел | e2e/acquiring.spec.ts:130 | при следующем касании спеки |
| C8 | FunnelPageContent находится ровно на source cap 200 строк | analytics/funnel/FunnelPageContent.tsx | вынести sync/toolbar block при первом следующем касании |
| C9 | Browser/theme/responsive/axe/keyboard/visual matrix 169.8-169.10 не выполнена | analytics/funnel + gaps + liquidity | обязательный consolidated evidence pass в 174.3 |
| C10 | KPI-icon canon Funnel semantic (owner 22.08), а 169.6/169.7 muted | analytics/funnel + fbs routes | свести к одному owner-canon в 174.2 (semantика = целевой) |
| C11 | Cold-cache Funnel Vitest один раз дал 12 failures, warm/full runs стабильны | analytics/funnel tests | расследовать только при повторном воспроизведении; не считать текущим functional failure |
| C12 | GapsPageContent suites частично дублируются: route-level содержит 6 базовых composition checks, components-level дополнительно владеет corrective state/lifecycle regressions | analytics/gaps | консолидировать без потери corrective coverage в отдельном debt-pass |
| C13 | GapsTable: caption + scroll-aria-label дублируют смысл таблицы | analytics/gaps/GapsTable.tsx | опциональная дедупликация (P1-LOW) |
| C14 | Gaps pure-digit hex guard исправлен в PR #213; остальные route guards ещё требуют owner-sweep | presentation-source-contracts tests outside analytics/gaps | при касании route-owner или применимый 174.2 source-boundary sweep; не переписывать ticket refs |
| C15 | URGENCY_CLASS кириллическими label-ключами (rename в lib = тихий fallback) | analytics/liquidity/LiquidationScenarioCard.tsx | при касании: типизировать ключи через lib-тир или days-tier map |
| C16 | Pie `as unknown as` double-cast (pre-existing) + chart-3-as-text запас 0.02 (4.52) | analytics/liquidity/LiquidityDistributionChart.tsx | при касании waterfall-подобных графов; 174.2 контраст-ревью |
| C17 | Credentialed functional E2E для Story 169.9 corrective не выполнен | analytics/gaps auth/session/error-recovery + local-backend critical journeys | Story 174.4; требуется отдельное явное credential-разрешение. Если оно выдано, передавать credential только in-memory, никогда не выводить и не сохранять |

### 3.3 BE-debt

| ID | Суть | Триггер |
| --- | --- | --- |
| TD-S2b | supply-sync terminal-branch: first-seen-CLOSED не получают syncSupplyOrders; backfill >14d by design | одна строка link-call; ближайшая BE-story про supply-sync |
| TD-P8 | supply barcode 409 на непакованном боксе | re-check на следующей РЕАЛЬНОЙ поставке |
| legacy test-api ×42 | апрельские naming-схемы | owner-решение о массовой чистке |
| getMarginColor dedupe | локальные копии 168.3 + shared top-table-utils | **172.1 carry-in (ОБЯЗАТЕЛЕН в pre-flight 172.1)** |

### 3.4 Contrast/foundation эскалации → 174.2

- /15-chip light: warning 3.96 / success 4.21 / **success 4.19 (169.10 замер)** / chart-2 dark 4.46
  (известная семья <AA 4.5; legacy был 6.84 — REGRESS vs legacy, но консистентная волна-политика;
  dark PASS 7.8-10.4). Владелец = foundation (166), НЕ маршрутные стори; консолидация в 174.2
  (направление: затемнить light `--status-warning/success` до ~L24-25%; solid-пары имеют запас).
- **Chart-токены как ТЕКСТ** (правило волны с 169.10): на bg-card лучший 4.52 (запас 0.02!),
  на /15-тинте 3.71-4.19 FAIL — цвет серии ТОЛЬКО заливкой/бордером; текст на тинтах =
  `var(--color-foreground)`.
- /80-weaker-text light 3.2-3.45 = known-accept (волна).
- margin-tier divergence — foundation-owned.
- ЗАМЕТКА: контраст /15-пар зависит от слоя-подложки (bg-background vs card) — при сверке
  указывать слой (урок cont.21).

### 3.5 Наблюдения (не debt-ID, кандидаты в owner-вопросы)

- Нет мониторинга «BE мёртв N часов» — infra лежала 4 дня незамеченно (18-22.08; ledger cont.19).
- Advertising daily-trend spend `#7C3AED` purple остаётся hex до своих стори; 169.8 кладёт
  фундамент (adSpend → chart-4 в funnel); advertising reconciles своей волной.

## 4. Параллельные треки (вне программы миграции)

| Трек | Статус | NEXT |
| --- | --- | --- |
| **W4 Epic-121 P3** (price writeback) | owner-решения ПОЛУЧЕНЫ (A→B→C; DRY_RUN enum; cap ±20%/2-write-day; dark-ship; kill-switch PRICE_WRITEBACK_ENABLED=false) | impl по дизайну docs/epics/epic-121-phase3-writeback-design.md; enum-миграция ТОЛЬКО в MAIN с throwaway shadow (⛔-правила live-db) |
| **W5 Epic-128** | ТОЛЬКО owner-акты (attestations; v2-envelope подпись; final-live-evidence Node 24.18.0) | не трогать без owner; после PASS → 128-12 |
| **W7 Финансы** | W34 (17-23.08) будет залита авто-пуллом **Пн 24.08 17:00 МСК** (недельный cron; owner подтвердил Пн-Вс) | ПЕРЕЧЕРК после 24.08; пусто после захода → эскалация owner |
| **Инфра** | Восстановлена 22.08 после 4-дневного дауна (Docker off → BE dead; pm2 resurrect) | живая проверка pm2/docker в начале КАЖДОЙ сессии |

## 5. Owner-зависимые стори (вехи 172-173)

- 172.5 — owner COGS; 172.6 — ⚠️ чужой WIP cogs-bulk законсервирован в ветку `wip/cogs-split-supplies-csv-20260822` (owner-снапшот, НЕ мержить/удалять; координация при 172.6); 172.14 — owner orders;
  173.1 — owner settings; 173.8 — owner shipments; 173.12 — owner supplies.

## 6. Процесс-ссылки

- Оркестратор-промпт v8 (процесс-канон, самодостаточный): docs/ORCHESTRATOR-PROMPT-2026-08-22-V8-AGENT-TEAM-CONTINUATION.md (BE-репо); канон-дельты W8/W9 — в соответствующих handoff.
- Хэндофф-цепочка: …→ W7-entry → W8 (169.8-9) → **W9** `docs/HANDOFF-2026-08-23-W9-169-10-SHIPPED.md` (актуальный вход) + ПОЛНЫЙ реестр: `docs/HANDOFF-2026-08-23-W9-FULL-DEBTS-AND-ROADMAP.md`.
- Ledger: docs/tech-debt/TECH-DEBT-2026-08-SESSION.md (Addendum-4 cont.1-25; каждая cont = закрытый item с уроками).
- Дефект-паттерны 1-44 + идиомы волны: v8-промпт + W8 §4 + W9 §3 (lib-hex-каналы, chart-не-текст, PR-reopen).
- W9 зафиксировала параллельную сессию, которая влила #209/#213 между нашими PR; boot-процесс должен сохранять fetch-детект и reopen-recovery после merge-гонки (W9 §2).
