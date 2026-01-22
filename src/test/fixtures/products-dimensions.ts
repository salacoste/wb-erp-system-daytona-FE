/**
 * Test fixtures for Products with Dimensions & Category
 * Stories 44.26a-FE & 44.26b-FE
 * Backend: Epic 45 - Products Dimensions & Category API
 *
 * CRITICAL: Field names and types match ACTUAL backend implementation!
 * - nm_id is STRING (not number)
 * - Product name is sa_name (not title)
 * - Category is category_hierarchy (not category)
 * - volume_liters is pre-calculated by backend
 */

// ============================================================================
// Type Definitions (matching Backend Epic 45)
// ============================================================================

/** Product dimensions from WB catalog (in mm) */
export interface ProductDimensions {
  length_mm: number
  width_mm: number
  height_mm: number
  volume_liters: number // Pre-calculated by backend
}

/** Category hierarchy from WB catalog */
export interface CategoryHierarchy {
  subject_id: number
  subject_name: string
  parent_id: number | null // null for top-level categories
  parent_name: string | null
}

/** Product with dimensions and category for Price Calculator */
export interface ProductWithDimensions {
  nm_id: string // STRING from backend (NOT number!)
  vendor_code: string
  sa_name: string // Product name (WB uses "sa_name", NOT "title")
  brand?: string
  photo_url?: string
  has_cogs?: boolean
  cogs?: {
    unit_cost_rub: number
    valid_from: string
  }
  dimensions?: ProductDimensions | null
  category_hierarchy?: CategoryHierarchy | null
}

/** Products with dimensions API response */
export interface ProductsWithDimensionsResponse {
  products: ProductWithDimensions[]
  pagination: {
    next_cursor: string | null
    has_more: boolean
    count: number
    total: number
  }
}

// ============================================================================
// Product Fixtures - Full Data
// ============================================================================

/** Product with complete dimensions and category */
export const mockProductWithFullData: ProductWithDimensions = {
  nm_id: '147205694',
  vendor_code: 'DRESS-001',
  sa_name: 'Платье летнее',
  brand: 'Artisan',
  photo_url: 'https://images.wbstatic.net/big/new/147205694-1.jpg',
  has_cogs: true,
  cogs: {
    unit_cost_rub: 500,
    valid_from: '2026-01-01',
  },
  dimensions: {
    length_mm: 400,
    width_mm: 300,
    height_mm: 50,
    volume_liters: 6.0, // Pre-calculated: 400*300*50/1000000
  },
  category_hierarchy: {
    subject_id: 105,
    subject_name: 'Платья',
    parent_id: 8,
    parent_name: 'Женская одежда',
  },
}

/** Second product with different dimensions */
export const mockProductWithFullData2: ProductWithDimensions = {
  nm_id: '147205695',
  vendor_code: 'DRESS-002',
  sa_name: 'Платье вечернее',
  brand: 'Artisan',
  photo_url: 'https://images.wbstatic.net/big/new/147205695-1.jpg',
  dimensions: {
    length_mm: 500,
    width_mm: 350,
    height_mm: 80,
    volume_liters: 14.0,
  },
  category_hierarchy: {
    subject_id: 105,
    subject_name: 'Платья',
    parent_id: 8,
    parent_name: 'Женская одежда',
  },
}

// ============================================================================
// Product Fixtures - Missing Data
// ============================================================================

/** Product without dimensions (dimensions: null) */
export const mockProductWithoutDimensions: ProductWithDimensions = {
  nm_id: '147205696',
  vendor_code: 'NO-DIM-001',
  sa_name: 'Товар без габаритов',
  brand: 'TestBrand',
  dimensions: null,
  category_hierarchy: {
    subject_id: 200,
    subject_name: 'Аксессуары',
    parent_id: 15,
    parent_name: 'Аксессуары и украшения',
  },
}

/** Product without category (category_hierarchy: null) */
export const mockProductWithoutCategory: ProductWithDimensions = {
  nm_id: '147205697',
  vendor_code: 'NO-CAT-001',
  sa_name: 'Товар без категории',
  brand: 'TestBrand',
  dimensions: {
    length_mm: 100,
    width_mm: 100,
    height_mm: 100,
    volume_liters: 1.0,
  },
  category_hierarchy: null,
}

/** Product without both dimensions and category */
export const mockProductWithoutBoth: ProductWithDimensions = {
  nm_id: '147205698',
  vendor_code: 'NO-DATA-001',
  sa_name: 'Товар без данных',
  brand: 'TestBrand',
  dimensions: null,
  category_hierarchy: null,
}

// ============================================================================
// Product Fixtures - Edge Cases
// ============================================================================

/** Product with zero dimensions (valid edge case) */
export const mockProductWithZeroDimensions: ProductWithDimensions = {
  nm_id: '147205699',
  vendor_code: 'ZERO-DIM-001',
  sa_name: 'Виртуальный товар',
  brand: 'Digital',
  dimensions: {
    length_mm: 0,
    width_mm: 0,
    height_mm: 0,
    volume_liters: 0,
  },
  category_hierarchy: {
    subject_id: 300,
    subject_name: 'Цифровые товары',
    parent_id: null,
    parent_name: null,
  },
}

