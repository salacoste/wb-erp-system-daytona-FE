/**
 * Constants for DeliveryDatePicker component
 * Epic 74: File Size Compliance - extracted from DeliveryDatePicker.tsx
 */

import { Package, Layers, Shield } from 'lucide-react'
import type { BoxType } from '@/hooks/useAcceptanceCoefficients'

/** Box type icons mapping */
export const BOX_TYPE_ICONS: Record<BoxType, React.ElementType> = {
  boxes: Package,
  pallets: Layers,
  supersafe: Shield,
}
