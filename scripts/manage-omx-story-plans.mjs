#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const repoRoot = path.resolve(import.meta.dirname, '..')
const sourceRelative = '_bmad-output/planning-artifacts/epics-162-165-fe.md'
const sourcePath = path.join(repoRoot, sourceRelative)
const plansDir = path.join(repoRoot, '.omx/plans')

const storyConfig = {
  162.1: {
    files: ['git commit 4a24544d', 'PR #86', sourceRelative],
    steps: [
      'Treat the merged localhost cleanup as immutable baseline evidence; do not recreate or amend it.',
      'Confirm `main`, `origin/main`, the clean primary worktree, and the absence of leftover feature worktrees.',
      'Record the merge SHA and validation evidence in active planning/status artifacts.',
    ],
    verify: [
      'git status --short --branch',
      'git merge-base --is-ancestor 4a24544d origin/main',
      'git worktree list --porcelain',
      'git show --stat --oneline 4a24544d',
    ],
    risk: 'Do not rewrite, recommit, or force-clean the already merged baseline.',
  },
  162.2: {
    files: [
      'playwright.config.ts',
      'e2e/auth.setup.ts',
      'e2e/auth-manager.setup.ts',
      'e2e/fixtures/mutation-guard.ts',
      'e2e/README.md',
      '.env.e2e.example',
      'package.json',
      'scripts/',
    ],
    steps: [
      'Specify the localhost service, credential, auth-state, fixture, and mutation-policy preflight contract in executable tests.',
      'Implement one preflight entry point and wire it into the documented Playwright commands without exposing secrets.',
      'Exercise every success/failure branch and prove the default run remains read-only.',
    ],
    verify: [
      'node scripts/<e2e-preflight-script> --help',
      'npm run test:e2e -- --list',
      'npm run type-check',
      'npm run lint',
    ],
    risk: 'A preflight must fail closed without turning missing live services into a false test pass.',
  },
  162.3: {
    files: [
      'e2e/liquidity.spec.ts',
      'e2e/analytics/fbs-orders-analytics.spec.ts',
      'e2e/margin-analytics.spec.ts',
      'e2e/dashboard-metrics.spec.ts',
      'e2e/financial-summary.spec.ts',
      'e2e/unit-economics.spec.ts',
      'e2e/analytics/analytics-hub.spec.ts',
      'e2e/returns-analytics.spec.ts',
    ],
    steps: [
      'Lock the owned 52-site inventory with a static regression check.',
      'Replace each vacuous assertion with an explicit data, empty, loading, error, navigation, or interaction expectation.',
      'Run the owned specs against prepared localhost fixtures and record the `52 → 0` evidence.',
    ],
    verify: [
      'rg -n "expect\\([^\\n]*(\\|\\| true|>= 0)" e2e/liquidity.spec.ts e2e/analytics e2e/margin-analytics.spec.ts e2e/dashboard-metrics.spec.ts e2e/financial-summary.spec.ts e2e/unit-economics.spec.ts e2e/returns-analytics.spec.ts',
      'npx playwright test e2e/liquidity.spec.ts e2e/analytics/fbs-orders-analytics.spec.ts e2e/margin-analytics.spec.ts e2e/dashboard-metrics.spec.ts e2e/financial-summary.spec.ts e2e/unit-economics.spec.ts e2e/analytics/analytics-hub.spec.ts e2e/returns-analytics.spec.ts',
    ],
    risk: 'Optional data states must be asserted or explicitly skipped; absence must never be converted to success.',
  },
  162.4: {
    files: [
      'e2e/settings/backfill-admin.spec.ts',
      'e2e/backfill-page.spec.ts',
      'e2e/supply-planning.spec.ts',
      'e2e/supplies/',
      'e2e/cogs-assignment.spec.ts',
      'e2e/cogs-pages.spec.ts',
      'e2e/price-calculator.spec.ts',
    ],
    steps: [
      'Lock the owned 36-site inventory with a static regression check.',
      'Replace each operations/settings truth fallback with explicit fixture, visible-state, and request/response assertions.',
      'Run backfill, supplies, supply-planning, COGS, and calculator coverage and record `36 → 0`.',
    ],
    verify: [
      'rg -n "expect\\([^\\n]*(\\|\\| true|>= 0)" e2e/settings e2e/backfill-page.spec.ts e2e/supply-planning.spec.ts e2e/supplies e2e/cogs-assignment.spec.ts e2e/cogs-pages.spec.ts e2e/price-calculator.spec.ts',
      'npx playwright test e2e/settings/backfill-admin.spec.ts e2e/backfill-page.spec.ts e2e/supply-planning.spec.ts e2e/supplies e2e/cogs-assignment.spec.ts e2e/cogs-pages.spec.ts e2e/price-calculator.spec.ts',
    ],
    risk: 'Mutating paths remain behind the sandbox acknowledgement guard and require deterministic fixtures.',
  },
  162.5: {
    files: [
      'e2e/liquidity.spec.ts',
      'e2e/unit-economics.spec.ts',
      'e2e/unit-economics-waterfall.spec.ts',
    ],
    steps: [
      'Capture the 58 owned fixed waits and the observable state that replaces each wait.',
      'Use response predicates, locator state, and reduced-motion/stable-render signals with bounded diagnostics.',
      'Run repeated targeted localhost executions and record `58 → 0`, runtime, and retry behavior.',
    ],
    verify: [
      'rg -n "page\\.waitForTimeout\\(" e2e/liquidity.spec.ts e2e/unit-economics.spec.ts e2e/unit-economics-waterfall.spec.ts',
      'npx playwright test e2e/liquidity.spec.ts e2e/unit-economics.spec.ts e2e/unit-economics-waterfall.spec.ts --repeat-each=2',
    ],
    risk: 'Replacing sleeps with network-idle can couple independent requests; wait only for the state under test.',
  },
  162.6: {
    files: [
      'e2e/dashboard-*.spec.ts',
      'e2e/analytics/*.spec.ts',
      'e2e/margin-analytics.spec.ts',
      'e2e/financial-summary.spec.ts',
      'e2e/storage-analytics.spec.ts',
      'e2e/category-analytics.spec.ts',
      'e2e/brand-analytics.spec.ts',
      'e2e/forecast*.spec.ts',
      'e2e/merged-group-table-epic-37.spec.ts',
      'e2e/accessibility-merged-groups-epic-37.spec.ts',
      'e2e/period-selection-month-test.spec.ts',
    ],
    steps: [
      'Inventory the 67 owned waits by trigger and expected visible result.',
      'Replace them with request/route/locator state transitions without waiting for unrelated requests.',
      'Repeat the targeted suite and record `67 → 0`, runtime, and zero retry-only passes.',
    ],
    verify: [
      'rg -n "page\\.waitForTimeout\\(" e2e/dashboard-*.spec.ts e2e/analytics e2e/margin-analytics.spec.ts e2e/financial-summary.spec.ts e2e/storage-analytics.spec.ts e2e/category-analytics.spec.ts e2e/brand-analytics.spec.ts e2e/forecast*.spec.ts e2e/merged-group-table-epic-37.spec.ts e2e/accessibility-merged-groups-epic-37.spec.ts e2e/period-selection-month-test.spec.ts',
      'npx playwright test e2e/dashboard-*.spec.ts e2e/analytics e2e/margin-analytics.spec.ts e2e/financial-summary.spec.ts e2e/storage-analytics.spec.ts e2e/category-analytics.spec.ts e2e/brand-analytics.spec.ts e2e/forecast*.spec.ts e2e/merged-group-table-epic-37.spec.ts e2e/accessibility-merged-groups-epic-37.spec.ts e2e/period-selection-month-test.spec.ts --repeat-each=2',
    ],
    risk: 'Chart animation and independent dashboard requests need purpose-specific readiness signals.',
  },
  162.7: {
    files: [
      'e2e/supply-planning.spec.ts',
      'e2e/supplies/supplies-list.spec.ts',
      'e2e/supplies/supply-detail.spec.ts',
      'e2e/supplies/supply-lifecycle.spec.ts',
      'e2e/supplies/supplies-a11y.spec.ts',
      'e2e/fixtures/mutation-guard.ts',
    ],
    steps: [
      'Classify the 76 waits as read-only, mutation-response, or eventual-consistency synchronization.',
      'Replace them with bounded entity/state reconciliation and preserve the mutation guard.',
      'Repeat the five owned specs and record `76 → 0`, cleanup evidence, and last-observed state diagnostics.',
    ],
    verify: [
      'rg -n "page\\.waitForTimeout\\(" e2e/supply-planning.spec.ts e2e/supplies',
      'npx playwright test e2e/supply-planning.spec.ts e2e/supplies --repeat-each=2',
    ],
    risk: 'Eventual consistency requires bounded polling keyed to the created entity, never an unbounded loop.',
  },
  162.8: {
    files: [
      'e2e/pricing-page.spec.ts',
      'e2e/price-calculator*.spec.ts',
      'e2e/settings/backfill-admin.spec.ts',
      'e2e/settings/backfill-a11y.spec.ts',
      'e2e/backfill-page.spec.ts',
      'e2e/cogs-assignment.spec.ts',
      'e2e/login-dashboard.spec.ts',
      'e2e/onboarding.spec.ts',
      'e2e/orders-client-info.spec.ts',
    ],
    steps: [
      'Classify the remaining 46 waits by request, URL, auth storage, calculation, or visible terminal state.',
      'Replace each wait with the corresponding bounded application event.',
      'Run repeated targeted coverage and prove both owned `46 → 0` and repository-wide `247 → 0`.',
    ],
    verify: [
      'rg -n "page\\.waitForTimeout\\(" e2e',
      'npx playwright test e2e/pricing-page.spec.ts e2e/price-calculator.spec.ts e2e/price-calculator-visual.spec.ts e2e/settings/backfill-admin.spec.ts e2e/settings/backfill-a11y.spec.ts e2e/backfill-page.spec.ts e2e/cogs-assignment.spec.ts e2e/login-dashboard.spec.ts e2e/onboarding.spec.ts e2e/orders-client-info.spec.ts --repeat-each=2',
    ],
    risk: 'Authentication and mutation tests must use fresh storage state and the existing explicit safety gate.',
  },
  162.9: {
    files: ['e2e/**/*.spec.ts', 'e2e/fixtures/', 'scripts/', 'package.json'],
    steps: [
      'Generate a classified inventory of the 30 bare skips and identify critical-fixture failures.',
      'Replace every bare skip with condition plus reason, or with an asserted empty state; fail critical preflight prerequisites.',
      'Add a static regression check and prove mandatory smoke runs with zero unexplained skips.',
    ],
    verify: [
      'rg -n "test\\.skip\\(\\s*\\)" e2e',
      'npx playwright test --list',
      'npm run type-check',
      'npm run lint',
    ],
    risk: 'A reason string is insufficient when the scenario is critical; required fixtures must fail the run.',
  },
  '162.10': {
    files: [
      'playwright.config.ts',
      'e2e/mobile/',
      'e2e/auth.setup.ts',
      'src/app/(dashboard)/layout/MobileSidebarSheet.tsx',
      'src/components/custom/Sidebar.tsx',
      'src/components/custom/sidebar-navigation.ts',
      'e2e/README.md',
    ],
    steps: [
      'Define one supported device project and a bounded mobile critical-route test match.',
      'Implement mobile-specific navigation, table overflow, dialog/focus, and 44×44 target assertions.',
      'Run the mobile project through the same preflight and record device, viewport, endpoints, and skips.',
    ],
    verify: [
      'npx playwright test --project=mobile --list',
      'npx playwright test --project=mobile',
      'npm run type-check',
      'npm run lint',
    ],
    risk: 'Do not duplicate the desktop suite or reuse desktop-only selectors as mobile expectations.',
  },
  163.1: {
    files: [
      'src/app/(dashboard)/analytics/advertising/components/performance-table/SortableHeader.tsx',
      'src/app/(dashboard)/analytics/advertising/components/performance-table/PerformanceTableHeader.tsx',
      'src/app/(dashboard)/analytics/advertising/components/performance-table/performance-table-columns.tsx',
      'src/app/(dashboard)/analytics/advertising/components/performance-table/*test*',
    ],
    steps: [
      'Lock current pointer sorting and table state with component tests.',
      'Move activation to semantic buttons with Russian accessible names, focus styles, keyboard operation, and `aria-sort` on the owning header.',
      'Add component accessibility coverage and a localhost keyboard smoke.',
    ],
    verify: [
      'npm test -- --run src/app/\\(dashboard\\)/analytics/advertising/components/performance-table',
      'npx playwright test e2e/advertising-analytics-epic-36.spec.ts',
      'npm run type-check',
      'npm run lint',
    ],
    risk: 'Sorting callbacks must fire exactly once and retain current direction/order behavior.',
  },
  163.2: {
    files: [
      'src/app/(dashboard)/automation/canned-rules/page.tsx',
      'src/components/custom/automation/CannedRulesGallery.tsx',
      'src/lib/api/automation.ts',
      'src/hooks/useAutomation.ts',
      'src/types/automation.ts',
      'src/components/custom/sidebar-navigation.ts',
    ],
    steps: [
      'Confirm the delivered canned-rule and installed-rule list contracts and existing query-key patterns.',
      'Add installed-rule navigation and list states without disrupting canned-rule installation.',
      'Cover loading, empty, error, enabled/disabled, refresh, and route navigation states.',
    ],
    verify: [
      'npm test -- --run src/components/custom/automation src/lib/api/automation',
      'npm run type-check',
      'npm run lint',
      'npm run build',
    ],
    risk: 'Installed rules and canned templates are distinct resources and must not share ambiguous cache entries.',
  },
  163.3: {
    files: [
      'src/app/(dashboard)/automation/rules/[id]/',
      'src/lib/api/automation.ts',
      'src/hooks/useAutomation.ts',
      'src/types/automation.ts',
      'src/components/custom/automation/',
    ],
    steps: [
      'Lock GET/PATCH rule contracts, query keys, and invalidation behavior with API/hook tests.',
      'Implement editor loading, error, validation, enabled/safety messaging, save, and dirty-state behavior.',
      'Cover success/failure feedback, cache refresh, keyboard access, and graceful page isolation.',
    ],
    verify: [
      'npm test -- --run src/components/custom/automation src/lib/api/automation src/hooks',
      'npm run type-check',
      'npm run lint',
      'npm run build',
    ],
    risk: 'Price-writeback safety must be explicit and ambiguous or stale saves must be rejected.',
  },
  163.4: {
    files: [
      'src/lib/unit-economics-formatters.ts',
      'src/app/(dashboard)/analytics/unit-economics/components/UnitEconomicsMetricCard.tsx',
      'src/app/(dashboard)/analytics/unit-economics/components/UnitEconomicsSummaryCards.tsx',
      'src/app/(dashboard)/analytics/unit-economics/components/UnitEconomicsTableRow.tsx',
      'src/app/(dashboard)/analytics/unit-economics/components/unit-economics-table-utils.tsx',
      'src/lib/unit-economics-config.ts',
    ],
    steps: [
      'Add regression fixtures for positive, zero, null, undefined, and unavailable currency values.',
      'Centralize the approved currency display semantics through existing formatters/utilities and apply them to affected cards/rows.',
      'Verify visual, accessible, CSV/export, and sorting behavior remains semantically correct.',
    ],
    verify: [
      'npm test -- --run src/app/\\(dashboard\\)/analytics/unit-economics src/lib/unit-economics',
      'npx playwright test e2e/unit-economics.spec.ts',
      'npm run type-check',
      'npm run lint',
    ],
    risk: 'Falsy checks can collapse zero into missing; normalize the distinction before formatting.',
  },
  163.5: {
    files: [
      'src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/SkuAccuracyDetail.tsx',
      'src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/SkuAccuracyTable.tsx',
      'src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/sku-accuracy-helpers.ts',
      'src/types/ai/evaluations.ts',
    ],
    steps: [
      'Lock the existing `naiveBaseline` normalizer and zero/null behavior.',
      'Add a units-labeled baseline column distinct from Naive MAPE and preserve responsive access.',
      'Cover positive, zero, null, order, labels, and narrow viewport behavior.',
    ],
    verify: [
      'npm test -- --run src/app/\\(dashboard\\)/analytics/models/\\[id\\]/evaluations/sku-accuracy',
      'npx playwright test e2e/forecast-accuracy.spec.ts',
      'npm run type-check',
      'npm run lint',
    ],
    risk: 'The baseline is units, not currency or percentage; labels and formatting must preserve that scale.',
  },
  163.6: {
    files: [
      'src/components/custom/DashboardPeriodSelector.tsx',
      'src/components/custom/__tests__/DashboardPeriodSelector.test.tsx',
      'src/components/ui/radio-group.tsx',
      'src/contexts/dashboard-period-context.tsx',
      'e2e/dashboard-period.spec.ts',
      'e2e/period-selection-month-test.spec.ts',
    ],
    steps: [
      'Lock period context callbacks, retained selections, disabled/loading, and responsive behavior.',
      'Replace Tabs and hidden panels with the existing controlled RadioGroup and RadioGroupItem pattern; add no dependency.',
      'Verify pointer, arrow-key, accessible radio-group state, and absence of tab-panel semantics.',
    ],
    verify: [
      'npm test -- --run src/components/custom/__tests__/DashboardPeriodSelector.test.tsx',
      'npx playwright test e2e/dashboard-period.spec.ts e2e/period-selection-month-test.spec.ts',
      'npm run type-check',
      'npm run lint',
    ],
    risk: 'Keep RadioGroup controlled by the existing valid period type and preserve accessible labels while styling it as the compact week/month selector.',
  },
  164.1: {
    files: [
      'src/lib/api-interceptors.ts',
      'src/lib/api-client.ts',
      'src/lib/api-client.test.ts',
      'src/lib/__tests__/api-client.retry-after.test.ts',
      'src/lib/analytics/telegram-metrics-helpers.ts',
      'src/lib/logger.ts',
    ],
    steps: [
      'Enumerate every message, Retry-After, WB-token, Telegram, logging, and network suppression branch.',
      'Add direct table-driven unit tests around exported helpers plus focused ApiClient integration cases.',
      'Collect targeted branch coverage before running the full local quality gates.',
    ],
    verify: [
      'npm test -- --run src/lib/api-client.test.ts src/lib/__tests__/api-client.retry-after.test.ts src/lib/analytics',
      'npm run test:coverage -- --run src/lib/api-client.test.ts src/lib/__tests__/api-client.retry-after.test.ts',
      'npm run type-check',
      'npm run lint',
    ],
    risk: 'Mocks must not bypass the response/body/error shapes that define the real interceptor branches.',
  },
  164.2: {
    files: [
      'src/app/(dashboard)/analytics/fbs-enhanced/components/FbsRegionalDataSection.tsx',
      'src/app/(dashboard)/analytics/fbs-enhanced/components/__tests__/FbsRegionalDataSection.test.tsx',
      'package.json',
    ],
    steps: [
      'Confirm the installed Recharts tooltip content types and capture current tooltip behavior with tests.',
      'Introduce the narrowest typed adapter/normalizer and remove the production `as any` cast.',
      'Cover inactive, empty, malformed, null, zero, and populated payloads.',
    ],
    verify: [
      'npm test -- --run src/app/\\(dashboard\\)/analytics/fbs-enhanced/components/__tests__/FbsRegionalDataSection.test.tsx',
      'npm run type-check',
      'npm run lint',
    ],
    risk: 'Third-party payload types are broader than the app model; normalize at the boundary without leaking library internals.',
  },
  164.3: {
    files: [
      'src/lib/tariff-extraction-utils.ts',
      'src/lib/tariff-system-utils.ts',
      'src/lib/logistics-tariff-helpers.ts',
      'src/hooks/supply-tariffs-helpers.ts',
      'src/hooks/supply-tariffs-lookup.ts',
      'src/hooks/__tests__/supply-tariffs-helpers.test.ts',
      'src/hooks/__tests__/supply-tariffs-lookup.test.ts',
    ],
    steps: [
      'Lock tariff outputs and warning behavior with regression tests before removing stale markers.',
      'Replace obsolete stub commentary with current semantics and aggregate repeated fallback warnings.',
      'Add bounded signature-based deduplication tests while preserving direct-call warning behavior.',
    ],
    verify: [
      'rg -n "STUB FILE|TDD Red Phase|to be implemented" src',
      'npm test -- --run src/hooks/__tests__/supply-tariffs-helpers.test.ts src/hooks/__tests__/supply-tariffs-lookup.test.ts src/lib/__tests__/tariff-extraction-utils.test.ts',
      'npm run type-check',
      'npm run lint',
    ],
    risk: 'Deduplication must be bounded and resettable so materially changed fallback snapshots remain observable.',
  },
  164.4: {
    files: ['package.json', 'package-lock.json', 'eslint.config.js'],
    steps: [
      'Audit root React/React DOM declarations and record a clean zero-warning ESLint run.',
      'Regenerate package metadata with the pinned npm version and replace the 112-warning allowance with zero.',
      'Validate dependency tree, audit, lint, typecheck, tests, formatting, and build with no unrelated lockfile churn.',
    ],
    verify: [
      'npm ls react react-dom',
      'npm install --package-lock-only',
      'npm audit',
      'npm run lint',
      'npm run type-check',
      'npm run format:check',
      'npm test -- --run',
      'npm run build',
    ],
    risk: 'Lockfile regeneration can introduce unrelated churn; reject changes beyond the root metadata correction.',
  },
  165.1: {
    files: [
      '_bmad-output/planning-artifacts/epics-127-fe.md',
      '_bmad-output/implementation-artifacts/sprint-status.yaml',
      'docs/EPICS-AND-STORIES-TRACKER.md',
      'docs/FRONTEND-WORK-SUMMARY.md',
      'src/lib/api/buyout-daily.ts',
      'src/hooks/use-buyout-daily.ts',
      'src/lib/api/returns-daily.ts',
      'src/hooks/use-returns-daily.ts',
    ],
    steps: [
      'From the merged documentation-bootstrap base, independently verify the shipped buyout/returns clients, hooks, charts, integration, tests, and prepared status corrections; do not recreate the bootstrap edits.',
      'Create a non-empty story-owned closeout diff that records Story 165.1 as done with its PR evidence in the mutable sprint registry, tracker, and work summary without editing historical archives or immutable plan-generation metadata.',
      'Search for contradicted deferral claims and validate story/status consistency.',
    ],
    verify: [
      'rg -n "127\\.(1|2)|#210|#211|162\\.|163\\.|164\\.|165\\." _bmad-output/implementation-artifacts/sprint-status.yaml docs/EPICS-AND-STORIES-TRACKER.md docs/FRONTEND-WORK-SUMMARY.md',
      'npm run check:docs',
    ],
    risk: 'Status changes must cite source reality and preserve historical records that are explicitly archival.',
  },
  165.2: {
    files: [
      '_bmad-output/implementation-artifacts/sprint-status.yaml',
      'docs/EPICS-AND-STORIES-TRACKER.md',
      'docs/FRONTEND-WORK-SUMMARY.md',
      '.cursorrules',
      'CLAUDE.md',
      'SETUP.md',
      'BMAD-QUICK-START.md',
      'README.md',
      'TROUBLESHOOTING.md',
      'docs/VALIDATION-PLAN.md',
      'docs/ux/IMPLEMENTATION-TZ.md',
      'e2e/README.md',
      'scripts/.check-docs-baseline.txt',
      'scripts/check-doc-citations.sh',
    ],
    steps: [
      'From the merged Story 165.1 base, independently verify the prepared framework-version, port, local-only, validation-baseline, and pre-production corrections; do not recreate the bootstrap edits.',
      'Create a non-empty story-owned closeout diff that records Story 165.2 as done with its PR evidence in the mutable sprint registry, tracker, and work summary without changing immutable plan-generation metadata.',
      'Confirm obsolete PM2, Tier-0, production-certification, and CI-governance instructions remain absent without touching generated OpenWiki pages.',
      'Run citation/link validation and focused searches for stale versions, ports, and release assumptions.',
    ],
    verify: [
      'npm run check:docs',
      'rg -n "Next\\.js 14|localhost:3001|PM2|Tier-0|production certification" .cursorrules CLAUDE.md README.md TROUBLESHOOTING.md docs/VALIDATION-PLAN.md e2e/README.md',
      'node -p "require(\'./package.json\').dependencies.next"',
    ],
    risk: 'Generated OpenWiki content is intentionally handled by 165.3 and must not be hand-edited here.',
  },
  165.3: {
    files: ['.github/workflows/openwiki-update.yml', 'openwiki/', 'README.md', 'CLAUDE.md'],
    steps: [
      'Verify 165.1 and 165.2 source corrections are merged before starting generation.',
      'Run the configured OpenWiki generator in a clean isolated worktree with its required credential; never hand-edit generated pages.',
      'Review generated-only boundaries, links, framework/port/status truth, and record generator version/command.',
    ],
    verify: [
      'git diff --check',
      'npm run check:docs',
      'rg -n "Next\\.js 14|localhost:3001|PM2|Tier-0|cert:coverage:ci|test:tier0" openwiki',
    ],
    risk: 'If provider credentials or the generator runtime are unavailable, stop with a documented blocker and preserve the worktree.',
  },
  165.4: {
    files: [
      'src/lib/api/liquidity.ts',
      'src/hooks/useLiquidity.ts',
      'src/types/liquidity/distribution.ts',
      'src/app/(dashboard)/analytics/liquidity/',
      'src/mocks/handlers/liquidity-queries.ts',
      'e2e/liquidity.spec.ts',
    ],
    steps: [
      'Before creating an implementation worktree, capture a live non-empty multi-date daily-snapshot response and backend persistence/cadence evidence.',
      'If the gate passes, lock normalizer/hook/component behavior for populated, gaps, empty, malformed, and error states.',
      'Activate the independent trends section without synthesizing history or blanking current liquidity content.',
    ],
    verify: [
      'npm test -- --run src/lib/api/liquidity src/app/\\(dashboard\\)/analytics/liquidity',
      'npx playwright test e2e/liquidity.spec.ts',
      'npm run type-check',
      'npm run lint',
    ],
    risk: 'This plan is deferred; an empty endpoint or undocumented persistence is a hard stop, not permission to fabricate data.',
  },
  165.5: {
    files: [
      'src/lib/api/backfill.ts',
      'src/hooks/useBackfillAdmin.ts',
      'src/app/(dashboard)/settings/backfill/components/BackfillControlButtons.tsx',
      'src/app/(dashboard)/settings/backfill/use-backfill-handlers.ts',
      'src/app/(dashboard)/settings/backfill/__tests__/page.test.tsx',
      'e2e/settings/backfill-admin.spec.ts',
    ],
    steps: [
      'Before creating an implementation worktree, verify separate live report/analytics retry endpoints and their auth, idempotency, conflict, response, and failure contracts.',
      'If the gate passes, lock API/hook separation and independent loading/error/cache invalidation behavior.',
      'Add per-status controls and accessibility/E2E coverage without routing either action through the cabinet-wide retry endpoint.',
    ],
    verify: [
      'npm test -- --run src/app/\\(dashboard\\)/settings/backfill src/lib/api/backfill src/hooks/useBackfill.ts src/hooks/useBackfillAdmin.ts',
      'npx playwright test e2e/settings/backfill-admin.spec.ts',
      'npm run type-check',
      'npm run lint',
    ],
    risk: 'This plan is deferred; a single cabinet-wide retry endpoint cannot satisfy the contract.',
  },
}

