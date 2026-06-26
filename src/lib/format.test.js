import { describe, it, expect } from 'vitest'
import { formatPrice, formatTime, formatDate, formatDayTitle, toDayKey } from './format.js'

describe('format', () => {
  it('форматирует цену в рублях', () => {
    expect(formatPrice(1500)).toBe('1 500 ₽')
    expect(formatPrice(0)).toBe('0 ₽')
  })
  it('форматирует время ЧЧ:ММ', () => {
    expect(formatTime('2026-06-26T14:30:00')).toBe('14:30')
  })
  it('форматирует дату как «26 июня»', () => {
    expect(formatDate('2026-06-26T14:30:00')).toBe('26 июня')
  })
  it('заголовок дня содержит число и месяц', () => {
    expect(formatDayTitle('2026-06-26T14:30:00')).toContain('26')
    expect(formatDayTitle('2026-06-26T14:30:00')).toContain('июня')
  })
  it('toDayKey возвращает локальную дату YYYY-MM-DD', () => {
    expect(toDayKey('2026-06-26T14:30:00')).toBe('2026-06-26')
    expect(toDayKey(new Date(2026, 0, 1))).toBe('2026-01-01')
  })
})
