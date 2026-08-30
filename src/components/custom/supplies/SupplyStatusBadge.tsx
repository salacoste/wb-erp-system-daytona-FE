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
  HelpCircle,
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
    color: 'text-status-information',
    bgColor: 'bg-status-information/10',
    borderColor: 'border-status-information/40',
    Icon: PackageOpen,
  },
  CLOSED: {
    label: 'Закрыта',
    color: 'text-status-warning-foreground' /* WCAG: solid pair — tint was 4.06:1 @12px */,
    bgColor: 'bg-status-warning',
    borderColor: 'border-status-warning/40',
    Icon: PackageCheck,
  },
  DELIVERING: {
    label: 'В пути',
    color: 'text-status-pending',
    bgColor: 'bg-status-pending/10',
    borderColor: 'border-status-pending/40',
    Icon: Truck,
  },
  DELIVERED: {
    label: 'Доставлена',
    color: 'text-status-success',
    bgColor: 'bg-status-success/10',
    borderColor: 'border-status-success/40',
    Icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Отменена',
    color: 'text-status-error',
    bgColor: 'bg-status-error/10',
    borderColor: 'border-status-error/40',
    Icon: XCircle,
  },
}

// Neutral fallback for an unrecognized/out-of-enum status (e.g. a future WB status, or the
// normalizer's 'unknown' sentinel). Status-honesty: an unknown lifecycle state must NOT
// masquerade as the blue "Открыта" (OPEN, implies editable) — show a gray "Неизвестно".
const FALLBACK_CONFIG = {
  label: 'Неизвестно',
  color: 'text-muted-foreground',
  bgColor: 'bg-muted/50',
  borderColor: 'border-border',
  Icon: HelpCircle,
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
  const config = STATUS_CONFIG[status] ?? FALLBACK_CONFIG
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
      data-testid="supply-status-badge"
      aria-label={`Статус поставки: ${label}`}
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
