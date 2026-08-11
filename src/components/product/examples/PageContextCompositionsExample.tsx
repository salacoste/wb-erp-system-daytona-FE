'use client'

import { Button } from '@/components/ui/button'

import { ContextBar, PageHeader } from '..'

export interface PageContextCompositionsExampleProps {
  /** The route decides when metadata is being refreshed. */
  isRefreshing?: boolean
  /** The route owns refresh, reset, and primary-action behavior. */
  onRefresh: () => void
  onReset: () => void
  onCreate: () => void
}

/**
 * A route-free integration example with intentionally dense Russian content.
 *
 * The parent route supplies callbacks and the refreshing state; this example
 * does not read URL state, fetch data, or persist any context changes.
 */
export function PageContextCompositionsExample({
  isRefreshing = false,
  onRefresh,
  onReset,
  onCreate,
}: PageContextCompositionsExampleProps) {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Сводный отчёт по эффективности операций и изменениям показателей за выбранный период"
        description="Проверьте текущий контекст решения перед тем, как сравнивать результаты, обновлять данные или запускать следующее действие."
        breadcrumbs={[
          { label: 'Рабочая область' },
          { label: 'Операционная аналитика' },
          { label: 'Сводный отчёт за выбранный период' },
        ]}
        context={
          <span className="text-sm text-muted-foreground">
            Последнее изменение контекста: сегодня в 12:40
          </span>
        }
        status={isRefreshing ? 'Обновление контекста выполняется' : 'Контекст готов к работе'}
        busy={isRefreshing}
        actions={
          <Button type="button" size="sm" onClick={onCreate} className="min-h-11 min-w-11">
            Создать дополнительное представление
          </Button>
        }
      >
        <ContextBar
          cabinet="Основная рабочая область"
          period="1–7 августа 2026 года"
          comparison="С предыдущей неделей"
          freshness={
            isRefreshing ? 'Обновляется прямо сейчас' : 'Данные актуальны на сегодня, 12:40'
          }
          completeness="98% сведений получено"
          scope="Все доступные позиции и операции"
          state={isRefreshing ? 'refreshing' : 'fresh'}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          onReset={onReset}
        />
      </PageHeader>
    </div>
  )
}

export default PageContextCompositionsExample
