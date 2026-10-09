import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Search, PanelLeftClose, PanelLeftOpen, X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ProjectFilters } from '@/components/project-filters'
import { RoadStatus } from '@/components/road-status'
import { RoadMap } from '@/components/road-map'
import { costRate, defaultFilters, filterRoads, money, roads, summarise, type Filters } from '@/lib/roads'
import { cn } from '@/lib/utils'

function Methodology() {
  return <Dialog><DialogTrigger asChild><Button variant="ghost" className="methodology-button"><BookOpen size={16} /><span>Methodology</span></Button></DialogTrigger><DialogContent className="methodology-dialog"><DialogHeader><DialogTitle>Behind the numbers</DialogTitle><DialogDescription>How to read this road explorer.</DialogDescription></DialogHeader><div className="methodology-copy"><h3>A supplied data snapshot</h3><p>Projects, estimates, statuses, and dates are preserved from the supplied page. They have not been independently refreshed. The records combine National’s 2023 transport policy with public project material.</p><h3>Compare with context</h3><p>Figures are in New Zealand dollars. Costs may describe planning estimates, approved funding, construction allocations, or multi-project packages. Scope, price basis, and delivery timing differ. A cost per kilometre is a comparison aid, not a construction quote.</p><h3>Totals without duplicate entries</h3><p>The three explicitly overlapping entries are excluded from headline totals. Unpublished costs are left out, and intersections and packages without comparable lengths are excluded from the costed length and blended rate. This is a sum of available figures, not a complete programme budget.</p><h3>Approximate locations</h3><p>The Mapbox map uses approximate coordinates supplied with the original page. Connecting lines indicate corridors rather than surveyed alignments.</p><p>Check current details with <a href="https://www.nzta.govt.nz/projects/" target="_blank" rel="noopener noreferrer">NZTA</a> and <a href="https://www.national.org.nz/transport" target="_blank" rel="noopener noreferrer">National’s transport policy</a>.</p></div></DialogContent></Dialog>
}

