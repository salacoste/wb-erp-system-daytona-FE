# Story 44.12: Warehouse Selection Dropdown

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: 🔒 Blocked (Backend)
**Priority**: P1 - IMPORTANT
**Effort**: 2 SP
**Depends On**: Request #98 (Pending Backend Response)

---

## User Story

**As a** Seller,
**I want** to select a WB warehouse from a searchable dropdown in the price calculator,
**So that** I can get accurate logistics costs and coefficients specific to the warehouse where I plan to ship my products.

**Non-goals**:
- Automatic warehouse recommendation based on product location
- Warehouse availability/capacity indicators
- Real-time warehouse status updates
- Warehouse comparison functionality
- Map-based warehouse selection (future enhancement)

---

## Background: WB Warehouses

Wildberries operates 30+ warehouses across Russia, each with:

### Warehouse Properties
- **Name**: Official warehouse name (e.g., "Коледино", "Казань")
- **City**: Location city
- **Federal District (ФО)**: Regional grouping for tariff calculation
- **Cargo Types**: Supported cargo categories (MGT, SGT, KGT)

### Federal Districts (Федеральные округа)
| Code | Name (RU) | Warehouses (Examples) |
|------|-----------|----------------------|
| ЦФО | Центральный ФО | Коледино, Тверь, Электросталь |
| ПФО | Приволжский ФО | Казань, Самара, Нижний Новгород |
| ЮФО | Южный ФО | Краснодар, Ростов |
| СФО | Сибирский ФО | Новосибирск, Красноярск |
| УФО | Уральский ФО | Екатеринбург |
| СЗФО | Северо-Западный ФО | Санкт-Петербург |
| ДФО | Дальневосточный ФО | Хабаровск |

### Cargo Types
- **MGT (Мелкогабаритный товар)**: Small items, < 60cm any side
- **SGT (Среднегабаритный товар)**: Medium items, 60-120cm any side
- **KGT (Крупногабаритный товар)**: Large items, > 120cm any side

---

## Acceptance Criteria

### AC1: Warehouse Dropdown Component
- [ ] Create dropdown component "Склад отгрузки" (Shipment warehouse)
- [ ] Display warehouse name as primary text
- [ ] Display federal district as secondary text (gray, smaller font)
- [ ] Placeholder: "Выберите склад" (Select warehouse)
- [ ] Support keyboard navigation (arrow keys, Enter, Escape)

### AC2: Grouped by Region
- [ ] Group warehouses by `federal_district`
- [ ] Display group headers for each federal district
- [ ] Group headers styled distinctly (bold, background color)
- [ ] Collapse/expand groups NOT required (flat list with headers)
- [ ] Sort groups alphabetically by ФО name
- [ ] Sort warehouses alphabetically within each group

### AC3: Search/Filter Functionality
- [ ] Search input field at top of dropdown
- [ ] Filter by warehouse name (partial match)
- [ ] Filter by city name (partial match)
- [ ] Filter by federal district name (partial match)
- [ ] Case-insensitive search
- [ ] Highlight matching text in results
- [ ] Empty state: "Склады не найдены" (No warehouses found)

### AC4: Form State Integration
- [ ] Store selected warehouse ID in form state
- [ ] Store selected warehouse name for display
- [ ] On selection, trigger downstream coefficient updates (Story 44.13)
- [ ] Clear selection on form reset
- [ ] Preserve selection on form field changes

### AC5: Tooltip with Warehouse Details
- [ ] Show tooltip on hover (desktop) / long press (mobile)
- [ ] Tooltip content:
  - City (Город)
  - Supported cargo types (Типы груза: MGT, SGT, KGT)
  - Coordinates (optional, if available)
- [ ] Tooltip appears after 500ms delay
- [ ] Tooltip positioned to avoid viewport overflow

---

## Context & References

