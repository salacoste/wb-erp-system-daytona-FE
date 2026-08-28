/**
 * MonitoringPageContent — Main container with tab navigation
 * Epic 68-FE (Story 68.1)
 * Pattern: OrderHistoryTabs — on-demand fetch per tab
 * UX Review: 4 tabs (Обзор, Карта активности, Восстановление, История)
 */

'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMonitoringDashboard } from '../hooks/use-monitoring-dashboard'
import type { MonitoringTab } from '../types/monitoring'
import { MonitoringEmptyState } from './MonitoringEmptyState'
import { HealthScoreWidget } from './HealthScoreWidget'
import { PipelineStatusGrid } from './PipelineStatusGrid'
import { DataCompletenessTable } from './DataCompletenessTable'
import { TelegramStatusCard } from './TelegramStatusCard'
import { PipelineHeatmap } from './PipelineHeatmap'
import { RecoveryPanel } from './RecoveryPanel'
import { HealthHistoryChart } from './HealthHistoryChart'

/** Underline-style tab — clear active state with primary accent */
const TAB_CLS = 'rounded-none bg-transparent px-4 py-2.5 text-sm shadow-none transition-colors'

function tabTriggerProps(isActive: boolean) {
  return {
    className: isActive
      ? `${TAB_CLS} font-semibold text-foreground`
      : `${TAB_CLS} font-medium text-muted-foreground hover:text-foreground`,
    style: {
      borderBottom: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
    },
  }
}

/** Check if cabinet has no data yet (new cabinet) */
function isNewCabinet(healthScore: number, pipelines: { status: string }[]): boolean {
  return healthScore === 0 && pipelines.every(p => p.status === 'no_data')
}

export function MonitoringPageContent() {
  const [activeTab, setActiveTab] = useState<MonitoringTab>('overview')
  const { data: dashboard, isLoading, isError, refetch } = useMonitoringDashboard()

  if (isLoading) {
    return <MonitoringPageSkeleton />
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16" role="alert">
        <p className="text-sm text-status-error">Не удалось загрузить данные мониторинга</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
          Повторить
        </Button>
      </div>
    )
  }

  // New cabinet with no data — show empty state
  if (dashboard && isNewCabinet(dashboard.system.healthScore, dashboard.pipelines)) {
    return <MonitoringEmptyState />
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={v => setActiveTab(v as MonitoringTab)}
      className="w-full"
    >
      <TabsList className="mb-6 grid w-full grid-cols-4 rounded-none border-b border-border bg-transparent p-0 h-auto">
        <TabsTrigger value="overview" {...tabTriggerProps(activeTab === 'overview')}>
          Обзор
        </TabsTrigger>
        <TabsTrigger value="heatmap" {...tabTriggerProps(activeTab === 'heatmap')}>
          Карта активности
        </TabsTrigger>
        <TabsTrigger value="recovery" {...tabTriggerProps(activeTab === 'recovery')}>
          Восстановление
        </TabsTrigger>
        <TabsTrigger value="history" {...tabTriggerProps(activeTab === 'history')}>
          История
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" role="tabpanel">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <HealthScoreWidget system={dashboard?.system} isLoading={isLoading} />
            <TelegramStatusCard telegram={dashboard?.telegram} isLoading={isLoading} />
          </div>
          <PipelineStatusGrid pipelines={dashboard?.pipelines} isLoading={isLoading} />
          <DataCompletenessTable data={dashboard?.dataCompleteness} isLoading={isLoading} />
        </div>
      </TabsContent>

      <TabsContent value="heatmap" role="tabpanel">
        <PipelineHeatmap enabled={activeTab === 'heatmap'} />
      </TabsContent>

      <TabsContent value="recovery" role="tabpanel">
        <RecoveryPanel enabled={activeTab === 'recovery'} />
      </TabsContent>

      <TabsContent value="history" role="tabpanel">
        <HealthHistoryChart enabled={activeTab === 'history'} />
      </TabsContent>
    </Tabs>
  )
}

function MonitoringPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
