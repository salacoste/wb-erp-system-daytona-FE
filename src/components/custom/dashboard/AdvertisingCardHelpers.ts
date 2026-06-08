/**
 * AdvertisingCard helpers — extracted for line-count compliance.
 * DRR calculation functions and tooltip content strings.
 */

/** DRR = totalSpend / saleGross * 100 (% of net sales) */
export function calculateDrr(
  totalSpend: number | null | undefined,
  saleGross: number | null | undefined
): number | null {
  if (totalSpend == null || saleGross == null || saleGross <= 0) return null
  return (totalSpend / saleGross) * 100
}

/** DRRz = totalSpend / ordersRevenue * 100 (% of orders retail price) */
export function calculateDrrz(
  totalSpend: number | null | undefined,
  ordersRevenue: number | null | undefined
): number | null {
  if (totalSpend == null || ordersRevenue == null || ordersRevenue <= 0) return null
  return (totalSpend / ordersRevenue) * 100
}

/** Tooltip text for the advertising card header, keyed by data source */
export const ADVERTISING_TOOLTIPS = {
  finance: `Расходы на продвижение — фактические удержания WB за рекламу.\nИсточник суммы: строки «Продвижение» из недельного финансового отчёта WB (wb_finance_raw).\nЭто реальные списания, которые уже учтены в «К перечислению».\nROAS и ДРР рассчитаны на основе этих данных.\nСумма может отличаться от рекламного API на ~1–3% из-за финальных корректировок WB.\nСравнение инвертировано: рост расходов = негативная тенденция (красный).\nИсточник: wb_finance_raw (reason = «Удержание», pattern ~«продвижен»).`,
  api: `Расходы на рекламу — данные из рекламного кабинета WB (Promotion API).\nВключает все типы кампаний: поиск, каталог, авто, карточка товара.\nЭто затраты по рекламному API — могут незначительно отличаться от финального удержания в отчёте WB.\nROAS рассчитан как: выручка от рекламы ÷ расход (по данным рекламного API).\nСравнение инвертировано: рост расходов = негативная тенденция (красный).\nИсточник: advertising-analytics (adv_daily_stats).`,
} as const

/** Tooltip text for ROAS metric */
export const ROAS_TOOLTIP = `ROAS (Return on Ad Spend) — рентабельность рекламы.\nФормула: выручка от рекламных кампаний ÷ расход на кампании.\nДанные из рекламного кабинета WB (Promotion API) — учитывается только выручка, атрибутированная к рекламе.\nОриентиры: ≥5x — отлично (зелёный), 3–5x — хорошо, 2–3x — умеренно, 1–2x — слабо, <1x — убыток (красный).\n⚠ Отличается от «финансового ROAS» (sale_gross ÷ wb_promotion из отчёта), т.к. источники данных разные.`

/** Tooltip text for DRR metric */
export const DRR_TOOLTIP = `ДРР (Доля Рекламных Расходов) = расход на рекламу ÷ чистые продажи (sale_gross) × 100%.\nПоказывает, какой % от выручки уходит на рекламу.\nОриентиры: <5% — экономно, 5–15% — нормально, >15% — дорого.\nДРРз = расход ÷ заказы по РРЦ (розничная цена) × 100%.\nДРРз всегда ниже ДРР, т.к. заказы по РРЦ > чистых продаж (не все заказы выкупаются + РРЦ до комиссии WB).`
