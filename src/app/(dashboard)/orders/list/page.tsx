import { redirect } from 'next/navigation'

/** Redirect /orders/list → /orders — ORDERS.LIST route is a convenience alias */
export default function OrdersListPage() {
  redirect('/orders')
}
