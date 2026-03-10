/**
 * MultiSelectDropdown helpers
 * Extracted from MultiSelectDropdown.tsx for file size compliance
 * Story 24.9-FE: Multi-select Brand & Warehouse Filters
 */

/** Filter options based on search query */
export function filterOptions(options: string[], searchQuery: string): string[] {
  if (!searchQuery.trim()) return options
  const query = searchQuery.toLowerCase()
  return options.filter(option => option.toLowerCase().includes(query))
}

/** Get button text based on selection */
export function getButtonText(selected: string[], label: string, placeholder: string): string {
  if (selected.length === 0) return placeholder
  if (selected.length === 1) return selected[0]
  return `${label} (${selected.length})`
}
