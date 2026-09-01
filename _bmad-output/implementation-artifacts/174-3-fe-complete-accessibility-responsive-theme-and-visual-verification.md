# Story 174.3-FE — Complete Accessibility, Responsive, Theme, and Visual Verification

**Status**: done — implementation and exact-worktree validation complete; immutable-SHA review gate closed via remediation 56b3a6c2; PR #374 merged (c5605a38); validation as of 2026-09-01; synced from stale review by Story 174.5 on 2026-09-02
**Plan**: `.omx/plans/174.3-complete-accessibility-responsive-theme-and-visual-verification.md`
**Branch**: `cdx/epic-174-story-3-inclusive-visual-verification`
**Worktree**: `/private/tmp/wb-repricer-fe-174-3-inclusive-visual-verification`
**Base SHA**: `0338e56e3baa8e8a6d9d570748488fe2dc7d7f59`

## Authoritative current delivery record — 2026-09-01

This section supersedes the historical implementation log below. Three independent
`REQUEST CHANGES`/`REJECT` reviews of commit
`82465fbf96f2319116c1cad101044e8004a52cc3` and the follow-up critic review of
`633f202bf91c55f376a4ef56765fc6f94cdaf390` were resolved by replacing inferred coverage with
executable owner-state reconciliation, closing the route-specific SKU-accuracy gap, making the
execution-manifest pipeline fail closed, moving SKU keyboard activation from repurposed native
table rows to named native buttons, and rerunning the complete exact-worktree validation ledger.
The later immutable candidate `7e41cc96fd7e6f6488a480b352f6ce15ec8fd8d5` was also rejected by
independent critic and code-review passes: the supplies table still exposed a focusable native row,
and the model-evaluation route incorrectly declared its rendered sorting and selection/actions
features N/A. Both findings are now closed by a real named detail button, a canonical fail-closed
focusable-row invariant, exact owner-test bindings, and an executed-feature regression pin.
Candidate `f8cbaba2f48ef3b59c0a8154626a237f24cc1276` was then rejected because the
now-unfocusable supply row still retained pointer-only `onClick` behavior and the ignored
  `.playwright-cli/` directory retained raw browser diagnostics. The row has no handler or pointer
  cursor now; its named detail button is the sole navigation action, and all ignored browser
diagnostics were deleted without reading their contents.
The same review also identified raw API-derived error text on the finance-history terminal state;
that route now renders stable localized recovery copy and its owner regression proves that hostile
internal detail is not exposed.
The final critic pass additionally found that surplus manifest entries were only indexed, not
rejected. Merge-ready validation now requires exact key-set equality with the canonical owner plus
default-route execution union, while recording mode remains explicitly partial. Focused negative
tests reject surplus stale, failed, skipped, nonexistent-source, obsolete-scenario, and unknown
entries.
Because this Story introduces novel
validator semantics, three fresh independent `APPROVE` reviews on one unchanged final commit remain
the immutable pre-merge gate. The final commit SHA, review verdicts, PR identity, merge commit, and
cleanup evidence are recorded in the PR lifecycle rather than embedded here; a commit cannot
truthfully contain its own final SHA.

### Actual expanded file manifest

The original three-file scope expanded only when the live matrix found concrete route-owner defects.
The generated exact scope register contains 424 files relative to the unchanged `origin/main` base;
it is the authoritative file-level inventory. The current delivery contains these principal groups:

- Story evidence runtime:
  `e2e/fixtures/story-174-3-visual-accessibility.ts`,
  `e2e/fixtures/story-174-3-surface-contracts.ts`,
  `e2e/shadcn-migration-visual-accessibility.spec.ts`, and this artifact.