function parseSource() {
  const source = fs.readFileSync(sourcePath, 'utf8')
  const metadata = new Map()
  for (const match of source.matchAll(/^\|\s*(\d+\.\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/gm)) {
    metadata.set(match[1], {
      dependencies: match[2].trim(),
      initialStatus: match[3].trim(),
    })
  }

  const headings = [...source.matchAll(/^### Story (\d+\.\d+): (.+)$/gm)]
  const stories = headings.map((match, index) => {
    const id = match[1]
    const title = match[2].trim()
    const start = match.index + match[0].length
    const end = index + 1 < headings.length ? headings[index + 1].index : source.length
    let block = source.slice(start, end)
    const epicBoundary = block.search(/^## Epic /m)
    if (epicBoundary >= 0) block = block.slice(0, epicBoundary)
    const marker = '**Acceptance Criteria:**'
    const markerIndex = block.indexOf(marker)
    if (markerIndex < 0) throw new Error(`Story ${id} has no acceptance criteria marker`)
    const userStory = block.slice(0, markerIndex).trim()
    const acceptanceCriteria = block.slice(markerIndex + marker.length).trim()
    const meta = metadata.get(id)
    if (!meta) throw new Error(`Story ${id} has no execution metadata`)
    return { id, title, userStory, acceptanceCriteria, ...meta }
  })

  return stories
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function planPath(story) {
  return path.join(plansDir, `story-${story.id.replace('.', '-')}-${slugify(story.title)}.md`)
}

function renderPlan(story) {
  const config = storyConfig[story.id]
  if (!config) throw new Error(`Missing plan configuration for ${story.id}`)
  const dependencyText = story.dependencies === 'None' ? 'None' : story.dependencies
  const gated = story.initialStatus === 'deferred'
  const completion = story.initialStatus.startsWith('done')
  const awaitingMerge = story.initialStatus.startsWith('review')

  return `# OMX Story Plan ${story.id}: ${story.title}

## Requirements Summary

${story.userStory}

- **Story ID:** ${story.id}
- **Epic:** ${story.id.split('.')[0]}-FE
- **Canonical source:** \`${sourceRelative}\`
- **Dependencies:** ${dependencyText}
- **Immutable \`initial_status\`:** ${story.initialStatus}
- **Execution unit:** one story, one feature branch, one disposable worktree, one PR

> \`initial_status\` is plan-generation metadata only. Read and update current lifecycle state in \`_bmad-output/implementation-artifacts/sprint-status.yaml\` and the durable orchestration manifest; never mutate this field during story closeout.

${completion ? '> This story is complete. The plan records merge evidence and must not recreate the already merged cleanup.' : gated ? '> Backend gate: do not create a feature branch/worktree until the dependency evidence in the acceptance criteria exists.' : awaitingMerge ? '> The documentation changes are prepared for review, but this story is not complete until its normal PR merge and cleanup evidence are recorded.' : '> Create the dedicated implementation story artifact before moving this backlog item to `ready-for-dev`.'}

## Concrete Scope

${config.files.map(file => `- \`${file}\``).join('\n')}

## Acceptance Criteria (canonical)

${story.acceptanceCriteria}

## Implementation Steps

1. Verify canonical dependency/immutable \`initial_status\` parity, read current lifecycle state from the sprint registry and durable manifest, and record the exact clean \`origin/main\` base SHA.${gated ? ' Stop before branch creation when the backend gate is absent.' : ''}
${config.steps.map((step, index) => `${index + 2}. ${step}`).join('\n')}
${config.steps.length + 2}. Run an independent review and verification pass; merge only through a normal PR after all acceptance criteria have evidence.
${config.steps.length + 3}. After merge proof, remove the clean story worktree and merged branches without force, prune worktree metadata, and audit the repository.${completion ? ' For this completed story, verify that cleanup already occurred.' : ''}

## Risks and Mitigations

- **Story-specific risk:** ${config.risk}
- **Cross-story contamination:** branch only after dependencies are merged; never auto-stash, reset, clean, or mix unrelated changes.
- **False completion:** retain the worktree on failure; a merged story with failed cleanup is \`cleanup_blocked\`, not complete.
- **Local-only scope:** validate against frontend \`localhost:3100\` and backend \`localhost:3000\`; do not deploy or add production/CI certification scope.

## Verification Steps

${config.verify.map(command => `- \`${command}\``).join('\n')}
- \`npm run format:check\`
- \`git diff --check\`
- Browser-facing acceptance criteria require a fresh localhost result; if credentials/services are unavailable, record the gap and do not claim those criteria passed.

## Completion Evidence

- Dependency gate and base SHA.
- Changed-file list limited to this story's scope.
- Targeted test output plus required typecheck/lint/format/build evidence.
- Independent \`code-reviewer\` findings and \`verifier\` verdict.
- Commit SHA, PR URL, merge SHA, and proof that the feature SHA is an ancestor of \`origin/main\`.
- Proof that the story worktree path is absent, the merged local branch is deleted, remote branch cleanup is reconciled, and \`git worktree prune\` completed.

## Stop Condition

${gated ? 'Remain `deferred` until the backend contract evidence is real. After activation, stop only when every canonical acceptance criterion and cleanup invariant is proven.' : completion ? `Stop after the existing merge and cleanup evidence is reconfirmed and all active status artifacts agree that Story ${story.id} is done.` : 'Stop only when every canonical acceptance criterion is evidenced, the PR is merged, and cleanup is verified; otherwise preserve the worktree and report the precise blocker.'}
`
}

function checkPlans(stories) {
  const errors = []
  const storyIds = stories.map(story => story.id)
  const uniqueStoryIds = new Set(storyIds)
  const configIds = Object.keys(storyConfig)
  const expectedConfigIds = [...uniqueStoryIds].sort()
  const actualConfigIds = [...configIds].sort()

  if (uniqueStoryIds.size !== storyIds.length)
    errors.push('BMad source contains duplicate story IDs')
  if (JSON.stringify(actualConfigIds) !== JSON.stringify(expectedConfigIds)) {
    errors.push(
      `Story/config key mismatch: source=[${expectedConfigIds.join(', ')}], configs=[${actualConfigIds.join(', ')}]`
    )
  }

  const expectedPaths = new Set(stories.map(story => planPath(story)))
  const actualPaths = fs
    .readdirSync(plansDir)
    .filter(name => /^story-(162|163|164|165)-\d+-.*\.md$/.test(name))
    .map(name => path.join(plansDir, name))

  for (const actualPath of actualPaths) {
    if (!expectedPaths.has(actualPath))
      errors.push(`Unexpected correlated plan: ${path.relative(repoRoot, actualPath)}`)
  }

  for (const story of stories) {
    const filePath = planPath(story)
    if (!fs.existsSync(filePath)) {
      errors.push(`Missing plan for ${story.id}: ${path.relative(repoRoot, filePath)}`)
      continue
    }
    const actual = fs.readFileSync(filePath, 'utf8')
    const expected = renderPlan(story)
    if (actual !== expected)
      errors.push(`${path.basename(filePath)} differs from renderPlan(story); run with --write`)
  }

  if (stories.length !== 25) errors.push(`Expected 25 BMad stories, found ${stories.length}`)
  if (configIds.length !== 25) errors.push(`Expected 25 plan configs, found ${configIds.length}`)

  if (errors.length > 0) {
    for (const error of errors) console.error(`ERROR: ${error}`)
    process.exitCode = 1
    return
  }
  console.log(
    `OK: ${stories.length} BMad stories have byte-exact one-to-one OMX plans and exact config parity.`
  )
}

const stories = parseSource()
if (process.argv.includes('--write')) {
  fs.mkdirSync(plansDir, { recursive: true })
  for (const story of stories) fs.writeFileSync(planPath(story), renderPlan(story))
  console.log(`Wrote ${stories.length} correlated OMX story plans.`)
}
checkPlans(stories)
