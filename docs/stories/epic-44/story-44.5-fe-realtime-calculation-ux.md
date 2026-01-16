# Story 44.5: Real-time Calculation & UX Enhancements

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: Draft
**Priority**: P1 - HIGH
**Effort**: 2 SP
**Depends On**: Stories 44.1, 44.2, 44.3, 44.4 ✅

---

## User Story

**As a** Seller,
**I want** to see the price update automatically as I adjust values,
**So that** I can quickly explore different scenarios without clicking calculate repeatedly.

**Non-goals**:
- Core components (separate stories)
- Backend API changes

---

## Acceptance Criteria

### AC1: Debounced Auto-calculation
- [ ] Trigger API call 500ms after any input change
- [ ] Cancel pending request if new value entered
- [ ] Show "Calculating..." indicator during API call
- [ ] Display "Updated" flash when result returns

### AC2: Loading States
- [ ] Spinner or skeleton on results during calculation
- [ ] Disable "Calculate" button during loading
- [ ] Show previous results with opacity reduced during loading
- [ ] Progressive loading: show price first, then breakdown

### AC3: Error Handling
- [ ] Display inline error message for validation errors (400)
- [ ] Show auth error with link to login for 401
- [ ] Show cabinet error with link to cabinet selection for 403
- [ ] Show retry option for network errors
- [ ] Rate limit message with countdown for 429

### AC4: Backend Warnings Display
- [ ] Display warning banner if backend returns warnings array
- [ ] Warning type: yellow/amber color
- [ ] Warnings dismissible with X button
- [ ] Multiple warnings stacked if present

### AC5: Reset Functionality
- [ ] "Reset" button clears all inputs to defaults
- [ ] Clear results when reset clicked
- [ ] Confirm dialog if results exist and user tries to reset
- [ ] Keyboard shortcut: Esc to reset

---

## Context & References

- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Story 44.1**: `docs/stories/epic-44/story-44.1-fe-types-api-client.md`
- **Story 44.2**: `docs/stories/epic-44/story-44.2-fe-input-form-component.md`
- **Error Reference**: `docs/request-backend/95-epic-43-price-calculator-api.md`

---

## Implementation Notes

### File Structure

```
src/
├── hooks/
│   └── usePriceCalculator.ts              # UPDATE - Add debouncing
├── components/
│   └── custom/
│       └── price-calculator/
│           ├── PriceCalculatorForm.tsx    # UPDATE - Add auto-calculate
│           ├── LoadingState.tsx           # CREATE - Loading indicator
│           ├── ErrorMessage.tsx           # CREATE - Error display
│           └── WarningsBanner.tsx         # CREATE - Backend warnings
```

### Debounce Implementation

```typescript
// src/hooks/usePriceCalculator.ts (updated)
import { useState, useCallback, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce'; // or implement custom

export function usePriceCalculator() {
  // ... existing state
  const abortControllerRef = useRef<AbortController | null>(null);

  const calculateDebounced = useDebouncedCallback(
    async (request: PriceCalculatorRequest) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const result = await calculatePrice(
          request,
          cabinetId,
          token,
          abortControllerRef.current.signal
        );
        setData(result);
        showUpdatedFlash();
      } catch (e) {
        if (e.name !== 'AbortError') {
          setError(e as PriceCalculatorError);
        }
      } finally {
        setLoading(false);
      }
    },
    500 // 500ms debounce
  );

  return { data, loading, error, calculate: calculateDebounced };
}
```

### Error Message Components

```typescript
// src/components/custom/price-calculator/ErrorMessage.tsx
interface ErrorMessageProps {
  error: PriceCalculatorError;
  onRetry?: () => void;
}

const ERROR_MESSAGES = {
  VALIDATION_ERROR: {
    title: 'Invalid input',
    message: 'Please check your input values and try again.',
    variant: 'warning',
  },
  UNAUTHORIZED: {
    title: 'Not authenticated',
    message: 'Please log in to use the Price Calculator.',
    action: { label: 'Go to Login', href: '/login' },
    variant: 'error',
  },
  FORBIDDEN: {
    title: 'Cabinet access denied',
    message: 'Please select a valid cabinet to continue.',
    action: { label: 'Select Cabinet', href: '/cabinets' },
    variant: 'error',
  },
  RATE_LIMITED: {
    title: 'Too many requests',
    message: 'Please wait a moment before trying again.',
    variant: 'warning',
  },
  NETWORK_ERROR: {
    title: 'Connection error',
    message: 'Could not reach the server. Please check your connection.',
    action: { label: 'Retry', onClick: true },
    variant: 'error',
  },
};
```

### Backend Warnings Display

```typescript
// src/components/custom/price-calculator/WarningsBanner.tsx
interface WarningsBannerProps {
  warnings: string[];
  onDismiss: () => void;
}

export function WarningsBanner({ warnings, onDismiss }: WarningsBannerProps) {
  if (warnings.length === 0) return null;

  return (
    <Alert variant="warning" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Warning{warnings.length > 1 ? 's' : ''}</AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1">
          {warnings.map((warning, i) => (
            <li key={i}>{warning}</li>
          ))}
        </ul>
      </AlertDescription>
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        aria-label="Dismiss warnings"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
}
```

### Reset Confirmation Dialog

```typescript
// Reset with confirmation if results exist
const handleReset = () => {
  if (data) {
    // Show confirmation dialog
    setShowResetConfirm(true);
  } else {
    resetForm();
  }
};
```

### Invariants & Edge Cases
- **Invariant**: Only one active API request at a time
- **Edge case**: Rapid input changes - debounce prevents excessive calls
- **Edge case**: User leaves page during calculation - abort request

---

## Observability

- **Analytics**: Track error types and frequency
- **Metrics**: Average time from input change to result display

---

## Security

- **Abort on Unmount**: Cancel pending requests when component unmounts
- **Signal Propagation**: Pass AbortSignal to fetch for proper cancellation

---

## Accessibility (WCAG 2.1 AA)

- [ ] Error messages announced to screen readers (role="alert")
- [ ] Loading states have aria-live="polite"
- [ ] Reset confirmation has aria-describedby
- [ ] Focus management after error dismissal

---

## Dev Agent Record

### File List
| File | Change Type | Description |
|------|-------------|-------------|
| `src/hooks/usePriceCalculator.ts` | UPDATE | Add debouncing, abort |
| `src/components/custom/price-calculator/ErrorMessage.tsx` | CREATE | Error display |
| `src/components/custom/price-calculator/WarningsBanner.tsx` | CREATE | Backend warnings |
| `src/components/custom/price-calculator/LoadingState.tsx` | CREATE | Loading indicator |

### Change Log
1. Implemented debounced auto-calculation
2. Added comprehensive error handling
3. Added backend warnings display
4. Added reset with confirmation

---

## QA Results

**Reviewer**: TBD
**Date**: TBD
**Gate Decision**: ⏳ PENDING

### AC Verification
| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | Debounced auto-calculation | ⏳ |  |
| AC2 | Loading states | ⏳ |  |
| AC3 | Error handling | ⏳ |  |
| AC4 | Backend warnings | ⏳ |  |
| AC5 | Reset functionality | ⏳ |  |

### Error Scenario Testing
| Scenario | Expected Behavior | Status |
|----------|------------------|--------|
| Invalid input (negative) | Validation error | ⏳ |
| Not authenticated | Redirect to login | ⏳ |
| No cabinet selected | Error with cabinet link | ⏳ |
| Rate limited | Warning with retry info | ⏳ |
| Network timeout | Retry option | ⏳ |
