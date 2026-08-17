# Story 86.1: Bid Recommendations for Advertising Campaigns

Status: done

## Story

As a seller managing advertising campaigns,
I want to see recommended bid levels for my campaigns,
so that I can set optimal bid amounts to maximize visibility without overspending.

## Acceptance Criteria

1. Campaign detail page at `/analytics/advertising/campaigns/[advertId]` shows bid recommendations
2. Recommendations display: competitive, leaders, top-2 bids + per-keyword ranges
3. `advertId` and `nmId` validated as numbers before API call
4. Rate limit error → toast "Превышен лимит запросов"
5. staleTime = 30min (matches backend cache)

## Tasks / Subtasks

- [x] Task 1: Types + API function (AC: #3, #5)
  - [x] 1.1: Create `src/types/bid-recommendations.ts` — BidRecommendationsResponse, params
  - [x] 1.2: Create `src/lib/api/bid-recommendations.ts` — `getBidRecommendations(cabinetId, advertId, nmId)`
  - [x] 1.3: Validate advertId/nmId are numbers in API function

- [x] Task 2: Hook (AC: #4, #5)
  - [x] 2.1: Create `src/hooks/useBidRecommendations.ts`
  - [x] 2.2: staleTime: 30min, retry: false
  - [x] 2.3: enabled: !!advertId && !!nmId (refined: validNmId guard rejects 0/negative)

- [x] Task 3: Route + page scaffold (AC: #1)
  - [x] 3.1: Add `ANALYTICS.CAMPAIGN_DETAIL` to `src/lib/routes.ts`
  - [x] 3.2: Create `src/app/(dashboard)/analytics/advertising/campaigns/[advertId]/page.tsx`
  - [x] 3.3: Parse advertId from URL params; read `?nmId=` from search params

- [x] Task 4: Bid recommendations component (AC: #1, #2)
  - [x] 4.1: Create `src/components/custom/advertising/BidRecommendationsCard.tsx`
  - [x] 4.2: Display competitive, leaders, top-2 bid levels
  - [x] 4.3: Display per-keyword bid ranges if available
  - [x] 4.4: Loading skeleton + empty state

- [x] Task 5: Navigation from main table (AC: #1)
  - [x] 5.1: Wrap `campaign_id` cell in `PerformanceMetricsTable` with Link → `buildCampaignDetailRoute`

- [x] Task 6: Tests + lint
  - [x] 6.1: Unit test for API function (4 tests, validation + endpoint shape)
  - [x] 6.2: Unit test for hook (12 tests, fetch/guards/rate-limit toast/retry)
  - [x] 6.3: Component test for `BidRecommendationsCard` (17 tests covering all 4 states)
  - [x] 6.4: Lint + type-check all new files (zero errors)

### Review Follow-ups (AI)

- [x] [AI-Review][High] Story file completely unupdated — Status, Tasks, File List, Dev Agent Record empty
- [x] [AI-Review][High] Task 5 (navigation from main table) NOT IMPLEMENTED — campaign detail unreachable
- [x] [AI-Review][High] AC #4 rate limit toast had zero test coverage
- [x] [AI-Review][Medium] `useBidRecommendations` hook had no test file
- [x] [AI-Review][Medium] `BidRecommendationsCard` (149 lines) had no test file
- [x] [AI-Review][Medium] `cachedAt` field was defined but never displayed
- [x] [AI-Review][Medium] Negative/zero bid values rendered as "0 ₽" without explanation
- [x] [AI-Review][Low] `data.nmId` used in CardDescription instead of the `nmId` prop
- [x] [AI-Review][Low] `colors` object was redeclared inside `BidLevel` component on every render
- [x] [AI-Review][Low] Decorative `<TrendingUp>` icons leaked to screen readers
- [x] [AI-Review][Low] Manual query string instead of `URLSearchParams`
- [x] [AI-Review][Low] `BidRecommendationsCardProps` interface lacked JSDoc

## Dev Notes

### Backend Endpoint

```
GET /v1/cabinets/:id/campaigns/:advertId/bid-recommendations?nmId=X
Headers: Authorization + X-Cabinet-Id

Response (estimated shape — confirm with backend):
{
  advertId: number,
  nmId: number,
  recommendations: {
    competitive: number,    // competitive bid level
    leaders: number,        // leader bid level
    top2: number,           // top-2 bid level
  },
  keywords?: Array<{
    keyword: string,
    minBid: number,
    maxBid: number,
    recommendedBid: number,
  }>,
  cachedAt: string,         // ISO 8601
}
```

Cache: 30min backend. Rate-limited.

### Route Pattern (from supplies/shipments)

```
src/app/(dashboard)/analytics/advertising/campaigns/[advertId]/page.tsx
```

```typescript
// routes.ts
ANALYTICS: {
  ...existing,
  CAMPAIGN_DETAIL: '/analytics/advertising/campaigns',
}

export const buildCampaignDetailRoute = (advertId: number) =>
  `/analytics/advertising/campaigns/${advertId}`
```

### Validation Pattern

```typescript
export async function getBidRecommendations(
  cabinetId: string,
  advertId: number,
  nmId: number
): Promise<BidRecommendationsResponse> {
  if (!Number.isFinite(advertId) || !Number.isFinite(nmId)) {
    throw new Error('advertId and nmId must be valid numbers')
  }
  const params = new URLSearchParams({ nmId: String(nmId) })
  return apiClient.get<BidRecommendationsResponse>(
    `/v1/cabinets/${cabinetId}/campaigns/${advertId}/bid-recommendations?${params}`
  )
}
```

### Architecture Constraints

- Files < 200 lines, no `as` casts, no `any`
- Campaign detail page: `'use client'` (needs URL params)
- Use `useParams<{ advertId: string }>()` and parse to number
- Toast for rate limit: `import { toast } from 'sonner'`

### Existing Patterns to Follow

- **Detail page**: `src/app/(dashboard)/shipments/[id]/page.tsx` — useParams, loading/error states
- **API function**: `src/lib/api/advertising-analytics.ts` — buildQueryString, skipDataUnwrap
- **Hook**: `src/hooks/advertising/hooks.ts` — query keys factory, staleTime patterns
- **Campaign type**: `src/types/advertising-analytics.ts` — campaign_id: number

### References

- [Source: _bmad-output/planning-artifacts/epics-80-83-fe.md#Story-861]
- [Source: src/app/(dashboard)/shipments/[id]/page.tsx] — detail page pattern
- [Source: src/types/advertising-analytics.ts] — campaign types

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

**Initial implementation (commits `936b9bb`, `2ae980a`):**
- Created types, API function, hook, page, and card component (5 new files)
- Added 4 API unit tests covering endpoint URL, validation, and error propagation
- Wired campaign detail page to read `?nmId=` from URL search params

**Code review fixes (this session):**
- ✅ Resolved review finding [High] — Implemented Task 5 navigation: wrapped `campaign_id` cell in `PerformanceMetricsTable` with a `Link` to `buildCampaignDetailRoute`. Campaign detail page is now reachable from the advertising analytics table.
- ✅ Resolved review finding [High] — Added 12 hook unit tests covering: success path, validNmId guard (undefined/0/negative/NaN), rate limit toast (AC #4), non-429 errors don't toast, retry: false behavior, query key factory.
- ✅ Resolved review finding [High] — AC #4 rate limit toast now has explicit test coverage (`shows rate limit toast when API returns 429`).
- ✅ Resolved review finding [Medium] — Created `BidRecommendationsCard.test.tsx` with 17 tests covering all 4 render states (no nmId, loading, error, success), keyword list visibility, prop-vs-data nmId, invalid bid handling, and cache age formatting.
- ✅ Resolved review finding [Medium] — Display `cachedAt` as "обновлено N мин назад / N ч назад / только что" indicator in CardDescription.
- ✅ Resolved review finding [Medium] — `BidLevel` now shows "—" placeholder for non-finite or non-positive bid values instead of confusing "0 ₽".
- ✅ Resolved review finding [Low] — `CardDescription` now uses the `nmId` prop instead of `data.nmId` (defensive against backend echo mismatch).
- ✅ Resolved review finding [Low] — Hoisted `BID_LEVEL_COLORS` to module level (no per-render reallocation).
- ✅ Resolved review finding [Low] — Added `aria-hidden="true"` to all decorative `<TrendingUp>` icons.
- ✅ Resolved review finding [Low] — `getBidRecommendations` now builds the query string via `URLSearchParams` (matches project convention).
- ✅ Resolved review finding [Low] — Added JSDoc to `BidRecommendationsCardProps` interface.
- ✅ Fixed pre-existing `beforeEach(() => vi.clearAllMocks())` typing issue in `bid-recommendations.test.ts` (VitestUtils → void return).

**Test results:** 33 tests pass (4 API + 12 hook + 17 component). Zero regressions in 152 advertising component tests.

### File List

**New files:**
- `src/types/bid-recommendations.ts` — Type definitions
- `src/lib/api/bid-recommendations.ts` — API function with `URLSearchParams` query builder
- `src/hooks/useBidRecommendations.ts` — TanStack Query hook with rate-limit toast
- `src/app/(dashboard)/analytics/advertising/campaigns/[advertId]/page.tsx` — Campaign detail page
- `src/components/custom/advertising/BidRecommendationsCard.tsx` — Card component
- `src/lib/api/__tests__/bid-recommendations.test.ts` — API unit tests (4 tests)
- `src/hooks/__tests__/useBidRecommendations.test.ts` — Hook unit tests (12 tests)
- `src/components/custom/advertising/__tests__/BidRecommendationsCard.test.tsx` — Component tests (17 tests)

**Modified files:**
- `src/lib/routes.ts` — Added `ANALYTICS.CAMPAIGN_DETAIL` constant and `buildCampaignDetailRoute` helper
- `src/app/(dashboard)/analytics/advertising/components/performance-table/PerformanceMetricsTable.tsx` — Wrapped `campaign_id` cell in `Link` to campaign detail page (Task 5)

## Change Log

| Date       | Change                                                          |
|------------|-----------------------------------------------------------------|
| 2026-04-06 | Initial implementation (story 86.1)                             |
| 2026-04-06 | Code review round 1 — added API tests, fixed nmId guard, URL search params |
| 2026-04-06 | Code review round 2 — addressed 12 review findings (3 High, 4 Medium, 5 Low). Implemented Task 5 navigation, added 29 new tests, semantic refinements |
