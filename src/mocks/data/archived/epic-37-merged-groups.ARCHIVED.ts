/**
 * ⚠️⚠️⚠️ TEMPORARY MOCK DATA - ОБЯЗАТЕЛЬНО К УДАЛЕНИЮ ⚠️⚠️⚠️
 *
 * Mock Data for Epic 37: Merged Group Table Display
 *
 * 📋 PURPOSE: Временные данные для разработки frontend пока backend API (Story 37.0) в разработке
 * 🗓️ CREATED: 2025-12-29 (Phase 0 - Preparation)
 * 🎯 DELETE WHEN: Backend Story 37.0 complete + Story 37.1 validation PASS + integration tested
 *
 * ════════════════════════════════════════════════════════════════════════════
 * 🗑️ DELETION INSTRUCTIONS (КРИТИЧНО!)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * ЭТОТ ФАЙЛ ДОЛЖЕН БЫТЬ УДАЛЁН! Не оставляй mock данные в production!
 *
 * 📖 ПОЛНЫЙ ПРОЦЕСС УДАЛЕНИЯ:
 * См. файл: frontend/docs/EPIC-37-MOCK-DATA-MANAGEMENT.md (Phase 4: Code Cleanup)
 *
 * 🔍 БЫСТРАЯ ПРОВЕРКА всех мест использования:
 * ```bash
 * # Найти все импорты этого файла
 * grep -r "epic-37-merged-groups" src/
 * grep -r "mockMergedGroup" src/
 *
 * # После удаления должно быть: No results
 * ```
 *
 * 📍 ГДЕ ИСПОЛЬЗУЕТСЯ (удалить импорты из этих файлов):
 * 1. src/mocks/handlers/advertising.ts - MSW handler для group_by=imtId
 * 2. src/app/(dashboard)/analytics/advertising/page.tsx - условный импорт для dev mode
 * 3. src/components/advertising/MergedGroupTable.tsx - импорт для разработки компонента
 * 4. Test files - если используют mockMergedGroups (заменить на inline fixtures)
 *
 * 🔄 КОГДА УДАЛЯТЬ (5-шаговый процесс):
 * 1. ✅ Backend уведомляет: "Story 37.0 COMPLETE" (Request #88 implemented)
 * 2. ✅ Выполнить Story 37.1: API Validation (test real endpoint, verify structure)
 * 3. ✅ Story 37.1 status = PASS (all 15 acceptance criteria met)
 * 4. ✅ Включить real API: Set NEXT_PUBLIC_EPIC_37_USE_REAL_API=true
 * 5. ✅ Протестировать интеграцию (все 3 test scenarios работают)
 * 6. 🗑️ **УДАЛИТЬ ЭТОТ ФАЙЛ**: rm src/mocks/data/epic-37-merged-groups.ts
 * 7. 🗑️ Удалить все импорты (см. список выше)
 * 8. ✅ Verify: grep -r "epic-37-merged-groups" src/ (no results)
 *
 * ⛔ НЕ УДАЛЯТЬ РАНЬШЕ ВРЕМЕНИ!
 * - Если backend затянется - продолжай разработку с mock данными
 * - Если Story 37.1 validation FAIL - исправь backend, оставь mock данные
 * - Только после успешной интеграции удаляй!
 *
 * ════════════════════════════════════════════════════════════════════════════
 * 📚 DOCUMENTATION REFERENCES
 * ════════════════════════════════════════════════════════════════════════════
 *
 * 📖 Request #88: frontend/docs/request-backend/88-epic-37-individual-product-metrics.md
 *    Backend API specification for Epic 37 (Story 37.0)
 *    Описывает структуру API response, которую этот mock эмулирует
 *
 * 📖 Epic Doc: frontend/docs/epics/epic-37-merged-group-table-display.md
 *    Главный документ Epic 37 - бизнес-контекст, архитектура, stories breakdown
 *
 * 📖 Implementation Plan: frontend/docs/implementation-plans/epic-37-frontend-implementation-plan.md
 *    План разработки с mock данными → real API transition
 *
 * 📖 Mock Management: frontend/docs/EPIC-37-MOCK-DATA-MANAGEMENT.md
 *    ПОЛНЫЙ cleanup checklist с пошаговыми инструкциями
 *
 * 📖 Start Here: frontend/docs/EPIC-37-START-HERE.md
 *    Quick start guide для разработчиков
 *
 * ════════════════════════════════════════════════════════════════════════════
 * 📊 TEST DATA COVERAGE
 * ════════════════════════════════════════════════════════════════════════════
 *
 * 3 test groups для полного покрытия UI scenarios:
 *
 * 1. mockMergedGroup1 (imtId=328632):
 *    - Normal merged group: 6 products
 *    - Main product: ter-09 (spend=11,337₽)
 *    - 5 child products (spend=0)
 *    - Aggregate: 35,570₽ total sales
 *    - Tests: 3-tier table, rowspan logic, main/child distinction
 *
 * 2. mockMergedGroup2 (imtId=456789):
 *    - Small merged group: 2 products (minimum size)
 *    - Main product: izo30white (spend=3,000₽)
 *    - 1 child product: izo30black
 *    - Aggregate: 12,500₽ total sales, ROAS 2.50
 *    - Tests: Minimum group size edge case
 *
 * 3. mockStandaloneProduct (imtId=null):
 *    - Standalone product: izo30red
 *    - NOT in merged group (imtId=null)
 *    - Excellent ROAS 5.4
 *    - Tests: No rowspan cell, single-row display
 *
 * 📊 DATA STRUCTURE (Request #88):
 * {
 *   imtId: number,                                    // Group identifier
 *   mainProduct: { nmId, vendorCode, name? },        // Main product reference
 *   productCount: number,                             // Products in group
 *   aggregateMetrics: {                               // Group-level sums
 *     totalSales, revenue, organicSales, spend, roas, ...
 *   },
 *   products: [                                       // Individual products
 *     { nmId, vendorCode, imtId, isMainProduct, totalSales, ... }
 *   ]
 * }
 */

