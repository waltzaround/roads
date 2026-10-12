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

function About() {
  return <Dialog><DialogTrigger asChild><Button variant="outline" className="methodology-button"><BookOpen size={16} /><span>About</span></Button></DialogTrigger><DialogContent className="methodology-dialog"><DialogHeader><DialogTitle>About</DialogTitle><DialogDescription>Scope, sources and how to compare the figures.</DialogDescription></DialogHeader><div className="methodology-copy">
    <p>This site covers only New Zealand’s <a href="https://www.nzta.govt.nz/projects-and-consultations/major-projects/roads-of-national-significance" target="_blank" rel="noopener noreferrer">Roads of National Significance (RoNS)</a> and <a href="https://www.nzta.govt.nz/projects-and-consultations/major-projects/roads-of-regional-significance" target="_blank" rel="noopener noreferrer">Roads of Regional Significance (RoRS)</a> programmes, bringing together their project locations, delivery status and available cost figures.</p>
    <p>The entries bring together current projects and earlier corridor proposals associated with these programmes. Project notes explain where proposals have changed, been split into stages or overlap another entry.</p>
    <h3>Public sources</h3>
    <p>References were reviewed in October 2026 using NZTA project pages, business cases, maps and delivery updates. Selected statuses and dates have been updated. Historical policy estimates are labelled and linked to National’s archived 2023 transport policy; they are not current approved budgets.</p>
    <h3>Compare with context</h3>
    <p>All figures are in New Zealand dollars. Costs may cover planning estimates, approved funding, construction allocations or packages of projects. Scope, price basis and timing differ, so cost per kilometre is a guide to comparison.</p>
    <p>Where a cost covers only one section or a different route, the project notes explain it. Corridors without a matching published total remain uncosted. Cost per kilometre is shown only where the cost and length cover the same scope.</p>
    <h3>Programme totals</h3>
    <p>Headline totals cover the entries shown here, with three overlapping entries excluded. Projects without costs are left out of the cost total. Costed length and blended cost per kilometre use only projects with both a cost and a comparable length. The totals represent available figures across the two programmes, not their full budgets.</p>
    <h3>Map locations</h3>
    <p>Project locations and corridor lines are approximate. Use the linked project maps for route details.</p>
    <p>Read current project information from <a href="https://www.nzta.govt.nz/projects/" target="_blank" rel="noopener noreferrer">NZTA</a> or view <a href="/sources/national-transport-for-the-future-2023.pdf#page=32" target="_blank" rel="noopener noreferrer">National’s 2023 transport policy (archived PDF)</a>.</p>
  </div></DialogContent></Dialog>
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
    { label: 'RoNS + RoRS projects', value: String(stats.count), suffix: '', note: `${roads.length} entries across the two programmes; overlapping projects excluded` },
    { label: 'Published cost', value: money(stats.cost), suffix: '', note: `${stats.costed} projects with a published cost figure` },
    { label: 'Costed length', value: stats.km.toFixed(1), suffix: 'km', note: 'Projects with both a comparable length and cost' },
    { label: 'Blended cost', value: costRate(stats.rate), suffix: '/km', note: 'Weighted by comparable road length' },
  ]
  return <TooltipProvider><div className={cn('app-shell', sidebarOpen && 'sidebar-open', detailOpen && 'detail-open')}>
    <main className="explorer" aria-label="Roads of National and Regional Significance explorer">
      <h1 className="sr-only">New Zealand Roads of National Significance and Roads of Regional Significance</h1>
      <RoadMap roads={list} selected={selected} onSelect={pickProject} detailOpen={detailOpen} onBack={backToProjects} />
      <Button variant="outline" className="sidebar-toggle" aria-label={sidebarOpen ? 'Hide project sidebar' : 'Show project sidebar'} aria-expanded={sidebarOpen} aria-controls="project-sidebar" onClick={() => { setDetailOpen(false); setSidebarOpen(open => !open) }}>{sidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}roads.walt.online<span>{list.length}</span></Button>
      <aside className="project-panel" id="project-sidebar" aria-label="Explore projects" data-state={sidebarOpen ? 'open' : 'closed'} aria-hidden={!sidebarOpen} inert={!sidebarOpen} onTransitionEnd={event => {
        if (event.target === event.currentTarget && event.propertyName === 'transform' && sidebarOpen && lastOpenedProject.current != null) {
          event.currentTarget.querySelector<HTMLButtonElement>(`.project-row[data-road-id="${lastOpenedProject.current}"]`)?.focus({ preventScroll: true })
        }
      }}>
        <header className="site-header">
          <a href="#" className="brand" aria-label="roads.walt.online home" onClick={() => { setFilters(defaultFilters); setSelectedId(5) }}>roads.walt.online</a>
          <Button variant="ghost" className="sidebar-close" aria-label="Close project sidebar" onClick={() => setSidebarOpen(false)}><span>Close</span><PanelLeftClose size={16} /></Button>
        </header>
        <p className="programme-intro">Roads of National Significance (RoNS) and Roads of Regional Significance (RoRS). Explore projects, costs and delivery status.</p>
        <section className="metrics" aria-label="Programme overview">{metrics.map(({ label, value, suffix, note }) => <Tooltip key={label}><TooltipTrigger asChild><div className="metric" tabIndex={0} aria-label={`${label}: ${value}${suffix}. ${note}`}><span className="metric-label">{label}</span><strong className="metric-value">{value}<small>{suffix}</small></strong></div></TooltipTrigger><TooltipContent>{note}</TooltipContent></Tooltip>)}</section>
        <About />
        <div className="panel-heading"><h2>Explore projects <span>{list.length}</span></h2></div>
        <div className="project-search"><Search size={16} /><Input value={filters.query} onChange={event => setFilter('query', event.target.value)} placeholder="Search RoNS and RoRS projects…" aria-label="Search projects" />{filters.query && <button aria-label="Clear search" onClick={() => setFilter('query', '')}><X size={15} /></button>}</div>
        <div className="list-toolbar"><ProjectFilters filters={filters} onChange={setFilter} onReset={resetFilters} /><Select value={filters.sort} onValueChange={value => setFilter('sort', value)}><SelectTrigger aria-label="Sort projects" className="sort-select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rate">Cost per km</SelectItem><SelectItem value="cost">Total cost</SelectItem><SelectItem value="km">Project length</SelectItem><SelectItem value="name">Project name</SelectItem></SelectContent></Select></div>
        {narrowed && <div className="active-filter-summary"><span>{[filters.programme !== 'all' && (filters.programme === 'National significance' ? 'RoNS' : 'RoRS'), filters.island !== 'all' && `${filters.island} Island`, filters.status !== 'all' && filters.status.replaceAll('_', ' '), filters.query && `“${filters.query}”`].filter(Boolean).join(' · ')}</span><button aria-label="Clear all filters" onClick={() => setFilters(defaultFilters)}><X size={12} />Clear</button></div>}
        <div className="project-list">{list.map(road => <button key={road.id} data-road-id={road.id} className={cn('project-row', selected?.id === road.id && 'is-selected')} onClick={() => pickProject(road.id)} aria-pressed={selected?.id === road.id}><div className="project-row-top"><span className="project-number">{String(road.id).padStart(2, '0')}</span><h3>{road.name.replace(' [indicative]', '')}</h3><span className="selection-dot" /></div><div className="project-meta">{road.island} Island<span>·</span>{road.km == null ? 'Package / intersection' : `${road.km} km`}{road.excludeFromTotals && <span className="overlap-tag">Overlap</span>}</div><div className="project-row-bottom"><RoadStatus status={road.status} /><div className="row-rate">{filters.sort === 'cost' ? money(road.cost) : filters.sort === 'km' ? <>{road.km == null ? 'Not available' : road.km}{road.km != null && <small> km</small>}</> : <>{costRate(road.rate)}{road.rate != null && <small>/km</small>}</>}</div></div></button>)}{!list.length && <div className="empty-state"><Search size={29} /><h3>No matching projects</h3><p>Try a different name or clear your filters.</p><Button variant="outline" onClick={() => setFilters(defaultFilters)}>Clear filters</Button></div>}</div>
        <div className="list-footer"><span>{list.length} of {roads.length} entries</span><Tooltip><TooltipTrigger asChild><span className="info-help" tabIndex={0} aria-label="About project entries"><Info size={12} />Indicative NZD</span></TooltipTrigger><TooltipContent>Entries include overlaps; headline totals exclude them.</TooltipContent></Tooltip></div>
      </aside>
    </main>
  </div></TooltipProvider>
}
