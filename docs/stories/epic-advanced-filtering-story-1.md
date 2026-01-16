# Story 1: Advanced Filters UI

## Status

Draft

## Epic

Advanced Filtering for Products Table

## Story Statement

Как селлер, я хочу видеть дополнительные фильтры (маржа, остатки, продажи) в таблице продуктов, чтобы находить нужные товары быстрее.

## Acceptance Criteria

1. Компонент отображает фильтры по марже, остаткам, продажам с min/max input fields
2. Каждый фильтр имеет соответствующую иконку (💰 для маржи, 📦 для остатков, 🛒 для продаж)
3. Min/max inputs валидируют числа и не позволяют отрицательные значения
4. Фильтры доступны через кнопку "Фильтры" с dropdown menu
5. Filters panel может быть открыт/закрыт
6. На мобильных устройствах filters panel collapsible
7. Должны быть кнопки: "Apply", "Clear"

## Tasks / Subtasks

### Task 1: Создать TypeScript types для фильтров

- [ ] Subtask 1.1: Создать type `ProductFilters` в `types/products.ts`
  - [ ] Добавить поля: marginMin, marginMax, stockMin, stockMax, salesMin, salesMax (all optional)
  - [ ] Добавить type для filter preset (для Story 4)
  - [ ] Валидация: margin/stock/sales are numbers, >= 0

### Task 2: Создать AdvancedFiltersPanel component

- [ ] Subtask 2.1: Создать компонент `components/products/AdvancedFiltersPanel.tsx`
  - [ ] Использовать shadcn/ui Collapsible (для mobile)
  - [ ] Использовать shadcn/ui Input для min/max fields
  - [ ] Использовать shadcn/ui Button для Apply/Clear
  - [ ] Использовать icons из lucide-react (💰, 📦, 🛒)
  - [ ] Валидация inputs через react-hook-form
  - [ ] Controlled inputs (value from Zustand store)

### Task 3: Создать Filters state в Zustand store

- [ ] Subtask 3.1: Обновить `stores/products-store.ts`
  - [ ] Добавить state: `filters: ProductFilters`
  - [ ] Добавить actions: `setFilter`, `clearFilters`
  - [ ] Добавить computed getters: `hasActiveFilters`, `filterCount`
  - [ ] Initial state: empty object (все фильтры undefined)

### Task 4: Интегрировать AdvancedFiltersPanel в ProductsTable

- [ ] Subtask 4.1: Открыть `components/products/ProductsTable.tsx`
  - [ ] Импортировать AdvancedFiltersPanel
  - [ ] Добавить кнопку "Фильтры" в toolbar (рядом с поиском)
  - [ ] Dropdown menu: "Фильтры" → открывает/closes AdvancedFiltersPanel
  - [ ] Desktop: боковая панель, Mobile: collapsible
  - [ ] Убедиться что layout выглядит good на desktop/tablet/mobile

### Task 5: Написать тесты для AdvancedFiltersPanel

- [ ] Subtask 5.1: Unit tests в `components/products/__tests__/AdvancedFiltersPanel.test.tsx`
  - [ ] Test render с разными states (opened/closed)
  - [ ] Test input validation (негативные значения не разрешены)
  - [ ] Test кнопки Apply/Clear вызывают правильные actions
  - [ ] Test mobile responsive behavior
  - [ ] Test accessibility (keyboard navigation, ARIA labels)

### Task 6: Написать тесты для products-store

- [ ] Subtask 6.1: Unit tests в `stores/__tests__/products-store.test.ts`
  - [ ] Test `setFilter` action
  - [ ] Test `clearFilters` action
  - [ ] Test `hasActiveFilters` getter
  - [ ] Test `filterCount` getter

## Dev Notes

### Existing System Context

- ProductsTable component находится в `components/products/ProductsTable.tsx`
- State management использует Zustand в `stores/products-store.ts`
- Используем shadcn/ui для UI components
- Формы управляются через react-hook-form
- Types находятся в `types/products.ts`

### Integration Points

- **State Management**: `stores/products-store.ts` - нужно добавить filters state
- **Component**: `components/products/ProductsTable.tsx` - интеграция AdvancedFiltersPanel
- **API**: `lib/api.ts` - фильтрация будет использоваться в Story 3
- **Icons**: lucide-react для иконок (💰 DollarSign, 📦 Package, 🛒 TrendingUp)

### Technical Constraints

- Must use shadcn/ui components (Input, Button, Collapsible, DropdownMenu)
- Must use TypeScript strict mode
- Must follow project patterns (see `docs/front-end-architecture.md`)
- Inputs must be controlled (value from Zustand store, onChange via action)
- Validation: margin/stock/sales >= 0, min <= max
- Responsive: Desktop (боковая панель), Tablet (боковая), Mobile (collapsible)

### File Locations

**Create:**

