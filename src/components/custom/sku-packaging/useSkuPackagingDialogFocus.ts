'use client'

import { useRef, type RefObject } from 'react'

function focusTarget(target: HTMLElement | null | undefined) {
  window.setTimeout(() => {
    if (target?.isConnected && !target.matches(':disabled, [aria-disabled="true"]')) target.focus()
  }, 0)
}

export function useSkuPackagingDialogFocus(
  returnFocusRef?: RefObject<HTMLButtonElement | null>,
  successFocusRef?: RefObject<HTMLElement | null>
) {
  const focusSuccessRef = useRef(false)

  return {
    resetSuccessFocus: () => {
      focusSuccessRef.current = false
    },
    markSuccessFocus: () => {
      focusSuccessRef.current = true
    },
    handleCloseAutoFocus: (event: Event) => {
      event.preventDefault()
      focusTarget(
        focusSuccessRef.current
          ? successFocusRef?.current
          : (returnFocusRef?.current ?? successFocusRef?.current)
      )
      focusSuccessRef.current = false
    },
  }
}
