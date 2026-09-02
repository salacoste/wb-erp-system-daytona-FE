# HANDOFF 2026-09-02 — V14 debt-backlog: сессия-1 исполнена (P0 полностью, P1 3/5) + оставшийся бэклог с реализационными деталями

> **Аудитория**: агент-оркестратор/команда, продолжающая исполнение долгового бэклога по V14-петле.
> **Вход-точка процесса**: [`docs/ORCHESTRATOR-PROMPT-2026-09-02-V14-DEBT-BACKLOG-EXECUTION-OMC.md`](ORCHESTRATOR-PROMPT-2026-09-02-V14-DEBT-BACKLOG-EXECUTION-OMC.md) (петля §0, порядок §7, стопы §8).
> **Долг-канон**: [`docs/HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md`](HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md) §4 (реестр, статусы ОБНОВЛЕНЫ этой сессией) + §8 (дорожки P0-P3). Настоящий документ = исполнительный слой поверх них: что уже сделано с evidence и как реализовать остальное.
> **Приоритет при конфликте**: мини-план item'а > этот документ (реализационная детализация §3) > FINAL-handoff §4/§8 > CLAUDE.md > V14 > промпты; живые гейты — финальная инстанция.

---

## 1. Сессия-1 (2026-09-02, оркестратор V14): 7 PR, всё merged, cleanup 0/0/0

