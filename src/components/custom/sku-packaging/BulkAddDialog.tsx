'use client'

/** Bulk add dialog for SKU Packaging — Epic 75-FE, Story 75.3 (AC: #7) */

import { useRef, useState, type RefObject } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useBulkCreateSkuPackaging } from '@/hooks/use-sku-packaging'
import { useBoxTypes } from '@/hooks/use-box-types'
import { BulkPreviewTable, type BulkResultRow, type BulkRow } from './BulkPreviewTable'
import { useSkuPackagingDialogFocus } from './useSkuPackagingDialogFocus'
import {
  attachActiveBoxTypes,
  parseBulkInput,
  reconcileBulkResponse,
} from './sku-packaging-bulk-utils'

interface BulkAddDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: (message: string) => void
  returnFocusRef?: RefObject<HTMLButtonElement | null>
  successFocusRef?: RefObject<HTMLElement | null>
}

export function BulkAddDialog({
  open,
  onClose,
  onSuccess,
  returnFocusRef,
  successFocusRef,
}: BulkAddDialogProps) {
  const mutation = useBulkCreateSkuPackaging()
  const {
    data: boxTypes = [],
    isLoading: isBoxTypesLoading,
    isError: isBoxTypesError,
    refetch: refetchBoxTypes,
  } = useBoxTypes()
  const inFlightRef = useRef(false)
  const focus = useSkuPackagingDialogFocus(returnFocusRef, successFocusRef)
  const [input, setInput] = useState('')
  const [parsed, setParsed] = useState<BulkRow[]>([])
  const [results, setResults] = useState<BulkResultRow[] | null>(null)
  const [step, setStep] = useState<'input' | 'preview' | 'results'>('input')
  const [apiCounts, setApiCounts] = useState<{ created: number; updated: number } | null>(null)
  const [completionMessage, setCompletionMessage] = useState<string | null>(null)

  const handleParse = () => {
    if (isBoxTypesLoading || isBoxTypesError) return
    const rows = attachActiveBoxTypes(parseBulkInput(input), boxTypes)
    setParsed(rows)
    setStep('preview')
  }

  const handleSubmit = async () => {
    if (inFlightRef.current) return
    const validRows = parsed.filter(r => !r.parseError)
    if (validRows.length === 0) return

    inFlightRef.current = true
    try {
      const response = await mutation.mutateAsync({
        items: validRows.map(r => ({
          nmId: r.nmId,
          boxTypeId: r.boxTypeId,
          unitsPerBox: r.unitsPerBox,
        })),
      })

      const reconciled = reconcileBulkResponse(parsed, response)
      setApiCounts(reconciled.counts)
      setResults(reconciled.results)
      setCompletionMessage(reconciled.completionMessage)
      if (reconciled.completionMessage) focus.markSuccessFocus()
      setStep('results')
    } catch {
      const msg = 'Не удалось выполнить массовое добавление. Повторите попытку.'
      setResults(parsed.map(row => ({ ...row, status: 'error' as const, message: msg })))
      setStep('results')
    } finally {
      inFlightRef.current = false
    }
  }

  const handleClose = () => {
    setInput('')
    setParsed([])
    setResults(null)
    setApiCounts(null)
    if (completionMessage) onSuccess?.(completionMessage)
    setCompletionMessage(null)
    setStep('input')
    onClose()
  }

  const validCount = parsed.filter(r => !r.parseError).length
  const errorCount = parsed.filter(r => r.parseError).length

  return (
    <Dialog
      open={open}
      onOpenChange={v => !v && !mutation.isPending && !inFlightRef.current && handleClose()}
    >
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-2xl"
        onCloseAutoFocus={focus.handleCloseAutoFocus}
      >
        <DialogHeader>
          <DialogTitle>Массовое добавление упаковки</DialogTitle>
          <DialogDescription>
            Вставьте строки с nmId, типом коробки и количеством единиц для пакетного добавления.
          </DialogDescription>
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
            {isBoxTypesError && (
              <div role="alert" className="space-y-2 text-sm text-destructive">
                <span>Не удалось загрузить типы коробок.</span>
                <Button onClick={() => refetchBoxTypes()}>Повторить</Button>
              </div>
            )}
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-3">
            <p className="text-sm">
              Найдено строк: {parsed.length} (корректных: {validCount}, с ошибками: {errorCount})
            </p>
            <BulkPreviewTable
              rows={parsed}
              showStatus
              accessibleName="Предпросмотр массового добавления упаковки"
            />
          </div>
        )}

        {step === 'results' && results && (
          <div className="space-y-3">
            <p role="status" aria-live="polite" className="text-sm">
              Создано: {apiCounts?.created ?? 0}, обновлено: {apiCounts?.updated ?? 0}, ошибок:{' '}
              {results.filter(r => r.status === 'error').length}
            </p>
            <BulkPreviewTable
              rows={results}
              showStatus
              accessibleName="Результаты массового добавления упаковки"
            />
          </div>
        )}

        <DialogFooter>
          <p role="status" aria-live="polite" className="sr-only">
            {mutation.isPending ? 'Отправляем привязки упаковки' : ''}
          </p>
          {step === 'results' && results?.some(row => row.status === 'error') && (
            <p role="alert" className="sr-only">
              Часть привязок не сохранена
            </p>
          )}
          {step === 'input' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Отмена
              </Button>
              <Button
                onClick={handleParse}
                disabled={!input.trim() || isBoxTypesLoading || isBoxTypesError}
              >
                Предпросмотр
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep('input')}
                disabled={mutation.isPending}
              >
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
