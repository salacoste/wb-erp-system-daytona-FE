/**
 * MergedGroupTable Component - Epic 37: Merged Group Table Display
 *
 * Displays advertising analytics for merged product groups (склейки) with:
 * - Tier 1: Rowspan cell showing group indicator
 * - Tier 2: Aggregate row with group-level metrics (bold, gray background)
 * - Tier 3: Detail rows showing individual product metrics
 *
 * Split into sub-components for file size compliance (Epic 74):
 * - MergedGroupTableHeader.tsx: Sortable column headers with ROAS tooltip
 * - MergedGroupRows.tsx: 3-tier row structure + organic value rendering
 *
 * @see Story 37.2: MergedGroupTable Component
 * @see Story 37.3: Aggregate Metrics Display
 * @see docs/epics/epic-37-merged-group-table-display.md
 */

import { AdvertisingGroup } from '@/types/advertising-analytics'
import { TableCaption } from '@/components/ui/table'
import { MergedGroupTableHeader } from './MergedGroupTableHeader'
import { MergedGroupRows } from './MergedGroupRows'

// ============================================================================
// Types
// ============================================================================

/** Sortable field types for column headers */
export type SortField = 'totalSales' | 'totalRevenue' | 'organicSales' | 'totalSpend' | 'roas'

/** Component props interface */
export interface MergedGroupTableProps {
  /** Array of merged groups with aggregate + individual metrics */
  groups: AdvertisingGroup[]

  /** Current sort configuration */
  sortConfig?: {
    field: SortField
    direction: 'asc' | 'desc'
  }

  /** Callback when user clicks column header to sort */
  onSort?: (field: SortField) => void

  /** Callback when user clicks on a product row */
  onProductClick?: (nmId: number) => void
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * MergedGroupTable - Displays advertising analytics for merged product groups
 *
 * Features:
 * - 3-tier rowspan structure (склейка indicator, aggregate row, detail rows)
 * - Sortable column headers
 * - Responsive design with horizontal scroll on mobile
 * - Crown icon marks main products
 * - Epic 35 integration (totalSales, organicSales, organicContribution)
 * - Story 73.6: Negative organicSales shown with over-attribution warning
 *
 * @example
 * ```tsx
 * <MergedGroupTable
 *   groups={mergedGroups}
 *   sortConfig={{ field: 'roas', direction: 'desc' }}
 *   onSort={handleSort}
 *   onProductClick={handleProductClick}
 * />
 * ```
 */
export function MergedGroupTable({
  groups,
  sortConfig,
  onSort,
  onProductClick,
}: MergedGroupTableProps) {
  return (
    // Story 37.4 AC 18-20, 25: Responsive wrapper with sticky columns on tablet/mobile.
    // Story 170.1: scrollbar/bg palette → tokens; scroll-region + visible TableCaption
    // (169.7 picker-semantic canon — period comes from the URL-synced filter above).
    <div
      className="overflow-x-auto md:overflow-x-visible scrollbar-thin scrollbar-thumb-border scrollbar-track-muted"
      role="region"
      aria-label="Таблица склеек — горизонтальная прокрутка"
      tabIndex={0}
    >
      <table className="min-w-full border-collapse bg-background shadow-sm rounded-lg text-sm md:text-base">
        <TableCaption>Таблица рекламной аналитики по склейкам товаров</TableCaption>
        <MergedGroupTableHeader sortConfig={sortConfig} onSort={onSort} />
        <tbody>
          {groups.map(group => (
            <MergedGroupRows
              key={group.imtId ?? `standalone-${group.mainProduct.nmId}`}
              group={group}
              onProductClick={onProductClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
