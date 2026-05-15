# Epic 105-FE: Process-Tooling Automation — Anti-Pattern #8 Lint + Pre-Flight Verification

**Priority**: P2 (process tooling — compound returns across all future epics)
**Estimate**: ~5 SP (range [4, 7])
**Source**: Epic 104-FE retrospective action items A-1 + A-2
**Created**: 2026-05-15

## Objective

Convert two manually-enforced disciplines into automated guardrails so future epics don't depend on author memory or reviewer catches:

1. **A-1**: ESLint rule that flags `?? 0` on money/ratio field names — Anti-Pattern #8 has recurred 6+ times across Epics 87-104 despite explicit codification in `CLAUDE-ANTI-PATTERNS.md`. Each recurrence was caught only by 2-pass review. An automated lint rule converts this from "discipline" to "impossible to ship."

2. **A-2**: Pre-flight source-trace step in dev-story workflow — Stories 104.1, 104.3, 103.1, 103.2, 103.3 all turned out to be already-shipped after empirical verification. Adding a "verify before implementing" step saves duplicate work.

Out-of-scope (deferred to later epics):
- A-3: Cross-team coordination "verify before incorporating" protocol
- A-4: Delegation-notice hook heuristic tightening (~15 false positives/session)
- A-5: Advertising daily fixture factory

## Context

### Anti-Pattern #8 recurrence chain (Epic 104-FE retrospective C-3)

| Epic | Story | Field |
|---|---|---|
| 87-FE | Story 87.3 | (original codification — orders price inversion null preservation) |
| 88-FE | Story 88.2 | COGS null vs zero distinction |
| 89-FE | Story 89.4 | Defensive Frontend Principle |
| 91-FE | Story 91.2 | `net_profit: null` when COGS unknown |
| 92-FE | Story 92.5 | errorRate null preservation |
| **104-FE** | Story 104.2 | revenue / roas / cpc / ctr — caught by 2-pass review |

Pattern: every new normalizer touching money/ratio fields tempts a `?? 0` shortcut. Author writes `?? 0` (reasonable default), reviewer catches it (sometimes), 2-pass catches it (more reliably). Automation removes the human-in-the-loop dependency.

### Pre-flight verification empirical wins (Epic 103-FE + 104-FE)

Stories closed via "verify before implementing" rather than full implementation:

| Story | Discovered already-shipped via | Saved SP |
|---|---|---|
| 103.1 | Epic 103 src/ existed (uncommitted) | ~2 SP |
| 103.2 | Epic 103 src/ existed | ~2 SP |
| 103.3 | Epic 103 src/ existed | ~2 SP |
| 104.1 | Epic 91-FE Story 91.2 (`getFinanceDailyData` fully wired) | ~3 SP |
| 104.3 | Epic 77-FE Stories 77.4/77.5 (`mergeDeliveryCosts` + 10 categories live) | ~2 SP |

Total: ~11 SP of duplicate work avoided in Epics 103-104 alone. Codifying the pre-flight step prevents future losses.

## Stories

### Story 105.1-FE: ESLint custom rule for Anti-Pattern #8 (~3 SP)

Implement an ESLint rule that flags `?? 0` on identifiers matching money/ratio field names.

**Tasks**:
- **Approach decision**: prefer `no-restricted-syntax` with AST selectors over custom plugin (simpler to maintain, no separate package). Acceptable to upgrade to custom plugin if `no-restricted-syntax` proves insufficient.
- **Rule design**: flag `LogicalExpression[operator='??']` where:
  - LHS property name matches `/^(revenue|profit|cost|spend|roas|margin|ratio|_pct|_amount|price|payment|fee|tax)/i` OR
  - LHS property name ends with `_rub` / `Rub` / `_usd` / `Usd` (currency-typed fields) OR
  - LHS property name matches `/^(ctr|cpc|cpm|conversion)$/i` (ratio metrics)
  - AND RHS is `0` (literal numeric zero)
- **Allowlist for count fields**: `views|clicks|orders|count|total|items|qty|quantity|salesCount|returnsCount` — these stay `?? 0` per CLAUDE.md Anti-Pattern #8 wording ("Counts/pagination still allow `?? 0`").
- **Edge cases**:
  - `total_spend` (Story 104.2): money-like name but backend semantic "0 = no ads" — allowlist or eslint-disable-next-line with comment
  - Pre-existing `?? 0` violations in src/: sweep + add `eslint-disable-next-line` comments only where backend contract guarantees non-null (with comment citing why)
