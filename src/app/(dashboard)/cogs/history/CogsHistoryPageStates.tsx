'use client'

/**
 * COGS History Page - Early-return state views
 * Extracted from cogs/history/page.tsx for file size compliance
 */

import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Breadcrumbs } from './CogsHistoryBreadcrumbs'
import { CogsHistoryMeta } from '@/components/custom/CogsHistoryMeta'

function CogsHistoryHeading() {
  return <h1 className="text-2xl font-bold tracking-tight">История COGS</h1>
}

/** No nmId provided state */
export function CogsHistoryNoNmId() {
  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <CogsHistoryHeading />
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Не указан ID товара. Перейдите на страницу товара и нажмите &quot;История COGS&quot;.
        </AlertDescription>
      </Alert>
      <Button asChild variant="outline">
        <Link href="/cogs">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться к товарам
        </Link>
      </Button>
    </div>
  )
}

/** Skeleton loader during loading */
export function CogsHistoryLoading() {
  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <CogsHistoryHeading />
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

interface ErrorStateProps {
  error: unknown
  onRetry: () => void
}

/** Error state with retry */
export function CogsHistoryError({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <CogsHistoryHeading />
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : 'Ошибка загрузки истории COGS'}</span>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Повторить
            </Button>
          </div>
        </AlertDescription>
      </Alert>
      <Button asChild variant="outline">
        <Link href="/cogs">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться к товарам
        </Link>
      </Button>
    </div>
  )
}

interface EmptyStateProps {
  nmId: string
  meta?: { product_name?: string } | null
}

/** Empty state */
export function CogsHistoryEmpty({ nmId, meta }: EmptyStateProps) {
  return (
    <div className="space-y-6">
      <Breadcrumbs productName={meta?.product_name} />
      {!meta && <CogsHistoryHeading />}
      {meta && <CogsHistoryMeta meta={meta as Parameters<typeof CogsHistoryMeta>[0]['meta']} />}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <CardTitle className="mb-2">История изменений COGS пуста</CardTitle>
          <p className="text-muted-foreground text-center max-w-md">
            Назначьте COGS товару для начала. После назначения здесь будет отображаться история всех
            изменений себестоимости.
          </p>
          <Button asChild className="mt-6">
            <Link href={`/cogs?nmId=${nmId}`}>Назначить COGS</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
