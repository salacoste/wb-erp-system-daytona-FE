# Story 88.1-FE: Clean Source TODOs

Status: done

## Story

**As a** developer maintaining the codebase,
**I want** the two outstanding `TODO` markers in production code resolved,
**so that** the codebase has zero unplanned deferrals and `grep -rn "TODO" src/` returns clean.

**Epic**: 88-FE Tech Debt Cleanup & Process Hardening
**Priority**: P2
**Estimate**: 2 SP

---

## Context

A grep sweep of `src/**/*.ts(x)` (excluding test files) found exactly 2 remaining `TODO` markers. Both have been latent for multiple epics with no visible tracking.

### TODO #1 — `src/lib/api/advertising-analytics.ts:117`

```ts
// Adapt backend format to frontend format (Campaign interface from types/advertising-analytics.ts:194)
const response: CampaignsResponse = {
  meta: {
    cabinet_id: '', // TODO: Get from auth context
    total_count: backendResponse.total,
    active_count: backendResponse.campaigns.filter(c => c.status === 9).length,
  },
  // ...
}
```

**Investigation (conducted during story creation):**
- `CampaignsResponse.meta.cabinet_id` is declared in `src/types/advertising-analytics/analytics.ts:29`.
- A project-wide grep `response.meta.cabinet_id|campaignsResponse.meta.cabinet_id` returns **zero consumers**.
- No component, hook, or downstream transform reads this field.

**Decision:** This is dead data. The correct fix is to **remove `cabinet_id` from the response construction** (and optionally from the type definition), not to wire it through. The `// TODO` marker represents an intent that was never actioned because the field was never needed.

### TODO #2 — `src/components/custom/price-calculator/priceCalculatorUtils.ts:80`

```ts
/**
 * Story 44.37: Remove unsupported fields from API request
 * These fields are used for frontend display and calculations only.
 * Backend API (Epic 43) does not yet support these fields.
 * TODO: Re-enable when backend implements support
 *       (see docs/request-backend/100-epic-44-open-issues-consolidated.md)
 * ...
 */
```

