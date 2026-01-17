---
stepsCompleted: ['validate-prerequisites', 'design-epics', 'create-stories']
inputDocuments: ['docs/prd.md', 'docs/front-end-architecture.md', 'docs/front-end-spec.md']
---

# WB Repricer System Frontend - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for WB Repricer System Frontend, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

**Project:** WB Repricer System - Frontend MVP
**Date:** 2026-01-17
**Total Epics:** 4
**Total Stories:** 21
**Total Estimated Points:** 64

## Requirements Inventory

### Functional Requirements

- FR1: User registration and login functionality with JWT token-based authentication
- FR2: User sessions, including secure token storage and automatic session expiration
- FR3: Complete onboarding flow that guides users through cabinet creation, WB token input, and initial data processing setup
- FR4: WB tokens validation during onboarding and provide clear feedback on validation status
- FR5: Progress indicators during automatic data processing (product parsing and financial report loading)
- FR6: Main dashboard view for business owners displaying large metric cards for Total Payable and Revenue
- FR7: Expense breakdowns visualization with appropriate charts and graphs
- FR8: Trend graphs for key financial metrics over time
- FR9: Quick access links from dashboard to detailed analytics views
- FR10: COGS (Cost of Goods Sold) assignment to individual products through a single product interface
- FR11: Bulk COGS assignment operations for multiple products simultaneously
- FR12: COGS input validation with clear error messages for invalid entries
- FR13: Visual confirmation when COGS assignments are successfully saved
- FR14: Automatic margin calculation triggered when COGS is assigned to products
- FR15: Margin analysis results across multiple dimensions: SKU, brand, category, and time periods
- FR16: Basic financial summary view with overview of financial data and key metrics
- FR17: Basic filtering capabilities in financial summary views
- FR18: Integration with all 33+ backend API endpoints as documented in the backend API specification
- FR19: Authentication header handling (JWT token + Cabinet ID) for all API requests
- FR20: Comprehensive error handling with user-friendly error messages for API failures
- FR21: Loading states and progress indicators during API operations
- FR22: Currency values formatted using Intl.NumberFormat with locale 'ru-RU' and currency 'RUB'
- FR23: Percentage values formatted using Intl.NumberFormat with style 'percent'
- FR24: Dates displayed in ISO week format (YYYY-Www) and standard date format (DD.MM.YYYY)
- FR25: Color coding: Green for positive values, Red for negative values, Blue for primary metrics

### NonFunctional Requirements

- NFR1: Browser support - Chrome, Firefox, Safari, Edge (latest 2 versions)
- NFR2: Responsive design - desktop (Windows 10+, macOS 10.15+, Linux Ubuntu 20.04+), tablet (iPadOS 14+, Android 10+), mobile (iOS 14+, Android 10+)
- NFR3: Initial page load < 3 seconds
- NFR4: Time to interactive < 5 seconds
- NFR5: Dashboard data load < 2 seconds
- NFR6: API response p95 < 500ms
- NFR7: Error rate < 1% of user actions
- NFR8: Secure token storage (httpOnly cookies or secure localStorage)
- NFR9: XSS protection measures
- NFR10: CSRF protection
- NFR11: Input validation and sanitization
- NFR12: HTTPS-only API communication
- NFR13: Max 200 lines per source file
- NFR14: ESLint max-lines-per-file: 200 rule
- NFR15: TypeScript with ES+ syntax for all code
- NFR16: English for code comments, logs, API response handling
- NFR17: Next.js framework (SSR, routing, performance)
- NFR18: Modular component architecture with feature-based folders
- NFR19: Separation: API client, service layer, UI components
- NFR20: Graceful authentication token refresh and expiration handling

### Additional Requirements

**State Management:**
- Server State: TanStack Query (React Query v5)
- Client State: Zustand (auth, UI state)
- Form State: React Hook Form

**Component Library:**
- shadcn/ui (copy-paste architecture)
- Radix UI primitives
- Tailwind CSS styling
- Lucide React icons

**Key Technical Constraints:**
- Next.js 15.x (App Router)
- TypeScript strict mode
- 200-line file limit (strict)
- WCAG AA accessibility compliance

