/**
 * SKU Page Loading / Error / Empty States
 * Extracted from page.tsx for file size compliance.
 */

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

const PAGE_TITLE = 'Маржинальность по товарам'

/** Loading skeleton - shown while loading weeks or SKU financials */
export function SkuPageLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

/** Error state - weeks loading failed (likely auth issue) */
export function SkuPageWeeksError({
  error,
  router,
}: {
  error: Error | null
  router: AppRouterInstance
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{PAGE_TITLE}</h1>
      </div>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>
              {error instanceof Error
                ? error.message
                : 'Ошибка загрузки данных. Возможно, требуется авторизация.'}
            </span>
            <Button variant="outline" size="sm" onClick={() => router.push('/login')}>
              Войти
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

/** Error state - SKU financials failed */
export function SkuPageDataError({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{PAGE_TITLE}</h1>
      </div>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : 'Ошибка загрузки данных'}</span>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Повторить
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
