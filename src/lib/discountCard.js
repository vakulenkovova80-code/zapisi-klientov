/**
 * G9 — Накопительная карта лояльности клиента
 * Рисует PNG-карту на offscreen canvas и возвращает Blob.
 */

/**
 * Нарисовать скруглённый прямоугольник (helper).
 * @param {CanvasRenderingContext2D} ctx
 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/**
 * Генерирует накопительную карту лояльности и возвращает Promise<Blob>.
 * @param {{ clientName: string, businessName: string, visitCount?: number, every?: number, percent?: number }} opts
 * @returns {Promise<Blob>}
 */
export function drawDiscountCard({ clientName, businessName, visitCount = 0, every = 5, percent = 40 }) {
  const W = 800
  const H = 560

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // ── Background gradient (vertical: #fdeef4 → #f7c5d9) ──
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
  bgGrad.addColorStop(0, '#fdeef4')
  bgGrad.addColorStop(1, '#f7c5d9')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // ── Card border / frame ──
  ctx.save()
  roundRect(ctx, 10, 10, W - 20, H - 20, 28)
  ctx.strokeStyle = 'rgba(214,104,143,0.35)'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.restore()

  // ── Inner decorative stripe (top) ──
  const stripeGrad = ctx.createLinearGradient(0, 0, W, 0)
  stripeGrad.addColorStop(0, '#f4b8cd')
  stripeGrad.addColorStop(1, '#e89bb4')
  ctx.fillStyle = stripeGrad
  roundRect(ctx, 10, 10, W - 20, 10, 4)
  ctx.fill()

  // ── Soft decorative circles ──
  ctx.save()
  ctx.globalAlpha = 0.10
  ctx.fillStyle = '#d6688f'
  ctx.beginPath()
  ctx.arc(W - 80, 90, 100, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(60, H - 60, 80, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.restore()

  // ── businessName ──
  ctx.fillStyle = '#d6688f'
  ctx.font = 'bold 42px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🌹 ' + businessName, W / 2, 82)

  // ── «Карта лояльности» ──
  ctx.fillStyle = '#b84f7a'
  ctx.font = '600 22px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Карта лояльности', W / 2, 115)

  // ── Divider ──
  ctx.strokeStyle = 'rgba(214,104,143,0.30)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(60, 132)
  ctx.lineTo(W - 60, 132)
  ctx.stroke()

  // ── Stamp circles ──
  const discountNow = visitCount > 0 && visitCount % every === 0
  const filledCount = discountNow ? every : visitCount % every

  const maxWidth = W - 120
  const circleR = Math.min(30, Math.floor(maxWidth / (every * 2.8)))
  const circleSpacing = Math.max(10, Math.floor(circleR * 0.6))
  const totalCircleWidth = every * (2 * circleR) + (every - 1) * circleSpacing
  const startX = (W - totalCircleWidth) / 2 + circleR
  const circleY = 198

  for (let i = 0; i < every; i++) {
    const cx = startX + i * (2 * circleR + circleSpacing)
    const filled = i < filledCount

    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, circleY, circleR, 0, Math.PI * 2)
    if (filled) {
      ctx.fillStyle = '#d6688f'
      ctx.fill()
      // Checkmark inside
      ctx.fillStyle = 'white'
      ctx.font = `bold ${Math.floor(circleR * 0.9)}px -apple-system, system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('✓', cx, circleY)
    } else {
      ctx.fillStyle = 'rgba(214,104,143,0.10)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(214,104,143,0.38)'
      ctx.lineWidth = 2
      ctx.stroke()
    }
    ctx.restore()
  }
  ctx.textBaseline = 'alphabetic'

  // ── «Услуг: N» ──
  ctx.fillStyle = '#9c4d6a'
  ctx.font = '500 19px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`Услуг: ${visitCount}`, W / 2, 250)

  // ── Divider ──
  ctx.strokeStyle = 'rgba(214,104,143,0.20)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(60, 265)
  ctx.lineTo(W - 60, 265)
  ctx.stroke()

  // ── Rule ──
  ctx.fillStyle = '#7a3d58'
  ctx.font = 'bold 26px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`Каждая ${every}-я услуга — скидка ${percent}%`, W / 2, 308)

  // ── Discount banner or «До скидки осталось» ──
  if (discountNow) {
    // Bright pink banner
    ctx.save()
    roundRect(ctx, 56, 330, W - 112, 62, 18)
    ctx.fillStyle = '#e83e8c'
    ctx.fill()
    ctx.fillStyle = 'white'
    ctx.font = 'bold 27px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`🎁 Сейчас скидка ${percent}%!`, W / 2, 361)
    ctx.textBaseline = 'alphabetic'
    ctx.restore()
  } else {
    const remaining = every - (visitCount % every)
    ctx.fillStyle = '#b84f7a'
    ctx.font = '500 22px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`До скидки осталось: ${remaining} услуг(и)`, W / 2, 365)
  }

  // ── Divider ──
  ctx.strokeStyle = 'rgba(214,104,143,0.22)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(60, 408)
  ctx.lineTo(W - 60, 408)
  ctx.stroke()

  // ── «Для: clientName» ──
  ctx.fillStyle = '#7a3d58'
  ctx.font = '500 24px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`Для: ${clientName}`, W / 2, 445)

  // ── Footer ──
  ctx.fillStyle = '#d6688f'
  ctx.font = '600 20px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('@kateryna.shtander 💗', W / 2, 485)

  ctx.fillStyle = '#c5a0b2'
  ctx.font = '400 16px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Покажите это сообщение мастеру', W / 2, 513)

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error('canvas.toBlob вернул null'))
    }, 'image/png')
  })
}

/**
 * Поделиться картинкой через Web Share API или скачать как файл.
 * @param {Blob} blob
 * @param {string} filename
 */
export async function shareOrDownloadCard(blob, filename) {
  const file = new File([blob], filename, { type: 'image/png' })

  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], title: 'Карта лояльности' })
      return
    } catch {
      // Пользователь отменил или share не удался — упадём на скачивание
    }
  }

  // Fallback: скачать файл
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
