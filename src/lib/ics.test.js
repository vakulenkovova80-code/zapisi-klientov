import { describe, it, expect } from 'vitest'
import { buildICS } from './ics.js'

describe('ics', () => {
  it('создаёт валидный VEVENT с заголовком и напоминанием', () => {
    const ics = buildICS({
      title: 'Аня — Макияж',
      startISO: '2026-07-01T10:00:00.000Z',
      durationMinutes: 60,
      note: 'без аллергий',
      reminderMinutes: 60
    })
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('SUMMARY:Аня — Макияж')
    expect(ics).toContain('BEGIN:VALARM')
    expect(ics).toContain('TRIGGER:-PT60M')
    expect(ics).toContain('END:VCALENDAR')
  })
})