import type { AdvertisingGroup } from '@/types/advertising-analytics'

// ============================================================================
// TEST GROUP 1: Normal Merged Group (6 products)
// ============================================================================

/**
 * Test Group 1: ter-09 (Main Product) + 5 Child Products
 *
 * 📋 Test Coverage:
 * - 3-tier table structure (rowspan + aggregate + 6 detail rows)
 * - Main product identification (spend > 0, isMainProduct: true)
 * - Child products (spend = 0, isMainProduct: false)
 * - Epic 35 fields (totalSales, revenue, organicSales, organicContribution)
 * - ROAS calculation (main: calculated, children: null)
 * - Aggregate = SUM(individual) data integrity
 *
 * 🎯 Expected Behavior:
 * - Rowspan cell: "ter-09 + 5 товаров" (spans 7 rows: 1 aggregate + 6 products)
 * - Aggregate row: "ГРУППА #328632" with bold gray background
 * - Main product row: "👑 ter-09" (first in list)
 * - Child products: Sorted by totalSales DESC
 *
 * 📊 Financial Summary (Week 49, Dec 1-7 2025):
 * - Total Sales: 35,570₽ (aggregate of all 6 products)
 * - Ad Revenue: 10,234₽ (29% of total sales)
 * - Organic Sales: 25,336₽ (71% of total sales)
 * - Ad Spend: 11,337₽ (only main product)
 * - ROAS: 0.90 (revenue / spend = 10234 / 11337)
 */
