# Story 170.1-FE: Migrate Advertising Analytics Workspace

Status: review — implementation + round-1 fixes on branch; PR/merge/cleanup pending

## Story

As a marketing/finance user, I want `/analytics/advertising` to connect campaign selection, efficiency, attribution, spend discrepancies, trends, product performance, and sync gaps consistently, so that I can compare advertising outcomes and reach trustworthy evidence.

Plan: `.omx/plans/170.1-migrate-advertising-analytics-workspace.md` (authoritative — branch `cdx/epic-170-story-1-advertising-shadcn`, worktree `/private/tmp/wb-repricer-fe-170-1-advertising-shadcn`, protocol, validation). Task 0 boundary prerequisite merges before the implementation branch. Epic 170 first story — flip epic to in-progress at impl start.

## Acceptance Criteria

1. **Given** advertising and comparison data, **when** migrated, **then** campaign/product grouping, efficiency definitions, spend discrepancy, organic/advertising attribution, cannibalization, sync status, daily trends, table metrics, filters/sort/page, and drill-down URLs preserve current meaning and behavior.
2. **Given** initial load, background refresh, no campaigns, filtered-empty, sync gaps, over-attribution, partial daily/finance data, stale data, or section error, **when** rendered, **then** usable evidence remains visible and each limitation has explicit scope and recovery.
3. **Given** keyboard/touch or narrow layouts, **when** a campaign, product, series, warning, or sort is examined, **then** applied context, full precision, selection effect, non-color meaning, and equivalent chart/table evidence remain operable.
4. Plan/delivery ACs: see plan.

## Tasks / Subtasks