- **Backend Request**: `docs/request-backend/98-warehouses-tariffs-coefficients-api.md`
- **Backend Response Draft**: `docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE-DRAFT.md`
- **SDK Reference**: [`SDK-WAREHOUSES-TARIFFS-REFERENCE.md`](./SDK-WAREHOUSES-TARIFFS-REFERENCE.md) — Full SDK types, transformations, formulas
- **Implementation Roadmap**: [`PHASE-3-IMPLEMENTATION-ROADMAP.md`](./PHASE-3-IMPLEMENTATION-ROADMAP.md)
- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Story 44.9**: `docs/stories/epic-44/story-44.9-fe-logistics-coefficients-ui.md` (coefficient inputs)
- **Story 44.13**: Downstream story for auto-fill coefficients (depends on this story)
- **Current Form**: `src/components/custom/price-calculator/PriceCalculatorForm.tsx`

---

## Implementation Notes

### API Contract (Pending Backend)

**Endpoint**: `GET /v1/tariffs/warehouses`

**Response** (expected):
```json
{
  "data": {
    "warehouses": [
      {
        "id": 1,
        "name": "Коледино",
        "city": "Подольск",
        "federal_district": "Центральный ФО",
        "cargo_types": ["MGT", "KGT"],
        "coordinates": {
          "lat": 55.3897,
          "lon": 37.5674
        }
      }
    ],
    "updated_at": "2026-01-19T10:00:00Z"
  }
}
```

### File Structure

```
src/
├── components/
│   └── custom/
│       └── price-calculator/
│           ├── PriceCalculatorForm.tsx           # UPDATE - Add warehouse dropdown
│           └── WarehouseSelector.tsx             # CREATE - New dropdown component
├── lib/
│   └── api/
│       └── warehouses.ts                         # CREATE - API client for warehouses
├── hooks/
│   └── useWarehouses.ts                          # CREATE - TanStack Query hook
├── types/
│   └── warehouse.ts                              # CREATE - TypeScript types
```

### Component Structure

```typescript
// src/types/warehouse.ts
export interface Warehouse {
  id: number
  name: string
  city: string
  federal_district: string
  cargo_types: CargoType[]
  coordinates?: {
    lat: number
    lon: number
  }
}

export type CargoType = 'MGT' | 'SGT' | 'KGT'

export interface WarehousesResponse {
  warehouses: Warehouse[]
  updated_at: string
}

export interface WarehouseGroup {
  federal_district: string
  warehouses: Warehouse[]
}
```

```typescript
// src/components/custom/price-calculator/WarehouseSelector.tsx
interface WarehouseSelectorProps {
  value: number | null                    // Selected warehouse ID
  onChange: (warehouse: Warehouse | null) => void
  disabled?: boolean
  error?: string
  placeholder?: string
}

export function WarehouseSelector({
  value,
  onChange,
  disabled,
  error,
  placeholder = 'Выберите склад'
}: WarehouseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: warehouses, isLoading } = useWarehouses()

  const groupedWarehouses = useMemo(() => {
    return groupWarehousesByDistrict(warehouses, searchQuery)
  }, [warehouses, searchQuery])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          {selectedWarehouse?.name ?? placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandInput
            placeholder="Поиск склада..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {groupedWarehouses.map(group => (
              <CommandGroup key={group.federal_district} heading={group.federal_district}>
                {group.warehouses.map(warehouse => (
                  <CommandItem key={warehouse.id} onSelect={() => onChange(warehouse)}>
                    <WarehouseListItem warehouse={warehouse} />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

```typescript
// src/hooks/useWarehouses.ts
import { useQuery } from '@tanstack/react-query'
import { getWarehouses } from '@/lib/api/warehouses'

export const warehouseQueryKeys = {
  all: ['warehouses'] as const,
  list: () => [...warehouseQueryKeys.all, 'list'] as const,
}

