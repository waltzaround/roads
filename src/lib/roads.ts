import roadData from '../data/roads.json' with { type: 'json' }

export type Status = 'completed' | 'construction' | 'early_works' | 'pre_construction' | 'design' | 'procurement' | 'paused' | 'not_started' | 'partial'
export interface Road {
  id: number; name: string; island: 'North' | 'South'; km: number | null; cost: number | null;
  coords: [number, number][]; programme: string; rate: number | null;
  sources: [string, string][]; lengthLabel?: string; costLabel?: string; rateLabel?: string;
  researchNote?: string; referencesReviewedOn?: string;
  status: Status; started: string | null; finish: string | null; finishType: string;
  statusNote: string; aliasOf: string | null; excludeFromTotals: boolean; corridorSegments: string[] | null;
}
export const roads = roadData as unknown as Road[]
export const statusLabels: Record<Status, string> = {
  completed: 'Completed', construction: 'Under construction', early_works: 'Early works',
  pre_construction: 'Pre-construction', design: 'Design', procurement: 'Procurement',
  paused: 'Paused', not_started: 'Not started', partial: 'Partially delivered',
}
export const statusOrder: Status[] = ['not_started', 'design', 'procurement', 'pre_construction', 'early_works', 'construction', 'partial', 'paused', 'completed']
export const statusColors: Record<Status, string> = {
  not_started: '#a8b0bf', design: '#5ec2e0', procurement: '#b7a4e0', pre_construction: '#e89255',
  early_works: '#e2b15c', construction: '#6d8ef5', partial: '#3dbaa8', paused: '#e39aa2', completed: '#63c796',
}
export function money(value: number | null) {
  if (value == null) return 'Not published'
  return value >= 1 ? `$${value.toFixed(2)}b` : `$${Math.round(value * 1000)}m`
}
export function costRate(value: number | null) {
  return value == null ? 'Not comparable' : `$${Math.round(value)}m`
}
export function formatDate(value: string | null) {
  if (!value) return 'Not confirmed'
  const [year, month] = value.split('-')
  return month ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(month) - 1]} ${year}` : year
}
export function summarise(items: Road[]) {
  const unique = items.filter(r => !r.excludeFromTotals)
  const costed = unique.filter(r => r.cost != null)
  const measured = costed.filter(r => r.km != null && r.km > 0)
  const cost = costed.reduce((sum, r) => sum + r.cost!, 0)
  const km = measured.reduce((sum, r) => sum + r.km!, 0)
  const measuredCost = measured.reduce((sum, r) => sum + r.cost!, 0)
  return { count: unique.length, costed: costed.length, cost, km, rate: km > 0 ? measuredCost * 1000 / km : null }
}
export interface Filters { query: string; programme: string; island: string; status: string; sort: string }
export const defaultFilters: Filters = { query: '', programme: 'all', island: 'all', status: 'all', sort: 'rate' }
const normalise = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
export function filterRoads(items: Road[], filters: Filters) {
  return items.filter(r =>
    normalise(r.name).includes(normalise(filters.query.trim())) &&
    (filters.programme === 'all' || r.programme === filters.programme) &&
    (filters.island === 'all' || r.island === filters.island) &&
    (filters.status === 'all' || r.status === filters.status)
  ).sort((a, b) => filters.sort === 'name' ? a.name.localeCompare(b.name, 'en-NZ') : (b[filters.sort as 'rate' | 'cost' | 'km'] ?? -1) - (a[filters.sort as 'rate' | 'cost' | 'km'] ?? -1) || a.id - b.id)
}