**Target Personas:**
- Primary: Business Owner / Entrepreneur (50-5000 SKUs, 500K-50M RUB revenue)
- Secondary: Financial Director / CFO (1000+ SKUs)

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Registration/login with JWT |
| FR2 | Epic 1 | Session management |
| FR3 | Epic 2 | Onboarding flow |
| FR4 | Epic 2 | WB token validation |
| FR5 | Epic 2 | Progress indicators |
| FR6 | Epic 3 | Dashboard metric cards |
| FR7 | Epic 3 | Expense breakdown visualization |
| FR8 | Epic 3 | Trend graphs |
| FR9 | Epic 3 | Quick access links |
| FR10 | Epic 4 | Single product COGS |
| FR11 | Epic 4 | Bulk COGS assignment |
| FR12 | Epic 4 | COGS validation |
| FR13 | Epic 4 | COGS save confirmation |
| FR14 | Epic 4 | Auto margin calculation |
| FR15 | Epic 4 | Margin analysis by dimensions |
| FR16 | Epic 3 | Financial summary view |
| FR17 | Epic 3 | Basic filtering |
| FR18 | All | 33+ API integration |
| FR19 | Epic 1 | Auth headers (JWT + Cabinet) |
| FR20 | All | Error handling |
| FR21 | All | Loading states |
| FR22 | All | Currency formatting |
| FR23 | All | Percentage formatting |
| FR24 | All | Date formatting |
| FR25 | All | Color coding |

## Epic List

### Epic 1-FE: Foundation & Authentication (5 stories, 13 points)
Users can register, log in, and securely access the application.

### Epic 2-FE: Onboarding & Initial Data Setup (4 stories, 14 points)
New users can complete setup by creating a cabinet, providing their Wildberries token, and viewing their initial processed data.

### Epic 3-FE: Dashboard & Financial Overview (5 stories, 16 points)
Business owners can quickly understand their financial position through key metrics, expense breakdowns, and trend visualizations.

### Epic 4-FE: COGS Management & Margin Analysis (7 stories, 21 points)
Users can assign COGS (single and bulk), see automatic margin calculations, and analyze profitability across multiple dimensions.

---

## Epic 1: Foundation & Authentication

**Epic Goal:** Users can register, log in, and securely access the application with proper session management.

**FRs Covered:** FR1, FR2, FR18, FR19, FR20, FR21
**NFRs Covered:** NFR8-NFR13, NFR15-NFR20

---

### Story 1.1: Project Foundation & Infrastructure Setup

**As a** developer,
**I want** a properly configured Next.js project with TypeScript, ESLint, and project structure,
**So that** I have a solid foundation for building the application with proper code quality standards.

**Acceptance Criteria:**

**Given** a new project directory
**When** I initialize the Next.js project
**Then** the following must be configured:

1. **Project Initialization:**
   - Next.js 15.x initialized with App Router
   - TypeScript configuration with strict mode enabled
   - ES 2020+ syntax support configured

2. **Code Quality Setup:**
   - ESLint configured with `max-lines-per-file: 200` rule
   - Prettier configured for code formatting
   - `.eslintrc.json` with custom rules

3. **Project Structure:**
   - `src/app/` for Next.js App Router
   - `src/components/` for React components
   - `src/lib/` for utilities and API client
   - `src/hooks/` for custom React hooks
   - `src/types/` for TypeScript type definitions
   - `src/stores/` for state management (Zustand)

4. **Environment Configuration:**
   - `.env.local` for environment variables
   - `.env.example` with all required variables documented
   - `NEXT_PUBLIC_API_URL` configured

5. **Build Verification:**
   - `npm run build` completes without errors
   - `npm run lint` passes with zero errors
   - Development server starts successfully with `npm run dev`

**NFRs Addressed:** NFR13, NFR14, NFR15, NFR17

---

### Story 1.2: User Registration

**As a** new user,
**I want** to register an account with my email and password,
**So that** I can access the WB Repricer System.

**Acceptance Criteria:**

**Given** I am a new user on the registration page
**When** I complete the registration form
**Then** I should be able to create my account:

1. **Registration Form Display:**
   - Email input field with validation
   - Password input field with visibility toggle
   - Submit button ("Зарегистрироваться")
   - Link to login page ("Уже есть аккаунт? Войти")

2. **Input Validation:**
   - Email format validated before submission
   - Password requires minimum 8 characters
   - Real-time validation feedback shown

3. **API Integration:**
   - POST request to `/v1/auth/register` endpoint
   - Request body: `{ email, password }`
   - JWT token received on success

