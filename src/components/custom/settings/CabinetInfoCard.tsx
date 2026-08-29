'use client'

import Link from 'next/link'
import { Store, Sparkles, Hash, Tag, Clock, AlertTriangle, type LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useSellerInfo } from '@/hooks/useSellerInfo'
import { useJamStatus } from '@/hooks/useJamStatus'
import { useDelayedLoadingState } from '@/hooks/useDelayedLoadingState'
import { SellerRatingCard } from './SellerRatingCard'
import {
  JAM_TIER_LABELS,
  SELLER_INFO_REASON_LABELS,
  JAM_STATUS_REASON_LABELS,
} from '@/types/cabinet'
import type { JamTier } from '@/types/cabinet'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

const JAM_TIER_STYLES: Record<JamTier, string> = {
  none: 'border-border bg-muted text-muted-foreground',
  standard: 'border-status-information/30 bg-status-information/10 text-status-information',
  advanced: 'border-status-success/30 bg-status-success/10 text-status-success',
  // Semantic warning = "indicate the anomaly" for an unrecognised backend tier.
  unknown: 'border-status-warning/30 bg-status-warning/10 text-status-warning',
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 py-2">
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

function WarningAlert({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Alert
      role="status"
      aria-live="polite"
      className={cn('border-status-warning/40 bg-status-warning/10', className)}
    >
      <AlertTriangle aria-hidden="true" className="h-4 w-4 text-status-warning" />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}

export function CabinetInfoCard({ cabinetId }: { cabinetId: string }) {
  const { data: seller, isLoading: sellerLoading } = useSellerInfo(cabinetId)
  const { data: jam, isLoading: jamLoading } = useJamStatus(cabinetId)
  const sellerLoadingDelayed = useDelayedLoadingState(sellerLoading)
  const jamLoadingDelayed = useDelayedLoadingState(jamLoading)

  return (
    <div className="space-y-6">
      {/* Seller Info */}
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="flex items-center gap-2 text-lg">
              <Store aria-hidden="true" className="h-5 w-5" />
              Информация о продавце
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sellerLoading && !sellerLoadingDelayed ? (
            <div
              className="space-y-3"
              role="status"
              aria-label="Загрузка информации о продавце"
              aria-busy="true"
            >
              <span className="sr-only">Загружаем информацию о продавце</span>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-40" />
            </div>
          ) : sellerLoadingDelayed && !seller ? (
            <WarningAlert>
              Информация о продавце загружается дольше обычного. Проверьте токен WB или повторите
              позже.
            </WarningAlert>
          ) : seller ? (
            <>
              {seller.available === false && (
                <WarningAlert className="mb-4">
                  <p>
                    Информация о продавце недоступна:{' '}
                    {(seller.reason && SELLER_INFO_REASON_LABELS[seller.reason]) ??
                      'неизвестная ошибка'}
                  </p>
                  <Link
                    href={ROUTES.SETTINGS.CABINET}
                    className="mt-1 inline-block rounded-sm text-sm font-medium text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Обновить токен WB
                  </Link>
                </WarningAlert>
              )}
              <div className="divide-y">
                <InfoRow icon={Store} label="Название" value={seller.name || '—'} />
                <InfoRow icon={Hash} label="SID" value={seller.sid || '—'} />
                <InfoRow icon={Tag} label="Торговая марка" value={seller.tradeMark || '—'} />
              </div>
            </>
          ) : (
            <WarningAlert>
              Информация о продавце сейчас недоступна. Проверьте токен WB или повторите позже.
            </WarningAlert>
          )}
        </CardContent>
      </Card>

      {/* Jam Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="flex items-center gap-2 text-lg">
              <Sparkles aria-hidden="true" className="h-5 w-5" />
              Подписка Джем
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jamLoading && !jamLoadingDelayed ? (
            <div
              className="space-y-3"
              role="status"
              aria-label="Загрузка подписки Джем"
              aria-busy="true"
            >
              <span className="sr-only">Загружаем подписку Джем</span>
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-5 w-52" />
            </div>
          ) : jamLoadingDelayed && !jam ? (
            <WarningAlert>
              Статус подписки Джем загружается дольше обычного. Проверьте доступ WB API или
              повторите позже.
            </WarningAlert>
          ) : jam ? (
            <div className="space-y-4">
              {jam.available === false && (
                <WarningAlert>
                  Статус подписки неизвестен:{' '}
                  {(jam.reason && JAM_STATUS_REASON_LABELS[jam.reason]) ?? 'неизвестная ошибка'}
                </WarningAlert>
              )}
              <div className="flex flex-wrap items-center gap-3">
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
                value={jam.checkedAt ? new Date(jam.checkedAt).toLocaleString('ru-RU') : '—'}
              />
            </div>
          ) : (
            <WarningAlert>
              Статус подписки Джем сейчас недоступен. Доступ к функциям Джем остаётся закрыт до
              подтверждения подписки.
            </WarningAlert>
          )}
        </CardContent>
      </Card>

      {/* Seller Rating */}
      <SellerRatingCard cabinetId={cabinetId} />
    </div>
  )
}
