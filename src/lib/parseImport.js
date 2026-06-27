/**
 * parseImportText(text) — массовый импорт записей из вставленного текста.
 *
 * Формат строки (поля через «|»):
 *   ДД.ММ.ГГГГ ЧЧ:ММ | Имя | Услуга | Цена
 *
 * Обязательны: дата+время и Имя.
 * Услуга и Цена — необязательны.
 *
 * Возвращает { appointments: [...], errors: [...строки с описанием ошибки...] }
 */

const DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{1,2}):(\d{2})/

function parseDatetime(raw) {
  const m = DATE_RE.exec(raw.trim())
  if (!m) return null
  const [, dd, mm, yyyy, hh, min] = m
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min))
  return d.toISOString()
}

function parsePrice(raw) {
  if (!raw) return 0
  // убрать все пробелы (обычный, неразрывный) и нечисловые символы кроме точки
  const cleaned = raw.replace(/[\s  ]/g, '').replace(/[^\d.]/g, '')
  return Number(cleaned) || 0
}

export function parseImportText(text) {
  const appointments = []
  const errors = []

  if (!text || !text.trim()) return { appointments, errors }

  const lines = text.split('\n')

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue // пустые/пробельные — пропускаем

    const parts = line.split('|').map(p => p.trim())
    const [datetimeRaw, clientName, serviceName = '', priceRaw = ''] = parts

    // Парсинг даты/времени
    const datetime = parseDatetime(datetimeRaw || '')
    if (!datetime) {
      errors.push(`Не удалось распознать дату/время: «${line}»`)
      continue
    }

    // Имя — обязательно
    if (!clientName) {
      errors.push(`Не указано имя клиента: «${line}»`)
      continue
    }

    appointments.push({
      clientId: null,
      clientName,
      contact: '',
      datetime,
      serviceName,
      price: parsePrice(priceRaw),
      note: '',
      photos: [],
      status: 'planned',
      durationMinutes: 60,
    })
  }

  return { appointments, errors }
}
