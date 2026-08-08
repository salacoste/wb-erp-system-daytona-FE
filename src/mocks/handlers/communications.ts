/**
 * MSW handlers barrel for NEW-2 Communications.
 * Aggregates the communications query handlers (read PR1) + the gated write-back
 * handlers (PR2) and re-exports mock fixtures.
 */

import { communicationsQueryHandlers } from './communications-queries'
import { communicationsWritebackHandlers } from './communications-writeback'

export const communicationsHandlers = [
  ...communicationsQueryHandlers,
  ...communicationsWritebackHandlers,
]

export * from './communications-queries'
export * from './communications-writeback'
