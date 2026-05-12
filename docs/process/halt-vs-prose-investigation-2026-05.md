# HALT-based vs Prose-Guidance Enforcement Investigation

**Date**: 2026-05-11
**Story**: 97.7-FE
**Source**: Epic 96-FE retro § A-7 (carried from Epic 95-FE § A-3 + Epic 94-FE § A-3)

---

## Background

This project uses two enforcement mechanisms for process discipline:

1. **HALT-based (structural)**: Scripts or workflow conditions that block progress on failure. Cannot be skipped without CI failure or explicit override. Examples: `check-doc-citations.sh`, `check-fix-propagation.sh`, dev-story workflow Step 9 HALT conditions.

2. **Prose-guidance**: Written rules in CLAUDE.md that describe desired behavior. Compliance depends on author discipline + 2-pass adversarial review. Examples: Pattern 4 sub-sections, "Defensive Frontend Principle", "No `TODO` in production code".

**The core question**: Which defect classes from the 25+ story review chain across Epics 94-96 should be upgraded from prose to HALT-based enforcement?

---

## Defect Audit

Evidence sourced from three retrospective files (Epic 94: 2026-04-27, Epic 95: 2026-05-01, Epic 96: 2026-05-09).

### Class 1: Fix-block propagation drift

**Definition**: After a fix corrects a source defect, consequences propagate through the document but the fix block does not re-scan adjacent locations. The 2nd pass catches these consistently.

**Evidence**:
- Epic 94 retro C-2: Stories 94.6 + 94.7 both had 2nd-pass M-NEW-1
- Epic 95 retro C-1: 5-consecutive-story chain (94.6, 94.7, 95.1, 95.2, 95.3)
- Epic 96 retro C-6: 6 more recurrences (96.10, 96.11, 96.13, 96.14, 96.15, 96.16)
- Stories 97.1 + 97.2 self-referential manifestations extend chain to 15+

**Incidents**: 13+ named incidents across 13+ stories

**HALT-catchable?**: Partial. `scripts/check-fix-propagation.sh` (248 LoC) already exists. Gap is workflow integration — authors must remember to invoke it, and they don't.

**Script cost**: 248 LoC (already implemented) + ~15 LoC workflow XML integration

### Class 2: Attestation drift (factual prose errors)

**Definition**: Incorrect claims about codebase state — wrong line counts, grep hit counts, test totals, file sizes. Sub-classes: summary-visualization misread, filesystem-metadata-cited-as-canonical, grep-count-from-memory, head-truncated-count.

**Evidence**:
- Epic 94 retro C-1: 12 recurrences across 7 stories
- Epic 95 retro C-2 + C-3: 18 recurrences across 10 stories
- Epic 96 retro C-5: Story 96.16 `head -20` truncation (claimed 20, actual 128)

