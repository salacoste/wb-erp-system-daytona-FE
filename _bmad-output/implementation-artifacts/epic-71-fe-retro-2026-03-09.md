# Retrospective - Epic 71-FE: Search Analytics & Jam Gating

**Date**: March 9, 2026
**Facilitator**: Bob (Scrum Master)
**Participants**: Alice (Product Owner), Amelia (Senior Dev), Charlie (QA), Winston (Architect), R2d2 (Project Lead)
**Scope**: Epic 71-FE
**Mode**: YOLO (auto-completed after initialization)

---

## 1. Epic Metrics

| Metric | Value |
|--------|-------|
| **Stories** | 8/8 done (100%) |
| **Story Points** | 21 SP |
| **Total Tests** | 94 (91 unit/integration + 3 E2E) |
| **New Files** | 19 |
| **Modified Files** | 12 |
| **Production Code** | ~1800 lines |
| **Production Incidents** | 0 |
| **Code Review Pass Rate** | 100% (all findings auto-fixed) |
| **WCAG 2.1 AA** | Full compliance |

### Story Breakdown

| Story | Title | Code Review Findings |
|-------|-------|---------------------|
| 71.1 | Fix Jam tier naming + search foundation types | Standard review |
| 71.2 | Search analytics API client + hooks | Standard review |
| 71.3 | RequireJam gating component | Standard review |
| 71.4 | Search page scaffold + route registration | Standard review |
| 71.5 | Search orders tab | 3 MEDIUM, auto-fixed |
| 71.6 | By-product keyword explorer tab | 3 MEDIUM, auto-fixed |
| 71.7 | By-query product ranking tab | 5+5 issues across 2 rounds |
| 71.8 | Search analytics tests + polish | 5 issues, auto-fixed |

---

## 2. What Went Well

### 2.1 Perfect Story Sequencing
Dependency-ordered execution: Types (71.1) → API/Hooks (71.2) → Gating (71.3) → Scaffold (71.4) → Data Views (71.5-71.7) → Polish (71.8). Zero blocked stories — each built naturally on the previous.

### 2.2 Test Infrastructure Investment
Story 71.2 established test utilities (`createQueryWrapper`, `createTestQueryClient`, API mocks) that were reused in every subsequent story. This investment compounded across Epics 72 and 73.

### 2.3 Dedicated Polish Story (71.8)
Caught SortButton duplication (3 copies across 71.5-71.7), extracted shared component saving ~65 lines, added E2E coverage, and improved accessibility. This pattern proved its value.

### 2.4 RequireJam Gating (71.3)
Clean implementation: blur overlay, tier comparison, proper ARIA (`role="region"`, aria-label). Shipped in one story with no follow-up fixes needed.

### 2.5 WCAG 2.1 AA Compliance
Full accessibility across all components: keyboard navigation, focus indicators, ARIA labels, semantic color usage, no color-only dependence.

---

## 3. What Didn't Go Well

### 3.1 Backend totalRevenue=0 Limitation
Backend hardcodes revenue to 0 in search sync processor for by-product/by-query views. Documented but never formally escalated. Users see empty revenue columns.

### 3.2 Debounce Pattern Duplication
Same `useRef<NodeJS.Timeout>` + `setTimeout` pattern duplicated in ProductCombobox and SearchByQueryTab. Should have been a shared `useDebounce` hook from the start.

### 3.3 Type Conversion Gotcha
`nmId` is string in ProductListItem but number in `useSearchByProduct`. Caught manually, but TypeScript strictness didn't prevent it since both are valid types from different API contracts.

### 3.4 Story 71.7 Required Two Review Rounds
Most complex story (text search + debounce + position badges + 7-column table) — 10 total findings across 2 rounds. Indicates complexity threshold where single-pass reviews may be insufficient.

### 3.5 File Size Pressure Emerging
RequireJam.test.tsx hit 253 lines. The 200-line ESLint limit was manageable in Epic 71 but became a real constraint in later epics.

---

## 4. Technical Challenges & Resolutions

| Challenge | Resolution | Impact |
|-----------|-----------|--------|
| SortButton duplication (3 copies) | Extracted shared component in 71.8 | -65 lines, consistent behavior |
| nmId string→number conversion | `Number(nmId)` in onChange handler | Documented pattern |
| Debounce without library | `useRef` + `setTimeout` pattern | Tested with fake timers |
| Position badge color logic | Inline Tailwind helper function | Simple, maintainable |
| 200-line file limit | Careful organization, local formatters | All source files <150 lines |

---

## 5. Action Items

| ID | Priority | Action | Owner | Status (Post-Epic 73) |
|----|----------|--------|-------|-----------------------|
| AI-1 | HIGH | Extract shared `useDebounce` hook | Amelia (Dev) | Addressed organically by Epic 73 pattern maturity |
| AI-2 | HIGH | Establish "polish story" pattern for every epic | Bob (SM) | Partially — 71.8 had it, Epics 72-73 did NOT |
| AI-3 | MEDIUM | Backend request for search revenue enrichment | Alice (PO) | Still open — backend hardcode remains |
| AI-4 | LOW | Add `aria-sort` to SortButton | Charlie (QA) | Folded into 73-FE retro AI-1 (code review checklist) |

---

## 6. Key Takeaways

1. **Story sequencing eliminates blockers** — dependency-ordered execution (types→hooks→components→polish) is the gold standard
2. **Dedicated polish stories pay for themselves** — extraction, E2E, a11y improvements found naturally
3. **Test infrastructure investment compounds** — 71.2's utilities powered all 3 epics
4. **Backend limitations need formal escalation** — documentation alone doesn't drive resolution

---

## 7. Cross-Epic Impact

Epic 71-FE established patterns that held through Epics 72 and 73:
- Search analytics types and hooks used without modification in later epics
- Test utilities (`createQueryWrapper`, `createTestQueryClient`) became standard infrastructure
- SortButton shared component reused across multiple tables
- RequireJam gating pattern referenced for similar conditional UI

This retrospective is the second for the frontend project. The first comprehensive retro was Epic 73-FE (2026-03-09), which covered cross-epic learnings from all three epics.
