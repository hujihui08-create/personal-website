import type { BookingResultData } from '@/types'

interface BookingResultCardProps {
  data: BookingResultData
}

const statusLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  cancelled: '已取消',
  completed: '已完成',
  rejected: '已拒绝',
}

const statusColors: Record<string, string> = {
  pending: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
  confirmed: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  cancelled: 'bg-[var(--color-bg-secondary)] text-[var(--color-secondary)]',
  completed: 'bg-[var(--color-info-soft)] text-[var(--color-info)]',
  rejected: 'bg-[var(--color-error-soft)] text-[var(--color-error)]',
}

const actionTitles: Record<string, string> = {
  created: '预约成功',
  lookup: '预约详情',
  cancelled: '预约已取消',
}

export const BookingResultCard = ({ data }: BookingResultCardProps) => {
  const statusClass = statusColors[data.status] || statusColors.pending
  const title = actionTitles[data.action] || '预约信息'

  return (
    <div className="mt-3 bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-lg)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--color-primary)]">{title}</span>
        {data.status && (
          <span
            className={`px-2.5 py-0.5 rounded-[var(--radius-full)] text-xs font-medium ${statusClass}`}
          >
            {statusLabels[data.status] || data.status}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-[var(--color-secondary)]">预约编号：</span>
          <span className="text-[var(--color-primary)] font-mono">{data.id}</span>
        </div>
        {data.booking_date && (
          <div>
            <span className="text-[var(--color-secondary)]">日期：</span>
            <span className="text-[var(--color-primary)]">{data.booking_date}</span>
          </div>
        )}
        {data.booking_time && (
          <div>
            <span className="text-[var(--color-secondary)]">时段：</span>
            <span className="text-[var(--color-primary)]">{data.booking_time}</span>
          </div>
        )}
        {data.company_name && (
          <div className="col-span-2">
            <span className="text-[var(--color-secondary)]">公司：</span>
            <span className="text-[var(--color-primary)]">{data.company_name}</span>
          </div>
        )}
        {data.company_location && (
          <div>
            <span className="text-[var(--color-secondary)]">地点：</span>
            <span className="text-[var(--color-primary)]">{data.company_location}</span>
          </div>
        )}
        {data.contact_name && (
          <div>
            <span className="text-[var(--color-secondary)]">联系人：</span>
            <span className="text-[var(--color-primary)]">{data.contact_name}</span>
          </div>
        )}
        {data.contact_phone && (
          <div>
            <span className="text-[var(--color-secondary)]">手机号：</span>
            <span className="text-[var(--color-primary)]">{data.contact_phone}</span>
          </div>
        )}
        {data.contact_email && (
          <div className="col-span-2">
            <span className="text-[var(--color-secondary)]">邮箱：</span>
            <span className="text-[var(--color-primary)]">{data.contact_email}</span>
          </div>
        )}
        {data.notes && (
          <div className="col-span-2">
            <span className="text-[var(--color-secondary)]">备注：</span>
            <span className="text-[var(--color-primary)]">{data.notes}</span>
          </div>
        )}
        {data.reject_reason && (
          <div className="col-span-2">
            <span className="text-[var(--color-secondary)]">拒绝原因：</span>
            <span className="text-[var(--color-error)]">{data.reject_reason}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingResultCard
