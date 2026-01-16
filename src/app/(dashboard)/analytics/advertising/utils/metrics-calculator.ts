/**
 * Metrics Calculator Utilities - Epic 37 Story 37.3
 *
 * Calculation functions for aggregate metrics in merged product groups (склейки).
 * All formulas based on Epic 35 "Total Sales & Organic Split" specification.
 *
 * @see docs/epics/epic-35-total-sales-organic-split.md
 * @see frontend/docs/stories/epic-37/story-37.3-aggregate-metrics-display.BMAD.md
 */

/** Interface for product metrics (minimal required fields) */
export interface ProductMetrics {
  totalSales: number;
  totalRevenue: number;  // Revenue attributed to ads only
  organicSales?: number; // Optional: can be pre-calculated by backend or derived
  totalSpend: number;    // Ad spend in rubles
}

/**
 * Formula 1: Calculate total sales for a product group
 *
 * Total Sales = SUM of all revenue from all sources (organic + advertising)
 *
 * @param products - Array of product metrics
 * @returns Total sales across all products in group
 *
 * @example
 * // Example: ter-09 merged group (6 products)
 * const products = [
 *   { totalSales: 15000, totalRevenue: 4000, totalSpend: 6000 },
 *   { totalSales: 1489, totalRevenue: 400, totalSpend: 0 },
 *   // ... 4 more products
 * ];
 * calculateTotalSales(products); // Returns: 35570
 */
export function calculateTotalSales(products: ProductMetrics[]): number {
  return products.reduce((sum, product) => sum + product.totalSales, 0);
}

/**
 * Formula 2: Calculate advertising revenue for a product group
 *
 * Revenue = SUM of revenue attributed to advertising campaigns only
 *
 * @param products - Array of product metrics
 * @returns Total advertising revenue across all products
 *
 * @example
 * // Example: ter-09 merged group
 * calculateRevenue(products); // Returns: 10234
 */
export function calculateRevenue(products: ProductMetrics[]): number {
  return products.reduce((sum, product) => sum + product.totalRevenue, 0);
}

/**
 * Formula 3: Calculate organic sales for a product group
 *
 * Organic Sales = Total Sales - Advertising Revenue
 * OR if pre-calculated by backend: SUM of organicSales fields
 *
 * @param totalSales - Total sales from all sources
 * @param revenue - Revenue from advertising only
 * @returns Organic sales (non-advertising revenue)
 *
 * @example
 * // Example: ter-09 merged group
 * calculateOrganicSales(35570, 10234); // Returns: 25336
 */
export function calculateOrganicSales(totalSales: number, revenue: number): number {
  return totalSales - revenue;
}

/**
 * Alternative: Calculate organic sales from pre-calculated product fields
 *
 * Use this if backend provides `organicSales` on each product.
 *
 * @param products - Array of product metrics with organicSales field
 * @returns Sum of pre-calculated organic sales
 */
export function calculateOrganicSalesFromProducts(
  products: (ProductMetrics & { organicSales: number })[]
): number {
  return products.reduce((sum, product) => sum + product.organicSales, 0);
}

/**
 * Formula 4: Calculate organic contribution percentage
 *
 * Organic Contribution = (Organic Sales / Total Sales) × 100
 *
 * Edge Case: If totalSales = 0, returns 0 to avoid division by zero
 *
 * @param organicSales - Organic sales amount
 * @param totalSales - Total sales amount
 * @returns Percentage of sales from organic sources (0-100)
 *
 * @example
 * // Example: ter-09 merged group
 * calculateOrganicContribution(25336, 35570); // Returns: 71.24... (~71.2%)
 *
 * // Edge case: No sales
 * calculateOrganicContribution(0, 0); // Returns: 0
 */
export function calculateOrganicContribution(organicSales: number, totalSales: number): number {
  // Handle division by zero
  if (totalSales === 0) {
    return 0;
  }

  const contribution = (organicSales / totalSales) * 100;

  // Handle NaN (both zero case)
  return isNaN(contribution) ? 0 : contribution;
}

/**
 * Formula 5: Calculate total advertising spend for a product group
 *
 * Total Spend = SUM of all advertising spend across products
 *
 * Note: In merged groups, typically only the main product has spend > 0,
 * while child products have spend = 0.
 *
 * @param products - Array of product metrics
 * @returns Total advertising spend
 *
 * @example
 * // Example: ter-09 merged group (only main product has spend)
 * const products = [
 *   { totalSales: 15000, totalRevenue: 4000, totalSpend: 6000 },  // main
 *   { totalSales: 1489, totalRevenue: 400, totalSpend: 0 },       // child
 *   { totalSales: 8500, totalRevenue: 2300, totalSpend: 0 },      // child
 * ];
 * calculateSpend(products); // Returns: 6000
 */
export function calculateSpend(products: ProductMetrics[]): number {
  return products.reduce((sum, product) => sum + product.totalSpend, 0);
}

/**
 * Formula 6: Calculate ROAS (Return on Ad Spend)
 *
 * ROAS = Revenue / Spend
 *
 * Meaning: Revenue generated per 1₽ of advertising spend.
 *
 * Edge Cases:
 * - If spend = 0, returns null (display as "—")
 * - If revenue = 0 and spend > 0, returns 0.00
 *
 * @param revenue - Advertising revenue
 * @param spend - Advertising spend
 * @returns ROAS value or null if spend is zero
 *
 * @example
 * // Example: ter-09 merged group
 * calculateROAS(10234, 11337); // Returns: 0.9027... (~0.90)
 *
 * // Edge case: No spend
 * calculateROAS(5000, 0); // Returns: null (display as "—")
 *
 * // Edge case: No revenue but has spend
 * calculateROAS(0, 1000); // Returns: 0.00
 */
export function calculateROAS(revenue: number, spend: number): number | null {
  // Edge case: No spend → ROAS is undefined
  if (spend === 0) {
    return null;
  }

  // Normal case: ROAS = revenue / spend
  return revenue / spend;
}
