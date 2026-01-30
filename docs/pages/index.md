# Pages Documentation

This section contains documentation organized by application pages for easier maintenance and navigation.

## Overview

Each page folder contains:
- Page description and features
- Related stories and implementation details
- Integration analysis and API documentation
- Testing documentation

## Available Pages

### [Dashboard](./dashboard/)
Financial analytics dashboard with period selection, key metrics, and trend analysis.

**Key Features:**
- Period selector (day/week/month/custom)
- Real-time metrics (revenue, margin, ROAS, orders)
- Trend graphs and visualizations
- COGS and advertising coverage tracking
- E2E tests for critical flows

**Documentation:**
- Epic 60 stories and implementation plans
- Integration validation reports
- Period selector component docs
- Testing guides

---

### [Products](./products/)
Product catalog management with COGS assignment and margin calculation.

**Key Features:**
- Product list with search and filters
- Bulk COGS upload (Excel/CSV)
- Single and bulk COGS assignment
- Margin calculation and polling
- Historical COGS versions

**Documentation:**
- Margin integration analysis
- COGS temporal logic guide
- Backend integration patterns
- Polling strategy documentation

---

### [Analytics](./analytics/)
Advanced analytics pages for financial insights and advertising performance.

**Key Features:**
- Weekly financial analytics
- Advertising campaign analysis
- ROI and ROAS tracking
- Time-series data visualization

**Documentation:**
- Advertising integration analysis
- API response format guides
- Empty state handling
- Date range filtering

---

### [Orders](./orders/)
Orders management and FBS integration.

**Key Features:**
- Order list with filters
- FBS status tracking
- Order details view
- Historical analytics

**Documentation:**
- Orders FBS integration guide
- API endpoint references
- Status tracking patterns

---

### [Supplies](./supplies/)
Supply planning and inventory management.

**Key Features:**
- Stockout risk analysis
- Reorder quantity calculations
- Supply planning tools
- Storage analytics

**Documentation:**
- Supply planning API guide
- Storage integration analysis
- Liquidity and turnover metrics

---

## General Reference

- [General Frontend Integration Analysis](../GENERAL-FRONTEND-INTEGRATION-ANALYSIS.md) - Overall frontend architecture and integration patterns
- [API Integration Guide](../api-integration-guide.md) - Complete endpoint catalog
- [Frontend Spec](../front-end-spec.md) - Design system and UI/UX guidelines
- [Epic and Stories Tracker](../EPICS-AND-STORIES-TRACKER.md) - Project status and roadmap

---

**Last Updated:** 2026-01-30