export const mockMergedGroup1: AdvertisingGroup = {
  type: 'merged_group',
  imtId: 328632,

  mainProduct: {
    nmId: 270937054,
    vendorCode: 'ter-09',
    name: 'Товар ter-09 (Главный артикул склейки)',
  },

  productCount: 6,

  // 📊 Aggregate Metrics (Sum of all 6 products)
  // ⚠️ VALIDATION: aggregateMetrics MUST equal SUM(products[])
  aggregateMetrics: {
    totalViews: 6200,     // Sum: 3500 + 1800 + 900 + 0 + 0 + 0
    totalClicks: 310,     // Sum: 180 + 80 + 50 + 0 + 0 + 0
    totalOrders: 13,      // Sum: 8 + 3 + 2 + 0 + 0 + 0
    totalSpend: 11337,    // Sum: 11337 + 0 + 0 + 0 + 0 + 0 (only main)
    totalRevenue: 10234,  // Sum: 4000 + 2300 + 1500 + 1234 + 800 + 400
    totalSales: 35570,    // Sum: 15000 + 8500 + 5234 + 3242 + 2105 + 1489
    organicSales: 25336,  // Calculation: totalSales - totalRevenue = 35570 - 10234
    organicContribution: 71.2,  // Calculation: (organicSales / totalSales) × 100 = (25336 / 35570) × 100
    roas: 0.90,           // Calculation: revenue / spend = 10234 / 11337
    roi: -0.10,           // Calculation: (revenue - spend) / spend = (10234 - 11337) / 11337
    ctr: 5.0,             // Calculation: (clicks / views) × 100 = (310 / 6200) × 100
    cpc: 36.57,           // Calculation: spend / clicks = 11337 / 310
    conversionRate: 4.19, // Calculation: (orders / clicks) × 100 = (13 / 310) × 100
    profitAfterAds: -1103, // Calculation: revenue - spend = 10234 - 11337
  },

  // 📊 Individual Product Metrics
  // ⚠️ SORT ORDER: Main product first, then by totalSales DESC
  products: [
    // 👑 MAIN PRODUCT (isMainProduct: true, spend > 0)
    {
      nmId: 270937054,
      vendorCode: 'ter-09',
      imtId: 328632,
      isMainProduct: true,  // ✅ Main product marker

      // Epic 35 fields
      totalViews: 3500,
      totalClicks: 180,
      totalOrders: 8,
      totalSpend: 11337,    // ✅ Main product has spend > 0
      totalRevenue: 4000,
      totalSales: 15000,
      organicSales: 11000,  // 15000 - 4000
      organicContribution: 73.3,  // (11000 / 15000) × 100

      // Calculated metrics
      roas: 0.35,           // ✅ Main product: revenue / spend = 4000 / 11337
      roi: -0.65,           // (4000 - 11337) / 11337
      ctr: 5.14,            // (180 / 3500) × 100
      cpc: 62.98,           // 11337 / 180
      conversionRate: 4.44, // (8 / 180) × 100
      profitAfterAds: -7337, // 4000 - 11337
    },

    // CHILD PRODUCTS (isMainProduct: false, spend = 0)
    // Sorted by totalSales DESC

    {
      nmId: 173589306,
      vendorCode: 'ter-10',
      imtId: 328632,
      isMainProduct: false,

      totalViews: 1800,
      totalClicks: 80,
      totalOrders: 3,
      totalSpend: 0,        // ✅ Child product: spend = 0
      totalRevenue: 2300,
      totalSales: 8500,
      organicSales: 6200,   // 8500 - 2300
      organicContribution: 72.9,  // (6200 / 8500) × 100

      roas: null,           // ✅ Child product: spend = 0 → ROAS = null
      roi: null,            // ✅ Child product: spend = 0 → ROI = null
      ctr: 4.44,            // (80 / 1800) × 100
      cpc: null,            // spend = 0 → CPC = null
      conversionRate: 3.75, // (3 / 80) × 100
      profitAfterAds: 2300, // revenue - 0
    },

    {
      nmId: 270937055,
      vendorCode: 'ter-11',
      imtId: 328632,
      isMainProduct: false,

      totalViews: 900,
      totalClicks: 50,
      totalOrders: 2,
      totalSpend: 0,
      totalRevenue: 1500,
      totalSales: 5234,
      organicSales: 3734,
      organicContribution: 71.3,

      roas: null,
      roi: null,
      ctr: 5.56,
      cpc: null,
      conversionRate: 4.0,
      profitAfterAds: 1500,
    },

    {
      nmId: 270937056,
      vendorCode: 'ter-12',
      imtId: 328632,
      isMainProduct: false,

      totalViews: 0,
      totalClicks: 0,
      totalOrders: 0,
      totalSpend: 0,
      totalRevenue: 1234,
      totalSales: 3242,
      organicSales: 2008,
      organicContribution: 61.9,

      roas: null,
      roi: null,
      ctr: 0,
      cpc: null,
      conversionRate: 0,
      profitAfterAds: 1234,
    },

    {
      nmId: 270937057,
      vendorCode: 'ter-13',
      imtId: 328632,
      isMainProduct: false,

      totalViews: 0,
      totalClicks: 0,
      totalOrders: 0,
      totalSpend: 0,
      totalRevenue: 800,
      totalSales: 2105,
      organicSales: 1305,
      organicContribution: 62.0,

      roas: null,
      roi: null,
      ctr: 0,
      cpc: null,
      conversionRate: 0,
      profitAfterAds: 800,
    },

    {
      nmId: 173588306,
      vendorCode: 'ter-14',
      imtId: 328632,
      isMainProduct: false,

      totalViews: 0,
      totalClicks: 0,
      totalOrders: 0,
      totalSpend: 0,
      totalRevenue: 400,
      totalSales: 1489,
      organicSales: 1089,
      organicContribution: 73.1,

      roas: null,
      roi: null,
      ctr: 0,
      cpc: null,
      conversionRate: 0,
      profitAfterAds: 400,
    },
  ],
}

// ============================================================================
// TEST GROUP 2: Small Merged Group (2 products - minimum size)
// ============================================================================