- Liquidity:
  `src/app/(dashboard)/analytics/liquidity/page.tsx`,
  `components/LiquidityBenchmarks.tsx`, `LiquidityDistributionChart.tsx`,
  `LiquidityDistributionSummary.tsx`, `LiquidityTable.tsx`, `LiquidityTrendChart.tsx`,
  `LiquidityTrendSummary.tsx`, `components/__tests__/LiquidityChips.test.tsx`,
  `LiquidityDistributionChart.a11y.test.tsx`, and `LiquidityTrendChart.test.tsx`.
- Unit economics:
  `src/app/(dashboard)/analytics/unit-economics/components/UnitEconomicsHeader.tsx`,
  `UnitEconomicsTablePagination.tsx`, `UnitEconomicsWaterfall.tsx`,
  `UnitEconomicsWaterfallSummary.tsx`, and their three focused accessibility tests.
- Navigation/dashboard/tables:
  `src/components/custom/Sidebar.tsx`, `Sidebar.test.tsx`, `TopBrandsTable.tsx`,
  `TopProductsTable.tsx`, their table tests, both top-brand/top-product header components and tests,
  `dashboard/DailyBreakdownChart.tsx`, `dashboard/ExpenseStructurePieChart.tsx`, and both chart tests.
- P&L:
  `src/components/custom/pnl-waterfall/PnLRow.tsx`, `PnLSectionHeader.tsx`, `PnLWaterfall.tsx`,
  and `__tests__/semantic-tokens.test.tsx`.
- Route-owner fixes:
  `src/components/custom/orders/OrdersTable.tsx` and its test;
  `src/app/(dashboard)/dashboard/components/DashboardStatusStrip.tsx` and its test;
  `src/app/(dashboard)/cogs/history/CogsHistoryBreadcrumbs.tsx` and its test;
  `src/app/(dashboard)/automation/installed-rules/editor/InstalledRuleEditor.tsx` and its test.
- Model evaluation table semantics:
  `EvaluationsTable.tsx`, `SkuAccuracyTable.tsx`, and their focused unit/browser tests preserve
  native `<tr>`/cell roles, keep pointer-only row convenience, and expose keyboard navigation on
  named native detail buttons with propagation containment. The route inventory binds its rendered
  sorting and selection/actions features to the exact executable owner scenario rather than N/A.
- Supply-order table semantics:
  `src/components/custom/supplies/SupplyOrdersTable.tsx` and its focused test move pointer,
  Enter, and Space activation exclusively to a named shadcn `Button`; native rows have no handler,
  pointer cursor, interactive role, or non-negative `tabindex`.
- Dedicated browser/state closure:
  `e2e/story-174-3-dedicated-route-evidence.spec.ts`, exact Settings/Telegram/Shipment/SKU browser
  repairs, and fail-closed Story state/surface contract tests under `src/test/`.
- Responsive overlay and mutation recovery:
  Tax/Tariff/Telegram dialog geometry, FBS notification control stacking, exact fixture interception,
  explicit mutation retry policy, and focused regression tests.
- Route-owned table/chart accessibility:
  semantic captions, exact names, data alternatives, responsive chart frames, contrast-safe text,
  and focused accessibility tests across the changed analytics/dashboard/order surfaces.
- Repository validation infrastructure:
  the anti-pattern normalizer ratchet is lowered from 61 to 50, and
  `scripts/check-eslint-rules.sh` now resolves its own repository root in relocatable worktrees.

No backend, dependency, query-key, Playwright configuration, privacy guard, deployment, or unrelated
`automation/openwiki-*` file is changed. Hook changes are limited to the route-owned Tax/Tariff
mutation recovery contract and have focused regression coverage.

### Canonical route identity and state matrix

The fixture parses exactly 76 unique ledger routes. Its explicit identity distribution is:

```text
3 redirectors
70 static-h1
3 materialized-h1
0 generic fallback identities
```

The runner rejects a wrong settled pathname, a Next error overlay, a generic error/not-found heading,
a missing or duplicate visible `h1`, and an exact heading mismatch. `/`, `/login`, and `/register`
are explicit redirectors whose settled destinations are verified. The installed-rule editor owns the
stable `h1` `Редактор установленного правила`; the backend rule name is an `h2`.

