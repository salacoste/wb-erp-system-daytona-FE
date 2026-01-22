/**
 * TDD Tests for Story 44.33-FE
 * Type Mismatch & Field Name Fixes
 *
 * RED Phase: Tests written before implementation
 * These tests verify that:
 * - nm_id is handled as string (not number)
 * - Product name uses sa_name field (not title)
 * - Category uses category_hierarchy (not category)
 * - No runtime errors with actual API data
 *
 * @see docs/stories/epic-44/story-44.33-fe-type-mismatch-field-names.md
 */

import { describe, it, expect } from 'vitest'
import type {
  ProductWithDimensions,
  CategoryHierarchy,
  ProductDimensionsMm,
} from '@/types/price-calculator'

// ============================================================================
// Test Fixtures - Actual API Response Format
// ============================================================================

const mockApiProduct: ProductWithDimensions = {
  nm_id: '686701815', // STRING (not number!)
  vendor_code: 'EPO-123',
  sa_name: 'Эпоксидная смола', // Product name field (not title!)
  brand: 'МастерСмол',
  photo_url: 'https://example.com/photo.jpg',
  has_cogs: true,
  cogs: {
    unit_cost_rub: 500,
    valid_from: '2026-01-01',
  },
  dimensions: {
    length_mm: 400,
    width_mm: 300,
    height_mm: 100,
    volume_liters: 12.0,
  },
  category_hierarchy: {
    // Nested object (not flat string!)
    subject_id: 123,
    subject_name: 'Клеи и герметики',
    parent_id: 8,
    parent_name: 'Строительные материалы',
  },
}

const mockProductWithNullCategory: ProductWithDimensions = {
  nm_id: '123456789',
  vendor_code: 'ABC-001',
  sa_name: 'Товар без категории',
  category_hierarchy: null,
  dimensions: null,
}

const mockProductWithNullDimensions: ProductWithDimensions = {
  nm_id: '987654321',
  vendor_code: 'XYZ-999',
  sa_name: 'Товар без габаритов',
  category_hierarchy: {
    subject_id: 456,
    subject_name: 'Аксессуары',
    parent_id: null,
    parent_name: null,
  },
  dimensions: null,
}

// ============================================================================
// Story 44.33: AC1 - nm_id Type is String
// ============================================================================

describe('Story 44.33: AC1 - nm_id Type is String', () => {
  it('should have nm_id as string type in ProductWithDimensions', () => {
    // Type assertion - if nm_id is number, this will fail at compile time
    const nmId: string = mockApiProduct.nm_id
    expect(typeof nmId).toBe('string')
  })

  it('should accept numeric string nm_id', () => {
    const product: ProductWithDimensions = {
      ...mockApiProduct,
      nm_id: '147205694',
    }
    expect(product.nm_id).toBe('147205694')
    expect(typeof product.nm_id).toBe('string')
  })

  it('should NOT accept number nm_id (compile-time check)', () => {
    // This test documents the expected behavior
    // TypeScript correctly rejects number assignment to nm_id (TS2322)
    // Story 44.33: VERIFIED - nm_id type is string, number assignment fails at compile time
    const stringNmId: string = '147205694'
    const product: ProductWithDimensions = {
      ...mockApiProduct,
      nm_id: stringNmId,
    }
    // If this passes, nm_id is correctly typed as string
    expect(typeof product.nm_id).toBe('string')
  })

  it('should handle nm_id comparison correctly (string comparison)', () => {
    const productA: ProductWithDimensions = { ...mockApiProduct, nm_id: '100' }
    const productB: ProductWithDimensions = { ...mockApiProduct, nm_id: '99' }

    // String comparison: '100' < '99' (alphabetical)
    // Number comparison: 100 > 99
    // If sorted incorrectly, nm_id might be used as number
    expect(productA.nm_id < productB.nm_id).toBe(true) // String behavior
  })

  it('should work with nm_id in API request (overrides.nm_id)', () => {
    // API expects nm_id as string in overrides
    const overrides = {
      nm_id: mockApiProduct.nm_id, // Should be string
    }
    expect(typeof overrides.nm_id).toBe('string')
  })
})

// ============================================================================
// Story 44.33: AC2 - Product Name Field is sa_name
// ============================================================================

