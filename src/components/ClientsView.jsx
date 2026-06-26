import { useEffect, useState } from 'react'
import { listClients } from '../db/clients.js'
import { listByClient } from '../db/appointments.js'
import { formatDate, formatPrice } from '../lib/format.js'

export default function ClientsView({ onOpen, onAddClient, onEditClient }) {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => { listClients().then(setClients) }, [])

  const toggle = async (id) => {
    if (openId === id) { setOpenId(null); return }
    setOpenId(id)
    const list = await listByClient(id)
    setHistory(list.sort((a, b) => b.datetime.localeCompare(a.datetime)))
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

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
