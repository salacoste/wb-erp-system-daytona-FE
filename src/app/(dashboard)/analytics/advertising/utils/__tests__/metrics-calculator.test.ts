/**
 * Unit Tests: Metrics Calculator (Story 37.5)
 *
 * Tests all 6 Epic 35 calculation formulas for aggregate metrics.
 * Target: ≥90% code coverage.
 *
 * @see Story 37.3: Aggregate Metrics Display
 * @see Story 37.5: Testing & Documentation
 */

import {
  calculateTotalSales,
  calculateRevenue,
  calculateOrganicSales,
  calculateOrganicSalesFromProducts,
  calculateOrganicContribution,
  calculateSpend,
  calculateROAS,
  ProductMetrics,
} from '../metrics-calculator';

// ============================================================================
// Test Data Fixtures
// ============================================================================

/** Mock product with all required fields */
const createMockProduct = (overrides?: Partial<ProductMetrics>): ProductMetrics => ({
  totalSales: 10000,
  totalRevenue: 3000,
  organicSales: 7000,
  totalSpend: 5000,
  ...overrides,
});

/** Mock product group (6 products from mockMergedGroup1) */
const mockProductGroup: ProductMetrics[] = [
  { totalSales: 15000, totalRevenue: 4000, organicSales: 11000, totalSpend: 6000 }, // ter-09 main
  { totalSales: 1489, totalRevenue: 400, organicSales: 1089, totalSpend: 0 },       // child 1
  { totalSales: 8500, totalRevenue: 2300, organicSales: 6200, totalSpend: 0 },      // child 2
  { totalSales: 4670, totalRevenue: 1234, organicSales: 3436, totalSpend: 2337 },   // child 3
  { totalSales: 3411, totalRevenue: 1200, organicSales: 2211, totalSpend: 1500 },   // child 4
  { totalSales: 2500, totalRevenue: 1100, organicSales: 1400, totalSpend: 1500 },   // child 5
];

// ============================================================================
// Formula 1: Calculate Total Sales
// ============================================================================

describe('calculateTotalSales', () => {
  it('should sum totalSales from all products', () => {
    const result = calculateTotalSales(mockProductGroup);
    // Expected: 15000 + 1489 + 8500 + 4670 + 3411 + 2500 = 35,570
    expect(result).toBe(35570);
  });

  it('should return 0 for empty product array', () => {
    const result = calculateTotalSales([]);
    expect(result).toBe(0);
  });

  it('should handle single product', () => {
    const singleProduct = [createMockProduct({ totalSales: 12000 })];
    const result = calculateTotalSales(singleProduct);
    expect(result).toBe(12000);
  });

  it('should handle negative sales (returns scenario)', () => {
    const products = [
      createMockProduct({ totalSales: 10000 }),
      createMockProduct({ totalSales: -3000 }), // Net return
    ];
    const result = calculateTotalSales(products);
    expect(result).toBe(7000); // 10000 - 3000
  });
});

// ============================================================================
// Formula 2: Calculate Revenue
// ============================================================================

describe('calculateRevenue', () => {
  it('should sum totalRevenue from all products', () => {
    const result = calculateRevenue(mockProductGroup);
    // Expected: 4000 + 400 + 2300 + 1234 + 1200 + 1100 = 10,234
    expect(result).toBe(10234);
  });

  it('should return 0 for empty product array', () => {
    const result = calculateRevenue([]);
    expect(result).toBe(0);
  });

  it('should handle products with zero revenue (no ads)', () => {
    const products = [
      createMockProduct({ totalRevenue: 5000 }),
      createMockProduct({ totalRevenue: 0 }),
      createMockProduct({ totalRevenue: 0 }),
    ];
    const result = calculateRevenue(products);
    expect(result).toBe(5000);
  });
});

// ============================================================================
// Formula 3: Calculate Organic Sales
// ============================================================================

