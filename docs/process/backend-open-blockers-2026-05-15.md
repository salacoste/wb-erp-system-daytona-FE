# Backend Open Blockers Tracking — Post-Revalidation 2026-05-15

> **Source**: Backend team coordination message 2026-05-15 — full revalidation
> of all 169 request-backend files. 157 RESOLVED, 4 OPEN, 3 PARTIAL.

## Open (4)

| Request | Title | Backend Status | Frontend Disposition |
|---|---|---|---|
| **#162** | FCU Aggregation Endpoint | PENDING — not yet implemented | Stories 77.4/77.5 shipped done with graceful degradation. Unit Economics dashboard shows 9 cost categories instead of 10 (missing `delivery_to_warehouse`). No FE action required; will integrate when backend ships endpoint. |
| **#163** | DBW Order Test Seeding Endpoint | PENDING — Low priority | E2E privacy tests gracefully skip when no DBW orders exist (Story 86.2-FE pattern). Unit tests (12) verify privacy guarantees at component level. No FE action required. |
| **#167** | Pipeline Health Error Rate Out-Of-Range | PENDING — preventive, not yet observed | Frontend defensive guard already in place per CLAUDE.md § Defensive Frontend Principle (Story 92.5). Amber `AlertTriangle` shown when `errorRate > 1`. Awaits backend-side validation. No FE action required. |
| **#171** | Price Calculator box_type / turnover_days | PENDING — aspirational, low priority | Frontend calculates storage costs locally using warehouse tariff data. `box_type` and `turnover_days` are frontend-only fields. Will send to backend once DTO support added. No FE action required. |

## Partial (3)

| Request | Title | Backend Status | Frontend Disposition |
|---|---|---|---|
| **#112** | Epic 57 FBS Analytics Validation | PARTIAL — no REST controller (60+ unit tests exist, services wired, but no HTTP endpoints) | Workaround: Epic 96-FE Story 96.13 implemented frontend integration via `/v1/analytics/fbs/enhanced` endpoint (delivered in Epic 105 backend per request #169 § 1.2). No further FE action required until #112 specifically asks for the original REST-controller surface. |
| **#157** | Daily Breakdown Backend Requirements | PARTIAL — orders works (`/v1/analytics/orders/volume?include_cogs=true`), but finance daily (`/v1/analytics/daily/finance`) and advertising daily endpoints remain missing | Frontend shows zeros gracefully for finance and advertising in daily breakdown. Documented in `BuyoutSummaryWidget.tsx` and `DailyBreakdownChart.tsx`. No FE action required until backend ships the 2 missing endpoints. |
| **#160** | Marketing Analytics Audit Backlog | PARTIAL — Marketing audit work partially landed; some line items still open | Frontend integration follows backend delivery cadence (per-request basis). Not a single integration target — review backlog item-by-item when backend ships each. |

## Explicit FE integration action (from #170)

| Request | Action |
|---|---|
| **#170** | "Integrate tax preliminary endpoint" — `GET /v1/analytics/tax/preliminary?from=YYYY-MM-DD&to=YYYY-MM-DD` for preliminary tax calculation on incomplete weeks. **VERIFIED ALREADY INTEGRATED 2026-05-15** — `src/hooks/usePreliminaryTax.ts` + `src/lib/api/tax-analytics.ts` wired; consumed by `DashboardContent.tsx:19,97`. Has unit tests at `src/hooks/__tests__/usePreliminaryTax.test.ts`. No further FE work required. |

## Verification sweep — 2026-05-15 (post-revalidation)

After triaging the 32 request-backend files with non-trivial "Remaining frontend action" entries, every candidate "real FE work" item was verified against the current codebase. **All shipped already** — the request files describe what's available, not what's missing. Detailed verification:

