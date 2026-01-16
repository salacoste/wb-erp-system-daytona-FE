# Epic: Advanced Filtering for Products Table

**Created**: 2026-01-11
**Status**: Draft
**Priority**: P1 (High Impact Feature)
**Epic Type**: Frontend Enhancement
**Product Owner**: YOU (USER)

---

## 📊 Executive Summary

### Business Problem

Текущая таблица продуктов имеет базовую фильтрацию (категория, бренд, цена). Селлеры тратят 10-15 минут на поиск нужных товаров и не могут быстро принимать решения о скидках и закупках.

### Solution Overview

Добавить Advanced Filtering в Products Table с фильтрацией по марже, остаткам, продажам, сохранением фильтров и presets для быстрых комбинаций.

### Business Value

- **Экономия времени**: Поиск товаров за 30 секунд вместо 10-15 минут
- **Рациональные решения**: Визуализация высокомаржинных товаров
- **Оптимизация ассортимента**: Выявление товаров с остатками для скидок
- **Вовлечённость**: Presets делают фильтрацию доступной

---

## 🎯 Goals & Success Metrics

### Primary Goals

1. **Complete Filtering**: Фильтрация по марже, остаткам, продажам
2. **User Experience**: Интуитивный UI с presets и сохранением фильтров
3. **Performance**: p95 render time <200ms даже с 20 активными фильтрами
4. **Quality Assurance**: ≥90% test coverage, WCAG 2.1 AA compliance

### Success Metrics

- **Adoption**: ≥60% селлеров используют Advanced Filtering в первый месяц
- **User Satisfaction**: UAT score ≥9/10 (5 внутренних пользователей)
- **Performance**: p95 render time <200ms для 50 товаров с 20 фильтрами
- **Efficiency**: Среднее время поиска снижено с 10-15 минут до 30 секунд

---

## 📋 Requirements

### From Feature Request

Основанные на `docs/features/advanced-filtering-feature-request.md`:

#### Functional Requirements

- **FR-FILTER-01**: Система должна предоставлять фильтрацию по марже с min/max полями
- **FR-FILTER-02**: Система должна предоставлять фильтрацию по остаткам с min/max полями
- **FR-FILTER-03**: Система должна предоставлять фильтрацию по продажам с min/max полями
- **FR-FILTER-04**: Система должна сохранять выбранные фильтры в localStorage
- **FR-FILTER-05**: Система должна предоставлять presets для быстрых комбинаций фильтров:
  - "Высокомаржинные" (margin > 20%)
  - "Товары с остатками" (stock > 50)
  - "Бестселлеры" (sales > 10/day)
  - "Медленно продающиеся" (sales < 2/day)
- **FR-FILTER-06**: Система должна поддерживать collapsible filters panel на мобильных устройствах

#### UI Requirements

- **UI-FILTER-01**: Фильтры должны быть доступны через кнопку "Фильтры" с dropdown
- **UI-FILTER-02**: Presets должны быть доступны через кнопку "Пресеты" с dropdown
- **UI-FILTER-03**: Filters panel должен быть collapsible для мобильных устройств
- **UI-FILTER-04**: Должны быть кнопки: "Apply", "Clear", "Save Filters"
- **UI-FILTER-05**: Иконки для каждого фильтра (маржа, остатки, продажи)

#### Performance Requirements

- **PERF-FILTER-01**: p95 render time <200ms для 50 товаров с 20 фильтрами
- **PERF-FILTER-02**: API response time <500ms для запросов с фильтрацией

### From Existing PRD

Интеграция с существующими requirements:

- **FR10** (existing): Система должна поддерживать базовую фильтрацию (категория, бренд, цена) - **сохранить и расширить**
- **NFR3** (existing): Initial page load time <3 seconds - **сохранить**
- **NFR4** (existing): Time to interactive <5 seconds - **сохранить**
- **NFR5** (existing): Dashboard data load within 2 seconds - **расширить** на Products Table

---

## 🎨 Stories

