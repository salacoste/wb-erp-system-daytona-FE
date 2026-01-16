/**
 * Unit Tests for campaign-utils
 * Epic 33 - Advertising Analytics
 * Story 33.8-FE: Integration Testing
 *
 * Tests:
 * - Campaign status config completeness
 * - Status label and color getters
 * - Campaign type labels
 * - Status classification helpers
 * - Campaign sorting logic
 */

import { describe, it, expect } from 'vitest'
import {
  campaignStatusConfig,
  getCampaignStatusLabel,
  getCampaignStatusDotColor,
  campaignTypeLabels,
  getCampaignTypeLabel,
  isCampaignActive,
  isCampaignPaused,
  canResumeCampaign,
  sortCampaignsByStatus,
} from '../campaign-utils'

// WB status codes
const STATUS_READY = 4
const STATUS_ENDED = 7
const STATUS_DECLINED = 8
const STATUS_ACTIVE = 9
const STATUS_PAUSED = 11

// WB type codes
const TYPE_CAROUSEL = 4
const TYPE_PRODUCT_CARD = 5
const TYPE_CATALOG = 6
const TYPE_SEARCH = 7
const TYPE_AUTO = 8
const TYPE_AUCTION = 9

describe('campaignStatusConfig', () => {
  it('should have configuration for all known WB statuses', () => {
    const knownStatuses = [STATUS_READY, STATUS_ENDED, STATUS_DECLINED, STATUS_ACTIVE, STATUS_PAUSED]
    knownStatuses.forEach((status) => {
      expect(campaignStatusConfig[status]).toBeDefined()
      expect(campaignStatusConfig[status].label).toBeTruthy()
      expect(campaignStatusConfig[status].dotColor).toBeTruthy()
      expect(campaignStatusConfig[status].textColor).toBeTruthy()
    })
  })

  it('should have Russian labels', () => {
    expect(campaignStatusConfig[STATUS_READY].label).toBe('Готова к запуску')
    expect(campaignStatusConfig[STATUS_ENDED].label).toBe('Завершена')
    expect(campaignStatusConfig[STATUS_DECLINED].label).toBe('Отклонена')
    expect(campaignStatusConfig[STATUS_ACTIVE].label).toBe('Активна')
    expect(campaignStatusConfig[STATUS_PAUSED].label).toBe('На паузе')
  })

  it('should have appropriate color schemes', () => {
    // Active - green
    expect(campaignStatusConfig[STATUS_ACTIVE].dotColor).toContain('green')

    // Paused - yellow
    expect(campaignStatusConfig[STATUS_PAUSED].dotColor).toContain('yellow')

    // Ready - blue
    expect(campaignStatusConfig[STATUS_READY].dotColor).toContain('blue')

    // Declined - red
    expect(campaignStatusConfig[STATUS_DECLINED].dotColor).toContain('red')

    // Ended - gray
    expect(campaignStatusConfig[STATUS_ENDED].dotColor).toContain('gray')
  })
})

describe('getCampaignStatusLabel', () => {
  it('should return Russian label for known statuses', () => {
    expect(getCampaignStatusLabel(STATUS_ACTIVE)).toBe('Активна')
    expect(getCampaignStatusLabel(STATUS_PAUSED)).toBe('На паузе')
    expect(getCampaignStatusLabel(STATUS_READY)).toBe('Готова к запуску')
    expect(getCampaignStatusLabel(STATUS_ENDED)).toBe('Завершена')
    expect(getCampaignStatusLabel(STATUS_DECLINED)).toBe('Отклонена')
  })

  it('should return fallback for unknown status', () => {
    expect(getCampaignStatusLabel(999, 'Custom Status')).toBe('Custom Status')
  })

  it('should return "Неизвестно" when no fallback provided', () => {
    expect(getCampaignStatusLabel(999)).toBe('Неизвестно')
  })
})

describe('getCampaignStatusDotColor', () => {
  it('should return dot color class for known statuses', () => {
    expect(getCampaignStatusDotColor(STATUS_ACTIVE)).toContain('bg-')
    expect(getCampaignStatusDotColor(STATUS_PAUSED)).toContain('bg-')
    expect(getCampaignStatusDotColor(STATUS_READY)).toContain('bg-')
  })

  it('should return gray for unknown status', () => {
    expect(getCampaignStatusDotColor(999)).toBe('bg-gray-400')
  })
})

describe('campaignTypeLabels', () => {
  it('should have Russian labels for all known WB types', () => {
    expect(campaignTypeLabels[TYPE_CAROUSEL]).toBe('Карусель')
    expect(campaignTypeLabels[TYPE_PRODUCT_CARD]).toBe('Карточка товара')
    expect(campaignTypeLabels[TYPE_CATALOG]).toBe('Каталог')
    expect(campaignTypeLabels[TYPE_SEARCH]).toBe('Поиск')
    expect(campaignTypeLabels[TYPE_AUTO]).toBe('Авто')
    expect(campaignTypeLabels[TYPE_AUCTION]).toBe('Аукцион')
  })
})

describe('getCampaignTypeLabel', () => {
  it('should return Russian label for known types', () => {
    expect(getCampaignTypeLabel(TYPE_AUTO)).toBe('Авто')
    expect(getCampaignTypeLabel(TYPE_AUCTION)).toBe('Аукцион')
    expect(getCampaignTypeLabel(TYPE_SEARCH)).toBe('Поиск')
  })

  it('should return fallback for unknown type', () => {
    expect(getCampaignTypeLabel(999, 'Специальный тип')).toBe('Специальный тип')
  })

  it('should return "Другой" when no fallback provided', () => {
    expect(getCampaignTypeLabel(999)).toBe('Другой')
  })
})