4. **Success Flow:**
   - Token stored securely (httpOnly cookie or localStorage)
   - Redirect to login page with success message
   - Success message displayed: "Регистрация успешна. Войдите в систему."

5. **Error Handling:**
   - Duplicate email: "Этот email уже зарегистрирован. Войдите в систему."
   - Network error: "Ошибка сети. Попробуйте снова."
   - Validation error: Inline error messages

**FRs Addressed:** FR1
**NFRs Addressed:** NFR8, NFR11, NFR12

---

### Story 1.3: User Login

**As a** registered user,
**I want** to log in with my email and password,
**So that** I can access my account and dashboard.

**Acceptance Criteria:**

**Given** I am a registered user on the login page
**When** I enter my credentials and submit
**Then** I should be logged into the application:

1. **Login Form Display:**
   - Email input field
   - Password input field with visibility toggle
   - "Remember me" checkbox
   - Submit button ("Войти")
   - Link to registration page ("Нет аккаунта? Зарегистрироваться")

2. **Form Validation:**
   - Email and password fields required
   - Basic format validation before submission
   - Submit button disabled while processing

3. **API Integration:**
   - POST request to `/v1/auth/login` endpoint
   - Request body: `{ email, password }`
   - JWT token and user data received on success

4. **Success Flow:**
   - JWT token stored securely
   - Cabinet ID stored if available
   - User redirected to dashboard (`/dashboard`)
   - If no cabinet exists, redirect to onboarding

5. **Error Handling:**
   - Invalid credentials: "Неверный email или пароль"
   - Network error: "Ошибка сети. Попробуйте снова."
   - Loading state shown during API call

6. **Session Persistence:**
   - Token persists across page refreshes
   - "Remember me" extends session duration

**FRs Addressed:** FR1, FR19
**NFRs Addressed:** NFR8, NFR11, NFR20

---

### Story 1.4: Session Management & Logout

**As a** logged-in user,
**I want** my session to be managed securely and be able to log out,
**So that** my account remains secure and I can end my session when done.

**Acceptance Criteria:**

**Given** I am logged into the application
**When** I interact with session features
**Then** my session should be managed properly:

1. **Protected Routes:**
   - Middleware validates JWT token on protected routes
   - Redirect to login if token is invalid or expired
   - Cabinet ID validated from user context

2. **Logout Functionality:**
   - Logout button in sidebar or navbar
   - Clears stored token and session data
   - Clears cabinet ID from context
   - Redirects to login page after logout

3. **Token Refresh:**
   - Automatic token refresh before expiration (if supported by backend)
   - Graceful handling of token expiration during session
   - Redirect to login with message on refresh failure

4. **Multi-Tab Consistency:**
   - Logout in one tab affects all tabs
   - Session state synchronized across tabs

5. **Error Handling:**
   - 401 responses trigger redirect to login
   - 403 responses show "Нет доступа" message
   - Network errors handled with retry option

**FRs Addressed:** FR2, FR20
**NFRs Addressed:** NFR8, NFR9, NFR10, NFR20

---

### Story 1.5: API Client Layer & Authentication Headers

**As a** developer,
**I want** a centralized API client that handles authentication headers automatically,
**So that** all API calls include proper JWT token and Cabinet ID headers without code duplication.

**Acceptance Criteria:**

**Given** the application needs to communicate with the backend API
**When** API calls are made
**Then** they should be handled properly:

1. **API Client Service:**
   - `src/lib/api.ts` with centralized request handling
   - Base URL configured via `NEXT_PUBLIC_API_URL`
   - Methods: `get()`, `post()`, `put()`, `patch()`, `delete()`

2. **Authentication Headers:**
   - JWT token automatically included in `Authorization` header
   - Cabinet ID included in `X-Cabinet-Id` header when available
   - Headers read from Zustand auth store

3. **Error Handling:**
   - `ApiError` class for typed error handling
   - 401 errors trigger logout and redirect
   - 403 errors show permission message
   - 422 errors show validation details
   - 500 errors show server error message

4. **Request/Response Transformation:**
   - JSON request/response handling
   - Automatic parsing of API responses
   - Error data extraction for display

5. **Loading States:**
   - Request interceptor for loading state tracking
   - Optional loading callback for UI integration

**FRs Addressed:** FR18, FR19, FR21
**NFRs Addressed:** NFR12, NFR19