All `76 × 12 = 912` route/state rows are materialized. Canonical owner declarations are parsed,
their `SC` clauses are expanded, owner-specific labels are normalized into the twelve-state Story
taxonomy, and every mapping retains its raw owner label and rationale:

```text
444 exact executed rows
468 explicit route-specific not-applicable rows
0 blocked rows
76 canonical Story-runner default rows
318 owner-unit executable rows
50 owner-browser executable rows
154 unique owner-unit sources
21 unique owner-browser sources
```

Each executed row records route, state, exact source, source SHA-256, literal scenario ID, line,
command, kind, and required result `passed`. Each N/A row records route, state, rationale,
declaration source/SHA/line, and stable declaration ID. The former title-token fallback was deleted:
absence of a substring can no longer become N/A, shared test titles cannot be assigned to another
route, and every declared executable scenario must resolve exactly once.

Exact executable bindings cover the previously disputed `/dashboard` refresh/empty/stale/partial
states and `/settings/tax` permission/pending states. Dashboard empty evidence proves the route `h1`,
named hero region, real empty KPI values, and absence of a false processing state.

Dedicated browser closure is complete:

```text
4 dedicated routes executed
0 dedicated browser gaps
```

The dedicated-route registry executes `/analytics/brand-share`, `/analytics/buyout`, `/orders/fbo`,
and `/analytics/models/[id]/evaluations/sku-accuracy` through the Story state-evidence runner. SKU
accuracy therefore has both exact loading/empty/error/not-found owner-unit evidence and
route-specific browser evidence, and all four executions are required in the committed manifest.

### Fail-closed execution-manifest pipeline

The shared Story manifest reader permits an empty initial manifest only for a true `ENOENT`. It
rejects malformed JSON, an invalid schema or runtime block, an invalid entries array, duplicate or
stale evidence, and malformed entry fields. Every entry must carry a 64-character SHA-256 source
hash, supported runner/result values, a non-empty command, an integer exit code, a valid timestamp,
and a non-negative duration. The manifest is serialized as stable pretty JSON, and focused tests
prove both the accepted schema and each fail-closed branch.

### Fail-closed overlay, table, and chart applicability

`STORY_174_3_SURFACE_CONTRACTS` materializes 76 route-specific contracts.

```text
overlays: 83 executed / 15 conditional route-specific N/A
tables: 42 executed / 21 conditional route-specific N/A
charts: 13 executed / 4 conditional route-specific N/A
table/chart features: 292 executed / 331 explicit N/A
```

- Modal overlay: `/dashboard` executes keyboard traversal, Enter and Space activation, focus entry,
  forward Tab and reverse Shift+Tab containment, 390px geometry, Escape close, and exact focus return
  in both themes.
- Non-modal overlay: `/analytics/funnel` executes named-trigger keyboard open, visible content,
  usable next focus, Escape close, and focus return without making an invalid modal-trap claim.
- Other routes carry a route-specific N/A declaration for an overlay open in the canonical default
  state and reference the route entry source.
- Every rendered table is exhaustively checked for a name/caption, semantic headers/data cells,
  primary identity column and values, finite/consistently aligned numeric values, named interactive
  actions, zero repurposed or focusable native rows, valid virtual row counts when present, and
  mobile containment or scroll strategy.
- Every rendered Recharts/canvas surface is exhaustively checked for an accessible title, a named
  exact semantic data alternative (not a visual legend alone), alternative headers/cells, legend
  meaning when rendered, responsive containment, and reduced-motion execution.
- Sorting, selection/actions, pagination, virtualization, chart period/units/series/tooltip precision,
  and empty-surface cases are typed conditional branches: presence executes the proof; exhaustive
  absence records route-specific N/A.

### RED → GREEN product defects