- **Place rule config in `eslint.config.js`** (flat config — root file). Use `no-restricted-syntax` with multiple selectors.
- **Add self-tests**: in a new `scripts/test-anti-pattern-8-rule.sh` or via vitest, write 5-6 fixtures that ensure rule fires on money/ratio names and skips count names.
- **Document in CLAUDE.md** § Known Anti-Patterns #8 — note "ESLint enforced as of Story 105.1-FE; manual catch no longer needed."

**Acceptance criteria**:
- ESLint rule registered in `eslint.config.js`
- Self-test fixtures cover ≥5 positive cases (rule fires) + ≥3 negative cases (allowlist works)
- Pre-existing codebase passes lint OR has documented exceptions
- CLAUDE.md § Anti-Patterns #8 updated to reflect automation
- All baseline gates green
- Story passes 2-pass adversarial review

### Story 105.2-FE: Pre-flight source-trace step in dev-story workflow (~2 SP)

Extend the dev-story workflow with a mandatory pre-flight verification step.

**Tasks**:
- **Locate the dev-story workflow**: `_bmad/bmm/workflows/4-implementation/dev-story/instructions.md` (verify via `grep -rln "dev-story" _bmad/`)
- **Insert Step 1.5 (or appropriate location)**: "Pre-flight verification — before any source change, grep the codebase for the story's primary nouns/endpoints/types. If hits exist, read those files and verify whether the AC is already satisfied. Document findings; if all AC already satisfied, mark story `done` with verification evidence and skip implementation."
- **Document the pattern with examples** from Stories 104.1, 104.3, 103.1-3 (citation to retro lessons learned).
- **Optional helper script**: `scripts/check-story-preflight.sh` that takes a story file path and runs `grep` for the AC's nouns against `src/`. Reports hits + asks reviewer to confirm whether they satisfy AC.
- **Update CLAUDE.md** with brief note about the pre-flight discipline.

**Acceptance criteria**:
- Dev-story workflow has new pre-flight step documented
- Examples include ≥3 retro citations
- Optional helper script ships if it adds clarity (otherwise skip per YAGNI)
- All baseline gates green
- 2-pass adversarial review passes

### Story 105.3-FE: Tests + polish + retrospective (~1 SP)

Final quality-gate sweep + Epic 105-FE retrospective.

**Tasks**:
- Run all baseline gates (lint, tsc, vitest, doc-citations, ESLint rule names)
- Verify Story 105.1's rule doesn't break existing baseline lint counts (or update CLAUDE.md baseline if rule legitimately surfaces new findings)
- Verify Story 105.2's workflow change doesn't break any BMAD invocation
- File Epic 105-FE retrospective at `_bmad-output/implementation-artifacts/epic-105-fe-retro-{date}.md`
- Update sprint-status: epic-105-fe + 3 stories + retrospective → done

**Acceptance criteria**:
- All quality gates baseline-clean
- Retrospective filed with action items
- Epic 105-FE marked done in sprint-status

## Dependencies

- ESLint flat config already in place (`eslint.config.js`) — Story 99.1-FE
- CLAUDE.md § Known Anti-Patterns #8 — Story 87.3-FE codification
- CLAUDE-ANTI-PATTERNS.md — full anti-pattern doc
- 2-pass review discipline (Story 94.3-FE) — both stories pass through this
- Story 97.7-FE investigation: "prose-only enforcement has empirically 100% skip rate" — validates the automation approach

## Risks / Open Questions

1. **`no-restricted-syntax` complexity**: AST selectors for `LogicalExpression[operator='??']` with name-pattern matching on LHS property name may need experimentation. Fallback: write a small custom plugin in `eslint-rules/no-zero-fallback-money-ratio.js`.
2. **Pre-existing violations sweep**: After enabling the rule, `npx eslint 'src/**/*'` may surface dozens of legitimate-zero cases (e.g., `total_spend`, `salesCount`). Each needs review — keep allowlist OR add inline eslint-disable. Estimated 10-20 manual triage decisions.
3. **Pre-flight workflow adoption**: The discipline only works if authors actually do it. May need to add a HALT condition in the workflow (similar to Story 99.2-FE check-fix-propagation HALT). Out of scope for Story 105.2; defer to follow-up if needed.
4. **False positives**: rule might flag legitimate count fields named like money (`payment_count`, `revenue_items`). Allowlist tuning may take iteration.