---

## Epic 2: Onboarding & Initial Data Setup

**Epic Goal:** New users can complete setup by creating a cabinet, providing their Wildberries token, and viewing their initial processed data.

**FRs Covered:** FR3, FR4, FR5
**NFRs Covered:** NFR3-NFR7

---

### Story 2.1: Cabinet Creation Interface

**As a** new user,
**I want** to create my first cabinet during onboarding,
**So that** I can organize my Wildberries business data.

**Acceptance Criteria:**

**Given** I have just logged in and have no cabinet
**When** I navigate through the onboarding flow
**Then** I should be able to create my cabinet:

1. **Cabinet Creation Form:**
   - Cabinet name input field (required)
   - Form validation before submission
   - Submit button ("Создать кабинет")
   - Clear instructions shown

2. **Input Validation:**
   - Cabinet name required (min 2 characters)
   - Real-time validation feedback
   - Error messages for invalid input

3. **API Integration:**
   - POST request to `/v1/cabinets` endpoint
   - Request body: `{ name }`
   - Cabinet ID received in response

4. **Success Flow:**
   - Cabinet ID stored in user context/state
   - Success message displayed: "Кабинет создан"
   - Automatically redirected to next onboarding step (WB token)

5. **Error Handling:**
   - Validation error: Inline error message
   - API error: "Не удалось создать кабинет. Попробуйте снова."
   - Loading state during API call

6. **Form State:**
   - Form prevents multiple submissions while processing
   - Input preserved on error

**FRs Addressed:** FR3
**NFRs Addressed:** NFR3, NFR5, NFR7

---

### Story 2.2: WB Token Input & Validation

**As a** new user,
**I want** to input and save my Wildberries API token,
**So that** the system can automatically fetch and process my financial data.

**Acceptance Criteria:**

**Given** I have created my cabinet
**When** I reach the WB token input step
**Then** I should be able to save my token:

1. **Token Input Form:**
   - Token input field (password-type for security)
   - Clear instructions on where to find the token
   - "Показать" toggle button to view/hide token
   - Submit button ("Сохранить токен")

2. **Input Validation:**
   - Token format validated (basic length check)
   - Error message if empty: "Введите токен Wildberries"
   - Real-time validation feedback

3. **API Integration:**
   - PUT request to `/v1/cabinets/{cabinetId}/wb-token` endpoint
   - Request body: `{ wb_api_token: string }`
   - Token validation response received

4. **Success Flow:**
   - Success message: "Токен сохранен. Загрузка данных начнется автоматически."
   - Token stored (encrypted) via API
   - Redirected to data processing status step

5. **Error Handling:**
   - Invalid token: "Неверный токен. Проверьте и попробуйте снова."
   - API error: "Ошибка сохранения токена. Попробуйте снова."
   - Option to skip (if backend allows)

**FRs Addressed:** FR3, FR4
**NFRs Addressed:** NFR5, NFR7

---

### Story 2.3: Data Processing Status Indicators

**As a** user who just completed onboarding,
**I want** to see the status of automatic data processing,
**So that** I understand what the system is doing and when my data will be ready.

**Acceptance Criteria:**

**Given** I have saved my WB token
**When** the system processes my historical data
**Then** I should see processing status:

1. **Status Screen Display:**
   - Large heading: "Загрузка данных"
   - Progress indicators shown
   - Current step highlighted
   - Estimated time remaining (if available)

2. **Progress Indicators:**
   - Product parsing: "Загрузка товаров (3 месяца)"
   - Financial reports: "Загрузка финансовых отчетов"
   - Each step shows checkbox or spinner

3. **Real-time Updates:**
   - Status polled every 2-3 seconds
   - Progress updates displayed dynamically
   - Completion percentage shown (if available)

4. **Information Display:**
   - Clear explanation of each processing step
   - "Обычно занимает 2-5 минут" message
   - Support contact link if taking too long

5. **Completion Handling:**
   - Success message when complete: "Данные успешно загружены!"
   - Automatic redirect to dashboard after 2 seconds
   - Confetti or celebration animation (optional)

6. **Error Handling:**
   - Error state displayed if processing fails
   - Retry button shown: "Попробовать снова"
   - Support contact: "Связаться с поддержкой"

**FRs Addressed:** FR3, FR5, FR21
**NFRs Addressed:** NFR3, NFR5, NFR6

