'use client'

/**
 * AdvertisingTab — advertising campaign breakdown for Unified Product Analytics (Story 120.7-FE).
 *
 * Displays ad KPIs from /unified advertising totals and a campaign-level table
 * sorted by spend. Uses formatCurrency/formatNumber for Russian locale.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils'
import type { AdvTotals, CampaignBreakdown } from '@/types/unified-product'

interface AdvertisingTabProps {
  totals: AdvTotals
  campaigns: CampaignBreakdown[]
}

function KpiCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

export function AdvertisingTab({ totals, campaigns }: AdvertisingTabProps) {
  return (
    <div className="space-y-6">
      {/* Ad KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Просмотры" value={formatNumber(totals.views)} />
        <KpiCard title="Клики" value={formatNumber(totals.clicks)} />
        <KpiCard title="CTR" value={formatPercentage(totals.avgCtr)} subtitle="Средний CTR" />
        <KpiCard
          title="Затраты"
          value={formatCurrency(totals.spend)}
          subtitle={`CPC: ${formatCurrency(totals.avgCpc)}`}
        />
      </div>

      {/* Campaign table */}
      {campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Кампании</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">ID кампании</th>
                  <th className="pb-2 font-medium text-right">Просмотры</th>
                  <th className="pb-2 font-medium text-right">Клики</th>
                  <th className="pb-2 font-medium text-right">Заказы</th>
                  <th className="pb-2 font-medium text-right">Затраты</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.advertId} className="border-b last:border-0">
                    <td className="py-2">
                      {/* AP#10: advertId is opaque — String(), not formatNumber */}
                      {String(c.advertId)}
                    </td>
                    <td className="py-2 text-right">{formatNumber(c.views)}</td>
                    <td className="py-2 text-right">{formatNumber(c.clicks)}</td>
                    <td className="py-2 text-right">{formatNumber(c.orders)}</td>
                    <td className="py-2 text-right">{formatCurrency(c.spend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {campaigns.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Нет рекламных кампаний за выбранный период
          </CardContent>
        </Card>
      )}
    </div>
  )
}
