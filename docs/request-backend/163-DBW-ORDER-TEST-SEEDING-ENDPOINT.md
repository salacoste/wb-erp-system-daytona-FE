# Request 163 — DBW Order Test Seeding Endpoint for E2E Tests

**Date**: 2026-04-07
**Priority**: Medium
**Source**: Frontend Story 86.2 testarch test-review (M2 finding)
**Status**: Open — awaiting backend team

---

## Problem

Story 86.2 (Client Info PII for FBS Orders) introduced 5 critical Playwright E2E tests in `frontend/e2e/orders-client-info.spec.ts`. These tests verify production-critical privacy guarantees:

- AC #1 — Owner sees the "Клиент" column with name + phone for DBW orders
- AC #3 — Orders without DBW client info show "—" placeholder
- AC #4 — PII never logged to console (browser-level verification)
- AC #5 — PII never persisted to localStorage / sessionStorage (browser-level verification)
- G4 (testarch) — Privacy regression sentinel across navigation cycles

**The problem**: all 5 tests use `test.skip(condition, reason)` to gracefully skip when the test fixture has zero DBW orders with client info. In a clean seeded database, this is the **default state** — there are no DBW orders unless something explicitly seeds them.

**Result**: The tests appear as "yellow skipped" in CI reports instead of running real assertions. The privacy guarantees are unit-tested at the hook level (12 tests in `useClientInfo.test.ts` including 4 explicit privacy guardrail tests), but **browser-level verification is gated**.

---

## Root Cause

Frontend cannot create DBW orders directly:
- DBW order creation requires WB API integration with a real seller account
- Test seeding via the production order-creation flow would require fake WB credentials and a complex multi-step setup
- The backend already has all the infrastructure to insert DBW orders into the database — the frontend just needs an authenticated endpoint to call

---

## Proposed Solution

Add a test-only endpoint to the backend that the frontend E2E suite can call to seed DBW orders with client info:

### Endpoint specification

```
POST /v1/test/seed/dbw-order
Authorization: Bearer {test_token}  (Owner role required, gated to test environment)
X-Cabinet-Id: {test_cabinet_id}
Content-Type: application/json

Body:
{
  "orderId": "test-order-{uuid}",      // optional — backend generates if absent
  "clientName": "Иван И.",              // optional — defaults to faker name
  "clientPhone": "+7999***1234",        // optional — defaults to faker masked phone
  "nmId": 12345,                        // optional — defaults to first product in cabinet
  "supplierStatus": "new",              // optional — default
  "wbStatus": "waiting"                  // optional — default
}

Response (201 Created):
{
  "orderId": "test-order-abc-123",
  "clientName": "Иван И.",
  "clientPhone": "+7999***1234",
  "nmId": 12345,
  "deliveryType": "dbw",
  "createdAt": "2026-04-07T19:30:00.000Z"
}
```

### Cleanup endpoint

```
DELETE /v1/test/seed/dbw-order/:orderId
Authorization: Bearer {test_token}
X-Cabinet-Id: {test_cabinet_id}

Response (204 No Content)
```

### Environment gating (CRITICAL)

This endpoint must be **disabled in production**. Suggestions:

- Guard via `process.env.NODE_ENV !== 'production'` check at controller level
- OR guard via a feature flag `ENABLE_TEST_SEEDING_ENDPOINTS=true` set only in dev/staging/test
- OR guard via a separate `@Module` that's only imported in non-prod builds
- Return 404 (not 403) when disabled to avoid leaking the endpoint's existence in prod

### Authentication

- Owner role only (matches the existing `@Roles(UserRole.Owner)` guard on `/orders/client-info`)
- Cabinet isolation enforced via `X-Cabinet-Id` header (same pattern as other endpoints)
- The seeded order is bound to the calling cabinet — Manager/Analyst tokens cannot seed for arbitrary cabinets

---

## Frontend Integration

After this endpoint exists, the frontend will:

1. Add a Playwright fixture in `frontend/e2e/fixtures/dbw-orders-fixture.ts`:

