/**
 * Unit Tests for efficiency-utils
 * Epic 33 - Advertising Analytics
 * Story 33.8-FE: Integration Testing
 *
 * Tests:
 * - Efficiency config completeness
 * - Color, label, icon, recommendation getters
 * - Status classification helpers
 * - SessionStorage alert dismiss logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  efficiencyConfig,
  getEfficiencyColor,
  getEfficiencyLabel,
  getEfficiencyIcon,
  getEfficiencyRecommendation,
  isAttentionRequired,
  isLossStatus,
  ALERT_DISMISS_KEY,
  getAlertDismissState,
  setAlertDismissState,
  clearAlertDismissState,
  shouldShowLossAlert,
} from '../efficiency-utils'
import type { EfficiencyStatus } from '@/types/advertising-analytics'

// All efficiency statuses for comprehensive testing
const ALL_STATUSES: EfficiencyStatus[] = [
  'excellent',
  'good',
  'moderate',
  'poor',
  'loss',
  'unknown',
]

describe('efficiencyConfig', () => {
  it('should have configuration for all efficiency statuses', () => {
    ALL_STATUSES.forEach((status) => {
      expect(efficiencyConfig[status]).toBeDefined()
      expect(efficiencyConfig[status].label).toBeTruthy()
      expect(efficiencyConfig[status].icon).toBeDefined()
      expect(efficiencyConfig[status].bgColor).toBeTruthy()
      expect(efficiencyConfig[status].textColor).toBeTruthy()
      expect(efficiencyConfig[status].borderColor).toBeTruthy()
      expect(efficiencyConfig[status].iconColor).toBeTruthy()
      expect(efficiencyConfig[status].description).toBeTruthy()
      expect(efficiencyConfig[status].recommendation).toBeTruthy()
    })
  })

  it('should have Russian labels', () => {
    expect(efficiencyConfig.excellent.label).toBe('Отлично')
    expect(efficiencyConfig.good.label).toBe('Хорошо')
    expect(efficiencyConfig.moderate.label).toBe('Умеренно')
    expect(efficiencyConfig.poor.label).toBe('Слабо')
    expect(efficiencyConfig.loss.label).toBe('Убыток')
    expect(efficiencyConfig.unknown.label).toBe('Нет данных')
  })

  it('should have appropriate color schemes', () => {
    // Excellent/Good should be green variants
    expect(efficiencyConfig.excellent.bgColor).toContain('green')
    expect(efficiencyConfig.good.bgColor).toContain('emerald')

    // Moderate should be yellow
    expect(efficiencyConfig.moderate.bgColor).toContain('yellow')

    // Poor should be orange
    expect(efficiencyConfig.poor.bgColor).toContain('orange')

    // Loss should be red
    expect(efficiencyConfig.loss.bgColor).toContain('red')

    // Unknown should be gray
    expect(efficiencyConfig.unknown.bgColor).toContain('gray')
  })
})

describe('getEfficiencyColor', () => {
  it('should return text color class for each status', () => {
    ALL_STATUSES.forEach((status) => {
      const color = getEfficiencyColor(status)
      expect(color).toBe(efficiencyConfig[status].textColor)
      expect(color).toContain('text-')
    })
  })
})

describe('getEfficiencyLabel', () => {
  it('should return Russian label for each status', () => {
    ALL_STATUSES.forEach((status) => {
      const label = getEfficiencyLabel(status)
      expect(label).toBe(efficiencyConfig[status].label)
    })
  })
})

describe('getEfficiencyIcon', () => {
  it('should return icon component for each status', () => {
    ALL_STATUSES.forEach((status) => {
      const icon = getEfficiencyIcon(status)
      expect(icon).toBe(efficiencyConfig[status].icon)
      // Lucide icons are ForwardRef components (objects with render function)
      expect(icon).toBeDefined()
      expect(icon.$$typeof).toBeDefined() // React element indicator
    })
  })
})

describe('getEfficiencyRecommendation', () => {
  it('should return Russian recommendation for each status', () => {
    ALL_STATUSES.forEach((status) => {
      const recommendation = getEfficiencyRecommendation(status)
      expect(recommendation).toBe(efficiencyConfig[status].recommendation)
      expect(recommendation.length).toBeGreaterThan(0)
    })
  })
})

describe('isAttentionRequired', () => {
  it('should return true for poor, loss, and unknown statuses', () => {
    expect(isAttentionRequired('poor')).toBe(true)
    expect(isAttentionRequired('loss')).toBe(true)
    expect(isAttentionRequired('unknown')).toBe(true)
  })

  it('should return false for excellent, good, and moderate statuses', () => {
    expect(isAttentionRequired('excellent')).toBe(false)
    expect(isAttentionRequired('good')).toBe(false)
    expect(isAttentionRequired('moderate')).toBe(false)
  })
})

describe('isLossStatus', () => {
  it('should return true only for loss status', () => {
    expect(isLossStatus('loss')).toBe(true)
  })

  it('should return false for all other statuses', () => {
    expect(isLossStatus('excellent')).toBe(false)
    expect(isLossStatus('good')).toBe(false)
    expect(isLossStatus('moderate')).toBe(false)
    expect(isLossStatus('poor')).toBe(false)
    expect(isLossStatus('unknown')).toBe(false)
  })
})

describe('SessionStorage Alert Functions', () => {
  // Mock sessionStorage
  let mockStorage: Record<string, string> = {}

  beforeEach(() => {
    mockStorage = {}
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key]
      }),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getAlertDismissState', () => {
    it('should return default state when nothing stored', () => {
      const state = getAlertDismissState()
      expect(state.dismissed).toBe(false)
      expect(state.lossCount).toBeNull()
    })

    it('should return stored state when available', () => {
      mockStorage[ALERT_DISMISS_KEY] = JSON.stringify({
        dismissed: true,
        lossCount: 5,
      })
      const state = getAlertDismissState()
      expect(state.dismissed).toBe(true)
      expect(state.lossCount).toBe(5)
    })

    it('should handle invalid JSON gracefully', () => {
      mockStorage[ALERT_DISMISS_KEY] = 'invalid json'
      const state = getAlertDismissState()
      expect(state.dismissed).toBe(false)
      expect(state.lossCount).toBeNull()
    })

    it('should handle partial stored data', () => {
      mockStorage[ALERT_DISMISS_KEY] = JSON.stringify({ dismissed: true })
      const state = getAlertDismissState()
      expect(state.dismissed).toBe(true)
      expect(state.lossCount).toBeNull()
    })
  })

  describe('setAlertDismissState', () => {
    it('should store dismiss state with loss count', () => {
      setAlertDismissState(10)
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        ALERT_DISMISS_KEY,
        JSON.stringify({ dismissed: true, lossCount: 10 })
      )
    })
  })

  describe('clearAlertDismissState', () => {
    it('should remove stored state', () => {
      mockStorage[ALERT_DISMISS_KEY] = JSON.stringify({ dismissed: true, lossCount: 5 })
      clearAlertDismissState()
      expect(sessionStorage.removeItem).toHaveBeenCalledWith(ALERT_DISMISS_KEY)
    })
  })

  describe('shouldShowLossAlert', () => {
    it('should return false when loss count is 0', () => {
      expect(shouldShowLossAlert(0)).toBe(false)
    })

    it('should return true when alert was never dismissed', () => {
      expect(shouldShowLossAlert(5)).toBe(true)
    })

    it('should return false when alert was dismissed with same loss count', () => {
      mockStorage[ALERT_DISMISS_KEY] = JSON.stringify({
        dismissed: true,
        lossCount: 5,
      })
      expect(shouldShowLossAlert(5)).toBe(false)
    })

    it('should return true when loss count increased since dismissal (AC4)', () => {
      mockStorage[ALERT_DISMISS_KEY] = JSON.stringify({
        dismissed: true,
        lossCount: 5,
      })
      expect(shouldShowLossAlert(8)).toBe(true)
    })

    it('should return false when loss count decreased since dismissal', () => {
      mockStorage[ALERT_DISMISS_KEY] = JSON.stringify({
        dismissed: true,
        lossCount: 10,
      })
      expect(shouldShowLossAlert(3)).toBe(false)
    })
  })
})

describe('ALERT_DISMISS_KEY', () => {
  it('should be a valid storage key', () => {
    expect(ALERT_DISMISS_KEY).toBe('advertising_loss_alert_dismissed')
  })
})
