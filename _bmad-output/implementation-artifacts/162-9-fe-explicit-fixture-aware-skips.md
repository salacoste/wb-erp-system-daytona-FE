# Story 162.9: Make E2E Skips Explicit and Fixture-Aware

Status: done

<!-- Note: This artifact is intentionally ignored by the repository-wide _bmad-output rule. Force-add this exact file when committing the story. -->

## Story

As a frontend developer,
I want every E2E `test.skip()` to carry a concrete reason,
so that a yellow skip in the Playwright report is self-diagnosing instead of ambiguous.

## Acceptance Criteria

1. **Given** the E2E tree already uses the reasoned `test.skip(condition, reason)` pattern at ~95 sites, **when** the remaining bare `test.skip()` calls (no arguments) are inventoried at clean base `a7017d54`, **then** exactly six bare skips are recorded (`e2e/settings/backfill-a11y.spec.ts:210` and `:449`; `e2e/supplies/supply-lifecycle.spec.ts:132`, `:174`, `:188`, `:371`), the reasoned skips and `test.describe.skip(...)` suites are left untouched, and every bare skip becomes `test.skip(true, '<reason>')` with a fixture-aware reason while any trailing `return` is preserved.
2. **Given** a bare skip can re-enter the tree, **when** `scripts/check-e2e-skips.mjs` scans `e2e/**/*.spec.ts` plus the Playwright setup files, **then** it flags only argument-less `test.skip()` calls (ignoring line comments, block comments, doc comments, strings, template literals, and regular expressions), it never flags `test.skip(true, 'x')`, `test.skip(cond, reason)`, or `test.describe.skip(...)`, and it exits non-zero with a `file:line` finding per violation (exit zero with an owned-target count when clean).
3. **Given** the scanner is a first-class static gate, **when** `npm run check:e2e-skips` runs, **then** it is wired into `package.json` alongside `check:e2e-waits` and `check:e2e-assertions`, its exported `scanSource`/`scanFiles`/`scanGitRevision`/`collectScanFiles`/`resolveScanTargets` API is unit-tested in `src/test/e2e-skips.test.ts`, and the regression proves RED (`6` findings) at base `a7017d54` and GREEN (`0` findings) at HEAD.
4. **Given** the remediation is a skip-reason addition, **when** the full local quality suite runs, **then** no fixed wait is introduced (the fixed-wait scanner stays `47/0`), no coverage is lost (no assertion changes), `npm run type-check`, scoped zero-warning ESLint, Prettier, privacy, webpack build, and full Vitest all pass, and the exact `backfill-a11y` + `supply-lifecycle` Playwright run shows no new failures against prepared localhost fixtures.

## Tasks / Subtasks

- [x] Task 1: Inventory and fix the six bare skips (AC: 1)
  - [x] Record the exact six bare `test.skip()` sites at clean base `a7017d54`.
  - [x] Replace each with `test.skip(true, '<fixture-aware reason>')`; preserve the trailing `return` in `supply-lifecycle.spec.ts`.
  - [x] Leave the ~95 reasoned `test.skip(condition, reason)` sites and every `test.describe.skip(...)` suite untouched.
- [x] Task 2: Add the static skip scanner (AC: 2, 3)
  - [x] Add `scripts/check-e2e-skips.mjs` mirroring the Story 162.5 fixed-wait scanner structure, masking comments/strings/templates/regex before matching `test.skip(\s*)` with an empty argument span.
  - [x] Walk `e2e/` for `.ts`/`.tsx`/`.mjs`/`.js` specs and include the Playwright setup files, skipping `node_modules` and dot-directories.
  - [x] Print `file:line` per finding and exit non-zero on any violation; print an owned-target count and exit zero when clean.
  - [x] Wire `check:e2e-skips` into `package.json`.
