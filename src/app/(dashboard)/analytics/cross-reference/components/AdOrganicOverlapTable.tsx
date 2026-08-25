'use client'

/**
 * Ad Keyword vs Organic Overlap Table — Feature 3.6
 * Shows search query keywords that also appear in advertising contexts.
 * Uses search orders (groupBy='query') crossed with advertising item data.
 */

import { useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import type { SearchOrderItem } from '@/types/search-analytics'
import type { AdvertisingItem } from '@/types/advertising-analytics'
import { computeKeywordOverlap } from '../utils/ad-search-correlation-utils'
import { fmtNumber } from '../utils/cross-reference-utils'
import { formatPercentage } from '@/lib/utils'

interface AdOrganicOverlapTableProps {
  /** Search order items grouped by query */
  searchQueryItems: SearchOrderItem[]
  /** Advertising items */
  adItems: AdvertisingItem[]
}

/** Extract a pseudo-keyword from advertising item names/campaign data */
function extractAdKeywords(items: AdvertisingItem[]): string[] {
  const keywords: string[] = []
  for (const item of items) {
    if (item.product_name) {
      // Split product name into individual words for overlap analysis
      const words = item.product_name.split(/[\s,;]+/).filter(w => w.length >= 3)
      keywords.push(...words)
    }
  }
  return [...new Set(keywords.map(k => k.toLowerCase()))]
}

/** Extract search queries as keywords */
function extractSearchKeywords(items: SearchOrderItem[]): string[] {
  return items.map(item => String(item.key).toLowerCase().trim()).filter(k => k.length >= 2)
}

export function AdOrganicOverlapTable({ searchQueryItems, adItems }: AdOrganicOverlapTableProps) {
  const analysis = useMemo(() => {
    const searchKeywords = extractSearchKeywords(searchQueryItems)
    const adKeywords = extractAdKeywords(adItems)
    const overlap = computeKeywordOverlap(searchKeywords, adKeywords)

    // Build per-query detail rows
    const rows = searchQueryItems
      .map(item => {
        const query = String(item.key)
        const queryWords = query
          .toLowerCase()
          .split(/[\s,;]+/)
          .filter(w => w.length >= 3)
        const matchingAdKeywords = queryWords.filter(w => adKeywords.includes(w))
        const matchCount = matchingAdKeywords.length
        const overlapPct = queryWords.length > 0 ? (matchCount / queryWords.length) * 100 : 0

        return {
          query,
          totalOrders: item.totalOrders,
          uniqueProducts: item.uniqueProducts ?? 0,
          matchCount,
          overlapPct,
          matchedKeywords: matchingAdKeywords,
        }
      })
      .filter(r => r.matchCount > 0)
      .sort((a, b) => b.overlapPct - a.overlapPct)
      .slice(0, 20)

    return { overlap, rows }
  }, [searchQueryItems, adItems])

  if (analysis.rows.length === 0) return null

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Пересечение поисковых запросов и рекламы</h2>
      <p className="text-sm text-muted-foreground mb-3">
        Запросы из органического поиска, которые пересекаются с рекламными ключевыми словами
      </p>

      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        <span>
          Индекс Жаккара: <strong>{formatPercentage(analysis.overlap.jaccard * 100)}</strong> (
          {fmtNumber(analysis.overlap.intersection.length)} совпадений из{' '}
          {fmtNumber(analysis.overlap.unionSize)})
        </span>
      </div>

      <div className="rounded-md border overflow-auto">
        <Table aria-label="Пересечение поисковых запросов и рекламы">
          <TableHeader>
            <TableRow>
              <TableHead>Поисковый запрос</TableHead>
              <TableHead className="text-right">Заказы</TableHead>
              <TableHead className="text-right">Товаров</TableHead>
              <TableHead className="text-right">Совпадений</TableHead>
              <TableHead className="text-right">Перекрытие</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analysis.rows.map(row => (
              <TableRow key={row.query}>
                <TableCell className="font-medium max-w-[200px] truncate">{row.query}</TableCell>
                <TableCell className="text-right">{fmtNumber(row.totalOrders)}</TableCell>
                <TableCell className="text-right">{fmtNumber(row.uniqueProducts)}</TableCell>
                <TableCell className="text-right">{fmtNumber(row.matchCount)}</TableCell>
                <TableCell className="text-right">
                  <OverlapBadge pct={row.overlapPct} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Story 170.6-FE: overlap chips (thresholds 75/40 frozen) → status /15+/30 triplets.
function OverlapBadge({ pct }: { pct: number }) {
  if (pct >= 75) {
    return (
      <Badge
        variant="outline"
        className="bg-status-error/15 text-status-error border-status-error/30"
      >
        {formatPercentage(pct)}
      </Badge>
    )
  }
  if (pct >= 40) {
    return (
      <Badge
        variant="outline"
        className="bg-status-warning/15 text-status-warning border-status-warning/30"
      >
        {formatPercentage(pct)}
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="bg-status-success/15 text-status-success border-status-success/30"
    >
      {formatPercentage(pct)}
    </Badge>
  )
}
