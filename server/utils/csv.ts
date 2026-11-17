// CSV for Excel. Pure, unit-tested.
//
// Text cells starting with = + - @ (or a tab / carriage return) get an apostrophe in front:
// customers type their own names and notes, and Excel would otherwise run "=HYPERLINK(...)"
// as a formula when staff open the file. Numbers are left alone so negative amounts stay numbers.
export function csvCell(value: unknown): string {
  if (value == null) return ''
  let s = String(value)
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// BOM so Excel opens the Vietnamese text as UTF-8
export function toCsv(lines: unknown[][]): string {
  return '﻿' + lines.map((l) => l.map(csvCell).join(',')).join('\r\n')
}
