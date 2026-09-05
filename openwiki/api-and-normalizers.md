---
type: "Architecture Overview"
title: "API Layer & Normalizers"
description: "API client singleton with auto-injected auth and cabinet headers, D-2 single-flight reactive 401 refresh with one replay, the Boundary Normalizer Pattern that transforms backend responses into frontend-canonical shapes, the Epic 170/171 advertising and search normalizers with AP#8 null semantics, the Story 169.14 paid-storage import result contract and polling lifecycle, CSV export infrastructure, the NEW-7/172.10 finances documents flow, and the communications gated write-back with async 202 job polling."
tags: [api-client, boundary-normalizer, reactive-401-refresh, anti-pattern-8, paid-storage-import, csv-export, finances-documents]
verified:
  - by: openwiki/0.5.0
    at: 2026-09-05T08:47:50.295Z
sources:
  - id: openwiki-source-3177abcefd75baab3663fb5b
    resource: repo://src/hooks/useSanityCheck.ts
  - id: openwiki-source-b3e9ea042734f0848c410d92
    resource: repo://src/lib/api-client-refresh.ts
  - id: openwiki-source-a7c7d558f70edbb3171b87ab
    resource: repo://src/lib/api-client.ts
  - id: openwiki-source-4a2c698892059013040d959c
    resource: repo://src/lib/api.ts
  - id: openwiki-source-63fbf19eac49b6e765e65f86
    resource: repo://src/lib/api/__tests__/tasks-enqueue-role-contract.test.ts
  - id: openwiki-source-a634a54b04d180befb7476e7
    resource: repo://src/services/cabinets.service.ts
  - id: openwiki-source-57a6295c7260bc5f8b372d73
    resource: repo://src/types/api.ts
generated: { by: "openwiki/0.5.0", at: "2026-09-03T08:47:55.542Z" }
---
# API Layer & Normalizers

## API Client Singleton

`src/lib/api-client.ts` exports a singleton `ApiClient` instance (`apiClient`). All API calls flow through it.

| Concern | Implementation |
|---------|----------------|
| **Base URL** | `env.apiUrl` from `src/lib/env.ts` → reads `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`). Endpoints are `/v1/...` paths. |
| **Auth header** | Auto-injects `Authorization: Bearer <token>` from `useAuthStore`. Bypassed via `options.skipAuth`. An immutable per-request `options.authToken` (Story 167.9) wins over the mutable store token, so a request authenticates as the session that initiated it. |
| **Cabinet header** | Auto-injects `X-Cabinet-Id` from `useAuthStore`. Bypassed via `options.skipCabinetId`. This is the multi-tenant isolation mechanism. `options.cabinetIdOverride` mirrors the `authToken` pattern. |
| **Response unwrapping** | Backend returns `{ data: T }` envelopes. Client auto-unwraps `rawData.data`. Use `skipDataUnwrap: true` for paginated responses where `data` is a legitimate array field. |
| **Binary downloads** | `responseType: 'blob'` returns raw `Blob` without JSON parsing. |
| **Error handling** | Custom `ApiError` class carries `status`, `message`, `data`, `retryAfter`. HTTP 429/503 `Retry-After` header parsed and clamped to [1, 600] seconds. |

Source: `src/lib/api-client.ts`, `src/lib/api-interceptors.ts`, `src/lib/env.ts`

### Reactive 401 refresh (D-2, single-flight + one replay)

The `request()` method intercepts **401 on an authenticated, non-refresh request** and attempts reactive recovery (contract annex in `docs/request-backend/230-auth-refresh-endpoint-missing.md`):

