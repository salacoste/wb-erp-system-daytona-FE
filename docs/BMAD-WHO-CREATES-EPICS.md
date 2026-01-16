# 🎯 Кто создаёт эпики и сторис в BMad?

## ✅ Ответ: **@pm (John)** - Product Manager

---

## 🔍 Анализ BMad Workflow Manifests

### Workflow: `create-epics-and-stories`

**Путь**: `_bmad/bmm/workflows/3-solutioning/create-epics-and-stories/workflow.md`

**Описание**:

> "Transform PRD requirements and Architecture decisions into comprehensive stories organized by user value. This workflow requires completed PRD + Architecture documents (UX recommended if UI exists) and breaks down requirements into implementation-ready epics and user stories that incorporate all available technical and design context."

---

## 📋 Агенты по всем path файлам

Проверено во всех BMad path файлах:

| Path файл                    | Workflow                 | Агент  | Статус      |
| ---------------------------- | ------------------------ | ------ | ----------- |
| `method-greenfield.yaml`     | create-epics-and-stories | **pm** | ✅ Required |
| `method-brownfield.yaml`     | create-epics-and-stories | **pm** | ✅ Required |
| `enterprise-greenfield.yaml` | create-epics-and-stories | **pm** | ✅ Required |
| `enterprise-brownfield.yaml` | create-epics-and-stories | **pm** | ✅ Required |

**Все path файлы указывают один и тот же агент: `pm`**

---

## 🎭 Роль агента PM в этом workflow

### Из workflow.md:

> **Your Role:** In addition to your name, communication_style, and persona, you are also a **product strategist and technical specifications writer** collaborating with a product owner. This is a partnership, not a client-vendor relationship. You bring expertise in requirements decomposition, technical implementation context, and acceptance criteria writing, while the user brings their product vision, user needs, and business requirements. Work together as equals.

### Основные обязанности:

1. **Requirements decomposition** - Разложение требований на составные части
2. **Epic design** - Проектирование эпиков по пользовательской ценности
3. **Story creation** - Создание детальных пользовательских сторис
4. **Acceptance criteria writing** - Написание критериев приёмки
5. **Technical context integration** - Интеграция технического контекста

---

## 📊 Workflow Steps

`create-epics-and-stories` имеет 4 шага:

| Step | Файл                                | Описание                              |
| ---- | ----------------------------------- | ------------------------------------- |
| 1    | `step-01-validate-prerequisites.md` | Валидация PRD, Architecture, UX       |
| 2    | `step-02-design-epics.md`           | Проектирование эпиков                 |
| 3    | `step-03-create-stories.md`         | Создание сторис с acceptance criteria |
| 4    | `step-04-final-validation.md`       | Финальная валидация                   |

---

## 🔄 Зависимости

**Требуемые документы** (до создания эпиков):

1. ✅ **PRD** (Product Requirements Document)
   - Создаётся: `@pm` через workflow `create-prd`

2. ✅ **Architecture Document**
   - Создаётся: `@architect` через workflow `create-architecture`

3. ⚠️ **UX Design** (опционально, но рекомендуется)
   - Создаётся: `@ux-designer` через workflow `create-ux-design`

---

## 🎯 Полный порядок разработки

### Фаза 2: Planning

```
1. @pm: create-prd → docs/prd.md
2. @ux-designer: create-ux-design → docs/ux-design.md (опционально)
```

### Фаза 3: Solutioning

```
3. @architect: create-architecture → docs/architecture.md
4. @pm: create-epics-and-stories → docs/epics.md ⭐ (ЭТОТ ШАГ)
5. @tea: test-design (опционально) → docs/test-design.md
6. @architect: check-implementation-readiness → docs/implementation-readiness.md
```

---

## 💡 Почему @pm, а не @sm?

**@pm (Product Manager)**:

- Сотрудничает с Product Owner как партнёр
- Эксперт в decomposition требований
- Понимает бизнес-ценность и пользовательские нужды
- Пишет технические спецификации и acceptance criteria

**@sm (Scrum Master)**:

- Фокусируется на процессе разработки
- Управляет спринтами и командой
- Создает story files для реализации (@sm: create-story)
- НЕ отвечает за стратегическое разложение требований

---

## 🚀 Как создать эпики в Cursor AI

### Способ 1: Через команду workflow

```bash
/bmad:bmm:workflows:create-epics-and-stories
```

### Способ 2: Через обращение к агенту

```bash
@pm: "Создай эпики и сторис на основе PRD и Architecture"
```

### Способ 3: Полный флоу

```bash
@pm: "Запусти фазу Solutioning: создай эпики и сторис"
```

---

## 📝 Шаги создания эпиков

### Предусловия:

- ✅ PRD существует
- ✅ Architecture существует
- ✅ UX дизайн (рекомендуется)

### Процесс:

1. **Validate Prerequisites** (@pm)
   - Проверяет, что все документы готовы
   - Извлекает FRs (Functional Requirements)
   - Извлекает NFRs (Non-Functional Requirements)
   - Извлекает контекст из UX/Architecture

2. **Design Epics** (@pm)
   - Группирует требования по пользовательской ценности
   - Создает структуру эпиков
   - Определяет приоритеты

3. **Create Stories** (@pm)
   - Для каждого эпика создаёт пользовательские сторис
   - Пишет детальные acceptance criteria
   - Интегрирует технический контекст из Architecture

