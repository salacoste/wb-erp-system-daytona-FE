'use client'

import { useRef, type RefObject } from 'react'

export function useBoxTypeDialogFocus(
  returnFocusRef?: RefObject<HTMLButtonElement | null>,
  successFocusRef?: RefObject<HTMLElement | null>
) {
  const useSuccessFocusRef = useRef(false)

  function resetSuccessFocus() {
    useSuccessFocusRef.current = false
  }

  function markSuccessFocus(useFallback = true) {
    useSuccessFocusRef.current = useFallback
  }

  function handleCloseAutoFocus(event: Event) {
    const requestedTarget = useSuccessFocusRef.current
      ? successFocusRef?.current
      : returnFocusRef?.current
    const target = canReceiveFocus(requestedTarget) ? requestedTarget : successFocusRef?.current
    if (!target) return

    event.preventDefault()
    target.focus()
    resetSuccessFocus()
  }

  return { handleCloseAutoFocus, markSuccessFocus, resetSuccessFocus }
}

function canReceiveFocus(target: HTMLElement | null | undefined): target is HTMLElement {
  if (!target?.isConnected) return false

  let current: HTMLElement | null = target
  while (current) {
    const style = window.getComputedStyle(current)
    if (style.display === 'none' || style.visibility === 'hidden') return false
    current = current.parentElement
  }

  return true
}