1. **Gate check** — recovery fires only when the private replay flag is still true (once per request), `options.allowReactiveRefresh !== false` (public opt-out), `!options.skipAuth` (a skipAuth 401 is a credential failure — nothing to rotate), and `!isRefreshEndpoint(endpoint)` (the refresh endpoint's own 401 must not recurse).
2. **Single-flight refresh** — `getFreshToken(headers['Authorization'])` (`src/lib/api-client-refresh.ts`) joins an in-flight refresh or starts one `POST /v1/auth/refresh` (Bearer of a still-valid JWT, body `{}` → `{ token }`; sliding rotation **revokes the old JWT**). It reads the token from the auth **store** at refresh time (hazard #1 — never the failed request's revoked token), updates the store via the `refreshToken(token, user)` store action (hazard #2 — keeps `sessionNonce` + user; `login()` would mint a new nonce and break in-flight Story 167.9 cabinet-create settlements), and has a 10s abort deadline (default `DEFAULT_REFRESH_DEADLINE_MS`, injectable for tests) so a black-holed refresh cannot wedge every 401.
3. **Rotation-cascade gate (M1)** — when the failed request's wire token differs from the current store token, a prior rotation already completed: no new refresh is started (it would burn the just-minted JWT); a straggler arriving during a pending rotation **joins** it and replays only after it settles.
4. **Replay once** — on success the request is re-issued with `authToken: undefined` (drops a stale Story 167.9 initiating override — the revoked token must not ride again) and the private replay flag `false`. A replay that 401s again surfaces the original `ApiError` — no loop, no retry storm. The private flag always wins over the public option, which can never re-enable refresh mid-recovery.

```mermaid
sequenceDiagram
    participant C as apiClient.request
    participant S as auth store
    participant R as getFreshToken (single-flight)
    participant BE as Backend
    C->>BE: request (Bearer t1)
    BE-->>C: 401
    C->>R: getFreshToken("Bearer t1")
    R->>S: read store token
    R->>BE: POST /v1/auth/refresh (Bearer store-token)
    BE-->>R: { token: t2 }
    R->>S: refreshToken(t2, user) — keeps sessionNonce
    R-->>C: true
    C->>BE: replay (authToken dropped, store t2)
    BE-->>C: 200
```

**Durable-op opt-out** — `createCabinet` (and symmetrically `getCabinetCreationOperation`) in `src/lib/api.ts` sets `allowReactiveRefresh: false`: a 401 on the pinned initiating session's durable, account-scoped create (scoped by the Story 167.8 `Idempotency-Key`) is a credential failure whose retry is owned by reconciliation — silently replaying under a rotated *different* session's token would mask the failure and drop the Idempotency-Key↔session pairing. The `src/services/cabinets.service.ts` settlement paths do the same.

Focused tests: `src/lib/api/__tests__/api-client-401-refresh.test.ts` (MSW) pins the flipped D-2 contract — refresh fires once (single-flight, concurrent 401s join one POST), wire-level POST replay parity (method, body, `Idempotency-Key`, `X-Cabinet-Id` survive), replay-401 → original `ApiError`, the M1 cascade gate/join, the M2 deadline, and the OQ2 `createCabinet` opt-out.

### /v1/tasks/enqueue role contract (Story 174.4 G2)

There is no dedicated tasks API module — the real call sites (`useSanityCheck`, `useManualMarginRecalculation`, `useMoyskladSync`) build the body inline (`{ task_type, payload: { cabinet_id, … } }`) and post through the shared `apiClient`. `src/lib/api/__tests__/tasks-enqueue-role-contract.test.ts` mirrors `useSanityCheck`'s exact mutationFn and pins the wire boundary: a Manager token gets 200 with auto-injected `Authorization` + `X-Cabinet-Id`; an Analyst token gets the BE RolesGuard's 403, which surfaces as a **real `ApiError`** (`status === 403`, anti-pattern #3) with exactly **one** request — `apiClient` never auto-retries, so a permission denial produces no retry storm (see `isForbiddenError` in `src/types/api.ts` for the UI-side expected-permission-state idiom).

### Error tracking
- `extractErrorMessage()` handles both `{ error: { message } }` and flat `{ message }` JSON shapes.
- Telegram notification endpoint errors are routed to `TelegramMetrics` for observability (`trackTelegramApiError()`).
- WB token 401s mentioning "WB API token" are expected errors — suppressed from error logging via `isExpectedWbTokenError()`.

Source: `src/lib/api-interceptors.ts`, `src/lib/error-utils.ts`, `src/lib/api-wb-token-errors.ts`

## Boundary Normalizer Pattern

> Full spec: `CLAUDE-PATTERNS.md` § Boundary Normalizer Pattern

**Core rule**: Every backend response MUST be transformed into a frontend-canonical shape at the API client layer. Raw backend shapes never reach components or hooks.

### Why normalizers exist

1. **Defensive frontend** — Backend responses are typed `unknown`. Normalizers guarantee runtime type safety without relying on backend schema stability.
2. **snake_case → camelCase** — Backend uses Prisma (snake_case); frontend types use camelCase. Normalizers bridge both: `d.nmId ?? d.nm_id`.
3. **AP#8 null semantics** — Counts/totals default to `0` (known empty state); money/rates/ratios preserve `null` (unknown, renders "—"). This prevents misleading "0 ₽" displays.
4. **Prisma Decimal handling** — `toDecimalNumber()` reconstructs decimal.js `{s,e,d}` objects into numbers.
5. **Enum coercion** — Validates string unions against `ReadonlySet` of valid values.

### Shared helpers (`src/lib/api/normalizer-helpers.ts`)

| Function | Returns | AP#8 Category |
|----------|---------|---------------|
| `toCount(raw)` | `number` (0 default) | Counts, totals, pagination |
| `toNullableNumber(raw)` | `number \| null` | Money, rates, ratios |
| `toStringOrNull(raw)` | `string \| null` | Required strings |
| `toOptionalString(raw)` | `string \| undefined` | Optional strings |
| `toStr(raw)` | `string` ('' default) | Required strings with fallback |
| `asRecord(raw)` | `Record<string, unknown>` | Safe object access |
| `toDecimalNumber(raw)` | `number \| null` | Prisma Decimal deserialization |

### Normalizer file structure

Each domain follows the same pattern:
- **`<domain>-normalizer.ts`** — Pure functions: `normalize<Domain>Response(raw: unknown): TypedResponse`
- **`<domain>.ts`** — API client function that calls `apiClient.get()` then applies the normalizer

40+ normalizer files exist under `src/lib/api/`, one per API domain. Representative examples:
- `fulfillment-normalizer.ts` — FBO/FBS fulfillment metrics
- `storage-queries-normalizer.ts` — Storage cost by SKU, top consumers. Story 169.12 Task 0 hardened the boundary values: `has_warehouse_stock` is tri-state (`boolean | null` — absent/null stays `null`/unknown instead of being coerced to a false «Нет на складе» claim) and `percent_of_total` is nullable (unknown ratio stays `null`, never `0%`, per AP#8).
- `storage-import-normalizer.ts` — Storage import job status; an unrecognized backend status maps to a distinct `'unknown'` state (Story 169.12 Task 0) instead of being coerced to `'failed'`, which had rendered a false import error — consumers keep polling as with `'pending'`. The full Story 169.14 authoritative result contract and polling lifecycle are detailed in the dedicated section below.
- `return-analytics-normalizer.ts` — Buyout/return analytics; an unrecognized return `category` stays a distinguishable `'unknown'` (Story 169.11 preface) with the neutral label «Неклассифицированный возврат» instead of silent coercion to a real category.
- `supply-planning-normalizer.ts` — Supply planning; Story 169.13 Task 0 (pattern #218/#226) hardened the boundary: unrecognized/absent `stockout_risk` and `reorder_status` map to a distinct `'unknown'` via map-based lookups (`STOCKOUT_RISK_MAP` / `REORDER_STATUS_MAP`) instead of the previous optimistic coercion to `'healthy'`/`'ok'`, and `avg_daily_sales` / `total_reorder_value` stay nullable (AP#8 — no `?? 0`). `has_cogs` uses `Boolean()` coercion because the backend schema declares it a required boolean (contract-faithful, not a boundary lie). Focused tests: `src/lib/api/__tests__/supply-planning-normalizer.test.ts`.
- `buyout-analytics-normalizer.ts` — Buyout/return rate (enum validation for source, confidence, trend)
- `liquidity-normalizer.ts` — Liquidity trends and distribution
- `communications-normalizer.ts` — WB seller communications (feedbacks, questions, chats, claims, pinned reviews); value fields (rating, nmId) preserve null (AP#8), chat message `direction` coerced to a `'client' | 'seller' | 'wb'` union, and the pinned-reviews normalizer receives the raw `{ data, next }` SDK passthrough (see `skipDataUnwrap` below)
- `finances-normalizer.ts` — Account balance (money fields preserve null, AP#8) and financial documents; the BE already maps snake_case → camelCase and unwraps the WB SDK envelope server-side, so the FE consumes bare camelCase shapes
- `price-recommendations-normalizer.ts` — Per-SKU repricing recommendations; unknown `priceBasis` enum values are **indicated** as `'UNKNOWN'` (a distinct badge) rather than silently relabeled, `validationFlags` coerced to a string array, `alternativeBasisPrice` kept nullable (AP#8). See [Domain Logic — Pricing Basis](domain-logic.md#pricing-basis-repricing-spp-1-lane)
- `monitoring-normalizer.ts` / `monitoring-grid-normalizer.ts` — Pipeline health for the `/monitor` and `/monitoring` routes; both pass through the backend-authored, schedule-aware lag label `dataLagDisplay` (trimmed; `null` when the pipeline never synced). `MonitorPipelineHealth` and `PipelineStatusGrid` render `dataLagDisplay` as authoritative and fall back to client-side `formatRelativeTime(lastSuccessAt)` only when it is absent — the raw `dataLagMinutes` no longer drives the displayed lag, because a naive minutes count misrepresents pipelines that run on infrequent schedules. Focused tests: `src/lib/api/__tests__/monitoring-normalizer.test.ts`, `src/lib/api/__tests__/monitoring-grid-normalizer.test.ts`, `src/app/(dashboard)/monitor/components/__tests__/monitor-pipeline-utils.test.ts`.
- `advertising-analytics-normalizer.ts`, `advertising-campaigns-normalizer.ts`, `search-analytics-item-normalizer.ts`, `search-position-trends-normalizer.ts` — the Epic 170/171 advertising & search normalizers, detailed in the next section.

### Advertising & Search normalizers (Epic 170/171)

The advertising and search domains consolidate their normalizers in `src/lib/api/` and their canonical frontend shapes in `src/types/`. Backend returns camelCase; these normalizers convert to frontend-canonical shapes (advertising item rows use snake_case fields like `total_sales`, `campaign_id`; search items use camelCase).

**`advertising-analytics-normalizer.ts`** — `normalizeAdvertisingResponse(raw, paramsFrom, paramsTo, paramsViewBy?)` maps the backend `{ items, summary, query, pagination, cachedAt?, daily?, multiCampaignSkuWarnings? }` envelope to `AdvertisingAnalyticsResponse` (`src/types/advertising-analytics/analytics.ts`): `{ meta, summary, data, daily?, multiCampaignSkuWarnings? }`. Key behaviors:

- **`efficiency_status` is authoritatively guarded here** (F-50): out-of-union backend values are sanitized to `'unknown'` with a `logger.warn` (empty/missing is a legitimate no-data case — no warn), so `EfficiencyBadge` (F-47) and the typed helpers `isAttentionRequired`/`isLossStatus` are only defense-in-depth.
- **AP#8 split per iter-130**: `revenue`, `profit`, `roas`, `roi`, `ctr`, `cpc`, `conversion_rate`, `profit_after_ads` use `toNullableNumber` (null renders "—", never a false "0 ₽"/"0 %"), while counts (`views`, `clicks`, `orders`, `spend`, `total_sales`, …) use `toCount`.
- **Cast-free enum lookups (Story 170.1 Task 0)**: `ViewByMode` is validated against a `ReadonlySet` (`sku`/`campaign`/`brand`/`category`) with `'sku'` fallthrough; item `type` must be `'merged_group' | 'individual'` or becomes `undefined`; absent `cachedAt` honestly maps to `meta.last_sync = null` (fabricated NOW removed).
- **Drill-through key precedence (FE-16)**: campaign-grouped items expose the id as `advertId`; the normalizer reads `advertId` first and falls back to `campaignId`, otherwise the drill-through Link for campaign view never renders.
- **Daily ROAS is computed at the boundary**: `roas = revenue_attributed / spend`, `null` when `spend` is 0 or revenue is missing.

**`advertising-campaigns-normalizer.ts`** — `normalizeCampaignsResponse` rebuilds `{ meta: { total_count, active_count }, data }` from the backend `{ campaigns, total, … }` array; `active_count` is derived client-side by counting campaigns with backend `status === 9`. `normalizeCampaign` maps camelCase campaign fields to the FE `Campaign` shape (`campaign_id`, `type_name` defaulting to «Неизвестно», `nm_ids` coerced to strings, `placements` with tri-state `carousel`). `normalizeSyncStatusResponse` sanitizes `SyncTaskStatus` via an exhaustive `Record<SyncTaskStatus, true>` map (`SYNC_STATUS_MEMBERS` — adding a union member without updating the map is a compile error); invalid values map to the neutral `'idle'` with `logger.warn`, since the union has no `'unknown'` member and the badge has its own fallback.

**`search-analytics-item-normalizer.ts`** — per-item normalizers extracted from `search-analytics-normalizer.ts` for the three search endpoints (`/v1/analytics/search/by-product`, `/by-query`, `/orders`; types in `src/types/search-analytics.ts`):

- `avgPosition` is a 1-based position — `null` stays `null`, never `?? 0` (170.7).
- `avgCtr` is a rate → `toNullableNumber` (AP#8 split); impressions/clicks/orders are counts → `toCount`.
- `normalizeSearchOrderItem` **absorbs key drift**: returns `null` for un-renderable items (key missing or a non-string/number type), coerces numeric keys to string, and the consumer filters `null`s from the array. Optional fields (`vendorCode`, `uniqueProducts`, `uniqueQueries`) are set only when present — `undefined` is canonicalized to omission, not `null`, preserving optional-property semantics.
- `searchCartAdds` is an additive semantic alias for `totalClicks` (Request #178): WB's openCard→impressions / addToCart→clicks column mislabeling.

**`search-position-trends-normalizer.ts`** — four endpoint normalizers (types in `src/types/search-position-trends.ts`): `normalizePositionTrendsResponse` (week-over-week movers + page-one candidates + summary), `normalizePositionMoversResponse` (rolling `7d | 14d | 30d` period), `normalizePageOneOpportunitiesResponse`, and `normalizePositionHistoryResponse` (per-SKU daily history). Notable semantics:

- `TrendDirection` includes `'unknown'` (170.7): missing/unrecognized direction → `'unknown'`, never a fabricated `'stable'`. Unrecognized values warn **once per distinct value** (`warnedTrendValues` set) so a 500-row garbage payload does not spam 500 warns; an absent trend is legitimate no-data and is silently `'unknown'`.
- Position fields (`currentAvgPosition`, `previousAvgPosition`, `positionChange`, deltas) and `ctr` are nullable ratios (AP#8); counts, `positionsAway`, and summary counts use `toCount`.

Focused tests: `src/lib/api/__tests__/advertising-analytics-normalizer.test.ts` (happy-path full response, nullability, type coercion, empty shapes).

### Search CSV export

`src/lib/csv/search-csv-export.ts` — pure, side-effect-free CSV builders for the search domain; Blob/DOM/download are handled by `<ExportCsvButton>`:

- `exportSearchByProductToCsv(queries)`, `exportSearchByQueryToCsv(products)`, `exportSearchOrdersToCsv(items)` — each produces UTF-8-BOM-prefixed, `\r\n`-joined CSV where every cell passes through `escapeCsvCell`; an empty array yields BOM + headers only.
- **Unknown numeric → empty cell, uniformly** (preface-review F2): `avgPosition == null` and `fmtPct(null)` render `''`, not `'—'`, so spreadsheet blank filters catch all unknowns — a deliberate divergence from the on-screen "—" rendering.
- Numbers are formatted with the Russian locale (`toLocaleString('ru-RU')`); percentages use one decimal and a ` %` suffix; `searchCartAdds`/`uniqueProducts` fall back to `0` (counts, AP#8-legal).

### Naming conventions
- `normalize<Name>Response` — endpoint response normalizer
- `to<Type>` — scalar/enum coercion
- `normalize<Name>` — per-item normalizer

## Paid Storage Import — Authoritative Result Contract (Story 169.14)

The paid-storage import is the canonical example of a normalized **async job lifecycle**: the write endpoint returns a job id, and a boundary normalizer turns each subsequent status poll into a typed, status-scoped result that the UI state machine consumes without any defensive re-checking.

### API boundary (`src/lib/api/storage-analytics.ts`)

- `triggerPaidStorageImport({ dateFrom, dateTo })` → `POST /v1/imports/paid-storage`, returning `PaidStorageImportResponse` with `import_id` (snake_case contract; the backend enforces a max 8-day range per WB API limit).
- `getImportStatus(importId)` → `GET /v1/imports/{id}` with the raw response typed `unknown`, immediately passed through `normalizeImportStatusResponse` (`storage-import-normalizer.ts`). The normalizer is the **only** place backend import shapes are interpreted.

### Result contract (`normalizeImportStatusResponse`)

The `ImportStatusResponse` (types in `src/types/storage-analytics-trends.ts`) is the authoritative result shape, and every optional field is **status-scoped** — the normalizer only surfaces a field when the status legitimately owns it:

- `status` — validated against a `{ pending, processing, completed, failed }` map; any unrecognized or missing value becomes the frontend-only `'unknown'` sentinel with a single `logger.warn`. `'unknown'` is not a failure.
- `rows_imported` — only present when `status === 'completed'` **and** the raw value is a safe integer ≥ 0; otherwise `undefined` (never a fabricated 0).
- `error` (structured `{ code, message, details? }`) — only present when `status === 'failed'` **and** both `code` and `message` are strings; `details` is forwarded only when present. `error_message` mirrors `error?.message`.
- `date_range: { start, end }` — only present when both endpoints are strings.

### Lifecycle and consumers

The UI state machine lives in `useStorageImport` (`src/app/(dashboard)/analytics/storage/components/`), with the pure state type and date validation in `storage-import-utils.ts` (`ImportState = idle | processing | success | error`; `validateDates` enforces ordering, ≤8 days, and no future dates, all with RU messages; `getDefaultDates` defaults to the last 7 days ending yesterday). `PaidStorageImportDialog` renders one sub-view per state (`ImportIdleForm` / `ImportProcessing` / `ImportSuccess` / `ImportError`), passing `statusUnknown={statusData?.status === 'unknown'}` so the processing view can display an honest "status unknown" hint rather than pretending. Closing the dialog while `processing` requires an explicit confirm.

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> processing: mutateAsync accepted import_id
    processing --> processing: poll every 2s pending processing unknown
    processing --> success: status completed invalidateQueries
    processing --> error: status failed or trigger rejected
    success --> idle: close
    error --> idle: close or reset
```

*Paid-storage import lifecycle: only `completed`/`failed` from the normalized poll are terminal; the frontend-only `unknown` sentinel keeps polling exactly like `pending`/`processing` (`useImportStatus` stops `refetchInterval` only for `completed`/`failed`).*

Terminal transitions happen in a post-render `useEffect`: `completed` sets `status: 'success'` with `rows_imported` and invalidates the storage query cache; `failed` sets `status: 'error'` with the structured `error.code`/`error.message` (falling back to `error_message`, then a default RU message). The `useImportStatus` hook (TanStack Query, `staleTime: 0`, `retry: 2`) polls every 2s while the dialog is in `processing`, and its own `refetchInterval` callback treats only `completed` and `failed` as terminal — so an `'unknown'` poll result never silently freezes the UI on a stale state.

Focused tests: `src/app/(dashboard)/analytics/storage/components/__tests__/useStorageImport.test.tsx` pins the exact trigger payload, the 2s polling interval, terminal transitions, cache invalidation on success, and that `unknown` keeps polling.


## Anti-Pattern 8: Preserve Null Money and Ratio Values

> Full spec: `CLAUDE-ANTI-PATTERNS.md` AP#8

**Rule**: `?? 0` on nullable money/ratio fields lies about the data. Preserve `null`, render `—`. Counts and pagination still allow `?? 0`.

This rule governs the report-derived **historical SPP** values (`spp_rub`, `spp_pct`) on the SKU analytics page: a missing value stays `null` and renders `—`, while an explicit `0` renders as `0 ₽` / `0%`. The `includeCogs` filter on `useMarginAnalyticsBySku` (`include_cogs` query param) gates whether the backend returns these fields at all, and lives in the TanStack Query key so enabled/disabled states produce separate requests and cache entries. See [Domain Logic — Historical SPP](domain-logic.md#historical-spp-report-derived-sales-participation).

The consumer-side utilities apply the same semantics:

- **`src/lib/efficiency-accessors.ts`** — accessor wrappers around `efficiencyConfig` (defined in `src/lib/efficiency-utils.ts`, the Story 33.4-FE status table with RU labels, Lucide icons, and Tailwind color tokens per status). `getEfficiencyConfig(status: string)` accepts a plain *string* precisely because `efficiency_status` is backend-provided: an out-of-union value (the F-39 enum-drift crash class) would make `efficiencyConfig[status]` undefined and throw on `.icon`/`.label`, so it falls back to the `'unknown'` config (F-47 — defense-in-depth on top of the authoritative normalizer guard). `getRoasColorClass` is the **canonical ROAS → inline-text-color mapping** (iter-119 resolved a three-way threshold divergence where ROAS=4 rendered green on the analytics page but yellow on the dashboard card); `roas` is a raw multiplier (4.2x, not a percent), bands mirror the config's documented tiers (≥5 excellent, ≥3 good, ≥2 moderate, ≥1 poor, else loss), and `null`/`NaN` map to muted so callers may pass an unguarded value. `isAttentionRequired`/`isLossStatus` are the typed predicate helpers referenced by the normalizer contract above.
- **`src/lib/roi-profit-utils.ts`** — null-preserving ROI/profit formatters and FE fallback calculations: `formatROI` renders `null`/`undefined` as `—` (percent-units 0–100 scale, canonical ru-RU `formatPercentage`), `getROIRating` maps `null` → `—`, and `calculateROI`/`calculateProfitPerUnit` (used when the backend omits the field) return `null` on missing operands or a zero denominator rather than a fabricated 0 — the arithmetic counterpart of AP#8, not `?? 0`.

**ESLint enforcement** (`eslint.config.js`): A `no-restricted-syntax` AST rule flags new violations. Pre-existing legitimate exceptions use allowlist comments with canonical pattern names:
`BACKEND-CONTRACT-NON-NULL`, `SEMANTIC-ZERO`, `AGGREGATION-REDUCE`, `DISPLAY-GUARD`, `DEBUG-LOG`, `TEST-ASSERTION`.

**Ratchet guard**: `npm run check:anti-pattern-8-normalizer` (`scripts/check-anti-pattern-8-normalizer.sh`) — fails when violation count increases above the baseline (`scripts/.anti-pattern-8-normalizer-baseline.txt`).

## CSV Export Infrastructure

`src/lib/csv/` — Pure functions that convert typed arrays to RFC 4180-compliant CSV strings with UTF-8 BOM. Domain-specific export modules exist for buyout, funnel, advertising, pricing, returns, search, evaluations, SKU accuracy, and cross-reference data. The `<ExportCsvButton>` component handles Blob creation and download.

Core helper: `csv-helpers.ts` — `escapeCsvCell()` applies **OWASP CSV-injection defanging** (cells starting with `=`, `+`, `-`, `@`, TAB, CR, or LF are prefixed with a single quote so hostile product names like `=HYPERLINK(...)` cannot execute in Excel) and then RFC 4180 §2.6 quoting; `escapeCsvCellAlwaysQuoted()` preserves the legacy exporters whose stable file format quotes every cell without duplicating the security logic. Two deliberate, pinned trade-offs (do not "fix"): formatted negative values such as `"-1 234,56 ₽"` also match the leading `-` and gain a literal `'` (exempting `/^-\d/` would reopen the `-1+1|cmd` payload, and these cells are pre-formatted ru-RU strings Excel never treated as numeric); defanging checks the **cell-value start only**, so an embedded `safe\n=CMD()` gets no second-line prefix. `prefixUtf8Bom()` adds the UTF-8 BOM for Excel Cyrillic rendering. Null values render as "—" (em-dash).

Source: `src/lib/csv/`, tests in `src/lib/csv/__tests__/csv-helpers.test.ts`

## Communications Write-Back (NEW-2, Async 202 Job Polling)

The communications write-side (PR2) introduces a **gated async write** pattern distinct from the standard read-side normalizer flow. The BE write routes (reply, answer, send-chat, pin/unpin) all return **HTTP 202 `{ jobId, status }`** (the BullMQ enqueued-job state), not a synchronous result. The FE captures `jobId` and polls `GET /v1/communications/writeback/jobs/:jobId` until a terminal state.

```mermaid
sequenceDiagram
    participant U as User gesture
    participant H as Mutation hook
    participant BE as Backend write gate
    participant Q as BullMQ job
    H->>H: rotate confirmationToken
    H->>BE: POST write route + token
    alt gate disabled or not armed
        BE-->>H: 403 ApiError
        H-->>U: RU disabled message
    else gate passes
        BE->>Q: enqueue job
        BE-->>H: 202 jobId and status
        loop every 1.5s until terminal or 60s
            H->>BE: GET job status
            BE-->>H: status result error
        end
        alt status is completed
            H-->>U: success toast and invalidate
        else failed or poll error or timeout
            H-->>U: failure or timeout toast
        end
    end
```

*Communications write-back: a user gesture rotates a per-gesture confirmation token, the mutation POSTs to a 4-factor-gated BE route, and on 202 the coordinator polls the BullMQ job until a terminal state, a poll error, or the 60s timeout.*

### Four-factor write gate

All write routes are protected by a BE gate (JwtAuthGuard + CabinetGuard + `assertWritablePublic` env/arm/token) that returns **403** when write-back is disabled, not armed, or the token is missing. The FE maps a 403 `ApiError` to a clear RU "disabled" message — never a generic crash.

### Per-gesture confirmation token

`confirmationToken` is **presence-only** (a non-empty string), rotated as `crypto.randomUUID()` per user gesture inside the mutation hooks (`src/hooks/useCommunicationsWriteback.ts`). It is the 3rd factor of the 4-factor gate. This token is NOT a secret — it is the user-gesture proof, and the API client module never invents one (the hook supplies it so the proof stays at the UI boundary).

### BullMQ status allowlist (inverted-terminal)

`src/lib/communications-writeback-utils.ts` owns the status predicates (single source of truth; re-exported by `src/types/communications/writeback.ts`). Polling continues **only** for the four non-terminal BullMQ states (`active`, `waiting`, `delayed`, `waiting-children`) via an **allowlist** — every other state (including `completed`, `failed`, and unknown/unrecognized states) is treated as terminal. This is an allowlist (not a blocklist) precisely so an unknown state stops the poll (Defensive Frontend — a weird state can never spin the poll forever).

### Poll lifecycle

`usePollWritebackJob` (`src/hooks/useCommunicationsWriteback.ts`) takes `(jobId, attempt)` and polls every 1.5s with a hard **60s deadline** (`MAX_POLL_MS`); once elapsed, the job surfaces as a pseudo `timeout` terminal status so the submit button re-enables and a RU timeout message shows. `useWritebackJob` (`src/hooks/useWritebackJob.ts`) is the coordinator that wraps the mutation → 202 → poll → terminal flow shared by all four write surfaces: it fires `onTerminal` exactly once per **attempt** (guarded by a `firedRef` keyed on `attemptKey = jobId#attempt`), captures the action kind at fire time, and distinguishes a **poll error** (no job data) from a genuine BullMQ `failed` job.

### Retry-rearm for deterministic chat jobIds (NEW-2 fast-follow)

Chat sends enqueue with a **deterministic BullMQ jobId** (dedup), so retrying a timed-out send with byte-identical text reuses the **same** `jobId`. The original `firedRef`/reset-effect keyed only on `jobId`, so a re-submit of the same id would NOT re-run the reset effect, the poll would stay terminal (`timedOut = true`), and the retry would silently no-op. The fix: `setJobId` bumps an internal `attempt` **nonce** on *every* call (even when the id is unchanged) and threads it into `usePollWritebackJob` as part of the **query key** AND the reset-effect deps, and into `firedRef` via `attemptKey` (`jobId#attempt`). A re-submit of the same id therefore produces a **fresh query** (re-arms the poll, resets `startedAtRef`/`timedOut`) and re-arms terminal firing. One-shot paths (a new id per gesture, e.g. reply/answer/pin) are unaffected — the nonce bump is redundant-but-harmless there. The load-bearing regression test (`re-arms the poll when the SAME deterministic jobId is re-submitted after a timeout`) lives in `src/hooks/__tests__/useCommunicationsWriteback.test.ts`.

### `skipDataUnwrap` boundary detail

The pinned-reviews read endpoint (`GET /v1/communications/feedbacks/pinned`) is a **live SDK passthrough** that returns `{ data: PinnedReviewItem[], next }`. Because `apiClient` auto-unwraps `rawData.data ?? rawData` on every response, this endpoint REQUIRES `skipDataUnwrap: true` — without it, the `data` array would be hoisted out of the envelope and the normalizer would see `.data` = undefined → empty list. The liquidity trends endpoint (`GET /v1/analytics/liquidity/trends`) also uses `skipDataUnwrap: true` for its `{ meta, trends, insights }` envelope.

## Financial API Modules

| Module | Purpose |
|--------|---------|
| `financial-gaps.ts` | Import data gap detection, analysis, remediation (`/v1/imports/gaps/*`) |
| `liquidity.ts` + mappers | Liquidity analysis API |
| `buyout-analytics.ts` | Buyout rate per-SKU analytics |
| `unit-economics-normalizer.ts` | Unit economics response normalization |
| `margin-trends-normalizer.ts` | Margin trend data |
| `tax-analytics.ts` | Tax analytics |
| `acquiring-analytics.ts` | Acquiring/payment analytics |
| `cogs-history-normalizer.ts` / `bulk-cogs-normalizer.ts` | COGS history and bulk operations |
| `shipment-cost/fcu-aggregation-normalizer.ts` | FCU shipment cost allocation |
| `communications.ts` + `communications-normalizer.ts` | NEW-2 — WB seller communications (feedbacks, questions, chats, claims, pinned reviews); read-only list endpoints returning bare objects/arrays |
| `communications-writeback.ts` | NEW-2 (PR2) — gated write-side (reply/answer/send-chat/pin/unpin); all writes return HTTP 202 `{ jobId, status }` (BullMQ enqueued state), polled via `GET /writeback/jobs/:jobId` |
| `finances.ts` + `finances-normalizer.ts` | NEW-7 — account balance (`GET /v1/finances/balance`) + financial documents (`GET /v1/finances/documents`, `…/categories`, `…/:serviceName/download`); bare camelCase shapes from the BE |
| `pricing-basis.ts` | SPP-1 lane — cabinet repricing price basis (`GET`/`PUT /v1/pricing/basis`); `normalizePriceBasis()` folds unrecognized enum values to `'UNKNOWN'` (indicate, never relabel), `isSettablePriceBasis()` narrows the settable union, and `updatePricingBasis()` runtime-guards the PUT body. See [Domain Logic — Pricing Basis](domain-logic.md#pricing-basis-repricing-spp-1-lane) |

Source: `src/lib/api/`

## Finances Documents Flow (NEW-7, Story 172.10)

The `/finances` page is the canonical multi-source example (AC4): `BalanceCard` and `DocumentsTable` are **independent** sources, each owning its own loading/empty/error state machine, so one failing never blanks the other. Both are gated on `cabinetReady` (`cabinetId` present) — the hooks would 403 before a cabinet is selected, since `apiClient` injects `X-Cabinet-Id` at request time. The route also has its own error boundary (`error.tsx`): a render-time crash shows a `role="alert"` Card with a RU message and a `reset()` retry button (`data-testid="finances-error-state"`), instead of the raw Next.js error screen.

### Rate-limit-aware query hooks (`src/hooks/useFinances.ts`)

WB rate limits are mirrored in TanStack staleTimes (constants in `useFinances-utils.ts`) so the FE never refetches faster than WB allows (which would surface a 503):

| Hook | Endpoint | staleTime | Notes |
|------|----------|-----------|-------|
| `useAccountBalance` | `/v1/finances/balance` | 60s (WB 1/min) | `retry: 1` — 429s must not hammer the BE; `refetchOnWindowFocus: false` |
| `useFinanceDocuments(query)` | `/v1/finances/documents` | 10s (WB 1/10s) | query key includes the full query object (dedupe per filter/page) |
| `useFinanceDocumentCategories(locale)` | `…/categories` | 5min (stable options) | per-locale key defaulting to `'ru'` |

`useDownloadDocument` is a mutation (`boolean` result): it calls `downloadDocument`, builds a fallback filename from the last `/`-segment of `serviceName`, and pipes through `downloadDocumentResult`. `false` = empty/malformed base64 (a visible failure, not a silent no-op).

### Documents table composition (`src/app/(dashboard)/finances/`)

- **`DocumentsTable`** owns state (category, begin/end dates, sort, order, offset with `DEFAULT_PAGE_SIZE = 20`) and fetching; render branches were extracted to `DocumentsBody` in the Story 172.10 max-lines refactor. Every filter/sort/order change resets `offset` to 0 — otherwise `offset > 0` fetches a stale (likely empty) page under the new ordering. Date inputs are converted to inclusive ISO boundaries (`toIsoStart`/`toIsoEnd`).
- **`DocumentsFilters`** is stateless: category dropdown (fed by `useFinanceDocumentCategories`, with `categoryState = loading | error | ready` surfaced as a `role="status"` hint so a categories failure never blocks the documents list), native date inputs labeled via `<Label>`, and sort/order selects. Categories without a `name` are skipped — an empty value would collide with the "all" option and silently become a no-op filter.
- **`DocumentsBody`** renders the state machine: skeleton with `role="status"` loading announcement, destructive Alert + retry on error, **filtered-empty** (offers "Сбросить фильтры") vs **plain-empty** distinction, and the populated table with a `TableCaption` naming the WB source (RTC contract, spec order above the header), plus a keyboard-focusable scroll container (`scrollContainerTabIndex={0}`).
- **`DocumentDownloadButton`** wraps `useDownloadDocument` per row: an extension selector (pdf/xlsx, coerced from the BE `extensions` array with a `pdf|xlsx` default) + download button.

### Download a11y contract (Story 172.10)

The per-row download button is the a11y reference implementation for async feedback:

- **Pending**: the `Loader2` spinner is visual-only (`aria-hidden`); screen readers get a polite `role="status"` sr-only announcement («Скачивание документа…»).
- **Success**: an sr-only `role="status"` «Документ скачан» — no visual noise for a happy path.
- **Failure is visible**: `mutation.isError` **or** `mutation.isSuccess && data === false` (empty base64) renders a visible `role="alert"` «Не удалось скачать» plus the destructive `AlertCircle` icon — a silent failure would leave the user with no file and no explanation. Switching the extension selector calls `mutation.reset()`, clearing stale feedback that described the *previous* extension's attempt.
- All icons (`Download`, `Loader2`, `AlertCircle`) are `aria-hidden`; the button itself carries an `aria-label` naming the selected format.

### base64 → Blob pipeline (`src/lib/finances/download-blob.ts`)

Pure, side-effect-isolated so the decode + anchor-click is unit-testable without TanStack Query: `resolveMimeType` prefers a BE-returned `pdf`/`xlsx` extension over the requested one; `base64ToBlob` returns `null` (failure, not crash) on empty/malformed base64; `triggerBrowserDownload` appends a transient `<a download>` (Firefox requires DOM attachment), clicks it, and revokes the object URL after a **1s grace** — a 0ms revoke can abort the download before Firefox takes ownership of the blob URL. `downloadDocumentResult` returns `true` only when the full pipeline ran.
