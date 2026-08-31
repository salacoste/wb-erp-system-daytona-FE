import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testDirectory = dirname(fileURLToPath(import.meta.url))

const namedTables = [
  ['RevenueSection.tsx', 'Доходы'],
  ['PayoutSection.tsx', 'Итого к оплате'],
  ['ExpensesSection.tsx', 'Расходы Wildberries'],
  ['CompensationsSection.tsx', 'Компенсации'],
  ['CogsSection.tsx', 'Себестоимость (COGS)'],
  ['ProfitSection.tsx', 'Чистая прибыль'],
] as const

describe('financial summary table accessibility contracts', () => {
  it.each(namedTables)('%s gives its semantic table the stable name “%s”', (file, name) => {
    const source = readFileSync(join(testDirectory, '..', file), 'utf8')

    expect(source).toContain(`<TableCaption className="sr-only">${name}</TableCaption>`)
  })

  it('gives the expenses section divider an identity value instead of an empty table row', () => {
    const source = readFileSync(join(testDirectory, '..', 'ExpenseTableRows.tsx'), 'utf8')

    expect(source).toContain('<span className="sr-only">Операционные удержания</span>')
    expect(source).toContain('<hr className="border-gray-200" aria-hidden="true" />')
  })
})
