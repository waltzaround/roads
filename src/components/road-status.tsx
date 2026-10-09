import { cn } from '@/lib/utils'
import { statusLabels, type Status } from '@/lib/roads'

export function RoadStatus({ status, className }: { status: Status; className?: string }) {
  return <span className={cn('road-status', `status-${status}`, className)}><span aria-hidden="true" />{statusLabels[status]}</span>
}
