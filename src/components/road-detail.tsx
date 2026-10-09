import { ExternalLink, MapPin, Route, CalendarDays, Info } from 'lucide-react'
import { RoadStatus } from './road-status'
import { costRate, formatDate, money, type Road } from '@/lib/roads'

export function RoadDetail({ road }: { road: Road }) {
  return <article className="road-detail" aria-label="Selected project details" aria-live="polite">
    <div className="detail-kicker"><MapPin size={13} />{road.island} Island<span className="detail-id">#{String(road.id).padStart(2, '0')}</span></div>
    <h2>{road.name.replace(' [indicative]', '')}</h2>
    <div className="detail-programme">{road.programme === 'National significance' ? 'Road of National Significance' : 'Road of Regional Significance'}</div>
    <RoadStatus status={road.status} />
    <div className="detail-numbers">
      <div><span>Indicative cost</span><strong className={road.cost == null ? 'unavailable-value' : ''}>{money(road.cost)}</strong></div>
      <div><span>Cost per kilometre</span><strong className={road.rate == null ? 'unavailable-value' : 'text-primary'}>{costRate(road.rate)}{road.rate != null && <small>/km</small>}</strong></div>
    </div>
    {(road.costLabel || road.rateLabel) && <p className="scope-note">{road.costLabel}{road.rateLabel && ` · ${road.rateLabel}`}</p>}
    <div className="detail-fact"><Route size={15} /><span>Project length</span><b>{road.lengthLabel || (road.km == null ? 'Not applicable' : `${road.km} km`)}</b></div>
    <div className="detail-fact"><CalendarDays size={15} /><span>{road.finishType === 'actual' ? 'Completed' : 'Expected finish'}</span><b>{formatDate(road.finish)}</b></div>
    {road.started && <div className="detail-fact"><CalendarDays size={15} /><span>Works started</span><b>{formatDate(road.started)}</b></div>}
    <p className="detail-description">{road.statusNote}</p>
    {road.aliasOf && <p className="overlap-note"><Info size={14} />Overlaps {road.aliasOf}. Excluded from headline totals.</p>}
    {road.corridorSegments && <p className="scope-note">Corridor sections: {road.corridorSegments.join(' · ')}</p>}
    <div className="detail-sources"><span>PUBLIC SOURCES</span>{road.sources.map(([label, url]) => <a key={url} href={url} target="_blank" rel="noopener noreferrer">{label.replace('NZTA — ', '').replace('Beehive — ', '')}<ExternalLink size={13} /></a>)}</div>
  </article>
}
