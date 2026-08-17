# Retrospective - Epic 72-FE: Marketing Analytics Data Alignment

**Date**: March 9, 2026
**Facilitator**: Bob (Scrum Master)
**Participants**: Alice (Product Owner), Amelia (Senior Dev), Charlie (QA), Winston (Architect), R2d2 (Project Lead)
**Scope**: Epic 72-FE
**Mode**: YOLO (auto-completed)

---

## 1. Epic Metrics

| Metric | Value |
|--------|-------|
| **Stories** | 6/6 done (100%) |
| **Story Points** | 10 SP (1+1+3+2+2+1) |
| **New Files** | 9 |
| **Modified Files** | 17 |
| **Code Review Cycles** | 8 (72.5 required 2 rounds) |
| **Production Incidents** | 0 |
| **Test Pass Rate** | 99.9% (6600+ passed, 5-9 pre-existing failures) |
| **Regressions** | 0 |

### Story Breakdown

| Story | Title | SP | Code Review |
|-------|-------|----|-------------|
| 72.1 | Funnel & buyout type alignment | 1 | 3 MEDIUM + 1 LOW |
| 72.2 | Advertising type & param fixes | 1 | 3 findings |
| 72.3 | Advertising daily trend charts | 3 | 3 findings (DRY fix) |
| 72.4 | Advertising profit multiplication warning | 2 | 4 findings (pluralization, docs) |
| 72.5 | Buyout table refactor & enrichment fix | 2 | 2 rounds, ~8 findings total |
| 72.6 | Buyout hook migration | 1 | 3 findings |

---

## 2. What Went Well

### 2.1 Symlink Discovery (72.5/72.6)
Finding that `src/hooks` symlinks to `src/hooks-v1` was transformative. Eliminated physical file migration, simplified 72.6 to import cleanup + testing, enabled shared hook creation at canonical path.

### 2.2 Shared Hook Extraction
`useAllProductsMap()` in 72.5 solved the 200-product enrichment cap with cursor-based pagination. Reusable pattern — MAX_ENRICHMENT_PAGES=50 safety limit included. Available for ReturnsTable and future enrichment needs.

### 2.3 BuyoutTable Refactoring
Model refactoring: 216→110 lines. Column extraction to `buyout-table-columns.tsx`, functional fix (enrichment cap removal), and file size compliance all in one 2SP story.

### 2.4 DailyTrendChart (72.3)
Flagship 3SP delivery: dual Y-axis, 4 metric toggles (spend/views/clicks/orders), Russian date formatting, session persistence. Three files (chart, config, tooltip) all under 200 lines. Established recharts pattern reused in Epics 73.8-73.9.

### 2.5 Code Review Effectiveness
8 review cycles caught ~15 significant issues including DRY violations (duplicated formatCompactRub), broken pluralization logic, field name mismatches (nmId vs sku_id), and missing safety limits.

---

## 3. What Didn't Go Well

### 3.1 Pre-existing Over-Limit Files Growing
`advertising-analytics.ts` grew from 538→591 lines across 3 stories. Each story added 10-25 lines with no accountability for splitting because it was already over the limit. Same pattern with PerformanceMetricsTable (~700 lines).

### 3.2 Documentation-to-Implementation Mismatches
- Story 72.4 docs claimed `nmId` matching; implementation used `Number(item.sku_id)`
- Story 72.3 had line count prediction inaccuracies
- Code reviews caught these, but they waste review cycles

### 3.3 Story 72.5 Required Two Review Rounds
First round missed cursor pagination safety limit and `'use client'` directive on shared hook. Indicates complexity threshold where pre-review self-check would help.

### 3.4 ESLint Symlink Resolution Issue
`npx eslint` fails on all 47 test files in `hooks-v1/__tests__/`. Pre-existing, not blocking (`npm run lint` works), but confusing and friction-adding.

### 3.5 No New Tests for Type-Only Stories
Stories 72.1-72.2 (type additions) and 72.3-72.4 (new components) added zero new unit tests. Backward-compatible changes, but no regression guard for the new types and components.

---

## 4. Technical Challenges & Resolutions

| Challenge | Resolution | Impact |
|-----------|-----------|--------|
| 200-product enrichment cap | Cursor-based pagination in `useAllProductsMap()` | Unlimited catalog support |
| BuyoutTable over 200 lines | Column extraction to separate file | 216→110 lines |
| Dual Y-axis scale differences | Recharts YAxis with independent domains | Clean visualization |
| sku_id string→number matching | `Number(item.sku_id)` conversion | Type-safe warning badge matching |
| Symlink discovery | Use canonical `hooks-v1/` path | Eliminated migration complexity |

---

## 5. Action Items

| ID | Priority | Action | Owner | Status (Post-Epic 73) |
|----|----------|--------|-------|-----------------------|
| AI-1 | HIGH | Split `advertising-analytics.ts` (591+ lines) into domain-specific type files | Amelia (Dev) | Open — still growing |
| AI-2 | HIGH | Verify type definitions before writing story implementation steps | Bob (SM) | Partially addressed in Epic 73 reviews |
| AI-3 | MEDIUM | Migrate ReturnsTable to `useAllProductsMap()` (remove 200-cap) | Amelia (Dev) | Open — backlog item |
| AI-4 | MEDIUM | Add unit tests for DailyTrendChart and MultiCampaignWarning components | Charlie (QA) | Partially — 73-FE retro AI-3 covers E2E |
| AI-5 | LOW | Investigate ESLint symlink resolution for `hooks-v1/__tests__/` | Winston (Architect) | Open — pre-existing |

---

## 6. Key Takeaways

1. **Structural discovery before type stories** — symlink finding (72.5) before types-only stories (72.1-72.2) would have streamlined workflow
2. **Growing over-limit files need proactive splitting** — 591-line type file is tech debt compounding each story
3. **Code review catches doc-implementation mismatches** — but verify actual types BEFORE writing implementation steps
4. **Shared hook extraction pattern validated** — `useAllProductsMap()` proves reusable enrichment for any catalog size
5. **BuyoutTable refactoring is the model** — 216→110 lines, extracted columns, functional fix, all in one 2SP story
6. **Recharts patterns compound** — DailyTrendChart (72.3) established dual Y-axis pattern reused in 73.8 and 73.9

---

## 7. Cross-Epic Impact

Epic 72-FE established patterns used in Epic 73:
- `DailyTrendChart` recharts pattern → reused in 73.8 (chart overlay) and 73.9 (bar chart)
- `useAllProductsMap()` shared hook → available for future enrichment scenarios
- `formatCompactRub` DRY fix → reused and further refined in 73.9
- Code review pattern of catching DRY violations → continued effectively in Epic 73

### Previous Retro (Epic 71-FE) Follow-Through

| 71-FE Action Item | Status in 72-FE |
|-------------------|-----------------|
| Extract shared `useDebounce` hook | ❌ Not addressed (no debounce needs in 72) |
| Establish polish story pattern | ❌ No dedicated polish story in 72-FE |
| Backend request for search revenue | ❌ Not addressed (different domain) |
| Add `aria-sort` to SortButton | ❌ Not addressed (no sort tables added) |

Note: 71-FE action items were domain-specific to search analytics. Epic 72-FE worked in the marketing analytics domain, so limited overlap was expected.

---

This retrospective is the third for the frontend project. Prior retros: Epic 71-FE (2026-03-09), Epic 73-FE (2026-03-09, cross-epic).
