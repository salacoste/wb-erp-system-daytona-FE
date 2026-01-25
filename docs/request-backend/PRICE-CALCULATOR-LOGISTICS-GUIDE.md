# Price Calculator: Logistics Integration Guide

**Target Audience**: Frontend Developers  
**Epic**: Epic 43 (Price Calculator API) + Epic 44-FE (Price Calculator UI)  
**Status**: Production Ready  
**Last Updated**: 2026-01-24  
**Backend Completion**: 10/10 stories (100%)

---

## Executive Summary

The Price Calculator API provides **two approaches** for logistics cost calculation:

| Approach | Use Case | Data Required |
|----------|----------|---------------|
| **Manual Input** | User knows exact logistics costs | `logistics_forward_rub`, `logistics_reverse_rub` |
| **Auto-fill** | Quick calculation with warehouse data | `warehouse_name`, `volume_liters` or `dimensions` |

### Key Features
- **Automatic logistics calculation** from warehouse tariffs
- **Volume calculation** from dimensions (length × width × height)
- **Cargo type detection** (MGT ≤60cm, SGT ≤120cm, KGT >120cm)
- **Coefficient-aware pricing** (regional multipliers)
- **Fallback support** when warehouse data unavailable

### Quick Start Example

```typescript
// Manual input mode
const request1 = {
  target_margin_pct: 20,
  cogs_rub: 1500,
  logistics_forward_rub: 200,
  logistics_reverse_rub: 150,
  buyback_pct: 98,
  advertising_pct: 5,
  storage_rub: 50
};

// Auto-fill mode (warehouse + volume)
const request2 = {
  target_margin_pct: 20,
  cogs_rub: 1500,
  warehouse_name: "Коледино",
  volume_liters: 15,
  delivery_type: "fbo",
  storage_days: 7,
  buyback_pct: 98,
  advertising_pct: 5
};

// Auto-fill mode (warehouse + dimensions)
const request3 = {
  target_margin_pct: 20,
  cogs_rub: 1500,
  warehouse_name: "Коледино",
  dimensions: {
    length_cm: 30,
    width_cm: 20,
    height_cm: 15
  },
  delivery_type: "fbo",
  storage_days: 7,
  buyback_pct: 98,
  advertising_pct: 5
};
```

---

## API Endpoints Reference

### Main Calculator Endpoint

**`POST /v1/products/price-calculator`**

Calculates recommended price based on target margin.

**Request Headers**:
```http
Authorization: Bearer {JWT_TOKEN}
X-Cabinet-Id: {CABINET_UUID}
Content-Type: application/json
```

**Response**:
```json
{
  "result": {
    "recommended_price": 4057.87,
    "target_margin_pct": 20.0,
    "actual_margin_rub": 811.57,
    "actual_margin_pct": 20.0
  },
  "cost_breakdown": {
    "fixed_costs": {
      "cogs": 1500.00,
      "logistics_forward": 200.00,
      "logistics_reverse_effective": 3.00,
      "logistics_total": 203.00,
      "storage": 50.00,
      "fixed_total": 1753.00
    }
  },
  "auto_fill": {
    "warehouse_name": "Коледино",
    "logistics_source": "auto",
    "storage_source": "auto",
    "tariff_date": "2026-01-24"
  },
  "dimensions_calculation": {
    "dimensions_cm": {
      "length_cm": 30,
      "width_cm": 20,
      "height_cm": 15
    },
    "calculated_volume_liters": 9.0,
    "detected_cargo_type": "MGT",
    "volume_source": "dimensions",
    "max_dimension_cm": 30.0
  }
}
```

### Supporting Endpoints

**`GET /v1/tariffs/warehouses`**

Returns list of all WB warehouses for dropdown.

```json
{
  "data": {
    "warehouses": [
      {
        "id": 507,
        "name": "Коледино",
        "address": "Подольск, ул. Силовая, д. 4",
        "city": "Подольск",
        "federalDistrict": "Центральный ФО"
      }
    ],
    "updated_at": "2026-01-24T10:00:00Z"
  }
}
```

**`GET /v1/tariffs/settings`**

Returns global tariff settings (fallback values).

