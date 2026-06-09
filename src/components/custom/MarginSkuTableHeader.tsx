'use client'

/**
 * MarginBySkuTable header component
 * Extracted from MarginBySkuTable.tsx (Epic 74, Story 74.6)
 */
import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SortableHeader } from './MarginSkuSortableHeader'
import { SortIcon } from './MarginSkuSortableHeader'
import type { SortField, SortOrder } from './margin-sku-table-sorting'

interface Props {
  sortField: SortField
  sortOrder: SortOrder
  onSort: (field: SortField) => void
  showROI: boolean
  showProfitPerUnit: boolean
}

export function MarginSkuTableHeader({
  sortField,
  sortOrder,
  onSort,
  showROI,
  showProfitPerUnit,
}: Props) {
  const SI = (field: SortField) => <SortIcon field={field} current={sortField} order={sortOrder} />

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[120px]">
          <button
            onClick={() => onSort('sa_name')}
            className="flex items-center font-medium hover:text-blue-600"
          >
            Артикул МП{SI('sa_name')}
          </button>
        </TableHead>
        <TableHead>
          <button
            onClick={() => onSort('sa_name')}
            className="flex items-center font-medium hover:text-blue-600"
          >
            Артикул{SI('sa_name')}
          </button>
        </TableHead>
        <SortableHeader
          field="qty"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
          label="Продано (шт)"
        />
        <SortableHeader
          field="revenue_net"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
          label="Выручка"
        />
        <TableHead className="text-right">
          <div className="flex items-center justify-end font-medium">Себестоимость</div>
        </TableHead>
        <SortableHeader
          field="profit"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
          label="Прибыль"
          tooltip="Операционная прибыль = Выручка − COGS − Все расходы"
          tooltipDetails={['(логистика, хранение, комиссия, эквайринг и др.)']}
        />
        <SortableHeader
          field="margin_pct"
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
          label="Маржа %"
          tooltip="Операционная маржа = (Прибыль ÷ |Выручка|) × 100%"
          tooltipDetails={[
            'Где Прибыль = Выручка − COGS − Все расходы:',
            '• Логистика (доставка + возврат)',
            '• Хранение',
            '• Комиссия WB, эквайринг, штрафы',
            '>30% — отлично, 15-30% — хорошо, <15% — низкая',
          ]}
        />
        {showProfitPerUnit && (
          <SortableHeader
            field="profit_per_unit"
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={onSort}
            label="Прибыль/ед."
            tooltip="Прибыль на единицу = Операционная прибыль ÷ Количество"
          />
        )}
        {showROI && (
          <SortableHeader
            field="roi"
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={onSort}
            label="ROI"
            tooltip="ROI = (Операционная прибыль ÷ COGS) × 100%"
          />
        )}
        <TableHead className="w-[50px]" />
      </TableRow>
    </TableHeader>
  )
}