1. Sidebar destructive badge contrast: `text-white` → `text-destructive-foreground`.
2. P&L positive-highlight contrast: highlighted values use `text-foreground` while the plus sign and
   background preserve non-color meaning.
3. Dashboard status-strip contrast: text uses `text-foreground`; severity icons retain status color.
4. Orders table: exact name `Детализация по заказам`.
5. Unit-economics pagination: exact names for row count, previous, and next controls.
6. Unit-economics selector: invalid Tabs semantics replaced by a labelled native radiogroup.
7. Liquidity: `min-w-0`, bounded table scrolling, exact progressbar names, and complete chart data
   alternatives whose screen-reader headers and localized values expose `%` units for every trend
   series.
8. Dashboard/P&L/top-product/top-brand help triggers: exact accessible button names.
9. Dashboard product/brand tables: exact accessible table names.
10. COGS breadcrumbs: home link `Главная` and named breadcrumb navigation.
11. Installed-rule editor: stable route-owned `h1` in loading/error/not-found; dynamic name is `h2`.
12. Unit-economics, liquidity, dashboard expense, and dashboard daily charts: exact screen-reader-only
    tables exposing period/context, units, series, and formatted data.
13. Interactive native table rows: invalid `<tr role="button">` semantics were removed from pricing,
    elasticity, monitoring, supplies, top-products, and top-brands surfaces. Native rows/cells retain
    table semantics; real shadcn `Button` controls now own keyboard activation and `aria-expanded`,
    while pointer row activation remains behavior-compatible.
14. Unit-economics mode selector: native radio inputs replace the incomplete custom ARIA radio
    model, preserving one checked value and browser-owned arrow-key focus/selection behavior.
15. Liquidity and model tables: pointer-only full-row convenience behavior is restored without
    adding interactive roles or tab stops to native rows; nested links/buttons stop propagation and
    remain the sole keyboard controls.
16. Liquidity keyboard proof: the exact SKU disclosure and liquidation planner scenarios now use
    native keyboard activation only, without a synthetic click that could manufacture a pass.
17. Elasticity and completeness disclosures expose dynamic `Показать`/`Скрыть` action names that
    agree with `aria-expanded`, with collapsed and expanded regression coverage.
18. Acquiring period deep links retain their bounded ISO-date parsing while exposing the page-level
    `searchParams` prop as an explicit awaited `Promise`, satisfying the Next async-params guard.
19. Supply-order detail activation is owned exclusively by a descriptive native button
    (`Открыть заказ <id>`), with exact-once pointer/Enter/Space tests; the native row has no pointer
    handler, interactive styling, role, or tab stop.
20. Model-evaluation sorting and selection/actions are declared executed and pinned to their exact
     combined owner source/scenario; the aggregate is `292 executed / 331 explicit N/A` and fails closed if
     either interactive feature regresses to N/A.
21. Finance-history full-failure recovery renders stable Russian copy rather than arbitrary
    API-derived `error.message` content; its owner test rejects a hostile internal-detail fixture.
22. Merge-ready manifest indexing requires exact equality with the canonical execution union and
    rejects every surplus entry; partial recording validation is explicitly isolated from that gate.

No axe rule, threshold, exclusion, network guard, privacy guard, or route assertion was weakened.

### Width/theme/contrast/privacy contract

Every final route run covers light/dark at 320, 390, 768, 1024, 1280, and 1440 CSS pixels,
`prefers-reduced-motion: reduce`, and body-scoped WCAG 2 A/AA/2.2 AA axe at both 390px and 1280px.
The runner requires a nonzero measured contrast set for every route/theme/axe-width row and validates
every ratio against axe's applicable threshold. It also verifies route/surface geometry, computed
theme tokens, reading/heading order, table/chart semantics, and visible keyboard focus.

