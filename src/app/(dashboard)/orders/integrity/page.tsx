/**
 * Orders Integrity Dashboard Page
 * Route: /orders/integrity
 * Dashboard layout group: (dashboard)
 */

import { OrdersIntegrityPageContent } from './components/OrdersIntegrityPageContent'

export const metadata = {
  title: 'Целостность заказов — WB Repricer',
  description: 'Проверка целостности данных заказов и сверка',
}

export default function OrdersIntegrityPage() {
  return <OrdersIntegrityPageContent />
}
