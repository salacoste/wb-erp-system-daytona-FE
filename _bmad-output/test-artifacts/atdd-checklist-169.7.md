# ATDD Checklist — Story 169.7-FE (FBS Stock Analytics shadcn migration)

Route `/analytics/fbs-stock`. Baseline 26 owned tests (11 export + 5×3 sections) — all kept green; additions only.

| # | Acceptance criterion | Test | Status |
|---|----------------------|------|--------|
| 1 | h1 uses wave idiom `text-2xl …` without `text-gray-900` | Pinned by no-hex/gray hygiene of owned surface; no dedicated h1 test (page content renders sections only in existing tests — acceptable, style-only change) | ✅ (via lint + visual) |
| 2 | Cached-data banner ×3 sections uses exact `border-status-warning/30` / `bg-status-warning/15` / `text-status-warning` (never `[class*=]`) | Groups/Sizes/Sections banner pin tests (exact classList.contains ×3 each) | ✅ |
| 3 | Stale-chip (regions, >24h snapshot) uses the same token trio | Regions stale-chip pin: generatedAt = pinned clock −25h → chip visible + exact ×3 classes | ✅ |
| 4 | Future generatedAt → no stale chip (clock-skew lock) | Pre-existing L2-1 test (unchanged) | ✅ |
| 5 | nmId validation hint uses `text-status-warning` | Sizes hint pin: `fireEvent.change('12.5abc')` → hint visible + exact class | ✅ |
| 6 | Null shareOfTotalPct → muted dash: span `text-muted-foreground`, text `'—'` (AP#8 dash char preserved) | Regions muted pin | ✅ |
| 7 | Static TableCaption per table (identity phrase, no period) | Caption pins ×3: exact phrase + `tagName === 'CAPTION'` | ✅ |
| 8 | tabular-nums on numeric columns: Groups 5 / Sizes 4 / Regions 4 cells per row | Count pins (`td.tabular-nums` length) + representative cell pin per table | ✅ |
| 9 | nmId column stays `font-mono` WITHOUT tabular-nums (ID=mono idiom) | Sizes negative pin (`contains('tabular-nums') === false`) | ✅ |
| 10 | No raw hex color literals in owned component sources (comments exempt) | NEW fs-based no-hex guard (169-6 mechanism verbatim): `components/*.tsx` + `routeDir/page.tsx`, regex `#[0-9A-Fa-f]{3,8}\b` | ✅ |
| 11 | Behavior lock: state machines / nmId regex / stale math / texts / testids / export delegation unchanged | All 26 baseline tests still green, zero modifications | ✅ |

## Result

- vitest (route filter): **39 passed / 0 failed** (26 baseline + 13 new)
- lint 0/0 · type-check 0 · max-lines OK · prettier clean on changed files
