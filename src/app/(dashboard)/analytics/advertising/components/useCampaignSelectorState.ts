import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useAdvertisingCampaigns } from '@/hooks/useAdvertisingAnalytics'
import { sortCampaignsByStatus } from '@/lib/campaign-utils'

/**
 * State management hook for CampaignSelector.
 * Extracted for file-size compliance.
 */
export function useCampaignSelectorState(
  selectedIds: number[],
  onSelectionChange: (ids: number[]) => void
) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const isInternalUpdateRef = useRef(false)
  const [tempSelectedIds, setTempSelectedIds] = useState<number[]>(selectedIds)

  const { data, isLoading, error } = useAdvertisingCampaigns()

  useEffect(() => {
    if (!open && !isInternalUpdateRef.current) {
      setTempSelectedIds(selectedIds)
    }
    isInternalUpdateRef.current = false
  }, [selectedIds, open])

  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0)
    }
  }, [open])

  const filteredCampaigns = useMemo(() => {
    if (!data?.data) return []
    let campaigns = data.data
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim()
      campaigns = campaigns.filter(c => c.name.toLowerCase().includes(searchLower))
    }
    return sortCampaignsByStatus(campaigns)
  }, [data?.data, search])

  const toggleCampaign = useCallback((campaignId: number) => {
    setTempSelectedIds(prev =>
      prev.includes(campaignId) ? prev.filter(id => id !== campaignId) : [...prev, campaignId]
    )
  }, [])

  const selectAll = useCallback(() => {
    const visibleIds = filteredCampaigns.map(c => c.campaign_id)
    setTempSelectedIds(prev => [...new Set([...prev, ...visibleIds])])
  }, [filteredCampaigns])

  const clearAll = useCallback(() => {
    setTempSelectedIds([])
    isInternalUpdateRef.current = true
    onSelectionChange([])
  }, [onSelectionChange])

  const buttonLabel = useMemo(() => {
    if (selectedIds.length === 0) return 'Все кампании'
    if (selectedIds.length === 1) {
      const campaign = data?.data?.find(c => c.campaign_id === selectedIds[0])
      return campaign?.name || '1 кампания'
    }
    return `${selectedIds.length} кампаний`
  }, [selectedIds, data?.data])

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        setTempSelectedIds(selectedIds)
      } else {
        isInternalUpdateRef.current = true
        const selectionChanged =
          tempSelectedIds.length !== selectedIds.length ||
          tempSelectedIds.some((id, index) => id !== selectedIds[index])
        if (selectionChanged) onSelectionChange(tempSelectedIds)
      }
      setOpen(newOpen)
    },
    [selectedIds, tempSelectedIds, onSelectionChange]
  )

  return {
    open,
    setOpen,
    search,
    setSearch,
    searchInputRef,
    filteredCampaigns,
    tempSelectedIds,
    isLoading,
    error,
    buttonLabel,
    toggleCampaign,
    selectAll,
    clearAll,
    handleOpenChange,
  }
}
