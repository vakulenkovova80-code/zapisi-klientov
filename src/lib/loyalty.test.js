import { describe, it, expect } from 'vitest'
import { loyaltyInfo } from './loyalty.js'

describe('loyaltyInfo', () => {
  it('0 визитов: не постоянная, нет скидки, visitsToDiscount=5 (по умолчанию every=5)', () => {
    const r = loyaltyInfo(0)
    expect(r.count).toBe(0)
    expect(r.isRegular).toBe(false)
    expect(r.discountNow).toBe(false)
    expect(r.visitsToDiscount).toBe(5)
  })

  it('visitCount=every → discountNow=true, visitsToDiscount=0, isRegular=true', () => {
    const r = loyaltyInfo(5)
    expect(r.count).toBe(5)
    expect(r.isRegular).toBe(true)
    expect(r.discountNow).toBe(true)
    expect(r.visitsToDiscount).toBe(0)
  })

  it('visitCount=10 (кратно 5) → discountNow=true, visitsToDiscount=0', () => {
    const r = loyaltyInfo(10)
    expect(r.discountNow).toBe(true)
    expect(r.visitsToDiscount).toBe(0)
    expect(r.isRegular).toBe(true)
  })

  it('промежуточное значение: 3 визита из 5 → visitsToDiscount=2, discountNow=false', () => {
    const r = loyaltyInfo(3)
    expect(r.count).toBe(3)
    expect(r.isRegular).toBe(false)
    expect(r.discountNow).toBe(false)
    expect(r.visitsToDiscount).toBe(2)
  })

  it('промежуточное значение: 7 из 10 (every=10) → visitsToDiscount=3, discountNow=false', () => {
    const r = loyaltyInfo(7, 10)
    expect(r.count).toBe(7)
    expect(r.isRegular).toBe(false)
    expect(r.discountNow).toBe(false)
    expect(r.visitsToDiscount).toBe(3)
  })

  it('every=3: visitCount=3 → discountNow=true', () => {
    const r = loyaltyInfo(3, 3)
    expect(r.discountNow).toBe(true)
    expect(r.visitsToDiscount).toBe(0)
  })

  it('every=3: visitCount=4 → visitsToDiscount=2, isRegular=true', () => {
    const r = loyaltyInfo(4, 3)
    expect(r.isRegular).toBe(true)
    expect(r.discountNow).toBe(false)
    expect(r.visitsToDiscount).toBe(2)
  })

  it('isRegular начинается с every визитов', () => {
    expect(loyaltyInfo(4).isRegular).toBe(false)
    expect(loyaltyInfo(5).isRegular).toBe(true)
    expect(loyaltyInfo(6).isRegular).toBe(true)
  })
})
