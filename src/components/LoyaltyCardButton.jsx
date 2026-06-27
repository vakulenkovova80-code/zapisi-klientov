import { useEffect, useRef, useState } from 'react'
import { getMeta } from '../db/meta.js'
import { drawDiscountCard } from '../lib/discountCard.js'

/**
 * Переиспользуемая кнопка «🎟 Карта лояльности» + модалка-превью.
 * Props:
 *   clientName  {string}  — имя клиента
 *   visitCount  {number}  — число визитов
 *   className   {string?} — класс кнопки (по умолчанию 'btn-secondary')
 */
export default function LoyaltyCardButton({ clientName, visitCount = 0, className = 'btn-secondary' }) {
  const [cardUrl, setCardUrl] = useState(null)
  const cardBlobRef = useRef(null)

  // Revoke object URL при изменении / размонтировании
  useEffect(() => {
    const url = cardUrl
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [cardUrl])

  const canShareFiles = (() => {
    if (typeof navigator === 'undefined' || !navigator.canShare) return false
    try { return navigator.canShare({ files: [new File([], 'x.png', { type: 'image/png' })] }) }
    catch { return false }
  })()

  const handleCardOpen = async () => {
    try {
      const [businessName, every, percent] = await Promise.all([
        getMeta('businessName', 'Kateryna Shtander'),
        getMeta('loyaltyEvery', 5),
        getMeta('discountPercent', 40),
      ])
      const blob = await drawDiscountCard({ clientName, businessName, visitCount, every, percent })
      cardBlobRef.current = blob
      setCardUrl(URL.createObjectURL(blob))
    } catch (err) {
      alert('Не удалось создать карту лояльности: ' + err.message)
    }
  }

  const handleCardShare = async () => {
    if (!cardBlobRef.current) return
    const file = new File([cardBlobRef.current], 'karta-loyalnosti.png', { type: 'image/png' })
    try { await navigator.share({ files: [file], title: 'Карта лояльности' }) }
    catch { /* пользователь отменил */ }
  }

  const handleCardSave = () => {
    if (!cardUrl) return
    const link = document.createElement('a')
    link.href = cardUrl
    link.download = 'karta-loyalnosti.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCardClose = () => {
    cardBlobRef.current = null
    setCardUrl(null)
  }

  return (
    <>
      <button type="button" className={className} onClick={handleCardOpen}>
        🎟 Карта лояльности
      </button>

      {cardUrl && (
        <div className="overlay card-preview">
          <header className="overlay-head">
            <button className="link" onClick={handleCardClose}>Закрыть</button>
            <h2>Карта лояльности</h2>
            <span />
          </header>
          <div className="card-preview-body">
            <img className="card-preview-img" src={cardUrl} alt="Карта лояльности" />
            <div className="card-preview-actions">
              {canShareFiles && (
                <button type="button" className="btn-secondary" onClick={handleCardShare}>
                  📤 Поделиться
                </button>
              )}
              <button type="button" className="btn-secondary" onClick={handleCardSave}>
                💾 Сохранить
              </button>
              <button type="button" className="btn-secondary" onClick={handleCardClose}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
