import { describe, it, expect } from 'vitest'
import { drawDiscountCard, shareOrDownloadCard } from './discountCard.js'

describe('discountCard exports', () => {
  it('drawDiscountCard is a function', () => {
    expect(typeof drawDiscountCard).toBe('function')
  })

  it('shareOrDownloadCard is a function', () => {
    expect(typeof shareOrDownloadCard).toBe('function')
  })
})
