/**
 * Acquiring Period Detail Page
 * Epic 90-FE Story 90.4: Cross-report transaction detail for a date range
 */

import { AcquiringPeriodDetailPage } from './components/AcquiringPeriodDetailPage'
import type { DateRange } from '@/types/date-range'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 24 * 60 * 60 * 1000

function parseIsoDate(value: string | string[] | undefined): Date | null {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return null

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }

  date.setHours(0, 0, 0, 0)
  return date
}

function resolveDeepLinkRange(query: Record<string, string | string[] | undefined>): {
  initialRange?: DateRange
  initialRangeError?: string
} {
  const hasFrom = query.from !== undefined
  const hasTo = query.to !== undefined
  if (!hasFrom && !hasTo) return {}

  const from = parseIsoDate(query.from)
  const to = parseIsoDate(query.to)
  const inclusiveDays = from && to ? Math.floor((to.getTime() - from.getTime()) / DAY_MS) + 1 : 0

  if (!from || !to || from > to || inclusiveDays > 365) {
    return {
      initialRangeError:
        'Период в ссылке недоступен. Выберите даты от 1 до 365 дней, чтобы загрузить транзакции.',
    }
  }

  return { initialRange: { from, to } }
}

export default async function AcquiringPeriodRoute({
  searchParams = Promise.resolve({}),
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const periodContext = resolveDeepLinkRange(await searchParams)
  return <AcquiringPeriodDetailPage {...periodContext} />
}
