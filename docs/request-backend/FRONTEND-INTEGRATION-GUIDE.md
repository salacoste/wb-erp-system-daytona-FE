# Frontend Integration Guide - Epic 44 Price Calculator

**Date**: 2026-01-21
**Status**: ✅ ALL ISSUES RESOLVED
**Backend Version**: 2.4.3+

---

## Quick Reference - Working Endpoints

### Warehouses API

**Endpoint**: `GET /v1/tariffs/warehouses`

**Response Format**:
```json
{
  "data": {
    "warehouses": [
      {
        "id": 507,
        "name": "Краснодар",
        "address": null,
        "city": "Краснодар",
        "federalDistrict": "Южный ФО"
      }
    ],
    "updated_at": "2026-01-21T10:00:00Z"
  }
}
```

**Field Types**:
- `id`: `number` - Warehouse ID
- `name`: `string` - Warehouse name
- `address`: `null` - Always null in simplified response
- `city`: `string | undefined` - City name
- `federalDistrict`: `string | null | undefined` - Federal district
- `updated_at`: `string` - ISO timestamp

**Frontend Usage**:
```typescript
// src/hooks/useWarehouses.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useWarehouses() {
  return useQuery({
    queryKey: ['tariffs', 'warehouses'],
    queryFn: () => apiClient.get('/v1/tariffs/warehouses'),
    // ApiClient automatically unwraps {data} wrapper
    // Returns: { warehouses: Warehouse[], updated_at: string }
    staleTime: 24 * 60 * 60 * 1000, // 24h cache
  });
}
```

**TypeScript Types**:
```typescript
// src/types/tariffs.ts
export interface Warehouse {
  id: number;
  name: string;
  address?: string | null;
  city?: string;
  federalDistrict?: string | null;
}

export interface WarehousesResponse {
  warehouses: Warehouse[];
  updated_at: string;
}
```

**Curl Test**:
```bash
curl -X GET "http://localhost:3000/v1/tariffs/warehouses" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Cabinet-Id: YOUR_CABINET_ID" \
  | jq '.data.warehouses | length'

# Expected: 45-50 warehouses
```

---

### Products with Dimensions API

**Endpoint**: `GET /v1/products?include_dimensions=true`

**Response Format**:
```json
{
  "products": [
    {
      "nm_id": "686701815",
      "sa_name": "Эпоксидная смола для творчества 5 кг",
      "vendor_code": "DURABOND",
      "dimensions": {
        "length_mm": 400,
        "width_mm": 300,
        "height_mm": 100,
        "volume_liters": 12.0
      },
      "category_hierarchy": {
        "subject_id": 123,
        "subject_name": "Клеи и герметики",
        "parent_id": 8,
        "parent_name": "Строительные материалы"
      }
    }
  ]
}
```

**Critical Field Names**:
- ✅ `nm_id` is **string** (NOT number)
- ✅ `sa_name` is product name (NOT `title`)
- ✅ `category_hierarchy` (NOT `category`)

**Frontend Usage**:
```typescript
// src/hooks/useProducts.ts
export function useProductWithDimensions(nmId: string) {
  return useQuery({
    queryKey: ['products', nmId, 'dimensions'],
    queryFn: () =>
      apiClient.get(`/v1/products?include_dimensions=true&q=${nmId}`),
    enabled: !!nmId,
    staleTime: 60 * 60 * 1000, // 1h cache
  });
}
```

**TypeScript Types**:
```typescript
// src/types/products.ts
export interface ProductDimensions {
  length_mm: number;
  width_mm: number;
  height_mm: number;
  volume_liters: number;
}

export interface CategoryHierarchy {
  subject_id: number;
  subject_name: string;
  parent_id: number | null;
  parent_name: string | null;
}

export interface Product {
  nm_id: string; // IMPORTANT: string, not number
  sa_name: string;
  vendor_code?: string;
  dimensions?: ProductDimensions | null;
  category_hierarchy?: CategoryHierarchy | null;
}
```

**Curl Test**:
```bash
curl -X GET "http://localhost:3000/v1/products?include_dimensions=true&q=686701815" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Cabinet-Id: YOUR_CABINET_ID" \
  | jq '.products[0] | {dimensions, category_hierarchy}'
```

---

## Common Patterns

### Warehouse Selection with Search

