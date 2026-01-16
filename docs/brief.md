# Project Brief: WB Repricer System - Frontend

**Version:** 1.0  
**Date:** 2025-01-20  
**Author:** Mary (Business Analyst)

---

## Executive Summary

WB Repricer System Frontend is a modern web interface designed to visualize financial and commercial data for entrepreneurs and financial directors selling on the Wildberries marketplace. The solution addresses the critical need for real-time financial analysis, margin calculation, and data-driven decision-making by providing an intuitive dashboard that integrates with a fully functional backend API system.

**Key Value Proposition:** Transform complex Wildberries financial reports into actionable business insights through automated data processing, margin analysis, and comprehensive visualization tools.

**Target Market:** Entrepreneurs and financial directors of organizations selling on Wildberries marketplace who need to understand profitability, manage COGS (Cost of Goods Sold), and optimize their product portfolio.

---

## Problem Statement

### Current State and Pain Points

Entrepreneurs selling on Wildberries face significant challenges in understanding their business profitability:

1. **Data Fragmentation:** Financial data from Wildberries comes in complex report formats that require manual processing
2. **Lack of Real-Time Insights:** No immediate visibility into margin calculations, product profitability, or financial trends
3. **Manual COGS Management:** Tracking and assigning Cost of Goods Sold to products is time-consuming and error-prone
4. **Limited Analytics:** Difficulty analyzing performance across different dimensions (SKU, brands, categories, time periods)
5. **Decision-Making Delays:** Without clear financial visibility, business decisions are made with incomplete information

### Impact of the Problem

- **Time Loss:** Hours spent manually processing reports and calculating margins
- **Revenue Risk:** Inability to quickly identify unprofitable products or optimize pricing
- **Operational Inefficiency:** Lack of automated workflows for data processing and analysis
- **Strategic Blindness:** Missing critical insights needed for inventory and pricing decisions

### Why Existing Solutions Fall Short

- Generic financial tools don't understand Wildberries-specific data structures
- Spreadsheet-based solutions are error-prone and don't scale
- No integrated solution that combines data parsing, COGS management, and margin calculation
- Existing tools lack the specific workflows needed for marketplace sellers

### Urgency and Importance

The competitive nature of marketplace selling requires rapid decision-making. Delays in understanding profitability can result in:
- Continued investment in unprofitable products
- Missed opportunities to optimize profitable items
- Inability to respond quickly to market changes

---

## Proposed Solution

### Core Concept

A modern, responsive web application that serves as the frontend interface for the WB Repricer System backend. The solution provides:

1. **Automated Data Processing:** Seamless integration with backend API that handles Wildberries report parsing and data processing
2. **Intuitive Dashboard:** Real-time visualization of key financial metrics (revenue, expenses, margins)
3. **COGS Management:** Streamlined interface for assigning and managing product costs (single and bulk operations)
4. **Margin Analysis:** Automatic margin calculation and visualization across multiple dimensions
5. **Comprehensive Analytics:** Deep-dive analysis by SKU, brand, category, and time periods

### Key Differentiators

- **Marketplace-Specific:** Built specifically for Wildberries sellers, understanding their unique data structures and workflows
- **Automated Workflows:** Onboarding flow that automatically processes historical data and sets up initial analysis
- **Real-Time Calculations:** Automatic margin calculation triggered by COGS assignment
- **Integrated Experience:** Seamless connection between data ingestion, cost management, and analytics

### Why This Solution Will Succeed

- **Backend Foundation:** Fully functional backend API with 33+ endpoints already implemented and documented
- **User-Centric Design:** Focused on specific user workflows (onboarding, weekly processing, analysis)
- **Progressive Enhancement:** MVP approach allows for iterative improvement based on user feedback
- **Technical Excellence:** Modern tech stack (Next.js, TypeScript) ensures maintainability and scalability

### High-Level Vision

A comprehensive financial intelligence platform for marketplace sellers that transforms raw data into strategic business insights, enabling data-driven decisions that optimize profitability and growth.

---

## Target Users

### Primary User Segment: Business Owners / Entrepreneurs

**Demographic/Firmographic Profile:**
- Small to medium-sized businesses selling on Wildberries
- Typically manage 50-5000 SKUs
- Monthly revenue range: 500K - 50M RUB
- May have limited technical expertise but strong business acumen

**Current Behaviors and Workflows:**
- Manually download and process Wildberries financial reports weekly/monthly
- Use spreadsheets (Excel/Google Sheets) for calculations
- Spend significant time on data entry and basic analysis
- Make pricing and inventory decisions based on intuition or basic calculations

