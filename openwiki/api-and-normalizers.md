---
type: "Architecture Overview"
title: "API Layer & Normalizers"
description: "API client singleton with auto-injected auth and cabinet headers, the Boundary Normalizer Pattern that transforms backend responses into frontend-canonical shapes, Anti-Pattern #8 null semantics, and CSV export infrastructure."
---
# API Layer & Normalizers

## API Client Singleton

`src/lib/api-client.ts` exports a singleton `ApiClient` instance (`apiClient`). All API calls flow through it.

| Concern | Implementation |
|---------|----------------|
| **Base URL** | `env.apiUrl` from `src/lib/env.ts` → reads `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`). Endpoints are `/v1/...` paths. |
| **Auth header** | Auto-injects `Authorization: Bearer <token>` from `useAuthStore`. Bypassed via `options.skipAuth`. |
| **Cabinet header** | Auto-injects `X-Cabinet-Id` from `useAuthStore`. Bypassed via `options.skipCabinetId`. This is the multi-tenant isolation mechanism. |
| **Response unwrapping** | Backend returns `{ data: T }` envelopes. Client auto-unwraps `rawData.data`. Use `skipDataUnwrap: true` for paginated responses where `data` is a legitimate array field. |
| **Binary downloads** | `responseType: 'blob'` returns raw `Blob` without JSON parsing. |
| **Error handling** | Custom `ApiError` class carries `status`, `message`, `data`, `retryAfter`. HTTP 429/503 `Retry-After` header parsed and clamped to [1, 600] seconds. |

Source: `src/lib/api-client.ts`, `src/lib/api-interceptors.ts`, `src/lib/env.ts`

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
- `storage-queries-normalizer.ts` — Storage cost by SKU, top consumers
- `buyout-analytics-normalizer.ts` — Buyout/return rate (enum validation for source, confidence, trend)
- `liquidity-normalizer.ts` — Liquidity trends and distribution

### Naming conventions
- `normalize<Name>Response` — endpoint response normalizer
- `to<Type>` — scalar/enum coercion
- `normalize<Name>` — per-item normalizer

## Anti-Pattern 8: Preserve Null Money and Ratio Values

> Full spec: `CLAUDE-ANTI-PATTERNS.md` AP#8

**Rule**: `?? 0` on nullable money/ratio fields lies about the data. Preserve `null`, render `—`. Counts and pagination still allow `?? 0`.

**ESLint enforcement** (`eslint.config.js`): A `no-restricted-syntax` AST rule flags new violations. Pre-existing legitimate exceptions use allowlist comments with canonical pattern names:
`BACKEND-CONTRACT-NON-NULL`, `SEMANTIC-ZERO`, `AGGREGATION-REDUCE`, `DISPLAY-GUARD`, `DEBUG-LOG`, `TEST-ASSERTION`.

**Ratchet guard**: `npm run check:anti-pattern-8-normalizer` (`scripts/check-anti-pattern-8-normalizer.sh`) — fails when violation count increases above the baseline (`scripts/.anti-pattern-8-normalizer-baseline.txt`).

## CSV Export Infrastructure

`src/lib/csv/` — Pure functions that convert typed arrays to RFC 4180-compliant CSV strings with UTF-8 BOM. Domain-specific export modules exist for buyout, funnel, advertising, pricing, returns, search, evaluations, SKU accuracy, and cross-reference data. The `<ExportCsvButton>` component handles Blob creation and download.

Core helper: `csv-helpers.ts` — `escapeCsvCell()` (RFC 4180 §2.6 quoting), `prefixUtf8Bom()` (UTF-8 BOM for Excel Cyrillic rendering). Null values render as "—" (em-dash).

Source: `src/lib/csv/`

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

Source: `src/lib/api/`
