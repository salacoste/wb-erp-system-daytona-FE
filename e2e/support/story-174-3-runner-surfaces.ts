import { expect } from '../fixtures/network-test'
import type { Page } from '../fixtures/network-test'
import type { Story1743RouteSurfaceContract } from '../fixtures/story-174-3-surface-contracts'
import { ROUTE_SETTLE_TIMEOUT } from './story-174-3-runner-core'

async function assertExecutedPagination(
  page: Page,
  route: string,
  surfaceId: string,
  tableLocator: ReturnType<Page['getByRole']>,
  pagination: { nextName: string; previousName: string }
) {
  const previous = page.getByRole('button', { name: pagination.previousName, exact: true })
  const next = page.getByRole('button', { name: pagination.nextName, exact: true })
  await expect(
    previous,
    `${route}: ${surfaceId} resolves one exact previous-page control`
  ).toHaveCount(1)
  await expect(next, `${route}: ${surfaceId} resolves one exact next-page control`).toHaveCount(1)
  await expect(previous, `${route}: ${surfaceId} previous-page control is visible`).toBeVisible()
  await expect(next, `${route}: ${surfaceId} next-page control is visible`).toBeVisible()

  const previousEnabled = await previous.isEnabled()
  const nextEnabled = await next.isEnabled()
  const paginationRegion = previous.locator('xpath=../..')
  const statusText = (await paginationRegion.textContent())?.replace(/\s+/g, ' ').trim() ?? ''

  if (!previousEnabled && !nextEnabled) {
    const pageCountTerminal = /(?:Стр\.\s*)?1\s*(?:\/|из)\s*1\b/i.test(statusText)
    const range = statusText.match(/\b(\d+)\s*[–-]\s*(\d+)\s+из\s+(\d+)\b/i)
    const completeRangeTerminal = Boolean(
      range && Number(range[1]) === 1 && Number(range[2]) === Number(range[3])
    )
    expect(
      pageCountTerminal || completeRangeTerminal,
      `${route}: ${surfaceId} disabled pagination controls expose an exact single-page terminal; received ${JSON.stringify(statusText)}`
    ).toBe(true)
    return
  }

  const activeControl = nextEnabled ? next : previous
  const beforeRows = await tableLocator.locator('tbody tr').allTextContents()
  const beforeStatus = statusText
  expect(
    beforeRows.length,
    `${route}: ${surfaceId} pagination starts with live rows`
  ).toBeGreaterThan(0)
  await activeControl.focus()
  await expect(
    activeControl,
    `${route}: ${surfaceId} pagination control receives keyboard focus`
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect
    .poll(
      async () => {
        const rows = await tableLocator.locator('tbody tr').allTextContents()
        const nextStatus = (await paginationRegion.textContent())?.replace(/\s+/g, ' ').trim() ?? ''
        return (
          rows.length > 0 &&
          (nextStatus !== beforeStatus || JSON.stringify(rows) !== JSON.stringify(beforeRows))
        )
      },
      {
        message: `${route}: ${surfaceId} keyboard pagination changes page status or live row data`,
        timeout: 20_000,
      }
    )
    .toBe(true)
}

export async function assertSemanticDataSurfaces(
  page: Page,
  route: string,
  contract: Story1743RouteSurfaceContract,
  width: number,
  executeConditionalTriggers = true
) {
  expect(contract.route).toBe(route)
  const expectedTableSurfaces = contract.table.surfaces.filter(
    surface => width !== 390 || surface.narrowWidthDisposition.disposition === 'executed'
  )
  if (expectedTableSurfaces.length > 0 || contract.chart.expectedCount > 0) {
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const visible = (node: Element) => node.getClientRects().length > 0
            const tableCount = [...document.querySelectorAll('table, [role="table"]')]
              .filter(
                table =>
                  !table.matches('[data-chart-summary]') &&
                  !table.matches('table.sr-only') &&
                  !table.closest('[data-chart-alternative], [data-chart-evidence]')
              )
              .filter(visible).length
            const chartCount = [
              ...document.querySelectorAll(
                '[role="img"]:has(svg.recharts-surface), [role="img"][aria-label*="График"], [role="img"][aria-label*="Диаграмма"]'
              ),
            ].filter(visible).length
            return { tableCount, chartCount }
          }),
        {
          message: `${route}: required live data surfaces finish loading`,
          timeout: 20_000,
        }
      )
      .toEqual({
        tableCount: expectedTableSurfaces.length,
        chartCount: contract.chart.expectedCount,
      })
  }
  const dataEvidence = await page.evaluate(() => {
    const visible = (node: Element) => node.getClientRects().length > 0
    const accessibleName = (node: Element) => {
      const labelledBy = node.getAttribute('aria-labelledby')
      return (
        node.getAttribute('aria-label')?.trim() ||
        (labelledBy
          ? labelledBy
              .split(/\s+/)
              .map(id => document.getElementById(id)?.textContent?.trim() ?? '')
              .join(' ')
              .trim()
          : '') ||
        node.querySelector('caption')?.textContent?.trim() ||
        ''
      )
    }
    const interactiveName = (node: Element) =>
      accessibleName(node) || node.textContent?.trim() || node.getAttribute('title')?.trim() || ''
    const cellSemanticValue = (cell: Element) => {
      const formControl = cell.querySelector<HTMLInputElement | HTMLSelectElement>(
        'input:not([type="hidden"]), select'
      )
      return (
        cell.textContent?.trim() ||
        formControl?.value?.trim() ||
        (formControl ? accessibleName(formControl) : '')
      )
    }
    const tables = [...document.querySelectorAll('table, [role="table"]')]
      .filter(
        table =>
          !table.matches('[data-chart-summary]') &&
          !table.matches('table.sr-only') &&
          !table.closest('[data-chart-alternative], [data-chart-evidence]')
      )
      .filter(visible)
      .map(table => {
        const headers = [...table.querySelectorAll('thead th, [role="columnheader"]')]
        const rows = [...table.querySelectorAll('tbody tr, [role="row"]')].filter(row =>
          Boolean(row.querySelector('td, th[scope="row"], [role="cell"], [role="gridcell"]'))
        )
        const cells = [...table.querySelectorAll('td, [role="cell"], [role="gridcell"]')]
        const identityColumn = headers.findIndex(header => Boolean(header.textContent?.trim()))
        const identityCells = rows
          .map(
            row =>
              row.querySelector('th[scope="row"], [role="rowheader"]') ??
              row.querySelectorAll('td, [role="cell"], [role="gridcell"]')[identityColumn]
          )
          .filter((cell): cell is Element => Boolean(cell))
        const numericCells = cells.filter(cell =>
          /^[-+]?\d[\d\s.,]*(?:\s*(?:₽|%|шт\.?|дн\.?))?$/.test(cellSemanticValue(cell) ?? '')
        )
        const numericAlignmentByColumn = numericCells.reduce<Record<string, Set<string>>>(
          (groups, cell) => {
            const column = String([...cell.parentElement!.children].indexOf(cell))
            ;(groups[column] ??= new Set()).add(getComputedStyle(cell).textAlign)
            return groups
          },
          {}
        )
        const interactive = [...table.querySelectorAll('button, a[href], input, select')]
          .filter(visible)
          .filter(
            node =>
              !node.matches('input[aria-hidden="true"], input[type="hidden"], input[tabindex="-1"]')
          )
        const scrollContainer = (() => {
          let candidate = table.parentElement
          while (candidate && candidate !== document.body) {
            if (['auto', 'scroll'].includes(getComputedStyle(candidate).overflowX)) return candidate
            candidate = candidate.parentElement
          }
          return null
        })()
        const box = table.getBoundingClientRect()
        return {
          name: accessibleName(table),
          headerCount: headers.length,
          dataCellCount: cells.length,
          identityHeader: headers[identityColumn]?.textContent?.trim() ?? '',
          emptyIdentityCellCount: identityCells.filter(cell => !cellSemanticValue(cell)).length,
          numericCellCount: numericCells.length,
          numericAlignmentVariantCounts: Object.values(numericAlignmentByColumn).map(
            set => set.size
          ),
          invalidNumericCellCount: numericCells.filter(cell =>
            /NaN|Infinity/.test(cellSemanticValue(cell) ?? '')
          ).length,
          sortControlCount: table.querySelectorAll(
            'th button, [role="columnheader"] button, [aria-sort]'
          ).length,
          unnamedInteractiveCount: interactive.filter(node => !interactiveName(node)).length,
          virtualized:
            table.hasAttribute('aria-rowcount') || Boolean(table.closest('[data-virtualized]')),
          rowCount: rows.length,
          ariaRowCount: Number(table.getAttribute('aria-rowcount') ?? '0'),
          narrowContained:
            Boolean(scrollContainer) ||
            (box.left >= -2 && box.right <= document.documentElement.clientWidth + 2),
        }
      })
    const chartContainers = [
      ...document.querySelectorAll(
        '[role="img"]:has(svg.recharts-surface), [role="img"][aria-label*="График"], [role="img"][aria-label*="Диаграмма"]'
      ),
    ].filter(visible)
    const charts = [...new Set(chartContainers)].map(container => {
      const chart = container.querySelector('svg.recharts-surface, canvas[data-chart]') ?? container
      const legendNodes = [
        ...(container?.querySelectorAll(
          '.recharts-legend-item-text, [aria-label*="legend" i], [data-chart-legend]'
        ) ?? []),
      ]
      const box = chart.getBoundingClientRect()
      const durationMs = (value: string) =>
        value.split(',').map(item => {
          const duration = item.trim()
          return duration.endsWith('ms')
            ? Number.parseFloat(duration)
            : Number.parseFloat(duration) * 1000
        })
      const chartNodes = [chart, ...chart.querySelectorAll<HTMLElement>('*')]
      return {
        chartClasses: chart.getAttribute('class') ?? '',
        containerClasses: container?.getAttribute('class') ?? '',
        containerTag: container?.tagName.toLocaleLowerCase() ?? '',
        name: accessibleName(container ?? chart),
        describedByIds: (container?.getAttribute('aria-describedby') ?? '')
          .split(/\s+/)
          .filter(Boolean),
        legendCount: legendNodes.length,
        unnamedLegendCount: legendNodes.filter(
          node => !(accessibleName(node) || node.textContent?.trim())
        ).length,
        maximumMotionDurationMs: Math.max(
          0,
          ...chartNodes.flatMap(node => {
            const style = getComputedStyle(node)
            return [...durationMs(style.animationDuration), ...durationMs(style.transitionDuration)]
          })
        ),
        responsiveContained:
          box.left >= -2 && box.right <= document.documentElement.clientWidth + 2,
      }
    })
    const alternatives = [
      ...new Set(
        document.querySelectorAll(
          '[data-chart-summary], [data-chart-alternative], table.sr-only:has(> caption), table[aria-label], table:has(> caption), [role="table"][aria-label]'
        )
      ),
    ]
      .filter(visible)
      .map(alternative => ({
        id: alternative.id,
        name: accessibleName(alternative),
        combinedText: alternative.textContent?.replace(/\s+/g, ' ').trim() ?? '',
        headerTexts: [
          ...alternative.querySelectorAll('th, [role="columnheader"], [role="rowheader"]'),
        ].map(header => header.textContent?.replace(/\s+/g, ' ').trim() ?? ''),
        headerCount: alternative.querySelectorAll('th, [role="columnheader"], [role="rowheader"]')
          .length,
        dataCellCount: alternative.querySelectorAll('td, [role="cell"], [role="gridcell"]').length,
      }))
    return { tables, charts, alternatives }
  })

  expect(dataEvidence.tables, contract.table.emptyRationale).toHaveLength(
    expectedTableSurfaces.length
  )
  expect(dataEvidence.charts, contract.chart.emptyRationale).toHaveLength(
    contract.chart.expectedCount
  )

  for (const expectedSurface of expectedTableSurfaces) {
    const matchingTables = dataEvidence.tables.filter(table =>
      table.name.startsWith(expectedSurface.accessibleName)
    )
    expect(
      matchingTables,
      `${route}: ${expectedSurface.id} resolves exactly once through ${expectedSurface.selector}`
    ).toHaveLength(1)
    const table = matchingTables[0]!
    expect(
      table.name.startsWith(expectedSurface.accessibleName),
      `${route}: ${expectedSurface.id} matches stable semantic selector ${expectedSurface.selector}`
    ).toBe(true)
    expect(table.name, `${route}: ${expectedSurface.id} has a caption or accessible name`).not.toBe(
      ''
    )
    expect(
      table.headerCount,
      `${route}: ${expectedSurface.id} exposes semantic headers`
    ).toBeGreaterThan(0)
    expect(
      table.dataCellCount,
      `${route}: ${expectedSurface.id} exposes data cells in its rendered state`
    ).toBeGreaterThan(0)
    expect(
      table.identityHeader,
      `${route}: ${expectedSurface.id} declares an identity column`
    ).not.toBe('')
    expect(table.emptyIdentityCellCount, `${route}: ${expectedSurface.id} identity values`).toBe(0)
    expect(table.invalidNumericCellCount, `${route}: ${expectedSurface.id} numeric precision`).toBe(
      0
    )
    expect(
      table.numericAlignmentVariantCounts.every(count => count === 1),
      `${route}: ${expectedSurface.id} numeric alignment is column-consistent`
    ).toBe(true)
    const tableLocator = page.getByRole('table', {
      name: new RegExp(`^${expectedSurface.accessibleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    })
    if (expectedSurface.features['numeric-alignment-and-precision'].disposition === 'executed') {
      expect(
        table.numericCellCount,
        `${route}: ${expectedSurface.id} executes numeric precision evidence`
      ).toBeGreaterThan(0)
    }
    if (expectedSurface.features.sorting.disposition === 'executed') {
      expect(
        table.sortControlCount,
        `${route}: ${expectedSurface.id} executes sorting evidence`
      ).toBeGreaterThan(0)
      const sortableHeader = tableLocator
        .locator('th')
        .filter({ has: page.locator('button') })
        .first()
      await expect(
        sortableHeader,
        `${route}: ${expectedSurface.id} exposes an interactive sortable header`
      ).toBeVisible()
      const sortButton = sortableHeader.getByRole('button').first()
      const beforeSort = await sortableHeader.getAttribute('aria-sort')
      const beforeRows = await tableLocator.locator('tbody tr').allTextContents()
      await sortButton.focus()
      await page.keyboard.press('Enter')
      await expect
        .poll(
          async () => ({
            ariaSort: await sortableHeader.getAttribute('aria-sort'),
            rows: await tableLocator.locator('tbody tr').allTextContents(),
          }),
          {
            message: `${route}: ${expectedSurface.id} sorting changes aria-sort or row order`,
            timeout: ROUTE_SETTLE_TIMEOUT,
          }
        )
        .not.toEqual({ ariaSort: beforeSort, rows: beforeRows })
    }
    if (expectedSurface.features.pagination.disposition === 'executed') {
      expect(
        expectedSurface.pagination,
        `${route}: ${expectedSurface.id} executed pagination declares exact control names`
      ).toBeTruthy()
      await assertExecutedPagination(
        page,
        route,
        expectedSurface.id,
        tableLocator,
        expectedSurface.pagination!
      )
    }
    expect(table.unnamedInteractiveCount, `${route}: ${expectedSurface.id} actions are named`).toBe(
      0
    )
    if (table.virtualized) {
      expect(
        table.ariaRowCount,
        `${route}: ${expectedSurface.id} virtual row count`
      ).toBeGreaterThanOrEqual(table.rowCount)
    }
    if (expectedSurface.features.virtualization.disposition === 'executed') {
      expect(table.virtualized, `${route}: ${expectedSurface.id} executes virtualization`).toBe(
        true
      )
    }
    if (width === 390) {
      expect(table.narrowContained, `${route}: ${expectedSurface.id} narrow-width strategy`).toBe(
        true
      )
    }
  }
  for (const expectedSurface of contract.chart.surfaces) {
    const matchingCharts = dataEvidence.charts.filter(chart =>
      chart.name.startsWith(expectedSurface.accessibleName)
    )
    expect(
      matchingCharts,
      `${route}: ${expectedSurface.id} resolves exactly once through ${expectedSurface.selector}`
    ).toHaveLength(1)
    const chart = matchingCharts[0]!
    expect(
      chart.name.startsWith(expectedSurface.accessibleName),
      `${route}: ${expectedSurface.id} matches stable semantic selector ${expectedSurface.selector}`
    ).toBe(true)
    expect(chart.name, `${route}: ${expectedSurface.id} has an accessible name`).not.toBe('')
    const alternatives = dataEvidence.alternatives.filter(alternative =>
      alternative.name.startsWith(expectedSurface.alternative.accessibleName)
    )
    expect(
      alternatives.length,
      `${route}: ${expectedSurface.id} has a stable explicit-accessible-name association to ${expectedSurface.alternative.selector}`
    ).toBeGreaterThan(0)
    const alternative = alternatives[0]!
    if (expectedSurface.alternative.association === 'shared-complete-data-table') {
      const alternativeId = expectedSurface.alternative.selector.slice(1)
      expect(
        alternative.id,
        `${route}: ${expectedSurface.id} resolves the declared shared complete-data table`
      ).toBe(alternativeId)
      expect(
        chart.describedByIds,
        `${route}: ${expectedSurface.id} explicitly references the shared complete-data table`
      ).toContain(alternativeId)
    }
    expect(
      alternative.headerCount,
      `${route}: ${expectedSurface.id} alternative has headers`
    ).toBeGreaterThan(0)
    expect(
      alternative.dataCellCount,
      `${route}: ${expectedSurface.id} alternative has data`
    ).toBeGreaterThan(0)
    for (const token of expectedSurface.alternative.requiredPeriodUnitTokens) {
      expect(
        alternative.combinedText,
        `${route}: ${expectedSurface.id} exact alternative exposes period/unit token ${JSON.stringify(token)}`
      ).toContain(token)
    }
    for (const token of expectedSurface.alternative.requiredSeriesTokens) {
      expect(
        alternative.combinedText,
        `${route}: ${expectedSurface.id} exact alternative exposes series token ${JSON.stringify(token)}`
      ).toContain(token)
    }
    expect(
      expectedSurface.tooltip.execution,
      `${route}: ${expectedSurface.id} tooltip precision is bound to an exact owner test`
    ).toBe('owner-test')
    if (expectedSurface.features['series-or-legend-meaning'].disposition === 'executed') {
      expect(chart.unnamedLegendCount, `${route}: ${expectedSurface.id} legend meaning`).toBe(0)
      expect(
        alternative.headerTexts.filter(Boolean).length,
        `${route}: ${expectedSurface.id} alternative names every series`
      ).toBeGreaterThan(1)
    }
    if (expectedSurface.features['period-and-units'].disposition === 'executed') {
      expect(
        alternative.combinedText,
        `${route}: ${expectedSurface.id} alternative exposes a concrete period`
      ).toMatch(/\d{1,4}[./-]\d{1,2}|день|дн\. |недел|месяц|период/i)
      expect(
        alternative.combinedText,
        `${route}: ${expectedSurface.id} alternative exposes concrete units`
      ).toMatch(/₽|%|шт\.?|дн\.?|руб|заказ|единиц/i)
    }
    if (expectedSurface.features['responsive-containment'].disposition === 'executed') {
      expect(
        chart.responsiveContained,
        `${route}: ${expectedSurface.id} responsive containment`
      ).toBe(true)
    }
    if (expectedSurface.features['reduced-motion'].disposition === 'executed') {
      expect(
        chart.maximumMotionDurationMs,
        `${route}: ${expectedSurface.id} chart-specific reduced motion`
      ).toBeLessThanOrEqual(0.1)
    }
  }

  if (width !== 1280 || !executeConditionalTriggers) return

  for (const conditional of contract.table.conditionalSurfaces) {
    const verification = conditional.verification
    if (verification.execution !== 'canonical-trigger') continue

    const trigger = page.getByRole(verification.role, {
      name: verification.name,
      exact: true,
    })
    await expect(
      trigger,
      `${route}: ${conditional.item.id} resolves one exact conditional-state trigger`
    ).toHaveCount(1)
    await expect(trigger, `${route}: ${conditional.item.id} trigger is visible`).toBeVisible()
    await trigger.focus()
    await expect(trigger, `${route}: ${conditional.item.id} trigger receives focus`).toBeFocused()
    await page.keyboard.press(verification.activationKey)

    const conditionalTable = page.getByRole('table', {
      name: new RegExp(
        `^${conditional.item.accessibleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
      ),
    })
    await expect(
      conditionalTable,
      `${route}: ${conditional.item.id} table becomes visible after keyboard activation`
    ).toBeVisible({ timeout: 20_000 })

    await assertSemanticDataSurfaces(
      page,
      route,
      {
        ...contract,
        table: {
          ...contract.table,
          expectedCount: 1,
          surfaces: [conditional.item],
          conditionalSurfaces: [],
        },
        chart: {
          ...contract.chart,
          expectedCount: 0,
          surfaces: [],
          conditionalSurfaces: [],
        },
      },
      width,
      false
    )

    const restore = page.getByRole(verification.role, {
      name: verification.restoreName,
      exact: true,
    })
    await expect(
      restore,
      `${route}: ${conditional.item.id} resolves one exact canonical-state trigger`
    ).toHaveCount(1)
    await restore.focus()
    await expect(
      restore,
      `${route}: ${conditional.item.id} restore trigger receives focus`
    ).toBeFocused()
    await page.keyboard.press(verification.activationKey)
    await expect
      .poll(
        () =>
          conditionalTable.evaluateAll(
            nodes => nodes.filter(node => node.getClientRects().length > 0).length
          ),
        { message: `${route}: ${conditional.item.id} is hidden after canonical-state restore` }
      )
      .toBe(0)
    await assertSemanticDataSurfaces(page, route, contract, width, false)
  }
}
