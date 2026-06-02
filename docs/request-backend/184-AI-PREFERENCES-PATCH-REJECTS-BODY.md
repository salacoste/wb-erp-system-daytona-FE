# Request #184 — PATCH /v1/ai/preferences rejects its own DTO body (AI toggle broken)

**Originated by**: Frontend validation campaign (validation finding F-26), 2026-06-02
**Severity**: P1 — the AI master toggle on `/analytics/ai-admin/preferences` ALWAYS fails. Every user who toggles it gets a 400 + a generic error toast; the setting never persists. This is a backend bug — the FE sends the correct body.
**Status**: PENDING BACKEND

---

## Problem

`PATCH /v1/ai/preferences` with the body the endpoint's own DTO declares is rejected:

```
PATCH /v1/ai/preferences   {"aiEnabled": true}
→ HTTP 400  "property aiEnabled should not exist"
```

Only an empty body `{}` returns 200 (and then `dto.aiEnabled` is undefined, so nothing is updated).

## Root cause (backend)

- The handler is `updatePreferences(@Body() dto: UpdateAiPreferencesDto, …)` and calls `setAiEnabled(cabinetId, dto.aiEnabled)` (`src/ai/ai.controller.ts:288-297`).
- `UpdateAiPreferencesDto` (`src/ai/dto/ai-preferences.dto.ts:8-11`) declares `aiEnabled!: boolean` with an `@ApiProperty` but **no class-validator decorator** (`@IsBoolean()`).
- The global `ValidationPipe` runs with `whitelist: true` + `forbidNonWhitelisted: true`. A property with no validation decorator is treated as non-whitelisted → the pipe throws "property aiEnabled should not exist" and strips it.

So the endpoint can never receive `aiEnabled` — the GET returns `{aiEnabled}`, the PATCH rejects `{aiEnabled}`. The FE is correct (sends `{aiEnabled: boolean}`, matching the GET shape + the DTO).

## Requested fix

Add a class-validator decorator to `UpdateAiPreferencesDto.aiEnabled`:
```ts
@ApiProperty({ example: false, description: 'Set to false to disable AI features' })
@IsBoolean()
aiEnabled!: boolean;
```
Then `whitelist` keeps the property and `setAiEnabled` receives the value. (Verify other body DTOs in the AI module don't share the same missing-decorator issue.)

## Evidence
- Live: `PATCH {"aiEnabled":true}` → 400; `{"ai_enabled":true}`/`{"enabled":true}` → 400; `{}` → 200 (no-op).
- FE: `frontend/src/lib/api/ai/system.ts` `patchAiPreferences` sends `{aiEnabled}`; `AiPreferencesForm` toggle → mutation → 400 → error toast, setting not saved.
