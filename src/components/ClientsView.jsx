import { useEffect, useState } from 'react'
import { listClients } from '../db/clients.js'
import { listByClient } from '../db/appointments.js'
import { formatDate, formatPrice } from '../lib/format.js'

export default function ClientsView({ onOpen }) {
  const [clients, setClients] = useState([])
  const [openId, setOpenId] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => { listClients().then(setClients) }, [])

  const toggle = async (id) => {
    if (openId === id) { setOpenId(null); return }
    setOpenId(id)
    const list = await listByClient(id)
    setHistory(list.sort((a, b) => b.datetime.localeCompare(a.datetime)))
  }

  return (
    <div>
      <header className="screen-head"><h1>Клиенты</h1></header>
      {clients.length === 0 && <p className="empty">Клиенты появятся после первых записей.</p>}
      {clients.map(c => (
        <div key={c.id} className="client-block">
          <button className="client-row" onClick={() => toggle(c.id)}>
            <span className="appt-name">{c.name}</span>
            <span className="appt-service">{c.contact}</span>
          </button>
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
