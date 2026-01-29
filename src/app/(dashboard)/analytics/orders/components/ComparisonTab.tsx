/**
 * Comparison Tab Component
 * Story 51.8-FE: FBS Analytics Page (Tab Navigation & Integration)
 * Story 51.7-FE: Period Comparison Table
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Period comparison with preset options and delta indicators.
 */

'use client'

import { useState, useMemo } from 'react'
import { format, subDays, subMonths, subQuarters, subYears } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFbsCompare } from '@/hooks/useFbsAnalytics'
import { ComparisonTable } from './ComparisonTable'

type ComparisonPreset = 'mom' | 'qoq' | 'yoy'

interface PresetConfig {
  value: ComparisonPreset
  label: string
  description: string
}

const PRESETS: PresetConfig[] = [
  { value: 'mom', label: 'Месяц к месяцу', description: 'Сравнение с предыдущим месяцем' },
  { value: 'qoq', label: 'Квартал к кварталу', description: 'Сравнение с предыдущим кварталом' },
  { value: 'yoy', label: 'Год к году', description: 'Сравнение с прошлым годом' },
]

function formatDateApi(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

function getPresetPeriods(preset: ComparisonPreset) {
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  switch (preset) {
    case 'mom': {
      const period1From = subDays(today, 29)
      const period2To = subMonths(today, 1)
      const period2From = subDays(period2To, 29)
      return {
        period1From: formatDateApi(period1From),
        period1To: formatDateApi(today),
        period2From: formatDateApi(period2From),
        period2To: formatDateApi(period2To),
      }
    }
    case 'qoq': {
      const period1From = subDays(today, 89)
      const period2To = subQuarters(today, 1)
      const period2From = subDays(period2To, 89)
      return {
        period1From: formatDateApi(period1From),
        period1To: formatDateApi(today),
        period2From: formatDateApi(period2From),
        period2To: formatDateApi(period2To),
      }
    }
    case 'yoy':
    default: {
      const period1From = subDays(today, 29)
      const period2To = subYears(today, 1)
      const period2From = subDays(period2To, 29)
      return {
        period1From: formatDateApi(period1From),
        period1To: formatDateApi(today),
        period2From: formatDateApi(period2From),
        period2To: formatDateApi(period2To),
      }
    }
  }
}

export function ComparisonTab() {
  const [preset, setPreset] = useState<ComparisonPreset>('mom')
  const periods = useMemo(() => getPresetPeriods(preset), [preset])

  const { data, isLoading, error } = useFbsCompare(periods)

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Не удалось загрузить данные сравнения. Попробуйте обновить страницу.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Preset Selector */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">Сравнение периодов</CardTitle>
            <div className="flex rounded-lg bg-muted p-1">
              {PRESETS.map(option => (
                <Button
                  key={option.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreset(option.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm transition-colors',
                    preset === option.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {PRESETS.find(p => p.value === preset)?.description}
          </p>
        </CardHeader>
      </Card>

      {/* Comparison Results */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
              <Skeleton className="h-[200px]" />
            </div>
          ) : data ? (
            <ComparisonTable data={data} />
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              Нет данных для сравнения
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