```json
{
  "default_commission_fbo_pct": 15.0,
  "logistics_large_first_liter_rate": 46.0,
  "logistics_large_additional_liter_rate": 14.0,
  "logistics_volume_tiers": [
    { "min": 0.001, "max": 0.200, "rate": 23.0 },
    { "min": 0.201, "max": 0.400, "rate": 26.0 },
    { "min": 0.401, "max": 0.600, "rate": 29.0 },
    { "min": 0.601, "max": 0.800, "rate": 30.0 },
    { "min": 0.801, "max": 1.000, "rate": 32.0 }
  ],
  "storage_free_days": 60,
  "effective_from": "2025-09-01T00:00:00.000Z"
}
```

**`GET /v1/tariffs/acceptance/coefficients?warehouseId={id}`**

Returns warehouse-specific coefficients with embedded base rates.

```json
{
  "coefficients": [
    {
      "warehouseId": 507,
      "warehouseName": "Коледино",
      "date": "2026-01-24",
      "coefficient": 1.0,
      "isAvailable": true,
      "allowUnload": true,
      "delivery": {
        "coefficient": 1.0,
        "baseLiterRub": 46.0,
        "additionalLiterRub": 14.0
      },
      "storage": {
        "coefficient": 1.0,
        "baseLiterRub": 0.07,
        "additionalLiterRub": 0.05
      }
    }
  ],
  "meta": {
    "total": 14,
    "available": 14,
    "cache_ttl_seconds": 3600
  }
}
```

---

## Coefficient Handling

**Important**: All coefficients from the API are **already divided by 100** by the backend.

**WB SDK Format**: `"115"` (string, meaning 115%)
**Backend Processing**: `115 / 100 = 1.15`
**Frontend Receives**: `1.15` (number)

**Example**:
```typescript
// ❌ WRONG - Don't divide again!
const cost = baseAmount * (tariff.coefficient / 100);

// ✅ CORRECT - Coefficient already processed
const cost = baseAmount * tariff.coefficient;
```

**Validation**: Coefficients should be in range 0.5 - 3.0

---

## Integration Scenarios

### Scenario 1: Manual Input Mode

**Use Case**: User knows exact logistics costs from invoices or previous shipments.

**Request**:
```json
{
  "target_margin_pct": 20,
  "cogs_rub": 1500,
  "logistics_forward_rub": 200,
  "logistics_reverse_rub": 150,
  "buyback_pct": 98,
  "advertising_pct": 5,
  "storage_rub": 50
}
```

**Response**:
```json
{
  "result": {
    "recommended_price": 4057.87,
    "actual_margin_rub": 811.57
  },
  "cost_breakdown": {
    "fixed_costs": {
      "logistics_forward": 200.00,
      "logistics_total": 203.00,
      "storage": 50.00
    }
  }
}
```

**UI Behavior**:
- Show input fields for logistics costs
- No auto-fill indicators
- User has full control

---

### Scenario 2: Auto-fill (Warehouse + Volume)

**Use Case**: Quick calculation when warehouse and volume are known.

**Request**:
```json
{
  "target_margin_pct": 20,
  "cogs_rub": 1500,
  "warehouse_name": "Коледино",
  "volume_liters": 15,
  "delivery_type": "fbo",
  "storage_days": 7,
  "buyback_pct": 98,
  "advertising_pct": 5
}
```

**Response**:
```json
{
  "result": {
    "recommended_price": 4234.56,
    "actual_margin_rub": 846.91
  },
  "cost_breakdown": {
    "fixed_costs": {
      "logistics_forward": 185.00,
      "logistics_total": 188.00,
      "storage": 42.00
    }
  },
  "auto_fill": {
    "warehouse_name": "Коледино",
    "logistics_source": "auto",
    "storage_source": "auto",
    "tariff_date": "2026-01-24"
  }
}
```

**UI Behavior**:
- Show "Auto" badge next to logistics/storage fields
- Display warehouse name and tariff date
- Allow manual override by editing values

---

### Scenario 3: Auto-fill (Warehouse + Dimensions)

**Use Case**: User knows product dimensions but not volume.

**Request**:
```json
{
  "target_margin_pct": 20,
  "cogs_rub": 1500,
  "warehouse_name": "Коледино",
  "dimensions": {
    "length_cm": 30,
    "width_cm": 20,
    "height_cm": 15
  },
  "delivery_type": "fbo",
  "storage_days": 7,
  "buyback_pct": 98,
  "advertising_pct": 5
}
```

