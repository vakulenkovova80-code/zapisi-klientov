import { describe, it, expect } from 'vitest'
import { reminderText } from './reminders.js'

describe('reminderText', () => {
  // Используем строку без Z — парсится как локальное время, результат стабилен
  const appt = {
    clientName: 'Мария',
    serviceName: 'Чистка лица',
    datetime: '2026-06-26T14:30:00'
  }

  it('содержит имя клиента', () => {
    expect(reminderText(appt)).toContain('Мария')
  })

  it('содержит название услуги', () => {
    expect(reminderText(appt)).toContain('Чистка лица')
  })

  it('содержит корректную дату через formatDate', () => {
    // formatDate('2026-06-26T14:30:00') → '26 июня'
    expect(reminderText(appt)).toContain('26 июня')
  })

  it('содержит корректное время через formatTime', () => {
    // formatTime('2026-06-26T14:30:00') → '14:30'
    expect(reminderText(appt)).toContain('14:30')
  })

  it('содержит приветствие «Здравствуйте»', () => {
    expect(reminderText(appt)).toContain('Здравствуйте')
  })

  it('содержит «Ждём вас»', () => {
    expect(reminderText(appt)).toContain('Ждём вас')
  })

  it('полная структура сообщения', () => {
    const text = reminderText(appt)
    expect(text).toBe(
      'Здравствуйте, Мария! Напоминаю о записи 26 июня в 14:30 на Чистка лица. Ждём вас! 💗'
    )
  })

  it('работает с другим именем и услугой', () => {
    const text = reminderText({
      clientName: 'Ольга',
      serviceName: 'Макияж',
      datetime: '2026-07-15T09:00:00'
    })
    expect(text).toContain('Ольга')
    expect(text).toContain('Макияж')
    expect(text).toContain('15 июля')
    expect(text).toContain('09:00')
  })
})
