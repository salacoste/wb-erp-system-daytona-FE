'use client'

/**
 * Alerts page state hook
 * Manages active tab, history params, and wires TanStack Query hooks
 */

import { useState, useCallback } from 'react'
import { useAlertRules, useAlertHistory, useAlertSummary } from '@/hooks/useAlerts'
import type { AlertHistoryParams } from '@/types/alerts'

export type AlertsTab = 'rules' | 'history' | 'summary'

export function useAlertsPageState() {
  const [activeTab, setActiveTab] = useState<AlertsTab>('summary')
  const [historyParams, setHistoryParams] = useState<AlertHistoryParams>({ limit: 50 })

  const rules = useAlertRules()
  const history = useAlertHistory(historyParams)
  const summary = useAlertSummary(7)

  const updateHistoryParams = useCallback((patch: Partial<AlertHistoryParams>) => {
    setHistoryParams(prev => ({ ...prev, ...patch }))
  }, [])

  return {
    activeTab,
    setActiveTab,
    historyParams,
    updateHistoryParams,
    rules,
    history,
    summary,
  }
}
