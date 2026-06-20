import { METRIC_EXPLANATIONS } from '@/components/custom/financial-summary/metric-explanations'

export const DASHBOARD_WB_DEDUCTIONS_COPY = {
  commissionTitle: 'Комиссия WB (из оборота)',
  breakdownTitle: 'Разбивка комиссий',
  correctionLabel: 'Корректировка ВВ',
  nominalCommissionLabel: 'Номинальная комиссия',
  acquiringLabel: 'Эквайринг',
  loyaltyPenaltiesLabel: 'Комиссия лояльности + штрафы',
  servicesTitle: 'Прочие удержания (WB сервисы)',
  servicesDetailsAriaLabel: 'Подробнее о прочих удержаниях WB сервисов',
} as const

export const WB_COMMISSION_CARD_TOOLTIP = `Состав текущей карточки:
• ${DASHBOARD_WB_DEDUCTIONS_COPY.nominalCommissionLabel} — основная комиссия WB за выкупленные товары
• ${DASHBOARD_WB_DEDUCTIONS_COPY.acquiringLabel} — за приём платежей от покупателей
• ${DASHBOARD_WB_DEDUCTIONS_COPY.correctionLabel} — ${METRIC_EXPLANATIONS['Корректировка ВВ']}
• Комиссия лояльности — ${METRIC_EXPLANATIONS['Комиссия лояльности']}
• Штрафы — ${METRIC_EXPLANATIONS['Штрафы']}

${DASHBOARD_WB_DEDUCTIONS_COPY.servicesTitle} и WB.Продвижение показаны отдельно и не входят в эту карточку.
Источник: еженедельный финансовый отчёт WB.`

export const WB_OTHER_DEDUCTIONS_TOOLTIP = `${DASHBOARD_WB_DEDUCTIONS_COPY.servicesTitle}: подписка «Джем», транзит, утилизация и другие сервисы WB без WB.Продвижения. Продвижение показано отдельно в карточке «Реклама», чтобы не задваивать расходы.
Источник: еженедельный финансовый отчёт WB.`
