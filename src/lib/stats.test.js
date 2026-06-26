import { describe, it, expect } from 'vitest'
import { todayRange, weekRange, monthRange, sumIncome, countInRange, topService } from './stats.js'

// --- Вспомогалки для тестов ---
function appt(datetime, price, status, serviceName = 'Макияж') {
  return { datetime, price, status, serviceName }
}

describe('todayRange / weekRange / monthRange', () => {
  it('todayRange: from < to, обе строки UTC-ISO (на Z)', () => {
    const { from, to } = todayRange()
    expect(from.endsWith('Z')).toBe(true)
    expect(to.endsWith('Z')).toBe(true)
    expect(new Date(from) < new Date(to)).toBe(true)
  })

  it('weekRange: from < to, обе строки UTC-ISO (на Z)', () => {
    const { from, to } = weekRange()
    expect(from.endsWith('Z')).toBe(true)
    expect(to.endsWith('Z')).toBe(true)
    expect(new Date(from) < new Date(to)).toBe(true)
  })

  it('monthRange: from < to, обе строки UTC-ISO (на Z)', () => {
    const { from, to } = monthRange()
    expect(from.endsWith('Z')).toBe(true)
    expect(to.endsWith('Z')).toBe(true)
    expect(new Date(from) < new Date(to)).toBe(true)
  })

  it('todayRange покрывает текущий момент: from <= now < to', () => {
    const { from, to } = todayRange()
    const now = Date.now()
    expect(new Date(from).getTime()).toBeLessThanOrEqual(now)
    expect(now).toBeLessThan(new Date(to).getTime())
  })

  it('weekRange покрывает текущий момент: from <= now < to', () => {
    const { from, to } = weekRange()
    const now = Date.now()
    expect(new Date(from).getTime()).toBeLessThanOrEqual(now)
    expect(now).toBeLessThan(new Date(to).getTime())
  })

  it('monthRange покрывает текущий момент: from <= now < to', () => {
    const { from, to } = monthRange()
    const now = Date.now()
    expect(new Date(from).getTime()).toBeLessThanOrEqual(now)
    expect(now).toBeLessThan(new Date(to).getTime())
  })

  it('weekRange.from — локальный понедельник (getDay()===1)', () => {
    const { from } = weekRange()
    // from — UTC-ISO момента локального пн 00:00 → локальный день этого момента = пн
    expect(new Date(from).getDay()).toBe(1)
  })
})

describe('sumIncome', () => {
  // range и datetime записей в UTC-ISO ('...Z') — как хранится в реальной БД
  const range = { from: '2026-06-01T00:00:00.000Z', to: '2026-07-01T00:00:00.000Z' }

  it('суммирует только записи со статусом came в диапазоне', () => {
    const appts = [
      appt('2026-06-10T10:00:00.000Z', 1000, 'came'),
      appt('2026-06-15T10:00:00.000Z', 500,  'came'),
      appt('2026-06-20T10:00:00.000Z', 800,  'planned'),  // статус не тот — не считаем
    ]
    expect(sumIncome(appts, range)).toBe(1500)
  })

  it('from включительно, to эксклюзивно; вне диапазона не считается', () => {
    const appts = [
      appt('2026-05-31T23:59:59.000Z', 1000, 'came'),  // до from
      appt('2026-06-01T00:00:00.000Z', 50,   'came'),  // = from, включается
      appt('2026-07-01T00:00:00.000Z', 500,  'came'),  // = to, эксклюзивно — не считаем
      appt('2026-06-10T10:00:00.000Z', 200,  'came'),  // в диапазоне
    ]
    expect(sumIncome(appts, range)).toBe(250)
  })

  it('поддерживает кастомный список статусов', () => {
    const appts = [
      appt('2026-06-10T10:00:00.000Z', 300, 'came'),
      appt('2026-06-10T11:00:00.000Z', 700, 'confirmed'),
      appt('2026-06-10T12:00:00.000Z', 100, 'planned'),
    ]
    expect(sumIncome(appts, range, ['came', 'confirmed'])).toBe(1000)
  })

  it('пустой массив → 0', () => {
    expect(sumIncome([], range)).toBe(0)
  })

  it('нет записей подходящего статуса → 0', () => {
    const appts = [
      appt('2026-06-10T10:00:00.000Z', 1000, 'planned'),
      appt('2026-06-10T11:00:00.000Z', 500,  'cancelled'),
    ]
    expect(sumIncome(appts, range)).toBe(0)
  })
})

describe('countInRange', () => {
  const range = { from: '2026-06-01T00:00:00.000Z', to: '2026-07-01T00:00:00.000Z' }

  it('считает записи в диапазоне любого статуса', () => {
    const appts = [
      appt('2026-06-05T10:00:00.000Z', 100, 'came'),
      appt('2026-06-10T10:00:00.000Z', 200, 'planned'),
      appt('2026-07-10T10:00:00.000Z', 300, 'came'),  // вне диапазона
    ]
    expect(countInRange(appts, range)).toBe(2)
  })

  it('from включительно, to эксклюзивно', () => {
    const appts = [
      appt('2026-06-01T00:00:00.000Z', 100, 'planned'),  // = from, включается
      appt('2026-06-30T23:59:59.000Z', 100, 'planned'),  // включается
      appt('2026-07-01T00:00:00.000Z', 200, 'planned'),  // = to, не включается
    ]
    expect(countInRange(appts, range)).toBe(2)
  })

  it('пустой массив → 0', () => {
    expect(countInRange([], range)).toBe(0)
  })
})

describe('topService', () => {
  it('возвращает самую частую услугу', () => {
    const appts = [
      appt('2026-06-01T10:00:00', 0, 'came', 'Макияж'),
      appt('2026-06-02T10:00:00', 0, 'came', 'Макияж'),
      appt('2026-06-03T10:00:00', 0, 'came', 'Чистка'),
    ]
    expect(topService(appts)).toEqual({ name: 'Макияж', count: 2 })
  })

  it('при равном количестве возвращает один из лидеров', () => {
    const appts = [
      appt('2026-06-01T10:00:00', 0, 'came', 'A'),
      appt('2026-06-02T10:00:00', 0, 'came', 'B'),
    ]
    const result = topService(appts)
    expect(['A', 'B']).toContain(result.name)
    expect(result.count).toBe(1)
  })

  it('пустой массив → null', () => {
    expect(topService([])).toBeNull()
  })
})
