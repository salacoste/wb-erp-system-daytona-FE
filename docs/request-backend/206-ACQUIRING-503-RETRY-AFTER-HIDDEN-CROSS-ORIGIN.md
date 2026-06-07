# 206 — Acquiring 503 `Retry-After` is hidden cross-origin → banner always shows fallback "~60 сек"

**Status**: RESOLVED (2026-06-06) — exposedHeaders added to CORS config (dev + prod) for Retry-After + X-RateLimit-* headers
**Severity**: LOW (cosmetic; banner still appears and conveys "rate-limited", only the countdown number is wrong)
**Discovered**: 2026-06-04 via Playwright runtime validation of the 3 acquiring rate-limit E2E tests
**Area**: CORS configuration / WB rate-limit (503) responses for all 3 acquiring endpoints

---

## Problem

When a WB acquiring endpoint returns **HTTP 503 + `Retry-After: N`**, the frontend rate-limit
banner is supposed to show the real backoff window ("Повтор через ~N сек"). In production it
**always shows the fallback `~60 сек`**, regardless of the actual `Retry-After` value the backend
sent.

The frontend's parse code is correct (`src/lib/api-client.ts:112-119` reads
`response.headers.get('Retry-After')`, validates `/^\d+$/` in `[1,600]`, and assigns
`apiError.retryAfter`). The bug is that the value **never reaches JS**.

## Root cause — CORS does not expose `Retry-After`

The frontend (`http://localhost:3100`, and the deployed origin) calls the backend
(`http://localhost:3000`) **cross-origin** — there is no same-origin proxy
(`NEXT_PUBLIC_API_URL=http://localhost:3000`).

`Retry-After` is **not** a [CORS-safelisted response header](https://fetch.spec.whatwg.org/#cors-safelisted-response-header-name).
Per the Fetch spec, a cross-origin `fetch` can only read a non-safelisted response header if the
server includes it in **`Access-Control-Expose-Headers`**. The backend's CORS config sets
`allowedHeaders` but **no `exposedHeaders`**:

```ts
// src/main.ts:78 (development) and :93 (production) — both blocks
app.enableCors({
  origin: ...,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Cabinet-Id', 'X-Trace-Id'],
  // ❌ no exposedHeaders → Retry-After is hidden from JS cross-origin
})
```

Result: `response.headers.get('Retry-After')` returns `null` in the browser →
`apiError.retryAfter` stays `undefined` → the banner uses its fallback of `60`
(`src/hooks/use-acquiring-rate-limit.ts:61` — `error.retryAfter ?? 60`).

## Evidence

Playwright E2E (`e2e/acquiring.spec.ts`, "Acquiring rate-limit") mocks a 503 with a `Retry-After`
header and asserts the banner shows that value:

- **list page** (`Retry-After: 30`) → FAILED (banner showed 60, not 30)
- **report detail** (`Retry-After: 45`) → FAILED (banner showed 60, not 45)
- **period detail** (`Retry-After: 60`) → "passed" — but only because the mocked value **equals**
  the fallback. A false pass that masked the defect.

Adding `Access-Control-Expose-Headers: Retry-After` to the mocked responses makes **all 3 pass**
(banner reads the real header). This isolates the defect to the missing CORS exposed-header.
The E2E mocks now encode this required contract.

## Requested fix (pick one — option A preferred)

### Option A — include `retryAfter` in the 503 JSON body (most robust)
Add `retryAfter: N` (seconds) to the 503 error response body for the 3 acquiring endpoints. The
response **body** is always readable cross-origin, so this needs no CORS change. **The frontend
already parses body `retryAfter`** (`src/lib/api-client.ts:123-139`, added in Story 96.12-FE for
the FBS-export 429 path) — accepts both number and numeric-string. Example:

```json
{ "error": { "message": "WB rate-limited" }, "retryAfter": 45 }
```

### Option B — expose the header via CORS
Add `exposedHeaders: ['Retry-After']` to **both** `app.enableCors(...)` blocks in `src/main.ts`
(dev + prod). Keeps the RFC-7231 `Retry-After` header as the source of truth; the frontend's
existing header parse then works unchanged.

> Either fix is sufficient. Option A is preferred because it removes the CORS dependency entirely
> and reuses the already-shipped body-fallback parse path.

## Affected endpoints
- `GET /v1/analytics/acquiring/reports` (list)
- `GET /v1/analytics/acquiring/reports/:id/detail` (report detail)
- `GET /v1/analytics/acquiring/detail` (period detail)

(Any other endpoint that relies on a `Retry-After` **header** for a cross-origin client has the
same latent issue — e.g. 429 paths — but only the acquiring 503 banner is user-visible today.)

## Frontend status
- No frontend code change needed — the parse logic is already correct for both header and body.
- E2E mocks updated to encode the required contract (`e2e/acquiring.spec.ts`).
- Banner gracefully degrades to `~60 сек` until the backend ships the fix; per the Defensive
  Frontend Principle the fallback is documented (`use-acquiring-rate-limit.ts`), not silent.
