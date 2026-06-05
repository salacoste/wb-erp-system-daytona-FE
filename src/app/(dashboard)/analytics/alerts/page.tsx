'use client'

/**
 * Alerts Dashboard Page
 * Central hub for alert rules management, history, and summary KPIs
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertsPageHeader } from './components/AlertsPageHeader'
import { AlertRulesList } from './components/AlertRulesList'
import { AlertHistoryTable } from './components/AlertHistoryTable'
import { AlertSummaryCards } from './components/AlertSummaryCards'
import { useAlertsPageState } from './components/useAlertsPageState'

export default function AlertsPage() {
  const { activeTab, setActiveTab, rules, history, summary } = useAlertsPageState()

  return (
    <div className="space-y-6">
      <AlertsPageHeader />

      <Tabs
        value={activeTab}
        onValueChange={v => setActiveTab(v as 'rules' | 'history' | 'summary')}
      >
        <TabsList>
          <TabsTrigger value="summary">Обзор</TabsTrigger>
          <TabsTrigger value="rules">Активные правила</TabsTrigger>
          <TabsTrigger value="history">История</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          <AlertSummaryCards summary={summary.data} isLoading={summary.isLoading} />
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <AlertRulesList rules={rules.data} isLoading={rules.isLoading} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <AlertHistoryTable items={history.data} isLoading={history.isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
