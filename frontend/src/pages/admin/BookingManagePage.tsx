import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/useToast'
import { AdminLayout } from '@/components/AdminLayout'
import { Portal } from '@/components/Portal'
import { bookingApi } from '@/api'
import type { Booking } from '@/types'

const statusLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  rejected: '已拒绝',
  completed: '已完成',
  cancelled: '已取消',
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

export const BookingManagePage = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const loadBookings = async () => {
    try {
      setLoading(true)
      const response = await bookingApi.getBookings({
        page,
        page_size: pageSize,
        status: statusFilter,
        search: searchQuery,
      })
      setBookings(response.data.items)
      setTotal(response.data.total)
    } catch (err) {
      console.error('Failed to load bookings:', err)
      toast({ title: '获取预约列表失败', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [page, statusFilter, searchQuery])

  const handleStatusUpdate = async (
    bookingId: number,
    status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled'
  ) => {
    try {
      await bookingApi.updateBookingStatus(bookingId, {
        status,
        reject_reason: status === 'rejected' ? rejectReason : '',
      })
      toast({ title: '状态更新成功', variant: 'success' })
      setShowModal(false)
      setRejectReason('')
      loadBookings()
    } catch (err) {
      console.error('Failed to update status:', err)
      toast({ title: '状态更新失败', variant: 'error' })
    }
  }

  const openStatusModal = (booking: Booking) => {
    setSelectedBooking(booking)
    setRejectReason('')
    setShowModal(true)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN')
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-primary)]">预约管理</h1>
            <p className="text-sm text-[var(--color-secondary)] mt-1">管理所有面试预约</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索公司名称..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="w-full px-4 py-2 border border-[var(--color-border-light)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="h-10 px-4 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-colors appearance-none cursor-pointer"
          >
            <option value="">全部状态</option>
            <option value="pending">待确认</option>
            <option value="confirmed">已确认</option>
            <option value="rejected">已拒绝</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>

        <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-secondary)]">暂无预约记录</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--color-bg-secondary)]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-secondary)] uppercase tracking-wider">
                        公司信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-secondary)] uppercase tracking-wider">
                        预约时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-secondary)] uppercase tracking-wider">
                        联系方式
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-secondary)] uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-secondary)] uppercase tracking-wider">
                        提交时间
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[var(--color-secondary)] uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-light)]">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-[var(--color-bg-secondary)]/50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-[var(--color-primary)]">
                            {booking.company_name}
                          </div>
                          <div className="text-sm text-[var(--color-secondary)]">
                            {booking.company_location}
                          </div>
                          {booking.notes && (
                            <div className="text-xs text-[var(--color-secondary)] mt-1">
                              备注: {booking.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[var(--color-primary)]">
                            {formatDate(booking.booking_date)}
                          </div>
                          <div className="text-sm text-[var(--color-secondary)]">
                            {booking.booking_time}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[var(--color-primary)]">
                            {booking.contact_email}
                          </div>
                          {booking.contact_phone && (
                            <div className="text-sm text-[var(--color-secondary)]">
                              {booking.contact_phone}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[booking.status]}`}
                          >
                            {statusLabels[booking.status]}
                          </span>
                          {booking.reject_reason && (
                            <div className="text-xs text-[var(--color-secondary)] mt-1">
                              原因: {booking.reject_reason}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--color-secondary)]">
                          {formatDateTime(booking.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  确认
                                </button>
                                <button
                                  onClick={() => openStatusModal(booking)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  拒绝
                                </button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <button
                                onClick={() => handleStatusUpdate(booking.id, 'completed')}
                                className="text-green-600 hover:text-green-800"
                              >
                                完成
                              </button>
                            )}
                            {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                              <button
                                onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                className="text-gray-600 hover:text-gray-800"
                              >
                                取消
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-[var(--color-border-light)] flex items-center justify-between">
                  <div className="text-sm text-[var(--color-secondary)]">
                    共 {total} 条记录，第 {page} / {totalPages} 页
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 border border-[var(--color-border-light)] rounded-[var(--radius-sm)] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-bg-secondary)]"
                    >
                      上一页
                    </button>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 border border-[var(--color-border-light)] rounded-[var(--radius-sm)] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-bg-secondary)]"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showModal && selectedBooking && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-[var(--radius-xl)] p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4">拒绝预约</h3>
              <p className="text-sm text-[var(--color-secondary)] mb-4">请输入拒绝原因（可选）</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-[var(--color-border-light)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
                placeholder="请输入拒绝原因..."
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
                >
                  取消
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedBooking.id, 'rejected')}
                  className="px-4 py-2 bg-red-600 text-white rounded-[var(--radius-md)] hover:bg-red-700"
                >
                  确认拒绝
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </AdminLayout>
  )
}

export default BookingManagePage
