# Story 33.5-FE: Campaign List & Filtering

## Story Info

- **Epic**: 33-FE - Advertising Analytics (Frontend)
- **Priority**: Medium
- **Points**: 3
- **Status**: ✅ Done

## User Story

**As a** seller,
**I want** to see a list of my advertising campaigns and filter by them,
**So that** I can analyze performance of specific campaigns.

## Acceptance Criteria

### AC1: Campaign Selector
- [ ] Multi-select dropdown to filter by campaigns
- [ ] Shows campaign name and status badge
- [ ] Search within dropdown
- [ ] "Select All" / "Clear All" buttons

### AC2: Campaign Status Badges
- [ ] Active (9): Green dot + "Активна"
- [ ] Paused (11): Yellow dot + "На паузе"
- [ ] Ended (7): Gray dot + "Завершена"
- [ ] Ready (4): Blue dot + "Готова к запуску"
- [ ] Declined (8): Red dot + "Отклонена"

### AC3: Campaign Type Labels
- [ ] Auto (8): "Авто"
- [ ] Unified/Auction (9): "Аукцион"
- [ ] Other types: Show type_name from API

### AC4: Campaign Filter Behavior
- [ ] Filter applies to performance table
- [ ] URL updates with selected campaign IDs
- [ ] Clear filter shows all campaigns

### AC5: Empty State
- [ ] When user has no campaigns, show: "Нет рекламных кампаний"
- [ ] Suggest: "Создайте рекламную кампанию в личном кабинете WB"

### AC6: Accessibility
- [ ] Keyboard navigation in dropdown (Arrow keys, Enter, Escape)
- [ ] Focus trap within open popover
- [ ] Screen reader announces selection changes
- [ ] Status dots have aria-label

## Tasks / Subtasks

### Phase 1: Campaign Selector Component
- [ ] Create `components/CampaignSelector.tsx`
- [ ] Implement multi-select dropdown UI
- [ ] Add search input within dropdown
- [ ] Add "Select All" / "Clear" buttons

### Phase 2: Status & Type Badges
- [ ] Create `components/CampaignStatusBadge.tsx`
- [ ] Create `components/CampaignTypeBadge.tsx`
- [ ] Define color mapping for statuses
- [ ] Define labels for types

### Phase 3: Integration
- [ ] Connect to `useAdvertisingCampaigns` hook
- [ ] Sync selected campaigns to parent component
- [ ] Update URL query params

## Technical Details

### Campaign Status Mapping

```typescript
// src/lib/campaign-utils.ts

export const campaignStatusConfig: Record<number, {
  label: string;
  dotColor: string;
}> = {
  4: { label: 'Готова к запуску', dotColor: 'bg-blue-500' },
  7: { label: 'Завершена', dotColor: 'bg-gray-400' },
  8: { label: 'Отклонена', dotColor: 'bg-red-500' },
  9: { label: 'Активна', dotColor: 'bg-green-500' },
  11: { label: 'На паузе', dotColor: 'bg-yellow-500' },
};

export const campaignTypeConfig: Record<number, string> = {
  4: 'Карусель',
  5: 'Карточка товара',
  6: 'Каталог',
  7: 'Поиск',
  8: 'Авто',
  9: 'Аукцион',
};
```

### Campaign Selector Component