**Response**:
```json
{
  "result": {
    "recommended_price": 3850.23,
    "actual_margin_rub": 770.05
  },
  "cost_breakdown": {
    "fixed_costs": {
      "logistics_forward": 175.00,
      "logistics_total": 178.00,
      "storage": 42.00
    }
  },
  "auto_fill": {
    "warehouse_name": "Коледино",
    "logistics_source": "auto",
    "storage_source": "auto"
  },
  "dimensions_calculation": {
    "dimensions_cm": {
      "length_cm": 30,
      "width_cm": 20,
      "height_cm": 15
    },
    "calculated_volume_liters": 9.0,
    "detected_cargo_type": "MGT",
    "volume_source": "dimensions",
    "max_dimension_cm": 30.0
  }
}
```

**UI Behavior**:
- Display calculated volume: "9.0 L (from dimensions)"
- Show cargo type badge: "MGT" (green)
- Show dimensions breakdown

---

## Display Guidelines

### Cost Breakdown Component

```typescript
interface CostBreakdownProps {
  breakdown: {
    fixed_costs: {
      cogs: number;
      logistics_forward: number;
      logistics_reverse_effective: number;
      logistics_total: number;
      storage: number;
      fixed_total: number;
    };
  };
  autoFill?: {
    logistics_source: 'auto' | 'manual';
    storage_source: 'auto' | 'manual';
    warehouse_name?: string;
  };
}

export function CostBreakdown({ breakdown, autoFill }: CostBreakdownProps) {
  const { fixed_costs } = breakdown;
  
  return (
    <div className="space-y-4">
      {/* COGS */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Себестоимость</span>
        <span className="font-semibold">{formatCurrency(fixed_costs.cogs)}</span>
      </div>
      
      {/* Logistics */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Логистика</span>
          {autoFill?.logistics_source === 'auto' && (
            <Badge variant="secondary" className="text-xs">
              Auto
            </Badge>
          )}
        </div>
        <span className="font-semibold">{formatCurrency(fixed_costs.logistics_total)}</span>
      </div>
      
      {/* Storage */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Хранение</span>
          {autoFill?.storage_source === 'auto' && (
            <Badge variant="secondary" className="text-xs">
              Auto
            </Badge>
          )}
        </div>
        <span className="font-semibold">{formatCurrency(fixed_costs.storage)}</span>
      </div>
      
      {/* Total */}
      <Separator />
      <div className="flex justify-between items-center">
        <span className="font-semibold">Итого постоянные затраты</span>
        <span className="font-bold text-lg">{formatCurrency(fixed_costs.fixed_total)}</span>
      </div>
    </div>
  );
}
```

### Auto-fill Indicators

```typescript
interface AutoFillIndicatorProps {
  source: 'auto' | 'manual';
  label: string;
  details?: string;
}

export function AutoFillIndicator({ source, label, details }: AutoFillIndicatorProps) {
  if (source === 'manual') return null;
  
  return (
    <Tooltip content={details}>
      <div className="flex items-center gap-1.5 text-xs text-blue-600">
        <Sparkles className="h-3 w-3" />
        <span>{label}</span>
      </div>
    </Tooltip>
  );
}
```

### Cargo Type Badge

```typescript
interface CargoTypeBadgeProps {
  cargoType: 'MGT' | 'SGT' | 'KGT';
}

const CARGO_TYPE_CONFIG = {
  MGT: { label: 'Мелкогабаритный', color: 'bg-green-100 text-green-800' },
  SGT: { label: 'Среднегабаритный', color: 'bg-yellow-100 text-yellow-800' },
  KGT: { label: 'Крупногабаритный', color: 'bg-red-100 text-red-800' }
};

export function CargoTypeBadge({ cargoType }: CargoTypeBadgeProps) {
  const config = CARGO_TYPE_CONFIG[cargoType];
  
  return (
    <Badge className={config.color}>
      {config.label}
    </Badge>
  );
}
```

### Volume Display

