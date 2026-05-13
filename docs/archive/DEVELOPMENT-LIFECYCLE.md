# WB Repricer Frontend: Полный Цикл Разработки

**Created**: 2026-01-11
**Project**: WB Repricer Frontend
**Tech Stack**: Next.js 14, TypeScript, React Query, Zustand, shadcn/ui
**BMad Version**: v6.0.0-alpha.22
**IDE Support**: Cursor AI, Claude Code, Codex, Antigravity

---

## 📋 Оглавление

1. [Введение](#введение)
2. [Часть 1: Этап Становления (Initialization)](#часть-1-этап-становления-initialization)
   - 2.1. Инициализация проекта
   - 2.2. Создание базовой документации
   - 2.3. Проектирование архитектуры
   - 2.4. Разработка эпиков и сторис
3. [Часть 2: Повседневная разработка (Feature Development)](#часть-2-повседневная-разработка-feature-development)
   - 3.1. Анализ новой фичи
   - 3.2. Обновление документации
   - 3.3. Подготовка сторис
   - 3.4. Реализация
   - 3.5. QA-валидация и подтверждение
4. [Сравнение этапов](#сравнение-этапов)
5. [Checklist для выбора этапа](#checklist-для-выбора-этапа)
6. [Роли и ответственность](#роли-и-ответственность)
7. [Интеграция с BMad workflow](#интеграция-с-bmad-workflow)

---

## Введение

Этот документ описывает **полный цикл разработки** для WB Repricer Frontend, разделённый на два основных этапа:

### 🎯 Два этапа разработки

| Этап                           | Когда используется              | Цель                                       | Продолжительность |
| ------------------------------ | ------------------------------- | ------------------------------------------ | ----------------- |
| **1. Становление**             | Новый проект или major refactor | Создать базовую архитектуру и документацию | 1-2 недели        |
| **2. Повседневная разработка** | Добавление новых фич            | Внедрять фичи в существующую архитектуру   | 2-7 дней на фичу  |

### 💡 Ключевое отличие

**Этап 1 (Становление)**:

- Создаём всё с нуля: PRD, Architecture, Epics, Stories
- Выбираем tech stack
- Определяем паттерны и конвенции
- Устанавливаем инструменты и процессы

**Этап 2 (Повседневная разработка)**:

- Имеем готовую архитектуру и документацию
- Анализируем только НОВУЮ фичу
- Интегрируем в существующую систему
- Валидируем что новая фича не ломает существующее

### 📊 Текущее состояние проекта

**WB Repricer Frontend** сейчас находится на **Этап 2**:

- ✅ Next.js 14 проект настроен
- ✅ Tech stack выбран (TypeScript, React Query, Zustand, shadcn/ui)
- ✅ Frontend architecture документ создан (`docs/front-end-architecture.md`)
- ✅ PRD создан (`docs/prd.md`)
- ✅ Эпики задокументированы (`docs/epics/`)
- ✅ BMad framework интегрирован

**Следующий шаг**: Использовать Этап 2 для разработки новых фич.

---

## Часть 1: Этап Становления (Initialization)

### Когда использовать Этап 1?

Используйте этот этап когда:

- ✨ **Новый проект** - Вы начинаете проект с нуля
- 🔄 **Major refactor** - Вы полностью переделываете архитектуру
- 🚀 **Новый модуль** - Вы добавляете совершенно новый независимый модуль
- 📦 **Технологический сдвиг** - Вы меняете фундаментальный tech stack (например, с React на Vue)

**НЕ используйте**, когда вы просто добавляете фичу в существующую систему - используйте Этап 2.

---

### 2.1. Инициализация проекта

#### Цель

Создать базовую структуру проекта с выбранным tech stack и инструментами.

#### Процесс

**Шаг 1: Инициализация BMad проекта**

```bash
# В корне проекта
cd /path/to/wb-repricer-system-new/frontend

# Инициализировать BMad
npx bmad-method init

# Выберите настройки:
# - Level: Greenfield (новый проект)
# - Type: Fullstack (если есть backend) или Service (если только frontend)
# - UI Framework: Next.js 14
# - Language: TypeScript
```

**Шаг 2: Настройка конфигурации**

```bash
# Обновить .bmad-core/core-config.yaml
# Настроить пути к директориям:
# - prdFile: docs/prd.md
# - architectureFile: docs/architecture.md
# - devStoryLocation: docs/stories
# - outputFolder: docs
```

**Шаг 3: Настройка IDE (Cursor AI)**

```bash
# Установить Cursor AI agent конфигурации
npx bmad-method install -i cursor

# Проверить что agents созданы:
ls .claude/commands/BMad/core/agents/
# Должны видеть: pm.agent.yaml, architect.agent.yaml, dev.agent.yaml, и т.д.
```

**Шаг 4: Создание базовой структуры проекта**

```bash
# Создание Next.js 14 проекта
npx create-next-app@latest wb-repricer-frontend
# Выберите:
# - TypeScript: Yes
# - ESLint: Yes
# - Tailwind CSS: Yes
# - App Router: Yes
# - Src Directory: Yes
# - Import Alias: @/*

# Установка зависимостей
npm install @tanstack/react-query zustand lucide-react recharts mixpanel-browser
npm install -D vitest @vitest/ui playwright @playwright/test prettier
npm install -D @types/node typescript

# Установка shadcn/ui
npx shadcn-ui@latest init
# Выберите defaults и установите нужные компоненты
```

**Шаг 5: Настройка инструментов**

```bash
# package.json - добавить скрипты
{
  "scripts": {
    "dev": "next dev -p 3100",
    "build": "next build",
    "start": "next start -p 3100",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css}\""
  }
}

# Создать .cursorrules с BMad правилами
cat > .cursorrules << 'EOF'
# BMad v6.0.0-alpha.22 Integration for Cursor AI
# Project: WB Repricer Frontend
# Tech Stack: Next.js 14, TypeScript, React Query, Zustand, shadcn/ui

## Core Principles

1. Use BMad agents for all development tasks
2. Context7 MCP server available for code practices
3. Follow project-specific rules from docs/
4. Test-first development with Vitest and Playwright
EOF

# Настроить Vitest
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: [
      'node_modules/',
      'src/test/',
      '**/*.d.ts',
      '**/*.config.*',
    ],
  },
})
EOF

# Настроить Playwright
cat > playwright.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './src/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3100,
    reuseExistingServer: !process.env.CI,
  },
})
EOF
```

#### Результат

После этого шага у вас:

- ✅ BMad framework интегрирован
- ✅ Next.js 14 проект создан
- ✅ Tech stack установлен
- ✅ Инструменты настроены (ESLint, Prettier, Vitest, Playwright)
- ✅ IDE (Cursor AI) настроен

---

### 2.2. Создание базовой документации

#### Цель

Создать фундаментальную документацию, которая будет направлять всё дальнейшее развитие.

#### Процесс

**Шаг 1: Создание PRD (Product Requirements Document)**

```bash
# Запустить workflow для создания PRD
@pm: "Создай PRD для WB Repricer Frontend"

# ИЛИ через команду workflow
/bmad:bmm:workflows:create-prd
```

**PRD должен включать**:

```markdown
# Product Requirements Document

## Executive Summary

- Краткое описание проекта
- Основные цели и задачи
- Целевая аудитория

## Problem Statement

- Какую проблему решает продукт
- Почему это важно
- Текущее состояние (если brownfield)

## Solution Overview

- Общее описание решения
- Ключевые возможности

## Functional Requirements

- Детальный список всех FR (Functional Requirements)
- Каждый FR с ID (например, FR-001, FR-002)

## Non-Functional Requirements

- Performance requirements
- Security requirements
- Scalability requirements
- User experience requirements

## User Stories

- Основные user stories для MVP
- Приоритеты (P0, P1, P2)

## Success Metrics

- KPIs и метрики успеха
- Как измерять успех

## Technical Constraints

- Технологические ограничения
- Внешние зависимости
- Бюджетные ограничения

## Risks and Mitigations

- Потенциальные риски
- Стратегии их смягчения

## Roadmap

- План развития на несколько фаз
- Милистоны для релизов
```

**Пример из `docs/prd.md`**:

```markdown
# WB Repricer Frontend PRD

## Executive Summary

WB Repricer Frontend - это веб-приложение для автоматического ценообразования на маркетплейсе Wildberries.

## Problem Statement

Селлеры тратят часы на ручной перерасчёт цен, анализируя тысячи товаров. Это неэффективно и подвержено ошибкам.

## Solution Overview

Автоматизировать перерасчёт цен на основе данных о продажах, конкурентах и запасах.

## Functional Requirements

- FR-001: Dashboard с ключевыми метриками (выручка, маржа, продажи)
- FR-002: Список товаров с фильтрами и сортировкой
- FR-003: Автоматический перерасчёт цен
- FR-004: Исторические данные о ценах и маржах
- FR-005: Экспорт данных в CSV/Excel

## User Stories

1. Как селлер, я хочу видеть dashboard с метриками, чтобы понимать состояние бизнеса
2. Как селлер, я хочу автоматически перерасчитывать цены, чтобы сэкономить время
3. Как селлер, я хочу видеть исторические данные, чтобы анализировать тренды

## Success Metrics

- Время на перерасчёт снижено с 2 часов до 5 минут
- Ошибки в ценообразовании снижены на 80%
- Вовлечённость пользователей (DAU) 70%+ в первый месяц
```

**Шаг 2: Создание Architecture Document**

```bash
# Запустить workflow для создания архитектуры
@architect: "Спроектируй архитектуру для WB Repricer Frontend на основе PRD"

# ИЛИ через команду workflow
/bmad:bmm:workflows:create-architecture
```

**Architecture должен включать**:

```markdown
# Architecture Document

## High-Level Architecture

- Общая архитектура системы
- Диаграммы (если есть)

## Tech Stack

- Frontend framework
- State management
- Data fetching
- UI components
- Testing framework
- Build tools

## Project Structure

- Организация директорий
- Файловая конвенция

## Core Components

- Основные компоненты приложения
- Их ответственность

## Data Flow

- Как данные протекают через систему
- Integration points с backend

## State Management

- Где хранится состояние
- Как оно обновляется

## API Integration

- Список всех API endpoints
- Request/Response форматы
- Auth требования

## Testing Strategy

- Unit testing подход
- Integration testing подход
- E2E testing подход

## Deployment Strategy

- Как деплоить приложение
- CI/CD pipeline

## Performance Considerations

- Оптимизации производительности
- Кеширование
- Lazy loading

## Security Considerations

- Auth mechanisms
- Data protection
- XSS/CSRF prevention
```

**Пример из `docs/front-end-architecture.md`**:

```markdown
# WB Repricer Frontend Architecture

## High-Level Architecture

Single Page Application (SPA) на Next.js 14 с App Router.

## Tech Stack

- Frontend: Next.js 14.0.0
- Language: TypeScript 5.x
- UI: shadcn/ui + Radix UI + Tailwind CSS
- State: Zustand
- Data Fetching: React Query (@tanstack/react-query)
- Forms: react-hook-form + @hookform/resolvers
- Charts: Recharts
- Testing: Vitest (unit/integration) + Playwright (E2E)

## Project Structure

src/
├── app/ # Next.js App Router
│ ├── (auth)/ # Auth routes
│ ├── dashboard/ # Dashboard route
│ └── layout.tsx # Root layout
├── components/ # React components
│ ├── ui/ # shadcn/ui components
│ └── dashboard/ # Dashboard-specific components
├── lib/ # Utility libraries
│ ├── api.ts # API client
│ └── utils.ts # Helper functions
├── stores/ # Zustand stores
│ └── dashboard-store.ts # Dashboard state
├── hooks/ # Custom React hooks
├── types/ # TypeScript types
├── test/ # Test utilities
└── e2e/ # E2E tests

## Core Components

- Dashboard: Главная страница с метриками
- ProductsList: Список товаров с фильтрами
- PriceCalculator: Компонент для перерасчёта цен
- HistoricalData: Компонент для исторических данных

## Data Flow

Frontend → WB API → Backend (если есть) → WB SDK → Wildberries API

## State Management

- Zustand для глобального состояния (user preferences, filters)
- React Query для server state (cache, refetching)
- Local state для UI state (form inputs, modals)

## API Integration

- GET /api/products - Список товаров
- GET /api/products/{id} - Детали товара
- POST /api/calculate - Перерасчёт цен
- GET /api/historical - Исторические данные

## Testing Strategy

- Unit tests: Vitest для utils, hooks, stores
- Integration tests: Vitest для components
- E2E tests: Playwright для critical user flows
- Coverage: Минимум 80%
```

**Шаг 3: Создание UX Design (опционально, но рекомендуется)**

```bash
# Запустить workflow для UX дизайна
@ux-designer: "Спроектируй UX для WB Repricer Frontend"

# ИЛИ через команду workflow
/bmad:bmm:workflows:create-ux-design
```

**UX Design должен включать**:

```markdown
# UX Design Document

## Design System

- Цветовая палитра
- Типографика
- Компоненты и их стили

## User Flows

- Flow диаграммы для ключевых сценариев
- Happy paths и edge cases

## Wireframes

- Mockup для каждой страницы
- Layouts и компоненты

## Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support

## Mobile Responsiveness

- Mobile-first подход
- Breakpoints для different устройств
```

#### Результат

После этого шага у вас:

- ✅ PRD создан (`docs/prd.md`)
- ✅ Architecture создан (`docs/architecture.md` или `docs/front-end-architecture.md`)
- ✅ UX Design создан (`docs/ux-design.md`) - опционально

---

### 2.3. Разработка эпиков и сторис

#### Цель

Разложить PRD requirements на управляемые эпики и детальные сторис для реализации.

#### Процесс

**Шаг 1: Создание эпиков и сторис**

```bash
# Запустить workflow для создания эпиков
@pm: "Создай эпики и сторис на основе PRD и Architecture"

# ИЛИ через команду workflow
/bmad:bmm:workflows:create-epics-and-stories
```

**Workflow сделает**:

1. **Validates Prerequisites**
   - Проверяет что PRD, Architecture, UX готовы
   - Извлекает Functional Requirements (FRs)
   - Извлекает Non-Functional Requirements (NFRs)
   - Извлекает контекст из UX/Architecture

2. **Designs Epics**
   - Группирует FRs по пользовательской ценности
   - Создаёт структуру эпиков
   - Определяет приоритеты (P0 для MVP, P1, P2)

3. **Creates Stories**
   - Для каждого эпика создаёт детальные сторис
   - Пишет acceptance criteria
   - Интегрирует технический контекст из Architecture

4. **Final Validation**
   - Проверяет completeness
   - Проверяет alignment с PRD и Architecture
   - Готовит документ к реализации

**Пример из `_bmad/planning-artifacts/epics.md`**:

```markdown
# Epics and Stories

## Epic 1: Dashboard - MVP

**Priority**: P0 (MVP)
**Goal**: Создать dashboard с ключевыми метриками для быстрого понимания состояния бизнеса

### Story 1.1: Dashboard Layout

**User Story**: Как селлер, я хочу видеть dashboard с базовой структурой, чтобы понимать где находится функционал.

**Acceptance Criteria**:

- [ ] Header с логотипом и навигацией
- [ ] Sidebar с меню основных разделов
- [ ] Main content area для dashboard widgets
- [ ] Responsive layout для desktop и tablet

**Technical Notes**:

- Использовать App Router Next.js 14
- Layout component в `app/layout.tsx`
- Использовать shadcn/ui NavigationMenu для меню

### Story 1.2: Key Metrics Widgets

**User Story**: Как селлер, я хочу видеть ключевые метрики (выручка, маржа, продажи), чтобы понимать состояние бизнеса.

**Acceptance Criteria**:

- [ ] Widget: Total Revenue (сумма выручки за период)
- [ ] Widget: Average Margin (средняя маржа в %)
- [ ] Widget: Total Sales (количество продаж)
- [ ] Widget: Products Count (количество товаров)
- [ ] Loading states для каждого widget
- [ ] Error handling если API недоступен

**Technical Notes**:

- API endpoint: GET /api/dashboard/metrics
- Использовать React Query для data fetching
- Кешировать на 5 минут (staleTime: 300000)
- Использовать Recharts для визуализации (если применимо)

### Story 1.3: Date Range Selector

**User Story**: Как селлер, я хочу выбирать диапазон дат, чтобы видеть метрики за нужный период.

**Acceptance Criteria**:

- [ ] Dropdown с preset диапазонами (Today, Last 7 days, Last 30 days)
- [ ] Custom date range picker
- [ ] Все dashboard widgets обновляются при изменении диапазона
- [ ] Сохранение выбранного диапазона в localStorage

**Technical Notes**:

- Использовать react-hook-form для управления формой
- Хранить выбранный диапазон в Zustand store
- Refetch всех queries при изменении диапазона

---

## Epic 2: Products List - MVP

**Priority**: P0 (MVP)
**Goal**: Создать список товаров с фильтрами и сортировкой для управления ассортиментом.

### Story 2.1: Products Table

**User Story**: Как селлер, я хочу видеть список всех товаров в таблице, чтобы понимать ассортимент.

**Acceptance Criteria**:

- [ ] Table с колонками: SKU, Название, Цена, Маржа, Запасы, Продажи
- [ ] Pagination (20 товаров на странице)
- [ ] Sortable по всем колонкам
- [ ] Loading state при загрузке данных
- [ ] Empty state если нет товаров

**Technical Notes**:

- API endpoint: GET /api/products?page=1&limit=20
- Использовать TanStack Table (React Table) или custom table component
- Использовать shadcn/ui Table components
- Server-side pagination и сортировка

### Story 2.2: Filters and Search

**User Story**: Как селлер, я хочу фильтровать и искать товары, чтобы найти нужный товар.

**Acceptance Criteria**:

- [ ] Search input для поиска по названию/SKU
- [ ] Filter по категории (dropdown)
- [ ] Filter по бренду (dropdown)
- [ ] Filter по диапазону цены
- [ ] Apply и Clear buttons
- [ ] Debounce search query (300ms)

**Technical Notes**:

- API endpoints поддерживают query parameters для фильтрации
- Использовать Zustand store для фильтров
- Debounce с lodash.debounce или custom hook
```

**Шаг 2: Проверка Implementation Readiness**

```bash
# Запустить workflow для проверки готовности к реализации
@architect: "Проверь готовность PRD, Architecture и Epics к реализации"

# ИЛИ через команду workflow
/bmad:bmm:workflows:check-implementation-readiness
```

**Workflow проверит**:

1. **Completeness**
   - Все ли FRs покрыты эпиками и сторис?
   - Есть ли gap'ы между PRD и epics?

2. **Alignment**
   - Архитектура соответствует PRD requirements?
   - Эпики и сторис следуют архитектуре?

3. **Testability**
   - Есть ли достаточный coverage для тестирования?
   - Acceptance criteria measurables?

4. **Feasibility**
   - Реализуем ли план в рамках бюджета и времени?
   - Есть ли технические риски?

#### Результат

После этого шага у вас:

- ✅ Эпики созданы (`_bmad/planning-artifacts/epics.md`)
- ✅ Сторис созданы с acceptance criteria
- ✅ Implementation readiness проверен

---

### 2.4. Checkpoint: Ready for Development?

**Checklist перед стартом Этапа 2 (Повседневная разработка)**:

```markdown
## Initialization Phase Checklist

### Project Setup

- [ ] BMad framework интегрирован
- [ ] Next.js 14 проект создан
- [ ] Tech stack установлен (TypeScript, React Query, Zustand, shadcn/ui)
- [ ] Инструменты настроены (ESLint, Prettier, Vitest, Playwright)
- [ ] IDE (Cursor AI) настроен

### Documentation

- [ ] PRD создан (`docs/prd.md`)
  - [ ] Executive Summary
  - [ ] Problem Statement
  - [ ] Functional Requirements (FRs)
  - [ ] Non-Functional Requirements (NFRs)
  - [ ] User Stories
  - [ ] Success Metrics
- [ ] Architecture создан (`docs/architecture.md` или `docs/front-end-architecture.md`)
  - [ ] Tech Stack определён
  - [ ] Project Structure определён
  - [ ] Core Components описаны
  - [ ] Data Flow описан
  - [ ] State Management определён
  - [ ] API Integration описана
  - [ ] Testing Strategy определён
- [ ] UX Design создан (`docs/ux-design.md`) - опционально

### Epics and Stories

- [ ] Эпики созданы (`_bmad/planning-artifacts/epics.md` или `docs/epics/`)
  - [ ] Группированы по пользовательской ценности
  - [ ] Приоритеты определены (P0, P1, P2)
- [ ] Сторис созданы
  - [ ] User Stories написаны
  - [ ] Acceptance Criteria measurables
  - [ ] Технические заметки включены

### Validation

- [ ] Implementation readiness проверен
- [ ] Все gap'ы решены
- [ ] Нет blocking issues

### Ready to Proceed?

- Если всё отмечено ✅: Поздравляю! Вы готовы к Этапу 2 (Повседневная разработка)
- Если есть ❌: Вернитесь к предыдущим шагам и завершите их
```

---

## Часть 2: Повседневная разработка (Feature Development)

### Когда использовать Этап 2?

Используйте этот этап когда:

- ✅ **Базовая архитектура готова** - У вас есть PRD, Architecture, Epics
- ✅ **Добавляете новую фичу** - Интеграция в существующую систему
- ✅ **Bug fix или enhancement** - Модификация существующего функционала
- ✅ **Refactoring** - Улучшение существующего кода без изменения функционала

**НЕ используйте**, когда вы начинаете проект с нуля или делаете major refactor - используйте Этап 1.

---

### 3.1. Анализ новой фичи

#### Цель

Понять новую фичу, её требования, интеграционные точки и влияние на существующую систему.

#### Процесс

**Шаг 1: Сбор требований**

**Источники требований**:

```bash
# Требование может прийти из разных источников:
# 1. User feedback / Feature request от пользователя
# 2. Business requirement от менеджера/стейкхолдера
# 3. Technical requirement от разработчика
# 4. Market research / Competitor analysis
```

**Документирование требований**:

```markdown
# Feature Request: [Название фичи]

## Source

- От кого: [Имя/Роль]
- Когда: [Дата]
- Контекст: [Почему это важно]

## Problem Statement

- Какую проблему решает эта фича?
- Почему это важно сейчас?

## Proposed Solution

- Краткое описание решения
- Ключевые функциональности

## User Impact

- Кто benefited от этой фичи?
- Как это улучшит их опыт?

## Success Criteria

- Как измерять успех?
- Что значит "фича работает"?

## Dependencies

- Какие части системы затронуты?
- Какие внешние API нужны?

## Risks

- Потенциальные риски внедрения
- Как их смягчить?
```

**Пример**:

```markdown
# Feature Request: Advanced Price Calculator

## Source

- От кого: Business Manager (Анна)
- Когда: 2026-01-10
- Контекст: Селлеры жалуются что текущий перерасчёт цен слишком простой

## Problem Statement

Текущий перерасчёт цен меняет цены только на основе маржи. Селлеры хотят учитывать:

- Цены конкурентов
- Остатки (запасы)
- Скорость продаж

## Proposed Solution

Добавить "Advanced Mode" в Price Calculator с дополнительными факторами:

- Concurrency: Учитывать минимальную цену конкурента
- Stock: Снижать цену если остатки высокие (>100)
- Velocity: Повышать цену если продажи быстрые (>10 в день)

## User Impact

Селлеры смогут:

- Более точно устанавливать цены
- Увеличить маржу за счёт конкурентных преимуществ
- Снизить затоваренность за счёт скидок на остатки

## Success Criteria

- Маржа увеличивается на 15% для активных селлеров
- Затоваренность снижается на 20%
- Селлеры используют Advanced Mode в 40%+ случаев

## Dependencies

- API: GET /api/competitors/{sku} - цены конкурентов
- API: GET /api/products/{id}/stock - остатки
- API: GET /api/products/{id}/sales - скорость продаж

## Risks

- Сложный UI может запутать селлеров
- Решение может быть медленным (много API calls)
- Risk: Некорректные данные от конкурентов

## Mitigation

- Простой toggle между Simple/Advanced режимами
- Кеширование competitor data и batch requests
- Валидация данных от конкурентов с bounds checking
```

**Шаг 2: Анализ влияния на существующую систему**

**Воздействие на существующие компоненты**:

```markdown
# Impact Analysis

## Затронутые Компоненты

- PriceCalculator.tsx (основной компонент)
- api.ts (новые API endpoints)
- dashboard-store.ts (сохранение настроек перерасчёта)
- types.ts (новые типы для advanced parameters)

## Изменения в Existing APIs

- POST /api/calculate - добавить optional поля для advanced mode

## Новые API Endpoints

- GET /api/competitors/{sku} - цены конкурентов
- GET /api/products/{id}/stock - остатки
- GET /api/products/{id}/sales - скорость продаж

## Изменения в State Management

- dashboard-store.ts: Добавить advancedMode settings
- dashboard-store.ts: Добавить advancedParameters state

## Изменения в UI

- PriceCalculator.tsx: Добавить toggle для Simple/Advanced режима
- PriceCalculator.tsx: Добавить дополнительные inputs для advanced parameters

## Изменения в Testing

- Unit tests для новых утилит
- Integration tests для новых API endpoints
- E2E tests для Advanced Mode flow

## Backwards Compatibility

- Simple Mode продолжает работать как раньше
- Существующие user preferences не ломаются
- API backward compatible (новые поля optional)
```

**Шаг 3: Проверка на conflicts с существующей функциональностью**

```markdown
# Conflict Analysis

## Potential Conflicts

1. **Performance**: Много API calls может замедлить UI
   - Mitigation: Batch requests, кеширование, lazy loading

2. **UX Complexity**: Слишком много настроек может запутать пользователей
   - Mitigation: Smart defaults, presets, progressive disclosure

3. **Data Quality**: Competitor data может быть некорректным
   - Mitigation: Валидация, bounds checking, manual override

## Existing Functionality at Risk

- Dashboard loading time (может увеличиться)
- Price calculation time (может увеличиться)

## Regression Risks

- Simple Mode performance (не должен замедлиться)
- Existing user preferences (не должны сломаться)
- API backward compatibility (должна быть сохранена)
```

#### Результат

После этого шага у вас:

- ✅ Требования документированы
- ✅ Воздействие на систему проанализировано
- ✅ Conflicts идентифицированы

---

### 3.2. Обновление документации

#### Цель

Обновить существующую документацию, чтобы отразить новую фичу.

#### Процесс

**Шаг 1: Обновление PRD**

```bash
# Добавить новые Functional Requirements в docs/prd.md
```

```markdown
# Обновление docs/prd.md

## Functional Requirements

### Existing FRs (сохранить)

... существующие FRs ...

### New FRs (добавить)

- FR-006: Advanced Price Calculator
  - Как селлер, я хочу использовать Advanced Mode для перерасчёта цен,
    учитывая конкурентов, остатки и скорость продаж.
  - Priority: P1 (важно, но не критично для MVP)

- FR-007: Competitor Data Integration
  - Как селлер, я хочу видеть цены конкурентов для каждого товара,
    чтобы устанавливать конкурентоспособные цены.
  - Priority: P1

- FR-008: Stock-Based Pricing
  - Как селлер, я хочу снижать цены на товары с высокими остатками,
    чтобы снизить затоваренность.
  - Priority: P1

- FR-009: Velocity-Based Pricing
  - Как селлер, я хочу повышать цены на быстро продающиеся товары,
    чтобы увеличить маржу.
  - Priority: P2
```

**Шаг 2: Обновление Architecture**

```bash
# Обновить docs/front-end-architecture.md
```

````markdown
# Обновление docs/front-end-architecture.md

## New API Endpoints (добавить в раздел API Integration)

### Advanced Price Calculator Endpoints

- **GET /api/competitors/{sku}**
  - Получить цены конкурентов для товара
  - Response:
    ```json
    {
      "sku": "123456",
      "competitors": [
        {
          "name": "Seller A",
          "price": 1000,
          "url": "https://..."
        },
        {
          "name": "Seller B",
          "price": 950,
          "url": "https://..."
        }
      ],
      "minPrice": 950,
      "avgPrice": 975
    }
    ```

- **GET /api/products/{id}/stock**
  - Получить остатки товара
  - Response:
    ```json
    {
      "productId": "123",
      "stock": 150,
      "warehouse": "main"
    }
    ```

- **GET /api/products/{id}/sales**
  - Получить скорость продаж товара
  - Response:
    ```json
    {
      "productId": "123",
      "salesPerDay": 12,
      "trend": "increasing"
    }
    ```

## Updated State Management (добавить в раздел State Management)

### Advanced Pricing State

```typescript
interface AdvancedPricingState {
  mode: 'simple' | 'advanced'
  parameters: {
    concurrencyEnabled: boolean
    concurrencyDiscount: number // % от минимальной цены конкурента
    stockDiscountEnabled: boolean
    stockThreshold: number // остатки выше этого = скидка
    stockDiscount: number // % скидки
    velocityPremiumEnabled: boolean
    velocityThreshold: number // продаж/день выше этого = наценка
    velocityPremium: number // % наценки
  }
  presets: {
    aggressive: typeof parameters
    moderate: typeof parameters
    conservative: typeof parameters
  }
}
```
````

## Updated Core Components (добавить в раздел Core Components)

### PriceCalculator (Enhanced)

**New Features**:

- Toggle между Simple и Advanced режимами
- Inputs для advanced parameters
- Presets для быстрого выбора настроек
- Real-time preview цены

## Updated Testing Strategy (добавить в раздел Testing Strategy)

### Advanced Mode Testing

- Unit tests для calculation logic
- Integration tests для новых API endpoints
- E2E tests для Advanced Mode flow
- Performance tests (убедиться что не замедляет UI)

````

**Шаг 3: Создание Epic для новой фичи**

```bash
# Создать epic в docs/epics/
````

```markdown
# docs/epics/epic-advanced-price-calculator.md

## Epic: Advanced Price Calculator

### Summary

Добавить Advanced Mode для перерасчёта цен с учётом конкурентов, остатков и скорости продаж.

### Priority

P1 (важно, но не критично для MVP)

### Stories

#### Story 1: Competitor Data Integration

**User Story**: Как селлер, я хочу видеть цены конкурентов, чтобы устанавливать конкурентоспособные цены.

**Acceptance Criteria**:

- [ ] Компонент отображает цены конкурентов для выбранного товара
- [ ] Показывает минимальную, среднюю и максимальную цену
- [ ] Links на товары конкурентов
- [ ] Loading state при загрузке данных
- [ ] Error handling если данные недоступны
- [ ] Кеширование данных на 1 час

**Technical Notes**:

- API endpoint: GET /api/competitors/{sku}
- Использовать React Query с staleTime: 3600000 (1 час)
- Показывать в PriceCalculator component

#### Story 2: Advanced Pricing Parameters

**User Story**: Как селлер, я хочу настраивать advanced pricing parameters, чтобы управлять перерасчётом цен.

**Acceptance Criteria**:

- [ ] Toggle для включения/выключения Advanced Mode
- [ ] Checkbox для Concurrency mode
- [ ] Input для concurrency discount (%)
- [ ] Checkbox для Stock-based pricing
- [ ] Input для stock threshold
- [ ] Input для stock discount (%)
- [ ] Checkbox для Velocity-based pricing
- [ ] Input для velocity threshold (продаж/день)
- [ ] Input для velocity premium (%)
- [ ] Presets: Aggressive, Moderate, Conservative
- [ ] Real-time preview новой цены

**Technical Notes**:

- Сохранять настройки в Zustand store
- Использовать react-hook-form для управления формой
- Debounce preview calculation (300ms)

#### Story 3: Stock-Based Pricing Logic

**User Story**: Как селлер, я хочу автоматически снижать цены на товары с высокими остатками, чтобы снизить затоваренность.

**Acceptance Criteria**:

- [ ] Если stock > threshold, скидка % применяется
- [ ] Расчёт новой цены отображается в preview
- [ ] Логика учитывается при перерасчёте
- [ ] Валидация: stock discount не может быть > 50%

**Technical Notes**:

- Calculation logic в `lib/pricing-utils.ts`
- Unit tests для всех edge cases
- Integration test для API calculation

#### Story 4: Velocity-Based Pricing Logic

**User Story**: Как селлер, я хочу автоматически повышать цены на быстро продающиеся товары, чтобы увеличить маржу.

**Acceptance Criteria**:

- [ ] Если salesPerDay > threshold, premium % применяется
- [ ] Расчёт новой цены отображается в preview
- [ ] Логика учитывается при перерасчёте
- [ ] Валидация: velocity premium не может быть > 30%

**Technical Notes**:

- Calculation logic в `lib/pricing-utils.ts`
- Unit tests для всех edge cases
- Integration test для API calculation

#### Story 5: Presets for Quick Configuration

**User Story**: Как селлер, я хочу использовать presets для быстрой настройки advanced pricing, чтобы сэкономить время.

**Acceptance Criteria**:

- [ ] Preset: Aggressive (высокие margins, агрессивное повышение)
- [ ] Preset: Moderate (сбалансированные настройки)
- [ ] Preset: Conservative (низкие margins, осторожный подход)
- [ ] Пресеты заполняют все advanced parameters
- [ ] Можно кастомизировать после выбора пресета

**Technical Notes**:

- Presets определены в stores/pricing-store.ts
- Default values для каждого пресета
- Валидация что пресеты не нарушают bounds

### Dependencies

- Requires: Competitor data from backend
- Requires: Stock data from backend
- Requires: Sales velocity data from backend

### Risks

- Performance: Много API calls может замедлить UI
- UX: Слишком много настроек может запутать пользователей
- Data: Competitor data может быть некорректным

### Mitigation

- Batch requests, кеширование, lazy loading
- Smart defaults, presets, progressive disclosure
- Валидация, bounds checking, manual override

### Success Metrics

- Маржа увеличивается на 15% для активных селлеров
- Затоваренность снижается на 20%
- Селлеры используют Advanced Mode в 40%+ случаев
```

#### Результат

После этого шага у вас:

- ✅ PRD обновлён (`docs/prd.md`)
- ✅ Architecture обновлён (`docs/front-end-architecture.md`)
- ✅ Epic создан (`docs/epics/epic-advanced-price-calculator.md`)

---

### 3.3. Подготовка сторис

#### Цель

Преобразовать epic в детальные сторис, готовые для реализации.

#### Процесс

**Шаг 1: Создание сторис из epic**

```bash
# Запустить workflow для подготовки сторис
@sm: "Подготовь сторис для Epic: Advanced Price Calculator"

# ИЛИ через команду workflow
/bmad:bmm:workflows:create-story
```

**Workflow создаст сторис в формате**:

```markdown
# docs/stories/epic-advanced-calculator-story-1.md

## Story 1: Competitor Data Integration

### Status

Draft

### Epic

Advanced Price Calculator

### Story Statement

Как селлер, я хочу видеть цены конкурентов, чтобы устанавливать конкурентоспособные цены.

### Acceptance Criteria

1. Компонент отображает цены конкурентов для выбранного товара
2. Показывает минимальную, среднюю и максимальную цену
3. Links на товары конкурентов
4. Loading state при загрузке данных
5. Error handling если данные недоступны
6. Кеширование данных на 1 час

### Tasks / Subtasks

- [ ] Task 1: Создать API client для competitor data (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Добавить функцию `getCompetitorPrices(sku: string)` в `lib/api.ts`
  - [ ] Создать TypeScript types для competitor response
  - [ ] Обработать ошибки (network, 404, 500)
  - [ ] Добавить кеширование (React Query)

- [ ] Task 2: Создать CompetitorPrices component (AC: 1, 2, 3, 4, 5)
  - [ ] Создать `components/competitor/CompetitorPrices.tsx`
  - [ ] Отобразить список конкурентов с ценами
  - [ ] Показать min/avg/max prices
  - [ ] Добавить links на товары конкурентов
  - [ ] Добавить loading state
  - [ ] Добавить error message

- [ ] Task 3: Интегрировать CompetitorPrices в PriceCalculator (AC: 1, 2, 3, 4, 5)
  - [ ] Открыть `components/pricing/PriceCalculator.tsx`
  - [ ] Импортировать CompetitorPrices component
  - [ ] Отобразить competitor prices когда товар выбран
  - [ ] Убедиться что layout looks good

- [ ] Task 4: Написать тесты (AC: 4, 5, 6)
  - [ ] Unit test для `getCompetitorPrices()` function
  - [ ] Integration test для CompetitorPrices component
  - [ ] Test loading state
  - [ ] Test error handling
  - [ ] Test кеширование (mock time)

### Dev Notes

#### Existing System Context

- PriceCalculator component находится в `components/pricing/PriceCalculator.tsx`
- API client в `lib/api.ts`
- Используем React Query для data fetching
- Шаблон для API components: loading → data → error

#### Integration Points

- API: GET /api/competitors/{sku}
- Component: PriceCalculator.tsx
- State: pricing-store.ts (для caching preferences)

#### Technical Constraints

- Must use React Query with staleTime: 3600000 (1 час)
- Must show loading state within 500ms
- Must handle network errors gracefully
- TypeScript strict mode enabled

#### Testing Requirements

- Unit tests for API client
- Integration tests for component
- E2E tests for complete flow
- Coverage: минимум 80% для нового кода

#### File Locations

- Create: `components/competitor/CompetitorPrices.tsx`
- Update: `lib/api.ts` (add getCompetitorPrices)
- Update: `components/pricing/PriceCalculator.tsx` (integrate)
- Create: `components/competitor/__tests__/CompetitorPrices.test.tsx`
- Create: `lib/__tests__/api.test.ts`

### Testing

- Unit tests для `getCompetitorPrices()`
- Integration tests для CompetitorPrices component
- E2E tests для selecting product → viewing competitor prices

### Dependencies

- Requires: API endpoint GET /api/competitors/{sku}
- Depends on: Story for backend API (separate backend team)

### Risks

- Competitor data может быть недоступно для некоторых товаров
- API может быть медленным

### Mitigation

- Show placeholder если данные недоступны
- Implement loading timeout и fallback
```

**Шаг 2: Валидация сторис**

```bash
# Запустить validation через @po agent (опционально)
@po: "Валидируй сторис для Epic: Advanced Price Calculator"

# ИЛИ вручную проверить:
# - Acceptance criteria measurables?
# - Технические заметки sufficient?
# - Задачи выполнимы?
```

**Checklist для валидации**:

```markdown
## Story Validation Checklist

### Completeness

- [ ] User Story написан чётко
- [ ] Acceptance Criteria measurable (можно проверить да/нет)
- [ ] Технические заметки sufficient
- [ ] Задачи выполнимы в рамках sprint

### Quality

- [ ] ACs не ambiguous
- [ ] Нет duplicate ACs
- [ ] Edge cases рассмотрены
- [ ] Integration points чёткие

### Feasibility

- [ ] Задачи можно выполнить за sprint
- [ ] Dependencies identified
- [ ] Нет blocking issues

### Alignment

- [ ] Story aligns с epic goal
- [ ] Technical notes align с architecture
- [ ] Acceptance criteria trace к epic requirements
```

#### Результат

После этого шага у вас:

- ✅ Сторис созданы (`docs/stories/`)
- ✅ Сторис валидированы
- ✅ Сторис готовы для реализации

---

### 3.4. Реализация

#### Цель

Реализовать сторис согласно задачам и acceptance criteria.

#### Процесс

**Шаг 1: Разработка (Development)**

```bash
# Запустить реализацию сторис
@dev: "Реализуй Story 1: Competitor Data Integration"

# Workflow автоматически:
# 1. Прочитает сторис
# 2. Разобьёт задачи
# 3. Реализует код
# 4. Напишет тесты
# 5. Обновит сторис с Dev Agent Record
```

**Что сделает @dev agent**:

1. **Read Story File**
   - Load `docs/stories/epic-advanced-calculator-story-1.md`
   - Extract tasks, acceptance criteria, technical notes

2. **Implement Tasks Sequentially**
   - Task 1 → Subtasks 1.1, 1.2, 1.3, 1.4
   - Task 2 → Subtasks 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
   - Task 3 → Subtasks 3.1, 3.2, 3.3
   - Task 4 → Subtasks 4.1, 4.2, 4.3, 4.4, 4.5

3. **For Each Subtask**:
   - Read relevant files (PriceCalculator.tsx, api.ts, etc.)
   - Write code according to technical notes
   - Follow project patterns from architecture
   - Use Context7 MCP for best practices
   - Write tests

4. **Run Tests**
   - Run `npm run test` for unit/integration tests
   - Run `npm run test:e2e` for E2E tests
   - Fix any failures

5. **Update Story File**
   - Mark tasks/subtasks as completed `[x]`
   - Update Dev Agent Record section
   - Add completion notes
   - Update file list (new/modified files)

**Пример Dev Agent Record**:

````markdown
## Dev Agent Record

### Agent Model Used

Claude 3.5 Sonnet

### Debug Log References

```bash
# Initial setup
npm run test → 120 passing, 0 failing

# After Task 1 (API client)
npm run test → 124 passing, 0 failing
  Added: getCompetitorPrices() function
  Added: CompetitorData types

# After Task 2 (Component)
npm run test → 130 passing, 0 failing
  Added: CompetitorPrices component
  Added: Integration tests

# After Task 3 (Integration)
npm run test → 132 passing, 0 failing
  Updated: PriceCalculator.tsx

# After Task 4 (Tests)
npm run test → 138 passing, 0 failing
npm run test:coverage → 82% coverage

# E2E Tests
npm run test:e2e → 12 passing, 0 failing
```
````

### Completion Notes

- Successfully implemented CompetitorPrices component
- All acceptance criteria met
- Performance: Loading state appears within 200ms
- Error handling shows user-friendly messages
- Caching works as expected (staleTime: 1 hour)

### Challenges Faced

1. **API Delay**: Initial API response time was 800ms
   - Solution: Added optimistic loading with skeleton UI
2. **Type Errors**: CompetitorData type definition had circular reference
   - Solution: Simplified type structure

### File List

**Created:**

- `components/competitor/CompetitorPrices.tsx` (245 lines)
- `components/competitor/__tests__/CompetitorPrices.test.tsx` (180 lines)
- `lib/__tests__/api.test.ts` (95 lines)
- `types/competitor.ts` (23 lines)

**Modified:**

- `lib/api.ts` (+45 lines: getCompetitorPrices function)
- `components/pricing/PriceCalculator.tsx` (+12 lines: import and integration)
- `types/index.ts` (+3 lines: export CompetitorData)

### Change Log

2026-01-11: Implemented Story 1 - Competitor Data Integration

- Created CompetitorPrices component with loading/error states
- Added getCompetitorPrices() API function with caching
- Integrated into PriceCalculator component
- All tests passing (138 unit/integration, 12 E2E)
- Coverage: 82%

````

**Шаг 2: Code Review (опционально)**

```bash
# Запустить code review
@dev: "Сделай code review для Story 1: Competitor Data Integration"

# ИЛИ
/bmad:bmm:workflows:code-review
````

**Code Review найдет**:

1. **Code Quality Issues**
   - Potential bugs
   - Performance problems
   - Security vulnerabilities

2. **Architecture Compliance**
   - Follows project patterns?
   - Aligns with architecture decisions?

3. **Test Coverage**
   - Sufficient tests?
   - Missing edge cases?

4. **Best Practices**
   - TypeScript usage
   - React best practices
   - Accessibility

**Шаг 3: QA Review (обязательно)**

```bash
# Запустить QA review
@qa: "Сделай QA review для Story 1: Competitor Data Integration"

# ИЛИ
/bmad:bmm:workflows:testarch:test-review
```

**QA Review проведёт**:

1. **Requirements Traceability**
   - Каждый AC покрыт тестом?
   - Все ли требования реализованы?

2. **Quality Assessment**
   - Code quality
   - Test quality
   - Documentation

3. **Risk Assessment**
   - Потенциальные проблемы
   - Recommendations

**QA Gate Decision**:

```yaml
# QA Gate для Story 1

gate: PASS
status_reason: 'All acceptance criteria met, tests comprehensive, no critical issues'
reviewer: 'Quinn (Test Architect)'
updated: '2026-01-11T15:30:00Z'

top_issues: []

evidence:
  tests_reviewed: 138
  risks_identified: 0

nfr_validation:
  security:
    status: PASS
    notes: 'No security vulnerabilities found'
  performance:
    status: PASS
    notes: 'Loading within 200ms, caching works'
  reliability:
    status: PASS
    notes: 'Error handling comprehensive'
  maintainability:
    status: PASS
    notes: 'Code follows patterns, coverage 82%'
```

#### Результат

После этого шага у вас:

- ✅ Код реализован
- ✅ Тесты написаны и passing
- ✅ Code review выполнен (опционально)
- ✅ QA review выполнен с PASS gate

---

### 3.5. QA-валидация и подтверждение

#### Цель

Подтвердить что фича работает корректно, не ломает существующую функциональность и готова к релизу.

#### Процесс

**Шаг 1: Requirements Traceability**

```bash
# Запустить trace requirements
@qa: "Trace requirements для Story 1: Competitor Data Integration"

# ИЛИ
/bmad:bmm:workflows:testarch:trace
```

**Requirements Traceability Matrix**:

```markdown
# Requirements Traceability: Story 1

## Acceptance Criteria Coverage

| AC                                          | Test                                             | Coverage | Status  |
| ------------------------------------------- | ------------------------------------------------ | -------- | ------- |
| AC1: Компонент отображает competitor prices | CompetitorPrices.test.tsx::rendersCompetitorList | Full     | ✅ PASS |
| AC2: Показывает min/avg/max prices          | CompetitorPrices.test.tsx::showsMinAvgMax        | Full     | ✅ PASS |
| AC3: Links на товары конкурентов            | CompetitorPrices.test.tsx::hasCompetitorLinks    | Full     | ✅ PASS |
| AC4: Loading state                          | CompetitorPrices.test.tsx::showsLoadingState     | Full     | ✅ PASS |
| AC5: Error handling                         | CompetitorPrices.test.tsx::handlesError          | Full     | ✅ PASS |
| AC6: Кеширование на 1 час                   | api.test.ts::cachesForOneHour                    | Full     | ✅ PASS |

**Total Coverage**: 6/6 ACs (100%)
**Gap Analysis**: No gaps found
```

**Шаг 2: Non-Functional Requirements (NFR) Assessment**

```bash
# Запустить NFR assessment
@qa: "Оцени NFR для Story 1"

# ИЛИ
/bmad:bmm:workflows:testarch:nfr-assess
```

**NFR Assessment Report**:

```markdown
# NFR Assessment: Story 1

## Security

**Status**: PASS

- [x] No hardcoded secrets
- [x] Input validation present
- [x] XSS prevention (React auto-escapes)
- [x] No sensitive data exposure

## Performance

**Status**: PASS

- [x] Loading state within 200ms
- [x] API caching reduces redundant calls
- [x] No memory leaks detected
- [x] Component renders efficiently

## Reliability

**Status**: PASS

- [x] Error handling comprehensive
- [x] Graceful degradation when API down
- [x] Retry logic for transient errors
- [x] User-friendly error messages

## Maintainability

**Status**: PASS

- [x] Code follows project patterns
- [x] Test coverage 82% (target 80%)
- [x] Documentation present
- [x] TypeScript types comprehensive

## Overall Assessment: PASS

All NFRs met or exceeded.
```

**Шаг 3: Risk Profile (опционально)**

```bash
# Запустить risk profile
@qa: "Создай risk profile для Story 1"

# ИЛИ
/bmad:bmm:workflows:testarch:risk-profile
```

**Risk Profile**:

```markdown
# Risk Profile: Story 1

## Risks Identified

| Risk ID  | Category     | Probability | Impact     | Score | Priority |
| -------- | ------------ | ----------- | ---------- | ----- | -------- |
| PERF-001 | Performance  | Low (1)     | Medium (2) | 2     | Low      |
| DATA-001 | Data Quality | Medium (2)  | Medium (2) | 4     | Medium   |

## Risk Details

### PERF-001: Competitor API may be slow

**Probability**: Low (1) - APIs typically fast
**Impact**: Medium (2) - Could degrade UX
**Score**: 2 (Low)

**Mitigation**:

- Caching implemented (1 hour staleTime)
- Loading state shows quickly
- Fallback UI if timeout

### DATA-001: Competitor data may be missing/inaccurate

**Probability**: Medium (2) - Competitors may not have data
**Impact**: Medium (2) - Users may make suboptimal pricing decisions
**Score**: 4 (Medium)

**Mitigation**:

- Error handling shows clear message
- Manual override available
- Users can skip competitor data

## Recommendations

- Monitor API performance in production
- Add competitor data quality metrics
- Consider adding manual price override feature
```

**Шаг 4: Final QA Gate Decision**

```bash
# Создать final QA gate
@qa: "Создай QA gate для Story 1"

# ИЛИ
/bmad:bmm:workflows:testarch:gate
```

**Final QA Gate**:

```yaml
schema: 1
story: 'epic-advanced-calculator-1'
story_title: 'Competitor Data Integration'
gate: PASS
status_reason: 'All acceptance criteria met with comprehensive testing. NFRs all PASS. Minor medium risk (DATA-001) has mitigation.'
reviewer: 'Quinn (Test Architect)'
updated: '2026-01-11T16:00:00Z'

top_issues: []

waiver:
  active: false

quality_score: 95
expires: '2026-01-25T00:00:00Z' # 2 weeks

evidence:
  tests_reviewed: 138
  risks_identified: 2

trace:
  ac_covered: [1, 2, 3, 4, 5, 6]
  ac_gaps: []

nfr_validation:
  _assessed: [security, performance, reliability, maintainability]
  security:
    status: PASS
    notes: 'No security vulnerabilities found'
  performance:
    status: PASS
    notes: 'Loading within 200ms, caching works'
  reliability:
    status: PASS
    notes: 'Error handling comprehensive'
  maintainability:
    status: PASS
    notes: 'Code follows patterns, coverage 82%'

risk_summary:
  totals:
    critical: 0
    high: 0
    medium: 1
    low: 1
  highest:
    id: DATA-001
    score: 4
    title: 'Competitor data quality'
  recommendations:
    must_fix: []
    monitor:
      - 'Monitor competitor API performance'
      - 'Track data quality metrics'
```

**Шаг 5: Story Completion**

```bash
# Обновить статус сторис
@dev: "Обнови статус Story 1 на Ready for Done"
```

**Story File Update**:

```markdown
## Status

Ready for Done ✅

## QA Results

### Gate Status

Gate: PASS → docs/qa/gates/epic-advanced-calculator-1-competitor-data-integration.yml

### Final Assessment

- All acceptance criteria met
- Comprehensive testing (138 tests, 82% coverage)
- All NFRs PASS
- Minor medium risk (DATA-001) with mitigation
- Ready for production

### Recommendations for Production

- Monitor competitor API performance
- Track data quality metrics
- Consider adding manual price override feature (future)
```

**Шаг 6: Deployment (реальный или staged)**

```bash
# Deploy to staging (или production если готово)
npm run build
npm run test:e2e  # Final E2E tests on build
# Deploy to staging/production
```

#### Результат

После этого шага у вас:

- ✅ Requirements traced (100% coverage)
- ✅ NFRs assessed (all PASS)
- ✅ QA gate PASS
- ✅ Story marked Ready for Done
- ✅ Feature deployed (staging или production)

---

## Сравнение этапов

| Аспект                 | Этап 1: Становление                           | Этап 2: Повседневная разработка       |
| ---------------------- | --------------------------------------------- | ------------------------------------- |
| **Когда используется** | Новый проект или major refactor               | Добавление новой фичи                 |
| **Длительность**       | 1-2 недели                                    | 2-7 дней на фичу                      |
| **Цель**               | Создать базовую архитектуру                   | Внедрить фичу в существующую систему  |
| **Документация**       | Создаём всё с нуля (PRD, Architecture, Epics) | Обновляем существующую документацию   |
| **Разработка**         | Выбираем tech stack, устанавливаем паттерны   | Следуем существующим паттернам        |
| **Тестирование**       | Настраиваем фреймворки и процессы             | Пишем тесты для новой фичи            |
| **QA Gate**            | Валидируем базовую архитектуру                | Валидируем конкретную фичу            |
| **Участники**          | @pm, @architect, @sm, @dev, @qa               | @sm, @dev, @qa (YOU as Product Owner) |
| **Результат**          | Готовая система для разработки                | Новая фича готова к релизу            |

---

## Checklist для выбора этапа

```markdown
## Which Phase Should You Use?

### Use Phase 1 (Initialization) IF:

- [ ] Starting a NEW project from scratch
- [ ] Doing a MAJOR refactor (changing tech stack or architecture)
- [ ] Adding a completely NEW independent module
- [ ] NO PRD, Architecture, or Epic documents exist

### Use Phase 2 (Feature Development) IF:

- [ ] You have an EXISTING project with:
  - [ ] PRD created (docs/prd.md)
  - [ ] Architecture created (docs/architecture.md or similar)
  - [ ] Epics defined (docs/epics/)
  - [ ] Base tech stack installed (Next.js, TypeScript, etc.)
- [ ] You're ADDING a new feature to the existing system
- [ ] You're FIXING a bug or ENHANCING existing functionality
- [ ] You're REFACTORING existing code (no functional changes)
```

---

## Роли и ответственность

### В Этапе 1 (Становление)

| Роль                | Ответственный  | Задачи                             |
| ------------------- | -------------- | ---------------------------------- |
| **Product Owner**   | **YOU (USER)** | Бизнес-визион, приоритеты, решения |
| **Product Manager** | @pm            | Создание PRD, эпиков, сторис       |
| **Architect**       | @architect     | Проектирование архитектуры         |
| **UX Designer**     | @ux-designer   | UX дизайн (опционально)            |
| **Scrum Master**    | @sm            | Подготовка сторис для реализации   |
| **Developer**       | @dev           | Реализация сторис                  |
| **Test Architect**  | @qa            | QA валидация и gate                |

### В Этапе 2 (Повседневная разработка)

| Роль               | Ответственный  | Задачи                           |
| ------------------ | -------------- | -------------------------------- |
| **Product Owner**  | **YOU (USER)** | Анализ фичи, приоритеты, решения |
| **Scrum Master**   | @sm            | Подготовка сторис из epic        |
| **Developer**      | @dev           | Реализация сторис                |
| **Test Architect** | @qa            | QA валидация и gate              |

**Отличие**: В Этапе 2 нет @pm и @architect - они уже сделали свою работу в Этапе 1.

---

## Интеграция с BMad workflow

### Этап 1 (Становление) - BMad Workflows

```bash
# 1. Инициализация проекта
npx bmad-method init

# 2. Создание PRD
/bmad:bmm:workflows:create-prd

# 3. Создание Architecture
/bmad:bmm:workflows:create-architecture

# 4. (Опционально) Создание UX Design
/bmad:bmm:workflows:create-ux-design

# 5. Создание Эпиков и Сторис
/bmad:bmm:workflows:create-epics-and-stories

# 6. Проверка Implementation Readiness
/bmad:bmm:workflows:check-implementation-readiness
```

### Этап 2 (Повседневная разработка) - BMad Workflows

```bash
# 1. Анализ новой фичи (вы делаете это как Product Owner)
# Документируйте требования в docs/features/new-feature.md

# 2. Обновление документации
# Вручную обновите:
# - docs/prd.md (добавьте новые FRs)
# - docs/architecture.md (добавьте новые API endpoints)
# - Создайте docs/epics/new-epic.md

# 3. Подготовка сторис
/bmad:bmm:workflows:create-story

# 4. Реализация
/bmad:bmm:workflows:dev-story

# 5. (Опционально) Code Review
/bmad:bmm:workflows:code-review

# 6. QA Validation
/bmad:bmm:workflows:testarch:test-review
/bmad:bmm:workflows:testarch:trace
/bmad:bmm:workflows:testarch:nfr-assess
/bmad:bmm:workflows:testarch:gate
```

---

## Быстрый старт для WB Repricer Frontend

### Текущее состояние

WB Repricer Frontend **уже прошёл Этап 1**:

- ✅ Next.js 14 проект настроен
- ✅ Tech stack выбран (TypeScript, React Query, Zustand, shadcn/ui)
- ✅ Frontend architecture документ создан (`docs/front-end-architecture.md`)
- ✅ PRD создан (`docs/prd.md`)
- ✅ Эпики задокументированы (`docs/epics/`)
- ✅ BMad framework интегрирован

### Следующий шаг: Этап 2

**Для разработки новых фич** используйте Этап 2:

```bash
# Пример: Добавляем Advanced Price Calculator

# 1. Анализ фичи (вы как Product Owner)
Создайте docs/features/advanced-price-calculator.md с требованиями

# 2. Обновите документацию
# Добавьте новые FRs в docs/prd.md
# Обновите docs/front-end-architecture.md с новыми API endpoints
# Создайте docs/epics/epic-advanced-price-calculator.md

# 3. Подготовка сторис
/bmad:bmm:workflows:create-story

# 4. Реализация
/bmad:bmm:workflows:dev-story

# 5. QA Validation
/bmad:bmm:workflows:testarch:gate

# 6. Deploy
npm run build
# Deploy to staging/production
```

---

## Заключение

Этот документ описывает **полный цикл разработки** для WB Repricer Frontend, разделённый на два этапа:

### 🎯 Этап 1: Становление (Initialization)

- Когда: Новый проект или major refactor
- Цель: Создать базовую архитектуру и документацию
- Длительность: 1-2 недели
- Workflows: create-prd → create-architecture → create-epics-and-stories → check-implementation-readiness

### 🚀 Этап 2: Повседневная разработка (Feature Development)

- Когда: Добавление новой фичи в существующую систему
- Цель: Внедрить фичу в существующую архитектуру
- Длительность: 2-7 дней на фичу
- Workflows: Анализ фичи → Обновление документации → create-story → dev-story → QA gate → Deploy

### 💡 Ключевой принцип

**Этап 1 создаёт фундамент, Этап 2 строит на нём.**

Не пытайтесь использовать Этап 2 когда нет базовой архитектуры - вы будете переизобретать велосипед.

Не пытайтесь использовать Этап 1 когда базовая архитектура готова - вы потратите время на то, что уже сделано.

---

## Дополнительные ресурсы

### BMad Документация

- `docs/BMAD-PRODUCT-OWNER-ROLE.md` - Как быть Product Owner в BMad
- `docs/BMAD-WHO-CREATES-EPICS.md` - Кто создаёт эпики и сторис
- `docs/BMAD-INTEGRATION-STATUS-REPORT.md` - Статус BMad интеграции

### BMad Workflows

- `_bmad/bmm/workflows/1-analysis/` - Анализ workflows
- `_bmad/bmm/workflows/2-plan-workflows/` - Планирование workflows
- `_bmad/bmm/workflows/3-solutioning/` - Solutioning workflows
- `_bmad/bmm/workflows/4-implementation/` - Implementation workflows

### Проект Документация

- `docs/prd.md` - Product Requirements Document
- `docs/front-end-architecture.md` - Frontend Architecture
- `docs/epics/` - Эпики проекта

---

**Created**: 2026-01-11
**Author**: BMad Orchestrator
**Version**: 1.0.0
**Status**: Complete ✅
