# Backend Open Blockers Tracking — Post-Revalidation 2026-05-15

> **Source**: Backend team coordination message 2026-05-15. **Initial message**: 157 RESOLVED, 4 OPEN, 3 PARTIAL.
> **Follow-up message (same day)**: full audit complete — **0 pending, all 169 RESOLVED**. The 4 OPEN
> previously listed were reclassified to RESOLVED after backend confirmed implementation:
>
> - **#162** FCU Aggregation Endpoint → RESOLVED
> - **#163** DBW Order Test Seeding → RESOLVED (per follow-up audit)
> - **#167** Pipeline Health errorRate clamping → RESOLVED (clamping landed at
>   `pipeline-health-grid.service.ts:272-277`, commit `c9ba2187`); FE amber AlertTriangle guard
>   stays as defense-in-depth.
> - **#171** Price Calculator box_type Storage Tariff → RESOLVED — `POST /v1/products/price-calculator`
>   now applies 1.5x multiplier when `box_type: 'pallet'`. FE already sends `box_type`; backend
>   now differentiates. No FE action required.
>
> **3 PARTIAL** previously listed (#112, #157, #160) also confirmed RESOLVED in the follow-up audit.

## Status: CLOSED (no open backend dependencies)

Backend follow-up: "**All backend work items from your requests are complete.**" No FE action items
surfaced from the audit beyond the marker cleanup already shipped in commit `a56441c`.

## Companion backend fixes from this session

Backend's follow-up message also flagged 3 fixes shipped during the audit cycle that touch FE
behavior — all already aligned with our implementation:

| Backend fix | FE alignment |
|---|---|
| Cabinet-level forecasts (`nmId=null`) crashed Prisma upsert → fixed with sentinel `nmId=0` | FE `computeForecastQueryParams('cabinet', _)` returns `nmId: undefined` and `enabled: true` (Story 103.4 Phase 3 disposition c retains cabinet level). Cabinet-level forecast now works end-to-end. |
| Forecast normalizer field mapping (`predictedUnits` / `forecastDate`) | FE `normalizeAiForecastResponse` already maps `forecastDate → date` + `predictedUnits → predictedSales` per Boundary Normalizer Pattern (Story 103.1 + 103.4 polish). 14 unit tests cover the mapping. |
| Buyout reconciliation tests — added `product.findMany` mock | Backend-side test fixture; no FE impact. |

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

## Final disposition (after backend follow-up audit)

**No Epic 104-FE planning needed for backend coordination follow-up.** The 2026-05-15 backend revalidation
+ same-day follow-up audit surfaced:
- **169 / 169 RESOLVED** — 0 open, 0 partial, 0 pending
- All previously-OPEN items (#162, #163, #167, #171) reclassified to RESOLVED with evidence
- All previously-PARTIAL items (#112, #157, #160) confirmed RESOLVED in follow-up audit
- 1 explicit FE action (#170 tax preliminary) → already shipped pre-coordination
- 8 stale defensive markers → cleaned up in commit `a56441c` (this same session)

**Backend-side fixes that align with FE implementation** (3 from this session):
- Cabinet-level forecast Prisma crash — fixed (FE cabinet level now functional)
- Forecast field-mapping contract — confirmed matches FE normalizer
- Buyout reconciliation test mocks — backend-only

**Only deferred item**: #111 Supply Management UI — explicitly conditional ("if needed"), low priority,
no business demand surfaced yet. Defer until a stakeholder requests supply management workflow.

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
