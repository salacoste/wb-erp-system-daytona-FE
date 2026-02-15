/**
 * TDD Tests for Story 61.9-FE: Daily Breakdown Support
 * Epic 61-FE: Dashboard Data Integration
 *
 * NOTE: This file contains TDD placeholder tests (.todo) for future implementation.
 * The useDailyMetrics hook is planned for Epic 62-FE.
 *
 * These tests document the expected behavior and acceptance criteria.
 * Convert .todo() to real tests when implementing the hook.
 *
 * @see docs/epics/epic-61-fe-dashboard-data-integration.md
 */

import { describe, it, beforeEach, afterEach, vi } from 'vitest'
import { setupMockAuth, clearMockAuth } from '@/test/test-utils'

/**
 * Expected DailyMetrics interface per Story 61.9-FE
 * @see src/types/daily-metrics.ts
 */

describe('Story 61.9-FE: useDailyMetrics Hook (Epic 62 - Future Implementation)', () => {
  beforeEach(() => {
    setupMockAuth()
  })

  afterEach(() => {
    clearMockAuth()
    vi.clearAllMocks()
  })

  describe('basic hook functionality', () => {
    it.todo('should return DailyMetrics[] array from useDailyMetrics hook')
    it.todo('should aggregate data from orders, finance-summary, and advertising APIs')
    it.todo('should be enabled only when from and to params are provided')
  })

  describe('DailyMetrics data structure', () => {
    it.todo('should return correct date field in YYYY-MM-DD format')
    it.todo('should return correct dayOfWeek (1=Monday, 7=Sunday)')
    it.todo('should include all 8 required metrics')
    it.todo('should calculate theoreticalProfit correctly')
  })

  describe('week mode (7 days)', () => {
    it.todo('should return exactly 7 days for week mode')
    it.todo('should fill missing days with zero values')
    it.todo('should sort results by date ascending')
  })

  describe('month mode (28-31 days)', () => {
    it.todo('should return correct number of days for month mode')
    it.todo('should handle months with 28, 29, 30, and 31 days')
    it.todo('should fill all missing days in month range')
  })
})
