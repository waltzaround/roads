import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { statusLabels, type Filters } from '@/lib/roads'

export function ProjectFilters({ filters, onChange, onReset }: { filters: Filters; onChange: (key: keyof Filters, value: string) => void; onReset: () => void }) {
  const count = [filters.programme, filters.island, filters.status].filter(value => value !== 'all').length
  const groups = [
    { key: 'programme' as const, label: 'Programme', options: [['all', 'Both programmes'], ['National significance', 'Roads of National Significance'], ['Regional significance', 'Roads of Regional Significance']] },
    { key: 'island' as const, label: 'Island', options: [['all', 'Both islands'], ['North', 'North Island'], ['South', 'South Island']] },
    { key: 'status' as const, label: 'Status', options: [['all', 'All statuses'], ...Object.entries(statusLabels)] },
  ]
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="filters-trigger" aria-label="Filter projects"><SlidersHorizontal size={14} />Filters{count > 0 && <span className="filter-count">{count}</span>}<ChevronDown size={13} /></Button></DropdownMenuTrigger><DropdownMenuContent align="start" sideOffset={8} className="filters-menu">
    <DropdownMenuLabel>Filter projects</DropdownMenuLabel><DropdownMenuSeparator />
    {groups.map(group => <DropdownMenuSub key={group.key}><DropdownMenuSubTrigger><span>{group.label}</span><span className="filter-current">{group.options.find(([value]) => value === filters[group.key])?.[1]}</span></DropdownMenuSubTrigger><DropdownMenuSubContent className="filter-submenu"><DropdownMenuRadioGroup value={filters[group.key]} onValueChange={value => onChange(group.key, value)}>{group.options.map(([value, label]) => <DropdownMenuRadioItem key={value} value={value}>{label}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuSubContent></DropdownMenuSub>)}
    <DropdownMenuSeparator /><DropdownMenuItem onSelect={onReset} disabled={count === 0}>Reset filters</DropdownMenuItem>
  </DropdownMenuContent></DropdownMenu>
}