---

### Story 2.4: Initial Data Display After Processing

**As a** user who completed onboarding,
**I want** to see my processed product and financial data,
**So that** I can verify the system has successfully loaded my information.

**Acceptance Criteria:**

**Given** my data processing is complete
**When** I view the initial data display
**Then** I should see my processed data:

1. **Dashboard Display:**
   - Main dashboard page rendered
   - Product count displayed: "Загружено N товаров"
   - Key metrics shown (if available)
   - Call-to-action: "Назначьте себестоимость для расчета маржи"

2. **Data Formatting:**
   - Currency values formatted (1 234 567,89 ₽)
   - Dates formatted correctly (DD.MM.YYYY or YYYY-Www)
   - Percentages formatted (45.5%)

3. **Data Loading:**
   - Data loads within 2 seconds (NFR5)
   - Loading skeleton shown during fetch
   - Error handling if no data available

4. **Empty State Handling:**
   - If no products: "Товары не найдены. Проверьте токен Wildberries."
   - Guidance on next steps
   - Link to settings to update token

5. **Navigation:**
   - Can navigate to detailed views
   - Sidebar navigation functional
   - Breadcrumbs shown

**FRs Addressed:** FR3, FR21, FR22, FR24
**NFRs Addressed:** NFR3, NFR5

---

## Epic 3: Dashboard & Financial Overview

**Epic Goal:** Business owners can quickly understand their financial position through key metrics, expense breakdowns, and trend visualizations.

**FRs Covered:** FR6, FR7, FR8, FR9, FR16, FR17, FR22, FR24, FR25
**NFRs Covered:** NFR1-NFR7

---

### Story 3.1: Main Dashboard Layout & Navigation

**As a** logged-in user,
**I want** to see a main dashboard with navigation structure,
**So that** I can access all major features of the application.

**Acceptance Criteria:**

**Given** I have completed onboarding
**When** I navigate to the dashboard
**Then** I should see the main layout:

1. **Dashboard Layout:**
   - Sidebar navigation (left side)
   - Top navbar (header)
   - Main content area (center/right)
   - Responsive layout for all devices

2. **Sidebar Navigation:**
   - Navigation items: Dashboard, COGS Management, Analytics, Settings
   - Active page highlighted (red background)
   - Collapsible on mobile/tablet
   - Logout button at bottom

3. **Top Navbar:**
   - Application title/logo
   - Search bar (if applicable)
   - User profile icon/avatar
   - Notifications icon (if applicable)

4. **User Information:**
   - User email/name displayed in header
   - Current cabinet selector (if multiple cabinets)
   - Logout accessible from navigation

5. **Responsive Design:**
   - Desktop: Full sidebar + navbar
   - Tablet: Collapsed sidebar
   - Mobile: Hamburger menu for sidebar

6. **Accessibility:**
   - Keyboard navigation works (Tab, Enter, Escape)
   - ARIA labels on navigation items
   - Focus states visible

**FRs Addressed:** FR9, NFR2, NFR18
**NFRs Addressed:** NFR1, NFR2

---

### Story 3.2: Key Metric Cards Display

**As a** business owner,
**I want** to see large metric cards showing Total Payable and Revenue on the dashboard,
**So that** I can quickly understand my financial position at a glance.

**Acceptance Criteria:**

**Given** I am viewing the dashboard
**When** the metrics are loaded
**Then** I should see metric cards:

1. **Metric Card Display:**
   - "К перечислению" (Total Payable) card
   - "Выручка" (Revenue) card
   - Large, prominent display
   - Blue color for primary metrics

2. **Value Formatting:**
   - Currency format: `Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' })`
   - Example: "1 234 567,89 ₽"
   - Proper spacing for thousands

3. **Card Design:**
   - Card background: White or light gray
   - Shadow for depth
   - Border radius: 8px
   - Padding for readability

4. **Loading States:**
   - Skeleton loader shown while fetching
   - Shimmer animation
   - Graceful degradation

5. **Error Handling:**
   - Error message if data unavailable
   - Retry button option
   - Detailed error logged

6. **Responsiveness:**
   - Cards stack vertically on mobile
   - Adjust size for different screen sizes
   - Maintain readability

**FRs Addressed:** FR6, FR22, FR25
**NFRs Addressed:** NFR3, NFR5, NFR7

---

