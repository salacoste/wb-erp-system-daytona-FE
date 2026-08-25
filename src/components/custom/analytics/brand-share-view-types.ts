/**
 * BrandShareView-local structural types — Story 170.4.
 * Narrow shapes for the pure helpers so they stay decoupled from hook/API types
 * while remaining assignable from them (no `as` casts needed at call sites).
 */
export interface BrandDateRangeLike {
  dateFrom?: string
  dateTo?: string
}

export interface BrandParentSubjectLike {
  parentId: number
  parentName: string
}
