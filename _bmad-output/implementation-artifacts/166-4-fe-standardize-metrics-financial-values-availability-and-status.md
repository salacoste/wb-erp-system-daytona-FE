# Story 166.4: Standardize Metrics, Financial Values, Availability, and Status

Status: done

## Story

As an owner, CFO, or operations manager,
I want values and statuses to carry consistent business meaning,
so that I can distinguish direction, availability, and required action.

## Outcome

Deliver a route-free, presentation-only product composition layer for metric groups, metric cards, financial and operational values, data availability, and status presentation. The layer must preserve Russian formatting, units, signs, precision access, caller-controlled comparison meaning, and distinct semantic roles without changing any route, query, calculation, API, token, primitive, or existing domain consumer.

## Acceptance Criteria

1. **The Story-owned product boundary is isolated and explicit**
   - **Given** Story 166.3 already owns `PageHeader`, `ContextBar`, its route-free example, product barrel, direct tests, and a deliberately explicit source-contract manifest,
   - **When** Story 166.4 is implemented,
   - **Then** the new product compositions and presentation helpers live only under `src/components/product/metrics/**`,
   - **And** `src/components/product/index.ts` receives only the minimal public exports for the new API,
   - **And** Story 166.4 adds its own source-contract test under `src/components/product/metrics/__tests__/**`, scanning an explicit Story-166.4-owned manifest,
   - **And** `src/components/product/__tests__/product-composition-source-contracts.test.ts` is not edited, expanded, bypassed, or made directory-wide,
   - **And** no existing route, domain component, formatter, status mapping, or metric consumer is migrated by this Story.

2. **Financial and operational values preserve established meaning**
   - **Given** RUB, percentage, percentage-point, date, ISO-week, quantity, duration, count, decimal, compact, large-negative, zero, nullish, and non-finite inputs,
   - **When** `FinancialValue` or a metric composition renders them,
   - **Then** Russian locale, currency/unit, sign, established rounding, tabular alignment, date/week semantics, and caller-provided precision remain correct,
   - **And** existing centralized formatters are reused read-only where their contract applies,
   - **And** compact display has an always-accessible full-value disclosure that is not tooltip-only,
   - **And** `0`, missing, unavailable, not calculated, stale, partial, and estimated remain distinct,
   - **And** nullish or non-finite input never becomes a fabricated zero.

3. **Direction and comparison remain explicit, accessible, and caller-owned**
   - **Given** positive, negative, neutral, and zero values or comparisons,
   - **When** direction is presented,
   - **Then** meaning is exposed through text plus sign, label, or icon and never through color alone,
   - **And** the caller can explicitly provide normal, inverted, neutral, or unknown comparison meaning,
   - **And** the product composition does not infer whether an increase or decrease is good, bad, profitable, healthy, or actionable,
   - **And** presentation helpers format supplied values but do not calculate deltas, comparison bases, sentiment, aggregates, or domain thresholds.

4. **Availability states remain distinct and non-color-dependent**
   - **Given** loading, available, missing, unavailable, not-calculated, stale, partial, estimated, restricted, and unknown data,
   - **When** `DataAvailability` or a containing metric renders the state,
   - **Then** each state has explicit readable text and the correct registered availability role,
   - **And** valid zero remains available data,
   - **And** partial or stale data may keep trustworthy supplied content visible while identifying its limitation,
   - **And** unavailable, restricted, and unknown are not represented as empty success or generic zero.

5. **Status meaning and semantic color roles do not collapse**
   - **Given** success, warning, error, information, pending, unknown, financial direction, availability, destructive action, primary interaction, and brand identity,
   - **When** `StatusBadge` or `StatusStrip` renders caller-supplied status information,
   - **Then** status uses readable text and optional iconography in addition to color,
   - **And** unknown status has an explicit neutral fallback,
   - **And** brand, primary, destructive, negative-financial, operational-error, availability, and unknown remain separate semantic roles even when their visual hues are related,
   - **And** backend-value mapping, domain labels, diagnostic policy, ordering, priority, and recovery actions remain caller/domain-owned.

6. **Metric hierarchy changes density, not meaning**
   - **Given** `MetricGroup` and `MetricCard` in hero, standard, compact, and dense presentations,
   - **When** they render realistic Russian labels, definitions, periods, units, comparisons, availability, status, help, and optional drill-down content,
   - **Then** variants change hierarchy, spacing, and density without changing value, state, direction, availability, or action meaning,
   - **And** values remain text with tabular numerals where appropriate,
   - **And** definitions and full precision are not available only through hover,
   - **And** supplied interactive content has explicit native action semantics and remains in caller/DOM order,
   - **And** the compositions remain readable without page-level horizontal overflow at required widths and 200% zoom.

7. **The shared layer stays presentation-only, dependency-neutral, and server-compatible**
   - **Given** merged Stories 166.1–166.3 provide semantic tokens, hardened primitives, `PageHeader`, and `ContextBar`,
   - **When** the new source is audited,
   - **Then** it consumes existing semantic tokens and installed primitives without raw palette values or a new dependency,
   - **And** it contains no API hooks, data fetching, query keys, URL/search state, navigation decisions, stores, backend types, calculations, response interpretation, polling, persistence, or route/domain knowledge,
   - **And** it does not add a client boundary unless a concrete Story-owned interaction requires one and the source-contract/review evidence justifies it,
   - **And** `package.json`, `package-lock.json`, tokens, primitives, formatters, calculations, routes, hooks, APIs, and backend/public contracts remain unchanged.

