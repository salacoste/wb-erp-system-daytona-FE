/**
 * MSW handlers barrel for NEW-7 Finances.
 * Aggregates the finances query handlers and re-exports mock fixtures.
 */

import { financesQueryHandlers } from './finances-queries'

export const financesHandlers = [...financesQueryHandlers]

export * from './finances-queries'
