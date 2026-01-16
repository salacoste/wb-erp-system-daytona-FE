'use client'

import { useRef, useCallback } from 'react'
import { TableHead } from '@/components/ui/table'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResizableTableHeadProps {
  children: React.ReactNode
  columnKey: string
  width: number
  onResize: (columnKey: string, newWidth: number) => void
  className?: string
  isLast?: boolean
}

/**
 * Resizable table header cell
 * Drag the right edge to resize column width
 */
export function ResizableTableHead({
  children,
  columnKey,
  width,
  onResize,
  className,
  isLast = false,
}: ResizableTableHeadProps) {
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)
  const isDraggingRef = useRef(false)

  // Use refs for stable callback references
  const widthRef = useRef(width)
  const onResizeRef = useRef(onResize)
  const columnKeyRef = useRef(columnKey)

  // Keep refs updated
  widthRef.current = width
  onResizeRef.current = onResize
  columnKeyRef.current = columnKey

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    isDraggingRef.current = true
    startXRef.current = e.clientX
    startWidthRef.current = widthRef.current

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return
      const delta = moveEvent.clientX - startXRef.current
      const newWidth = startWidthRef.current + delta
      onResizeRef.current(columnKeyRef.current, newWidth)
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  return (
    <TableHead
      className={cn('relative select-none overflow-visible', className)}
      style={{ width: `${width}px`, minWidth: `${width}px` }}
    >
      <div className="flex items-center gap-1">
        <span className="flex-1 truncate">{children}</span>
        {!isLast && (
          <div
            className="cursor-col-resize flex items-center justify-center px-1 py-1 -my-1 rounded hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0 text-gray-400 hover:text-gray-600"
            onMouseDown={handleMouseDown}
            onTouchStart={(e) => {
              const touch = e.touches[0]
              handleMouseDown({
                preventDefault: () => e.preventDefault(),
                stopPropagation: () => e.stopPropagation(),
                clientX: touch.clientX
              } as React.MouseEvent)
            }}
            title="Перетащите для изменения ширины"
            role="separator"
            aria-orientation="vertical"
          >
            <GripVertical className="w-4 h-4 pointer-events-none" />
          </div>
        )}
      </div>
    </TableHead>
  )
}
