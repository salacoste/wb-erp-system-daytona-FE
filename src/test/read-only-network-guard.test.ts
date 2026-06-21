import { describe, expect, it } from 'vitest'
import { isMutatingControlText } from '../../e2e/fixtures/read-only-network-guard'

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
})