Authenticated screenshots, videos, traces, ARIA snapshots, and raw attachments remain prohibited.
Evidence is privacy-safe DOM/accessibility/geometry/computed-style data only. `e2e/.auth/user.json`,
`test-results/`, `playwright-report/`, and `.playwright-cli/` must be removed after final browser
validation without reading auth or retained browser-diagnostic contents.

### Operator-driven evidence review — 2026-09-01

The immutable manual ledger is
`e2e/fixtures/story-174-3/manual-evidence.ts`; its executable contract is
`src/test/story-174-3-manual-evidence-contract.test.ts`. It records route or representative risk
group, state/task, primary keyboard path, browser, viewport/theme, focus lifecycle, reading/data
meaning, operator, date, outcome, and exact gap reference. The operator is identified as a non-human
Codex App browser operator so these direct sessions cannot be confused with automated test results
or a human assistive-technology review.

- Chromium and Firefox: `/register` empty-submit keyboard paths passed at 390x900 and 1280x900;
  focus returned to the invalid email field and the form-level plus field-level Russian validation
  remained exposed in document order.
- Chromium and Firefox: `/dashboard` mobile navigation was reached through keyboard traversal,
  opened with Enter, contained forward Tab focus, closed with Escape, and returned focus to
  `Open menu` after the close lifecycle.
- Chromium dark theme: the dashboard retained its route `h1`, visible focus targets, and a semantic
  table named `Данные графика детализации по дням за неделю; единицы: рубли` with explicit rouble
  units for every financial series.
- WebKit: the Safari-engine proxy exposed the route heading, named regions, radio groups, chart
  description, and complete data table. Enter/Tab/Escape/focus return passed after explicit trigger
  focus. Native Tab traversal from the body boundary did not reach the header trigger in the local
  daemon, so the ledger records `ENV-WEBKIT-TAB` rather than claiming a Safari keyboard pass.
- Real VoiceOver/Safari, Windows NVDA/JAWS, and Android TalkBack were not executed and remain exact
  environment-capability records. Playwright WebKit is not called Safari or VoiceOver evidence.

The acceptance authority is the Story 174.3 AC together with the UX browser matrix: unavailable
environments must be recorded rather than silently claimed as passed. Those environment-only gaps
do not conceal a product defect. The Story plan's approved privacy-safe DOM/accessibility/geometry
baseline replaces prohibited persisted screenshots, but explicitly does not replace real AT.

- Keyboard-only: modal execution covers Enter, Space, Tab, Shift+Tab, Escape, and focus return;
  non-modal execution covers open, usable focus, Escape, and return.
- Focus lifecycle: no tested overlay leaves focus in a closed portal.
- Reading order: every settled route exposes exactly one route-specific visible `h1` before its first
  semantic data surface.
- Data meaning: tables expose names/identity/headers/actions; charts expose exact named alternatives;
  positive, negative, and status meaning is not conveyed by color alone.
- Responsive behavior: geometry is labelled at all six widths; tables/charts are rechecked at mobile
  and desktop axe widths.
- Theme behavior: computed root/body signatures must differ between light and dark while retaining
  the selected color scheme.

True browser-UI 200% zoom is executed on headed macOS Chromium through browser UI shortcuts. The
gate proves the doubled device-pixel ratio, reduced CSS viewport, absence of CSS root zoom, and
bounded geometry for all 76 routes in both themes. Operation with real
VoiceOver/NVDA/JAWS/TalkBack remains an explicit environment gap and is never reported as an
automated or operator-driven PASS.

### Final exact-worktree validation ledger

Pinned runtime: Node `v24.18.0`, npm `11.11.0`.