describe('isCampaignActive', () => {
  it('should return true only for active status (9)', () => {
    expect(isCampaignActive(STATUS_ACTIVE)).toBe(true)
  })

  it('should return false for all other statuses', () => {
    expect(isCampaignActive(STATUS_READY)).toBe(false)
    expect(isCampaignActive(STATUS_ENDED)).toBe(false)
    expect(isCampaignActive(STATUS_DECLINED)).toBe(false)
    expect(isCampaignActive(STATUS_PAUSED)).toBe(false)
    expect(isCampaignActive(999)).toBe(false)
  })
})

describe('isCampaignPaused', () => {
  it('should return true only for paused status (11)', () => {
    expect(isCampaignPaused(STATUS_PAUSED)).toBe(true)
  })

  it('should return false for all other statuses', () => {
    expect(isCampaignPaused(STATUS_ACTIVE)).toBe(false)
    expect(isCampaignPaused(STATUS_READY)).toBe(false)
    expect(isCampaignPaused(STATUS_ENDED)).toBe(false)
    expect(isCampaignPaused(STATUS_DECLINED)).toBe(false)
    expect(isCampaignPaused(999)).toBe(false)
  })
})

describe('canResumeCampaign', () => {
  it('should return true for paused campaigns (11)', () => {
    expect(canResumeCampaign(STATUS_PAUSED)).toBe(true)
  })

  it('should return true for ready campaigns (4)', () => {
    expect(canResumeCampaign(STATUS_READY)).toBe(true)
  })

  it('should return false for active, ended, or declined campaigns', () => {
    expect(canResumeCampaign(STATUS_ACTIVE)).toBe(false)
    expect(canResumeCampaign(STATUS_ENDED)).toBe(false)
    expect(canResumeCampaign(STATUS_DECLINED)).toBe(false)
    expect(canResumeCampaign(999)).toBe(false)
  })
})

describe('sortCampaignsByStatus', () => {
  const createCampaign = (
    name: string,
    status: number,
    created_at: string = '2025-01-01T00:00:00Z'
  ) => ({
    name,
    status,
    created_at,
  })

  it('should sort active campaigns first', () => {
    const campaigns = [
      createCampaign('Кампания C', STATUS_ENDED),
      createCampaign('Кампания A', STATUS_ACTIVE),
      createCampaign('Кампания B', STATUS_PAUSED),
    ]

    const sorted = sortCampaignsByStatus(campaigns)

    expect(sorted[0].name).toBe('Кампания A')
    expect(sorted[0].status).toBe(STATUS_ACTIVE)
  })

  it('should sort paused campaigns second', () => {
    const campaigns = [
      createCampaign('Кампания C', STATUS_ENDED),
      createCampaign('Кампания A', STATUS_PAUSED),
      createCampaign('Кампания B', STATUS_READY),
    ]

    const sorted = sortCampaignsByStatus(campaigns)

    expect(sorted[0].name).toBe('Кампания A')
    expect(sorted[0].status).toBe(STATUS_PAUSED)
  })

  it('should sort by name within same status', () => {
    const campaigns = [
      createCampaign('Яблоко', STATUS_ACTIVE),
      createCampaign('Арбуз', STATUS_ACTIVE),
      createCampaign('Банан', STATUS_ACTIVE),
    ]

    const sorted = sortCampaignsByStatus(campaigns)

    expect(sorted[0].name).toBe('Арбуз')
    expect(sorted[1].name).toBe('Банан')
    expect(sorted[2].name).toBe('Яблоко')
  })

  it('should not mutate original array', () => {
    const campaigns = [
      createCampaign('Кампания B', STATUS_ENDED),
      createCampaign('Кампания A', STATUS_ACTIVE),
    ]
    const original = [...campaigns]

    sortCampaignsByStatus(campaigns)

    expect(campaigns).toEqual(original)
  })

  it('should handle empty array', () => {
    const sorted = sortCampaignsByStatus([])
    expect(sorted).toEqual([])
  })

  it('should handle single campaign', () => {
    const campaigns = [createCampaign('Единственная', STATUS_ACTIVE)]
    const sorted = sortCampaignsByStatus(campaigns)
    expect(sorted).toHaveLength(1)
    expect(sorted[0].name).toBe('Единственная')
  })

  it('should handle Russian text sorting correctly', () => {
    const campaigns = [
      createCampaign('Яблоко', STATUS_ENDED),
      createCampaign('Абрикос', STATUS_ENDED),
      createCampaign('Мандарин', STATUS_ENDED),
    ]

    const sorted = sortCampaignsByStatus(campaigns)

    // Russian locale sort: А < М < Я
    expect(sorted[0].name).toBe('Абрикос')
    expect(sorted[1].name).toBe('Мандарин')
    expect(sorted[2].name).toBe('Яблоко')
  })

  it('should maintain correct order: active → paused → others by name', () => {
    const campaigns = [
      createCampaign('Зимняя', STATUS_ENDED),
      createCampaign('Летняя', STATUS_ACTIVE),
      createCampaign('Весенняя', STATUS_PAUSED),
      createCampaign('Осенняя', STATUS_READY),
      createCampaign('Новогодняя', STATUS_DECLINED),
    ]

    const sorted = sortCampaignsByStatus(campaigns)

    // First: Active
    expect(sorted[0].status).toBe(STATUS_ACTIVE)
    // Second: Paused
    expect(sorted[1].status).toBe(STATUS_PAUSED)
    // Rest: sorted by name
    expect(sorted[2].name).toBe('Зимняя')
    expect(sorted[3].name).toBe('Новогодняя')
    expect(sorted[4].name).toBe('Осенняя')
  })
})
