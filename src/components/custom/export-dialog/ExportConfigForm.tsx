/**
 * ExportConfigForm - Configuration form for export dialog
 * Story 6.5-FE: Export Analytics UI
 *
 * Extracted from ExportDialog.tsx for file-size compliance (Epic 74).
 */

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateRangePicker } from '@/components/custom/DateRangePicker'
import { FileSpreadsheet, FileText } from 'lucide-react'
import type { ExportType, ExportFormat } from '@/types/analytics'

/**
 * Export type labels in Russian
 */
const EXPORT_TYPE_LABELS: Record<ExportType, string> = {
  'by-sku': 'По товарам (SKU)',
  'by-brand': 'По брендам',
  'by-category': 'По категориям',
  'cabinet-summary': 'Сводка по кабинету',
}

export interface ExportConfigFormProps {
  type: ExportType
  onTypeChange: (type: ExportType) => void
  weekStart: string
  weekEnd: string
  onRangeChange: (start: string, end: string) => void
  format: ExportFormat
  onFormatChange: (format: ExportFormat) => void
  includeCogs: boolean
  onIncludeCogsChange: (include: boolean) => void
  createError: Error | null
}

export function ExportConfigForm({
  type,
  onTypeChange,
  weekStart,
  weekEnd,
  onRangeChange,
  format,
  onFormatChange,
  includeCogs,
  onIncludeCogsChange,
  createError,
}: ExportConfigFormProps) {
  return (
    <div className="space-y-5 py-4">
      {/* Export Type */}
      <div className="space-y-2">
        <Label htmlFor="export-type">Тип данных</Label>
        <Select value={type} onValueChange={value => onTypeChange(value as ExportType)}>
          <SelectTrigger id="export-type">
            <SelectValue placeholder="Выберите тип данных" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(EXPORT_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <DateRangePicker
          weekStart={weekStart}
          weekEnd={weekEnd}
          onRangeChange={onRangeChange}
          maxWeeks={52}
          showQuickSelect={true}
        />
      </div>

      {/* Format Selection */}
      <div className="space-y-2">
        <Label>Формат файла</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={format === 'xlsx' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFormatChange('xlsx')}
            className="flex-1 gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel (.xlsx)
          </Button>
          <Button
            type="button"
            variant={format === 'csv' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFormatChange('csv')}
            className="flex-1 gap-2"
          >
            <FileText className="h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>

      {/* Include COGS Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="include-cogs"
          checked={includeCogs}
          onCheckedChange={checked => onIncludeCogsChange(checked === true)}
        />
        <Label htmlFor="include-cogs" className="cursor-pointer text-sm font-normal">
          Включить данные COGS (себестоимость)
        </Label>
      </div>

      {/* Error from creation */}
      {createError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {createError.message || 'Ошибка при создании экспорта'}
        </div>
      )}
    </div>
  )
}
