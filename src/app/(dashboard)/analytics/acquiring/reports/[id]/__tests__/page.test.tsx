import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockNotFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  })
)
let currentId = '1'

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    use: () => ({ id: currentId }),
  }
})

vi.mock('next/navigation', () => ({
  notFound: mockNotFound,
}))

vi.mock('../components/AcquiringReportDetailPage', () => ({
  AcquiringReportDetailPage: ({ reportId }: { reportId: number }): ReactElement => (
    <div data-report-id={reportId}>Report {reportId}</div>
  ),
}))

import AcquiringReportDetailRoute from '../page'

describe('AcquiringReportDetailRoute', () => {
  beforeEach(() => {
    mockNotFound.mockClear()
  })

  it('rejects malformed and non-positive report IDs through the route-owned not-found boundary', () => {
    for (const id of ['invalid', '0', '-1', 'Infinity']) {
      currentId = id
      expect(() => AcquiringReportDetailRoute({ params: Promise.resolve({ id }) })).toThrowError(
        'NEXT_NOT_FOUND'
      )
    }

    expect(mockNotFound).toHaveBeenCalledTimes(4)
  })

  it('forwards a valid numeric report ID to the report detail page', () => {
    currentId = '42'

    const result = AcquiringReportDetailRoute({
      params: Promise.resolve({ id: currentId }),
    }) as ReactElement<{ reportId: number }>

    expect(result.props).toMatchObject({ reportId: 42 })
    expect(mockNotFound).not.toHaveBeenCalled()
  })
})