**Specific Needs and Pain Points:**
- Need to quickly understand which products are profitable
- Struggle with accurate margin calculations
- Difficulty tracking COGS across product catalog
- Want to identify trends and patterns in sales data
- Need actionable insights for business decisions

**Goals They're Trying to Achieve:**
- Maximize profitability by identifying and focusing on high-margin products
- Optimize pricing strategies based on real margin data
- Reduce time spent on manual data processing
- Make informed decisions about product portfolio management
- Understand financial performance trends over time

### Secondary User Segment: Financial Directors / CFOs

**Demographic/Firmographic Profile:**
- Financial professionals in organizations selling on Wildberries
- Responsible for financial reporting and analysis
- Need to provide insights to management and stakeholders
- Typically work with larger product catalogs (1000+ SKUs)

**Current Behaviors and Workflows:**
- Generate financial reports for management
- Analyze profitability across different business dimensions
- Monitor key financial metrics and trends
- Provide strategic recommendations based on financial data

**Specific Needs and Pain Points:**
- Need comprehensive financial overviews and summaries
- Require detailed breakdowns by various dimensions (brand, category, time)
- Want to track financial trends and identify anomalies
- Need exportable data for further analysis or reporting

**Goals They're Trying to Achieve:**
- Provide accurate financial reporting to stakeholders
- Identify financial risks and opportunities
- Support strategic decision-making with data
- Monitor business performance against targets
- Optimize financial operations and processes

---

## Goals & Success Metrics

### Business Objectives

- **User Adoption:** 80% of onboarded users complete the full onboarding flow (cabinet creation, WB token setup, initial data processing) within first week
- **Engagement:** 70% of active users access the dashboard at least 3 times per week
- **COGS Assignment:** 90% of users assign COGS to at least 50% of their products within first month
- **Time Savings:** Reduce time spent on financial data processing by 75% compared to manual methods
- **Decision Impact:** 60% of users report making pricing or inventory decisions based on insights from the system

### User Success Metrics

- **Onboarding Completion Rate:** Percentage of users who complete all onboarding steps
- **Feature Adoption:** Usage rates for key features (dashboard, COGS assignment, analytics)
- **Session Duration:** Average time users spend in the application per session
- **Return Frequency:** How often users return to the application
- **Task Completion:** Success rate of completing key workflows (COGS assignment, report viewing)

### Key Performance Indicators (KPIs)

- **Monthly Active Users (MAU):** Target growth of 20% month-over-month
- **Dashboard Load Time:** < 2 seconds for initial load, < 1 second for subsequent loads
- **API Response Time:** 95th percentile response time < 500ms
- **Error Rate:** < 1% of user actions result in errors
- **User Satisfaction Score:** Net Promoter Score (NPS) > 40
- **Feature Utilization:** 80% of users utilize margin analysis features within 30 days

---

## MVP Scope

### Core Features (Must Have)

- **Authentication System:**
  - User registration and login
  - Session management
  - JWT token handling
  - Logout functionality
  - *Rationale: Foundation for all user-specific features and data security*

- **Onboarding Flow:**
  - Cabinet creation interface
  - WB token input and validation
  - Progress indicators for automatic data processing
  - Initial setup completion confirmation
  - *Rationale: Critical first-time user experience that sets up the entire system*

- **Main Dashboard (Business Owner View):**
  - Large metric cards: Total Payable, Revenue
  - Expense breakdown visualization
  - Trend graphs for key metrics
  - Quick access to detailed analytics
  - *Rationale: Primary interface users will see daily, must provide immediate value*

- **COGS Management:**
  - Single product COGS assignment interface
  - Bulk COGS assignment capability
  - COGS input validation
  - Visual confirmation of assignments
  - *Rationale: Critical workflow that enables margin calculation - core value proposition*

- **Basic Financial Summary:**
  - Overview of financial data
  - Key metrics display
  - Basic filtering capabilities
  - *Rationale: Essential for understanding financial position*

- **API Integration:**
  - Complete integration with all 33+ backend endpoints
  - Proper authentication header handling (JWT + Cabinet ID)
  - Error handling and user feedback
  - Loading states and progress indicators
  - *Rationale: Backend is ready, frontend must fully utilize available functionality*

### Out of Scope for MVP