- [x] Task 0: Boundary prerequisite (owner PR, pattern #218/#226/#231). Sites in `src/lib/api/` (recon-verified):
  - [ ] `advertising-analytics-normalizer.ts:237` — `last_sync: toStr(r.cachedAt) || new Date().toISOString()` — fabricates NOW when backend omits cachedAt. CORRECTED FACTS (validated): `meta.last_sync` has ZERO runtime UI consumers (type + normalizer + 2 lib tests only); the >26h stale logic reads the SEPARATE sync-status endpoint (`lastSyncAt`, already null-safe) — NO SyncStatusIndicator adaptation. Fix = boundary-honesty only: null when absent. AUTHORIZED FILE SCOPE for this item: normalizer + `src/types/advertising-analytics/analytics.ts:35` (`last_sync: string` → `string | null`) + `src/lib/api/__tests__/advertising-analytics-normalizer.test.ts` (:84,:356 pins)
  - [ ] Unvalidated casts → VALID-set maps (169.13 pattern): `:140` `type as 'merged_group'|'individual'` (consumers: merged-group UI — enumerate+adapt if widened); `:236` `view_by as ViewByMode` (LOW severity — URL validation already auto-corrects runtime values, backend echo only; cheap hygiene map, NO consumer enumeration needed — nothing reads meta.view_by); `advertising-campaigns-normalizer.ts:82` `status as SyncStatusResponse['status']` (sync banner path — VALID-set; enumerate status-union consumers before any widening)
  - [ ] DISPOSITION-NOT-FIX (document in Gaps): `:45-57` toEfficiencyStatus unknown→'unknown' — INTENTIONAL honesty (F-50), keep; toCount→0 on spend/total_sales/organic (SEMANTIC-ZERO, AP#8 exception) — deliberate split, keep; `status === 9` magic (campaigns-normalizer:53-56) — backend coupling, request-backend candidate; `isMainProduct: Boolean()` + placements tri-state — schema-check, keep if boolean
  - [ ] Consumer adaptations enumerated in same PR (grep evidence; dashboard/widget lockstep consumers must stay compile-safe)
- [x] Task 1: Behavior lock + C4 matrix (AC: #1-2)
  - [ ] Baseline `npx vitest run "src/app/(dashboard)/analytics/advertising"` — **417 owned** (427 incl. excluded campaigns/ ×10; ownership assertions exclude nested per epic VC note)
  - [ ] LOCK (recon §4-5 authoritative): URL contract (from,to,view,group_by,sort,order,status,page,campaigns; write-back router.replace; defaults omitted; MAX_RANGE_DAYS clamp); view_by sku/campaign/brand/category × group_by sku/imtId; merged-склейки semantics (TotalSales=Σall, Revenue=Σad-attributed, Organic=Total−Ad, ROAS null spend=0 / 0.00 revenue=0&spend>0); **ROAS two-metric separation (revenue=ad-only vs total_sales — highest-priority lock, memory validated)**; discrepancy 3-layers + 5%/10% + invertComparison; over-attribution (negative organic; ROI %-units ×100; null-ROAS); daily 5-series dual-axis + DEFAULT_DAILY_VISIBLE hides roas + per-day ROAS=revenueAttributed/spend null-on-0; drill-downs /products/{sku_id} + buildCampaignDetailRoute(campaign_id resolution advertId→campaignId FE-16); sync healthy/degraded/unhealthy/stale-26h; campaign_id; export shared escapeCsvCell+BOM; efficiency lossCount filter; aria-sort PRESERVE (163.1 — verify all 3 headers ×2 tables stay); SortableHeader keyboard
  - [ ] C4 disposition matrix: page error+Повторить / error.tsx boundary / empty vs filtered-empty / sync-gap strip / over-attribution / multi-campaign / partial daily-finance / stale-26h (post-Task-0 honest) / background-refresh N/A-evidence (refetchInterval 0, manual only)
- [x] Task 2: Chart migration — concentrated hex (AC: #1, #3)
  - [ ] `daily-trend-config.ts:13-17` DAILY_TREND_COLORS 5 hex → chart tokens (series mapping documented: spend/roas valence vs views/clicks/orders categorical — follow 169.4/169.11 valence+categorical canon); `DailyTrendChart.tsx` grid/axis #EEEEEE/#757575 → border/chart-axis (169.4 canon); tooltip `border-gray-200 bg-white` → bg-popover canon + swatch inline hex → class tokens; legend inline styles → tokens
  - [ ] `ad-cost-discrepancy-config.ts` AD_COST_LAYERS 3 hex + SEVERITY_COLORS/SEVERITY_BG (yellow/red-500 + /50 light-only) → chart tokens + status-warning/error /15+/30 matched pairs (5%/10% thresholds locked); `AdCostDiscrepancyChart.tsx` #EEEEEE/#757575/#333 → border/chart-axis/foreground; card swatches → tokens
  - [ ] sr-only data alternatives: daily trend (every day × every visible-default series + comparison overlay, tooltip precision, units) + discrepancy chart (3 layers + % change) — 169.11/169.12 canon; name-distinct regions
- [x] Task 3: Banners/badges/tables/lib-channel migration (AC: #1-3)
  - [ ] **Efficiency tiers — 169.10 pattern** (channels CORRECTED by validation): lib color-emitting channels READ-ONLY (3-way lockstep dashboard/widget keep lib — do NOT edit). ACTUAL route consumption to replace with route-local token maps: `getRoasColorClass` (advertising-card-utils.ts:6,29), `getEfficiencyConfig` return-object `bgColor/textColor/iconColor` applied INSIDE EfficiencyBadge.tsx:7,41, `getCampaignStatusDotColor` (CampaignBadges.tsx:10,43). NOT channels (do not pin): `getEfficiencyColor` (unconsumed in route), `campaignStatusConfig` (labels/classification OK), `EfficiencyFilterDropdown` labels (:29-34 — classification, allowed). Runtime-negative pins MUST list exactly: getRoasColorClass, getEfficiencyConfig, getCampaignStatusDotColor forbidden in owned sources
  - [ ] EfficiencyBadge/EfficiencyAlertBanner/EfficiencyFilterDropdown/CampaignStatusBadge/CampaignBadges/PlacementBadges/ProductRowBadge → token map; icons/labels preserved (non-color markers exist)
  - [ ] Banners: SyncGapsTimeline 6 + OverAttribution/MultiCampaignWarning/Cannibalization 5 each → status tokens (/15+/30 matched pairs; warnings non-color); SyncStatusIndicator dots → status tokens
  - [ ] SummaryCards/advertising-card-utils/MergedGroupRows+MergedGroupTableHeader gray/bg-white sweeps → muted/border/popover; sticky-col bg-white → bg-background token check (dark-safe); performance-table stragglers (1-2 lines each)
  - [ ] Table hygiene: TableCaption ×2 (static, picker-semantic — URL-synced period → 169.7 precedent), tabular-nums (SKU font-mono negative pin), scroll-regions; NOT aria-sort (already present — pins assert preserved)
  - [ ] FORBIDDEN: `campaigns/[advertId]/**` + `src/components/custom/advertising/BidRecommendationsCard.tsx` (exclusive to excluded detail) + lib files — zero diffs; absence-proof test pins
- [x] Task 4: Guards + tests (AC: #1-3)
  - [ ] Recursive no-palette/no-hex/rgba-hsl source-contract (169.13 canon incl. total-occurrence aria-sort pin — here pins PRESERVE existing) + pinned production-file count (compute post-changes) + lib-channel runtime negatives (corrected list) + forbidden-file absence pins (campaigns/ + BidRecommendationsCard zero-diff)
  - [ ] GUARD GLOB COVERS STRAY COLOCATED TESTS (validation E-1): `components/ProductRowBadge.test.tsx` + `components/performance-table/{performance-table-columns,performance-table-metric-cells,PerformanceTableHeader,SortableHeader,performance-table-formatters}.test.*` live OUTSIDE `__tests__/` — file-count pins and test-enumeration must include them (6 files)
  - [ ] e2e pins are URL-param based (`group_by=sku|imtId` exact spelling, spec lines 37-189) — migration preserves exact param spellings; `campaigns=` param is Vitest-only contract
  - [ ] Flip legacy pins (MergedGroupTable ×4 hex, MergedGroupRows ×2, CampaignBadges/CampaignList/CampaignStatusBadge/CannibalizationSection palette) → token pins; tier-collapse (6+unknown distinct); ROAS-separation negative pin (ad-attributed revenue ≠ total_sales — compute check); discrepancy-threshold pins (5/10); invertComparison pin; last_sync null → stale-honest render (post-Task-0)
  - [ ] sr-only alternative tests; e2e run-only: advertising-analytics-epic-36.spec.ts (URL/text pins — palette-safe) — run on branch (orchestrator dev-swap)
- [ ] Task 5: Validation + 2-pass fresh review + PR + cleanup (AC: #4-9) — route 447/40 (owned baseline 417); full 19 076/0 (floor 19 056); lint 0/0; tsc 0; build 0; e2e ON BRANCH 10 passed/1 by-design skip/0 failed (clean first run). Round-1 opus COMMENT (2 MEDIUM + 3 LOW → all applied `ac81d106`: ROI ≥0 band honest warning + collapse disclosed; REAL metrics-calculator ROAS-separation pin; 3-branch hex-guard regex; doc dispositions). Round-2 pending; PR/merge/cleanup pending

## Dev Notes

### Owned surface & scope

- Owned: advertising ROOT (page/loading/error + components/** + utils/** + colocated tests) — 100 files, 10 819 lines, 417 owned tests. FORBIDDEN: `campaigns/[advertId]/**` (2 files), `src/components/custom/advertising/BidRecommendationsCard.tsx` (EXCLUSIVE to the excluded campaigns detail — epic CE wording; root has no import), all `src/lib/**`/`src/hooks/**`/`src/types/**`/`src/components/custom/**` (C2/C3) except Task 0 enumerated.
- Legacy CONCENTRATED: 25 hex (top-3 files 72%) + 66 palette lines (top-9 files 79%) — clean files stay untouched (guards pin). Baselines: owned 417; full floor **19 055/0** (re-verify at run). Node 24.18.0/npm 11.11.0.

### Legacy inventory summary (recon §2 authoritative)

- Charts: daily-trend-config 5 hex; DailyTrendChart 9 (grid/axis); discrepancy config 3 hex + severity pairs; discrepancy chart 4 (incl #333)
- Banners/tiers: 22 files × palette lines (top: MergedGroupRows 9, SyncGapsTimeline 6, OverAttribution/MultiCampaign/Cannibalization 5 ea, sync-status-config/SummaryCards/card-utils/discrepancy-config 4 ea)
- Tooltip: DailyTrendTooltip bg-white + inline swatch hex; legends inline styles
- Token-clean majority: page/loading/error, header, toggles, CampaignList, SortableHeader, hooks, utils-metrics/formatters — ZERO changes

### Canon mapping (precedents)

- Chart tokens + valence/categorical (169.4/169.11); border/chart-axis (169.4); tooltip bg-popover (168.10+); /15+/30 matched pairs (169.5); solid chips (169.9); foreground-on-tint (169.10); lib-channel runtime negatives (169.10/169.13); sr-only alternatives (169.11/12/13); static TableCaption picker-semantic (169.7); total-occurrence guards (169.13); unknown=muted (169.11/12/13).

### References

- [Source: epics-166-174 §Story 170.1 + §C1-C11]
- [Source: `.omx/plans/170.1-migrate-advertising-analytics-workspace.md`]
- Memory: ROAS two-metric separation (ad-attributed revenue vs total_sales — validated 2026-02-23)

## Dev Agent Record

### Agent Model Used

- Preface (Task 0): executor (sonnet) ×1 + orchestrator hardening + reviewer (opus fresh APPROVE) — PR #236, merge `3eda5d66`.
- Implementation: executor (sonnet) ×2 rounds via orchestrator (migration `dac5d8a6` + round-1 fixes `ac81d106`); review round 1: code-reviewer (opus fresh) COMMENT → 5 findings applied.

### Debug Log References

### Completion Notes List

- Preface #236 (`2aab52c2`+`deb27a7b`): last_sync fabricated-NOW → null (zero UI consumers — validated; authorized scope types+lib-tests); type/view_by/sync-status casts → VALID-set maps + literal narrowing; invalid sync → 'idle' + logger.warn (union NOT widened); Record<SyncTaskStatus,true> compile-enforced map.
- Migration `dac5d8a6` (impl commit touched 38 files +3 A; cumulative diff 41 files): NEW advertising-tokens.ts (route-local tier/status/campaign maps — 169.10 pattern) + DailyTrendSrTable.tsx + contracts test (20 tests). Charts: DAILY_TREND 5 hex → valence (spend=chart-negative, roas=chart-positive) + categorical (views/clicks/orders=chart-1..3); discrepancy 3 layers → chart-1..3 + severity warning/error /15 (5%/10% locked); grid/axis → border/chart-axis; #333 → foreground; tooltip → bg-popover canon.
- Lib-channel STOP (corrected list): getRoasColorClass (card-utils), getEfficiencyConfig color-fields (EfficiencyBadge — label/icon/classification still runtime-consumed from lib; only bgColor/textColor/iconColor are zero-consumed), getCampaignStatusDotColor (CampaignBadges) — zero COLOR-channel runtime consumption in route; labels/icons/classification stay lib; dashboard/widget lockstep untouched. EfficiencyBadge text-blue-600 → status-information.
- Banners → /15+/30 pairs (SyncGaps, OverAttribution, MultiCampaign, Cannibalization, SyncStatusIndicator dots; stale dot → status-pending). Gray/bg-white → muted/border/popover; sticky cols dark-safe.
- Table hygiene: visible static TableCaption ×2 (UI-CHANGE beyond token swap — disclosed per round-1 F5; 169.7 picker-semantic canon), tabular-nums (SKU font-mono negative pin), scroll-regions; aria-sort PRESERVED ×4 (163.1) — total-occurrence pins.
- Round-1 fixes `ac81d106`: ROI ≥0 band muted→status-warning (muted=unknown-semantics lie — comment now truthful); ROAS-separation pin now exercises metrics-calculator compute (revenue 90000/spend 30000 → ROAS 3.0 ≠ 5.0 total_sales path; null-on-zero); CONTEXTUAL_HEX 3-branch regex (unquoted `stroke: #EEEEEE` caught; #197/#NNN prose + href-fragments exempt).
- Guards: pinned production count 64 (+tokens/sr-table); stray-test glob covers 6 colocated test files; forbidden-file absence pins (campaigns/ + BidRecommendationsCard + lib zero-diff); tier-collapse Set(6); URL-spelling pins (group_by sku|imtId).
- Series mapping table + rationale documented in advertising-tokens.ts.

### Gaps

- **Deliberate inline-TEXT tier collapse 5→3** (round-1 F1): excellent≡good success-text, 0-20≡20-50 ROI warning-text — 3-status canon; old green/emerald + yellow/orange were near-identical pairs; 6-tier distinction lives in chips (solid/soft). Disclosed in-code.
- **invalid sync status → 'idle' renders identically to genuine idle** (preface review MEDIUM — PRE-EXISTING mask, byte-identical): follow-up = SyncStatusResponse 'unknown' member per F-50 precedent → request-backend/shared-boundary pass candidate.
- **Daily-trend sr-table covers visible-default series only** — no comparison series exists in the daily chart (comparison lives in SummaryCards deltas); ROAS column omitted per DEFAULT_DAILY_VISIBLE.
- **Dark-mode chart-var runtime render** not jsdom-verifiable — 169.4/169.11 canon pattern; e2e visual pass at 174.3.
- `status === 9` magic + isMainProduct Boolean (dispositions) — request-backend candidates.

### File List

Diff 3eda5d66..HEAD = **41 files** (2 A-prod: advertising-tokens.ts, DailyTrendSrTable.tsx; 1 A-test: contracts; 27 M-prod; 11 M-test; fix-round modified only existing files). Pinned production 64 (route-wide ≠ diff count). Exact list: `git diff --name-status 3eda5d66..HEAD`.

### Change Log

| Date | Change |
|---|---|
| 2026-08-25 | Story created from deep recon (100-file route, legacy concentrated top-3/top-9; aria-sort pre-existing 163.1; lib 3-way-lockstep channels → route-local tokens; last_sync fabrication + 3 casts → Task 0). Plan referenced as authoritative. |
| 2026-08-25 | Fresh-context validation VERDICT FAIL → 4 criticals corrected: last_sync has NO UI consumers (authorized scope now includes types+lib-tests; stale-logic attribution fixed); BidRecommendationsCard EXCLUSIVE not dual-consumer; lib-channel pin list corrected (getEfficiencyConfig + getCampaignStatusDotColor are the real channels — old list was vacuous); view_by cast downgraded (URL validation moots it). +guard-glob stray-tests, e2e spelling, EfficiencyBadge blue line. |
| 2026-08-25 | Round-1 fixes applied (ROI-band honesty, real ROAS pin, hex regex; F1/F5 disclosed). UI-change disclosure: sr-only captions → visible TableCaption ×2 (169.7 canon, test-pinned). Status: ready-for-dev → review. |
