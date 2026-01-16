# Request #89: Epic 34-FE - Telegram Notifications Analytics Endpoint

**Date**: 2025-12-30
**Status**: 🟡 **PENDING** - Awaiting backend implementation
**Priority**: P1 - CRITICAL (blocks production monitoring for Epic 34)
**Related**: Epic 34 (Telegram Notifications), Request #73 (Telegram Notifications API)
**Requested By**: Frontend Team (Epic 34-FE monitoring implementation)
**Estimated Effort**: 4-6 hours (0.5-1 day)
**Target Completion**: 2025-12-31

---

## 🎯 Executive Summary

**What**: Реализация analytics endpoint для мониторинга Telegram notifications в production

**Why**:
- ✅ Frontend Epic 34-FE: Telegram Notifications UI - **100% COMPLETE** (8 компонентов, 6 stories)
- ✅ Frontend monitoring integration - **100% COMPLETE** (15 metrics, auto-batching, SSR-safe)
- ❌ Backend analytics endpoint - **NOT IMPLEMENTED** (блокирует production visibility)

**Impact Without Analytics**:
- ❌ Слепы к проблемам binding flow (не знаем completion rate, failure reasons)
- ❌ Не видим API errors до user complaints
- ❌ Не понимаем adoption metrics (сколько users используют notifications)
- ❌ Невозможно измерить success metrics из Epic 34 requirements

**Business Value**:
- ✅ Early detection проблем (binding failures, API errors)
- ✅ Data-driven decisions (какие features users используют)
- ✅ Performance monitoring (average binding duration, API latency)
- ✅ Product metrics (adoption rate, feature usage, quiet hours adoption)

---

## 📊 Frontend Implementation Status

**Completed (2025-12-30)**:

**Core Files**:
- ✅ `src/lib/analytics/analytics.service.ts` - Event batching service (30s intervals)
- ✅ `src/lib/analytics/telegram-metrics.ts` - 15 metric tracking helpers

**Component Integrations**:
- ✅ `TelegramBindingModal.tsx` - Binding flow metrics (5 events)
- ✅ `NotificationPreferencesPanel.tsx` - Preferences tracking (4 events)
- ✅ `api-client.ts` - Auto error tracking (2 events)
- ✅ `notifications/page.tsx` - Page view & help clicks (2 events)

**Features**:
- ✅ SSR-safe (только в browser)
- ✅ Batch events every 30s (reduces API load)
- ✅ Auto-flush on page unload & tab switch
- ✅ Retry logic (max 1 retry, queue limit 100)
- ✅ User context (`cabinet_id`) auto-included

**Frontend готов отправлять события**. Нужен только backend endpoint.

---

## 🔧 API Contract

### POST /v1/analytics/events

**Purpose**: Принимает batch events от frontend (до 50 событий за раз)

**Authentication**: ❌ NO AUTH REQUIRED
- Frontend service work anonymous (no JWT)
- `cabinet_id` передается в event payload
- Analytics - non-sensitive data (метрики, не PII)

**Rate Limiting**:
- **60 requests/minute per IP** (разумно для batch every 30s)
- Превышение → 429 Too Many Requests

**Request**:
```json
{
  "events": [
    {
      "timestamp": "2025-12-30T10:00:00.000Z",
      "event_type": "telegram_binding_started",
      "category": "binding",
      "properties": {
        "source": "hero_banner"
      },
      "user_id": "optional_user_id",
      "cabinet_id": "12345"
    },
    {
      "timestamp": "2025-12-30T10:00:45.300Z",
      "event_type": "telegram_binding_completed",
      "category": "binding",
      "properties": {
        "duration_seconds": 45
      },
      "cabinet_id": "12345"
    }
  ]
}
```

**Response Success** (204 No Content):
```
(Empty body)
```

**Response Error** (400 Bad Request):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid events array",
    "details": [
      {
        "field": "events[0].timestamp",
        "issue": "Must be valid ISO 8601 timestamp"
      },
      {
        "field": "events[1].event_type",
        "issue": "Must not be empty"
      }
    ]
  }
}
```

**Response Error** (429 Too Many Requests):
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded: 60 requests/minute",
    "details": []
  }
}
```

