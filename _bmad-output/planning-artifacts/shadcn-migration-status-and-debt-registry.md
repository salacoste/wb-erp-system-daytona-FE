# Shadcn Full-UI Migration — Status & Debt Registry

> **Snapshot date: 2026-08-24** (Story 169.12 route PR #227 merged early; Correct Course contract closeout pending). Канонический статус-реестр программы миграции
> для BMAD-артефактов. Живая история — sprint-status.yaml (по-сторийно) и ledger
> BE-репо (docs/tech-debt/TECH-DEBT-2026-08-SESSION.md, Addendum-4 cont.1-25);
> этот файл = консолидированный срез «что сделано / что осталось / все долги».
> Обновлять в конце каждой orchestrator-сессии.

## 1. Execution status (по эпикам)

| Epic                         | Stories         | Done   | Остаток                                               | Статус                                                                                                                  |
| ---------------------------- | --------------- | ------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 166-FE foundation            | 8               | 8      | —                                                     | **CLOSED** (токены, примитивы, композиции, контракты)                                                                   |
| 167-FE AppShell/auth         | 9 (с merge'ами) | 9      | —                                                     | **CLOSED** (freeze-8, W1)                                                                                               |
| 168-FE analytics core        | 11              | 11     | —                                                     | **CLOSED** (hub + 10 маршрутов; 168.2-168.11 orchestrator-волной)                                                       |
| 169-FE operational analytics | 15              | **11** | 169.14 → 169.15 → 169.12 closeout; 169.13 independent | **IN PROGRESS** (11 canonical Stories complete; 169.12 route presentation merged early and remains review-blocked)      |
| 170-FE                       | 7               | 0      | 170.1-7                                               | backlog                                                                                                                 |
| 171-FE                       | 9               | 0      | 171.1-9                                               | backlog                                                                                                                 |
| 172-FE                       | 17              | 0      | 172.1-17                                              | backlog (см. owner-заметки §5)                                                                                          |
| 173-FE                       | 13              | 0      | 173.1-13                                              | backlog                                                                                                                 |
| 174-FE консолидация          | 5               | 0      | 174.1-5                                               | финал (СТРОГО после 166-173; 174.2 design-system/source-boundary/contrast; 174.3 visual/a11y; 174.4 functional/backend) |

**Story readiness: 39 of 94 canonical Stories complete.** Story 169.11 returns analytics shipped through
preface PR #218 and implementation PR #219. PR #227 then merged Story 169.12's 27-file shadcn route
presentation early at `52f7f506`, but the Story is not counted complete: the approved Correct Course adds
two sequential non-route prerequisites without changing the 76-route ledger. Story 169.14 owns the backend
paid-storage request/status/result/error contract, Story 169.15 owns the shared frontend boundary, and only
then may Story 169.12 perform its bounded contract closeout. Story 169.13 remains independent.

169.13 SHIPPED 2026-08-25 (последний backlog-роут эпика; 13/15): preface #231 (`95522187` — unknown enums
+ nullables, opus APPROVE) + #232 (`2778d43e`; 26 файлов, owned 58→73, **e2e на ветке 33/1↓/0**, 2×opus);
полный пол **19 055/0**. Эпик 169: осталось 169.14 (BE) → 169.15 (shared FE) → 169.12-closeout.

**NEXT = 169.14 → 169.15 → 169.12 contract closeout** (169.14/169.15 `backlog`; 169.12 `review`; plans `.omx/plans/169.14-establish-authoritative-paid-storage-import-lifecycle-and-result-contract.md`, `.omx/plans/169.15-align-shared-frontend-paid-storage-import-boundary.md`, and `.omx/plans/169.12-migrate-storage-analytics-and-paid-storage-import.md`). Story 169.13 remains an independent backlog route.
**Волна 23-24.08** (два полных цикла + инфраструктура): 169.11 returns — preface #218 (`d6ed2c65`,
unknown-категория на boundary + нейтральный лейбл) + #219 (`129e99ed`; owned 50→73) + e2e-gap закрыт
post-close #222 (гнилой пин от стандартизации 1804aa8f; финал 12/1↓/0); 169.12 storage — preface #226
(`2c7a3c59`, tri-state `has_warehouse_stock` / nullable `percent_of_total` / импорт-статус unknown) +
маршрутная миграция #227 (`52f7f506`; 27 файлов, owned 119→147, **e2e на ветке 6/1↓/0**, 2×opus FRESH);
CSV-security #223 (OWASP defang + trade-off documented); чужой WIP реконсилирован #225 (cogs-split +
rateLimit + csv-dedupe); Correct Course #228 (`4d0ff685`) ввёл 169.14/169.15 + bounded 169.12-closeout.
**Пол vitest 19 033/0** (актуальный пол); lint 0/0; tsc 0. Browser/theme/visual evidence — carry-out 174.3;
credentialed functional E2E — carry-out 174.4. Plan-status аудит 2026-08-24: 167.5/167.8/167.9 → executed
(были review/ready-for-dev/backlog при done-строках).

