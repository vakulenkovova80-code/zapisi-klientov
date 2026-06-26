import { formatPrice } from './format.js'
import { statusLabel } from './statuses.js'

// Человекочитаемая дата для текстовой выгрузки: «26.06.2026 14:30» (локальное время).
function dt(iso) {
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

// Собирает все записи в простой текстовый документ:
// дата/время — имя — услуга — цена — статус. Отсортировано по времени.
export function buildTextExport(appointments) {
  const sorted = [...appointments].sort((a, b) => a.datetime.localeCompare(b.datetime))
  const lines = sorted.map((a) =>
    `${dt(a.datetime)} — ${a.clientName || '—'} — ${a.serviceName || '—'} — ${formatPrice(a.price)} — ${statusLabel(a.status || 'planned')}`
  )
  const header = `Записи клиентов — выгрузка ${dt(new Date().toISOString())}\nВсего записей: ${sorted.length}\n\n`
  return header + lines.join('\n') + (lines.length ? '\n' : '')
}
