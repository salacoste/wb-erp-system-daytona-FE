/**
 * Unit tests for dimension-utils.ts
 * Story 44.7-FE: Dimension-Based Volume Calculation
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Tests cover:
 * - Volume calculation (L × W × H / 1000)
 * - Cargo type detection (MGT/SGT/KGT)
 * - Max dimension extraction
 * - Volume tier classification
 * - Edge cases and validation
 */

import { describe, it, expect } from 'vitest'
import {
  calculateVolumeLiters,
  detectCargoType,
  getMaxDimension,
  isKgtCargo,
  getCargoTypeConfig,
  getVolumeTier,
  formatVolume,
  hasValidDimensions,
  mmToCm,
  cmToMm,
  CARGO_TYPE_CONFIG,
  type ProductDimensions,
} from '../dimension-utils'

// ============================================================================
// Test Data
// ============================================================================

const standardDimensions: ProductDimensions = {
  length_cm: 30,
  width_cm: 20,
  height_cm: 15,
}

const smallItemDimensions: ProductDimensions = {
  length_cm: 10,
  width_cm: 10,
  height_cm: 10,
}

const mediumItemDimensions: ProductDimensions = {
  length_cm: 80,
  width_cm: 60,
  height_cm: 40,
}

const largeItemDimensions: ProductDimensions = {
  length_cm: 150,
  width_cm: 50,
  height_cm: 50,
}

const zeroDimensions: ProductDimensions = {
  length_cm: 0,
  width_cm: 0,
  height_cm: 0,
}

const partialZeroDimensions: ProductDimensions = {
  length_cm: 30,
  width_cm: 0,
  height_cm: 15,
}

// ============================================================================
// calculateVolumeLiters Tests
// ============================================================================

describe('calculateVolumeLiters', () => {
  it('should calculate volume correctly for standard dimensions', () => {
    // 30 × 20 × 15 = 9000 cm³ = 9.000 L
    const result = calculateVolumeLiters(standardDimensions)
    expect(result).toBe(9)
  })

  it('should calculate volume for small items', () => {
    // 10 × 10 × 10 = 1000 cm³ = 1.000 L
    const result = calculateVolumeLiters(smallItemDimensions)
    expect(result).toBe(1)
  })

  it('should calculate volume for medium items', () => {
    // 80 × 60 × 40 = 192000 cm³ = 192.000 L
    const result = calculateVolumeLiters(mediumItemDimensions)
    expect(result).toBe(192)
  })

  it('should calculate volume for large items', () => {
    // 150 × 50 × 50 = 375000 cm³ = 375.000 L
    const result = calculateVolumeLiters(largeItemDimensions)
    expect(result).toBe(375)
  })

  it('should return 0 when all dimensions are 0', () => {
    const result = calculateVolumeLiters(zeroDimensions)
    expect(result).toBe(0)
  })

  it('should return 0 when any dimension is 0', () => {
    const result = calculateVolumeLiters(partialZeroDimensions)
    expect(result).toBe(0)
  })

  it('should return 0 for negative dimensions', () => {
    const negativeDimensions: ProductDimensions = {
      length_cm: -10,
      width_cm: 20,
      height_cm: 15,
    }
    const result = calculateVolumeLiters(negativeDimensions)
    expect(result).toBe(0)
  })

  it('should handle decimal dimensions and round to 3 decimal places', () => {
    const decimalDimensions: ProductDimensions = {
      length_cm: 15.5,
      width_cm: 12.3,
      height_cm: 8.7,
    }
    // 15.5 × 12.3 × 8.7 = 1658.985 cm³ = 1.658985 L → rounded to 1.659
    const result = calculateVolumeLiters(decimalDimensions)
    expect(result).toBeCloseTo(1.659, 3)
  })

  it('should match test scenarios from story document', () => {
    // 30×20×15 = 9.000 L (MGT)
    expect(calculateVolumeLiters({ length_cm: 30, width_cm: 20, height_cm: 15 })).toBe(9)

    // 50×50×50 = 125.000 L (SGT)
    expect(calculateVolumeLiters({ length_cm: 50, width_cm: 50, height_cm: 50 })).toBe(125)

    // 60×60×60 = 216.000 L (MGT boundary)
    expect(calculateVolumeLiters({ length_cm: 60, width_cm: 60, height_cm: 60 })).toBe(216)

    // 80×60×40 = 192.000 L (SGT)
    expect(calculateVolumeLiters({ length_cm: 80, width_cm: 60, height_cm: 40 })).toBe(192)

    // 150×50×50 = 375.000 L (KGT)
    expect(calculateVolumeLiters({ length_cm: 150, width_cm: 50, height_cm: 50 })).toBe(375)
  })
})

