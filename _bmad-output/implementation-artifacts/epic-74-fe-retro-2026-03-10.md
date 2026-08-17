# Epic 74-FE Retrospective: File Size Compliance & Code Splitting

**Date**: 2026-03-10
**Status**: Complete
**Facilitator**: Bob (Scrum Master)
**Participants**: Alice (PO), Charlie (Dev Lead), Dana (QA Lead), Elena (Junior Dev), R2d2 (Project Lead)

---

## Epic Summary

| Metric | Value |
|--------|-------|
| **Stories** | 9 (74.1 through 74.9) |
| **Story Points** | 34 SP |
| **Completion** | 9/9 (100%) |
| **Files Refactored** | 131 |
| **Extracted Files Created** | ~110 |
| **Final Source Files >200 Lines** | 0 |
| **Test Suites** | 373 passing (6,872 assertions) |
| **ESLint Violations** | 0 |
| **TypeScript Errors** | 0 |
| **Production Build** | Successful |
| **Functional Regressions** | 0 |
| **Production Incidents** | 0 |

---

## Previous Retro Follow-Through (Epic 73-FE)

| Action Item | Status | Notes |
|-------------|--------|-------|
| Create shared code review checklist (WCAG, timezone, useMemo) | ❌ Not created | `'use client'` emerged as new recurring issue — same root cause (missing automation) |
| Document atomic write pattern for ESLint | ✅ Completed | Barrel re-export pattern implicitly solves this |
| E2E coverage for marketing analytics | ❌ Not addressed | Out of scope for refactoring epic |
| Resolve Layer 2 placeholder | ❌ Not addressed | Out of scope for refactoring epic |
| Document named frontend patterns | ✅ Completed | 9 extraction patterns documented in epic file (74.9) |

**Follow-through rate**: 2/5 (40%) — 3 missed items were out of scope for a pure refactoring epic.

---

## What Went Well

1. **Zero functional regressions** — 131 files refactored, ~110 new files created, not a single broken feature across the entire epic
2. **Descending-tier strategy** — Starting with mega files (500+ lines) in 74.1 gave the team reusable patterns that applied cleanly to progressively smaller files
3. **Barrel re-export pattern** — Preserved all consumer import paths perfectly; api-client.ts alone had 86 consumers, all unaffected
4. **Code reviews caught real bugs every time** — Never a "looks good" rubber stamp; found `'use client'` omissions, UTC timezone bugs, duplicate files, agent regressions
5. **Parallel agent strategy (74.8)** — 7 agents split 69 files by domain, delivering massive throughput for the largest story
6. **9 extraction patterns documented** — Future developers have a complete playbook with naming conventions, counts, and examples
7. **Quality gates held throughout** — Every story passed type-check, lint, tests, and production build before marking done

---

## What Didn't Go Well

1. **`'use client'` directive was the #1 recurring issue** — Found in 74.3 (wrong direction: added to pure files), 74.4 (9 missing), and 74.8 (4 more missing). Same class of bug in 3/9 stories.
2. **10 boundary files at exactly 200 lines** — Zero headroom for future edits. The 150-180 target was stated but not enforced.
3. **Parallel agents introduced regressions** (74.8) — `console.log` changed to `console.info`, unicode minus `−` changed to hyphen `-`. Agents don't reliably respect "don't change functionality."
4. **34 SP spent on pure structural work** — No user-visible value. This debt accumulated because the 200-line rule wasn't enforced earlier.
5. **27 files in the 195-199 line range** — High risk for next modifications; one added import forces extraction.
6. **No automated `'use client'` detection** — ESLint could enforce "files with React hooks must have 'use client'" but this wasn't implemented.
7. **Story sizing was uneven** — 74.8 was "3 SP" but touched 69 files with 123 extractions; 74.1 was "5 SP" with 7 files. SP didn't reflect actual effort.
8. **Epic 73 action item follow-through: 2/5** — Recurring review findings persist across epics when not automated.

---

## Key Insights

1. **Recurring code review findings = missing automation** — The root cause persists across epics (WCAG/timezone/useMemo in 73, `'use client'` in 74). Human vigilance doesn't scale; ESLint rules do.
2. **Headroom target of 150-180 was stated but not enforced** — 37 files sit dangerously close to the 200-line limit, creating ongoing maintenance risk.
3. **Technical debt accumulates silently** — The 200-line rule existed but wasn't enforced. 131 files exceeded it before anyone noticed. Enforcement mechanisms (ESLint) matter more than stated rules.
4. **Parallel agents are a force multiplier with caveats** — 7 agents in 74.8 delivered massive throughput but required post-validation for regressions. The trade-off is worth it with proper guardrails.

