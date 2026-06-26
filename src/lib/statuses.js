export const STATUSES = [
  { key: 'planned',   label: 'Запланирована', color: '#8a8a8a' },
  { key: 'confirmed', label: 'Подтверждена',  color: '#3b82f6' },
  { key: 'came',      label: 'Пришла',        color: '#22a565' },
  { key: 'cancelled', label: 'Отменена',      color: '#c0392b' },
  { key: 'no_show',   label: 'Не пришла',     color: '#d98a00' }
]

const _map = new Map(STATUSES.map(s => [s.key, s]))

export function statusLabel(key) {
  return _map.get(key)?.label ?? key
}

export function statusColor(key) {
  return _map.get(key)?.color ?? '#8a8a8a'
}