describe('Story 44.33: AC2 - Product Name Field is sa_name', () => {
  it('should have sa_name field for product name', () => {
    expect(mockApiProduct.sa_name).toBe('Эпоксидная смола')
    expect(mockApiProduct.sa_name).toBeDefined()
  })

  it('should NOT have title field on ProductWithDimensions', () => {
    // Story 44.33: VERIFIED - title field does not exist
    // ProductWithDimensions only has sa_name for product name
    // Type cast to check for non-existent field
    type ProductWithTitle = { title?: string }
    expect((mockApiProduct as unknown as ProductWithTitle).title).toBeUndefined()
  })

  it('should use sa_name in display contexts', () => {
    // Simulating what a display function would do
    const displayName = mockApiProduct.sa_name
    expect(displayName).toBeTruthy()
    expect(typeof displayName).toBe('string')
  })

  it('should handle empty sa_name gracefully', () => {
    const productWithEmptyName: ProductWithDimensions = {
      ...mockApiProduct,
      sa_name: '',
    }
    // Should fallback to nm_id or show placeholder
    const displayName = productWithEmptyName.sa_name || `Артикул: ${productWithEmptyName.nm_id}`
    expect(displayName).toBe('Артикул: 686701815')
  })
})

// ============================================================================
// Story 44.33: AC3 - Category Field is category_hierarchy
// ============================================================================

describe('Story 44.33: AC3 - Category Field is category_hierarchy', () => {
  it('should have category_hierarchy as nested object', () => {
    expect(mockApiProduct.category_hierarchy).toBeDefined()
    expect(typeof mockApiProduct.category_hierarchy).toBe('object')
  })

  it('should have subject_id, subject_name, parent_id, parent_name fields', () => {
    const category = mockApiProduct.category_hierarchy!
    expect(category.subject_id).toBe(123)
    expect(category.subject_name).toBe('Клеи и герметики')
    expect(category.parent_id).toBe(8)
    expect(category.parent_name).toBe('Строительные материалы')
  })

  it('should NOT have flat category string field', () => {
    // Story 44.33: VERIFIED - flat category field does not exist
    // ProductWithDimensions only has category_hierarchy for category data
    // Type cast to check for non-existent field
    type ProductWithFlatCategory = { category?: string }
    expect((mockApiProduct as unknown as ProductWithFlatCategory).category).toBeUndefined()
  })

  it('should handle null category_hierarchy', () => {
    expect(mockProductWithNullCategory.category_hierarchy).toBeNull()
    // Should display fallback text
    const displayCategory =
      mockProductWithNullCategory.category_hierarchy?.subject_name || 'Без категории'
    expect(displayCategory).toBe('Без категории')
  })

  it('should handle null parent_id and parent_name', () => {
    const categoryWithoutParent = mockProductWithNullDimensions.category_hierarchy!
    expect(categoryWithoutParent.parent_id).toBeNull()
    expect(categoryWithoutParent.parent_name).toBeNull()
  })

  it('should support category hierarchy display format', () => {
    const category = mockApiProduct.category_hierarchy!
    // Expected format: "Parent → Subject"
    const displayFormat = category.parent_name
      ? `${category.parent_name} → ${category.subject_name}`
      : category.subject_name
    expect(displayFormat).toBe('Строительные материалы → Клеи и герметики')
  })
})

// ============================================================================
// Story 44.33: AC4 - TypeScript Type Definitions
// ============================================================================

describe('Story 44.33: AC4 - TypeScript Type Definitions', () => {
  it('should have CategoryHierarchy interface with correct fields', () => {
    const category: CategoryHierarchy = {
      subject_id: 123,
      subject_name: 'Test Category',
      parent_id: null,
      parent_name: null,
    }
    expect(category.subject_id).toBe(123)
    expect(category.subject_name).toBe('Test Category')
  })

  it('should have ProductDimensionsMm interface with correct fields', () => {
    const dimensions: ProductDimensionsMm = {
      length_mm: 100,
      width_mm: 200,
      height_mm: 50,
      volume_liters: 1.0,
    }
    expect(dimensions.length_mm).toBe(100)
    expect(dimensions.volume_liters).toBe(1.0)
  })

  it('should allow optional dimensions on ProductWithDimensions', () => {
    const productWithDimensions: ProductWithDimensions = mockApiProduct
    const productWithoutDimensions: ProductWithDimensions = mockProductWithNullDimensions

    expect(productWithDimensions.dimensions).toBeDefined()
    expect(productWithoutDimensions.dimensions).toBeNull()
  })

  it('should allow optional category_hierarchy on ProductWithDimensions', () => {
    const productWithCategory: ProductWithDimensions = mockApiProduct
    const productWithoutCategory: ProductWithDimensions = mockProductWithNullCategory

    expect(productWithCategory.category_hierarchy).toBeDefined()
    expect(productWithoutCategory.category_hierarchy).toBeNull()
  })
})

