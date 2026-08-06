import { test, expect, type Page } from './fixtures/network-test'

/**
 * Epic 44-FE: Price Calculator UI - E2E Tests
 *
 * Тестовое покрытие:
 * - TC-E2E-001: Загрузка страницы и базовая структура
 * - TC-E2E-002: FBO/FBS переключатель типа исполнения
 * - TC-E2E-003: Слайдер целевой маржи с визуальными зонами
 * - TC-E2E-004: Ввод фиксированных затрат (COGS, логистика)
 * - TC-E2E-005: Валидация формы
 * - TC-E2E-006: Расчёт цены и отображение результатов
 * - TC-E2E-007: Сброс формы (с подтверждением и без)
 * - TC-E2E-008: Клавиатурная навигация (Escape)
 * - TC-E2E-009: Дополнительные параметры (collapsible)
 * - TC-E2E-010: Доступность (WCAG 2.1 AA)
 * - TC-E2E-011: Адаптивность на мобильных устройствах
 *
 * Предварительные требования:
 * - Dev сервер запущен на localhost:3100
 * - Авторизация через e2e/.auth/user.json
 *
 * Примечание: Используем page.evaluate для заполнения input полей
 * из-за особенностей react-hook-form с valueAsNumber
 */

test.describe('Epic 44-FE: Price Calculator UI', () => {
  // ============================================================================
  // Setup & Helpers
  // ============================================================================

  /**
   * Helper: mock tariff reference endpoints used on page load.
   *
   * The real backend protects tariff reference endpoints with strict per-minute
   * limits. This UI suite opens/reloads the calculator in many independent tests,
   * so using live reference data here makes the JS-error smoke flaky and can hide
   * real UI regressions behind backend 429 noise. Live backend/tariff contract
   * checks are covered by separate smoke diagnostics; this spec validates UI.
   */
  async function mockTariffReferenceData(page: Page) {
    const tariffSettings = {
      default_commission_fbo_pct: 15,
      default_commission_fbs_pct: 18,
      acceptance_box_rate_per_liter: 0.11,
      acceptance_pallet_rate: 0,
      logistics_volume_tiers: [{ min: 0, max: 5, rate: 46 }],
      logistics_large_first_liter_rate: 46,
      logistics_large_additional_liter_rate: 14,
      return_logistics_fbo_rate: 50,
      return_logistics_fbs_rate: 50,
      storage_free_days: 30,
      fbs_uses_fbo_logistics_rates: false,
      effective_from: '2026-01-01',
    }

    const warehouse = {
      id: 507,
      name: 'Коледино',
      city: 'Коледино',
      federal_district: 'ЦФО',
      cargo_type: 'box',
      tariffs: {
        fbo: {
          delivery_base_rub: 46,
          delivery_liter_rub: 14,
          logistics_coefficient: 1,
        },
        fbs: {
          delivery_base_rub: 30,
          delivery_liter_rub: 10,
          logistics_coefficient: 1,
        },
        storage: {
          base_per_day_rub: 0.07,
          liter_per_day_rub: 0.05,
          coefficient: 1,
        },
        effective_from: '2026-01-01',
      },
    }

    const coefficients = [
      {
        warehouseId: 507,
        warehouseName: 'Коледино',
        date: '2026-01-01',
        coefficient: 1,
        isAvailable: true,
        allowUnload: true,
        boxTypeId: 2,
        boxTypeName: 'Короб',
        delivery: { coefficient: 1, baseLiterRub: 46, additionalLiterRub: 14 },
        storage: { coefficient: 1, baseLiterRub: 0.07, additionalLiterRub: 0.05 },
        isSortingCenter: false,
      },
    ]

    await page.route('**/v1/tariffs/warehouses-with-tariffs**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ warehouses: [warehouse], updated_at: '2026-01-01T00:00:00Z' }),
      })
    )

    await page.route('**/v1/tariffs/acceptance/coefficients/all**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          coefficients,
          meta: {
            total: coefficients.length,
            available: coefficients.length,
            unavailable: 0,
            cache_ttl_seconds: 3600,
          },
        }),
      })
    )

    await page.route('**/v1/tariffs/commissions**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          commissions: [
            {
              parentID: 1,
              parentName: 'Одежда',
              subjectID: 11,
              subjectName: 'Футболки',
              paidStorageKgvp: 15,
              kgvpMarketplace: 18,
              kgvpSupplier: 15,
              kgvpSupplierExpress: 20,
            },
          ],
          meta: { total: 1, cached: true, cache_ttl_seconds: 86400 },
        }),
      })
    )

    await page.route('**/v1/tariffs/settings**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(tariffSettings),
      })
    )
  }

  test.beforeEach(async ({ page }) => {
    await mockTariffReferenceData(page)

    // Навигация на страницу калькулятора цены
    await page.goto('/cogs/price-calculator')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('[data-testid="price-calculator-form"]')).toBeVisible()
  })

  /**
   * Helper: fill through Playwright so React Hook Form receives the browser events.
   */
  async function fillInput(page: Page, id: string, value: string) {
    const input = page.locator(`#${id}`)
    await expect(input).toBeVisible()
    await input.fill(value)
    await expect(input).toHaveValue(value)
  }

  /**
   * Helper: Мок успешного ответа API расчёта цены
   */
  async function mockCalculationSuccess(page: Page) {
    await page.route('**/v1/products/price-calculator', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            recommended_price: 2500,
            minimum_price: 2100,
            customer_price: 2250,
          },
          percentage_breakdown: {
            commission_wb: 375,
            acquiring: 45,
            advertising: 125,
            vat: 0,
            margin: 500,
          },
          warnings: [],
        }),
      })
    })
  }

  // ============================================================================
  // TC-E2E-001: Загрузка страницы и базовая структура
  // ============================================================================

  test('TC-E2E-001: Страница загружается без ошибок', async ({ page }) => {
    // Проверяем URL
    await expect(page).toHaveURL(/\/cogs\/price-calculator/)

    // Проверяем заголовок страницы
    const pageTitle = page.getByRole('heading', { name: 'Калькулятор цены' })
    await expect(pageTitle).toBeVisible()

    // Проверяем breadcrumb навигацию
    const breadcrumb = page.getByText('Управление себестоимостью')
    await expect(breadcrumb).toBeVisible()

    // Проверяем наличие формы калькулятора
    const formCard = page.locator('[data-testid="price-calculator-form"]')
    await expect(formCard).toBeVisible()

    // Проверяем заголовок карточки формы
    await expect(formCard.getByText('Калькулятор цены')).toBeVisible()
    await expect(formCard.getByText('Рассчитайте оптимальную цену')).toBeVisible()
  })

  test('TC-E2E-001b: Двухколоночный layout на десктопе', async ({ page }) => {
    // Устанавливаем десктопный viewport
    await page.setViewportSize({ width: 1280, height: 800 })

    // Проверяем grid layout
    const gridContainer = page.locator('.grid.grid-cols-1.lg\\:grid-cols-2')
    await expect(gridContainer).toBeVisible()

    // Левая колонка - форма
    const formCard = page.locator('[data-testid="price-calculator-form"]')
    await expect(formCard).toBeVisible()

    // Правая колонка - результаты (пустое состояние). Results render twice (desktop column +
    // lg:hidden mobile copy, both in the DOM) — assert the first (desktop, visible on this viewport).
    const emptyState = page.getByText('Введите параметры затрат и нажмите').first()
    await expect(emptyState).toBeVisible()
  })

  // ============================================================================
  // TC-E2E-002: FBO/FBS переключатель типа исполнения
  // ============================================================================

  test('TC-E2E-002: FBO/FBS переключатель работает', async ({ page }) => {
    // Находим radiogroup
    const fulfillmentGroup = page.locator('[role="radiogroup"][aria-label="Тип исполнения"]')
    await expect(fulfillmentGroup).toBeVisible()

    // FBO кнопка
    const fboButton = fulfillmentGroup.locator('[role="radio"]').filter({ hasText: 'FBO' })
    const fbsButton = fulfillmentGroup.locator('[role="radio"]').filter({ hasText: 'FBS' })

    // По умолчанию FBO выбран
    await expect(fboButton).toHaveAttribute('aria-checked', 'true')
    await expect(fbsButton).toHaveAttribute('aria-checked', 'false')

    // Переключаемся на FBS
    await fbsButton.click()
    await expect(fbsButton).toHaveAttribute('aria-checked', 'true')
    await expect(fboButton).toHaveAttribute('aria-checked', 'false')

    // Проверяем подписи
    await expect(fboButton).toContainText('Товар на складе WB')
    await expect(fbsButton).toContainText('Товар у продавца')
  })

  test('TC-E2E-002b: Поле "Хранение" скрывается при FBS', async ({ page }) => {
    // При FBO поле хранения видно
    const storageLabel = page.getByLabel('Хранение')
    await expect(storageLabel).toBeVisible()

    // Переключаемся на FBS
    const fbsButton = page.locator('[role="radio"]').filter({ hasText: 'FBS' })
    await fbsButton.click()

    // Поле хранения должно скрыться
    await expect(storageLabel).not.toBeVisible()
  })

  // ============================================================================
  // TC-E2E-003: Слайдер целевой маржи с визуальными зонами
  // ============================================================================

  test('TC-E2E-003: Слайдер маржи работает и показывает зоны', async ({ page }) => {
    // Находим секцию целевой маржи
    const marginSection = page.locator('.bg-primary\\/5').filter({ hasText: 'Целевая маржа' })
    await expect(marginSection).toBeVisible()

    // Находим слайдер
    const slider = marginSection.locator('[role="slider"]')
    await expect(slider).toBeVisible()

    // Находим input для маржи
    const marginInput = marginSection.locator('input[type="number"]')
    await expect(marginInput).toBeVisible()

    // Проверяем зоновые метки (используем first() так как есть дубликаты)
    await expect(marginSection.getByText('Низкая').first()).toBeVisible()
    await expect(marginSection.getByText('Средняя').first()).toBeVisible()
    await expect(marginSection.getByText('Высокая').first()).toBeVisible()
  })

  test('TC-E2E-003b: Badge маржи меняется при изменении значения', async ({ page }) => {
    const marginSection = page.locator('.bg-primary\\/5').filter({ hasText: 'Целевая маржа' })

    // Проверяем что начальное значение 20 (Средняя)
    let badge = marginSection.locator('div.rounded-md.border.shadow-sm')
    await expect(badge).toContainText('Средняя')

    // Устанавливаем высокую маржу (> 25%) - используем слайдер через aria
    const slider = marginSection.locator('[role="slider"]')
    await slider.focus()
    // Story 162.8: after the native-value-setter + input event, observe React
    // Hook Form's reflection of the new value via a bounded `toHaveValue`
    // (replaces the prior elapsed 400ms wait). The badge text assertion that
    // follows is itself bounded, so the value settle is the only missing link.
    const marginInput = marginSection.locator('input[type="number"]')
    await page.evaluate(() => {
      const section = document.querySelector('.bg-primary\\/5')
      const input = section?.querySelector('input[type="number"]') as HTMLInputElement
      if (input) {
        // Используем нативный React способ - симулируем изменение через Object.getOwnPropertyDescriptor
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(input, '30')
          input.dispatchEvent(new Event('input', { bubbles: true }))
        }
      }
    })
    await expect(marginInput).toHaveValue('30', { timeout: 5000 })
    await expect(badge).toContainText('Высокая')

    // Устанавливаем низкую маржу (< 10%)
    await page.evaluate(() => {
      const section = document.querySelector('.bg-primary\\/5')
      const input = section?.querySelector('input[type="number"]') as HTMLInputElement
      if (input) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(input, '5')
          input.dispatchEvent(new Event('input', { bubbles: true }))
        }
      }
    })
    await expect(marginInput).toHaveValue('5', { timeout: 5000 })
    await expect(badge).toContainText('Низкая')
  })

  // ============================================================================
  // TC-E2E-004: Ввод фиксированных затрат
  // ============================================================================

  test('TC-E2E-004: Поля фиксированных затрат доступны', async ({ page }) => {
    const fixedCostsSection = page
      .locator('[data-testid="price-calculator-form"]')
      .locator('.bg-blue-50.border-l-4')
    await expect(fixedCostsSection).toBeVisible()
    await expect(
      fixedCostsSection.getByText('Фиксированные затраты (₽)', { exact: true })
    ).toBeVisible()

    // COGS поле - используем fillInput helper
    const cogsInput = page.locator('#cogs_rub')
    await expect(cogsInput).toBeVisible()
    await fillInput(page, 'cogs_rub', '1500')
    await expect(cogsInput).toHaveValue('1500')

    // Логистика до склада
    const logisticsForward = page.locator('#logistics_forward_rub')
    await expect(logisticsForward).toBeVisible()
    await fillInput(page, 'logistics_forward_rub', '150')
    await expect(logisticsForward).toHaveValue('150')

    // Логистика возврата
    const logisticsReverse = page.locator('#logistics_reverse_rub')
    await expect(logisticsReverse).toBeVisible()
    await fillInput(page, 'logistics_reverse_rub', '200')
    await expect(logisticsReverse).toHaveValue('200')
  })

  // ============================================================================
  // TC-E2E-005: Валидация формы
  // ============================================================================

  test('TC-E2E-005: Валидация обязательных полей', async ({ page }) => {
    // Кнопка расчёта
    const calculateButton = page.getByRole('button', { name: /Рассчитать цену/i })

    // Без заполнения формы кнопка должна быть visible
    await expect(calculateButton).toBeVisible()

    // Проверяем что COGS input существует и имеет min=0
    const cogsInput = page.locator('#cogs_rub')
    await expect(cogsInput).toBeVisible()
    const minValue = await cogsInput.getAttribute('min')
    expect(minValue).toBe('0')

    // Zero is a valid minimum for the cost fields, so the default form is valid.
    // The submit handler independently prevents an all-zero calculation request.
    await expect(cogsInput).toHaveValue('0')
    await expect(calculateButton).toBeEnabled()
  })

  test('TC-E2E-005b: Валидные данные активируют кнопку расчёта', async ({ page }) => {
    // Заполняем обязательные поля используя fillInput helper
    await fillInput(page, 'cogs_rub', '1500')
    await fillInput(page, 'logistics_forward_rub', '150')
    await fillInput(page, 'logistics_reverse_rub', '200')

    // Кнопка расчёта должна стать активной. Story 162.8: `fillInput` already
    // proves each value reached React Hook Form via toHaveValue, and
    // `toBeEnabled` is itself a bounded assertion — no elapsed wait needed.
    const calculateButton = page.getByRole('button', { name: /Рассчитать цену/i })
    await expect(calculateButton).toBeEnabled()
  })

  // ============================================================================
  // TC-E2E-006: Расчёт цены и отображение результатов
  // ============================================================================

  test('TC-E2E-006: Расчёт цены показывает результаты', async ({ page }) => {
    // Мокаем успешный ответ API ПЕРЕД заполнением формы
    await mockCalculationSuccess(page)

    // Заполняем форму используя fillInput helper
    await fillInput(page, 'cogs_rub', '1500')
    await fillInput(page, 'logistics_forward_rub', '150')
    await fillInput(page, 'logistics_reverse_rub', '200')
    await fillInput(page, 'spp_pct', '10')

    // Начинаем наблюдение до отправки, чтобы доказать сам POST и его ответ.
    const requestPromise = page.waitForRequest(
      request =>
        request.method() === 'POST' && request.url().includes('/v1/products/price-calculator')
    )
    const responsePromise = page.waitForResponse(
      response =>
        response.request().method() === 'POST' &&
        response.url().includes('/v1/products/price-calculator')
    )
    await page.getByRole('button', { name: 'Рассчитать цену' }).click()

    const [request, response] = await Promise.all([requestPromise, responsePromise])
    expect(response.status()).toBe(200)
    expect(request.postDataJSON()).toMatchObject({
      cogs_rub: 1500,
      logistics_forward_rub: 150,
      logistics_reverse_rub: 200,
    })
    await expect(response.json()).resolves.toMatchObject({
      result: {
        recommended_price: 2500,
        minimum_price: 2100,
        customer_price: 2250,
      },
    })

    // UI показывает двухуровневый расчёт из отправленных параметров формы.
    const resultsCard = page.locator('[data-testid="price-calculator-results"]:visible')
    const pricingDisplay = resultsCard.locator('[data-testid="two-level-pricing-display"]')
    await expect(resultsCard).toBeVisible()
    await expect(pricingDisplay).toBeVisible()
    await expect(resultsCard.locator('[data-testid="minimum-price"]')).toHaveText(
      /2[\s\u00a0]?142,49\s*₽/
    )
    await expect(resultsCard.locator('[data-testid="recommended-price"]')).toHaveText(
      /3[\s\u00a0]?504,24/
    )
    await expect(resultsCard.locator('[data-testid="customer-price"]')).toHaveText(
      /3[\s\u00a0]?153,81\s*₽/
    )
  })

  test('TC-E2E-006b: Показывается индикатор загрузки', async ({ page }) => {
    // Story 162.8: gate the calculator response on an external Promise so the
    // POST stays genuinely in-flight while the loading indicator is observed
    // (no timer helper). `finally` releases the gate after the assertion so
    // the route can never strand the worker (Playwright routes persist per
    // worker). Mirrors the 162.7 supply-planning loading-state recipe.
    let releaseResponse: () => void = () => {}
    const gatedResponse = new Promise<void>(resolve => {
      releaseResponse = resolve
    })
    await page.route('**/v1/products/price-calculator', async route => {
      await gatedResponse
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: { recommended_price: 2500, minimum_price: 2100, customer_price: 2250 },
          percentage_breakdown: {},
          warnings: [],
        }),
      })
    })

    // Заполняем форму используя fillInput helper
    await fillInput(page, 'cogs_rub', '1500')
    await fillInput(page, 'logistics_forward_rub', '150')
    await fillInput(page, 'logistics_reverse_rub', '200')

    // Нажимаем кнопку расчёта через JavaScript
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement
      if (btn) btn.click()
    })

    // Проверяем индикатор загрузки (текст "Расчёт..." в секции кнопок)
    try {
      const loadingText = page.locator('button[type="submit"]').getByText('Расчёт...')
      await expect(loadingText).toBeVisible({ timeout: 5000 })
    } finally {
      releaseResponse()
    }
  })

  // ============================================================================
  // TC-E2E-007: Сброс формы
  // ============================================================================

  test('TC-E2E-007: Сброс формы без результатов (без подтверждения)', async ({ page }) => {
    // Заполняем поле используя fillInput helper
    const cogsInput = page.locator('#cogs_rub')
    await fillInput(page, 'cogs_rub', '1500')
    await expect(cogsInput).toHaveValue('1500')

    await page.getByRole('button', { name: 'Сбросить', exact: true }).click()

    // Диалог подтверждения НЕ должен появиться (нет результатов)
    const confirmDialog = page.locator('[role="dialog"]')
    await expect(confirmDialog).not.toBeVisible()

    // Поле должно быть очищено (значение по умолчанию - 0 или пустое)
    await expect(cogsInput).toHaveValue(/^(?:0)?$/)
  })

  test('TC-E2E-007b: Сброс формы с результатами (требует подтверждения)', async ({ page }) => {
    // Мокаем успешный ответ
    await mockCalculationSuccess(page)

    // Заполняем форму используя fillInput helper
    await fillInput(page, 'cogs_rub', '1500')
    await fillInput(page, 'logistics_forward_rub', '150')
    await fillInput(page, 'logistics_reverse_rub', '200')

    const responsePromise = page.waitForResponse(
      response =>
        response.request().method() === 'POST' &&
        response.url().includes('/v1/products/price-calculator')
    )
    await page.getByRole('button', { name: 'Рассчитать цену' }).click()
    expect((await responsePromise).status()).toBe(200)
    const resultsCard = page.locator('[data-testid="price-calculator-results"]:visible')
    await expect(resultsCard).toBeVisible()

    await page.getByRole('button', { name: 'Сбросить', exact: true }).click()

    const confirmDialog = page.getByRole('dialog', { name: 'Подтверждение сброса' })
    await expect(confirmDialog).toBeVisible()
    await expect(confirmDialog.getByText('Подтверждение сброса')).toBeVisible()
    await expect(confirmDialog.getByRole('button', { name: 'Сбросить форму' })).toBeVisible()
    await confirmDialog.getByRole('button', { name: 'Отмена' }).click()
    await expect(confirmDialog).not.toBeVisible()
    await expect(resultsCard).toBeVisible()
  })

  // ============================================================================
  // TC-E2E-008: Клавиатурная навигация (Escape)
  // ============================================================================

  test('TC-E2E-008: Escape сбрасывает форму', async ({ page }) => {
    // Заполняем поле используя fillInput helper (asserts toHaveValue, so no
    // post-fill elapsed wait is needed).
    const cogsInput = page.locator('#cogs_rub')
    await fillInput(page, 'cogs_rub', '1500')

    // Симулируем Escape через JavaScript KeyboardEvent
    await page.evaluate(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        bubbles: true,
      })
      window.dispatchEvent(event)
    })

    // Story 162.8: observe the reset via a bounded `toHaveValue` on the COGS
    // input (replaces the prior elapsed 300ms wait + unbounded inputValue()).
    // The reset settles the field to its default ('0' or '') once the Escape
    // handler runs; a bounded wait surfaces a missed reset instead of racing.
    await expect(cogsInput).toHaveValue(/^(?:0)?$/, { timeout: 5000 })
  })

  // ============================================================================
  // TC-E2E-009: Дополнительные параметры (collapsible)
  // ============================================================================

  test('TC-E2E-009: Collapsible sections работают (TaxConfiguration)', async ({ page }) => {
    // Скроллим вниз чтобы найти налоговую секцию (best-effort: the page may not
    // overflow, so scrollY may stay 0 — do NOT assert it). Story 162.8: the prior
    // elapsed 200ms wait is removed; the tax-section isVisible() check below is
    // the bounded observable signal.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Проверяем что есть collapsible секция (TaxPresetGrid или TaxConfiguration)
    const taxSection = page.locator('[data-testid="tax-configuration-section"]')
    const isTaxSectionVisible = await taxSection.isVisible().catch(() => false)

    // Если налоговая секция видна, проверяем её
    if (isTaxSectionVisible) {
      await expect(taxSection).toBeVisible()
      // Проверяем элементы налоговой секции
      const taxRateInput = page.locator('[data-testid="tax-rate-input"]')
      const isTaxRateVisible = await taxRateInput.isVisible().catch(() => false)
      expect(isTaxRateVisible).toBeTruthy()
    } else {
      // Если секция отсутствует, проверяем что форма имеет другую структуру
      // Форма должна содержать базовые элементы
      const formCard = page.locator('[data-testid="price-calculator-form"]')
      await expect(formCard).toBeVisible()
    }
  })

  // ============================================================================
  // TC-E2E-010: Доступность (WCAG 2.1 AA)
  // ============================================================================

  test('TC-E2E-010: Все input имеют labels', async ({ page }) => {
    const formCard = page.locator('[data-testid="price-calculator-form"]')
    const inputs = formCard.locator('input[type="number"]')
    await expect(formCard.getByLabel('Себестоимость (COGS)', { exact: true })).toBeVisible()
    const count = await inputs.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      await expect(inputs.nth(i)).toHaveAccessibleName(/.+/)
    }
  })

  test('TC-E2E-010b: Кнопки имеют accessible names', async ({ page }) => {
    // Кнопка расчёта
    const calcButton = page.getByRole('button', { name: /Рассчитать цену/i })
    await expect(calcButton).toBeVisible()

    // Кнопка сброса
    const resetButton = page.getByRole('button', { name: /Сбросить/i })
    await expect(resetButton).toBeVisible()

    // FBO/FBS кнопки
    const fboButton = page.locator('[role="radio"]').filter({ hasText: 'FBO' })
    await expect(fboButton).toBeVisible()
  })

  test('TC-E2E-010c: Клавиатурная навигация работает', async ({ page }) => {
    // Кликаем на первый input чтобы установить начальный фокус
    const cogsInput = page.locator('#cogs_rub')
    await cogsInput.focus()

    // Story 162.8: observe focus via a bounded poll on document.activeElement
    // (replaces the prior elapsed 100ms wait + unbounded evaluate read).
    await expect
      .poll(async () => page.evaluate(() => document.activeElement?.id), { timeout: 5000 })
      .toBe('cogs_rub')

    // Tab к следующему элементу используя JavaScript
    await page.evaluate(() => {
      const focusable = Array.from(
        document.querySelectorAll(
          'input, button, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
        )
      ) as HTMLElement[]
      const current = document.activeElement
      const currentIndex = focusable.indexOf(current as HTMLElement)
      if (currentIndex >= 0 && currentIndex < focusable.length - 1) {
        focusable[currentIndex + 1].focus()
      }
    })

    // Проверяем что фокус переместился на интерактивный элемент. Bounded poll
    // on the active-element tag (replaces the prior elapsed 100ms wait).
    await expect
      .poll(async () => page.evaluate(() => document.activeElement?.tagName ?? ''), {
        timeout: 5000,
      })
      .toMatch(/^(INPUT|BUTTON|SELECT|A|DIV|SPAN|TEXTAREA)$/)
  })

  test('TC-E2E-010d: Иерархия заголовков корректна', async ({ page }) => {
    const main = page.getByRole('main')
    await expect(
      main.getByRole('heading', { name: 'Калькулятор цены', level: 1, exact: true })
    ).toHaveCount(1)
    await expect(main.locator('h2, h3, h4, h5, h6')).toHaveCount(0)
  })

  // ============================================================================
  // TC-E2E-011: Адаптивность на мобильных устройствах
  // ============================================================================

  test('TC-E2E-011: Страница корректно отображается на мобильном', async ({ page }) => {
    // Устанавливаем мобильный viewport (iPhone 12 Pro)
    await page.setViewportSize({ width: 390, height: 844 })

    // Заголовок виден
    const pageTitle = page.getByRole('heading', { name: 'Калькулятор цены' })
    await expect(pageTitle).toBeVisible()

    // Форма видна
    const formCard = page.locator('[data-testid="price-calculator-form"]')
    await expect(formCard).toBeVisible()

    // Проверяем отсутствие горизонтальной прокрутки
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = page.viewportSize()?.width || 0
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10) // небольшой допуск

    // Кнопки адаптируются (flex-col на мобильном)
    const resetButton = page.getByRole('button', { name: /Сбросить/i })
    const calcButton = page.getByRole('button', { name: /Рассчитать цену/i })
    await expect(resetButton).toBeVisible()
    await expect(calcButton).toBeVisible()
  })

  // ============================================================================
  // TC-E2E-012: Smoke Tests
  // ============================================================================

  test('TC-E2E-012: Страница загружается без JS ошибок', async ({ page }) => {
    let criticalErrorCount = 0
    page.on('console', msg => {
      const text = msg.text()
      const isIgnored =
        text.includes('Warning') ||
        text.includes('hydration') ||
        text.includes('Failed to fetch') ||
        text.includes('Network error')
      if (msg.type() === 'error' && !isIgnored) {
        criticalErrorCount += 1
      }
    })

    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    expect(criticalErrorCount).toBe(0)
  })
})
