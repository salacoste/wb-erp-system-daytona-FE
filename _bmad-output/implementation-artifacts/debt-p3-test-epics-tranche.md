# debt-p3-test-epics-tranche — FR-7 re-pin · AT-матрица · Manager-creds (V20 §4 п.3)

| Поле | Значение |
|---|---|
| **Status** | review (флип → done пост-merge) |
| **PR** | pending (номер вторым коммитом) |
| **Head-SHA** | `ed4713d3` + closeout (ветка `debt/test-epics-tranche`, база `57d772c6` = post-#431 main) |
| **Класс** | test-assertion re-pin (FR-7, 1 файл) + doc-only диспозиции (AT, Manager — реестр §23) |
| **Owner-решения** | 2026-09-10, AskUserQuestion: (A) re-pin / (B) письменный owner-accept / (C) фиксация optional + коррекция цифры |
| **Дата** | 2026-09-10 |

## Tasks

- [x] Pre-flight 0.3a: recon explore(sonnet) — FR-7 = 2/4 теста заморожены (nmId 202867769 / W26 после DB-reseed); AT = реальные SR никогда не исполнялись (сред нет); Manager = живая статика 4 теста, НЕ 22-23 — лог `/tmp/debt-test-epics-recon.log` (в сводке explore-агента a8db740e)
- [x] Pre-flight 0.3b: `fr7-by-variant.spec.ts` НЕ пиннут манифестом (grep = 0) → реген не требуется; orders-client-info / auth-manager.setup — тоже 0 пинов
- [x] Owner-решения по трём вилкам (AskUserQuestion — все три рекомендации приняты)
- [x] Живой проб данных: `GET /v1/analytics/weekly/by-variant?week=` → W31-W36 несут строки (W33 = 28, максимум; W26 пуст); nmId 148188881 (chrt 248941683) стабилен в W33/W35/W36; настоящий эндпоинт найден в `useMarginAnalyticsByVariant.ts` (первая проба по неверному пути `/v1/analytics/product/{nm}` дала 404 — PRODUCT-константа это UI-роут, не API)
- [x] Волна executor(sonnet): re-pin 1 файла (+11/−9) → коммит `ed4713d3`
- [x] **Живая валидация изолированным раннером #431 (dogfooding)**: `npm run test:e2e:isolated -- e2e/fr7-by-variant.spec.ts --retries=0 --project=chromium` → **7 passed / 1 skipped (Manager-setup), exit 0** — ВСЕ 4 теста FR-7 зелёные, включая оба ранее замороженных; runner summary: `restoreVerified:true, swapped:true, teardownErrors:[]`; PM2 восстановлен (свежий pid, :3100→200); worktree удалён
- [x] Гейты: privacy 0 bare · boundary 118 · docs 95 · locale 4 · lessons 0 · контракты 33/33
- [x] Реестр §23 APPEND (три диспозиции) + этот артефакт

## Dev Agent Record

### FR-7 — re-pin на живые данные (owner: вариант «re-pin»)

Механическая замена пинов данных в `e2e/fr7-by-variant.spec.ts`, ассерты/селекторы/таймауты не тронуты:
`PRODUCT` 202867769 → **148188881**; `SINGLE_WEEK` W26 → **W33** (28 строк живых); `RANGE_WEEKS`
W25..W26 → **W35..W36**; комментарии датированы (post-DB-reseed provenance). Stale-инструкция
`--no-deps` (запрещён, e2e/README.md:89-91) заменена каноническим запуском через
`npm run test:e2e:isolated` (PR #431). Детектирующая сила сохранена: footnote-пин рендерится
только при наличии строк (реальные данные W33), markers-пины структурные. Доказательство: **4/4 PASSED**
живым прогоном после re-pin (ранее 2/4 непрогоняемы).

### AT-матрица — письменный owner-accept (owner: вариант «accept»)

Реальные VoiceOver/NVDA/JAWS/TalkBack никогда не исполнялись (запись 174.3:273-274 — environment-capability
record); среды отсутствуют на хосте (JAWS коммерческий, NVDA — Windows, TalkBack — Android-девайс).
Evidence-база автоматизированного покрытия зафиксирована реестром §23: 19 e2e-файлов с AxeBuilder,
keyboard-проходы Chromium/Firefox, WebKit semantic proxy, 200% zoom ×76 роутов ×2 темы. Принято owner'ом
как остаточный release-risk (механика прецедента #425: accepted residual, owner authority).

### Manager-creds — фиксация optional + коррекция цифры (owner: вариант «fixate»)

Живая статика (recon): machinery = `auth-manager.setup.ts` (setup.skip без `E2E_MANAGER_EMAIL/PASSWORD`) +
3 теста в `orders-client-info.spec.ts` (PII role-gate колонки «Клиент»: скрытие колонки / ноль запросов
client-info / BE 403) + 1 setup = **4 скипа**, причём спека `@mutating` и в дефолтных прогонах исключается
grep-invert'ом (не собирается вовсе). Цифра handoff'а «22-23» = run-level skip-итоги регена манифеста 174.4
(367/0/23 и 368/0/22), атрибуция их менеджер-кредам статически НЕ подтвердилась (в текущем манифесте 0
skipped-записей, 0 orders-client-info-записей) — исправлена в реестре §23. Джорни остаются доступными при
появлении кредов (BE-seed, owner-авторизация; machinery готов, 0 изменений кода).

### Мета-клейм бланкет-квалификатор (116.1 A-2)

Формулировки этого блока и реестра §23 о структурных свойствах («ассерты не тронуты», «атрибуция не
подтвердилась», «machinery готов») — **unaudited meta-claims** per Trigger 4, кроме подтверждённых живым
прогоном (7 passed), recon-цитатами file:line и grep-проверками (0 пинов манифеста, 0 hits мёртвых данных).

### Валидация

| Гейт | Результат |
|---|---|
| **Живой e2e (изолированный раннер)** | **7 passed / 1 skipped, exit 0** (все 4 FR-7 теста) |
| privacy (bare) / boundary / docs / locale / lessons | 0 / 118 / 95 / 4 / 0 |
| Контракты 174.3 | 33/33 |
| Манифест | 0 пинов на все тронутые файлы — реген не требуется |
| prettier / git diff --check | чисто (спека) |

lint/tsc/build/vitest-соло не гонялись на этой ветке ПОСЛЕ ревью — дифф не затрагивает ни surfaces этих
гейтов (e2e-спека не входит в eslint-glob/tsc-проект/vitest-include/build-input; md-файлы вне npm-гейтов);
предыдущее полное состояние гейтов = main `57d772c6` (проверено пост-merge #431).

## File List

| Файл | Дельта |
|---|---|
| `e2e/fr7-by-variant.spec.ts` | +11/−9 (константы данных + комментарии, ассерты нетронуты) |
| `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md` | §23 APPEND |
| `_bmad-output/implementation-artifacts/debt-p3-test-epics-tranche.md` | NEW (этот артефакт) |

## Change Log

| Дата | Событие |
|---|---|
| 2026-09-10 | Recon → owner-решения (AskUserQuestion ×3) → живой проб данных → re-pin волна → 4/4 PASSED живым изолированным раннером → реестр §23 → ревью-проходы |

**Lessons:** (1) PRODUCT-константа e2e-спеки — UI-роут, не API-путь: 404 пробы по нему ложный, настоящий эндпоинт ищи в хуке-консьюмере. (2) Пин недели в UI-URL живёт/умирает вместе с данными недели — re-pin делай живым пробом by-variant-эндпоинта, не догадкой. (3) Цифры handoff'ов («22-23 скипа») сверяй со статикой репо перед атрибуцией — run-level итоги регена прилипают к неверной причине.
