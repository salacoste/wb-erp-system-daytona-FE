# HANDOFF 2026-09-02 — ФИНАЛЬНЫЙ: программа shadcn-миграции завершена (94/94)

> **Этот документ — замена** `docs/HANDOFF-2026-08-30-TEAM-HANDOFF-173.13-EPILOGUE-174-FULL-DEBT.md` и
> `docs/HANDOFF-2026-09-01-TEAM-HANDOFF-174-5-FINAL-CLOSEOUT-AND-DEBT.md` (оба остаются как история; правило
> maintainer-update из их §0/§9 исполнено этой заменой). Глубокий процесс-канон —
> `docs/HANDOFF-2026-08-29-EPIC-173-174-FULL-MIGRATION-AND-DEBT.md` — остаётся справочником §11-долга.
> **Аудитория**: мейнтейнер репо и владелец пост-миграционного долга. **Исполнение бэклога начато**: результаты сессии-1 + реализационная детализация остатка — [`HANDOFF-2026-09-02-V14-DEBT-SESSION1-EXECUTION-AND-REMAINING-BACKLOG.md`](HANDOFF-2026-09-02-V14-DEBT-SESSION1-EXECUTION-AND-REMAINING-BACKLOG.md). **От**: сессий, закрывших Story 174.5.

---

## 1. Программа завершена

**94/94 стори, 9 эпиков, все CLOSED. Окно 2026-08-11 → 2026-09-02. Финальная база main: `0d6225acb9abfafa872d2d2ee45f215594edc4e6`.**

| Эпик                         | Стори | Содержание                                                               |
| ---------------------------- | ----- | ------------------------------------------------------------------------ |
| 166-FE foundation            | 8     | токены, примитивы, композиции, контракты                                 |
| 167-FE AppShell/auth         | 9     | shell + auth/onboarding роуты                                            |
| 168-FE analytics core        | 11    | hub + 10 маршрутов аналитики                                             |
| 169-FE operational analytics | 15    | acquiring/buyout/fbs/funnel/gaps/liquidity/storage/supply                |
| 170-FE marketing analytics   | 7     | advertising/brand/category/cross-reference                               |
| 171-FE                       | 9     | ассортимент и связанные домены                                           |
| 172-FE                       | 17    | прайс-калькулятор и волны миграции                                       |
| 173-FE                       | 13    | settings, shipments, supplies + closeout                                 |
| 174-FE консолидация          | 5     | финальный аудит: parity, boundary, visual/a11y, regression, docs-cleanup |

