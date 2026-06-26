import { useEffect, useState } from 'react'
import { listServices, addService, updateService, deleteService } from '../db/services.js'
import { buildBackup, restoreBackup } from '../lib/backup.js'
import { getMeta, setMeta } from '../db/meta.js'

export default function SettingsView({ onChanged }) {
  const [services, setServices] = useState([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [workStart, setWorkStart] = useState('08:00')
  const [workEnd, setWorkEnd] = useState('22:00')

  const reload = () => listServices().then(setServices)
  useEffect(() => { reload() }, [])
  useEffect(() => {
    getMeta('workHours', { start: '08:00', end: '22:00' }).then(wh => {
      setWorkStart(wh.start)
      setWorkEnd(wh.end)
    })
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
      </section>
    </div>
  )
}
