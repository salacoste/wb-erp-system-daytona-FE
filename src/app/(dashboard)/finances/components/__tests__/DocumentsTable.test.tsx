/**
 * DocumentsTable tests — NEW-7 (independent states, AC4 + download trigger).
 *
 * Mocks useFinanceDocuments + useFinanceDocumentCategories to drive the table's
 * state machine (populated/empty/error). The per-row DocumentDownloadButton is
 * exercised with the REAL useDownloadDocument mutation + MSW to prove the
 * base64 → Blob → download pipeline fires from the table UI.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DocumentsTable } from '../DocumentsTable'
import * as financesHooks from '@/hooks/useFinances'
import type { DocumentItem, DocumentCategory, FinanceDocumentsQuery } from '@/types/finances'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/** Render with a fresh QueryClient (for the real download mutation). */
function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>{ui}</TooltipProvider>
    </QueryClientProvider>
  )
}

const POPULATED_DOCS: DocumentItem[] = [
  {
    serviceName: 'svc/a',
    name: 'Платёжное поручение',
    category: 'ПА',
    extensions: ['pdf', 'xlsx'],
    creationTime: '2026-02-01T10:00:00Z',
    viewed: false,
  },
]
const POPULATED_CATS: DocumentCategory[] = [{ name: 'ПА', title: 'Платёжное поручение' }]

function mockDocs(
  result: Partial<{
    data: DocumentItem[] | undefined
    isLoading: boolean
    isError: boolean
    refetch: ReturnType<typeof vi.fn>
  }>,
  categories: DocumentCategory[] = [],
  categoryResult: Partial<{ isLoading: boolean; isError: boolean }> = {}
) {
  vi.spyOn(financesHooks, 'useFinanceDocuments').mockReturnValue({
    data: result.data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...result,
  } as unknown as ReturnType<typeof financesHooks.useFinanceDocuments>)
  vi.spyOn(financesHooks, 'useFinanceDocumentCategories').mockReturnValue({
    data: categories,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...categoryResult,
  } as unknown as ReturnType<typeof financesHooks.useFinanceDocumentCategories>)
}

