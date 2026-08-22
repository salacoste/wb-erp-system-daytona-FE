# Shadcn Full-UI Migration — Status & Debt Registry

> **Snapshot date: 2026-08-22** (W6-сессия). Канонический статус-реестр программы миграции
> для BMAD-артефактов. Живая история — sprint-status.yaml (по-сторийно) и ledger
> BE-репо (docs/tech-debt/TECH-DEBT-2026-08-SESSION.md, Addendum-4 cont.1-21);
> этот файл = консолидированный срез «что сделано / что осталось / все долги».
> Обновлять в конце каждой orchestrator-сессии.

## 1. Execution status (по эпикам)

| Epic | Stories | Done | Остаток | Статус |
| --- | --- | --- | --- | --- |
| 166-FE foundation | 8 | 8 | — | **CLOSED** (токены, примитивы, композиции, контракты) |
| 167-FE AppShell/auth | 9 (с merge'ами) | 9 | — | **CLOSED** (freeze-8, W1) |
| 168-FE analytics core | 11 | 11 | — | **CLOSED** (hub + 10 маршрутов; 168.2-168.11 orchestrator-волной) |
| 169-FE operational analytics | 13 | **7** | 169.8-169.13 | **IN PROGRESS** (acquiring ×3 + buyout ×2 + fbs ×2) |
| 170-FE | 7 | 0 | 170.1-7 | backlog |
| 171-FE | 9 | 0 | 171.1-9 | backlog |
| 172-FE | 17 | 0 | 172.1-17 | backlog (см. owner-заметки §4) |
| 173-FE | 13 | 0 | 173.1-13 | backlog |
| 174-FE консолидация | 5 | 0 | 174.1-5 | финал (СТРОГО после 166-173; 174.2 = legacy-enforcement + все долги §3) |

**Готовность маршрутов**: 35 of ~79 story-строк закрыто; активная волна = 168.2-169.7
(16 маршрутов orchestrator-циклом v4-v7, PRs #170-#203).

**NEXT = 169.8 funnel-analytics** (`ready-for-dev`): pre-flight ПОЛНОСТЬЮ готов (11-пунктовая
карта миграции + baseline 11 файлов/110 тестов в docs/HANDOFF-2026-08-22-W6-169-6-7-SHIPPED.md
§2 BE-репо). Branch cdx/epic-169-story-8-funnel-shadcn. **Обновление 22.08 (post-W6)**:
параллельная сессия залила docs-only PR #204+#205 (`747cedf2`/`963b1cf8`) — создан
implementation-artifact 169-8-fe-migrate-funnel-analytics.md (+181 строка, behavior-contracts
prep) + sprint-flip ready-for-dev; ИСХОДНИКИ и .omx-план НЕ тронуты → карта миграции W6
остаётся валидной; executor-промпт следующей сессии должен СВЕРИТЬСЯ с этим prep-артефактом.

## 2. Верификационные факты (2026-08-22, конец W6-сессии)

- BE main `efe9a3be2` synced; 0 src-мержей после деплоя `31402ce34` (rebuild не нужен).
- FE origin/main `96103a61` (flip #203); FE local main позади — НОРМА (контент в BE-mirror).
- Полы: FE vitest **18 827/0** · BE jest 13 170/0.
- PM2: wb-repricer + worker + frontend(:3100) online; Docker up (postgres/redis/mindsdb/prophet).
- Worktrees/branches чисты в обоих репо (FE non-main = openwiki-бот только).
- Чужой WIP в FE-дереве (НЕ трогать): cogs/csv/rateLimit/supplies/SkuFinancialsTable + .env.bak ×2.

## 3. Полный долг-реестр

### 3.1 FE-debt (по триггерам; консолидация в 174.2 если не сработает триггер раньше)

| ID | Суть | Триггер/фикс |
| --- | --- | --- |
| FE-D1 | mutations retry:1 ретраит 4xx (WB-токен PUT ×2; e2e пинит putAttempts===2) | behavior-change ОТДЕЛЬНО (full vitest + e2e; обновить e2e-пин) |
| FE-D2 | WbTokenBanner dead code 0 importers | ближайшая FE-story или 174.2 |
| FE-D3 | getErrorMessage эхо сырого error.message юзеру | при касании apiClient/error-пути; scrub/truncate |
| FE-D5 | cross-tab create duplication (нет CAS) | fast-follow Web Locks API |
| FE-D6 | ExportConfigForm дубль ExportDialogForm (dead) | ближайшая чистка или 174.2 |
| FE-D8 | getCabinetCreationOperation middle-path (юзер висит в SAFE_RECONCILIATION) | по UX-жалобе; НЕ менять без fresh-ревью |
| FE-D9 | logApiError логирует non-2xx тела (вкл. plaintext password /register) | БЛИЖАЙШАЯ FE-story трогающая apiClient; redact + isPasswordPolicyError → API-owner |

### 3.2 Волновые carry-outs (от маршрутных миграций 168.10-169.7)

| ID | Суть | Файл | Фикс |
| --- | --- | --- | --- |
| C1 | 4 tooltip-контейнера bg-white (dark-дефект) | dashboard ExpenseChartTooltip/PatternTooltip/StatusTooltip | ближайшая dashboard-стори; bg-popover канон |
| C2 | MarginDisplay legacy-палитра (gray/green/red-600) | components/custom/MarginDisplay.tsx | ближайшая dashboard-стори или sweep; sign→financial, zero→muted |
| C3 | dead exports getProfitabilityColor/BgClass (0 прод-консьюмеров) | lib/unit-economics-config.ts | 174.x sweep (вместе с FE-D2/D6) |
| C4 | getHealthScoreInfo hex+bgColor без прод-консьюмеров | lib/unit-economics-analysis.ts | тот же 174.x sweep |
| C5 | waterfall double-color-source (utils green vs config blue) | unit-economics-utils vs waterfall-chart-config | debt-ID при касании waterfall; решить канон-источник |
| C6 | date-cells tabular-nums отсутствует во всех 3 acquiring-таблицах | acquiring/** | 174.x tree-wide sweep (НЕ пер-роутный фикс) |
| C7 | e2e-комментарий «amber rate-limit banner» устарел | e2e/acquiring.spec.ts:130 | при следующем касании спеки |

### 3.3 BE-debt

| ID | Суть | Триггер |
| --- | --- | --- |
| TD-S2b | supply-sync terminal-branch: first-seen-CLOSED не получают syncSupplyOrders; backfill >14d by design | одна строка link-call; ближайшая BE-story про supply-sync |
| TD-P8 | supply barcode 409 на непакованном боксе | re-check на следующей РЕАЛЬНОЙ поставке |
| legacy test-api ×42 | апрельские naming-схемы | owner-решение о массовой чистке |
| getMarginColor dedupe | локальные копии 168.3 + shared top-table-utils | **172.1 carry-in (ОБЯЗАТЕЛЕН в pre-flight 172.1)** |

### 3.4 Contrast/foundation эскалации → 174.2

- /15-chip light: warning 3.96 / success 4.21 (известная семья 3.96-4.21 <AA 4.5; legacy был
  6.84 — REGRESS vs legacy, но консистентная волна-политика; dark PASS 7.8-10.4). Владелец =
  foundation (166), НЕ маршрутные стори; консолидация в 174.2.
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

- 172.5 — owner COGS; 172.6 — ⚠️ чужой WIP cogs-bulk (НЕ трогать до owner); 172.14 — owner orders;
  173.1 — owner settings; 173.8 — owner shipments; 173.12 — owner supplies.

## 6. Процесс-ссылки

- Оркестратор-промпт v7: docs/ORCHESTRATOR-PROMPT-2026-08-22-V7-W5-CONTINUATION.md (BE-репо).
- Хэндофф-цепочка: …→ HANDOFF-2026-08-19-W5-169-4-5-SHIPPED.md → **HANDOFF-2026-08-22-W6-169-6-7-SHIPPED.md** (актуальный).
- Ledger: docs/tech-debt/TECH-DEBT-2026-08-SESSION.md (Addendum-4 cont.1-21; каждая cont = закрытый item с уроками).
- Полный реестр планов/веток: docs/HANDOFF-2026-08-18-FULL-DEBT-AND-PLAN-REGISTRY.md (BE-репо).
- Дефект-паттерны 1-39 + идиомы волны: v7-промпт (сверхуверностью v7 > v6 > v5 > v4).