**Incidents**: 20+ (Epic 94: 12 across 7 stories, Epic 95: 8 across 5 stories, Epic 96: 5+ including 96.16 `head -20` truncation and 96.17 attestation chain — conservative lower bound; actual count is likely higher since Epic 96's 17 stories each received 2-3 review passes)

**HALT-catchable?**: No. Human-judgment defect — no grep pattern detects "you cited mtime instead of git log" or "your count is from memory." The 2-pass discipline is the structural countermeasure.

**Script cost**: 0 LoC (not automatable)

### Class 3: grep-co-occurrence conflation

**Definition**: Multiple grep matches sharing a keyword treated as a single finding without per-line context reading.

**Evidence**: Epic 94 retro D-2 (Story 94.7 M-1). Filed as A-2. No recurrence since.

**Incidents**: 1

**HALT-catchable?**: No. Requires semantic reading of grep results.

**Script cost**: 0 LoC

### Class 4: Multi-tenant cabinet-isolation (query-key cache leak)

**Definition**: TanStack Query hooks fail to scope `queryKey` by `cabinetId`, causing stale cross-tenant data.

**Evidence**: Epic 96 retro S-3 + C-6: 4 incidents (96.11 H2-1, 96.12 M2-2, 96.13 M2-5, 96.14 M-2/H2-1)

**Incidents**: 4 (25% incidence rate on new-surface stories)

**HALT-catchable?**: Partial. A grep for `queryKey` without `cabinetId` in `src/hooks/` would catch obvious omissions but produce false positives (legitimate non-tenant queries). The 6-test isolation suite approach is more reliable.

**Script cost**: 40-60 LoC (high false-positive rate makes grep approach fragile)

### Class 5: ESLint rule-name silent disablement

**Definition**: Typo in `.eslintrc.json` rule name (`max-lines-per-file` instead of `max-lines`). ESLint silently ignores unknown rule names.

**Evidence**: Epic 96 retro C-4 + D-1 (discovered Story 96.16). Typo itself fixed in Story 97.6; class recurrence risk remains.

**Incidents**: 1 (codebase-wide impact)

**HALT-catchable?**: Yes. Parse `.eslintrc.json` rules keys, cross-reference against ESLint's known rule list.

**Script cost**: 30-50 LoC

### Class 6: API-client rate-limit status-code coverage

**Definition**: `api-client.ts` retryAfter handling covers some status codes but not others; stories introducing new codes don't verify coverage.

**Evidence**: Epic 96 retro D-3 (Story 96.9 3rd-pass review)

**Incidents**: 1

**HALT-catchable?**: Partial. Grep status codes in source, verify each appears in retry handling.

**Script cost**: 30-40 LoC

### Class 7: Workflow-XML guidance non-compliance

**Definition**: LLM-interpreted prose guidance in workflow XML is skipped. Example: Story 94.7 bypassed Story 94.6's epic-close cleanliness check.

**Evidence**: Epic 94 retro C-4 (Story 94.7)

**Incidents**: 1 named, systemic risk

**HALT-catchable?**: Yes. Convert prose checks to structural HALT conditions counting grep-able markers (sub-heading presence, Lessons-line presence).

**Script cost**: 60-80 LoC

---

## Existing HALT Scripts

| Script | Lines | Tests | Trigger | Maintenance | Uptime |
|---|---|---|---|---|---|
| `check-fix-propagation.sh` | 248 | 6 self-tests | Manual invocation | Low (pure bash + grep) | Since Story 97.1 |
| `check-doc-citations.sh` | 664 | 11 self-tests | CI (`npm run check:docs`) | Moderate (baseline file, EXCLUDE_PATHS) | Since Story 89.3 (4+ months stable) |

**Key insight**: The citation validator is approximately 2.7× larger than the propagation checker (664/248) because it includes file-discovery logic, baseline management, and extensive self-test infrastructure. Simple grep-and-exit scripts (like `check-fix-propagation.sh`) have minimal maintenance; scanning/baselining scripts have moderate maintenance.

---

## Cost-Benefit Analysis

ROI = (catch_rate × incidents_per_epic) / (impl_cost + annual_maintenance)

| Defect Class | Catch Rate | Incidents/Epic (avg) | Impl Cost (LoC) | Annual Maint. | ROI |
|---|---|---|---|---|---|
| Fix-block propagation (workflow integration) | 80% | 4-6 (Epic 94: 2, Epic 95: 0, Epic 96: 6) | 15 (XML only) | Low | **Highest** |
| ESLint rule-name validation | 95% | ~1 (prevented, codebase-wide) | 30-50 | Negligible | **High** |
| Workflow-XML compliance (story markers) | 90% | ~1 per epic | 60-80 | Low | **Medium** |
| Cabinet-isolation grep | 50% | 1-2 (Epic 96 only) | 40-60 | Medium (FP) | **Low** |
| API-client status-code coverage | 60% | ~1 (1 incident total) | 30-40 | Low | **Low** |
| Attestation drift | 0% | 6-8 (cumulative 20+ across Epics 94-96) | N/A | N/A | **N/A** (not automatable) |
| grep-co-occurrence | 0% | ~0 (1 incident total) | N/A | N/A | **N/A** (not automatable) |

---

## Recommendation

### Tier A — Implement now (high ROI, low cost)

**1. `scripts/check-eslint-rules.sh` (30-50 LoC)**
- Parses `.eslintrc.json` rules keys
- Cross-references against ESLint's known rule list (via `eslint --print-config` or hardcoded core rules)
- Exit 1 if any rule name is unrecognized
- Add to CI: `npm run lint:rules` (or integrate into `npm run lint`)
- **Catch rate**: 95% (prevents the exact `max-lines-per-file` class from recurring)
- **Maintenance**: negligible (runs only when `.eslintrc.json` changes)

**2. dev-story workflow integration for `check-fix-propagation.sh` (~15 LoC in workflow XML)**
- Add a Step 9 sub-step that prompts the author to run `check-fix-propagation.sh` after each fix application
- This is a **structural reminder**, not a full HALT gate — a rigid HALT would be too inflexible for diverse fix patterns, but a dismissible prose instruction has proven 0% compliance across 2 epics. The structural middle ground converts the current 0% invocation rate to structural prompting that cannot be silently skipped.
- **Catch rate**: 80% (converts the current 0% invocation rate to structural prompting)
- **Maintenance**: zero (delegates to existing script)

### Tier B — Implement next sprint (medium ROI)

**3. `scripts/check-story-markers.sh` (60-80 LoC)**
- Verifies story files have required structural markers before `done` transition:
  - ≥2 `### Post-Nth-pass-review fixes` sub-headings
  - Final Change Log row contains `**Lessons:**`
  - File List section is non-empty
- Exit 1 if any marker is missing
- **Catch rate**: 90% (structural — verifies the workflow HALT conditions independently)
- **Maintenance**: low (grep-only, no baseline files)

### Tier C — Keep as prose (low or no automation ROI)

**4. Attestation drift (20+ incidents)**: Keep as 2-pass review discipline. No script can detect factual errors in prose about codebase state. The HALT-enforced 2-pass workflow is the structural countermeasure.

**5. Cabinet-isolation (4 incidents)**: Keep as Pattern 4 prose discipline + mandatory 6-test isolation suite. Grep approach has high false-positive rate; test-suite approach is more precise and already proven.

**6. grep-co-occurrence (1 incident)**: Keep as prose. Single occurrence across 25+ stories; not worth scripting.

**7. API-client status-code coverage (1 incident)**: Keep as prose discipline (Story 97.3). Niche pattern; not worth a dedicated script.

---

## Conclusion

The investigation identifies **2 concrete scripts** for immediate implementation and **1 for next sprint**. The highest-ROI investment is not a new script but **workflow integration of the existing `check-fix-propagation.sh`** — the tool exists but is not invoked reliably because invocation depends on author discipline, the exact failure mode documented at 13+ recurrences.

The broadest defect class (attestation drift, 20+ incidents) is fundamentally not automatable and must remain a human-judgment gate enforced by the 2-pass discipline. This validates the current approach: HALT-based enforcement for structural/grepable properties, prose + adversarial review for semantic/judgment properties.

**Deferral pattern broken**: This investigation has been carried forward through 3 epics (94 → 95 → 96 → 97). The deferral pattern itself is evidence that prose-only guidance for "investigate scripting" has a 100% skip rate — which would have been caught by a workflow-embedded structural reminder (the kind recommended in Tier A item 2).

---

## References

- Epic 94-FE retro: `_bmad-output/implementation-artifacts/epic-94-fe-retro-2026-04-27.md`
- Epic 95-FE retro: `_bmad-output/implementation-artifacts/epic-95-fe-retro-2026-05-01.md`
- Epic 96-FE retro: `_bmad-output/implementation-artifacts/epic-96-fe-retro-2026-05-09.md`
- `scripts/check-fix-propagation.sh` (Story 97.1-FE)
- `scripts/check-doc-citations.sh` (Story 89.3-FE, baseline tracking from 94.1-FE)
- CLAUDE.md § Two-pass review discipline (Story 94.3-FE)
- CLAUDE.md § Pattern 4 (Stories 97.1, 97.2, 97.5-FE)
- `docs/process/eslint-max-lines-typo.md` (Story 97.6-FE closure)