describe('DocumentsTable — independent states (AC4)', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a skeleton while loading', () => {
    mockDocs({ isLoading: true })
    const { container } = renderWithClient(<DocumentsTable />)
    expect(
      screen.getByRole('status', { name: 'Загрузка финансовых документов' })
    ).toBeInTheDocument()
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('renders the populated table with document rows', () => {
    mockDocs({ data: POPULATED_DOCS }, POPULATED_CATS)
    renderWithClient(<DocumentsTable />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Финансовые документы' })).toHaveAttribute(
      'tabindex',
      '0'
    )
    expect(screen.getByText('Платёжное поручение')).toBeInTheDocument()
    expect(screen.getByText('ПА')).toBeInTheDocument()
    // Download button present per row.
    expect(screen.getByRole('button', { name: /Скачать документ/ })).toBeInTheDocument()
  })

  it('renders the empty state when documents:[]', () => {
    mockDocs({ data: [] })
    renderWithClient(<DocumentsTable />)
    expect(screen.getByText('Документы не найдены')).toBeInTheDocument()
  })

  it('renders error + retry control when isError (RU canonical string)', () => {
    const refetch = vi.fn()
    mockDocs({ isError: true, refetch })
    renderWithClient(<DocumentsTable />)
    expect(
      screen.getByText('Не удалось загрузить документы. Попробуйте ещё раз.')
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Повторить/ }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('triggers the base64 → Blob download when the download button is clicked', async () => {
    // Use the REAL useDownloadDocument (not mocked) + MSW for the download route.
    mockDocs({ data: POPULATED_DOCS }, POPULATED_CATS)
    server.use(
      http.get(`${API_BASE_URL}/v1/finances/documents/:serviceName/download`, () =>
        HttpResponse.json({
          fileName: 'doc.pdf',
          extension: 'pdf',
          document: 'VGVzdA==',
        })
      )
    )
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    renderWithClient(<DocumentsTable />)
    fireEvent.click(screen.getByRole('button', { name: /Скачать документ/ }))

    await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1))
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('status')).toHaveTextContent('Документ скачан')
  })

  it.each([
    ['empty', ''],
    ['malformed', '%%%not-base64%%%'],
  ])('surfaces a visible download failure for a %s payload', async (_label, document) => {
    mockDocs({ data: POPULATED_DOCS }, POPULATED_CATS)
    server.use(
      http.get(`${API_BASE_URL}/v1/finances/documents/:serviceName/download`, () =>
        HttpResponse.json({ fileName: 'doc.pdf', extension: 'pdf', document })
      )
    )
    renderWithClient(<DocumentsTable />)
    fireEvent.click(screen.getByRole('button', { name: /Скачать документ/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось скачать')
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('clears stale download failure when the format is switched (pass-3 fix)', async () => {
    mockDocs({ data: POPULATED_DOCS }, POPULATED_CATS)
    server.use(
      http.get(`${API_BASE_URL}/v1/finances/documents/:serviceName/download`, () =>
        HttpResponse.json({ fileName: 'doc.pdf', extension: 'pdf', document: '' })
      )
    )
    const user = userEvent.setup()
    renderWithClient(<DocumentsTable />)
    fireEvent.click(screen.getByRole('button', { name: /Скачать документ/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось скачать')
    // Switch pdf → xlsx: the stale failure of the previous attempt must go.
    await user.click(screen.getByLabelText('Формат скачивания'))
    await user.click(screen.getByRole('option', { name: 'XLSX' }))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('renders the RTC caption when captionText is provided (Story 172.10)', () => {
    mockDocs({ data: POPULATED_DOCS }, POPULATED_CATS)
    renderWithClient(<DocumentsTable captionText="Финансовые документы Wildberries" />)
    expect(screen.getByRole('caption')).toHaveTextContent('Финансовые документы Wildberries')
  })

  it('renders NO caption element without captionText (Story 172.10)', () => {
    mockDocs({ data: POPULATED_DOCS }, POPULATED_CATS)
    renderWithClient(<DocumentsTable />)
    expect(screen.queryByRole('caption')).toBeNull()
  })

  it('announces download pending via a polite live region (Story 172.10)', async () => {
    // Never-resolving handler keeps the real mutation pending → the sr-only
    // role="status" text appears (spinner alone is visual-only, aria-hidden).
    mockDocs({ data: POPULATED_DOCS }, POPULATED_CATS)
    server.use(
      http.get(
        `${API_BASE_URL}/v1/finances/documents/:serviceName/download`,
        () => new Promise(() => {})
      )
    )
    renderWithClient(<DocumentsTable />)
    expect(screen.queryByRole('status')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Скачать документ/ }))
    expect(await screen.findByRole('status')).toHaveTextContent('Скачивание документа…')
  })

  it('keeps documents usable while categories fail and explains the partial state', () => {
    mockDocs({ data: POPULATED_DOCS }, [], { isError: true })
    renderWithClient(<DocumentsTable />)
    expect(screen.getByText('Платёжное поручение')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Категории временно недоступны')
    expect(screen.getByLabelText('Категория')).toBeDisabled()
  })

  it('announces category loading and disables only the category filter', () => {
    mockDocs({ data: POPULATED_DOCS }, [], { isLoading: true })
    renderWithClient(<DocumentsTable />)
    expect(screen.getByRole('status')).toHaveTextContent('Загрузка категорий…')
    expect(screen.getByLabelText('Категория')).toBeDisabled()
    expect(screen.getByLabelText('Начало периода')).toBeEnabled()
  })
})

/**
 * Filter/pagination interaction tests — MAJOR-1 (sort/order reset offset) +
 * MAJOR-2 (category dropdown skips nameless categories).
 *
 * `useFinanceDocuments` is spied so its `query` arg is captured across
 * re-renders, letting us assert the offset the table passes after a sort change.
 */
describe('DocumentsTable — filter & pagination interactions', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  /** Read the query arg of the most recent useFinanceDocuments invocation. */
  function lastQuery(spy: ReturnType<typeof vi.spyOn>): FinanceDocumentsQuery {
    const calls = spy.mock.calls as unknown as FinanceDocumentsQuery[][]
    return calls[calls.length - 1][0]
  }

  it('MAJOR-1: changing sort resets offset to 0 (mirrors category/date)', async () => {
    // Seed >DEFAULT_PAGE_SIZE (20) rows so the Next button is ENABLED, allowing
    // us to advance offset to 20 BEFORE changing sort.
    const manyDocs: DocumentItem[] = Array.from({ length: 25 }, (_, i) => ({
      serviceName: `svc/${i}`,
      name: `Документ ${i}`,
      category: 'ПА',
      extensions: ['pdf'],
      creationTime: '2026-02-01T10:00:00Z',
      viewed: false,
    }))
    const docsSpy = vi
      .spyOn(financesHooks, 'useFinanceDocuments')
      .mockImplementation((query: FinanceDocumentsQuery = {}) => {
        // Page 2 (offset>0) returns a short page so Next is disabled there.
        const data = query.offset === 0 ? manyDocs : manyDocs.slice(0, 5)
        return {
          data,
          isLoading: false,
          isError: false,
          error: null,
          refetch: vi.fn(),
        } as unknown as ReturnType<typeof financesHooks.useFinanceDocuments>
      })
    vi.spyOn(financesHooks, 'useFinanceDocumentCategories').mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof financesHooks.useFinanceDocumentCategories>)

    const user = userEvent.setup()
    renderWithClient(<DocumentsTable />)

    // Advance to page 2 (offset = DEFAULT_PAGE_SIZE = 20).
    await user.click(screen.getByRole('button', { name: 'Следующая страница' }))
    expect(lastQuery(docsSpy).offset).toBe(20)

    // Change sort — offset MUST reset to 0, not stay at 20.
    await user.click(screen.getByLabelText('Сортировка'))
    await user.click(screen.getByRole('option', { name: 'По категории' }))

    expect(lastQuery(docsSpy).offset).toBe(0)
    expect(lastQuery(docsSpy).sort).toBe('category')
  })

  it('MAJOR-2: a category without `name` is NOT rendered as a dropdown option', async () => {
    const catsWithGap: DocumentCategory[] = [
      { name: 'ПА', title: 'Платёжное поручение' },
      // nameless — must be filtered out (would collide with "all" / no-op).
      { title: 'Безымянная категория' },
      { name: 'ЭДО', title: 'Электронный документооборот' },
    ]
    mockDocs({ data: POPULATED_DOCS }, catsWithGap)
    const user = userEvent.setup()
    renderWithClient(<DocumentsTable />)

    // Open the category dropdown.
    await user.click(screen.getByLabelText('Категория'))
    // Named categories are present.
    expect(screen.getByRole('option', { name: 'Платёжное поручение' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Электронный документооборот' })).toBeInTheDocument()
    // The nameless category title is NOT offered as an option.
    expect(screen.queryByRole('option', { name: 'Безымянная категория' })).toBeNull()
    // No option carries an empty string value (the "all" collision).
    const options = screen.getAllByRole('option')
    expect(options.every(opt => opt.getAttribute('data-value') !== '')).toBe(true)
  })

  it('distinguishes filtered empty and resets filters plus pagination', async () => {
    const docsSpy = vi.spyOn(financesHooks, 'useFinanceDocuments').mockImplementation(
      (query: FinanceDocumentsQuery = {}) =>
        ({
          data: query.category ? [] : POPULATED_DOCS,
          isLoading: false,
          isError: false,
          error: null,
          refetch: vi.fn(),
        }) as unknown as ReturnType<typeof financesHooks.useFinanceDocuments>
    )
    vi.spyOn(financesHooks, 'useFinanceDocumentCategories').mockReturnValue({
      data: POPULATED_CATS,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof financesHooks.useFinanceDocumentCategories>)

    const user = userEvent.setup()
    renderWithClient(<DocumentsTable />)
    await user.click(screen.getByLabelText('Категория'))
    await user.click(screen.getByRole('option', { name: 'Платёжное поручение' }))
    expect(await screen.findByText('По выбранным фильтрам документов нет')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }))
    expect(lastQuery(docsSpy)).toEqual(expect.objectContaining({ category: undefined, offset: 0 }))
    expect(await screen.findByText('Платёжное поручение')).toBeInTheDocument()
  })
})
