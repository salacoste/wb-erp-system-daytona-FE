export interface BoxTypeFormErrors {
  name?: string
  lengthCm?: string
  widthCm?: string
  heightCm?: string
  api?: string
}

export function getBoxTypeFormErrors(
  name: string,
  lengthCm: string,
  widthCm: string,
  heightCm: string
): BoxTypeFormErrors {
  const errors: BoxTypeFormErrors = {}
  if (!name.trim()) errors.name = 'Название обязательно'
  if (!isPositiveNumber(lengthCm)) errors.lengthCm = 'Длина должна быть больше 0'
  if (!isPositiveNumber(widthCm)) errors.widthCm = 'Ширина должна быть больше 0'
  if (!isPositiveNumber(heightCm)) errors.heightCm = 'Высота должна быть больше 0'
  return errors
}

function isPositiveNumber(value: string): boolean {
  return value !== '' && !Number.isNaN(Number.parseFloat(value)) && Number.parseFloat(value) > 0
}
