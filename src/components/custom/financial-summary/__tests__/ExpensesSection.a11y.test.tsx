import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

describe('ExpensesSection accessibility source contract', () => {
  it('names and exposes its horizontal table scroll region to the keyboard', () => {
    const testDirectory = dirname(fileURLToPath(import.meta.url))
    const source = readFileSync(join(testDirectory, '..', 'ExpensesSection.tsx'), 'utf8')

    expect(source).toContain('scrollContainerTabIndex={0}')
    expect(source).toContain('scrollContainerAriaLabel="Расходы Wildberries"')
    expect(source).toContain('<TableCaption className="sr-only">Расходы Wildberries</TableCaption>')
  })
})
