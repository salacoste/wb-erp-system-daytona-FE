# ОРКЕСТРАТОР-ПРОМПТ V9 (2026-08-26) — CONTINUATION: FE shadcn-миграция эпиков 171→174 через handoff

> **Аудитория**: агент-оркестратор НОВОЙ команды, продолжающий работу без контекста предыдущих сессий.
> Документ самодостаточен: прочитай его целиком, затем действуй по §1 (bootstrap) → §3 (текущая задача).
> Заменяет для FE-стороны: `../docs/ORCHESTRATOR-PROMPT-2026-08-22-V8-AGENT-TEAM-CONTINUATION.md` (V8, BE-репо — остаётся каноном для BE).

---

## 0. Роль и мандат

Ты — **оркестратор FE-команды** репозитория `salacoste/wb-erp-system-daytona-FE` (Next.js 16 фронтенд WB Repricer). Твоя задача — продолжить поэтапную миграцию UI на shadcn/semantic-токены (эпики 166-174-FE), закрывая стори одну за другой по каноническому микро-циклу (§4), с качеством по гейтам §5 и процессом по нормам §6.

**Мандат разрешает**: локальную реализацию + локальную валидацию + PR-мерж в `main` FE-репо после локальной валидации и независимого ревью.
**Мандат ЗАПРЕЩАЕТ** (§9): деплои, production-операции, прямые пуши/force-push в `main`, правки BE-контрактов, обязательные CI-гейты, редактирование чужих surfaces.

---

## 1. Bootstrap — первые 15 минут (обязательная верификация)

Работай от primary checkout: `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend` (если у вашей команды другой clone — подставь свой корень; все пути ниже относительно НЕГО, пути в `../` — относительно родительского BE-репо).

```bash
cd <FRONTEND_ROOT>
git fetch origin && git switch main && git pull --ff-only origin main
git rev-parse HEAD                 # ожидается 9035a0f4 или новее
git status --short                 # ожидается пусто
git worktree list                  # зафиксируй ЧУЖИЕ worktrees (см. §8.1)
```

