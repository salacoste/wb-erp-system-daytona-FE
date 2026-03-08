import { parseNmIds } from '../FunnelPageContent'

describe('parseNmIds', () => {
  it('returns empty array for null', () => {
    expect(parseNmIds(null)).toEqual([])
  })

  it('returns empty array for empty string', () => {
    expect(parseNmIds('')).toEqual([])
  })

  it('parses comma-separated numbers', () => {
    expect(parseNmIds('123,456,789')).toEqual([123, 456, 789])
  })

  it('parses single number', () => {
    expect(parseNmIds('42')).toEqual([42])
  })

  it('filters out NaN values', () => {
    expect(parseNmIds('123,abc,456')).toEqual([123, 456])
  })

  it('filters out zero', () => {
    expect(parseNmIds('0,123')).toEqual([123])
  })

  it('filters out negative numbers', () => {
    expect(parseNmIds('-1,123,-5,456')).toEqual([123, 456])
  })

  it('handles trailing comma', () => {
    expect(parseNmIds('123,456,')).toEqual([123, 456])
  })

  it('handles leading comma', () => {
    expect(parseNmIds(',123,456')).toEqual([123, 456])
  })

  it('handles whitespace in values', () => {
    expect(parseNmIds(' 123 , 456 ')).toEqual([123, 456])
  })

  it('preserves duplicate values', () => {
    expect(parseNmIds('123,123,456')).toEqual([123, 123, 456])
  })

  it('handles large nmIds', () => {
    expect(parseNmIds('123456789,987654321')).toEqual([123456789, 987654321])
  })
})
