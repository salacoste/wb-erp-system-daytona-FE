# debt-fu2-sibling-guard-harmonization — канон-комментарии (zero-literal) + #219 stamps + 6 __dirname-анкоров

| Поле | Значение |
|---|---|
| Status | done |
| Date | 2026-09-10 (сессия-11, follow-up FU-2 из HANDOFF-2026-09-10 §3.4 №2) |
| PR | TBD |
| Branch | `debt/fu2-sibling-guard-harmonization` @ `c3a3bd0a` (база `cfbfdefd`) |
| Class | doc-класс (комментарии) + механический код (6 анкоров, behavior-идентичных) — 2 ревью-прохода opus |
| Реестр | §28 |

## Scope (итог: 27 source-файлов + 2 регена манифеста)

- **A — гармонизация канон-декларации**: каноническая форма принята репо-wide:
  `All reads anchor to import.meta.url (170.6 canon) — no process working directory dependence.`
  (zero-literal конвенция #430). **Итог-клейм (уточнён проходом-2)**: 16 guard-файлов с НУЛЁМ literal
  `process.cwd()` (14 волны + 2 table-guard'а pass-1-фикса); каноническое предложение ×1 в 20 файлах
  (14 prose-гармонизированных + 6 anchor-конверсий); 2 table-guard'а — zero-literal через собственный
  LOW-2 prose («cwd-relative paths»). Контекстный prose сохранён (перевод literal→фраза без потери смысла;
  «This spec lives at», «NEVER»→«no … dependence» — семантика запрета выжила, верифицировано проходом-1).
- **B — week-агностичные stamps**: 4 сайта `(contract #219, verified W26)` →
  `(contract #219, live-verified at integration; W26 data since reseeded)`; + pass-2 LOW-находка:
  5-й сайт того же класса `variant-analytics.ts:5` «verified live W26» (порядок слов ушёл от обоих грепов
  FU-4/FU-2) — конвертирован в `live-verified at the FR-7 integration; W26 data since reseeded`.
  Sweeps: `verified W26` = 0 в src/; `verified.*W26|W26.*verified` матчит только новые honest-stamps.
- **C — 6 `__dirname`-анкоров → import.meta.url**: 5 product composition-гардов (1 уровень вверх) +
  `anti-pattern-8-rule.test.ts` (2 уровня, сохранены) — behavior-идентично под vitest, 30/30 таргет-тестов.

## Остатки (registered, не баги)

- `e2e/fixtures/dbw-order-seed.ts:16` — единственный живой `__dirname` (infra-fixture, вне классов FU-2).
- `src/` cwd-анкоры ×6 — registered: primitive-semantic-surfaces (#427), token-test-utils:6,
  outbound-node-network-guard:18, playwright-static-boundary:315; `scripts/` ×10 — infra-инструменты.
- B-stamps без evidence-указателя (pass-1 MINOR #3) — DISPOSITIONED: inline-комментарии, клейм соответствует
  исходной аттестации (#219 integration), FU-4-канон «событие+артефакт» соблюдён в части события.

## Манифест 174.3 (полный протокол 0.3b ×2)

- Пиннуты из тронутых: advertising ×1, PricingTable ×3, supply-detail ×3 (волна) + MarginByBrandTable +
  MarginByCategoryTable (pass-1-фикс, **упущены префлайтом фикса — поймано и пере-регенено**).
- Реген#1 `aeb60950`: set-diff ровно 3 source-SHA/275, 0/0. Реген#2 `158c0aeb`: ровно 2 source-SHA, 0/0.
- Контракт-тесты 33/33 ×3 (база/после#1/после#2). Проход-2: **полный свип всех 275 пинов — 0 stale**.

## Validation (живые прогоны)

- vitest СОЛО: 1287 файлов, **19570/19570**, exit 0 (флор ровно). Таргет C: 30/30. Контракты: 33/33 ×3.
- lint 0/0 · tsc 0 · build --webpack 0 · boundary 0 · docs 0 · locale 0 · lessons 0 · privacy 0 ·
  prettier 27/27 · diff-check 0.

## Dev Agent Record

### Post-1st-pass-review fixes (2026-09-10)

Проход-1 (opus): **APPROVE** — 3 MINOR + 3 INFO. #1 APPLIED (`38c4f0b9`): 2 sibling table-guard prose-сайта
(`MarginByBrandTable:32`/`MarginByCategoryTable:30`) доведены до zero-literal; **оба файла пиннуты — реген#2
потребовался пост-фактум (158c0aeb)** — урок: post-review фиксы проходят тот же 0.3b-префлайт, что и волны.
#2 REGISTERED: dbw-order-seed.ts:16. #3 DISPOSITIONED (см. Остатки). INFO ×3 — без действий / close-row.

### Post-2nd-pass-review fixes (2026-09-10)

Проход-2 (opus): **APPROVE** — 1 MEDIUM (close-row ещё не написан — ожидаемое pre-close состояние, этот
артефакт его закрывает) + 2 LOW. LOW#1 APPLIED (`c3a3bd0a`): variant-analytics.ts:5 word-order-вариант
«verified live W26» сконвертирован (0 пинов — реген не нужен). LOW#2 APPLIED этим артефактом: клейм
переформулирован (16/20/2 вместо ошибочного «×1 в каждом из 16»). Манифест-vs-disk: все 275 MATCH;
`e2e/` __dirname = ровно 1 (dbw-order-seed:16, registered).

Триггеры эскалации: 9 находок суммарно (≤12), максимум 3-6/проход (проход-1: 6 → по Trigger-3 нужен +1
проход — исполнен как проход-2 с полным ре-верифи; проход-2: 3 ≤5) → сходимость достигнута.

## File List

- 14 A-файлов (guard-комментарии), 2 A-fix (table guards), 4 B-файла (hooks/types stamps),
  1 B-fix (variant-analytics.ts), 6 C-файлов — итого 27 source; `e2e/fixtures/story-174-3/execution-manifest.json` ×2 регена.

## Change Log

- 2026-09-10: item создан и закрыт (сессия-11 FU-2); 2 ревью-прохода — APPROVE/APPROVE; находки #1(п1), #1(п2)
  применены, остальные registered/dispositioned.

**Lessons:** (1) Word-order variants escape literal sweeps — grep attestation classes with `verified.*W26`, never the exact string. (2) Multi-worktree: absolute-path every grep — a cwd-reset grep read the wrong tree and nearly fabricated a regression narrative. (3) Post-review fixes get the SAME 0.3b pre-flight as waves — both table-guard fix files were manifest-pinned; caught, re-regenerated, set-diffed.