/** Product with decimal dimensions (405mm = 40.5cm) */
export const mockProductWithDecimalDimensions: ProductWithDimensions = {
  nm_id: '147205700',
  vendor_code: 'DEC-DIM-001',
  sa_name: 'Товар с дробными габаритами',
  brand: 'Precision',
  dimensions: {
    length_mm: 405,
    width_mm: 255,
    height_mm: 125,
    volume_liters: 12.909375, // 405*255*125/1000000
  },
  category_hierarchy: {
    subject_id: 105,
    subject_name: 'Платья',
    parent_id: 8,
    parent_name: 'Женская одежда',
  },
}

/** Product with very large dimensions (max 5000mm) */
export const mockProductWithLargeDimensions: ProductWithDimensions = {
  nm_id: '147205701',
  vendor_code: 'LARGE-001',
  sa_name: 'Крупногабаритный товар',
  brand: 'BigSize',
  dimensions: {
    length_mm: 5000,
    width_mm: 3000,
    height_mm: 2000,
    volume_liters: 30000.0, // 5000*3000*2000/1000000
  },
  category_hierarchy: {
    subject_id: 400,
    subject_name: 'Мебель',
    parent_id: 50,
    parent_name: 'Товары для дома',
  },
}

/** Product with top-level category (no parent) */
export const mockProductWithTopLevelCategory: ProductWithDimensions = {
  nm_id: '147205702',
  vendor_code: 'TOP-CAT-001',
  sa_name: 'Товар верхней категории',
  brand: 'TopLevel',
  dimensions: {
    length_mm: 200,
    width_mm: 150,
    height_mm: 100,
    volume_liters: 3.0,
  },
  category_hierarchy: {
    subject_id: 500,
    subject_name: 'Электроника',
    parent_id: null, // Top-level category
    parent_name: null,
  },
}

/** Product with very long name (for truncation test) */
export const mockProductWithLongName: ProductWithDimensions = {
  nm_id: '147205703',
  vendor_code: 'LONG-NAME-001',
  sa_name:
    'Очень длинное название товара которое должно быть обрезано многоточием в интерфейсе пользователя для корректного отображения',
  brand: 'LongBrand',
  dimensions: {
    length_mm: 200,
    width_mm: 150,
    height_mm: 100,
    volume_liters: 3.0,
  },
  category_hierarchy: {
    subject_id: 105,
    subject_name: 'Платья',
    parent_id: 8,
    parent_name: 'Женская одежда',
  },
}

/** Product without photo (for placeholder test) */
export const mockProductWithoutPhoto: ProductWithDimensions = {
  nm_id: '147205704',
  vendor_code: 'NO-PHOTO-001',
  sa_name: 'Товар без фото',
  brand: 'NoPhotoStore',
  photo_url: undefined,
  dimensions: {
    length_mm: 200,
    width_mm: 150,
    height_mm: 100,
    volume_liters: 3.0,
  },
  category_hierarchy: {
    subject_id: 105,
    subject_name: 'Платья',
    parent_id: 8,
    parent_name: 'Женская одежда',
  },
}

// ============================================================================
// Collection Fixtures
// ============================================================================

/** Array of all mock products */
export const mockProductsWithDimensions: ProductWithDimensions[] = [
  mockProductWithFullData,
  mockProductWithFullData2,
  mockProductWithoutDimensions,
  mockProductWithoutCategory,
  mockProductWithoutBoth,
  mockProductWithZeroDimensions,
  mockProductWithDecimalDimensions,
  mockProductWithLargeDimensions,
  mockProductWithTopLevelCategory,
  mockProductWithLongName,
  mockProductWithoutPhoto,
]

/** Products for search results (subset) */
export const mockSearchResults: ProductWithDimensions[] = [
  mockProductWithFullData,
  mockProductWithFullData2,
  mockProductWithDecimalDimensions,
]

/** Products filtered by "плат" search query */
export const mockSearchResultsForPlat: ProductWithDimensions[] = [
  mockProductWithFullData,
  mockProductWithFullData2,
]

// ============================================================================
// API Response Fixtures
// ============================================================================

/** Full API response with pagination */
export const mockProductsWithDimensionsResponse: ProductsWithDimensionsResponse = {
  products: mockProductsWithDimensions,
  pagination: {
    next_cursor: null,
    has_more: false,
    count: mockProductsWithDimensions.length,
    total: mockProductsWithDimensions.length,
  },
}

/** Empty search results response */
export const mockEmptySearchResponse: ProductsWithDimensionsResponse = {
  products: [],
  pagination: {
    next_cursor: null,
    has_more: false,
    count: 0,
    total: 0,
  },
}

/** Paginated response (first page) */
export const mockPaginatedResponsePage1: ProductsWithDimensionsResponse = {
  products: [mockProductWithFullData, mockProductWithFullData2],
  pagination: {
    next_cursor: 'cursor_page_2',
    has_more: true,
    count: 2,
    total: 5,
  },
}