---

## 📋 Database Schema

### Table: `analytics_events`

**Purpose**: Хранение всех analytics events для Telegram notifications

**Schema**:
```sql
CREATE TABLE analytics_events (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  properties JSONB DEFAULT '{}',
  user_id VARCHAR(100),
  cabinet_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_analytics_events_timestamp
  ON analytics_events(timestamp DESC);

CREATE INDEX idx_analytics_events_event_type
  ON analytics_events(event_type);

CREATE INDEX idx_analytics_events_category
  ON analytics_events(category);

CREATE INDEX idx_analytics_events_cabinet_id
  ON analytics_events(cabinet_id);

-- Composite index for common queries (category + event_type + time range)
CREATE INDEX idx_analytics_events_composite
  ON analytics_events(category, event_type, timestamp DESC);

-- Partial index for recent events (optimize dashboard queries)
CREATE INDEX idx_analytics_events_recent
  ON analytics_events(timestamp DESC, category, event_type)
  WHERE timestamp >= NOW() - INTERVAL '90 days';
```

**Why JSONB for properties**:
- ✅ Flexible schema (different events = different properties)
- ✅ Queryable (можем делать `properties->>'duration_seconds'`)
- ✅ Indexable (GIN index если нужно)
- ✅ No migrations при добавлении новых metrics

**Retention Policy** (рекомендация):
```sql
-- Delete events older than 90 days (run daily via cron)
DELETE FROM analytics_events
WHERE timestamp < NOW() - INTERVAL '90 days';
```

---

## 🎯 Validation Rules

### Request Validation

**Array Level**:
- ✅ `events` must be array
- ✅ `events` must have 1-50 items (защита от spam)
- ❌ Empty array → 400 Bad Request

**Event Level**:
- ✅ `timestamp` - required, valid ISO 8601, not future (max +5min clock skew)
- ✅ `event_type` - required, non-empty string, max 100 chars
- ✅ `category` - required, one of: `binding`, `preferences`, `error`, `behavior`
- ✅ `properties` - optional, valid JSON object (not array/string), max 5KB
- ✅ `user_id` - optional, string, max 100 chars
- ✅ `cabinet_id` - optional, string, max 100 chars

**Example Validation Error Response**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid events array",
    "details": [
      {
        "field": "events",
        "issue": "Must contain 1-50 events"
      }
    ]
  }
}
```

### Database Constraints

```sql
ALTER TABLE analytics_events
  ADD CONSTRAINT check_event_type_not_empty
    CHECK (LENGTH(event_type) > 0),
  ADD CONSTRAINT check_category_valid
    CHECK (category IN ('binding', 'preferences', 'error', 'behavior')),
  ADD CONSTRAINT check_timestamp_not_future
    CHECK (timestamp <= NOW() + INTERVAL '5 minutes');
```

---

## 📈 Query Endpoint (Optional - Nice to Have)

### GET /v1/analytics/telegram

**Purpose**: Aggregate analytics для Grafana dashboards

**Authentication**: ✅ REQUIRED (JWT + X-Cabinet-Id)
- Dashboards = internal tool for admins/PMs
- Sensitive business metrics (completion rates, error rates)

**Query Parameters**:
```
GET /v1/analytics/telegram?from=2025-12-01&to=2025-12-31&category=binding
```

**Response**:
```json
{
  "summary": {
    "binding_started": 150,
    "binding_completed": 145,
    "binding_failed": 3,
    "binding_expired": 2,
    "completion_rate": 0.967,
    "avg_duration_seconds": 45.3
  },
  "errors": {
    "api_errors": 5,
    "network_errors": 2,
    "top_error_messages": [
      {
        "message": "Rate limit exceeded",
        "count": 3
      },
      {
        "message": "Invalid binding code",
        "count": 2
      }
    ]
  },
  "preferences": {
    "updated_count": 89,
    "test_notifications_sent": 12
  }
}
```

**Implementation Priority**: ⚠️ **OPTIONAL**
- Can query directly in Postgres for dashboards
- Nice to have but not blocking

---

## 🧪 Acceptance Criteria

### AC1: POST /v1/analytics/events - Happy Path
**Given**: Frontend sends valid batch with 2 events
**When**: POST /v1/analytics/events with valid JSON
**Then**:
- ✅ Return 204 No Content
- ✅ All events stored in `analytics_events` table
- ✅ `created_at` populated automatically
- ✅ `properties` stored as JSONB

**Verification**:
```sql
SELECT COUNT(*) FROM analytics_events
WHERE event_type IN ('telegram_binding_started', 'telegram_binding_completed');
-- Expected: 2 rows
```

---

### AC2: POST /v1/analytics/events - Validation Errors
**Given**: Frontend sends invalid request
**When**: POST with empty array / invalid timestamp / missing fields
**Then**:
- ✅ Return 400 Bad Request
- ✅ Response includes error code + details
- ✅ NO events stored in database

**Test Cases**:
```json
// Test 1: Empty array
{"events": []}
→ 400 {"error": {"code": "VALIDATION_ERROR", "details": [...]}}

