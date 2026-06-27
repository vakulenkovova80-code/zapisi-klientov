import { useEffect, useState } from 'react'
import { listServices, addService, updateService, deleteService } from '../db/services.js'
import { buildBackup, restoreBackup } from '../lib/backup.js'
import { buildTextExport } from '../lib/textexport.js'
import { fetchSeed, seedImport } from '../lib/seed.js'
import { listAppointments } from '../db/appointments.js'
import { addAppointment } from '../db/appointments.js'
import { getMeta, setMeta } from '../db/meta.js'
import { parseImportText } from '../lib/parseImport.js'

export default function SettingsView({ onChanged }) {
  const [services, setServices] = useState([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [workStart, setWorkStart] = useState('08:00')
  const [workEnd, setWorkEnd] = useState('22:00')

  // Import list state
  const [importText, setImportText] = useState('')

  // Loyalty & promo settings
  const [loyaltyEvery, setLoyaltyEvery] = useState('5')
  const [reviewLink, setReviewLink] = useState('')
  const [businessName, setBusinessName] = useState('Kateryna Shtander')

  const reload = () => listServices().then(setServices)
  useEffect(() => { reload() }, [])
  useEffect(() => {
    getMeta('workHours', { start: '08:00', end: '22:00' }).then(wh => {
      setWorkStart(wh.start)
      setWorkEnd(wh.end)
    })
    getMeta('loyaltyEvery', 5).then(v => setLoyaltyEvery(String(v)))
    getMeta('reviewLink', '').then(setReviewLink)
    getMeta('businessName', 'Kateryna Shtander').then(setBusinessName)
  }, [])

  const onWorkStartChange = (val) => {
    setWorkStart(val)
    setMeta('workHours', { start: val, end: workEnd })
    onChanged && onChanged()
  }
  const onWorkEndChange = (val) => {
    setWorkEnd(val)
    setMeta('workHours', { start: workStart, end: val })
    onChanged && onChanged()
  }

  const onLoyaltyEveryChange = (val) => {
    setLoyaltyEvery(val)
    const n = Number(val)
    if (n > 0) { setMeta('loyaltyEvery', n); onChanged && onChanged() }
  }

  const onReviewLinkChange = (val) => setReviewLink(val)
  const onReviewLinkBlur = () => { setMeta('reviewLink', reviewLink); onChanged && onChanged() }

  const onBusinessNameChange = (val) => setBusinessName(val)
  const onBusinessNameBlur = () => { setMeta('businessName', businessName); onChanged && onChanged() }

  const add = async () => {
    if (!name.trim()) return
    await addService({ name: name.trim(), price: Number(price) || 0 })
    setName(''); setPrice(''); reload(); onChanged && onChanged()
  }
  const remove = async (id) => { await deleteService(id); reload() }
  const changePrice = async (s, value) => { await updateService(s.id, { name: s.name, price: Number(value) || 0 }); reload() }

  const exportBackup = async () => {
    const data = await buildBackup()
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kopiya-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const exportText = async () => {
    const appts = await listAppointments()
    const txt = buildTextExport(appts)
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zapisi-spisok-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const loadSeed = async () => {
    try {
      const data = await fetchSeed()
      const n = (data.appointments || []).length
      if (!confirm(`Загрузить ${n} записей в приложение?`)) return
      await seedImport(data)
      alert('Готово! Записи загружены 💗'); onChanged && onChanged()
    } catch {
      alert('Не удалось загрузить записи. Проверьте интернет.')
    }
  }

  const importBackup = async (e) => {
    const input = e.target
    const file = input.files[0]
    if (!file) return
    if (!confirm('Заменить все текущие данные данными из копии?')) { input.value = ''; return }
    const text = await file.text()
    await restoreBackup(JSON.parse(text))
    input.value = ''
    alert('Копия восстановлена'); reload(); onChanged && onChanged()
  }

  const handleImport = async () => {
    const { appointments, errors } = parseImportText(importText)
    if (appointments.length === 0) {
      alert(
        errors.length > 0
          ? `Не удалось распознать ни одной записи.\n\nОшибки:\n${errors.join('\n')}\n\nПроверьте формат: ДД.ММ.ГГГГ ЧЧ:ММ | Имя | Услуга | Цена`
          : 'Нет записей для импорта.\n\nФормат: ДД.ММ.ГГГГ ЧЧ:ММ | Имя | Услуга | Цена'
      )
      return
    }
    const confirmed = confirm(`Создать ${appointments.length} запис${appointments.length === 1 ? 'ь' : appointments.length < 5 ? 'и' : 'ей'}?`)
    if (!confirmed) return
    for (const appt of appointments) {
      await addAppointment(appt)
    }
    alert(`Создано ${appointments.length}. Ошибок: ${errors.length}${errors.length > 0 ? '\n\n' + errors.join('\n') : ''}`)
    setImportText('')
    onChanged && onChanged()
  }

  return (
    <div>
      <header className="screen-head"><h1>Настройки</h1></header>

      <section className="settings-block">
        <h2 className="day-title">Рабочие часы</h2>
        <p className="hint">Используется для показа свободного времени в календаре.</p>
        <div className="work-hours-row">
          <label className="work-hours-label">
            Начало
            <input
              type="time"
              value={workStart}
              onChange={e => onWorkStartChange(e.target.value)}
            />
          </label>
          <label className="work-hours-label">
            Конец
            <input
              type="time"
              value={workEnd}
              onChange={e => onWorkEndChange(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="settings-block">
        <h2 className="day-title">Лояльность и продвижение</h2>
        <p className="hint">Настройки программы лояльности, ссылки для отзывов и названия бизнеса.</p>

        <label className="settings-field">
          Скидка каждые N визитов
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={loyaltyEvery}
            onChange={e => onLoyaltyEveryChange(e.target.value)}
          />
        </label>

        <label className="settings-field">
          Ссылка для отзывов (Instagram/Google)
          <input
            type="text"
            value={reviewLink}
            placeholder="https://..."
            onChange={e => onReviewLinkChange(e.target.value)}
            onBlur={onReviewLinkBlur}
          />
        </label>

        <label className="settings-field">
          Название бизнеса
          <input
            type="text"
            value={businessName}
            placeholder="Kateryna Shtander"
            onChange={e => onBusinessNameChange(e.target.value)}
            onBlur={onBusinessNameBlur}
          />
        </label>
      </section>

      <section className="settings-block">
        <h2 className="day-title">Услуги и цены</h2>
        {services.map(s => (
          <div key={s.id} className="svc-row">
            <span>{s.name}</span>
            <input type="number" inputMode="numeric" defaultValue={s.price}
              onBlur={e => changePrice(s, e.target.value)} />
            <button className="link" onClick={() => remove(s.id)}>✕</button>
          </div>
        ))}
        <div className="svc-add">
          <input placeholder="Название" value={name} onChange={e => setName(e.target.value)} />
          <input placeholder="Цена" type="number" inputMode="numeric" value={price} onChange={e => setPrice(e.target.value)} />
          <button className="link primary" onClick={add}>＋</button>
        </div>
      </section>

      <section className="settings-block">
        <h2 className="day-title">Резервная копия</h2>
        <p className="hint">Сохраняйте копию раз в неделю — на случай потери телефона.</p>
        <button className="btn-secondary" onClick={exportBackup}>💾 Сохранить копию</button>
        <label className="btn-secondary file-label">
          📂 Загрузить копию
          <input type="file" accept="application/json" onChange={importBackup} hidden />
        </label>
        <button className="btn-secondary" onClick={exportText}>📄 Скачать список (TXT)</button>
        <p className="hint">Текстовый список всех записей (дата, имя, услуга, цена) — удобно хранить на компьютере.</p>
      </section>

      <section className="settings-block">
        <h2 className="day-title">Стартовые записи</h2>
        <p className="hint">Загрузить заранее подготовленные записи (из вашего списка). Уже добавленные записи не пострадают.</p>
        <button className="btn-secondary" onClick={loadSeed}>📥 Загрузить записи</button>
      </section>

      <section className="settings-block">
        <h2 className="day-title">Импорт списком</h2>
        <p className="hint">
          Каждая запись с новой строки:<br />
          <code className="import-example">ДД.ММ.ГГГГ ЧЧ:ММ | Имя | Услуга | Цена</code><br />
          Услуга и цена — по желанию.
        </p>
        <p className="hint">Пример:<br />
          <code className="import-example">27.06.2026 14:00 | Ольга | Окрашивание | 1500</code>
        </p>
        <textarea
          className="import-textarea"
          value={importText}
          onChange={e => setImportText(e.target.value)}
          placeholder={'27.06.2026 14:00 | Ольга | Окрашивание | 1500\n28.06.2026 10:00 | Марина | Маникюр'}
          rows={6}
        />
        <button className="btn-secondary import-btn" onClick={handleImport}>
          📥 Импортировать
        </button>
      </section>
    </div>
  )
}
