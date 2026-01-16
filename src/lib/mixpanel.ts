/**
 * Mixpanel analytics initialization
 * Epic 37: Story 37.5 - Analytics tracking for Advertising Analytics
 * @see docs/stories/epic-37/QA-HANDOFF-PHASE-2.md#task-5-mixpanel-analytics-integration
 */

import mixpanel, { type Config } from 'mixpanel-browser'

// Initialize only if token is available
const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || ''
const IS_ENABLED = Boolean(MIXPANEL_TOKEN) && typeof window !== 'undefined'

if (IS_ENABLED) {
  const config: Partial<Config> = {
    debug: process.env.NODE_ENV === 'development',
    track_pageview: false, // We track page views manually for more control
    persistence: 'localStorage',
    ignore_dnt: false, // Respect Do Not Track browser setting
  }

  mixpanel.init(MIXPANEL_TOKEN, config)
}

/**
 * Safe mixpanel instance that no-ops when disabled
 * Allows code to call tracking methods without checking if mixpanel is enabled
 */
export const analytics = {
  /**
   * Track an event with optional properties
   */
  track: (eventName: string, properties?: Record<string, unknown>): void => {
    if (IS_ENABLED) {
      mixpanel.track(eventName, properties)
    } else if (process.env.NODE_ENV === 'development') {
      // Log to console in dev when mixpanel is not configured
      console.debug('[Analytics]', eventName, properties)
    }
  },

  /**
   * Identify a user (call after login)
   */
  identify: (userId: string): void => {
    if (IS_ENABLED) {
      mixpanel.identify(userId)
    }
  },

  /**
   * Set user properties
   */
  setUserProperties: (properties: Record<string, unknown>): void => {
    if (IS_ENABLED) {
      mixpanel.people.set(properties)
    }
  },

  /**
   * Reset user identity (call on logout)
   */
  reset: (): void => {
    if (IS_ENABLED) {
      mixpanel.reset()
    }
  },

  /**
   * Check if analytics is enabled
   */
  isEnabled: (): boolean => IS_ENABLED,
}

export default analytics
