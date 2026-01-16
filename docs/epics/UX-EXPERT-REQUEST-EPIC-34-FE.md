# UX Expert Request: Epic 34-FE - Telegram Notifications UI

**Date**: 2025-12-29
**Project**: WB Repricer System
**Epic**: Epic 34-FE - Telegram Notifications User Interface
**Requestor**: Sarah (Product Owner)
**Priority**: Medium
**Timeline**: 3-5 days for design phase

---

## 📋 Project Context

### What is WB Repricer System?

**WB Repricer System** — это платформа аналитики для продавцов на Wildberries, которая автоматически импортирует финансовые отчёты, рассчитывает маржу, анализирует расходы и помогает оптимизировать бизнес.

**Target Audience**:
- Продавцы на Wildberries (русскоязычные)
- Основное использование: desktop + mobile
- Возраст: 25-45 лет
- Tech-savvy: средний уровень

### What is Epic 34-FE?

**Telegram Notifications UI** — интерфейс для настройки push-уведомлений в Telegram о фоновых задачах (импорты, синхронизации, расчёты).

**Backend Status**: ✅ COMPLETE (API готово, bot работает)
**Frontend Status**: 📋 PLANNING (ждём дизайн от вас)

---

## 🎯 Your Mission

Нам нужен **UX/UI дизайн страницы настроек Telegram-уведомлений** (`/settings/notifications`).

### Что вы будете дизайнить?

**1 страница + 5 основных компонентов**:

1. **Telegram Binding Card** — процесс привязки Telegram-аккаунта (modal flow)
2. **Notification Preferences Panel** — настройки типов уведомлений
3. **Quiet Hours Configuration** — тихие часы и timezone
4. **Status Indicator** — индикатор статуса в header/sidebar
5. **Full Page Layout** — общая компоновка `/settings/notifications`

**Plus**: Empty states, error states, loading states, mobile responsive layouts.

---

## 📚 Required Reading (Обязательно!)

### 1. Epic 34-FE — Main Document ⭐ **START HERE**

**File**: `frontend/docs/epics/epic-34-fe-telegram-notifications-ui.md`

**What's inside**:
- Problem statement (зачем нужны Telegram-уведомления)
- Solution overview (архитектура, компоненты)
- 6 stories breakdown (что нужно реализовать)
- API integration (как работает с backend)
- Success metrics

**Reading time**: 15-20 minutes

**Key sections for you**:
- "Solution Overview" — архитектура компонентов
- "User Stories" — что делает каждый компонент
- "Page Structure" — как всё компонуется на странице

---

### 2. UX Requirements — Design Questions ⭐ **MAIN TASK**

**File**: `frontend/docs/epics/epic-34-fe-UX-REQUIREMENTS.md`

**What's inside**:
- **25 design questions** (ваша главная задача — ответить на них!)
- Wireframe guidelines (ASCII mockups как референс)
- Design constraints (brand colors, typography, accessibility)
- Acceptance criteria

**Reading time**: 20-25 minutes

**Your main deliverable**: Ответы на все 25 вопросов + wireframes

---

### 3. Backend API Reference (для справки)

**File**: `frontend/docs/request-backend/73-telegram-notifications-epic-34.md`

**What's inside**:
- API endpoints и их response structures
- Example requests/responses
- Frontend integration examples

**Reading time**: 10 minutes (optional, но полезно для понимания данных)

---

### 4. Existing Design System (контекст)

**File**: `frontend/docs/front-end-spec.md`

**What's inside**:
- Текущая дизайн-система проекта
- Brand colors, typography, spacing
- Component library (shadcn/ui)

**Reading time**: 10 minutes

