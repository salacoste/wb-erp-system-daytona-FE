/**
 * Hooks for dashboard data fetching
 * Story 2.4: Initial Data Display After Processing
 * Reusable for Story 3.2: Key Metric Cards Display
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface FinanceSummary {
  week: string
  // Request #41: Separate sales and returns tracking
  sales_gross_total?: number // Только продажи (doc_type=sale) - from summary_total
  sales_gross?: number // Только продажи - from summary_rus/eaeu
  returns_gross_total?: number // Только возвраты (doc_type=return) - from summary_total
  returns_gross?: number // Только возвраты - from summary_rus/eaeu
  sale_gross_total?: number // NET = sales - returns - from summary_total
  sale_gross?: number // NET = sales - returns - from summary_rus/eaeu (legacy)
  to_pay_goods_total?: number // К перечислению за товар - from summary_total
  to_pay_goods?: number // К перечислению за товар - from summary_rus/eaeu (legacy)
  // Story 25.3: WB Commission - retail_price - gross (implicit commission WB charges)
  total_commission_rub_total?: number // Комиссия WB - from summary_total
  total_commission_rub?: number // Комиссия WB - from summary_rus/eaeu (legacy)
  payout_total: number // Итого к оплате
  logistics_cost_total?: number // Логистика - from summary_total
  logistics_cost?: number // Логистика - from summary_rus/eaeu (legacy)
  storage_cost_total?: number // Хранение - from summary_total
  storage_cost?: number // Хранение - from summary_rus/eaeu (legacy)
  paid_acceptance_cost_total?: number // Платная приёмка - from summary_total
  paid_acceptance_cost?: number // Платная приёмка - from summary_rus/eaeu (legacy)
  penalties_total: number // Штрафы
  wb_commission_adj_total?: number // Корректировка комиссии WB - from summary_total
  wb_commission_adj?: number // Корректировка комиссии WB - from summary_rus/eaeu (legacy)
  loyalty_fee_total?: number // Комиссия лояльности - from summary_total
  loyalty_fee?: number // Комиссия лояльности - from summary_rus/eaeu (legacy)
  loyalty_points_withheld_total?: number // Удержание баллов лояльности - from summary_total
  loyalty_points_withheld?: number // Удержание баллов лояльности - from summary_rus/eaeu (legacy)
  loyalty_compensation_total?: number // Компенсация лояльности - from summary_total
  loyalty_compensation?: number // Компенсация лояльности - from summary_rus/eaeu (legacy)
  acquiring_fee_total?: number // Эквайринг - from summary_total
  acquiring_fee?: number // Эквайринг - from summary_rus/eaeu (legacy)
  commission_sales_total?: number // Комиссия продаж - from summary_total
  commission_sales?: number // Комиссия продаж - from summary_rus/eaeu (legacy)
  other_adjustments_net_total?: number // Прочие корректировки - from summary_total
  other_adjustments_net?: number // Прочие корректировки - from summary_rus/eaeu (legacy)
  seller_delivery_revenue_total?: number // Выручка доставки продавца - from summary_total
  seller_delivery_revenue?: number // Выручка доставки продавца - from summary_rus/eaeu (legacy)

  // Request #56: WB Services Breakdown (hidden in other_adjustments_net)
  // Source: corrections WHERE reason='Удержание' + bonus_type_name pattern matching
  wb_services_cost_total?: number // Итого WB сервисы - from summary_total
  wb_services_cost?: number // Итого WB сервисы - from summary_rus/eaeu
  wb_promotion_cost_total?: number // WB.Продвижение - from summary_total
  wb_promotion_cost?: number // WB.Продвижение - from summary_rus/eaeu
  wb_jam_cost_total?: number // Джем подписка - from summary_total
  wb_jam_cost?: number // Джем подписка - from summary_rus/eaeu
  wb_other_services_cost_total?: number // Прочие сервисы WB (утилизация) - from summary_total
  wb_other_services_cost?: number // Прочие сервисы WB - from summary_rus/eaeu

  // Request #57: WB Dashboard Exact Match Fields
  // These fields match WB Dashboard "Продажа" and "Возврат" exactly (gross = after commission)
  wb_sales_gross_total?: number // WB "Продажа" - from summary_total (RUS + EAEU)
  wb_sales_gross?: number // WB "Продажа" - from summary_rus/eaeu
  wb_returns_gross_total?: number // WB "Возврат" - from summary_total (RUS + EAEU)
  wb_returns_gross?: number // WB "Возврат" - from summary_rus/eaeu

  // Request #58: Retail Price Total (YOUR prices before WB discounts)
  // Source: SUM(retail_price × qty) for sales
  retail_price_total?: number // from summary_rus/eaeu
  retail_price_total_total?: number // from summary_total (RUS + EAEU combined)

  // Request #44 / Story 25.2: COGS Section - from weekly_margin_fact aggregation
  cogs_total?: number | null // Себестоимость - SUM(cogs_rub)
  cogs_coverage_pct?: number | null // Покрытие COGS (% товаров с себестоимостью)
  products_with_cogs?: number | null // Количество товаров с COGS
  products_total?: number | null // Всего товаров за период
  gross_profit?: number | null // Чистая прибыль (только при coverage = 100%)
}

export interface DashboardMetrics {
  totalPayable?: number // К перечислению за товар
  revenue?: number // Вайлдберриз реализовал Товар
  totalProducts?: number
  // Additional metrics can be added here
}

/**
 * Hook to get dashboard metrics
 * Used for initial data summary and main dashboard
 */
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async (): Promise<DashboardMetrics> => {
      // Try to get finance summary for latest week
      // If not available, return empty metrics
      try {
        // Get available weeks first
        // API returns { data: WeekDataDto[] } where WeekDataDto = { week: string, start_date: string }
        // Note: apiClient extracts data.data, so if backend returns { data: [...] }, apiClient returns array directly
        const weeksResponse = await apiClient.get<Array<{ week: string; start_date: string }> | { data: Array<{ week: string; start_date: string }> }>('/v1/analytics/weekly/available-weeks')
        
        // Extract week strings from response (handle both array and object formats)
        const weeksArray = Array.isArray(weeksResponse) 
          ? weeksResponse 
          : weeksResponse?.data || []
        const weeks = weeksArray.map((w) => w.week)
        
        // Story 2.7: Empty array = no aggregated data yet (normal state, not an error)
        if (!weeks || weeks.length === 0) {
          console.info('[Dashboard Metrics] No available weeks found. Financial data may not be processed yet. This is normal - data will appear after aggregation completes.')
          return {}
        }
        
        const latestWeek = weeks[0]
        console.info(`[Dashboard Metrics] Fetching finance summary for week: ${latestWeek}`)
        
        // Story 2.7: Guarantee - if week is in available-weeks list, data is available
        // API returns { summary_total: {...}, summary_rus: {...}, summary_eaeu: {...}, meta: {...} }
        // We need summary_total for dashboard metrics
        const summaryResponse = await apiClient.get<{
          summary_total: FinanceSummary | null
          summary_rus: FinanceSummary | null
          summary_eaeu: FinanceSummary | null
          meta: { week: string; cabinet_id: string; generated_at: string; timezone: string }
        }>(`/v1/analytics/weekly/finance-summary?week=${latestWeek}`)
        
        // Use summary_total (consolidated) or fallback to summary_rus if total not available
        const summary = summaryResponse.summary_total || summaryResponse.summary_rus
        
        if (!summary) {
          // Story 2.7: This should NOT happen if week is in available-weeks list
          // If it does, it's a bug - log it for monitoring
          console.error('[Dashboard Metrics] CRITICAL: No summary data for week from available-weeks list', {
            week: latestWeek,
            availableWeeks: weeks,
            summaryResponse,
          })
          return {}
        }
        
        // Debug: Log full summary structure to understand what fields are available
        console.info('[Dashboard Metrics] Finance summary received:', {
          summary_type: summaryResponse.summary_total ? 'summary_total' : 'summary_rus',
          summary_keys: Object.keys(summary),
          to_pay_goods_total: summary.to_pay_goods_total,
          to_pay_goods: summary.to_pay_goods,
          sale_gross_total: summary.sale_gross_total,
          sale_gross: summary.sale_gross,
          full_summary: summary, // Full object for debugging
        })
        
        const totalPayable = summary.to_pay_goods_total ?? summary.to_pay_goods
        const revenue = summary.sale_gross_total ?? summary.sale_gross
        
        // Log final values that will be returned
        console.info('[Dashboard Metrics] Final values extracted:', {
          totalPayable,
          revenue,
          source_to_pay_goods_total: summary.to_pay_goods_total,
          source_to_pay_goods: summary.to_pay_goods,
          source_sale_gross_total: summary.sale_gross_total,
          source_sale_gross: summary.sale_gross,
        })
        
        // Log if values are still undefined after fallback
        if (totalPayable === undefined || totalPayable === null) {
          console.warn('[Dashboard Metrics] totalPayable is undefined/null after fallback', {
            to_pay_goods_total: summary.to_pay_goods_total,
            to_pay_goods: summary.to_pay_goods,
            available_fields: Object.keys(summary),
          })
        }
        
        if (revenue === undefined || revenue === null) {
          console.warn('[Dashboard Metrics] revenue is undefined/null after fallback', {
            sale_gross_total: summary.sale_gross_total,
            sale_gross: summary.sale_gross,
            available_fields: Object.keys(summary),
          })
        }
        
        return {
          totalPayable,
          revenue,
        }
      } catch (error) {
        // Story 2.7: 404 for week from available-weeks list should NOT happen
        // If it does, it's a bug - log it for monitoring
        if (error instanceof Error && 'response' in error) {
          const httpError = error as { response?: { status?: number } }
          if (httpError.response?.status === 404) {
            // Try to get available weeks for debugging (non-blocking)
            apiClient.get('/v1/analytics/weekly/available-weeks')
              .then((r: unknown) => {
                console.error('[Dashboard Metrics] CRITICAL: 404 for week from available-weeks list', {
                  error: error.message,
                  availableWeeks: r,
                })
                // TODO: Send to error monitoring system (e.g., Sentry)
              })
              .catch(() => {
                // Ignore errors when fetching available weeks for debugging
              })
          }
        }
        
        // If finance summary is not available, return empty metrics
        console.warn('[Dashboard Metrics] Finance summary not available:', error)
        if (error instanceof Error) {
          console.warn('[Dashboard Metrics] Error details:', {
            message: error.message,
            name: error.name,
          })
        }
      }
      
      return {}
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus for real-time feel
    retry: 1, // Retry once on error
  })
}

