---
initiative: shadcn-full-ui-migration
epics: [167-FE, 168-FE, 169-FE, 170-FE, 171-FE, 172-FE, 173-FE]
expectedRouteCount: 76
status: planned
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
| 167.2 | `/` | `src/app/page.tsx` | root | planned |
| 167.3 | `/login` | `src/app/(auth)/login/page.tsx` | auth | planned |
| 167.4 | `/register` | `src/app/(auth)/register/page.tsx` | auth | planned |
| 167.5 | `/cabinet` | `src/app/(onboarding)/cabinet/page.tsx` | onboarding | planned |
| 167.6 | `/processing` | `src/app/(onboarding)/processing/page.tsx` | onboarding | planned |
| 167.7 | `/wb-token` | `src/app/(onboarding)/wb-token/page.tsx` | onboarding | planned |
| 168.1 | `/analytics` | `src/app/(dashboard)/analytics/page.tsx` | analytics-core | planned |
| 168.2 | `/analytics/alerts` | `src/app/(dashboard)/analytics/alerts/page.tsx` | analytics-core | planned |
| 168.3 | `/analytics/dashboard` | `src/app/(dashboard)/analytics/dashboard/page.tsx` | analytics-core | planned |
| 168.4 | `/analytics/finance-history` | `src/app/(dashboard)/analytics/finance-history/page.tsx` | analytics-finance | planned |
| 168.5 | `/analytics/orders` | `src/app/(dashboard)/analytics/orders/page.tsx` | analytics-core | planned |
| 168.6 | `/analytics/pricing` | `src/app/(dashboard)/analytics/pricing/page.tsx` | analytics-finance | planned |
| 168.7 | `/analytics/product/[nmId]` | `src/app/(dashboard)/analytics/product/[nmId]/page.tsx` | analytics-product | planned |
| 168.8 | `/analytics/reorder` | `src/app/(dashboard)/analytics/reorder/page.tsx` | analytics-finance | planned |
| 168.9 | `/analytics/sku` | `src/app/(dashboard)/analytics/sku/page.tsx` | analytics-finance | planned |
| 168.10 | `/analytics/time-period` | `src/app/(dashboard)/analytics/time-period/page.tsx` | analytics-finance | planned |
| 168.11 | `/analytics/unit-economics` | `src/app/(dashboard)/analytics/unit-economics/page.tsx` | analytics-finance | planned |
| 169.1 | `/analytics/acquiring` | `src/app/(dashboard)/analytics/acquiring/page.tsx` | analytics-operations | planned |
| 169.2 | `/analytics/acquiring/period` | `src/app/(dashboard)/analytics/acquiring/period/page.tsx` | analytics-operations | planned |
| 169.3 | `/analytics/acquiring/reports/[id]` | `src/app/(dashboard)/analytics/acquiring/reports/[id]/page.tsx` | analytics-operations | planned |
| 169.4 | `/analytics/buyout` | `src/app/(dashboard)/analytics/buyout/page.tsx` | analytics-operations | planned |
| 169.5 | `/analytics/buyout-reconciliation` | `src/app/(dashboard)/analytics/buyout-reconciliation/page.tsx` | analytics-operations | planned |
| 169.6 | `/analytics/fbs-enhanced` | `src/app/(dashboard)/analytics/fbs-enhanced/page.tsx` | analytics-operations | planned |
| 169.7 | `/analytics/fbs-stock` | `src/app/(dashboard)/analytics/fbs-stock/page.tsx` | analytics-operations | planned |
| 169.8 | `/analytics/funnel` | `src/app/(dashboard)/analytics/funnel/page.tsx` | analytics-operations | planned |
| 169.9 | `/analytics/gaps` | `src/app/(dashboard)/analytics/gaps/page.tsx` | analytics-operations | planned |
| 169.10 | `/analytics/liquidity` | `src/app/(dashboard)/analytics/liquidity/page.tsx` | analytics-operations | planned |
| 169.11 | `/analytics/returns` | `src/app/(dashboard)/analytics/returns/page.tsx` | analytics-operations | planned |
| 169.12 | `/analytics/storage` | `src/app/(dashboard)/analytics/storage/page.tsx` | analytics-operations | planned |
| 169.13 | `/analytics/supply-planning` | `src/app/(dashboard)/analytics/supply-planning/page.tsx` | analytics-operations | planned |
| 170.1 | `/analytics/advertising` | `src/app/(dashboard)/analytics/advertising/page.tsx` | analytics-marketing | planned |
| 170.2 | `/analytics/advertising/campaigns/[advertId]` | `src/app/(dashboard)/analytics/advertising/campaigns/[advertId]/page.tsx` | analytics-marketing | planned |
| 170.3 | `/analytics/brand` | `src/app/(dashboard)/analytics/brand/page.tsx` | analytics-marketing | planned |
| 170.4 | `/analytics/brand-share` | `src/app/(dashboard)/analytics/brand-share/page.tsx` | analytics-marketing | planned |
| 170.5 | `/analytics/category` | `src/app/(dashboard)/analytics/category/page.tsx` | analytics-marketing | planned |
| 170.6 | `/analytics/cross-reference` | `src/app/(dashboard)/analytics/cross-reference/page.tsx` | analytics-marketing | planned |
| 170.7 | `/analytics/search` | `src/app/(dashboard)/analytics/search/page.tsx` | analytics-marketing | planned |
| 171.1 | `/analytics/ai-admin/anomalies` | `src/app/(dashboard)/analytics/ai-admin/anomalies/page.tsx` | analytics-ai | planned |
| 171.2 | `/analytics/ai-admin/models` | `src/app/(dashboard)/analytics/ai-admin/models/page.tsx` | analytics-ai | planned |
| 171.3 | `/analytics/ai-admin/preferences` | `src/app/(dashboard)/analytics/ai-admin/preferences/page.tsx` | analytics-ai | planned |
| 171.4 | `/analytics/forecast` | `src/app/(dashboard)/analytics/forecast/page.tsx` | analytics-forecast | planned |
| 171.5 | `/analytics/forecast-accuracy` | `src/app/(dashboard)/analytics/forecast-accuracy/page.tsx` | analytics-forecast | planned |
| 171.6 | `/analytics/models` | `src/app/(dashboard)/analytics/models/page.tsx` | analytics-models | planned |
| 171.7 | `/analytics/models/[id]/evaluations` | `src/app/(dashboard)/analytics/models/[id]/evaluations/page.tsx` | analytics-models | planned |
| 171.8 | `/analytics/models/[id]/evaluations/sku-accuracy` | `src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/page.tsx` | analytics-models | planned |
| 171.9 | `/analytics/models/[id]/performance` | `src/app/(dashboard)/analytics/models/[id]/performance/page.tsx` | analytics-models | planned |
| 172.1 | `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | dashboard | planned |
| 172.2 | `/automation/canned-rules` | `src/app/(dashboard)/automation/canned-rules/page.tsx` | automation | planned |
| 172.3 | `/automation/installed-rules` | `src/app/(dashboard)/automation/installed-rules/page.tsx` | automation | planned |
| 172.4 | `/automation/installed-rules/[id]` | `src/app/(dashboard)/automation/installed-rules/[id]/page.tsx` | automation | planned |
| 172.5 | `/cogs` | `src/app/(dashboard)/cogs/page.tsx` | cogs | planned |
| 172.6 | `/cogs/bulk` | `src/app/(dashboard)/cogs/bulk/page.tsx` | cogs | planned |
| 172.7 | `/cogs/history` | `src/app/(dashboard)/cogs/history/page.tsx` | cogs | planned |
| 172.8 | `/cogs/price-calculator` | `src/app/(dashboard)/cogs/price-calculator/page.tsx` | cogs | planned |
| 172.9 | `/communications` | `src/app/(dashboard)/communications/page.tsx` | communications | planned |
| 172.10 | `/finances` | `src/app/(dashboard)/finances/page.tsx` | finances | planned |
| 172.11 | `/monitor` | `src/app/(dashboard)/monitor/page.tsx` | monitoring | planned |
| 172.12 | `/monitoring` | `src/app/(dashboard)/monitoring/page.tsx` | monitoring | planned |
| 172.13 | `/moysklad` | `src/app/(dashboard)/moysklad/page.tsx` | moysklad | planned |
| 172.14 | `/orders` | `src/app/(dashboard)/orders/page.tsx` | orders | planned |
| 172.15 | `/orders/fbo` | `src/app/(dashboard)/orders/fbo/page.tsx` | orders | planned |
| 172.16 | `/orders/integrity` | `src/app/(dashboard)/orders/integrity/page.tsx` | orders | planned |
| 172.17 | `/products` | `src/app/(dashboard)/products/page.tsx` | products | planned |
| 173.1 | `/settings` | `src/app/(dashboard)/settings/page.tsx` | settings | planned |
| 173.2 | `/settings/backfill` | `src/app/(dashboard)/settings/backfill/page.tsx` | settings | planned |
| 173.3 | `/settings/cabinet` | `src/app/(dashboard)/settings/cabinet/page.tsx` | settings | planned |
| 173.4 | `/settings/expenses` | `src/app/(dashboard)/settings/expenses/page.tsx` | settings | planned |
| 173.5 | `/settings/notifications` | `src/app/(dashboard)/settings/notifications/page.tsx` | settings | planned |
| 173.6 | `/settings/tariffs` | `src/app/(dashboard)/settings/tariffs/page.tsx` | settings | planned |
| 173.7 | `/settings/tax` | `src/app/(dashboard)/settings/tax/page.tsx` | settings | planned |
| 173.8 | `/shipments` | `src/app/(dashboard)/shipments/page.tsx` | shipments | planned |
| 173.9 | `/shipments/[id]` | `src/app/(dashboard)/shipments/[id]/page.tsx` | shipments | planned |
| 173.10 | `/shipments/box-types` | `src/app/(dashboard)/shipments/box-types/page.tsx` | shipments | planned |
| 173.11 | `/shipments/sku-packaging` | `src/app/(dashboard)/shipments/sku-packaging/page.tsx` | shipments | planned |
| 173.12 | `/supplies` | `src/app/(dashboard)/supplies/page.tsx` | supplies | planned |
| 173.13 | `/supplies/[id]` | `src/app/(dashboard)/supplies/[id]/page.tsx` | supplies | planned |

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
