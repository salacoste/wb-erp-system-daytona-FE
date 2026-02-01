/**
 * EmptyStateFulfillment Component
 * Epic 60: FBO/FBS Order Analytics Separation
 *
 * Empty state shown when FBO/FBS data is not yet synced.
 * Displays sync button to trigger initial data load.
 *
 * @see docs/request-backend/130-DASHBOARD-FBO-ORDERS-API.md
 */

import { Package, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface EmptyStateFulfillmentProps {
  /** Callback to trigger FBO/FBS sync */
  onStartSync?: () => void
  /** Whether sync is in progress */
  isSyncLoading?: boolean
}

/**
 * EmptyStateFulfillment - Shown when no FBO/FBS data available
 * Provides option to start sync for FBO/FBS analytics
 */
export function EmptyStateFulfillment({
  onStartSync,
  isSyncLoading,
}: EmptyStateFulfillmentProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 py-4 text-center">
      <div className="rounded-full bg-blue-50 p-3">
        <Package className="h-6 w-6 text-blue-400" />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-700">FBO/FBS аналитика</p>
        <p className="max-w-xs text-xs text-gray-500">
          Данные FBO/FBS ещё не загружены. Запустите синхронизацию для получения аналитики.
        </p>
      </div>

      {onStartSync && (
        <Button
          variant="outline"
          size="sm"
          onClick={onStartSync}
          disabled={isSyncLoading}
          className="text-xs"
        >
          {isSyncLoading ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Загрузка...
            </>
          ) : (
            <>
              <RefreshCw className="mr-1 h-3 w-3" />
              Синхронизировать
            </>
          )}
        </Button>
      )}
    </div>
  )
}
