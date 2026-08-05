import { TableHead } from '@/components/ui/table'

export function HistoricalSppHeaders() {
  return (
    <>
      <TableHead
        className="hidden lg:table-cell text-right"
        title="Фактическое историческое СПП по транзакциям финансового отчёта WB, ₽"
      >
        Историческое СПП, ₽
      </TableHead>
      <TableHead
        className="hidden lg:table-cell text-right"
        title="Фактическое историческое СПП по транзакциям финансового отчёта WB, %"
      >
        Историческое СПП, %
      </TableHead>
    </>
  )
}