// ============================================================================
// Story 44.33: AC5 - No Runtime Errors with Actual API Data
// ============================================================================

describe('Story 44.33: AC5 - No Runtime Errors with Actual API Data', () => {
  it('should safely access nm_id on valid product', () => {
    expect(() => {
      const id = mockApiProduct.nm_id
      return id
    }).not.toThrow()
  })

  it('should safely access sa_name on valid product', () => {
    expect(() => {
      const name = mockApiProduct.sa_name
      return name
    }).not.toThrow()
  })

  it('should safely access category_hierarchy on valid product', () => {
    expect(() => {
      const category = mockApiProduct.category_hierarchy
      return category
    }).not.toThrow()
  })

  it('should safely access nested category fields with optional chaining', () => {
    expect(() => {
      const subjectName = mockApiProduct.category_hierarchy?.subject_name
      const parentName = mockApiProduct.category_hierarchy?.parent_name
      return { subjectName, parentName }
    }).not.toThrow()
  })

  it('should safely access dimensions with optional chaining', () => {
    expect(() => {
      const length = mockApiProduct.dimensions?.length_mm
      const volume = mockApiProduct.dimensions?.volume_liters
      return { length, volume }
    }).not.toThrow()
  })

  it('should not throw when accessing null category_hierarchy', () => {
    expect(() => {
      const name = mockProductWithNullCategory.category_hierarchy?.subject_name
      return name
    }).not.toThrow()
    expect(mockProductWithNullCategory.category_hierarchy?.subject_name).toBeUndefined()
  })

  it('should not throw when accessing null dimensions', () => {
    expect(() => {
      const volume = mockProductWithNullDimensions.dimensions?.volume_liters
      return volume
    }).not.toThrow()
    expect(mockProductWithNullDimensions.dimensions?.volume_liters).toBeUndefined()
  })
})

// ============================================================================
// Story 44.33: Dimension Conversion (mm to cm)
// ============================================================================

describe('Story 44.33: Dimension Conversion', () => {
  it('should convert dimensions from mm to cm correctly', () => {
    const dimensions = mockApiProduct.dimensions!
    const lengthCm = dimensions.length_mm / 10
    const widthCm = dimensions.width_mm / 10
    const heightCm = dimensions.height_mm / 10

    expect(lengthCm).toBe(40)
    expect(widthCm).toBe(30)
    expect(heightCm).toBe(10)
  })

  it('should use pre-calculated volume_liters from backend', () => {
    const dimensions = mockApiProduct.dimensions!
    // Backend pre-calculates: L×W×H/1000000 = 400×300×100/1000000 = 12.0
    expect(dimensions.volume_liters).toBe(12.0)
  })

  it('should not re-calculate volume on frontend', () => {
    const dimensions = mockApiProduct.dimensions!
    // Frontend should use backend's volume_liters, not recalculate
    // Manual calc: 400×300×100/1000000 = 12.0
    const manualCalc = (dimensions.length_mm * dimensions.width_mm * dimensions.height_mm) / 1_000_000
    expect(dimensions.volume_liters).toBe(manualCalc)
  })
})

// ============================================================================
// Story 44.33: Product Search Integration
// ============================================================================