```typescript
interface VolumeDisplayProps {
  volume?: number;
  dimensions?: {
    length_cm: number;
    width_cm: number;
    height_cm: number;
  };
  calculatedVolume?: number;
  source?: 'manual' | 'dimensions';
}

export function VolumeDisplay({ 
  volume, 
  dimensions, 
  calculatedVolume, 
  source 
}: VolumeDisplayProps) {
  const displayVolume = source === 'dimensions' ? calculatedVolume : volume;
  
  return (
    <div className="space-y-2">
      {/* Volume Input */}
      <div className="flex items-center gap-2">
        <Label>Объём (литры)</Label>
        <Input 
          type="number" 
          value={displayVolume || ''} 
          onChange={(e) => /* update handler */}
        />
        {source === 'dimensions' && (
          <AutoFillIndicator 
            source="auto" 
            label="Из габаритов"
            details={`${dimensions?.length_cm}×${dimensions?.width_cm}×${dimensions?.height_cm} см`}
          />
        )}
      </div>
      
      {/* Dimensions Input */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">Длина (см)</Label>
          <Input 
            type="number" 
            value={dimensions?.length_cm || ''} 
            onChange={(e) => /* update handler */}
          />
        </div>
        <div>
          <Label className="text-xs">Ширина (см)</Label>
          <Input 
            type="number" 
            value={dimensions?.width_cm || ''} 
            onChange={(e) => /* update handler */}
          />
        </div>
        <div>
          <Label className="text-xs">Высота (см)</Label>
          <Input 
            type="number" 
            value={dimensions?.height_cm || ''} 
            onChange={(e) => /* update handler */}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## Error Handling

### Common Errors Table

| Error Code | Message | Cause | Solution |
|------------|---------|-------|----------|
| `WAREHOUSE_NOT_FOUND` | Склад '{name}' не найден | Invalid warehouse name | Show available warehouses list |
| `KGT_CARGO_DETECTED` | Крупногабаритный груз требует ручного ввода | Max dimension > 120cm | Show manual input fields |
| `VALIDATION_ERROR` | Negative value for costs | Negative number in request | Client-side validation |
| `TOTAL_PERCENTAGE_RATE_EXCEEDS_100` | Division by zero | Sum of percentages ≥ 100% | Reduce margin or costs |

### Validation Examples

```typescript
import { z } from 'zod';

export const priceCalculatorSchema = z.object({
  target_margin_pct: z.number().min(0).max(100),
  cogs_rub: z.number().min(0),
  logistics_forward_rub: z.number().min(0),
  logistics_reverse_rub: z.number().min(0),
  buyback_pct: z.number().min(0).max(100),
  advertising_pct: z.number().min(0).max(100),
  storage_rub: z.number().min(0),
  
  // Optional fields
  warehouse_name: z.string().optional(),
  volume_liters: z.number().min(0).optional(),
  delivery_type: z.enum(['fbo', 'fbs']).optional(),
  storage_days: z.number().int().min(0).optional(),
  
  dimensions: z.object({
    length_cm: z.number().min(0),
    width_cm: z.number().min(0),
    height_cm: z.number().min(0)
  }).optional(),
  
  overrides: z.object({
    commission_pct: z.number().min(0).max(100).optional()
  }).optional()
}).refine(
  (data) => {
    const totalPercentage = 
      (data.overrides?.commission_pct || 10) +
      1.8 + // acquiring
      data.advertising_pct +
      20 + // VAT
      data.target_margin_pct;
    return totalPercentage < 100;
  },
  {
    message: "Сумма процентных ставок не может превышать 100%",
    path: ["target_margin_pct"]
  }
);
```

### Error Display Component

```typescript
interface ErrorDisplayProps {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      issue: string;
      available_warehouses?: string[];
    }>;
  };
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  const renderErrorContent = () => {
    switch (error.code) {
      case 'WAREHOUSE_NOT_FOUND':
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Склад не найден</AlertTitle>
            <AlertDescription>
              <p>Указанный склад не найден в базе тарифов.</p>
              {error.details?.[0]?.available_warehouses && (
                <div className="mt-2">
                  <p className="font-semibold mb-1">Доступные склады:</p>
                  <ul className="list-disc list-inside text-sm">
                    {error.details[0].available_warehouses.slice(0, 10).map((wh) => (
                      <li key={wh}>{wh}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        );
        
      case 'KGT_CARGO_DETECTED':
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Крупногабаритный груз</AlertTitle>
            <AlertDescription>
              <p>Товар с габаритами более 120 см требует ручного ввода логистики.</p>
              <Button className="mt-2" size="sm">
                Ввести логистику вручную
              </Button>
            </AlertDescription>
          </Alert>
        );
        
      default:
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ошибка расчета</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        );
    }
  };
  
  return <div className="my-4">{renderErrorContent()}</div>;
}
```

---

## Testing Checklist

### Manual Test Cases

#### Scenario 1: Manual Input
- [ ] Enter all required fields manually
- [ ] Verify price calculation matches expected formula
- [ ] Check cost breakdown displays correctly
- [ ] Verify no auto-fill indicators shown

#### Scenario 2: Auto-fill Warehouse
- [ ] Select warehouse from dropdown
- [ ] Enter volume in liters
- [ ] Select delivery type (FBO/FBS)
- [ ] Enter storage days
- [ ] Verify logistics auto-calculated
- [ ] Verify storage auto-calculated
- [ ] Check auto-fill indicators shown
- [ ] Verify manual override works

#### Scenario 3: Auto-fill Dimensions
- [ ] Enter dimensions (L×W×H)
- [ ] Verify volume calculated correctly
- [ ] Check cargo type badge shown
- [ ] Verify MGT for max ≤60cm
- [ ] Verify SGT for max ≤120cm
- [ ] Verify error for KGT >120cm

#### Error Scenarios
- [ ] Test invalid warehouse name
- [ ] Test negative values (client-side validation)
- [ ] Test percentage sum ≥100%
- [ ] Test KGT cargo error handling
- [ ] Verify helpful error messages

### Automated Test Examples

```typescript
// src/components/custom/price-calculator/__tests__/PriceCalculatorForm.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { PriceCalculatorForm } from '../PriceCalculatorForm';
import { server } from '@/test/mocks/server';
import { rest } from 'msw';

describe('PriceCalculatorForm - Manual Input', () => {
  it('should calculate price with manual logistics input', async () => {
    render(<PriceCalculatorForm />);
    
    // Fill required fields
    const targetMarginInput = screen.getByLabelText(/Целевая маржа/);
    const cogsInput = screen.getByLabelText(/Себестоимость/);
    const logisticsInput = screen.getByLabelText(/Логистика прямая/);
    
    await userEvent.type(targetMarginInput, '20');
    await userEvent.type(cogsInput, '1500');
    await userEvent.type(logisticsInput, '200');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Рассчитать/ });
    await userEvent.click(submitButton);
    
    // Verify results
    await waitFor(() => {
      expect(screen.getByText(/4 057,87 ₽/)).toBeInTheDocument();
    });
    
    // Verify no auto-fill indicators
    expect(screen.queryByText(/Auto/)).not.toBeInTheDocument();
  });
});

