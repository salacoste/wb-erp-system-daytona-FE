# Story 70.6-FE: [Backend Request] Liquidity API Param Alignment

| Field | Value |
|-------|-------|
| Epic | 70-FE Validation Fixes |
| Priority | P1 |
| SP | 2 |
| Status | 📋 Blocked (Backend) |
| Group | C (D-14) |
| Backend Request | Pending |

## Description

Как пользователь, я хочу видеть страницу ликвидности без ошибки 500,
чтобы анализировать оборачиваемость и замороженный капитал.

## Problem

Endpoint `GET /v1/analytics/liquidity` возвращает **500 Internal Server Error**.
Вся страница `/analytics/liquidity` полностью нефункциональна.

### Evidence

```
GET /v1/analytics/liquidity?category_filter=illiquid&sort_by=turnover_days&sort_order=desc&limit=200
→ 500 INTERNAL_SERVER_ERROR

Retries: 3 (all failed)
Trace IDs: 6bbeda28, 06974881, ee7f90c6
```

Frontend error handling работает корректно: "Не удалось загрузить данные", кнопка "Повторить".

## Root Cause (Backend)

### Parameter Name Mismatch

| Parameter | Frontend Sends | Backend DTO Expects | Status |
|-----------|---------------|-------------------|--------|
| Filter | `category_filter` | `liquidity_filter` | ❌ MISMATCH |
| Sort | `sort_by` | `sort_by` | ✅ OK |
| Order | `sort_order` | `sort_order` | ✅ OK |
| Limit | `limit` | `limit` | ✅ OK |
| Turnover weeks | _(not sent)_ | `turnover_weeks` (default: 4) | ⚠️ Uses default |
| View by | _(not sent)_ | `view_by` (default: 'sku') | ⚠️ Uses default |

### Contradiction in Specs

- **Frontend spec** (`docs/request-backend/55-liquidity-api-endpoint-backend-response.md`, line 54):
  Documents parameter as `category_filter`
- **Backend DTO** (`src/analytics/dto/query/liquidity-query.dto.ts`, line 68):
  Implements parameter as `liquidity_filter`

Backend changed the param name from spec without updating frontend contract.

## Frontend Code

**File**: `src/lib/api/liquidity.ts`, lines 32-46

```typescript
export async function getLiquidity(params: LiquidityQueryParams = {}): Promise<LiquidityResponse> {
  const searchParams = new URLSearchParams()
  if (params.category_filter && params.category_filter !== 'all') {
    searchParams.set('category_filter', params.category_filter)  // ← wrong name
  }
  // ...
}
```

## Backend Request

### Option A: Backend aligns to spec (Recommended)

Backend should support `category_filter` as documented in the spec:

```typescript
// LiquidityQueryDto: add alias
@IsOptional()
@IsEnum(LiquidityFilterEnum)
@ApiProperty({ name: 'category_filter' })  // Accept frontend's param name
liquidity_filter?: LiquidityFilterEnum = LiquidityFilterEnum.ALL
```

### Option B: Frontend adapts to backend

Frontend changes `category_filter` → `liquidity_filter`:

```typescript
// liquidity.ts: rename param
searchParams.set('liquidity_filter', params.category_filter)
```

### Option C: Backend supports both names

```typescript
@Transform(({ obj }) => obj.category_filter ?? obj.liquidity_filter ?? 'all')
liquidity_filter?: LiquidityFilterEnum
```

## Acceptance Criteria

- AC1: `GET /v1/analytics/liquidity` возвращает 200 с данными (не 500)
- AC2: Фильтр по категории ликвидности работает (illiquid, slow, normal, fast)
- AC3: Сортировка по turnover_days работает
- AC4: Страница `/analytics/liquidity` отображает таблицу с данными
- AC5: Frontend param name согласован с backend DTO

## Frontend Changes Required

**If Option A (backend aligns)**: No frontend changes.
**If Option B (frontend adapts)**: Change `category_filter` → `liquidity_filter` in:

| File | Change |
|------|--------|
| `src/lib/api/liquidity.ts` | Rename param in searchParams.set() |
| `src/types/liquidity.ts` | Rename type field (if needed) |

## References

- Frontend spec: `docs/request-backend/55-liquidity-api-endpoint-backend-response.md`
- Backend DTO: `src/analytics/dto/query/liquidity-query.dto.ts`
- Frontend API: `src/lib/api/liquidity.ts`