// Test 2: Future timestamp
{"events": [{"timestamp": "2030-01-01T00:00:00Z", ...}]}
→ 400 {"error": {"code": "VALIDATION_ERROR", "details": [...]}}

// Test 3: Invalid category
{"events": [{"category": "invalid_category", ...}]}
→ 400 {"error": {"code": "VALIDATION_ERROR", "details": [...]}}

// Test 4: Too many events (51+)
{"events": [... 51 events ...]}
→ 400 {"error": {"code": "VALIDATION_ERROR", "details": [...]}}
```

---

### AC3: Rate Limiting
**Given**: Client sends >60 requests in 1 minute
**When**: POST /v1/analytics/events
**Then**:
- ✅ Return 429 Too Many Requests after 60th request
- ✅ Response includes rate limit error
- ✅ Previous 60 requests were accepted (events stored)

**Rate Limit Headers** (optional):
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1672531200
```

---

### AC4: Large Batch Performance
**Given**: Frontend sends batch with 50 events (max allowed)
**When**: POST /v1/analytics/events
**Then**:
- ✅ Response time p95 < 500ms (acceptable for batch insert)
- ✅ All 50 events stored successfully
- ✅ No database performance degradation

**Performance Test**:
```bash
# Load test with k6 or Artillery
POST /v1/analytics/events (50 events) × 100 concurrent requests
→ p95 latency < 500ms
→ 0% error rate
```

---

### AC5: JSONB Properties Storage
**Given**: Event has complex properties object
**When**: POST with nested properties
**Then**:
- ✅ Properties stored as JSONB (not JSON string)
- ✅ Queryable via `properties->>'field_name'`
- ✅ Properties size < 5KB enforced

**Test Data**:
```json
{
  "events": [{
    "event_type": "telegram_binding_completed",
    "category": "binding",
    "properties": {
      "duration_seconds": 45,
      "deep_link_used": true,
      "retry_count": 0,
      "metadata": {
        "browser": "Chrome",
        "os": "macOS"
      }
    },
    "cabinet_id": "12345"
  }]
}
```

**Verification**:
```sql
SELECT properties->>'duration_seconds' as duration,
       properties->'metadata'->>'browser' as browser
FROM analytics_events
WHERE event_type = 'telegram_binding_completed';
-- Expected: duration = "45", browser = "Chrome"
```

---

### AC6: No Auth Required for POST
**Given**: Frontend calls POST /v1/analytics/events without JWT
**When**: Request sent with valid events array
**Then**:
- ✅ Return 204 No Content (NOT 401 Unauthorized)
- ✅ Events stored successfully
- ✅ No authentication checks performed

**Rationale**: Analytics service работает anonymous для reduced friction

---

### AC7: Database Indexes Performance
**Given**: Table contains 100K events
**When**: Query by timestamp + category + event_type
**Then**:
- ✅ Query uses composite index (no seq scan)
- ✅ Query time < 50ms for date range queries

**Verification**:
```sql
EXPLAIN ANALYZE
SELECT COUNT(*) FROM analytics_events
WHERE category = 'binding'
  AND event_type = 'telegram_binding_completed'
  AND timestamp >= NOW() - INTERVAL '7 days';

-- Expected: Index Scan using idx_analytics_events_composite
-- Expected: Execution time < 50ms
```

