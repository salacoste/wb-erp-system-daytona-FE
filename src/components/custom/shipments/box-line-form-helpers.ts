/**
 * BoxLine form validation and submission helpers
 * Extracted from BoxLineForm.tsx for file size compliance
 */

export interface BoxLineFormValues {
  nmId: number | null
  boxCount: string
  totalUnits: string
}

export interface BoxLineFormErrors {
  nmId?: string
  boxCount?: string
  totalUnits?: string
  form?: string
}

/**
 * Validate box line form fields
 * @param values - Current form values
 * @param isEdit - Whether editing an existing line (nmId not required)
 */
export function validateBoxLineForm(values: BoxLineFormValues, isEdit: boolean): BoxLineFormErrors {
  const errs: BoxLineFormErrors = {}
  if (!isEdit && !values.nmId) errs.nmId = 'Выберите товар'
  const count = Number(values.boxCount)
  if (!values.boxCount || isNaN(count) || count <= 0 || !Number.isInteger(count)) {
    errs.boxCount = 'Укажите целое число > 0'
  }
  if (values.totalUnits) {
    const units = Number(values.totalUnits)
    if (isNaN(units) || units <= 0 || !Number.isInteger(units)) {
      errs.totalUnits = 'Укажите целое число > 0'
    }
  }
  return errs
}

/**
 * Build mutation payload from form values
 */
export function buildBoxLinePayload(values: BoxLineFormValues) {
  return {
    nmId: values.nmId!,
    boxCount: Number(values.boxCount),
    ...(values.totalUnits ? { totalUnits: Number(values.totalUnits) } : {}),
  }
}