## 2. Верификационные факты (2026-08-24, W9 + frontend Correct Course checkpoint)

- Fresh frontend evidence: PR #213 implementation `e738dd80`, merge `5c6950f3`; merge parents
  `0245f52b e738dd80`; route 55/55, full Vitest 18 952/18 952, build 70/70, final two reviews
  `APPROVE`, implementation branch/remote/worktree cleanup proven.
- Recovered COGS/CSV/rate-limit WIP was finalized in feature commit
  `e69e0516b119e6ad688fd34eeefe5b1fcdc55a38` and merged through PR #225
  (`https://github.com/salacoste/wb-erp-system-daytona-FE/pull/225`) as merge commit
  `069fd000a06a75f00f0ce898f2e4c7783dc16f2f`. The feature/WIP branches and old worktrees were
  cleaned after merge.
- Final frontend integration baseline for this docs package: PR #227 merged at
  `52f7f5061d73f5633fbc0fe575ff35f2055be194` after preface PR #226 at
  `2c7a3c5931dbc9890ed585eaf71f5717c04453b2`, and the Correct Course branch was reconciled onto PR #227
  before push. PR #226 is a Story 169.12 preface, not Story 169.15 completion: it preserves an
  internal `unknown` import sentinel in the shared type/normalizer/test and keeps it nonterminal in the
  route consumer, but it does not deliver the post-169.14 request/result/error/polling/diagnostic contract.
  Story 169.15 therefore remains `backlog`. PR #227 delivered the route presentation and evidence artifact,
  but Story 169.12 remains `review` until the approved contract chain closes. The unrelated remote automation branch
  `origin/automation/openwiki-32120597348-1` remains and is not part of this migration cleanup.
- Historical W9 backend snapshot only, **not current evidence and not revalidated by this frontend
  documentation follow-up**: backend `main` was `58e1a0a77`, backend Jest was 13 170/0, PM2 services
  were online, and Docker postgres/redis/mindsdb/prophet were up. Story 169.14 must collect fresh
  backend repository and service evidence before implementation.

## 3. Полный долг-реестр

### 3.1 FE-debt (по триггерам; 174.2 принимает только применимые design-system/source-boundary долги)

| ID    | Суть                                                                       | Триггер/фикс                                                                       |
| ----- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| FE-D1 | mutations retry:1 ретраит 4xx (WB-токен PUT ×2; e2e пинит putAttempts===2) | behavior-change ОТДЕЛЬНО (full vitest + e2e; обновить e2e-пин)                     |
| FE-D2 | WbTokenBanner dead code 0 importers                                        | ближайшая FE-story или 174.2                                                       |
| FE-D3 | getErrorMessage эхо сырого error.message юзеру                             | при касании apiClient/error-пути; scrub/truncate                                   |
| FE-D5 | cross-tab create duplication (нет CAS)                                     | fast-follow Web Locks API                                                          |
| FE-D6 | ExportConfigForm дубль ExportDialogForm (dead)                             | ближайшая чистка или 174.2                                                         |
| FE-D8 | getCabinetCreationOperation middle-path (юзер висит в SAFE_RECONCILIATION) | по UX-жалобе; НЕ менять без fresh-ревью                                            |
| FE-D9 | logApiError логирует non-2xx тела (вкл. plaintext password /register)      | БЛИЖАЙШАЯ FE-story трогающая apiClient; redact + isPasswordPolicyError → API-owner |

