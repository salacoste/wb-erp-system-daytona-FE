'use client'

/**
 * ModelTypeSelector — shadcn/ui Select for AI model type.
 * Story 109.1-FE: 7 ML model options with Russian labels.
 * WCAG 2.1 AA: Label htmlFor associates with SelectTrigger id (Story 108.2-FE pattern).
 * Story 109.3-FE: MODEL_TYPE_LABELS extracted to src/types/ai/forecast.ts (shared source).
 */
import { MODEL_TYPES, MODEL_TYPE_LABELS, isModelType, type ModelType } from '@/types/ai/forecast'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export { MODEL_TYPE_LABELS }

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
