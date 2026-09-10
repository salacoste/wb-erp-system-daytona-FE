# debt-fu1-cwd-anchor-contracts — 7 cwd-анкоров 4 source-contract гардов → import.meta.url (170.6)

| Поле | Значение |
|---|---|
| Status | done |
| Date | 2026-09-10 (сессия-11, follow-up FU-1 из HANDOFF-2026-09-10 §3.4) |
| PR | TBD |
| Branch | `debt/fu1-cwd-anchor-contracts` @ `93f2e7df` (база `f7296c0a`) |
| Class | behavior/test-assertion (механическая волна по доказанному шаблону #430), 2 ревью-прохода opus |
| Реестр | §27 |

## Контекст

Residual §21 (#430): handoff называл 2 контракта вне app/(dashboard)-семейства. Рекон скорректировал scope
(прецедент #433c): твин-свип нашёл **4 файла с 7 живыми cwd-анкорами** — к 2 именованным добавились
campaign-detail (2) и PricingTable (1, in-family — премисса «семейство закрыто» тоже была неполной).

## Scope (4 файла, 7 анкоров)

| Файл | Анкоров | Глубина |
|---|---|---|
| `src/components/product/states/__tests__/state-composition-source-contracts.test.ts` | 1 | 4×`..`+`app` |
| `src/components/custom/price-calculator/__tests__/story-172.8-presentation-source-contract.test.ts` | 3 | 5×`..` |
| `src/components/custom/advertising/__tests__/campaign-detail-source-contracts.test.tsx` | 2 | 5×`..` |
| `src/app/(dashboard)/analytics/pricing/components/__tests__/PricingTable.test.tsx` | 1 | 7×`..` |

Вне scope (зарегистрировано): `primitive-semantic-surfaces.test.tsx` (out-of-scope #427, CLI-инвариантный,
owner-gated reopen); `playwright-static-boundary.test.ts:315` + `outbound-node-network-guard.ts:18` +
`token-test-utils.ts:6` (src/test-инфра, другой класс); 6 `__dirname`-анкоров sibling-гардов (не cwd-класс,
переданы в FU-2 — находка прохода-2).

## Манифест 174.3 (протокол 0.3b выполнен полностью)

- Префлайт: из 4 файлов пиннут ТОЛЬКО PricingTable.test.tsx (3 записи); остальные 0 пинов.
- Контракт-тесты ДО правок: 33/33. Реген раннером `--owner-units` (exit 0) → set-diff: 275/275 источников,
  **изменился ровно 1 source-SHA (PricingTable ×3 записи), 0 added/removed** (урок #427 проверен — сюрприза нет).
- Контракт-тесты ПОСЛЕ регена: 33/33. Post-regen MINOR-коммит `93f2e7df` тронул только НЕпиннутый файл —
  проход-2 верифицировал SHA↔disk MATCH (proactive-проверка гипотетического STALE).

## Глубины — 2 девиации от плана, доказанные исполнителем

Оркестраторский план ошибся в 2 из 4 глубин; обе исправлены волной с эмпирическим доказательством
(node-resolve прекоммит + реальные fs-риды гардов валятся громко при неверной глубине):
1. state-composition: **4×`..`+`app`**, не 5×`..` (5-й `..` уводит в `<root>/app`).
2. PricingTable: **7×`..`**, не 6 (форма `src/app/(dashboard)/…` несёт сегмент `app` — как в шаблоне tariffs).

## Validation (живые прогоны)

- vitest СОЛО: 1287 файлов, **19570/19570**, exit 0 (флор ровно).
- Таргет 4 файла: 31/31 (до и после MINOR-фикса). Контракт-тесты 174.3: 33/33 ×2 (до/после регена).
- lint 0/0 · tsc 0 · build --webpack 0 · boundary 0 (=118) · docs 0 · locale 0 · lessons 0 · privacy 0 bare ·
  prettier 4/4 · diff-check 0.

## Dev Agent Record

### Post-1st-pass-review fixes (2026-09-10)

Проход-1 (code-reviewer opus, свежий контекст): **APPROVE** — 0 CRITICAL/HIGH; 1 MINOR + 1 INFO.

- MINOR (APPLIED, `93f2e7df`): новый blanket-комментарий «All reads anchor to import.meta.url» был буквально
  неточен — pre-existing `statesRoot = path.resolve(__dirname, '..')` сидит на vitest `__dirname`-шим
  (cwd-независимо, но не канон). Заменено на `path.resolve(testDirectory, '..')` — эквивалентно, комментарий
  стал буквально истинным.
- INFO (DISPOSITIONED): шум регена манифеста (random temp-dir суффиксы в `command`-полях, generatedAt) —
  benign, инherent любому регену.

### Post-2nd-pass-review fixes (2026-09-10)

Проход-2 (opus, свежий контекст): **APPROVE** — все 3 клейма ревьюер пере-верифицировал независимо
(финальный-state аудит, твин-свип, SHA↔disk). 0 CRITICAL/HIGH/MEDIUM; 2 INFO:

- INFO (TRANSFERRED в FU-2): 6 sibling `__dirname`-анкоров в product/metrics|filters|tables|charts|product
  composition-гардах + anti-pattern-8-rule.test.ts:21 — не cwd-класс, но кандидат на ту же унификацию.
- INFO (DISPOSITIONED): pre-existing React duplicate-key warning `r-1` в фикстуре PricingTable — все 31 тест
  зелёные, диффом не тронуто.

Триггеры эскалации: 4 находки суммарно (≤12), максимум 2 в проходе (≤5), не novel-pattern → 2 проходов
достаточно.

## File List

- `src/components/product/states/__tests__/state-composition-source-contracts.test.ts`
- `src/components/custom/price-calculator/__tests__/story-172.8-presentation-source-contract.test.ts`
- `src/components/custom/advertising/__tests__/campaign-detail-source-contracts.test.tsx`
- `src/app/(dashboard)/analytics/pricing/components/__tests__/PricingTable.test.tsx`
- `e2e/fixtures/story-174-3/execution-manifest.json` (реген раннером, set-diff 1/275)

## Change Log

- 2026-09-10: item создан и закрыт (сессия-11 FU-1); 2 ревью-прохода — APPROVE/APPROVE, MINOR прохода-1
  применён.

**Lessons:** (1) Handoff inventories undercount — twin-sweep before planning found 4 files where the handoff named 2, incl. one in the «done» family. (2) Depth arithmetic: `src/app/(dashboard)` shapes carry the extra `app` hop; prove depth with a node-resolve pre-check, never copy chains. (3) Regen set-diff: 1 source SHA / 275 — the #427 surprise does NOT recur when pre-flight intersects the FULL touched-file list.