8. **RED, local validation, browser evidence, review, and Git lifecycle are complete**
   - **Given** Node `24.18.0`, npm `11.11.0`, base SHA `c73b6002ae32a3b458c114d9ec14c7d6ee72fc1d`, branch `cdx/epic-166-story-4-financial-status`, and worktree `/private/tmp/wb-fe-166-4-standardize-metrics-financial-values-avail`,
   - **When** the Story is completed,
   - **Then** direct tests first record genuine RED against absent or incomplete Story-owned modules/exports before production implementation,
   - **And** GREEN and REFACTOR preserve the full state/format/semantic matrix,
   - **And** targeted tests, locale/static checks, formatting, zero-warning lint, type-check, max-lines, build, complete Vitest, `git diff --check`, YAML parse, package/lock zero-diff, and exact scope audits pass,
   - **And** applicable real-browser evidence covers both themes, required widths, keyboard/focus, 200% zoom, reduced motion, realistic Russian content, large/negative/zero/missing/unavailable values, and non-color meaning,
   - **And** two fresh-context adversarial review passes leave no unresolved accepted High or Medium finding,
   - **And** the detailed commit, push, ready PR, merge to `main`, committed ignored Story artifact, remote/local branch deletion, exact worktree removal, and prune/absence evidence are recorded before Story 166.5 begins.

## Tasks / Subtasks

- [x] Task 1: Confirm prerequisites, ownership, and brownfield references (AC: 1, 7, 8)
  - [x] Record the exact base, branch, worktree, clean initial status, pinned toolchain, and worktree-local non-symlinked `node_modules` evidence.
  - [x] Prove Story 166.1 merge `5425914b79faf05e5f567cffe9cc2a8437b49f7b`, Story 166.2 merge `0d3e0879964f2d4792c5a03a0928f1f57d68eff1`, and Story 166.3 merge/base `c73b6002ae32a3b458c114d9ec14c7d6ee72fc1d` are ancestors of the Story base.
  - [x] Inventory existing metric, value, availability, status, and formatter implementations as read-only references; do not migrate their consumers.
  - [x] Record package/lockfile zero-diff and the exact Story-owned manifest before tests or production edits.

- [x] Task 2: Establish genuine RED contracts first (AC: 1–8)
  - [x] Add direct composition tests under `src/components/product/metrics/__tests__/**` for `MetricGroup`, `MetricCard`, `FinancialValue`, `DataAvailability`, `StatusBadge`, and `StatusStrip` before creating their production modules.
  - [x] Add parameterized formatting/state tests for RUB, percent, percentage points, dates, ISO weeks, quantities/units, compact/full precision, large negatives, zero, nullish/non-finite, missing, unavailable, not-calculated, stale, partial, estimated, warning, error, pending, success, and unknown.
  - [x] Add a separate Story 166.4 source-contract test with an explicit new-subtree manifest; assert minimal barrel exports without changing the Story 166.3 source contract.
  - [x] Run the targeted suite and retain the genuine failure output proving the missing Story-owned modules/exports; do not manufacture RED through unrelated failures.

- [x] Task 3: Implement value and availability presentation (AC: 2–4, 7)
  - [x] Implement `FinancialValue` with explicit format/unit/precision/compact/full-value and semantic-state inputs; reuse applicable centralized formatters without editing them.
  - [x] Keep direction/comparison meaning explicitly caller-controlled and separate from numeric sign/formatting.
  - [x] Implement `DataAvailability` with visible, non-color text for every declared availability state.
  - [x] Guarantee that zero, missing, unavailable, not-calculated, non-finite, stale, partial, estimated, restricted, and unknown cannot collapse through fallback behavior.

- [x] Task 4: Implement metric and status compositions (AC: 3–7)
  - [x] Implement `MetricGroup` and `MetricCard` with hero, standard, compact, and dense hierarchy variants, caller-provided definitions/context/actions, and no domain behavior.
  - [x] Implement `StatusBadge` and `StatusStrip` using distinct registered semantic roles, visible labels, optional icons/details/timestamps, and an explicit neutral unknown fallback.
  - [x] Use the merged semantic-token and primitive contracts; do not add raw application palette values, duplicated primitives, or domain-specific mappings.
  - [x] Export only the intentional public API through the local metrics barrel and `src/components/product/index.ts`.

- [x] Task 5: Reach GREEN, refactor, and prove source ownership (AC: 1–7)
  - [x] Run the targeted Story test matrix until all Story-owned behavior is GREEN.
  - [x] Refactor only within `src/components/product/metrics/**`; prefer deletion, shared presentation helpers, and existing utilities over parallel abstractions.
  - [x] Prove no route, API, query, store, calculation, formatter, token, primitive, package, or Story-166.3 source-contract ownership leaked into the new layer.
  - [x] Keep the explicit Story-owned source manifest narrow so future product compositions are not silently absorbed.

