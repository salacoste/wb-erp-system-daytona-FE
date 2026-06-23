'use client'

/**
 * Alerts Dashboard Page
 * Central hub for alert rules management, history, and summary KPIs
 */

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertsPageHeader } from './components/AlertsPageHeader'
import { AlertRulesList } from './components/AlertRulesList'
import { AlertHistoryTable } from './components/AlertHistoryTable'
import { AlertSummaryCards } from './components/AlertSummaryCards'
import { CreateAlertRuleDialog } from './components/CreateAlertRuleDialog'
import { EditAlertRuleDialog } from './components/EditAlertRuleDialog'
import { useAlertsPageState } from './components/useAlertsPageState'
import { canManageOperationalData } from '@/lib/role-permissions'
import { useAuthStore } from '@/stores/authStore'
import type { AlertRule } from '@/types/alerts'

export default function AlertsPage() {
  const { activeTab, setActiveTab, historyParams, updateHistoryParams, rules, history, summary } =
    useAlertsPageState()
  const userRole = useAuthStore(state => state.user?.role)
  const canManageAlerts = canManageOperationalData(userRole)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null)

  return (
    <div className="space-y-6">
      <AlertsPageHeader
        onCreateRule={() => setCreateDialogOpen(true)}
        canCreateRule={canManageAlerts}
      />

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
          <AlertRulesList
            rules={rules.data}
            isLoading={rules.isLoading}
            onEdit={setEditingRule}
            canManageRules={canManageAlerts}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <AlertHistoryTable
            items={history.data}
            isLoading={history.isLoading}
            historyParams={historyParams}
            onFilterChange={updateHistoryParams}
          />
        </TabsContent>
      </Tabs>

      {canManageAlerts && (
        <>
          <CreateAlertRuleDialog isOpen={createDialogOpen} onOpenChange={setCreateDialogOpen} />
          <EditAlertRuleDialog
            isOpen={editingRule !== null}
            onOpenChange={open => {
              if (!open) setEditingRule(null)
            }}
            rule={editingRule}
          />
        </>
      )}
    </div>
  )
}
