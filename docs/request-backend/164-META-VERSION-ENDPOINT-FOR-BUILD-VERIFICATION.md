# Request 164 — `/v1/meta/version` Endpoint for Build Verification (Already Exists)

**Date**: 2026-04-08
**Priority**: Informational (FYI — endpoint already shipped)
**Source**: Backend Story 86.4 (`_bmad-output/implementation-artifacts/86-4-document-existing-meta-version-endpoint-for-frontend-debug.md`)
**Status**: ✅ Available now — no backend work required
**Backlog**: closes `task-178`

---

## TL;DR

There is already a public `GET /v1/meta/version` endpoint on the backend that returns the running build's version, commit SHA, build timestamp, and environment. **You can hit it from the frontend (or any browser/curl) without authentication** to verify which `dist/main.js` PM2 is currently serving — no need to `ls -la dist/main.js` or `git rev-parse HEAD`.

```bash
curl http://localhost:3000/v1/meta/version
```

```json
{
  "version": "1.0.0",
  "commit_sha": "unknown",
  "build_timestamp": "2026-04-08T15:33:26.538Z",
  "environment": "development"
}
```

---

## Why this doc exists

---

## Backend Team Response

**Status**: RESOLVED (already available)
**Resolution date**: 2026-04-08
**Summary**: The `GET /v1/meta/version` endpoint already exists and returns version, commit SHA, build timestamp, and environment. No authentication required. Frontend can use it to verify which build PM2 is serving without SSH access.
**Remaining frontend action**: None - endpoint available. Use `curl http://localhost:3000/v1/meta/version` for build verification.
The 2026-04-07 frontend session report (task-178 trigger) proposed adding a "health check endpoint that returns the build version". After investigation, **the endpoint already exists** — it shipped in Story 5.1 (containerized deployments). The frontend team simply did not know to look for it.

This doc fixes the awareness gap. It lives in `frontend/docs/request-backend/` (the canonical place frontend devs check for "what backend already exists") so the next session does not re-propose the same thing.

---

## When to use it

| Scenario | Use it like this |
|----------|-----------------|
| You ran `npm run build && pm2 restart wb-repricer` and want to confirm the new build is actually running | `curl http://localhost:3000/v1/meta/version` and check `build_timestamp` is fresh |
| You're debugging a "the change should be live but isn't" issue | Compare the live `build_timestamp` against your last build time |
| You're writing an E2E spec that needs to know which backend version it's running against | `fetch('/v1/meta/version').then(r => r.json())` — no auth needed |
| You want to confirm a deploy went out in CI | curl the endpoint after deploy and assert `commit_sha` matches the expected commit |
| You're onboarding a new dev and they ask "how do I know my changes are running?" | Point them at this endpoint instead of `ls -la dist/` |

---

## Endpoint contract

```
GET /v1/meta/version
```