- [x] Task 6: Collect browser, accessibility, and local validation evidence (AC: 2–8)
  - [x] Use a temporary harness removed before staging, or another non-route production-free rendering path, for real-browser checks.
  - [x] Complete the browser/accessibility matrix below and record every unavailable environment as a gap rather than a pass.
  - [x] Run targeted tests first, then all exact local gates with the pinned toolchain; preserve full failure output and rerun affected checks after each fix.
  - [x] Complete YAML, dependency, exact-manifest, forbidden-surface, temporary-harness, and `git diff --check` audits.

- [x] Task 7: Complete two fresh reviews and Story evidence (AC: 1–8)
  - [x] Obtain a fresh-context adversarial review from an agent that did not author the implementation; resolve accepted findings and rerun affected checks.
  - [x] Obtain the mandatory second fresh-context adversarial pass; require no unresolved accepted High or Medium finding.
  - [x] Update Tasks/Subtasks, Dev Agent Record, evidence matrix, file list, change log, Story status, and sprint row to `review` only after implementation and applicable gates pass.

- [ ] Task 8: Complete the approved Git lifecycle and cleanup (AC: 8)
  - [ ] Force-stage this ignored Story artifact and stage only the reviewed explicit manifest; prove the artifact is tracked in the commit.
  - [ ] Create a detailed conventional commit, push the feature branch, open a ready non-draft PR, verify base/head/mergeability, and merge through GitHub without a direct or force push to `main`.
  - [ ] Update local `main` by fast-forward only and prove the merge SHA and Story artifact are present.
  - [ ] Delete the remote branch, remove the exact Story worktree, delete the local branch, prune/fetch-prune, and prove clean `main == origin/main` with no Story lane remaining.

## Dev Notes

### Delivery Record

- **Requirements:** FR20, FR22, FR23, FR25, FR33.
- **Route/User Value:** trustworthy metrics and status meaning across later route migrations; Story 166.4 owns no route.
- **Owned Surface:** product metric, financial-value, data-availability, status-badge/strip compositions and presentation-only helpers under `src/components/product/metrics/**`.
- **Shared Dependencies:** merged Stories 166.1–166.3; existing centralized formatters and hardened primitives are read-only dependencies.
- **Allowed Change Surface:** `src/components/product/metrics/**`; a minimal additive export edit to `src/components/product/index.ts`; direct Story tests/evidence; this Story artifact; and only the Story 166.4 sprint-status row.
- **Forbidden Shared Files:** `src/components/product/PageHeader.tsx`; `src/components/product/ContextBar.tsx`; `src/components/product/__tests__/PageContextCompositions.test.tsx`; `src/components/product/__tests__/product-composition-source-contracts.test.ts`; `src/components/product/examples/**`; `src/styles/globals.css`; `components.json`; Tailwind/PostCSS/compiler configuration; `src/components/ui/**`; `src/app/**`; AppShell/navigation; `src/hooks/**`; `src/lib/api/**`; API clients/query keys/stores/backend types; calculation/comparison/domain logic; `src/lib/formatters/**`; `src/lib/week-report-availability.ts`; `src/lib/week-report-utils.ts`; `src/lib/comparison-helpers.ts`; existing route/domain/custom metric and status components; `package.json`; `package-lock.json`; backend/public contracts; deployment/production systems; required CI gates.
- **State Coverage:** loading, positive, negative, neutral, zero, missing, unavailable, not-calculated, stale, partial, estimated, warning, error, information, pending, success, restricted, available, and unknown as applicable to each composition.
- **Responsive/Table/Chart Contract:** hero, standard, compact, and dense remain readable; values use tabular precision/alignment where applicable; table cells and charts adopt the API only in later owner Stories; no table/chart consumer changes occur here.
- **Accessibility Contract:** values remain text; units/sign/full precision remain accessible; direction, availability, and status are not color-only; hover/tooltip is never the only definition or precision path; native semantics and caller/DOM order are preserved.
- **Test and Visual Evidence:** RUB, percent, percentage-points, date, ISO-week, quantity/unit, compact/full, large-negative, zero, missing, non-finite, unavailable, not-calculated, stale, partial, estimated, restricted, success/warning/error/pending/unknown, long Russian content, themes, widths, zoom, keyboard/focus, and reduced-motion fixtures.
- **Local Validation:** targeted Vitest first; locale/static checks; format, lint, type-check, max-lines, build, full Vitest; browser evidence; YAML, dependency, exact-manifest, forbidden-import, temporary-harness, and diff audits.
- **Branch/Worktree Lifecycle:** `cdx/epic-166-story-4-financial-status` in `/private/tmp/wb-fe-166-4-standardize-metrics-financial-values-avail`, based exactly on `c73b6002ae32a3b458c114d9ec14c7d6ee72fc1d`.
- **Cleanup Evidence:** merge SHA on updated `main`; Story artifact in merge; remote/local branch absence; exact worktree absence; worktree prune; fetch-prune; clean primary checkout; `main == origin/main`; Story 166.5 not started before this proof.