---

### AC8: Clock Skew Tolerance
**Given**: Frontend has clock skew ≤5 minutes ahead
**When**: POST with timestamp +3 minutes in future
**Then**:
- ✅ Accept event (tolerate reasonable skew)
- ✅ Return 204 No Content

**Given**: Frontend has clock skew >5 minutes ahead
**When**: POST with timestamp +10 minutes in future
**Then**:
- ❌ Reject event
- ✅ Return 400 Bad Request

---

## 📊 Monitoring & Dashboards (Grafana Examples)

### Panel 1: Binding Completion Funnel

**Purpose**: Track binding flow success rate

**SQL Query**:
```sql
SELECT
  date_trunc('day', timestamp) as day,
  COUNT(*) FILTER (WHERE event_type = 'telegram_binding_started') as started,
  COUNT(*) FILTER (WHERE event_type = 'telegram_binding_completed') as completed,
  COUNT(*) FILTER (WHERE event_type = 'telegram_binding_failed') as failed,
  COUNT(*) FILTER (WHERE event_type = 'telegram_binding_expired') as expired,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'telegram_binding_completed')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'telegram_binding_started'), 0) * 100,
    2
  ) as completion_rate_pct
FROM analytics_events
WHERE timestamp >= NOW() - INTERVAL '30 days'
  AND category = 'binding'
GROUP BY day
ORDER BY day DESC;
```

**Expected Output**:
```
   day        | started | completed | failed | expired | completion_rate_pct
--------------+---------+-----------+--------+---------+--------------------
 2025-12-30   |     150 |       145 |      3 |       2 |              96.67
 2025-12-29   |     120 |       110 |      5 |       5 |              91.67
```

**Visualization**: Line chart (started, completed, failed, expired)

---

### Panel 2: Error Breakdown

**Purpose**: Top API errors by endpoint + status code

**SQL Query**:
```sql
SELECT
  properties->>'endpoint' as endpoint,
  properties->>'status_code' as status_code,
  COUNT(*) as error_count,
  array_agg(DISTINCT properties->>'error_message') as messages
FROM analytics_events
WHERE event_type = 'telegram_api_error'
  AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY endpoint, status_code
ORDER BY error_count DESC
LIMIT 10;
```

**Expected Output**:
```
        endpoint          | status_code | error_count |          messages
--------------------------+-------------+-------------+---------------------------
 /v1/notifications/bind   |         429 |          12 | {"Rate limit exceeded"}
 /v1/notifications/status |         500 |           5 | {"Internal Server Error"}
```

**Visualization**: Table + bar chart

---

### Panel 3: Average Binding Duration

**Purpose**: Track binding performance over time

**SQL Query**:
```sql
SELECT
  date_trunc('hour', timestamp) as hour,
  AVG((properties->>'duration_seconds')::int) as avg_duration_seconds,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY (properties->>'duration_seconds')::int) as p50_seconds,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (properties->>'duration_seconds')::int) as p95_seconds,
  COUNT(*) as completions
FROM analytics_events
WHERE event_type = 'telegram_binding_completed'
  AND timestamp >= NOW() - INTERVAL '24 hours'
  AND properties ? 'duration_seconds'  -- Only events with duration
GROUP BY hour
ORDER BY hour DESC;
```

**Expected Output**:
```
       hour        | avg_duration | p50_seconds | p95_seconds | completions
-------------------+--------------+-------------+-------------+-------------
 2025-12-30 10:00  |         45.3 |          42 |          78 |          15
 2025-12-30 09:00  |         38.7 |          35 |          65 |          20
```

**Visualization**: Line chart (avg, p50, p95)

---

### Panel 4: Feature Adoption

**Purpose**: Track preference updates and feature usage

**SQL Query**:
```sql
SELECT
  event_type,
  COUNT(*) as count,
  COUNT(DISTINCT cabinet_id) as unique_users
FROM analytics_events
WHERE category IN ('preferences', 'behavior')
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY event_type
ORDER BY count DESC;
```