// ============================================================================
// detectCargoType Tests
// ============================================================================

describe('detectCargoType', () => {
  it('should return MGT for max dimension ≤ 60 cm', () => {
    expect(detectCargoType({ length_cm: 60, width_cm: 40, height_cm: 30 })).toBe('MGT')
    expect(detectCargoType({ length_cm: 30, width_cm: 60, height_cm: 20 })).toBe('MGT')
    expect(detectCargoType({ length_cm: 20, width_cm: 30, height_cm: 60 })).toBe('MGT')
    expect(detectCargoType(smallItemDimensions)).toBe('MGT')
  })

  it('should return SGT for max dimension > 60 cm and ≤ 120 cm', () => {
    expect(detectCargoType({ length_cm: 61, width_cm: 40, height_cm: 30 })).toBe('SGT')
    expect(detectCargoType({ length_cm: 120, width_cm: 60, height_cm: 40 })).toBe('SGT')
    expect(detectCargoType(mediumItemDimensions)).toBe('SGT')
  })

  it('should return KGT for max dimension > 120 cm', () => {
    expect(detectCargoType({ length_cm: 121, width_cm: 60, height_cm: 40 })).toBe('KGT')
    expect(detectCargoType(largeItemDimensions)).toBe('KGT')
  })

  it('should detect based on largest dimension regardless of position', () => {
    // Length is max
    expect(detectCargoType({ length_cm: 150, width_cm: 50, height_cm: 50 })).toBe('KGT')
    // Width is max
    expect(detectCargoType({ length_cm: 50, width_cm: 150, height_cm: 50 })).toBe('KGT')
    // Height is max
    expect(detectCargoType({ length_cm: 50, width_cm: 50, height_cm: 150 })).toBe('KGT')
  })

  it('should handle boundary cases exactly', () => {
    // Exactly at MGT boundary (60 cm)
    expect(detectCargoType({ length_cm: 60, width_cm: 60, height_cm: 60 })).toBe('MGT')

    // Just over MGT boundary (60.1 cm)
    expect(detectCargoType({ length_cm: 60.1, width_cm: 50, height_cm: 40 })).toBe('SGT')

    // Exactly at SGT boundary (120 cm)
    expect(detectCargoType({ length_cm: 120, width_cm: 80, height_cm: 60 })).toBe('SGT')

    // Just over SGT boundary (120.1 cm)
    expect(detectCargoType({ length_cm: 120.1, width_cm: 80, height_cm: 60 })).toBe('KGT')
  })
})

// ============================================================================
// getMaxDimension Tests
// ============================================================================

describe('getMaxDimension', () => {
  it('should return length when it is the largest', () => {
    expect(getMaxDimension({ length_cm: 100, width_cm: 50, height_cm: 30 })).toBe(100)
  })

  it('should return width when it is the largest', () => {
    expect(getMaxDimension({ length_cm: 50, width_cm: 100, height_cm: 30 })).toBe(100)
  })

  it('should return height when it is the largest', () => {
    expect(getMaxDimension({ length_cm: 50, width_cm: 30, height_cm: 100 })).toBe(100)
  })

  it('should return any dimension when all are equal', () => {
    expect(getMaxDimension({ length_cm: 50, width_cm: 50, height_cm: 50 })).toBe(50)
  })

  it('should return 0 for zero dimensions', () => {
    expect(getMaxDimension(zeroDimensions)).toBe(0)
  })
})

// ============================================================================
// isKgtCargo Tests
// ============================================================================

describe('isKgtCargo', () => {
  it('should return true for KGT cargo (max > 120 cm)', () => {
    expect(isKgtCargo(largeItemDimensions)).toBe(true)
    expect(isKgtCargo({ length_cm: 150, width_cm: 50, height_cm: 50 })).toBe(true)
  })

  it('should return false for MGT cargo', () => {
    expect(isKgtCargo(smallItemDimensions)).toBe(false)
    expect(isKgtCargo(standardDimensions)).toBe(false)
  })

  it('should return false for SGT cargo', () => {
    expect(isKgtCargo(mediumItemDimensions)).toBe(false)
  })
})

// ============================================================================
// getCargoTypeConfig Tests
// ============================================================================