- Advanced analytics with custom date ranges
- Export functionality (CSV, PDF reports)
- Multi-cabinet management for single user
- User role management and permissions
- Real-time notifications and alerts
- Mobile native applications
- Advanced data visualization (heatmaps, complex charts)
- Integration with other marketplaces
- Automated pricing recommendations
- Historical data comparison tools

### MVP Success Criteria

The MVP is considered successful when:

1. **Functional Completeness:** All core features are implemented and working end-to-end
2. **User Onboarding:** Users can complete onboarding and see their data within 10 minutes
3. **COGS Workflow:** Users can assign COGS to products and see margin calculations automatically
4. **Dashboard Value:** Dashboard provides meaningful insights that users find valuable
5. **Performance:** Application loads quickly and responds to user actions without noticeable delays
6. **Stability:** System handles errors gracefully and provides clear feedback to users
7. **Integration:** All critical backend endpoints are properly integrated and functional

---

## Post-MVP Vision

### Phase 2 Features

**Enhanced Analytics:**
- Advanced filtering and segmentation
- Custom date range selection
- Comparative analysis (period-over-period)
- Drill-down capabilities from summary to detail

**Product Management:**
- Product catalog management interface
- Bulk operations for product data
- Product grouping and tagging
- Custom product attributes

**Reporting and Export:**
- Generate and export financial reports (PDF, Excel)
- Scheduled report generation
- Custom report builder
- Email report delivery

**User Experience Enhancements:**
- Personalized dashboard layouts
- Saved views and filters
- Keyboard shortcuts
- Advanced search functionality

**Collaboration Features:**
- Multi-user access to cabinets
- Role-based permissions
- Activity logs and audit trails
- Team collaboration tools

### Long-Term Vision (1-2 Years)

**Platform Expansion:**
- Support for additional marketplaces (Ozon, Yandex Market)
- Multi-marketplace unified dashboard
- Cross-marketplace analytics

**Intelligence and Automation:**
- AI-powered pricing recommendations
- Predictive analytics for sales forecasting
- Automated anomaly detection
- Smart alerts and notifications

**Enterprise Features:**
- Advanced user management and SSO
- API access for enterprise integrations
- White-label solutions
- Custom branding options

**Data Integration:**
- Integration with accounting systems
- CRM integrations
- Warehouse management system connections
- E-commerce platform connectors

### Expansion Opportunities

- **B2B Marketplace:** Allow service providers to offer analytics and consulting services
- **API Marketplace:** Open API for third-party developers to build integrations
- **Mobile Applications:** Native iOS and Android apps for on-the-go access
- **International Expansion:** Adapt for other marketplaces globally
- **White-Label Solution:** License the platform to other companies

---

## Technical Considerations

### Platform Requirements

- **Target Platforms:** Web browsers (desktop and tablet primary, mobile responsive)
- **Browser/OS Support:** 
  - Modern browsers: Chrome, Firefox, Safari, Edge (latest 2 versions)
  - Desktop: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)
  - Tablet: iPadOS 14+, Android 10+
  - Mobile: iOS 14+, Android 10+ (responsive design)
- **Performance Requirements:**
  - Initial page load: < 3 seconds
  - Time to interactive: < 5 seconds
  - Dashboard data load: < 2 seconds
  - API response handling: < 500ms for 95th percentile

### Technology Preferences

- **Frontend:** 
  - Next.js (React framework) - chosen for SSR, routing, and performance
  - TypeScript - for type safety and developer experience
  - Modern ES+ syntax
- **Backend:** 
  - Already implemented and ready for integration
  - REST API with Swagger documentation
  - JWT authentication
- **Database:** 
  - Managed by backend (not frontend concern)
- **Hosting/Infrastructure:** 
  - PM2 service for process management
  - Deployment strategy to be determined (Vercel, AWS, or self-hosted)

### Architecture Considerations

- **Repository Structure:** 
  - Modular component architecture
  - Feature-based folder organization
  - Shared utilities and hooks
  - API client layer separation
- **Service Architecture:** 
  - API service layer for backend communication
  - State management (considering React Context, Zustand, or Redux)
  - Custom hooks for data fetching and business logic
- **Integration Requirements:** 
  - RESTful API integration with proper error handling
  - Authentication token management
  - Cabinet ID context management
  - Real-time data synchronization where needed
- **Backend Documentation Location:**
  - **Primary Documentation:** All backend team documentation is located in `../docs/frontend-po/` directory
  - This directory contains comprehensive API documentation, user flows, data visualization recommendations, and workflow specifications
  - **Critical for Development:** All frontend developers must reference this documentation when implementing API integrations
  - Documentation includes: API endpoint specifications, authentication requirements, data models, user flow diagrams, and business logic explanations
