'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TrendingUp } from 'lucide-react'

/** Navigation links to other analytics breakdown pages */
export function MarginNavLinks() {
  return (
    <div className="flex gap-2">
      <Link href="/analytics/sku">
        <Button variant="outline" size="sm">
          <TrendingUp className="mr-2 h-4 w-4" />
          По SKU
        </Button>
      </Link>
      <Link href="/analytics/brand">
        <Button variant="outline" size="sm">
          <TrendingUp className="mr-2 h-4 w-4" />
          По брендам
        </Button>
      </Link>
      <Link href="/analytics/category">
        <Button variant="outline" size="sm">
          <TrendingUp className="mr-2 h-4 w-4" />
          По категориям
        </Button>
      </Link>
    </div>
  )
}
