/**
 * MSW handlers barrel for NEW-2 Communications.
 * Aggregates the communications query handlers and re-exports mock fixtures.
 */

import { communicationsQueryHandlers } from './communications-queries'

export const communicationsHandlers = [...communicationsQueryHandlers]

export * from './communications-queries'
