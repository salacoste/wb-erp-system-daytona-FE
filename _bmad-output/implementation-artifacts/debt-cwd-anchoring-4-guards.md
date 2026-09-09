# debt-cwd-anchoring-4-guards — cwd-anchoring 4 sibling-гардов → import.meta.url канон

| Поле | Значение |
|---|---|
| **Status** | review (обе ревью-прохода завершены APPROVE; flip → done пост-merge) |
| **PR** | pending (заполнится вторым коммитом после `gh pr create`) |
| **Head-SHA** | `105f06ca` (ветка `debt/cwd-anchoring-4-presentation-guards`, база `ae803f87` = main) |
| **Класс** | test-infra механика (не behavior): анкор-свитч в 4 гардах, 0 логических изменений |
| **Источник** | V20 §4 п.1; V19-handoff §3.0 №1; реестр §20 residual |
| **Дата** | 2026-09-10 |

## Tasks

- [x] Pre-flight 0.3a: Story-105.2 grep — item НЕ починен (11× `process.cwd()` живых в 4 файлах, `import.meta.url` = 0)
- [x] Pre-flight 0.3b: манифест-сверка — 4 файла имеют **0 пинов** в `e2e/fixtures/story-174-3/execution-manifest.json` (sanity: известные пины #427 на месте, advertising=628/supply-detail=630) → реген НЕ требуется
- [x] Pre-flight 0.3c: e2e-видимость — 0 референсов в e2e/ → живой e2e НЕ требуется
- [x] Pre-flight 0.3d: scope = сам строгий свип (45 файлов `*presentation-source-contracts*`: cwd present + imu absent = ровно 4) + per-file grep-подсчёты (2/3/3/3)
- [x] Recon explore(sonnet): occurrence-map, шаблон (shipment-detail, канон `23f15a91`/`af4daf6e`), depth-таблица, consumers=0, extras=0 — лог `/tmp/debt-cwd-anchoring-4-guards-recon.log`
- [x] Worktree `/private/tmp/debt-cwd-anchoring-4-guards` + baseline целевого прогона ДО правок (4 файла / 18 тестов PASS)
- [x] Волна executor(sonnet): механический свитч по шаблону → коммит `105f06ca` (63+/15−)
- [x] Валидация §5 F полная (таблица ниже)
- [x] Ревью проход-1 opus: APPROVE (0 blocking)
- [x] Ревью проход-2 opus (свежий вызов): APPROVE (0 blocking)
- [x] Closeout: реестр §21 APPEND + этот артефакт

## Dev Agent Record

### Имплементация

Механический анкор-свитч в 4 presentation-source-гардах по канону 170.6 (шаблон байт-поведением —
`shipment-detail`-гвард, канон-коммиты `23f15a91`/`af4daf6e` из #427): в каждом файле (1) импорты
`+fileURLToPath` из `node:url`, `+dirname` в существующий `node:path`; (2) один const `repoRoot =
resolve(dirname(fileURLToPath(import.meta.url)), '..'×N)`; (3) все 11 `resolve(process.cwd(), X)` →
`resolve(repoRoot, X)`; (4) канон-комментарий 170.6, адаптированный по пути каждого файла.
**Depth-таблица (единственная нетривиальная часть):** shipments=5 (`__tests__→shipments→(dashboard)→app→src→root`);
tax/sku-packaging/box-types=6. Всё остальное — хелперы, literal-union типы, дисковери-логика
(рекурсивный спуск tax, flat+`entry.isFile()` у shipments), строковые константы, тела тестов — байт-нетронуто.

Девиация от дословного шаблона (дислоужена executor'ом, подтверждена обоими проходами): канон-комментарий
БЕЗ литерала `process.cwd()` («process working directory») — чтобы гигиена `grep -c "process.cwd()" = 0`
была проверяемой на этих файлах. **Коррекция атрибуции:** commit-сообщение волны назвало это «per shipped
sibling convention» — эта посылка НЕВЕРНА (нахождения обоих ревью-проходов; shipped siblings несут литерал).
Zero-literal — **вновь вводимая конвенция этих 4 файлов**, не наследие; коммит НЕ ампендится пост-ревью
(APPEND-ONLY) — настоящая запись авторитетна. Кандидат на будущую гармонизацию: привести комментарии 5-7
sibling-гардов к zero-literal либо кодифицировать вариант в каноне — не в этом PR (рецепт обоих ревьюеров).

### Валидация (живые прогоны, exit-коды без пайпов; логи /tmp/debt-cwd-anchoring-*.log)

| Гейт | Результат |
|---|---|
| lint (`--max-warnings 0`) | 0/0, exit 0 |
| tsc `--noEmit` | 0 ошибок |
| Targeted vitest (4 гарда) | 4 файла / **18/18**, счётчики = базлайн |
| Контракты 174.3 | 2 файла / **33/33** |
| **Полный vitest СОЛО** | **19570/19570** (1287 файлов), флор 19570 сохранён ровно |
| `next build --webpack` | exit 0 |
| boundary | **118 = baseline**, 3 exceptions |
| docs / locale / lessons | exit 0 (95) / 4 / 0 |
| privacy (**bare**) | exit 0 (3656 текст-файлов) |
| prettier на изменённых | 4/4 чисто (по 1 файлу на инвокацию) |
| `git diff --check` | чисто |

e2e-артефакты не создавались (item не e2e-видимый); манифест 174.3 не регенился (0 пинов).

### Мета-клейм бланкет-квалификатор (116.1 A-2)

Этот блок + Change Log + реестр §21 используют формулировки о структурных свойствах диффа
(«байт-нетронуто», «0 логических изменений», «счётчики = базлайн», «гвард-семантика неизменна») — все такие
клеймы **unaudited meta-claims** per Trigger 4, кроме тех, что подтверждены живым прогоном из таблицы выше
или независимой верификацией ревью-проходов (проход-2 вычислил глубины и прогнал 18/18 дважды, вкл. чужой cwd).

### Post-1st-pass-review fixes (2026-09-10)

**Проход-1 (code-reviewer opus, свежий контекст): APPROVE — 0 CRITICAL / 0 HIGH / 0 MEDIUM-blocking; 1 MEDIUM + 2 INFO.**
Фикс-волна НЕ требовалась (ревьюер явно: «do not churn the 4 files in this PR»).

- **[MEDIUM] Дрейф формулировки канон-комментария + ложная посылка «matching shipped siblings»** — DISPOSITIONED:
  zero-literal оставлен (строго полезнее — делает клейм «0 живых вхождений» тривиально проверяемым grep'ом);
  атрибуция исправлена в Dev Agent Record выше; гармонизация sibling-комментариев — будущий item, не этот PR.
- **[INFO] 2 cwd-анкорных контракта вне scope item'а** (`state-composition-source-contracts`,
  `story-172.8-presentation-source-contract` у price-calculator) — DISPOSITIONED: зарегистрированы residual'ом §21.
- **[INFO] Дисковери-семантика неизменна** (shipments excludes subdirs via `entry.isFile()`, tax recursive intact,
  e2e-пин sku-packaging резолвится от repoRoot) — подтверждено, действия нет.

### Post-2nd-pass-review fixes (2026-09-10)

**Проход-2 (code-reviewer opus, второй свежий вызов, независимый): APPROVE — 0 blocking; 2 LOW + 2 INFO.**
Проход-2 независимо: вычислил минимальность всех глубин (6/5/6/6 — верно и минимально), перепроверил
18/18 из корня worktree И из чужого cwd (бинарь `node_modules/.bin/vitest` worktree c `--root`) —
**cwd-независимость (цель item'а) доказана исполнением**, сверил дифф-артефакт с веткой байт-в-байт.

- **[LOW] Остаточный `process.cwd()` в `story-172.8-presentation-source-contract.test.ts` (3 вхождения)** —
  DISPOSITIONED: вне scope (файл = price-calculator, отдельный unowned-surfaces residual §20/§21); в PR не трогается.
- **[LOW] Неточная атрибуция «per shipped sibling convention» в commit-сообщении** — DISPOSITIONED:
  исправление нарратива в Dev Agent Record (см. выше); коммит не переписывается пост-ревью.
- **[INFO] Горизонтальная/вертикальная форма repoRoot-консты определяется prettier printWidth (95<100 у
  5-арг), не дрейфом** — действий нет.
- **[INFO] Порядок fs-импортов отличается от шаблона — pre-existing строка, не тронута диффом** — действий нет.
- **Харнесс-заметка прохода-2**: верификация из чужого cwd — через СОБСТВЕННЫЙ бинарь worktree
  (`node_modules/.bin/vitest --root …`); вариант `cd /tmp && npx vitest run --root …` падает на
  ERR_MODULE_NOT_FOUND цепочки конфиг-плагинов до загрузки тестов (артефакт харнесса, не диффа).

## File List

| Файл | Дельта |
|---|---|
| `src/app/(dashboard)/settings/tax/__tests__/tax-presentation-source-contracts.test.ts` | +17/−3 (6 `..`) |
| `src/app/(dashboard)/shipments/__tests__/shipments-presentation-source-contracts.test.ts` | +10/−4 (5 `..`) |
| `src/app/(dashboard)/shipments/sku-packaging/__tests__/sku-packaging-presentation-source-contracts.test.ts` | +18/−4 (6 `..`) |
| `src/app/(dashboard)/shipments/box-types/__tests__/box-types-presentation-source-contracts.test.ts` | +18/−4 (6 `..`) |

## Change Log

| Дата | Событие |
|---|---|
| 2026-09-10 | Item исполнен: recon → волна executor(sonnet) → коммит `105f06ca` → полная валидация → 2 ревью-прохода opus (оба APPROVE, 0 blocking) → closeout |

**Lessons:** (1) Глубина `..` анкора — по реальной вложенности: shipments 5, tax/sku-packaging/box-types 6; цепочку соседа не копировать. (2) Зелёный targeted ≠ cwd-независимость; доказательство — прогон из чужого cwd собственным бинарём worktree. (3) Zero-literal `process.cwd()` в канон-комментарии — новая конвенция этих 4 гардов (grep=0 проверяем), не sibling-наследие.