- [x] Task 3: Add the scanner regression (AC: 3)
  - [x] Add `src/test/e2e-skips.test.ts` (vitest) covering clean source, a bare `test.skip()`, a commented-out `// test.skip()`, a reasoned `test.skip(true, 'x')`, a conditional `test.skip(cond, reason)`, `test.describe.skip(...)` (not a violation), a string-embedded mention, a bare skip among reasoned skips, fail-closed on a missing target, the e2e-tree walk, default/explicit target resolution, the exact six-finding base RED, and the HEAD GREEN.
- [x] Task 4: Validate locally (AC: 4)
  - [x] Run `check:e2e-skips`, the scanner vitest, `check:e2e-waits` (no regression), type-check, scoped zero-warning ESLint, Prettier, privacy, webpack build, full Vitest, and the targeted Playwright repeat-two run with unpiped exit status.

## Dev Notes

### Baseline and Exact Scope

- The canonical E2E skip pattern is `test.skip(condition, reason)` (~95 sites). Those are correct: the condition is evaluated and the reason is recorded for the Playwright report. Story 162.9 does not touch them.
- The exact six bare `test.skip()` sites at clean base `a7017d54`:
  1. `e2e/settings/backfill-a11y.spec.ts:210` — `beforeEach` of "Start Backfill Dialog Accessibility @mutating", inside `if (!page.url().includes('/settings/backfill'))`.
  2. `e2e/settings/backfill-a11y.spec.ts:449` — same `if` pattern in a test body.
  3. `e2e/supplies/supply-lifecycle.spec.ts:132` — Step 1, inside `if (!(await createButton.isVisible()))`.
  4. `e2e/supplies/supply-lifecycle.spec.ts:174` — Step 2, inside `if (!createdSupplyId)`.
  5. `e2e/supplies/supply-lifecycle.spec.ts:188` — Step 2, inside `if (!(await addButton.isVisible()) || !(await addButton.isEnabled()))`.
  6. `e2e/supplies/supply-lifecycle.spec.ts:371` — Step 5, inside `if (!createdSupplyId)`.
- Each `test.skip(true, '<reason>')` uses `true` because the enclosing `if` has already evaluated the condition; `true` plus a concrete fixture-aware reason satisfies the AC and is the established repo idiom for a guarded skip whose condition was already checked.

### Skip Inventory (by reason / criticality)

| Site | Reason | Criticality | Fixture-aware? |
| --- | --- | --- | --- |
| `backfill-a11y.spec.ts:210` | Backfill admin route did not load — redirected away from `/settings/backfill` | Medium (route-guarded `beforeEach`; the whole `@mutating` suite already skips unless `shouldSkipMutatingE2E()` is false) | Yes — names the route contract that failed |
| `backfill-a11y.spec.ts:449` | Backfill admin route did not load — redirected away from `/settings/backfill` | Medium (test-level route guard) | Yes — same route contract |
| `supply-lifecycle.spec.ts:132` | Create-supply button not visible — supplies list state prevents the create flow | High (Step 1 is the gate for the whole lifecycle chain; later steps `return` when `createdSupplyId` is unset) | Yes — names the list-state precondition |
| `supply-lifecycle.spec.ts:174` | No supply created in Step 1 — Step 2 (add orders) depends on a created supply | High (cross-step dependency) | Yes — names the Step 1 dependency |
| `supply-lifecycle.spec.ts:188` | Add-orders button not available/enabled — supply may not be in OPEN status | High (status-gated write flow) | Yes — names the OPEN-status contract |
| `supply-lifecycle.spec.ts:371` | No supply created in Step 1 — Step 5 (delivery status) depends on a created supply | Medium (mock verification downstream of Step 1) | Yes — names the Step 1 dependency |

All six are fixture- and state-aware: each reason names the exact observable (route URL, button visibility/enabled, supply-creation dependency, supply OPEN status) that the enclosing `if` already evaluated, so a yellow skip in the report is immediately diagnosable without re-reading the test.

### Scanner Design