```typescript
// src/app/(dashboard)/analytics/advertising/components/CampaignSelector.tsx

interface CampaignSelectorProps {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
}

export function CampaignSelector({ selectedIds, onSelectionChange }: CampaignSelectorProps) {
  const { data, isLoading } = useAdvertisingCampaigns();
  const [search, setSearch] = useState('');

  const filteredCampaigns = useMemo(() => {
    if (!data?.data) return [];
    if (!search) return data.data;
    return data.data.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [data?.data, search]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[250px] justify-between">
          {selectedIds.length === 0
            ? 'Все кампании'
            : `${selectedIds.length} выбрано`}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder="Поиск кампании..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Кампании не найдены</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={() => onSelectionChange([])}>
                <Check className={cn(
                  "mr-2 h-4 w-4",
                  selectedIds.length === 0 ? "opacity-100" : "opacity-0"
                )} />
                Все кампании
              </CommandItem>
              {filteredCampaigns.map(campaign => (
                <CommandItem
                  key={campaign.campaign_id}
                  onSelect={() => toggleCampaign(campaign.campaign_id)}
                >
                  <Check className={cn(
                    "mr-2 h-4 w-4",
                    selectedIds.includes(campaign.campaign_id) ? "opacity-100" : "opacity-0"
                  )} />
                  <div className="flex items-center gap-2 flex-1">
                    <CampaignStatusDot status={campaign.status} />
                    <span className="truncate">{campaign.name}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {campaignTypeConfig[campaign.type] || campaign.type_name}
                    </Badge>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

### Status Dot Component

```typescript
function CampaignStatusDot({ status }: { status: number }) {
  const config = campaignStatusConfig[status];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('w-2 h-2 rounded-full', config?.dotColor || 'bg-gray-400')} />
      </TooltipTrigger>
      <TooltipContent>
        {config?.label || 'Неизвестно'}
      </TooltipContent>
    </Tooltip>
  );
}
```

## Dev Notes

### File Structure

```
src/app/(dashboard)/analytics/advertising/components/
├── CampaignSelector.tsx        # Multi-select dropdown
├── CampaignStatusBadge.tsx     # Status badge with dot
└── CampaignTypeBadge.tsx       # Type label badge
src/lib/
└── campaign-utils.ts           # Status/type mappings
```

### URL Query Params

```
/analytics/advertising?campaigns=123,456,789
```

### Performance

- Campaign list is usually small (<100 campaigns)
- No pagination needed in dropdown
- Search is client-side filtering

## Testing

### Test Cases

- [ ] Dropdown opens on click
- [ ] Search filters campaigns
- [ ] Multi-select works
- [ ] Status badges show correct colors
- [ ] Type labels show correctly
- [ ] Selection syncs to parent
- [ ] Clear All works

## Definition of Done

- [ ] CampaignSelector component created
- [ ] Status and type badges work
- [ ] Multi-select functionality works
- [ ] Search works
- [ ] TypeScript passes
- [ ] ESLint passes

## Dependencies

- Story 33.1-fe: Types & API Client

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-22 | James (Dev Agent) | Initial draft |
| 2025-12-22 | James (Dev Agent) | PO Review: Added AC5 (empty state), AC6 (accessibility) |

---

## Dev Agent Record

```
Status: ✅ Complete
Agent: James (Dev)
Started: 2025-12-22
Completed: 2025-12-22
Notes: All phases complete. Campaign selector with full functionality.
       ESLint and TypeScript checks pass.
       Files created:
       - src/lib/campaign-utils.ts (status/type mappings, sort function)
       - components/CampaignStatusBadge.tsx (status dot, type badge, combined info)
       - components/CampaignSelector.tsx (multi-select popover with search)
       Updated:
       - page.tsx (integrated selector, URL params, state management)
       Features:
       - AC1: Multi-select dropdown with search, Select All/Clear buttons
       - AC2: Status badges with colored dots (Active/Paused/Ended/Ready/Declined)
       - AC3: Type labels (Авто/Аукцион/etc.)
       - AC4: Filter updates URL, applies to table
       - AC5: Empty state with helpful message
       - AC6: Keyboard navigation, focus management, aria-labels
```

---

## QA Results

### Review Date: 2025-12-22

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

Clean implementation with good separation between utility functions (campaign-utils.ts) and UI components. The CampaignSelector uses proper patterns for multi-select with search, memoization for filtered list, and callback optimization. Components are well-typed with clear interfaces.

### Refactoring Performed

None required - code quality is good.

### Compliance Check

- Coding Standards: ✓ Follows project conventions
- Project Structure: ✓ Files correctly placed in lib/ and components/
- Testing Strategy: ✓ 37 tests covering utilities (27) and components (10)
- All ACs Met: ✓ All 6 acceptance criteria fully implemented

### Improvements Checklist

- [x] Multi-select with search and Select All/Clear buttons
- [x] Status badges with WB status codes mapped correctly
- [x] Type labels with fallback to API type_name
- [x] Empty state with helpful WB suggestion
- [x] Keyboard navigation and accessibility support

### Security Review

No security concerns. Read-only campaign display.

### Performance Considerations

Client-side filtering is efficient for typical campaign counts (<100). useMemo prevents unnecessary re-computations. Consider virtualization if lists grow beyond 100+ items (documented as future recommendation).

### Files Modified During Review

None.

### Gate Status

Gate: **PASS** → docs/qa/gates/33.5-fe-campaign-list.yml

### Recommended Status

✓ Ready for Done