```typescript
import { test as base } from '@playwright/test'

interface DbwOrderFixture {
  seedDbwOrder: (overrides?: Partial<{
    clientName: string
    clientPhone: string
    nmId: number
  }>) => Promise<{ orderId: string; nmId: number }>
}

export const test = base.extend<DbwOrderFixture>({
  seedDbwOrder: async ({ request }, use) => {
    const created: string[] = []

    const seed = async (overrides = {}) => {
      const res = await request.post(`${process.env.E2E_API_URL}/v1/test/seed/dbw-order`, {
        data: {
          clientName: 'Иван И.',
          clientPhone: '+7999***1234',
          ...overrides,
        },
        headers: {
          Authorization: `Bearer ${process.env.E2E_TEST_TOKEN}`,
          'X-Cabinet-Id': process.env.E2E_CABINET_ID ?? '',
        },
      })
      const order = await res.json()
      created.push(order.orderId)
      return order
    }

    await use(seed)

    // Auto-cleanup after test
    for (const id of created) {
      await request
        .delete(`${process.env.E2E_API_URL}/v1/test/seed/dbw-order/${id}`, {
          headers: {
            Authorization: `Bearer ${process.env.E2E_TEST_TOKEN}`,
            'X-Cabinet-Id': process.env.E2E_CABINET_ID ?? '',
          },
        })
        .catch(() => {
          // Best-effort cleanup; ignore failures during teardown
        })
    }
  },
})
```

2. Replace the `test.skip(linkCount === 0, ...)` patterns in `e2e/orders-client-info.spec.ts` with deterministic seed-then-assert flows:

```typescript
test('should render phone as a tel: link with aria-label when client info is available', async ({
  page,
  seedDbwOrder,
}) => {
  await seedDbwOrder({ clientPhone: '+79991234567' })
  const responsePromise = waitForClientInfoResponseOrNull(page)
  await page.goto(ORDERS_ROUTE)
  await responsePromise

  // No conditional skip — always asserts
  const phoneLink = page.getByRole('link', { name: /Позвонить клиенту/i }).first()
  await expect(phoneLink).toBeVisible()
  expect(await phoneLink.getAttribute('href')).toMatch(/^tel:/)
})
```

3. Result: 5 currently-skipped tests become deterministic and run on every CI build.

---

## Acceptance Criteria

- [ ] `POST /v1/test/seed/dbw-order` exists with documented request/response shape
- [ ] `DELETE /v1/test/seed/dbw-order/:orderId` exists for cleanup
- [ ] Endpoint returns 404 in production (`NODE_ENV=production`)
- [ ] Endpoint requires Owner role (matches existing `/orders/client-info` guard)
- [ ] Cabinet isolation enforced via `X-Cabinet-Id` header
- [ ] Seeded order is queryable via the existing `/v1/orders` endpoint
- [ ] Seeded order has `deliveryType: "dbw"` so it appears in `/v1/cabinets/:id/orders/client-info` results
- [ ] Documented in `test-api/03-cabinets.http` or `test-api/04-imports.http` with example requests
- [ ] Added to `docs/API-PATHS-REFERENCE.md` under a "Test-only endpoints" section

---

## References

- Frontend story file: `_bmad-output/implementation-artifacts/86-2-client-info-pii.md`
- Test-quality review identifying the gap: `_bmad-output/test-artifacts/test-review.md` (M2 finding)
- testarch automation summary: `_bmad-output/test-artifacts/automation-summary.md`
- Existing client-info endpoint: `src/cabinets/cabinets.controller.ts:445` (`getClientInfo`)
- Existing client-info DTO: `src/cabinets/dto/client-info-response.dto.ts`
- Frontend hook that consumes the endpoint: `frontend/src/hooks/useClientInfo.ts`
- Frontend E2E spec waiting on this: `frontend/e2e/orders-client-info.spec.ts`

---

## Why Now (Priority Justification)

- **Privacy is regulatory compliance** — DBW client name and phone are PII subject to GDPR-like rules. Browser-level verification of the privacy guardrails is the only way to catch regressions in caching, logging, or DOM rendering before they reach production.
- **5 currently-skipped tests is technical debt** — every yellow skip in CI is a coverage gap that will get worse, not better. Right now they're documented; in 6 months nobody will remember why they're skipped.
- **The frontend privacy guardrail tests work** — `useClientInfo.test.ts` has 4 explicit privacy guardrail tests at the hook level. Browser-level coverage is the missing tier.

## Estimated Backend Effort

Small — ~2-4 hours:

- New controller method (~20 lines)
- Service method to insert into the orders table (~15 lines)
- DTO + validation (~10 lines)
- Environment guard (~5 lines)
- Test-api `.http` file with examples (~20 lines)
- Unit + integration tests on the backend side (~40 lines)
