/**
 * Vitest wrapper for the Anti-Pattern #8 ESLint rule self-test.
 *
 * Story 107.2-FE (Epic 105-FE retro A-4): integrates `scripts/test-anti-pattern-8-rule.sh`
 * into `npm test` so CI catches regressions in the rule's selectors (e.g., if the
 * money/ratio name regex is broken or the optional-chain selector is removed).
 *
 * The shell script remains standalone-runnable for quick local checks; this wrapper
 * just ensures it ALSO runs as part of the test suite.
 *
 * @see scripts/test-anti-pattern-8-rule.sh (9 fixtures: 6 positive + 3 negative)
 * @see CLAUDE-PATTERNS.md § Anti-Pattern #8 Exceptions
 * @see eslint.config.js (root monorepo) — Story 105.1-FE rule definition
 */

import { execSync } from 'child_process'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const SCRIPT_PATH = path.join(REPO_ROOT, 'scripts', 'test-anti-pattern-8-rule.sh')

describe('Anti-Pattern #8 ESLint rule — shell self-test', () => {
  it('passes all 9 fixtures (6 positive + 3 negative)', () => {
    // execSync throws on non-zero exit; stdio: 'pipe' captures output for failure messages
    expect(() => {
      execSync(`bash ${SCRIPT_PATH}`, {
        cwd: REPO_ROOT,
        stdio: 'pipe',
        encoding: 'utf-8',
      })
    }).not.toThrow()
  })
})
