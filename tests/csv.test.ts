import { describe, expect, it } from 'vitest'
import { csvCell, toCsv } from '../server/utils/csv'

describe('csvCell', () => {
  it('neutralises text that Excel would run as a formula', () => {
    expect(csvCell('=HYPERLINK("http://x","bấm")')).toBe(`"'=HYPERLINK(""http://x"",""bấm"")"`)
    expect(csvCell('+84988123456')).toBe("'+84988123456")
    expect(csvCell('-chè')).toBe("'-chè")
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)")
  })
  it('keeps numbers, including negative ones, as numbers', () => {
    expect(csvCell(-5000)).toBe('-5000')
    expect(csvCell(0)).toBe('0')
  })
  it('quotes commas, quotes and line breaks; empty for null', () => {
    expect(csvCell('Quận 1, TP.HCM')).toBe('"Quận 1, TP.HCM"')
    expect(csvCell('a\nb')).toBe('"a\nb"')
    expect(csvCell(null)).toBe('')
    expect(csvCell(undefined)).toBe('')
  })
  it('starts with a BOM and uses CRLF', () => {
    expect(toCsv([['a', 1], ['b', 2]])).toBe('﻿a,1\r\nb,2')
  })
})