export function useWarehouses() {
  return useQuery({
    queryKey: warehouseQueryKeys.list(),
    queryFn: getWarehouses,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours (warehouses rarely change)
    gcTime: 24 * 60 * 60 * 1000,
  })
}
```

### Form Data Updates

```typescript
// Add to FormData interface in PriceCalculatorForm.tsx
interface FormData {
  // ... existing fields
  warehouse_id: number | null      // Selected warehouse ID
  warehouse_name: string | null    // Selected warehouse name (for display)
}

// Update defaultValues
const defaultValues: FormData = {
  // ... existing defaults
  warehouse_id: null,
  warehouse_name: null,
}
```

### Utility Functions

```typescript
// src/lib/warehouse-utils.ts
export function groupWarehousesByDistrict(
  warehouses: Warehouse[],
  searchQuery: string
): WarehouseGroup[] {
  const filtered = filterWarehouses(warehouses, searchQuery)

  const groups = filtered.reduce((acc, warehouse) => {
    const district = warehouse.federal_district
    if (!acc[district]) {
      acc[district] = []
    }
    acc[district].push(warehouse)
    return acc
  }, {} as Record<string, Warehouse[]>)

  return Object.entries(groups)
    .map(([federal_district, warehouses]) => ({
      federal_district,
      warehouses: warehouses.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    }))
    .sort((a, b) => a.federal_district.localeCompare(b.federal_district, 'ru'))
}

export function filterWarehouses(
  warehouses: Warehouse[],
  query: string
): Warehouse[] {
  if (!query.trim()) return warehouses

  const lowerQuery = query.toLowerCase()
  return warehouses.filter(w =>
    w.name.toLowerCase().includes(lowerQuery) ||
    w.city.toLowerCase().includes(lowerQuery) ||
    w.federal_district.toLowerCase().includes(lowerQuery)
  )
}

export function getCargoTypeLabel(type: CargoType): string {
  const labels: Record<CargoType, string> = {
    MGT: 'Мелкогабаритный',
    SGT: 'Среднегабаритный',
    KGT: 'Крупногабаритный',
  }
  return labels[type]
}
```

### Validation Rules

```typescript
const validation = {
  warehouse_id: {
    required: false,        // Optional field
    message: 'Выберите склад для автозаполнения коэффициентов'
  }
}
```

### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Склад отгрузки                                         [?]  │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 🔍 Поиск склада...                                    │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Центральный ФО                                          │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │   Коледино                              Подольск       │ │
│ │   Тверь                                 Тверь          │ │
│ │   Электросталь                          Электросталь   │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Приволжский ФО                                          │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │   Казань                                Казань         │ │
│ │   Самара                                Самара         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

Tooltip (on hover):
┌─────────────────────────────────────┐
│ Коледино                            │
│ Город: Подольск                     │
│ Типы груза: MGT, KGT                │
│ Координаты: 55.39°N, 37.57°E        │
└─────────────────────────────────────┘
```

### Invariants & Edge Cases

- **Invariant**: Selected warehouse must exist in the warehouses list
- **Edge case**: API returns empty list → show "Нет доступных складов"
- **Edge case**: API loading → show skeleton/loading state
- **Edge case**: API error → show error message with retry button
- **Edge case**: Search returns no results → show "Склады не найдены"
- **Edge case**: Very long warehouse name → truncate with ellipsis, full name in tooltip
- **Edge case**: Form reset → clear warehouse selection
- **Edge case**: Mobile viewport → full-width dropdown, sheet-style on small screens

---

## Observability

- **Analytics**: Track warehouse selection frequency by district
- **Metrics**: Most popular warehouses, search query patterns
- **Logs**: Log API errors for warehouses endpoint
- **Performance**: Monitor warehouse list load time (target: <500ms)

---

## Security

- **Input Sanitization**: Sanitize search query before filtering
- **XSS**: No user-generated HTML in warehouse names or tooltips
- **API**: Warehouse endpoint requires authentication (Cabinet ID header)
- **Rate Limiting**: Respect backend rate limits (10 req/min per cabinet)

---

## Accessibility (WCAG 2.1 AA)