describe('getCargoTypeConfig', () => {
  it('should return correct config for MGT', () => {
    const config = getCargoTypeConfig('MGT')
    expect(config.code).toBe('MGT')
    expect(config.label).toBe('МГТ')
    expect(config.labelFull).toBe('Малогабаритный товар (до 60 см)')
    expect(config.maxDimension).toBe(60)
    expect(config.color).toBe('green')
    expect(config.isError).toBe(false)
  })

  it('should return correct config for SGT', () => {
    const config = getCargoTypeConfig('SGT')
    expect(config.code).toBe('SGT')
    expect(config.label).toBe('СГТ')
    expect(config.labelFull).toBe('Среднегабаритный товар (до 120 см)')
    expect(config.maxDimension).toBe(120)
    expect(config.color).toBe('yellow')
    expect(config.isError).toBe(false)
  })

  it('should return correct config for KGT', () => {
    const config = getCargoTypeConfig('KGT')
    expect(config.code).toBe('KGT')
    expect(config.label).toBe('КГТ')
    expect(config.labelFull).toBe('Крупногабаритный товар (более 120 см)')
    expect(config.maxDimension).toBe(Infinity)
    expect(config.color).toBe('red')
    expect(config.isError).toBe(true)
  })

  it('should have correct Tailwind classes for styling', () => {
    const mgtConfig = getCargoTypeConfig('MGT')
    expect(mgtConfig.bgColor).toBe('bg-green-100')
    expect(mgtConfig.textColor).toBe('text-green-700')

    const sgtConfig = getCargoTypeConfig('SGT')
    expect(sgtConfig.bgColor).toBe('bg-yellow-100')
    expect(sgtConfig.textColor).toBe('text-yellow-700')

    const kgtConfig = getCargoTypeConfig('KGT')
    expect(kgtConfig.bgColor).toBe('bg-red-100')
    expect(kgtConfig.textColor).toBe('text-red-700')
  })
})

// ============================================================================
// CARGO_TYPE_CONFIG Tests
// ============================================================================

describe('CARGO_TYPE_CONFIG', () => {
  it('should have all three cargo types defined', () => {
    expect(CARGO_TYPE_CONFIG).toHaveProperty('MGT')
    expect(CARGO_TYPE_CONFIG).toHaveProperty('SGT')
    expect(CARGO_TYPE_CONFIG).toHaveProperty('KGT')
  })

  it('should match WB cargo type reference from documentation', () => {
    // From story document table: WB Cargo Type Reference (Official)
    expect(CARGO_TYPE_CONFIG.MGT.maxDimension).toBe(60)
    expect(CARGO_TYPE_CONFIG.SGT.maxDimension).toBe(120)
    expect(CARGO_TYPE_CONFIG.KGT.maxDimension).toBe(Infinity)
  })
})

// ============================================================================
// getVolumeTier Tests
// ============================================================================

describe('getVolumeTier', () => {
  it('should return small tier for volume ≤ 1L', () => {
    const tier = getVolumeTier(0.5)
    expect(tier.tier).toBe('small')
    expect(tier.label).toBe('Малый объём')
    expect(tier.color).toBe('green')

    expect(getVolumeTier(1).tier).toBe('small')
    expect(getVolumeTier(0).tier).toBe('small')
  })

  it('should return standard tier for volume > 1L and ≤ 30L', () => {
    const tier = getVolumeTier(15)
    expect(tier.tier).toBe('standard')
    expect(tier.label).toBe('Стандартный объём')
    expect(tier.color).toBe('yellow')

    expect(getVolumeTier(1.1).tier).toBe('standard')
    expect(getVolumeTier(30).tier).toBe('standard')
  })

  it('should return large tier for volume > 30L', () => {
    const tier = getVolumeTier(50)
    expect(tier.tier).toBe('large')
    expect(tier.label).toBe('Большой объём')
    expect(tier.color).toBe('orange')

    expect(getVolumeTier(30.1).tier).toBe('large')
    expect(getVolumeTier(375).tier).toBe('large')
  })
})

// ============================================================================
// formatVolume Tests
// ============================================================================

describe('formatVolume', () => {
  it('should format volume with Russian locale (comma decimal)', () => {
    expect(formatVolume(9)).toBe('9,000 л')
    expect(formatVolume(9.123)).toBe('9,123 л')
    expect(formatVolume(125)).toBe('125,000 л')
  })

  it('should show 3 decimal places', () => {
    expect(formatVolume(0)).toBe('0,000 л')
    expect(formatVolume(0.001)).toBe('0,001 л')
    expect(formatVolume(1.5)).toBe('1,500 л')
  })

  it('should handle large volumes', () => {
    expect(formatVolume(375)).toBe('375,000 л')
    expect(formatVolume(1000)).toBe('1000,000 л')
  })
})

// ============================================================================
// hasValidDimensions Tests
// ============================================================================

