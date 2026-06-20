'use client'

import { useEffect, useState } from 'react'

export function useDelayedLoadingState(isLoading: boolean, delayMs = 5_000): boolean {
  const [isDelayed, setIsDelayed] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setIsDelayed(false)
      return undefined
    }

    const timer = window.setTimeout(() => setIsDelayed(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs, isLoading])

  return isDelayed
}
