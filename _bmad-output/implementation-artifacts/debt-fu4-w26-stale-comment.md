# debt-fu4-w26-stale-comment — stale-комментарий «(verified W26)» → week-agnostic re-pin pointer

| Поле | Значение |
|---|---|
| Status | done |
| Date | 2026-09-10 (сессия-11, follow-up FU-4 из HANDOFF-2026-09-10 §3.4) |
| PR | [#435](https://github.com/salacoste/wb-erp-system-daytona-FE/pull/435) |
| Branch | `debt/fu4-w26-stale-comment` @ `051839f7` (база `4967d91c`) |
| Class | doc-only (комментарий), 1 ревью-проход по owner-прецеденту #420/#423 |
| Реестр | §26 |

## Контекст

Pass-1-находка INFO транша #432 (реестр §23): строка 29 `src/hooks/useMarginAnalyticsByVariant.ts` несла
`(verified W26)` — клейм верификации pagination-блока на данных недели W26. После DB-reseed (сессия-10) W26
пуст, re-pin переверен на W33 — stamp стух.

## Change

- (before): `/** Pagination block returned by the by-variant endpoint (verified W26). */`
- (after): `/** Pagination block per contract — endpoint + envelope live-verified at the FR-7 re-pin (any week stamp goes stale on reseed; see debt-p3-test-epics-tranche.md). */`

Week-agnostic: событие (FR-7 re-pin) + артефакт вместо недели — переживёт будущие reseed'ы (суть FU-5 recurrence).

## Pre-flight (Story-105.2 + 0.3b)

- Манифест 174.3: 0 пинов хука — реген не требуется.
- Твин-свип `verified W26`: 4 соседних сайта `(contract #219, verified W26)` — исторические stamps контракта
  #219 (не претензии актуальности), вне scope item'а; переданы в FU-2 (транш сессии-11) для недели-агностичной
  унификации.
- e2e-видимость: комментарий не e2e-пиннут; живой e2e не требуется.

## Validation (живые прогоны)

- vitest СОЛО: 1287 файлов, 19570/19570, exit 0 (флор сохранён ровно).
- Таргет: 3 consumer-файла (hook + VariantsTab + SkuVariantSection) 19/19.
- prettier (файл) 0 · eslint (файл) 0 · git diff --check 0.
- docs/lessons gates: 0 (bare, финальное дерево worktree).

## Dev Agent Record

### Post-1st-pass-review fixes (2026-09-10)

Ревью проход-1 (code-reviewer opus, свежий контекст): **APPROVE** — 0 CRITICAL/HIGH; 1 MINOR + 3 INFO +
1 out-of-scope note.

- MINOR (APPLIED, рецепт (a) ревьюера): «live-verified» в применении к pagination-блоку сильнее записанного
  evidence — re-pin верифицировал endpoint+envelope живым пробом, прямого ассерта pagination-полей в спеке нет
  (`fr7-by-variant.spec.ts` ассертит только UI-рендер). Формулировка заменена на «shape per contract —
  endpoint + envelope live-verified…» (коммит `051839f7`).
- INFO (DISPOSITIONED, оставлено): формат-пример `e.g. "2026-W26"` (строка 23) — не клейм верификации, ввести
  в заблуждение не может.
- INFO (DISPOSITIONED, оставлено): длина комментария — в норме файла, prettier green, max-len в проекте нет.
- INFO (DISPOSITIONED, оставлено): bare-filename указатель — git-tracked подтверждено ревьюером
  (`git ls-files --error-unmatch`), doc-гейт `.ts`-комментарии не сканирует.
- INFO out-of-scope (TRANSFERRED): 4 sibling `(contract #219, verified W26)` — folded в FU-2.

Подтверждения ревьюера: (a) артефакт `debt-p3-test-epics-tranche.md` документирует FR-7 re-pin live-верификацию
(хедер-строка 8; линии 17-19/25-33 — W33=28, 4/4 PASSED); (b) иных W26-клеймов-верификации в файле нет.

## File List

- `src/hooks/useMarginAnalyticsByVariant.ts` — комментарий строки 29 (коммиты `23eada64` + `051839f7`).

## Change Log

- 2026-09-10: item создан и закрыт (сессия-11 FU-4); 1 ревью-проход (doc-only lane), MINOR применён.

**Lessons:** (1) Week-stamped verification claims rot on every reseed — pin the event + artifact, never the week. (2) «live-verified» must name what was actually asserted: endpoint+envelope probe ≠ pagination-field assert. (3) Twin-stamp sweep: contract-#219 stamps are historical facts — disposition, don't blanket-fix.
