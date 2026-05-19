'use client'

/**
 * ExportCsvButton — triggers a CSV file download from a pre-built CSV string.
 * Side-effect logic (Blob + URL + anchor click) lives here, NOT in pure helpers.
 * WCAG: button has aria-label + visible text + Download icon.
 * Story 110.5-FE Task 4.
 */

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExportCsvButtonProps {
  csvContent: string
  fileName: string
  label?: string
  disabled?: boolean
}

/** UTF-8 BOM character prepended by pure helpers for Excel UTF-8 detection. */
const BOM = '﻿'

/**
 * Returns true when the CSV has no data rows (only headers or completely empty).
 * Pure helpers always emit BOM + headerRow at minimum — literal-BOM-only never
 * occurs in practice, so we detect the realistic "headers-only" state instead.
 * CRLF separates rows per RFC 4180; a single-element join produces no CRLF.
 */
function isCsvEmpty(csvContent: string): boolean {
  const withoutBom = csvContent.startsWith(BOM) ? csvContent.slice(1) : csvContent
  const lines = withoutBom.split('\r\n').filter(line => line.length > 0)
  // 0 lines = completely empty; 1 line = headers only — both mean no data rows
  return lines.length <= 1
}

export function ExportCsvButton({
  csvContent,
  fileName,
  label = 'Скачать CSV',
  disabled = false,
}: ExportCsvButtonProps) {
  const isDisabled = disabled || isCsvEmpty(csvContent)

  function handleClick() {
    if (isDisabled) return
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={label}
    >
      <Download className="h-4 w-4 mr-2" aria-hidden="true" />
      {label}
    </Button>
  )
}
