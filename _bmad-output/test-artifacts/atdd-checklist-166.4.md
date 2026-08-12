---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: 2026-08-12
workflowType: testarch-atdd
inputDocuments:
  - _bmad-output/implementation-artifacts/166-4-fe-standardize-metrics-financial-values-availability-and-status.md
  - .omx/plans/166.4-standardize-metrics-financial-values-availability-and-status.md
  - _bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad/tea/config.yaml
  - playwright.config.ts
  - vitest.config.ts
---

# ATDD Checklist - Epic 166, Story 166.4: Metrics, Financial Values, Availability, and Status

**Date:** 2026-08-12
**Author:** R2d2
**Primary Test Level:** Vitest + React Testing Library component contracts

## Preflight and Mode

- Story approval: pass; the dedicated Story artifact has eight testable acceptance-criteria groups and current status `review`.
- Detected stack: frontend (`Next.js`, React, Vitest, Playwright).
- Framework readiness: `vitest.config.ts` and `playwright.config.ts` are present; worktree-local dependencies use Node `24.18.0` and npm `11.11.0`.
- Generation mode: AI-generated component contracts. Story 166.4 owns no route, API, query, or browser journey, so API and route E2E RED suites are N/A; later browser evidence uses a temporary non-production harness.
- Execution mode: independent test-owner lane; the test engineer audited, accepted, and strengthened the existing RED suite under exclusive ownership of `src/components/product/metrics/__tests__/**` and this checklist.
- ATDD adaptation: executable Vitest/RTL component RED is authoritative for this route-free presentation layer. Playwright API/E2E generation, network fixtures, data factories, route selectors, and production-route scaffolding are intentionally N/A rather than skipped tests.

## Story and Acceptance Coverage

Story 166.4 creates a route-free product presentation API for metrics, financial/operational values, availability, and status. It must preserve Russian formatting and explicit data meaning while keeping calculations, routes, APIs, tokens, primitives, and legacy consumers outside its ownership.

| Priority | Acceptance contract | Test evidence |
|---|---|---|
| P0 | Zero is valid and distinct from missing/unavailable; non-finite never becomes zero | `FinancialValue.test.tsx` |
| P0 | RUB, percent-units, percentage points, quantity/unit, duration, fixed decimals, dates, Moscow time, ISO weeks, large negatives, compact/caller-supplied full precision | `FinancialValue.test.tsx` |
| P0 | Comparison direction and business sentiment are independent and non-color-only | `MetricCompositions.test.tsx` |
| P0 | All declared operational status and availability states have readable text and distinct registered semantic families; unknown and neutral are explicit | `FinancialValue.test.tsx`, `StatusCompositions.test.tsx`, source contract |
| P1 | Loading/error/ready, hero/standard/compact/dense, definition/period/action, caller DOM order | `MetricCompositions.test.tsx` |
| P1 | Stale/partial/estimated preserve the supplied value and show textual qualification | `FinancialValue.test.tsx` |
| P1 | StatusStrip provides native disclosure and caller-controlled urgency | `StatusCompositions.test.tsx` |
| P1 | New source is server-compatible, presentation-only, palette-safe, and separate from the Story 166.3 manifest | `metric-composition-source-contracts.test.ts` |
| P1 | Illegal value/state combinations fail project type-check instead of becoming runtime fallback ambiguity | Compile-time assertions in `FinancialValue.test.tsx` and `MetricCompositions.test.tsx` |

## RED Test Files

- `src/components/product/metrics/__tests__/FinancialValue.test.tsx`
  - 40 parameter-expanded executable/compile-time cases covering currency, percentage, percentage-point, quantity/unit, duration, fixed decimal, temporal/invalid-temporal, compact/caller-supplied-full, unsupported compact pairs, availability-quality, loading, zero/missing/unavailable/not-calculated/filtered-out, non-finite, and caller-owned direction contracts.
- `src/components/product/metrics/__tests__/MetricCompositions.test.tsx`
  - 23 parameter-expanded executable/compile-time cases covering MetricCard illegal-state proof, loading/error/ready, four hierarchy variants, six direction/sentiment combinations, sign preservation, block-safe slots, and MetricGroup landmark/DOM-order/action contracts.
- `src/components/product/metrics/__tests__/StatusCompositions.test.tsx`
  - 14 parameter-expanded executable cases covering success/warning/error/information/pending/neutral/unknown, semantic-family separation, block-safe details/source/timestamp/action values, stable status identity, status details/timestamps/actions, and native StatusStrip disclosure.
- `src/components/product/metrics/__tests__/metric-composition-source-contracts.test.ts`
  - 4 source contracts covering the explicit production manifest, allowlisted presentation imports, server/route/calculation/reordering boundaries, semantic-role separation, and additive product-barrel contract.

The final test manifest remains four files with 81 parameter-expanded contract cases. No separate type-contract file is justified: discriminated public types are proved by eleven `@ts-expect-error` assertions and the mandatory project `npm run type-check` gate. The directives fail type-check if invalid value/state, model/format, duplicate-availability, compact-precision, or unsupported-compact contracts become legal.

No factories, providers, API mocks, network fixtures, or route selectors are required: the new API is deterministic and presentation-only. Tests use roles, visible Russian text, semantic data attributes, native disclosure elements, and stable Story-owned slots instead of CSS-selector journeys or arbitrary waits. Existing centralized duration presentation is consumed read-only from `@/lib/duration-utils`; it was added to the Story-specific allowlist solely to close the explicit duration acceptance gap.

## Implementation Checklist

