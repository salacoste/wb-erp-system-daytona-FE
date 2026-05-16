'use client'

/**
 * ModelTypeSelector — shadcn/ui Select for AI model type.
 * Story 109.1-FE: 7 ML model options with Russian labels.
 * WCAG 2.1 AA: Label htmlFor associates with SelectTrigger id (Story 108.2-FE pattern).
 */
import { MODEL_TYPES, isModelType, type ModelType } from '@/types/ai-forecast'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * Russian labels for each model type.
 * Exported for direct unit testing (pure-function discipline, Epic 89-FE lesson).
 */
export const MODEL_TYPE_LABELS: Record<ModelType, string> = {
  sales_forecast: 'Прогноз продаж',
  daily_revenue_forecast: 'Прогноз выручки (день)',
  search_conversion_forecast: 'Конверсия в поиске',
  weekly_margin_forecast: 'Маржинальность (неделя)',
  funnel_stage_prediction: 'Конверсия воронки',
  demand_forecast: 'Прогноз спроса',
  stockout_risk: 'Риск out-of-stock',
}

interface ModelTypeSelectorProps {
  value: ModelType
  onValueChange: (v: ModelType) => void
}

export function ModelTypeSelector({ value, onValueChange }: ModelTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="modelType">Тип модели</Label>
      <Select
        value={value}
        onValueChange={v => {
          if (isModelType(v)) onValueChange(v)
        }}
      >
        <SelectTrigger id="modelType">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MODEL_TYPES.map(type => (
            <SelectItem key={type} value={type}>
              {MODEL_TYPE_LABELS[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
