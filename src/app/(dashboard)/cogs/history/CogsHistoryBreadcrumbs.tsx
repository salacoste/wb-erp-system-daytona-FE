'use client'

/**
 * Breadcrumb navigation for COGS history page
 * Extracted from cogs-history-utils.tsx (Story 5.1-fe, AC: 3)
 */

import Link from 'next/link'
import { Home, ChevronRight } from 'lucide-react'

interface BreadcrumbsProps {
  productName?: string
}

export function Breadcrumbs({ productName }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      <Link href="/dashboard" className="flex items-center hover:text-foreground">
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link href="/cogs" className="hover:text-foreground">
        COGS
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-foreground">История</span>
      {productName && (
        <>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground truncate max-w-[200px]">{productName}</span>
        </>
      )}
    </nav>
  )
}
