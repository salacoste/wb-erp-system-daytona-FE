# General Frontend Reference

This section contains general frontend integration analysis and architecture documentation that applies across all pages.

## Key Documents

### [General Frontend Integration Analysis](../GENERAL-FRONTEND-INTEGRATION-ANALYSIS.md)
Overall frontend architecture, integration patterns, and system design.

**Contents:**
- Frontend architecture overview
- Integration patterns with backend
- State management strategy
- API client configuration
- Authentication flow
- Error handling patterns
- Testing strategy

### [Backend Integration Analysis](../BACKEND-INTEGRATION-ANALYSIS.md)
Backend API integration details and patterns.

**Contents:**
- API endpoint structure
- Request/response formats
- Authentication headers
- Error handling
- Rate limiting
- Pagination patterns

## Cross-Page Topics

### State Management
- **TanStack Query v5** - Server state management
- **Zustand** - Client state (auth, margin polling)
- **React Context** - Period context, theme context

### API Client
- **Location:** `src/lib/api-client.ts`
- **Features:**
  - Auto-injects `Authorization: Bearer {token}`
  - Auto-injects `X-Cabinet-Id: {cabinetId}`
  - Auto-unwraps `{ data: ... }` responses
  - Centralized error handling

### Authentication
- **JWT Tokens** - Access and refresh token flow
- **Cabinet Context** - Multi-tenancy support
- **Role-Based Access** - Owner, Manager, Analyst, Service

### Formatters
All formatters use Russian locale (`ru-RU`):

```typescript
formatCurrency(1234567.89)  // "1 234 567,89 ₽"
formatPercentage(15.5)      // "15,5 %"
formatDate(date)            // "20.01.2025"
formatIsoWeek(date)         // "2025-W03"
```

### Date/Time Handling
- **Timezone:** `Europe/Moscow`
- **Week Format:** ISO week `YYYY-Www`
- **Week Start:** Monday
- **Date-fns** - Date manipulation library

### Testing
- **Unit Tests:** Vitest
- **E2E Tests:** Playwright
- **Coverage Goal:** 60%+ unit, 10%+ E2E

## Common Patterns

### Data Fetching Pattern
```typescript
export function useFeature(params) {
  return useQuery({
    queryKey: featureQueryKeys.byId(params),
    queryFn: () => getFeature(params),
    enabled: !!params,
  })
}
```

### Mutation Pattern
```typescript
const mutation = useMutation({
  mutationFn: (data) => createItem(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: featureQueryKeys.all() })
  },
})
```

### Error Handling Pattern
```typescript
try {
  await mutation.mutateAsync(data)
  toast.success('Success message')
} catch (error) {
  toast.error(getErrorMessage(error))
}
```

## Design System

### Colors
- Primary Red: `#E53935`
- Green: `#22C55E` (positive)
- Red: `#EF4444` (negative)
- Blue: `#3B82F6` (information)
- Yellow: `#F59E0B` (warning)

### Typography
- H1: 32px, bold
- H2: 24px, semi-bold
- Body: 14-16px, regular

### Spacing
- Base unit: 4px
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96

## Performance Targets

| Metric | Target |
|--------|--------|
| Initial page load | <3s |
| Time to interactive | <5s |
| Dashboard data load | <2s |
| API response (p95) | <500ms |
| Error rate | <1% |

## Accessibility (WCAG 2.1 AA)

- Color contrast ≥4.5:1 for normal text
- Keyboard navigation for all interactive elements
- Alt text for all images
- Labels for all form inputs
- ARIA labels where needed
- Visible focus indicators

## Related Documentation

- [API Integration Guide](../api-integration-guide.md) - Complete endpoint catalog
- [Frontend Spec](../front-end-spec.md) - Design system and UI/UX guidelines
- [Architecture](../front-end-architecture.md) - Technical architecture
- [Epic Tracker](../EPICS-AND-STORIES-TRACKER.md) - Project status

---

**Last Updated:** 2026-01-30
