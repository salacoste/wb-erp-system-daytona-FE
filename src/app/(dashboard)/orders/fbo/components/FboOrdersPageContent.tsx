/**
 * FBO Orders Page Content — Client Component
 *
 * Main page with tabs (Orders / Sales), sync controls, and date filters.
 * Russian locale for all labels.
 */

'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FboOrdersTable } from './FboOrdersTable'
import { FboSalesTable } from './FboSalesTable'
import { FboSyncControls } from './FboSyncControls'
import { FboAggregateCards } from './FboAggregateCards'
import { FboSalesAggregateCards } from './FboSalesAggregateCards'
import { useOrdersFbo, useOrdersFboAggregate } from '@/hooks/useOrdersFbo'
import { useSalesFbo, useSalesFboAggregate as useSalesAgg } from '@/hooks/useSalesFbo'
import { canManageOperationalData } from '@/lib/role-permissions'
import { useAuthStore } from '@/stores/authStore'

const DEFAULT_FROM = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
const DEFAULT_TO = new Date().toISOString().slice(0, 10)
const PAGE_SIZE = 20

export function FboOrdersPageContent() {
  const [tab, setTab] = useState<'orders' | 'sales'>('orders')
  const [from, setFrom] = useState(DEFAULT_FROM)
  const [to, setTo] = useState(DEFAULT_TO)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const userRole = useAuthStore(state => state.user?.role)
  const canSyncFboOrders = canManageOperationalData(userRole)

  const offset = (page - 1) * PAGE_SIZE
  const listParams = {
    from,
    to,
    nm_id: search ? parseInt(search, 10) : undefined,
    limit: PAGE_SIZE,
    offset,
  }

  // Orders queries
  const ordersQuery = useOrdersFbo(listParams)
  const ordersAggQuery = useOrdersFboAggregate({ from, to })

  // Sales queries
  const salesQuery = useSalesFbo(listParams)
  const salesAggQuery = useSalesAgg({ from, to })

  function handleFromChange(v: string) {
    setFrom(v)
    setPage(1)
  }

  function handleToChange(v: string) {
    setTo(v)
    setPage(1)
  }

  function handleSearch(v: string) {
    setSearch(v)
    setPage(1)
  }

  return (
    <div className="space-y-6" data-testid="fbo-orders-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">FBO Заказы и продажи</h1>
        <FboSyncControls canSync={canSyncFboOrders} />
      </div>

      {/* Date Filters */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <label className="flex items-center gap-2 text-sm">
            <span>С:</span>
            <input
              type="date"
              value={from}
              onChange={e => handleFromChange(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
              data-testid="fbo-date-from"
              aria-label="Дата начала"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span>По:</span>
            <input
              type="date"
              value={to}
              onChange={e => handleToChange(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
              data-testid="fbo-date-to"
              aria-label="Дата окончания"
            />
          </label>
          <input
            type="text"
            placeholder="Артикул (nmId)"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="max-w-[160px] rounded border px-2 py-1 text-sm"
            data-testid="fbo-search"
            aria-label="Поиск по артикулу"
          />
        </CardContent>
      </Card>

      {/* Aggregate Stats */}
      {tab === 'orders' && ordersAggQuery.data && (
        <FboAggregateCards
          count={ordersAggQuery.data.count}
          totalPrice={ordersAggQuery.data.totalPrice}
          totalFinishedPrice={ordersAggQuery.data.totalFinishedPrice}
          cancelledCount={ordersAggQuery.data.cancelledCount}
          cancelRate={ordersAggQuery.data.cancelRate}
        />
      )}
      {tab === 'sales' && salesAggQuery.data && (
        <FboSalesAggregateCards data={salesAggQuery.data} />
      )}

      {/* Tabs: Orders / Sales */}
      <Tabs value={tab} onValueChange={v => setTab(v as 'orders' | 'sales')}>
        <TabsList>
          <TabsTrigger value="orders">Заказы</TabsTrigger>
          <TabsTrigger value="sales">Продажи</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          {ordersQuery.isError && (
            <FboListError
              message={
                ordersQuery.data
                  ? 'Не удалось обновить заказы FBO. Показаны ранее загруженные данные.'
                  : 'Не удалось загрузить заказы FBO.'
              }
              onRetry={() => ordersQuery.refetch()}
            />
          )}
          {(!ordersQuery.isError || ordersQuery.data) && (
            <FboOrdersTable
              orders={ordersQuery.data?.items ?? []}
              isLoading={ordersQuery.isLoading && !ordersQuery.data}
              page={page}
              totalPages={Math.ceil((ordersQuery.data?.pagination.total ?? 0) / PAGE_SIZE)}
              totalCount={ordersQuery.data?.pagination.total ?? 0}
              onPageChange={setPage}
              captionText="Заказы FBO Wildberries"
            />
          )}
        </TabsContent>

        <TabsContent value="sales">
          {salesQuery.isError && (
            <FboListError
              message={
                salesQuery.data
                  ? 'Не удалось обновить продажи FBO. Показаны ранее загруженные данные.'
                  : 'Не удалось загрузить продажи FBO.'
              }
              onRetry={() => salesQuery.refetch()}
            />
          )}
          {(!salesQuery.isError || salesQuery.data) && (
            <FboSalesTable
              sales={salesQuery.data?.items ?? []}
              isLoading={salesQuery.isLoading && !salesQuery.data}
              page={page}
              totalPages={Math.ceil((salesQuery.data?.pagination.total ?? 0) / PAGE_SIZE)}
              totalCount={salesQuery.data?.pagination.total ?? 0}
              onPageChange={setPage}
              captionText="Продажи FBO Wildberries"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface FboListErrorProps {
  message: string
  onRetry: () => unknown
}

function FboListError({ message, onRetry }: FboListErrorProps) {
  return (
    <div
      className="mb-4 flex flex-col items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 px-4 py-6 text-center"
      role="alert"
    >
      <p className="text-sm text-destructive">{message}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  )
}