describe('calculateOrganicSales', () => {
  it('should subtract revenue from totalSales', () => {
    const result = calculateOrganicSales(35570, 10234);
    // Expected: 35570 - 10234 = 25,336
    expect(result).toBe(25336);
  });

  it('should handle zero revenue (100% organic)', () => {
    const result = calculateOrganicSales(50000, 0);
    expect(result).toBe(50000);
  });

  it('should handle zero total sales', () => {
    const result = calculateOrganicSales(0, 0);
    expect(result).toBe(0);
  });

  it('should handle negative result (returns > sales)', () => {
    // Edge case: Revenue attribution exceeds sales (data quality issue)
    const result = calculateOrganicSales(10000, 12000);
    expect(result).toBe(-2000); // Negative organic sales
  });
});

describe('calculateOrganicSalesFromProducts', () => {
  it('should sum pre-calculated organicSales from products', () => {
    // Type assertion: mockProductGroup has organicSales on all products
    const productsWithOrganic = mockProductGroup as (ProductMetrics & { organicSales: number })[];
    const result = calculateOrganicSalesFromProducts(productsWithOrganic);
    // Expected: 11000 + 1089 + 6200 + 3436 + 2211 + 1400 = 25,336
    expect(result).toBe(25336);
  });

  it('should match subtraction method result', () => {
    const totalSales = calculateTotalSales(mockProductGroup);
    const revenue = calculateRevenue(mockProductGroup);
    const organicSalesSubtraction = calculateOrganicSales(totalSales, revenue);
    // Type assertion: mockProductGroup has organicSales on all products
    const productsWithOrganic = mockProductGroup as (ProductMetrics & { organicSales: number })[];
    const organicSalesSum = calculateOrganicSalesFromProducts(productsWithOrganic);

    expect(organicSalesSum).toBe(organicSalesSubtraction);
  });
});

// ============================================================================
// Formula 4: Calculate Organic Contribution
// ============================================================================

describe('calculateOrganicContribution', () => {
  it('should calculate percentage of organic sales', () => {
    const result = calculateOrganicContribution(25336, 35570);
    // Expected: (25336 / 35570) × 100 = 71.229%
    expect(result).toBeCloseTo(71.229, 2);
  });

  it('should return 100 for zero revenue (100% organic)', () => {
    const result = calculateOrganicContribution(50000, 50000);
    expect(result).toBe(100);
  });

  it('should return 0 for zero organic sales (100% advertising)', () => {
    const result = calculateOrganicContribution(0, 50000);
    expect(result).toBe(0);
  });

  it('should handle division by zero (totalSales = 0)', () => {
    const result = calculateOrganicContribution(0, 0);
    expect(result).toBe(0); // Edge case: return 0 instead of NaN
  });

  it('should handle NaN edge case', () => {
    // Ensure isNaN() check works
    const result = calculateOrganicContribution(NaN, 0);
    expect(result).toBe(0);
  });

  it('should handle negative contribution (returns exceed sales)', () => {
    const result = calculateOrganicContribution(-2000, 10000);
    // Expected: (-2000 / 10000) × 100 = -20%
    expect(result).toBe(-20);
  });
});

// ============================================================================
// Formula 5: Calculate Spend
// ============================================================================

describe('calculateSpend', () => {
  it('should sum totalSpend from all products', () => {
    const result = calculateSpend(mockProductGroup);
    // Expected: 6000 + 0 + 0 + 2337 + 1500 + 1500 = 11,337
    expect(result).toBe(11337);
  });

  it('should return 0 for products with no spend', () => {
    const products = [
      createMockProduct({ totalSpend: 0 }),
      createMockProduct({ totalSpend: 0 }),
    ];
    const result = calculateSpend(products);
    expect(result).toBe(0);
  });

  it('should handle empty product array', () => {
    const result = calculateSpend([]);
    expect(result).toBe(0);
  });

  it('should handle only main product with spend', () => {
    // Typical merged group: Only main product has spend > 0
    const products = [
      createMockProduct({ totalSpend: 5000 }), // main
      createMockProduct({ totalSpend: 0 }),    // child
      createMockProduct({ totalSpend: 0 }),    // child
    ];
    const result = calculateSpend(products);
    expect(result).toBe(5000);
  });
});

