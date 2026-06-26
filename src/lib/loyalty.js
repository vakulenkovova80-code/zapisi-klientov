/**
 * Возвращает сводку лояльности клиента по числу визитов.
 * @param {number} visitCount
 * @param {number} every - каждые N визитов даётся скидка (по умолчанию 5)
 * @returns {{ count: number, isRegular: boolean, visitsToDiscount: number, discountNow: boolean }}
 */
export function loyaltyInfo(visitCount, every = 5) {
  const count = visitCount
  const isRegular = count >= every
  const discountNow = count > 0 && count % every === 0
  const visitsToDiscount = discountNow ? 0 : every - (count % every)
  return { count, isRegular, discountNow, visitsToDiscount }
}
