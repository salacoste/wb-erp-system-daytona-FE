# HANDOFF 2026-09-09 — Сессия-9: prettier-md + CABINET-BROWSER-02 + privacy-lane (2 item'а) исполнены + оставшийся объём работ

> **Аудитория**: агент-команда, продолжающая разработку (сессия-10). Этот документ = вход-точка.
> **Процесс-канон**: [`ORCHESTRATOR-PROMPT-2026-09-06-V18-DEBT-CONTINUATION-OMC-SUBAGENTS.md`](ORCHESTRATOR-PROMPT-2026-09-06-V18-DEBT-CONTINUATION-OMC-SUBAGENTS.md) (петля §0, матрица §2, конвейер A–J §5, стопы §8) — без изменений; следующий оркестратор-промпт (V20) указывает на ЭТОТ handoff.
> **Цепочка**: [`HANDOFF-2026-09-06-V18-SESSION8-...`](HANDOFF-2026-09-06-V18-SESSION8-FE-D5-FE-D3FAM-WCAG-W6-EXECUTED-AND-REMAINING-BACKLOG.md) → V17 (сессия-6) → V16 (сессии-3/4/5) → V15 → V14 → FINAL-94-94.
> **Приоритет при конфликте**: мини-план item'а > этот документ > V18-промпт > CLAUDE.md > предыдущие handoff'ы; **живые гейты — финальная инстанция**.

---

## 1. Сессия-9 (2026-09-08/09): 4 item'а, 6 PR, всё merged, cleanup 0/0/0 ×4

| # | Item | PR / merge | Ключевое |
|---|---|---|---|
| 1 | **prettier-md** (docs/**/*.md, handoff §3.0 №1) | #420 | Strict-режим `--embedded-language-formatting=off` (owner-решение после REJECT): **1189 файлов**, 36289+/22817−; фенсы байт-нетронуты (2 независимых валькера 1189/1189; 30 in-fence дельт = 28 blank-only + 2 broken-fence repairs, token-multiset 0). Review pass-1 opus **REJECT** (2 CRITICAL: 9× `__tests__`→`**tests**`; `--include=*.tsx`→`_.tsx` GFM cell; 1 HIGH: embedded-переформат ~30k in-fence строк) → owner-решения → фикс-волна (`0771645d` 7 литералов с `\_\_`-эскейпами; `ac366ad9` 2 corpus до идемпотентности) → fix-верификация **APPROVE** (3 SendMessage-резюма после 2 сетевых смертей). Treewide prettier --check = exit 0 идемпотентно. `/tmp`-worktree уничтожен между ходами (2-й случай!) — **протокол commit-immediately** дал нулевые потери (редо байт-идентичен). |
| 2 | **CABINET-BROWSER-02 pre-existing red** (§3.0 №7) | #421 (+#422 pin-fixup) | **Root cause = стухший twin-пин спеки, НЕ регрессия; FE-D1-гипотеза фальсифицирована** (обе мутации `retry: false`, 4xx не мокаются). Второй из двух `toHaveCount(0)` близнецов (первого перепиновал `6ac32024`); margin-алерт персистит по задокументированной семантике (onSubmit не чистит recoveryError; quiet-guard; unmount только через PUT#2-навигацию). Re-pin → `toHaveText(MARGIN_RECOVERY_MESSAGE)` + комментарий по прецеденту (`d03123fa`, 9+/1−). **2 ревью-прохода opus — оба APPROVE, 0 blocking** (laundering-форензика: старый пин никогда не был зелёным; все 5 значений recoveryError перечислены — детектирующая сила доказана). **Живой e2e**: negctl на main = ровно бисект-сигнатура (Expected 0/Received 1); pos на worktree-dev свапе = **PASSED 3.3s вкл. первый прогон downstream-пинов 1066-1107**; PM2 восстановлен. Манифест: onboarding.spec 0 пинов — реген не нужен. |
| 3 | **privacy docs-example redaction** (рождён в сессии-9) | #423 (+#424 fixup) | Обнаружено: privacy-гейт на чистом дереве сканирует **HEAD merge-diff** (fallback `-m`) → pre-existing доки-примеры с фейковыми Bearer-токенами всплыли на merge #420 (контент верифицирован против `794012a8`). Фикс: 9 линий / 4 файла (`request-backend/{133,88,95,99}`) укорочены <12 chars (`eyJhbGci...`=11, `YOUR_TOKEN`=10). Ревью 1 проход opus **APPROVE**. 5-й файл (front-end-architecture.md:754) намеренно не тронут — роут-константа, scanner-quirk → §18b/§19. Фиксап #424: сам §18-текст реестра процитировал триггер-паттерн (пойман bare-прогоном пост-merge; пайп-ловушка exit-code из CLAUDE.md сработала на оркестраторе). |
| 4 | **privacy-сканер × tool-диры: exclusion** (§18a, owner-decision) | #425 | §18a-оценка «135» = недооценка 4.7×: точная энумерация сканером = **630 нарушений, 4 класса** (270 diag + 180 auth + 135 url + 45 capture) в вендоренном BMAD knowledge (5 дир, 4865 файлов, регенерируется bmad install). **Owner decision 2026-09-08 (AskUserQuestion): исключить 5 дир из change-set скана.** Tests-first: `EXCLUDED_CHANGE_SET_PREFIXES` + фильтр в `collectGitChangeFiles` (**НЕ IGNORED_DIRECTORIES — change-set путь поштучный!**); fallback-решение по RAW change-set; scan-roots/PII нетронуты (пины). 24→27 `node --test` (vitest исключает файл по дизайну), пины мутационно верифицированы. **2×APPROVE opus, 0 blocking** (проход-2: независимые /tmp-пробы всех клеймов прохода-1 + герметичность против враждебного git-конфига). **Accepted residual (обе записи в артефакте)**: секреты в 5 дирах невидимы change-set гейту; strict fail-closed ошибки подавлены (иначе bmad install валил бы гейт на 143 benign-файлах); git mv внутрь дир скрывает; excluded-only dirty tree скипает stale-HEAD fallback. |