describe('hasValidDimensions', () => {
  it('should return true when all dimensions are positive', () => {
    expect(hasValidDimensions(standardDimensions)).toBe(true)
    expect(hasValidDimensions(smallItemDimensions)).toBe(true)
    expect(hasValidDimensions(largeItemDimensions)).toBe(true)
  })

  it('should return false when all dimensions are 0', () => {
    expect(hasValidDimensions(zeroDimensions)).toBe(false)
  })

  it('should return false when any dimension is 0', () => {
    expect(hasValidDimensions(partialZeroDimensions)).toBe(false)
    expect(hasValidDimensions({ length_cm: 0, width_cm: 20, height_cm: 15 })).toBe(false)
    expect(hasValidDimensions({ length_cm: 30, width_cm: 20, height_cm: 0 })).toBe(false)
  })

  it('should return false for negative dimensions', () => {
    expect(hasValidDimensions({ length_cm: -10, width_cm: 20, height_cm: 15 })).toBe(false)
  })
})

// ============================================================================
// mmToCm Tests (Unit Conversion)
// ============================================================================

describe('mmToCm', () => {
  it('should convert millimeters to centimeters', () => {
    expect(mmToCm(100)).toBe(10)
    expect(mmToCm(400)).toBe(40)
    expect(mmToCm(255)).toBe(25.5)
  })

  it('should handle zero', () => {
    expect(mmToCm(0)).toBe(0)
  })

  it('should handle decimal values', () => {
    expect(mmToCm(123)).toBe(12.3)
    expect(mmToCm(5)).toBe(0.5)
  })
})

// ============================================================================
// cmToMm Tests (Unit Conversion)
// ============================================================================

describe('cmToMm', () => {
  it('should convert centimeters to millimeters', () => {
    expect(cmToMm(10)).toBe(100)
    expect(cmToMm(40)).toBe(400)
    expect(cmToMm(25.5)).toBe(255)
  })

  it('should handle zero', () => {
    expect(cmToMm(0)).toBe(0)
  })

  it('should handle decimal values', () => {
    expect(cmToMm(12.3)).toBe(123)
    expect(cmToMm(0.5)).toBe(5)
  })

  it('should be inverse of mmToCm', () => {
    const testValues = [10, 25.5, 100, 0, 12.3]
    testValues.forEach((cm) => {
      expect(mmToCm(cmToMm(cm))).toBe(cm)
    })
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('Dimension Utils Integration', () => {
  it('should work together for complete workflow', () => {
    const dimensions: ProductDimensions = { length_cm: 30, width_cm: 20, height_cm: 15 }

    // Validate dimensions
    expect(hasValidDimensions(dimensions)).toBe(true)

    // Calculate volume
    const volume = calculateVolumeLiters(dimensions)
    expect(volume).toBe(9)

    // Get volume tier
    const tier = getVolumeTier(volume)
    expect(tier.tier).toBe('standard')

    // Format for display
    const formatted = formatVolume(volume)
    expect(formatted).toBe('9,000 л')

    // Detect cargo type
    const cargoType = detectCargoType(dimensions)
    expect(cargoType).toBe('MGT')

    // Get cargo config
    const config = getCargoTypeConfig(cargoType)
    expect(config.isError).toBe(false)

    // Check if KGT
    expect(isKgtCargo(dimensions)).toBe(false)
  })

  it('should handle KGT error scenario correctly', () => {
    const kgtDimensions: ProductDimensions = { length_cm: 150, width_cm: 50, height_cm: 50 }

    // Validate dimensions
    expect(hasValidDimensions(kgtDimensions)).toBe(true)

    // Detect cargo type
    const cargoType = detectCargoType(kgtDimensions)
    expect(cargoType).toBe('KGT')

    // Check if KGT (should show error)
    expect(isKgtCargo(kgtDimensions)).toBe(true)

    // Get cargo config (should have error flag)
    const config = getCargoTypeConfig(cargoType)
    expect(config.isError).toBe(true)
    expect(config.color).toBe('red')

    // Get max dimension for error message
    const maxDim = getMaxDimension(kgtDimensions)
    expect(maxDim).toBe(150)
  })

  it('should handle auto-fill conversion from mm to cm', () => {
    // Simulating backend returning dimensions in mm
    const backendDimensionsMm = {
      length_mm: 300, // 30 cm
      width_mm: 200, // 20 cm
      height_mm: 150, // 15 cm
    }

    // Convert to cm for form
    const dimensionsCm: ProductDimensions = {
      length_cm: mmToCm(backendDimensionsMm.length_mm),
      width_cm: mmToCm(backendDimensionsMm.width_mm),
      height_cm: mmToCm(backendDimensionsMm.height_mm),
    }

    expect(dimensionsCm).toEqual(standardDimensions)
    expect(calculateVolumeLiters(dimensionsCm)).toBe(9)
    expect(detectCargoType(dimensionsCm)).toBe('MGT')
  })
})
