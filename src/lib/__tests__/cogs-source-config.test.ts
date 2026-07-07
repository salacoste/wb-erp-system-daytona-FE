/**
 * COGS_SOURCE_CONFIG — single source of truth for source → {icon, label} (BD-13 DRY).
 * Exhaustiveness is compile-checked via `Record<CogsSource, …>`; this test pins the runtime
 * values so a future source can't silently regress.
 */
import { describe, it, expect } from 'vitest'
import { COGS_SOURCE_CONFIG } from '../cogs-source-config'

describe('COGS_SOURCE_CONFIG — BD-13 DRY single source of truth', () => {
  it('provides an icon + label for every CogsSource (incl. moysklad)', () => {
    expect(COGS_SOURCE_CONFIG.manual).toEqual({ icon: '✏️', label: 'Ручной ввод' })
    expect(COGS_SOURCE_CONFIG.import).toEqual({ icon: '📥', label: 'Импорт из файла' })
    expect(COGS_SOURCE_CONFIG.system).toEqual({ icon: '⚙️', label: 'Системный пересчёт' })
    expect(COGS_SOURCE_CONFIG.moysklad).toEqual({ icon: '🔄', label: 'Синхронизация с МойСклад' })
  })
})