/**
 * Test Group 2: izo30white (Main) + izo30black (Child)
 *
 * 📋 Test Coverage:
 * - Minimum group size (2 products)
 * - Small rowspan cell (spans 3 rows: 1 aggregate + 2 products)
 * - Efficient ROAS (profitable campaign)
 *
 * 🎯 Expected Behavior:
 * - Rowspan cell: "izo30white + 1 товар"
 * - Aggregate row: "ГРУППА #456789"
 * - Only 2 product rows below aggregate
 *
 * 📊 Financial Summary:
 * - Total Sales: 12,500₽
 * - Ad Revenue: 7,500₽ (60%)
 * - Organic Sales: 5,000₽ (40%)
 * - Ad Spend: 3,000₽
 * - ROAS: 2.50 (good performance)
 */
export const mockMergedGroup2: AdvertisingGroup = {
  type: 'merged_group',
  imtId: 456789,

  mainProduct: {
    nmId: 12345678,
    vendorCode: 'izo30white',
    name: 'Товар izo30white (Белый)',
  },

  productCount: 2,

  aggregateMetrics: {
    totalViews: 3000,
    totalClicks: 150,
    totalOrders: 10,
    totalSpend: 3000,
    totalRevenue: 7500,
    totalSales: 12500,
    organicSales: 5000,    // 12500 - 7500
    organicContribution: 40.0,  // (5000 / 12500) × 100
    roas: 2.50,            // 7500 / 3000
    roi: 1.50,             // (7500 - 3000) / 3000
    ctr: 5.0,
    cpc: 20.0,
    conversionRate: 6.67,
    profitAfterAds: 4500,
  },

  products: [
    // Main product
    {
      nmId: 12345678,
      vendorCode: 'izo30white',
      imtId: 456789,
      isMainProduct: true,

      totalViews: 2000,
      totalClicks: 100,
      totalOrders: 7,
      totalSpend: 3000,     // Main product has spend
      totalRevenue: 5000,
      totalSales: 8000,
      organicSales: 3000,
      organicContribution: 37.5,

      roas: 1.67,           // 5000 / 3000
      roi: 0.67,
      ctr: 5.0,
      cpc: 30.0,
      conversionRate: 7.0,
      profitAfterAds: 2000,
    },

    // Child product
    {
      nmId: 12345679,
      vendorCode: 'izo30black',
      imtId: 456789,
      isMainProduct: false,

      totalViews: 1000,
      totalClicks: 50,
      totalOrders: 3,
      totalSpend: 0,        // Child: no spend
      totalRevenue: 2500,
      totalSales: 4500,
      organicSales: 2000,
      organicContribution: 44.4,

      roas: null,
      roi: null,
      ctr: 5.0,
      cpc: null,
      conversionRate: 6.0,
      profitAfterAds: 2500,
    },
  ],
}

// ============================================================================
// TEST GROUP 3: Standalone Product (imtId = null)
// ============================================================================

/**
 * Test Group 3: Standalone Product (Not in Merged Group)
 *
 * 📋 Test Coverage:
 * - Standalone product (imtId = null)
 * - NO rowspan cell (should display as single regular row)
 * - NO aggregate row (skip Tier 1 and Tier 2)
 * - Direct display of product metrics
 *
 * 🎯 Expected Behavior:
 * - NO rowspan cell in UI
 * - NO "ГРУППА #imtId" row
 * - Display as standard single-product row
 * - Same columns as detail rows in merged groups
 *
 * 📊 Financial Summary:
 * - Individual product with excellent ROAS (5.4)
 * - Low organic contribution (22.9%) - mostly ad-driven
 */
export const mockStandaloneProduct: AdvertisingGroup = {
  type: 'individual',
  imtId: null,          // ✅ Standalone: imtId = null

  mainProduct: {
    nmId: 123456,
    vendorCode: 'izo30red',
    name: 'Товар без склейки (izo30red)',
  },

  productCount: 1,      // Only 1 product

  // Aggregate = Product metrics (same values)
  aggregateMetrics: {
    totalViews: 10000,
    totalClicks: 300,
    totalOrders: 45,
    totalSpend: 5000,
    totalRevenue: 27000,
    totalSales: 35000,
    organicSales: 8000,
    organicContribution: 22.9,
    roas: 5.4,            // Excellent ROAS
    roi: 4.4,
    ctr: 3.0,
    cpc: 16.67,
    conversionRate: 15.0,
    profitAfterAds: 22000,
  },

  products: [
    {
      nmId: 123456,
      vendorCode: 'izo30red',
      imtId: null,        // ✅ Standalone: imtId = null
      isMainProduct: true, // Technically main, but only 1 product

      totalViews: 10000,
      totalClicks: 300,
      totalOrders: 45,
      totalSpend: 5000,
      totalRevenue: 27000,
      totalSales: 35000,
      organicSales: 8000,
      organicContribution: 22.9,

      roas: 5.4,
      roi: 4.4,
      ctr: 3.0,
      cpc: 16.67,
      conversionRate: 15.0,
      profitAfterAds: 22000,
    },
  ],
}

