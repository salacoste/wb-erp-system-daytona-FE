# HANDOFF 2026-09-03 — V15 сессия-2 исполнена (P1 закрыт, P2 волны 1-2, BE-контракт) + полный оставшийся бэклог

> **Аудитория**: агент-команда, продолжающая разработку. Этот документ = вход-точка СЕССИИ-3.
> **Процесс-канон**: [`docs/ORCHESTRATOR-PROMPT-2026-09-02-V14-DEBT-BACKLOG-EXECUTION-OMC.md`](ORCHESTRATOR-PROMPT-2026-09-02-V14-DEBT-BACKLOG-EXECUTION-OMC.md) (петля §0, порядок §7, стопы §8) + [`docs/ORCHESTRATOR-PROMPT-2026-09-02-V15-...`](ORCHESTRATOR-PROMPT-2026-09-02-V14-DEBT-BACKLOG-EXECUTION-OMC.md) — читать В15-промпт от этой даты.
> **Долг-реестры**: [`HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md`](HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md) §4/§8 + [`HANDOFF-2026-09-02-V14-DEBT-SESSION1-...`](HANDOFF-2026-09-02-V14-DEBT-SESSION1-EXECUTION-AND-REMAINING-BACKLOG.md) §3 (статусы обновлены сессией-2) + [`_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`](../_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md).
> **Приоритет при конфликте**: мини-план item'а > этот документ > SESSION1-handoff §3 > FINAL §4/§8 > CLAUDE.md > промпты; живые гейты — финальная инстанция.

---

## 1. Сессия-2 (2026-09-02/03, оркестратор V15): 8 PR, всё merged, cleanup 0/0/0

| # | Item | PR / merge | Содержание | Ревью | Ключевое |
|---|---|---|---|---|---|
| 1 | **D-1 (PB-1)** P1 | #390 / `56529ced` | initiation-mint `ensureSessionNonce` + indeterminate recovery-alert + `finishRecoveryOperation` release; e2e true-pin (двухтабный nonce-nulling, падает на main) | 3 прохода (Trigger 3) | флор 19415→**19421**; открыт `/v1/auth/refresh` 404 (→ стало request #230) |
| 2 | **D-2 (PB-3)** → стоп | #391 / `36916754` | BE-блок: refresh-эндпоинта нет; request-backend #230 создан; реестры → BE-BLOCKED | doc-only | curl-репродукция 404 |
| 3 | **P2 /10-family ASB** | #392 / `c21a571e` | AcceptanceStatusBadge success/warning → solid-пары (4.49/4.24 fail → 5.13/4.81); эскалация high/warning восстановлена бордером /60-vs-/40 | 3 прохода (Trigger 3) | коллапс эскалации пойман pass-2 |
| 4 | **P2 C13+C15** | #393 / `c4c7bf3c` | GapsTable SR-дедуп (aria-label ≠ caption); `ScenarioUrgencyTier` типизация (single classification source) | 2 прохода | флор →**19424** (+3 tier) |
| 5 | **P2 boundary волна-1** | #394 / `d7205094` | financial-summary family ×11 файлов, 58 сайтов → семантические токены; house-rule + харнесс-канон | 2 (REJECT→APPROVE) | boundary **459→401**; пойманы: 3 stale-пина вне семейной директории + незамеренная 4.44 sub-AA пара |
| 6 | **P2 boundary волна-2** | #395 / `86fb550c` | Margin-семейство 29 сайтов (дрейф каталога 58→29!) + **D-4 fold-in**: excellent/critical /15 = 4.19/4.42 живой AA-fail, скрытый аттестацией D-4 → /5 | 2 (APPROVE×2, оба с независимой контраст-математикой) | boundary **401→372**; реестр скорригирован APPEND-only |
| 7 | **BE-handoff пакет** | #396 / `c07cffc6` | вход-док для BE-команды (3 item'а) | doc-only | — |
| 8 | **BE-ответ аннекс** | #397 / `c5ca2669` | контракт refresh согласован; SEC-DOC-1 done-in-branch; queue:down = ложная семантика | doc-only | PB-3 → CONTRACT-READY; 2 FE-хазарда записаны |

Артефакты сессии-2: `_bmad-output/implementation-artifacts/debt-{d1-pb1-silent-cabinet-create, p2-10-family-asb, p2-c13-c15-quality-wave, p2-boundary-wave1-finsum, p2-boundary-wave2-margin}.md` — **волны boundary содержат канон маппинга + house rule + харнесс** — читать перед волнами 3+.