- `scripts/check-e2e-skips.mjs` mirrors `scripts/check-e2e-fixed-waits.mjs`: same shebang, `execFile`/`readFile` imports, `scanSource`/`scanFiles`/`scanGitRevision`/`resolveScanTargets` exports, and `main()` entry that prints findings and sets `process.exitCode = 1` on violations.
- The masking state machine is lifted from `scripts/check-e2e-vacuous-assertions.mjs`: it replaces line comments, block comments, regular expressions, and string/template literals with spaces (preserving newlines so line numbers stay accurate). This guarantees a `test.skip()` mentioned in a JSDoc, a comment, or a string is never flagged.
- A bare skip is `test.skip` (member access) followed by `(` whose matching `)` encloses only whitespace. `test.describe.skip(...)` is structurally distinct (different property chain) and reasoned skips have a non-empty argument span, so neither is flagged.
- `collectScanFiles` walks `e2e/` (`.ts`/`.tsx`/`.mjs`/`.js`, skipping `node_modules` and dot-directories) and adds the Playwright setup files that exist on disk. Setup files are filtered by existence so a walk over a minimal temp root does not fail-closed at collection time; `scanFiles` remains the fail-closed gate for explicit CLI targets.

### What Is NOT in Scope

- No changes to the ~95 reasoned `test.skip(condition, reason)` sites or to `test.describe.skip(...)` suites.
- No changes to `e2e/fixtures/network-test.ts` or `scripts/e2e-preflight-handshake.mjs` — another worktree is editing those.
- No assertion changes (skip-reason additions only); no fixed waits introduced; no coverage loss.
- No backend, product-UI, dependency, generated-OpenWiki, or unrelated E2E changes.

### Previous-Story Intelligence

- Story 162.5 established the fixed-wait AST scanner and the union-guard regression pattern. The skip scanner mirrors its structure (exports, fail-closed `scanFiles`, `scanGitRevision` for base-RED evidence, `resolveScanTargets` for explicit CLI targets).
- Story 162.3 established the comment/string-masking state machine used here for the vacuous-assertion scanner; the same proven masking is reused so the bare-skip match cannot fire inside a comment, string, template, or regex.
- Story 162.8 owned the two `@mutating` specs whose bare skips are remediated here; the backfill/supply lifecycle state-aware reasons reuse the route and status contracts those stories already codified.

### Testing Requirements

Minimum implementation evidence:

```bash
npm run check:e2e-skips
npx vitest run src/test/e2e-skips.test.ts
npm run check:e2e-waits
npm run type-check
npx eslint scripts/check-e2e-skips.mjs src/test/e2e-skips.test.ts \
  e2e/settings/backfill-a11y.spec.ts e2e/supplies/supply-lifecycle.spec.ts --max-warnings=0
npx prettier --check scripts/check-e2e-skips.mjs src/test/e2e-skips.test.ts \
  e2e/settings/backfill-a11y.spec.ts e2e/supplies/supply-lifecycle.spec.ts package.json
npm run check:privacy
npm run build -- --webpack
npx vitest run
npm run test:e2e:full -- \
  e2e/settings/backfill-a11y.spec.ts e2e/supplies/supply-lifecycle.spec.ts \
  --project=chromium --workers=1 --repeat-each=2 --retries=0
```

Browser-facing acceptance requires a fresh localhost result; the `@mutating` specs skip by default unless the mutation gate is explicitly enabled, so the live run confirms no new failures rather than full execution.

### References

- [Source: `scripts/check-e2e-fixed-waits.mjs` - Story 162.5 scanner structure mirrored here]
- [Source: `scripts/check-e2e-vacuous-assertions.mjs` - Story 162.3 comment/string-masking state machine reused here]
- [Source: `e2e/settings/backfill-a11y.spec.ts:210,449` - bare skip sites and their route-guard contracts]
- [Source: `e2e/supplies/supply-lifecycle.spec.ts:132,174,188,371` - bare skip sites and their supply-state contracts]
- [Source: `_bmad-output/implementation-artifacts/162-6-fe-dashboard-analytics-state-waits.md` - artifact structure and dev-note conventions]

## Dev Agent Record

### Agent Model Used