### 3.2 Волновые carry-outs (от маршрутных миграций 168.10-169.10)

| ID  | Суть                                                                                                                                                                          | Файл                                                                         | Фикс                                                                                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | 4 tooltip-контейнера bg-white (dark-дефект)                                                                                                                                   | dashboard ExpenseChartTooltip/PatternTooltip/StatusTooltip                   | ближайшая dashboard-стори; bg-popover канон                                                                                                               |
| C2  | MarginDisplay legacy-палитра (gray/green/red-600)                                                                                                                             | components/custom/MarginDisplay.tsx                                          | ближайшая dashboard-стори или sweep; sign→financial, zero→muted                                                                                           |
| C3  | dead exports getProfitabilityColor/BgClass (0 прод-консьюмеров)                                                                                                               | lib/unit-economics-config.ts                                                 | 174.x sweep (вместе с FE-D2/D6)                                                                                                                           |
| C4  | getHealthScoreInfo hex+bgColor без прод-консьюмеров                                                                                                                           | lib/unit-economics-analysis.ts                                               | тот же 174.x sweep                                                                                                                                        |
| C5  | waterfall double-color-source (utils green vs config blue)                                                                                                                    | unit-economics-utils vs waterfall-chart-config                               | debt-ID при касании waterfall; решить канон-источник                                                                                                      |
| C6  | date-cells tabular-nums отсутствует во всех 3 acquiring-таблицах                                                                                                              | acquiring/**                                                                 | 174.x tree-wide sweep (НЕ пер-роутный фикс)                                                                                                               |
| C7  | e2e-комментарий «amber rate-limit banner» устарел                                                                                                                             | e2e/acquiring.spec.ts:130                                                    | при следующем касании спеки                                                                                                                               |
| C8  | FunnelPageContent находится ровно на source cap 200 строк                                                                                                                     | analytics/funnel/FunnelPageContent.tsx                                       | вынести sync/toolbar block при первом следующем касании                                                                                                   |
| C9  | Browser/theme/responsive/axe/keyboard/visual matrix 169.8-169.10 не выполнена                                                                                                 | analytics/funnel + gaps + liquidity                                          | обязательный consolidated evidence pass в 174.3                                                                                                           |
| C10 | KPI-icon canon Funnel semantic (owner 22.08), а 169.6/169.7 muted                                                                                                             | analytics/funnel + fbs routes                                                | свести к одному owner-canon в 174.2 (semantика = целевой)                                                                                                 |
| C11 | Cold-cache Funnel Vitest один раз дал 12 failures, warm/full runs стабильны                                                                                                   | analytics/funnel tests                                                       | расследовать только при повторном воспроизведении; не считать текущим functional failure                                                                  |
| C12 | GapsPageContent suites частично дублируются: route-level содержит 6 базовых composition checks, components-level дополнительно владеет corrective state/lifecycle regressions | analytics/gaps                                                               | консолидировать без потери corrective coverage в отдельном debt-pass                                                                                      |
| C13 | GapsTable: caption + scroll-aria-label дублируют смысл таблицы                                                                                                                | analytics/gaps/GapsTable.tsx                                                 | опциональная дедупликация (P1-LOW)                                                                                                                        |
| C14 | Gaps pure-digit hex guard исправлен в PR #213; остальные route guards ещё требуют owner-sweep                                                                                 | presentation-source-contracts tests outside analytics/gaps                   | при касании route-owner или применимый 174.2 source-boundary sweep; не переписывать ticket refs                                                           |
| C15 | URGENCY_CLASS кириллическими label-ключами (rename в lib = тихий fallback)                                                                                                    | analytics/liquidity/LiquidationScenarioCard.tsx                              | при касании: типизировать ключи через lib-тир или days-tier map                                                                                           |
| C16 | Pie `as unknown as` double-cast (pre-existing) + chart-3-as-text запас 0.02 (4.52)                                                                                            | analytics/liquidity/LiquidityDistributionChart.tsx                           | при касании waterfall-подобных графов; 174.2 контраст-ревью                                                                                               |
| C17 | Credentialed functional E2E для Story 169.9 corrective не выполнен                                                                                                            | analytics/gaps auth/session/error-recovery + local-backend critical journeys | Story 174.4; требуется отдельное явное credential-разрешение. Если оно выдано, передавать credential только in-memory, никогда не выводить и не сохранять |

### 3.3 BE-debt

| ID                    | Суть                                                                                                 | Триггер                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| TD-S2b                | supply-sync terminal-branch: first-seen-CLOSED не получают syncSupplyOrders; backfill >14d by design | одна строка link-call; ближайшая BE-story про supply-sync |
| TD-P8                 | supply barcode 409 на непакованном боксе                                                             | re-check на следующей РЕАЛЬНОЙ поставке                   |
| legacy test-api ×42   | апрельские naming-схемы                                                                              | owner-решение о массовой чистке                           |
| getMarginColor dedupe | локальные копии 168.3 + shared top-table-utils                                                       | **172.1 carry-in (ОБЯЗАТЕЛЕН в pre-flight 172.1)**        |

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

| Трек                                 | Статус                                                                                                                   | NEXT                                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **W4 Epic-121 P3** (price writeback) | owner-решения ПОЛУЧЕНЫ (A→B→C; DRY_RUN enum; cap ±20%/2-write-day; dark-ship; kill-switch PRICE_WRITEBACK_ENABLED=false) | impl по дизайну docs/epics/epic-121-phase3-writeback-design.md; enum-миграция ТОЛЬКО в MAIN с throwaway shadow (⛔-правила live-db) |
| **W5 Epic-128**                      | ТОЛЬКО owner-акты (attestations; v2-envelope подпись; final-live-evidence Node 24.18.0)                                  | не трогать без owner; после PASS → 128-12                                                                                           |
| **W7 Финансы**                       | W34 (17-23.08) будет залита авто-пуллом **Пн 24.08 17:00 МСК** (недельный cron; owner подтвердил Пн-Вс)                  | ПЕРЕЧЕРК после 24.08; пусто после захода → эскалация owner                                                                          |
| **Инфра**                            | Восстановлена 22.08 после 4-дневного дауна (Docker off → BE dead; pm2 resurrect)                                         | живая проверка pm2/docker в начале КАЖДОЙ сессии                                                                                    |

## 5. Owner-зависимые стори (вехи 172-173)

- 172.5 — owner COGS; 172.6 — recovered COGS/CSV/rate-limit WIP merged through PR #225 and its temporary refs/worktrees are cleaned, but canonical Story 172.6 is **not complete**: it still depends on Story 172.5 and requires owner coordination for the `/cogs/bulk` route, validation/preview, explicit partial results, and failed-row retry contract; 172.14 — owner orders;
  173.1 — owner settings; 173.8 — owner shipments; 173.12 — owner supplies.

## 6. Процесс-ссылки

- Оркестратор-промпт v8 (процесс-канон, самодостаточный): docs/ORCHESTRATOR-PROMPT-2026-08-22-V8-AGENT-TEAM-CONTINUATION.md (BE-репо); канон-дельты W8/W9 — в соответствующих handoff.
- Хэндофф-цепочка: …→ W7-entry → W8 (169.8-9) → **W9** `docs/HANDOFF-2026-08-23-W9-169-10-SHIPPED.md` (актуальный вход) + ПОЛНЫЙ реестр: `docs/HANDOFF-2026-08-23-W9-FULL-DEBTS-AND-ROADMAP.md`.
- Ledger: docs/tech-debt/TECH-DEBT-2026-08-SESSION.md (Addendum-4 cont.1-25; каждая cont = закрытый item с уроками).
- Дефект-паттерны 1-44 + идиомы волны: v8-промпт + W8 §4 + W9 §3 (lib-hex-каналы, chart-не-текст, PR-reopen).
- W9 зафиксировала параллельную сессию, которая влила #209/#213 между нашими PR; boot-процесс должен сохранять fetch-детект и reopen-recovery после merge-гонки (W9 §2).
