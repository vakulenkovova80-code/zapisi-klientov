import { describe, it, expect } from 'vitest'
import { STATUSES, statusLabel, statusColor } from './statuses.js'

describe('statuses', () => {
  it('STATUSES содержит 5 элементов с нужными ключами', () => {
    expect(STATUSES).toHaveLength(5)
    const keys = STATUSES.map(s => s.key)
    expect(keys).toContain('planned')
    expect(keys).toContain('confirmed')
    expect(keys).toContain('came')
    expect(keys).toContain('cancelled')
    expect(keys).toContain('no_show')
  })

  it('каждый элемент STATUSES имеет key, label, color', () => {
    for (const s of STATUSES) {
      expect(typeof s.key).toBe('string')
      expect(typeof s.label).toBe('string')
      expect(typeof s.color).toBe('string')
      expect(s.color).toMatch(/^#/)
    }
  })

  it('statusLabel возвращает корректный label', () => {
    expect(statusLabel('planned')).toBe('Запланирована')
    expect(statusLabel('confirmed')).toBe('Подтверждена')
    expect(statusLabel('came')).toBe('Пришла')
    expect(statusLabel('cancelled')).toBe('Отменена')
    expect(statusLabel('no_show')).toBe('Не пришла')
  })

  it('statusColor возвращает корректный цвет', () => {
    expect(statusColor('planned')).toBe('#8a8a8a')
    expect(statusColor('confirmed')).toBe('#3b82f6')
    expect(statusColor('came')).toBe('#22a565')
    expect(statusColor('cancelled')).toBe('#c0392b')
    expect(statusColor('no_show')).toBe('#d98a00')
  })

  it('statusLabel с неизвестным ключом возвращает сам ключ', () => {
    expect(statusLabel('unknown_key')).toBe('unknown_key')
    expect(statusLabel('')).toBe('')
  })

  it('statusColor с неизвестным ключом возвращает серый дефолт', () => {
    expect(statusColor('unknown_key')).toBe('#8a8a8a')
    expect(statusColor('')).toBe('#8a8a8a')
  })
})