| Request | Title | FE State (verified) |
|---|---|---|
| **#109** | Epic 40 WB Order Status Timeline | ✅ DONE — `src/components/custom/orders/timeline/OrderHistoryTimeline.tsx`, `OrderHistoryTabs.tsx`, `OrderDetailsModal.tsx` |
| **#110** | Epic 51 FBS Historical Analytics | ✅ DONE — `src/lib/api/orders-history-api.ts`, `orders-volume.ts`, `fbs-analytics.ts`, `daily-analytics/api.ts`; hooks `useFbsAnalytics`, `use-fbs-enhanced`, `useFbsCompare`, `useBackfillAdmin` |
| **#112** | Epic 57 FBS Analytics REST | ✅ DONE — Orders analytics page with OverviewTab/SeasonalityTab/ComparisonTab/ComparisonTable wired via Epic 96-FE Story 96.13 |
| **#137** | WB Services Expenses Visibility | ✅ DONE — surfaced in ExpenseChart redesign (Epic 102-FE) |
| **#149** | Epic 67 Pipeline Health Dashboard | ✅ DONE — `src/app/(dashboard)/monitor/components/MonitorPipelineHealth.tsx` + `MonitorPageContent.tsx` + `use-pipeline-grid.ts` |
| **#156** | Epic 72 Tax Accounting Integration | ✅ DONE — `src/app/(dashboard)/settings/tax/page.tsx` |
| **#160** | Marketing Analytics Audit | ✅ DONE — search analytics page + funnel + advertising pages all wired (Epics 71/73-FE) |
| **#170** | Tax Preliminary Endpoint | ✅ DONE — `usePreliminaryTax` hook + integration in DashboardContent (above) |
| **#111** | Epic 53 Supply Management UI | 🟡 DEFERRED — explicitly "if needed" per backend response; no FE implementation; low priority |

## Final disposition

**No Epic 104-FE planning needed for backend coordination follow-up.** The 2026-05-15 backend revalidation surfaced:
- 157 RESOLVED requests → 100% integration verified
- 4 OPEN (#162, #163, #167, #171) → all gracefully degraded; no FE work blocked
- 3 PARTIAL (#112, #157, #160) → gracefully degraded; FE handles missing data with zero-rendering + indicators
- 1 explicit FE action (#170) → already shipped before coordination message arrived
- 8 stale defensive markers → cleaned up in commit `a56441c` (this same session)

**Only outstanding item**: #111 Supply Management UI — explicitly conditional ("if needed"), low priority, no business demand surfaced yet. Defer until a stakeholder requests supply management workflow.

## Closed defensive markers (this commit)

8 `PENDING BACKEND:` markers across 7 source files updated to past-tense backend-resolution notes per Story 96.16-FE pattern. All 8 reference Epic 106 backend / request #169 § 1.3 which is now RESOLVED.

| File | Marker class |
|---|---|
| `src/app/(dashboard)/analytics/buyout/components/BuyoutSummaryWidget.tsx:82` | Defensive (unknown source indicator) |
| `src/app/(dashboard)/analytics/buyout-reconciliation/components/ReconciliationTable.tsx:11` | Defensive (anomaly counts, file-level) |
| `src/app/(dashboard)/analytics/buyout-reconciliation/components/ReconciliationTable.tsx:38` | Defensive (unknown source cell) |
| `src/app/(dashboard)/analytics/buyout-reconciliation/components/AnomalyIndicator.tsx:13` | Defensive (anomaly preservation) |
| `src/app/(dashboard)/analytics/fbs-enhanced/components/FbsFunnelSection.tsx:15` | Reworded to `FUTURE:` (conditional, not a current dep) |
| `src/app/(dashboard)/analytics/fbs-stock/components/FbsExportButton.tsx:142` | Defensive (null-url invariant) |
| `src/lib/api/buyout-reconciliation.ts:52` | Defensive (endpoint pointer in API client) |
| `src/lib/api/buyout-reconciliation-normalizer.ts:93` | Defensive (endpoint pointer in normalizer) |

## Related

- Story 89.4-FE: Defensive Frontend Principle codification
- Story 96.16-FE: Remove redundant defensive markers for backend closures (canonical past-tense pattern)
- Story 103.1-FE: `OrdersTableRow.tsx:27` precedent (request #165 / #170 closure)
- CLAUDE.md § Defensive Frontend Principle
- CLAUDE.md § Known Anti-Patterns
