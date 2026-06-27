import { useEffect, useMemo, useState } from 'react'
import { listClients } from '../db/clients.js'
import { listByClient } from '../db/appointments.js'
import { getMeta } from '../db/meta.js'
import { loyaltyInfo } from '../lib/loyalty.js'
import { formatDate, formatPrice } from '../lib/format.js'
import LoyaltyCardButton from './LoyaltyCardButton.jsx'

const BIRTH_MONTHS = [
  'января','февраля','марта','апреля','мая','июня',
  'июля','августа','сентября','октября','ноября','декабря',
]

function formatBirthday(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length < 3) return ''
  const m = parseInt(parts[1], 10)
  const d = parseInt(parts[2], 10)
  return `${d} ${BIRTH_MONTHS[m - 1]}`
}

function LoyaltyBadge({ info }) {
  if (!info) return null
  if (info.discountNow) {
    return <span className="loyalty-badge loyalty-badge--discount">Скидка положена! 🎁</span>
  }
  if (info.isRegular) {
    return <span className="loyalty-badge loyalty-badge--regular">Постоянный 💖</span>
  }
  return (
    <span className="loyalty-badge loyalty-badge--progress">
      До скидки: {info.visitsToDiscount} визитов
    </span>
  )
}

export default function ClientsView({ onOpen, onAddClient, onEditClient, onRebook }) {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState(null)
  const [history, setHistory] = useState([])
  const [loyaltyEvery, setLoyaltyEvery] = useState(5)

  useEffect(() => { listClients().then(setClients) }, [])
  useEffect(() => { getMeta('loyaltyEvery', 5).then(setLoyaltyEvery) }, [])

  const toggle = async (id) => {
    if (openId === id) { setOpenId(null); setHistory([]); return }
    setOpenId(id)
    const list = await listByClient(id)
    setHistory(list.sort((a, b) => b.datetime.localeCompare(a.datetime)))
  }

  // Gallery: collect all photos from history (flat array of Blobs/Files)
  const allPhotos = useMemo(
    () => history.flatMap(a => a.photos || []),
    [history]
  )
  const photoUrls = useMemo(
    () => allPhotos.map(p => {
      try { return URL.createObjectURL(p) } catch { return null }
    }).filter(Boolean),
    [allPhotos]
  )
  useEffect(() => () => { photoUrls.forEach(u => URL.revokeObjectURL(u)) }, [photoUrls])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const openClient = clients.find(c => c.id === openId) || null
  const loyalty = openClient ? loyaltyInfo(history.length, loyaltyEvery) : null
  const lastAppt = history.length > 0 ? history[0] : null

  return (
    <div>
      <header className="screen-head">
        <h1>Клиенты</h1>
        <div className="screen-head-btns">
          <button className="btn-secondary screen-head-btn" onClick={onAddClient}>＋ Клиент</button>
        </div>
      </header>

      <div className="search-wrap">
        <input
          className="search-input"
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по имени…"
        />
      </div>

      {clients.length === 0 && (
        <p className="empty">Пока нет клиентов. Добавьте первого кнопкой «＋ Клиент».</p>
      )}
      {clients.length > 0 && filtered.length === 0 && (
        <p className="empty">Никого не найдено.</p>
      )}

      {filtered.map(c => (
        <div key={c.id} className="client-block">
          <div className="client-row">
            <div className="client-info" onClick={() => toggle(c.id)}>
              <span className="appt-name">{c.name}</span>
              {c.contact && <span className="appt-service">{c.contact}</span>}
              {c.source && <span className="client-source">{c.source}</span>}
            </div>
            <button
              className="client-edit-btn"
              onClick={() => onEditClient(c.id)}
            >
              Изменить
            </button>
          </div>

          {openId === c.id && (
            <div className="client-history">
              {/* Loyalty badge */}
              {loyalty && (
                <div className="client-detail-row">
                  <LoyaltyBadge info={loyalty} />
                </div>
              )}

              {/* Tags */}
              {openClient?.tags?.length > 0 && (
                <div className="tag-chips" style={{ padding: '0 4px' }}>
                  {openClient.tags.map((t, i) => (
                    <span key={i} className="tag-chip">{t}</span>
                  ))}
                </div>
              )}

              {/* Birthday */}
              {openClient?.birthday && (
                <p className="client-birthday">
                  🎂 {formatBirthday(openClient.birthday)}
                </p>
              )}

              {/* Rebook button */}
              {lastAppt && onRebook && (
                <button
                  className="rebook-btn"
                  onClick={() => onRebook(openClient, lastAppt)}
                >
                  🔁 Записать снова
                </button>
              )}

              {/* Loyalty card button */}
              <LoyaltyCardButton
                clientName={openClient.name}
                visitCount={history.length}
                className="btn-secondary"
              />

              {/* Photo gallery */}
              {photoUrls.length > 0 && (
                <div className="client-gallery">
                  {photoUrls.map((u, i) => (
                    <img key={i} src={u} alt="" className="client-gallery-img" />
                  ))}
                </div>
              )}

              {/* Visit history */}
              {history.length === 0 && <p className="empty">Нет визитов</p>}
              {history.map(a => (
                <button key={a.id} className="hist-row" onClick={() => onOpen(a.id)}>
                  <span>{formatDate(a.datetime)} · {a.serviceName}</span>
                  <b>{formatPrice(a.price)}</b>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