- [x] Add `presentation.ts` with discriminated value/format/availability/status/comparison types and deterministic presentation metadata.
- [x] Add server-compatible `FinancialValue` and `DataAvailability`; reuse centralized number/currency/percentage/date/week and duration formatters read-only.
- [x] Support currency, percent, percentage-points, count, quantity/unit, duration, decimal precision, and temporal formats without taking calculation ownership.
- [x] Keep invalid temporal and non-finite numeric input explicitly unknown; keep missing, unavailable, not-calculated, and filtered-out discriminated from valid zero.
- [x] Preserve numeric sign independently from caller-owned semantic direction and comparison sentiment.
- [x] Add server-compatible `MetricCard` and `MetricGroup`; accept route-owned `ReactNode` actions/recovery and no callbacks.
- [x] Add server-compatible `StatusBadge` and `StatusStrip` with textual/icon meaning for success/warning/error/information/pending/neutral/unknown and native disclosure.
- [x] Add `metrics/index.ts` and append public exports to `src/components/product/index.ts`.
- [x] Keep `src/components/product/__tests__/product-composition-source-contracts.test.ts` byte-unchanged.
- [x] Run the focused suite to GREEN, refactor only within the owned subtree, then run universal and browser/a11y validation.

## Commands

```bash
PATH=/private/tmp/wb-fe-166-4-toolchain/npm-11.11.0/bin:/private/tmp/wb-fe-166-4-toolchain/node-v24.18.0-darwin-arm64/bin:$PATH \
  npm test -- --run src/components/product/metrics/__tests__
```

## Audited RED Evidence

**Command:**

```bash
PATH=/private/tmp/wb-fe-166-4-toolchain/npm-11.11.0/bin:/private/tmp/wb-fe-166-4-toolchain/node-v24.18.0-darwin-arm64/bin:$PATH \
  npm test -- --run src/components/product/metrics/__tests__
```

**Fresh result after independent test-owner audit:** expected exit code `1`; `4 failed (4)` Story test files. Three behavior suites collected `0 tests` because Vite could not resolve absent `../DataAvailability`, `../MetricCard`, and `../StatusBadge` entry modules. The source-contract suite executed `4 tests | 4 failed`: the explicit eight-file production manifest was absent, reads failed with `ENOENT` at `metrics/DataAvailability.tsx`, and `src/components/product/index.ts` lacked `from './metrics'`.

This is genuine RED against base `c73b6002ae32a3b458c114d9ec14c7d6ee72fc1d`: exit code `1`, no skipped/manufactured failure, and every failure names only absent Story-owned modules/exports. The strengthened files parsed and formatted successfully before the run. No route, API, environment, dependency, test syntax, or unrelated regression caused the failure. Production source remained untouched during the run.

## Validation Completion

- Prerequisites and frameworks: pass.
- Acceptance-to-test mapping: pass after audit; quantity/unit, duration, fixed decimal precision, not-calculated, invalid temporal, caller-supplied full precision, negative infinity, semantic direction override, loading availability, neutral status, group action, and StatusStrip detail/timestamp/action gaps were closed.
- Determinism/isolation: pass; no network, providers, clocks, random factories, hard waits, or shared state.
- RED correctness: pass; all collected failures are implementation-absence failures.
- Type contract: pass; the initial two compile-time assertions expanded to eleven live negative assertions, and final `npm run type-check` passed. Separate test-file expansion is unnecessary.
- Source ownership: pass at design level; the Story 166.4 source contract retains an explicit eight-file production manifest and does not edit or scan through the Story 166.3 manifest.
- CLI/browser session cleanup: pass; Chromium/Firefox/WebKit validation sessions and the post-review Chrome session were closed, and the final browser list was empty.
- Temporary artifacts: pass; temporary route harnesses, empty harness directories, and `.playwright-cli` output were removed before final scope validation.

## Final GREEN and Review Evidence

- Focused Vitest: 4/4 files and 81/81 tests passed.
- Type contract: repository `npm run type-check` passed with eleven live negative assertions.
- Static/local gates: zero-warning ESLint, ESLint-rule audit, locale-percent baseline, max-lines, project-wide Prettier, `git diff --check`, YAML parse, package/lock zero-diff, forbidden-surface audit, and exact eight-file production manifest passed.
- Production build: compiled successfully, TypeScript completed, and 70/70 static pages generated; no temporary Story route remained in the route manifest.
- Full regression: 1107/1107 files and 18142/18142 tests passed after the last review-fix rerun.
- Browser/accessibility: Chromium/Firefox/WebKit responsive/theme/keyboard/reduced-motion matrix passed; post-review Chrome 320/720 smoke and light/dark WCAG A/AA/2.1 AA axe scans passed with zero violations.
- Recorded environment gaps: real Safari/VoiceOver, Edge, and Windows/NVDA were unavailable; WebKit evidence is automated and not represented as a real Safari/VoiceOver pass.
- Review Pass 1: 2 High, 6 Medium, 1 Low; every accepted finding resolved.
- Review Pass 2 and final recheck: every accepted code/test/evidence finding resolved, including filtered-out state, truthful compact typing, operational-neutral role separation, all block-safe slots, stable status IDs, explicit force-staging of both ignored evidence artifacts, and current counts.

## Knowledge Applied

- `component-tdd.md`: component-first RED → GREEN → REFACTOR.
- `test-quality.md`: deterministic, isolated, explicit, focused tests without waits or hidden assertions.
- `selector-resilience.md`: roles and visible labels over fragile class selectors.
- `data-factories.md`, Playwright/network fragments: reviewed and dispositioned N/A because the Story has no API, shared mutable state, route, or network behavior.
