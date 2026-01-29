/**
 * Create Supply Button Component
 * Story 53.3-FE: Create Supply Flow
 * Epic 53-FE: Supply Management UI
 *
 * Button that opens the Create Supply Modal.
 * Used in the Supplies List page header.
 */

'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateSupplyModal } from './CreateSupplyModal'

export interface CreateSupplyButtonProps {
  /** Whether the button is disabled */
  disabled?: boolean
}

/**
 * Button that triggers the Create Supply modal
 *
 * @example
 * <CreateSupplyButton />
 * <CreateSupplyButton disabled={isLoading} />
 */
export function CreateSupplyButton({ disabled = false }: CreateSupplyButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} disabled={disabled}>
        <Plus className="mr-2 h-4 w-4" />
        Создать поставку
      </Button>
      <CreateSupplyModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  )
}
