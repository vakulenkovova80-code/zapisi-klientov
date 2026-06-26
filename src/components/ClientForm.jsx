import { useEffect, useState } from 'react'
import { addClient, getClient, updateClient } from '../db/clients.js'

const SOURCES = [
  'Instagram', 'TikTok', 'Telegram',
  'Рекомендация', 'Реклама', 'Вывеска/прохожий', 'Постоянный',
]

export default function ClientForm({ id, onSaved, onCancel }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [source, setSource] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!id) return
    getClient(id).then(c => {
      if (!c) return
      setName(c.name)
      setContact(c.contact || '')
      setSource(c.source || '')
      setNote(c.note || '')
    })
  }, [id])

  const save = async () => {
    if (!name.trim()) { alert('Введите имя клиента'); return }
    if (id) {
      // Передаём ВСЕ поля — updateClient делает полную замену записи
      await updateClient(id, { name: name.trim(), contact, source, note })
    } else {
      await addClient({ name: name.trim(), contact, source, note })
    }
    onSaved()
  }

  return (
    <div className="overlay">
      <header className="overlay-head">
        <button className="link" onClick={onCancel}>Отмена</button>
        <h2>{id ? 'Изменить клиента' : 'Новый клиент'}</h2>
        <button className="link primary" onClick={save}>Сохранить</button>
      </header>

      <div className="form">
        <label>Имя
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Например, Аня"
          />
        </label>
        <label>Телефон / соцсеть
          <input
            value={contact}
            onChange={e => setContact(e.target.value)}
            placeholder="+7… или @ник"
          />
        </label>
        <label>Откуда узнал(а)
          <input
            list="sources-list"
            value={source}
            onChange={e => setSource(e.target.value)}
            placeholder="Instagram, Рекомендация…"
          />
          <datalist id="sources-list">
            {SOURCES.map(s => <option key={s} value={s} />)}
          </datalist>
        </label>
        <label>Заметка
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder="Аллергии, пожелания…"
          />
        </label>
      </div>
    </div>
  )
}
