'use client'

import Link from 'next/link'
import { Store, Sparkles, Hash, Tag, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useSellerInfo } from '@/hooks/useSellerInfo'
import { useJamStatus } from '@/hooks/useJamStatus'
import {
  JAM_TIER_LABELS,
  SELLER_INFO_REASON_LABELS,
  JAM_STATUS_REASON_LABELS,
} from '@/types/cabinet'
import type { JamTier } from '@/types/cabinet'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

const JAM_TIER_STYLES: Record<JamTier, string> = {
  none: 'bg-gray-100 text-gray-700 border-gray-200',
  standard: 'bg-blue-50 text-blue-700 border-blue-200',
  advanced: 'bg-purple-50 text-purple-700 border-purple-200',
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

export function CabinetInfoCard({ cabinetId }: { cabinetId: string }) {
  const { data: seller, isLoading: sellerLoading } = useSellerInfo(cabinetId)
  const { data: jam, isLoading: jamLoading } = useJamStatus(cabinetId)

  return (
    <div className="space-y-6">
      {/* Seller Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Store className="h-5 w-5" />
            Информация о продавце
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sellerLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-40" />
            </div>
          ) : seller ? (
            <>
              {seller.available === false && (
                <Alert className="mb-4 border-yellow-500 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-900">
                    <p>
                      Информация о продавце недоступна:{' '}
                      {(seller.reason && SELLER_INFO_REASON_LABELS[seller.reason]) ??
                        'неизвестная ошибка'}
                    </p>
                    <Link
                      href={ROUTES.SETTINGS.CABINET}
                      className="mt-1 inline-block text-sm font-medium text-yellow-800 underline"
                    >
                      Обновить токен WB
                    </Link>
                  </AlertDescription>
                </Alert>
              )}
              <div className="divide-y">
                <InfoRow icon={Store} label="Название" value={seller.name || '—'} />
                <InfoRow icon={Hash} label="SID" value={seller.sid || '—'} />
                <InfoRow icon={Tag} label="Торговая марка" value={seller.tradeMark || '—'} />
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Jam Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5" />
            Подписка Джем
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jamLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-5 w-52" />
            </div>
          ) : jam ? (
            <div className="space-y-4">
              {jam.available === false && (
                <Alert className="border-yellow-500 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-900">
                    Статус подписки неизвестен:{' '}
                    {(jam.reason && JAM_STATUS_REASON_LABELS[jam.reason]) ?? 'неизвестная ошибка'}
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={cn('text-sm', JAM_TIER_STYLES[jam.tier])}>
                  {JAM_TIER_LABELS[jam.tier]}
                </Badge>
              </div>
              {jam.available && jam.tier !== 'none' && (
                <InfoRow
                  icon={Tag}
                  label="Лимит поисковых запросов"
                  value={`${jam.searchTextsLimit} текстов на товар`}
                />
              )}
              <InfoRow
                icon={Clock}
                label="Проверено"
                value={new Date(jam.checkedAt).toLocaleString('ru-RU')}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