**Key info**:
- Primary Red: `#E53935` (основной цвет проекта)
- Telegram Blue: `#0088CC` (используйте для Telegram-специфичных элементов)
- Component library: shadcn/ui (https://ui.shadcn.com)

---

## ✅ Your Deliverables

### 1. Answers to 25 Design Questions ⭐ **REQUIRED**

**Location**: В файле `epic-34-fe-UX-REQUIREMENTS.md` есть 25 вопросов.

**Format**: Можете ответить прямо в файле или создать отдельный документ.

**Questions breakdown**:
- **Story 34.2 (Binding Flow)**: Q1-Q5 (modal layout, countdown, deep link, polling, unbind)
- **Story 34.3 (Preferences)**: Q6-Q10 (event cards, descriptions, language, digest, save strategy)
- **Story 34.4 (Quiet Hours)**: Q11-Q15 (time pickers, timezone, preview, overnight, indicator)
- **Story 34.5 (Page Layout)**: Q16-Q20 (card layout, spacing, mobile, empty state, status indicator)
- **General Design**: Q21-Q25 (localization, errors, loading, success, breakpoints)

**Critical questions** (блокируют разработку):
- ❗ **Q1**: Modal layout (центр vs side panel vs full-page?)
- ❗ **Q10**: Save strategy (auto-save vs manual button?)
- ❗ **Q16**: Card layout (vertical stack vs grid?)
- ❗ **Q19**: Empty state design
- ❗ **Q20**: Status indicator в header

---

### 2. Wireframes (Mobile + Desktop) ⭐ **REQUIRED**

**Required wireframes**:

#### A. Telegram Binding Flow (Story 34.2)
- **State 1**: Not bound (initial state with "Подключить Telegram" button)
- **State 2**: Modal — binding code display + deep link button
- **State 3**: Modal — polling indicator ("Ожидаем подтверждения...")
- **State 4**: Bound state (success, показываем @username + "Отключить" button)
- **Bonus**: Unbind confirmation dialog

**Layouts needed**: Desktop (>1024px) + Mobile (320-640px)

---

#### B. Notification Preferences Panel (Story 34.3)
- Event type toggles (4 types: completed, failed, stalled, daily_digest)
- Language switcher (ru/en with flags)
- Daily digest time picker (conditional display)

**Layouts needed**: Desktop + Mobile

---

#### C. Quiet Hours Configuration (Story 34.4)
- Quiet hours toggle
- Time pickers (from/to)
- Timezone selector
- Current time preview

**Layouts needed**: Desktop + Mobile

---

#### D. Full Page Layout (Story 34.5)
- Complete `/settings/notifications` page
- All components integrated
- Breadcrumbs
- Test notification button
- Sidebar navigation item

**Layouts needed**: Desktop + Mobile + Tablet (640-1024px)

---

#### E. Empty State & Status Indicator
- **Empty state**: Что показать, если Telegram не подключен (hero banner?)
- **Status indicator**: Иконка в header/sidebar (🔔 bound / 🔕 not bound)

**Layouts needed**: Desktop + Mobile

---

### 3. Component Specifications (optional, но желательно)

**Format**: Table или annotation в wireframes

**What to include**:
- **Spacing**: Padding, margins (в пикселях)
- **Typography**: Font sizes, weights
- **Colors**: Hex codes для всех элементов
- **Interactive states**: Hover, active, disabled

**Example**:
```
Component: Telegram Binding Button (Primary CTA)
- Size: Height 44px, Padding 16px 24px
- Background: #0088CC (Telegram blue)
- Text: 16px, Semi-bold, White
- Border-radius: 8px
- Hover: Background #0077B3
- Active: Background #006699
```

---

### 4. Interactive States Documentation (optional)

**States to show**:
- **Normal** (default state)
- **Hover** (mouse over)
- **Active** (clicked)
- **Disabled** (not available)
- **Loading** (in progress)
- **Error** (validation failed)

**Can be**: Separate artboards в Figma или annotations на wireframes.

---

## 🎨 Design Constraints & Guidelines

### Brand Colors

**Primary Palette**:
```
WB Repricer Red:    #E53935  (primary brand)
Telegram Blue:      #0088CC  (use for Telegram elements)
Success Green:      #22C55E
Error Red:          #EF4444
Warning Yellow:     #F59E0B
Neutral Gray:       #9CA3AF
```

**When to use**:
- **#E53935** — primary buttons НЕ связанные с Telegram (например, "Сохранить")
- **#0088CC** — всё что касается Telegram (binding button, status indicator)
- **#22C55E** — success states (bound status, successful save)
- **#EF4444** — errors, unbind action

---

### Typography

**Current project typography** (см. `front-end-spec.md`):
- **H1**: 32px, Bold (page title)
- **H2**: 24px, Semi-bold (section headers)
- **Body**: 14-16px, Regular
- **Labels**: 14px, Medium

**Recommendation**: Следуйте текущей типографике проекта для консистентности.

---

### Component Library

**We use**: shadcn/ui (https://ui.shadcn.com)

**Available components** (используйте эти как базу):
- **Switch** — для toggles
- **Dialog** — для modal
- **Select** — для dropdowns (timezone, time pickers)
- **Button** — для CTA buttons
- **Alert** — для error/success messages
- **Badge** — для status indicators

**Your task**: Адаптировать под наш brand (colors, spacing), не изобретать с нуля.

---

### Responsive Breakpoints

**Mobile**: <640px (стакаем всё вертикально)
**Tablet**: 640-1024px (возможно 2 columns для некоторых секций)
**Desktop**: >1024px (full layout с sidebar)

**Critical**: Все wireframes должны иметь mobile + desktop версии.

---

### Accessibility Requirements

**Must have**:
- ✅ WCAG 2.1 AA compliance
- ✅ Color contrast ≥4.5:1 для текста
- ✅ Focus indicators visible
- ✅ Keyboard navigation support
- ✅ Screen reader support (aria-labels)

**Please annotate**: Где нужны aria-labels, какие элементы focusable.

---

## 📐 Wireframe Format & Tools

### Preferred Format

**Tools** (выбирайте что удобно):
1. **Figma** ⭐ (preferred, легко делиться)
2. Adobe XD
3. Sketch
4. High-fidelity wireframes (PDF/PNG)

**What to include**:
- ✅ Page layouts (full page views)
- ✅ Component close-ups (zoom на каждую карточку)
- ✅ Interactive states (hover, active, disabled)
- ✅ Mobile vs Desktop comparisons
- ✅ Annotations (spacing, colors, notes)

---

### Figma Best Practices (если используете Figma)

**Structure**:
```
Epic 34-FE: Telegram Notifications
│
├─ 📄 Cover (overview + design decisions summary)
├─ 🎨 Design System (colors, typography, components)
│
├─ 📱 Mobile Wireframes
│   ├─ Binding Flow (4 states)
│   ├─ Preferences Panel
│   ├─ Quiet Hours
│   ├─ Full Page
│   └─ Empty State
│
├─ 💻 Desktop Wireframes
│   ├─ Binding Flow (4 states)
│   ├─ Preferences Panel
│   ├─ Quiet Hours
│   ├─ Full Page
│   └─ Empty State
│
└─ 📋 Component Specs (spacing, colors, typography)
```

**Share link**: Editable link (чтобы мы могли оставлять комментарии).

---

## ⏰ Timeline & Milestones

### Phase 1: Research & Questions (Day 1-2)

**Tasks**:
- ✅ Read Epic 34-FE document
- ✅ Read UX Requirements document
- ✅ Review existing design system (`front-end-spec.md`)
- ✅ Answer 25 design questions

**Deliverable**: Answers document (можно Google Doc или прямо в markdown)

**Timeline**: 1-2 days

---

### Phase 2: Initial Wireframes (Day 3-4)

**Tasks**:
- ✅ Create low-fidelity wireframes (all 5 components)
- ✅ Desktop + Mobile layouts
- ✅ Basic interactive states

**Deliverable**: Figma link (или PDF) с wireframes

**Timeline**: 1-2 days

**Checkpoint**: PO review — мы дадим feedback, возможно попросим доработать

---

### Phase 3: High-Fidelity & Specs (Day 5)

**Tasks**:
- ✅ Apply brand colors, typography
- ✅ Add component specifications
- ✅ Document interactive states
- ✅ Final polish

**Deliverable**: Final Figma file + component specs

**Timeline**: 1 day

**Checkpoint**: Final approval → handoff to frontend team

---

### Total Timeline: 3-5 days

**Flexible**: Если нужно больше времени на конкретный этап — скажите, мы подстроимся.

---

## 🤝 Communication & Questions

### How to Ask Questions

**Preferred method**:
- 📧 Email: [ваш email здесь]
- 💬 Slack: #ux-design channel
- 📞 Meeting: можем созвониться если нужно что-то обсудить

**Response time**: Мы отвечаем в течение 4-8 часов (рабочие дни).

---

### Clarification Meeting (optional)

Если после прочтения документации остались вопросы:

**Format**: 30-min video call
**Participants**: Sarah (PO), UX Expert, опционально — frontend lead
**Agenda**:
- Вы задаёте вопросы по Epic
- Мы объясняем контекст
- Обсуждаем критичные design decisions

**Schedule**: Пишите если нужно, организуем в течение 24h.

---

## 📊 Success Criteria

### Your design will be approved if:

**Functionality**:
- ✅ Все 25 вопросов answered
- ✅ Wireframes для всех 6 stories (34.1-34.6)
- ✅ Mobile + Desktop layouts
- ✅ Empty states, error states, loading states показаны

**Quality**:
- ✅ WCAG 2.1 AA compliance
- ✅ Consistent с existing design system
- ✅ Clear component hierarchy
- ✅ Responsive layouts (320px+)

**Clarity**:
- ✅ Annotations понятны frontend team
- ✅ Interactive states documented
- ✅ Spacing/colors specified

---

## 🎯 What Happens Next

### After You Submit Design

**Step 1**: PO Review (Sarah)
- Review wireframes
- Check answers to 25 questions
- Provide feedback (1-2 days)

**Step 2**: Iteration (if needed)
- Revisions based on feedback
- Final approval

**Step 3**: Frontend Handoff
- Design approved
- Frontend team starts Story 34.1-FE (TypeScript types)
- Stories 34.2-34.5 (UI) начинаются после approval

**Timeline**: Development ~7-10 дней после design approval

---

## 📁 File Locations (Summary)

**All files in**: `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend/docs/`

| Document | Path | Purpose |
|----------|------|---------|
| **Epic 34-FE** | `epics/epic-34-fe-telegram-notifications-ui.md` | ⭐ Main epic document |
| **UX Requirements** | `epics/epic-34-fe-UX-REQUIREMENTS.md` | ⭐ 25 questions + wireframe guidelines |
| **Changelog** | `CHANGELOG-EPIC-34-FE.md` | Quick summary + status tracking |
| **Backend API** | `request-backend/73-telegram-notifications-epic-34.md` | API reference (optional read) |
| **Design System** | `front-end-spec.md` | Existing design system |

---

## 💡 Tips for Success

### Do's ✅

- **Start with low-fi**: Не тратьте время на pixel-perfect в начале, сначала утвердите концепцию
- **Ask questions early**: Лучше спросить сейчас, чем переделывать потом
- **Use existing components**: shadcn/ui уже есть, адаптируйте под наш brand
- **Think mobile-first**: Большинство пользователей на мобильных
- **Annotate everything**: Frontend team должен понимать ваши решения

### Don'ts ❌

- **Don't ignore 25 questions**: Это критично для разработки
- **Don't design in isolation**: Если что-то непонятно — спрашивайте
- **Don't skip mobile layouts**: Это не optional
- **Don't overcomplicate**: Простота > сложность
- **Don't forget accessibility**: WCAG AA — это requirement, не nice-to-have

---

## 🚀 Ready to Start?

### Quick Start Checklist

**Day 1 Morning**:
- [ ] Read `epic-34-fe-telegram-notifications-ui.md` (20 min)
- [ ] Read `epic-34-fe-UX-REQUIREMENTS.md` (25 min)
- [ ] Review `front-end-spec.md` (10 min)
- [ ] Skim `request-backend/73-telegram-notifications-epic-34.md` (10 min)

**Day 1 Afternoon**:
- [ ] Answer critical questions (Q1, Q10, Q16, Q19, Q20)
- [ ] Draft answers для остальных 20 вопросов
- [ ] Send us answers для early feedback (optional)

**Day 2-3**:
- [ ] Create low-fidelity wireframes
- [ ] Desktop + Mobile layouts
- [ ] Share for checkpoint review

**Day 4-5**:
- [ ] Apply brand colors, typography
- [ ] Add component specs
- [ ] Final polish
- [ ] Submit для approval

---

## 📞 Contact Information

**Product Owner**: Sarah
**Email**: [your-email@example.com]
**Slack**: @sarah #ux-design
**Availability**: Mon-Fri, 10:00-18:00 MSK

**Questions?** Don't hesitate to ask! Лучше задать 100 вопросов сейчас, чем переделывать дизайн потом 😊

---

**Good luck! Мы рады работать с вами над этим Epic! 🎨**

---

**Created**: 2025-12-29
**Last Updated**: 2025-12-29
**Status**: 📋 Awaiting UX Expert Response
