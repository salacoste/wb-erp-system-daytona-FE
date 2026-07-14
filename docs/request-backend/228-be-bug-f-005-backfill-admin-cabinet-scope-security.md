# Request #228 — BE-BUG-F-005: backfill scope/RBAC — Admin eligibility + cabinet-membership enforcement

**Status:** ✅ **RESOLVED BE-side (2026-07-13 batch, build 09:35:56)** — Admin + Owner allowed strictly within JWT `cabinet_ids`; `POST /start` requires `cabinetId`; `status` / `pause` / `resume` also protected; empty scope fail-closed. BE verified: 9/9 suites, 226/226 tests (two runs), tsc 0, eslint pass, build pass, code-review APPROVE, architecture CLEAR, UltraQA pass. **Non-blocking** for normal FE development throughout.
**Severity:** 🟠 security/policy (RBAC scope) — non-blocking but must be resolved before the backfill launch can be treated as cabinet-scoped.
**Parent validation record:** [`226-validation-2026-07-be-status-and-outstanding.md`](./226-validation-2026-07-be-status-and-outstanding.md) §2.5 + "F-005 backfill — scope/RBAC caution" (2026-07-13, BE-BUG-F-005).
**Endpoint:** `POST /v1/admin/backfill/start` (and `GET /v1/admin/backfill/status`).

---

## 1. Problem

`POST /v1/admin/backfill/start` enqueues a long-running (up to 365-day) historical backfill. The 2026-07-13 BE re-val confirmed the **Owner** role is allowed to start it.

**Two scope/RBAC risks remain open:**

1. **Admin role is NOT included** in the backfill endpoints, despite the "full-access" role description. (`Admin` is rejected where `Owner` is accepted — inconsistent with the role's documented intent.)
2. **Cabinet-membership / cabinet-scoping is not enforced.** The operation's blast radius (which cabinets' data it touches) is not guaranteed to be limited to the caller's cabinet. Starting a backfill could affect data beyond the current cabinet context.

## 2. Root cause

The backfill endpoints live under `/v1/admin/*` and were verified for the `Owner` role only. The RBAC guard does not include `Admin`, and the service does not hard-enforce cabinet membership on the start path — so the effective scope of the launched job is not provably cabinet-bounded.

## 3. Impact

- **Cross-cabinet data risk (security):** if cabinet-scoping is not enforced, an Owner/Admin starting a backfill could enqueue a job affecting data outside their cabinet — a multi-tenant isolation concern.
- **Role inconsistency:** `Admin` (described as full-access) cannot launch a backfill that `Owner` can — surprising and operationally broken for Admin users.
- **FE UX constraint:** until resolved, the FE **must not** present the launch button as "runs only for the current cabinet". It must show scope explicitly and require confirmation (see §5).

## 4. What we need from BE

1. **Admin eligibility:** explicitly include `Admin` in the backfill endpoints' RBAC guard (consistent with the role's full-access description), OR document that backfill is Owner-only and the FE should hide the button for Admin.
2. **Cabinet-membership enforcement:** guarantee the backfill job is scoped to the caller's cabinet (and only accessible cabinets) — enforce cabinet membership on the start path so the blast radius is provably bounded.
3. **Document the scope** of `POST /v1/admin/backfill/start` (single-cabinet vs cross-cabinet) so the FE can label it accurately.

A one-line reply per item suffices (resolution template in #226): *"Admin allowed + cabinet-scoped"* / *"Owner-only, FE hides for Admin"*.

## 5. FE UX — post-resolution note (2026-07-13)

BE now enforces cabinet-scoping fail-closed (§4 resolved), so the prior defensive commitments ("do not treat as cabinet-scoped", "require explicit scope confirmation") are **no longer strictly required** — the operation is guaranteed cabinet-bounded by the caller's JWT `cabinet_ids`. FE may simplify the launch UX accordingly: a one-click launch is now safe because empty/invalid scope fails closed. Keeping an explicit scope **display** (showing which cabinet the backfill targets) remains good practice for transparency, but is optional rather than a safety requirement.

## 6. Reproduction

```bash
BASE=http://localhost:3000
# TOKEN = owner (and admin) JWT; CAB = cabinet id; H = "-H Authorization:Bearer $TOKEN -H X-Cabinet-Id:$CAB"

# Owner — allowed (confirmed 2026-07-13)
curl -s -X POST $H -H 'Content-Type: application/json' \
  -d '{...valid backfill payload...}' \
  $BASE/v1/admin/backfill/start -w "\n%{http_code}\n"   # expect 200/202

# Admin — expected to also be allowed; verify it is not 403
curl -s -X POST $H_ADMIN ... $BASE/v1/admin/backfill/start -w "\n%{http_code}\n"   # 403? (the gap)

# Scope: confirm the enqueued job targets ONLY $CAB (cabinet-membership enforcement)
```

## 7. Acceptance

- `Admin` role can start a backfill (or the FE is told to hide it for Admin).
- A started backfill is provably scoped to the caller's cabinet(s) — cabinet-membership enforced on the start path.
- The operation's scope is documented for accurate FE labeling.

## 8. References

- Parent: [`226-validation-2026-07-be-status-and-outstanding.md`](./226-validation-2026-07-be-status-and-outstanding.md) §2.5 + "F-005 backfill — scope/RBAC caution".
- Related (same defect class — admin-role gate): BE-BUG-F-004 (`PUT /v1/tariffs/settings`, now allows Admin + Owner per #226).