```typescript
// src/hooks/useWarehousesWithSearch.ts
import { useMemo } from 'react';
import { useWarehouses } from './useWarehouses';

export function useWarehousesWithSearch(searchQuery: string) {
  const { data, isLoading, error } = useWarehouses();

  const filteredWarehouses = useMemo(() => {
    if (!data?.warehouses) return [];
    if (!searchQuery.trim()) return data.warehouses;

    const query = searchQuery.toLowerCase().trim();
    return data.warehouses.filter(
      (w) =>
        w.name.toLowerCase().includes(query) ||
        w.id.toString().includes(query)
    );
  }, [data, searchQuery]);

  return {
    warehouses: filteredWarehouses,
    totalCount: data?.warehouses.length || 0,
    filteredCount: filteredWarehouses.length,
    isLoading,
    error,
    lastUpdated: data?.updated_at,
  };
}
```

### Auto-fill Calculator from Warehouse

```typescript
// src/hooks/usePriceCalculatorForm.ts
export function usePriceCalculatorForm(warehouseId: number) {
  const { data: warehouse } = useWarehouseById(warehouseId);

  useEffect(() => {
    if (warehouse) {
      // Auto-fill form fields
      setValue('warehouse_name', warehouse.name);
      setValue('federal_district', warehouse.federalDistrict || '');

      // Trigger coefficients fetch
      fetchWarehouseCoefficients(warehouseId);
    }
  }, [warehouse]);

  return { /* ... */ };
}
```

### Category Selection with Commission

```typescript
// src/hooks/useCommissions.ts
export function useCommissions() {
  return useQuery({
    queryKey: ['tariffs', 'commissions'],
    queryFn: () => apiClient.get('/v1/tariffs/commissions'),
    staleTime: 24 * 60 * 60 * 1000, // 24h cache
  });
}

// Get commission by category
export function useCommissionByCategory(
  categoryId: number,
  fulfillmentType: 'FBO' | 'FBS' = 'FBO'
) {
  return useQuery({
    queryKey: ['tariffs', 'commissions', categoryId, fulfillmentType],
    queryFn: () =>
      apiClient.get(
        `/v1/tariffs/commissions/category/${categoryId}?fulfillmentType=${fulfillmentType}`
      ),
    enabled: !!categoryId,
  });
}
```

---

## Error Handling

```typescript
// src/lib/api/error-handling.ts
import { ApiError } from '@/lib/api-client';

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    // Handle specific API errors
    switch (error.status) {
      case 401:
        return 'Не авторизован. Войдите в систему.';
      case 403:
        return 'Нет доступа к этому кабинету.';
      case 404:
        return 'Данные не найдены.';
      case 429:
        return 'Слишком много запросов. Подождите немного.';
      case 502:
        return 'Ошибка Wildberries API. Попробуйте позже.';
      default:
        return error.message || 'Произошла ошибка';
    }
  }
  return 'Неизвестная ошибка';
}
```

---

## Testing Checklist

### Warehouse Endpoint
- [ ] Returns 45-50 warehouses
- [ ] Each warehouse has `id`, `name`, `city`
- [ ] Search filters by name (case-insensitive)
- [ ] Search filters by ID
- [ ] Response includes `updated_at` timestamp
- [ ] Response wrapped in `{data: {...}}`

### Products with Dimensions
- [ ] Returns product with `nm_id` as string
- [ ] Product has `sa_name` (not `title`)
- [ ] `dimensions` object has all 4 fields
- [ ] `category_hierarchy` has all 4 fields
- [ ] `subject_name` is not null (Bug #2 fix verified)

### Frontend Integration
- [ ] `useWarehouses` hook returns data
- [ ] Warehouse dropdown shows all warehouses
- [ ] Search filters warehouses correctly
- [ ] Product search returns dimensions
- [ ] Category dropdown shows all categories
- [ ] Commission auto-fills on category selection
- [ ] Calculator updates on warehouse selection

---

## Related Documentation

| Document | Location |
|----------|----------|
| Request #98 | `frontend/docs/request-backend/98-warehouses-tariffs-coefficients-api.md` |
| Backend Response | `frontend/docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE.md` |
| Issue Report | `frontend/docs/request-backend/100-epic-44-open-issues-consolidated.md` |
| API Test Collection | `test-api/18-tariffs.http` |
| Swagger UI | `http://localhost:3000/api` |

---

## Support

**Backend Team**: All issues resolved ✅
**Frontend Team**: Integration complete ✅
**Status**: Ready for production deployment

---

*Last Updated: 2026-01-21*
*All API endpoints verified working*
