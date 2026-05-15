# Epic 107-FE: Process Cleanup Bundle — Carry-Forward Small Wins

**Priority**: P3 (process tooling — compound returns; ≤1 SP per item but ~4 total when bundled)
**Estimate**: ~3 SP (range [2, 4])
**Source**: Carry-forward action items from Epic 104-FE retro (A-3 hook heuristic, A-4 vitest wrapper, A-5 two-repo doc) + Epic 105-FE retro (A-3 hook heuristic carry-forward, A-4 vitest wrapper, A-5 two-repo doc) + Epic 106-FE retro (A-3 nullPreservingSum extraction)
**Created**: 2026-05-15

## Objective

Bundle 3 small carry-forward process-tooling action items that have been deferred across Epics 104/105/106 into a single epic. Each is ≤1 SP individually, but they accumulate as "perpetual TODO" if not given a forcing function. Bundling provides epic-close pressure.

**Out of original scope**: A-3 hook heuristic tightening (Epic 104+105 carry-forward) — the delegation-notice hook lives in user-config (`~/.claude/`), outside this repo's modification scope. Defer to user-level tooling.

## Carry-forward items being addressed

| Item | Origin | Epic 107 Story |
|---|---|---|
| nullPreservingSum helper extraction | Epic 106-FE retro A-3 | 107.1 |
| vitest wrapper for Anti-Pattern #8 self-test | Epic 105-FE retro A-4 | 107.2 |
| Two-repo monorepo coordination doc | Epic 105-FE retro A-5 | 107.3 |

## Stories

### Story 107.1-FE: Extract nullPreservingSum helper (~1 SP)

Convert Story 106.1's inline reducer pattern into a reusable helper.

**Tasks**:
- Create `src/lib/aggregation-helpers.ts` (new module). If a similar utilities file already exists (e.g., `src/lib/daily-helpers.ts`), evaluate whether to extend it instead — prefer new module for separation of concerns unless the existing one already hosts pure reducer helpers.
- Implement `nullPreservingSum(acc: number | null, value: number | null): number | null`:
  ```typescript
  /**
   * Reducer helper for null-preserving sums. When all reduced items are null,
   * the result stays null (meaning "all unknown"). Once any item is a number,
   * the result becomes a number for the rest of the reduction.
   * 
   * Story 107.1-FE: extracted from Story 106.1's table-columns.ts:188-191 pattern.
   * @see CLAUDE-PATTERNS.md § Anti-Pattern #8 Exceptions — Pattern: AGGREGATION-REDUCE
   */
  export function nullPreservingSum(
    acc: number | null,
    value: number | null
  ): number | null {
    if (acc === null && value === null) return null
    return (acc ?? 0) + (value ?? 0)
  }
  ```
- Add 4 unit tests in `src/lib/__tests__/aggregation-helpers.test.ts`:
  1. Both null → null
  2. Acc null, value number → number
  3. Acc number, value null → number
  4. Both numbers → sum
- Migrate `src/components/custom/dashboard/table-columns.ts:188-191` to use the helper. Verify existing tests still pass.
- Update CLAUDE-PATTERNS.md § Anti-Pattern #8 Exceptions § AGGREGATION-REDUCE pattern's "null-preserving accumulator" footnote to cite the helper.

**Acceptance criteria**:
- `nullPreservingSum` helper exists with 4 unit tests
- `table-columns.ts` migrated to use helper (no logic change, just refactor)
- CLAUDE-PATTERNS.md AGGREGATION-REDUCE pattern references the helper
- All baseline gates green
- 2-pass adversarial review passes

### Story 107.2-FE: vitest wrapper for Anti-Pattern #8 self-test (~1 SP)

Integrate the shell-based self-test into `npm test` so it runs in CI.

**Tasks**:
- Create `src/test/anti-pattern-8-rule.test.ts` (or similar location)
- Test body: `execSync('bash scripts/test-anti-pattern-8-rule.sh', { cwd: <repo root> })` — assert exit code 0
- Use vitest's `expect(() => execSync(...)).not.toThrow()` pattern OR capture stdout for clearer failure output
- Verify the test runs in `npm test -- --run` and adds to the passing count
- Don't break the existing shell script — it should remain runnable standalone for quick local checks

