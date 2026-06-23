import { describe, expect, it } from 'vitest'
import {
  collectOperationalRouteWarnings,
  isMutatingControlText,
} from '../../e2e/fixtures/read-only-network-guard'

describe('read-only route audit mutating control classifier', () => {
  it.each([
    'Создать поставку',
    'Сохранить',
    'Назначить COGS',
    'Синхронизировать',
    'Удалить',
    'Запустить бэкфилл',
  ])('detects mutating control text: %s', text => {
    expect(isMutatingControlText(text)).toBe(true)
  })

  it('does not classify read-only supply table row text as mutating by domain noun alone', () => {
    expect(
      isMutatingControlText(
        'WB-GI-246242018 Поставка от 13.06.2026 Открыта 0 0 ₽ 13.06.2026 13:45 —'
      )
    ).toBe(false)
  })

  it('does not classify dismissing an informational notification as a mutation', () => {
    expect(isMutatingControlText('Закрыть уведомление')).toBe(false)
  })

  it('still classifies contextual close actions as mutations', () => {
    expect(isMutatingControlText('Закрыть поставку')).toBe(true)
  })

  it('does not warn when no operational warning signals are present', () => {
    expect(
      collectOperationalRouteWarnings({
        console_errors: [],
        failed_requests: [],
        denied_controls: [],
      })
    ).toEqual([])
  })

  it('keeps visible mutating controls as route warnings', () => {
    expect(
      collectOperationalRouteWarnings({
        console_errors: [],
        failed_requests: [],
        denied_controls: ['Создать поставку'],
      })
    ).toEqual(['visible-mutating-controls-observed-only:Создать поставку'])
  })

  it('still warns for protected read 5xx responses', () => {
    expect(
      collectOperationalRouteWarnings({
        console_errors: [],
        denied_controls: [],
        failed_requests: [
          {
            url: 'http://localhost:3000/v1/analytics/fbs/enhanced',
            method: 'GET',
            resource_type: 'fetch',
            status: 500,
            status_text: 'Internal Server Error',
            timestamp: new Date('2026-06-22T00:00:00.000Z').toISOString(),
          },
        ],
      })
    ).toContain('protected-read-request-returned-5xx')
  })
})
