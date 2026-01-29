/**
 * Order History Tabs Component
 * Story 40.4-FE: Order Details Modal
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Tabbed navigation for order history views with on-demand data fetching.
 * Three tabs: Full History, WB History, Local History
 */

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getFullHistory, getWbHistory, getOrderHistory, ordersQueryKeys } from '@/lib/api/orders'
import { FullHistoryTab } from './FullHistoryTab'
import { WbHistoryTab } from './WbHistoryTab'
import { LocalHistoryTab } from './LocalHistoryTab'

export interface OrderHistoryTabsProps {
  orderId: string
}

/** Cache configuration for history queries */
const HISTORY_CACHE_CONFIG = {
  staleTime: 30_000,
  gcTime: 300_000,
  refetchOnWindowFocus: false,
  retry: 1,
}

type TabValue = 'full' | 'wb' | 'local'

/**
 * Order History Tabs - on-demand fetching per tab
 * Default tab: "Полная история" (full)
 */
export function OrderHistoryTabs({ orderId }: OrderHistoryTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('full')

  // Full history query - enabled when tab is active
  const fullHistory = useQuery({
    queryKey: ordersQueryKeys.fullHistory(orderId),
    queryFn: () => getFullHistory(orderId),
    enabled: activeTab === 'full',
    ...HISTORY_CACHE_CONFIG,
  })

  // WB history query - enabled when tab is active
  const wbHistory = useQuery({
    queryKey: ordersQueryKeys.wbHistory(orderId),
    queryFn: () => getWbHistory(orderId),
    enabled: activeTab === 'wb',
    ...HISTORY_CACHE_CONFIG,
  })

  // Local history query - enabled when tab is active
  const localHistory = useQuery({
    queryKey: ordersQueryKeys.history(orderId),
    queryFn: () => getOrderHistory(orderId),
    enabled: activeTab === 'local',
    ...HISTORY_CACHE_CONFIG,
  })

  return (
    <Tabs
      value={activeTab}
      onValueChange={value => setActiveTab(value as TabValue)}
      className="w-full"
    >
      <TabsList className="w-full grid grid-cols-3 mb-4">
        <TabsTrigger value="full">Полная история</TabsTrigger>
        <TabsTrigger value="wb">WB История</TabsTrigger>
        <TabsTrigger value="local">Локальная</TabsTrigger>
      </TabsList>

      <TabsContent value="full" role="tabpanel" aria-labelledby="full-tab">
        <FullHistoryTab
          data={fullHistory.data}
          isLoading={fullHistory.isLoading}
          isError={fullHistory.isError}
          refetch={fullHistory.refetch}
        />
      </TabsContent>

      <TabsContent value="wb" role="tabpanel" aria-labelledby="wb-tab">
        <WbHistoryTab
          data={wbHistory.data}
          isLoading={wbHistory.isLoading}
          isError={wbHistory.isError}
          refetch={wbHistory.refetch}
        />
      </TabsContent>

      <TabsContent value="local" role="tabpanel" aria-labelledby="local-tab">
        <LocalHistoryTab
          data={localHistory.data}
          isLoading={localHistory.isLoading}
          isError={localHistory.isError}
          refetch={localHistory.refetch}
        />
      </TabsContent>
    </Tabs>
  )
}