**Expected Output**:
```
         event_type           | count | unique_users
------------------------------+-------+--------------
 telegram_preferences_updated |    89 |           45
 telegram_event_type_toggled  |    67 |           38
 telegram_language_changed    |    12 |           12
 telegram_page_viewed         |   450 |           85
```

**Visualization**: Bar chart

---

## 🚨 Alerting Rules

### Alert 1: Binding Failure Rate High (P1)

**Condition**:
```sql
-- Check last 1 hour
WITH metrics AS (
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'telegram_binding_started') as started,
    COUNT(*) FILTER (WHERE event_type = 'telegram_binding_failed') as failed
  FROM analytics_events
  WHERE timestamp >= NOW() - INTERVAL '1 hour'
    AND category = 'binding'
)
SELECT
  CASE WHEN started > 0 AND (failed::float / started) > 0.05
    THEN 'ALERT'
    ELSE 'OK'
  END as status,
  failed,
  started,
  ROUND((failed::float / NULLIF(started, 0)) * 100, 2) as failure_rate_pct
FROM metrics;
```

**Threshold**: Failure rate >5% over last 1 hour
**Severity**: P1 (page on-call engineer)
**Action**: Investigate binding flow + API errors immediately

---

### Alert 2: API Error Rate Spike (P1)

**Condition**:
```sql
SELECT COUNT(*) as error_count
FROM analytics_events
WHERE event_type = 'telegram_api_error'
  AND timestamp >= NOW() - INTERVAL '5 minutes';
```

**Threshold**: >10 API errors in last 5 minutes
**Severity**: P1 (page on-call engineer)
**Action**: Check backend API health + rate limits

---

### Alert 3: Binding Completion Rate Dropped (P1)

**Condition**:
```sql
WITH metrics AS (
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'telegram_binding_started') as started,
    COUNT(*) FILTER (WHERE event_type = 'telegram_binding_completed') as completed
  FROM analytics_events
  WHERE timestamp >= NOW() - INTERVAL '1 hour'
    AND category = 'binding'
)
SELECT
  CASE WHEN started > 0 AND (completed::float / started) < 0.90
    THEN 'ALERT'
    ELSE 'OK'
  END as status,
  completed,
  started,
  ROUND((completed::float / NULLIF(started, 0)) * 100, 2) as completion_rate_pct
FROM metrics;
```

