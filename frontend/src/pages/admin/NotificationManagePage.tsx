import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/useToast'
import { AdminLayout } from '@/components/AdminLayout'
import { notificationsApi } from '@/api/notifications'
import type { Notification } from '@/types'
import { Bell, Check, CheckCheck } from 'lucide-react'

const typeLabels: Record<string, string> = {
  new_booking: '新预约',
  confirmed: '预约确认',
  rejected: '预约拒绝',
  reminder: '预约提醒',
}

const typeColors: Record<string, string> = {
  new_booking: 'bg-[var(--color-info)]/10 text-[var(--color-info)]',
  confirmed: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  rejected: 'bg-[var(--color-error)]/10 text-[var(--color-error)]',
  reminder: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
}

export const NotificationManagePage = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [unreadCount, setUnreadCount] = useState(0)

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationsApi.getNotifications(page, pageSize)
      setNotifications(response.data.items)
      setTotal(response.data.total)
    } catch (err) {
      console.error('Failed to load notifications:', err)
      toast({ title: '获取通知列表失败', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const response = await notificationsApi.getUnreadCount()
      setUnreadCount(response.data.count)
    } catch (err) {
      console.error('Failed to load unread count:', err)
    }
  }

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
  }, [page])

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id)
      toast({ title: '标记已读成功', variant: 'success' })
      loadNotifications()
      loadUnreadCount()
    } catch (err) {
      console.error('Failed to mark as read:', err)
      toast({ title: '标记已读失败', variant: 'error' })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      toast({ title: '全部标记已读成功', variant: 'success' })
      loadNotifications()
      loadUnreadCount()
    } catch (err) {
      console.error('Failed to mark all as read:', err)
      toast({ title: '全部标记已读失败', variant: 'error' })
    }
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-border-light)] pb-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-primary)]">通知中心</h1>
            <p className="text-sm text-[var(--color-secondary)]">
              查看所有系统通知
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-error)]/10 text-[var(--color-error)]">
                  {unreadCount} 条未读
                </span>
              )}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-bg)] rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
            >
              <CheckCheck className="w-4 h-4" />
              全部标记已读
            </button>
          )}
        </div>

        <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto text-[var(--color-secondary)] mb-4" />
              <p className="text-[var(--color-secondary)]">暂无通知</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-[var(--color-border-light)]">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors ${!notification.is_read ? 'bg-[var(--color-info)]/5' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[notification.type] || 'bg-gray-100 text-gray-800'}`}
                          >
                            {typeLabels[notification.type] || notification.type}
                          </span>
                          {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[var(--color-info)]"></span>
                          )}
                        </div>
                        <h3 className="text-sm font-medium text-[var(--color-primary)] mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-[var(--color-secondary)]">
                          {notification.content}
                        </p>
                        <p className="text-xs text-[var(--color-secondary)] mt-2">
                          {formatDateTime(notification.created_at)}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 rounded-[var(--radius-sm)] transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          标记已读
                        </button>
                      )}
                    </div>
                  </div>
                ))}
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
    </AdminLayout>
  )
}

export default NotificationManagePage
