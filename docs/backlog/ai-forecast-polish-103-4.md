# AI Forecast Page Polish — Story 103.4-FE Scope

> Surfaced: 2026-05-15 visual verification of `localhost:3100/analytics/forecast`
> Scope: cosmetic + UX-gap items for Story 103.4-FE (`103-4-fe-tests-and-polish`)
> Implementation file: `src/app/(dashboard)/analytics/forecast/components/ForecastPageContent.tsx`

## Findings

### 1. Russian pluralization bug (cosmetic, low effort)

**Where**: `ForecastPageContent.tsx:112` — hardcoded `{d} дней` for all horizon values.

**Symptom**: dropdown displays "21 дней" which is grammatically wrong.

**Russian declension rule** for день:
- 1, 21, 31… → день (nominative singular)
- 2-4, 22-24… → дня (genitive singular, paucal)
- 5-20, 25-30… → дней (genitive plural)

Current `HORIZON_OPTIONS = [7, 14, 21, 28]` produces: "7 дней" ✓, "14 дней" ✓, "21 дней" ✗ (should be "21 день"), "28 дней" ✓.

**Fix**: add a `pluralizeDays(n: number)` helper. Pattern is already in use elsewhere in the codebase — grep for "день|дня|дней" before writing a new one.

### 2. Anglicism in column header (cosmetic, low effort)

**Where**: predictions table column 4 header reads "Банд" — a phonetic transliteration of English "band".

**Native Russian alternatives** (pick one per UX-spec voice):
- "Полоса" (literal stripe/band)
- "Диапазон" (range — better semantically since column shows confidence-interval bounds)
- "Интервал" (interval)

**Recommendation**: "Диапазон" — most accurate description of a `[low, high]` confidence interval.

### 3. Brand-level + Cabinet-level have NO entity selector (UX gap, medium effort)

**Where**: `ForecastPageContent.tsx:88-101` — nmId input renders only when `level === 'sku'`. No equivalent input for `level === 'brand'` (brand-picker) or `level === 'cabinet'` (informational note).

**Symptom**: switching the Уровень dropdown to "По бренду" or "По кабинету" leaves the page rendering the previously-fetched SKU table data. The hook fires with `nmId: undefined`, query-key changes, but no new selector input lets the user choose WHICH brand. Empirically the table doesn't update meaningfully — brand and cabinet levels are indistinguishable from the UI.

**Hook params** (`ForecastPageContent.tsx:43-50`):
```typescript
const parsedNmId = /^\d+$/.test(trimmed) ? Number.parseInt(trimmed, 10) : null
const nmId = level === 'sku' && parsedNmId ? parsedNmId : undefined
const enabled = level !== 'sku' || (parsedNmId !== null && parsedNmId > 0)
```

For brand/cabinet, `enabled === true` unconditionally → query fires with `{ level: 'brand', nmId: undefined }` regardless of user intent.

**Fix options** (decide with PM/UX before implementing):
- **(a) Brand selector**: render a dropdown of cabinet's brands when `level === 'brand'`. Backend contract may need a `brand` query param — confirm with `daytona-wildberries-typescript-sdk` / backend `/v1/ai/forecast` route handler.
- **(b) Cabinet selector**: cabinet-level forecast is implicit from JWT `cabinetId` — render an informational note "Прогноз агрегирован по всему кабинету" so users understand there's no selector needed.
- **(c) Drop brand level**: if backend doesn't support brand-level forecasts yet, remove "По бренду" from LEVEL_OPTIONS until Epic 109 (or whichever epic ships brand forecasts).

### 4. Implementation-detail leak in empty-state copy (cosmetic, low effort)

**Where**: `ForecastPageContent.tsx:154` — empty-state alert reads "Нет данных прогноза. Убедитесь, что модель обучена (Epic 109)."

**Problem**: "Epic 109" is an internal BMAD identifier. End users (sellers) have no context for it.

**Fix**: rewrite to actionable user-facing message:
- "Нет данных прогноза. Модель ещё не обучена для этого товара/бренда."
- Or "Прогноз пока недоступен. Попробуйте позже."

## Acceptance Criteria

- [x] Horizon dropdown shows correct Russian forms: "7 дней", "14 дней", "21 день", "28 дней" — shipped 2026-05-15 via `pluralize(DAY_FORMS, d)` (extended `src/lib/russian-plural.ts`)
- [x] Predictions table column 4 header renamed from "Банд" to "Диапазон" — shipped 2026-05-15 (`ForecastTable.tsx`)
- [ ] Brand-level renders an appropriate input/notice; or "По бренду" is removed from LEVEL_OPTIONS — **deferred (needs PM/UX decision)**
- [ ] Cabinet-level shows informational note (no selector required) or removed — **deferred (needs PM/UX decision)**
- [x] Empty-state copy no longer references "Epic 109" — shipped 2026-05-15 ("Нет данных прогноза. Модель ещё не обучена для этого товара. Попробуйте позже.")
- [x] Unit tests added for DAY_FORMS in `pluralize` — shipped 2026-05-15 (6 tests: n=1, 2, 7, 14, 21, 28 — `russian-plural.test.ts`)
- [ ] Unit tests added for level-switcher behavior (clears stale data or shows level-specific UI) — **deferred (depends on brand/cabinet selector decision)**
- [x] No regressions in existing SKU-level happy path — verified via lint+type-check+25/25 russian-plural tests pass

## Status (2026-05-15)

**Shipped**: Cosmetic items 1, 2, 4 — all low-risk, no UX decisions required.
**Deferred**: Item 3 (brand/cabinet selector) — needs PM/UX decision before implementation. Three options enumerated in the Findings section above.

## Related

- Epic 103-FE spec: `_bmad-output/planning-artifacts/epics-103-fe.md`
- Sprint-status: `_bmad-output/implementation-artifacts/sprint-status.yaml` → `103-4-fe-tests-and-polish`
- Backend forecast endpoint: `daytona-wildberries-typescript-sdk` / `/v1/ai/forecast`