// ============================================================================
// Formula 6: Calculate ROAS
// ============================================================================

describe('calculateROAS', () => {
  it('should calculate ROAS (revenue / spend)', () => {
    const result = calculateROAS(10234, 11337);
    // Expected: 10234 / 11337 = 0.9027...
    expect(result).toBeCloseTo(0.9027, 3);
  });

  it('should return null for zero spend', () => {
    const result = calculateROAS(5000, 0);
    expect(result).toBeNull(); // Critical: Prevents division by zero
  });

  it('should return 0 for zero revenue with positive spend', () => {
    const result = calculateROAS(0, 10000);
    expect(result).toBe(0); // ROAS = 0 (no return on investment)
  });

  it('should handle ROAS > 1 (profitable campaign)', () => {
    const result = calculateROAS(15000, 10000);
    expect(result).toBe(1.5); // 1.50 ruble return per ruble spent
  });

  it('should handle very small ROAS (<0.01)', () => {
    const result = calculateROAS(50, 10000);
    expect(result).toBeCloseTo(0.005, 3);
  });

  it('should handle negative revenue (edge case)', () => {
    // Edge case: Returns exceed sales attributed to ads
    const result = calculateROAS(-1000, 5000);
    expect(result).toBe(-0.2); // Negative ROAS
  });

  it('should handle both zero (undefined ROAS)', () => {
    const result = calculateROAS(0, 0);
    expect(result).toBeNull(); // Prevent 0/0 = NaN
  });
});

// ============================================================================
// Integration Tests (All Formulas Together)
// ============================================================================

describe('Integration: All formulas with mockProductGroup', () => {
  it('should calculate all aggregate metrics correctly', () => {
    const totalSales = calculateTotalSales(mockProductGroup);
    const revenue = calculateRevenue(mockProductGroup);
    const organicSales = calculateOrganicSales(totalSales, revenue);
    const organicContribution = calculateOrganicContribution(organicSales, totalSales);
    const spend = calculateSpend(mockProductGroup);
    const roas = calculateROAS(revenue, spend);

    // Verify all calculations match expected values
    expect(totalSales).toBe(35570);
    expect(revenue).toBe(10234);
    expect(organicSales).toBe(25336);
    expect(organicContribution).toBeCloseTo(71.229, 2);
    expect(spend).toBe(11337);
    expect(roas).toBeCloseTo(0.9027, 3);
  });

  it('should handle edge case: Zero spend group', () => {
    const zeroSpendGroup = mockProductGroup.map(p => ({ ...p, totalSpend: 0 }));

    const totalSales = calculateTotalSales(zeroSpendGroup);
    const revenue = calculateRevenue(zeroSpendGroup);
    const spend = calculateSpend(zeroSpendGroup);
    const roas = calculateROAS(revenue, spend);

    expect(totalSales).toBe(35570);
    expect(revenue).toBe(10234);
    expect(spend).toBe(0);
    expect(roas).toBeNull(); // CRITICAL: null ROAS for zero spend
  });

  it('should handle edge case: Single product group', () => {
    const singleProduct = [createMockProduct()];

    const totalSales = calculateTotalSales(singleProduct);
    const revenue = calculateRevenue(singleProduct);
    const organicSales = calculateOrganicSales(totalSales, revenue);
    const organicContribution = calculateOrganicContribution(organicSales, totalSales);

    expect(totalSales).toBe(10000);
    expect(revenue).toBe(3000);
    expect(organicSales).toBe(7000);
    expect(organicContribution).toBe(70); // 70% organic
  });
});

