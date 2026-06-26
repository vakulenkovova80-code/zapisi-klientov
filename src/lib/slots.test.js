import { describe, it, expect } from 'vitest'
import { computeFreeSlots } from './slots.js'

describe('computeFreeSlots', () => {
  it('пустой день → весь интервал свободен, busy пустой', () => {
    const result = computeFreeSlots([], '08:00', '22:00')
    expect(result.busy).toEqual([])
    expect(result.free).toEqual([{ start: '08:00', end: '22:00' }])
  })

  it('одна запись 10:00–11:00 делит день на две свободных части', () => {
    const appt = { datetime: '2026-06-26T10:00:00', durationMinutes: 60 }
    const result = computeFreeSlots([appt], '08:00', '22:00')
    expect(result.busy).toEqual([{ start: '10:00', end: '11:00' }])
    expect(result.free).toEqual([
      { start: '08:00', end: '10:00' },
      { start: '11:00', end: '22:00' }
    ])
  })

  it('две пересекающиеся записи мёржатся в один busy-интервал', () => {
    const appts = [
      { datetime: '2026-06-26T09:00:00', durationMinutes: 90 },  // 09:00–10:30
      { datetime: '2026-06-26T10:00:00', durationMinutes: 60 }   // 10:00–11:00 → мёрж → 09:00–11:00
    ]
    const result = computeFreeSlots(appts, '08:00', '22:00')
    expect(result.busy).toEqual([{ start: '09:00', end: '11:00' }])
    expect(result.free).toEqual([
      { start: '08:00', end: '09:00' },
      { start: '11:00', end: '22:00' }
    ])
  })

  it('запись без durationMinutes использует 60 минут по умолчанию', () => {
    const appt = { datetime: '2026-06-26T14:00:00' }  // нет durationMinutes
    const result = computeFreeSlots([appt], '08:00', '22:00')
    expect(result.busy).toEqual([{ start: '14:00', end: '15:00' }])
  })

  it('запись, выходящая за конец окна, обрезается по окну', () => {
    const appt = { datetime: '2026-06-26T21:30:00', durationMinutes: 60 }  // 21:30–22:30 → обрезать до 22:00
    const result = computeFreeSlots([appt], '08:00', '22:00')
    expect(result.busy).toEqual([{ start: '21:30', end: '22:00' }])
    expect(result.free).toEqual([{ start: '08:00', end: '21:30' }])
  })

  it('запись вплотную к началу окна (08:00–09:00) → free начинается с 09:00', () => {
    const appt = { datetime: '2026-06-26T08:00:00', durationMinutes: 60 }
    const result = computeFreeSlots([appt], '08:00', '22:00')
    expect(result.busy).toEqual([{ start: '08:00', end: '09:00' }])
    expect(result.free).toEqual([{ start: '09:00', end: '22:00' }])
  })

  it('запись полностью вне рабочего окна (до начала) игнорируется', () => {
    const appt = { datetime: '2026-06-26T06:00:00', durationMinutes: 60 }  // 06:00–07:00, окно с 08:00
    const result = computeFreeSlots([appt], '08:00', '22:00')
    expect(result.busy).toEqual([])
    expect(result.free).toEqual([{ start: '08:00', end: '22:00' }])
  })

  it('смежные записи (без паузы между ними) мёржатся', () => {
    const appts = [
      { datetime: '2026-06-26T10:00:00', durationMinutes: 60 },  // 10:00–11:00
      { datetime: '2026-06-26T11:00:00', durationMinutes: 60 }   // 11:00–12:00
    ]
    const result = computeFreeSlots(appts, '08:00', '22:00')
    expect(result.busy).toEqual([{ start: '10:00', end: '12:00' }])
  })

  it('день полностью занят → free=[]', () => {
    const appts = [{ datetime: '2026-06-26T08:00:00', durationMinutes: 840 }] // 08:00–22:00
    const r = computeFreeSlots(appts, '08:00', '22:00')
    expect(r.free).toEqual([])
    expect(r.busy).toEqual([{ start: '08:00', end: '22:00' }])
  })

  it('записи в обратном порядке обрабатываются корректно', () => {
    const appts = [
      { datetime: '2026-06-26T11:00:00', durationMinutes: 60 }, // 11:00–12:00
      { datetime: '2026-06-26T09:00:00', durationMinutes: 90 }  // 09:00–10:30
    ]
    const r = computeFreeSlots(appts, '08:00', '22:00')
    expect(r.busy).toEqual([
      { start: '09:00', end: '10:30' },
      { start: '11:00', end: '12:00' }
    ])
  })

  it('запись до начала окна обрезается', () => {
    const appts = [{ datetime: '2026-06-26T07:00:00', durationMinutes: 120 }] // 07:00–09:00
    const r = computeFreeSlots(appts, '08:00', '22:00')
    expect(r.busy).toEqual([{ start: '08:00', end: '09:00' }])
    expect(r.free[0]).toEqual({ start: '09:00', end: '22:00' })
  })
})
