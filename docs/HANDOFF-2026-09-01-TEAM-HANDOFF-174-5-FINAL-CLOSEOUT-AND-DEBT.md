# HANDOFF 2026-09-01 — Принимающей команде: Story 174.5 (финальная, 94/94) + полный техдолг

> **Аудитория**: команда, выполняющая ПОСЛЕДНЮЮ стори программы shadcn-миграции — **174.5 Finalize Documentation and Repository Cleanup** — и владеющая пост-миграционным долгом.
> **От**: сессий-оркестраторов, закрывших 174.2 (PR #372/#373) и 174.4 (PR #375/#376); параллельная lane закрыла 174.1 (#369–#371) и 174.3 (#374).
> **Дата**: 2026-09-01. **main**: `c8b59455` (IN-SYNC, чисто, 0 worktrees/веток/PR, pm2-dev online :3100, BE :3000).
> **Статус программы**: **93/94** стори. Эпики 166–173 ✅ CLOSED; **Epic 174 = 4/5** (174.1 parity, 174.2 legacy-removal/boundary, 174.3 visual/a11y matrix, 174.4 full regression — все с lifecycle-записями). Осталась **174.5**.
> **Живые гейты на main**: vitest **≥ 19 363 / 0 failed**; lint 0/0; tsc 0; max-lines OK; **ui-boundary 459** (ratchet, `node scripts/check-shadcn-ui-boundary.mjs`); check:docs exit 0 (baseline **95**); locale-percent 4; lessons-length 0; e2e: полный suite на свежем дев-сервере ~924+/25− (остаток = флейки деградации + FR-7, см. §3D-E).

---

## 0. Executive snapshot — что делать

| # | Действие | Authoritative | Готовность |
|---|---|---|---|
| 1 | **Story 174.5** — финальный documentation/repository closeout → **94/94** | [`.omx/plans/174.5-finalize-documentation-and-repository-cleanup.md`](../.omx/plans/174.5-finalize-documentation-and-repository-cleanup.md) | Branch `cdx/epic-174-story-5-docs-cleanup`, worktree `/private/tmp/wb-repricer-fe-174-5-docs-cleanup` |
| 2 | Эпик-174 flip + **программная retrospective** (накоплено: см. §4) | sprint-status.yaml | Прецедент flip: PR #326 |
| 3 | Post-close: владелец решает судьбу НЕ-миграционного долга (§3A-B, §3F — вне 174.5) | — | escalation через PR/issue |

**174.5 — documentation-only стори** (runtime-прод неизменен). Её обязательный объём (из плана):
1. Синхронизировать canonical design-system/migration docs с фактически merged системой (tokens, primitives, compositions, ownership, responsive, a11y, delivery contracts).
2. **Route-ledger: 79 строк со статусом `planned` → `verified`** — только при полном linked evidence (implementation + validation + visual/a11y + review + merge + cleanup). 174.1 доказал parity множеств; 174.3 дал visual/a11y-матрицу; 174.4 — функциональную регрессию. Ссылки на evidence — из артефактов сторий.
3. Проверить ВСЕ doc/evidence-ссылки; собрать final delivery manifest.
4. Закрыть или owner-accept все exception-записи (BOUNDARY_EXCEPTIONS ×4 + см. §3).
5. **Tracker-sync (известный дрейф — точные строки)**: sprint-status.yaml:860 — дублированная stale-строка `174-2-fe-…: backlog` (удалить; валидная done-строка на :861); :862 — `174-3-fe: review` → `done` (PR #374 смержен+вычищен давно; артефакт 174.3 тоже говорит review — синхронизировать); при закрытии — flip `174-5` → done, `epic-174-fe` → done, программа 94/94.
6. Удалить completed ветки/worktrees (сейчас: **чисто** — только absence-evidence); `git worktree prune`.
7. Финальные parity/docs/lint/tsc/max-lines/build проверки; docs-diff only.
8. **Retrospective** (или явная disposition) — эпики 173/174 + программная (см. §4 — заготовка тем).
9. Заменить этот и предыдущие team-handoff'ы финальным 94/94-документом (maintainer rule из HANDOFF-2026-08-30 §9).

---

## 1. Порядок чтения (authority hierarchy)

1. **План стори** `.omx/plans/174.5-*.md` — authoritative при любом конфликте.
2. [HANDOFF-2026-08-29-EPIC-173-174 §11](./HANDOFF-2026-08-29-EPIC-173-174-FULL-MIGRATION-AND-DEBT.md#11-complete-known-technical-debt-and-carry-out-register) — глубокий канонический долг-регистр (FE-D*, C1–C17, контраст-семьи, 11.9 словарь статусов).
3. Этот документ — актуализация состояния + консолидированный долг (дополнения 174.2/174.4 + свежие статусы всех пунктов аудита 2026-08-31).
4. Реестры: [sprint-status.yaml] (живая история), [shadcn-migration-status-and-debt-registry.md] (NEXT/SHIPPED/APPEND'ы), [shadcn-ui-boundary-classification-manifest.md] (классификация 94→6 категорий).
5. Операционный промпт: [ORCHESTRATOR-PROMPT-2026-08-31-V12](./ORCHESTRATOR-PROMPT-2026-08-31-V12-TEAM-HANDOFF-EXECUTION.md) — конвейер A–J, делегационная матрица, ловушки.

---

## 2. Верифицированные гейты/числа (на `c8b59455`)

| Гейт | Значение | Источник |
|---|---|---|
| Vitest floor | **19 363 / 0 / (1270+4) файлов** | live run 174.4 (19118 после 174.2-чистки + 237 окно 174.3 + 8 контрактов 174.4) |
| UI boundary | **459** (ratchet; ↓64 от 523 — дроп из 174.3-окна, lowering 174.4) | `node scripts/check-shadcn-ui-boundary.mjs` |
| Boundary self-suite | 10/10 node:test | там же |
| Lint / tsc / max-lines / prettier-changed / build --webpack / diff --check | 0 / 0 / OK / clean / 0 / clean | 174.4 closeout |
| check:docs | exit 0, baseline **95** broken (исторические) | `scripts/.check-docs-baseline.txt` |
| lessons / locale-percent | 0 / 4 | гейты |
| Full e2e (`test:e2e:full`) | свежий сервер ~924 passed; полный зелёный недостижим за 1 прогон на общей машине — см. §3E harness | логи `/tmp/174.4-*.log` (эфемерны; ключевые числа — в артефактах 174-2/174-4) |

**Дев-сервер = переменная окружения, не код**: рестарт на каждый тяжёлый прогон (канон 174.3 tmp-worktree; урок 174.4). Auth = Bearer/localStorage; storageState протухает ~час — префлait может не обновить (rm `e2e/.auth/user.json` при странностях). BE-логин троттл **5/ч общий** — каждая wrapper-инвокация = попытка.

---

## 3. Консолидированный техдолг (всё, что осталось)

> Статусы по словарю §11.9. Всё, что отмечено «owner decision», НЕ входит в 174.5 — выносится владельцу репо.

### A. Продуктовые дефекты (filed, требуют owner-координации; не блокируют 174.5)

| ID | Статус | Дефект | Evidence |
|---|---|---|---|
| **PB-1** | confirmed-live | **Silent cabinet-create failure**: nonce-less session → `evaluateCabinetSettlement='indeterminate'` → `handleCreateCabinet` молча скипает → recovery-алерт не рендерится. `src/lib/api.ts:128` (`createCabinet`) + `src/stores/authStore.ts:28`-89 (sessionNonce lifecycle); точные строки settlement-скипа — артефакт 174.4 (D3-волна) | devserver-лог 503 + settlement-skip (артефакт 174.4); e2e-сид nonce обходит — реальный юзер нет |
| **PB-2** | confirmed-live | Nested `<main>` на `/analytics/ai-admin/preferences` | report-only (D3) |
| **PB-3** | confirmed-live | **Нет реактивного 401-refresh** в api-client (только proactive `useAuth.refreshTokenIfNeeded`; при протухшем между тиками токене — 401 без replay) | G4-тест пинит фактическое поведение: `src/lib/api/__tests__/api-client-401-refresh.test.ts` |

### B. WCAG / контраст (P2, качество; канон фикса известен)

| ID | Статус | Что | Фикс-канон |
|---|---|---|---|
| **/15-family** | confirmed-live | `margin-status-helpers.ts:13,16` + `AcceptanceStatusBadge.tsx:49` — text-status на /15-тинтах <4.5:1 (та же семья, что DrrSlider 3.96/4.21 в 174.4) | solid-пары `bg-status-X text-status-X-foreground` (173.12/174.4-D5) |
| **/80-sweep** | confirmed-live | repo-wide `text-*/80` (pricing/automation/cashflow/popover + hover-варианты) — исторические 3.2–3.45:1 (§11.3) | замер light/dark → replace/`accepted-exception`; кандидат на расширение boundary-сканера |

### C. Design-system residue (ratchet-registered, не runtime-дефекты)

- **Boundary cat-1 residue: 459 нарушений** (superset-скан) по ~59 файлам — legacy-palette в live-компонентах (financial-summary семейство ×11, margin-семейство, ComparisonBadge ×19 импортёров, TrendIndicator ×10, expense-chart и др.). Полный файловый список + per-route counts: [classification manifest](_bmad-output/planning-artifacts/shadcn-ui-boundary-classification-manifest.md). Диспозиция: owner-sweep через ratchet (C14-паттерн; exit-1 только на рост). НЕ механическая замена — каждый файл с import-closure/контекстом.
- **Ratchet-семантика**: accepted-exception — «registered = baseline-grandfathered» (459), locale-percent-прецедент.
- **BOUNDARY_EXCEPTIONS ×4** (справедливы, подтвердить в 174.5): FeedbackButtons (F-10 WCAG-документирован), waterfall categorical hex (C5 — ждёт chart-palette owner-решения о 13 категориях), #7C3AED chart-метки ×2 (170.x carry-out).
- Из канона §11.2 проверить актуальность: C6 (tabular-nums в 3 таблицах acquiring), C13 (GapsTable caption-dup), C15 (URGENCY_CLASS локализованные ключи), C5 (waterfall dual authority). C8 (FunnelPageContent 200-строк) — при касании.

### D. Environment / данные (не код)

| ID | Статус | Что | Next-best |
|---|---|---|---|
| **FR-7** | environment-gap | Live-данные缺: nmId 202867769 W26 FBS-варианты отсутствуют (DB пересеян) → 2 e2e теста непрогоняемы | ресеев данных ИЛИ re-pin на актуальный nmId/неделю (owner); graceful-empty доказан снапшотом |
| **AT-матрица** | environment-gap | Реальные VoiceOver+Nafari / NVDA / JAWS / TalkBack не исполнялись; ENV-WEBKIT-TAB (Safari Tab reachability — daemon-среда) | 174.5: owner явный выбор — прогнать ИЛИ принять как остаточный release-risk (§11.6); уже доказано: Chromium+Firefox keyboard, WebKit semantic proxy, axe, 200% zoom real-browser (76 роутов × 2 темы) |
| **Credential skips** | частично классифицированы | Manager-креды не настроены (optional skips в owner-наборе 22-23 шт.); 174.4 закрыл классификацию каркасом | прогнать Manager-джорни с кредами ИЛИ зафиксировать optional-статус |

### E. Harness / процесс (подтверждено боем 174.4)

- **Dev-server degradation**: один общий `next dev` деградирует под повторными тяжёлыми suite-прогонами (2.8м → 51м drift; флейк-волны 25→30→170 при аптайме). Канон: **рестарт на прогон** (174.3 использует tmp-worktree+свой сервер в раннерах). Кандидат: general-purpose runner-скрипт.
- **BE login throttle 5/hr общий**: каждая e2e-wrapper-инвокация = login-попытка (fail тоже жжёт). Планировать ≤2 прогона/час; пауза 60+ мин при 429 (проверка: `pm2 logs wb-repricer | grep 429`).
- **storageState TTL**: префлait считает протухшую сессию свежей — при странностях `rm e2e/.auth/user.json`.
- **174.3 fail-closed SHA-пины**: ЛЮБАЯ правка пиннед-спек ломает module-load всего e2e — регенерация только их раннером `scripts/run-story-174-3-state-evidence.mjs --owner-browsers` (367-368 тестов, свежий сервер). **174.5 не правит спеки** — риск низкий, но помнить.
- **CI-runner global-lock**: решён 2026-07 (flock=0); текущие задержки = очередь self-hosted VPS (2 runner/2GB).

### F. Вне-миграционный фронтенд-долг (канон §11.1 — owner-trigger, НЕ 174.5)

FE-D1 (mutation retry:1 ретраит 4xx; WB-token PUT может дважды), FE-D3 (getErrorMessage raw message), FE-D5 (cross-tab cabinet CAS/Web Locks), FE-D8 (SAFE_RECONCILIATION stuck-path), **FE-D9 (logApiError пишет не-2xx тела вкл. секреты — HIGH security)**, SEC-DOC-1 (plaintext-креды в tracked docs — отдельный security-lane). Плюс legacy test-api ×42 (owner-решение), OPS-BE-DEAD-HOURS (BE-обсервабилити), TD-S2b/TD-P8 (BE-грани).

### G. Docs/процесс-долг → входы 174.5

- **check:docs baseline 95** broken-цитат (исторические) — 174.5: починить канон-доки ИЛИ owner-approved disposition (отделив canonical от архивных).
- **Tracker drift** (точные строки в §0.5).
- **Route-ledger 79 `planned` → `verified`** (главный объём 174.5).
- **Retrospectives**: epic-173 (optional), epic-174 (optional), программная (рекомендуется — см. §4).
- `format:check` 39 pre-existing warn (репо-базлайн; 174.5 может свести к 0 — P3).
- ~25 route-гардов с разными формами каталогов — унификация exact-array (P3, опционально).
- Stopped pm2-регистрация `wb-repricer-frontend` (id 5) — операционная чистка по желанию (не блокер).

---

## 4. Retrospective-заготовка (программная, 166→174)

Темы с доказанными прецедентами: (1) **immutable-SHA evidence + fail-closed гейты** (174.1 parity, 174.3 manifest — и его хрупкость при правках); (2) **ratchet-семантика** вместо day-0-zero (locale-percent → ui-boundary); (3) **fix-block propagation discipline** (174.3 пропагейт-мисс сделал 28 фейлов; урок 97.1 подтверждён); (4) **двухпроходное ревью ловит атрибуции** (174.4 pass-1: ложная ↓64-атрибуция); (5) **environment ≠ код** (storageState/дев-сервер/троттл давали ~150 фантомных фейлов); (6) **restart-per-run** канон; (7) **baseline-live-rerun** (CLAUDE.md floor отставал — решено); (8) **автоматизация ≥ героизм** (реген-раннеры против ручных добивов).

## 5. Authoritative link index

| Ресурс | Путь |
|---|---|
| Этот handoff | `docs/HANDOFF-2026-09-01-TEAM-HANDOFF-174-5-FINAL-CLOSEOUT-AND-DEBT.md` |
| План 174.5 | `.omx/plans/174.5-finalize-documentation-and-repository-cleanup.md` |
| Глубокий канон §11 | `docs/HANDOFF-2026-08-29-EPIC-173-174-FULL-MIGRATION-AND-DEBT.md` |
| Промпт V12 (конвейер) | `docs/ORCHESTRATOR-PROMPT-2026-08-31-V12-TEAM-HANDOFF-EXECUTION.md` |
| Реестры | `_bmad-output/implementation-artifacts/sprint-status.yaml`, `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`, `shadcn-route-ledger.md`, `shadcn-ui-boundary-classification-manifest.md` |
| Артефакты финальных сторий | `_bmad-output/implementation-artifacts/174-{2,4}-fe-*.md` (+ 174.1/174.3 от параллельной lane) |
| Гарды-эталоны | supplies 173.12 (boundary), monitoring 172.12, `scripts/check-shadcn-ui-boundary.mjs` |
| Ключевые PR | 174.1 #369/#370/#371 · 174.2 #372/#373 · 174.3 #374 · 174.4 #375/#376 |

## 6. Environment quick-facts

Node **24.18.0** (PATH-пин `/opt/homebrew/opt/node@24/bin` на каждую npm/npx; Node-26 ломает webpack) · npm 11.11.0 пинн (NPM_CLI-override в раннерах даёт 11.16 — disclose) · worktree: branch из frontmatter плана + symlink node_modules + `.env.e2e`/`.env.local` копии · build только `npx next build --webpack` · e2e только `npm run test:e2e[:full]` · креды `test@test.com / Russia23!` · BE Swagger `/api`, health `/v1/health`.

## 7. Стоп-условия

Нужна правка runtime/запрещённого файла в 174.5 → СТОП + эскалация (docs-only сторя). Гейт падает по baseline-дрейфу ≠ дифф → разбор NEW/RESOLVED + `--update-baseline` с обоснованием. Параллельная lane занимает 174.5 (branch/worktree) → координация. Запрещено: деплои, force-push, прямые пуши в main, обязательные CI-гейты, BE-репо `git add -A frontend/`.

---

## 8. Maintainer update rule

Обновляй §0/§2/§3 этого документа в closeout-PR каждой следующей работы (APPEND-ONLY для долга — новые ID + статус §11.9). При завершении 174.5 — замени финальным 94/94 handoff.

*Подготовлено сессией-оркестратором 174.2+174.4 (V12-конвейер, делегация сабагентам); факты сверены с живыми реестрами на main `c8b59455`.*
