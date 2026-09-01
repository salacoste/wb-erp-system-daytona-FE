---
initiative: shadcn-full-ui-migration
epics: [167-FE, 168-FE, 169-FE, 170-FE, 171-FE, 172-FE, 173-FE]
expectedRouteCount: 76
status: verified
date: 2026-08-11
---

# Shadcn Full UI Migration Route Ledger

This ledger is the machine-checkable source of route-to-Story ownership for the migration. Every current `src/app/**/page.tsx` route appears exactly once. A route is complete only when the Story migrates its complete owned render tree and records the evidence required by the Universal Story Delivery Contract in `epics-166-174-fe-shadcn-migration.md`.

## Ownership Rules

- `page.tsx` alone is never the complete migration surface.
- Route-owned surface includes route-local components, exclusive custom components, overlays, forms, tables, charts, applicable states, and tests.
- Components with two or more route consumers are shared dependencies and require a named upstream owner Story.
- Protected routes depend on Story 167.1 AppShell and all relevant Epic 166-FE foundation Stories.
- Status moves `planned → ready → in-progress → review → merged → verified` only with recorded evidence.

## Route Ownership

| Story | Route | Route entry | Domain | Status |
| --- | --- | --- | --- | --- |
| 167.2 | `/` | `src/app/page.tsx` | root | verified |
| 167.3 | `/login` | `src/app/(auth)/login/page.tsx` | auth | verified |
| 167.4 | `/register` | `src/app/(auth)/register/page.tsx` | auth | verified |
| 167.5 | `/cabinet` | `src/app/(onboarding)/cabinet/page.tsx` | onboarding | verified |
| 167.6 | `/processing` | `src/app/(onboarding)/processing/page.tsx` | onboarding | verified |
| 167.7 | `/wb-token` | `src/app/(onboarding)/wb-token/page.tsx` | onboarding | verified |
| 168.1 | `/analytics` | `src/app/(dashboard)/analytics/page.tsx` | analytics-core | verified |
| 168.2 | `/analytics/alerts` | `src/app/(dashboard)/analytics/alerts/page.tsx` | analytics-core | verified |
| 168.3 | `/analytics/dashboard` | `src/app/(dashboard)/analytics/dashboard/page.tsx` | analytics-core | verified |
| 168.4 | `/analytics/finance-history` | `src/app/(dashboard)/analytics/finance-history/page.tsx` | analytics-finance | verified |
| 168.5 | `/analytics/orders` | `src/app/(dashboard)/analytics/orders/page.tsx` | analytics-core | verified |
| 168.6 | `/analytics/pricing` | `src/app/(dashboard)/analytics/pricing/page.tsx` | analytics-finance | verified |
| 168.7 | `/analytics/product/[nmId]` | `src/app/(dashboard)/analytics/product/[nmId]/page.tsx` | analytics-product | verified |
| 168.8 | `/analytics/reorder` | `src/app/(dashboard)/analytics/reorder/page.tsx` | analytics-finance | verified |
| 168.9 | `/analytics/sku` | `src/app/(dashboard)/analytics/sku/page.tsx` | analytics-finance | verified |
| 168.10 | `/analytics/time-period` | `src/app/(dashboard)/analytics/time-period/page.tsx` | analytics-finance | verified |
| 168.11 | `/analytics/unit-economics` | `src/app/(dashboard)/analytics/unit-economics/page.tsx` | analytics-finance | verified |
| 169.1 | `/analytics/acquiring` | `src/app/(dashboard)/analytics/acquiring/page.tsx` | analytics-operations | verified |
| 169.2 | `/analytics/acquiring/period` | `src/app/(dashboard)/analytics/acquiring/period/page.tsx` | analytics-operations | verified |
| 169.3 | `/analytics/acquiring/reports/[id]` | `src/app/(dashboard)/analytics/acquiring/reports/[id]/page.tsx` | analytics-operations | verified |
| 169.4 | `/analytics/buyout` | `src/app/(dashboard)/analytics/buyout/page.tsx` | analytics-operations | verified |
| 169.5 | `/analytics/buyout-reconciliation` | `src/app/(dashboard)/analytics/buyout-reconciliation/page.tsx` | analytics-operations | verified |
| 169.6 | `/analytics/fbs-enhanced` | `src/app/(dashboard)/analytics/fbs-enhanced/page.tsx` | analytics-operations | verified |
| 169.7 | `/analytics/fbs-stock` | `src/app/(dashboard)/analytics/fbs-stock/page.tsx` | analytics-operations | verified |
| 169.8 | `/analytics/funnel` | `src/app/(dashboard)/analytics/funnel/page.tsx` | analytics-operations | verified |
| 169.9 | `/analytics/gaps` | `src/app/(dashboard)/analytics/gaps/page.tsx` | analytics-operations | verified |
| 169.10 | `/analytics/liquidity` | `src/app/(dashboard)/analytics/liquidity/page.tsx` | analytics-operations | verified |
| 169.11 | `/analytics/returns` | `src/app/(dashboard)/analytics/returns/page.tsx` | analytics-operations | verified |
| 169.12 | `/analytics/storage` | `src/app/(dashboard)/analytics/storage/page.tsx` | analytics-operations | verified |
| 169.13 | `/analytics/supply-planning` | `src/app/(dashboard)/analytics/supply-planning/page.tsx` | analytics-operations | verified |
| 170.1 | `/analytics/advertising` | `src/app/(dashboard)/analytics/advertising/page.tsx` | analytics-marketing | verified |
| 170.2 | `/analytics/advertising/campaigns/[advertId]` | `src/app/(dashboard)/analytics/advertising/campaigns/[advertId]/page.tsx` | analytics-marketing | verified |
| 170.3 | `/analytics/brand` | `src/app/(dashboard)/analytics/brand/page.tsx` | analytics-marketing | verified |
| 170.4 | `/analytics/brand-share` | `src/app/(dashboard)/analytics/brand-share/page.tsx` | analytics-marketing | verified |
| 170.5 | `/analytics/category` | `src/app/(dashboard)/analytics/category/page.tsx` | analytics-marketing | verified |
| 170.6 | `/analytics/cross-reference` | `src/app/(dashboard)/analytics/cross-reference/page.tsx` | analytics-marketing | verified |
| 170.7 | `/analytics/search` | `src/app/(dashboard)/analytics/search/page.tsx` | analytics-marketing | verified |
| 171.1 | `/analytics/ai-admin/anomalies` | `src/app/(dashboard)/analytics/ai-admin/anomalies/page.tsx` | analytics-ai | verified |
| 171.2 | `/analytics/ai-admin/models` | `src/app/(dashboard)/analytics/ai-admin/models/page.tsx` | analytics-ai | verified |
| 171.3 | `/analytics/ai-admin/preferences` | `src/app/(dashboard)/analytics/ai-admin/preferences/page.tsx` | analytics-ai | verified |
| 171.4 | `/analytics/forecast` | `src/app/(dashboard)/analytics/forecast/page.tsx` | analytics-forecast | verified |
| 171.5 | `/analytics/forecast-accuracy` | `src/app/(dashboard)/analytics/forecast-accuracy/page.tsx` | analytics-forecast | verified |
| 171.6 | `/analytics/models` | `src/app/(dashboard)/analytics/models/page.tsx` | analytics-models | verified |
| 171.7 | `/analytics/models/[id]/evaluations` | `src/app/(dashboard)/analytics/models/[id]/evaluations/page.tsx` | analytics-models | verified |
| 171.8 | `/analytics/models/[id]/evaluations/sku-accuracy` | `src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/page.tsx` | analytics-models | verified |
| 171.9 | `/analytics/models/[id]/performance` | `src/app/(dashboard)/analytics/models/[id]/performance/page.tsx` | analytics-models | verified |
| 172.1 | `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | dashboard | verified |
| 172.2 | `/automation/canned-rules` | `src/app/(dashboard)/automation/canned-rules/page.tsx` | automation | verified |
| 172.3 | `/automation/installed-rules` | `src/app/(dashboard)/automation/installed-rules/page.tsx` | automation | verified |
| 172.4 | `/automation/installed-rules/[id]` | `src/app/(dashboard)/automation/installed-rules/[id]/page.tsx` | automation | verified |
| 172.5 | `/cogs` | `src/app/(dashboard)/cogs/page.tsx` | cogs | verified |
| 172.6 | `/cogs/bulk` | `src/app/(dashboard)/cogs/bulk/page.tsx` | cogs | verified |
| 172.7 | `/cogs/history` | `src/app/(dashboard)/cogs/history/page.tsx` | cogs | verified |
| 172.8 | `/cogs/price-calculator` | `src/app/(dashboard)/cogs/price-calculator/page.tsx` | cogs | verified |
| 172.9 | `/communications` | `src/app/(dashboard)/communications/page.tsx` | communications | verified |
| 172.10 | `/finances` | `src/app/(dashboard)/finances/page.tsx` | finances | verified |
| 172.11 | `/monitor` | `src/app/(dashboard)/monitor/page.tsx` | monitoring | verified |
| 172.12 | `/monitoring` | `src/app/(dashboard)/monitoring/page.tsx` | monitoring | verified |
| 172.13 | `/moysklad` | `src/app/(dashboard)/moysklad/page.tsx` | moysklad | verified |
| 172.14 | `/orders` | `src/app/(dashboard)/orders/page.tsx` | orders | verified |
| 172.15 | `/orders/fbo` | `src/app/(dashboard)/orders/fbo/page.tsx` | orders | verified |
| 172.16 | `/orders/integrity` | `src/app/(dashboard)/orders/integrity/page.tsx` | orders | verified |
| 172.17 | `/products` | `src/app/(dashboard)/products/page.tsx` | products | verified |
| 173.1 | `/settings` | `src/app/(dashboard)/settings/page.tsx` | settings | verified |
| 173.2 | `/settings/backfill` | `src/app/(dashboard)/settings/backfill/page.tsx` | settings | verified |
| 173.3 | `/settings/cabinet` | `src/app/(dashboard)/settings/cabinet/page.tsx` | settings | verified |
| 173.4 | `/settings/expenses` | `src/app/(dashboard)/settings/expenses/page.tsx` | settings | verified |
| 173.5 | `/settings/notifications` | `src/app/(dashboard)/settings/notifications/page.tsx` | settings | verified |
| 173.6 | `/settings/tariffs` | `src/app/(dashboard)/settings/tariffs/page.tsx` | settings | verified |
| 173.7 | `/settings/tax` | `src/app/(dashboard)/settings/tax/page.tsx` | settings | verified |
| 173.8 | `/shipments` | `src/app/(dashboard)/shipments/page.tsx` | shipments | verified |
| 173.9 | `/shipments/[id]` | `src/app/(dashboard)/shipments/[id]/page.tsx` | shipments | verified |
| 173.10 | `/shipments/box-types` | `src/app/(dashboard)/shipments/box-types/page.tsx` | shipments | verified |
| 173.11 | `/shipments/sku-packaging` | `src/app/(dashboard)/shipments/sku-packaging/page.tsx` | shipments | verified |
| 173.12 | `/supplies` | `src/app/(dashboard)/supplies/page.tsx` | supplies | verified |
| 173.13 | `/supplies/[id]` | `src/app/(dashboard)/supplies/[id]/page.tsx` | supplies | verified |

## Story 174.1 Parity Evidence

Story 174.1 validates this ledger from base `9d611369085a1e88783322a50f3c3a043cd25257` with `scripts/check-shadcn-migration-parity.mjs` and its deterministic mutation suite:

- 76 source `page.tsx` entries = 76 ledger rows = 76 unique route-owning Stories;
- every source entry, normalized effective URL, ledger route, and owner maps exactly once;
- every row resolves to exactly one existing implementation artifact, enumerated in `_bmad-output/implementation-artifacts/174-1-fe-prove-bmad-route-ledger-and-omx-plan-parity.md` and in the machine report;
- Stories 167.8 and 169.14 are the only backend exceptions and have no ledger rows;
- all 76 statuses remain byte-for-byte `planned`; Story 174.1 performs no implementation-state transition.

## Completion Evidence Schema

Each row receives a linked evidence record containing:

- Story and Epic IDs;
- route and owned files;
- shared dependency SHAs;
- branch, temporary worktree, and base SHA;
- targeted test results;
- lint, type-check, max-lines, and build results;
- responsive/theme/accessibility state matrix;
- before/after or approved screenshots;
- review findings and disposition;
- commit and merge references;
- local/remote branch deletion evidence;
- mandatory worktree-removal evidence.

## Story 174.5 Final Verification Evidence (2026-09-02)

All 76 rows flipped `planned → verified` by Story 174.5 after a full per-row evidence audit at base `0d6225acb9abfafa872d2d2ee45f215594edc4e6` (evidence map + independent adversarial re-verification; full 76-row table archived in `_bmad-output/implementation-artifacts/174-5-fe-finalize-documentation-and-repository-cleanup.md`).

Chain summary per the Completion Evidence Schema:

- Implementation: 76/76 — one implementation artifact per row, enumerated machine-exactly by Story 174.1 parity (33/33 suite).
- Validation: 76/76 — targeted/local gates recorded per artifact and per sprint-status row.
- Visual/accessibility: 76/76 — Story 174.3 committed corpus: `e2e/fixtures/story-174-3/route-contracts.ts` (76-key route identity map, ≥2 evidence files per route) + executed manifest (owner-browser set 367/0, regenerated by 174.4).
- Review: 76/76 — two-pass independent review records per story (sprint rows and artifacts).
- Merge: 76/76 — every story PR resolved to a merge SHA verified `--is-ancestor` of `0d6225acb9abfafa872d2d2ee45f215594edc4e6`.
- Cleanup: per-story branch/worktree removal records for 54 rows; for the remaining 22 rows (167.4, 167.5, 167.6, 167.7, 168.1–168.11, 169.1–169.7 — early-wave artifacts frozen in pre-merge prose) satisfied by the collective live-absence audit below.

Collective live-absence cleanup audit (run 2026-09-02 at main `0d6225ac`):
- `git worktree list` → primary checkout + the active Story 174.5 worktree only; zero story worktrees.
- `git branch --list 'cdx/*'` → only the active Story 174.5 branch.
- `git ls-remote --heads origin` → 10 heads: `main` + 9 `automation/openwiki-*`; zero `cdx/` story branches.

Disclosure: 21 early-wave artifacts carried stale pre-merge Status prose (frozen "review (awaiting…)" / "not committed" variants) while their sprint rows and PRs recorded full delivery; Story 174.5 synced those Status lines with the historical text preserved in parens. `167-6` line ~52 promises gate output that was never appended; the gate record lives in its sprint row (vitest 18585/0) — noted, not fabricated.
