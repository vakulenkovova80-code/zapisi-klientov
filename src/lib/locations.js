export const LOCATIONS = [
  { key: 'salon', label: 'В салоне', icon: '💇' },
  { key: 'home',  label: 'На дому',  icon: '🏠' }
]

const _map = new Map(LOCATIONS.map(l => [l.key, l]))

export function locationLabel(key) {
  return _map.get(key)?.label ?? 'В салоне'
}

export function locationIcon(key) {
  return _map.get(key)?.icon ?? '💇'
}