```text
Targeted Story state/surface/manifest-reader/manual-evidence contracts: 4 files, 51/51 tests passed
Focused supply-order/model-evaluation/finance-history regressions: 5 files, 126/126 tests passed
Full Vitest: 1,270 files, 19,355/19,355 tests passed
Canonical Story runner: 82 passed / 1 optional Manager skip / 0 failed
Owner browser regeneration: 368 passed / 22 accepted optional/live-data skips / 0 failed
Dedicated route/SKU evidence: 4 current-source executions / 0 gaps
Real browser-UI 200% zoom: all 76 routes × 2 themes passed; 4 harness tests passed / 1 optional Manager skip
Execution manifest: 770 passed entries (627 Vitest / 143 Playwright; includes 76 canonical defaults and 4 dedicated), 0 failed
Production build: PASS, TypeScript PASS, 70/70 pages generated
npm run lint: PASS, zero warnings/errors
npm run format:check: PASS across all src TypeScript/JSON/CSS sources
npx eslint on all changed E2E/scripts sources: PASS, zero warnings/errors
npm run type-check: PASS
npm run check:max-lines: PASS
npm run check:max-lines --self-test equivalent: 3/3 passed
npm run check:docs: PASS against the committed 95-entry / 427-citation baseline
npm run check:markers: PASS, zero violations
npm run check:lessons: PASS, 302 files / 96 lesson lines / zero violations
E2E assertion/wait/bare-skip, Next params, locale-percent, and policy guards: PASS
Anti-pattern-8 normalizer: PASS at the lowered 50-site baseline
ESLint rule registry: PASS, 2 configs; relocatability self-test: 8/8 passed
Privacy policy tests: 29/29 passed; repository scan: 3,634 text files / 0 findings
```

The canonical runner directly verifies all 76 route identities, 912 state dispositions, six widths
in both themes, reduced motion, axe/computed contrast at mobile and desktop widths, focus/reading
order, zero focusable native table rows, and applicable overlay/table/chart contracts. `measureComputedTextContrast`,
`computedContrastEvidence`, and `measuredContrastEvidence` remain required nonzero evidence; no axe
rule, threshold, exclusion, network guard, privacy guard, or route assertion was weakened.

### Immutable lifecycle record

The final reviewed commit SHA, three independent verdicts, PR number/head SHA, merge commit SHA,
branch/worktree cleanup, PM2 restoration, and final orphan/duplicate/listener audit are intentionally
recorded in the PR body and repository lifecycle evidence after this artifact is frozen. Embedding
those future identities here would require a post-review commit, invalidate the three same-SHA
reviews, and create a self-referential commit-hash cycle.

## Historical implementation log — superseded where it conflicts with the authoritative record above

The remaining sections preserve the original investigation chronology only. They are not current
completion claims, file manifests, gap counts, or final gate results.

## Historical prerequisites and ownership

- Story 174.1 merge `360c9cb93a2caa53084f4a34460abecc3217e5e9`: reachable from base.
- Story 174.2 merge `862d45a1e72656898c7b8bfbbbe96f89707b481a`: reachable from base.
- Final route-wave merge `2dfe56c1e159451eb048d8057f13ba6e0880c547` (Story 173.13): reachable from base.
- Canonical readiness at base: 91/94 Stories, Epic 174 = 2/5, Story 174.3 NEXT.
- All 76 route-ledger rows remain `planned`; Story 174.5 owns the final `verified` transition.

## Historical initial frozen file manifest — superseded

1. `e2e/shadcn-migration-visual-accessibility.spec.ts`
2. `e2e/fixtures/story-174-3-visual-accessibility.ts`
3. `_bmad-output/implementation-artifacts/174-3-fe-complete-accessibility-responsive-theme-and-visual-verification.md`

No product, shared foundation, API, hook, type, query-key, backend, dependency, Playwright-config,
privacy-guard, production, or deployment file is in the frozen manifest. A product/shared defect found
by the matrix is routed to its owner and requires explicit orchestration before any scope expansion.

## Historical evidence model — superseded

The route fixture parses the canonical route ledger and fails unless it resolves exactly 76 unique
Story/route/entry rows. Every row records a deterministic dynamic URL, applicable canonical states,
its unique implementation artifact, a live browser evidence input, and explicit dispositions for
privacy-safe visual evidence and real assistive technology.