| Property | Value |
|----------|-------|
| Method | `GET` |
| Path | `/v1/meta/version` |
| Auth | **None** — `@Public()`, no JWT required, no `X-Cabinet-Id` header |
| Rate limit | None (it's a static metadata response) |
| CORS | Allowed from frontend origin |
| Source | `src/health/health.controller.ts:131-148` |
| DTO | `src/health/dto/version-response.dto.ts` (`VersionResponseDto`) |
| Tag | `Health` (Swagger UI) |

### Response shape

```typescript
interface VersionResponse {
  version: string         // from package.json (e.g., "1.0.0")
  commit_sha: string      // from $COMMIT_SHA env var, defaults to "unknown" when unset
  build_timestamp: string // from $BUILD_TIMESTAMP env var, defaults to current ISO time when unset
  environment: string     // from $NODE_ENV, defaults to "development" when unset
}
```

### Status codes

| Code | Meaning |
|------|---------|
| `200 OK` | Always — the endpoint cannot fail under normal operation |

There is no `404`, `401`, `403`, or `500` path. If you get a 5xx, the backend itself is broken (try `GET /v1/health` next).

### Defaults caveat

`commit_sha` defaults to `"unknown"` and `build_timestamp` defaults to the current ISO time when the env vars are not set. **In local dev (`NODE_ENV=development`), expect `commit_sha === "unknown"` and `build_timestamp` close to the PM2 restart time.** In production-built containers, both env vars are baked in at build time and reflect the real commit + build moment.

---

## Frontend usage example

> **Why direct `fetch()` instead of the project's `apiClient`?** The shared `src/lib/api-client.ts` auto-injects `Authorization: Bearer {token}` and `X-Cabinet-Id` headers. This endpoint is `@Public()` (no JWT, no cabinet) and is intentionally callable **before authentication is set up** (e.g., from a startup splash screen, or when `useAuthStore().token` is still `null`). Bypassing the api-client is the correct pattern here — do **not** route this through `apiClient` and do **not** copy this snippet into a place that already imports `apiClient`.

```typescript
// src/lib/api/meta.ts (or wherever your API helpers live)

// Field names are snake_case to match the backend wire format (NestJS does NOT
// transform DTO field names). Do NOT "fix" to camelCase — the deserialization
// will silently produce undefined fields.
export interface VersionResponse {
  version: string
  commit_sha: string
  build_timestamp: string
  environment: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export async function getBackendVersion(): Promise<VersionResponse> {
  // Direct fetch — endpoint is @Public() (no JWT/cabinet headers needed).
  // Do NOT route through the shared apiClient — see note above.
  const response = await fetch(`${API_URL}/v1/meta/version`)
  if (!response.ok) {
    throw new Error(`Backend version endpoint returned ${response.status}`)
  }
  return response.json()
}
```

```typescript
// In a component or hook
const { data: version } = useQuery({
  queryKey: ['backend-version'],
  queryFn: getBackendVersion,
  staleTime: Infinity, // doesn't change until backend restart
})
```

---

## Already documented elsewhere

This endpoint is documented in **3 backend reference surfaces** — this doc just adds the frontend awareness layer:

| Where | Reference |
|-------|-----------|
| Manual test-api file | [`../../../test-api/02-health.http:31-35`](../../../test-api/02-health.http) — `### 3. Service Version & Build Metadata (Story 5.1)` block + response example at lines 193-202 |
| Auto-generated test-api file | [`../../../test-api/17-health.http:131-176`](../../../test-api/17-health.http) — refreshed by `npm run docs:generate` (Stories 86.1 + 86.2) |
| Architecture index | [`../../../CLAUDE-API.md:49`](../../../CLAUDE-API.md) — listed in the public-endpoints table |
| Live Swagger UI | http://localhost:3000/api → Health tag → `GET /v1/meta/version` |
| OpenAPI spec | `curl http://localhost:3000/api-json | jq '.paths."/v1/meta/version"'` |

---

## Historical context

> **Glossary** for readers without backend BMad context:
> - **"Story 5.1"** = the original BMad backend story (~2025) that introduced this endpoint. Just a historical pointer.
> - **`@Public()`** = a NestJS decorator on the backend route that disables the global JWT auth guard for that endpoint. Means "no Authorization header required".
> - **`task-NNN`** = Backlog.md task tracker entries living in `backlog/tasks/` at the project root. Equivalent to issues.

- **Story 5.1** (origin, ~2025): added the endpoint for containerized deployment version detection (Docker images set `$COMMIT_SHA` and `$BUILD_TIMESTAMP` at build time)
- **2026-04-07**: frontend session proposed "add a build version endpoint" — the proposer didn't know one existed
- **task-178** filed on the assumption that the test-api documentation gap was the root cause
- **2026-04-08** Story 86.4 dev-story discovered the endpoint is already in test-api files; re-scoped to fix the **frontend awareness gap** instead (this doc)
- **Story 86.6** (`task-176`) will add a CLAUDE.md verification ritual that points at this endpoint as a post-`npm run rebuild` sanity check (out of scope for Story 86.4 — explicit handoff)

---

## Cross-references

- Backend story file: `_bmad-output/implementation-artifacts/86-4-document-existing-meta-version-endpoint-for-frontend-debug.md`
- Backlog task: `backlog/tasks/task-178 - Dev-Workflow-Document-existing-v1-meta-version-endpoint-for-frontend-debug.md`
- Related (deferred): `backlog/tasks/task-176 - Dev-Workflow-CLAUDE.md-—-make-backend-rebuild-ritual-prominent.md` (Story 86.6)
- Source: `src/health/health.controller.ts:131-148`
- DTO: `src/health/dto/version-response.dto.ts`