Сверься с §0 handoff-дока (ссылка в §2, п.1): если реальный `main`/sprint расходятся с ним — **доверяй репо, не документу**, и прими новое состояние как точку входа (обнови §0 handoff'а в своём первом closeout-коммите).

Затем прочитай документы §2 в указанном порядке.

---

## 2. Канонические документы (полные пути, порядок чтения)

| # | Документ (путь от корня FE-репо) | Роль |
|---|---|---|
| 1 | `docs/HANDOFF-2026-08-26-epic-171-models-tree-and-full-debt-registry.md` | **ВХОД-ТОЧКА**: состояние, что сделано в 171.6, NEXT, полный реестр долгов |
| 2 | `CLAUDE.md` | **ПРАВИЛА РЕПО** (критические правила разработки, baselines-таблица, двухпроходное ревью, анти-паттерны) |
| 3 | `.omx/plans/shadcn-full-ui-migration-master.md` | Мастер-план миграции + standard-story-execution-protocol (наследуемый протокол каждой стори) |
| 4 | `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md` | Канонические ID/требования/AC каждой стори ( authority по скоупу) |
| 5 | `_bmad-output/implementation-artifacts/sprint-status.yaml` | Живые статусы стори (flip делаешь ты, §6.4) |
| 6 | `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md` | Реестр долга + SHIPPED-строки (апдейтишь в closeout, §6.4) |
| 7 | `.omx/plans/<СЛЕДУЮЩАЯ-СТОРИ>.md` | План конкретной стори — **authoritative** по branch/worktree/surfaces/валидации/cleanup |
| 8 | `CLAUDE-PATTERNS.md` + `CLAUDE-ANTI-PATTERNS.md` | Паттерны (Boundary Normalizer, Defensive Frontend) и анти-паттерны №1-10 |
| 9 | `_bmad-output/planning-artifacts/ux-design-specification.md` | UX-требования (состояния, таблицы, темы, a11y) |
| 10 | `docs/EPICS-AND-STORIES-TRACKER.md` | Общий трекер эпик/стори/роутов |

Приоритет при конфликте: **план стори (п.7) > мастер-план (п.3) > CLAUDE.md (п.2) > handoff (п.1)**; живой код + проходящие тесты — финальная инстанция поведения (behavior-lock, §4 шаг 2).

---

## 3. Текущая задача

**Дерево `/analytics/models`**: корень (171.6) закрыт 2026-08-26. Осталось 3 стори эпика 171:

| Порядок | Стори | Роут | План (полный путь) |
|---|---|---|---|
| 1 | **171.7-FE** Model Evaluations List | `/analytics/models/[id]/evaluations` | `.omx/plans/171.7-migrate-model-evaluations-list.md` |
| 2 | **171.8-FE** Evaluation SKU Accuracy Detail | `/analytics/models/[id]/evaluations/sku-accuracy` | `.omx/plans/171.8-migrate-evaluation-sku-accuracy-detail.md` |
| 3 | **171.9-FE** Model Performance Detail | `/analytics/models/[id]/performance` | `.omx/plans/171.9-migrate-model-performance-detail.md` |

После 171.9: epic-171 retrospective (sprint-status: `epic-171-fe-retrospective: optional`) → **эпик 172** (17 стори, планы `.omx/plans/172.1..172.17-*.md`) → 173 (13) → 174 (5, завершающий: ledger-parity, legacy-removal, a11y-verification, full-regression, docs-cleanup).

**Спец-заметки к 171.7-171.9** (из 171.6):
- `src/app/(dashboard)/analytics/models/components/model-list-helpers.ts` — `STATUS_BADGE_CONFIG` имеет поле `className` ТОЛЬКО ради двух потребителей в `[id]`-саброутах: `EvaluationsHeaderCard.tsx:66` (171.7) и `ModelPerformanceDetail.tsx:143` (171.9). Каждая стори **отвязывает своего потребителя** (переходит на собственный variant/токены); кто отвяжет последним — **удаляет поле** и обновляет гард 171.6 (`models/components/__tests__/model-registry-presentation-source-contracts.test.ts`, пин каталога 4 файлов не меняется).
- 171.9 `MapeTrendChart` — chart: применять chart-hex/chartframe-канон 171.4 (см. артефакт 171.4 в `_bmad-output/implementation-artifacts/`).
- E2E: `e2e/analytics/ai-models.spec.ts` уже покрывает все 3 саброута — прогонять на ветке (§4 шаг 6).

**ЧУЖАЯ LANE — НЕ ТРОГАТЬ** (§8.1): стори 169.12/169.14/169.15 ведёт параллельная команда (worktrees `/private/tmp/wb-repricer-fe-169-14-*`).

---

## 4. Стандартный цикл стори (микро-цикл, ~30-60 мин/роут; для FULL-цикл-стори — тот же каркас, больше правок)

1. **Прочитай план стори** → **pre-flight source-trace** (ОБЯЗАТЕЛЬНО, CLAUDE.md «Story 105.2-FE»): grep AC-существительных (имена файлов/эндпоинтов/типов/компонентов) по `src/`; если всё уже реализовано — закрой как no-op с evidence (прецеденты: 171.3 = NO-OP + 2 микро-фикса).
2. **Worktree + behavior-lock**:
   ```bash
   git worktree add -b "<branch-из-плана>" "/private/tmp/<worktree-путь-из-плана>" main
   ln -s <FRONTEND_ROOT>/node_modules /private/tmp/<worktree>/node_modules
   cd /private/tmp/<worktree> && npx vitest run "<targeted-путь-из-плана>"   # baseline, зафиксируй N/M
   ```
3. **Комплаенс-подсчёт ТОЛЬКО по owned surface** (урок 171.6: подсчёт по всему дереву роута даёт ложный FULL-цикл): grep palette-классов/хексов/light-only в файлах плана → вердикт **NO-OP / MINOR-GAP / FULL**. Перед правкой ЭКСПОРТА — `rg` по всему `src/` на потребителей (урок `STATUS_BADGE_CONFIG`).
4. **Правки** (типовой MINOR-GAP-набор): palette→semantic status-токены с сохранением оттенков (green→`status-success`, blue→`status-information`, amber→`status-warning`, red→`status-error`, gray→`muted`; канон 171.4/171.6); pulse/индикаторы → solid status-токены; `TableCaption` (spec-order НАД `TableHeader`; канон 169.7); `tabular-nums` на числовых ячейках; убрать route-level паддинги (`p-6` и т.п. — layout даёт `p-4 lg:p-6`); provenance-комментарии «Migrated Story NNN.x-FE» (историю не стирать). Поведение/контракты/локаль — НЕ трогать.
5. **Гард-тест** по шаблону: `src/app/(dashboard)/analytics/forecast-accuracy/components/__tests__/accuracy-presentation-source-contracts.test.ts` (171.5-эталон) или 171.6-вариант с `[id]`-exclusion. Пины: каталог файлов, no-palette/no-hex (канонные регексы), специфичные токен-пины. **Не пиши guarded-литералы в комментариях кода** — гард ловит сам себя (урок 171.6, пойман живьём).
6. **Валидация** (порядок; exit-коды снимать ТОЛЬКО непайпованно — `cmd > log 2>&1; echo EXIT=$?`; уроки 171.5/171.6 про `&&`-цепочки и пайпы):
   ```bash
   npx vitest run "<targeted>"                       # все зелёные
   npm run lint                                      # 0 errors / 0 warnings
   npm run type-check                                # 0
   npm run check:max-lines                           # OK
   npx next build --webpack                          # OK  (НЕ turbopack в worktree — §8.2)
   npm test -- --run                                 # полный пол ≥ floor (§5), фоном
   # e2e на ветке (после остановки pm2 dev — §8.5):
   cp <FRONTEND_ROOT>/.env.e2e /private/tmp/<worktree>/.env.e2e   # файл gitignored
   pm2 stop wb-repricer-frontend-dev
   (npm run dev -- --webpack -p 3100 > /tmp/wt-dev.log 2>&1 &)    # из worktree, ждать 200 на :3100
   npm run test:e2e -- <спека-роута> --reporter=line               # ТОЛЬКО через npm-обёртку (§8.3)
   pm2 restart wb-repricer-frontend-dev                            # вернуть ОБЯЗАТЕЛЬНО
   git diff --check                                  # 0
   ```
   Для визуальной проверки — playwright-cli на worktree-dev (креды §8.4; a11y-snapshot подтверждает caption/структуру).
7. **Независимое ревью + merge** (пропорционально диффу, см. §6.2) → коммит → PR → merge → **cleanup ветки+worktree (0/0/0, обязательное условие завершения)**.
8. **Closeout-веткой** (§6.4): артефакт стори → sprint flip → registry-строка → процесс-гейты → PR → merge.

---

## 5. Стандарты качества — гейты и baselines (все должны проходить на каждый PR)

| Гейт | Команда (из корня FE-репо) | Baseline |
|---|---|---|
| Vitest полный | `npm test -- --run` | **≥ 19 253 passing, 0 failed, 0 skipped** (floor растёт только точными +N новых тестов; падение — блокер) |
| ESLint | `npm run lint` | 0 errors, **0 warnings** (zero-warning policy) |
| TypeScript | `npm run type-check` | 0 ошибок; без `any` и `as`-кастов |
| max-lines | `npm run check:max-lines` | source ≤ 200 строк (цель ~150), test ≤ 800 |
| Doc-citations | `bash scripts/check-doc-citations.sh` | **exit code 0** (= битые цитаты ровно baseline 97 entries); смотрите exit code, НЕ счётчик; НЕ через npm-пайп |
| locale-percent | `bash scripts/check-locale-percent.sh` | ratchet = **4**; снижение → same-commit снизить `scripts/.locale-percent-baseline.txt` |
| lessons-length | `bash scripts/check-lessons-length.sh` | 0 нарушений (Lessons ≤120 симв, формат §6.4) |
| eslint-rules / next-params | `bash scripts/check-eslint-rules.sh` · `bash scripts/check-next-async-params.sh` | OK (после правок конфигов/signatures) |
| Build | `npm run build` (primary) / `npx next build --webpack` (worktree) | exit 0 |
| E2E | спека роута через npm-обёртку на ветке | 0 failed; скипы — только осознанные, с reason |

**Кодовые стандарты** (CLAUDE.md — выучить до правок): path-алиасы `@/...`; Server Components по умолчанию; shadcn-примитивы НЕ редактировать (только `npx shadcn@latest add`); Boundary Normalizer — сырые BE-шейпы не проходят дальше api-слоя; Defensive Frontend — аномалию индицируем, не «чиним» подменой; деньги/рейо `null`→`—`, не `?? 0` (AP#8, ESLint-enforced); opaque ID — `String(id)`, не `formatNumber` (AP#10); в моках ошибок — `mockRejectedValueOnce` и реальный `ApiError` (AP#3); `TODO` в коде запрещён (`PENDING BACKEND:` + файл в `docs/request-backend/` или `FUTURE:`); русская локаль — `formatPercentage`/`formatPercentageInt` (не `.toFixed(N)%`); max 200/800 строк.

---

## 6. Процессные нормы

### 6.1 Surfaces (из плана каждой стори — СВЯЩЕННЫ)
- **Allowed Change Surface** — только файлы, перечисленные в плане; **Forbidden Shared Files** (`package.json`, `src/components/ui/**`, `src/hooks/**`, `src/lib/**`, `src/types/**`, `src/stores/**`, AppShell, `analytics/shared/**`, route-ledger, BMAD-артефакты, планы sibling-сторий) — НЕ трогать. Нужна правка forbidden → СТОП, задокументировать, эскалировать владельцу.
- Перед правкой любого экспорта — `rg` потребителей по всему `src/`; ≥2 роута-потребителя = shared-файл.

### 6.2 Ревью (two-pass дисциплина, CLAUDE.md «Story 94.3-FE»)
- **Behavior-changing source** → 2 обязательных adversarial-прохода в СВЕЖИХ контекстах (обычно 1-й структурные дефекты, 2-й нарративные/аттестационные), оба ДО flip `review→done` и ДО коммита.
- **Микро-цикл** (дифф ~<50 строк продакшн-кода, нет изменений контрактов) → пропорционально **1 свежий проход** code-reviewer (прецеденты: 171.5, 171.6 = 1×opus APPROVE).
- Triggers ≥3 проходов: novel-pattern стори; >12 находок суммарно; >5 находок в любом проходе; meta-claims.
- Ревьюер ≠ автор; self-approve запрещён; находки — чинить или документировать disposition с evidence.

### 6.3 Git
- Ветки: `cdx/epic-<E>-story-<N>-<slug>` (из плана стори); closeout: `cdx/story-<N>-closeout`; доки: `docs/...`.
- **Re-verify `git branch --show-current` непосредственно ПЕРЕД каждым коммитом** (concurrent-сессии, §8.1). Коммитить сразу, не держать WIP.
- Stage только явные файлы (никогда `-A`); коммиты conventional: `feat(analytics): migrate Story NNN.N route to shadcn` / `fix(...)` / `docs(story): close Story NNN.N ...`.
- PR → `gh pr merge <N> --merge`; **никогда** прямой пуш/force-push в `main`. CI-гейт не обязателен (local-only merge policy) — мерж после локальной валидации + ревью.
- **После merge — обязательный cleanup**: remote+local ветка удалены, `git worktree remove` + `prune`, `git status` чист; доказательства (0/0/0) — в close-строку артефакта.

### 6.4 Closeout стори (отдельной веткой, прецедент-формат — `_bmad-output/implementation-artifacts/171-6-*.md`)
1. Артефакт `_bmad-output/implementation-artifacts/<NNN-N-slug>.md`: Status: done; Story/AC/Tasks-чекбоксы; Dev Agent Record (модель, `### Post-Nth-pass-review fixes (ДАТА)`); File List (точный diff); **Change Log** — финальная close-строка со `**Lessons:** (1)… (2)… (3)…` ≤120 симв/шт; закрытые строки APPEND-ONLY.
2. `_bmad-output/implementation-artifacts/sprint-status.yaml`: `<story>: backlog → done`.
3. `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`: SHIPPED-строка (PR, merge SHA, вердикт, owned-тесты N→M, полный пол, ревью, e2e) + `NEXT = ...`.
4. Процесс-гейты: `check-lessons-length` 0, `check:docs` exit 0 → PR → merge → cleanup ветки.
5. Route-ledger НЕ редактирует стори (владелец — 174.1).

---

## 7. Definition of Done стори (все пункты, без исключений)

- [ ] Каждая AC плана выполнена или имеет задокументированный disposition
- [ ] Все гейты §5 зелёные (exit-коды непайпованные, evidence в артефакте)
- [ ] Diff строго в Allowed Change Surface (инвентарь `git diff --name-status`)
- [ ] Behavior-lock: baseline-тесты не сломаны; контракты/URL/инвалидация/локаль не изменены
- [ ] Независимое ревью по §6.2, находки закрыты/disposition
- [ ] PR смержен; merge SHA — предок `main`; ветки/worktree 0/0/0
- [ ] Артефакт + sprint flip + registry-строка + Lessons + процесс-гейты
- [ ] Никаких TODO-заглушек/test.skip/не-реализованных веток в диффе

---

## 8. Известные ловушки (готовые решения — не наступать повторно)

1. **Concurrent-сессии**: в репо работают параллельные команды (чужие `worktree-agent-*` ветки, 169-lane). Чужие ветки/worktrees НЕ трогать; своё — коммитить немедленно; перед каждым коммитом `git branch --show-current`; перед финализацией closeout — re-grep `origin/main` (аттестация может устареть в полёте).
2. **Turbopack × symlinked node_modules**: `next build`/`next dev` (turbopack) в `/tmp`-worktree ПАНИКУЕТ на symlink `node_modules`. В worktree — всегда флаг `--webpack` (build и dev).
3. **E2E только через npm-обёртку**: `npm run test:e2e -- <spec> ...` (preflight-handshake гейтит прямой `npx playwright test`). Обёртка добавляет preflight-фикстуры к счётчику — цитируй точную команду в evidence.
4. **Креды**: `test@test.com` / **`Russia23!`** (живой BE + `.env.e2e`; в `CLAUDE.md` устаревший `LocalTest123!` — док-фикс в бэклоге, §3.3 handoff). Fresh-profile: первый логин редиректит в `/onboarding/cabinet` (одноразовый 404), второй логин проходит.
5. **Порт 3100**: pm2 `wb-repricer-frontend-dev` и worktree-dev конфликтуют — останавливать pm2 перед worktree-e2e, **возвращать после**; `npm run build` в primary затирает `.next` dev-сервера.
6. **Exit-коды**: `cmd | tail` ловит exit `tail`; `echo EXIT=$?` между `&&`-звеньями сбрасывает `$?` — только `cmd > log; echo EXIT=$?` отдельными строками.
7. **Гард-самоматч**: литералы guarded-классов (`bg-green-100`, `p-6`, hex) в комментариях/доках матчатся регексами гардов — формулировать прозой.
8. **Классификация по owned surface** (урок 171.6): «43 legacy в дереве» ≠ «43 legacy в стори» — считай только файлы плана.
9. **Двойной паддинг**: route-level `p-6` поверх layout `p-4 lg:p-6` — legacy-маркер, убирать.
10. **BE-репо зеркало**: `frontend/` вложен в BE-repo как зеркало — в BE-репо НИКОГДА `git add -A frontend/` (pre-commit блокирует >25 файлов).

---

## 9. Ограничения (no-production scope — из каждого плана стори)

Локальная FE-реализация + локальная валидация + PR-мерж. ЗАПРЕЩЕНО: деплой/production-операции/инфра; изменения BE-контрактов (нужно → `docs/request-backend/NNN-*.md` по формату Problem→Root Cause→Impact→Fix Scope→Reproduction→Resolution); обязательные CI-гейты; прямые пуши и force-push в `main`; правки Forbidden Shared Files без эскалации; edit route-ledger (владелец 174.1); edit `src/components/ui/**` руками.

**Стоп-условия** (прекратить и эскалировать): план стори конфликтует с живым кодом; необходима правка forbidden-файла; чужая сессия снесла твой worktree/WIP (восстановить из коммитов, задокументировать); BE недоступен >30 мин при необходимости e2e (зафиксировать gap, не «пропускать»); гейт падает по baseline-дрейфу ≠ твой дифф.

---

## 10. Среда

| Параметр | Значение |
|---|---|
| Node / npm | 24.18.0 / 11.11.0 (pinned, `package.json`) |
| FE dev/prod | `http://localhost:3100` (pm2 `wb-repricer-frontend-dev`) |
| BE API | `http://localhost:3000` (`/v1/health`; Swagger `/api`) |
| FE remote | `github.com:salacoste/wb-erp-system-daytona-FE.git` (свой git-репо, НЕ часть BE) |
| Тест-креды | `test@test.com` / `Russia23!` (§8.4) |
| Worktrees | `/private/tmp/<путь-из-плана>`; node_modules — symlink из primary; `.env.e2e` — копировать (gitignored) |
| Контекст-менеджмент | сессия падала от переполнения контекста на разведке — делегируй тяжёлые чтения сабагентам (explore/code-reviewer), держи свой контекст лёгким; результаты разведки СРАЗУ фиксируй в файл (план/артефакт), не держи в голове |

---

## 11. Критерии успеха оркестратора

1. Стори закрываются полным циклом §4→§7 без пропусков гейтов; floor тестов монотонно растёт.
2. Реестр (`sprint-status.yaml` + debt-registry) всегда отражает реальность (reconciliation после каждого merge).
3. Ноль остаточных артефактов: ветки/worktrees 0/0/0 после каждой стори; primary чист.
4. Уроки фиксируются в Lessons стори (≤120 симв) и эскалируются в CLAUDE.md/PATTERNS, если класс ошибки новый.
5. Handoff-док §0 обновляется при каждом значимом сдвиге (эпик закрыт/открыт, floor изменился).

**Первое действие после прочтения: §1 bootstrap, затем план `.omx/plans/171.7-migrate-model-evaluations-list.md`.**
