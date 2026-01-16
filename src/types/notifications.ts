// ============================================================================
// Telegram Notifications Types
// Epic 34-FE: Story 34.1-FE
// Backend Reference: Request #73 - Telegram Notifications API
// ============================================================================

// ============================================================================
// Telegram Binding Types
// ============================================================================

/**
 * Response from POST /v1/notifications/telegram/bind
 * Contains verification code and instructions for user
 */
export interface BindingCodeResponseDto {
  binding_code: string;          // e.g., "A1B2C3D4" (8 chars)
  expires_at: string;             // ISO 8601 timestamp
  instructions: string;           // User instructions (ru/en)
  deep_link: string;              // https://t.me/Kernel_crypto_bot?start=...
}

/**
 * Response from GET /v1/notifications/telegram/status
 * Polled every 3 seconds during binding flow
 */
export interface BindingStatusResponseDto {
  bound: boolean;                 // true if binding complete
  telegram_user_id: number | null;  // Telegram user ID if bound
  telegram_username: string | null; // @username if bound
  binding_expires_at: string | null; // ISO 8601 timestamp
}

/**
 * Request body for POST /v1/notifications/telegram/bind
 * Optionally specify language for instructions
 */
export interface StartBindingRequestDto {
  language?: 'ru' | 'en';  // Default: 'ru'
}

// ============================================================================
// Notification Preferences Types
// ============================================================================

/**
 * Response from GET /v1/notifications/preferences
 * Complete notification preferences for current cabinet
 */
export interface NotificationPreferencesResponseDto {
  cabinet_id: string;
  telegram_enabled: boolean;      // Master toggle
  telegram_bound: boolean;        // Binding status
  telegram_username: string | null;
  preferences: {
    task_completed: boolean;
    task_failed: boolean;
    task_stalled: boolean;
    daily_digest: boolean;
    digest_time: string;          // HH:MM format (24-hour)
  };
  language: 'ru' | 'en';           // Notification message language
  quiet_hours: {
    enabled: boolean;
    from: string;                  // HH:MM format (24-hour)
    to: string;                    // HH:MM format (24-hour)
    timezone: string;              // IANA timezone (e.g., "Europe/Moscow")
  };
}

/**
 * Request body for PUT /v1/notifications/preferences
 * Partial update - send only changed fields
 */
export interface UpdatePreferencesRequestDto {
  preferences?: {
    task_completed?: boolean;
    task_failed?: boolean;
    task_stalled?: boolean;
    daily_digest?: boolean;
    digest_time?: string;
  };
  language?: 'ru' | 'en';
  quiet_hours?: {
    enabled?: boolean;
    from?: string;
    to?: string;
    timezone?: string;
  };
}

// ============================================================================
// Test Notification Types
// ============================================================================

/**
 * Request body for POST /v1/notifications/test
 * Send test notification to verify binding
 */
export interface SendTestNotificationRequestDto {
  message?: string;  // Optional custom message
}

/**
 * Response from POST /v1/notifications/test
 */
export interface TestNotificationResponseDto {
  success: boolean;
  message: string;  // e.g., "Test notification sent to @username"
}

// ============================================================================
// Error Response Types
// ============================================================================

/**
 * Standard error response from API
 */
export interface ApiErrorResponse {
  error: {
    code: string;  // e.g., "VALIDATION_ERROR", "FORBIDDEN", "RATE_LIMITED"
    message: string;
    details?: Array<{
      field: string;
      issue: string;
    }>;
    trace_id?: string;
  };
}

// ============================================================================
// Frontend-Only Helper Types
// ============================================================================

/**
 * Event type enum for type-safe preference keys
 */
export enum NotificationEventType {
  TASK_COMPLETED = 'task_completed',
  TASK_FAILED = 'task_failed',
  TASK_STALLED = 'task_stalled',
  DAILY_DIGEST = 'daily_digest',
}

/**
 * Binding flow states for UI state machine
 */
export enum BindingFlowState {
  IDLE = 'idle',
  GENERATING_CODE = 'generating_code',
  POLLING = 'polling',
  SUCCESS = 'success',
  ERROR = 'error',
  EXPIRED = 'expired',
}
