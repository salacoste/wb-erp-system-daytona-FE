/**
 * Unit tests for analytics-events (Epic 37) — coverage added iter-152.
 *
 * Thin mixpanel wrappers: each track* fn maps camelCase params → snake_case event properties + an ISO
 * timestamp. mixpanel is mocked (vi.hoisted spy); tests assert the event name + property mapping.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const { trackMock } = vi.hoisted(() => ({ trackMock: vi.fn() }))
vi.mock('@/lib/mixpanel', () => ({ default: { track: trackMock } }))

import {
  ANALYTICS_EVENTS,
  trackAdvertisingPageView,
  trackToggleMode,
  trackTableSort,
  trackRowClick,
} from '@/lib/analytics-events'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ANALYTICS_EVENTS', () => {
  it('defines the stable event-name constants', () => {
    expect(ANALYTICS_EVENTS.PAGE_VIEW_ADVERTISING).toBe('Page View - Advertising Analytics')
    expect(ANALYTICS_EVENTS.TOGGLE_MODE).toBe('Advertising Analytics - Toggle Mode')
    expect(ANALYTICS_EVENTS.SORT_TABLE).toBe('Advertising Analytics - Sort Table')
    expect(ANALYTICS_EVENTS.ROW_CLICK).toBe('Advertising Analytics - Row Click')
  })
})

describe('track functions map params → snake_case props + timestamp', () => {
  it('trackAdvertisingPageView', () => {
    trackAdvertisingPageView('sku')
    expect(trackMock).toHaveBeenCalledWith(ANALYTICS_EVENTS.PAGE_VIEW_ADVERTISING, {
      view_mode: 'sku',
      timestamp: expect.any(String),
    })
  })

  it('trackToggleMode', () => {
    trackToggleMode({ mode: 'imtId', previousMode: 'sku' })
    expect(trackMock).toHaveBeenCalledWith(ANALYTICS_EVENTS.TOGGLE_MODE, {
      mode: 'imtId',
      previous_mode: 'sku',
      timestamp: expect.any(String),
    })
  })

  it('trackTableSort', () => {
    trackTableSort({ column: 'spend', direction: 'desc', viewMode: 'sku' })
    expect(trackMock).toHaveBeenCalledWith(ANALYTICS_EVENTS.SORT_TABLE, {
      column: 'spend',
      direction: 'desc',
      view_mode: 'sku',
      timestamp: expect.any(String),
    })
  })

  it('trackRowClick (incl. null groupId)', () => {
    trackRowClick({ nmId: 123, groupId: null, isMainProduct: true, viewMode: 'imtId' })
    expect(trackMock).toHaveBeenCalledWith(ANALYTICS_EVENTS.ROW_CLICK, {
      nmId: 123,
      groupId: null,
      is_main_product: true,
      view_mode: 'imtId',
      timestamp: expect.any(String),
    })
  })
})
