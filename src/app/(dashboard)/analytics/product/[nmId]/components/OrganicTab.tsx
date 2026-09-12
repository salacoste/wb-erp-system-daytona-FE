'use client'

/**
 * OrganicTab — organic vs paid traffic split for Unified Product Analytics (Story 120.7-FE).
 *
 * Displays the iROAS insight card (incremental revenue / ad spend) and a per-day
 * correlation table showing organic vs ad-attributed cart breakdown with confidence.
 */

import { CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils'
import type { CorrelationDayItem, IncrementalRoasData } from '@/types/unified-product'
import { ProductOrganicChart } from './ProductOrganicChart'

interface OrganicTabProps {
  correlation: CorrelationDayItem[]
  iroas: IncrementalRoasData | null
}

/** iROAS interpretation → Russian label + color class + optional icon channel. */
function iroasLabel(interp: string | null): { text: string; cls: string; icon: string | null } {
  if (!interp) return { text: 'Нет данных', cls: 'text-muted-foreground', icon: null }
  // 168.7: raw green/red/yellow → semantic tokens. Tier-collapse guard: the 4
  // interpretation tiers keep distinct intensity — highly_effective = full
  // positive, effective = full positive TOO, but the distance moved to a
  // NON-TEXT channel (owner decision (a), 2026-09-12; debt-p2-80-sweep A2):
  // the old `text-financial-positive/80` failed WCAG 1.4.3 as TEXT (3.51:1;
  // /90 fails at 4.23, only /95+ passes at 4.66 — visually indistinguishable
  // from full, so no alpha can carry the tier distance on text), so both
  // positive tiers now
  // render full-token text (5.13:1 light / 9.38 dark) and the icon brightness
  // carries the tier: effective = opacity-80 icon (3.51:1 light / 6.34:1 dark,
  // ≥3:1 non-text per 1.4.11), highly_effective = full-opacity icon. Idiom
  // from 168.3/168.6 preserved — 4 tiers, NOT collapsed. No alpha on any text.
  const map: Record<string, { text: string; cls: string; icon: string | null }> = {
    highly_effective: {
      text: 'Очень эффективно',
      cls: 'text-financial-positive',
      icon: 'text-financial-positive',
    },
    effective: {
      text: 'Эффективно',
      cls: 'text-financial-positive',
      icon: 'text-financial-positive opacity-80',
    },
    marginal: { text: 'На грани', cls: 'text-status-warning', icon: null },
    ineffective: { text: 'Неэффективно', cls: 'text-financial-negative', icon: null },
  }
  return map[interp] ?? { text: interp, cls: 'text-muted-foreground', icon: null }
}

export function OrganicTab({ correlation, iroas }: OrganicTabProps) {
  const verdict = iroasLabel(iroas?.interpretation ?? null)

  return (
    <div className="space-y-6">
      {/* iROAS insight */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Инкрементальный ROAS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {iroas?.iROAS != null ? formatNumber(iroas.iROAS) : '—'}
            </p>
            <p className={`text-xs mt-1 font-medium inline-flex items-center gap-1 ${verdict.cls}`}>
              {verdict.icon && (
                <CheckCircle2 aria-hidden="true" className={`size-3.5 shrink-0 ${verdict.icon}`} />
              )}
              {verdict.text}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Инкрементальная выручка
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {iroas ? formatCurrency(iroas.incrementalRevenue) : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Выручка за вычетом органики</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Каннибализация органики
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {iroas?.organicCannibalizationPct != null
                ? formatPercentage(iroas.organicCannibalizationPct)
                : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">% заказов был органическим</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Рекламные заказы vs Органика
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {iroas
                ? `${formatNumber(iroas.totalOrders - iroas.estimatedOrganicOrders)} / ${formatNumber(iroas.estimatedOrganicOrders)}`
                : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Реклама / Органика</p>
          </CardContent>
        </Card>
      </div>

      {/* Stacked bar chart: organic vs ad cart */}
      {correlation.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Добавления в корзину</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductOrganicChart correlation={correlation} />
          </CardContent>
        </Card>
      )}

      {/* Per-day correlation table */}
      {correlation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Разбивка по дням</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Дата</th>
                  <th className="pb-2 font-medium text-right">Рекл. заказы</th>
                  <th className="pb-2 font-medium text-right">Орг. корзина</th>
                  <th className="pb-2 font-medium text-right">Рекл. корзина</th>
                  <th className="pb-2 font-medium text-right">Достоверность</th>
                </tr>
              </thead>
              <tbody>
                {correlation.map(day => (
                  <tr key={day.date} className="border-b last:border-0">
                    <td className="py-2">{day.date}</td>
                    <td className="py-2 text-right">{formatNumber(day.adOrders)}</td>
                    <td className="py-2 text-right">{formatNumber(day.organicCart)}</td>
                    <td className="py-2 text-right">
                      {day.estimatedAdCart != null ? formatNumber(day.estimatedAdCart) : '—'}
                    </td>
                    <td className="py-2 text-right">
                      {/* 168.7: confidence = data-quality indicator, NOT financial —
                          high → status-information (info-blue precedent 168.5),
                          medium → status-warning, low → muted (untouched). */}
                      <span
                        className={
                          day.confidence === 'high'
                            ? 'text-status-information'
                            : day.confidence === 'medium'
                              ? 'text-status-warning'
                              : 'text-muted-foreground'
                        }
                      >
                        {day.confidence === 'high'
                          ? 'Высокая'
                          : day.confidence === 'medium'
                            ? 'Средняя'
                            : 'Низкая'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {correlation.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Нет данных по органическому трафику за выбранный период
          </CardContent>
        </Card>
      )}
    </div>
  )
}
