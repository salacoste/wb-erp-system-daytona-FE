import { describe, it, expect } from 'vitest'
import { ValidationErrorCode } from '@/types/shipment-cost'
import { VALIDATION_ERROR_MAP, BACKEND_CODE_MAP } from '../validation-error-config'

describe('validation-error-config', () => {
  describe('VALIDATION_ERROR_MAP', () => {
    it('has config for all 9 ValidationErrorCode values', () => {
      const allCodes = Object.values(ValidationErrorCode)
      expect(allCodes).toHaveLength(9)
      for (const code of allCodes) {
        expect(VALIDATION_ERROR_MAP[code]).toBeDefined()
        expect(VALIDATION_ERROR_MAP[code].message).toBeTruthy()
        expect(VALIDATION_ERROR_MAP[code].icon).toBeDefined()
        expect(['error', 'warning']).toContain(VALIDATION_ERROR_MAP[code].severity)
      }
    })

    it('MISSING_COGS has linkPattern to /products', () => {
      const config = VALIDATION_ERROR_MAP[ValidationErrorCode.MISSING_COGS]
      expect(config.linkPattern).toBeDefined()
      expect(config.linkPattern!('12345')).toBe('/products?filter=12345')
      expect(config.linkLabel).toBe('Указать себестоимость')
    })

    it('MISSING_PACKAGING has linkPattern to /shipments/sku-packaging', () => {
      const config = VALIDATION_ERROR_MAP[ValidationErrorCode.MISSING_PACKAGING]
      expect(config.linkPattern).toBeDefined()
      expect(config.linkPattern!('any')).toBe('/shipments/sku-packaging')
      expect(config.linkLabel).toBe('Настроить упаковку')
    })

    it('errors without navigation have no linkPattern', () => {
      const noLink = [
        ValidationErrorCode.EMPTY_SHIPMENT,
        ValidationErrorCode.EMPTY_PALLET,
        ValidationErrorCode.ZERO_UNITS,
        ValidationErrorCode.ZERO_VOLUME,
        ValidationErrorCode.MISSING_DELIVERY_COST,
        ValidationErrorCode.DUPLICATE_SKU_IN_PALLET,
        ValidationErrorCode.INVALID_BOX_COUNT,
      ]
      for (const code of noLink) {
        expect(VALIDATION_ERROR_MAP[code].linkPattern).toBeUndefined()
      }
    })
  })

  describe('BACKEND_CODE_MAP', () => {
    it('maps backend NO_PALLETS to frontend EMPTY_SHIPMENT', () => {
      expect(BACKEND_CODE_MAP['NO_PALLETS']).toBe(ValidationErrorCode.EMPTY_SHIPMENT)
    })

    it('maps backend INVALID_BOX_VOLUME to frontend ZERO_VOLUME', () => {
      expect(BACKEND_CODE_MAP['INVALID_BOX_VOLUME']).toBe(ValidationErrorCode.ZERO_VOLUME)
    })

    it('maps backend NEGATIVE_DELIVERY_COST to frontend MISSING_DELIVERY_COST', () => {
      expect(BACKEND_CODE_MAP['NEGATIVE_DELIVERY_COST']).toBe(
        ValidationErrorCode.MISSING_DELIVERY_COST
      )
    })

    it('maps backend ZERO_BOXES to frontend INVALID_BOX_COUNT', () => {
      expect(BACKEND_CODE_MAP['ZERO_BOXES']).toBe(ValidationErrorCode.INVALID_BOX_COUNT)
    })

    it('also supports frontend enum values directly', () => {
      expect(BACKEND_CODE_MAP['MISSING_COGS']).toBe(ValidationErrorCode.MISSING_COGS)
      expect(BACKEND_CODE_MAP['EMPTY_SHIPMENT']).toBe(ValidationErrorCode.EMPTY_SHIPMENT)
    })
  })
})
