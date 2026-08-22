# Story 169.7-FE — Migrate FBS Stock Analytics to shadcn Design Tokens

- Route: `/analytics/fbs-stock`
- Worktree: `/private/tmp/wb-repricer-fe-169-7-fbs-stock-shadcn` (base `9bc7423d` = origin/main)
- Status: implemented, NOT committed (worktree left dirty per protocol)
- Precedents: 169.6 (`169-6-fe-migrate-enhanced-fbs-analytics.md`), 169.5 (TableCaption + tabular-nums)

## Changes (пофайлово)

| File | Change |
|------|--------|
| `components/FbsStockPageContent.tsx:32` | h1 `text-3xl … text-gray-900` → `text-2xl font-bold tracking-tight` (gray-900 removed; wave idiom). Tab machine untouched. |
| `components/FbsStockGroupsSection.tsx` | cached-data banner → `border-status-warning/30 bg-status-warning/15 text-status-warning`; `TableCaption` import + `<TableCaption>Остатки FBS по товарным группам</TableCaption>` first child of `<Table>`; 5 numeric cells (SKU, Остатки, Стоимость, Расход/день, Дней покрытия) → `text-right text-sm tabular-nums`. «Группа» cell untouched. |
| `components/FbsStockSizesSection.tsx` | same banner swap; validation-hint `text-amber-700` → `text-status-warning`; `TableCaption>Остатки FBS по размерам`; 4 numeric cells (SKU, Остатки, Расход/день, Дней покрытия) +tabular-nums. nmId column stays `font-mono` WITHOUT tabular-nums (ID=mono idiom, 169.5). |
| `components/FbsStockRegionsSection.tsx` | cached-data banner swap; stale-chip (Clock) `border-amber-200 bg-amber-50 text-amber-700` → `border-status-warning/30 bg-status-warning/15 text-status-warning` (Clock inherits text = matched pair); `TableCaption>Остатки FBS по регионам`; 4 numeric cells (Складов, Остатки, Стоимость, Доля от всех (%)) +tabular-nums; null-share span `text-gray-400` → `text-muted-foreground` (dash char itself untouched, AP#8). |
| `components/FbsExportButton.tsx` | untouched (pre-verified token-clean). |
| `page.tsx` | untouched. |
| `__tests__/FbsStockGroupsSection.test.tsx` | +3 tests: banner exact-pin ×3 classes; caption phrase + `tagName === 'CAPTION'`; SKU cell tabular-nums + `td.tabular-nums` count = 5. + NEW fs-based no-hex guard describe-block (mechanism copied verbatim from 169-6: scan `componentsDir` + `routeDir/page.tsx`, regex `#[0-9A-Fa-f]{3,8}\b`, `//`/`*` comment lines exempt). |
| `__tests__/FbsStockSizesSection.test.tsx` | +4 tests: banner pin; caption; tabular-nums count = 4 + nmId mono-without-tabular negative pin; validation-hint pin via `fireEvent.change('12.5abc')` → `classList.contains('text-status-warning')`. |
| `__tests__/FbsStockRegionsSection.test.tsx` | +5 tests: banner pin (generatedAt = pinned clock → fresh, isolates banner from stale chip); stale-chip pin (generatedAt 25h in past vs pinned `2026-05-08T12:00:00Z` → chip visible, exact ×3 classes); caption; «Складов» tabular + count = 4; null shareOfTotalPct → span `text-muted-foreground` + text `'—'`. |

### Caption semantic decision (orchestrator, зафиксировано)
Captions are STATIC identity phrases without period («Остатки FBS по …»). Groups/Sizes period is picker-driven (caption would go stale), Regions is latest-snapshot semantics (no period at all).

## Validation (fresh output)

1. `npx vitest run "src/app/(dashboard)/analytics/fbs-stock"` → **4 files, 39 passed / 0 failed** (baseline 26; +13 net new: 12 pins + 1 no-hex guard)
2. `npm run lint` → exit 0 (0 errors / 0 warnings)
3. `npm run type-check` → exit 0
4. `npm run check:max-lines` → OK (source 200 / test 800 caps)
5. `npx prettier --check` on all 7 changed files → clean after `--write` on 3 files + vitest re-run 39/39
6. Owned grep `it(`: Groups 10, Export 11, Regions 10, Sizes 9 = **40 lines** (39 actual tests; 1 line is a false-positive — `FbsStockGroupsSection.test.tsx:221` no-hex-guard's `split('\n')` contains the `it(` substring; all 11 Export `it(` are real) — filter = `src/app/(dashboard)/analytics/fbs-stock` only. [attribution corrected per review pass-2]

## Gaps (честно)
- None blocking. `fireEvent` used instead of userEvent for the hint pin — matches existing suite (no userEvent anywhere in this route).
- Plan's AC mentions "expanded group" state + AX "group expansion exposes state", but the route has NO expansion mechanics in current code (0 hits aria-expanded/chevron/collapse — pre-existing plan↔code divergence, out of migration scope; behavior-lock preserved). [recorded per review pass-2]
- The no-hex guard lives in Groups test file only (single instance per route, same as 169.6 pattern).

## Behavior-lock confirmation
Untouched: tab machine + hook-only-when-active, all 4 state-machine branches, nmId regex validation, `getStaleHours` (incl. future-null), `formatStaleHours` RTF, `STALE_THRESHOLD_HOURS=24`, generatedAt string, null → '—' everywhere, formatters, all data-testid/aria-label/texts, `getDefaultRange`/`formatApi`, export button delegation.

## Carry-outs
- None.