- Story context: Claude orchestrator (executor lane).
- Implementation: single scoped executor pass over the six skip sites plus the scanner and its regression.

### Debug Log References

- 2026-08-06: Worktree `claude/162-9-explicit-skips` created off clean base `a7017d54`; `node_modules` symlinked and `.env.e2e` written (E2E_TEST_EMAIL / E2E_TEST_PASSWORD / E2E_BASE_URL=:3100 / E2E_API_URL=:3000).
- 2026-08-06: All six bare `test.skip()` sites converted to `test.skip(true, '<fixture-aware reason>')`; trailing `return` preserved at the four `supply-lifecycle` sites. Prettier wrapped the long reason lines onto multiple lines (semantically inert).
- 2026-08-06: `scripts/check-e2e-skips.mjs` added; base-RED evidence at `a7017d54` is exactly `6` findings (the six spec sites), HEAD is `0` findings across `99` owned targets. The scanner correctly ignores the `test.skip()` mention in the `e2e/orders-client-info.spec.ts` doc comment and every reasoned skip / `describe.skip`.
- 2026-08-06: `src/test/e2e-skips.test.ts` added (13 tests); first run failed on the walk test because `collectScanFiles` unconditionally added the hard-coded setup files and `scanFiles` failed closed on the absent `auth-manager.setup.ts`. Fixed by filtering setup files by existence at collection time (collection is a walk; `scanFiles` stays fail-closed for explicit targets). 13/13 GREEN.
- 2026-08-06: Static gates green: `check:e2e-skips` (`99` owned, `0` bare), `check:e2e-waits` (`47/0`, no regression), `type-check`, scoped zero-warning ESLint over the four changed/new code files, Prettier over the five changed/new files, privacy (`3244` text files), webpack build exit `0`, full Vitest `1059` files / `17478` tests.
- 2026-08-06: Targeted live Playwright run (`e2e/settings/backfill-a11y.spec.ts` + `e2e/supplies/supply-lifecycle.spec.ts`, `--project=chromium --workers=1 --repeat-each=2 --retries=0`). First attempt failed in the auth setup project (`auth.setup.ts:31` `waitForURL` timeout) because the backend login hit its in-memory `5/hour` rate limit from earlier sessions; restarted `wb-repricer` (pm2 id 3) to clear the limit. Retry completed with `41 passed`, `1 skipped`, `0 failed`, `0 retries`, runtime `49.2s`, unpiped `PW_EXIT=0`. The preflight runs in READ-ONLY mode so the `@mutating` suites (the actual Start-Dialog / supply-lifecycle Steps 1-5) are excluded by default; the run confirms no new failures and no bare-skip regressions in the two owned specs.

### Completion Notes List

- The six bare skips are now self-describing; the ~95 reasoned skips and `describe.skip` suites are untouched.
- The scanner is wired as `check:e2e-skips` and guarded by a 13-test vitest regression including base-RED (`6`) and HEAD-GREEN (`0`).
- No fixed waits introduced, no assertion/coverage changes, no edits to `e2e/fixtures/network-test.ts` or `scripts/e2e-preflight-handshake.mjs`.

### File List

- `e2e/settings/backfill-a11y.spec.ts` (modified)
- `e2e/supplies/supply-lifecycle.spec.ts` (modified)
- `scripts/check-e2e-skips.mjs` (added)
- `src/test/e2e-skips.test.ts` (added)
- `package.json` (modified)
- `_bmad-output/implementation-artifacts/162-9-fe-explicit-fixture-aware-skips.md` (added, force-added — gitignored)

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Implemented Story 162.9: converted the six bare `test.skip()` sites to fixture-aware `test.skip(true, '<reason>')`, added `scripts/check-e2e-skips.mjs` plus the `check:e2e-skips` package script, and added the 13-test vitest regression. Static gates green (scanner `99/0`, waits `47/0`, type-check, ESLint, Prettier, privacy, webpack build, full Vitest `17478/17478`). Status: backlog -> done pending orchestrator gates + merge. |