### Story 1: Advanced Filters UI

**User Story**: Как селлер, я хочу видеть дополнительные фильтры (маржа, остатки, продажи) в таблице продуктов, чтобы находить нужные товары быстрее.

**Priority**: P0 (MVP для Advanced Filtering)

**Acceptance Criteria**:

1. Компонент отображает фильтры по марже, остаткам, продажам с min/max input fields
2. Каждый фильтр имеет соответствующую иконку (💰 для маржи, 📦 для остатков, 🛒 для продаж)
3. Min/max inputs валидируют числа и не позволяют отрицательные значения
4. Фильтры доступны через кнопку "Фильтры" с dropdown menu
5. Filters panel может быть открыт/закрыт
6. На мобильных устройствах filters panel collapsible
7. Должны быть кнопки: "Apply", "Clear"

**Technical Notes**:

- Компонент: `components/products/AdvancedFiltersPanel.tsx`
- Использовать shadcn/ui components: Collapsible (для mobile), Input, Button
- Валидация inputs через react-hook-form
- Фильтры хранятся в Zustand store: `stores/products-store.ts`
- Responsive layout: Desktop = боковая панель, Mobile = collapsible dropdown

**Dependencies**:

- Backend API: GET /api/products (нужна поддержка marginMin, marginMax, stockMin, stockMax, salesMin, salesMax)
- ProductsTable component: Интеграция фильтров

---

### Story 2: Filters State Management

**User Story**: Как селлер, я хочу чтобы фильтры сохранялись и восстанавливались при перезагрузке страницы, чтобы не настраивать их каждый раз.

**Priority**: P0 (MVP для Advanced Filtering)

**Acceptance Criteria**:

1. Выбранные фильтры сохраняются в localStorage при нажатии "Save Filters"
2. При загрузке страницы фильтры восстанавливаются из localStorage
3. Кнопка "Save Filters" активна только когда фильтры изменились
4. Кнопка "Save Filters" показывает tooltip "Сохранить фильтры"
5. Если в localStorage нет сохранённых фильтров, используются defaults (empty)
6. localStorage key: `wb-repricer-filters`

**Technical Notes**:

- Zustand store: `stores/products-store.ts`
- Middleware для localStorage: `zustand/middleware`
- Сохранять только changed filters (debounce 500ms)
- Валидация: при восстановлении проверять что данные валидны

**Dependencies**:

- Story 1 (Advanced Filters UI)

---

### Story 3: Apply Filters to Products Table

**User Story**: Как селлер, я хочу чтобы таблица продуктов обновлялась при изменении фильтров, чтобы видеть только подходящие товары.

**Priority**: P0 (MVP для Advanced Filtering)

**Acceptance Criteria**:

1. При нажатии "Apply" таблица обновляется с учётом фильтров
2. API вызывается с query parameters для активных фильтров
3. Loading state показывается пока данные загружаются
4. Error handling если API недоступен или возвращает ошибку
5. Если фильтры пустые, показываются все товары (no filtering)
6. Debounce фильтрации (300ms) для performance

**Technical Notes**:

- React Query для data fetching: `useProducts(filters)`
- Query key включает все активные фильтры
- Stale time: 2 минуты (кеширование)
- Optimistic UI: показываем loading state быстро

**Dependencies**:

- Story 1 (Advanced Filters UI)
- Story 2 (Filters State Management)
- Backend API: GET /api/products с поддержкой query parameters

---

### Story 4: Presets for Quick Filtering

**User Story**: Как селлер, я хочу использовать presets для быстрого выбора часто используемых комбинаций фильтров, чтобы экономить время.

**Priority**: P1 (Важно, но не критично для MVP)

**Acceptance Criteria**:

1. Presets доступны через кнопку "Пресеты" с dropdown menu
2. Предоставлены 4 presets:
   - "Высокомаржинные" (margin > 20%)
   - "Товары с остатками" (stock > 50)
   - "Бестселлеры" (sales > 10/day)
   - "Медленно продающиеся" (sales < 2/day)
