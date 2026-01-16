/**
 * MSW Server for Node.js (Test Environment)
 *
 * This server is used for unit and integration tests with Vitest.
 * For browser-based testing, use browser.ts instead.
 *
 * Reference: https://mswjs.io/docs/integrations/node
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW Server instance for Node.js tests
 *
 * Usage in tests:
 * ```ts
 * import { server } from '@/mocks/server';
 *
 * beforeAll(() => server.listen());
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 * ```
 */
export const server = setupServer(...handlers);
