import { describe, it, expect, beforeEach } from 'vitest'
import { getMeta, setMeta } from './meta.js'
import { _resetDB } from './db.js'

beforeEach(async () => { await _resetDB() })

describe('meta CRUD', () => {
  it('getMeta возвращает fallback если ключ отсутствует', async () => {
    const val = await getMeta('workHours', { start: '08:00', end: '22:00' })
    expect(val).toEqual({ start: '08:00', end: '22:00' })
  })

  it('setMeta сохраняет, getMeta возвращает значение', async () => {
    await setMeta('workHours', { start: '09:00', end: '20:00' })
    const val = await getMeta('workHours', null)
    expect(val).toEqual({ start: '09:00', end: '20:00' })
  })

  it('setMeta перезаписывает существующее значение', async () => {
    await setMeta('theme', 'pink')
    await setMeta('theme', 'dark')
    expect(await getMeta('theme', null)).toBe('dark')
  })

  it('разные ключи не конфликтуют', async () => {
    await setMeta('a', 1)
    await setMeta('b', 2)
    expect(await getMeta('a', null)).toBe(1)
    expect(await getMeta('b', null)).toBe(2)
  })
})
