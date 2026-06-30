import { XCircle, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface BookingItem {
  id: number
  status: string
  company_name: string
  company_location: string
  booking_date: string
  booking_time: string
  contact_name: string
  contact_phone: string
  contact_email?: string
}

interface BookingListCardProps {
  bookings: BookingItem[]
  onCancel: (id: number, phone: string) => void
  cancelledId?: number | null
}

const statusMap: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  confirmed: {
    label: '已确认',
    icon: CheckCircle,
    className: 'text-[var(--color-success)] bg-[var(--color-success)]/10',
  },
  cancelled: {
    label: '已取消',
    icon: XCircle,
    className: 'text-[var(--color-error)] bg-[var(--color-error)]/10',
  },
  pending: {
    label: '待确认',
    icon: Clock,
    className: 'text-[var(--color-warning)] bg-[var(--color-warning)]/10',
  },
}

export const BookingListCard = ({ bookings, onCancel, cancelledId }: BookingListCardProps) => {
  if (bookings.length === 0) {
    return (
      <div className="mt-3 bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-lg)] p-6 text-center">
        <AlertCircle className="w-10 h-10 text-[var(--color-secondary)] mx-auto mb-3" />
        <p className="text-sm text-[var(--color-secondary)]">暂无预约记录</p>
      </div>
    )
  }

  return (
    <div className="mt-3 bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-lg)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border-light)]">
        <h3 className="text-sm font-semibold text-[var(--color-primary)]">
          我的预约 ({bookings.length})
        </h3>
      </div>
      <div className="divide-y divide-[var(--color-border-light)]">
        {bookings.map((b) => {
          const status = statusMap[b.status] || statusMap.pending
          const StatusIcon = status.icon
          const isCancelled = b.status === 'cancelled' || cancelledId === b.id

          return (
            <div key={b.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[var(--color-primary)]">
                      {b.company_name}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-full)] text-xs ${status.className}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-secondary)]">
                    {b.booking_date} . {b.booking_time} . {b.company_location}
                  </p>
                  <p className="text-xs text-[var(--color-secondary)] mt-0.5">
                    编号: {b.id} . 联系人: {b.contact_name} . {b.contact_phone}
                  </p>
                </div>
                {!isCancelled && (
                  <button
                    onClick={() => onCancel(b.id, b.contact_phone)}
                    className="flex-shrink-0 px-3 py-1.5 text-xs border border-[var(--color-error)] text-[var(--color-error)] rounded-[var(--radius-md)] hover:bg-[var(--color-error)]/10 transition-colors duration-[var(--duration-fast)]"
                  >
                    取消
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BookingListCard
