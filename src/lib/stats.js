/**
 * Возвращает ISO-строку начала локального дня (00:00:00) для заданной даты.
 */
function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * Форматирует Date в локальную ISO-строку YYYY-MM-DDTHH:MM:SS (без Z).
 */
function toLocalISO(d) {
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  const hh   = String(d.getHours()).padStart(2, '0')
  const min  = String(d.getMinutes()).padStart(2, '0')
  const ss   = String(d.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`
}

/**
 * from включительно, to эксклюзивно (начало следующего периода).
 */
export function todayRange() {
  const now  = new Date()
  const from = startOfDay(now)
  const to   = new Date(from)
  to.setDate(to.getDate() + 1)
  return { from: toLocalISO(from), to: toLocalISO(to) }
}

export function weekRange() {
  const now     = new Date()
  const day     = now.getDay() // 0=вс, 1=пн, ..., 6=сб
  const offset  = day === 0 ? -6 : 1 - day  // сдвиг до понедельника
  const monday  = startOfDay(now)
  monday.setDate(monday.getDate() + offset)
  const nextMon = new Date(monday)
  nextMon.setDate(nextMon.getDate() + 7)
  return { from: toLocalISO(monday), to: toLocalISO(nextMon) }
}

export function monthRange() {
  const now  = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { from: toLocalISO(from), to: toLocalISO(to) }
}

/**
 * Сумма price записей в [range.from, range.to) со статусом из statuses.
 */
export function sumIncome(appts, range, statuses = ['came']) {
  const statusSet = new Set(statuses)
  let total = 0
  for (const a of appts) {
    if (a.datetime >= range.from && a.datetime < range.to && statusSet.has(a.status)) {
      total += Number(a.price) || 0
    }
  }
  return total
}

/**
 * Число записей в [range.from, range.to) любого статуса.
 */
export function countInRange(appts, range) {
  let count = 0
  for (const a of appts) {
    if (a.datetime >= range.from && a.datetime < range.to) {
      count++
    }
  }
  return count
}

/**
 * Возвращает { name, count } самой частой услуги или null для пустого массива.
 */
export function topService(appts) {
  if (appts.length === 0) return null
  const counts = new Map()
  for (const a of appts) {
    counts.set(a.serviceName, (counts.get(a.serviceName) ?? 0) + 1)
  }
  let best = null
  let bestCount = 0
  for (const [name, count] of counts) {
    if (count > bestCount) {
      bestCount = count
      best = name
    }
  }
  return { name: best, count: bestCount }
}