The Story runner executes the stable live route surface through:

- light and dark themes;
- widths 320, 390, 768, 1024, 1280, and 1440 CSS pixels;
- `prefers-reduced-motion: reduce`;
- WCAG 2 A/AA/2.2 AA axe scans in both themes at 390px;
- document/surface overflow, computed foreground/background, theme substrate, and logical heading
  order checks;
- visible focus proof on the first applicable control in both themes;
- a 720 CSS-pixel reflow viewport with the established 200% CSS zoom proxy.

Route-owned implementation artifacts and the linked existing browser specs remain the evidence source
for loading/refresh/empty/filtered/error/stale/partial/permission/pending/partial-success/not-found
behavior and realistic Russian/domain fixtures. The consolidated runner does not replace or weaken
those owner regressions.

### Screenshot and real-AT disposition

Repository security deliberately denies `page.screenshot`, locator screenshots, snapshot matchers,
ARIA snapshots, `testInfo.attach`, and raw retained browser diagnostics. The privacy checker flags raw
browser capture. Story 174.3 therefore does not bypass the guard and does not retain authenticated
screenshots. It records the installed privacy-safe equivalent: route-labelled DOM geometry,
computed-theme/style evidence, axe results, focus, reading order, responsive containment, and reflow.

This evidence must not be described as a screenshot. True browser-UI zoom and VoiceOver/NVDA/JAWS/
TalkBack remain explicit manual environment gaps; the CSS zoom proxy and automated semantics are not
relabeled as real-browser zoom or real screen-reader proof.

## Historical baseline evidence

Pinned runtime:

```text
Node v24.18.0
npm 11.11.0
```

Fresh worktree dependency installation:

```text
npm ci: exit 0, 759 packages installed
prepare/husky printed a sandbox-only .git/config lock warning; install still completed successfully
```

Honest RED:

```text
npm run test:e2e:full -- e2e/shadcn-migration-visual-accessibility.spec.ts
preflight: PASS against localhost:3100/3000
Playwright: No tests found
exit 1
```

Existing mandatory comparator baseline:

```text
npm run test:e2e:full -- e2e/accessibility-merged-groups-epic-37.spec.ts
12 passed / 1 skipped (optional Manager credentials unavailable)
exit 0
```

## Historical validation and findings — superseded

### Harness finding and resolution

The first complete runner execution produced `7 passed / 73 failed / 1 skipped`. The failures were
matrix-harness defects rather than 73 product defects:

- axe was initially scoped to `main`, but redirect/loading surfaces without that landmark caused
  `No elements found for include in page Context`; the runner now selects the visible `main` surface
  when present and otherwise scans `body`;
- the heading-order probe initially treated every SVG icon as a data visualization; it now restricts
  the comparison surface to `table`, `[role="table"]`, and `[role="img"]`;
- direct `.dark` class mutation raced the application-owned `next-themes` provider and produced a
  mixed `#333333` foreground on `#0a0a0a` substrate. The final runner follows the established
  repository contract: persist `localStorage.theme`, reload, and assert the effective `<html>` class
  before collecting evidence. No product token or axe exclusion was changed;
- a generic analytics fallback initially masked the dedicated evidence source for
  `/analytics/orders` and two genuine dedicated-spec gaps. The final fixture maps orders to
  `e2e/analytics/fbs-orders-analytics.spec.ts`, removes the fallback so future omissions fail closed,
  and asserts the exact three-gap register.

The exact representative rerun covering `/`, `/login`, `/analytics`, `/analytics/time-period`, and
`/analytics/unit-economics` completed with `8 passed / 1 skipped / 0 failed`.

### Final pinned browser evidence

Executed with Node `v24.18.0` and npm `11.11.0` against the local frontend/backend preflight:

