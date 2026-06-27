import { describe, it, expect } from 'vitest'
import { LOCATIONS, locationLabel, locationIcon } from './locations.js'

describe('locations', () => {
  it('LOCATIONS содержит salon и home', () => {
    const keys = LOCATIONS.map(l => l.key)
    expect(keys).toContain('salon')
    expect(keys).toContain('home')
  })

  it('locationLabel маппинг: salon → В салоне, home → На дому', () => {
    expect(locationLabel('salon')).toBe('В салоне')
    expect(locationLabel('home')).toBe('На дому')
  })

  it('locationIcon маппинг: salon → 💇, home → 🏠', () => {
    expect(locationIcon('salon')).toBe('💇')
    expect(locationIcon('home')).toBe('🏠')
  })

  it('неизвестный ключ → дефолт salon', () => {
    expect(locationLabel('unknown')).toBe('В салоне')
    expect(locationIcon('unknown')).toBe('💇')
  })
})