- **Security/Compliance:** 
  - Secure token storage (httpOnly cookies or secure localStorage)
  - XSS protection
  - CSRF protection
  - Input validation and sanitization
  - Secure API communication (HTTPS)

---

## Constraints & Assumptions

### Constraints

- **Budget:** Development resources allocated for frontend implementation
- **Timeline:** MVP delivery target to be determined based on scope and resources
- **Resources:** 
  - Development team size and composition
  - Backend API is ready and stable
  - Design resources availability
- **Technical:** 
  - Must work with existing backend API (33+ endpoints, specific authentication model)
  - TypeScript and Next.js are required technologies
  - File size constraints: All source files must be < 200 lines
  - Code quality: Must pass ESLint with max-lines-per-file: 200 rule

### Key Assumptions

- Backend API is stable and will not undergo major changes during frontend development
- Users have reliable internet connectivity for web application access
- Users are comfortable with web-based interfaces (no need for desktop application)
- Wildberries API tokens are available to users and can be obtained through their WB account
- Users understand basic financial concepts (revenue, expenses, margins, COGS)
- Backend handles all data processing, frontend focuses on presentation and user interaction
- Initial user base will be Russian-speaking (UI/UX in Russian, but code comments in English)
- Users primarily access from desktop/tablet devices (mobile is secondary)

---

## Risks & Open Questions

### Key Risks

- **Backend API Changes:** Risk that backend API might change during development, requiring frontend updates
  - *Mitigation: Establish API versioning strategy, maintain close communication with backend team*

- **Performance with Large Datasets:** Risk that dashboard might be slow with users who have thousands of products
  - *Mitigation: Implement pagination, lazy loading, and data virtualization strategies*

- **User Adoption:** Risk that users might not complete onboarding or understand the value proposition
  - *Mitigation: Invest in clear onboarding UX, provide tooltips and help documentation*

- **COGS Workflow Complexity:** Risk that COGS assignment might be too complex or time-consuming for users
  - *Mitigation: Design intuitive bulk assignment interface, provide templates and import options*

- **Data Accuracy:** Risk that users might input incorrect COGS values, leading to wrong margin calculations
  - *Mitigation: Implement validation, provide confirmation dialogs, allow corrections*

- **Browser Compatibility:** Risk that application might not work consistently across all target browsers
  - *Mitigation: Comprehensive testing across browser matrix, use progressive enhancement*

### Open Questions

- What is the expected number of concurrent users at launch?
- What is the maximum number of products/SKUs a single user might have?
- Are there specific design system or UI component library preferences?
- What is the preferred deployment and hosting strategy?
- Should the application support offline functionality or is online-only acceptable?
- Are there specific accessibility requirements (WCAG compliance level)?
- What is the expected data retention policy for user data?
- Should the application support multiple languages at launch or start with Russian only?

### Areas Needing Further Research

- **User Research:** Conduct interviews with target users to validate workflows and feature priorities
- **Competitive Analysis:** Research existing solutions in the marketplace analytics space
- **Performance Benchmarking:** Establish performance baselines and optimization targets
- **Security Audit:** Review security requirements and best practices for financial data applications
- **Accessibility Standards:** Determine specific accessibility requirements and testing approach
- **Analytics Integration:** Research and select appropriate analytics tools for user behavior tracking

---

## Appendices

### A. Research Summary

**Backend Functionality Analysis:**
- Comprehensive backend API with 33+ REST endpoints
- Full Swagger documentation available
- Authentication via JWT tokens with cabinet-based access control
- Automated data processing capabilities (product parsing, financial report processing)
- Margin calculation engine integrated in backend

**User Flow Analysis:**
- Critical onboarding flow: Registration → Cabinet Creation → WB Token → Auto Data Processing → COGS Assignment → Margin Calculation
- Weekly processing workflow for new financial reports
- Analysis workflows for different user personas (business owner vs. financial director)

**Data Visualization Recommendations:**
- Use Intl.NumberFormat for currency (RUB) and percentage formatting
- Color coding: Green (positive), Red (negative), Blue (primary metrics)
- Date formats: ISO weeks (YYYY-Www), dates (DD.MM.YYYY)
- Dashboard should prioritize large, readable metric cards