4. **Final Validation** (@pm)
   - Проверяет completeness
   - Проверяет alignment с PRD и Architecture
   - Готовит документ к реализации

---

## 🎓 Пример использования

### В Cursor AI:

```bash
# Предварительно созданы:
@pm: "Создай PRD для аутентификации"
@architect: "Спроектируй архитектуру аутентификации"

# Теперь создаём эпики:
@pm: "Создай эпики и сторис для аутентификации на основе PRD и Architecture"

# Или напрямую:
/bmad:bmm:workflows:create-epics-and-stories
```

### Результат:

Создаётся файл: `_bmad/planning-artifacts/epics.md`

```markdown
# Epics and Stories

## Epic 1: User Registration

### Story 1.1: Sign Up Form

**User Story:** As a new user, I want to sign up with email so that I can access the application.

**Acceptance Criteria:**

- [ ] User enters valid email and password
- [ ] System validates email format
- [ ] System sends confirmation email
- [ ] User is redirected to login page

---

## Epic 2: User Login

### Story 2.1: Login Form

**User Story:** As a registered user, I want to log in so that I can access my account.

**Acceptance Criteria:**

- [ ] User enters email and password
- [ ] System validates credentials
- [ ] User is redirected to dashboard
- [ ] Session is created
```

---

## ✅ Резюме

**Кто создаёт эпики и сторис?**

🎯 **@pm (John)** - Product Manager

**Почему?**

- Во всех BMad path файлах указан агент `pm`
- Workflow требует Product Manager role
- Эксперт в requirements decomposition и technical specifications
- Партнёр Product Owner, не исполнитель

**Когда?**

- В фазе **Solutioning** (Фаза 3)
- После создания PRD и Architecture
- Перед implementation (Фаза 4)

**Что создаёт?**

- Эпики, организованные по пользовательской ценности
- Детальные пользовательские сторис
- Полные acceptance criteria
- Интегрированный технический контекст

---

## 📚 Дополнительные ресурсы

- **Workflow**: `_bmad/bmm/workflows/3-solutioning/create-epics-and-stories/workflow.md`
- **Agent Config**: `.claude/commands/BMad/core/agents/pm.agent.yaml`
- **Path Files**: `_bmad/bmm/workflows/workflow-status/paths/*.yaml`

---

## 📖 Дополнительная информация о Product Owner

**Вопрос**: "У нас нет Product агента. PO - это нормально, кто выполняет его роль? Раньше он был."

**Ответ**: Да, **Product Owner агент существует** в BMad, но работает не так, как вы ожидаете. **ВЫ (ПОЛЬЗОВАТЕЛЬ)** выполняете роль Product Owner, а агенты сотрудничают с ВАМИ как Product Owner.

### Три уровня Product Owner в BMad

1. **Оригинальный BMad PO агент** (`.bmad-core/agents/po.md`)
   - ✅ СУЩЕСТВУЕТ
   - Отвечает за backlog management, story validation, acceptance criteria
   - Перечислен в `AGENTS.md` (строка 42)

2. **Наш кастомный Cursor AI PO агент** (`.claude/commands/BMad/core/agents/po.agent.yaml`)
   - ✅ СУЩЕСТВУЕТ (создали мы)
   - Специально сконфигурирован для Cursor AI
   - Включает автоматизированную валидацию сторис и управление backlog

3. **BMad Workflow Design**
   - 🎯 **ВЫ (ПОЛЬЗОВАТЕЛЬ)** - Product Owner во всех BMad workflows
   - Из workflow.md (строка 11): _"collaborating with a product owner... Work together as equals"_
   - Product Owner - это **человеческая роль** в реальном Scrum
   - Агенты (@pm, @architect, @sm, @dev) сотрудничают с ВАМИ как партнёры

### Почему так?

1. **Агент не знает бизнес-контекст** - только ВЫ знаете своих пользователей и рынок
2. **Модель партнёрства** - агенты эксперты в технике, ВЫ эксперты в бизнесе
3. **Agile best practices** - Product Owner всегда человек в реальных командах Scrum
4. **Стратегические решения** - trade-offs, приоритеты, изменения - это человеческие решения

### Когда использовать @po агента?

**@po агент - ОПЦИОНАЛЬНЫЙ**, не используется в стандартных BMad workflows.

Используйте, когда:

- Нужна автоматизированная валидация множества сторис
- Помощь с управлением backlog и sprint planning
- Делегирование рутинных задач валидации

### Рекомендуемый подход

**Стандартный BMad подход** (рекомендуется):

- **ВЫ - Product Owner**
- Используйте `@pm` для создания PRD, эпиков, сторис (он будет сотрудничать с ВАМИ как Product Owner)
- Используйте `@architect` для архитектуры
- Используйте `@sm` для подготовки сторис
- Используйте `@dev` для реализации
- ВЫ предоставляете продукт-визион, приоритеты, бизнес-контекст

**Когда использовать @po**:

- Много сторис для валидации
- Нужна помощь с backlog management
- Хотите делегировать рутинную валидацию

---

## 📚 Дополнительное чтение

Для детального объяснения роли Product Owner в BMad:

- **`docs/BMAD-PRODUCT-OWNER-ROLE.md`** - Комплексное объяснение Product Owner роли
- Покрывает: Три уровня PO, практические примеры, когда использовать @po, рекомендуемый подход

---

**Ответ**: **@pm (Product Manager)** создаёт эпики и сторис! 🎯
