# Conductor Setup Guide - WB Repricer System Frontend

**Version:** 1.0
**Date:** 2026-01-15
**Team:** Frontend Development

---

## Что такое Conductor?

**Conductor** — это AI pair programming tool (например, Cursor), который использует конфигурацию `conductor.json` для понимания проектной структуры, лучших практик и специфики технологий.

---

## Структура Frontend Conductor

### `conductor.json`

**Location**: `frontend/conductor.json`

```json
{
  "projectRoot": "{project-root}",
  "scripts": { ... },
  "frontend": {
    "technology": "Next.js 15",
    "language": "TypeScript",
    "state": "Zustand",
    "testing": "Jest + React Testing Library + Playwright"
  },
  "backend": {
    "apiDocs": "../docs/API-PATHS-REFERENCE.md",
    "integration": "docs/api-integration-guide.md"
  },
  "paths": {
    "frontendRoot": "src/",
    "components": "src/components/",
    "hooks": "src/hooks/",
    "stores": "src/stores/",
    "types": "src/types/"
  },
  "doR": { ... },
  "doD": { ... }
}
```

---

## DoR/DoD Quick Reference

Conductor автоматически подсказывает DoR/DoD чеклисты при работе.

### Definition of Ready (DoR) — Frontend

**Минимальные требования перед разработкой:**

1. ✅ User Story формат: `As a... I want... So that...`
2. ✅ Acceptance Criteria: AC1, AC2, ... (нумерованные)
3. ✅ Context & References: Epic, UX Design, Backend API ссылки
4. ✅ UI/UX Requirements: компоненты, state, responsive
5. ✅ Accessibility: WCAG 2.1 AA минимум
6. ✅ Backend API: эндпоинты (если интеграция)

### Definition of Done (DoD) — Frontend

**Критерии завершения story:**

1. ✅ All AC executed: 100%
2. ✅ Components working: React компоненты созданы/обновлены
3. ✅ Tests passing: unit + integration
4. ✅ Visual regression: visual тесты (если применимо)
5. ✅ No breaking changes: без версионирования/миграции
6. ✅ Documentation: Storybook, компоненты задокументированы
7. ✅ QA Gate: Нет блокеров в `docs/qa/gates/`

---

## Установка

### 1. Первичная настройка

```bash
cd /Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend

# Запуск setup скрипта
./.conductor/scripts/setup.sh
```

### 2. Использование в Cursor IDE

1. **Откройте проект** в Cursor
2. **Выберите** `conductor.json` из корня проекта
3. **Начните pair programming** с AI-ассистентом

### 3. Режим работы

**Запуск Conductor:**

```bash
# Вариант 1: Использовать run скрипт
./.conductor/scripts/run.sh

# Вариант 2: Прямой запуск npm
npm run dev  # Frontend dev server
```

---

## Project Knowledge Paths

### Frontend-specific paths

| Путь | Описание |
|------|-----------|
| `src/components/` | React компоненты |
| `src/hooks/` | Custom hooks |
| `src/stores/` | Zustand stores |
| `src/lib/` | Утилиты и helper функции |
| `src/types/` | TypeScript типы |
| `docs/adr/` | Frontend ADRs (UI/UX patterns) |

### Backend API интеграция

| Ресурс | Путь |
|--------|-----|
| API endpoints | `../docs/API-PATHS-REFERENCE.md` |
| API интеграция | `docs/api-integration-guide.md` |

---

## Common Workflows

### 1. Создание нового компонента

**DoR Check:**
- ✅ User Story создан
- ✅ AC нумерованы
- ✅ UI/UX требования описаны
- ✅ Accessibility учтён

**DoD Checklist:**
- ✅ Компонент создан: `src/components/MyComponent.tsx`
- ✅ Props интерфейс определён: `type Props = { ... }`
- ✅ Хуки созданы: `useMyHook.ts`
- ✅ Тесты созданы: `MyComponent.test.tsx`
- ✅ Storybook документация создана (если применимо)

### 2. Интеграция с Backend API

**DoR Check:**
- ✅ Backend endpoint указан в AC
- ✅ Request DTO изучен
- ✅ Error handling стратегия определена
- ✅ State management спланирован (Zustand + React Query)

**DoD Checklist:**
- ✅ API вызов реализованы
- ✅ Data transformation правильная
- ✅ Error handling работает
- ✅ Loading states отображаются
- ✅ Error states UI отображаются

### 3. State Management

**DoR Check:**
- ✅ Zustand store создан: `src/stores/useXStore.ts`
- ✅ Состояние спланировано
- ✅ Actions определены

**DoD Checklist:**
- ✅ Store работает с React Query cache
✅ Optimistic updates реализованы (если нужно)
✅ Cache invalidation настроена

---

## Tips для AI Pair Programming (Frontend)

1. **Используй DoR/DoD** как чеклист для валидации stories
2. **Следуй путям** из `conductor.json` для понимания структуры
3. **Проверя accessibility** на ранних этапах разработки
4. **Тестируй компоненты** изолированно перед интеграцией
5. **Валидируй Backend API контракты** перед использованием
6. **Создавай компоненты** переиспользуемые, а не "золотые"
7. **Следуй принципам** `docs/PM-AGENT-INSTRUCTION-BMM.md`

---

## Troubleshooting

### Проблема: Conductor не видит проект структуру

**Решение:**
1. Проверьте, что `conductor.json` в корне frontend проекта
2. Убедитесь, что `projectRoot` указывает на корень проекта
3. Перезагрузите Conductor в Cursor

### Проблема: Нет подсказок по DoR/DoD

**Решение:**
1. Проверьте секции `doR` и `doD` в `conductor.json`
2. Убедитесь, что `docs/PM-AGENT-INSTRUCTION-BMM.md` существует
3. Перезагрузите Conductor после обновления файлов

---

## Полезные ресурсы

| Ресурс | Путь |
|---------|------|
| PM Agent Instruction | `docs/PM-AGENT-INSTRUCTION-BMM.md` |
| Frontend PRD | `docs/prd.md` |
| Frontend Architecture | `docs/front-end-architecture.md` |
| API Reference | `../docs/API-PATHS-REFERENCE.md` |
| Backend Integration Guide | `docs/api-integration-guide.md` |

---

**Версия:** 1.0
**Последнее обновление:** 2026-01-15
**Команда:** Frontend Development
**Поддержка:** Dev Agent (Amelia) для R2d2