## 2. Живое состояние (main `be325f2a`, 2026-09-09, сверено прогонами)

- Vitest полный **19559 / 0** (флор CLAUDE.md неизменен) · lint 0/0 · tsc 0 · build --webpack 0 · **boundary 118 = baseline** · 3 exceptions · docs 95 · locale 4 · lessons 0 · **privacy exit 0 на main bare** (после #423/#424/#425) · контракты 174.3 33/33 · treewide `prettier --embedded-language-formatting=off --check "docs/**/*.md"` exit 0
- Окружение: Node 24.18.0 PATH-пин; PM2 восстановлен дважды после machine cold-boot'ов (Docker+PM2 мертвы после ребутов Mac — восстанавливать `open -a Docker` → `pm2 resurrect`); e2e-артефакты зачищены (incl. `playwright-report/` — он тоже триггерит privacy!)
- Манифест 174.3: onboarding.spec и check-privacy — 0 пинов; регенераций не было
- **Новые канон-прецеденты сессии-9** (детали в артефактах): (a) commit-immediately для /tmp-worktree (write+commit одной цепочкой; /tmp вычищается параллельными сессиями/системой); (b) prettier-md emphasis-нормализация портит литеральный `__x__` — эскейпы `\_\_` / `\|` в GFM-ячейках; embedded-форматирование молча переписывает фенс-примеры → только `=off`; (c) гипотезы handoff о retry-интеракциях проверять recon-статикой ДО бисекта; (d) twin-пины: грепай все близнецы ассерт-класса одним проходом; (e) privacy-гейт видит HEAD merge-diff → pre-existing контент «всплывает» в момент merge; документируя quirk, не воспроизводи триггер-паттерн в реестре; (f) sed/perl с кириллицей — только Edit-инструмент; (g) оценка residual'а — самим гейт-инструментом, не grep-эвристикой (135 → реальные 630); (h) сетевые смерти сабагентов — SendMessage-резюм работает (повторено 3×, вкл. двойную смерть подряд)

## 3. Оставшийся объём работ

### 3.0 P3-остаток (следующие кандидаты «по окну»)

1. **route-гарды ~25** — behavior-класс: мини-план + executor(opus), tests-first; самый крупный живой item.
2. **harness restart-per-run** — тест-инфраструктура.
3. **FR-7 · AT-матрица · Manager-creds** — тестовые эпики (реестр §4-§5 исходного; Manager-creds ~22 скипа видны в e2e-прогонах).
4. **docs-95 split** — разбиение baseline-цитат по зонам.
5. **pm2 delete 5** — ПЕРЕ-идентифицировать: id 5 сейчас = живой `wb-repricer-frontend-dev` (удалять нельзя); сверить, что за stale-процесс имелся в виду в V16.
6. Route-constant scanner-quirk (front-end-architecture.md:754) + плейсхолдер-стили 95-файла — owner-decision висит в §18b/§19; после решения №4 (exclusion) актуальность понижена: 754 всплывёт только при следующем merge, трогающем этот файл.

### 3.1 Owner-ledger (без изменений + новoe)

| Решение | Статус |
|---|---|
| C5 chart-palette (гейтит 118 + chart-2 dark selHover 3.71) | ⏳ |
| WCAG 1.4.11 valence-каналы (+ warn/40 бордеры 2.66) | ⏳ |
| A2 OrganicTab /80-тир | ⏳ |
| apiClient-санитизация (~128 .tsx echo) | ⏳ |
| финансовые токены / logger-redact / сканер-семантика | ⏳ |
| **privacy route-constant quirk (754)** — решён косвенно exclusion'ом; переоткрыть при изменении scan-семантики | ✅-deferred |

### 3.2 BE-вопросы (мониторить)

Remote publish BE-ветки (D-2; после deploy → live re-check → аннекс #230) · FE-D3-residual (NestJS-фильтры, сырые pg/redis-ошибки) · конкурентный same-key (верифицирован безопасным).

## 4. Реестр

`_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`: §16 (prettier-md) · §17 (BROWSER-02 + privacy-residual рождение) · §18 (docs redaction + §18a tool-диры + §18b quirks) · §19 (scanner exclusion, accepted residual). Артефакты: `debt-p3-prettier-md-docs.md` · `debt-p3-cabinet-browser-02-repin.md` · `debt-p3-privacy-scanner-tool-dir-exclusion.md` (все в `_bmad-output/implementation-artifacts/`).

## 5. Канон исполнения

V18-промпт §0-§10 без изменений + прецеденты §2 этого handoff. Операционное: стек после ребута Mac восстанавливать в порядке Docker → pm2 resurrect → curl-проверки; e2e — только npm-обёртка, ≤2/час, негативный контроль сверять с зарегистрированной сигнатурой (stack-шум waitForURL ≠ фейл-ассерт).

_Подготовлено оркестратором V19 (сессия-9, 2026-09-09); факты сверены живыми прогонами на main `be325f2a`._
