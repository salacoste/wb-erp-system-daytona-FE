# Пример Реальной Фичи: Advanced Filtering для WB Repricer Frontend

**Created**: 2026-01-11
**Context**: Практический пример полного процесса от Feature Request до Story Implementation
**Связь**: `docs/DEVELOPMENT-LIFECYCLE.md` ← Этот пример показывает как использовать Этап 2

---

## 📋 Содержание

1. [Введение](#введение)
2. [Часть 1: Feature Request](#часть-1-feature-request)
3. [Часть 2: Epic Creation](#часть-2-epic-creation)
4. [Часть 3: Story Breakdown](#часть-3-story-breakdown)
5. [Часть 4: Implementation (Future)](#часть-4-implementation-future)
6. [Связь с Жизненным Циклом Разработки](#связь-с-жизненным-циклом-разработки)
7. [Ключевые Выводы](#ключевые-выводы)

---

## Введение

Этот документ показывает **полный процесс** добавления новой фичи в WB Repricer Frontend, следуя **Этапу 2 (Повседневная разработка)** из `docs/DEVELOPMENT-LIFECYCLE.md`.

**Пример фичи**: **Advanced Filtering for Products Table**

**Почему эта фича**:

- Реальная потребность селлеров WB (из user feedback)
- Логичное расширение существующего функционала
- Хорошо демонстрирует процесс разработки с существующей архитектурой

---

## Часть 1: Feature Request

### Источник

**От кого**: Business Manager (Селлер-партнёр)
**Когда**: 2026-01-11
**Контекст**: Селлеры жалуются что текущий фильтринг продуктов недостаточно гибкий

### Документ

Создан: **`docs/features/advanced-filtering-feature-request.md`**

**Основные разделы**:

```markdown
# Feature Request: Advanced Filtering for Products Table

## Problem Statement

- Текущие фильтры только: категория, бренд, цена
- Нет фильтрации по марже, остаткам, продажам
- Селлеры тратят 10-15 минут на поиск товаров

## Proposed Solution

- Фильтрация по марже (min/max %)
- Фильтрация по остаткам (min/max quantity)
- Фильтрация по продажам (min/max sales/day)
- Сохранение фильтров в localStorage
- Presets для быстрых комбинаций

## User Impact

- Поиск товаров за 30 секунд вместо 10-15 минут
- Рациональные решения о скидках и закупках
- Оптимизация ассортимента

## Success Criteria

- Время поиска: 10-15 мин → 30 сек
- Вовлечённость: ≥60% селлеров используют
- Сохранение: ≥80% селлеров сохраняют фильтры
- Производительность: p95 < 200ms

## Dependencies

- Frontend: ProductsTable component, API client, Zustand store
- Backend API: GET /api/products (нужны query parameters)

## Risks

- Performance: Много фильтров может замедлить запросы
- UX Complexity: Слишком много фильтров может запутать
- Data Availability: Не все продукты имеют данные
- Mobile Responsiveness: Фильтры могут не помещаться

## Mitigation

- Backend индексы по margin, stock, sales
- Presets для быстрого доступа
- Фильтры optional
- Collapsible filters panel на mobile
```

**Ключевой момент**: Feature Request создан **В КАЧЕСТВЕ Product Owner (ВЫ)**. Это первое, что делаете в Этапе 2.

---

## Часть 2: Epic Creation

### Цель

Обновить существующую документацию и создать Epic для новой фичи.

### Документы созданы

**1. Обновление PRD**

Обновлён: **`docs/prd.md`**

**Добавлены новые Functional Requirements**:

```markdown
### Functional Requirements (New)

- FR-FILTER-01: Система должна предоставлять фильтрацию по марже с min/max полями
- FR-FILTER-02: Система должна предоставлять фильтрацию по остаткам с min/max полями
- FR-FILTER-03: Система должна предоставлять фильтрацию по продажам с min/max полями
- FR-FILTER-04: Система должна сохранять выбранные фильтры в localStorage
- FR-FILTER-05: Система должна предоставлять presets для быстрых комбинаций фильтров:
  - "Высокомаржинные" (margin > 20%)
  - "Товары с остатками" (stock > 50)
  - "Бестселлеры" (sales > 10/day)
  - "Медленно продающиеся" (sales < 2/day)
- FR-FILTER-06: Система должна поддерживать collapsible filters panel на мобильных устройствах
```

**Обновлены существующие FRs**:

```markdown
### Functional Requirements (Updated)

- FR10: Система должна поддерживать базовую фильтрацию (категория, бренд, цена)
  → **Обновлено**: Система должна поддерживать базовую и расширенную фильтрацию
```

**2. Обновление Architecture**

Обновлён: **`docs/front-end-architecture.md`**

**Добавлены новые разделы**:

````markdown
## Advanced Filtering (New)

### API Endpoints

- **GET /api/products** (Updated)
  - Existing query parameters: `page`, `limit`, `sortBy`, `sortOrder`, `category`, `brand`
  - New query parameters:
    - `marginMin` (optional, number) - Минимальная маржа в %
    - `marginMax` (optional, number) - Максимальная маржа в %
    - `stockMin` (optional, number) - Минимальные остатки
    - `stockMax` (optional, number) - Максимальные остатки
    - `salesMin` (optional, number) - Минимальные продажи/день
    - `salesMax` (optional, number) - Максимальные продажи/день

### State Management

```typescript
// New type in stores/products-store.ts
interface ProductFilters {
  marginMin?: number
  marginMax?: number
  stockMin?: number
  stockMax?: number
  salesMin?: number
  salesMax?: number
}

// New actions in products-store.ts
interface ProductsStore {
  filters: ProductFilters
  setFilter: (key: keyof ProductFilters, value: number | undefined) => void
  clearFilters: () => void
  hasActiveFilters: boolean
  filterCount: number
}
```
````

### Components

**New Components**:

- `components/products/AdvancedFiltersPanel.tsx` - UI для фильтров
- `components/products/FilterPresets.tsx` - Presets dropdown

**Updated Components**:

- `components/products/ProductsTable.tsx` - Интеграция фильтров

### Testing

**New Tests**:

- `components/products/__tests__/AdvancedFiltersPanel.test.tsx`
- `components/products/__tests__/FilterPresets.test.tsx`
- `stores/__tests__/products-store.test.ts` (updated)

### Performance

**Requirements**:

- p95 render time < 200ms для 50 товаров с 20 фильтрами
- API response time < 500ms для запросов с фильтрацией
- Debounce фильтрации (300ms) для performance

````

**3. Создание Epic**

Создан: **`docs/epics/epic-advanced-filtering-products-table.md`**

**Основные разделы**:

```markdown
# Epic: Advanced Filtering for Products Table

## Executive Summary
**Business Problem**: Текущие фильтры недостаточно гибкие
**Solution**: Расширенная фильтрация с presets и сохранением
**Business Value**:
- Поиск товаров за 30 сек вместо 10-15 мин
- Рациональные решения о скидках и закупках
- Оптимизация ассортимента

## Goals & Success Metrics
- **Adoption**: ≥60% селлеров используют в первый месяц
- **User Satisfaction**: UAT score ≥9/10
- **Performance**: p95 < 200ms для 50 товаров с 20 фильтрами
- **Efficiency**: Поиск 10-15 мин → 30 сек

## Stories (6 stories)
1. **Story 1: Advanced Filters UI** (P0) - UI для фильтров
2. **Story 2: Filters State Management** (P0) - State и localStorage
3. **Story 3: Apply Filters to Products Table** (P0) - Применение фильтров
4. **Story 4: Presets for Quick Filtering** (P1) - Presets
5. **Story 5: Clear Filters Functionality** (P1) - Очистка фильтров
6. **Story 6: Performance Optimization** (P1) - Оптимизация

## Dependencies
- Backend API: GET /api/products с поддержкой query parameters
- Frontend: ProductsTable, Zustand store, API client

## Risks & Mitigation
- Performance: Backend индексы, debounce, кеширование
- UX Complexity: Presets, progressive disclosure
- Data Availability: Фильтры optional, graceful degradation
- Mobile Responsiveness: Collapsible panel, responsive layout

## Definition of Done
- Code: Все сторис реализованы, follows patterns
- Testing: Coverage ≥90%, E2E tests
- Documentation: Story files, architecture updated
- QA: Gate PASS, no blocking issues
- Deployment: Staging successful, E2E tests pass

## Implementation Plan
- **Sprint 1** (Story 1-3): MVP Core Functionality (9 часов)
- **Sprint 2** (Story 4-6): Enhanced Features (8 часов)
**Total**: 17 часов (6 сторис, 2-3 дня)
````

**Ключевой момент**: Epic создан **В КАЧЕСТВЕ Product Owner (ВЫ)** + может быть через @pm agent. Epic разбивает фичу на управляемые сторис.

---

## Часть 3: Story Breakdown

### Цель

Преобразовать Epic в детальные Story, готовые для реализации.

### Документ создан

Создан: **`docs/stories/epic-advanced-filtering-story-1.md`**

**Основные разделы**:

```markdown
# Story 1: Advanced Filters UI

## Status

Draft

## Epic

Advanced Filtering for Products Table

## Story Statement

Как селлер, я хочу видеть дополнительные фильтры (маржа, остатки, продажи) в таблице продуктов, чтобы находить нужные товары быстрее.

## Acceptance Criteria

1. Компонент отображает фильтры по марже, остаткам, продажам с min/max input fields
2. Каждый фильтр имеет соответствующую иконку
3. Min/max inputs валидируют числа и не позволяют отрицательные значения
4. Фильтры доступны через кнопку "Фильтры" с dropdown menu
5. Filters panel может быть открыт/закрыт
6. На мобильных устройствах filters panel collapsible
7. Должны быть кнопки: "Apply", "Clear"

## Tasks / Subtasks (6 tasks, 23 subtasks)

### Task 1: Создать TypeScript types для фильтров

- [ ] Subtask 1.1: Создать type ProductFilters
- [ ] Subtask 1.2: Добавить type для filter preset
- [ ] Subtask 1.3: Валидация: margin/stock/sales are numbers, >= 0

### Task 2: Создать AdvancedFiltersPanel component

- [ ] Subtask 2.1: Создать компонент AdvancedFiltersPanel.tsx
- [ ] Subtask 2.2: Использовать shadcn/ui components
- [ ] Subtask 2.3: Использовать icons из lucide-react
- [ ] Subtask 2.4: Валидация inputs через react-hook-form
- [ ] Subtask 2.5: Controlled inputs (value from Zustand store)

### Task 3: Создать Filters state в Zustand store

- [ ] Subtask 3.1: Обновить products-store.ts
- [ ] Subtask 3.2: Добавить state: filters
- [ ] Subtask 3.3: Добавить actions: setFilter, clearFilters
- [ ] Subtask 3.4: Добавить computed getters

### Task 4: Интегрировать AdvancedFiltersPanel в ProductsTable

- [ ] Subtask 4.1: Открыть ProductsTable.tsx
- [ ] Subtask 4.2: Импортировать AdvancedFiltersPanel
- [ ] Subtask 4.3: Добавить кнопку "Фильтры"
- [ ] Subtask 4.4: Dropdown menu: открывает/closes panel
- [ ] Subtask 4.5: Desktop: боковая панель, Mobile: collapsible

### Task 5: Написать тесты для AdvancedFiltersPanel

- [ ] Subtask 5.1: Unit tests для render
- [ ] Subtask 5.2: Test input validation
- [ ] Subtask 5.3: Test кнопки Apply/Clear
- [ ] Subtask 5.4: Test mobile responsive behavior
- [ ] Subtask 5.5: Test accessibility

### Task 6: Написать тесты для products-store

- [ ] Subtask 6.1: Unit tests для setFilter action
- [ ] Subtask 6.2: Test для clearFilters action
- [ ] Subtask 6.3: Test для hasActiveFilters getter
- [ ] Subtask 6.4: Test для filterCount getter

## Dev Notes

### Existing System Context

- ProductsTable: components/products/ProductsTable.tsx
- State: stores/products-store.ts
- UI: shadcn/ui components
- Forms: react-hook-form
- Types: types/products.ts

### Integration Points

- State: stores/products-store.ts
- Component: components/products/ProductsTable.tsx
- API: lib/api.ts (Story 3)
- Icons: lucide-react

### Technical Constraints

- shadcn/ui components
- TypeScript strict mode
- Project patterns from docs/front-end-architecture.md
- Controlled inputs (value from store, onChange via action)
- Validation: margin/stock/sales >= 0, min <= max
- Responsive: Desktop (боковая), Tablet (боковая), Mobile (collapsible)

### File Locations

**Create**:

- types/products.ts - ProductFilters type
- components/products/AdvancedFiltersPanel.tsx - UI component
- components/products/**tests**/AdvancedFiltersPanel.test.tsx - Component tests
- stores/**tests**/products-store.test.ts - Store tests

**Update**:

- stores/products-store.ts - Add filters state and actions
- components/products/ProductsTable.tsx - Integrate AdvancedFiltersPanel

### Testing Requirements

- Unit tests: AdvancedFiltersPanel, products-store
- Integration tests: ProductsTable + AdvancedFiltersPanel
- E2E tests: Story 3 (полный workflow)
- Coverage: ≥90% для нового кода
- Accessibility: WCAG 2.1 AA compliance

### UI Mockup Reference

[Desktop and Mobile layout mockups - см. полный документ]

### Code Pattern References

[Existing patterns from project - см. полный документ]

## Dependencies

- Depends on: Story 2 (Filters State Management)
- Depends on: Story 3 (Apply Filters to Products Table)
- Requires: Backend API support (Story 3)
```

**Ключевой момент**: Story создан через **@sm agent**. Story содержит детальные задачи, acceptance criteria, технические заметки, готовые для реализации через @dev agent.

---

## Часть 4: Implementation (Future)

### Что будет дальше

Когда мы начнём реализацию, мы будем следовать **Этапу 2.4 (Реализация)** из `docs/DEVELOPMENT-LIFECYCLE.md`:

### Шаг 1: Реализация через @dev agent

```bash
# Запустить реализацию Story 1
@dev: "Реализуй Story 1: Advanced Filters UI"

# Workflow автоматически:
# 1. Прочитает docs/stories/epic-advanced-filtering-story-1.md
# 2. Разобьёт задачи (Task 1-6)
# 3. Реализует код (Subtask 1.1-6.4)
# 4. Напишет тесты
# 5. Обновит story file с Dev Agent Record
```

**Что сделает @dev agent**:

1. **Read Story File**
   - Load `docs/stories/epic-advanced-filtering-story-1.md`
   - Extract tasks, acceptance criteria, technical notes

2. **Implement Tasks Sequentially**
   - Task 1 → Subtasks 1.1, 1.2, 1.3
   - Task 2 → Subtasks 2.1, 2.2, 2.3, 2.4, 2.5
   - Task 3 → Subtasks 3.1, 3.2, 3.3, 3.4
   - Task 4 → Subtasks 4.1, 4.2, 4.3, 4.4, 4.5
   - Task 5 → Subtasks 5.1, 5.2, 5.3, 5.4, 5.5
   - Task 6 → Subtasks 6.1, 6.2, 6.3, 6.4

3. **Run Tests**
   - `npm run test` for unit/integration tests
   - `npm run test:e2e` for E2E tests
   - Fix any failures

4. **Update Story File**
   - Mark tasks/subtasks as completed `[x]`
   - Add Dev Agent Record section
   - Add completion notes
   - Update file list

### Пример Dev Agent Record

````markdown
## Dev Agent Record

### Agent Model Used

Claude 3.5 Sonnet

### Debug Log References

```bash
# Initial setup
npm run test → 320 passing, 0 failing

# After Task 1 (Types)
npm run test → 320 passing, 0 failing
  Added: ProductFilters type
  Added: FilterPreset type

# After Task 2 (Component)
npm run test → 345 passing, 0 failing
  Added: AdvancedFiltersPanel component
  Added: Component tests

# After Task 3 (State)
npm run test → 350 passing, 0 failing
  Updated: products-store.ts
  Added: Store tests

# After Task 4 (Integration)
npm run test → 355 passing, 0 failing
  Updated: ProductsTable.tsx

# After Task 5-6 (Tests)
npm run test → 380 passing, 0 failing
npm run test:coverage → 92% coverage

# E2E Tests
npm run test:e2e → 15 passing, 0 failing
```
````

### Completion Notes

- Successfully implemented AdvancedFiltersPanel component
- All acceptance criteria met
- Responsive: Desktop (боковая панель), Mobile (collapsible)
- Performance: Render time <100ms
- Accessibility: WCAG 2.1 AA compliant

### Challenges Faced

1. **Mobile Layout**: Initial layout was not responsive
   - Solution: Used shadcn/ui Collapsible for mobile, sidebar for desktop

2. **Input Validation**: React-hook-form validation conflicts with controlled inputs
   - Solution: Custom validation with onChange handler

### File List

**Created**:

- `types/products.ts` (+15 lines)
- `components/products/AdvancedFiltersPanel.tsx` (210 lines)
- `components/products/__tests__/AdvancedFiltersPanel.test.tsx` (165 lines)
- `stores/__tests__/products-store.test.ts` (85 lines - added to existing)

**Modified**:

- `stores/products-store.ts` (+35 lines)
- `components/products/ProductsTable.tsx` (+18 lines)

````

### Шаг 2: Code Review (опционально)

```bash
# Запустить code review
@dev: "Сделай code review для Story 1"

# Или
/bmad:bmm:workflows:code-review
````

**Code Review найдёт**:

- Code quality issues
- Architecture compliance
- Test coverage
- Best practices

### Шаг 3: QA Review (обязательно)

```bash
# Запустить QA review
@qa: "Сделай QA review для Story 1"

# Или
/bmad:bmm:workflows:testarch:test-review
/bmad:bmm:workflows:testarch:trace
/bmad:bmm:workflows:testarch:nfr-assess
/bmad:bmm:workflows:testarch:gate
```

**QA Review проведёт**:

- Requirements Traceability (100% coverage)
- NFR Assessment (security, performance, reliability, maintainability)
- Risk Profile
- QA Gate Decision (PASS/CONCERNS/FAIL)

### Шаг 4: Story Completion

```bash
# Обновить статус story
@dev: "Обнови статус Story 1 на Ready for Done"
```

**Story File Update**:

```markdown
## Status

Ready for Done ✅

## QA Results

### Gate Status

Gate: PASS → docs/qa/gates/epic-advanced-filtering-story-1.yml

### Final Assessment

- All acceptance criteria met
- Comprehensive testing (380 tests, 92% coverage)
- All NFRs PASS
- Ready for production
```

### Шаг 5: Deployment

```bash
# Deploy to staging (или production если готово)
npm run build
npm run test:e2e  # Final E2E tests on build
# Deploy to staging/production
```

---

## Связь с Жизненным Циклом Разработки

### Этап 2: Повседневная разработка

Этот пример следует **Этапу 2** из `docs/DEVELOPMENT-LIFECYCLE.md`:

| Этап 2 Раздел                    | Пример                                                | Статус      |
| -------------------------------- | ----------------------------------------------------- | ----------- |
| **3.1. Анализ новой фичи**       | `docs/features/advanced-filtering-feature-request.md` | ✅ Complete |
| **3.2. Обновление документации** | PRD, Architecture, Epic                               | ✅ Complete |
| **3.3. Подготовка сторис**       | `docs/stories/epic-advanced-filtering-story-1.md`     | ✅ Complete |
| **3.4. Реализация**              | Через @dev agent (future)                             | ⏳ Pending  |
| **3.5. QA-валидация**            | Через @qa agent (future)                              | ⏳ Pending  |

### Как этот пример поможет вам

1. **Формат Feature Request** - Используйте `docs/features/advanced-filtering-feature-request.md` как шаблон
2. **Обновление документации** - Видите как обновлять PRD и Architecture
3. **Создание Epic** - Видите как разбивать фичу на сторис
4. **Детализация Story** - Видите как писать детальные сторис с задачами
5. **Реализация** - Видите как @dev agent будет реализовывать

---

## Ключевые Выводы

### 1. Роли в процессе

| Роль                   | Что делает               | Пример                                                 |
| ---------------------- | ------------------------ | ------------------------------------------------------ |
| **Product Owner (ВЫ)** | Создаёте Feature Request | `docs/features/advanced-filtering-feature-request.md`  |
| **Product Owner (ВЫ)** | Обновляете документацию  | PRD, Architecture обновлены                            |
| **@sm agent**          | Создаёте Epic            | `docs/epics/epic-advanced-filtering-products-table.md` |
| **@sm agent**          | Создаёте Story           | `docs/stories/epic-advanced-filtering-story-1.md`      |
| **@dev agent**         | Реализуете Story         | (Future)                                               |
| **@qa agent**          | QA-валидация             | (Future)                                               |

### 2. Документы созданы

**Feature Request**:

- `docs/features/advanced-filtering-feature-request.md` - 120 строк

**Documentation Updates**:

- `docs/prd.md` - добавлены 6 новых FRs
- `docs/front-end-architecture.md` - добавлен раздел Advanced Filtering

**Epic**:

- `docs/epics/epic-advanced-filtering-products-table.md` - 280 строк, 6 сторис

**Story**:

- `docs/stories/epic-advanced-filtering-story-1.md` - 280 строк, 6 задач, 23 подзадачи

### 3. BMad Workflows

**Использованы**:

- Feature Request: Вручную (как Product Owner)
- Обновление документации: Вручную (как Product Owner)
- Epic Creation: `/bmad:bmm:workflows:create-epics-and-stories` (или @pm agent)
- Story Creation: `/bmad:bmm:workflows:create-story` (или @sm agent)

**Будут использованы**:

- Implementation: `/bmad:bmm:workflows:dev-story` (или @dev agent)
- QA: `/bmad:bmm:workflows:testarch:gate` (или @qa agent)

### 4. Timeline

| Этап                     | Время          | Пример                                           |
| ------------------------ | -------------- | ------------------------------------------------ |
| Feature Request          | 1 час          | Создание `advanced-filtering-feature-request.md` |
| Обновление документации  | 2 часа         | PRD, Architecture                                |
| Epic Creation            | 1 час          | Через @pm agent                                  |
| Story Creation           | 1 час          | Через @sm agent                                  |
| **Subtotal: Подготовка** | **5 часов**    | ✅ Complete                                      |
| Implementation           | 3-4 часа       | Через @dev agent (per story)                     |
| QA Review                | 1-2 часа       | Через @qa agent (per story)                      |
| **Subtotal: Реализация** | **4-6 часов**  | ⏳ Pending (per story)                           |
| **Total: 1 Story**       | **9-11 часов** |                                                  |

### 5. Что делать дальше

**Сейчас (Этап 2.1-2.3)**:

- ✅ Feature Request создан
- ✅ Документация обновлена
- ✅ Epic создан
- ✅ Story создан

**Дальше (Этап 2.4-2.5)**:

1. Реализовать Story 1 через @dev agent
2. Code review (опционально)
3. QA review через @qa agent
4. Story completion
5. Deploy

**После Story 1**:

- Повторить для Story 2-6
- Или работать параллельно над несколькими сторис

---

## Заключение

Этот пример показывает **полный процесс** добавления новой фичи в WB Repricer Frontend, следуя **Этапу 2 (Повседневная разработка)** из `docs/DEVELOPMENT-LIFECYCLE.md`:

### ✅ Что сделано

1. **Feature Request** - `docs/features/advanced-filtering-feature-request.md`
   - Problem Statement
   - Proposed Solution
   - User Impact
   - Success Criteria
   - Dependencies
   - Risks & Mitigation

2. **Обновление документации**
   - PRD: 6 новых FRs
   - Architecture: Advanced Filtering раздел

3. **Epic Creation** - `docs/epics/epic-advanced-filtering-products-table.md`
   - 6 сторис
   - Dependencies
   - Risks & Mitigation
   - Definition of Done

4. **Story Creation** - `docs/stories/epic-advanced-filtering-story-1.md`
   - 7 acceptance criteria
   - 6 задач, 23 подзадачи
   - Dev Notes
   - Testing Requirements

### 🎯 Ключевой принцип

**Этап 2 (Повседневная разработка)**:

1. Product Owner (ВЫ) создаёте Feature Request
2. Product Owner (ВЫ) обновляете документацию
3. @sm agent создаёт Epic и Story
4. @dev agent реализует Story
5. @qa agent валидирует
6. Feature ready for production

### 📚 Документы для референса

- **Жизненный цикл**: `docs/DEVELOPMENT-LIFECYCLE.md`
- **Product Owner роль**: `docs/BMAD-PRODUCT-OWNER-ROLE.md`
- **Кто создаёт эпики**: `docs/BMAD-WHO-CREATES-EPICS.md`
- **Feature Request**: `docs/features/advanced-filtering-feature-request.md`
- **Epic**: `docs/epics/epic-advanced-filtering-products-table.md`
- **Story**: `docs/stories/epic-advanced-filtering-story-1.md`

---

**Created**: 2026-01-11
**Author**: BMad Orchestrator
**Version**: 1.0.0
**Status**: Complete ✅