### Story 3.3: Expense Breakdown Visualization

**As a** business owner,
**I want** to see a breakdown of expenses visualized on the dashboard,
**So that** I can understand where my money is being spent.

**Acceptance Criteria:**

**Given** I am viewing the dashboard
**When** expense data is available
**Then** I should see expense breakdown:

1. **Chart Display:**
   - Expense breakdown chart rendered
   - Chart type: Bar chart or Pie chart (as per design)
   - Different expense categories shown

2. **Data Integration:**
   - Data fetched from API endpoint
   - Categories: logistics, storage, commissions, etc.
   - Values formatted as currency (RUB)

3. **Interactivity:**
   - Tooltips on hover showing details
   - Category labels clickable (if drill-down available)
   - Hover effects for engagement

4. **Loading State:**
   - Skeleton chart shown during fetch
   - Spinner while loading
   - Error state if unavailable

5. **Color Coding:**
   - Different colors for categories
   - Legend showing color mapping
   - Consistent with design system

6. **Responsive Design:**
   - Chart resizes appropriately
   - Scrollable on mobile if needed
   - Maintains readability

**FRs Addressed:** FR7, FR22
**NFRs Addressed:** NFR3, NFR5, NFR7

---

### Story 3.4: Trend Graphs for Key Metrics

**As a** business owner,
**I want** to see trend graphs showing how key metrics change over time,
**So that** I can identify patterns and trends in my business performance.

**Acceptance Criteria:**

**Given** I am viewing the dashboard
**When** trend data is available
**Then** I should see trend graphs:

1. **Graph Display:**
   - Line chart showing metric changes over time
   - At least one key metric (Revenue, Total Payable, or both)
   - Time period displayed (weeks or months)

2. **Date Formatting:**
   - Dates formatted as DD.MM.YYYY or ISO weeks (YYYY-Www)
   - Time labels on x-axis
   - Values on y-axis formatted correctly

3. **Interactivity:**
   - Tooltips on hover showing exact values
   - Clickable data points (if drill-down available)
   - Zoom or pan (if implemented)

4. **Data Integration:**
   - Data fetched from backend API
   - Loading state during fetch
   - Error handling for data unavailability

5. **Responsive Design:**
   - Graph resizes appropriately
   - Scrollable horizontally on mobile
   - Touch-friendly interactions

6. **Quick Access Links:**
   - Links to detailed analytics views
   - "Подробнее" button for each trend
   - Navigation to time period analysis

**FRs Addressed:** FR8, FR9, FR24
**NFRs Addressed:** NFR3, NFR5

---

### Story 3.5: Financial Summary View

**As a** financial director,
**I want** to view a comprehensive financial summary with key metrics,
**So that** I can analyze the overall financial position.

**Acceptance Criteria:**

**Given** I am on the dashboard or analytics section
**When** I view the financial summary
**Then** I should see summary data:

1. **Summary Page/Section:**
   - Overview of financial data
   - Key metrics organized in readable format
   - Proper section heading

2. **Key Metrics Display:**
   - Revenue, expenses, profit shown
   - Metrics formatted (currency, percentages)
   - Comparison to previous period (if available)

3. **Filtering Capabilities:**
   - Basic time period filter
   - Category filter (if applicable)
   - Filter controls clearly labeled

4. **Data Integration:**
   - Fetched from backend API endpoints
   - Loading states handled
   - Error states with retry options

5. **Navigation:**
   - Can navigate to detailed views
   - Breadcrumbs for navigation
   - Link back to dashboard

6. **Responsive Design:**
   - Summary cards stack on mobile
   - Filters accessible on all devices
   - Readable at all screen sizes

**FRs Addressed:** FR16, FR17, FR22
**NFRs Addressed:** NFR3, NFR5

---

## Epic 4: COGS Management & Margin Analysis

**Epic Goal:** Users can assign COGS (single and bulk), see automatic margin calculations, and analyze profitability across multiple dimensions.

**FRs Covered:** FR10, FR11, FR12, FR13, FR14, FR15, FR22, FR23, FR25
**NFRs Covered:** NFR1-NFR7

---

### Story 4.1: Single Product COGS Assignment Interface

**As a** business owner,
**I want** to assign COGS to individual products through a dedicated interface,
**So that** I can set the cost basis for margin calculations.

**Acceptance Criteria:**