- `types/products.ts` - ProductFilters type
- `components/products/AdvancedFiltersPanel.tsx` - UI component
- `components/products/__tests__/AdvancedFiltersPanel.test.tsx` - Component tests
- `stores/__tests__/products-store.test.ts` - Store tests

**Update:**

- `stores/products-store.ts` - Add filters state and actions
- `components/products/ProductsTable.tsx` - Integrate AdvancedFiltersPanel

### Testing Requirements

- Unit tests для AdvancedFiltersPanel component
- Unit tests для products-store filters logic
- Integration tests для ProductsTable + AdvancedFiltersPanel integration
- E2E tests (Story 3) для полного workflow
- Coverage: минимум 90% для нового кода
- Accessibility: WCAG 2.1 AA compliance

### UI Mockup Reference

#### Desktop Layout

```
┌────────────────────────────────────────────────────────────┐
│ [Поиск...]  [Фильтры ▼]                                 │
├────────────────────────────────────────────────────────────┤
│ Products Table...                                           │
│                                                            │
│ ┌─ Advanced Filters Panel ───────────────────────────┐     │
│ │                                                        │     │
│ │ 💰 Маржа (%)      [0%] - [50%]           ▼ Apply │     │
│ │ 📦 Остатки       [0] - [500]            ▼ Clear │     │
│ │ 🛒 Продажи       [0/день] - [50/день]   [X]      │     │
│ │                                                        │     │
│ └────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────┘
```

#### Mobile Layout

```
┌─────────────────────┐
│ [Поиск...]  [Фильтры ▼] │
├─────────────────────┤
│ Products Table...    │
│                     │
│ [Filters ▼] - открывает:
│ ┌─────────────────┐  │
│ │ 💰 Маржа      │  │
│ │ [0%] - [50%]  │  │
│ │               │  │
│ │ 📦 Остатки   │  │
│ │ [0] - [500]   │  │
│ │               │  │
│ │ 🛒 Продажи   │  │
│ │ [0] - [50]    │  │
│ │               │  │
│ │ [Apply] [Clear]│  │
│ └─────────────────┘  │
└─────────────────────┘
```

### Code Pattern References

**Existing Pattern**: Filtering in ProductsTable

```typescript
// From components/products/ProductsTable.tsx (hypothetical existing code)
const filters = useStore(state => state.filters)
const setFilter = useStore(state => state.setFilter)
```

**Shadcn/ui Usage Pattern**:

```typescript
// From project examples
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
```

**Zustand Store Pattern**:

```typescript
// From stores/products-store.ts (existing pattern)
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export const useProductsStore = create<IProductsStore>()(
  devtools(
    persist(
      set => ({
        // ... existing state
      }),
      { name: 'products-store' }
    )
  )
)
```

### Accessibility Requirements

- All inputs have associated labels
- Buttons have accessible names
- Keyboard navigation works (Tab, Enter, Space)
- ARIA labels for icon-only buttons
- Sufficient color contrast (4.5:1 for text)
- Touch targets minimum 44px on mobile

### Performance Considerations

- Component render optimization (useMemo for filters)
- Debounce input changes (300ms) - валидация, но не state updates
- Lazy loading для AdvancedFiltersPanel (код splitting если нужно)
- Optimistic UI: обновлять state немедленно, API call в background

## Testing

### Unit Tests

- **AdvancedFiltersPanel.test.tsx**
  - Renders correctly with no filters
  - Renders correctly with filters set
  - Input validation rejects negative numbers
  - Input validation rejects min > max
  - Apply button calls correct action
  - Clear button calls correct action
  - Mobile responsive behavior
  - Keyboard navigation
  - ARIA labels present

- **products-store.test.ts**
  - setFilter updates correct filter
  - setFilter doesn't allow invalid values
  - clearFilters resets all filters
  - hasActiveFilters returns correct value
  - filterCount returns correct count

### Integration Tests

- ProductsTable integration:
  - Filters button opens/closes panel
  - Desktop: panel shows as sidebar
  - Mobile: panel shows as collapsible
  - Apply button updates table (will be tested in Story 3)

### E2E Tests

- Will be tested in Story 3: Apply Filters to Products Table

## Dependencies

- Requires: Story 2 (Filters State Management) для полного workflow
- Depends on: Story 3 (Apply Filters) для полного workflow
- Depends on: Backend API support (Story 3) для фильтрации

## Risks

- **Risk**: Слишком сложный UI для мобильных устройств
  - **Mitigation**: Collapsible panel, простые controls, tooltips
- **Risk**: Performance degradation с множеством inputs
  - **Mitigation**: Debounce, useMemo, React Query кеширование

## Definition of Done

- [ ] Все acceptance criteria met
- [ ] Unit tests pass (coverage ≥90%)
- [ ] Integration tests pass
- [ ] ESLint без ошибок
- [ ] TypeScript без ошибок
- [ ] Accessibility: WCAG 2.1 AA compliant
- [ ] Performance: render time <100ms
- [ ] Story file обновлён с Dev Agent Record
