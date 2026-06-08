'use client'

/**
 * Financial Summary View (Analytics Hub)
 * Story 3.5: Financial Summary View
 * Updated: 2025-12-13 - Improved navigation UX
 *
 * Features:
 * - Quick navigation to all analytics pages (top of page)
 * - Week selector with available weeks
 * - Complete financial summary (all metrics)
 * - Period comparison (two weeks side-by-side)
 * - Responsive design with accessibility
 */

import { Card, CardContent } from '@/components/ui/card'
import { RequireWbToken } from '@/components/custom/RequireWbToken'
import { NavigationSection, analyticsNavigation } from './components/AnalyticsNavigation'
import { AnalyticsWeekSelector } from './components/AnalyticsWeekSelector'
import { useAnalyticsPageState } from './components/useAnalyticsPageState'
import { AnalyticsPageHeader } from './components/AnalyticsPageHeader'
import { AnalyticsSummaryContent } from './components/AnalyticsSummaryContent'
import { AnalyticsMarketingWidgets } from './components/AnalyticsMarketingWidgets'

export default function AnalyticsSummaryPage() {
  const {
    viewMode,
    selectedWeek,
    selectedWeeks,
    comparisonWeek,
    setSelectedWeek,
    setSelectedWeeks,
    setComparisonWeek,
    isLoading,
    isError,
    error,
    primarySummary,
    secondarySummary,
    handleRetry,
    cycleViewMode,
  } = useAnalyticsPageState()

  return (
    <RequireWbToken>
      <div className="space-y-6">
        <AnalyticsPageHeader
          viewMode={viewMode}
          weekCount={selectedWeeks.length}
          onCycleViewMode={cycleViewMode}
        />

        {/* Quick Navigation - UX: Primary action area at top */}
        <Card className="border-none shadow-none bg-gray-50/50">
          <CardContent className="p-4">
            <div className="grid gap-6 lg:grid-cols-4">
              <NavigationSection {...analyticsNavigation.financial} />
              <NavigationSection {...analyticsNavigation.operational} />
              <NavigationSection {...analyticsNavigation.marketing} />
              <NavigationSection {...analyticsNavigation.strategic} />
            </div>
          </CardContent>
        </Card>

        <AnalyticsMarketingWidgets selectedWeek={selectedWeek} />

        {/* Divider with title */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-muted-foreground font-medium">
              Финансовая сводка за период
            </span>
          </div>
        </div>

        <AnalyticsWeekSelector
          viewMode={viewMode}
          selectedWeek={selectedWeek}
          selectedWeeks={selectedWeeks}
          comparisonWeek={comparisonWeek}
          onSelectedWeekChange={setSelectedWeek}
          onSelectedWeeksChange={setSelectedWeeks}
          onComparisonWeekChange={setComparisonWeek}
        />

        <AnalyticsSummaryContent
          viewMode={viewMode}
          selectedWeek={selectedWeek}
          isLoading={isLoading}
          isError={isError}
          error={error}
          primarySummary={primarySummary}
          secondarySummary={secondarySummary}
          onRetry={handleRetry}
        />
      </div>
    </RequireWbToken>
  )
}