## 2. Живое состояние гейтов (main `c5ca2669`, 2026-09-03)

- Vitest полный **≥ 19 424 / 0** (флор монотонный; CLAUDE.md актуален) · lint 0/0 · tsc 0 · build --webpack 0
- **boundary 372 = baseline** (ratchet ↓ волнами; `scripts/.shadcn-ui-boundary-baseline.txt`) · exceptions 3/3 (waterfall 11 + PriceHistorySheet 6 + FunnelTab 5 — НЕ трогать)
- docs-baseline 95 exit 0 · locale 4 · lessons 0 · privacy = ровно 3 pre-existing (`api-client-401-refresh.test.ts:53,145`, `tasks-enqueue-role-contract.test.ts:75`), 0 новых
- Парity — терминальный, не трогать. Манифест 174.3: регенерация ТОЛЬКО `node scripts/run-story-174-3-state-evidence.mjs --owner-units` (fail-closed)
- Окружение: Node **24.18.0** PATH-пин `/opt/homebrew/opt/node@24/bin` (Node-26 ломает webpack) · PM2 `wb-repricer-frontend-dev` :3100 · BE :3000 жив; **BE пересобран локально 2026-09-03** (refresh жив: 200/ревокация 401; `/v1/health` healthy/queue-up — см. #230 ФИНАЛЬНАЯ; remote publish BE-ветки — открытый BE-вопрос)
- Тест-креды: только в untracked `.env.e2e` (SEC-DOC-1 канон)

## 3. Оставшийся бэклог — по приоритету, с реализационными деталями

### 3.0 P2 волна-3 «AA-quick-wins» — ✅ ИСПОЛНЕНО (2026-09-05, сессия-3; 3 ревью-прохода; ОТКРЫТИЕ: слоистая композитинг-модель — over-card фальсифицирован; структурные ремедии fg-on-tint/solid; артефакт `debt-p2-wave3-aa-quickwins.md` = новый канон; флор →19439)

Все сайты — один и тот же house-rule-паттерн (`/15→/5` или `/10→/5`; канон в `debt-p2-boundary-wave2-margin.md` Follow-ups):

| Файл | Сайты | Замер (light) | Фикс |
|---|---|---|---|
| `src/lib/unit-economics-config.ts` | 3 из 5 entry | pos/15=4.19, **warning/15=3.97 — худший в классе**, neg/15=4.42 | /15→/5 (4.80/5.20 PASS) |
| `src/app/(dashboard)/analytics/sku/components/CashflowRowPrimitives.tsx:27,82,109,152` | 4 /15 | тот же класс | /15→/5 |
| `src/components/custom/pnl-waterfall/GrossProfitSection.tsx` | 2 | тот же класс | /15→/5 |
| `src/components/custom/price-calculator/TwoLevelPriceHeader.tsx:16,23` | 2 | fin-pos/10=4.49, warning/10=4.24 | /10→/5 |
| `src/components/custom/price-calculator/MarginSlider.tsx:33,35` | 2 | 4.24, 4.49 | /10→/5 |
| `src/components/custom/price-calculator/MarginSection.tsx:139` | 1 | 4.49 | /10→/5 |

DoD: все пары ≥4.5 обеих тем (харнесс из артефакта волны-2: `/tmp/p2-bw2-contrast.mjs` паттерн, токены живым grep); тест-пины consumer-тестов grep + ре-пин (урок F1: sweep крыть И consumer-тесты, не только семейную директорию); манифест-пины проверить (consumer tests!). НЕ трогать sku-financials (там fg-on-tint — безопасен).

### 3.1 D-2 (PB-3) — ✅ ИСПОЛНЕНО сессией-2-хвостом (2026-09-03): owner-«ок» получен; live-гейт верифицирован (02:02Z: health healthy, refresh 200/ревокация 401 — см. #230 ФИНАЛЬНАЯ верификация); реализация на ветке debt/d2-pb3-reactive-refresh (3 ревью-прохода)

Контракт (аннекс [`docs/request-backend/230-auth-refresh-endpoint-missing.md`](request-backend/230-auth-refresh-endpoint-missing.md)): `POST /v1/auth/refresh`, Bearer валидного JWT, `{}` → `{token}`; sliding-rotation; **истёкший JWT НЕ обновляется**.

**Re-scope (✅ подтверждён owner 2026-09-03; исполнен)**:
1. Interceptor в api-client: 401 → single-flight refresh (**токен из СТОРА**, не из упавшего запроса — single-use ревокация!) → replay×1 → повторный 401 → существующий logout-путь
2. **Пративный фикс**: `useAuth.refreshTokenIfNeeded` использует store-`login()` → минт новой sessionNonce ломает D-1 settlement in-flight creates → заменить на store-`refreshToken(token, user)` (nonce-сохраняющий)
3. Обновить G4-пин (`api-client-401-refresh.test.ts` — пинит «нет реактивного refresh»)
4. e2e синтетика (route-interpection) ✅ прогнана EXIT=0; **live-верификация ✅ 02:02Z локально** (см. #230 ФИНАЛЬНАЯ); remote post-deploy re-check = BE follow-up
5. ВНЕ скоупа: post-expiration recovery (ждёт BE dedicated refresh-token/grace — расширение тривиально поверх interceptor)

### 3.2 P2 boundary волны 4-5 (остаток 372; live per-file counts 2026-09-03)

Топ-остаток (palette-class): `src/lib/backfill-utils.ts` 21 · `efficiency-filter-config.ts` 20 · `efficiency-utils.ts` 18 · `badges/SourceBadge.tsx` 16 · `lib/coefficient-types.ts` 15 · `jam/RequireJam.tsx` 13 · `expense-chart-badge.tsx` 13 · `AdvertisingEmptyState.tsx` 13 · `profitability-utils.ts` 12 · `fbs-analytics-utils.ts` 12 · `MissingCogsAlert.tsx` 12 · `campaign-utils.ts` 11 · `sync-status-config.ts` 10 · `orders-status-config.ts` 10 · далее хвост (полный live-скан: grep-команда в артефакте волны-2). Волны по 5-10 файлов когерентными семьями; ratchet ↓ baseline тем же коммитом; канон = артефакты волн 1-2. **Chart-hex файлы НЕ трогать** до C5-owner-решения.

**Test-pin residual** (идут со своими волнами): 44 тест-файла пинят любые legacy-классы / 17 — классы волн 1-2 / 9 — только bg-*-50. Pinned scenarioIds «error-colour badge» (MarginByBrand/Category :105/:96 ← `owner-state-evidence-b.ts:502,572`) — НЕ переименовывать до регенерации манифеста раннером.

### 3.3 P2 остальное

- **/80-sweep**: repo-wide `text-*/80` (исторические 3.2-3.45:1) — замер light/dark → solid/exception; кандидат расширения boundary-сканера
- **FE-D1** (mutation retry:1 ретраит 4xx; e2e пинит `putAttempts===2`) — behavior, отдельная стори + e2e-пин
- **FE-D3** (`getErrorMessage` эхо сырого error.message → bounded fallback + scrub + тесты)
- **FE-D5** (cross-tab create duplication → Web Locks API) · **FE-D8** (`getCabinetCreationOperation` middle-path — только по UX-жалобе, fresh-ревью)
- **C8** (FunnelPageContent = 200 строк, следить при касании)
- **logger-redact архитектура** (~84 `logger.error` вне logApiError; redact в `src/lib/logger.ts` покроет все, затронет 131 файл + 52 мока) — рекомендовано owner отдельной волной после boundary
- **financial-foreground токены** — recommendation: НЕ добавлять, пока /5-паттерн закрывает (спрос на solid-чипы появится → добавить)

### 3.4 P3 (по окну)

harness restart-per-run раннер · FR-7 (reseed nmId 202867769 W26 ИЛИ re-pin 2 e2e) · AT-матрица · Manager-creds · docs-95 split · prettier md-долг (~1189, вне npm-гейта) · ~25 route-гардов · pm2 delete 5.

### 3.5 Owner-decision ledger (2026-09-03)

| Решение | Статус |
|---|---|
| D-2 re-scope (§3.1) | ✅ owner-«ок» получено 2026-09-03; ✅ live-гейт SATISFIED 02:02Z (локальная пересборка BE: refresh 200 + ревокация 401, см. #230 ФИНАЛЬНАЯ) — D-2 исполнен |
| C5 chart-palette (гейтит chart-hex трек ~50 сайтов) | ⏳ варианты: categorical token-set (рекомендовано) / расширенные exceptions |
| financial-foreground токены | ⏳ рекомендация: отложить |
| logger-redact волна | ⏳ рекомендация: после boundary |
| FR-7 / AT-матрица / Manager-creds / docs-95 / prettier-md / pm2-id5 | ⏳ P3, быстрые ответы |
| SEC-DOC-1 (все под-item'ы) | ✅ закрыт полностью (FE + BE in-branch; после BE publish — финальная live-проверка) |
| BE queue:down | ✅ фикс активен локально (02:02Z: queue up); remote publish — открытый BE-вопрос |
| BE publish/deploy (remote) | ⏳ локально всё верифицировано (refresh+health+D-2 e2e); остаётся remote-публикация BE-ветки + remote re-check |

## 4. Процесс-канон сессии-3 (свод; полный — V15-промпт)

1. **Петля**: bootstrap (Node-пин! main pull, worktree/branch-занятость) → выбор item'а (§3 порядок) → **105.2 pre-flight** (grep AC; file:line живым grep — каталоги дрейфуют: 58→29 в волне-2!) → мини-план (1 item = 1 ветка/PR) → конвейер A–J → closeout (артефакт + registry-flip + baseline тем же PR) → cleanup 0/0/0.
2. **Делегация**: recon → explore; механика → executor(sonnet); behavior/D-2-interceptor → executor(**opus**); ревью → ТОЛЬКО code-reviewer(**opus**) СВЕЖИЙ контекст на каждый проход; числа — живыми прогонами. Контраст-волны: executor(opus) с харнесс-каноном из артефактов волн.
3. **Ревью-дисциплина**: ≥2 прохода; триггеры (>12 кумулятив / >5 в проходе / novel-pattern / meta-claims) → +проходы. Findings APPLIED/DISPOSITIONED с evidence — оба в артефакт.
4. **Гейты на каждый PR**: §2 таблица; флор монотонен; базлайны — тем же PR.
5. **WCAG-канон волн** (артефакты волн 1-2 — ЕСТЬ ВСЁ): маппинг (grays→muted; money-direction→financial-*; статус-смысл→status-*), house rule (цветной текст на тинте ≥4.5 light → /5 ИЛИ fg/muted; замеренный pass остаётся), харнесс (HSL→sRGB, alpha float-blend над CARD — не background! — в dark), **аттестация валидна только для замеренных пар** (урок D-4).
6. **Ловушки сессии-2** (добавка к V15 §10):
   - Сид-токен e2e = настоящий base64url JSON (битый payload → isTokenExpired fail-safe → logout mid-test)
   - «Спек зелёный» ≠ «пинит дельту» — проверяй падение на main
   - Свип семейной директории крыть И co-located/consumer ТЕСТЫ; «exactly N re-pins» без repo-wide grep ложен
   - Манифест-пин pre-flight: проверять consumer-тесты, не только компоненты; реген — только раннером (ручные SHA-обновления не нормализуют метаданные)
   - TS-narrowing не распространяется на повторный вызов функции — exhaustive-switch требует `const tier = ...`
   - Освобождение in-memory флага меняет достижимость эффектов — ревью каждое удаление conjunct'а
   - Параллельные сессии: transient `src/_ap8_test_tmp_*` файлы пронизывают worktree (ловят glob-развёртку lint/tsc — перепрогон после исчезновения); /tmp-worktree WIP коммитить немедленно
   - e2e против worktree-кода: preflight-wrapper пинит порт 3100 → подмена PM2↔worktree-dev на время прогона (см. D-1 сессии-2); троттл логина 5/ч
   - Атрибут D-2: single-use JWT (читать токен из стора) + sessionNonce (store-`refreshToken`, НЕ `login`)

## 5. Точки входа мейнтейнера

| Ресурс | Путь |
|---|---|
| Процесс V14/V15 | `docs/ORCHESTRATOR-PROMPT-2026-09-02-*.md` |
| Артефакты волн (канон WCAG) | `_bmad-output/implementation-artifacts/debt-p2-boundary-wave{1,2}-*.md` |
| BE-контракт + хазарды | `docs/request-backend/230-auth-refresh-endpoint-missing.md` (ANEX) |
| BE-вход-док | `docs/request-backend/BE-TEAM-HANDOFF-2026-09-03.md` |
| Debt-registry | `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md` |
| Гейты-базлайны | `CLAUDE.md` Accepted Baselines · `scripts/.*-baseline.txt` |
| Каталог boundary | `_bmad-output/planning-artifacts/shadcn-ui-boundary-classification-manifest.md` (+ live-скан: `grep -roE '<legacy-regex>' src --include=*.tsx --include=*.ts | grep -v test | cut -d: -f1 | sort | uniq -c | sort -rn`) |

_Подготовлено оркестратором V15, сессия-2 (2026-09-02/03); факты сверены живыми прогонами на main `c5ca2669`._
