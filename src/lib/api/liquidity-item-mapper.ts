/**
 * Liquidity Item-Level Mappers
 * Epic 7 - Liquidity Analysis (Ликвидность товаров)
 * Extracted from liquidity.ts (Epic 74, Story 74.5, Task 8)
 *
 * Maps backend item data to frontend LiquidityItem type.
 * Handles field name differences, defaults, and liquidation scenarios.
 */

import type {
  LiquidityItem,
  LiquidityCategory,
  LiquidationScenario,
  ActionType,
} from '@/types/liquidity'

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Derive recommendation text from liquidity status */
export function deriveRecommendation(status: string): string {
  switch (status) {
    case 'highly_liquid':
      return 'Высоколиквидный товар. Масштабируйте — инвестируйте больше.'
    case 'medium':
      return 'Средняя ликвидность. Поддерживайте текущий уровень запасов.'
    case 'low':
      return 'Низкая ликвидность. Рассмотрите сокращение закупок.'
    case 'illiquid':
      return 'Неликвид. Рекомендуется ликвидация со скидкой.'
    default:
      return 'Нет рекомендации'
  }
}

/** Derive action type from liquidity status */
export function deriveActionType(status: string): ActionType {
  switch (status) {
    case 'highly_liquid':
      return 'MAXIMIZE'
    case 'medium':
      return 'MAINTAIN'
    case 'low':
      return 'REDUCE'
    case 'illiquid':
      return 'LIQUIDATE'
    default:
      return 'MAINTAIN'
  }
}

/** Transform backend liquidation scenarios to frontend array format */
export function mapLiquidationScenarios(scenarios: any): LiquidationScenario[] | null {
  if (!scenarios) return null

  // Backend returns {full_price, discount_20pct, discount_50pct} objects
  // Frontend expects LiquidationScenario[] array
  if (Array.isArray(scenarios)) return scenarios

  const result: LiquidationScenario[] = []
  const entries: [string, any][] = Object.entries(scenarios)

  for (const [key, scenario] of entries) {
    if (!scenario || typeof scenario !== 'object') continue

    const s = scenario as Record<string, any>
    const discountPct =
      key === 'full_price' ? 0 : key === 'discount_20pct' ? 20 : key === 'discount_50pct' ? 50 : 0

    result.push({
      target_days: s.target_days ?? s.target_turnover_days ?? 30,
      required_velocity: s.required_velocity ?? s.required_daily_sales ?? 0,
      velocity_multiplier: s.velocity_multiplier ?? 1,
      suggested_discount_pct: s.suggested_discount_pct ?? discountPct,
      new_price: s.new_price ?? s.price_after_discount ?? 0,
      expected_revenue: s.expected_revenue ?? 0,
      expected_profit: s.expected_profit ?? 0,
      is_profitable: s.is_profitable ?? false,
    })
  }

  return result.length > 0 ? result : null
}

/** Map a single backend item to LiquidityItem */
export function mapItem(raw: Record<string, any>): LiquidityItem {
  const status = raw.liquidity_status ?? raw.liquidity_category ?? 'medium'
  const currentStock = raw.current_stock ?? raw.current_stock_qty ?? 0
  const avgDailySales = raw.avg_daily_sales ?? raw.velocity_per_day ?? 0
  const unitCost = raw.unit_cost ?? raw.cogs_per_unit ?? 0

  return {
    sku_id: String(raw.sku_id ?? raw.nm_id ?? ''),
    product_name: raw.product_name ?? raw.name ?? '',
    category: raw.category ?? '',
    brand: raw.brand ?? '',
    current_stock_qty: currentStock,
    avg_stock_qty_30d: raw.avg_stock_qty_30d ?? currentStock,
    stock_value: raw.frozen_capital ?? raw.stock_value ?? currentStock * unitCost,
    units_sold_30d: raw.units_sold_30d ?? Math.round(avgDailySales * 30),
    velocity_per_day: avgDailySales,
    turnover_days: raw.turnover_days ?? 0,
    liquidity_category: status as LiquidityCategory,
    current_price: raw.current_price ?? 0,
    cogs_per_unit: unitCost,
    recommendation: raw.recommendation ?? deriveRecommendation(status),
    action_type: raw.action_type ?? deriveActionType(status),
    liquidation_scenarios: mapLiquidationScenarios(raw.liquidation_scenarios),
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */
