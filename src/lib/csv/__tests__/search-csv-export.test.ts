import { describe, expect, it } from 'vitest'
import type { SearchProductItem, SearchQueryItem } from '@/types/search-analytics'
import { unknownSearchCoverage } from '@/lib/api/search-coverage-normalizer'
import {
  exportSearchByProductToCsv,
  exportSearchByQueryToCsv,
  exportSearchOrdersToCsv,
} from '../search-csv-export'

const queryItem: SearchQueryItem = {
  searchQuery: 'летнее платье',
  avgPosition: 4,
  totalImpressions: 100,
  totalClicks: 91,
  avgCtr: null,
  searchCartAdds: 7,
  totalOrders: 3,
}

const productItem: SearchProductItem = {
  nmId: 123,
  vendorCode: 'DRESS-1',
  avgPosition: 5,
  totalImpressions: 200,
  totalClicks: 92,
  avgCtr: null,
  searchCartAdds: 8,
  totalOrders: 4,
}

describe('search analytics CSV exports', () => {
  it('exports by-product cart additions without presenting the deprecated clicks alias', () => {
    const [headers, row] = exportSearchByProductToCsv([queryItem]).slice(1).split('\r\n')

    expect(headers.split(',')).toEqual([
      'Запрос',
      'Ср. позиция',
      'Показы',
      'Ср. конверсия добавления в корзину %',
      'В корзину',
      'Заказы',
    ])
    expect(row.split(',')).toEqual(['летнее платье', '4', '100', '', '7', '3'])
    expect(headers).not.toContain('CTR')
    expect(headers).not.toContain('Клики')
    expect(row).not.toContain('91')
  })

  it('exports by-query cart additions without presenting the deprecated clicks alias', () => {
    const [headers, row] = exportSearchByQueryToCsv([productItem]).slice(1).split('\r\n')

    expect(headers.split(',')).toEqual([
      'Артикул (nmId)',
      'Артикул продавца',
      'Ср. позиция',
      'Показы',
      'Ср. конверсия добавления в корзину %',
      'В корзину',
      'Заказы',
    ])
    expect(row.split(',')).toEqual(['123', 'DRESS-1', '5', '200', '', '8', '4'])
    expect(headers).not.toContain('CTR')
    expect(headers).not.toContain('Клики')
    expect(row).not.toContain('92')
  })

  it('prepends explicit partial-coverage metadata to search-orders CSV', () => {
    const csv = exportSearchOrdersToCsv([{ key: 'платье', totalOrders: 3, uniqueProducts: 1 }], {
      totalSearchOrders: 3,
      searchOrderShare: 15,
      coverageKnown: true,
      requestedDayCount: 3,
      coveredDayCount: 2,
      missingDayCount: 1,
      coverageComplete: false,
      coveredDates: ['2026-03-01', '2026-03-02'],
      missingDates: ['2026-03-03'],
    }).slice(1)

    expect(csv).toContain('Статус покрытия,Неполное')
    expect(csv).toContain('Запрошено дней,3')
    expect(csv).toContain('Покрыто дней,2')
    expect(csv).toContain('Дней без покрытия,1')
    expect(csv).toContain('Даты без покрытия,2026-03-03')
    expect(csv).toContain('Расчёт метрик,Только по покрытым датам')
    expect(csv).toContain('\r\n\r\nЗапрос,Заказы,Товаров\r\nплатье,3,1')
  })

  it('distinguishes complete zero-row coverage from unknown coverage', () => {
    const complete = exportSearchOrdersToCsv([], {
      totalSearchOrders: 0,
      searchOrderShare: null,
      coverageKnown: true,
      requestedDayCount: 1,
      coveredDayCount: 1,
      missingDayCount: 0,
      coverageComplete: true,
      coveredDates: ['2026-03-01'],
      missingDates: [],
    })
    expect(complete).toContain('Статус покрытия,Полное')
    expect(complete).toContain('Покрыто дней,1')

    const unknown = exportSearchOrdersToCsv([], {
      totalSearchOrders: 0,
      searchOrderShare: null,
      coverageKnown: false,
      requestedDayCount: 1,
      coveredDayCount: 0,
      missingDayCount: 1,
      coverageComplete: false,
      coveredDates: [],
      missingDates: ['2026-03-01'],
    })
    expect(unknown).toContain('Статус покрытия,Неизвестно')
    expect(unknown).toContain('Дней без покрытия,1')
  })

  it('exports complete nonzero coverage with its data row', () => {
    const csv = exportSearchOrdersToCsv([{ key: 'платье', totalOrders: 3 }], {
      totalSearchOrders: 3,
      searchOrderShare: 15,
      coverageKnown: true,
      requestedDayCount: 1,
      coveredDayCount: 1,
      missingDayCount: 0,
      coverageComplete: true,
      coveredDates: ['2026-03-01'],
      missingDates: [],
    })

    expect(csv).toContain('Статус покрытия,Полное')
    expect(csv).toContain('\r\n\r\nЗапрос,Заказы,Товаров\r\nплатье,3,0')
  })

  // Pass-1 M2: the canonical unknown shape (what the normalizer actually emits) must not
  // carry the «Расчёт метрик» computation claim — authority is denied in that state.
  it('omits the computation claim for the canonical unknown coverage shape', () => {
    const csv = exportSearchOrdersToCsv([], {
      totalSearchOrders: 0,
      searchOrderShare: null,
      ...unknownSearchCoverage(),
    })
    expect(csv).toContain('Статус покрытия,Неизвестно')
    expect(csv).not.toContain('Расчёт метрик')
  })

  it('quotes a multi-date missing-dates cell per RFC-4180 (join uses ", ")', () => {
    const csv = exportSearchOrdersToCsv([], {
      totalSearchOrders: 0,
      searchOrderShare: null,
      coverageKnown: true,
      requestedDayCount: 2,
      coveredDayCount: 0,
      missingDayCount: 2,
      coverageComplete: false,
      coveredDates: [],
      missingDates: ['2026-03-01', '2026-03-02'],
    })
    expect(csv).toContain('Даты без покрытия,"2026-03-01, 2026-03-02"')
  })
})