**Threshold**: Completion rate <90% over last 1 hour
**Severity**: P1 (notify #engineering channel)
**Action**: Review binding flow UX + polling logic

---

### Alert 4: High Expiry Rate (P2)

**Condition**:
```sql
WITH metrics AS (
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'telegram_binding_started') as started,
    COUNT(*) FILTER (WHERE event_type = 'telegram_binding_expired') as expired
  FROM analytics_events
  WHERE timestamp >= NOW() - INTERVAL '24 hours'
    AND category = 'binding'
)
SELECT
  CASE WHEN started > 0 AND (expired::float / started) > 0.10
    THEN 'WARNING'
    ELSE 'OK'
  END as status,
  expired,
  started,
  ROUND((expired::float / NULLIF(started, 0)) * 100, 2) as expiry_rate_pct
FROM metrics;
```

**Threshold**: Expiry rate >10% over last 24 hours
**Severity**: P2 (create JIRA ticket)
**Action**: Review 10-minute timeout UX + user education

---

### Alert 5: API Latency Degradation (P2)

**Condition** (requires additional tracking):
```sql
SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (
  ORDER BY (properties->>'latency_ms')::int
) as p95_latency_ms
FROM analytics_events
WHERE event_type LIKE '%_api_call%'
  AND timestamp >= NOW() - INTERVAL '1 hour'
  AND properties ? 'latency_ms';
```

**Threshold**: p95 latency >1000ms over last 1 hour
**Severity**: P2 (notify #engineering channel)
**Action**: Investigate API performance bottlenecks

---

## 📦 Implementation Checklist

### Phase 1: Database Setup (30 min)
- [ ] Create migration file: `YYYYMMDDHHMMSS_create_analytics_events_table.ts`
- [ ] Apply migration to dev environment
- [ ] Verify all indexes created correctly (`\d analytics_events`)
- [ ] Test insert performance (batch of 50 events)

### Phase 2: DTO & Validation (1h)
- [ ] Create `src/analytics/dto/analytics-events.dto.ts`
  - [ ] `CreateAnalyticsEventsDto` (request body)
  - [ ] `AnalyticsEventDto` (single event)
  - [ ] Validation decorators (@IsNotEmpty, @IsISO8601, etc.)
- [ ] Create validation pipe for array size (1-50 events)
- [ ] Add category enum validation (`binding`, `preferences`, `error`, `behavior`)
- [ ] Add future timestamp check (max +5min)
- [ ] Add properties size check (max 5KB)

### Phase 3: Controller & Service (1.5h)
- [ ] Create `src/analytics/analytics.controller.ts`
  - [ ] POST /v1/analytics/events endpoint
  - [ ] NO auth guards (anonymous endpoint)
  - [ ] Rate limiting decorator (@Throttle(60, 60))
  - [ ] Error handling (ValidationPipe, HttpException)
- [ ] Create `src/analytics/analytics.service.ts`
  - [ ] `createEvents()` method with batch insert
  - [ ] Transaction support for atomic batch
  - [ ] Error logging (without PII)
- [ ] Register module in `app.module.ts`

### Phase 4: Testing (1-1.5h)
- [ ] Unit tests: `analytics.service.spec.ts`
  - [ ] Test batch insert with valid events
  - [ ] Test validation errors
  - [ ] Test JSONB properties storage
  - [ ] Test timestamp validation
- [ ] Integration tests: `analytics.controller.spec.ts`
  - [ ] Test POST with valid batch (2 events)
  - [ ] Test POST with max batch (50 events)
  - [ ] Test POST with empty array (400)
  - [ ] Test POST with future timestamp (400)
  - [ ] Test POST with invalid category (400)
  - [ ] Test rate limiting (429 after 60 requests)
- [ ] E2E test: `analytics.e2e-spec.ts`
  - [ ] Full flow: POST → verify DB → query events

### Phase 5: Documentation (30 min)
- [ ] Update `README.md` with new endpoint
- [ ] Add Swagger/OpenAPI annotations
- [ ] Document rate limits in API docs
- [ ] Add example curl commands

### Phase 6: Monitoring Setup (Optional - 1h)
- [ ] Create Grafana dashboard with 4 panels
- [ ] Configure Prometheus metrics (if using)
- [ ] Set up alerting rules (5 alerts)

---

## 🎯 Success Metrics (Week 1 Post-Launch)

**Binding Flow**:
- ✅ Completion rate: **>90%**
  - Track: `telegram_binding_completed / telegram_binding_started`
- ✅ Average duration: **<60s**
  - Track: `AVG(properties->>'duration_seconds')`
- ✅ Failure rate: **<5%**
  - Track: `telegram_binding_failed / telegram_binding_started`

**API Health**:
- ✅ API error rate: **<2%**
  - Track: `telegram_api_error / total_api_calls`
- ✅ Network error rate: **<1%**
  - Track: `telegram_network_error / total_api_calls`

**User Engagement**:
- ✅ Page views: **>100/day**
  - Track: `COUNT(telegram_page_viewed) per day`
- ✅ Help clicks: **<10% of page views**
  - Track: `telegram_help_clicked / telegram_page_viewed`

**Performance**:
- ✅ POST /v1/analytics/events p95: **<500ms** for 50-event batch
- ✅ Dashboard queries p95: **<100ms** for 30-day range

---

## 📝 Example Requests

### Happy Path: 2 Events Batch

**Request**:
```bash
curl -X POST http://localhost:3000/v1/analytics/events \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "timestamp": "2025-12-30T10:00:00.000Z",
        "event_type": "telegram_binding_started",
        "category": "binding",
        "properties": {
          "source": "hero_banner"
        },
        "cabinet_id": "12345"
      },
      {
        "timestamp": "2025-12-30T10:00:45.300Z",
        "event_type": "telegram_binding_completed",
        "category": "binding",
        "properties": {
          "duration_seconds": 45,
          "deep_link_used": true
        },
        "cabinet_id": "12345"
      }
    ]
  }'
```

**Response** (204 No Content):
```
(Empty body)
```

---

### Error: Empty Array

**Request**:
```bash
curl -X POST http://localhost:3000/v1/analytics/events \
  -H "Content-Type: application/json" \
  -d '{"events": []}'
```

**Response** (400 Bad Request):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid events array",
    "details": [
      {
        "field": "events",
        "issue": "Must contain 1-50 events"
      }
    ]
  }
}
```

---

### Error: Future Timestamp

**Request**:
```bash
curl -X POST http://localhost:3000/v1/analytics/events \
  -H "Content-Type: application/json" \
  -d '{
    "events": [{
      "timestamp": "2030-01-01T00:00:00.000Z",
      "event_type": "telegram_binding_started",
      "category": "binding",
      "properties": {},
      "cabinet_id": "12345"
    }]
  }'