// ============================================================================
// EXPORT: All Mock Groups
// ============================================================================

/**
 * All Epic 37 Mock Groups for Testing
 *
 * 📍 USAGE:
 * - MSW handlers: src/mocks/handlers/advertising.ts
 * - Component tests: src/components/advertising/__tests__/MergedGroupTable.test.tsx
 * - Integration tests: src/app/(dashboard)/analytics/advertising/__tests__/page.integration.test.tsx
 *
 * 🔄 REPLACEMENT:
 * When backend Story 37.0 complete, replace with real API call:
 * ```typescript
 * const response = await fetch('/api/v1/analytics/advertising?group_by=imtId')
 * const { data } = await response.json()
 * // data will have same structure as mockMergedGroups
 * ```
 */
export const mockMergedGroups: AdvertisingGroup[] = [
  mockMergedGroup1,       // Normal group: 6 products
  mockMergedGroup2,       // Small group: 2 products
  mockStandaloneProduct,  // Standalone: imtId = null
]

// ============================================================================
// VALIDATION UTILITIES (for testing)
// ============================================================================

/**
 * Validate that aggregate metrics equal sum of individual products
 *
 * 🎯 Use in tests to ensure data integrity:
 * ```typescript
 * it('aggregate equals sum of products', () => {
 *   expect(validateAggregateIntegrity(mockMergedGroup1)).toBe(true)
 * })
 * ```
 */
export function validateAggregateIntegrity(group: AdvertisingGroup): boolean {
  if (group.type !== 'merged_group' || !group.products || !group.aggregateMetrics) {
    return true // Not applicable
  }

  const summed = group.products.reduce(
    (sum, p) => ({
      totalViews: sum.totalViews + p.totalViews,
      totalClicks: sum.totalClicks + p.totalClicks,
      totalOrders: sum.totalOrders + p.totalOrders,
      totalSpend: sum.totalSpend + p.totalSpend,
      totalRevenue: sum.totalRevenue + p.totalRevenue,
      totalSales: sum.totalSales + p.totalSales,
    }),
    {
      totalViews: 0,
      totalClicks: 0,
      totalOrders: 0,
      totalSpend: 0,
      totalRevenue: 0,
      totalSales: 0,
    }
  )

  const tolerance = 0.01 // Floating point tolerance

  return (
    Math.abs(group.aggregateMetrics.totalViews - summed.totalViews) < tolerance &&
    Math.abs(group.aggregateMetrics.totalClicks - summed.totalClicks) < tolerance &&
    Math.abs(group.aggregateMetrics.totalOrders - summed.totalOrders) < tolerance &&
    Math.abs(group.aggregateMetrics.totalSpend - summed.totalSpend) < tolerance &&
    Math.abs(group.aggregateMetrics.totalRevenue - summed.totalRevenue) < tolerance &&
    Math.abs(group.aggregateMetrics.totalSales - summed.totalSales) < tolerance
  )
}

/**
 * Validate main product identification rules
 *
 * Rules:
 * 1. Exactly ONE product per group has isMainProduct: true
 * 2. Main product MUST have spend > 0
 * 3. All child products MUST have spend = 0
 */
export function validateMainProduct(group: AdvertisingGroup): boolean {
  if (group.type !== 'merged_group' || !group.products) {
    return true
  }

  const mainProducts = group.products.filter((p) => p.isMainProduct)

  // Must have exactly 1 main product
  if (mainProducts.length !== 1) {
    return false
  }

  // Main product must have spend > 0
  if (mainProducts[0].totalSpend <= 0) {
    return false
  }

  // All other products must have spend = 0
  const childProducts = group.products.filter((p) => !p.isMainProduct)
  if (childProducts.some((p) => p.totalSpend > 0)) {
    return false
  }

  return true
}

/**
 * Validate sort order within group
 *
 * Rules:
 * 1. First product MUST be main (isMainProduct: true)
 * 2. Remaining products sorted by totalSales DESC
 */
export function validateSortOrder(group: AdvertisingGroup): boolean {
  if (group.type !== 'merged_group' || !group.products || group.products.length <= 1) {
    return true
  }

  // First product must be main
  if (!group.products[0].isMainProduct) {
    return false
  }

  // Remaining products sorted by totalSales DESC
  for (let i = 2; i < group.products.length; i++) {
    if (group.products[i].totalSales > group.products[i - 1].totalSales) {
      return false
    }
  }

  return true
}
