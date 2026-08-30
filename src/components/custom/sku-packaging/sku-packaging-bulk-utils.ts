import type { SkuPackagingBulkResponse } from '@/types/shipment-cost'
import type { BulkResultRow, BulkRow } from './BulkPreviewTable'

export function parseBulkInput(text: string): BulkRow[] {
  return text
    .trim()
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const parts = line.split(/[,\t;]/).map(part => part.trim())
      const nmId = /^\d+$/.test(parts[0]) ? Number(parts[0]) : Number.NaN
      const boxTypeId = parts[1] || ''
      const unitsPerBox = /^\d+$/.test(parts[2]) ? Number(parts[2]) : Number.NaN

      if (Number.isNaN(nmId) || nmId <= 0)
        return { nmId: 0, boxTypeId, unitsPerBox, parseError: 'Неверный nmId' }
      if (!boxTypeId) return { nmId, boxTypeId, unitsPerBox, parseError: 'Не указан boxTypeId' }
      if (Number.isNaN(unitsPerBox) || unitsPerBox <= 0)
        return { nmId, boxTypeId, unitsPerBox: 0, parseError: 'Неверное кол-во' }

      return { nmId, boxTypeId, unitsPerBox }
    })
}

export function attachActiveBoxTypes(
  rows: BulkRow[],
  boxTypes: readonly { id: string; name: string }[]
): BulkRow[] {
  const activeBoxTypes = new Map(boxTypes.map(boxType => [boxType.id, boxType.name]))
  return rows.map(row =>
    row.parseError
      ? row
      : activeBoxTypes.has(row.boxTypeId)
        ? { ...row, boxTypeName: activeBoxTypes.get(row.boxTypeId) }
        : { ...row, parseError: 'Тип коробки не найден или неактивен' }
  )
}

export function reconcileBulkResponse(
  rows: BulkRow[],
  response: SkuPackagingBulkResponse
): {
  counts: { created: number; updated: number } | null
  results: BulkResultRow[]
  completionMessage: string | null
} {
  const submittedCount = rows.filter(row => !row.parseError).length
  if (response.created + response.updated + response.errors.length !== submittedCount) {
    return {
      counts: null,
      results: rows.map(row => ({
        ...row,
        status: 'error',
        message: row.parseError || 'Не удалось подтвердить результат сохранения.',
      })),
      completionMessage: null,
    }
  }

  const errorIds = new Set(response.errors.map(error => error.nmId))
  return {
    counts: { created: response.created, updated: response.updated },
    results: rows.map(row => {
      if (row.parseError) return { ...row, status: 'error', message: row.parseError }
      return errorIds.has(row.nmId)
        ? {
            ...row,
            status: 'error',
            message: 'Не удалось сохранить эту привязку. Проверьте данные.',
          }
        : { ...row, status: 'success' }
    }),
    completionMessage: `Массовая обработка завершена: создано ${response.created}, обновлено ${response.updated}, ошибок ${response.errors.length}.`,
  }
}
