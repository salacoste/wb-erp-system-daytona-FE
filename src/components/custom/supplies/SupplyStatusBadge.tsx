'use client'

/**
 * SupplyStatusBadge Component
 * Story 53.2-FE: Supplies List Page
 * Epic 53-FE: Supply Management UI
 *
 * Displays supply status with appropriate color and icon.
 */

import {
  PackageOpen,
  PackageCheck,
  Truck,
  CheckCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SupplyStatus } from '@/types/supplies'

// Status configuration with colors and icons
const STATUS_CONFIG: Record<
  SupplyStatus,
  {
    label: string
    color: string
    bgColor: string
    borderColor: string
    Icon: LucideIcon
  }
> = {
  OPEN: {
    label: 'Открыта',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    Icon: PackageOpen,
  },
  CLOSED: {
    label: 'Закрыта',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    Icon: PackageCheck,
  },
  DELIVERING: {
    label: 'В пути',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    Icon: Truck,
  },
  DELIVERED: {
    label: 'Доставлена',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    Icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Отменена',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    Icon: XCircle,
  },
}

interface SupplyStatusBadgeProps {
  status: SupplyStatus
  size?: 'sm' | 'default' | 'lg'
  showIcon?: boolean
  className?: string
}

/**
 * Badge component displaying supply status
 *
 * @example
 * <SupplyStatusBadge status="OPEN" />
 * <SupplyStatusBadge status="DELIVERING" size="lg" />
 */
export function SupplyStatusBadge({
  status,
  size = 'default',
  showIcon = true,
  className,
}: SupplyStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.OPEN
  const { label, color, bgColor, borderColor, Icon } = config

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border',
        bgColor,
        color,
        borderColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} aria-hidden="true" />}
      <span>{label}</span>
    </Badge>
  )
}