---

## Extraction Patterns Catalog (from 74.9)

| # | Pattern | Naming Convention | Count | Example |
|---|---------|-------------------|-------|---------|
| 1 | Hook helper extraction | `useX-utils.ts` | 23 | `useLiquidity-utils.ts` |
| 2 | Config/constants extraction | `*-config.ts`, `*-constants.ts` | 15 | `cogs-missing-state-config.ts` |
| 3 | Sub-component extraction | `ComponentParts.tsx` | 18 | `TaxCardBadges.tsx` |
| 4 | API endpoint splitting | `domain-subgroup.ts` | 12 | `orders-history-api.ts` |
| 5 | Type extraction | `*-types.ts` | 8 | `tariff-system-types.ts` |
| 6 | Page state hooks | `use*PageState.ts` | 10 | `useOrdersPageState.ts` |
| 7 | Barrel facade | Re-export from original | 6 | `telegram-metrics.ts` |
| 8 | Form field extraction | `*Fields.tsx`, `*Section.tsx` | 12 | `ScheduleVersionFormFields.tsx` |
| 9 | Helper function extraction | `*-helpers.ts` | 10 | `margin-polling-helpers.ts` |

---

## Action Items

### Process Improvements

| # | Action | Owner | Priority | Success Criteria |
|---|--------|-------|----------|-----------------|
| 1 | Create ESLint rule to enforce `'use client'` on files importing React hooks | Charlie (Dev Lead) | HIGH | ESLint catches missing `'use client'` automatically |
| 2 | Add max-lines warning threshold at 180 lines (alongside 200-line error) | Dana (QA Lead) | MEDIUM | `npm run lint` warns on files 180-199 lines |
| 3 | Document parallel agent guard rails (diff-check for logging, unicode, comments) | Charlie (Dev Lead) | MEDIUM | Checklist in CLAUDE.md or project docs |

### Technical Debt

| # | Item | Priority | Impact |
|---|------|----------|--------|
| 1 | 10 files at exactly 200 lines — need extraction headroom on next touch | LOW | Future story blockers if untreated |
| 2 | 27 files in 195-199 range — same risk | LOW | Track as ongoing maintenance |
| 3 | 3 pre-existing orphan files from earlier epics | LOW | No current impact |

### Team Agreements

1. All new/extracted files MUST target 150-180 lines max (not 200)
2. `'use client'` verification is part of every code review checklist
3. Parallel agent output ALWAYS gets a manual diff-check before commit
4. Story point estimation should factor file count, not just conceptual complexity

---

## Readiness Assessment

| Area | Status |
|------|--------|
| Testing & Quality | ✅ 373 suites, 6,872 assertions, 0 failures |
| ESLint | ✅ 0 warnings, 0 errors |
| TypeScript | ✅ `tsc --noEmit` clean |
| Production Build | ✅ `npm run build` successful |
| File Size Compliance | ✅ 0 source files >200 lines |
| Deployment | ✅ Production-ready on main branch |
| Stakeholder Impact | ✅ Zero user-facing changes |

**Assessment**: Epic 74-FE is fully complete with all quality gates passing. No critical items outstanding.

---

## Next Epic

No Epic 75 is formally defined. The EPICS-AND-STORIES-TRACKER indicates "Q1 2026 Development Complete — All planned epics delivered on schedule." An informal backlog exists (Request #160: Search Analytics Frontend, ~13 SP) but is not yet formalized.

---

## Critical Rules Established

1. NEVER change functionality during structural refactoring
2. Keep `'use client'` on component files using React hooks/state
3. Pure data/config/type files do NOT need `'use client'`
4. Don't duplicate types — import from source files
5. Run tests after EACH file split — don't batch validation
6. File size limit is 200 lines (ESLint enforced, no exceptions)
7. Extracted files must also be ≤200 lines
8. Barrel re-exports preserve consumer API (mandatory for ≥3 consumers)
9. DRY: Don't create near-identical components — use parameterized shared components

---

## Cumulative Retrospective Stats (Epics 71-74)

| Metric | Epic 71 | Epic 72 | Epic 73 | Epic 74 | Total |
|--------|---------|---------|---------|---------|-------|
| Stories | 8 | 6 | 9 | 9 | 32 |
| Story Points | 21 | 10 | 26 | 34 | 91 |
| Production Incidents | 0 | 0 | 0 | 0 | 0 |
| Code Review Pass Rate | 100% | 100% | 100% | 100% | 100% |