- [ ] All inputs have associated labels with `htmlFor`
- [ ] Error messages announced to screen readers (`role="alert"`)
- [ ] Dropdown keyboard accessible (Tab, Enter, Escape, Arrow keys)
- [ ] Color contrast >= 4.5:1 for all text
- [ ] Touch targets >= 44x44px for mobile
- [ ] Focus trap inside dropdown when open
- [ ] Screen reader announces selected warehouse
- [ ] Tooltip accessible via keyboard focus
- [ ] ARIA attributes: `aria-expanded`, `aria-selected`, `aria-activedescendant`

---

## Testing Requirements

### Unit Tests
- [ ] WarehouseSelector renders correctly
- [ ] Warehouse grouping by district
- [ ] Search filtering (name, city, district)
- [ ] Selection updates form state
- [ ] Empty/loading/error states

### Integration Tests
- [ ] Warehouse selection triggers coefficient fetch (Story 44.13)
- [ ] Form reset clears warehouse selection
- [ ] Selection persists across form field changes

### E2E Tests
- [ ] User can open warehouse dropdown
- [ ] User can search for warehouse by name
- [ ] User can select warehouse from grouped list
- [ ] Selected warehouse displays in trigger button
- [ ] Tooltip shows warehouse details on hover

---

## Dev Agent Record

### File List
| File | Change Type | Lines (Est.) | Description |
|------|-------------|--------------|-------------|
| `src/types/warehouse.ts` | CREATE | ~30 | TypeScript types for warehouses |
| `src/lib/api/warehouses.ts` | CREATE | ~25 | API client for warehouses endpoint |
| `src/hooks/useWarehouses.ts` | CREATE | ~25 | TanStack Query hook |
| `src/lib/warehouse-utils.ts` | CREATE | ~50 | Utility functions for grouping/filtering |
| `src/components/custom/price-calculator/WarehouseSelector.tsx` | CREATE | ~120 | Dropdown component |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | UPDATE | +20 | Add warehouse dropdown |

### Change Log
_To be filled during implementation_

### Review Follow-ups
_To be filled after code review_

---

## QA Checklist

### Functional Verification
| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Open dropdown | Shows grouped warehouse list | [ ] |
| Search "Казань" | Shows only Казань warehouse | [ ] |
| Search "ФО" | Shows warehouses in matching districts | [ ] |
| Select warehouse | Updates form state, closes dropdown | [ ] |
| Hover warehouse | Shows tooltip with details | [ ] |
| Clear search | Shows all warehouses | [ ] |
| Reset form | Clears warehouse selection | [ ] |
| API error | Shows error message | [ ] |
| Empty API response | Shows "Нет доступных складов" | [ ] |

### Accessibility Verification
| Check | Status |
|-------|--------|
| Keyboard navigation | [ ] |
| Screen reader announces selection | [ ] |
| Color contrast | [ ] |
| Focus visible | [ ] |
| Touch targets | [ ] |

---

## Definition of Done

- [ ] All Acceptance Criteria verified (AC1-AC5)
- [ ] Components created with proper TypeScript types
- [ ] API client and hook implemented (with mock data until backend ready)
- [ ] Unit tests written and passing
- [ ] Integration tests with form flow
- [ ] No ESLint errors
- [ ] Accessibility audit passed
- [ ] Code review completed
- [ ] Documentation updated
- [ ] QA Gate passed

---

## Blocked Status Notes

**Blocking Issue**: Backend API not yet implemented

**Request #98**: Запрос отправлен команде backend, ожидаем уточнения по ряду вопросов:
1. Кэширование (TTL для складов)
2. Фильтрация по типу груза
3. FBS vs FBO тарифы
4. Формат коэффициентов
5. Возвратная логистика
6. Endpoint для категорий

**Workaround**: Implement component with mock data, swap to real API when ready.

**Unblock ETA**: Pending backend team response.

---

**Created**: 2026-01-19
**Last Updated**: 2026-01-19