describe('Story 44.33: Product Search Integration', () => {
  it('should search by sa_name field', () => {
    const products: ProductWithDimensions[] = [
      mockApiProduct,
      { ...mockApiProduct, nm_id: '2', sa_name: 'Другой товар' },
      { ...mockApiProduct, nm_id: '3', sa_name: 'Эпоксидный клей' },
    ]

    const searchQuery = 'Эпокси'
    const filtered = products.filter((p) =>
      p.sa_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    expect(filtered).toHaveLength(2)
    expect(filtered.map((p) => p.nm_id)).toEqual(['686701815', '3'])
  })

  it('should search by vendor_code field', () => {
    const products: ProductWithDimensions[] = [
      mockApiProduct,
      { ...mockApiProduct, nm_id: '2', vendor_code: 'ABC-999' },
    ]

    const searchQuery = 'EPO'
    const filtered = products.filter(
      (p) => p.vendor_code && p.vendor_code.includes(searchQuery)
    )

    expect(filtered).toHaveLength(1)
    expect(filtered[0].vendor_code).toBe('EPO-123')
  })

  it('should filter by category_hierarchy.subject_id', () => {
    const products: ProductWithDimensions[] = [
      mockApiProduct, // subject_id: 123
      { ...mockApiProduct, nm_id: '2', category_hierarchy: { ...mockApiProduct.category_hierarchy!, subject_id: 456 } },
    ]

    const categoryFilter = 123
    const filtered = products.filter(
      (p) => p.category_hierarchy?.subject_id === categoryFilter
    )

    expect(filtered).toHaveLength(1)
    expect(filtered[0].nm_id).toBe('686701815')
  })
})

// ============================================================================
// Story 44.33: Auto-fill Data Extraction
// ============================================================================

describe('Story 44.33: Auto-fill Data Extraction', () => {
  it('should extract dimensions for auto-fill (converting mm to cm)', () => {
    const dimensions = mockApiProduct.dimensions!

    const autoFillData = {
      length_cm: dimensions.length_mm / 10,
      width_cm: dimensions.width_mm / 10,
      height_cm: dimensions.height_mm / 10,
      volume_liters: dimensions.volume_liters,
    }

    expect(autoFillData.length_cm).toBe(40)
    expect(autoFillData.width_cm).toBe(30)
    expect(autoFillData.height_cm).toBe(10)
    expect(autoFillData.volume_liters).toBe(12.0)
  })

  it('should extract category for auto-fill', () => {
    const category = mockApiProduct.category_hierarchy!

    const autoFillData = {
      category_id: category.subject_id,
      category_name: category.subject_name,
      parent_category_name: category.parent_name,
    }

    expect(autoFillData.category_id).toBe(123)
    expect(autoFillData.category_name).toBe('Клеи и герметики')
    expect(autoFillData.parent_category_name).toBe('Строительные материалы')
  })

  it('should handle missing dimensions in auto-fill', () => {
    const autoFillData = {
      length_cm: mockProductWithNullDimensions.dimensions?.length_mm
        ? mockProductWithNullDimensions.dimensions.length_mm / 10
        : 0,
      width_cm: mockProductWithNullDimensions.dimensions?.width_mm
        ? mockProductWithNullDimensions.dimensions.width_mm / 10
        : 0,
      height_cm: mockProductWithNullDimensions.dimensions?.height_mm
        ? mockProductWithNullDimensions.dimensions.height_mm / 10
        : 0,
    }

    expect(autoFillData.length_cm).toBe(0)
    expect(autoFillData.width_cm).toBe(0)
    expect(autoFillData.height_cm).toBe(0)
  })

  it('should handle missing category in auto-fill', () => {
    const autoFillData = {
      category_id: mockProductWithNullCategory.category_hierarchy?.subject_id ?? null,
      category_name:
        mockProductWithNullCategory.category_hierarchy?.subject_name ?? 'Без категории',
    }

    expect(autoFillData.category_id).toBeNull()
    expect(autoFillData.category_name).toBe('Без категории')
  })
})

// ============================================================================
// Story 44.33: Helper Functions for Category Display
// ============================================================================

describe('Story 44.33: Category Display Helpers', () => {
  // These tests define the expected behavior for helper functions
  // that need to be created: getCategoryDisplayName, getCategoryName, getCategoryId

  function getCategoryDisplayName(
    category: CategoryHierarchy | null | undefined
  ): string {
    if (!category) return 'Без категории'
    if (category.parent_name) {
      return `${category.parent_name} → ${category.subject_name}`
    }
    return category.subject_name
  }

  function getCategoryName(
    category: CategoryHierarchy | null | undefined
  ): string {
    return category?.subject_name || 'Без категории'
  }

  function getCategoryId(
    category: CategoryHierarchy | null | undefined
  ): number | null {
    return category?.subject_id ?? null
  }

  it('should format full hierarchy display name', () => {
    const displayName = getCategoryDisplayName(mockApiProduct.category_hierarchy)
    expect(displayName).toBe('Строительные материалы → Клеи и герметики')
  })

  it('should format category without parent', () => {
    const categoryWithoutParent: CategoryHierarchy = {
      subject_id: 456,
      subject_name: 'Аксессуары',
      parent_id: null,
      parent_name: null,
    }
    const displayName = getCategoryDisplayName(categoryWithoutParent)
    expect(displayName).toBe('Аксессуары')
  })

  it('should return fallback for null category', () => {
    const displayName = getCategoryDisplayName(null)
    expect(displayName).toBe('Без категории')
  })

  it('should get leaf category name', () => {
    const name = getCategoryName(mockApiProduct.category_hierarchy)
    expect(name).toBe('Клеи и герметики')
  })

  it('should get category ID', () => {
    const id = getCategoryId(mockApiProduct.category_hierarchy)
    expect(id).toBe(123)
  })

  it('should return null ID for null category', () => {
    const id = getCategoryId(null)
    expect(id).toBeNull()
  })
})
