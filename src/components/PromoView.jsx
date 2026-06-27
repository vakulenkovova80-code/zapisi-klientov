import { useState, useEffect, useRef } from 'react'
import BroadcastView from './BroadcastView.jsx'
import { listAppointments } from '../db/appointments.js'
import { listServices } from '../db/services.js'
import { getMeta } from '../db/meta.js'
import { computeFreeSlots } from '../lib/slots.js'
import { buildFreeSlotsPost } from '../lib/posts.js'
import { promoTemplates, promoTemplatesPL } from '../lib/messages.js'
import { toDayKey, formatPrice } from '../lib/format.js'

const SUB_TABS = [
  { key: 'broadcast', label: 'Рассылка' },
  { key: 'slots',     label: 'Окошки'   },
  { key: 'promos',    label: 'Акции'    },
  { key: 'price',     label: 'Прайс'    },
]

// ── Helper: rounded rect on canvas context ────────────────
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

// ── Language Switcher chip UI ─────────────────────────────
function LangSwitcher({ lang, onChange }) {
  return (
    <div className="promo-lang-switcher">
      {['ru', 'pl'].map(l => (
        <button
          key={l}
          type="button"
          className={`promo-lang-chip${lang === l ? ' active' : ''}`}
          onClick={() => onChange(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

// ── Free Slots Section ────────────────────────────────────
function FreeSlotsSection() {
  const [dayOffset, setDayOffset] = useState(0) // 0=today, 1=tomorrow
  const [lang, setLang] = useState('ru')
  const [postText, setPostText] = useState('')
  const [copyMsg, setCopyMsg] = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [appts, workHours, businessName] = await Promise.all([
        listAppointments(),
        getMeta('workHours', { start: '08:00', end: '22:00' }),
        getMeta('businessName', 'Kateryna Shtander'),
      ])
      if (cancelled) return

      const target = new Date()
      target.setDate(target.getDate() + dayOffset)

      // Build day key using local date components (avoids UTC midnight shift)
      const y = target.getFullYear()
      const mo = String(target.getMonth() + 1).padStart(2, '0')
      const d = String(target.getDate()).padStart(2, '0')
      const dayKey = `${y}-${mo}-${d}`

      const dayAppts = appts.filter(a => toDayKey(a.datetime) === dayKey)

      const wh =
        workHours && typeof workHours === 'object' && workHours.start
          ? workHours
          : { start: '08:00', end: '22:00' }

      const { free } = computeFreeSlots(dayAppts, wh.start, wh.end)

      let dateLabel
      if (lang === 'pl') {
        dateLabel = dayOffset === 0 ? 'dziś' : 'jutro'
      } else {
        dateLabel = dayOffset === 0 ? 'сегодня' : 'завтра'
      }

      const name = businessName || 'Kateryna Shtander'
      setPostText(buildFreeSlotsPost(free, dateLabel, name, lang))
    })()
    return () => { cancelled = true }
  }, [dayOffset, lang])

  const flash = (msg) => {
    setCopyMsg(msg)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopyMsg(''), 2500)
  }
  useEffect(() => () => clearTimeout(timerRef.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(postText)
      flash(lang === 'pl' ? 'Skopiowano!' : 'Скопировано!')
    } catch {
      flash(lang === 'pl' ? 'Nie udało się skopiować' : 'Не удалось скопировать')
    }
  }

  const share = async () => {
    try { await navigator.share({ text: postText }) } catch { /* отменено или не поддерживается */ }
  }

  const dayLabels = lang === 'pl'
    ? ['Dziś', 'Jutro']
    : ['Сегодня', 'Завтра']

  return (
    <div className="promo-section">
      <LangSwitcher lang={lang} onChange={setLang} />
      <div className="promo-day-switcher">
        {dayLabels.map((label, i) => (
          <button
            key={i}
            type="button"
            className={`promo-day-btn${dayOffset === i ? ' active' : ''}`}
            onClick={() => setDayOffset(i)}
          >
            {label}
          </button>
        ))}
      </div>
      <textarea
        className="promo-textarea"
        value={postText}
        onChange={e => setPostText(e.target.value)}
        rows={5}
      />
      <div className="promo-actions">
        <button type="button" className="btn-secondary" onClick={copy}>
          {lang === 'pl' ? 'Kopiuj' : 'Скопировать'}
        </button>
        {typeof navigator !== 'undefined' && navigator.share && (
          <button type="button" className="btn-secondary" onClick={share}>
            {lang === 'pl' ? 'Udostępnij' : 'Поделиться'}
          </button>
        )}
      </div>
      {copyMsg && <p className="broadcast-copy-msg">{copyMsg}</p>}
    </div>
  )
}

// ── Promos Section ────────────────────────────────────────
function PromosSection() {
  const [lang, setLang] = useState('ru')
  const [msgs, setMsgs] = useState({})
  const timers = useRef({})

  useEffect(() => () => {
    Object.values(timers.current).forEach(clearTimeout)
  }, [])

  // Reset copy messages when switching language
  const handleLangChange = (l) => {
    setLang(l)
    setMsgs({})
  }

  const copy = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text)
      setMsgs(p => ({ ...p, [idx]: lang === 'pl' ? 'Skopiowano!' : 'Скопировано!' }))
    } catch {
      setMsgs(p => ({ ...p, [idx]: lang === 'pl' ? 'Nie udało się skopiować' : 'Не удалось скопировать' }))
    }
    clearTimeout(timers.current[idx])
    timers.current[idx] = setTimeout(
      () => setMsgs(p => ({ ...p, [idx]: '' })),
      2500
    )
  }

  const templates = lang === 'pl' ? promoTemplatesPL : promoTemplates

  return (
    <div className="promo-section">
      <LangSwitcher lang={lang} onChange={handleLangChange} />
      {templates.map((tmpl, idx) => (
        <div key={idx} className="promo-tmpl-card">
          <p className="promo-tmpl-text">{tmpl}</p>
          <div className="promo-tmpl-row">
            <button
              type="button"
              className="btn-secondary promo-tmpl-copy"
              onClick={() => copy(tmpl, idx)}
            >
              {lang === 'pl' ? 'Kopiuj' : 'Скопировать'}
            </button>
            {msgs[idx] && <span className="promo-flash">{msgs[idx]}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Price Section ─────────────────────────────────────────
function PriceSection() {
  const [services, setServices] = useState(null)
  const [businessName, setBusinessName] = useState('Kateryna Shtander')
  const [msg, setMsg] = useState('')
  const msgTimer = useRef(null)

  useEffect(() => {
    Promise.all([
      listServices(),
      getMeta('businessName', 'Kateryna Shtander'),
    ]).then(([svcs, bname]) => {
      setServices(svcs)
      setBusinessName(bname || 'Kateryna Shtander')
    })
    return () => clearTimeout(msgTimer.current)
  }, [])

  const flash = (m) => {
    setMsg(m)
    clearTimeout(msgTimer.current)
    msgTimer.current = setTimeout(() => setMsg(''), 3000)
  }

  const buildCanvas = () => {
    const W = 800
    const PAD = 48
    const LINE_H = 56
    const HEADER_H = 124
    const FOOTER_H = 48
    const svcs = services || []
    const H = HEADER_H + Math.max(svcs.length, 1) * LINE_H + FOOTER_H

    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    // Background
    ctx.fillStyle = '#fff5f8'
    ctx.fillRect(0, 0, W, H)

    // Top gradient bar
    const grad = ctx.createLinearGradient(0, 0, W, 0)
    grad.addColorStop(0, '#f4b8cd')
    grad.addColorStop(1, '#e89bb4')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, 8)

    // Business name
    ctx.fillStyle = '#d4789a'
    ctx.font = 'bold 38px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(businessName, W / 2, 66)

    // Sub-title
    ctx.fillStyle = '#c5b0b8'
    ctx.font = '600 20px -apple-system, system-ui, sans-serif'
    ctx.fillText('Прайс-лист', W / 2, 100)

    // Separator
    ctx.strokeStyle = 'rgba(232,155,180,0.4)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(PAD, 116)
    ctx.lineTo(W - PAD, 116)
    ctx.stroke()

    if (svcs.length === 0) {
      ctx.fillStyle = '#d4a8bc'
      ctx.font = '20px -apple-system, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Нет услуг', W / 2, HEADER_H + LINE_H / 2 + 6)
    } else {
      svcs.forEach((svc, i) => {
        const rowY = HEADER_H + i * LINE_H
        const textY = rowY + LINE_H / 2 + 8

        // Alternating row background
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(232,155,180,0.08)'
          roundRect(ctx, PAD - 8, rowY + 4, W - (PAD - 8) * 2, LINE_H - 8, 10)
          ctx.fill()
        }

        ctx.textAlign = 'left'
        ctx.fillStyle = '#2b2b2b'
        ctx.font = '500 22px -apple-system, system-ui, sans-serif'
        ctx.fillText(svc.name, PAD, textY)

        ctx.textAlign = 'right'
        ctx.fillStyle = '#7a4a5f'
        ctx.font = 'bold 22px -apple-system, system-ui, sans-serif'
        ctx.fillText(formatPrice(svc.price), W - PAD, textY)
      })
    }

    // Footer
    ctx.textAlign = 'center'
    ctx.fillStyle = '#d4a8bc'
    ctx.font = '600 18px -apple-system, system-ui, sans-serif'
    ctx.fillText('@kateryna.shtander', W / 2, H - 14)

    return canvas
  }

  const downloadPng = () => {
    const canvas = buildCanvas()
    canvas.toBlob(blob => {
      if (!blob) { flash('Не удалось создать изображение'); return }

      // Download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'price-list.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 10000)

      flash('Картинка готова — скачивається!')

      // Share file if supported
      if (typeof navigator !== 'undefined' && navigator.canShare) {
        const file = new File([blob], 'price-list.png', { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file] }).catch(() => {})
        }
      }
    }, 'image/png')
  }

  if (services === null) return <p className="empty">Загрузка…</p>

  return (
    <div className="promo-section">
      {services.length === 0 ? (
        <p className="empty">Добавьте услуги в Настройках, чтобы создать прайс-лист.</p>
      ) : (
        <>
          <div className="promo-price-preview">
            {services.map((svc, i) => (
              <div key={i} className="promo-price-row">
                <span className="promo-price-name">{svc.name}</span>
                <span className="promo-price-val">{formatPrice(svc.price)}</span>
              </div>
            ))}
          </div>
          <button type="button" className="btn-secondary promo-make-img" onClick={downloadPng}>
            🖼️ Сделать картинку прайса
          </button>
          {msg && <p className="broadcast-copy-msg">{msg}</p>}
        </>
      )}
    </div>
  )
}

// ── Main PromoView ────────────────────────────────────────
export default function PromoView() {
  const [activeTab, setActiveTab] = useState('broadcast')

  return (
    <div>
      <header className="screen-head">
        <h1>Продвижение</h1>
      </header>
      <div className="promo-tabs">
        {SUB_TABS.map(t => (
          <button
            key={t.key}
            type="button"
            className={`promo-tab-chip${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'broadcast' && <BroadcastView />}
      {activeTab === 'slots'     && <FreeSlotsSection />}
      {activeTab === 'promos'    && <PromosSection />}
      {activeTab === 'price'     && <PriceSection />}
    </div>
  )
}