| # | Item | PR / merge-SHA | Содержание | Ревью | Ключевое |
|---|---|---|---|---|---|
| 1 | **S-1 (FE-D9)** P0-security | [#382](https://github.com/salacoste/wb-erp-system-daytona-FE/pull/382) / `f53b493d` | redact-слой `redactSensitive` (`src/lib/redact-utils.ts`): обе ветки `logApiError`; ключи `token\|password\|secret\|authorization\|cookie\|api[_-]?key\|jwt\|session\|credential\|private[_-]?key` (case-insensitive, nested), `details[].value` echo, Bearer/Basic + key=value строки (не-ASCII fallback), depth-cap 10, идемпотентно, ReDoS-чисто | 4 прохода (7→4→6→3, сходится; Trigger 1 novel-pattern + Triggers 2/3) | **флор 19363 → 19415** (+52); privacy 0 новых; `ApiError.data` сознательно raw (Defensive Frontend) |
| 2 | **S-2 (SEC-DOC-1)** P0-security | [#383](https://github.com/salacoste/wb-erp-system-daytona-FE/pull/383) / `0bceadf4` | изъяты ОБА парольных литерала из 35 tracked-файлов FE (stale + **live**, найден adversarial-ревью, подтверждён `.env.e2e`) → `<E2E_TEST_PASSWORD>`; CLAUDE.md «Test Credentials» → env-ссылка | 1 adversarial + независимый скан (doc-only диспозиция) | скан обоих литералов = 0; APPEND-ONLY сохранён; owner-запрос создан |
| 3 | **D-3+D-4** (PB-4 + /15-family) P1 | [#384](https://github.com/salacoste/wb-erp-system-daytona-FE/pull/384) / `3b094836` | WCAG solid-пары: FeedbackButtons (чип `bg-status-success text-status-success-foreground` + `rounded px-2 py-0.5`), margin-status-helpers good/warning, AcceptanceStatusBadge high; **boundary-исключение снято 4→3** (self-test фикстура → waterfall, манифесты синхронны) | 3 прохода (5→7→2, Trigger 3) | контраст live: success 5.13/8.00, warning 4.81/11.41 (дважды независимо пересчитан); boundary 459=459 |
| 4 | **D-5 (PB-2)** P1 | [#385](https://github.com/salacoste/wb-erp-system-daytona-FE/pull/385) / `f5eec135` | nested `<main>` → `<div>` (классы байтово) на preferences **+ models** (параллельная локация, 97.1); e2e-комментарий актуализирован (спека НЕ в 174.3-пинах) | 2 прохода (APPROVE×2, 3→1) | sweep: единственный `<main>` в (dashboard) = shell `layout.tsx:113` |
| 5 | **D-4-scanner** + решения owner | [#386](https://github.com/salacoste/wb-erp-system-daytona-FE/pull/386) / `5d96a03a` | `.http` в allowlist privacy-сканера (контент сканируется — canary-доказано); записи решений D-1/D-4 | inline-verify класс (self-suite 24/0 + canary) | baseline privacy 3 pre-existing не тронут |
| 6 | **SEC-DOC-1 closeout** | [#387](https://github.com/salacoste/wb-erp-system-daytona-FE/pull/387) / `d61875e6` | ротация **ИСПОЛНЕНА owner** (re-seed «password re-hashed») + верифицирована (login 200, 1 попытка); реестры → RESOLVED | doc-only | канон пароля — только untracked `.env.e2e` |
| 7 | **BE-remediation план** (D-2 owner-decision) | [#388](https://github.com/salacoste/wb-erp-system-daytona-FE/pull/388) / `20dd6f3f` | [`docs/security/SEC-DOC-1-BE-remediation-plan-2026-09-02.md`](security/SEC-DOC-1-BE-remediation-plan-2026-09-02.md): 4 фазы для BE-репо (живой счёт 2026-09-02: ~111 вхождений, оба креда мертвы; при исполнении брать живой grep) | — | ⚠️ найден 1338-файловый незакоммиченный mirror-WIP в BE working tree |

Артефакты сессии: `_bmad-output/implementation-artifacts/debt-{fe-d9-redact-logger,sec-doc-1-redact-creds,d3-d4-wcag-solid-pairs,d5-pb2-nested-main}.md` (+ `docs/security/` 2 документа).

## 2. Живое состояние гейтов (сверено 2026-09-02, main `20dd6f3f`, дерево чисто, worktree = 1)

Vitest полный **≥ 19415 / 0** (флор в CLAUDE.md обновлён тем же PR #382; последний полный прогон 19415/0, 1275 файлов) · lint 0/0 · tsc 0 · max-lines OK · boundary **459=459 PASS, exceptions 3/3** (waterfall 11 + PriceHistorySheet 6 + FunnelTab 5 = 22 suppressed) · parity — терминальный, не трогать (story-worktree гейт, base-pin `0d6225ac`, on-main RED by design) · docs-95 exit 0 · locale 4 · lessons 0 · build `--webpack` 0 · check:privacy = 3 pre-existing (`api-client-401-refresh.test.ts:53,145`, `tasks-enqueue-role-contract.test.ts:75`), `.http`-слепая зона закрыта.

Окружение: Node **24.18.0** PATH-пин `/opt/homebrew/opt/node@24/bin` (Node-26 ломает webpack); FE dev :3100 (PM2 `wb-repricer-frontend-dev`); BE :3000 жив, **degraded: queue down** (2026-09-02 — не блокер FE-работ; учесть в e2e); тест-креды: ротированы 2026-09-02, значение только в `.env.e2e`.

---

## 3. Оставшийся бэклог — реализационная детализация

### 3.1 P1 — ближайшие два item'а (behavior-changing, полный конвейер + e2e)

#### D-1 — PB-1: silent cabinet-create (приоритет 1 из оставшихся) — ✅ ИСПОЛНЕНО (2026-09-02, сессия-2, PR #390)

> Статус: закрыто. Initiation-mint `ensureSessionNonce` + indeterminate recovery-alert + `finishRecoveryOperation` release; e2e true-pin (двухтабный nonce-nulling, падает на main); 3 ревью-прохода; флор vitest 19415→19421. Артефакт: `_bmad-output/implementation-artifacts/debt-d1-pb1-silent-cabinet-create.md`. Follow-ups (для D-2): BE не имеет `/v1/auth/refresh` (404) — реактивный interceptor обязан целиться в реальный маршрут; `decodeJWT` padding-хрупкость (битый base64 → silent logout).

**Дефект**: nonce-less session → settlement `indeterminate` → `handleCreateCabinet` **молча скипает** создание, recovery-алерт не рендерится. Реальный юзер без свежего login теряет действие без диагностики (e2e-сид обходит — потому тесты зелёные).

**Точки входа** (live-сверены 2026-09-02): `src/lib/api.ts:128+` (`createCabinet(data, context)`), `src/stores/authStore.ts:28,51,67` (`sessionNonce: createSessionNonce()`), обработчик `handleCreateCabinet` (найти: `rg -n "handleCreateCabinet" src/`).

**Реализация** (канон: артефакт 174.4 D3-волна):
1. Recovery-ветка в `handleCreateCabinet` при settlement `indeterminate`: рендер recovery-алерта + retry-действие (сейчас — молчаливый скип). Паттерн: «anomaly → indicator + raw value + backend ticket» (Defensive Frontend), НЕ молчать и НЕ подменять.
2. Nonce-lifecycle по артефакту 174.4 (D3): когда sessionNonce null (например, после частичной ре hydratation) — явная re-auth подсказка/попытка тихого refresh перед скипом.
3. **BE-координация до правок**: проверить контракт nonce/settlement в `../test-api/*.http` (auth/cabinets) и BE-контроллерах; если нужен BE-фикс → `PENDING BACKEND:` + `docs/request-backend/NNN-*.md`, НЕ имплементировать за BE.
4. Tests-first: пин текущего молчаливого поведения (красный на recovery-семантику) → реализация → зелёный. UI-ветка = 2-3 ревью-прохода.
5. **e2e** (e2e-видимое поведение): свежерестартованный dev-сервер, ≤2 прогона/час, `waitUntil: 'domcontentloaded'`, не networkidle; скип e2e-сида nonce-обхода, если он маскирует кейс — оставить отдельный спек на дефект.

**DoD**: при `indeterminate` юзер видит алерт + может retry; молчаливых скипов нет; unit+e2e пинят; гейты §2 зелёные.

#### D-2 — PB-3: реактивный 401-refresh (приоритет 2) — ⛔ BE-BLOCKED (2026-09-02, сессия-2)

> **Стоп по §8**: BE auth-контроллер имеет ровно 3 маршрута (register/login/logout) — **refresh-эндпоинта не существует** (`/v1/auth/refresh` → 404 NOT_FOUND; 0 упоминаний refresh в auth-модуле BE и в test-api контрактах). Proactive `useAuth.refreshTokenIfNeeded` FE стреляет в несуществующий маршрут → любой протухший/непарсящийся токен = мгновенный logout. Запрос владельцу: [`docs/request-backend/230-auth-refresh-endpoint-missing.md`](request-backend/230-auth-refresh-endpoint-missing.md) (варианты: BE-контракт / re-scope D-2 / отмена с residual-риском). НЕ имплементировать за BE. После решения: план ниже актуален, целевой маршрут — по факту контракта.

**Дефект**: нет реактивного 401-interceptor — только proactive `useAuth.refreshTokenIfNeeded`; протухший access-токен → пользователю падает ошибка вместо тихого refresh+replay.

**Точки входа**: `src/lib/api-client.ts` (fetch-обёртка; текущая 401-семантика), `src/lib/api/__tests__/api-client-401-refresh.test.ts` (**G4-пин**: 3 it/test — пинит ФАКТИЧЕСКОЕ поведение «нет реактивного refresh»; **обновить пин на новое поведение** — это часть DoD, не регрессия).

**Реализация**:
1. Interceptor в api-client: 401 → single-flight refresh (не параллелить несколько refresh) → replay исходного запроса **1 раз**; при повторном 401/refresh-fail → logout-путь (существующий). Совместимость с redact-слоем (PR #382) — не логировать raw-тела 401.
2. Single-flight guard + очередь ожидания (если 2+ запросов упали одновременно).
3. Обновить G4-пин (новое поведение) + новые кейсы: replay-успех, refresh-fail, 401-на-refresh-эндпоинте (не зациклить).
4. **e2e** (e2e-видимое): сценарий протухшего токена (мутировали storage → действие → тихий успех); рестарт dev-сервера, ≤2/час.

**DoD**: 401 → refresh → replay×1 работает в обеих темах/роутах; G4-пин обновлён; unit+e2e зелёные; гейты §2 зелёные.

### 3.2 P2 — качество/консистентность (волнами)

| Item | Точки входа / каталог | Фикс-канон |
|---|---|---|
| **boundary 459 owner-sweep** | каталог `_bmad-output/planning-artifacts/shadcn-ui-boundary-classification-manifest.md` (per-route counts) | волнами 5-10 файлов; каждый с import-closure + контраст-замером (обе темы, WCAG live-вычисление — прецедент PR #384); ratchet ↓ baseline тем же коммитом (`scripts/.shadcn-ui-boundary-baseline.txt`) |
| **/80-sweep** | repo-wide `text-*/80` (pricing/automation/cashflow/popover+hover), исторические 3.2-3.45:1 | замер light/dark → solid-пары или accepted-exception; кандидат на расширение boundary-сканера |
| **/10-family ASB** — ✅ ИСПОЛНЕНО (2026-09-02, сессия-2, PR #392) | `AcceptanceStatusBadge.tsx:45-48` — success /10 = **4.49:1**, warning /10 = **4.24:1** light (dark ≥7.1 ok) | solid-пары применены (5.13/4.81 light, ≥8.0 dark); эскалация high/warning восстановлена бордером /60-vs-/40; destructive /10 документирован (5.55 AA pass); артефакт `debt-p2-10-family-asb.md`; ⚠️ ~100 сиблинг-/10-сайтов repo-wide остаются owner-sweep residual |
| **financial-foreground токены** (новый residual PR #384) | `globals.css` `--financial-*` без `-foreground`; margin-шкала: excellent/critical на /15 при good/warning solid (инверсия веса) | дизайн-решение о новых токенах → потом solid-пары excellent/critical |
| **C13** — ✅ ИСПОЛНЕНО (2026-09-02, сессия-2) | `GapsTable.tsx:65,67` caption-dup | aria-label → «Область прокрутки…» (caption = идентичность); сиблинг-sweep (~20 таблиц) — follow-up; артефакт `debt-p2-c13-c15-quality-wave.md` |
| **C15** — ✅ ИСПОЛНЕНО (2026-09-02, сессия-2) | `LiquidationScenarioCard.tsx:20-24` `URGENCY_CLASS` локализованные ключи | `ScenarioUrgencyTier` + `getScenarioUrgencyTier` (single source), typed Record, exhaustive color-switch; hex/token мисматч — owner follow-up |
| **C8** | `FunnelPageContent` ровно 200 строк | следить при касании (max-lines) |
| **FE-D1** | mutation retry:1 ретраит 4xx (WB-token PUT ×2; e2e пинит `putAttempts===2`) | behavior-change отдельно; обновить e2e-пин; full vitest + e2e |
| **FE-D3** | `getErrorMessage` эхо сырого error.message | bounded fallback + scrub/truncate + тесты на stack/internal/sensitive |
| **FE-D5** | cross-tab create duplication (нет CAS) | Web Locks API fast-follow |
| **FE-D8** | `getCabinetCreationOperation` middle-path (юзер висит в SAFE_RECONCILIATION) | по UX-жалобе; НЕ менять без fresh-ревью |
| **~84 `logger.error(`-сайта вне logApiError** (static-счёт 2026-09-02; residual PR #382) | ApiError-объекты раскрываемы в devtools (`.data` raw) | архитектурное решение: redact внутри `src/lib/logger.ts` покроет все, но затронет 131 файл + 52 тест-мока — owner/архитектор; перед работой live-пересчёт |
| **C5 waterfall dual-authority** — **BLOCKED owner** | 11 hex + 2 токена на 13 серий | ждать chart-palette решения |

### 3.3 P3 — инфраструктура/процесс (по окну)

harness restart-per-run раннер (tmp-worktree + свой dev-server; канон 174.3) · **FR-7** (reseed nmId 202867769 W26 ИЛИ re-pin 2 замороженных e2e) · **AT-матрица** (реальные VoiceOver/NVDA/JAWS/TalkBack ИЛИ письменный owner-accept) · **Manager-creds** (прогон джорней ИЛИ фиксация optional ~22-23 скипов) · **docs-95** (canonical-vs-archival split → осознанный `--update-baseline`) · **prettier/md-долг**: npm-гейт `format:check` (src ts/tsx/json/css) уже **0 issues**; реальный долг — md-файлы вне npm-гейта (~1189, осн. docs/; CLAUDE.md-fail pre-existing среди них) — owner-скоуп, НЕ «39» (историческое число невоспроизводимо) · **~25 route-гардов** унификация exact-array · **pm2 delete 5** (stopped-регистрация) · **BE queue:down** (degraded с 2026-09-02 — BE-side, мониторить для e2e).

### 3.4 Owner-decision ledger (статус на 2026-09-02)

| Решение | Статус |
|---|---|
| SEC-DOC-1 D-1 ротация | ✅ исполнена + верифицирована (login 200) |
| SEC-DOC-1 D-4 сканер .http | ✅ исполнена (PR #386) |
| SEC-DOC-1 D-3 history | принята рекомендация «не трогать» (default) |
| SEC-DOC-1 D-2 BE-репо | план готов (PR #388); ждёт: исполнение BE-стороной ИЛИ явная авторизация FE-оркестратору в BE-репо; ⚠️ предусловие — разобрать 1338-файловый mirror-WIP в BE working tree |
| C5 chart-palette | ⏳ ждёт решения |
| AT-матрица / Manager-creds / docs-95 / FR-7 / pm2-id5 | ⏳ ждут решений (P3) |

---

## 4. Процесс-канон для принимающей команды (свод)

1. **Петля** (V14 §0): bootstrap → выбор item'а (§7: D-1 → D-2 → P2 → P3) → **105.2 pre-flight** (grep AC-существительных — item может быть уже починен; file:line из этого дока проверь живым grep — дрейф возможен) → занятость (`git worktree list`; чужое не трогать) → мини-план (1 item = 1 задача = 1 ветка/PR) → конвейер A–J → closeout (артефакт + FINAL-handoff §4/§8 flip + floor тем же PR) → cleanup 0/0/0.
2. **Делегация**: recon → explore; механика → executor(sonnet); сложное поведение (PB-1 recovery, PB-3 interceptor) → executor(**opus**); ревью → code-reviewer(**opus**) СВЕЖИЙ контекст на каждый проход; числа — только живыми прогонами.
3. **Ревью-дисциплина**: behavior-changing source → минимум 2 прохода; триггеры (>12 кумулятив, >5 в проходе, novel-pattern, meta-claims) → +проходы (прецеденты этой сессии: FE-D9 4 прохода, D-3+D-4 3 прохода, D-5 2 прохода). Findings: APPLIED или DISPOSITIONED с evidence — оба в артефакт.
4. **Гейты на каждый PR**: §2 таблица; флор монотонен (19415 сейчас); базлайны — только тем же PR с разбором.
5. **Ловушки** (унаследовано + этой сессии): zsh не word-split'ит — prettier **один файл на инвокацию** · e2e SHA-пины 174.3 (`story-174-3-*.spec.ts`) руками НЕ править · storageState TTL ~1ч (`rm e2e/.auth/user.json`) · login-троттл 5/ч, fail-попытки жгутся · dev-сервер рестарт на тяжёлый прогон · `_bmad-output/` gitignored → `git add -f` поштучно · APPEND-ONLY Change Log · fix-block propagation: после фикса grep точной фразы по ВСЕМ локациям (уроки 97.1; этой сессии: D-5 нашёл параллельный `<main>` в models; SEC-DOC-1 — второй live-литерал за сканом по одному) · атрибуции чисел живым прогоном (G4/фейковые «~6.5:1» прецеденты) · worktree: `git add -b <branch> /private/tmp/<name> main` + symlink node_modules + копии `.env*`; cleanup — НЕ стоять cwd внутри удаляемого worktree ·BE-репо — только чтение/координация (правки по явной авторизации).

## 5. Точки входа мейнтейнера

| Ресурс | Путь |
|---|---|
| Процесс-оркестратор V14 | `docs/ORCHESTRATOR-PROMPT-2026-09-02-V14-DEBT-BACKLOG-EXECUTION-OMC.md` |
| Долг-реестр (статусы) | `docs/HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md` §4/§8 |
| Артефакты сессии-1 | `_bmad-output/implementation-artifacts/debt-{fe-d9,sec-doc-1,d3-d4,d5}-*.md` |
| Security-доки | `docs/security/` (rotation decision + BE-remediation plan) |
| Boundary-каталог | `_bmad-output/planning-artifacts/shadcn-ui-boundary-classification-manifest.md` |
| Гейты-базлайны | `CLAUDE.md` «Accepted Baselines» · `scripts/.*-baseline.txt` |

_Подготовлено оркестратором V14, сессия-1 (2026-09-02); факты сверены живыми прогонами на main `20dd6f3f`._
