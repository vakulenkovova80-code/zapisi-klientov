import { describe, it, expect } from 'vitest'
import { reviewRequestText, birthdayText, promoTemplates, promoTemplatesPL } from './messages.js'

describe('reviewRequestText', () => {
  it('подставляет имя и ссылку', () => {
    const appt = { clientName: 'Оля' }
    const text = reviewRequestText(appt, 'https://g.co/review/123')
    expect(text).toContain('Оля')
    expect(text).toContain('https://g.co/review/123')
    expect(text).toContain('спасибо за визит')
  })

  it('пустой reviewLink — нет хвоста-ссылки, но текст корректен', () => {
    const appt = { clientName: 'Аня' }
    const text = reviewRequestText(appt, '')
    expect(text).toContain('Аня')
    expect(text).toContain('спасибо за визит')
    // нет undefined или лишнего двоеточия
    expect(text).not.toContain('undefined')
    expect(text).not.toMatch(/:\s*$/)
  })

  it('без reviewLink (не передан) — работает без ошибок', () => {
    const appt = { clientName: 'Катя' }
    const text = reviewRequestText(appt)
    expect(text).toContain('Катя')
    expect(text).not.toContain('undefined')
  })

  it('текст содержит эмодзи 💕', () => {
    const text = reviewRequestText({ clientName: 'Ира' }, '')
    expect(text).toContain('💕')
  })
})

describe('birthdayText', () => {
  it('подставляет имя клиента', () => {
    const text = birthdayText({ name: 'Наташа' })
    expect(text).toContain('Наташа')
  })

  it('содержит поздравление с ДР и эмодзи 🎂', () => {
    const text = birthdayText({ name: 'Лена' })
    expect(text).toContain('днём рождения')
    expect(text).toContain('🎂')
  })

  it('упоминает сюрприз на следующий визит', () => {
    const text = birthdayText({ name: 'Вика' })
    expect(text).toContain('следующий визит')
  })
})

describe('reviewRequestText PL', () => {
  it('zawiera «dziękuję» i imię', () => {
    const text = reviewRequestText({ clientName: 'Maria' }, '', 'pl')
    expect(text).toContain('Maria')
    expect(text).toContain('dziękuję')
  })

  it('zawiera link jeśli podany', () => {
    const text = reviewRequestText({ clientName: 'Maria' }, 'https://g.co/r', 'pl')
    expect(text).toContain('https://g.co/r')
    expect(text).toContain('opinię')
  })

  it('bez linku — brak dwukropka na końcu i brak undefined', () => {
    const text = reviewRequestText({ clientName: 'Anna' }, '', 'pl')
    expect(text).not.toMatch(/:\s*$/)
    expect(text).not.toContain('undefined')
  })

  it('ru pozostaje niezmieniony gdy lang=ru', () => {
    const text = reviewRequestText({ clientName: 'Аня' }, '', 'ru')
    expect(text).toContain('спасибо за визит')
  })
})

describe('birthdayText PL', () => {
  it('zawiera imię i «wszystkiego najlepszego»', () => {
    const text = birthdayText({ name: 'Maria' }, 'pl')
    expect(text).toContain('Maria')
    expect(text).toContain('wszystkiego najlepszego')
  })

  it('zawiera 🎂 i wzmiankę o upominku', () => {
    const text = birthdayText({ name: 'Anna' }, 'pl')
    expect(text).toContain('🎂')
    expect(text).toContain('upominek')
  })

  it('ru pozostaje niezmieniony gdy lang=ru', () => {
    const text = birthdayText({ name: 'Лена' }, 'ru')
    expect(text).toContain('днём рождения')
    expect(text).toContain('следующий визит')
  })
})

describe('promoTemplates', () => {
  it('является непустым массивом', () => {
    expect(Array.isArray(promoTemplates)).toBe(true)
    expect(promoTemplates.length).toBeGreaterThan(0)
  })

  it('каждый элемент — непустая строка', () => {
    for (const t of promoTemplates) {
      expect(typeof t).toBe('string')
      expect(t.length).toBeGreaterThan(0)
    }
  })

  it('содержит шаблон с упоминанием @kateryna.shtander', () => {
    const hasInstagram = promoTemplates.some(t => t.includes('@kateryna.shtander'))
    expect(hasInstagram).toBe(true)
  })

  it('минимум 3 шаблона', () => {
    expect(promoTemplates.length).toBeGreaterThanOrEqual(3)
  })
})

describe('promoTemplatesPL', () => {
  it('jest niepustą tablicą', () => {
    expect(Array.isArray(promoTemplatesPL)).toBe(true)
    expect(promoTemplatesPL.length).toBeGreaterThan(0)
  })

  it('każdy element to niepusty string', () => {
    for (const t of promoTemplatesPL) {
      expect(typeof t).toBe('string')
      expect(t.length).toBeGreaterThan(0)
    }
  })

  it('zawiera przynajmniej jeden szablon z @kateryna.shtander', () => {
    const hasInstagram = promoTemplatesPL.some(t => t.includes('@kateryna.shtander'))
    expect(hasInstagram).toBe(true)
  })

  it('minimum 3 szablony', () => {
    expect(promoTemplatesPL.length).toBeGreaterThanOrEqual(3)
  })
})