3. При выборе preset'а фильтры автоматически заполняются
4. Пользователь может кастомизировать фильтры после выбора preset'а
5. Preset "Кастомный" показывает текущие фильтры
6. Dropdown показывает иконку для каждого preset'а

**Technical Notes**:

- Пресеты определены в `stores/products-store.ts`
- Типы TypeScript для preset'ов:
  ```typescript
  type FilterPreset = {
    id: string
    name: string
    icon: string
    filters: ProductFilters
  }
  ```
- Preset component: `components/products/FilterPresets.tsx`
- Использовать shadcn/ui DropdownMenu

**Dependencies**:

- Story 1 (Advanced Filters UI)
- Story 2 (Filters State Management)

---

### Story 5: Clear Filters Functionality

**User Story**: Как селлер, я хочу быстро сбросить все фильтры к default values, чтобы начать заново.

**Priority**: P1 (Важно, но не критично для MVP)

**Acceptance Criteria**:

1. Кнопка "Clear" сбрасывает все фильтры к default values (empty)
2. При нажатии "Clear" таблица обновляется чтобы показать все товары
3. Кнопка "Clear" показывает tooltip "Очистить фильтры"
4. Если фильтры уже пустые, кнопка "Clear" disabled
5. Сохранённые фильтры в localStorage НЕ очищаются (только текущие)

**Technical Notes**:

- Zustand store action: `clearFilters()`
- Не затрагивает localStorage (только runtime state)
- Валидация: убедиться что фильтры действительно пустые

**Dependencies**:

- Story 1 (Advanced Filters UI)
- Story 2 (Filters State Management)

---

### Story 6: Performance Optimization

**User Story**: Как селлер, я хочу чтобы фильтрация работала быстро даже с множеством активных фильтров, чтобы не ждать загрузки данных.

**Priority**: P1 (Важно, но не критично для MVP)

**Acceptance Criteria**:

1. p95 render time <200ms для 50 товаров с 20 активными фильтрами
2. API response time <500ms для запросов с фильтрацией
3. Debounce фильтрации (300ms) чтобы избежать множества API calls
4. Optimistic loading state показывается в <100ms
5. Кеширование результатов (2 минуты stale time)

**Technical Notes**:

- React Query cache для оптимизации
- Debounce для input fields (300ms)
- Skeleton UI во время загрузки
- Performance тесты с Vitest и Playwright

**Dependencies**:

- Story 3 (Apply Filters to Products Table)
- Backend API: Индексы по margin, stock, sales

---

## 🔄 Dependencies

### External Dependencies

- **Backend API**: GET /api/products с поддержкой query parameters:
  - `marginMin`, `marginMax` (number)
  - `stockMin`, `stockMax` (number)
  - `salesMin`, `salesMax` (number)

### Internal Dependencies

- **Story Dependencies**:
  - Story 2 зависит от Story 1 (UI нужен для state)
  - Story 3 зависит от Story 1 и Story 2
  - Story 4 зависит от Story 1 и Story 2
  - Story 5 зависит от Story 1 и Story 2
  - Story 6 зависит от Story 3 (optimization для apply filters)

### Component Dependencies

- **Existing**:
  - `components/products/ProductsTable.tsx` - Интеграция фильтров
  - `lib/api.ts` - API client для /api/products
- **New**:
  - `components/products/AdvancedFiltersPanel.tsx` - UI для фильтров
  - `components/products/FilterPresets.tsx` - Presets dropdown
  - `stores/products-store.ts` - State management для фильтров

---

## ⚠️ Risks

### Risk 1: Performance Degradation

**Category**: Performance
**Probability**: Medium (2)
**Impact**: Medium (2)
**Score**: 4 (Medium)

**Description**: Много активных фильтров может замедлить render и API responses.

**Mitigation**:

- Backend индексы по margin, stock, sales
- Debounce фильтрации (300ms)
- React Query кеширование
- Skeleton UI для быстрой загрузки