**Acceptance criteria**:
- New vitest test exists; runs the shell self-test
- `npm test -- --run` passing count increases by 1 (or 9 if vitest decomposes the shell fixtures — either acceptable)
- Test fails if any of the 9 fixtures in the shell script fails (verify by deliberately breaking a selector temporarily)
- Shell script remains independently runnable
- All baseline gates green
- 2-pass adversarial review passes

### Story 107.3-FE: Two-repo monorepo coordination doc (~0.5 SP)

Document the parent-monorepo + nested-frontend git structure.

**Tasks**:
- Create `docs/process/two-repo-coordination.md` (new file)
- Cover topics:
  - **Structure**: parent repo at `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new` contains `frontend/` directory as part of its tree; `frontend/` is ALSO an independent nested git repo with its own `.git`/origin
  - **When parent commits**: shared infrastructure changes (`eslint.config.js`, `tsconfig.json` at root, CI configs) live in parent; commit there
  - **When frontend commits**: anything inside `frontend/src/**`, `frontend/_bmad-output/`, `frontend/CLAUDE.md` lives in frontend nested repo; commit there
  - **Push coordination**: parent and frontend have separate origins; each push goes to its own remote
  - **Cross-repo work**: a single logical story (e.g., Story 105.1-FE) may need commits in BOTH repos. Sequence: commit parent first, then frontend, then push both
  - **Common pitfalls**: (a) `_bmad-output/` is gitignored at frontend level — needs `git add -f`; (b) easy to forget the parent commit; (c) automation/user manually syncs frontend changes into parent (one-way mirror)
- Cite Story 105.1-FE as canonical cross-repo example (parent: ESLint rule, frontend: allowlists)

**Acceptance criteria**:
- New doc file created
- All topics covered
- No new broken doc-citations introduced
- All baseline gates green

### Story 107.4-FE: Tests + polish + retrospective (~0.5 SP)

Final close-out.

**Tasks**:
- Run all baseline gates
- File Epic 107-FE retrospective at `_bmad-output/implementation-artifacts/epic-107-fe-retro-{date}.md`
- Update sprint-status: epic-107-fe + 4 stories + retrospective → done
- Note in retro: A-3 hook heuristic tightening (Epic 104+105+106 carry-forward, 3 epics now) is deferred to user-config tier; document the workaround (ignore the delegation-notice noise)

**Acceptance criteria**:
- All quality gates baseline-clean
- Retrospective filed with action items
- Epic 107-FE marked done in sprint-status

## Dependencies

- Story 106.1-FE: source of the inline reducer pattern being extracted
- Story 105.1-FE: source of the shell self-test being wrapped
- Story 105.1-FE: canonical cross-repo example for the two-repo doc
- CLAUDE-PATTERNS.md § Anti-Pattern #8 Exceptions (Story 106.3-FE) — cross-referenced from new helper
- CLAUDE.md push protocol — referenced from two-repo doc

## Risks / Open Questions

1. **Existing aggregation utilities module**: there may be a `src/lib/daily-helpers.ts` or similar that could host `nullPreservingSum` instead of a new file. Story 107.1 first task is "evaluate" — pick the appropriate home.
2. **execSync in vitest**: spawning a child process from vitest is slower than pure JS tests. Acceptable since this runs once per `npm test` and provides high-value CI integration. But on tight CI budgets, may need to extract the rule logic into JS and test directly without shelling out.
3. **Two-repo doc accuracy**: the parent repo's exact structure and origin URL should be verified at write time. If the user pushes both repos manually, document that explicitly; if there's automation, document that.
4. **Hook heuristic carry-forward (4th time)**: not addressing this in Epic 107 means it carries to Epic 108+. Acceptable since it's user-config scope, but should NOT silently drop from tracking.
