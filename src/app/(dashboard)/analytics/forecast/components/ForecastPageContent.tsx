'use client'

import { useState, useEffect } from 'react'
import { Brain, RefreshCw, AlertTriangle, TrendingUp } from 'lucide-react'
import { ForecastTable } from './ForecastTable'
import { ForecastMetrics } from './ForecastMetrics'
import { useAiForecast } from '@/hooks/useAiForecast'
import { useAuthStore } from '@/stores/authStore'
import { isForecastLevel, type ForecastLevel } from '@/types/ai-forecast'
import { computeForecastQueryParams } from './forecast-query-helpers'
import { pluralize, DAY_FORMS } from '@/lib/russian-plural'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// 'brand' level is omitted from UI options pending backend brand-list endpoint
// + brand-aware forecast aggregation. Type union still permits it for future
// reintroduction. Cabinet-level is implicit aggregation (no selector needed).
const LEVEL_OPTIONS: { value: ForecastLevel; label: string }[] = [
  { value: 'sku', label: 'По товару (SKU)' },
  { value: 'cabinet', label: 'По кабинету' },
]

const HORIZON_OPTIONS = [7, 14, 21, 28]

export function ForecastPageContent() {
  const [nmIdInput, setNmIdInput] = useState('')
  const [level, setLevel] = useState<ForecastLevel>('sku')
  const [horizonDays, setHorizonDays] = useState(7)

  const cabinetId = useAuthStore(s => s.cabinetId)
  useEffect(() => {
    setNmIdInput('')
  }, [cabinetId])

  const { nmId, enabled, parsedNmId } = computeForecastQueryParams(level, nmIdInput)
  const trimmed = nmIdInput.trim()

  const { data, isLoading, isError, error, refetch, isFetching } = useAiForecast(
    { nmId, level, horizonDays },
    enabled
  )

  const hasData = !!data?.predictions?.length

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Brain className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-2xl font-bold">AI Прогноз продаж</h1>
          <p className="text-sm text-muted-foreground">
            Прогноз на основе машинного обучения (MindsDB)
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Параметры прогноза</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="level">Уровень</Label>
              <Select
                value={level}
                onValueChange={v => {
                  if (isForecastLevel(v)) setLevel(v)
                }}
              >
                <SelectTrigger id="level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {level === 'sku' && (
              <div className="space-y-2">
                <Label htmlFor="nmId">Артикул WB (nmId)</Label>
                <Input
                  id="nmId"
                  placeholder="Например: 270937054"
                  value={nmIdInput}
                  onChange={e => setNmIdInput(e.target.value)}
                />
                {trimmed && !parsedNmId && (
                  <p className="text-xs text-destructive">Введите числовой артикул</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="horizon">Горизонт, дни</Label>
              <Select value={String(horizonDays)} onValueChange={v => setHorizonDays(Number(v))}>
                <SelectTrigger id="horizon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HORIZON_OPTIONS.map(d => (
                    <SelectItem key={d} value={String(d)}>
                      {d} {pluralize(DAY_FORMS, d)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {level === 'sku' && !enabled && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Введите артикул WB для получения прогноза по товару</AlertDescription>
        </Alert>
      )}

      {(isLoading || isFetching) && !hasData && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {isError && !hasData && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Ошибка загрузки прогноза:{' '}
            {error instanceof Error ? error.message : 'Неизвестная ошибка'}
          </AlertDescription>
        </Alert>
      )}

      {enabled && !isLoading && !isFetching && !isError && !hasData && (
        <Alert>
          <Brain className="h-4 w-4" />
          <AlertDescription>
            Нет данных прогноза. Модель ещё не обучена для этого товара. Попробуйте позже.
          </AlertDescription>
        </Alert>
      )}

      {hasData && (
        <>
          <ForecastMetrics data={data} />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5" />
                Прогноз продаж
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                Обновить
              </Button>
            </CardHeader>
            <CardContent>
              <ForecastTable predictions={data.predictions} />
            </CardContent>
          </Card>
          {data.rollbackNotice && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Откат модели: {data.rollbackNotice}</AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  )
}