**Backend Team Documentation:**
- **Location:** All backend team documentation is located in `../docs/frontend-po/` directory (relative to frontend project root)
- **Purpose:** This documentation was created by the backend team specifically for frontend development
- **Contents:** Complete API specifications, user flow documentation, data visualization guidelines, and workflow details
- **Usage:** Frontend developers should reference this documentation as the primary source of truth for:
  - API endpoint details and request/response formats
  - Authentication and authorization requirements
  - Data models and structures
  - Business logic and workflow explanations
  - Integration patterns and best practices
- **Access:** All team members should have access to this directory and be familiar with its contents before starting development

### B. Stakeholder Input

**Development Team:**
- Emphasis on using Context7 MCP server for best practices
- TypeScript with ES+ syntax required
- File size constraints (200 lines max) for AI context optimization
- All code comments and logs in English

**Product Requirements:**
- MVP focus on core functionality: Authentication, Onboarding, Dashboard, COGS Management
- Priority on user experience and intuitive workflows
- Integration with existing backend is critical path

### C. References

**Backend Team Documentation (Primary Source):**
- **Documentation Location:** `../docs/frontend-po/` directory (relative to frontend project root)
- **Important:** This is the authoritative source for all backend API information, user flows, and integration requirements
- **Team Access:** All frontend team members must familiarize themselves with this documentation before starting development work

**Key Documentation Files:**
- [README.md](../docs/frontend-po/README.md) - Navigation and quick start guide
- [00-EXECUTIVE-SUMMARY.md](../docs/frontend-po/00-EXECUTIVE-SUMMARY.md) - System overview and high-level architecture
- [01-backend-functionality-analysis.md](../docs/frontend-po/01-backend-functionality-analysis.md) - Complete backend API analysis with all 33+ endpoints
- [02-user-flows-and-business-value.md](../docs/frontend-po/02-user-flows-and-business-value.md) - Detailed user flows and business value explanation
- [03-data-visualization-recommendations.md](../docs/frontend-po/03-data-visualization-recommendations.md) - Data visualization guidelines and formatting standards
- [04-cogs-and-margin-workflow.md](../docs/frontend-po/04-cogs-and-margin-workflow.md) - Critical COGS and margin calculation workflow details

**Note for Developers:** When implementing any feature that requires backend integration, always start by reviewing the relevant documentation in `../docs/frontend-po/` to ensure proper understanding of API contracts, data structures, and business logic.

**Technical Resources:**
- Backend API Swagger UI: `http://localhost:3000/api`
- Next.js Documentation: https://nextjs.org/docs
- TypeScript Documentation: https://www.typescriptlang.org/docs/

---

## Next Steps

### Immediate Actions

1. **Review and Validate Project Brief**
   - Stakeholder review of this document
   - Confirm scope and priorities
   - Address open questions and assumptions

2. **Create Frontend Architecture Document**
   - Define technical architecture
   - Establish project structure
   - Document coding standards and patterns
   - Plan API integration strategy
   - Reference backend documentation in `../docs/frontend-po/` for API specifications

3. **Create Product Requirements Document (PRD)**
   - Detailed feature specifications
   - User story definitions
   - Acceptance criteria
   - Technical requirements

4. **Design System and UI/UX Specifications**
   - Create design system or select component library
   - Design key user interfaces (dashboard, COGS management, onboarding)
   - Define interaction patterns and user flows
   - Create responsive design specifications

5. **Set Up Development Environment**
   - Initialize Next.js project with TypeScript
   - Configure ESLint with file size constraints
   - Set up API client layer
   - Establish development workflow
   - Ensure all developers have access to and understand backend documentation in `../docs/frontend-po/`

6. **Create Epic and User Stories**
   - Break down MVP features into epics
   - Create detailed user stories with acceptance criteria
   - Prioritize stories for development
   - Plan sprint structure

### PM Handoff

This Project Brief provides the full context for WB Repricer System - Frontend. Please start in 'PRD Generation Mode', review the brief thoroughly to work with the user to create the PRD section by section as the template indicates, asking for any necessary clarification or suggesting improvements.

The brief establishes:
- Clear problem statement and solution approach
- Target user personas and their needs
- MVP scope with must-have features
- Technical considerations and constraints
- Success metrics and KPIs
- Post-MVP vision for future development

Key areas requiring PM attention:
- Detailed feature specifications for each MVP component
- User story creation with specific acceptance criteria
- Integration requirements with backend API
- User experience flow definitions
- Success metrics validation and tracking strategy

---

**Document Status:** Draft - Ready for Review  
**Next Review Date:** TBD  
**Owner:** Product Manager / Business Analyst