Финальный аудит: **174.1** parity (feature #369 `4c930a9d`/merge `360c9cb9`, closeout #370 `fbdab2da`, lifecycle #371 `e7d438ce`); **174.2** legacy-removal/boundary (#372, merge `862d45a1`, base `fbdab2da`); **174.3** visual/a11y matrix (#374, `c5605a38`); **174.4** full regression (#375, `a21bf67e`, base `274b76d7`; closeout #376); **174.5** docs/repository closeout (PR #379, base `0d6225ac`).

Route-ledger: **76/76 строк `verified`** (2026-09-02). Полная проверка per-row: 54 строки с полными evidence-цепочками
(implementation + validation + visual/a11y + review + merge + cleanup) + 22 строки (167.4–167.7, 168.1–168.11, 169.1–169.7),
чьи cleanup-ссылки закрыты коллективным live-absence аудитом (`git worktree list` / `branch --list 'cdx/*'` / `ls-remote --heads origin`
= main + 9 automation/openwiki heads). Независимая adversarial-верификация ОПРОВЕРГЛА 4 строки карты билдера (167.5/167.6/167.7 CLEANUP,
167.4 partial) → rescope 18→22, tally full-chain 58→54 (отчёт `/tmp/174.5-verify-map.log`, эфемерен; выводы — в артефакте 174.5).
Все 76 стори-PR-SHA — предки `0d6225ac`. Closeout 174.5 синхронизировал tracker-дрейф: дубль-строка 174.2, 174.3 review→done,
21 замороженная pre-merge Status-строка артефактов (история сохранена в скобках); строки 174.5 и epic-174-fe переведены в done.

## 2. Что теперь представляет собой система

Продуктовый фронтенд целиком стоит на дизайн-системе: shadcn/ui-примитивы (`src/components/ui/**`, CLI-управляемые)

- проектные композиты (`src/components/custom/**`) на семантических токенах из `src/styles/globals.css` —
  статусные роли (`--status-success|warning|error|information|pending`, каждая с парой `*-foreground` для solid-pair поверхностей),
  финансовые направления (`--financial-positive|negative|neutral`), chart-серия `--chart-1..6`, светлые/тёмные темы.
  AppShell (167.1) — общий каркас защищённых роутов; таблицы и графики следуют единым паттернам (caption/идентичность,
  `tabular-nums`, declared narrow-width strategy; title/period/units, legend, tooltip, reduced-motion, доступное резюме).

Ownership зафиксирован route-ledger'ом: каждый `src/app/**/page.tsx` ровно один раз, «page.tsx ≠ вся поверхность»,
шаред-зависимость (≥2 потребителя) требует именованного owner-Story. Дисциплина доставки — одна стори/ветка/worktree/PR
с evidence-схемой (implementation, validation, visual/a11y, review, merge, cleanup) — исполнялась все 94 стори;
legacy-palette остался только как ratchet-зарегистрированный residue (см. §4).

**Полные контракты доставки** (tokens/primitives/compositions/ownership/responsive/a11y/workflow + final gates + exceptions +
evidence index) — в [`_bmad-output/planning-artifacts/shadcn-migration-final-delivery-manifest.md`](../_bmad-output/planning-artifacts/shadcn-migration-final-delivery-manifest.md).
Программная ретроспектива (темы/уроки 166→174) — в [`_bmad-output/implementation-artifacts/epic-166-174-program-retrospective-2026-09-02.md`](../_bmad-output/implementation-artifacts/epic-166-174-program-retrospective-2026-09-02.md).

## 3. Финальные гейты и как их перепрогнать

| Гейт           | Команда                                          | Результат / семантика                                                                        |
| -------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Vitest         | `npm test -- --run`                              | **19 363 passed / 0 failed** (1 270 + 4 файлов); floor — см. CLAUDE.md                       |
| Lint           | `npm run lint`                                   | 0 errors / 0 warnings (zero-warning policy)                                                  |
| Types          | `npm run type-check`                             | 0                                                                                            |
| max-lines      | `npm run check:max-lines`                        | OK                                                                                           |
| Build          | `npx next build --webpack`                       | 0 (только `--webpack`; Turnopack-режим не поддерживается окружением)                         |
| UI boundary    | `node scripts/check-shadcn-ui-boundary.mjs`      | 459 = 459 ratchet PASS (exit 1 только на рост); self-suite 10/10; 3 registered exceptions (FeedbackButtons lifted 2026-09-02, D-3) |
| Parity         | `node scripts/check-shadcn-migration-parity.mjs` | терминальное состояние: 33/33 self-tests + corpus 0 errors на пиннед-базе — см. заметку ниже |
| check:docs     | `bash scripts/check-doc-citations.sh`            | exit 0 при точном совпадении с baseline **95** (исторические)                                |
| locale-percent | `bash scripts/check-locale-percent.sh`           | 4 (ratchet ↓; проверять exit-код напрямую, не через pipe)                                    |
| lessons-length | `bash scripts/check-lessons-length.sh`           | 0                                                                                            |

**Maintainer-заметка по parity-гейту.** `node scripts/check-shadcn-migration-parity.mjs` — это гейт стори-worktree,
пиннированный к `EXPECTED_BASE_SHA` (= `0d6225acb9abfafa872d2d2ee45f215594edc4e6`, база 174.5). На main после мержа он
сообщает **base-sha-mismatch BY DESIGN** (прецедент 174.1). Corpus-only режим: `STORY_174_1_SKIP_SELF_TESTS=1` (тот же пин).
Перепроверка: запустить в worktree, основанном на пиннед-SHA, ИЛИ перепиннировать константу на новую стори-базу.
Ledger-каноническое ожидание переведено `planned → verified` — гейт зафиксировал терминальное состояние программы.

## 4. Debt escalation — owner-scoped регистр (всё, что осталось)

> Ничто из перечисленного не блокирует программу; всё — решения владельца репо. Статусы по словарю §11.9 канона 2026-08-29.

| ID                          | Статус                   | Что                                                                                                                                                                                                                                                             | Фикс-канон / next-best                                                                                                         | Evidence                                                                                        |
| --------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| **PB-1**                    | **RESOLVED (2026-09-02)** | Silent cabinet-create: nonce-less session → settlement `indeterminate` → `handleCreateCabinet` молча скипает, recovery-алерт не рендерится (`src/lib/api.ts:128` + `src/stores/authStore.ts` sessionNonce)                                                      | initiation-mint `authStore.ensureSessionNonce()` (mint-before-capture) + indeterminate recovery-alert (`SAFE_RECONCILIATION_MESSAGE`) + release `finishRecoveryOperation` в non-applied ветке (D-1, сессия-2, PR #390); артефакт `debt-d1-pb1-silent-cabinet-create.md` | артефакт волны D-1; e2e true-pin двусторонне (main FAILS / ветка passes); follow-ups: BE нет `/v1/auth/refresh`, decodeJWT padding-хрупкость |
| **PB-2**                    | **RESOLVED (2026-09-02)** | Nested `<main>` на `/analytics/ai-admin/preferences` (+ параллельная локация `/analytics/ai-admin/models` — propagation 97.1)                                                                                                                                 | `<main>` → `<div>` (классы сохранены; единственный main = shell `layout.tsx:113`); e2e-комментарий обновлён (D-5, PR #385); артефакт `debt-d5-pb2-nested-main.md` | артефакт волны D-5 |
| **PB-3**                    | **BE-BLOCKED (2026-09-02)** | Нет реактивного 401-refresh в api-client (только proactive `useAuth.refreshTokenIfNeeded`)                                                                                                                                                                      | 401-replay в клиенте — **невозможно до BE-контракта**: refresh-эндпоинта нет (auth.controller = register/login/logout; `/v1/auth/refresh` → 404); owner-запрос `docs/request-backend/230-auth-refresh-endpoint-missing.md` (сессия-2) | G4-тест пинит фактическое поведение: `src/lib/api/__tests__/api-client-401-refresh.test.ts`; curl-репродукция 404 в request #230 |
| **PB-4**                    | **RESOLVED (2026-09-02)** | FeedbackButtons `text-green-700` (#15803d): **3.53:1 на dark-теме** — WCAG AA fail (light 5.02:1, muted 4.56:1); origin-комментарий `FeedbackButtons.tsx:16` ошибочно заявляет "~6.5:1"; ссылки "F-10 TECH-DEBT ledger" (boundary-скрипт + manifest §7) висячие | solid-пара `bg-status-success text-status-success-foreground` + чип-геометрия (канон 173.12); origin-комментарий переписан; контраст 5.13/8.00 live-вычислен (D-3, PR #384); артефакт `debt-d3-d4-wcag-solid-pairs.md` | артефакт волны D-3+D-4 |
| **/15-family**              | **RESOLVED (2026-09-02, скоуп D-4)** | text-status на /15-тинтах <4.5:1: `src/components/custom/price-calculator/margin-status-helpers.ts:13,16` + `AcceptanceStatusBadge.tsx:49`                                                                                                        | solid-пары применены (D-4, PR #384); контраст 4.81/11.41 live-вычислен; остаток ~100 /15-сайтов по репо — owner-scoped sweep (реестр disclosure (7)) | артефакт волны D-3+D-4 |
| **/10-family ASB**          | **RESOLVED (2026-09-02, сессия-2)** | AcceptanceStatusBadge success/warning на /10-тинтах: light 4.49/4.24 <4.5 AA fail                                                                                                                                           | solid-пары (5.13/4.81 light, ≥8.0 dark); high re-дифференцирован бордером /60 (эскалация); destructive /10 = 5.55 задокументирован; артефакт `debt-p2-10-family-asb.md`; сиблинг-/10-остаток (~100 сайтов) — owner-sweep residual (семейство disclosure (7)) | артефакт волны P2-ASB |
| **/80-sweep**               | confirmed-live           | repo-wide `text-*/80` (pricing/automation/cashflow/popover + hover) — исторические 3.2–3.45:1                                                                                                                                                                   | замер light/dark → replace/`accepted-exception`; кандидат на расширение boundary-сканера                                       | канон §11.3 (2026-08-29)                                                                        |
| **boundary cat-1**          | registered residue       | 459 нарушений superset-скана по ~59 файлам (legacy-palette в live-компонентах)                                                                                                                                                                                  | **owner-sweep через ratchet** (C14-паттерн); НЕ механическая замена — каждый файл с import-closure/контекстом                  | `shadcn-ui-boundary-classification-manifest.md`                                                 |
| **BOUNDARY_EXCEPTIONS ×3**  | owner-accepted           | waterfall categorical hex (C5, 11 hex + 2 токена на 13 серий); `#7C3AED` chart-метки ×2 (PriceHistorySheet, FunnelTab — 170.x carry-out); FeedbackButtons-исключение **снято 2026-09-02** (PB-4 fixed via solid-pair, D-3; self-test 4→3)                          | подтверждены 174.5; снятие остальных — только через owner-решение (chart-palette для C5)                                       | `scripts/check-shadcn-ui-boundary.mjs` + manifest §7                                            |
| **C6**                      | RESOLVED                 | tabular-nums в таблицах acquiring                                                                                                                                                                                                                               | resolved-by-migration (RTC-тесты пинят)                                                                                        | RTC-тесты                                                                                       |
| **C13**                     | still-open               | GapsTable caption-dup (`src/app/(dashboard)/analytics/gaps/components/GapsTable.tsx:65,67`)                                                                                                                                                                     | дедуплировать caption                                                                                                          | канон §11.2                                                                                     |
| **C15**                     | still-open               | `URGENCY_CLASS` локализованные ключи (`src/app/(dashboard)/analytics/liquidity/components/LiquidationScenarioCard.tsx:20-24`)                                                                                                                                   | типизировать по статусам                                                                                                       | канон §11.2                                                                                     |
| **C5**                      | still-open               | waterfall dual authority (hex ↔ токены)                                                                                                                                                                                                                         | ждать chart-palette owner-решения                                                                                              | manifest §7                                                                                     |
| **C8**                      | at-cap                   | `FunnelPageContent` ровно 200 строк (хелперы извлечены)                                                                                                                                                                                                         | следить при любом касании                                                                                                      | max-lines гейт                                                                                  |
| **FE-D1/D3/D5/D8**          | open (owner-trigger)     | mutation retry:1 ретраит 4xx; getErrorMessage raw message; cross-tab cabinet CAS/Web Locks; SAFE_RECONCILIATION stuck-path                                                                                                                                      | по канону §11.1 (2026-08-29)                                                                                                   | канон §11.1                                                                                     |
| **FE-D9**                   | **RESOLVED (2026-09-02)** | `logApiError` пишет не-2xx тела вкл. секреты                                                                                                                                                                                                                    | redact-слой `redactSensitive` (обе ветки logApiError, PR #382); остаточные риски — в артефакте                                 | артефакт `debt-fe-d9-redact-logger.md`                                                          |
| **SEC-DOC-1**               | **RESOLVED (2026-09-02, полностью)** | plaintext-креды в tracked docs                                                                                                                                                                                                                   | FE: оба литерала (stale + live) изъяты, non-echoing скан = 0 (PR #383); ротация live-креда ИСПОЛНЕНА владельцем 2026-09-02 (re-seed «password re-hashed») и верифицирована оркестратором (login 200, 1 попытка); D-4 сканер `.http` — исполнен (PR #386); каноническое значение — только untracked `.env.e2e`; BE-репо (135 stale) + history — D-2/D-3 (рекомендация: history не трогать) | артефакт `debt-sec-doc-1-redact-creds.md` + decision-запрос |
| **FR-7**                    | environment-gap          | nmId 202867769 W26 FBS-варианты отсутствуют после DB-resееда → 2 e2e непрогоняемы                                                                                                                                                                               | ресид данных ИЛИ re-pin на актуальный nmId/неделю; graceful-empty доказан снапшотом                                            | артефакт 174.4                                                                                  |
| **AT-матрица**              | environment-gap          | Реальные VoiceOver/NVDA/JAWS/TalkBack не исполнялись. Доказано: Chromium+Firefox keyboard, WebKit semantic proxy, axe, 200% zoom ×76 роутов ×2 темы                                                                                                             | прогнать реальные SR ИЛИ принять как остаточный release-risk                                                                   | артефакт 174.3                                                                                  |
| **Manager-creds**           | частично                 | Manager-джорни пропущены (optional skips 22–23 шт.)                                                                                                                                                                                                             | прогнать с кредами ИЛИ зафиксировать optional-статус                                                                           | артефакт 174.4                                                                                  |
| **harness: dev-server**     | canon                    | деградация общего `next dev` под повторными прогонами                                                                                                                                                                                                           | рестарт на прогон (tmp-worktree + свой сервер в раннерах)                                                                      | урок 174.3/174.4                                                                                |
| **harness: login-throttle** | canon                    | BE-логин троттл 5/час общий; каждая wrapper-инвокация = попытка                                                                                                                                                                                                 | ≤2 прогона/час; пауза 60+ мин при 429                                                                                          | §3E (2026-09-01)                                                                                |
| **harness: storageState**   | canon                    | TTL ~1 час; префлайт считает протухшую сессию свежей                                                                                                                                                                                                            | `rm e2e/.auth/user.json` при странностях                                                                                       | §3E (2026-09-01)                                                                                |
| **174.3 SHA-пины**          | active guard             | ЛЮБАЯ правка пиннед e2e-спеки ломает module-load всего e2e                                                                                                                                                                                                      | регенерация только `scripts/run-story-174-3-state-evidence.mjs --owner-browsers`                                               | артефакт 174.3                                                                                  |
| **format:check**            | P3                       | 39 pre-existing warnings                                                                                                                                                                                                                                        | свести к 0 при удобном окне                                                                                                    | локальный прогон                                                                                |
| **docs-95**                 | P3                       | baseline 95 broken исторических цитат                                                                                                                                                                                                                           | canonical-vs-archival split — решение owner'а                                                                                  | `scripts/.check-docs-baseline.txt`                                                              |
| **route-guards**            | P3                       | ~25 гардов с разными формами каталогов                                                                                                                                                                                                                          | унификация exact-array                                                                                                         | канон §11                                                                                       |
| **pm2**                     | оперативная чистка       | stopped-регистрация `wb-repricer-frontend` (id 5)                                                                                                                                                                                                               | `pm2 delete 5 && pm2 save` по желанию                                                                                          | локальный pm2                                                                                   |

## 5. Owner-decision checklist (явные запросы)

1. **PB-1/PB-3** — триаж продуктовых дефектов (приоритет: PB-1 silent-failure, PB-3 auth-UX); PB-4 — ✅ resolved 2026-09-02 (D-3, PR #384); PB-2 — ✅ resolved 2026-09-02 (D-5, PR #385).
2. **WCAG-свипы** — `/15-family` зарегистрированный скоуп — ✅ resolved 2026-09-02 (D-4, PR #384; остаток ~100 /15-сайтов — owner-sweep); `/80-sweep` (замер → replace/exception) — остаётся.
3. **Boundary owner-sweep** — 459 residue по ~59 файлам через ratchet; это НЕ механическая замена.
4. **Security-lane** — FE-D9 (`logApiError` секреты, HIGH) — ✅ выполнено 2026-09-02 (PR #382) + SEC-DOC-1 — ✅ redacted 2026-09-02 (оба литерала, скан=0, артефакт `debt-sec-doc-1-redact-creds.md`); осталось: ротация live-креда + BE-репо + history — owner-запрос `docs/security/SEC-DOC-1-rotation-owner-decision-2026-09-02.md`.
5. **FR-7** — ресид данных или re-pin nmId/недели для 2 замороженных e2e.
6. **AT-матрица** — прогнать реальные скрин-ридеры ИЛИ письменно принять остаточный release-risk.
7. **Manager-креды** — прогнать джорни с кредами ИЛИ зафиксировать optional-статус skips.
8. **docs-95** — решение canonical-vs-archival split (обновить baseline осознанно).
9. **pm2** — удалить stopped-регистрацию id 5.
10. (P3, по окну) format:check 39 → 0; унификация ~25 route-гардов.

Развёртка этого чеклиста в исполняемые дорожки (P0→P3, шаги + DoD) — §8 ниже.

## 6. Точки входа мейнтейнера

| Ресурс                                                   | Путь                                                                                                                                                                                                                                      |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Статус/долг-реестр программы                             | [`_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`](../_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md)                                                                         |
| Route-ledger + §174.5 Final Verification Evidence        | [`_bmad-output/planning-artifacts/shadcn-route-ledger.md`](../_bmad-output/planning-artifacts/shadcn-route-ledger.md)                                                                                                                     |
| Final delivery manifest (контракты + gates + exceptions) | [`_bmad-output/planning-artifacts/shadcn-migration-final-delivery-manifest.md`](../_bmad-output/planning-artifacts/shadcn-migration-final-delivery-manifest.md)                                                                           |
| Программная ретроспектива                                | [`_bmad-output/implementation-artifacts/epic-166-174-program-retrospective-2026-09-02.md`](../_bmad-output/implementation-artifacts/epic-166-174-program-retrospective-2026-09-02.md)                                                     |
| Артефакты финальных сторий                               | `_bmad-output/implementation-artifacts/174-{1..5}-fe-*.md` (76-row evidence-таблица — в 174-5)                                                                                                                                            |
| Живая история по стори                                   | `_bmad-output/implementation-artifacts/sprint-status.yaml`                                                                                                                                                                                |
| Boundary-классификация                                   | `_bmad-output/planning-artifacts/shadcn-ui-boundary-classification-manifest.md`                                                                                                                                                           |
| Гейты                                                    | `scripts/check-shadcn-ui-boundary.mjs`, `scripts/check-shadcn-migration-parity.mjs`, `scripts/check-doc-citations.sh`, `scripts/check-locale-percent.sh`, `scripts/check-lessons-length.sh`, `scripts/run-story-174-3-state-evidence.mjs` |

## 7. Процессные архивы (история)

- Процесс-каноны: `docs/ORCHESTRATOR-PROMPT-2026-08-31-V12-TEAM-HANDOFF-EXECUTION.md` (конвейер A–J), `docs/ORCHESTRATOR-PROMPT-2026-09-01-V13-FINAL-STORY-174-5-OMC.md` (финальная стори, subagent-group).
- Прошлые handoff'ы (исторические, заменены этим документом): `docs/HANDOFF-2026-08-29-EPIC-173-174-FULL-MIGRATION-AND-DEBT.md` (глубокий канон §11 — остаётся справочником долга), `docs/HANDOFF-2026-08-30-TEAM-HANDOFF-173.13-EPILOGUE-174-FULL-DEBT.md`, `docs/HANDOFF-2026-09-01-TEAM-HANDOFF-174-5-FINAL-CLOSEOUT-AND-DEBT.md`.
- Окружение (было верно на момент закрытия): Node 24.18.0 PATH-пин `/opt/homebrew/opt/node@24/bin`; npm 11.11.0; build только `npx next build --webpack`; e2e только `npm run test:e2e[:full]`; FE :3100, BE :3000, BE Swagger `/api`, health `/v1/health`.

## 8. Рабочий скоуп для принимающей команды (внедренческий бэклог, 2026-09-02)

> Развёртка регистра §4 в исполняемый план: дорожки P0→P3, шаги, definition-of-done. Новых фактов нет — только организация. Каждая дорожка = своя ветка/PR; на каждый PR — гейты §3 + CLAUDE.md «Accepted Baselines» (правила сдвига базлайнов — тем же коммитом).

### P0 — Security-lane (рекомендуется первым)

| #   | Задача                                                                        | Шаги                                                                                                                                                                 | DoD                                                                |
| --- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| S-1 | ✅ DONE (2026-09-02, PR #382) — **FE-D9** — `logApiError` пишет тела не-2xx ответов (могут содержать секреты) | найти все вызовы (`rg -n "logApiError" src/`); ввести redact-слой (паттерны ключей: token/password/secret/authorization/cookie); добавить vitest на redact-правила   | ни один вызов не логирует raw-тело; redact-правила покрыты тестами — выполнено (49+3 теста, флор 19415/0) |
| S-2 | ✅ DONE (2026-09-02, PR #383/#386) — **SEC-DOC-1** — plaintext-креды в tracked docs | составить каталог вхождений (поиск по паттернам кредов в `docs/`, `*.md`, HTTP-файлам); заменить на env-ссылки/плейсхолдеры; затронутые креды **ротировать** (owner) | каталог пуст — выполнено (35 файлов, оба литерала, скан=0); D-4 сканер `.http` — исполнен (PR #386); ротация — ИСПОЛНЕНА владельцем + верифицирована (login 200) |

### P1 — Продуктовые дефекты (каждый = отдельная стори, behavior-changing → 2 прохода ревью)

| #   | Дефект                                    | Фикс                                                                                                                                                                      | Точки входа                                                                                             |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| D-1 | ✅ DONE (2026-09-02, сессия-2, PR #390) — **PB-1** silent cabinet-create | initiation-mint `ensureSessionNonce` (mint-before-capture) + indeterminate recovery-alert + `finishRecoveryOperation` release; e2e true-pin ([P0] двухтабный nonce-nulling — падает на main); 3 ревью-прохода; артефакт `debt-d1-pb1-silent-cabinet-create.md` | `src/stores/authStore.ts`, `src/services/cabinets.service.ts`, `src/components/custom/useCabinetCreateMutation.ts` |
| D-2 | **PB-3** нет реактивного 401-refresh      | перехват 401 в api-client → refresh → replay (1 повтор); обновить G4-пин на новое поведение                                                                               | `src/lib/api-client.ts`, `src/lib/api/__tests__/api-client-401-refresh.test.ts`                         |
| D-3 | ✅ DONE (2026-09-02, PR #384) — **PB-4** FeedbackButtons dark-fail 3.53:1 | solid-пара `bg-status-success text-status-success-foreground` + чип-геометрия; origin-комментарий переписан; boundary-исключение снято (Map 4→3, self-test синхронен)      | `src/components/custom/ai/FeedbackButtons.tsx`; `scripts/check-shadcn-ui-boundary.mjs` + manifest §7    |
| D-4 | ✅ DONE (2026-09-02, PR #384) — **/15-family** <4.5:1 | те же solid-пары (канон 173.12 / 174.4-D5); замер обеих тем: 4.81/11.41 (warning), 5.13/8.00 (success) — все ≥4.5 PASS                                        | `src/components/custom/price-calculator/margin-status-helpers.ts:13,16`, `AcceptanceStatusBadge.tsx:49` |
| D-5 | ✅ DONE (2026-09-02, PR #385) — **PB-2** nested `<main>` | убрать дублирующий landmark — сделано на ОБОИХ роутах: preferences + models (параллельная локация, propagation 97.1); sweep: единственный `<main>` в (dashboard) = shell layout | `src/app/(dashboard)/analytics/ai-admin/preferences` (+ models) |

### P2 — Качество/консистентность (волнами)

- **boundary 459 owner-sweep**: волнами по 5–10 файлов из каталога `shadcn-ui-boundary-classification-manifest.md` (per-route counts); каждый файл — import-closure + контраст-замер, НЕ механическая замена; снижение `scripts/.shadcn-ui-boundary-baseline.txt` тем же коммитом (ratchet ↓ только).
- **/80-sweep**: замер light/dark по всем `text-*/80` → replace на семантические пары или accepted-exception; кандидат на расширение boundary-сканера.
- **C13** GapsTable caption-dup (`GapsTable.tsx:65,67`); **C15** URGENCY_CLASS типизация (`LiquidationScenarioCard.tsx:20-24`); **C5** waterfall dual-authority — ждёт owner-решения по chart-palette (13 серий / 11 hex + 2 токена); **C8** FunnelPageContent — на капе 200 строк, следить при касании.
- **FE-D1/D3/D5/D8** — по канону §11.1 (`HANDOFF-2026-08-29`): mutation-retry на 4xx, getErrorMessage raw, cross-tab cabinet CAS, SAFE_RECONCILIATION stuck-path.

### P3 — Инфраструктура/процесс (по удобному окну)

- harness: обобщить restart-per-run раннер (tmp-worktree + собственный дев-сервер на прогон) — канон 174.3.
- FR-7: ресид тест-данных ИЛИ re-pin на актуальный nmId/неделю (2 замороженных e2e).
- AT-матрица: реальные скрин-ридеры (VoiceOver/NVDA/JAWS/TalkBack) ИЛИ письменный owner-accept остаточного риска.
- Manager-creds: прогон Manager-джорней с кредами ИЛИ фиксация optional-статуса ~22-23 скипов.
- docs-95: canonical-vs-archival split → осознанный `bash scripts/check-doc-citations.sh --update-baseline` с разбором NEW/RESOLVED.
- format:check 39→0; унификация ~25 route-гардов к exact-array; `pm2 delete 5 && pm2 save` (stopped-регистрация).

### Как работать в этом репо (свод для новой команды)

- **Гейты на каждый PR**: `npm run lint` (0 errors / 0 warnings) · `npm run type-check` (0) · `npm run check:max-lines` · `npx next build --webpack` · полный `npm test -- --run` (floor **19 363**, монотонный: падения недопустимы, рост — ок) · boundary/docs/locale/lessons по таблице §3. Полные правила и базлайны — CLAUDE.md «Accepted Baselines».
- **Процесс**: двухпроходное ревью в свежих контекстах обязательно для behavior-changing кода; Change Log стори APPEND-ONLY; close-строка с `**Lessons:**` ≤120 симв/пункт; вместо TODO — `PENDING BACKEND:`/`FUTURE:` со ссылкой на файл-запрос.
- **Worktree-паттерн**: `git worktree add -b <branch> /private/tmp/<name> main` + `ln -s <primary>/node_modules <wt>/node_modules` + копии `.env.local`/`.env.e2e`; после merge — удалить ветку (local+remote), worktree, `git worktree prune`, приложить absence-evidence.
- **e2e-ловушки**: пиннед-спеки 174.3 руками НЕ править (SHA-манифест ломает module-load всей e2e; регенерация только `scripts/run-story-174-3-state-evidence.mjs --owner-browsers`); storageState TTL ~1 ч (при странностях `rm e2e/.auth/user.json`); BE-логин троттл 5/ч (≤2 прогона/час, пауза 60+ мин при 429, fail-попытки тоже жгутся); дев-сервер деградирует — рестарт на каждый тяжёлый прогон; `networkidle` не использовать (фоновый поллинг).
- **Запреты**: `src/components/ui/**` только через `npx shadcn@latest add`; force-push и прямые пуши в main; обязательные CI-гейты без owner-решения; `any`/`as`-касты; `?? 0` на money/ratio полях (анти-паттерн #8 — сохранять null → «—»); линтер-директивы без канонического allowlist-формата.

_Подготовлено в closeout Story 174.5 (94/94); факты сверены с живыми реестрами на базе `0d6225acb9abfafa872d2d2ee45f215594edc4e6`. §8 добавлен пост-closeout (2026-09-02, docs-PR) по запросу владельца — развёртка §4/§5 в рабочий бэклог; регистр долга не менялся._
