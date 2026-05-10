# Backend Story 107.3 — CabinetGuard Verification Tracking

**Status**: Speculative tracking (open audit — see § "Where backend Story 107.3 lives — caveat per Story 96.17-FE 1st-pass review M-1" section below; backend-side security audit independent of frontend code)
**Filed**: 2026-05-10 (per Story 96.17-FE Disposition A)
**Frontend story**: 96.17-FE (closed as already-shipped per Story 86.2 precedent)
**Trigger date**: 2026-06-15 (original E5 contract)

---

## Why this memo exists

Epic 96-FE Story 96.17 was originally framed with an **E5 hard drop-trigger**: backend Story 107.3 must verify `CabinetGuard` status on `/v1/test/seed/dbw-order` endpoints before frontend story is `ready-for-dev`. If backend Story 107.3 didn't close by **2026-06-15**, Story 96.17 was scheduled to be dropped from Epic 96-FE entirely.

**Pre-flight discovery during Story 96.17 authoring (2026-05-10) revealed the entire deliverable was ALREADY SHIPPED by Story 86.2** — `e2e/fixtures/dbw-order-seed.ts` already integrates `POST /v1/test/seed/dbw-order` + `DELETE /v1/test/seed/dbw-order/:orderId` with 1 existing consumer at `e2e/orders-client-info.spec.ts`.

This decouples two concerns the original E5 framing conflated:
1. **Endpoint EXISTS + frontend integration shipped**: ✅ Done (Story 86.2).
2. **Endpoint is MULTI-TENANT-SAFE (CabinetGuard verification)**: ⚠️ Open backend security audit (Story 107.3).

**Concern (1) is a frontend implementation gate** — already satisfied. **Concern (2) is a backend security audit** — requires backend code changes if it fails, NOT frontend changes.

Therefore: Story 96.17 closes per Disposition A; this memo tracks concern (2) independently.

---

## What's tracked here

### The open backend security audit

`/v1/test/seed/dbw-order` endpoints (POST + DELETE) seed test orders with mock client PII. The endpoints are guarded by `NODE_ENV=development` (404 in production-like envs) per backend implementation. **Open question**: do these endpoints also enforce `CabinetGuard` (cabinet-isolation) so a developer in cabinet A cannot seed orders in cabinet B?

If `CabinetGuard` is NOT enforced:
- **Risk**: in shared dev environments (e.g., team-shared dev DB), one developer's E2E test could seed orders affecting another developer's cabinet.
- **Severity**: Low (dev-only endpoints, 404 in production, NO real PII data exposure since the mock data is intentionally short + masked per `e2e/fixtures/dbw-order-seed.ts:35` `SEED_CLIENT` constant).
- **Mitigation if confirmed missing**: backend adds `CabinetGuard` middleware to the `/v1/test/seed/*` route group. NO frontend changes needed regardless of outcome.

### Where backend Story 107.3 lives — caveat per Story 96.17-FE 1st-pass review M-1

⚠️ **At memo-filing time (2026-05-10), no `request-backend/107*` ticket exists in this repo's `docs/request-backend/` directory** (verified via `ls docs/request-backend/107* 2>&1`). The "backend Story 107.3" reference originates in:

- Epic 96-FE spec at `epics-96-fe.md:451` (E5 dependency-block contract).
- Epic 96-FE retro § A-8 (filed 2026-05-09).

**Actionable verification protocol**:
1. **First**: confirm with backend coordinator whether Story 107.3 has been formally filed as a backend ticket. Frontend cannot independently verify.
2. **If not yet filed**: this memo is **speculative tracking** — file backend ticket as a prerequisite to verification (action item for backend team or frontend coordinator with backend-write access).
3. **If filed**: update this memo with the authoritative ticket location (backend repo path, URL, or `docs/request-backend/107-...md` if filed in this repo).
4. **If 2026-06-15 elapses**: per Epic 96-FE retro § A-8 + § E5 contract, Story 96.17 was originally scheduled to be DROPPED if backend 107.3 didn't close. Since 96.17 is now closed via Disposition A (work was already shipped by Story 86.2), the drop trigger is moot for 96.17 itself — but the backend audit concern persists and may warrant Epic 98-FE candidate filing.

### When backend Story 107.3 closes, verify the disposition:

1. **If CabinetGuard CONFIRMED enforced** (expected outcome): Epic 96-FE retro action item A-8 closes; this memo can be archived to `docs/process/archived/` or deleted.
2. **If CabinetGuard CONFIRMED missing**: backend ships a fix (no frontend work); update this memo with backend ticket number for the fix; close after fix lands.
3. **If 2026-06-15 elapses without backend response**: refile concern as Epic 98-FE candidate (or equivalent) for explicit follow-up. Note: frontend `e2e/fixtures/dbw-order-seed.ts` continues to work regardless — only the dev-environment cross-cabinet risk persists.

### What's explicitly NOT in scope

- **Frontend code changes**: NONE required. The endpoint-consumer at `e2e/fixtures/dbw-order-seed.ts` is already cabinet-aware (reads `cabinetId` from `e2e/.auth/user.json`), so frontend already passes cabinet context. Server-side enforcement is what's being audited.
- **Test changes**: NONE required.
- **Story 96.17 reopening**: Per Disposition A, Story 96.17 is closed as already-shipped. This memo is the tracking surface for the backend audit; it does NOT require reopening 96.17.

---

## Cross-references

- [Source: `_bmad-output/implementation-artifacts/96-17-fe-test-only-seed-endpoint-integration-e2e-fixtures.md`] — closure-verification story, Disposition A.
- [Source: `_bmad-output/implementation-artifacts/epic-96-fe-retro-2026-05-09.md` § A-8] — original action item.
- [Source: `_bmad-output/planning-artifacts/epics-96-fe.md:451`] — original E5 dependency-block contract.
- [Source: `e2e/fixtures/dbw-order-seed.ts:1-12`] — Story 86.2 implementation header.
- [Source: `docs/request-backend/163-DBW-ORDER-TEST-SEEDING-ENDPOINT.md`] — original backend ticket.

## Last-updated history

- **2026-05-10**: Filed per Story 96.17-FE Disposition A (close as already-shipped).
