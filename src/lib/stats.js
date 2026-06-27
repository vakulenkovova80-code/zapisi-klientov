/**
 * Возвращает Date начала локального дня (00:00:00) для заданной даты.
 */
function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * Границы возвращаются как UTC-ISO (.toISOString(), с 'Z') момента ЛОКАЛЬНОЙ
 * границы — чтобы строковое сравнение было консистентно с datetime записей в БД,
 * которые хранятся как UTC-ISO ('...Z'). from включительно, to эксклюзивно.
 */
export function todayRange() {
  const from = startOfDay(new Date())
  const to   = new Date(from)
  to.setDate(to.getDate() + 1)
  return { from: from.toISOString(), to: to.toISOString() }
}

export function weekRange() {
  const now     = new Date()
  const day     = now.getDay() // 0=вс, 1=пн, ..., 6=сб
  const offset  = day === 0 ? -6 : 1 - day  // сдвиг до понедельника
  const monday  = startOfDay(now)
  monday.setDate(monday.getDate() + offset)
  const nextMon = new Date(monday)
  nextMon.setDate(nextMon.getDate() + 7)
  return { from: monday.toISOString(), to: nextMon.toISOString() }
}

export function monthRange() {
  const now  = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { from: from.toISOString(), to: to.toISOString() }
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
 * Группирует клиентов по источнику и возвращает массив [{source, count}],
 * отсортированный по убыванию count. Пустой source → 'Не указан'.
 * @param {Array<{source?: string}>} clients
 * @returns {Array<{source: string, count: number}>}
 */
export function sourceStats(clients) {
  const counts = new Map()
  for (const c of clients) {
    const key = c.source && c.source.trim() ? c.source.trim() : 'Не указан'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Возвращает клиентов с непустым birthday, чей день рождения (месяц+день)
 * попадает в ближайшие `days` дней от today (включая today и today+days).
 * Учитывает переход через конец года.
 * @param {Array<{birthday?: string}>} clients
 * @param {number} days
 * @param {Date} today
 * @returns {Array}
 */
export function upcomingBirthdays(clients, days = 30, today = new Date()) {
  const result = []
  // Начало сегодняшнего дня (без времени)
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  for (const c of clients) {
    if (!c.birthday) continue

    // Парсим месяц и день из birthday (формат YYYY-MM-DD)
    const parts = c.birthday.split('-')
    if (parts.length < 3) continue
    const month = parseInt(parts[1], 10) - 1  // 0-based
    const day = parseInt(parts[2], 10)

    // Ближайший ДР в этом году
    let bdThisYear = new Date(todayStart.getFullYear(), month, day)
    // Если ДР уже прошёл в этом году (строго раньше сегодня) — берём следующий год
    if (bdThisYear < todayStart) {
      bdThisYear = new Date(todayStart.getFullYear() + 1, month, day)
    }

    // Граница окна включительно: todayStart + days дней
    const windowEnd = new Date(todayStart)
    windowEnd.setDate(windowEnd.getDate() + days)

    if (bdThisYear >= todayStart && bdThisYear <= windowEnd) {
      const daysLeft = Math.round((bdThisYear - todayStart) / (1000 * 60 * 60 * 24))
      result.push({ ...c, daysLeft })
    }
  }

  return result.sort((a, b) => a.daysLeft - b.daysLeft)
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
