/**
 * Unified Product Analytics empty-shape fixtures — Story 120.5-FE (Pattern 3).
 *
 * Pattern 3 (CLAUDE.md § Multi-Source Orchestration): Story-1 fixture seeding for
 * new domains, to avoid the retroactive-extraction tax (Story 92.6-FE precedent).
 * Mirrors src/test/fixtures/funnel-empty.ts (Story 119.2-FE) +
 * src/test/fixtures/search-empty.ts (Story 119.1-FE).
 *
 * Deliberately minimal: the per-section data contract will be defined VERIFY-FIRST
 * by Story 120.6-FE against the live /unified response (Request #177 RESOLVED
 * 2026-06-02). This fixture seeds the shell's opaque-identifier shape only; 120.6
 * extends it with the real empty-state for funnel/advertising/organic/overview
 * sections once the response is verified.
 */

import type { UnifiedProductShell } from '@/types/unified-product'

/** Empty product shell for a given nmId (defaults to a representative opaque id). */
export function emptyUnifiedProduct(overrides?: Partial<UnifiedProductShell>): UnifiedProductShell {
  return {
    nmId: '887604577',
    ...overrides,
  }
}
