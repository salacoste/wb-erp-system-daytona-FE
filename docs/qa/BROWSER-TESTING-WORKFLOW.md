# Browser Testing Workflow для QA Validation

## Проблема

Статическая валидация (lint, type-check) **не ловит runtime ошибки**:
- React infinite re-render loops
- Radix UI ref composition errors
- Hydration mismatches
- State management bugs
- API integration failures

## Решение: 3-уровневая система тестирования

### Уровень 1: Статический анализ (Автоматический)
```bash
npm run lint          # ESLint
npm run type-check    # TypeScript
```

### Уровень 2: Runtime Browser Testing (Ручной/Агентный)

#### Инструменты
1. **Claude in Chrome MCP** - для интерактивного тестирования
2. **Playwright E2E** - для автоматизированных тестов

#### Claude in Chrome Workflow

**Шаг 1: Подготовка**
```
# Получить контекст вкладок
mcp__claude-in-chrome__tabs_context_mcp

# Создать новую вкладку
mcp__claude-in-chrome__tabs_create_mcp
```

**Шаг 2: Навигация**
```
# Перейти на тестируемую страницу
mcp__claude-in-chrome__navigate(url, tabId)

# Подождать загрузки
mcp__claude-in-chrome__computer(action: "wait", duration: 3)
```

**Шаг 3: Проверка Console Errors (КРИТИЧНО)**
```
# Прочитать ошибки консоли
mcp__claude-in-chrome__read_console_messages(tabId, onlyErrors: true)

# Ожидаемый результат: "No console errors or exceptions found"
```

**Шаг 4: Визуальная проверка**
```
# Сделать скриншот
mcp__claude-in-chrome__computer(action: "screenshot", tabId)
```

**Шаг 5: Интерактивное тестирование**
```
# Найти элемент
mcp__claude-in-chrome__find(query: "submit button", tabId)

# Кликнуть
mcp__claude-in-chrome__computer(action: "left_click", coordinate: [x, y], tabId)

# Ввести текст
mcp__claude-in-chrome__form_input(ref, value, tabId)
```

### Уровень 3: E2E Automated Tests

```bash
# Запуск всех E2E тестов
npm run test:e2e

# С UI интерфейсом
npm run test:e2e:ui

# Конкретный тест
npx playwright test price-calculator.spec.ts
```

---

## QA Gate Checklist для Frontend Stories

### Перед закрытием Story:

- [ ] **Lint**: `npm run lint` - PASS
- [ ] **TypeScript**: `npm run type-check` - PASS
- [ ] **Unit Tests**: `npm test` - PASS
- [ ] **Browser Load**: Страница загружается без ошибок
- [ ] **Console Clean**: Нет runtime errors в консоли
- [ ] **Visual Check**: UI соответствует AC
- [ ] **Interactions Work**: Формы, кнопки, навигация работают
- [ ] **Responsive**: Проверка на mobile viewport (если требуется)

---

## Команды для TEA Agent

### Вызов TEA для QA Gate:
```
/bmad:bmm:agents:tea

Задача: QA Gate для Story XX.Y
- Прочитай story doc
- Прочитай test plan
- Запусти browser validation
- Проверь console errors
- Сделай скриншоты AC
- Напиши QA Gate Report
```

### Стандартный QA Validation Flow:
```
1. mcp__claude-in-chrome__tabs_context_mcp (createIfEmpty: true)
2. mcp__claude-in-chrome__navigate (url: страница для теста)
3. mcp__claude-in-chrome__computer (action: "wait", duration: 3)
4. mcp__claude-in-chrome__read_console_messages (onlyErrors: true) ← ОБЯЗАТЕЛЬНО!
5. mcp__claude-in-chrome__computer (action: "screenshot")
6. Для каждого AC: тест interaction + screenshot
7. Написать report с результатами
```

---

## Пример: Тестирование Price Calculator

```javascript
// 1. Открыть страницу
navigate("http://localhost:3100/cogs/price-calculator")

// 2. Проверить консоль
read_console_messages(onlyErrors: true)
// Ожидание: "No console errors"

// 3. Тест FBO/FBS переключения
find("FBS button")
click()
screenshot() // AC: FBS selected state

// 4. Тест слайдера маржи
find("margin slider")
drag(to: 30%)
screenshot() // AC: "Высокая" badge visible

// 5. Тест формы расчета
form_input("cogs", "500")
form_input("logistics", "100")
find("Рассчитать цену")
click()
wait(2)
screenshot() // AC: Results displayed

// 6. Проверить консоль после interactions
read_console_messages(onlyErrors: true)
// Ожидание: "No console errors"
```

---

## Частые Runtime Ошибки и Как Их Ловить

| Ошибка | Как обнаружить | Инструмент |
|--------|----------------|------------|
| Maximum update depth exceeded | Console errors | `read_console_messages` |
| Hydration mismatch | Console warnings | `read_console_messages` |
| API call failures | Network errors | `read_network_requests` |
| Element not clickable | Click fails | `computer(action: left_click)` |
| Form validation errors | UI feedback | `screenshot` + `find` |

---

## Интеграция в CI/CD

```yaml
# .github/workflows/e2e.yml
- name: E2E Tests
  run: |
    npm run build
    npm run start &
    npx wait-on http://localhost:3100
    npm run test:e2e
```

---

## Рекомендации

1. **Всегда проверяй console после загрузки** - это ловит 90% runtime ошибок
2. **Делай screenshot перед и после interaction** - доказательство работы
3. **Проверяй на разных viewport** - responsive issues
4. **Тестируй error states** - не только happy path
5. **Проверяй accessibility** - keyboard navigation, focus states
