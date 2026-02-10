/**
 * Hook for fetching expense breakdown data
 * Story 3.3: Expense Breakdown Visualization
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { FinanceSummary } from './useDashboard'

export interface ExpenseItem {
  category: string
  amount: number
  percentage?: number
}

export interface ExpenseBreakdown {
  expenses: ExpenseItem[]
  total: number
}

/**
 * Hook to get expense breakdown from finance summary
 * Extracts expense categories from FinanceSummary for visualization
 *
 * @param weekOverride - Optional week to fetch (YYYY-Www format). If not provided, fetches latest week.
 */
export function useExpenses(weekOverride?: string) {
  return useQuery({
    queryKey: ['dashboard', 'expenses', weekOverride],
    queryFn: async (): Promise<ExpenseBreakdown> => {
      try {
        // Always check available weeks first to avoid 404 on incomplete/future weeks
        const weeksResponse = await apiClient.get<
          | Array<{ week: string; start_date: string }>
          | { data: Array<{ week: string; start_date: string }> }
        >('/v1/analytics/weekly/available-weeks')

        const weeksArray = Array.isArray(weeksResponse) ? weeksResponse : weeksResponse?.data || []
        const weeks = weeksArray.map(w => w.week)

        // Story 2.7: Empty array = no aggregated data yet (normal state, not an error)
        if (!weeks || weeks.length === 0) {
          console.info(
            '[Expenses] No available weeks found. Financial data may not be processed yet.'
          )
          return { expenses: [], total: 0 }
        }

        let targetWeek = weekOverride

        // If weekOverride is not in available weeks, skip API call (e.g., current incomplete week)
        if (targetWeek && !weeks.includes(targetWeek)) {
          console.info(
            `[Expenses] Week ${targetWeek} not in available weeks, skipping (incomplete or future week)`
          )
          return { expenses: [], total: 0 }
        }

        // If no week override, use latest available
        if (!targetWeek) {
          targetWeek = weeks[0]
        }

        console.info(`[Expenses] Fetching finance summary for week: ${targetWeek}`)

        // Story 2.7: Guarantee - if week is in available-weeks list, data is available
        // API returns { summary_total: {...}, summary_rus: {...}, summary_eaeu: {...}, meta: {...} }
        // We need summary_total for expenses
        const summaryResponse = await apiClient.get<{
          summary_total: FinanceSummary | null
          summary_rus: FinanceSummary | null
          summary_eaeu: FinanceSummary | null
          meta: { week: string; cabinet_id: string; generated_at: string; timezone: string }
        }>(`/v1/analytics/weekly/finance-summary?week=${targetWeek}`)

        // Use summary_total (consolidated) or fallback to summary_rus if total not available
        const summary = summaryResponse.summary_total || summaryResponse.summary_rus

        if (!summary) {
          // Story 2.7: This should NOT happen if week is in available-weeks list
          // If it does, it's a bug - log it for monitoring
          console.error('[Expenses] CRITICAL: No summary data for week', {
            week: targetWeek,
            weekOverride,
            summaryResponse,
          })
          return { expenses: [], total: 0 }
        }

        // Extract expense categories from FinanceSummary
        // Support both _total suffix (from summary_total) and legacy format (from summary_rus/eaeu)
        // Story 3.3 Enhancement: Display all expense categories from SDK → DB mapping
        //
        // 2025-12-13: Fixed expense display to match PnLWaterfall/Dashboard structure:
        // - ADDED: "Комиссия WB" (total_commission_rub) - main implicit commission (retail - gross)
        // - REMOVED: "Комиссия продаж" (commission_sales) - it's a SUBSET already in total_commission_rub
        // - RENAMED: "Прочие комиссии WB" → "Корректировка ВВ" (wb_commission_adj) - WB Dashboard label
        //
        // Request #56 (2025-12-13): WB Services Breakdown
        // - WB services (Продвижение, Джем) INCLUDED in other_adjustments_net
        // - New fields provide VISIBILITY into what's hidden there
        // - We show breakdown instead of aggregate "Прочие корректировки"
        //
        // See: docs/WB-DASHBOARD-METRICS.md, PnLWaterfall.tsx, docs/request-backend/56-wb-services-breakdown.md

        // Request #56: Calculate WB services total and remaining other adjustments
        const wbServicesTotal = summary.wb_services_cost_total ?? summary.wb_services_cost ?? 0
        const otherAdjustmentsTotal =
          summary.other_adjustments_net_total ?? summary.other_adjustments_net ?? 0
        // Remaining = other_adjustments_net minus WB services (should be ~0 if WB services = all adjustments)
        const otherAdjustmentsRemaining = Math.max(0, otherAdjustmentsTotal - wbServicesTotal)

        const expenses: ExpenseItem[] = [
          {
            // Main WB commission = retail_price - gross (WB Dashboard "Комиссия")
            // This is the IMPLICIT commission WB takes from each sale
            category: 'Комиссия WB',
            amount: summary.total_commission_rub_total ?? summary.total_commission_rub ?? 0,
          },
          {
            category: 'Логистика',
            amount: summary.logistics_cost_total ?? summary.logistics_cost ?? 0,
          },
          {
            category: 'Хранение',
            amount: summary.storage_cost_total ?? summary.storage_cost ?? 0,
          },
          {
            category: 'Платная приёмка',
            amount: summary.paid_acceptance_cost_total ?? summary.paid_acceptance_cost ?? 0,
          },
          {
            category: 'Штрафы',
            amount: summary.penalties_total ?? 0,
          },
          {
            // "Корректировка ВВ" - WB Dashboard label for commission adjustments
            // Source: commission_other WHERE reason='Удержание'
            // NOT the full commission_other (that would double-count with total_commission_rub)
            category: 'Корректировка ВВ',
            amount: summary.wb_commission_adj_total ?? summary.wb_commission_adj ?? 0,
          },
          // Request #56: WB Services Breakdown (from other_adjustments_net)
          {
            // WB.Продвижение - advertising costs
            category: 'WB.Продвижение',
            amount: summary.wb_promotion_cost_total ?? summary.wb_promotion_cost ?? 0,
          },
          {
            // Джем - subscription service
            category: 'Джем',
            amount: summary.wb_jam_cost_total ?? summary.wb_jam_cost ?? 0,
          },
          {
            // Прочие сервисы WB (утилизация, etc.)
            category: 'Прочие сервисы WB',
            amount: summary.wb_other_services_cost_total ?? summary.wb_other_services_cost ?? 0,
          },
          {
            // Remaining other adjustments (after WB services)
            // This catches any other deductions not categorized as WB services
            category: 'Прочие корректировки',
            amount: otherAdjustmentsRemaining,
          },
          {
            category: 'Комиссия лояльности',
            amount: summary.loyalty_fee_total ?? summary.loyalty_fee ?? 0,
          },
          {
            category: 'Удержание баллов',
            amount: summary.loyalty_points_withheld_total ?? summary.loyalty_points_withheld ?? 0,
          },
          {
            category: 'Эквайринг',
            amount: summary.acquiring_fee_total ?? summary.acquiring_fee ?? 0,
          },
          // NOTE: "Комиссия продаж" (commission_sales) REMOVED - it's a SUBSET of total_commission_rub
          // Showing both would cause confusion as users would think they pay commission twice
        ]
          .filter(expense => expense.amount > 0) // Request #56: Filter out zero-value categories
          .sort((a, b) => {
            // Non-zero values first, then zero values
            if (a.amount > 0 && b.amount === 0) return -1
            if (a.amount === 0 && b.amount > 0) return 1
            // Within same group (both zero or both non-zero), sort by amount descending
            return b.amount - a.amount
          })

        // Calculate total and percentages
        const total = expenses.reduce((sum, item) => sum + item.amount, 0)

        const expensesWithPercentage: ExpenseItem[] = expenses.map(item => ({
          ...item,
          percentage: total > 0 ? (item.amount / total) * 100 : 0,
        }))

        console.info(`[Expenses] Found ${expenses.length} expense categories with total: ${total}`)

        return {
          expenses: expensesWithPercentage,
          total,
        }
      } catch (error) {
        // Story 2.7: 404 for week from available-weeks list should NOT happen
        // If it does, it's a bug - log it for monitoring
        if (error instanceof Error && 'response' in error) {
          const httpError = error as { response?: { status?: number } }
          if (httpError.response?.status === 404) {
            // Try to get available weeks for debugging (non-blocking)
            apiClient
              .get('/v1/analytics/weekly/available-weeks')
              .then((r: unknown) => {
                console.error('[Expenses] CRITICAL: 404 for week from available-weeks list', {
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

        console.warn('[Expenses] Expense data not available:', error)
        if (error instanceof Error) {
          console.warn('[Expenses] Error details:', {
            message: error.message,
            name: error.name,
          })
        }
        return { expenses: [], total: 0 }
      }
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
  })
}
