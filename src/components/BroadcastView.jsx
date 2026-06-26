import { useEffect, useMemo, useRef, useState } from 'react'
import { listClients } from '../db/clients.js'
import { waLink, numbersText } from '../lib/broadcast.js'

export default function BroadcastView() {
  const [clients, setClients] = useState([])
  const [sourceFilter, setSourceFilter] = useState('Все')
  const [selected, setSelected] = useState(new Set())
  const [text, setText] = useState('')
  const [copyMsg, setCopyMsg] = useState('')

  useEffect(() => {
    listClients().then(all => {
      setClients(all)
      setSelected(new Set(all.map(c => c.id)))
    })
  }, [])

  // Unique non-empty sources
  const sources = useMemo(() => {
    const s = new Set(clients.map(c => c.source).filter(Boolean))
    return [...s].sort()
  }, [clients])

  // Filtered clients by source
  const filtered = useMemo(() => {
    if (sourceFilter === 'Все') return clients
    return clients.filter(c => c.source === sourceFilter)
  }, [clients, sourceFilter])

  // Selected clients that are also in the current filtered set
  const selectedClients = useMemo(
    () => filtered.filter(c => selected.has(c.id)),
    [filtered, selected]
  )

  const handleSourceChange = (val) => {
    setSourceFilter(val)
    // On filter change — reselect all visible clients (simple, predictable behaviour)
    const newFiltered = val === 'Все' ? clients : clients.filter(c => c.source === val)
    setSelected(new Set(newFiltered.map(c => c.id)))
  }

  const toggleClient = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id))

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(c => next.delete(c.id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(c => next.add(c.id))
        return next
      })
    }
  }

  const flashTimer = useRef()
  const flash = (msg) => {
    setCopyMsg(msg)
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setCopyMsg(''), 2500)
  }
  useEffect(() => () => clearTimeout(flashTimer.current), [])

  const copyNumbers = async () => {
    try {
      await navigator.clipboard.writeText(numbersText(selectedClients))
      flash('Номера скопированы')
    } catch {
      flash('Не удалось скопировать')
    }
  }

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text)
      flash('Текст скопирован')
    } catch {
      flash('Не удалось скопировать')
    }
  }

  return (
    <div>
      <header className="screen-head">
        <h1>Рассылка</h1>
      </header>

      <div className="form">
        {clients.length === 0 ? (
          <p className="empty">
            Пока нет клиентов.{' '}Добавьте их во вкладке «Клиенты».
          </p>
        ) : (
          <>
            {/* ── Source filter ── */}
            <label>Фильтр по источнику
              <select
                className="broadcast-select"
                value={sourceFilter}
                onChange={e => handleSourceChange(e.target.value)}
              >
                <option value="Все">Все</option>
                {sources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>

            {/* ── Client list with checkboxes ── */}
            <div>
              <div className="broadcast-section-label">
                <span>Получатели</span>
                <button
                  type="button"
                  className="link broadcast-toggle-all"
                  onClick={toggleAll}
                >
                  {allFilteredSelected ? 'Снять все' : 'Выбрать все'}
                </button>
              </div>

              {filtered.length === 0 ? (
                <p className="empty" style={{ marginTop: 8, marginBottom: 0 }}>
                  Нет клиентов с таким источником.
                </p>
              ) : (
                <div className="broadcast-check-list">
                  {filtered.map(c => (
                    <label key={c.id} className="broadcast-check-row">
                      <input
                        type="checkbox"
                        className="broadcast-checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggleClient(c.id)}
                      />
                      <span className="broadcast-client-name">{c.name}</span>
                      {c.contact && (
                        <span className="broadcast-client-contact">{c.contact}</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* ── Message textarea ── */}
            <label>Текст сообщения
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={4}
                placeholder="Привет! У нас новые услуги…"
              />
            </label>

            {/* ── WhatsApp buttons per selected client ── */}
            {selectedClients.length > 0 && (
              <div>
                <div className="broadcast-section-label">
                  <span>Открыть WhatsApp ({selectedClients.length})</span>
                </div>
                <div className="broadcast-wa-list">
                  {selectedClients.map(c => {
                    const link = waLink(c.contact, text)
                    return (
                      <div key={c.id} className="broadcast-wa-row">
                        <span className="broadcast-wa-name">{c.name}</span>
                        {link ? (
                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary broadcast-wa-btn"
                          >
                            WhatsApp
                          </a>
                        ) : (
                          <span className="broadcast-no-phone">нет телефона</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Copy actions ── */}
            <div className="broadcast-actions">
              <button type="button" className="btn-secondary" onClick={copyNumbers}>
                Скопировать номера
              </button>
              <button type="button" className="btn-secondary" onClick={copyText}>
                Скопировать текст
              </button>
            </div>

            {copyMsg && (
              <p className="broadcast-copy-msg">{copyMsg}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