describe('PriceCalculatorForm - Auto-fill Warehouse', () => {
  beforeEach(() => {
    server.use(
      rest.get('/v1/tariffs/warehouses', (req, res, ctx) => {
        return res(
          ctx.json({
            data: {
              warehouses: [
                { id: 507, name: 'Коледино', city: 'Подольск' }
              ],
              updated_at: '2026-01-24T10:00:00Z'
            }
          })
        );
      })
    );
  });
  
  it('should auto-calculate logistics from warehouse', async () => {
    render(<PriceCalculatorForm />);
    
    // Select warehouse
    const warehouseSelect = screen.getByLabelText(/Склад/);
    await userEvent.selectOptions(warehouseSelect, 'Коледино');
    
    // Enter volume
    const volumeInput = screen.getByLabelText(/Объём/);
    await userEvent.type(volumeInput, '15');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Рассчитать/ });
    await userEvent.click(submitButton);
    
    // Verify auto-fill indicators shown
    await waitFor(() => {
      expect(screen.getAllByText(/Auto/)).toHaveLength(2); // logistics + storage
    });
  });
});

describe('PriceCalculatorForm - Dimensions Calculation', () => {
  it('should calculate volume from dimensions', async () => {
    render(<PriceCalculatorForm />);
    
    // Enter dimensions
    const lengthInput = screen.getByLabelText(/Длина/);
    const widthInput = screen.getByLabelText(/Ширина/);
    const heightInput = screen.getByLabelText(/Высота/);
    
    await userEvent.type(lengthInput, '30');
    await userEvent.type(widthInput, '20');
    await userEvent.type(heightInput, '15');
    
    // Verify calculated volume
    await waitFor(() => {
      expect(screen.getByText(/9,0 L/)).toBeInTheDocument();
    });
    
    // Verify cargo type badge
    expect(screen.getByText(/Мелкогабаритный/)).toBeInTheDocument();
  });
  
  it('should show error for KGT cargo', async () => {
    render(<PriceCalculatorForm />);
    
    // Enter large dimensions (>120cm)
    const lengthInput = screen.getByLabelText(/Длина/);
    await userEvent.type(lengthInput, '150');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Рассчитать/ });
    await userEvent.click(submitButton);
    
    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/Крупногабаритный груз/)).toBeInTheDocument();
    });
  });
});
```

---

## FAQ

### Q1: What's the difference between `logistics_forward_rub` and `logistics_reverse_rub`?

**A**: 
- **Logistics forward**: Cost to ship product TO warehouse (seller → WB)
- **Logistics reverse**: Cost for returns (customer → warehouse → seller)

### Q2: How is storage calculated?

**A**:
```
daily_cost = (base_rate + max(0, volume - 1) × per_liter_rate) × coefficient
total_storage = daily_cost × storage_days
```
Note: Coefficient is already divided by 100 in the backend!

Free storage period: 60 days (configurable in `/v1/tariffs/settings`)

### Q3: What are cargo types (MGT, SGT, KGT)?

**A**:
- **MGT** (Мелкогабаритный): Max dimension ≤60cm
- **SGT** (Среднегабаритный): Max dimension ≤120cm
- **KGT** (Крупногабаритный): Max dimension >120cm (requires manual input)

### Q4: How do coefficients work?

**A**: Coefficients are regional multipliers:
- **1.0** = Standard rate
- **1.2** = 120% of standard rate (remote regions)
- **0.8** = 80% of standard rate (promotional)

Applied to both logistics and storage costs.

### Q5: What if warehouse is not found?

**A**: 
1. Show error with list of available warehouses
2. Suggest manual input mode
3. Cache warehouse list for autocomplete

### Q6: Can I override auto-calculated values?

**A**: Yes! Manual values always have priority:
```
manual > auto-fill (warehouse) > default
```

### Q7: How often are tariffs updated?

**A**:
- **Warehouse tariffs**: 1 hour cache (fetched from WB API)
- **Global settings**: 24 hour cache (database defaults)

### Q8: What's the formula for recommended price?

**A**:
```
recommended_price = fixed_total / (1 - total_percentage_rate / 100)

