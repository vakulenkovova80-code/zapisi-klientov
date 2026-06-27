/**
 * Ценообразование: наценка за выходные
 */

/** true если дата — суббота или воскресенье (локальное время) */
export function isWeekend(datetimeOrIso) {
  const day = new Date(datetimeOrIso).getDay()
  return day === 0 || day === 6
}

/** Цена с наценкой за выходной, округлённая */
export function weekendPrice(basePrice, surchargePercent) {
  return Math.round(Number(basePrice) * (1 + (Number(surchargePercent) || 0) / 100))
}

/** Цена для конкретной даты: выходной → с наценкой, будни → базовая */
export function priceForDate(basePrice, surchargePercent, datetimeOrIso) {
  if (isWeekend(datetimeOrIso)) {
    return weekendPrice(basePrice, surchargePercent)
  }
  return Number(basePrice)
}
