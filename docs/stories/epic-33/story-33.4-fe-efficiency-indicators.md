# Story 33.4-FE: Efficiency Status Indicators

## Story Info

- **Epic**: 33-FE - Advertising Analytics (Frontend)
- **Priority**: **High** (moved from Medium - required by 33.3-fe table)
- **Points**: 3
- **Status**: ✅ Done
- **Sprint**: 1

## User Story

**As a** seller,
**I want** visual efficiency status indicators for my ads,
**So that** I can quickly identify which campaigns need attention.

## Acceptance Criteria

### AC1: Efficiency Badge Component
- [ ] Color-coded badge for each efficiency status
- [ ] Badge shows translated status label
- [ ] Badge has icon appropriate to status

### AC2: Status Colors
- [ ] Excellent: Green (#22C55E)
- [ ] Good: Light Green (#86EFAC)
- [ ] Moderate: Yellow (#F59E0B)
- [ ] Poor: Orange (#F97316)
- [ ] Loss: Red (#EF4444)
- [ ] Unknown: Gray (#9CA3AF)

### AC3: Tooltips
- [ ] Tooltip explains the ROAS/ROI thresholds
- [ ] Tooltip includes recommendation
- [ ] Tooltip shows on hover (desktop) and long-press (mobile)

### AC4: Alert Banner
- [ ] Show alert when there are items with "loss" status
- [ ] Alert is dismissible
- [ ] **Dismiss persists in sessionStorage for current session**
- [ ] **Alert reappears on new data fetch if loss count increases**
- [ ] Alert links to filtered view (?status=loss)

### AC5: Accessibility
- [ ] Badge icons supplement color (not color-only)
- [ ] Tooltip accessible via keyboard focus
- [ ] Alert banner has `role="alert"` for screen readers
- [ ] Dismiss button has accessible label

## Tasks / Subtasks

### Phase 1: Badge Component
- [ ] Create `components/EfficiencyBadge.tsx`
- [ ] Define color mapping for each status
- [ ] Add icon selection per status
- [ ] Implement tooltip with recommendations

### Phase 2: Status Utilities
- [ ] Create `lib/efficiency-utils.ts`
- [ ] Add `getEfficiencyColor()` function
- [ ] Add `getEfficiencyLabel()` function
- [ ] Add `getEfficiencyRecommendation()` function

### Phase 3: Alert Banner
- [ ] Create `components/EfficiencyAlertBanner.tsx`
- [ ] Count items with "loss" status
- [ ] Show dismissible alert
- [ ] Link to filtered table view

## Technical Details

### Efficiency Status Mapping

```typescript
// src/lib/efficiency-utils.ts

export const efficiencyConfig: Record<EfficiencyStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: LucideIcon;
  recommendation: string;
}> = {
  excellent: {
    label: 'Отлично',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: TrendingUp,
    recommendation: 'Масштабируйте бюджет — реклама работает отлично',
  },
  good: {
    label: 'Хорошо',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    icon: ThumbsUp,
    recommendation: 'Поддерживайте текущую стратегию',
  },
  moderate: {
    label: 'Умеренно',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: AlertTriangle,
    recommendation: 'Рассмотрите оптимизацию ставок или креативов',
  },
  poor: {
    label: 'Слабо',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: TrendingDown,
    recommendation: 'Пересмотрите стратегию или уменьшите бюджет',
  },
  loss: {
    label: 'Убыток',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: XCircle,
    recommendation: 'Остановите или полностью измените кампанию',
  },
  unknown: {
    label: 'Нет данных',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: HelpCircle,
    recommendation: 'Нет данных о прибыли для расчёта эффективности',
  },
};
```

### Badge Component

```typescript
// src/app/(dashboard)/analytics/advertising/components/EfficiencyBadge.tsx

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { efficiencyConfig } from '@/lib/efficiency-utils';
import { EfficiencyStatus } from '@/types/advertising-analytics';

interface EfficiencyBadgeProps {
  status: EfficiencyStatus;
  showRecommendation?: boolean;
}

export function EfficiencyBadge({ status, showRecommendation = true }: EfficiencyBadgeProps) {
  const config = efficiencyConfig[status];
  const Icon = config.icon;

  const badge = (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
      config.bgColor,
      config.color
    )}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );

  if (!showRecommendation) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-1">
          <p className="font-medium">{config.label}</p>
          <p className="text-sm text-muted-foreground">
            {getThresholdDescription(status)}
          </p>
          <p className="text-sm">{config.recommendation}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function getThresholdDescription(status: EfficiencyStatus): string {
  switch (status) {
    case 'excellent': return 'ROAS ≥ 5.0, ROI ≥ 100%';
    case 'good': return 'ROAS 3.0-5.0, ROI 50-100%';
    case 'moderate': return 'ROAS 2.0-3.0, ROI 20-50%';
    case 'poor': return 'ROAS 1.0-2.0, ROI 0-20%';
    case 'loss': return 'ROAS < 1.0, ROI < 0%';
    case 'unknown': return 'Нет данных о прибыли';
  }
}
```

### Alert Banner (with sessionStorage persistence)

```typescript
// src/app/(dashboard)/analytics/advertising/components/EfficiencyAlertBanner.tsx

const STORAGE_KEY = 'advertising-loss-alert-dismissed';

export function EfficiencyAlertBanner({ lossCount }: { lossCount: number }) {
  const [dismissedCount, setDismissedCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return parseInt(sessionStorage.getItem(STORAGE_KEY) || '0', 10);
  });

  // Reappear if loss count increases beyond previously dismissed
  const shouldShow = lossCount > 0 && lossCount > dismissedCount;

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, lossCount.toString());
    setDismissedCount(lossCount);
  };

  if (!shouldShow) return null;

  return (
    <Alert variant="destructive" role="alert">
      <XCircle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>Убыточные кампании</AlertTitle>
      <AlertDescription>
        {lossCount} {pluralize(lossCount, 'товар', 'товара', 'товаров')} с отрицательной
        эффективностью рекламы (ROAS &lt; 1.0)
        <Link href="?status=loss" className="ml-2 underline">
          Показать
        </Link>
      </AlertDescription>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2"
        onClick={handleDismiss}
        aria-label="Скрыть предупреждение"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </Alert>
  );
}
```

## Dev Notes

### File Structure

```
src/
├── app/(dashboard)/analytics/advertising/components/
│   ├── EfficiencyBadge.tsx          # Badge component
│   └── EfficiencyAlertBanner.tsx    # Alert banner
└── lib/
    └── efficiency-utils.ts          # Utility functions
```

### Color Accessibility

All color combinations meet WCAG AA contrast requirements:
- Green text on green-100 background
- Red text on red-100 background
- etc.

## Testing

### Test Cases

- [ ] Badge renders for each status with correct color
- [ ] Tooltip shows on hover
- [ ] Tooltip contains threshold info and recommendation
- [ ] Alert banner shows when loss count > 0
- [ ] Alert banner is dismissible
- [ ] Link in alert navigates to filtered view

## Definition of Done

- [ ] EfficiencyBadge component created
- [ ] All 6 status types styled correctly
- [ ] Tooltips work on hover
- [ ] Alert banner works
- [ ] TypeScript passes
- [ ] ESLint passes
- [ ] <200 lines per file

## Dependencies

- Story 33.1-fe: Types (EfficiencyStatus type)

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-22 | James (Dev Agent) | Initial draft |
| 2025-12-22 | James (Dev Agent) | PO Review: Priority→High (BLOCKER #1), sessionStorage dismiss, alert reappearance, AC5 a11y |

---

## Dev Agent Record

```
Status: ✅ Complete
Agent: James (Dev)
Started: 2025-12-22
Completed: 2025-12-22
Notes: All phases complete. Efficiency status indicators with full functionality.
       ESLint and TypeScript checks pass.
       Files created:
       - src/lib/efficiency-utils.ts (centralized config with icons, colors, sessionStorage utils)
       - components/EfficiencyAlertBanner.tsx (dismissible alert with sessionStorage persistence)
       Updated:
       - components/EfficiencyBadge.tsx (added icons, imports from efficiency-utils)
       - page.tsx (integrated alert banner with loss count)
       Features:
       - AC1: Icons per status (TrendingUp, ThumbsUp, AlertTriangle, TrendingDown, XCircle, HelpCircle)
       - AC2: Color-coded badges with proper contrast
       - AC3: Tooltips with thresholds and recommendations
       - AC4: Alert banner with sessionStorage dismiss, reappears if loss count increases
       - AC5: Accessible (role="alert", aria-labels, keyboard navigation)
```

---

## QA Results

### Review Date: 2025-12-22

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

Excellent implementation with well-structured, maintainable code. The efficiency-utils.ts provides a centralized configuration that promotes consistency across the application. Components follow React best practices with proper TypeScript typing, SSR safety checks (isMounted), and clean separation of concerns.

### Refactoring Performed

None required - code quality is high.

### Compliance Check

- Coding Standards: ✓ Follows project conventions
- Project Structure: ✓ Files correctly placed in lib/ and components/
- Testing Strategy: ✓ 43 tests covering utilities (23) and components (20)
- All ACs Met: ✓ All 5 acceptance criteria fully implemented

### Improvements Checklist

- [x] Centralized efficiency config with icons, colors, recommendations
- [x] SSR-safe sessionStorage utilities with proper error handling
- [x] Accessible components with aria-labels and role attributes
- [x] Alert reappearance logic when loss count increases

### Security Review

No security concerns. sessionStorage used appropriately for dismiss state; no sensitive data stored.

### Performance Considerations

Lightweight components with efficient state management. No performance concerns.

### Files Modified During Review

None.

### Gate Status

Gate: **PASS** → docs/qa/gates/33.4-fe-efficiency-indicators.yml

### Recommended Status

✓ Ready for Done