**Investigation:**
- This is a JSDoc comment describing why certain fields are stripped from the API request, not an actionable code TODO.
- The referenced backend request (#100) is still pending — see `docs/request-backend/100-epic-44-open-issues-consolidated.md`.
- The code itself is correct; the `TODO:` marker is misleading because there's nothing to "do" on the frontend until backend acts.

**Decision:** Replace `TODO:` with a non-grep-triggering marker (e.g., `PENDING BACKEND:`) that documents the blocked status without polluting TODO searches. The reference to the backend request remains.

---

## Acceptance Criteria

### AC-1: advertising-analytics.ts cleaned
- [ ] `src/lib/api/advertising-analytics.ts:117` no longer contains `// TODO: Get from auth context`.
- [ ] `cabinet_id: ''` is removed from the response construction.
- [ ] The `meta.cabinet_id` field is **removed** from `CampaignsMeta` / `CampaignsResponse.meta` type definition in `src/types/advertising-analytics.ts` if no consumer uses it (verified via project-wide grep).
- [ ] If removal breaks any downstream code path, widen the type to `cabinet_id?: string` and document the decision in Dev Notes — but this is the fallback; removal is preferred.

### AC-2: priceCalculatorUtils.ts TODO marker converted
- [ ] `src/components/custom/price-calculator/priceCalculatorUtils.ts:80` no longer contains the bare string `TODO:`.
- [ ] The comment block is preserved (explanation of why fields are stripped, reference to backend request #100).
- [ ] Marker replaced with `PENDING BACKEND:` or equivalent that does NOT match `/\bTODO\b/i` greps.

### AC-3: Zero residual TODOs
- [ ] `grep -rnE "TODO|FIXME" src --include="*.ts" --include="*.tsx" | grep -v "__tests__\|\.test\."` returns **zero lines**.
- [ ] `npm run type-check` passes with zero errors.
- [ ] `npm run lint` passes with zero warnings or errors.

### AC-4: No regressions
- [ ] Full unit test suite passes (`npm test -- --run`) — maintain current 6698+ passing.
- [ ] Advertising campaigns page (`/analytics/advertising/campaigns`) still loads without console errors (verified via Chrome).

---

## Tasks / Subtasks

### Task 1: Investigate consumers of `meta.cabinet_id` (AC-1)
- [ ] 1.1: Run `grep -rn "meta.cabinet_id\|meta\?\.cabinet_id" src/` — confirm zero consumers (already verified during story creation, re-confirm during implementation).
- [ ] 1.2: Run `grep -rn "cabinet_id" src/types/advertising-analytics.ts` to enumerate the type field's appearance.
- [ ] 1.3: Document findings briefly in Dev Notes → "Removal Impact".

### Task 2: Remove `cabinet_id` from advertising response (AC-1)
- [ ] 2.1: Edit `src/lib/api/advertising-analytics.ts:117` — delete the line `cabinet_id: '', // TODO: Get from auth context`.
- [ ] 2.2: Edit `src/types/advertising-analytics/analytics.ts:29` — remove `cabinet_id: string` field from the meta interface (or mark optional if removal breaks tests).
- [ ] 2.3: Run type-check — fix any downstream type errors.
- [ ] 2.4: Update mock handlers (`src/mocks/handlers/advertising.ts:49,306`) to match — remove `cabinet_id` from mock responses.

### Task 3: Convert priceCalculatorUtils TODO marker (AC-2)
- [ ] 3.1: Edit `src/components/custom/price-calculator/priceCalculatorUtils.ts:80` — replace `TODO: Re-enable when backend implements support` with `PENDING BACKEND: Re-enable when backend implements support`.
- [ ] 3.2: Keep the backend request reference line (`(see docs/request-backend/100-epic-44-open-issues-consolidated.md)`) unchanged.

### Task 4: Verify no residual TODOs (AC-3)
- [ ] 4.1: Run `grep -rnE "TODO|FIXME" src --include="*.ts" --include="*.tsx" | grep -v "__tests__\|\.test\."` — output must be empty.
- [ ] 4.2: Run `npm run type-check` — zero errors.
- [ ] 4.3: Run `npm run lint` — zero warnings.

### Task 5: Regression check (AC-4)
- [ ] 5.1: Run `npm test -- --run` — maintain 6698+ passing.
- [ ] 5.2: `npm run dev`, open `/analytics/advertising/campaigns` in Chrome, verify no new console errors.
- [ ] 5.3: Screenshot or note the state in Completion Notes.

---

## Dev Notes

### Why remove `cabinet_id` instead of wiring it?

The simplest explanation of why this TODO never got actioned: nobody needs the data. The field was defined in the type because the backend response declared it (or someone thought it would be useful), but no downstream code consumes `response.meta.cabinet_id`. Wiring it through from `useAuthStore` would be dead work — we'd read from auth, store in the response, and no reader would use it.

If a future feature needs the cabinet ID in an advertising response context, the right place to read it is from `useAuthStore` directly at the consumer site, not from the response meta. The response meta should reflect actual backend data.

### Why rename TODO → PENDING BACKEND?

A `TODO` marker implies "someone on this team should do this." This specific case describes code that's **correctly** stripped because the backend doesn't support the fields. There is no frontend action to take until backend implements Epic 43 extensions. `PENDING BACKEND:` makes the blocked status explicit and keeps the comment self-documenting without polluting TODO greps.

Alternative naming considered: `NOTE:`, `BLOCKED BY BACKEND:`, `BACKEND-DEPENDENT:`. All work. `PENDING BACKEND:` is the most search-friendly if we ever want to list backend-blocked items.

### Files touched (expected)

| File | Action | Lines |
|------|--------|-------|
| `src/lib/api/advertising-analytics.ts` | Modify | ~1 removal |
| `src/types/advertising-analytics.ts` | Modify | ~1 field removal |
| `src/mocks/handlers/advertising.ts` | Modify | ~2 mock field removals |
| `src/components/custom/price-calculator/priceCalculatorUtils.ts` | Modify | ~1 string change |

### Out of scope

- Addressing backend request #100 itself (blocked on backend team).
- Any other TODO markers in test files (they're acceptable — tests often have pending scenarios).
- Adding a CI lint rule that rejects new TODOs (could be a future story — not this one).

---

## References

- `src/lib/api/advertising-analytics.ts:117` — TODO site #1
- `src/components/custom/price-calculator/priceCalculatorUtils.ts:80` — TODO site #2
- `src/types/advertising-analytics/analytics.ts:29` — `cabinet_id` type field to remove
- `src/mocks/handlers/advertising.ts:49,306` — mock handlers to update
- `docs/request-backend/100-epic-44-open-issues-consolidated.md` — backend dependency for price calculator (referenced in comment, unchanged)
- `_bmad-output/planning-artifacts/epics-88-fe.md` — Epic 88 overview

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- **TODO #1 (advertising-analytics.ts)**: Investigation confirmed zero consumers of `CampaignsResponse.meta.cabinet_id`. Removed the field from (a) the response construction in the adapter, (b) the `CampaignsResponse.meta` type definition, (c) the `mockCampaignsResponse` mock. Alternative "wire it up" approach rejected — would be dead data.
- **TODO #2 (priceCalculatorUtils.ts)**: Renamed `TODO: Re-enable when backend implements support` → `PENDING BACKEND: Re-enable when backend implements support`. Backend request #100 reference preserved. This removes the marker from `/\bTODO\b/` greps without losing context about why the code is blocked.
- **Regression verification**: Full unit suite passes (6746/6746 minus 3 pre-existing DashboardPeriodSelector failures unrelated to this story). CampaignSelector.test.tsx 10/10 pass. Type-check clean. Lint clean.
- **Prettier formatter** reformatted ~30 lines in `src/mocks/handlers/advertising.ts` (double-space → single-space comment alignment) and 1 import in `priceCalculatorUtils.ts`. Cosmetic only, expected behavior from pre-commit hook.

### Change Log

| Date | Change |
|------|--------|
| 2026-04-14 | Story created via create-story workflow |
| 2026-04-14 | Implementation complete. Commit: `e895383`. Code review: 0 HIGH/MEDIUM findings, 1 LOW (story file completion) fixed in review. |

### File List

**Modified (4):**
- `src/types/advertising-analytics.ts` — removed `cabinet_id` from `CampaignsResponse.meta`
- `src/lib/api/advertising-analytics.ts` — removed `cabinet_id: ''` from response construction (line 117)
- `src/mocks/handlers/advertising.ts` — removed `cabinet_id` from `mockCampaignsResponse.meta`
- `src/components/custom/price-calculator/priceCalculatorUtils.ts` — renamed `TODO:` → `PENDING BACKEND:` in JSDoc comment (line 80)

**Created:** None
**Deleted:** None
