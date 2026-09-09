# Debt P3: route-гарды — унификация на exact-array (172.10 canon) (сессия-9, V19)

> **Status**: done · **PR**: [#427](https://github.com/salacoste/wb-erp-system-daytona-FE/pull/427) · **Branch**: `debt/route-guards-exact-array` @ `18fed504` (worktree /private/tmp/route-guards)
> **Источник**: V14 handoff §3 «~25 route-гардов унификация exact-array» + FINAL §123/181; исполнен оркестратором сессии-9 (2026-09-09)
> **Класс**: test-assertion волны → обязательные 2 ревью-прохода (CLAUDE.md); 3 волны executor (opus/sonnet/opus)

---

## Scope (реконструирован recon-агентом: «~25» = только (d)-класс)

Из 45 presentation-source гардов: **12 уже (a)-класс**, **33 девианта** = 26 count-пинов (d) + 3 без пинов (b) + 4 literal-без-диск-чеки (c/c′). Конвертировано **32 гарда** в 3 волнах; **2 out-of-scope с обоснованием**: `primitive-semantic-surfaces` (инвариантный гард над всем CLI-растущим `ui/` — каталог противоречит природе) и `dashboard-widgets` (`toBeGreaterThanOrEqual(140)` над открытым widget-реестром — exact-array создал бы maintenance-налог на каждый виджет; зарегистрировано §20).

## Implementation (3 волны, литералы из живого диска)

- **Волна-1** (`23f15a91`, 7 файлов, executor opus): funnel/gaps/liquidity (b) — каталог-пины добавлены; cogs-single (c) — root+per-subdir disk-vs-literal (prefix-family ownership вместо 130-имённого exclusion-сета); shipment-detail/brand-share (c) — disk-vs-literal; **settings/cabinet (c′) — таутология `expect(LITERAL).toEqual([same LITERAL])` заменена настоящим disk-гардом**. Coverage-нюанс сохранён: funnel scan-set (включал flat test-файл) не тронут, канон-пин добавлен отдельной discovery.
- **Волна-2** (`ae857420`, 18 count-пинов, executor sonnet): все `toHaveLength/PINNED_PRODUCTION_FILE_COUNT` → exact-array; **18/18 счётчиков совпали с диском — ноль стухших пинов**; инварианты байт-в-байт.
- **Волна-3** (`af4daf6e`, 7 boundary-ловушек, executor opus): advertising 64-каталог; model-registry `[id]`-exclusion с load-bearing-комментарием; orders shared-root 55 (fbo/integrity границы); notifications 3-root Flavor C; **tariffs FINDING: стухший пин 29→32** (3× ScheduleVersion* приехали после пина; palette/hex-clean; датированная in-file disclosure); supply-detail с SHA-256-блоком 173.12 байт-в-байт.
- **Итого**: 6× `process.cwd()` → import.meta.url миграций (170.6 canon); 172.10 canon повсеместно (relative slice → forward slashes → sort → toEqual).

## Манифест 174.3 — инцидент + реген

Мой префлайт-промах: пересечение с манифестом сделано только для файлов ПРЕДЫДУЩИХ item'ов, не для 32 гвардов волны. **Гейт поймал**: полный vitest упал на `stale source hash ... supply-detail-presentation-source-contracts.test.ts`. Реген раннером `node scripts/run-story-174-3-state-evidence.mjs --owner-units` (`18fed504`). **Коррекция нарратива по проходу-2**: реген обновил **3 запиненных hash'а, не 1** — advertising + supply-planning + supply-detail (все три были пиннуты и тронуты волнами); post-regen **275/275 пинов == disk SHA**; entry-сет манифеста: 0 added/0 removed; 143 playwright-записи байт-идентичны.

## Validation (финальное дерево `18fed504`)

| Гейт | Результат |
|---|---|
| vitest полный соло | **19570/0** exit 0 — **флор 19559→19570 (+11), монотонно ↑, CLAUDE.md тем же PR** |
| build --webpack / lint / tsc / boundary / docs / lessons / locale / privacy | 0 · 0/0 · 0 · 3/3 · 0 · 0 · 4 · 0 |
| контракты 174.3 | 33/33 (после регена) |
| 32 конвертированных гарда (переписи проходов) | 239/239 (проход-1) · 287/287 вкл. 3 mirror-гарда (проход-2) |
| prettier / ESLint (zero-warning) | clean · 0/0 |

## Post-1st-pass-review fixes (2026-09-09)

Review pass 1 (code-reviewer, opus, свежий контекст) — **APPROVE, 0 blocking**; полная перепись 239/239; все 5 cross-story exclusion-цепей закрыты с обеих сторон (orders/fbo/integrity, models `[id]`, settings 3-way 4+2+5=11, supplies 12+18=30 mirror, installed-rules). Применено 2 LOW (`5b19e444`): supply-detail readability-цикл восстановлен (все owned-файлы non-empty; хэш-блок нетронут — его изменение и потребовало регена); brand-share-комментарий переписан (6 shared-файлов = **unowned**, pre-existing gap).

### Post-2nd-pass review (2026-09-09)

Review pass 2 (code-reviewer, opus, свежий контекст) — **APPROVE, merge-ready**. Все 5 клеймов прохода-1 независимо верифицированы (вкл. исполнение 3 неизменённых mirror-гардов); manifest set-diff скриптом (см. коррекцию нарратива выше); 6 свежих гардов из непересёкшегося с проходом-1 списка — зелёные + ручная проверка по записи. LOW×2: (1) нарратив «только supply-detail» — исправлен в этом артефакте (выше); (2) dangling-цитата «registry §20» в brand-share — **легализована этим же PR: §20 реально регистрирует unowned-surface gap**. INFO: 4 sibling-гарда всё ещё cwd-зависимы в коде (tax, shipments, sku-packaging, box-types — (a)-класс, но без миграции анкоринга) — **next-wave список**.

**Meta-claim qualifier**: аттестационные формулировки о полноте покрытия/переписей — unaudited meta-claims (Trigger 4); первичный evidence — ревью-статьи.

## Out-of-scope (зарегистрировано §20, не молчаливый скип)

1. `primitive-semantic-surfaces.test.tsx` — динамический инвариант-гард над всем `src/components/ui` (CLI-обслуживаемый shadcn) — exact-array противоречит природе поверхности.
2. `dashboard-widgets` — `toBeGreaterThanOrEqual(140)` над открытым widget-реестром; конвертация = огромный литерал с maintenance-налогом. Средний вариант (точный count) тоже отклонён.
3. Unowned surfaces (из ревью INFO, зарегистрированы §20 для future-владельцев): 6 файлов `custom/analytics` (FbsTrends*/DataSourceIndicator/ResponsiveChartFrame), `campaigns/[advertId]`-поддерево, `period-presets/`, price-calculator (соседи ссылаются — гарда нет).

## File List

- 32 guard test-файла `src/**/*presentation-source-contracts*` (3 волны)
- `e2e/fixtures/story-174-3/execution-manifest.json` (реген раннером, 3 hash-обновления)
- `CLAUDE.md` (флор 19559→19570, тем же PR)
- `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md` (§20 APPEND)
- `_bmad-output/implementation-artifacts/debt-p3-route-guards-exact-array.md` (этот артефакт)

## Change Log

| Date | Change |
|---|---|
| 2026-09-09 | Создан; 3 волны + фиксы прохода-1 + реген манифеста; 2×APPROVE; флор ↑19570; нарратив-коррекция по проходу-2 внесена |

**Lessons:** (1) пересечение с манифестом 174.3 — для КАЖДОГО трогаемого тест-файла item'а, не только файлов прошлых item'ов; гейт поймал, но дешевле префлайт (2) полный vitest СОЛО — единственный честный флор-замер: batch-прогоны волн и ревью пропустили contract-фейл (3) «реген изменил 1 пин» — проверяй set-diff'ом: реально 3; аттестационные числа сверяй скриптом, не памятью
