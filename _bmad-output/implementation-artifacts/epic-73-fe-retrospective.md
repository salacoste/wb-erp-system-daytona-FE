# Retrospective - Epic 73-FE: Marketing Analytics Enhancements
## Including Learnings from Epics 71-FE & 72-FE

**Date**: March 9, 2026
**Facilitator**: Bob (Scrum Master)
**Participants**: Alice (Frontend Dev), Charlie (QA), Dana (Architect), Elena (Tech Lead), R2d2 (Project Lead)
**Scope**: Epic 73-FE (primary), with cross-epic learnings from Epics 71-FE and 72-FE

---

## 1. Sprint Metrics

| Metric | Epic 71-FE | Epic 72-FE | Epic 73-FE | Total |
|--------|-----------|-----------|-----------|-------|
| **Story Points** | 21 SP | 10 SP | 26 SP | 57 SP |
| **Stories** | 8 | 6 | 9 | 23 |
| **Status** | Done | Done | Done | All Done |
| **Production Incidents** | 0 | 0 | 0 | 0 |
| **Code Review Pass Rate** | 100% | 100% | 100% | 100% |

### Epic 73-FE Breakdown

| Story | Title | SP | Tests |
|-------|-------|----|-------|
| 73.1 | Funnel table column refactor + brandname | 2 | Config + component tests |
| 73.2 | Funnel summary cards expansion | 3 | Card + formatter tests |
| 73.3 | Funnel WoW period comparison | 3 | Dual-fetch comparison tests |
| 73.4 | Funnel product filter combobox | 3 | Combobox + search tests |
| 73.5 | Advertising sync data gaps visualization | 3 | Gap detection + chart tests |
| 73.6 | Advertising negative organic sales handling | 2 | Edge case + guard tests |
| 73.7 | Search-advertising cross-reference | 3 | Cross-reference + mapping tests |
| 73.8 | Funnel-advertising chart overlay | 4 | Recharts + dual Y-axis tests |
| 73.9 | Three-layer ad cost discrepancy view | 3 | 42 tests (config/card/chart/section) |

---

## 2. What Went Well

### 2.1 Pattern Maturity — 3-File Extraction Pattern
Stories 73.1, 73.2, 73.3 all followed the same rhythm: extract config/types → build component → wire into page. By the third story, scaffolding was near-automatic. This pattern originated in Epic 72 and reached full maturity in Epic 73.

### 2.2 Dual-Fetch Comparison Pattern
Stories 73.3 (WoW period), 73.7 (search↔advertising cross-ref), and 73.9 (three-layer discrepancy) all needed two independent data sources compared side-by-side. Each used: separate hooks → combined loading states → graceful null handling. The `AdCostDiscrepancySection` wrapper in 73.9 was the most refined version.

### 2.3 Test Culture
- Epic 71 established the testing standard (71.8 dedicated to tests/polish)
- By Epic 73, stories shipped with comprehensive tests without being asked
- Story 73.9: 42 tests across 4 files, 231 total advertising tests
- Zero test failures across all three epics

### 2.4 Code Review Consistency
All three epics had adversarial reviews catching real issues:
- WCAG accessibility gaps (cross-epic recurring)
- Timezone-safe date parsing (Epic 71 → 72 → 73)
- `useMemo` dependency precision (Epic 72 → 73)
- `formatCompactRub` locale bug caught in 73.9 review
- 73.9 review: 6 findings (3 MEDIUM, 3 LOW), all auto-fixed

### 2.5 Recharts Pattern Reuse
Dual Y-axis pattern from 73.8 directly reused in 73.9's bar chart. Color conventions (purple=#7C3AED for advertising, blue=#3B82F6 for finance) established and consistent.

### 2.6 Zero Production Incidents
23 stories across 3 epics, 57 story points — no regressions, no hotfixes.

---

## 3. What Didn't Go Well

### 3.1 200-Line ESLint Limit Pressure
- `FunnelSummaryCards` (73.2) hit exactly 200 lines — one more breaks it
- `advertising/page.tsx` was already over limit (grandfathered)
- Forced wrapper components (like `AdCostDiscrepancySection`) for lint compliance rather than architectural need
- Creates cognitive overhead deciding "real component split" vs "lint compliance split"

### 3.2 ESLint Atomic Write Trap
- Import without usage = lint hook blocks commit
- Must write import AND usage in single atomic Edit/Write
- Known since Epic 71, but only documented in 73.8 story notes
- New devs will hit this repeatedly without upfront documentation

### 3.3 Recurring Code Review Findings
Same three issues found in every epic:
1. WCAG accessibility gaps (missing aria-labels, contrast)
2. Timezone-unsafe `new Date()` on date-only strings
3. `useMemo` dependencies using parent objects instead of extracted sub-properties

These are caught in review but not prevented at source.

### 3.4 No E2E Coverage for Epics 72-73
- Epic 71 got dedicated E2E in story 71.8
- Epics 72-73: zero Playwright coverage (14 stories)
- Recharts rendering, dual-fetch interactions, finance hook integration untested in browser

### 3.5 Layer 2 Placeholder Tech Debt
- Story 73.9 shipped "Скорректированная стоимость (скоро)" placeholder
- Three-column layout with middle column showing "Coming Soon"
- No backend story exists to resolve this

---

## 4. Cross-Epic Learnings (71 → 72 → 73)

### Velocity Improvement
- Epic 71: 8 stories / 21 SP — establishing patterns, E2E, search analytics foundation
- Epic 72: 6 stories / 10 SP — data alignment, quick fixes building on 71's patterns
- Epic 73: 9 stories / 26 SP — largest epic, most complex features, delivered smoothly

### Pattern Evolution
| Pattern | First Appeared | Matured |
|---------|---------------|---------|
| 3-File Extraction | Epic 72 (72.1) | Epic 73 (73.1-73.3) |
| Dual-Fetch Comparison | Epic 73 (73.3) | Epic 73 (73.9) |
| Recharts Dual Y-Axis | Epic 73 (73.8) | Epic 73 (73.9) |
| Wrapper Component | Epic 72 (72.3) | Epic 73 (73.9) |
| Russian Locale Formatting | Epic 71 (71.1) | Consistent throughout |

### Code Review Trend
- Epic 71: Establishing baseline, finding categories of issues
- Epic 72: Same categories recurring, faster fixes
- Epic 73: Categories well-known, auto-fix workflow mature, but still not prevented

---

## 5. Action Items

| ID | Priority | Action | Owner | Deliverable |
|----|----------|--------|-------|-------------|
| AI-1 | HIGH | Create shared code review checklist for recurring findings (WCAG, timezone, useMemo) | Elena (Tech Lead) | `docs/code-review-checklist.md` |
| AI-2 | HIGH | Document atomic write pattern for ESLint lint-staged hook | Alice (Frontend Dev) | Addition to project conventions |
| AI-3 | MEDIUM | E2E coverage for marketing analytics pages (funnel, advertising, search) | Charlie (QA) | E2E test stories for next sprint |
| AI-4 | LOW | Resolve Layer 2 placeholder — backend story or column removal | Product | Backend story or UI cleanup |
| AI-5 | LOW | Document named frontend patterns with examples | Dana (Architect) | `docs/frontend-patterns.md` |

---

## 6. Retrospective Meta

- **First frontend retrospective** — no prior retro files existed for Epics 71-72
- Incorporated learnings from all 23 stories across 3 epics for comprehensive cross-epic analysis
- Backend grand retrospective exists at `../_bmad-output/implementation-artifacts/grand-retrospective-2026-03-07.md`
- No Epic 74-FE defined — action items are backlog candidates for future sprint planning