where:
- fixed_total = cogs + logistics_effective + storage
- logistics_effective = forward + reverse × (1 - buyback/100)
- total_percentage_rate = commission + acquiring + advertising + vat + margin
```

---

## TypeScript Examples

### Type Definitions

```typescript
// src/types/price-calculator.ts

export interface PriceCalculatorRequest {
  target_margin_pct: number;
  cogs_rub: number;
  logistics_forward_rub?: number;
  logistics_reverse_rub?: number;
  buyback_pct: number;
  advertising_pct: number;
  storage_rub?: number;
  
  // Optional fields
  warehouse_name?: string;
  volume_liters?: number;
  delivery_type?: 'fbo' | 'fbs';
  storage_days?: number;
  
  dimensions?: {
    length_cm: number;
    width_cm: number;
    height_cm: number;
  };
  
  overrides?: {
    commission_pct?: number;
    nm_id?: number;
  };
  
  commission_pct?: number;
  vat_pct?: number;
  acquiring_pct?: number;
}

export interface PriceCalculatorResponse {
  meta: {
    cabinet_id: string;
    calculated_at: string;
  };
  result: {
    recommended_price: number;
    target_margin_pct: number;
    actual_margin_rub: number;
    actual_margin_pct: number;
  };
  cost_breakdown: {
    fixed_costs: {
      cogs: number;
      logistics_forward: number;
      logistics_reverse_effective: number;
      logistics_total: number;
      storage: number;
      fixed_total: number;
    };
  };
  percentage_breakdown: {
    commission_wb: { pct: number; rub: number };
    acquiring: { pct: number; rub: number };
    advertising: { pct: number; rub: number };
    vat: { pct: number; rub: number };
    margin: { pct: number; rub: number };
    percentage_total: { pct: number; rub: number };
  };
  intermediate_values: {
    buyback_rate_pct: number;
    return_rate_pct: number;
    logistics_effective: number;
    total_percentage_rate: number;
  };
  auto_fill?: {
    warehouse_name?: string;
    logistics_source: 'auto' | 'manual';
    storage_source: 'auto' | 'manual';
    tariff_date?: string;
  };
  dimensions_calculation?: {
    dimensions_cm: {
      length_cm: number;
      width_cm: number;
      height_cm: number;
    };
    calculated_volume_liters: number;
    detected_cargo_type: 'MGT' | 'SGT' | 'KGT';
    volume_source: 'dimensions' | 'manual';
    max_dimension_cm: number;
  };
  warnings?: string[];
}
```

### React Hook

```typescript
// src/hooks/usePriceCalculator.ts

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PriceCalculatorRequest, PriceCalculatorResponse } from '@/types/price-calculator';