### Exact Ownership Manifest

The final changed-file list must be a concrete subset of the following patterns. Every actual file must be enumerated in the Story evidence before staging.

**Owned production:**

- `src/components/product/metrics/**`
- `src/components/product/index.ts` — additive exports only; preserve existing Story 166.3 exports and behavior.

**Owned tests/evidence:**

- `src/components/product/metrics/__tests__/**`
- `_bmad-output/implementation-artifacts/166-4-fe-standardize-metrics-financial-values-availability-and-status.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Story 166.4 row only.

**Expected public modules:**

- `src/components/product/metrics/MetricGroup.tsx`
- `src/components/product/metrics/MetricCard.tsx`
- `src/components/product/metrics/FinancialValue.tsx`
- `src/components/product/metrics/DataAvailability.tsx`
- `src/components/product/metrics/StatusBadge.tsx`
- `src/components/product/metrics/StatusStrip.tsx`
- `src/components/product/metrics/index.ts`

Presentation-only types/helpers or a route-free example may be added only inside `src/components/product/metrics/**`, must have direct proof, and must appear in the final explicit manifest. Do not create a parallel primitive, formatter library, state engine, context provider, route, hook, API, store, or domain mapping.

### Product API and State Matrix

The exact TypeScript shapes may be refined during RED/GREEN, but the following ownership and semantics are invariant.

| Composition | Caller supplies | Composition owns | Composition must not own |
|---|---|---|---|
| `MetricGroup` | title/context, ordered metric children, optional description/action, density variant | semantic grouping, layout, responsive hierarchy | metric calculation, fetching, filtering, ordering by business priority, navigation |
| `MetricCard` | label, value node or controlled value props, definition, period/unit, comparison, availability/status, optional action, variant | card hierarchy, text/value slots, tabular presentation, responsive density | delta calculation, business sentiment, drill-down destination, query/URL state |
| `FinancialValue` | raw or already controlled value, declared format/unit/precision, display mode, explicit direction, availability, accessible full value when required | established Russian presentation, sign/unit retention, compact/full disclosure, semantic styling | business calculation, implicit good/bad inference, comparison basis, domain rounding changes |
| `DataAvailability` | explicit availability state, label/detail/freshness supplied or localized generic fallback | non-color state presentation and registered availability role | querying readiness, deciding completeness, calculating freshness, retry behavior |
| `StatusBadge` | explicit semantic role, readable label, optional icon/detail | compact non-color status presentation and neutral unknown fallback | backend enum mapping, domain priority, destructive action behavior, diagnostics policy |
| `StatusStrip` | ordered status content, readable summary/detail/timestamp, optional caller action | grouped status hierarchy, wrapping, semantic role presentation | alert aggregation, severity calculation, filtering, mutation, polling, recovery policy |

| State | Visible meaning | Semantic role | Required distinction |
|---|---|---|---|
| `loading` | Value/status is being obtained | neutral/pending presentation | Never fabricate `0` or success |
| `positive` | Explicit positive direction | `financial-positive` | Sign/label/icon plus color |
| `negative` | Explicit negative direction | `financial-negative` | Not destructive or operational error |
| `neutral` | No positive/negative direction | `financial-neutral` | Not unknown or missing |
| `zero` | Valid supplied numeric zero | caller-declared direction or neutral | Available data; not a placeholder |
| `missing` | No value supplied | availability-neutral/unknown treatment | Not zero, unavailable, or not calculated |
| `unavailable` | Data cannot currently be supplied | `availability-unavailable` | Not an empty success result |
| `not-calculated` | Required calculation has not produced a value | explicit availability text | Not zero or generic unavailable |
| `stale` | Supplied data is old | `availability-stale` | Trustworthy value may remain visible with limitation |
| `partial` | Supplied data covers only part of scope | `availability-partial` | Preserve valid subset and name limitation |
| `estimated` | Supplied value is an estimate | explicit availability text | Not exact/available without qualification |
| `restricted` | Data/action is permission-restricted | `availability-restricted` | Not missing or unavailable |
| `available` | Supplied value is available | `availability-available` | Zero remains valid |
| `warning` | Attention is required | `status-warning` | Not operational error or negative financial |
| `error` | Operational failure/error state | `status-error` | Not destructive action or negative financial |
| `information` | Informational state | `status-information` | Not primary interaction/brand |
| `pending` | Operation or state is pending | `status-pending` | Not loading unless caller declares loading |
| `success` | Operation/state succeeded | `status-success` | Not financial-positive by inference |
| `unknown` | No registered mapping/meaning is known | `availability-unknown` or neutral status fallback by component contract | Explicit text; never guessed from color/value |

### Formatting and Reuse Guardrails

- Reuse read-only exports from `src/lib/formatters/index.ts` when their existing behavior matches the declared format: `formatCurrency`, `formatCurrencyCompact`, `formatPercentage`, `formatPercentageInt`, `formatPercentagePoints`, `formatNumber`, `formatDecimal`, `formatRoas`, `formatDate`, `formatDateTime`, and `formatIsoWeek`.
- Do not edit centralized formatters or silently reinterpret their inputs. For example, percentage helpers accept percentage units, not fractions; `formatPercentagePoints` is distinct from percent; ISO weeks use ISO week-year semantics; displayed timestamps use the established project timezone where the existing formatter specifies it.
- Full precision may be supplied by the caller when centralized display formatting intentionally rounds. Do not present rounded or compact text as the only accessible value.
- Preserve a negative sign independently of semantic sentiment. A negative expense or variance may be caller-classified differently; the composition must not decide.
- Reject or explicitly present non-finite values as missing/unknown according to caller contract; never let `NaN` or infinity render as a plausible number or zero.

### Source-Contract Guardrails

- Add a new Story 166.4 source-contract test under `src/components/product/metrics/__tests__/**` with an explicit list of new production files.
- Do not modify `src/components/product/__tests__/product-composition-source-contracts.test.ts`; its manifest intentionally remains limited to Story 166.3 files.
- Permit only presentation-safe imports already present in the repository. Reject APIs, hooks, query/store/navigation modules, routes, calculations, backend/domain types, raw colors/palette utilities, visual CSS reordering, and new client boundaries without evidence.
- Verify `src/components/product/index.ts` still exports all Story 166.3 APIs and only adds the intentional Story 166.4 public surface.
- Source tests supplement direct behavior and browser evidence; class-string assertions alone do not prove accessibility, reflow, focus, or non-color meaning.

### Browser and Accessibility Matrix

Use realistic fixtures containing long Russian labels, `1 234 567,89 ₽`, compact million values with accessible full disclosure, `−9 876 543,21 ₽`, `0 ₽`, `15,5 %`, `−2,0 п.п.`, dates, ISO weeks, quantities/units, nullish/non-finite inputs, and every declared state.

| Dimension | Required evidence |
|---|---|
| Widths | `320px`, `390px`, `768px`, `1024px`, `1280px`, and `1440px` or wider; no page-level overflow, clipping, or meaning loss |
| Zoom/reflow | 200% zoom or equivalent reflow at representative desktop widths; full value, unit, definition, status, and action remain reachable |
| Themes | Light and dark semantic roles; raw palette absence; visible focus and readable text in both |
| Keyboard | Caller-provided actions remain native, named, focus-visible, and in DOM/task order; no hover-only required content |
| Screen reader semantics | Text preserves sign/unit/state; groups/cards have appropriate headings or labels; status text is present; compact full precision is available without tooltip dependence |
| Motion | Reduced motion removes non-essential animation without removing loading/pending/status meaning |
| Browser coverage | Chromium and Firefox keyboard/render checks; Safari/VoiceOver on macOS where available; Edge and NVDA/Windows recorded as pass or explicit environment gap |
| Automated accessibility | Component assertions and applicable axe scan supplement manual reading-order, data-meaning, zoom, and keyboard review |

Any temporary browser harness must be outside the final manifest or deleted before staging. This Story owns no route and must not add a production route solely for screenshots.

### Validation Contract

Run from the Story worktree with:

```bash
PATH=/private/tmp/wb-fe-166-4-toolchain/npm-11.11.0/bin:/private/tmp/wb-fe-166-4-toolchain/node-v24.18.0-darwin-arm64/bin:$PATH
```

Run the smallest Story-owned RED/GREEN suite first. Use the final actual test paths in the evidence record, then run:

```bash
npm run format:check
npm run lint
npm run type-check
npm run check:max-lines
npm run build
npm test -- --run
git diff --check
```

Also record:

- `node --version` = `v24.18.0` and `npm --version` = `11.11.0`;
- YAML parse/format success for `sprint-status.yaml`;
- `package.json` and `package-lock.json` zero diff against the base;
- exact `git status --short` and changed-file manifest;
- no changes under every Forbidden Shared Files path;
- no route/API/hook/query/store/navigation/calculation/domain import or ownership in the new subtree;
- no raw palette, token, primitive, compiler, or dependency change;
- no temporary harness or generated evidence accidentally staged;
- Story artifact presence despite `_bmad-output/` ignore rules.

No GitHub Actions status is a completion prerequisite. Local validation is authoritative. An unavailable environment-specific check is recorded as a gap with next-best evidence; it is never reported as passed.

### Review Contract

- Review pass 1 and pass 2 must use fresh contexts that did not author the implementation.
- Record every finding with severity, disposition, owner, fix or rejection rationale, and affected rerun evidence.
- Resolve all accepted High and Medium findings before integration. Rerun targeted checks after each fix and the complete applicable gates after final fixes.
- Final review must recheck exact scope, `0 !== missing`, non-finite fallback, compact/full precision, non-color direction/status, semantic-role separation, server compatibility, source-contract ownership, and package/lock zero-diff.

### Exact Git Lifecycle and Cleanup

Before staging, compare the explicit changed-file manifest with the Allowed Change Surface. Force-stage the ignored Story artifact and stage only approved files:

```bash
git add -f _bmad-output/implementation-artifacts/166-4-fe-standardize-metrics-financial-values-availability-and-status.md
git add -f _bmad-output/test-artifacts/atdd-checklist-166.4.md
git add -- _bmad-output/implementation-artifacts/sprint-status.yaml src/components/product/index.ts src/components/product/metrics
git diff --cached --check
git diff --cached --name-status
git ls-files --error-unmatch _bmad-output/implementation-artifacts/166-4-fe-standardize-metrics-financial-values-availability-and-status.md
git ls-files --error-unmatch _bmad-output/test-artifacts/atdd-checklist-166.4.md
```

Create a detailed conventional commit that classifies the change and describes implementation, preserved semantics, tests, review, and evidence. Do not mention the orchestration tool in commit text. Push only the feature branch, open a ready non-draft PR targeting `main`, verify base/head/mergeability and manifest, then merge through GitHub. Do not push directly to `main`, force-push, deploy, or introduce a required CI gate.

After the PR is merged:

1. Resolve and record the merge SHA; update primary `main` using `pull --ff-only origin main`.
2. Prove the merge SHA is an ancestor of `main` and the dedicated Story artifact exists in the merge.
3. Delete `origin/cdx/epic-166-story-4-financial-status`.
4. Remove `/private/tmp/wb-fe-166-4-standardize-metrics-financial-values-avail` without force.
5. Delete the local feature branch; run `git worktree prune` and fetch-prune.
6. Prove the exact worktree path is absent from disk and `git worktree list`, both local and remote branches are absent, the primary checkout is clean, and local `main` equals `origin/main`.
7. Start Story 166.5 only after all cleanup evidence passes.

### Previous Story Intelligence

- Story 166.1 merged the CSS-first semantic roles at `5425914b79faf05e5f567cffe9cc2a8437b49f7b`; consume `financial-*`, `status-*`, and `availability-*` roles without editing or duplicating them.
- Story 166.2 merged hardened primitives at `0d3e0879964f2d4792c5a03a0928f1f57d68eff1`; preserve their accessibility and compatibility contracts and add no dependency.
- Story 166.3 merged at `c73b6002ae32a3b458c114d9ec14c7d6ee72fc1d`; reuse its canonical `src/components/product/**` boundary and barrel while leaving `PageHeader`, `ContextBar`, their tests/example, and their explicit source-contract manifest unchanged.
- Story 166.3 proved that honest RED must expose real base/preliminary defects; direct tests and browser evidence must complement static source checks; two fresh reviews require post-fix reruns; ignored Story artifacts require force-staging; and completion includes ready PR, merge, remote/local branch deletion, exact worktree removal, and prune proof.
- The Story 166.3 source-contract lesson is binding: permanent source guards enumerate the owning Story's files rather than absorbing an entire future shared directory.
- Use worktree-local dependencies. An external `node_modules` symlink breaks Next/Turbopack filesystem-root checks.

### Authoritative References

- [Source: `.omx/plans/166.4-standardize-metrics-financial-values-availability-and-status.md`]
- [Source: `.omx/plans/shadcn-full-ui-migration-master.md`]
- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md#Universal-Story-Delivery-Contract`]
- [Source: `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md#Story-1664-Standardize-Metrics-Financial-Values-Availability-and-Status`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#MetricGroup-and-MetricCard`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#FinancialValue-and-DataAvailability`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#StatusBadge-and-StatusStrip`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Status-Color-and-Data-Meaning-Patterns`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Responsive-Design-and-Accessibility`]
- [Source: `_bmad-output/planning-artifacts/shadcn-route-ledger.md`]
- [Source: `_bmad-output/implementation-artifacts/166-1-fe-establish-the-tailwind-v4-semantic-token-and-compiler-contract.md`]
- [Source: `_bmad-output/implementation-artifacts/166-2-fe-harden-the-existing-shadcn-primitive-layer.md`]
- [Source: `_bmad-output/implementation-artifacts/166-3-fe-deliver-pageheader-and-contextbar-compositions.md`]
- [Source: `package.json`]

## Dev Agent Record

### Agent Model Used

GPT-5.6

### Implementation Plan

- Establish direct RED contracts for the public API, complete value/state matrix, explicit semantic meaning, source ownership, and forbidden-surface boundaries.
- Implement the isolated metrics subtree to GREEN using existing tokens, primitives, utilities, and centralized formatters; keep comparison and domain meaning caller-owned.
- Refactor only after GREEN, then collect targeted, universal, browser, accessibility, exact-scope, two-pass review, Git, merge, and cleanup evidence.

### Debug Log References

- Story base: `c73b6002ae32a3b458c114d9ec14c7d6ee72fc1d`.
- Branch: `cdx/epic-166-story-4-financial-status`.
- Worktree: `/private/tmp/wb-fe-166-4-standardize-metrics-financial-values-avail`.
- Prerequisites: Story 166.1 `5425914b79faf05e5f567cffe9cc2a8437b49f7b`; Story 166.2 `0d3e0879964f2d4792c5a03a0928f1f57d68eff1`; Story 166.3/base `c73b6002ae32a3b458c114d9ec14c7d6ee72fc1d`.
- Story artifact created and lifecycle status transitioned to `ready-for-dev` on 2026-08-12.
- Story implementation started on 2026-08-12; lifecycle status transitioned to `in-progress` before the test-only RED lane began.
- Genuine RED evidence: `npm test -- --run src/components/product/metrics/__tests__` exited `1`; three behavior suites failed on absent Story-owned imports and all four source-contract assertions failed on the absent explicit manifest/barrel export. Production source was still untouched.
- Toolchain: Node `v24.18.0`, npm `11.11.0`; worktree-local `node_modules` exists and is not a symlink.
- Final focused GREEN: 4/4 files and 81/81 parameter-expanded tests passed; eleven `@ts-expect-error` assertions prove illegal state/format/display combinations remain structural type failures.
- Final local gates: repository TypeScript, zero-warning ESLint, ESLint-rule audit, locale-percent baseline, project-wide Prettier, max-lines, `git diff --check`, YAML parse, dependency zero-diff, exact production manifest, forbidden-surface audit, and Next production build with 70/70 generated static pages passed.
- Final complete Vitest: 1107/1107 files and 18142/18142 tests passed with the pinned toolchain outside the sandbox.
- The initial full browser matrix covered Chromium, Firefox, and WebKit at 320, 390, 768, 1024, 1280, and 1440 CSS pixels plus 640/720 reflow equivalents for 1280/1440 at 200%; no page or descendant overflow remained.
- Browser semantics covered Russian RUB/percent/percentage-points/quantity/duration/Moscow date-time/ISO-week content; zero/missing/unavailable/not-calculated/stale/partial/estimated/restricted/unknown; negative/large values; native precision/status disclosures; keyboard/focus; caller actions; light/dark themes; and reduced motion.
- Initial axe found two Story-owned contrast defects (`success` 4.48:1 and `warning` 4.22:1). Opaque semantic status presentation fixed them; final WCAG A/AA/2.1 AA scans were zero-violation in the tested engines and themes.
- Post-Pass-2 Chrome smoke at 320 and 720 CSS pixels proved no overflow, explicit `filtered-out`, neutral direction without sign loss, operational `status-neutral` without financial classes, zero invalid `p div`/`span div` nesting, Enter/Space disclosure operation, and zero axe violations in light/dark.
- Browser gaps recorded honestly: real Safari with VoiceOver, Microsoft Edge, and Windows/NVDA were unavailable; WebKit is automated Safari-equivalent evidence, not a claim that real Safari/VoiceOver passed.
- Temporary browser routes, empty harness directories, `.playwright-cli`, and live sessions/server were removed; base-relative `src/app` diff is empty and `playwright-cli list --json` reports zero browsers.
- Adversarial Pass 1 reported 2 High, 6 Medium, and 1 Low findings. All accepted production/test findings were resolved and the affected focused/static/browser gates were rerun.
- Adversarial Pass 2 reported 1 High, 4 Medium, and 2 Low findings. All accepted code/test/evidence findings were resolved; zero accepted High or Medium finding remains open.

### Completion Notes List

- Added canonical route-free `MetricGroup`, `MetricCard`, `FinancialValue`, `DataAvailability`, `StatusBadge`, and `StatusStrip` compositions plus an explicit presentation metadata layer and public barrel.
- Preserved established Russian formatters, units, signs, valid zero, full-precision native disclosure, explicit filtered/missing/unavailable/quality states, caller-owned financial direction/comparison sentiment, and readable non-color status meaning.
- Kept the layer server-compatible and presentation-only: no client boundary, callbacks, API/query/store/route ownership, calculations, domain mapping, package/token/primitive/formatter changes, or existing-consumer migration.
- Added a complete direct/type/source-contract matrix, responsive browser/keyboard/theme/reduced-motion/axe evidence, and two fresh adversarial reviews with every accepted High/Medium finding resolved.
- Story implementation is ready for the approved commit/ready-PR/merge/cleanup lifecycle; those irreversible-by-state steps remain explicitly unchecked until their evidence exists.

### Post-1st-pass-review fixes (2026-08-12)

- **High:** made the collapsed `StatusStrip` expose caller-controlled readable status text and icon; made compact values structurally require accessible full precision.
- **Medium:** added explicit unknown comparison sentiment; stopped synthesizing comparison signs; made variants own complete header/content/value density; allowed long actions to wrap; removed the duplicate availability channel; coupled numeric/temporal models and formats; and asserted exact production-manifest equality.
- **Low/evidence:** retained Story/ATDD completion as pending until all implementation, browser, review, and validation evidence became current.
- Reruns: focused suite increased from 70 to 74 tests, repository type-check/lint/max-lines/Prettier/diff/build passed, and the full browser/axe matrix completed.

### Post-2nd-pass-review fixes (2026-08-12)

- **High:** added canonical `filtered-out` as a distinct readable and machine-identifiable availability/value state.
- **Medium:** restricted compact typing to currency/duration formats with actual compact renderers; separated operational neutral from financial roles; changed arbitrary `ReactNode` slot containers, including `StatusStrip` timestamp/action, to block-safe elements; and refreshed Story evidence/File List.
- **Low:** required stable `StatusStripItem.id` keys and reconciled the ATDD test/directive counts.
- Added regressions for unsupported compact pairs, compact duration, caller-owned direction, all block-slot DOM validity paths, neutral semantic-family separation, filtered-out distinction, and stable status identity.
- Final recheck follow-up also corrected the exact Git lifecycle to force-stage and prove both ignored Story and ATDD artifacts rather than silently omit test evidence.

### Evidence Matrix

| Dimension | Result | Evidence |
|---|---|---|
| Story context and ownership | pass | Dedicated artifact defines exact base/branch/worktree, prerequisite proof, isolated `metrics/**` ownership, separate source contract, and explicit forbidden surfaces. |
| Implementation and RED/GREEN/REFACTOR | pass | Genuine absent-module RED preceded eight production files; final four-file suite is 81/81 with eleven type-negative assertions and exact manifest coverage. |
| Browser/accessibility matrix | pass-with-recorded-gaps | Chromium/Firefox/WebKit widths, reflow, keyboard/focus, themes, reduced motion, realistic Russian/state fixtures, and final zero-violation axe passed; real Safari/VoiceOver and Edge/NVDA remain unavailable gaps. |
| Local validation | pass | Pinned focused 81/81, type-check, zero-warning lint, ESLint-rule/locale checks, project-wide Prettier, max-lines, diff/YAML/dependency/scope audits, build 70/70, and full Vitest 18142/18142 passed. |
| Independent review passes | pass | Pass 1 (2H/6M/1L) and Pass 2 (1H/4M/2L) were fresh-context reviews; all accepted findings were fixed and affected gates rerun. |
| Git/PR/merge/cleanup | pending | Commit, ready PR, merge, branch/worktree removal, and absence proof required. |

### File List

- `_bmad-output/implementation-artifacts/166-4-fe-standardize-metrics-financial-values-availability-and-status.md` (Story contract; created)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Story 166.4 lifecycle row; updated)
- `_bmad-output/test-artifacts/atdd-checklist-166.4.md` (ATDD strategy and genuine RED evidence)
- `src/components/product/index.ts` (minimal additive metrics barrel export)
- `src/components/product/metrics/DataAvailability.tsx` (readable availability presentation)
- `src/components/product/metrics/FinancialValue.tsx` (typed value/format and full-precision presentation)
- `src/components/product/metrics/MetricCard.tsx` (metric states, comparison, hierarchy, and slots)
- `src/components/product/metrics/MetricGroup.tsx` (responsive metric grouping)
- `src/components/product/metrics/StatusBadge.tsx` (readable operational status presentation)
- `src/components/product/metrics/StatusStrip.tsx` (ordered native status disclosure)
- `src/components/product/metrics/index.ts` (intentional metrics public API)
- `src/components/product/metrics/presentation.ts` (availability, direction, status, and variant metadata)
- `src/components/product/metrics/__tests__/FinancialValue.test.tsx` (value, formatting, availability-state contracts)
- `src/components/product/metrics/__tests__/MetricCompositions.test.tsx` (metric hierarchy, state, comparison contracts)
- `src/components/product/metrics/__tests__/StatusCompositions.test.tsx` (status semantics and disclosure contracts)
- `src/components/product/metrics/__tests__/metric-composition-source-contracts.test.ts` (isolated ownership and source-boundary contracts)

### Change Log

| Date | Change |
|---|---|
| 2026-08-12 | Story created. Defined the isolated metrics composition boundary, product API/state matrix, formatting and semantic-role invariants, honest RED/GREEN/REFACTOR sequence, browser/accessibility evidence, two fresh review passes, pinned local validation, exact Git lifecycle, force-staged artifact proof, and mandatory branch/worktree cleanup. Status: ready-for-dev. |
| 2026-08-12 | Implementation started. Status moved to `in-progress`; the first execution lane is the Story-owned component/source-contract RED suite, with production code still untouched. |
| 2026-08-12 | Genuine RED recorded. Four Story-owned test files failed only because the canonical metrics modules, explicit manifest, and product-barrel export do not exist on the clean base; no production source had been created. |
| 2026-08-12 | Implemented the canonical route-free metric/value/availability/status compositions and explicit Story-owned source contract; completed full browser/accessibility and local validation evidence. |
| 2026-08-12 | Resolved all accepted findings from two fresh adversarial passes and final recheck. Focused 81/81, build 70/70, full Vitest 18142/18142, scope audits, and final browser/axe smoke pass. **Lessons:** (1) numeric sign cannot safely infer business sentiment; (2) compact APIs must admit only formats with real compact renderers; (3) every arbitrary `ReactNode` slot requires block-safe HTML containers. Status: review pending Git lifecycle completion. |

<!-- Lessons-line convention (Story 94.4-FE): the final Story-close row that changes Status to `done` must include 1–3 Story-specific lessons for retrospective aggregation. -->
| 2026-08-17 | Story closed. Deliverable verified merged on FE main: PR #148 (merge 071dc08a). Two-pass adversarial review discipline complete per this record (zero unresolved accepted High/Medium). Git-lifecycle checkboxes were left unchecked by the delivering session but are satisfied retroactively: merge ancestry, branch removal, and Story/ATDD artifact tracking verified on main 2026-08-17. Lessons carried from the original close-row above. |
