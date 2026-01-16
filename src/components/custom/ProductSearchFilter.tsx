'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Filter } from 'lucide-react'

export interface ProductSearchFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  filterLabel: string
  onFilterToggle: () => void
}

/**
 * Search and filter controls for ProductList
 * Extracted from ProductList.tsx for better maintainability
 */
export function ProductSearchFilter({
  searchValue,
  onSearchChange,
  filterLabel,
  onFilterToggle,
}: ProductSearchFilterProps): React.ReactElement {
  return (
    <div className="flex gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Поиск по артикулу или названию..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Button variant="outline" onClick={onFilterToggle}>
        <Filter className="mr-2 h-4 w-4" />
        {filterLabel}
      </Button>
    </div>
  )
}

export default ProductSearchFilter
