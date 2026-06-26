import { useEffect, useState } from 'react'
import { addClient, getClient, updateClient } from '../db/clients.js'

const SOURCES = [
  'Instagram', 'TikTok', 'Telegram',
  'Рекомендация', 'Реклама', 'Вывеска/прохожий', 'Постоянный',
]

function parseTags(raw) {
  return raw.split(',').map(t => t.trim()).filter(Boolean)
}

export default function ClientForm({ id, onSaved, onCancel }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [source, setSource] = useState('')
  const [note, setNote] = useState('')
  const [birthday, setBirthday] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')   // comma-separated string for input
  const [referredBy, setReferredBy] = useState('')

  useEffect(() => {
    if (!id) return
    getClient(id).then(c => {
      if (!c) return
      setName(c.name)
      setContact(c.contact || '')
      setSource(c.source || '')
      setNote(c.note || '')
      setBirthday(c.birthday || '')
      setTagsRaw((c.tags || []).join(', '))
      setReferredBy(c.referredBy || '')
    })
  }, [id])

  const tagChips = parseTags(tagsRaw)

  const save = async () => {
    if (!name.trim()) { alert('Введите имя клиента'); return }
    const tags = parseTags(tagsRaw)
    // Всегда передаём ВСЕ поля — updateClient делает полную замену записи
    const data = { name: name.trim(), contact, source, note, birthday, tags, referredBy }
    if (id) {
      await updateClient(id, data)
    } else {
      await addClient(data)
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
        <label>Дата рождения
          <input
            type="date"
            value={birthday}
            onChange={e => setBirthday(e.target.value)}
          />
        </label>
        <label>Теги (через запятую)
          <input
            value={tagsRaw}
            onChange={e => setTagsRaw(e.target.value)}
            placeholder="вип, аллергия, ресницы…"
          />
          {tagChips.length > 0 && (
            <div className="tag-chips">
              {tagChips.map((t, i) => (
                <span key={i} className="tag-chip">{t}</span>
              ))}
            </div>
          )}
        </label>
        <label>Кто привёл
          <input
            value={referredBy}
            onChange={e => setReferredBy(e.target.value)}
            placeholder="Имя подруги или источник…"
          />
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
