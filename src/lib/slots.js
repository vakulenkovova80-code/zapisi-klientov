function parseHHMM(str) {
  const [hh, mm] = str.split(':').map(Number)
  return hh * 60 + mm
}

function toHHMM(minutes) {
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0')
  const mm = String(minutes % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

/**
 * Вычисляет занятые и свободные слоты в рабочем окне.
 * @param {Array} appointments - записи одного дня
 * @param {string} workStart - 'HH:MM'
 * @param {string} workEnd   - 'HH:MM'
 * @returns {{ busy: Array<{start,end}>, free: Array<{start,end}> }}
 */
export function computeFreeSlots(appointments, workStart, workEnd) {
  const winStart = parseHHMM(workStart)
  const winEnd = parseHHMM(workEnd)

  // Строим занятые интервалы в минутах, обрезаем по окну
  const raw = []
  for (const a of appointments) {
    const d = new Date(a.datetime)
    const start = d.getHours() * 60 + d.getMinutes()
    const duration = a.durationMinutes ?? 60
    const end = start + duration

    const clampedStart = Math.max(start, winStart)
    const clampedEnd = Math.min(end, winEnd)

    if (clampedStart < clampedEnd) {
      raw.push([clampedStart, clampedEnd])
    }
  }

  // Сортируем и мёржим пересекающиеся/смежные интервалы
  raw.sort((a, b) => a[0] - b[0])
  const merged = []
  for (const [s, e] of raw) {
    if (merged.length > 0 && s <= merged[merged.length - 1][1]) {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e)
    } else {
      merged.push([s, e])
    }
  }

  // Формируем busy как объекты {start, end}
  const busy = merged.map(([s, e]) => ({ start: toHHMM(s), end: toHHMM(e) }))

  // Вычисляем free — промежутки окна, не покрытые busy
  const free = []
  let cursor = winStart
  for (const [s, e] of merged) {
    if (cursor < s) {
      free.push({ start: toHHMM(cursor), end: toHHMM(s) })
    }
    cursor = Math.max(cursor, e)
  }
  if (cursor < winEnd) {
    free.push({ start: toHHMM(cursor), end: toHHMM(winEnd) })
  }

  return { busy, free }
}