export const priceCalculatorQueryKeys = {
  all: ['price-calculator'] as const,
  calculate: (params: PriceCalculatorRequest) => 
    ['price-calculator', 'calculate', params] as const
};

export function usePriceCalculator() {
  return useMutation({
    mutationFn: (request: PriceCalculatorRequest) => 
      apiClient.post<PriceCalculatorResponse>('/v1/products/price-calculator', request),
    onSuccess: (data) => {
      // Track calculation success
      console.log('Price calculated:', data.result.recommended_price);
    },
    onError: (error) => {
      // Handle errors
      console.error('Price calculation failed:', error);
    }
  });
}
```

### Warehouse Selector Component

```typescript
// src/components/custom/price-calculator/WarehouseSelector.tsx

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Warehouse {
  id: number;
  name: string;
  city: string;
  federalDistrict: string;
}

interface WarehousesResponse {
  data: {
    warehouses: Warehouse[];
    updated_at: string;
  };
}

export function WarehouseSelector({ 
  value, 
  onChange 
}: { 
  value?: string; 
  onChange: (name: string) => void 
}) {
  const { data: warehousesData, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => apiClient.get<WarehousesResponse>('/v1/tariffs/warehouses'),
    staleTime: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  const warehouses = warehousesData?.data?.warehouses || [];
  
  return (
    <div className="space-y-2">
      <Label htmlFor="warehouse">Склад</Label>
      <Select value={value} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger id="warehouse">
          <SelectValue placeholder="Выберите склад" />
        </SelectTrigger>
        <SelectContent>
          {warehouses.map((warehouse) => (
            <SelectItem key={warehouse.id} value={warehouse.name}>
              <div className="flex items-center gap-2">
                <span>{warehouse.name}</span>
                <Badge variant="outline" className="text-xs">
                  {warehouse.city}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

---

## Summary

This guide provides comprehensive information for frontend developers integrating with the Price Calculator API:

### Key Takeaways
1. **Two modes**: Manual input vs Auto-fill from warehouse
2. **Auto-fill sources**: Warehouse name + volume or dimensions
3. **Cargo types**: MGT (≤60cm), SGT (≤120cm), KGT (>120cm)
4. **Coefficients**: Regional multipliers affect costs
5. **Fallback support**: Graceful degradation when data unavailable

### Implementation Checklist
- [ ] Implement manual input form
- [ ] Add warehouse selector with autocomplete
- [ ] Add volume input with dimensions calculator
- [ ] Display auto-fill indicators
- [ ] Show cargo type badges
- [ ] Handle warehouse not found errors
- [ ] Handle KGT cargo error
- [ ] Validate inputs client-side
- [ ] Cache warehouse list (24h)
- [ ] Display cost breakdown with auto/manual badges

### Rate Limits
- **Price Calculator**: 100 req/min (scope: `products`)
- **Warehouses**: 10 req/min (scope: `tariffs`)
- **Acceptance Coefficients**: 6 req/min (scope: `orders_fbw`)

### Cache Strategy
- **Warehouse list**: 24 hours
- **Acceptance coefficients**: 1 hour
- **Global settings**: 24 hours

---

**Related Documentation**:
- [Epic 43 README](./epics/epic-43/README.md) - Complete epic documentation
- [Price Calculator API Guide](../frontend/docs/request-backend/95-epic-43-price-calculator-api.md) - API reference
- [Tariffs Formulas Validation Report](104-tariffs-formulas-validation-report.md) - Complete formula validation with calculation examples
- [Tariffs Base Rates Analysis](./WB-TARIFFS-BASE-RATES-ANALYSIS.md) - Rate source documentation
- [Frontend Integration Guide](../frontend/docs/request-backend/102-tariffs-base-rates-frontend-guide.md) - Calculation formulas

**Last Updated**: 2026-01-24  
**Version**: 1.0  
**Status**: Production Ready
