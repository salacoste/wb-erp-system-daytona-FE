import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

describe('ReconciliationSection accessibility source contract', () => {
  it('uses one named keyboard-reachable table scroll owner', () => {
    const testDirectory = dirname(fileURLToPath(import.meta.url))
    const source = readFileSync(join(testDirectory, '..', 'ReconciliationSection.tsx'), 'utf8')

    expect(source).not.toContain('border overflow-x-auto')
    expect(source).toContain('scrollContainerTabIndex={0}')
    expect(source).toContain('scrollContainerAriaLabel="Сверка заказов по датам"')
    expect(source).toContain(
      '<TableCaption className="sr-only">Сверка заказов по датам</TableCaption>'
    )
  })
})
