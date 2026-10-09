import { useEffect, useMemo, useRef, useState } from 'react'
import type { Map as MapboxMap, GeoJSONSource } from 'mapbox-gl'
import type { FeatureCollection, Point } from 'geojson'
import { Plus, Minus, Maximize, Crosshair, Map, LoaderCircle, ChevronLeft, AlertCircle } from 'lucide-react'
import { RoadDetail } from './road-detail'
import { type Road } from '@/lib/roads'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import 'mapbox-gl/dist/mapbox-gl.css'

const centreOf = (r: Road) => r.coords[Math.floor(r.coords.length / 2)]
const routeColor = (r: Road) => r.programme === 'National significance' ? '#8ca7f5' : '#53c0a2'
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function Control({ label, children, onClick, disabled }: { label: string; children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={onClick} disabled={disabled} aria-label={label}>{children}</Button></TooltipTrigger><TooltipContent side="left">{label}</TooltipContent></Tooltip>
}

export function RoadMap({ roads, selected, onSelect, detailOpen, onBack }: { roads: Road[]; selected: Road | null; onSelect: (id: number) => void; detailOpen: boolean; onBack: () => void }) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<MapboxMap | null>(null)
  const latest = useRef({ roads, selected, onSelect, detailOpen })
  latest.current = { roads, selected, onSelect, detailOpen }
  const [mapToken, setMapToken] = useState<string | null>(null)
  const [liveState, setLiveState] = useState<'waiting' | 'loading' | 'ready' | 'error'>('loading')
  const previousSelection = useRef(selected?.id)
  const previousDetailOpen = useRef(detailOpen)
  const geojson = useMemo<FeatureCollection<Point, { id: number; color: string; name: string }>>(() => ({ type: 'FeatureCollection', features: roads.map(r => ({ type: 'Feature', properties: { id: r.id, color: routeColor(r), name: r.name }, geometry: { type: 'Point', coordinates: centreOf(r) } })) }), [roads])

  function fitCountry(instance: MapboxMap, duration = 0) {
    const compact = window.innerWidth <= 760
    instance.fitBounds([[166.3, -47.4], [178.5, -34.1]], { padding: compact ? { top: 65, bottom: 90, left: 28, right: 28 } : { top: 45, bottom: 65, left: Math.min(390, window.innerWidth * .28), right: 65 }, duration: prefersReducedMotion() ? 0 : duration })
  }

  useEffect(() => {
    const controller = new AbortController()
    void fetch('/api/config', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Map configuration unavailable')
      const config: { mapboxToken?: unknown } = await response.json()
      const token = typeof config.mapboxToken === 'string' ? config.mapboxToken.trim() : ''
      setMapToken(token)
      setLiveState(token ? 'loading' : 'waiting')
    }).catch(() => { if (!controller.signal.aborted) setLiveState('error') })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!mapToken || !container.current) return
    let cancelled = false
    let instance: MapboxMap | null = null
    let observer: ResizeObserver | null = null
    const loadMap = async () => {
      try {
        const { default: mapboxgl } = await import('mapbox-gl')
        if (cancelled || !container.current) return
        instance = new mapboxgl.Map({ container: container.current, accessToken: mapToken, style: 'mapbox://styles/mapbox/dark-v11', center: [173, -41], zoom: 4.4, minZoom: 3, maxZoom: 16, attributionControl: true })
        map.current = instance
        observer = new ResizeObserver(() => instance?.resize())
        observer.observe(container.current)
        instance.on('error', event => {
          const status = (event.error as Error & { status?: number }).status
          if (!cancelled && (status === 401 || status === 403 || !instance?.isStyleLoaded())) setLiveState('error')
        })
        instance.on('load', () => {
          if (cancelled || !instance) return
          instance.addSource('projects', { type: 'geojson', data: { type: 'FeatureCollection', features: latest.current.roads.map(r => ({ type: 'Feature', properties: { id: r.id, color: routeColor(r), name: r.name }, geometry: { type: 'Point', coordinates: centreOf(r) } })) } })
          instance.addSource('selected-route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
          instance.addLayer({ id: 'selected-route', type: 'line', source: 'selected-route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#b6ceff', 'line-width': 5 } })
          instance.addLayer({ id: 'project-glow', type: 'circle', source: 'projects', paint: { 'circle-color': ['get', 'color'], 'circle-radius': 13, 'circle-opacity': 0.12 } })
          instance.addLayer({ id: 'project-points', type: 'circle', source: 'projects', paint: { 'circle-color': ['get', 'color'], 'circle-radius': 6, 'circle-stroke-color': '#1b2330', 'circle-stroke-width': 2 } })
          instance.addLayer({ id: 'selected-point', type: 'circle', source: 'projects', filter: ['==', ['get', 'id'], latest.current.selected?.id ?? -1], paint: { 'circle-color': '#e3edff', 'circle-radius': 9, 'circle-stroke-color': '#719bff', 'circle-stroke-width': 3 } })
          instance.addLayer({ id: 'project-hit', type: 'circle', source: 'projects', paint: { 'circle-radius': 18, 'circle-opacity': 0 } })
          instance.on('click', 'project-hit', event => { const id = Number(event.features?.[0]?.properties?.id); if (id) latest.current.onSelect(id) })
          instance.on('mouseenter', 'project-hit', () => { if (instance) instance.getCanvas().style.cursor = 'pointer' })
          instance.on('mouseleave', 'project-hit', () => { if (instance) instance.getCanvas().style.cursor = '' })
          fitCountry(instance)
          setLiveState('ready')
        })
      } catch { if (!cancelled) setLiveState('error') }
    }
    void loadMap()
    return () => { cancelled = true; observer?.disconnect(); instance?.remove(); map.current = null }
  }, [mapToken])

  useEffect(() => {
    if (liveState !== 'ready' || !map.current) return
    const m = map.current
    ;(m.getSource('projects') as GeoJSONSource)?.setData(geojson)
    m.setFilter('selected-point', ['==', ['get', 'id'], selected?.id ?? -1])
    ;(m.getSource('selected-route') as GeoJSONSource)?.setData({ type: 'FeatureCollection', features: selected && selected.coords.length > 1 ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: selected.coords } }] : [] })
    if (selected && (selected.id !== previousSelection.current || (detailOpen && !previousDetailOpen.current))) focusProject()
    previousSelection.current = selected?.id
    previousDetailOpen.current = detailOpen
  }, [liveState, geojson, selected, detailOpen])

  function focusProject() {
    if (!selected || !map.current || liveState !== 'ready') return
    const compact = window.innerWidth <= 760
    const bounds = selected.coords.reduce<[number, number, number, number]>((b, [lng, lat]) => [Math.min(b[0], lng), Math.min(b[1], lat), Math.max(b[2], lng), Math.max(b[3], lat)], [180, 90, -180, -90])
    map.current.fitBounds(bounds, { maxZoom: 11, padding: compact ? { top: 65, bottom: 90, left: 50, right: 50 } : { top: 80, bottom: 90, left: Math.min(410, window.innerWidth * .3), right: 80 }, duration: prefersReducedMotion() ? 0 : 700 })
  }
  const ready = liveState === 'ready'
  return <section className="map-panel" aria-label="Fullscreen Mapbox project map">
    <div ref={container} className="live-map" />
    {!ready && <div className="map-waiting" role="status">
      <span className="waiting-icon">{liveState === 'loading' ? <LoaderCircle size={29} className="animate-spin" /> : liveState === 'error' ? <AlertCircle size={29} /> : <Map size={29} strokeWidth={1.4} />}</span>
      <h2>{liveState === 'loading' ? 'Loading Mapbox' : liveState === 'error' ? 'Mapbox couldn’t load' : 'Your Mapbox map goes here'}</h2>
      <p>{liveState === 'error' ? 'Check the access token and connection, then reload.' : liveState === 'loading' ? 'Getting the map ready.' : 'Ready to connect when you supply the access token.'}</p>
    </div>}
    <div className="map-controls"><Control label="Zoom in" onClick={() => map.current?.zoomIn()} disabled={!ready}><Plus size={18} /></Control><Control label="Zoom out" onClick={() => map.current?.zoomOut()} disabled={!ready}><Minus size={18} /></Control><span /><Control label="Show all of New Zealand" onClick={() => { if (map.current) fitCountry(map.current, 600) }} disabled={!ready}><Maximize size={17} /></Control><Control label="Focus selected project" onClick={focusProject} disabled={!ready || !selected}><Crosshair size={18} /></Control></div>
    {selected && <div className="detail-shell" data-state={detailOpen ? 'open' : 'closed'} aria-hidden={!detailOpen} inert={!detailOpen} onTransitionEnd={event => {
      if (event.target === event.currentTarget && event.propertyName === 'transform' && detailOpen) {
        event.currentTarget.querySelector<HTMLButtonElement>('.detail-back')?.focus({ preventScroll: true })
      }
    }}>
      <div className="detail-navigation"><Button variant="ghost" className="detail-back" aria-label="Back to projects" onClick={onBack}><ChevronLeft size={16} />Back to projects</Button></div>
      <div id="selected-road-details" className="detail-content"><RoadDetail road={selected} /></div>
    </div>}
    <div className="map-legend"><span><i className="national-dot" />National significance</span><span><i className="regional-dot" />Regional significance</span></div>
    <div className="map-footnote">Approximate routes · Indicative NZD</div>
  </section>
}
