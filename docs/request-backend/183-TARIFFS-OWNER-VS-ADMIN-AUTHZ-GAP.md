# Request #183 — Tariffs audit/history: Owner-vs-Admin authz-model gap

**Originated by**: Frontend validation campaign (validation finding F-21), 2026-06-02
**Severity**: P2 — the FE now degrades gracefully (validation F-21: permission message instead of a generic error), but the underlying contract needs a product/backend decision.
**Status**: PENDING DECISION (FE shipped a graceful-degradation interim; root cause unresolved)

---

## Problem

`/settings/tariffs` admits only cabinet **Owner** users (page redirects all non-Owner roles). But two of its tabs call endpoints that require a backend `UserRole.Admin`:
- `GET /v1/tariffs/settings/history` (История версий)
- `GET /v1/tariffs/settings/audit` (Журнал изменений)

The FE role model (`src/types/auth.ts`) is `'Owner' | 'Manager' | 'Analyst' | 'Service'` — there is **no `Admin` role**, and Owner is the highest FE role. So an Owner (the only role allowed onto the page) deterministically gets **HTTP 403 on every visit** to these two tabs — it is the default state, not an edge case. There is no FE path for an Owner to obtain the Admin role.

## FE interim (F-21, shipped)

The two tabs now detect the 403 and render a permission message ("Доступно только администраторам — … доступно только системным администраторам") with no retry, instead of a generic "Ошибка загрузки" + futile Retry. This stops the confusing red error but does NOT resolve the access question.

## Decision needed

One of:
1. **Owner SHOULD see tariff history/audit** → relax the backend guard on `/tariffs/settings/{history,audit}` to allow `Owner` (then the FE tabs work; the F-21 permission message becomes dead/never-shown).
2. **It's system-admin-only by design** → confirm; then the FE should ideally HIDE these tabs from non-admin (requires adding `'Admin'` to the FE role model + tab-gating), and the F-21 message is the correct interim until then.

Please confirm the intended access for cabinet Owners. If (1), F-21's graceful message is currently masking a backend authz bug.

## Evidence
- `GET /v1/tariffs/settings` → 200 for Owner (tab 1 works).
- `GET /v1/tariffs/settings/history` + `/audit` → 403 for Owner ("Required roles: admin. User role: owner").
- FE role model: `frontend/src/types/auth.ts:9` (no Admin).
- FE interim: `frontend/src/components/custom/tariffs-admin/{VersionHistoryTable,AuditLogTableParts}.tsx` (F-21).