---

### Risk 2: UX Complexity

**Category**: UX
**Probability**: Low (1)
**Impact**: Medium (2)
**Score**: 2 (Low)

**Description**: Слишком много фильтров может запутать пользователей.

**Mitigation**:

- Presets для быстрого доступа
- Progressive disclosure (показывать по умолчанию базовые фильтры)
- Tooltips и helper text для каждого фильтра
- Clear UI hierarchy

---

### Risk 3: Mobile Responsiveness

**Category**: UX
**Probability**: Low (1)
**Impact**: Medium (2)
**Score**: 2 (Low)

**Description**: Фильтры могут не помещаться на мобильных экранах.

**Mitigation**:

- Collapsible filters panel на mobile
- Responsive layout для desktop/tablet/mobile
- Touch-friendly controls (min 44px touch targets)

---

### Risk 4: Data Availability

**Category**: Data
**Probability**: Medium (2)
**Impact**: Low (1)
**Score**: 2 (Low)

**Description**: Не все продукты имеют margin, stock, sales данные.

**Mitigation**:

- Фильтры optional (показывать только если данные доступны)
- Graceful degradation (скрывать товары без данных)
- Error messages если фильтрация невозможна

---

## 📊 Testing Strategy

### Unit Tests

- `AdvancedFiltersPanel.tsx` - render, user interactions
- `FilterPresets.tsx` - preset selection
- `products-store.ts` - state management, localStorage

### Integration Tests

- Apply filters → API call → ProductsTable update
- Preset selection → filters apply → table update
- Clear filters → all products shown
- Save filters → localStorage → restore on reload

### E2E Tests

- User workflow: Select preset → Apply filters → View products
- User workflow: Custom filters → Save → Reload page → Filters restored
- User workflow: Clear filters → All products shown

### Performance Tests

- p95 render time <200ms для 50 товаров с 20 фильтрами
- API response time <500ms

### Accessibility Tests

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support

---

## 🎯 Definition of Done

### Code

- [ ] Все сторис реализованы
- [ ] Code follows project patterns (TypeScript, shadcn/ui)
- [ ] ESLint проходит без ошибок
- [ ] TypeScript strict mode без ошибок

### Testing

- [ ] Unit tests coverage ≥90%
- [ ] Integration tests для всех user workflows
- [ ] E2E tests для критических paths
- [ ] Performance tests проходят

### Documentation

- [ ] Story files обновлены с Dev Agent Record
- [ ] Architecture обновлён (новые компоненты, API endpoints)
- [ ] PRD обновлён (новые FRs)

### QA

- [ ] QA gate PASS
- [ ] All acceptance criteria met
- [ ] No blocking issues
- [ ] NFR assessment PASS

### Deployment

- [ ] Staging deployment успешен
- [ ] E2E tests на staging проходят
- [ ] Ready for production

---

## 📚 Related Documentation

- **Feature Request**: `docs/features/advanced-filtering-feature-request.md`
- **PRD**: `docs/prd.md` (FR10, NFR3, NFR4, NFR5)
- **Architecture**: `docs/front-end-architecture.md`
- **Existing Epic**: `docs/epics/epic-37-merged-group-table-display.md` (пример для reference)

---

## 🚀 Implementation Plan

### Sprint 1 (Story 1-3): MVP Core Functionality

1. Story 1: Advanced Filters UI (4 hours)
2. Story 2: Filters State Management (2 hours)
3. Story 3: Apply Filters to Products Table (3 hours)

### Sprint 2 (Story 4-6): Enhanced Features

1. Story 4: Presets for Quick Filtering (3 hours)
2. Story 5: Clear Filters Functionality (2 hours)
3. Story 6: Performance Optimization (3 hours)

**Total Estimated Effort**: 17 hours (2-3 дня)

---

**Status**: Draft ✅
**Ready for Story Creation**: YES ✅
**Priority**: P1 (High Impact Feature)
**Estimated Effort**: 17 часов (6 сторис)
