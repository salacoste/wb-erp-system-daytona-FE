'use client'

/** Bulk add dialog for SKU Packaging — Epic 75-FE, Story 75.3 (AC: #7) */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useBulkCreateSkuPackaging } from '@/hooks/use-sku-packaging'
import { BulkPreviewTable, type BulkResultRow, type BulkRow } from './BulkPreviewTable'

interface BulkAddDialogProps {
  open: boolean
  onClose: () => void
}

function parseBulkInput(text: string): BulkRow[] {
  return text
    .trim()
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const parts = line.split(/[,\t;]/).map(p => p.trim())
      const nmId = parseInt(parts[0], 10)
      const boxTypeId = parts[1] || ''
      const unitsPerBox = parseInt(parts[2], 10)

      if (isNaN(nmId) || nmId <= 0)
        return { nmId: 0, boxTypeId, unitsPerBox, parseError: 'Неверный nmId' }
      if (!boxTypeId) return { nmId, boxTypeId, unitsPerBox, parseError: 'Не указан boxTypeId' }
      if (isNaN(unitsPerBox) || unitsPerBox <= 0)
        return { nmId, boxTypeId, unitsPerBox: 0, parseError: 'Неверное кол-во' }

      return { nmId, boxTypeId, unitsPerBox }
    })
}

export function BulkAddDialog({ open, onClose }: BulkAddDialogProps) {
  const mutation = useBulkCreateSkuPackaging()
  const [input, setInput] = useState('')
  const [parsed, setParsed] = useState<BulkRow[]>([])
  const [results, setResults] = useState<BulkResultRow[] | null>(null)
  const [step, setStep] = useState<'input' | 'preview' | 'results'>('input')
  const [apiCounts, setApiCounts] = useState<{ created: number; updated: number } | null>(null)

  const handleParse = () => {
    const rows = parseBulkInput(input)
    setParsed(rows)
    setStep('preview')
  }

  const handleSubmit = async () => {
    const validRows = parsed.filter(r => !r.parseError)
    if (validRows.length === 0) return

    try {
      const response = await mutation.mutateAsync({
        items: validRows.map(r => ({
          nmId: r.nmId,
          boxTypeId: r.boxTypeId,
          unitsPerBox: r.unitsPerBox,
        })),
      })

      setApiCounts({ created: response.created, updated: response.updated })
      const errorMap = new Map(response.errors.map(e => [e.nmId, e.error]))
      const resultRows: BulkResultRow[] = parsed.map(row => {
        if (row.parseError) return { ...row, status: 'error' as const, message: row.parseError }
        const err = errorMap.get(row.nmId)
        return err
          ? { ...row, status: 'error' as const, message: err }
          : { ...row, status: 'success' as const }
      })

      setResults(resultRows)
      setStep('results')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка массового добавления'
      setResults(parsed.map(row => ({ ...row, status: 'error' as const, message: msg })))
      setStep('results')
    }
  }

  const handleClose = () => {
    setInput('')
    setParsed([])
    setResults(null)
    setApiCounts(null)
    setStep('input')
    onClose()
  }

  const validCount = parsed.filter(r => !r.parseError).length
  const errorCount = parsed.filter(r => r.parseError).length

  return (
    <Dialog open={open} onOpenChange={v => !v && !mutation.isPending && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Массовое добавление упаковки</DialogTitle>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-3">
            <Label htmlFor="bulk-input">Данные (nmId, boxTypeId, штук в коробке)</Label>
            <Textarea
              id="bulk-input"
              placeholder={'123456789, box-type-uuid, 10\n987654321, box-type-uuid, 5'}
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Одна строка на товар. Разделитель: запятая, табуляция или точка с запятой.
            </p>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-3">
            <p className="text-sm">
              Найдено строк: {parsed.length} (корректных: {validCount}, с ошибками: {errorCount})
            </p>
            <BulkPreviewTable rows={parsed} showStatus={errorCount > 0} />
          </div>
        )}

        {step === 'results' && results && (
          <div className="space-y-3">
            <p className="text-sm">
              Создано: {apiCounts?.created ?? 0}, обновлено: {apiCounts?.updated ?? 0}, ошибок:{' '}
              {results.filter(r => r.status === 'error').length}
            </p>
            <BulkPreviewTable rows={results} showStatus />
          </div>
        )}

        <DialogFooter>
          {step === 'input' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Отмена
              </Button>
              <Button onClick={handleParse} disabled={!input.trim()}>
                Предпросмотр
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('input')}>
                Назад
              </Button>
              <Button onClick={handleSubmit} disabled={mutation.isPending || validCount === 0}>
                {mutation.isPending ? 'Отправка...' : `Отправить (${validCount})`}
              </Button>
            </>
          )}
          {step === 'results' && <Button onClick={handleClose}>Закрыть</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
