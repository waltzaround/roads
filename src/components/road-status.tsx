import { cn } from '@/lib/utils'
import { statusColors, statusLabels, type Status } from '@/lib/roads'

export function RoadStatus({ status, className }: { status: Status; className?: string }) {
  return <span className={cn('road-status', `status-${status}`, className)}><span aria-hidden="true" style={{ background: statusColors[status] }} />{statusLabels[status]}</span>
}