/** Paginated response (second page) */
export const mockPaginatedResponsePage2: ProductsWithDimensionsResponse = {
  products: [mockProductWithoutDimensions, mockProductWithoutCategory, mockProductWithoutBoth],
  pagination: {
    next_cursor: null,
    has_more: false,
    count: 3,
    total: 5,
  },
}

// ============================================================================
// Auto-fill State Fixtures
// ============================================================================

/** Auto-fill source types */
export type AutoFillSource = 'auto' | 'manual'

/** Auto-fill badge status types */
export type AutoFillStatus = 'auto' | 'modified' | 'none'

/** Expected auto-fill state after selecting full product */
export const expectedDimensionsAutoFillStateAfterSelection = {
  source: 'auto' as AutoFillSource,
  originalValues: {
    length_cm: 40, // 400mm / 10
    width_cm: 30, // 300mm / 10
    height_cm: 5, // 50mm / 10
    volume_liters: 6.0, // from backend
  },
  status: 'auto' as AutoFillStatus,
}

/** Expected auto-fill state after editing dimension */
export const expectedDimensionsAutoFillStateAfterEdit = {
  source: 'auto' as AutoFillSource,
  originalValues: {
    length_cm: 40,
    width_cm: 30,
    height_cm: 5,
    volume_liters: 6.0,
  },
  status: 'modified' as AutoFillStatus,
}

/** Expected auto-fill state after clearing product */
export const expectedDimensionsAutoFillStateCleared = {
  source: 'manual' as AutoFillSource,
  originalValues: null,
  status: 'none' as AutoFillStatus,
}

/** Expected category auto-fill state after selection */
export const expectedCategoryAutoFillStateAfterSelection = {
  source: 'auto' as AutoFillSource,
  isLocked: true,
  originalCategory: {
    subject_id: 105,
    subject_name: 'Платья',
    parent_id: 8,
    parent_name: 'Женская одежда',
  },
}

/** Expected category auto-fill state after clearing */
export const expectedCategoryAutoFillStateCleared = {
  source: 'manual' as AutoFillSource,
  isLocked: false,
  originalCategory: null,
}

// ============================================================================
// Coefficient Calendar Fixtures
// ============================================================================

/** Coefficient data for date picker tests */
export const mockCoefficientDays = [
  { date: '2026-01-22', coefficient: 100, isAvailable: true }, // Base (green)
  { date: '2026-01-23', coefficient: 125, isAvailable: true }, // Elevated (yellow)
  { date: '2026-01-24', coefficient: 125, isAvailable: true }, // Elevated (yellow)
  { date: '2026-01-25', coefficient: 100, isAvailable: true }, // Base (green)
  { date: '2026-01-26', coefficient: 150, isAvailable: true }, // High (orange)
  { date: '2026-01-27', coefficient: 200, isAvailable: true }, // Peak (red)
  { date: '2026-01-28', coefficient: -1, isAvailable: false }, // Unavailable (gray)
  { date: '2026-01-29', coefficient: 100, isAvailable: true }, // Base
  { date: '2026-01-30', coefficient: 175, isAvailable: true }, // High
  { date: '2026-01-31', coefficient: 250, isAvailable: true }, // Peak (>200)
  { date: '2026-02-01', coefficient: -1, isAvailable: false }, // Unavailable
  { date: '2026-02-02', coefficient: -1, isAvailable: false }, // Unavailable
  { date: '2026-02-03', coefficient: 100, isAvailable: true }, // Base
  { date: '2026-02-04', coefficient: 100, isAvailable: true }, // Base
]

/** All dates unavailable (for error test) */
export const mockAllDatesUnavailable = Array.from({ length: 14 }, (_, i) => ({
  date: `2026-01-${22 + i}`.padStart(10, '0'),
  coefficient: -1,
  isAvailable: false,
}))

// ============================================================================
// Helper Functions for Tests
// ============================================================================

/**
 * Get product by nm_id
 */
export function getProductByNmId(nmId: string): ProductWithDimensions | undefined {
  return mockProductsWithDimensions.find((p) => p.nm_id === nmId)
}

/**
 * Filter products by search query (matches sa_name or vendor_code)
 */
export function filterProductsByQuery(query: string): ProductWithDimensions[] {
  const lowerQuery = query.toLowerCase()
  return mockProductsWithDimensions.filter(
    (p) =>
      p.sa_name.toLowerCase().includes(lowerQuery) ||
      p.vendor_code.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Convert mm to cm (matching frontend logic)
 */
export function mmToCm(mm: number): number {
  return mm / 10
}

/**
 * Get expected form values after auto-fill
 */
export function getExpectedFormValuesAfterAutoFill(product: ProductWithDimensions) {
  if (!product.dimensions) {
    return null
  }
  return {
    length_cm: mmToCm(product.dimensions.length_mm),
    width_cm: mmToCm(product.dimensions.width_mm),
    height_cm: mmToCm(product.dimensions.height_mm),
    volume_liters: product.dimensions.volume_liters, // Use backend value directly
  }
}
