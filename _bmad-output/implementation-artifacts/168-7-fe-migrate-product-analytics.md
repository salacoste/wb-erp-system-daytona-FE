# Story 168.7 — Migrate Product Analytics /analytics/product/[nmId]

- **Status:** done — (was: "review (awaiting orchestrator commit/PR)"; synced by Story 174.5 on 2026-09-02; authoritative delivery/gate evidence: sprint-status.yaml row with PR/merge/review/vitest)
- **Branch / worktree:** cdx/epic-168-story-7-product-detail @ /private/tmp/wb-fe-168-7-migrate-product-analytics
- **Base SHA:** 74896f21
- **Acceptance criterion:** Given the OrganicTab iROAS card and per-day correlation table when migrated to semantic tokens then all 4 interpretation tiers keep distinct visual intensity (no tier-collapse), the 3 confidence branches map to data-quality semantics, and rendering logic/algorithms are untouched.

## Behavior-Lock Inventory (pre-flight)

- Targeted baseline: `npx vitest run "src/app/(dashboard)/analytics/product"` → **31 passed / 0 failed** (5 test files + OrganicTab had NO test file) — verified in worktree before any edit.
- Locked behavior: iroasLabel 4-tier map text labels (Russian strings unchanged), null-interp → `text-muted-foreground` fallback (untouched), confidence low-branch → `text-muted-foreground` (untouched), table structure/selectors, ProductOrganicChart delegation, empty-state card.
- All 6 legacy sites were in the single file `components/OrganicTab.tsx` (iroasLabel map ×4 + confidence ternary ×2). No legacy classes elsewhere in the owned surface (legacy-clean components untouched).

## Changes

| File | Site | Old | New |
|------|------|-----|-----|
| `components/OrganicTab.tsx:28` | iroasLabel `highly_effective` | `text-green-600` | `text-financial-positive` |
| `components/OrganicTab.tsx:29` | iroasLabel `effective` | `text-green-500` | `text-financial-positive/80` (tier-collapse guard #18: 600-vs-500 intensity preserved via /80 idiom) |
| `components/OrganicTab.tsx:30` | iroasLabel `marginal` | `text-yellow-600` | `text-status-warning` (full — only warning tier here) |
| `components/OrganicTab.tsx:31` | iroasLabel `ineffective` | `text-red-500` | `text-financial-negative` |
| `components/OrganicTab.tsx:148-152` | confidence `high` | `text-green-600` | `text-status-information` (data-quality, not financial; precedent 168.5) |
| `components/OrganicTab.tsx:149-153` | confidence `medium` | `text-yellow-600` | `text-status-warning` |
| `components/__tests__/OrganicTab.test.tsx` | NEW file (OrganicTab had none) | — | 8 it: 4 iroas exact-pins (incl. positive vs positive/80 distinction), 3 confidence exact-pins, widened legacy DOM guard |

## Token mapping table (old → new)

| Legacy | Semantic | Rationale |
|--------|----------|-----------|
| `text-green-600` (iroas highly_effective) | `text-financial-positive` | ad-effectiveness = financial-positive semantics |
| `text-green-500` (iroas effective) | `text-financial-positive/80` | intensity-idiom /80 (precedent: status-warning/80 in 168.3/168.6); prevents 4-tier → 3-tier collapse |
| `text-yellow-600` | `text-status-warning` | full intensity (sole warning tier in both groups) |
| `text-red-500` | `text-financial-negative` | |
| `text-green-600` (confidence high) | `text-status-information` | confidence = data-quality indicator, NOT financial gain — green "positive" misleading; info-blue precedent 168.5 |

## Raw-palette sweep proof

Regex: `(bg|text|border|ring|divide|fill|stroke|outline)-(red|yellow|blue|green|gray|rose|amber|emerald|sky|orange|slate|zinc|neutral|stone|lime|teal|cyan|indigo|violet|purple|fuchsia|pink)(-\d+)?`

`grep -rEn <regex> "src/app/(dashboard)/analytics/product"` excluding `__tests__` → **0 hits in production files**. (Test file intentionally contains the regex string itself for the DOM guard — not usage.)

## External consumers check

`grep -rln "analytics/product/[nmId]/components|from '../OrganicTab|from './OrganicTab" src | grep -v "analytics/product"` → **0 importers outside the route**.

## Gates (worktree, all green)

- Targeted vitest: 31 → **39 passed / 0 failed** (+8 new OrganicTab tests, 0 baseline tests touched)
- `npm run lint` → exit 0 (0 warnings, `--max-warnings 0`)
- `npm run type-check` → exit 0
- `npx prettier --check` on both changed files → pass (after one `--write` on the new test file)
- (full vitest / build / e2e — NOT run, main-session owned)

## Gaps / escalations

- **Review question:** confidence `high → text-status-information` (info-blue instead of green) implemented per pre-flight instruction; flagged for reviewer confirmation — semantically sound (data-quality ≠ financial-positive) but diverges from raw-color hue.
- iroasLabel fallback + confidence low → `text-muted-foreground` untouched per spec.

## Lessons

_(placeholder — filled at review)_

## Change Log

- OrganicTab.tsx: 6 token swaps + 2 decision comments (168.7)
- OrganicTab.test.tsx: NEW, 8 pins/guards with typed fixtures from `@/types/unified-product` (no any)
