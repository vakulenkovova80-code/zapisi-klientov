/**
 * Текст запроса отзыва после визита.
 * @param {{ clientName: string }} appt
 * @param {string} reviewLink
 * @param {'ru'|'pl'} lang
 * @returns {string}
 */
export function reviewRequestText(appt, reviewLink = '', lang = 'ru') {
  if (lang === 'pl') {
    const base = `${appt.clientName}, dziękuję za wizytę! 💕 Będzie mi miło, jeśli zostawisz opinię`
    if (reviewLink) {
      return `${base}: ${reviewLink}`
    }
    return base
  }
  const base = `${appt.clientName}, спасибо за визит! 💕 Будем рады вашему отзыву`
  if (reviewLink) {
    return `${base}: ${reviewLink}`
  }
  return base
}

/**
 * Поздравительный текст с днём рождения.
 * @param {{ name: string }} client
 * @param {'ru'|'pl'} lang
 * @returns {string}
 */
export function birthdayText(client, lang = 'ru') {
  if (lang === 'pl') {
    return `${client.name}, wszystkiego najlepszego z okazji urodzin! 🎂 Mam dla Ciebie miły upominek na następną wizytę 💕`
  }
  return `${client.name}, с днём рождения! 🎂 Дарим вам приятный сюрприз на следующий визит 💕`
}

/**
 * Готовые шаблоны промо-акций для рассылки/сторис.
 * @type {string[]}
 */
export const promoTemplates = [
  '🌸 Скидка 20% на макияж до конца недели! Запись @kateryna.shtander',
  '💇‍♀️ Приведи подругу — обеим скидка 15%!',
  '✨ Свободные окошки на этой неделе — успей записаться!',
  '🎁 Подарочный сертификат на любую услугу — отличный подарок! @kateryna.shtander',
  '💄 Специальное предложение на причёску + макияж. Подробности в директ @kateryna.shtander',
]

/**
 * Готові шаблони промо-акцій для польськомовних клієнтів.
 * @type {string[]}
 */
export const promoTemplatesPL = [
  '🌸 Zniżka 20% na makijaż do końca tygodnia! Zapisy @kateryna.shtander',
  '💇‍♀️ Przyprowadź koleżankę — obie dostajecie 15% zniżki!',
  '✨ Wolne terminy w tym tygodniu — zapisz się!',
  '🎁 Bon podarunkowy na dowolną usługę — świetny prezent! @kateryna.shtander',
  '💄 Specjalna oferta na fryzurę + makijaż. Szczegóły w DM @kateryna.shtander',
]