**Given** I am in the COGS Management section
**When** I select a product to assign COGS
**Then** I should be able to assign COGS:

1. **COGS Assignment Interface:**
   - Product list or search functionality
   - Can select a product to assign COGS
   - Product details shown (name, SKU, current COGS if any)

2. **COGS Input:**
   - Input field accepts numeric values with decimal support
   - Currency symbol shown (₽)
   - Current value displayed if editing

3. **Input Validation:**
   - Only positive numeric values allowed
   - Real-time validation feedback
   - Error message: "Введите положительное число"

4. **Save Functionality:**
   - Save button submits COGS assignment
   - API call to update COGS
   - Success confirmation displayed

5. **Visual Confirmation:**
   - Success message: "COGS сохранен"
   - Updated value displayed
   - Margin automatically recalculated

6. **Error Handling:**
   - Error messages for invalid inputs
   - API failure handling
   - Retry option on failure

**FRs Addressed:** FR10, FR12, FR13
**NFRs Addressed:** NFR7

---

### Story 4.2: Bulk COGS Assignment Capability

**As a** business owner with many products,
**I want** to assign COGS to multiple products at once,
**So that** I can efficiently set costs for my entire product catalog.

**Acceptance Criteria:**

**Given** I am in the COGS Management section
**When** I select bulk assignment mode
**Then** I should be able to bulk assign COGS:

1. **Bulk Assignment Interface:**
   - Product list with checkboxes
   - Select all functionality
   - Filter + select options
   - Manual selection available

2. **Selection Management:**
   - Selection count displayed
   - "Select All" checkbox
   - Clear selection option

3. **Bulk COGS Input:**
   - Single COGS input field for selected products
   - Value applies to all selected
   - Preview shows affected products

4. **Preview & Confirm:**
   - Preview before submission
   - Shows product count and COGS value
   - Can modify selection or value before confirm

5. **Bulk Save Processing:**
   - API call to bulk assignment endpoint
   - Progress indicator for large operations
   - Shows "Processing..." state

6. **Results Display:**
   - Success: "X продуктов обновлено"
   - Partial: "X успешно, Y неудачно"
   - Failed items listed with reasons

**FRs Addressed:** FR11, FR12, FR13
**NFRs Addressed:** NFR3, NFR7

---

### Story 4.3: COGS Input Validation & Error Handling

**As a** user assigning COGS,
**I want** clear validation and error messages,
**So that** I can correct mistakes and ensure data accuracy.

**Acceptance Criteria:**

**Given** I am entering COGS values
**When** validation occurs
**Then** I should receive clear feedback:

1. **Real-time Validation:**
   - Validates as user types
   - Immediate error display
   - Clear visual indication of errors

2. **Error Messages:**
   - Negative number: "Значение должно быть положительным"
   - Non-numeric: "Введите число"
   - Empty: "Обязательное поле"

3. **Visual Feedback:**
   - Input field highlighted on error
   - Error message shown below field
   - Success indicator on valid input

4. **API Validation:**
   - Backend validation errors displayed
   - User-friendly error messages
   - Specific error details shown

5. **Form Prevention:**
   - Submit disabled while invalid
   - Cannot submit with errors
   - Clear all errors before submit

**FRs Addressed:** FR12, FR20
**NFRs Addressed:** NFR11

---

### Story 4.4: Automatic Margin Calculation Display

**As a** user who assigned COGS,
**I want** to see margin calculations automatically appear,
**So that** I can immediately understand product profitability.

**Acceptance Criteria:**

**Given** I have assigned COGS to a product
**When** the calculation is complete
**Then** I should see margin data:

1. **Automatic Trigger:**
   - Margin calculation triggered on COGS save
   - No manual action required
   - Backend handles calculation

2. **Margin Display:**
   - Margin percentage shown
   - Format: `Intl.NumberFormat('ru-RU', { style: 'percent' })`
   - Example: "45,5%"

3. **Color Coding:**
   - Green for positive margins (>0%)
   - Red for negative margins (<0%)
   - Applied to text or background

4. **Loading State:**
   - "Расчет..." shown during calculation
   - Skeleton or spinner
   - Updates when complete

5. **Error Handling:**
   - Warning if calculation fails: "COGS сохранен, маржа рассчитывается"
   - Retry or refresh option
   - Error logged for debugging

**FRs Addressed:** FR14, FR22, FR23, FR25
**NFRs Addressed:** NFR6

