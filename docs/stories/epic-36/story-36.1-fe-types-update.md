# Story 36.1-FE: TypeScript Types Update

## Story Info

- **Epic**: 36-FE - Product Card Linking (Frontend)
- **Priority**: High
- **Points**: 3
- **Status**: ✅ APPROVED (Ready for Development)

## User Story

**As a** frontend developer,
**I want** TypeScript types updated to support product card linking (склейки),
**So that** I can safely integrate with the Epic 36 backend API.

## Background

Epic 36 backend adds support for grouping advertising analytics by `imtId` (WB merged card identifier). This requires extending existing TypeScript types from Epic 33 to support:
- New grouping mode (`GroupByMode: 'sku' | 'imtId'`)
- Merged product information (`MergedProduct[]`)
- Item type discriminator (`'merged_group' | 'individual'`)

**Backend Status**: ✅ 100% Complete (API ready with `group_by` parameter)

## Acceptance Criteria

### AC1: New Type Definitions
- [ ] Add `GroupByMode` type: `'sku' | 'imtId'`
- [ ] Add `MergedProduct` interface with `nmId` and `vendorCode` fields
- [ ] TypeScript compilation passes with strict mode

### AC2: Extend Existing AdvertisingItem Interface
- [ ] Add optional `type?: 'merged_group' | 'individual'` field
- [ ] Add optional `imtId?: number | null` field
- [ ] Add optional `mergedProducts?: MergedProduct[]` field
- [ ] Maintain backward compatibility (all new fields optional)

### AC3: Extend Query Parameters
- [ ] Add optional `group_by?: GroupByMode` to `AdvertisingAnalyticsParams`
- [ ] Default behavior unchanged (`group_by=sku` implicit)

### AC4: Documentation
- [ ] Add JSDoc comments for all new types
- [ ] Reference Epic 36 API contract in comments
- [ ] Include usage examples in JSDoc

## Tasks / Subtasks

### Phase 1: Type Definitions (30 min)
- [ ] Open `src/types/advertising-analytics.ts`
- [ ] Add `GroupByMode` type after `ViewByMode`
- [ ] Add `MergedProduct` interface after enum types
- [ ] Add JSDoc comments with Epic 36 references

### Phase 2: Extend AdvertisingItem Interface (20 min)
- [ ] Locate `AdvertisingItem` interface (line ~118)
- [ ] Add Epic 36 fields section with clear comment separator
- [ ] Add `type`, `imtId`, `mergedProducts` fields
- [ ] Update interface JSDoc with Epic 36 note

### Phase 3: Extend Query Parameters (10 min)
- [ ] Locate `AdvertisingAnalyticsParams` interface (line ~338)
- [ ] Add `group_by?: GroupByMode` field after `view_by`
- [ ] Add JSDoc comment explaining default behavior

### Phase 4: Verification (10 min)
- [ ] Run `npm run type-check` - must pass
- [ ] Run `npm run lint` - must pass
- [ ] Verify no breaking changes to existing Epic 33 types

## Technical Details

### File to Modify

**File**: `src/types/advertising-analytics.ts`

**Lines to modify**: ~36 (after `ViewByMode`), ~118 (inside `AdvertisingItem`), ~338 (inside `AdvertisingAnalyticsParams`)

### Code Changes

#### 1. Add GroupByMode Type (after line 36)

```typescript
/**
 * View aggregation mode for analytics data.
 */
export type ViewByMode = 'sku' | 'campaign' | 'brand' | 'category';

// Epic 36: Product Card Linking
/**
 * Grouping mode for advertising analytics (Epic 36).
 *
 * - 'sku': Individual products (default, Epic 33 behavior)
 * - 'imtId': Merged product groups (склейки)
 *
 * @see docs/request-backend/83-epic-36-api-contract.md
 */
export type GroupByMode = 'sku' | 'imtId';
```

#### 2. Add MergedProduct Interface (after enum types, before response interfaces)

```typescript
// ============================================================================
// Epic 36: Product Card Linking Types
// ============================================================================

/**
 * Product information within a merged group (Epic 36).
 * Used when group_by=imtId.
 *
 * @example
 * {
 *   nmId: 173588306,
 *   vendorCode: "ter-09"
 * }
 */
export interface MergedProduct {
  /** WB article number */
  nmId: number;
  /** Seller's SKU code */
  vendorCode: string;
}
```

#### 3. Extend AdvertisingItem Interface (inside interface ~line 118)

