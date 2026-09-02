# HANDOFF 2026-08-26 — Эпик 171 (AI/Forecast analytics → shadcn): **9/9 ЗАКРЫТ** + полный реестр долгов FE

> ⚠️ **Актуальная вход-точка новее**: [`HANDOFF-2026-08-26-LATE-epic-171-complete-172-recon-ready.md`](HANDOFF-2026-08-26-LATE-epic-171-complete-172-recon-ready.md) (main `a6167e88`, NEXT 172.1 + recon, ловушки P9-P11). Этот док: §0 синхронизирован PR #272; §1-§5 — исторические (детали 171.6 и之前的 входы); полный реестр BE-долгов §3.5-3.7 и owner-карта остаются справочными.

> Вход-точка после закрытия **Эпика 171-FE целиком** (171.7: PRs #266+#267 · 171.8: #268+#269 · 171.9: #270+#271, `main = 9c503fe4`).
> **Оркестратору новой команды**: операционный промпт-продолжение — [`ORCHESTRATOR-PROMPT-2026-08-26-V9-FE-CONTINUATION.md`](ORCHESTRATOR-PROMPT-2026-08-26-V9-FE-CONTINUATION.md) (bootstrap, цикл стори, гейты, нормы, ловушки).
> Предыдущий вход: [`../docs/HANDOFF-2026-08-23-W9-FULL-DEBTS-AND-ROADMAP.md`](../docs/HANDOFF-2026-08-23-W9-FULL-DEBTS-AND-ROADMAP.md) (BE-репо, W9, все 60 стори + FE-D/C1-C16) → его §1-§4 по историям до 169.10 частично устарели — прогресс ниже актуален.

---

## 0. Верифицированное состояние (26.08, эпик 171 закрыт 9/9)

| Метрика | Значение |
|---|---|
| `main` | `9c503fe4` (merge PR #271 closeout 171.9 + эпик-flip), дерево чистое, все ветки/worktrees 171.x = 0/0/0 |
| Прогресс миграции 166-174 | **54/94** канонических стори |
| Эпики | 166 ✅ · 167 ✅ · 168 ✅ · 170 ✅ (7/7) · **171 ✅ (9/9, retrospective optional — отложена owner'у)** · 169 in-progress (чужая lane, §2.4) · 172/173/174 backlog |
| Полный пол (vitest) | **19 281 / 0** (floor рос точными +N: 19 253 → 19 263 (171.7) → 19 271 (171.8) → 19 281 (171.9)) |
| Линтер/типы | lint 0/0 (zero-warning), tsc 0, max-lines OK, check:docs = baseline (97 entries), check:locale-percent ratchet = **4** |
| PR сессии 26.08 (вечер) | #264–#271 (171.7-171.9 микрос + closeouts + эпик-flip) |
| **NEXT** | **172.1-FE dashboard** (эпик 172 Core Business Ops, 17 стори, планы `.omx/plans/172.1..172.17-*.md`) |

**Carry-out → 174.2 owner** (из 171.9, route-ledger handoff, см. реестр): удалить поле `className` из `STATUS_BADGE_CONFIG` после миграции `ModelListSection` на собственный overlay; переписать 2 stale ownership-комментария (model-list-helpers.ts, evaluations-list-helpers.ts); перенести статус-токен пины гарда 171.6; anchor-hardening гарда 171.6 (join-before-filter, 171.8-класс).

Процесс-канон v8: [`../docs/ORCHESTRATOR-PROMPT-2026-08-22-V8-AGENT-TEAM-CONTINUATION.md`](../docs/ORCHESTRATOR-PROMPT-2026-08-22-V8-AGENT-TEAM-CONTINUATION.md) — micro-cycle паттерн, owner-карта, параллельные lanes. Новые ловушки сессии: гард × имя-worktree (см. артефакт 171.8 + memory), tsc-фантом от concurrent-сессии, `.next/dev` truncated-генерат убитого dev-сервера (rm -rf .next/dev лечит).

---

## 1. Задачи этой сессии — Story 171.6-FE (закрыта)

### 1.1 Контекст

Сессия началась как восстановление после context-crash (прошлая сессия упёрлась в лимит контекста на разведке 171.6; её Explore-результаты погибли). План стори выжил на диске и является authoritative: [`.omx/plans/171.6-migrate-model-registry-and-training-entry.md`](../.omx/plans/171.6-migrate-model-registry-and-training-entry.md).

**Коррекция классификации:** прошлая сессия пометила 171.6 «полный цикл» (29 файлов / 43 legacy / 4 693 строки) — это был подсчёт **всего дерева** `/analytics/models` включая `[id]/**`. Owned surface 171.6 по плану — только корень роута (~700 строк). Реальный вердикт — **MINOR-GAP-plus** (~9 legacy-сайтов).

### 1.2 Owned surface (всё, что правилось)

| Файл | Что сделано |
|---|---|
| [`src/app/(dashboard)/analytics/models/components/model-list-helpers.ts`](../src/app/(dashboard)/analytics/models/components/model-list-helpers.ts) | `STATUS_BADGE_CONFIG`: 7 сырых palette-классов → semantic status-токены с сохранением оттенков (green→`status-success`, blue→`status-information`, amber→`status-warning`, red→`status-error`, gray→`muted`). **Shape заморожен** `{className,label,pulse}` — поле `className` читают `[id]`-саброуты (см. §3.2). Provenance 109.3→+171.6. |
| [`src/app/(dashboard)/analytics/models/components/ModelListSection.tsx`](../src/app/(dashboard)/analytics/models/components/ModelListSection.tsx) | Pulse-точка `bg-blue-500`→`bg-status-information` (канон 171.4 StatusDot); `ModelsPageShell` `p-6` убран (double-padding — layout даёт `p-4 lg:p-6`); `TableCaption` «Список ML-моделей вашего кабинета» (169.7 canon, spec-order над header); `tabular-nums` ×3 (Версия/MAPE/Обучен); provenance. |
| [`src/app/(dashboard)/analytics/models/components/TrainModelButton.tsx`](../src/app/(dashboard)/analytics/models/components/TrainModelButton.tsx) | No-op источника — верифицирован токен-чистым, provenance-коммент. |
| [`src/app/(dashboard)/analytics/models/page.tsx`](../src/app/(dashboard)/analytics/models/page.tsx) | Provenance-коммент (109.3 → +migrated 171.6). |
| [`src/app/(dashboard)/analytics/models/components/__tests__/model-registry-presentation-source-contracts.test.ts`](../src/app/(dashboard)/analytics/models/components/__tests__/model-registry-presentation-source-contracts.test.ts) | **NEW** гард (шаблон 171.5): каталог pinned **4 файла с исключением `[id]/**`** (первый гард эпика с немигрированными саброутами), no-palette/no-hex (канонные регексы 169.11), status-token/pulse/caption/tabular/padding пины. |

Дифф: 4 M + 1 A, +118/−16, один коммит `ce331c1b`. Бонус-фикс: **dark-mode** для всех 7 статусов (старая палитра была light-only).

### 1.3 Ключевое решение — кросс-сарайфейс дисциплина

`STATUS_BADGE_CONFIG` импортируют два **запрещённых** для 171.6 файла (читают `.className`+`.label`, накладывают на `Badge variant="outline"`):
- `src/app/(dashboard)/analytics/models/[id]/evaluations/components/EvaluationsHeaderCard.tsx:15,66`
- `src/app/(dashboard)/analytics/models/[id]/performance/components/ModelPerformanceDetail.tsx:29,143`

Поле НЕ переименовано в `variant` (сломало бы forbidden surface). Вместо этого значения `className` заменены на семантические — саброуты получили токен-чистый рендер «бесплатно», а удаление поля делегировано их сторям (171.7/171.9), что задокументировано в комментарии helpers.

### 1.4 Валидация (все гейты зелёные, exit-коды непайпованные)

| Гейт | Результат |
|---|---|
| Targeted vitest (`analytics/models/components`) | 51 → **58/3** (+7 гард) |
| Полный пол | **19 253/0** (+7 точных) |
| lint / tsc / max-lines | 0/0 · 0 · OK |
| build | `next build --webpack` OK (Turbopack падает на symlink node_modules в /tmp-worktree — §3.4) |
| E2E на ветке | `npm run test:e2e -- e2e/analytics/ai-models.spec.ts --reporter=line` → обёртка расширила до 14 тестов (8 спеки + preflight smoke) = **13 passed/1 skipped/0 failed**; из них 4 — корневой роут listings |
| Визуал | playwright-cli live-логин скриншот: бейдж «Активна» зелёный/читаемый; caption в a11y-дереве (`table "Список ML-моделей вашего кабинета"` + caption-узел); layout цел |
| Ревью | 1× code-reviewer (opus, fresh) — **APPROVE-WITH-NOTES**: r-MINOR аттестация e2e (устранено цитированием команды), r-NIT дубль caption-текста (kept — canon); ревьюер независимо прогнал tsc/lint/217 юнит-тестов по всему models-дереву и мутационно проверил гард |

### 1.5 Git-след

- Реализация: PR **#262** (`ce331c1b` → merge `b867551f`)
- Closeout: PR **#263** (артефакт + sprint flip + registry → merge `c7492829`)
- Артефакт стори: [`_bmad-output/implementation-artifacts/171-6-fe-migrate-model-registry-and-training-entry.md`](../_bmad-output/implementation-artifacts/171-6-fe-migrate-model-registry-and-training-entry.md) (Status: done, Lessons ×3)
- Реестр: [`_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`](../_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md) — строка «171.6 SHIPPED (6/9) … NEXT = 171.7»

### 1.6 Процесс-уроки сессии (в Lessons стори + memory)

1. Литералы guarded-классов в собственных doc-комментариях матчатся регексом гарда (`bg-green-100 etc.`, `p-4 lg:p-6` в прозе) — гард это поймал живьём; писать описательно, не литералом.
2. Turbopack падает (panic) на symlinked node_modules в /tmp-worktree — build в worktree только через `next build --webpack`.
3. Креды дрейфуют: `frontend/CLAUDE.md` говорит `<E2E_TEST_PASSWORD>`, живой BE + `.env.e2e` = `<E2E_TEST_PASSWORD>` — source of truth `.env.e2e` (§3.4).

---

## 2. NEXT — задачи на продолжение

### 2.1 Story 171.7-FE — Model Evaluations List (`/analytics/models/[id]/evaluations`)

- План: [`.omx/plans/171.7-migrate-model-evaluations-list.md`](../.omx/plans/171.7-migrate-model-evaluations-list.md)
- Owned: `evaluations/page.tsx` + `components/{EvaluationsList,EvaluationsTable,EvaluationsHeaderCard,evaluations-list-helpers}` + тесты.
- **Известное:** `EvaluationsHeaderCard.tsx:66` — `<Badge variant="outline" className={statusBadge.className}>`; после миграции на собственный вариант/токены **снять зависимость от `STATUS_BADGE_CONFIG.className`** (см. §3.2 — эту стори можно сделать «хозяином удаления поля», если 171.9 тоже отвяжется).
- E2E: `e2e/analytics/ai-models.spec.ts` уже покрывает evaluations-страницу (2 теста).

### 2.2 Story 171.8-FE — Evaluation SKU Accuracy Detail (`[id]/evaluations/sku-accuracy`)

- План: [`.omx/plans/171.8-migrate-evaluation-sku-accuracy-detail.md`](../.omx/plans/171.8-migrate-evaluation-sku-accuracy-detail.md); owned — 4 компонента + helpers + страница.

### 2.3 Story 171.9-FE — Model Performance Detail (`[id]/performance`)

- План: [`.omx/plans/171.9-migrate-model-performance-detail.md`](../.omx/plans/171.9-migrate-model-performance-detail.md); owned — `ModelPerformanceDetail` (тоже читает `statusBadge.className`, строка 143), `MapeTrendChart` (chart → проверять chart-hex/chartframe-канон 171.4), `EvaluationHistoryTable`.
- Закрытие 171.7-171.9 = **дерево models закрыто полностью** → эпик 171 → retrospective → эпик 172 (17 стори, business operations).

### 2.4 ЧУЖАЯ LANE — не трогать

Параллельная сессия ведёт 169-хвост: `169-14` (backlog) → `169-15` (backlog) → `169.12` (review/blocked, ждёт 169.14+169.15). Worktrees: `/private/tmp/wb-repricer-fe-169-14-*`. Проверять `git worktree list` и их ветки перед созданием своих.

---

## 3. РЕЕСТР ТЕХДОЛГА (полный)

### 3.1 Route-tree долг — сам миграционный backlog (43 стори)

| Эпик | Остаток | Стори | Планы |
|---|---|---|---|
| 171-FE (AI/forecast) | **3** | 171.7 evaluations, 171.8 sku-accuracy, 171.9 performance | `.omx/plans/171.7..171.9-*.md` |
| 172-FE (Core Business Ops) | **17** | dashboard, automation gallery/list/editor (4), COGS single/bulk/history/calculator (4), communications, finances-docs, monitor, monitoring-console, moysklad, orders overview, fbo-orders, order-integrity, products | `.omx/plans/172.1..172.17-*.md` |
| 173-FE (Settings/Shipments/Supplies) | **13** | settings shell/overview/backfill/cabinet/expense/notification/tariff/tax (7), shipments list/detail/box-types, sku-packaging, supplies list/detail (6) | `.omx/plans/173.1..173.13-*.md` |
| 174-FE (завершающий) | **5** | 174.1 route-ledger parity, 174.2 remove-legacy-ui + boundary enforcement, 174.3 a11y/responsive/theme/visual verification, 174.4 full regression, 174.5 docs+cleanup | `.omx/plans/174.1..174.5-*.md` |
| 169-FE (чужая lane) | 2 backlog + 1 review-blocked | 169.14, 169.15, 169.12 | см. §2.4 |

Канонические трекеры: [`docs/EPICS-AND-STORIES-TRACKER.md`](EPICS-AND-STORIES-TRACKER.md) · sprint: [`_bmad-output/implementation-artifacts/sprint-status.yaml`](../_bmad-output/implementation-artifacts/sprint-status.yaml) · реестр: [`_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`](../_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md).

**Внутри 174.2 сидит наибольший скрытый объём**: удаление legacy-UI после миграции всех роутов — включая остатки ручных палитр/хексов в уже-«готовых» роутах, не покрытых пер-роут гардами.

### 3.2 Cross-story замороженные контракты (созданы этой сессией)

- **`STATUS_BADGE_CONFIG.className`** ([`model-list-helpers.ts`](../src/app/(dashboard)/analytics/models/components/model-list-helpers.ts)) — поле живёт только для двух `[id]`-потребителей (EvaluationsHeaderCard, ModelPerformanceDetail). Владелец удаления — 171.7/171.9: отвязать оба → удалить поле → обновить гард 171.6 (пин 4 файлов остаётся). Не забыть: комментарий-ownership уже в файле.

### 3.3 Story-специфичные отложенные items (Gaps в артефактах)

| Откуда | Долг | Артефакт |
|---|---|---|
| 171.6 | Тёмно-тематический скриншот вручную не снят (токены theme-aware по globals.css dark-блоку; юнит+e2e покрывают рендер) — опционально | [`171-6-...md` § Gaps](../_bmad-output/implementation-artifacts/171-6-fe-migrate-model-registry-and-training-entry.md) |
| 171.6 | Caption-текст дублирует subtitle+CardDescription дословно (r-NIT ревью; canon 169.7 соблюдён; дифференциация — опциональный follow-up) | там же § Post-1st-pass |
| 171.6 | Креды-дрейф: доки говорят `<E2E_TEST_PASSWORD>`, живые `<E2E_TEST_PASSWORD>` — док-фикс вне скоупа стори, **надо поправить в `frontend/CLAUDE.md` + `.env.e2e` комменте** любой ближайшей док-стори | там же § Gaps |
| 171.5 | hex-regex `=`-prefix альтернатива не принята (маргинальное покрытие; опционально) | [`171-5-...md` § Gaps](../_bmad-output/implementation-artifacts/171-5-fe-migrate-forecast-accuracy-analytics.md) |

> SEC-DOC-1 (2026-09-02): парольные литералы изъяты из tracked-доков; указание на «устаревший пароль в CLAUDE.md» выше — исторический дрейф, разрешён env-указателем .env.e2e.

### 3.4 Процесс-/инфра-долги

| # | Долг | Влияние | Канон |
|---|---|---|---|
| P1 | **Turbopack × symlinked node_modules**: `npm run build` в /tmp-worktree паникует — только `next build --webpack`; dev тоже `--webpack` | Каждый worktree-цикл | memory `reference_worktree_e2e_delivery_gotchas` + Lessons 171.6 |
| P2 | **Креды-дрейф** (`<E2E_TEST_PASSWORD>` vs `<E2E_TEST_PASSWORD>`) + fresh-profile первый логин редиректит в `/onboarding/cabinet` (404), второй логин проходит | Ручные playwright-cli проверки | memory `reference_e2e_playwright_gotchas` (добавлено 26.08) |
| P3 | **E2E только через npm-обёртку** (`npm run test:e2e -- <spec>`) — прямой `npx playwright test` блокируется preflight-handshake | Каждый e2e-прогон | `scripts/e2e-preflight.mjs` |
| P4 | **check:locale-percent ratchet = 4** (двигался 108→4); любое снижение — same-commit baseline-апдейт | Миграции роутов с процентами | [`CLAUDE.md` § Dot-locale](../CLAUDE.md) · `scripts/.locale-percent-baseline.txt` |
| P5 | **check:docs baseline = 97 entries** — исторические битые цитаты приняты; гейт = exit code, не счётчик | Док-сторика | `scripts/.check-docs-baseline.txt` |
| P6 | **CI runner queue delay** (self-hosted VPS, 2 раннера на 2GB; merge-burst → многочасовые ожидания) — flock-leak вылечен, задержки = очередь, НЕ регрессия | PR-мерджи после burst'ов | memory `reference_ci_runner_global_lock_leak` |
| P7 | **Concurrent-session риски**: чужие сессии могут чекаутить main/удалять /tmp-worktree в середине задачи — коммитить сразу на durable-ветке, re-verify `git branch --show-current` перед каждым коммитом | Все сессии | memory `reference_concurrent_session_branch_hijack` |
| P8 | **Док-креды в `frontend/CLAUDE.md` § Test Credentials** устарели (см. P2/§3.3) | Новые сессии/люди | — |

### 3.5 Открытые BE-блокеры, влияющие на FE (мы — не исполнители)

| # | Блокер | Статус | Тикет |
|---|---|---|---|
| B1 | `/analytics/fbs-enhanced` — hard 500, страница бесполезна (FE деградирует корректно) | ждёт BE | [`docs/request-backend/212-FBS-ENHANCED-500-INTERNAL-SERVER-ERROR.md`](request-backend/212-FBS-ENHANCED-500-INTERNAL-SERVER-ERROR.md) |
| B2 | Orders detail: history-саброуты 500 на UUID — «стандартизировать detail на UUID» **заблокировано** | ждёт BE | request #229 (memory `project_orders_detail_uuid_blocked`) |
| B3 | Per-order COGS: `orders/volume` не возвращает cogs_total/margin — FE-типы ждут JOIN | ждёт BE | request #138 |
| B4 | CORS Expose-Headers: кросс-доменный fetch не читает Retry-After → банер рейт-лимита показывает fallback 60 | ждёт BE | request #206 |

### 3.6 UX-defects (матрица `/loop`-аудита, `.omc/ux-validation/matrix.md`)

| ID | Дефект | Статус |
|---|---|---|
| D1 | fbs-enhanced 500 | = B1, ждёт BE |
| D2 | forecast-accuracy MAPE-заголовок вводит в заблуждение | **ЗАКРЫТ 171.5** (binary MAPE>200 band + extreme-Alert — ровно рекомендованный REFINE) |
| D3 | `/settings/cabinet` показывает WB-API ошибки | FE рендерит корректно (defensive ✅); причина = валидность WB-токена кабинета — ops-сторона |

### 3.7 Внешний канон долгов

- **BE-репо W9 handoff** (все 60 стори на 23.08 + FE-D/C1-C16 + треки + owner-карта): [`../docs/HANDOFF-2026-08-23-W9-FULL-DEBTS-AND-ROADMAP.md`](../docs/HANDOFF-2026-08-23-W9-FULL-DEBTS-AND-ROADMAP.md) — по FE-прогрессу устарел (там 40/94), по BE-долгам актуален.
- Backend requests FE→BE живут в [`docs/request-backend/`](request-backend/) (формат: Problem→Root Cause→Impact→Fix Scope→Reproduction→Resolution).

---

## 4. Канонические ссылки (одним списком)

| Что | Где |
|---|---|
| Мастер-план миграции | [`.omx/plans/shadcn-full-ui-migration-master.md`](../.omx/plans/shadcn-full-ui-migration-master.md) |
| BMAD-артефакт эпиков 166-174 | [`_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md`](../_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md) |
| Route-ledger (только чтение, апдейт — хозяин 174.1) | [`_bmad-output/planning-artifacts/shadcn-route-ledger.md`](../_bmad-output/planning-artifacts/shadcn-route-ledger.md) |
| UX-спека | [`_bmad-output/planning-artifacts/ux-design-specification.md`](../_bmad-output/planning-artifacts/ux-design-specification.md) |
| Debt-registry (живой) | [`_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`](../_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md) |
| Sprint-статусы | [`_bmad-output/implementation-artifacts/sprint-status.yaml`](../_bmad-output/implementation-artifacts/sprint-status.yaml) |
| Гард-эталон (171.5) | [`forecast-accuracy/components/__tests__/accuracy-presentation-source-contracts.test.ts`](../src/app/(dashboard)/analytics/forecast-accuracy/components/__tests__/accuracy-presentation-source-contracts.test.ts) |
| Гард 171.6 (с `[id]`-exclusion) | [`models/components/__tests__/model-registry-presentation-source-contracts.test.ts`](../src/app/(dashboard)/analytics/models/components/__tests__/model-registry-presentation-source-contracts.test.ts) |
| E2E спека models-дерева | [`e2e/analytics/ai-models.spec.ts`](../e2e/analytics/ai-models.spec.ts) |

## 5. Как продолжать (микро-цикл паттерн, ~30-60 мин/роут)

1. Прочитать план стори (`.omx/plans/<story>.md`) → **pre-flight source-trace** (grep AC-существительных; стори может быть no-op).
2. Worktree + symlink node_modules → baseline targeted vitest (behavior lock).
3. Комплаенс-подсчёт **только по owned surface** (урок 171.6: не по всему дереву) → MINOR-GAP/NO-OP/FULL.
4. Правки: palette→tokens (hue-preserving), caption, tabular-nums, provenance, double-padding; **инвентарь потребителей перед правкой экспортов** (rg по всему src/).
5. Гард-тест по шаблону (каталог pinned + исключения чужих саброутов).
6. Валидация: targeted → lint/tsc/max-lines голыми командами (не пайп!) → build `--webpack` → полный пол фоном → e2e через npm-обёртку на worktree dev (pm2-dev остановить, потом вернуть).
7. 1× fresh code-reviewer (opus) пропорционально диффу → коммит (re-verify ветки!) → PR → merge → ветка/worktree cleanup 0/0/0.
8. Closeout-ветка: артефакт стори (Status: done + Lessons ≤120 симв) → sprint flip → registry строка → `check-lessons-length` + `check:docs` → PR → merge.

**Продолжение = 171.7** (§2.1).
