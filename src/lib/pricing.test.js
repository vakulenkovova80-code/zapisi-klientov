import { describe, it, expect } from 'vitest'
import { isWeekend, weekendPrice, priceForDate } from './pricing.js'

describe('pricing', () => {
  describe('isWeekend', () => {
    it('суббота — выходной', () => {
      // 2026-06-27 — суббота
      expect(isWeekend('2026-06-27T12:00')).toBe(true)
    })
    it('воскресенье — выходной', () => {
      // 2026-06-28 — воскресенье
      expect(isWeekend('2026-06-28T12:00')).toBe(true)
    })
    it('понедельник — будний', () => {
      // 2026-06-29 — понедельник
      expect(isWeekend('2026-06-29T12:00')).toBe(false)
    })
    it('пятница — будний', () => {
      // 2026-06-26 — пятница
      expect(isWeekend('2026-06-26T12:00')).toBe(false)
    })
    it('вторник — будний', () => {
      expect(isWeekend('2026-06-30T12:00')).toBe(false)
    })
  })

  describe('weekendPrice', () => {
    it('1000 + 20% → 1200', () => {
      expect(weekendPrice(1000, 20)).toBe(1200)
    })
    it('100 + 15% → 115', () => {
      expect(weekendPrice(100, 15)).toBe(115)
    })
    it('округляет дробные', () => {
      // 100 * 1.33 = 133
      expect(weekendPrice(100, 33)).toBe(133)
    })
    it('surcharge 0 → база', () => {
      expect(weekendPrice(500, 0)).toBe(500)
    })
    it('строковые значения — корректно', () => {
      expect(weekendPrice('200', '10')).toBe(220)
    })
  })

  describe('priceForDate', () => {
    it('будний → базовая цена', () => {
      expect(priceForDate(1000, 20, '2026-06-29T12:00')).toBe(1000)
    })
    it('выходной (суббота) → с наценкой', () => {
      expect(priceForDate(1000, 20, '2026-06-27T12:00')).toBe(1200)
    })
    it('выходной (воскресенье) → с наценкой', () => {
      expect(priceForDate(500, 10, '2026-06-28T12:00')).toBe(550)
    })
    it('surcharge 0 в выходной → база', () => {
      expect(priceForDate(500, 0, '2026-06-28T12:00')).toBe(500)
    })
    it('surcharge null в выходной → база', () => {
      expect(priceForDate(300, null, '2026-06-27T12:00')).toBe(300)
    })
  })
})
