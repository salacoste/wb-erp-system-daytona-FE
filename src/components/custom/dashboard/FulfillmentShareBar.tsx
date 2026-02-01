/**
 * Fulfillment Share Bar Component - Epic 60: FBO/FBS Order Analytics
 * Visual bar showing FBO vs FBS distribution.
 *
 * Colors: FBO = purple (#7C4DFF), FBS = blue (#3B82F6)
 *
 * @see docs/request-backend/130-DASHBOARD-FBO-ORDERS-API.md
 */

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

export interface FulfillmentShareBarProps {
  /** FBO share percentage (0-100) */
  fboShare: number
  /** FBS share percentage (0-100) */
  fbsShare: number
}

/**
 * Share bar visualization for FBO/FBS distribution
 * Shows proportional bar with percentage labels
 */
export function FulfillmentShareBar({ fboShare, fbsShare }: FulfillmentShareBarProps) {
  return (
    <div className="mt-4 space-y-2" role="img" aria-label={`FBO: ${fboShare}%, FBS: ${fbsShare}%`}>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="bg-purple-500 transition-all duration-300"
          style={{ width: `${fboShare}%` }}
          aria-hidden="true"
        />
        <div
          className="bg-blue-500 transition-all duration-300"
          style={{ width: `${fbsShare}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-purple-500" aria-hidden="true" />
          <span className="text-muted-foreground">FBO: {formatNumber(fboShare)}%</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
          <span className="text-muted-foreground">FBS: {formatNumber(fbsShare)}%</span>
        </span>
      </div>
    </div>
  )
}