```

**Response** (400 Bad Request):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid timestamp",
    "details": [
      {
        "field": "events[0].timestamp",
        "issue": "Timestamp cannot be more than 5 minutes in the future"
      }
    ]
  }
}
```

---

### Error: Rate Limit Exceeded

**Request**: 61st request within 1 minute
```bash
curl -X POST http://localhost:3000/v1/analytics/events \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Response** (429 Too Many Requests):
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded: 60 requests/minute",
    "details": []
  }
}
```

**Headers**:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1735560000
Retry-After: 45
```

---

## 🔗 Related Documentation

**Frontend**:
- `frontend/docs/DEV-HANDOFF-EPIC-34-FE.md` - Complete monitoring implementation guide
- `frontend/src/lib/analytics/analytics.service.ts` - Event batching service (reference)
- `frontend/src/lib/analytics/telegram-metrics.ts` - 15 metric helpers (reference)

**Backend**:
- Request #73: Telegram Notifications API (base Epic 34 backend)
- Epic 34 Stories: Telegram bot implementation

**Infrastructure**:
- Grafana dashboard setup guide (в этом документе выше)
- Prometheus metrics configuration (optional)

---

## ❓ Questions for Backend Team

**Q1: Rate Limiting Strategy**
- Current implementation: Global 60 req/min per IP?
- Or per cabinet_id? (requires parsing event payload)
- Recommendation: Per IP (simpler, frontend batch = 1 request per 30s)

**Q2: Retention Policy**
- Auto-delete events >90 days?
- Or manual archival to separate cold storage?
- Recommendation: Daily cron job deletion (см. SQL выше)

**Q3: Query Endpoint Priority**
- Implement GET /v1/analytics/telegram for dashboards?
- Or query Postgres directly via Grafana?
- Recommendation: Start with direct Postgres, add API later if needed

**Q4: Prometheus Integration**
- Expose metrics via /metrics endpoint?
- Or rely solely on database queries?
- Recommendation: Optional, database queries sufficient for MVP

**Q5: Deployment Timeline**
- Can complete by 2025-12-31 (0.5-1 day)?
- Or need more time for testing/review?

---

## ✅ Definition of Done

- [ ] Migration applied to dev/staging/production
- [ ] POST /v1/analytics/events endpoint deployed
- [ ] All 8 acceptance criteria passing
- [ ] Unit tests coverage ≥80%
- [ ] Integration tests all green
- [ ] E2E test validates full flow
- [ ] Rate limiting tested (429 after 60 requests)
- [ ] Documentation updated (README, Swagger)
- [ ] Frontend team notified (can start sending events)
- [ ] At least 1 Grafana dashboard configured (binding funnel)

---

**Next Steps**:
1. ✅ Backend team reviews Request #89
2. ⏳ Backend team provides effort estimate
3. ⏳ Backend team implements per checklist above
4. ⏳ Backend team deploys to staging
5. ⏳ Frontend team tests integration (send events → verify storage)
6. ⏳ Deploy to production
7. ✅ Monitor metrics! 🎉

---

**Contact**: Frontend Team
**Questions**: Slack #epic-34-telegram-notifications
**Reference**: `frontend/docs/DEV-HANDOFF-EPIC-34-FE.md` (complete monitoring guide)
