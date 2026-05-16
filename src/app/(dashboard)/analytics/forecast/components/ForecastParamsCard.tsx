'use client'

/**
 * Forecast parameters card — level, nmId, horizon selectors.
 * Extracted from ForecastPageContent to keep it under 200-line ESLint cap.
 * Story 108.2-FE.
 */
import { AlertTriangle } from 'lucide-react'
import { isForecastLevel, type ForecastLevel } from '@/types/ai-forecast'
import { pluralize, DAY_FORMS } from '@/lib/russian-plural'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const LEVEL_OPTIONS: { value: ForecastLevel; label: string }[] = [
  { value: 'sku', label: 'По товару (SKU)' },
  { value: 'cabinet', label: 'По кабинету' },
]

const HORIZON_OPTIONS = [7, 14, 21, 28]

interface ForecastParamsCardProps {
  level: ForecastLevel
  nmIdInput: string
  horizonDays: number
  parsedNmId: number | null
  /** Business-rule gate from computeForecastQueryParams — used for the missing-nmId alert. */
  enabled: boolean
  onLevelChange: (level: ForecastLevel) => void
  onNmIdChange: (value: string) => void
  onHorizonChange: (days: number) => void
}

export function ForecastParamsCard({
  level,
  nmIdInput,
  horizonDays,
  parsedNmId,
  enabled,
  onLevelChange,
  onNmIdChange,
  onHorizonChange,
}: ForecastParamsCardProps) {
  const trimmed = nmIdInput.trim()

  return (
    <>
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
                  if (isForecastLevel(v)) onLevelChange(v)
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
                  onChange={e => onNmIdChange(e.target.value)}
                />
                {trimmed && !parsedNmId && (
                  <p className="text-xs text-destructive">Введите числовой артикул</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="horizon">Горизонт, дни</Label>
              <Select value={String(horizonDays)} onValueChange={v => onHorizonChange(Number(v))}>
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
    </>
  )
}