export default function App() {
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [selectedId, setSelectedId] = useState(5)
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 760)
  const [detailOpen, setDetailOpen] = useState(false)
  const lastOpenedProject = useRef<number | null>(null)
  useEffect(() => {
    const selector = detailOpen ? '.detail-back' : sidebarOpen && lastOpenedProject.current != null ? `.project-row[data-road-id="${lastOpenedProject.current}"]` : null
    if (!selector) return
    const frame = requestAnimationFrame(() => {
      const target = document.querySelector<HTMLButtonElement>(selector)
      if (target) { getComputedStyle(target).visibility; target.focus({ preventScroll: true }) }
    })
    return () => cancelAnimationFrame(frame)
  }, [detailOpen, sidebarOpen])
  const list = useMemo(() => filterRoads(roads, filters), [filters])
  const selected = list.find(r => r.id === selectedId) ?? list[0] ?? null
  const stats = useMemo(() => summarise(roads), [])
  const setFilter = (key: keyof Filters, value: string) => setFilters(previous => ({ ...previous, [key]: value }))
  const narrowed = filters.query || filters.programme !== 'all' || filters.island !== 'all' || filters.status !== 'all'
  const resetFilters = () => setFilters(previous => ({ ...defaultFilters, query: previous.query, sort: previous.sort }))
  const pickProject = (id: number) => {
    lastOpenedProject.current = id
    setSelectedId(id)
    setSidebarOpen(false)
    setDetailOpen(true)
  }
  const backToProjects = () => {
    setDetailOpen(false)
    setSidebarOpen(true)
  }
  const metrics = [
    { label: 'Road projects', value: String(stats.count), suffix: '', note: `${roads.length} entries; overlapping projects excluded` },
    { label: 'Published cost', value: money(stats.cost), suffix: '', note: `${stats.costed} projects with a published cost figure` },
    { label: 'Costed length', value: stats.km.toFixed(1), suffix: 'km', note: 'Projects with both a comparable length and cost' },
    { label: 'Blended cost', value: costRate(stats.rate), suffix: '/km', note: 'Weighted by comparable road length' },
  ]
  return <TooltipProvider><div className={cn('app-shell', sidebarOpen && 'sidebar-open', detailOpen && 'detail-open')}>
    <main className="explorer" aria-label="Road project explorer">
      <h1 className="sr-only">New Zealand road project explorer</h1>
      <RoadMap roads={list} selected={selected} onSelect={pickProject} detailOpen={detailOpen} onBack={backToProjects} />
      <Button variant="outline" className="sidebar-toggle" aria-label={sidebarOpen ? 'Hide project sidebar' : 'Show project sidebar'} aria-expanded={sidebarOpen} aria-controls="project-sidebar" onClick={() => { setDetailOpen(false); setSidebarOpen(open => !open) }}>{sidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}roads.walt.online<span>{list.length}</span></Button>
      <aside className="project-panel" id="project-sidebar" aria-label="Explore projects" data-state={sidebarOpen ? 'open' : 'closed'} aria-hidden={!sidebarOpen} inert={!sidebarOpen} onTransitionEnd={event => {
        if (event.target === event.currentTarget && event.propertyName === 'transform' && sidebarOpen && lastOpenedProject.current != null) {
          event.currentTarget.querySelector<HTMLButtonElement>(`.project-row[data-road-id="${lastOpenedProject.current}"]`)?.focus({ preventScroll: true })
        }
      }}>
        <header className="site-header">
          <a href="#" className="brand" aria-label="roads.walt.online home" onClick={() => { setFilters(defaultFilters); setSelectedId(5) }}>roads.walt.online</a>
          <Methodology />
        </header>
        <section className="metrics" aria-label="Programme overview">{metrics.map(({ label, value, suffix, note }) => <Tooltip key={label}><TooltipTrigger asChild><div className="metric" tabIndex={0} aria-label={`${label}: ${value}${suffix}. ${note}`}><span className="metric-label">{label}</span><strong className="metric-value">{value}<small>{suffix}</small></strong></div></TooltipTrigger><TooltipContent>{note}</TooltipContent></Tooltip>)}</section>
        <div className="panel-heading"><h2>Explore projects <span>{list.length}</span></h2><Button variant="ghost" size="icon" aria-label="Close project sidebar" onClick={() => setSidebarOpen(false)}><PanelLeftClose size={16} /></Button></div>
        <div className="project-search"><Search size={16} /><Input value={filters.query} onChange={event => setFilter('query', event.target.value)} placeholder="Search roads or corridors…" aria-label="Search projects" />{filters.query && <button aria-label="Clear search" onClick={() => setFilter('query', '')}><X size={15} /></button>}</div>
        <div className="list-toolbar"><ProjectFilters filters={filters} onChange={setFilter} onReset={resetFilters} /><Select value={filters.sort} onValueChange={value => setFilter('sort', value)}><SelectTrigger aria-label="Sort projects" className="sort-select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rate">Cost per km</SelectItem><SelectItem value="cost">Total cost</SelectItem><SelectItem value="km">Project length</SelectItem><SelectItem value="name">Project name</SelectItem></SelectContent></Select></div>
        {narrowed && <div className="active-filter-summary"><span>{[filters.programme !== 'all' && (filters.programme === 'National significance' ? 'National' : 'Regional'), filters.island !== 'all' && `${filters.island} Island`, filters.status !== 'all' && filters.status.replaceAll('_', ' '), filters.query && `“${filters.query}”`].filter(Boolean).join(' · ')}</span><button aria-label="Clear all filters" onClick={() => setFilters(defaultFilters)}><X size={12} />Clear</button></div>}
        <div className="project-list">{list.map(road => <button key={road.id} data-road-id={road.id} className={cn('project-row', selected?.id === road.id && 'is-selected')} onClick={() => pickProject(road.id)} aria-pressed={selected?.id === road.id}><div className="project-row-top"><span className="project-number">{String(road.id).padStart(2, '0')}</span><h3>{road.name.replace(' [indicative]', '')}</h3><span className="selection-dot" /></div><div className="project-meta">{road.island} Island<span>·</span>{road.km == null ? 'Package / intersection' : `${road.km} km`}{road.excludeFromTotals && <span className="overlap-tag">Overlap</span>}</div><div className="project-row-bottom"><RoadStatus status={road.status} /><div className="row-rate">{costRate(road.rate)}{road.rate != null && <small>/km</small>}</div></div></button>)}{!list.length && <div className="empty-state"><Search size={29} /><h3>No matching projects</h3><p>Try a different name or clear your filters.</p><Button variant="outline" onClick={() => setFilters(defaultFilters)}>Clear filters</Button></div>}</div>
        <div className="list-footer"><span>{list.length} of {roads.length} entries</span><Tooltip><TooltipTrigger asChild><span className="info-help" tabIndex={0} aria-label="About project entries"><Info size={12} />Indicative NZD</span></TooltipTrigger><TooltipContent>Entries include overlaps; headline totals exclude them.</TooltipContent></Tooltip></div>
      </aside>
    </main>
  </div></TooltipProvider>
}
