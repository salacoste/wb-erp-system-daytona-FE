import { expect, type Page } from '@playwright/test'

export type Tier0Fixtures = Record<string, unknown>
export type IntegrityCounts = Record<string, number>

export const CHECK_LABELS: Record<string, string> = {
  duplicates: 'Дубликаты',
  orphans: 'Сироты',
  missing_history: 'Пропущенная история',
  duplicate_status_history: 'Дубли истории',
  invalid_transitions: 'Неверные переходы',
  sync_overlaps: 'Пересечения синхронизации',
}

export function fixtures(raw: unknown): Tier0Fixtures {
  return raw && typeof raw === 'object' ? (raw as Tier0Fixtures) : {}
}

export function textValue(raw: unknown): string | undefined {
  return typeof raw === 'string' && raw.length > 0 ? raw : undefined
}

export function countsValue(raw: unknown): IntegrityCounts | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const entries = Object.entries(raw as Tier0Fixtures)
  if (entries.some(([, value]) => typeof value !== 'number')) return undefined
  return Object.fromEntries(entries) as IntegrityCounts
}

export async function setCabinet(page: Page, cabinetId: string): Promise<void> {
  await page.addInitScript(id => {
    if (window.sessionStorage.getItem('tier0-cabinet-initialized')) return
    const stored = window.localStorage.getItem('auth-storage')
    if (!stored) throw new Error('Authenticated storage state is missing auth-storage')
    const parsed = JSON.parse(stored)
    parsed.state = { ...parsed.state, cabinetId: id }
    window.localStorage.setItem('auth-storage', JSON.stringify(parsed))
    window.sessionStorage.setItem('tier0-cabinet-initialized', 'true')
  }, cabinetId)
}

export function matchesOrdersResponse(
  response: { url(): string },
  endpoints: string | readonly string[],
  backendOrigins: readonly string[],
  cabinetId?: string
): boolean {
  const url = new URL(response.url())
  const paths = typeof endpoints === 'string' ? [endpoints] : endpoints
  return (
    backendOrigins.map(origin => new URL(origin).origin).includes(url.origin) &&
    paths.includes(url.pathname) &&
    (!cabinetId || url.searchParams.get('cabinet_id') === cabinetId)
  )
}

export async function expectRenderedChecks(page: Page, expected: IntegrityCounts): Promise<void> {
  for (const [key, label] of Object.entries(CHECK_LABELS)) {
    const count = expected[key]
    expect(count, `fixture must define ${key}`).toBeDefined()
    const card = page.getByText(label, { exact: true }).locator('xpath=../..')
    await expect(card.getByText(String(count), { exact: true })).toBeVisible()
  }
}