```typescript
export interface AdvertisingItem {
  /** Unique identifier from backend (e.g., "sku:270937054", "imtId:328632") */
  key: string;

  // ========================================
  // Epic 36: NEW FIELDS (group_by=imtId)
  // ========================================

  /**
   * Item type discriminator (Epic 36).
   * - 'merged_group': Products grouped by shared imtId
   * - 'individual': Single product or product with NULL imtId
   * Only present when group_by=imtId parameter is used.
   */
  type?: 'merged_group' | 'individual';

  /**
   * WB merged card ID (склейка identifier) - Epic 36.
   * - For merged_group: shared imtId value (e.g., 328632)
   * - For individual: null (no merging)
   */
  imtId?: number | null;

  /**
   * Products within merged group (Epic 36).
   * Only present when type='merged_group'.
   * Contains array of nmId + vendorCode pairs.
   */
  mergedProducts?: MergedProduct[];

  // ========================================
  // Existing fields (Epic 33)
  // ========================================

  // Identifiers (depend on view_by mode)
  /** SKU identifier (present when view_by='sku') */
  sku_id?: string;
  // ... rest of existing fields
}
```

#### 4. Extend AdvertisingAnalyticsParams Interface (inside interface ~line 338)

```typescript
export interface AdvertisingAnalyticsParams {
  /** Start date in YYYY-MM-DD format (required) */
  from: string;
  /** End date in YYYY-MM-DD format (required) */
  to: string;
  /** View aggregation mode (default: 'sku') */
  view_by?: ViewByMode;

  // Epic 36: NEW - grouping mode
  /**
   * Grouping mode for product card linking (default: 'sku') - Epic 36.
   *
   * When 'imtId', groups products by merged card ID (склейки).
   * When 'sku', displays individual products (Epic 33 behavior).
   *
   * @default 'sku'
   */
  group_by?: GroupByMode;

  // ... existing filter/sort parameters
}
```

### Backward Compatibility

✅ **Full backward compatibility**:
- All new fields are **optional** (`?`)
- Default behavior unchanged (existing Epic 33 code works as-is)
- No breaking changes to existing types

### Type Safety Checks

**Type Guards** (for later use in components):

```typescript
// Helper type guard for merged groups
function isMergedGroup(item: AdvertisingItem): item is AdvertisingItem & {
  type: 'merged_group';
  imtId: number;
  mergedProducts: MergedProduct[]
} {
  return item.type === 'merged_group' &&
         item.imtId != null &&
         Array.isArray(item.mergedProducts);
}
```

## Testing Checklist

### Compilation Tests
- [ ] `npm run type-check` passes
- [ ] No TypeScript errors in VS Code
- [ ] No linter warnings

### Integration Tests
- [ ] Existing Epic 33 components still compile
- [ ] No breaking changes to `useAdvertisingAnalytics` hook
- [ ] `AdvertisingAnalyticsPage` compiles without errors

### Edge Cases
- [ ] Optional fields can be undefined
- [ ] `imtId` can be null (type: `number | null`)
- [ ] `mergedProducts` can be empty array
- [ ] Single product with imtId handled correctly

## Dependencies

- **Baseline**: Epic 33 TypeScript types (existing)
- **Backend**: Epic 36 API contract (`docs/request-backend/83-epic-36-api-contract.md`)

## Definition of Done

- [ ] All TypeScript types added as specified
- [ ] All acceptance criteria met
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] JSDoc comments complete
- [ ] No breaking changes to Epic 33
- [ ] Code review approved
- [ ] Story marked DONE

## Notes for PO Review

### Questions for PO

**Q1: Field Naming Convention**
Should we use `group_by` (snake_case, matches backend) or `groupBy` (camelCase, matches frontend convention)?

**Current Proposal**: `group_by` (snake_case) to match backend API parameter exactly.

**Q2: Type Discriminator**
Should `type` field be named `type` or `itemType` or `groupType`?

**Current Proposal**: `type` (shortest, matches backend response).

### Estimated Time

**Total**: 70 minutes (1.2 hours)
- Phase 1: 30 min
- Phase 2: 20 min
- Phase 3: 10 min
- Phase 4: 10 min

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking changes | Low | High | All fields optional |
| Type conflicts | Low | Medium | Namespace with "Epic 36" comments |
| Backend mismatch | Low | High | Follow API contract exactly |

---

**Document Version**: 1.1
**Created**: 2025-12-28
**Status**: ✅ **APPROVED - Ready for Development**
**PO Approval**: Sarah | 2025-12-28 22:45 MSK
**Next Action**: Developer begins implementation (first story in sequence)