```text
npm run test:e2e:full -- e2e/shadcn-migration-visual-accessibility.spec.ts
80 passed / 1 skipped / 0 failed
optional Manager authentication was not configured
exit 0
```

The result comprises the registry assertion plus all 76 route rows, 912 route/theme/width observations
(`76 × 2 × 6`), and 152 WCAG 2 A/AA/2.2 AA axe scans (`76 × 2`) at 390px. Every route also ran
reduced-motion, document/surface containment, logical heading-order, applicable first-control focus,
in both themes, and the 200% CSS-zoom reflow proxy. Dynamic segments used only the synthetic Story IDs
declared in the fixture.

Mandatory comparator baseline on the unchanged shared/product surface:

```text
npm run test:e2e:full -- e2e/accessibility-merged-groups-epic-37.spec.ts
12 passed / 1 skipped / 0 failed
optional Manager authentication was not configured
exit 0
```

Two post-matrix rerun attempts cleared the local frontend/backend preflight but timed out in the
shared `e2e/auth.setup.ts` navigation before the nine comparator tests started (`2 passed`, `1`
optional Manager skip, `9 did not run`). The Story diff adds only this isolated runner, its fixture,
and this evidence record; it does not change auth, product, Playwright configuration, or the
comparator. The earlier pinned green comparator remains the valid regression evidence and the later
auth-runtime interruption is recorded explicitly rather than relabeled as a fresh PASS.

### Universal and policy validation

Pinned Node `v24.18.0` / npm `11.11.0` results:

- `npm run lint`: PASS, 0 warnings/errors under the configured `--max-warnings 0` gate;
- `npm run type-check`: PASS;
- `npm run check:max-lines`: PASS, source cap 200 and test cap 800;
- `npm run build`: PASS, Next.js 16.2.12 Turbopack, TypeScript PASS, 70/70 static pages; the first
  sandboxed attempt failed only because Turbopack was denied a local port, and the permitted retry
  completed successfully;
- `git diff --check`: PASS;
- exact-file Prettier and ESLint: PASS;
- `npm run check:docs`: PASS against the committed 95-entry / 427-citation baseline;
- `npm run check:markers`: PASS, 0 violations;
- `npm run check:lessons`: PASS, 301 files / 96 lesson lines / 0 violations;
- `npm run check:privacy`: repository-wide non-green baseline remains exactly two historical
  `raw-browser-capture` findings in `e2e/price-calculator-visual.spec.ts:280,306`. The generated
  `e2e/.auth/user.json` was removed after browser validation. Neither Story file introduces a privacy
  finding or bypasses the guard.

### Findings and honest gaps

- Final automated matrix: zero unresolved axe, overflow, heading-order, focus-smoke, theme, reduced-
  motion, or CSS-zoom-proxy failures across the 76 live route surfaces.
- `/analytics/brand-share`, `/analytics/buyout`, and `/orders/fbo` retain the historical absence of a
  dedicated route spec. The fixture records exact `*-spec-missing` dispositions, links the closest
  existing family/hub evidence source, and the consolidated runner directly covers all three live
  surfaces. These are explicit evidence-debt rows, not omitted routes.
- Route-owner artifacts and linked browser specs remain the state/fixture evidence for default,
  loading, refresh, empty, filtered-empty, error, stale, partial, permission, pending,
  partial-success, and not-found applicability. The consolidated runner does not claim to replay every
  owner fixture in one test process.
- True browser-UI 200% zoom and real VoiceOver/NVDA/JAWS/TalkBack operation remain explicit manual
  environment gaps. The automated CSS zoom proxy, axe, landmarks, heading order, and focus smoke are
  not relabeled as real assistive-technology evidence.
- No raw screenshot evidence exists because repository privacy policy forbids it; the Story records
  the privacy-safe DOM/computed-style equivalent only.

Pending independent adversarial review convergence, commit/PR/merge identities, canonical closeout
synchronization, and exact branch/worktree cleanup proof.