---

### Story 4.5: Margin Analysis by SKU

**As a** business owner,
**I want** to view margin analysis organized by individual SKU,
**So that** I can identify which specific products are most profitable.

**Acceptance Criteria:**

**Given** I am in the Analytics section
**When** I view margin by SKU
**Then** I should see SKU analysis:

1. **Margin Analysis View:**
   - Products organized by SKU (nm_id)
   - Each row shows product name, COGS, revenue, margin
   - Sortable by margin percentage, revenue, or name

2. **Data Display:**
   - Product name (sa_name) shown
   - SKU (nm_id) displayed
   - COGS value (₽)
   - Revenue (₽)
   - Margin percentage (%)

3. **Sorting & Filtering:**
   - Sortable columns
   - Basic search by product name
   - Filter by margin range

4. **Color Coding:**
   - Margin values color-coded
   - Green: positive margins
   - Red: negative margins

5. **Data Integration:**
   - Fetched from backend API
   - Loading and error states handled
   - Responsive design

**FRs Addressed:** FR15, FR22
**NFRs Addressed:** NFR3, NFR5

---

### Story 4.6: Margin Analysis by Brand & Category

**As a** business owner,
**I want** to view margin analysis aggregated by brand and category,
**So that** I can understand profitability at a higher level for strategic decisions.

**Acceptance Criteria:**

**Given** I am in the Analytics section
**When** I view margin by brand or category
**Then** I should see aggregated analysis:

1. **Aggregated Views:**
   - Brand-level aggregation
   - Category-level aggregation
   - Toggle between views

2. **Metrics Displayed:**
   - Total revenue (₽)
   - Total COGS (₽)
   - Average margin (%)
   - Product count
   - Contribution to total (%)

3. **Data Organization:**
   - Sorted by revenue or margin
   - Drill-down capability to SKU level
   - Expandable sections

4. **Formatting:**
   - Currency values formatted (₽)
   - Percentages formatted (%)
   - Numbers properly formatted

5. **Navigation:**
   - Tabs or selector for Brand/Category
   - Breadcrumbs for navigation
   - Link to detailed SKU view

**FRs Addressed:** FR15, FR22
**NFRs Addressed:** NFR3, NFR5

---

### Story 4.7: Margin Analysis by Time Period

**As a** financial director,
**I want** to view margin trends over different time periods,
**So that** I can track profitability changes and identify trends.

**Acceptance Criteria:**

**Given** I am in the Analytics section
**When** I view margin trends over time
**Then** I should see time-based analysis:

1. **Time Period Selection:**
   - Week selector available
   - Month selector available
   - Date range picker (if implemented)
   - Preset options (Last 4 weeks, etc.)

2. **Trend Visualization:**
   - Line chart showing margin changes over time
   - Margin percentage on y-axis
   - Dates on x-axis
   - Interactive tooltips

3. **Data Display:**
   - Margin percentages formatted correctly
   - Dates formatted as DD.MM.YYYY or YYYY-Www
   - Multiple data series if comparison enabled

4. **Interactivity:**
   - Chart interactive with tooltips
   - Zoom/pan capability (if implemented)
   - Click on data points for details

5. **Data Integration:**
   - Fetched from backend API
   - Loading and error states handled
   - Responsive design

**FRs Addressed:** FR15, FR22, FR24
**NFRs Addressed:** NFR3, NFR5

---

## Summary

| Epic | Stories | Points | FRs |
|------|---------|--------|-----|
| Epic 1: Foundation & Authentication | 5 | 13 | FR1, FR2, FR18, FR19, FR20, FR21 |
| Epic 2: Onboarding & Initial Data Setup | 4 | 14 | FR3, FR4, FR5 |
| Epic 3: Dashboard & Financial Overview | 5 | 16 | FR6, FR7, FR8, FR9, FR16, FR17, FR22, FR24, FR25 |
| Epic 4: COGS Management & Margin Analysis | 7 | 21 | FR10, FR11, FR12, FR13, FR14, FR15, FR22, FR23, FR25 |
| **Total** | **21** | **64** | **All 25 FRs covered** |

## Document Metadata

**Created:** 2026-01-17
**Author:** PM Agent (John)
**Status:** Ready for Development
**Version:** 1.0

---

*This document follows the BMad Create Epics and Stories workflow template structure.*
